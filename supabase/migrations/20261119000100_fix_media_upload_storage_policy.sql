-- The upload policy looked up the pending media_assets reservation as the uploading user,
-- but media_assets RLS only exposes uploaded assets, so every photo upload was rejected.
-- Check the reservation through a security definer helper instead.
create or replace function private.can_upload_media_storage_path(
  target_storage_path text,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_user_id is not null
    and target_storage_path is not null
    and exists (
      select 1
      from public.media_assets ma
      where ma.storage_path = target_storage_path
        and ma.owner_id = target_user_id
        and ma.upload_status = 'pending'
        and private.is_active_couple_member(ma.couple_id, target_user_id)
    );
$$;

revoke all on function private.can_upload_media_storage_path(text, uuid) from public;
grant execute on function private.can_upload_media_storage_path(text, uuid) to authenticated;

drop policy if exists couple_media_objects_insert_reserved_pending_owner
on storage.objects;

create policy couple_media_objects_insert_reserved_pending_owner
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'couple-media'
  and private.can_upload_media_storage_path(name)
);
