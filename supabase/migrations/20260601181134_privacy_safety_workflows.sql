-- Phase 13B: privacy and safety backend workflows.
-- Scope:
-- - account deletion/data export request tracking
-- - secure unpair + privacy RPCs
-- - strict RLS + grants for user-facing reads

create schema if not exists private;

-- 1) Account deletion requests.
create table if not exists public.account_deletion_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending',
  reason text,
  requested_at timestamptz not null default now(),
  scheduled_for timestamptz not null default (now() + interval '7 days'),
  processing_started_at timestamptz,
  completed_at timestamptz,
  canceled_at timestamptz,
  failed_at timestamptz,
  failure_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_deletion_requests_status_check
    check (status in ('pending', 'processing', 'completed', 'canceled', 'failed')),
  constraint account_deletion_requests_reason_length_check
    check (reason is null or char_length(reason) <= 500)
);

create index if not exists account_deletion_requests_user_id_created_at_idx
  on public.account_deletion_requests(user_id, created_at desc);

create index if not exists account_deletion_requests_status_scheduled_for_idx
  on public.account_deletion_requests(status, scheduled_for);

-- 2) Data export requests.
create table if not exists public.data_export_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'requested',
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  failed_at timestamptz,
  failure_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint data_export_requests_status_check
    check (status in ('requested', 'processing', 'completed', 'failed', 'canceled'))
);

create index if not exists data_export_requests_user_id_created_at_idx
  on public.data_export_requests(user_id, created_at desc);

create index if not exists data_export_requests_status_requested_at_idx
  on public.data_export_requests(status, requested_at);

-- 3) Privacy/safety audit events (intentionally minimal metadata).
create table if not exists public.privacy_safety_events (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  couple_id uuid references public.couples(id) on delete set null,
  type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint privacy_safety_events_type_check
    check (
      type in (
        'unpair_requested',
        'account_deletion_requested',
        'account_deletion_canceled',
        'data_export_requested'
      )
    )
);

comment on column public.privacy_safety_events.metadata is
  'Safety telemetry only. Never store capsule notes, ritual responses, media URLs, storage paths, exact locations, or private content.';

create index if not exists privacy_safety_events_user_id_created_at_idx
  on public.privacy_safety_events(user_id, created_at desc);

create index if not exists privacy_safety_events_couple_id_created_at_idx
  on public.privacy_safety_events(couple_id, created_at desc);

create index if not exists privacy_safety_events_type_created_at_idx
  on public.privacy_safety_events(type, created_at desc);

-- 4) updated_at triggers for mutable request tables.
do $$
begin
  if to_regclass('public.account_deletion_requests') is not null
    and not exists (
      select 1
      from pg_catalog.pg_trigger
      where tgrelid = 'public.account_deletion_requests'::regclass
        and tgname = 'set_account_deletion_requests_updated_at'
    )
  then
    create trigger set_account_deletion_requests_updated_at
    before update on public.account_deletion_requests
    for each row
    execute function public.set_updated_at();
  end if;

  if to_regclass('public.data_export_requests') is not null
    and not exists (
      select 1
      from pg_catalog.pg_trigger
      where tgrelid = 'public.data_export_requests'::regclass
        and tgname = 'set_data_export_requests_updated_at'
    )
  then
    create trigger set_data_export_requests_updated_at
    before update on public.data_export_requests
    for each row
    execute function public.set_updated_at();
  end if;
end;
$$;

-- Internal helper to archive the authenticated user's active couple safely.
create or replace function private.archive_active_couple_for_user(
  target_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_couple_id uuid;
  v_active_couple_count integer;
begin
  if target_user_id is null then
    return null;
  end if;

  select count(distinct cm.couple_id)::integer
  into v_active_couple_count
  from public.couple_members cm
  join public.couples c
    on c.id = cm.couple_id
  where cm.user_id = target_user_id
    and cm.status = 'active'
    and c.status = 'active';

  if v_active_couple_count = 0 then
    return null;
  end if;

  if v_active_couple_count > 1 then
    raise exception 'User belongs to multiple active couples'
      using errcode = '23514';
  end if;

  select c.id
  into v_couple_id
  from public.couple_members cm
  join public.couples c
    on c.id = cm.couple_id
  where cm.user_id = target_user_id
    and cm.status = 'active'
    and c.status = 'active'
  limit 1
  for update of c;

  if v_couple_id is null then
    return null;
  end if;

  update public.couple_invites ci
  set status = 'revoked'
  where ci.couple_id = v_couple_id
    and ci.status = 'active';

  update public.couples c
  set status = 'archived'
  where c.id = v_couple_id
    and c.status = 'active';

  if not found then
    raise exception 'Failed to archive active couple'
      using errcode = '23514';
  end if;

  update public.couple_members cm
  set status = 'left'
  where cm.couple_id = v_couple_id
    and cm.status = 'active';

  return v_couple_id;
end;
$$;

revoke all on function private.archive_active_couple_for_user(uuid) from public;
revoke all on function private.archive_active_couple_for_user(uuid) from anon;

-- 5) Unpair workflow.
create or replace function public.leave_current_couple(
  p_confirmation text
)
returns table (
  couple_id uuid,
  archived boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_confirmation text := upper(btrim(coalesce(p_confirmation, '')));
  v_archived_couple_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  if v_confirmation <> 'UNPAIR' then
    raise exception 'Confirmation must be UNPAIR'
      using errcode = '22023';
  end if;

  v_archived_couple_id := private.archive_active_couple_for_user(v_user_id);

  if v_archived_couple_id is null then
    raise exception 'No active couple found'
      using errcode = '23514';
  end if;

  if to_regclass('public.privacy_safety_events') is not null then
    insert into public.privacy_safety_events (
      user_id,
      couple_id,
      type,
      metadata
    )
    values (
      v_user_id,
      v_archived_couple_id,
      'unpair_requested',
      jsonb_build_object('source', 'leave_current_couple')
    );
  end if;

  return query
  select v_archived_couple_id, true;
end;
$$;

-- 6) Account deletion request workflow.
create or replace function public.request_account_deletion(
  p_confirmation text,
  p_reason text default null
)
returns public.account_deletion_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_confirmation text := upper(btrim(coalesce(p_confirmation, '')));
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  v_existing public.account_deletion_requests%rowtype;
  v_request public.account_deletion_requests%rowtype;
  v_archived_couple_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  if v_confirmation <> 'DELETE' then
    raise exception 'Confirmation must be DELETE'
      using errcode = '22023';
  end if;

  if v_reason is not null and char_length(v_reason) > 500 then
    raise exception 'Deletion reason must be 500 characters or fewer'
      using errcode = '22023';
  end if;

  select adr.*
  into v_existing
  from public.account_deletion_requests adr
  where adr.user_id = v_user_id
    and adr.status in ('pending', 'processing')
  order by adr.created_at desc
  limit 1;

  if found then
    return v_existing;
  end if;

  insert into public.account_deletion_requests (
    user_id,
    status,
    reason,
    requested_at,
    scheduled_for
  )
  values (
    v_user_id,
    'pending',
    v_reason,
    now(),
    now() + interval '7 days'
  )
  returning * into v_request;

  if to_regclass('public.push_tokens') is not null then
    update public.push_tokens pt
    set status = 'revoked',
        revoked_at = coalesce(pt.revoked_at, now()),
        updated_at = now()
    where pt.user_id = v_user_id
      and pt.status <> 'revoked';
  end if;

  v_archived_couple_id := private.archive_active_couple_for_user(v_user_id);

  if to_regclass('public.privacy_safety_events') is not null then
    insert into public.privacy_safety_events (
      user_id,
      couple_id,
      type,
      metadata
    )
    values (
      v_user_id,
      v_archived_couple_id,
      'account_deletion_requested',
      jsonb_build_object(
        'request_id', v_request.id,
        'source', 'request_account_deletion'
      )
    );
  end if;

  return v_request;
end;
$$;

-- 7) Account deletion cancellation workflow.
create or replace function public.cancel_account_deletion_request(
  p_request_id uuid
)
returns public.account_deletion_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.account_deletion_requests%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  if p_request_id is null then
    raise exception 'Request id is required'
      using errcode = '22023';
  end if;

  select adr.*
  into v_request
  from public.account_deletion_requests adr
  where adr.id = p_request_id
    and adr.user_id = v_user_id
  for update;

  if not found then
    raise exception 'Account deletion request not found'
      using errcode = 'P0002';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Only pending account deletion requests can be canceled'
      using errcode = '23514';
  end if;

  update public.account_deletion_requests adr
  set status = 'canceled',
      canceled_at = now(),
      updated_at = now()
  where adr.id = v_request.id
  returning * into v_request;

  if to_regclass('public.privacy_safety_events') is not null then
    insert into public.privacy_safety_events (
      user_id,
      couple_id,
      type,
      metadata
    )
    values (
      v_user_id,
      null,
      'account_deletion_canceled',
      jsonb_build_object(
        'request_id', v_request.id,
        'source', 'cancel_account_deletion_request'
      )
    );
  end if;

  return v_request;
end;
$$;

-- 8) Data export request workflow (placeholder, no export generation yet).
create or replace function public.request_data_export()
returns public.data_export_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing public.data_export_requests%rowtype;
  v_request public.data_export_requests%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  select der.*
  into v_existing
  from public.data_export_requests der
  where der.user_id = v_user_id
    and der.status in ('requested', 'processing')
  order by der.created_at desc
  limit 1;

  if found then
    return v_existing;
  end if;

  insert into public.data_export_requests (
    user_id,
    status,
    requested_at
  )
  values (
    v_user_id,
    'requested',
    now()
  )
  returning * into v_request;

  if to_regclass('public.privacy_safety_events') is not null then
    insert into public.privacy_safety_events (
      user_id,
      couple_id,
      type,
      metadata
    )
    values (
      v_user_id,
      null,
      'data_export_requested',
      jsonb_build_object(
        'request_id', v_request.id,
        'source', 'request_data_export'
      )
    );
  end if;

  return v_request;
end;
$$;

-- 9) Safe shared couple settings update workflow.
create or replace function public.update_couple_shared_settings(
  p_anniversary_date date default null,
  p_ritual_frequency text default null,
  p_theme text default null
)
returns table (
  couple_id uuid,
  anniversary_date date,
  ritual_frequency text,
  theme text,
  couple_updated_at timestamptz,
  couple_settings_updated_at timestamptz
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
  v_ritual_frequency text := nullif(lower(btrim(coalesce(p_ritual_frequency, ''))), '');
  v_theme text := case
    when p_theme is null then null
    else nullif(btrim(p_theme), '')
  end;
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  if p_ritual_frequency is not null
     and v_ritual_frequency not in ('daily', 'few_times_week', 'weekly') then
    raise exception 'Invalid ritual_frequency'
      using errcode = '22023';
  end if;

  select count(distinct cm.couple_id)::integer
  into v_active_couple_count
  from public.couple_members cm
  join public.couples c
    on c.id = cm.couple_id
  where cm.user_id = v_user_id
    and cm.status = 'active'
    and c.status = 'active';

  if v_active_couple_count = 0 then
    raise exception 'No paired active couple found'
      using errcode = '23514';
  end if;

  if v_active_couple_count > 1 then
    raise exception 'User belongs to multiple active couples'
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

  if v_couple_id is null then
    raise exception 'No paired active couple found'
      using errcode = '23514';
  end if;

  select private.active_couple_member_count(v_couple_id)
  into v_active_member_count;

  if v_active_member_count <> 2 then
    raise exception 'Couple must have two active partners'
      using errcode = '23514';
  end if;

  if p_anniversary_date is not null then
    update public.couples c
    set anniversary_date = p_anniversary_date
    where c.id = v_couple_id
      and c.status = 'active';
  end if;

  if p_ritual_frequency is not null or p_theme is not null then
    insert into public.couple_settings (couple_id)
    values (v_couple_id)
    on conflict on constraint couple_settings_pkey do nothing;

    update public.couple_settings cs
    set ritual_frequency = case
          when p_ritual_frequency is not null then v_ritual_frequency
          else cs.ritual_frequency
        end,
        theme = case
          when p_theme is not null then v_theme
          else cs.theme
        end
    where cs.couple_id = v_couple_id;
  end if;

  return query
  select
    c.id as couple_id,
    c.anniversary_date,
    cs.ritual_frequency,
    cs.theme,
    c.updated_at as couple_updated_at,
    cs.updated_at as couple_settings_updated_at
  from public.couples c
  join public.couple_settings cs
    on cs.couple_id = c.id
  where c.id = v_couple_id;
end;
$$;

-- 10) RLS for new privacy/safety tables.
alter table public.account_deletion_requests enable row level security;
alter table public.data_export_requests enable row level security;
alter table public.privacy_safety_events enable row level security;

drop policy if exists account_deletion_requests_select_own
on public.account_deletion_requests;

create policy account_deletion_requests_select_own
on public.account_deletion_requests
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists data_export_requests_select_own
on public.data_export_requests;

create policy data_export_requests_select_own
on public.data_export_requests
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists privacy_safety_events_select_own
on public.privacy_safety_events;

create policy privacy_safety_events_select_own
on public.privacy_safety_events
for select
to authenticated
using (user_id = (select auth.uid()));

-- No broad table writes from client roles; RPCs handle mutation paths.
revoke all on table public.account_deletion_requests from anon, authenticated;
revoke all on table public.data_export_requests from anon, authenticated;
revoke all on table public.privacy_safety_events from anon, authenticated;

grant select on table public.account_deletion_requests to authenticated;
grant select on table public.data_export_requests to authenticated;
grant select on table public.privacy_safety_events to authenticated;

-- 11) RPC execute grants: authenticated only.
revoke all on function public.leave_current_couple(text) from public;
revoke all on function public.leave_current_couple(text) from anon;
grant execute on function public.leave_current_couple(text) to authenticated;

revoke all on function public.request_account_deletion(text, text) from public;
revoke all on function public.request_account_deletion(text, text) from anon;
grant execute on function public.request_account_deletion(text, text) to authenticated;

revoke all on function public.cancel_account_deletion_request(uuid) from public;
revoke all on function public.cancel_account_deletion_request(uuid) from anon;
grant execute on function public.cancel_account_deletion_request(uuid) to authenticated;

revoke all on function public.request_data_export() from public;
revoke all on function public.request_data_export() from anon;
grant execute on function public.request_data_export() to authenticated;

revoke all on function public.update_couple_shared_settings(date, text, text) from public;
revoke all on function public.update_couple_shared_settings(date, text, text) from anon;
grant execute on function public.update_couple_shared_settings(date, text, text) to authenticated;
