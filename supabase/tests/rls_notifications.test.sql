begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

create or replace function pg_temp.throws_sqlstate(p_sql text, p_expected_sqlstate text)
returns boolean
language plpgsql
as $$
begin
  execute p_sql;
  return false;
exception
  when others then
    return sqlstate = p_expected_sqlstate;
end;
$$;

insert into auth.users (id)
values
  ('00000000-0000-4000-8000-000000000601'),
  ('00000000-0000-4000-8000-000000000602');

insert into public.push_tokens (
  id,
  user_id,
  token,
  platform,
  token_type,
  status,
  last_seen_at
)
values
  (
    '10000000-0000-4000-8000-000000000601',
    '00000000-0000-4000-8000-000000000601',
    'ExpoPushToken-user-601-abcdefghijklmnop',
    'ios',
    'expo',
    'active',
    now()
  ),
  (
    '10000000-0000-4000-8000-000000000602',
    '00000000-0000-4000-8000-000000000602',
    'ExpoPushToken-user-602-abcdefghijklmnop',
    'android',
    'expo',
    'active',
    now()
  );

insert into public.notification_preferences (
  user_id,
  presence_enabled,
  rituals_enabled,
  capsules_enabled,
  countdown_enabled,
  quiet_hours_enabled
)
values
  ('00000000-0000-4000-8000-000000000601', true, true, true, true, true),
  ('00000000-0000-4000-8000-000000000602', true, false, true, false, true);

insert into public.notification_queue (
  id,
  recipient_user_id,
  couple_id,
  type,
  title,
  body,
  data,
  status
)
values
  (
    '20000000-0000-4000-8000-000000000601',
    '00000000-0000-4000-8000-000000000601',
    null,
    'system_test',
    'Server generated test',
    'Queue row for RLS tests',
    '{}'::jsonb,
    'pending'
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000601', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*) from public.push_tokens where user_id = '00000000-0000-4000-8000-000000000601'),
  1::bigint,
  'notifications: user can select own push tokens'
);

select is(
  (select count(*) from public.push_tokens where user_id = '00000000-0000-4000-8000-000000000602'),
  0::bigint,
  'notifications: user cannot select partner push token'
);

select is(
  (select count(*) from public.notification_preferences where user_id = '00000000-0000-4000-8000-000000000601'),
  1::bigint,
  'notifications: notification_preferences are selectable for own user'
);

select is(
  (select count(*) from public.notification_preferences where user_id = '00000000-0000-4000-8000-000000000602'),
  0::bigint,
  'notifications: notification_preferences are not selectable for other users'
);

select ok(
  pg_temp.throws_sqlstate(
    $sql$
      select count(*) from public.notification_queue
    $sql$,
    '42501'
  ),
  'notifications: notification_queue is not client-readable'
);

select ok(
  pg_temp.throws_sqlstate(
    $sql$
      insert into public.notification_queue (
        recipient_user_id,
        couple_id,
        type,
        title,
        body,
        data,
        status
      )
      values (
        '00000000-0000-4000-8000-000000000601',
        null,
        'system_test',
        'Client write',
        'Should be rejected',
        '{}'::jsonb,
        'pending'
      )
    $sql$,
    '42501'
  ),
  'notifications: notification_queue is not client-writable'
);

reset role;

select * from finish();
rollback;
