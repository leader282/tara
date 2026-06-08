begin;

create extension if not exists pgtap with schema extensions;

select plan(11);

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

create or replace function pg_temp.sqlstate_for(p_sql text)
returns text
language plpgsql
as $$
begin
  execute p_sql;
  return null;
exception
  when others then
    return sqlstate;
end;
$$;

insert into auth.users (id)
values
  ('00000000-0000-4000-8000-000000000201'), -- creator
  ('00000000-0000-4000-8000-000000000202'), -- partner
  ('00000000-0000-4000-8000-000000000203'), -- third user
  ('00000000-0000-4000-8000-000000000204'), -- waiting user
  ('00000000-0000-4000-8000-000000000205'); -- other creator

insert into public.couples (id, created_by, status)
values
  ('10000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000201', 'active'),
  ('10000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000204', 'active'),
  ('10000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000205', 'active');

insert into public.couple_members (id, couple_id, user_id, role, status)
values
  ('20000000-0000-4000-8000-000000000201', '10000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000201', 'partner', 'active'),
  ('20000000-0000-4000-8000-000000000202', '10000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000202', 'partner', 'active'),
  ('20000000-0000-4000-8000-000000000203', '10000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000204', 'partner', 'active'),
  ('20000000-0000-4000-8000-000000000204', '10000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000205', 'partner', 'active');

insert into public.couple_invites (id, couple_id, created_by, invite_code, status, expires_at)
values
  ('30000000-0000-4000-8000-000000000201', '10000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000201', 'MAININVITECODE0001', 'active', now() + interval '7 days'),
  ('30000000-0000-4000-8000-000000000202', '10000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000204', 'SELFINVITECODE0002', 'active', now() + interval '7 days'),
  ('30000000-0000-4000-8000-000000000203', '10000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000205', 'OTHERINVITECODE0003', 'active', now() + interval '7 days');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000201', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*) from public.couples where id = '10000000-0000-4000-8000-000000000201'),
  1::bigint,
  'couples: active couple member can select own couple'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000203', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*) from public.couples where id = '10000000-0000-4000-8000-000000000201'),
  0::bigint,
  'couples: non-member cannot select another couple'
);

reset role;

select ok(
  pg_temp.throws_sqlstate(
    $sql$
      insert into public.couple_members (id, couple_id, user_id, role, status)
      values ('20000000-0000-4000-8000-000000000205', '10000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000201', 'partner', 'active')
    $sql$,
    '23505'
  ),
  'couples: user cannot have two active couples'
);

select ok(
  pg_temp.throws_sqlstate(
    $sql$
      insert into public.couple_members (id, couple_id, user_id, role, status)
      values ('20000000-0000-4000-8000-000000000206', '10000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000203', 'partner', 'active')
    $sql$,
    '23514'
  ),
  'couples: max two active couple members is enforced'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000204', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select ok(
  pg_temp.throws_sqlstate(
    $sql$
      select public.ensure_daily_ritual(current_date)
    $sql$,
    '23514'
  ),
  'couples: waiting one-member couple is not treated as paired for paired-only RPCs'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000203', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select ok(
  pg_temp.throws_sqlstate(
    $sql$
      select public.accept_couple_invite('MAININVITECODE0001')
    $sql$,
    'P0001'
  ),
  'invite pairing: invite acceptance prevents a third active member'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000204', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select ok(
  pg_temp.throws_sqlstate(
    $sql$
      select public.accept_couple_invite('SELFINVITECODE0002')
    $sql$,
    'P0001'
  ),
  'invite pairing: creator cannot accept own invite'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000201', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select ok(
  coalesce(
    pg_temp.sqlstate_for(
      $sql$
        select public.accept_couple_invite('OTHERINVITECODE0003')
      $sql$
    ),
    ''
  ) in ('23514', 'P0001'),
  'invite pairing: user in active couple cannot accept another invite'
);

select is(
  (select archived from public.leave_current_couple('UNPAIR') limit 1),
  true,
  'couples: leave_current_couple archives the active couple'
);

reset role;

select is(
  (select status from public.couples where id = '10000000-0000-4000-8000-000000000201'),
  'archived',
  'couples: archived/unpaired couple does not remain active'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000201', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*) from public.couples where id = '10000000-0000-4000-8000-000000000201'),
  0::bigint,
  'couples: archived couple is no longer selectable via active-member policy'
);

reset role;

select * from finish();
rollback;
