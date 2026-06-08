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
  ('00000000-0000-4000-8000-000000000401'),
  ('00000000-0000-4000-8000-000000000402'),
  ('00000000-0000-4000-8000-000000000403');

insert into public.couples (id, created_by, status)
values ('10000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000401', 'active');

insert into public.couple_members (id, couple_id, user_id, role, status)
values
  ('20000000-0000-4000-8000-000000000401', '10000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000401', 'partner', 'active'),
  ('20000000-0000-4000-8000-000000000402', '10000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000402', 'partner', 'active');

insert into public.memory_capsules (
  id,
  couple_id,
  creator_id,
  title,
  unlock_type,
  unlock_at,
  emotional_context,
  opened_by,
  opened_at
)
values
  (
    '30000000-0000-4000-8000-000000000401',
    '10000000-0000-4000-8000-000000000401',
    '00000000-0000-4000-8000-000000000401',
    'Locked Capsule',
    'date',
    now() + interval '1 day',
    'Locked context',
    null,
    null
  ),
  (
    '30000000-0000-4000-8000-000000000402',
    '10000000-0000-4000-8000-000000000401',
    '00000000-0000-4000-8000-000000000401',
    'Unlockable Capsule',
    'date',
    now() - interval '1 day',
    'Ready context',
    null,
    null
  );

insert into public.memory_capsule_contents (capsule_id, note, media_asset_id)
values
  ('30000000-0000-4000-8000-000000000401', 'Private locked note', null),
  ('30000000-0000-4000-8000-000000000402', 'Private unlocked note', null);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000402', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*) from public.memory_capsules where id = '30000000-0000-4000-8000-000000000401'),
  1::bigint,
  'capsules: active partner can read capsule metadata'
);

select is(
  (select count(*) from public.memory_capsule_contents where capsule_id = '30000000-0000-4000-8000-000000000401'),
  0::bigint,
  'capsules: partner cannot read capsule content before unlock/open'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000401', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*) from public.memory_capsule_contents where capsule_id = '30000000-0000-4000-8000-000000000401'),
  1::bigint,
  'capsules: creator can read own content before unlock'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000402', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select ok(
  pg_temp.throws_sqlstate(
    $sql$
      select public.open_memory_capsule('30000000-0000-4000-8000-000000000401')
    $sql$,
    '23514'
  ),
  'capsules: open_memory_capsule rejects locked capsule'
);

select public.open_memory_capsule('30000000-0000-4000-8000-000000000402');

select is(
  (select count(*) from public.memory_capsule_contents where capsule_id = '30000000-0000-4000-8000-000000000402'),
  1::bigint,
  'capsules: partner can read content after unlock/open workflow'
);

reset role;

select * from finish();
rollback;
