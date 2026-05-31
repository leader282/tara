-- Phase 9B: keep memory capsule creation/opening on RPC paths so
-- private note content stays out of metadata and timeline rows.

create table if not exists public.memory_capsule_contents (
  capsule_id uuid primary key references public.memory_capsules(id) on delete cascade,
  note text,
  media_asset_id uuid references public.media_assets(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint memory_capsule_contents_note_length_check
    check (note is null or char_length(note) <= 5000)
);

do $$
begin
  if to_regclass('public.memory_capsule_contents') is not null
    and not exists (
      select 1
      from pg_trigger
      where tgrelid = 'public.memory_capsule_contents'::regclass
        and tgname = 'set_memory_capsule_contents_updated_at'
    )
  then
    create trigger set_memory_capsule_contents_updated_at
    before update on public.memory_capsule_contents
    for each row
    execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.memory_capsule_contents enable row level security;

create or replace function public.create_memory_capsule(
  p_title text,
  p_note text,
  p_unlock_at timestamptz,
  p_emotional_context text default null
)
returns table (
  id uuid,
  couple_id uuid,
  creator_id uuid,
  title text,
  unlock_type text,
  unlock_at timestamptz,
  emotional_context text,
  opened_by uuid,
  opened_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_couple_id uuid;
  v_active_couple_count integer;
  v_active_member_count integer;
  v_title text := btrim(coalesce(p_title, ''));
  v_note text := btrim(coalesce(p_note, ''));
  v_emotional_context text := nullif(btrim(coalesce(p_emotional_context, '')), '');
  v_capsule public.memory_capsules%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  select count(*)::integer
  into v_active_couple_count
  from public.couple_members cm
  join public.couples c
    on c.id = cm.couple_id
  where cm.user_id = v_user_id
    and cm.status = 'active'
    and c.status = 'active';

  if v_active_couple_count = 0 then
    raise exception 'Active couple required'
      using errcode = '23514';
  end if;

  if v_active_couple_count > 1 then
    raise exception 'Expected exactly one active couple'
      using errcode = '23514';
  end if;

  select c.id
  into v_couple_id
  from public.couple_members cm
  join public.couples c
    on c.id = cm.couple_id
  where cm.user_id = v_user_id
    and cm.status = 'active'
    and c.status = 'active'
  limit 1
  for update of c;

  select count(*)::integer
  into v_active_member_count
  from public.couple_members cm
  where cm.couple_id = v_couple_id
    and cm.status = 'active';

  if v_active_member_count < 2 then
    raise exception 'Memory capsules require a paired couple'
      using errcode = '23514';
  end if;

  if v_active_member_count > 2 then
    raise exception 'Couple membership exceeded two active partners'
      using errcode = '23514';
  end if;

  if char_length(v_title) < 1 or char_length(v_title) > 120 then
    raise exception 'Memory capsule title must be between 1 and 120 characters'
      using errcode = '22001';
  end if;

  if char_length(v_note) < 1 or char_length(v_note) > 5000 then
    raise exception 'Memory capsule note must be between 1 and 5000 characters'
      using errcode = '22001';
  end if;

  if v_emotional_context is not null and char_length(v_emotional_context) > 240 then
    raise exception 'Memory capsule context must be 240 characters or fewer'
      using errcode = '22001';
  end if;

  if p_unlock_at is null then
    raise exception 'Memory capsule unlock date is required'
      using errcode = '23514';
  end if;

  if p_unlock_at <= now() then
    raise exception 'Memory capsule unlock date must be in the future'
      using errcode = '23514';
  end if;

  if p_unlock_at > now() + interval '10 years' then
    raise exception 'Memory capsule unlock date is too far in the future'
      using errcode = '23514';
  end if;

  insert into public.memory_capsules (
    couple_id,
    creator_id,
    title,
    unlock_type,
    unlock_at,
    emotional_context
  )
  values (
    v_couple_id,
    v_user_id,
    v_title,
    'date',
    p_unlock_at,
    v_emotional_context
  )
  returning *
  into v_capsule;

  insert into public.memory_capsule_contents (
    capsule_id,
    note,
    media_asset_id
  )
  values (
    v_capsule.id,
    v_note,
    null
  );

  insert into public.timeline_items (
    couple_id,
    actor_id,
    type,
    title,
    subtitle,
    payload
  )
  values (
    v_couple_id,
    v_user_id,
    'capsule_created',
    'Created a memory capsule',
    v_capsule.title,
    jsonb_build_object(
      'capsule_id', v_capsule.id,
      'unlock_at', v_capsule.unlock_at,
      'has_note', true,
      'has_media', false
    )
  );

  return query
  select
    v_capsule.id,
    v_capsule.couple_id,
    v_capsule.creator_id,
    v_capsule.title,
    v_capsule.unlock_type,
    v_capsule.unlock_at,
    v_capsule.emotional_context,
    v_capsule.opened_by,
    v_capsule.opened_at,
    v_capsule.created_at,
    v_capsule.updated_at;
end;
$$;

create or replace function public.open_memory_capsule(
  p_capsule_id uuid
)
returns table (
  id uuid,
  couple_id uuid,
  creator_id uuid,
  title text,
  unlock_type text,
  unlock_at timestamptz,
  emotional_context text,
  opened_by uuid,
  opened_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_capsule public.memory_capsules%rowtype;
  v_opened_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  select *
  into v_capsule
  from public.memory_capsules mc
  where mc.id = p_capsule_id
  for update;

  if not found then
    raise exception 'Memory capsule not found'
      using errcode = 'P0002';
  end if;

  if not private.is_active_couple_member(v_capsule.couple_id, v_user_id) then
    raise exception 'Memory capsule not found'
      using errcode = 'P0002';
  end if;

  if v_capsule.unlock_at > now() then
    raise exception 'Memory capsule is not unlocked yet'
      using errcode = '23514';
  end if;

  if v_capsule.opened_at is null then
    v_opened_at := now();

    update public.memory_capsules as mc
    set opened_by = v_user_id,
        opened_at = v_opened_at
    where mc.id = p_capsule_id
    returning mc.* into v_capsule;

    if not exists (
      select 1
      from public.timeline_items ti
      where ti.couple_id = v_capsule.couple_id
        and ti.type = 'capsule_opened'
        and ti.payload ->> 'capsule_id' = v_capsule.id::text
    ) then
      insert into public.timeline_items (
        couple_id,
        actor_id,
        type,
        title,
        subtitle,
        payload
      )
      values (
        v_capsule.couple_id,
        v_user_id,
        'capsule_opened',
        'Opened a memory capsule',
        v_capsule.title,
        jsonb_build_object(
          'capsule_id', v_capsule.id,
          'unlock_at', v_capsule.unlock_at,
          'opened_at', v_capsule.opened_at
        )
      );
    end if;
  end if;

  return query
  select
    v_capsule.id,
    v_capsule.couple_id,
    v_capsule.creator_id,
    v_capsule.title,
    v_capsule.unlock_type,
    v_capsule.unlock_at,
    v_capsule.emotional_context,
    v_capsule.opened_by,
    v_capsule.opened_at,
    v_capsule.created_at,
    v_capsule.updated_at;
end;
$$;

drop policy if exists memory_capsule_contents_select_creator_or_opened
on public.memory_capsule_contents;

create policy memory_capsule_contents_select_creator_or_unlocked
on public.memory_capsule_contents
for select
to authenticated
using (
  exists (
    select 1
    from public.memory_capsules mc
    where mc.id = memory_capsule_contents.capsule_id
      and (
        mc.creator_id = (select auth.uid())
        or (
          mc.unlock_at <= now()
          and private.is_active_couple_member(mc.couple_id)
        )
      )
  )
);

drop policy if exists memory_capsules_insert_creator_active_member
on public.memory_capsules;

drop policy if exists memory_capsule_contents_insert_capsule_creator
on public.memory_capsule_contents;

revoke insert on table public.memory_capsules from authenticated;
revoke insert on table public.memory_capsule_contents from authenticated;
grant select on table public.memory_capsules to authenticated;
grant select on table public.memory_capsule_contents to authenticated;

revoke all on function public.create_memory_capsule(text, text, timestamptz, text) from public;
revoke all on function public.create_memory_capsule(text, text, timestamptz, text) from anon;
grant execute on function public.create_memory_capsule(text, text, timestamptz, text) to authenticated;

revoke all on function public.open_memory_capsule(uuid) from public;
revoke all on function public.open_memory_capsule(uuid) from anon;
grant execute on function public.open_memory_capsule(uuid) to authenticated;

do $$
begin
  if exists (
    select 1
    from pg_catalog.pg_publication
    where pubname = 'supabase_realtime'
  )
  and not exists (
    select 1
    from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'memory_capsules'
  ) then
    alter publication supabase_realtime add table public.memory_capsules;
  end if;
end;
$$;
