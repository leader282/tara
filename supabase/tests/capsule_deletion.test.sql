begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

insert into auth.users (id)
values
  ('00000000-0000-4000-8000-000000000901'),
  ('00000000-0000-4000-8000-000000000902'),
  ('00000000-0000-4000-8000-000000000903');

insert into public.couples (id, created_by, status)
values ('10000000-0000-4000-8000-000000000901', '00000000-0000-4000-8000-000000000901', 'active');

insert into public.couple_members (id, couple_id, user_id, role, status)
values
  ('20000000-0000-4000-8000-000000000901', '10000000-0000-4000-8000-000000000901', '00000000-0000-4000-8000-000000000901', 'partner', 'active'),
  ('20000000-0000-4000-8000-000000000902', '10000000-0000-4000-8000-000000000901', '00000000-0000-4000-8000-000000000902', 'partner', 'active');

insert into public.memory_capsules (id, couple_id, creator_id, title, unlock_type, unlock_at)
values
  ('70000000-0000-4000-8000-000000000901', '10000000-0000-4000-8000-000000000901', '00000000-0000-4000-8000-000000000901', 'Deleted capsule', 'date', now() + interval '1 day'),
  ('70000000-0000-4000-8000-000000000902', '10000000-0000-4000-8000-000000000901', '00000000-0000-4000-8000-000000000901', 'Kept capsule', 'date', now() + interval '1 day');

insert into public.media_assets (id, couple_id, owner_id, storage_path, media_type, mime_type, size_bytes, purpose, upload_status, uploaded_at, memory_capsule_id, sort_order)
values
  ('50000000-0000-4000-8000-000000000901', '10000000-0000-4000-8000-000000000901', '00000000-0000-4000-8000-000000000901', 'deletion/901.jpg', 'image', 'image/jpeg', 1000, 'memory_capsule_content', 'uploaded', now(), '70000000-0000-4000-8000-000000000901', 0),
  ('50000000-0000-4000-8000-000000000902', '10000000-0000-4000-8000-000000000901', '00000000-0000-4000-8000-000000000901', 'deletion/902.mp4', 'video', 'video/mp4', 1000, 'memory_capsule_content', 'uploaded', now(), '70000000-0000-4000-8000-000000000901', 1),
  ('50000000-0000-4000-8000-000000000903', '10000000-0000-4000-8000-000000000901', '00000000-0000-4000-8000-000000000901', 'deletion/903.jpg', 'image', 'image/jpeg', 1000, 'memory_capsule_content', 'uploaded', now(), '70000000-0000-4000-8000-000000000902', 0);

insert into public.memory_capsule_contents (capsule_id, note, media_asset_id)
values
  ('70000000-0000-4000-8000-000000000901', 'Gone soon', '50000000-0000-4000-8000-000000000901'),
  ('70000000-0000-4000-8000-000000000902', 'Staying', '50000000-0000-4000-8000-000000000903');

insert into public.timeline_items (id, couple_id, actor_id, type, title, payload)
values
  ('80000000-0000-4000-8000-000000000901', '10000000-0000-4000-8000-000000000901', '00000000-0000-4000-8000-000000000901', 'capsule_created', 'Created a memory capsule', '{"capsule_id": "70000000-0000-4000-8000-000000000901"}'),
  ('80000000-0000-4000-8000-000000000902', '10000000-0000-4000-8000-000000000901', '00000000-0000-4000-8000-000000000901', 'capsule_created', 'Created a memory capsule', '{"capsule_id": "70000000-0000-4000-8000-000000000902"}');

insert into public.notification_queue (id, recipient_user_id, couple_id, type, source_table, source_id, title, body)
values ('90000000-0000-4000-8000-000000000901', '00000000-0000-4000-8000-000000000902', '10000000-0000-4000-8000-000000000901', 'capsule_unlocked', 'memory_capsules', '70000000-0000-4000-8000-000000000901', 'Ready', 'Open it');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000902', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select throws_ok(
  $$ select public.delete_memory_capsule('70000000-0000-4000-8000-000000000901') $$,
  '42501',
  'Only the partner who made this capsule can delete it',
  'capsule deletion: the partner who didn''t make it cannot delete it'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000903', true);

select throws_ok(
  $$ select public.delete_memory_capsule('70000000-0000-4000-8000-000000000901') $$,
  'P0002',
  'Memory capsule not found',
  'capsule deletion: someone outside the couple cannot find it'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000901', true);

select is(
  public.delete_memory_capsule('70000000-0000-4000-8000-000000000901'),
  '70000000-0000-4000-8000-000000000901'::uuid,
  'capsule deletion: the partner who made it can delete it'
);

reset role;

select is(
  (select string_agg(title, ',') from public.memory_capsules where couple_id = '10000000-0000-4000-8000-000000000901'),
  'Kept capsule',
  'capsule deletion: only that capsule is deleted'
);

select is(
  (select count(*) from public.memory_capsule_contents where capsule_id = '70000000-0000-4000-8000-000000000901'),
  0::bigint,
  'capsule deletion: its note is deleted'
);

select is(
  (select string_agg(right(id::text, 3), ',' order by id) from public.media_assets where couple_id = '10000000-0000-4000-8000-000000000901'),
  '903',
  'capsule deletion: its photos and videos are deleted'
);

select is(
  (select string_agg(storage_path, ',' order by storage_path) from private.storage_cleanup_queue where storage_path like 'deletion/%'),
  'deletion/901.jpg,deletion/902.mp4',
  'capsule deletion: their files are queued for removal'
);

select is(
  (select string_agg(right(id::text, 3), ',') from public.timeline_items where couple_id = '10000000-0000-4000-8000-000000000901'),
  '902',
  'capsule deletion: its timeline moments are deleted'
);

select is(
  (select status || ':' || failure_code from public.notification_queue where id = '90000000-0000-4000-8000-000000000901'),
  'skipped:source_deleted',
  'capsule deletion: its pending unlock notification is skipped'
);

select * from finish();
rollback;
