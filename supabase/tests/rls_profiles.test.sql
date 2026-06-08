begin;

create extension if not exists pgtap with schema extensions;

select plan(4);

insert into auth.users (id)
values
  ('00000000-0000-4000-8000-000000000101'),
  ('00000000-0000-4000-8000-000000000102'),
  ('00000000-0000-4000-8000-000000000103');

insert into public.profiles (id, display_name, city)
values
  ('00000000-0000-4000-8000-000000000101', 'Profile User A', null),
  ('00000000-0000-4000-8000-000000000102', 'Profile User B', 'Partner City'),
  ('00000000-0000-4000-8000-000000000103', 'Profile User C', 'Outside City');

insert into public.couples (id, created_by, status)
values ('10000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000101', 'active');

insert into public.couple_members (id, couple_id, user_id, role, status)
values
  ('20000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000101', 'partner', 'active'),
  ('20000000-0000-4000-8000-000000000102', '10000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000102', 'partner', 'active');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000101', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*) from public.profiles where id = '00000000-0000-4000-8000-000000000101'),
  1::bigint,
  'profiles: user can select own profile'
);

select is(
  (select count(*) from public.profiles where id = '00000000-0000-4000-8000-000000000102'),
  1::bigint,
  'profiles: user can select active partner profile'
);

select is(
  (select count(*) from public.profiles where id = '00000000-0000-4000-8000-000000000103'),
  0::bigint,
  'profiles: user cannot select arbitrary non-partner profile'
);

update public.profiles
set city = 'Updated City'
where id = '00000000-0000-4000-8000-000000000101';

select is(
  (select city from public.profiles where id = '00000000-0000-4000-8000-000000000101'),
  'Updated City',
  'profiles: user can update own profile'
);

reset role;

select * from finish();
rollback;
