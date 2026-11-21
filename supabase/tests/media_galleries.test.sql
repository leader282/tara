begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

insert into auth.users (id)
values
  ('00000000-0000-4000-8000-000000000701'),
  ('00000000-0000-4000-8000-000000000702');

insert into public.couples (id, created_by, status)
values ('10000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000701', 'active');

insert into public.couple_members (id, couple_id, user_id, role, status)
values
  ('20000000-0000-4000-8000-000000000701', '10000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000701', 'partner', 'active'),
  ('20000000-0000-4000-8000-000000000702', '10000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000702', 'partner', 'active');

insert into public.ritual_templates (id, title, description, category, prompt, input_type, is_active)
values ('30000000-0000-4000-8000-000000000701', 'Gallery ritual', 'Template for gallery tests', 'daily_checkin', 'Show me your day', 'text_or_photo', true);

insert into public.couple_rituals (id, couple_id, ritual_template_id, scheduled_for, status)
values ('40000000-0000-4000-8000-000000000701', '10000000-0000-4000-8000-000000000701', '30000000-0000-4000-8000-000000000701', current_date, 'scheduled');

-- Six uploaded photos and one uploaded video from the first partner, one photo from the second.
insert into public.media_assets (id, couple_id, owner_id, storage_path, media_type, mime_type, size_bytes, duration_ms, purpose, upload_status, uploaded_at)
select
  format('50000000-0000-4000-8000-%s', lpad(n::text, 12, '0'))::uuid,
  '10000000-0000-4000-8000-000000000701',
  case when n = 708 then '00000000-0000-4000-8000-000000000702' else '00000000-0000-4000-8000-000000000701' end::uuid,
  format('10000000-0000-4000-8000-000000000701/owner/%s.%s', n, case when n = 707 then 'mp4' else 'jpg' end),
  case when n = 707 then 'video' else 'image' end,
  case when n = 707 then 'video/mp4' else 'image/jpeg' end,
  1000,
  case when n = 707 then 4800 end,
  'ritual_completion',
  'uploaded',
  now()
from generate_series(701, 708) as n;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000701', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select media_type || ':' || right(storage_path, 4) from public.reserve_media_asset('video/mp4', 4000000, 720, 1280, 'ritual_completion', 5000)),
  'video:.mp4',
  'media: a short video can be reserved for a ritual answer'
);

select throws_ok(
  $$ select * from public.reserve_media_asset('video/mp4', 4000000, 720, 1280, 'ritual_completion', 9000) $$,
  '23514',
  'Videos must be 5 seconds or shorter',
  'media: videos longer than 5 seconds are rejected'
);

select throws_ok(
  $$ select * from public.reserve_media_asset('video/mp4', 40000000, 720, 1280, 'ritual_completion', 5000) $$,
  '23514',
  'Video size must be positive and 30 MB or smaller',
  'media: videos over 30 MB are rejected'
);

select throws_ok(
  $$ select * from public.reserve_media_asset('video/mp4', 4000000, 720, 1280, 'profile_avatar', 5000) $$,
  '23514',
  'Videos can only be added to rituals or memory capsules',
  'media: videos cannot be used as a profile photo'
);

select throws_ok(
  $$
    select * from public.complete_ritual(
      '40000000-0000-4000-8000-000000000701',
      null,
      null,
      array[
        '50000000-0000-4000-8000-000000000701',
        '50000000-0000-4000-8000-000000000702',
        '50000000-0000-4000-8000-000000000703',
        '50000000-0000-4000-8000-000000000704',
        '50000000-0000-4000-8000-000000000705',
        '50000000-0000-4000-8000-000000000706'
      ]::uuid[]
    )
  $$,
  '23514',
  'You can add up to 5 photos or videos',
  'media: an answer holds at most 5 photos or videos'
);

select throws_ok(
  $$
    select * from public.complete_ritual(
      '40000000-0000-4000-8000-000000000701',
      null,
      null,
      array['50000000-0000-4000-8000-000000000708']::uuid[]
    )
  $$,
  '23514',
  'Ritual media must be uploaded by you',
  'media: a partner''s upload cannot be attached to your answer'
);

select lives_ok(
  $$
    select * from public.complete_ritual(
      '40000000-0000-4000-8000-000000000701',
      'Three moments',
      null,
      array[
        '50000000-0000-4000-8000-000000000703',
        '50000000-0000-4000-8000-000000000707',
        '50000000-0000-4000-8000-000000000701'
      ]::uuid[]
    )
  $$,
  'media: an answer can include several photos and a video'
);

reset role;

select is(
  (
    select string_agg(right(id::text, 3) || '@' || sort_order, ',' order by sort_order)
    from public.media_assets
    where ritual_completion_id = (
      select id from public.ritual_completions
      where couple_ritual_id = '40000000-0000-4000-8000-000000000701'
        and user_id = '00000000-0000-4000-8000-000000000701'
    )
  ),
  '703@0,707@1,701@2',
  'media: attached items keep the order they were added in'
);

select is(
  (
    select media_asset_id from public.ritual_completions
    where couple_ritual_id = '40000000-0000-4000-8000-000000000701'
      and user_id = '00000000-0000-4000-8000-000000000701'
  ),
  '50000000-0000-4000-8000-000000000703'::uuid,
  'media: the first item is kept in media_asset_id for older app versions'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000702', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*) from public.media_assets where id in ('50000000-0000-4000-8000-000000000703', '50000000-0000-4000-8000-000000000707')),
  0::bigint,
  'media: a partner cannot see answer photos or videos before the reveal'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000701', true);

select lives_ok(
  $$
    select * from public.complete_ritual(
      '40000000-0000-4000-8000-000000000701',
      'Just the video',
      null,
      array['50000000-0000-4000-8000-000000000707']::uuid[]
    )
  $$,
  'media: editing an answer can remove photos'
);

reset role;

select is(
  (
    select count(*) from public.media_assets
    where id in ('50000000-0000-4000-8000-000000000701', '50000000-0000-4000-8000-000000000703')
      and ritual_completion_id is null
  ),
  2::bigint,
  'media: photos removed from an answer are detached from it'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000702', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$ select * from public.complete_ritual('40000000-0000-4000-8000-000000000701', 'My answer', null, null) $$,
  'media: the partner completes the ritual'
);

select is(
  (
    select string_agg(right(id::text, 3), ',' order by id)
    from public.media_assets
    where id in ('50000000-0000-4000-8000-000000000701', '50000000-0000-4000-8000-000000000707')
  ),
  '707',
  'media: after the reveal the partner sees attached items but not detached ones'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000701', true);

select throws_ok(
  $$
    select * from public.create_memory_capsule(
      'Reused video',
      'Note',
      now() + interval '2 days',
      null,
      null,
      array['50000000-0000-4000-8000-000000000707']::uuid[]
    )
  $$,
  '23514',
  'Memory capsule media is already attached elsewhere',
  'media: an item already in an answer cannot be reused in a capsule'
);

select is(
  (
    select count(*)
    from public.create_memory_capsule(
      'Two photos',
      null,
      now() + interval '2 days',
      null,
      null,
      array['50000000-0000-4000-8000-000000000704', '50000000-0000-4000-8000-000000000705']::uuid[]
    )
  ),
  1::bigint,
  'media: a capsule can hold several photos without a note'
);

select is(
  (
    select count(*)
    from public.create_memory_capsule('Single photo', null, now() + interval '2 days', null, '50000000-0000-4000-8000-000000000706')
  ),
  1::bigint,
  'media: older app versions can still attach a single photo'
);

reset role;

select * from finish();
rollback;
