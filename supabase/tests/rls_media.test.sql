begin;

create extension if not exists pgtap with schema extensions;

select plan(7);

insert into auth.users (id)
values
  ('00000000-0000-4000-8000-000000000501'),
  ('00000000-0000-4000-8000-000000000502'),
  ('00000000-0000-4000-8000-000000000503');

insert into public.couples (id, created_by, status)
values ('10000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000501', 'active');

insert into public.couple_members (id, couple_id, user_id, role, status)
values
  ('20000000-0000-4000-8000-000000000501', '10000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000501', 'partner', 'active'),
  ('20000000-0000-4000-8000-000000000502', '10000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000502', 'partner', 'active');

insert into public.ritual_templates (id, title, description, category, prompt, input_type, is_active)
values
  ('30000000-0000-4000-8000-000000000501', 'Media Ritual Template', 'Template for media RLS', 'daily_checkin', 'Share something visual', 'text_or_photo', true);

insert into public.couple_rituals (id, couple_id, ritual_template_id, scheduled_for, status)
values
  ('40000000-0000-4000-8000-000000000501', '10000000-0000-4000-8000-000000000501', '30000000-0000-4000-8000-000000000501', current_date, 'scheduled'),
  ('40000000-0000-4000-8000-000000000502', '10000000-0000-4000-8000-000000000501', '30000000-0000-4000-8000-000000000501', current_date + 1, 'completed');

insert into public.media_assets (
  id,
  couple_id,
  owner_id,
  storage_path,
  media_type,
  mime_type,
  size_bytes,
  width,
  height,
  purpose,
  upload_status,
  uploaded_at
)
values
  (
    '50000000-0000-4000-8000-000000000501',
    '10000000-0000-4000-8000-000000000501',
    '00000000-0000-4000-8000-000000000501',
    '10000000-0000-4000-8000-000000000501/00000000-0000-4000-8000-000000000501/50000000-0000-4000-8000-000000000501.jpg',
    'image',
    'image/jpeg',
    1000,
    100,
    100,
    'attachment',
    'uploaded',
    now()
  ),
  (
    '50000000-0000-4000-8000-000000000502',
    '10000000-0000-4000-8000-000000000501',
    '00000000-0000-4000-8000-000000000501',
    '10000000-0000-4000-8000-000000000501/00000000-0000-4000-8000-000000000501/50000000-0000-4000-8000-000000000502.jpg',
    'image',
    'image/jpeg',
    1000,
    100,
    100,
    'ritual_completion',
    'uploaded',
    now()
  ),
  (
    '50000000-0000-4000-8000-000000000503',
    '10000000-0000-4000-8000-000000000501',
    '00000000-0000-4000-8000-000000000501',
    '10000000-0000-4000-8000-000000000501/00000000-0000-4000-8000-000000000501/50000000-0000-4000-8000-000000000503.jpg',
    'image',
    'image/jpeg',
    1000,
    100,
    100,
    'ritual_completion',
    'uploaded',
    now()
  ),
  (
    '50000000-0000-4000-8000-000000000504',
    '10000000-0000-4000-8000-000000000501',
    '00000000-0000-4000-8000-000000000501',
    '10000000-0000-4000-8000-000000000501/00000000-0000-4000-8000-000000000501/50000000-0000-4000-8000-000000000504.jpg',
    'image',
    'image/jpeg',
    1000,
    100,
    100,
    'memory_capsule_content',
    'uploaded',
    now()
  ),
  (
    '50000000-0000-4000-8000-000000000505',
    '10000000-0000-4000-8000-000000000501',
    '00000000-0000-4000-8000-000000000501',
    '10000000-0000-4000-8000-000000000501/00000000-0000-4000-8000-000000000501/50000000-0000-4000-8000-000000000505.jpg',
    'image',
    'image/jpeg',
    1000,
    100,
    100,
    'memory_capsule_content',
    'uploaded',
    now()
  );

insert into public.ritual_completions (id, couple_ritual_id, user_id, text_response, media_asset_id)
values
  ('60000000-0000-4000-8000-000000000501', '40000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000501', 'Owner unrevealed', '50000000-0000-4000-8000-000000000502'),
  ('60000000-0000-4000-8000-000000000502', '40000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000501', 'Owner revealed', '50000000-0000-4000-8000-000000000503'),
  ('60000000-0000-4000-8000-000000000503', '40000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000502', 'Partner revealed', null);

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
    '70000000-0000-4000-8000-000000000501',
    '10000000-0000-4000-8000-000000000501',
    '00000000-0000-4000-8000-000000000501',
    'Locked media capsule',
    'date',
    now() + interval '1 day',
    null,
    null,
    null
  ),
  (
    '70000000-0000-4000-8000-000000000502',
    '10000000-0000-4000-8000-000000000501',
    '00000000-0000-4000-8000-000000000501',
    'Opened media capsule',
    'date',
    now() - interval '1 day',
    null,
    '00000000-0000-4000-8000-000000000502',
    now() - interval '1 hour'
  );

insert into public.memory_capsule_contents (capsule_id, note, media_asset_id)
values
  ('70000000-0000-4000-8000-000000000501', 'Locked media note', '50000000-0000-4000-8000-000000000504'),
  ('70000000-0000-4000-8000-000000000502', 'Opened media note', '50000000-0000-4000-8000-000000000505');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000501', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*) from public.media_assets where id = '50000000-0000-4000-8000-000000000501'),
  1::bigint,
  'media: owner can read own uploaded media'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000502', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*) from public.media_assets where id = '50000000-0000-4000-8000-000000000502'),
  0::bigint,
  'media: partner cannot read unrevealed ritual media'
);

select is(
  (select count(*) from public.media_assets where id = '50000000-0000-4000-8000-000000000503'),
  1::bigint,
  'media: partner can read ritual media after reveal'
);

select is(
  (select count(*) from public.media_assets where id = '50000000-0000-4000-8000-000000000504'),
  0::bigint,
  'media: partner cannot read locked capsule media'
);

select is(
  (select count(*) from public.media_assets where id = '50000000-0000-4000-8000-000000000505'),
  1::bigint,
  'media: partner can read capsule media after unlock/open'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000503', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*) from public.media_assets where id = '50000000-0000-4000-8000-000000000503'),
  0::bigint,
  'media: third user cannot read couple media'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000502', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select ok(
  coalesce(
    private.storage_object_path_matches_media_asset_fields(
      'not/a/uuid-path',
      '10000000-0000-4000-8000-000000000501',
      '00000000-0000-4000-8000-000000000501',
      '50000000-0000-4000-8000-000000000501'
    ),
    false
  ) = false,
  'media: storage path helper is not truthy for malformed paths'
);

reset role;

select * from finish();
rollback;
