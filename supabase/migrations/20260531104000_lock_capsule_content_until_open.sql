-- Keep partner capsule content reads aligned with the controlled open workflow.
-- Creators can still preview their own note before open; partners see content
-- only after open_memory_capsule records opened_at and creates the timeline item.

drop policy if exists memory_capsule_contents_select_creator_or_unlocked
on public.memory_capsule_contents;

drop policy if exists memory_capsule_contents_select_creator_or_opened
on public.memory_capsule_contents;

create policy memory_capsule_contents_select_creator_or_opened
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
          mc.opened_at is not null
          and private.is_active_couple_member(mc.couple_id)
        )
      )
  )
);

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
  v_active_member_count integer;
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

  select count(*)::integer
  into v_active_member_count
  from public.couple_members cm
  where cm.couple_id = v_capsule.couple_id
    and cm.status = 'active';

  if v_active_member_count < 2 then
    raise exception 'Memory capsules require a paired couple'
      using errcode = '23514';
  end if;

  if v_active_member_count > 2 then
    raise exception 'Couple membership exceeded two active partners'
      using errcode = '23514';
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
