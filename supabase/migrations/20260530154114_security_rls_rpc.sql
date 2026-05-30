create schema if not exists private;

revoke all on schema private from public;

create or replace function private.is_active_couple_member(
  target_couple_id uuid,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_user_id is not null
    and exists (
      select 1
      from public.couple_members cm
      join public.couples c
        on c.id = cm.couple_id
      where cm.couple_id = target_couple_id
        and cm.user_id = target_user_id
        and cm.status = 'active'
        and c.status = 'active'
    );
$$;

create or replace function private.is_same_active_couple_member(
  target_user_id uuid,
  viewer_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_user_id is not null
    and viewer_user_id is not null
    and exists (
      select 1
      from public.couple_members target_member
      join public.couple_members viewer_member
        on viewer_member.couple_id = target_member.couple_id
      join public.couples c
        on c.id = target_member.couple_id
      where target_member.user_id = target_user_id
        and target_member.status = 'active'
        and viewer_member.user_id = viewer_user_id
        and viewer_member.status = 'active'
        and c.status = 'active'
    );
$$;

create or replace function private.active_couple_member_count(
  target_couple_id uuid
)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.couple_members cm
  where cm.couple_id = target_couple_id
    and cm.status = 'active';
$$;

create or replace function private.ritual_is_revealed(
  target_couple_ritual_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_couple_id uuid;
  v_active_member_count integer;
  v_completion_count integer;
begin
  select cr.couple_id
  into v_couple_id
  from public.couple_rituals cr
  where cr.id = target_couple_ritual_id;

  if v_couple_id is null then
    return false;
  end if;

  select count(*)::integer
  into v_active_member_count
  from public.couple_members cm
  where cm.couple_id = v_couple_id
    and cm.status = 'active';

  if v_active_member_count < 2 then
    return false;
  end if;

  select count(distinct rc.user_id)::integer
  into v_completion_count
  from public.ritual_completions rc
  join public.couple_members cm
    on cm.couple_id = v_couple_id
   and cm.user_id = rc.user_id
   and cm.status = 'active'
  where rc.couple_ritual_id = target_couple_ritual_id;

  return v_completion_count >= v_active_member_count;
end;
$$;

create or replace function private.generate_invite_code()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_invite_code text;
  v_attempt integer := 0;
begin
  loop
    v_attempt := v_attempt + 1;
    v_invite_code := translate(
      rtrim(encode(extensions.gen_random_bytes(32), 'base64'), '='),
      '+/',
      '-_'
    );

    exit when not exists (
      select 1
      from public.couple_invites ci
      where ci.invite_code = v_invite_code
    );

    if v_attempt >= 10 then
      raise exception 'Unable to generate invite code'
        using errcode = '23505';
    end if;
  end loop;

  return v_invite_code;
end;
$$;

create or replace function public.create_couple_with_invite(
  p_anniversary_date date default null,
  p_next_meetup_at timestamptz default null,
  p_next_meetup_location text default null
)
returns table (
  couple_id uuid,
  invite_id uuid,
  invite_code text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_couple_id uuid;
  v_invite_id uuid;
  v_invite_code text;
  v_expires_at timestamptz := now() + interval '7 days';
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  if exists (
    select 1
    from public.couple_members cm
    join public.couples c
      on c.id = cm.couple_id
    where cm.user_id = v_user_id
      and cm.status = 'active'
      and c.status = 'active'
  ) then
    raise exception 'User already has an active couple'
      using errcode = '23514';
  end if;

  insert into public.couples (
    anniversary_date,
    next_meetup_at,
    next_meetup_location,
    created_by
  )
  values (
    p_anniversary_date,
    p_next_meetup_at,
    p_next_meetup_location,
    v_user_id
  )
  returning id into v_couple_id;

  insert into public.couple_settings (couple_id)
  values (v_couple_id);

  insert into public.couple_members (
    couple_id,
    user_id,
    role,
    status,
    joined_at
  )
  values (
    v_couple_id,
    v_user_id,
    'partner',
    'active',
    now()
  );

  v_invite_code := private.generate_invite_code();

  insert into public.couple_invites (
    couple_id,
    created_by,
    invite_code,
    status,
    expires_at
  )
  values (
    v_couple_id,
    v_user_id,
    v_invite_code,
    'active',
    v_expires_at
  )
  returning id into v_invite_id;

  return query
  select v_couple_id, v_invite_id, v_invite_code, v_expires_at;
exception
  when unique_violation then
    raise exception 'User already has an active couple'
      using errcode = '23505';
end;
$$;

create or replace function public.accept_couple_invite(
  p_invite_code text
)
returns table (
  couple_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_invite public.couple_invites%rowtype;
  v_couple public.couples%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  select *
  into v_invite
  from public.couple_invites ci
  where ci.invite_code = btrim(p_invite_code)
  for update;

  if not found then
    raise exception 'This invite is no longer available'
      using errcode = 'P0001';
  end if;

  select *
  into v_couple
  from public.couples c
  where c.id = v_invite.couple_id
  for update;

  if not found
    or v_couple.status <> 'active'
    or v_invite.status <> 'active'
    or v_invite.expires_at <= now()
  then
    raise exception 'This invite is no longer available'
      using errcode = 'P0001';
  end if;

  if v_invite.created_by = v_user_id then
    raise exception 'This invite is no longer available'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.couple_members cm
    join public.couples c
      on c.id = cm.couple_id
    where cm.user_id = v_user_id
      and cm.status = 'active'
      and c.status = 'active'
  ) then
    raise exception 'User already has an active couple'
      using errcode = '23514';
  end if;

  if private.active_couple_member_count(v_invite.couple_id) >= 2 then
    raise exception 'This invite is no longer available'
      using errcode = 'P0001';
  end if;

  insert into public.couple_members (
    couple_id,
    user_id,
    role,
    status,
    joined_at
  )
  values (
    v_invite.couple_id,
    v_user_id,
    'partner',
    'active',
    now()
  );

  update public.couple_invites
  set status = 'accepted',
      accepted_by = v_user_id,
      accepted_at = now()
  where id = v_invite.id;

  return query
  select v_invite.couple_id;
exception
  when unique_violation or check_violation then
    raise exception 'This invite is no longer available'
      using errcode = 'P0001';
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

  if v_capsule.opened_at is null then
    if v_capsule.unlock_at > now() then
      raise exception 'Memory capsule is not unlocked yet'
        using errcode = '23514';
    end if;

    update public.memory_capsules as mc
    set opened_by = v_user_id,
        opened_at = now()
    where mc.id = p_capsule_id
    returning mc.* into v_capsule;
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

create index if not exists media_assets_owner_id_idx
  on public.media_assets(owner_id);

create index if not exists ritual_completions_user_id_idx
  on public.ritual_completions(user_id);

create index if not exists memory_capsules_creator_id_idx
  on public.memory_capsules(creator_id);

create index if not exists memory_capsule_contents_media_asset_id_idx
  on public.memory_capsule_contents(media_asset_id)
  where media_asset_id is not null;

create index if not exists timeline_items_actor_id_idx
  on public.timeline_items(actor_id)
  where actor_id is not null;

alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.couple_invites enable row level security;
alter table public.user_settings enable row level security;
alter table public.couple_settings enable row level security;
alter table public.media_assets enable row level security;
alter table public.presence_events enable row level security;
alter table public.ritual_templates enable row level security;
alter table public.couple_rituals enable row level security;
alter table public.ritual_completions enable row level security;
alter table public.memory_capsules enable row level security;
alter table public.memory_capsule_contents enable row level security;
alter table public.timeline_items enable row level security;
alter table public.push_tokens enable row level security;
alter table public.notification_preferences enable row level security;

create policy profiles_select_own_or_active_partner
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or private.is_same_active_couple_member(id)
);

create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (id = (select auth.uid()));

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy couples_select_active_members
on public.couples
for select
to authenticated
using (private.is_active_couple_member(id));

create policy couples_update_safe_shared_fields_for_active_members
on public.couples
for update
to authenticated
using (private.is_active_couple_member(id))
with check (
  private.is_active_couple_member(id)
  and status = 'active'
);

create policy couple_members_select_same_active_couple
on public.couple_members
for select
to authenticated
using (private.is_active_couple_member(couple_id));

create policy couple_invites_select_active_members
on public.couple_invites
for select
to authenticated
using (private.is_active_couple_member(couple_id));

create policy user_settings_select_own
on public.user_settings
for select
to authenticated
using (user_id = (select auth.uid()));

create policy user_settings_insert_own
on public.user_settings
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy user_settings_update_own
on public.user_settings
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy couple_settings_select_active_members
on public.couple_settings
for select
to authenticated
using (private.is_active_couple_member(couple_id));

create policy couple_settings_update_safe_shared_fields_for_active_members
on public.couple_settings
for update
to authenticated
using (private.is_active_couple_member(couple_id))
with check (private.is_active_couple_member(couple_id));

create policy media_assets_select_active_members
on public.media_assets
for select
to authenticated
using (private.is_active_couple_member(couple_id));

create policy media_assets_insert_owner_active_member
on public.media_assets
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and private.is_active_couple_member(couple_id)
);

create policy media_assets_update_owner
on public.media_assets
for update
to authenticated
using (
  owner_id = (select auth.uid())
  and private.is_active_couple_member(couple_id)
)
with check (
  owner_id = (select auth.uid())
  and private.is_active_couple_member(couple_id)
);

create policy presence_events_select_active_members
on public.presence_events
for select
to authenticated
using (private.is_active_couple_member(couple_id));

create policy presence_events_insert_sender_active_member
on public.presence_events
for insert
to authenticated
with check (
  sender_id = (select auth.uid())
  and private.is_active_couple_member(couple_id)
);

create policy ritual_templates_select_active_authenticated
on public.ritual_templates
for select
to authenticated
using (is_active = true);

create policy couple_rituals_select_active_members
on public.couple_rituals
for select
to authenticated
using (private.is_active_couple_member(couple_id));

create policy couple_rituals_insert_active_members
on public.couple_rituals
for insert
to authenticated
with check (private.is_active_couple_member(couple_id));

create policy couple_rituals_update_safe_status_for_active_members
on public.couple_rituals
for update
to authenticated
using (private.is_active_couple_member(couple_id))
with check (private.is_active_couple_member(couple_id));

create policy ritual_completions_select_own_or_revealed_partner
on public.ritual_completions
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (
    private.ritual_is_revealed(couple_ritual_id)
    and exists (
      select 1
      from public.couple_rituals cr
      where cr.id = ritual_completions.couple_ritual_id
        and private.is_active_couple_member(cr.couple_id)
    )
  )
);

create policy ritual_completions_insert_own_active_member
on public.ritual_completions
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.couple_rituals cr
    where cr.id = ritual_completions.couple_ritual_id
      and private.is_active_couple_member(cr.couple_id)
  )
);

create policy ritual_completions_update_own
on public.ritual_completions
for update
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.couple_rituals cr
    where cr.id = ritual_completions.couple_ritual_id
      and private.is_active_couple_member(cr.couple_id)
  )
)
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.couple_rituals cr
    where cr.id = ritual_completions.couple_ritual_id
      and private.is_active_couple_member(cr.couple_id)
  )
);

create policy memory_capsules_select_active_members
on public.memory_capsules
for select
to authenticated
using (private.is_active_couple_member(couple_id));

create policy memory_capsules_insert_creator_active_member
on public.memory_capsules
for insert
to authenticated
with check (
  creator_id = (select auth.uid())
  and private.is_active_couple_member(couple_id)
);

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

create policy memory_capsule_contents_insert_capsule_creator
on public.memory_capsule_contents
for insert
to authenticated
with check (
  exists (
    select 1
    from public.memory_capsules mc
    where mc.id = memory_capsule_contents.capsule_id
      and mc.creator_id = (select auth.uid())
      and private.is_active_couple_member(mc.couple_id)
  )
);

create policy memory_capsule_contents_update_creator_before_unlock
on public.memory_capsule_contents
for update
to authenticated
using (
  exists (
    select 1
    from public.memory_capsules mc
    where mc.id = memory_capsule_contents.capsule_id
      and mc.creator_id = (select auth.uid())
      and mc.unlock_at > now()
      and private.is_active_couple_member(mc.couple_id)
  )
)
with check (
  exists (
    select 1
    from public.memory_capsules mc
    where mc.id = memory_capsule_contents.capsule_id
      and mc.creator_id = (select auth.uid())
      and mc.unlock_at > now()
      and private.is_active_couple_member(mc.couple_id)
  )
);

create policy timeline_items_select_active_members
on public.timeline_items
for select
to authenticated
using (private.is_active_couple_member(couple_id));

create policy timeline_items_insert_actor_active_member
on public.timeline_items
for insert
to authenticated
with check (
  actor_id = (select auth.uid())
  and private.is_active_couple_member(couple_id)
);

create policy push_tokens_select_own
on public.push_tokens
for select
to authenticated
using (user_id = (select auth.uid()));

create policy push_tokens_insert_own
on public.push_tokens
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy push_tokens_update_own
on public.push_tokens
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy push_tokens_delete_own
on public.push_tokens
for delete
to authenticated
using (user_id = (select auth.uid()));

create policy notification_preferences_select_own
on public.notification_preferences
for select
to authenticated
using (user_id = (select auth.uid()));

create policy notification_preferences_insert_own
on public.notification_preferences
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy notification_preferences_update_own
on public.notification_preferences
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public;
revoke all on all functions in schema private from public;

grant usage on schema public to authenticated;
grant usage on schema private to authenticated;

grant select, insert, update on table public.profiles to authenticated;

grant select on table public.couples to authenticated;
grant update (
  anniversary_date,
  next_meetup_at,
  next_meetup_location
) on public.couples to authenticated;

grant select on table public.couple_members to authenticated;
grant select on table public.couple_invites to authenticated;

grant select, insert, update on table public.user_settings to authenticated;

grant select on table public.couple_settings to authenticated;
grant update (
  theme,
  ritual_frequency,
  privacy_level
) on public.couple_settings to authenticated;

grant select, insert on table public.media_assets to authenticated;
grant update (
  storage_path,
  media_type,
  mime_type,
  size_bytes
) on public.media_assets to authenticated;

grant select, insert on table public.presence_events to authenticated;
grant select on table public.ritual_templates to authenticated;

grant select, insert on table public.couple_rituals to authenticated;
grant update (status) on public.couple_rituals to authenticated;

grant select, insert on table public.ritual_completions to authenticated;
grant update (
  text_response,
  media_asset_id
) on public.ritual_completions to authenticated;

grant select, insert on table public.memory_capsules to authenticated;

grant select, insert on table public.memory_capsule_contents to authenticated;
grant update (
  note,
  media_asset_id
) on public.memory_capsule_contents to authenticated;

grant select, insert on table public.timeline_items to authenticated;

grant select, insert, update, delete on table public.push_tokens to authenticated;
grant select, insert, update on table public.notification_preferences to authenticated;

grant execute on function private.is_active_couple_member(uuid, uuid) to authenticated;
grant execute on function private.is_same_active_couple_member(uuid, uuid) to authenticated;
grant execute on function private.active_couple_member_count(uuid) to authenticated;
grant execute on function private.ritual_is_revealed(uuid) to authenticated;

grant execute on function public.create_couple_with_invite(date, timestamptz, text) to authenticated;
grant execute on function public.accept_couple_invite(text) to authenticated;
grant execute on function public.open_memory_capsule(uuid) to authenticated;
