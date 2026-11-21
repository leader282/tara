begin;

create extension if not exists pgtap with schema extensions;

select plan(3);

insert into auth.users (id)
values
  ('00000000-0000-4000-8000-000000000901'),
  ('00000000-0000-4000-8000-000000000902');

insert into public.couples (id, created_by, status)
values ('10000000-0000-4000-8000-000000000901', '00000000-0000-4000-8000-000000000901', 'active');

insert into public.couple_members (couple_id, user_id, role, status)
values
  ('10000000-0000-4000-8000-000000000901', '00000000-0000-4000-8000-000000000901', 'partner', 'active'),
  ('10000000-0000-4000-8000-000000000901', '00000000-0000-4000-8000-000000000902', 'partner', 'active');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000901', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

update public.couples
set next_meetup_at = now() + interval '30 days', next_meetup_location = 'Goa'
where id = '10000000-0000-4000-8000-000000000901';

reset role;

select is(
  (
    select count(*)
    from public.timeline_items
    where couple_id = '10000000-0000-4000-8000-000000000901'
      and type = 'countdown_updated'
      and actor_id = '00000000-0000-4000-8000-000000000901'
  ),
  1::bigint,
  'timeline: planning a reunion adds a countdown moment for the couple'
);

select is(
  (
    select payload ? 'next_meetup_location' or payload ->> 'has_location' <> 'true'
    from public.timeline_items
    where couple_id = '10000000-0000-4000-8000-000000000901'
      and type = 'countdown_updated'
  ),
  false,
  'timeline: countdown moments say a place was set without storing it'
);

update public.couples
set status = status
where id = '10000000-0000-4000-8000-000000000901';

select is(
  (
    select count(*)
    from public.timeline_items
    where couple_id = '10000000-0000-4000-8000-000000000901'
      and type = 'countdown_updated'
  ),
  1::bigint,
  'timeline: couple updates that leave the reunion alone add no countdown moment'
);

select * from finish();
rollback;
