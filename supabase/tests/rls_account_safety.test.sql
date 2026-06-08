begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

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
  ('00000000-0000-4000-8000-000000000701'),
  ('00000000-0000-4000-8000-000000000702'),
  ('00000000-0000-4000-8000-000000000703');

insert into public.couples (id, created_by, status)
values ('10000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000701', 'active');

insert into public.couple_members (id, couple_id, user_id, role, status)
values
  ('20000000-0000-4000-8000-000000000701', '10000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000701', 'partner', 'active'),
  ('20000000-0000-4000-8000-000000000702', '10000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000702', 'partner', 'active');

insert into public.data_export_requests (id, user_id, status, requested_at)
values
  ('30000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000701', 'requested', now()),
  ('30000000-0000-4000-8000-000000000702', '00000000-0000-4000-8000-000000000702', 'requested', now());

insert into public.account_deletion_requests (id, user_id, status, requested_at, scheduled_for)
values (
  '40000000-0000-4000-8000-000000000702',
  '00000000-0000-4000-8000-000000000702',
  'pending',
  now(),
  now() + interval '7 days'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000703', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select ok(
  pg_temp.throws_sqlstate(
    $sql$
      select public.leave_current_couple('UNPAIR')
    $sql$,
    '23514'
  ),
  'account safety: leave_current_couple cannot target another user''s couple'
);

reset role;

select is(
  (select status from public.couples where id = '10000000-0000-4000-8000-000000000701'),
  'active',
  'account safety: unrelated couple remains active after denied leave_current_couple'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000701', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select user_id from public.request_account_deletion('DELETE', 'Need account cleanup') limit 1),
  '00000000-0000-4000-8000-000000000701'::uuid,
  'account safety: request_account_deletion creates request only for auth.uid()'
);

select is(
  (select count(*) from public.account_deletion_requests where user_id = '00000000-0000-4000-8000-000000000701'),
  1::bigint,
  'account safety: user can select own account deletion requests'
);

select is(
  (select count(*) from public.account_deletion_requests where user_id = '00000000-0000-4000-8000-000000000702'),
  0::bigint,
  'account safety: user cannot select another user''s account deletion request'
);

select is(
  (select count(*) from public.data_export_requests where user_id = '00000000-0000-4000-8000-000000000701'),
  1::bigint,
  'account safety: user can select own data export requests'
);

select is(
  (select count(*) from public.data_export_requests where user_id = '00000000-0000-4000-8000-000000000702'),
  0::bigint,
  'account safety: user cannot select another user''s data export request'
);

select ok(
  pg_temp.throws_sqlstate(
    $sql$
      select public.cancel_account_deletion_request('40000000-0000-4000-8000-000000000702')
    $sql$,
    'P0002'
  ),
  'account safety: cancel_account_deletion_request cannot cancel another user''s pending request'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000702', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select status from public.cancel_account_deletion_request('40000000-0000-4000-8000-000000000702') limit 1),
  'canceled',
  'account safety: cancel_account_deletion_request works for own pending request'
);

reset role;

select * from finish();
rollback;
