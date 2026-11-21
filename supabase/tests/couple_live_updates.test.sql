begin;

create extension if not exists pgtap with schema extensions;

select plan(4);

insert into auth.users (id)
values
  ('00000000-0000-4000-8000-000000000a01'),
  ('00000000-0000-4000-8000-000000000a02');

insert into public.couples (id, created_by, status)
values ('10000000-0000-4000-8000-000000000a01', '00000000-0000-4000-8000-000000000a01', 'active');

insert into public.couple_members (id, couple_id, user_id, role, status)
values
  ('20000000-0000-4000-8000-000000000a01', '10000000-0000-4000-8000-000000000a01', '00000000-0000-4000-8000-000000000a01', 'partner', 'active'),
  ('20000000-0000-4000-8000-000000000a02', '10000000-0000-4000-8000-000000000a01', '00000000-0000-4000-8000-000000000a02', 'partner', 'active');

select ok(
  exists (
    select 1
    from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'couples'
  ),
  'realtime: couple row changes are published'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'couple_members'
  ),
  'realtime: membership changes are published'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000a01', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select public.leave_current_couple('UNPAIR');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000a02', true);

select is(
  (
    select status
    from public.couple_members
    where id = '20000000-0000-4000-8000-000000000a02'
  ),
  'left',
  'couple_members: the partner left behind can still read their own membership after an unpair'
);

select is(
  (
    select count(*)
    from public.couple_members
    where id = '20000000-0000-4000-8000-000000000a01'
  ),
  0::bigint,
  'couple_members: after an unpair, the other member''s row stays hidden'
);

reset role;

select * from finish();
rollback;
