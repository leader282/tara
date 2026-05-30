insert into storage.buckets (id, name, public)
values ('couple-media', 'couple-media', false)
on conflict (id) do update
set name = excluded.name,
    public = false;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'storage'
      and table_name = 'buckets'
      and column_name = 'allowed_mime_types'
  ) then
    execute $sql$
      update storage.buckets
      set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']::text[]
      where id = $1
    $sql$ using 'couple-media';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'storage'
      and table_name = 'buckets'
      and column_name = 'file_size_limit'
  ) then
    execute $sql$
      update storage.buckets
      set file_size_limit = 10485760
      where id = $1
    $sql$ using 'couple-media';
  end if;
end;
$$;

create or replace function private.try_parse_uuid(value text)
returns uuid
language sql
immutable
strict
set search_path = ''
as $$
  select case
    when value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then value::uuid
    else null
  end;
$$;

create or replace function private.storage_object_path_segment(
  object_name text,
  segment_number integer
)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select case
    when cardinality(string_to_array(object_name, '/')) = 3
      then (string_to_array(object_name, '/'))[segment_number]
    else null
  end;
$$;

create or replace function private.storage_object_couple_id(object_name text)
returns uuid
language sql
immutable
strict
set search_path = ''
as $$
  select private.try_parse_uuid(private.storage_object_path_segment(object_name, 1));
$$;

create or replace function private.storage_object_owner_id(object_name text)
returns uuid
language sql
immutable
strict
set search_path = ''
as $$
  select private.try_parse_uuid(private.storage_object_path_segment(object_name, 2));
$$;

create or replace function private.storage_object_media_asset_id(object_name text)
returns uuid
language sql
immutable
strict
set search_path = ''
as $$
  select private.try_parse_uuid(private.storage_object_path_segment(object_name, 3));
$$;

create or replace function private.storage_object_path_matches_media_asset_fields(
  object_name text,
  target_couple_id uuid,
  target_owner_id uuid,
  target_media_asset_id uuid
)
returns boolean
language sql
stable
strict
security definer
set search_path = ''
as $$
  select target_couple_id is not null
    and target_owner_id is not null
    and target_media_asset_id is not null
    and private.storage_object_couple_id(object_name) = target_couple_id
    and private.storage_object_owner_id(object_name) = target_owner_id
    and private.storage_object_media_asset_id(object_name) = target_media_asset_id;
$$;

create or replace function private.storage_object_matches_media_asset(
  object_name text,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_user_id is not null
    and exists (
      select 1
      from public.media_assets ma
      where ma.storage_path = object_name
        and ma.id = private.storage_object_media_asset_id(object_name)
        and ma.couple_id = private.storage_object_couple_id(object_name)
        and ma.owner_id = private.storage_object_owner_id(object_name)
        and ma.owner_id = target_user_id
        and private.is_active_couple_member(ma.couple_id, target_user_id)
    );
$$;

create or replace function private.storage_object_is_readable(
  object_name text,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_user_id is not null
    and exists (
      select 1
      from public.media_assets ma
      where ma.storage_path = object_name
        and ma.id = private.storage_object_media_asset_id(object_name)
        and ma.couple_id = private.storage_object_couple_id(object_name)
        and ma.owner_id = private.storage_object_owner_id(object_name)
        and private.is_active_couple_member(ma.couple_id, target_user_id)
        and (
          ma.owner_id = target_user_id
          or exists (
            select 1
            from public.memory_capsule_contents mcc
            join public.memory_capsules mc
              on mc.id = mcc.capsule_id
            where mcc.media_asset_id = ma.id
              and mc.couple_id = ma.couple_id
              and mc.opened_at is not null
          )
        )
    );
$$;

drop policy if exists media_assets_insert_owner_active_member
on public.media_assets;

create policy media_assets_insert_owner_active_member
on public.media_assets
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and private.is_active_couple_member(couple_id)
  and private.storage_object_path_matches_media_asset_fields(
    storage_path,
    couple_id,
    owner_id,
    id
  )
);

drop policy if exists media_assets_update_owner
on public.media_assets;

create policy media_assets_update_owner
on public.media_assets
for update
to authenticated
using (
  owner_id = (select auth.uid())
  and private.is_active_couple_member(couple_id)
)
with check (
  owner_id = (select auth.uid())
  and private.is_active_couple_member(couple_id)
  and private.storage_object_path_matches_media_asset_fields(
    storage_path,
    couple_id,
    owner_id,
    id
  )
);

create policy couple_media_objects_select_active_members
on storage.objects
for select
to authenticated
using (
  bucket_id = 'couple-media'
  and private.storage_object_is_readable(name)
);

create policy couple_media_objects_insert_owner_active_member
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'couple-media'
  and private.storage_object_matches_media_asset(name)
);

create policy couple_media_objects_update_owner_active_member
on storage.objects
for update
to authenticated
using (
  bucket_id = 'couple-media'
  and private.storage_object_matches_media_asset(name)
)
with check (
  bucket_id = 'couple-media'
  and private.storage_object_matches_media_asset(name)
);

revoke all on function private.try_parse_uuid(text) from public;
revoke all on function private.storage_object_path_segment(text, integer) from public;
revoke all on function private.storage_object_couple_id(text) from public;
revoke all on function private.storage_object_owner_id(text) from public;
revoke all on function private.storage_object_media_asset_id(text) from public;
revoke all on function private.storage_object_path_matches_media_asset_fields(text, uuid, uuid, uuid) from public;
revoke all on function private.storage_object_matches_media_asset(text, uuid) from public;
revoke all on function private.storage_object_is_readable(text, uuid) from public;

grant execute on function private.storage_object_path_matches_media_asset_fields(text, uuid, uuid, uuid) to authenticated;
grant execute on function private.storage_object_matches_media_asset(text, uuid) to authenticated;
grant execute on function private.storage_object_is_readable(text, uuid) to authenticated;
