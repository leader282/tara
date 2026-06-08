begin;

create extension if not exists pgtap with schema extensions;

select plan(5);

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
  ('00000000-0000-4000-8000-000000000301'), -- ritual user
  ('00000000-0000-4000-8000-000000000302'), -- partner
  ('00000000-0000-4000-8000-000000000303'), -- waiting user
  ('00000000-0000-4000-8000-000000000304'); -- no-couple user

insert into public.couples (id, created_by, status)
values
  ('10000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000301', 'active'),
  ('10000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000303', 'active');

insert into public.couple_members (id, couple_id, user_id, role, status)
values
  ('20000000-0000-4000-8000-000000000301', '10000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000301', 'partner', 'active'),
  ('20000000-0000-4000-8000-000000000302', '10000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000302', 'partner', 'active'),
  ('20000000-0000-4000-8000-000000000303', '10000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000303', 'partner', 'active');

insert into public.ritual_templates (id, title, description, category, prompt, input_type, is_active)
values
  ('30000000-0000-4000-8000-000000000301', 'Ritual Test Template', 'Template for RLS tests', 'daily_checkin', 'How are you today?', 'text', true);

insert into public.couple_rituals (id, couple_id, ritual_template_id, scheduled_for, status)
values
  ('40000000-0000-4000-8000-000000000301', '10000000-0000-4000-8000-000000000301', '30000000-0000-4000-8000-000000000301', current_date, 'scheduled'),
  ('40000000-0000-4000-8000-000000000302', '10000000-0000-4000-8000-000000000302', '30000000-0000-4000-8000-000000000301', current_date, 'scheduled');

insert into public.ritual_completions (id, couple_ritual_id, user_id, text_response)
values ('50000000-0000-4000-8000-000000000301', '40000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000301', 'My private response');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000301', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*) from public.ritual_completions where id = '50000000-0000-4000-8000-000000000301'),
  1::bigint,
  'rituals: user can read own ritual completion'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000302', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*) from public.ritual_completions where couple_ritual_id = '40000000-0000-4000-8000-000000000301'),
  0::bigint,
  'rituals: partner cannot read completion before reveal'
);

reset role;

insert into public.ritual_completions (id, couple_ritual_id, user_id, text_response)
values ('50000000-0000-4000-8000-000000000302', '40000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000302', 'Partner response');

update public.couple_rituals
set status = 'completed'
where id = '40000000-0000-4000-8000-000000000301';

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000302', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*) from public.ritual_completions where couple_ritual_id = '40000000-0000-4000-8000-000000000301'),
  2::bigint,
  'rituals: partner can read completions after reveal/completion'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000303', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select ok(
  pg_temp.throws_sqlstate(
    $sql$
      select public.complete_ritual('40000000-0000-4000-8000-000000000302', 'Still waiting', null)
    $sql$,
    '23514'
  ),
  'rituals: complete_ritual rejects waiting one-member couple users'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000304', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select ok(
  pg_temp.throws_sqlstate(
    $sql$
      select public.complete_ritual('40000000-0000-4000-8000-000000000301', 'No couple user', null)
    $sql$,
    'P0002'
  ),
  'rituals: complete_ritual rejects users with no active couple access'
);

reset role;

select * from finish();
rollback;
