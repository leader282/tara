-- Phase 12B: notification queue, token RPCs, RLS, and enqueue helpers.
-- Security posture:
-- - Queue and delivery tables are server-only by default.
-- - Client token registration uses authenticated RPCs.
-- - Preferences and quiet-hours are evaluated server-side before enqueue.

create schema if not exists private;

-- 1) Extend push_tokens for richer push lifecycle metadata.
alter table public.push_tokens
  add column if not exists token_type text,
  add column if not exists native_token text,
  add column if not exists device_id text,
  add column if not exists project_id text,
  add column if not exists app_version text,
  add column if not exists status text,
  add column if not exists last_seen_at timestamptz,
  add column if not exists revoked_at timestamptz;

update public.push_tokens
set platform = lower(platform),
    token_type = lower(coalesce(nullif(btrim(token_type), ''), 'expo')),
    status = lower(coalesce(nullif(btrim(status), ''), 'active')),
    last_seen_at = coalesce(last_seen_at, updated_at, created_at, now())
where platform <> lower(platform)
   or token_type is null
   or token_type <> lower(token_type)
   or status is null
   or status <> lower(status)
   or last_seen_at is null;

alter table public.push_tokens
  alter column token_type set default 'expo',
  alter column status set default 'active',
  alter column last_seen_at set default now();

alter table public.push_tokens
  alter column token_type set not null,
  alter column status set not null,
  alter column last_seen_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conname = 'push_tokens_token_type_check'
      and conrelid = 'public.push_tokens'::regclass
  ) then
    alter table public.push_tokens
      add constraint push_tokens_token_type_check
      check (token_type in ('expo', 'native'));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conname = 'push_tokens_status_check'
      and conrelid = 'public.push_tokens'::regclass
  ) then
    alter table public.push_tokens
      add constraint push_tokens_status_check
      check (status in ('active', 'inactive', 'revoked'));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conname = 'push_tokens_platform_check'
      and conrelid = 'public.push_tokens'::regclass
  ) then
    alter table public.push_tokens
      add constraint push_tokens_platform_check
      check (platform in ('ios', 'android'));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conname = 'push_tokens_token_key'
      and conrelid = 'public.push_tokens'::regclass
  ) then
    alter table public.push_tokens
      add constraint push_tokens_token_key unique (token);
  end if;
end;
$$;

-- 2) Ensure notification_preferences exists with expected shape.
create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  presence_enabled boolean not null default true,
  rituals_enabled boolean not null default true,
  capsules_enabled boolean not null default true,
  countdown_enabled boolean not null default true,
  quiet_hours_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences
  add column if not exists presence_enabled boolean,
  add column if not exists rituals_enabled boolean,
  add column if not exists capsules_enabled boolean,
  add column if not exists countdown_enabled boolean,
  add column if not exists quiet_hours_enabled boolean,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

update public.notification_preferences
set presence_enabled = coalesce(presence_enabled, true),
    rituals_enabled = coalesce(rituals_enabled, true),
    capsules_enabled = coalesce(capsules_enabled, true),
    countdown_enabled = coalesce(countdown_enabled, true),
    quiet_hours_enabled = coalesce(quiet_hours_enabled, true),
    created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, now())
where presence_enabled is null
   or rituals_enabled is null
   or capsules_enabled is null
   or countdown_enabled is null
   or quiet_hours_enabled is null
   or created_at is null
   or updated_at is null;

alter table public.notification_preferences
  alter column presence_enabled set default true,
  alter column rituals_enabled set default true,
  alter column capsules_enabled set default true,
  alter column countdown_enabled set default true,
  alter column quiet_hours_enabled set default true,
  alter column created_at set default now(),
  alter column updated_at set default now();

alter table public.notification_preferences
  alter column presence_enabled set not null,
  alter column rituals_enabled set not null,
  alter column capsules_enabled set not null,
  alter column countdown_enabled set not null,
  alter column quiet_hours_enabled set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

-- 3) Notification queue (server-side orchestration).
create table if not exists public.notification_queue (
  id uuid primary key default extensions.gen_random_uuid(),
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  couple_id uuid references public.couples(id) on delete cascade,
  type text not null,
  source_table text,
  source_id uuid,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  dedupe_key text,
  scheduled_for timestamptz not null default now(),
  status text not null default 'pending',
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  last_attempt_at timestamptz,
  sent_at timestamptz,
  skipped_at timestamptz,
  failure_code text,
  failure_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_queue_type_check
    check (
      type in (
        'presence_pulse',
        'ritual_ready',
        'ritual_reminder',
        'capsule_unlocked',
        'countdown_reminder',
        'system_test'
      )
    ),
  constraint notification_queue_status_check
    check (status in ('pending', 'processing', 'sent', 'failed', 'skipped')),
  constraint notification_queue_attempts_check
    check (attempts >= 0),
  constraint notification_queue_max_attempts_check
    check (max_attempts between 1 and 10)
);

create index if not exists notification_queue_status_scheduled_for_idx
  on public.notification_queue(status, scheduled_for);

create index if not exists notification_queue_recipient_user_created_at_idx
  on public.notification_queue(recipient_user_id, created_at desc);

create index if not exists notification_queue_couple_created_at_idx
  on public.notification_queue(couple_id, created_at desc);

create unique index if not exists notification_queue_dedupe_key_unique_idx
  on public.notification_queue(dedupe_key)
  where dedupe_key is not null;

-- 4) Delivery result ledger for tickets/receipts.
create table if not exists public.notification_deliveries (
  id uuid primary key default extensions.gen_random_uuid(),
  notification_id uuid not null references public.notification_queue(id) on delete cascade,
  push_token_id uuid not null references public.push_tokens(id) on delete cascade,
  expo_ticket_id text,
  ticket_status text,
  ticket_message text,
  ticket_details jsonb,
  receipt_status text,
  receipt_message text,
  receipt_details jsonb,
  receipt_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notification_deliveries_notification_id_idx
  on public.notification_deliveries(notification_id);

create index if not exists notification_deliveries_push_token_id_idx
  on public.notification_deliveries(push_token_id);

create index if not exists notification_deliveries_expo_ticket_id_idx
  on public.notification_deliveries(expo_ticket_id)
  where expo_ticket_id is not null;

create index if not exists notification_deliveries_receipt_checked_at_idx
  on public.notification_deliveries(receipt_checked_at)
  where expo_ticket_id is not null;

-- 5) updated_at triggers.
do $$
begin
  if to_regclass('public.push_tokens') is not null
    and not exists (
      select 1
      from pg_catalog.pg_trigger
      where tgrelid = 'public.push_tokens'::regclass
        and tgname = 'set_push_tokens_updated_at'
    )
  then
    create trigger set_push_tokens_updated_at
    before update on public.push_tokens
    for each row
    execute function public.set_updated_at();
  end if;

  if to_regclass('public.notification_preferences') is not null
    and not exists (
      select 1
      from pg_catalog.pg_trigger
      where tgrelid = 'public.notification_preferences'::regclass
        and tgname = 'set_notification_preferences_updated_at'
    )
  then
    create trigger set_notification_preferences_updated_at
    before update on public.notification_preferences
    for each row
    execute function public.set_updated_at();
  end if;

  if to_regclass('public.notification_queue') is not null
    and not exists (
      select 1
      from pg_catalog.pg_trigger
      where tgrelid = 'public.notification_queue'::regclass
        and tgname = 'set_notification_queue_updated_at'
    )
  then
    create trigger set_notification_queue_updated_at
    before update on public.notification_queue
    for each row
    execute function public.set_updated_at();
  end if;

  if to_regclass('public.notification_deliveries') is not null
    and not exists (
      select 1
      from pg_catalog.pg_trigger
      where tgrelid = 'public.notification_deliveries'::regclass
        and tgname = 'set_notification_deliveries_updated_at'
    )
  then
    create trigger set_notification_deliveries_updated_at
    before update on public.notification_deliveries
    for each row
    execute function public.set_updated_at();
  end if;
end;
$$;

-- 11) RLS posture for notifications.
alter table public.push_tokens enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notification_queue enable row level security;
alter table public.notification_deliveries enable row level security;

drop policy if exists push_tokens_select_own
on public.push_tokens;

create policy push_tokens_select_own
on public.push_tokens
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists push_tokens_insert_own
on public.push_tokens;

drop policy if exists push_tokens_update_own
on public.push_tokens;

drop policy if exists push_tokens_delete_own
on public.push_tokens;

drop policy if exists notification_preferences_select_own
on public.notification_preferences;

create policy notification_preferences_select_own
on public.notification_preferences
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists notification_preferences_insert_own
on public.notification_preferences;

create policy notification_preferences_insert_own
on public.notification_preferences
for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists notification_preferences_update_own
on public.notification_preferences;

create policy notification_preferences_update_own
on public.notification_preferences
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

revoke all on table public.notification_queue from anon, authenticated;
revoke all on table public.notification_deliveries from anon, authenticated;
revoke insert, update, delete on table public.push_tokens from authenticated;
grant select on table public.push_tokens to authenticated;
grant select, insert, update on table public.notification_preferences to authenticated;

-- 6) Preference gate helper.
create or replace function private.user_allows_notification(
  target_user_id uuid,
  notification_type text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_type text := lower(btrim(coalesce(notification_type, '')));
  v_presence_enabled boolean;
  v_rituals_enabled boolean;
  v_capsules_enabled boolean;
  v_countdown_enabled boolean;
begin
  if target_user_id is null then
    return false;
  end if;

  select
    np.presence_enabled,
    np.rituals_enabled,
    np.capsules_enabled,
    np.countdown_enabled
  into
    v_presence_enabled,
    v_rituals_enabled,
    v_capsules_enabled,
    v_countdown_enabled
  from public.notification_preferences np
  where np.user_id = target_user_id;

  if not found then
    return false;
  end if;

  case v_type
    when 'presence_pulse' then
      return v_presence_enabled;
    when 'ritual_ready', 'ritual_reminder' then
      return v_rituals_enabled;
    when 'capsule_unlocked' then
      return v_capsules_enabled;
    when 'countdown_reminder' then
      return v_countdown_enabled;
    else
      return false;
  end case;
end;
$$;

-- 7) Quiet-hours scheduler helper.
create or replace function private.next_allowed_notification_at(
  target_user_id uuid,
  requested_at timestamptz default now()
)
returns timestamptz
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_requested_at timestamptz := coalesce(requested_at, now());
  v_quiet_hours_enabled boolean;
  v_timezone text;
  v_quiet_start time;
  v_quiet_end time;
  v_timezone_is_valid boolean := false;
  v_local_requested timestamp;
  v_local_date date;
  v_local_time time;
  v_in_quiet_hours boolean := false;
  v_local_resume timestamp;
begin
  if target_user_id is null then
    return v_requested_at;
  end if;

  select np.quiet_hours_enabled
  into v_quiet_hours_enabled
  from public.notification_preferences np
  where np.user_id = target_user_id;

  if not found or v_quiet_hours_enabled is distinct from true then
    return v_requested_at;
  end if;

  select p.timezone, us.quiet_hours_start, us.quiet_hours_end
  into v_timezone, v_quiet_start, v_quiet_end
  from public.profiles p
  left join public.user_settings us
    on us.user_id = p.id
  where p.id = target_user_id;

  if v_quiet_start is null or v_quiet_end is null then
    return v_requested_at;
  end if;

  if v_quiet_start = v_quiet_end then
    return v_requested_at;
  end if;

  select exists (
    select 1
    from pg_catalog.pg_timezone_names tzn
    where tzn.name = v_timezone
  )
  into v_timezone_is_valid;

  -- Fail-safe choice:
  -- If timezone is missing/invalid, do not guess a sleep schedule. The
  -- enqueue helper treats null as "skip" so we avoid unsafe quiet-hours sends.
  if v_timezone is null or not v_timezone_is_valid then
    return null;
  end if;

  v_local_requested := v_requested_at at time zone v_timezone;
  v_local_date := v_local_requested::date;
  v_local_time := v_local_requested::time;

  if v_quiet_start < v_quiet_end then
    v_in_quiet_hours := v_local_time >= v_quiet_start
      and v_local_time < v_quiet_end;

    if v_in_quiet_hours then
      v_local_resume := v_local_date::timestamp + v_quiet_end;
    end if;
  else
    v_in_quiet_hours := v_local_time >= v_quiet_start
      or v_local_time < v_quiet_end;

    if v_in_quiet_hours then
      if v_local_time >= v_quiet_start then
        v_local_resume := (v_local_date + 1)::timestamp + v_quiet_end;
      else
        v_local_resume := v_local_date::timestamp + v_quiet_end;
      end if;
    end if;
  end if;

  if not v_in_quiet_hours then
    return v_requested_at;
  end if;

  return greatest(v_requested_at, v_local_resume at time zone v_timezone);
end;
$$;

-- 8) Internal enqueue helper with preference/quiet-hours checks.
create or replace function private.enqueue_notification(
  target_user_id uuid,
  target_couple_id uuid,
  notification_type text,
  notification_title text,
  notification_body text,
  notification_data jsonb,
  source_table text default null,
  source_id uuid default null,
  dedupe_key text default null,
  requested_at timestamptz default now()
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_type text := lower(btrim(coalesce(notification_type, '')));
  v_title text := btrim(coalesce(notification_title, ''));
  v_body text := btrim(coalesce(notification_body, ''));
  v_data jsonb := coalesce(notification_data, '{}'::jsonb);
  v_scheduled_for timestamptz;
  v_notification_id uuid;
begin
  if target_user_id is null then
    return null;
  end if;

  if v_title = '' or v_body = '' then
    return null;
  end if;

  if not private.user_allows_notification(target_user_id, v_type) then
    return null;
  end if;

  v_scheduled_for := private.next_allowed_notification_at(target_user_id, requested_at);

  if v_scheduled_for is null then
    return null;
  end if;

  -- Caller contract:
  -- title/body/data must already be privacy-safe and must not include
  -- capsule notes, ritual responses, media URLs, optional pulse messages,
  -- exact locations, read receipts, or seen status.
  insert into public.notification_queue (
    recipient_user_id,
    couple_id,
    type,
    source_table,
    source_id,
    title,
    body,
    data,
    dedupe_key,
    scheduled_for,
    status
  )
  values (
    target_user_id,
    target_couple_id,
    v_type,
    source_table,
    source_id,
    v_title,
    v_body,
    v_data,
    dedupe_key,
    v_scheduled_for,
    'pending'
  )
  returning id into v_notification_id;

  return v_notification_id;
exception
  when unique_violation then
    return null;
end;
$$;

revoke all on function private.user_allows_notification(uuid, text) from public;
revoke all on function private.next_allowed_notification_at(uuid, timestamptz) from public;
revoke all on function private.enqueue_notification(uuid, uuid, text, text, text, jsonb, text, uuid, text, timestamptz) from public;

-- 9) Public token registration RPC.
create or replace function public.register_push_token(
  p_token text,
  p_platform text,
  p_token_type text default 'expo',
  p_native_token text default null,
  p_device_id text default null,
  p_project_id text default null,
  p_app_version text default null
)
returns public.push_tokens
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_token text := btrim(coalesce(p_token, ''));
  v_platform text := lower(btrim(coalesce(p_platform, '')));
  v_token_type text := lower(btrim(coalesce(p_token_type, 'expo')));
  v_native_token text := nullif(btrim(coalesce(p_native_token, '')), '');
  v_device_id text := nullif(btrim(coalesce(p_device_id, '')), '');
  v_project_id text := nullif(btrim(coalesce(p_project_id, '')), '');
  v_app_version text := nullif(btrim(coalesce(p_app_version, '')), '');
  v_row public.push_tokens%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  if char_length(v_token) < 16 or char_length(v_token) > 4096 then
    raise exception 'Invalid push token length'
      using errcode = '22023';
  end if;

  if v_platform not in ('ios', 'android') then
    raise exception 'Invalid push token platform'
      using errcode = '22023';
  end if;

  if v_token_type not in ('expo', 'native') then
    raise exception 'Invalid push token type'
      using errcode = '22023';
  end if;

  insert into public.push_tokens (
    user_id,
    token,
    platform,
    token_type,
    native_token,
    device_id,
    project_id,
    app_version,
    status,
    last_seen_at,
    revoked_at
  )
  values (
    v_user_id,
    v_token,
    v_platform,
    v_token_type,
    v_native_token,
    v_device_id,
    v_project_id,
    v_app_version,
    'active',
    now(),
    null
  )
  on conflict (token)
  do update set
    user_id = excluded.user_id,
    platform = excluded.platform,
    token_type = excluded.token_type,
    native_token = excluded.native_token,
    device_id = excluded.device_id,
    project_id = excluded.project_id,
    app_version = excluded.app_version,
    status = 'active',
    last_seen_at = now(),
    revoked_at = null,
    updated_at = now()
  where public.push_tokens.user_id = v_user_id
     or public.push_tokens.status = 'revoked'
  returning * into v_row;

  if not found then
    raise exception 'Push token is already registered to another user'
      using errcode = '23505';
  end if;

  return v_row;
end;
$$;

-- 10) Public token unregister RPC.
create or replace function public.unregister_push_token(
  p_token text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_token text := btrim(coalesce(p_token, ''));
  v_found boolean := false;
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  if v_token = '' then
    raise exception 'Push token is required'
      using errcode = '22023';
  end if;

  update public.push_tokens pt
  set status = 'revoked',
      revoked_at = coalesce(pt.revoked_at, now()),
      updated_at = now()
  where pt.user_id = v_user_id
    and pt.token = v_token
  returning true into v_found;

  return coalesce(v_found, false);
end;
$$;

revoke all on function public.register_push_token(text, text, text, text, text, text, text) from public;
revoke all on function public.register_push_token(text, text, text, text, text, text, text) from anon;
grant execute on function public.register_push_token(text, text, text, text, text, text, text) to authenticated;

revoke all on function public.unregister_push_token(text) from public;
revoke all on function public.unregister_push_token(text) from anon;
grant execute on function public.unregister_push_token(text) to authenticated;

-- 13) Scheduled helper: queue unlock notifications when capsules become due.
create or replace function public.enqueue_due_capsule_unlock_notifications()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_enqueued_count integer := 0;
  v_notification_id uuid;
  v_target record;
begin
  for v_target in
    select
      mc.id as capsule_id,
      mc.couple_id,
      cm.user_id as recipient_user_id
    from public.memory_capsules mc
    join public.couples c
      on c.id = mc.couple_id
     and c.status = 'active'
    join public.couple_members cm
      on cm.couple_id = mc.couple_id
     and cm.status = 'active'
    where mc.unlock_at <= v_now
      and mc.opened_at is null
  loop
    v_notification_id := private.enqueue_notification(
      target_user_id => v_target.recipient_user_id,
      target_couple_id => v_target.couple_id,
      notification_type => 'capsule_unlocked',
      notification_title => 'A memory capsule is ready',
      notification_body => 'A memory capsule can now be opened in Tara.',
      notification_data => jsonb_build_object(
        'type', 'capsule_unlocked',
        'capsule_id', v_target.capsule_id
      ),
      source_table => 'memory_capsules',
      source_id => v_target.capsule_id,
      dedupe_key => format('capsule_unlocked:%s:%s', v_target.capsule_id, v_target.recipient_user_id),
      requested_at => v_now
    );

    if v_notification_id is not null then
      v_enqueued_count := v_enqueued_count + 1;
    end if;
  end loop;

  return v_enqueued_count;
end;
$$;

-- 14) Scheduled helper: queue one gentle reminder per user/day.
create or replace function public.enqueue_due_ritual_reminders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_today_utc date := (now() at time zone 'utc')::date;
  v_enqueued_count integer := 0;
  v_notification_id uuid;
  v_target record;
begin
  for v_target in
    select
      cr.id as couple_ritual_id,
      cr.couple_id,
      cr.scheduled_for,
      cm.user_id as recipient_user_id
    from public.couple_rituals cr
    join public.couples c
      on c.id = cr.couple_id
     and c.status = 'active'
    join public.couple_members cm
      on cm.couple_id = cr.couple_id
     and cm.status = 'active'
    where cr.scheduled_for = v_today_utc
      and cr.status <> 'completed'
      and not exists (
        select 1
        from public.ritual_completions rc
        where rc.couple_ritual_id = cr.id
          and rc.user_id = cm.user_id
      )
  loop
    v_notification_id := private.enqueue_notification(
      target_user_id => v_target.recipient_user_id,
      target_couple_id => v_target.couple_id,
      notification_type => 'ritual_reminder',
      notification_title => 'A gentle ritual reminder',
      notification_body => 'Today''s ritual is ready whenever you have a quiet moment.',
      notification_data => jsonb_build_object(
        'type', 'ritual_reminder',
        'couple_ritual_id', v_target.couple_ritual_id
      ),
      source_table => 'couple_rituals',
      source_id => v_target.couple_ritual_id,
      dedupe_key => format('ritual_reminder:%s:%s:%s', v_target.recipient_user_id, v_target.couple_id, v_target.scheduled_for),
      requested_at => v_now
    );

    if v_notification_id is not null then
      v_enqueued_count := v_enqueued_count + 1;
    end if;
  end loop;

  return v_enqueued_count;
end;
$$;

revoke all on function public.enqueue_due_capsule_unlock_notifications() from public;
revoke all on function public.enqueue_due_capsule_unlock_notifications() from anon;
revoke all on function public.enqueue_due_capsule_unlock_notifications() from authenticated;
grant execute on function public.enqueue_due_capsule_unlock_notifications() to service_role;

revoke all on function public.enqueue_due_ritual_reminders() from public;
revoke all on function public.enqueue_due_ritual_reminders() from anon;
revoke all on function public.enqueue_due_ritual_reminders() from authenticated;
grant execute on function public.enqueue_due_ritual_reminders() to service_role;

-- 12) Workflow update: presence RPC now enqueues a partner notification.
create or replace function public.send_presence_pulse(
  p_type text,
  p_optional_message text default null
)
returns table (
  id uuid,
  couple_id uuid,
  sender_id uuid,
  type text,
  optional_message text,
  created_at timestamptz
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
  v_type text := btrim(coalesce(p_type, ''));
  v_optional_message text := nullif(btrim(coalesce(p_optional_message, '')), '');
  v_pulse_label text;
  v_presence_event public.presence_events%rowtype;
  v_partner_user_id uuid;
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

  select cm.couple_id
  into v_couple_id
  from public.couple_members cm
  join public.couples c
    on c.id = cm.couple_id
  where cm.user_id = v_user_id
    and cm.status = 'active'
    and c.status = 'active'
  limit 1;

  select count(*)::integer
  into v_active_member_count
  from public.couple_members cm
  where cm.couple_id = v_couple_id
    and cm.status = 'active';

  if v_active_member_count < 2 then
    raise exception 'Presence pulses require a paired couple'
      using errcode = '23514';
  end if;

  if v_active_member_count > 2 then
    raise exception 'Couple membership exceeded two active partners'
      using errcode = '23514';
  end if;

  if v_type not in (
    'thinking_of_you',
    'miss_you',
    'hug',
    'good_morning',
    'good_night',
    'safe_arrived',
    'proud_of_you'
  ) then
    raise exception 'Invalid presence pulse type'
      using errcode = '23514';
  end if;

  if v_optional_message is not null and char_length(v_optional_message) > 240 then
    raise exception 'Presence pulse message must be 240 characters or fewer'
      using errcode = '22001';
  end if;

  v_pulse_label := case v_type
    when 'thinking_of_you' then 'Thinking of you'
    when 'miss_you' then 'Miss you'
    when 'hug' then 'Hug'
    when 'good_morning' then 'Good morning'
    when 'good_night' then 'Good night'
    when 'safe_arrived' then 'Arrived safely'
    when 'proud_of_you' then 'Proud of you'
    else null
  end;

  insert into public.presence_events (
    couple_id,
    sender_id,
    type,
    optional_message
  )
  values (
    v_couple_id,
    v_user_id,
    v_type,
    v_optional_message
  )
  returning *
  into v_presence_event;

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
    'presence_sent',
    'Sent a pulse',
    v_pulse_label,
    jsonb_build_object(
      'presence_event_id', v_presence_event.id,
      'pulse_type', v_presence_event.type,
      'has_optional_message', v_presence_event.optional_message is not null
    )
  );

  select cm.user_id
  into v_partner_user_id
  from public.couple_members cm
  where cm.couple_id = v_couple_id
    and cm.status = 'active'
    and cm.user_id <> v_user_id
  limit 1;

  if v_partner_user_id is not null then
    perform private.enqueue_notification(
      target_user_id => v_partner_user_id,
      target_couple_id => v_couple_id,
      notification_type => 'presence_pulse',
      notification_title => 'A gentle pulse from your partner',
      notification_body => 'Open Tara whenever you feel ready to reconnect.',
      notification_data => jsonb_build_object(
        'type', 'presence_pulse',
        'presence_event_id', v_presence_event.id
      ),
      source_table => 'presence_events',
      source_id => v_presence_event.id,
      dedupe_key => format('presence_pulse:%s:%s', v_presence_event.id, v_partner_user_id),
      requested_at => now()
    );
  end if;

  return query
  select
    v_presence_event.id,
    v_presence_event.couple_id,
    v_presence_event.sender_id,
    v_presence_event.type,
    v_presence_event.optional_message,
    v_presence_event.created_at;
end;
$$;

revoke all on function public.send_presence_pulse(text, text) from public;
revoke all on function public.send_presence_pulse(text, text) from anon;
grant execute on function public.send_presence_pulse(text, text) to authenticated;

-- 12) Workflow update: ritual reveal enqueues ritual_ready for the other partner.
create or replace function public.complete_ritual(
  p_couple_ritual_id uuid,
  p_text_response text default null,
  p_media_asset_id uuid default null
)
returns table (
  couple_ritual_id uuid,
  status text,
  is_revealed boolean,
  completed_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_ritual public.couple_rituals%rowtype;
  v_template public.ritual_templates%rowtype;
  v_active_member_count integer;
  v_completed_count integer;
  v_text_response text := nullif(btrim(coalesce(p_text_response, '')), '');
  v_existing_completion public.ritual_completions%rowtype;
  v_status text;
  v_media_asset public.media_assets%rowtype;
  v_partner_user_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  select *
  into v_ritual
  from public.couple_rituals cr
  where cr.id = p_couple_ritual_id
  for update;

  if not found then
    raise exception 'Ritual not found'
      using errcode = 'P0002';
  end if;

  if not private.is_active_couple_member(v_ritual.couple_id, v_user_id) then
    raise exception 'Ritual not found'
      using errcode = 'P0002';
  end if;

  select count(*)::integer
  into v_active_member_count
  from public.couple_members cm
  where cm.couple_id = v_ritual.couple_id
    and cm.status = 'active';

  if v_active_member_count < 2 then
    raise exception 'Ritual completion requires a paired couple'
      using errcode = '23514';
  end if;

  if v_active_member_count > 2 then
    raise exception 'Couple membership exceeded two active partners'
      using errcode = '23514';
  end if;

  if v_ritual.status = 'completed' then
    raise exception 'This ritual is already complete'
      using errcode = '23514';
  end if;

  select *
  into v_template
  from public.ritual_templates rt
  where rt.id = v_ritual.ritual_template_id;

  if not found then
    raise exception 'Ritual template not found'
      using errcode = 'P0002';
  end if;

  if p_media_asset_id is not null then
    select *
    into v_media_asset
    from public.media_assets ma
    where ma.id = p_media_asset_id
    for update;

    if not found then
      raise exception 'Ritual media asset not found'
        using errcode = 'P0002';
    end if;

    if not private.is_uploaded_media_owned_by_user(v_media_asset.id, v_user_id) then
      raise exception 'Ritual media must be uploaded by you'
        using errcode = '23514';
    end if;

    if v_media_asset.couple_id <> v_ritual.couple_id then
      raise exception 'Ritual media does not belong to this couple'
        using errcode = '23514';
    end if;
  end if;

  if v_template.input_type = 'photo' then
    if p_media_asset_id is null then
      raise exception 'Photo rituals require uploaded media'
        using errcode = '23514';
    end if;
  elsif v_template.input_type = 'text_or_photo' then
    if v_text_response is null and p_media_asset_id is null then
      raise exception 'Ritual response requires text or uploaded media'
        using errcode = '23514';
    end if;
  elsif v_template.input_type = 'text' then
    if p_media_asset_id is not null then
      raise exception 'Text rituals do not accept media'
        using errcode = '23514';
    end if;

    if v_text_response is null then
      raise exception 'Ritual response text is required'
        using errcode = '23514';
    end if;
  else
    raise exception 'Unsupported ritual input type'
      using errcode = '23514';
  end if;

  if v_text_response is not null and char_length(v_text_response) > 1000 then
    raise exception 'Ritual response must be 1000 characters or fewer'
      using errcode = '22001';
  end if;

  select *
  into v_existing_completion
  from public.ritual_completions rc
  where rc.couple_ritual_id = v_ritual.id
    and rc.user_id = v_user_id
  for update;

  if found then
    if private.ritual_is_revealed(v_ritual.id) then
      raise exception 'This ritual is already revealed'
        using errcode = '23514';
    end if;

    update public.ritual_completions rc
    set text_response = v_text_response,
        media_asset_id = p_media_asset_id
    where rc.id = v_existing_completion.id;
  else
    insert into public.ritual_completions (
      couple_ritual_id,
      user_id,
      text_response,
      media_asset_id
    )
    values (
      v_ritual.id,
      v_user_id,
      v_text_response,
      p_media_asset_id
    );
  end if;

  select count(distinct rc.user_id)::integer
  into v_completed_count
  from public.ritual_completions rc
  join public.couple_members cm
    on cm.couple_id = v_ritual.couple_id
   and cm.user_id = rc.user_id
   and cm.status = 'active'
  where rc.couple_ritual_id = v_ritual.id;

  v_status := v_ritual.status;

  if v_completed_count >= v_active_member_count then
    update public.couple_rituals cr
    set status = 'completed'
    where cr.id = v_ritual.id
    returning cr.status into v_status;

    if not exists (
      select 1
      from public.timeline_items ti
      where ti.couple_id = v_ritual.couple_id
        and ti.type = 'ritual_completed'
        and ti.payload ->> 'couple_ritual_id' = v_ritual.id::text
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
        v_ritual.couple_id,
        v_user_id,
        'ritual_completed',
        'Completed today''s ritual',
        v_template.title,
        jsonb_build_object(
          'couple_ritual_id', v_ritual.id,
          'ritual_template_id', v_template.id,
          'scheduled_for', v_ritual.scheduled_for,
          'category', v_template.category,
          'input_type', v_template.input_type
        )
      );
    end if;

    for v_partner_user_id in
      select cm.user_id
      from public.couple_members cm
      where cm.couple_id = v_ritual.couple_id
        and cm.status = 'active'
        and cm.user_id <> v_user_id
    loop
      perform private.enqueue_notification(
        target_user_id => v_partner_user_id,
        target_couple_id => v_ritual.couple_id,
        notification_type => 'ritual_ready',
        notification_title => 'Your ritual is ready',
        notification_body => 'Open Tara whenever you want to see today''s shared ritual.',
        notification_data => jsonb_build_object(
          'type', 'ritual_ready',
          'couple_ritual_id', v_ritual.id
        ),
        source_table => 'couple_rituals',
        source_id => v_ritual.id,
        dedupe_key => format('ritual_ready:%s:%s', v_ritual.id, v_partner_user_id),
        requested_at => now()
      );
    end loop;
  end if;

  return query
  select
    v_ritual.id,
    v_status,
    v_completed_count >= v_active_member_count,
    v_completed_count;
end;
$$;

revoke all on function public.complete_ritual(uuid, text, uuid) from public;
revoke all on function public.complete_ritual(uuid, text, uuid) from anon;
grant execute on function public.complete_ritual(uuid, text, uuid) to authenticated;
