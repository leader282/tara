begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

insert into auth.users (id)
values
  ('00000000-0000-4000-8000-000000000801'),
  ('00000000-0000-4000-8000-000000000802');

insert into public.couples (id, created_by, status)
values ('10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000801', 'active');

insert into public.couple_members (id, couple_id, user_id, role, status)
values
  ('20000000-0000-4000-8000-000000000801', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000801', 'partner', 'active'),
  ('20000000-0000-4000-8000-000000000802', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000802', 'partner', 'active');

insert into public.ritual_templates (id, title, description, category, prompt, input_type, is_active)
values ('30000000-0000-4000-8000-000000000801', 'Retention ritual', 'Template for retention tests', 'daily_checkin', 'How was today?', 'text_or_photo', true);

-- Today's ritual and the seven days before it; ritual 80N is N days old.
insert into public.couple_rituals (id, couple_id, ritual_template_id, scheduled_for, status)
select
  format('40000000-0000-4000-8000-%s', lpad((800 + days_ago)::text, 12, '0'))::uuid,
  '10000000-0000-4000-8000-000000000801',
  '30000000-0000-4000-8000-000000000801',
  (now() at time zone 'utc')::date - days_ago,
  'completed'
from generate_series(0, 7) as days_ago;

insert into public.ritual_completions (id, couple_ritual_id, user_id, text_response)
values
  ('60000000-0000-4000-8000-000000000806', '40000000-0000-4000-8000-000000000806', '00000000-0000-4000-8000-000000000801', 'Six days ago'),
  ('60000000-0000-4000-8000-000000000807', '40000000-0000-4000-8000-000000000807', '00000000-0000-4000-8000-000000000801', 'A week ago'),
  ('60000000-0000-4000-8000-000000000805', '40000000-0000-4000-8000-000000000805', '00000000-0000-4000-8000-000000000801', 'Five days ago');

insert into public.memory_capsules (id, couple_id, creator_id, title, unlock_type, unlock_at)
values ('70000000-0000-4000-8000-000000000801', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000801', 'Kept capsule', 'date', now() + interval '1 day');

insert into public.media_assets (id, couple_id, owner_id, storage_path, media_type, mime_type, size_bytes, purpose, upload_status, uploaded_at, created_at, ritual_completion_id, memory_capsule_id)
values
  -- Attached to rituals that age out.
  ('50000000-0000-4000-8000-000000000801', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000801', 'retention/801.jpg', 'image', 'image/jpeg', 1000, 'ritual_completion', 'uploaded', now(), now() - interval '6 days', '60000000-0000-4000-8000-000000000806', null),
  ('50000000-0000-4000-8000-000000000802', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000801', 'retention/802.mp4', 'video', 'video/mp4', 1000, 'ritual_completion', 'uploaded', now(), now() - interval '7 days', '60000000-0000-4000-8000-000000000807', null),
  -- Attached to a ritual that stays.
  ('50000000-0000-4000-8000-000000000803', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000801', 'retention/803.jpg', 'image', 'image/jpeg', 1000, 'ritual_completion', 'uploaded', now(), now() - interval '5 days', '60000000-0000-4000-8000-000000000805', null),
  -- Attached to a capsule.
  ('50000000-0000-4000-8000-000000000804', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000801', 'retention/804.jpg', 'image', 'image/jpeg', 1000, 'memory_capsule_content', 'uploaded', now(), now() - interval '30 days', null, '70000000-0000-4000-8000-000000000801'),
  -- Uploaded for an answer that was never sent, two days ago and one hour ago.
  ('50000000-0000-4000-8000-000000000805', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000801', 'retention/805.jpg', 'image', 'image/jpeg', 1000, 'ritual_completion', 'uploaded', now(), now() - interval '2 days', null, null),
  ('50000000-0000-4000-8000-000000000806', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000801', 'retention/806.jpg', 'image', 'image/jpeg', 1000, 'ritual_completion', 'uploaded', now(), now() - interval '1 hour', null, null),
  -- A profile photo and an upload that never finished.
  ('50000000-0000-4000-8000-000000000807', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000801', 'retention/807.jpg', 'image', 'image/jpeg', 1000, 'profile_avatar', 'uploaded', now(), now() - interval '2 days', null, null),
  ('50000000-0000-4000-8000-000000000808', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000801', 'retention/808.jpg', 'image', 'image/jpeg', null, 'attachment', 'pending', null, now() - interval '2 days', null, null);

insert into public.timeline_items (id, couple_id, actor_id, type, title, payload, created_at)
values
  ('80000000-0000-4000-8000-000000000801', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000801', 'presence_sent', 'Old pulse', '{}', now() - interval '10 days'),
  ('80000000-0000-4000-8000-000000000802', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000801', 'presence_sent', 'Recent pulse', '{}', now() - interval '2 days'),
  ('80000000-0000-4000-8000-000000000803', '10000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000801', 'ritual_completed', 'Completed today''s ritual', '{"couple_ritual_id": "40000000-0000-4000-8000-000000000806"}', now() - interval '1 day');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000801', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select throws_ok(
  $$ select * from public.prune_couple_history() $$,
  '42501',
  null,
  'retention: partners cannot run the cleanup themselves'
);

reset role;

select is(
  (select row(deleted_rituals, deleted_timeline_items, deleted_media, queued_files)::text from public.prune_couple_history()),
  '(2,2,4,4)',
  'retention: the cleanup reports what it removed'
);

select is(
  (
    select string_agg(right(id::text, 1), '' order by scheduled_for desc)
    from public.couple_rituals
    where couple_id = '10000000-0000-4000-8000-000000000801'
  ),
  '012345',
  'retention: today''s ritual and the five before it are kept'
);

select is(
  (select count(*) from public.ritual_completions where id in ('60000000-0000-4000-8000-000000000806', '60000000-0000-4000-8000-000000000807')),
  0::bigint,
  'retention: answers to removed rituals are deleted'
);

select is(
  (
    select string_agg(right(id::text, 1), '' order by id)
    from public.media_assets
    where couple_id = '10000000-0000-4000-8000-000000000801'
  ),
  '3467',
  'retention: kept answers, capsules, profile photos, and fresh uploads keep their media'
);

select is(
  (select string_agg(storage_path, ',' order by storage_path) from private.storage_cleanup_queue),
  'retention/801.jpg,retention/802.mp4,retention/805.jpg,retention/808.jpg',
  'retention: files of removed media are queued for deletion'
);

select is(
  (
    select string_agg(right(id::text, 1), '' order by id)
    from public.timeline_items
    where couple_id = '10000000-0000-4000-8000-000000000801'
  ),
  '2',
  'retention: the timeline keeps only the last 7 days and drops moments for removed rituals'
);

set local role service_role;

select is(
  (select count(*) from public.claim_storage_cleanup_batch(3)),
  3::bigint,
  'retention: queued files are handed out in batches'
);

select is(
  public.complete_storage_cleanup(array['retention/801.jpg', 'retention/802.mp4']),
  2,
  'retention: deleted files are cleared from the queue'
);

reset role;

select is(
  (select string_agg(storage_path || ':' || attempts, ',' order by storage_path) from private.storage_cleanup_queue),
  'retention/805.jpg:1,retention/808.jpg:0',
  'retention: files still waiting keep their attempt count'
);

select * from finish();
rollback;
