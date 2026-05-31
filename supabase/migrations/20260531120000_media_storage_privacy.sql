-- Phase 11B: media storage privacy, workflow RPCs, and stricter media RLS.

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
      set file_size_limit = 5242880
      where id = $1
    $sql$ using 'couple-media';
  end if;
end;
$$;

alter table public.media_assets
  add column if not exists upload_status text not null default 'pending',
  add column if not exists uploaded_at timestamptz,
  add column if not exists width integer,
  add column if not exists height integer,
  add column if not exists purpose text not null default 'attachment';

alter table public.media_assets
  drop constraint if exists media_assets_upload_status_check,
  drop constraint if exists media_assets_purpose_check,
  drop constraint if exists media_assets_width_check,
  drop constraint if exists media_assets_height_check,
  drop constraint if exists media_assets_size_bytes_check;

alter table public.media_assets
  add constraint media_assets_upload_status_check
    check (upload_status in ('pending', 'uploaded', 'failed')),
  add constraint media_assets_purpose_check
    check (purpose in ('ritual_completion', 'memory_capsule_content', 'shared_moment', 'profile_avatar', 'attachment')),
  add constraint media_assets_width_check
    check (width is null or width > 0),
  add constraint media_assets_height_check
    check (height is null or height > 0),
  add constraint media_assets_size_bytes_check
    check (size_bytes is null or size_bytes > 0);

create or replace function private.is_media_owner(
  target_media_asset_id uuid,
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
      where ma.id = target_media_asset_id
        and ma.owner_id = target_user_id
        and private.is_active_couple_member(ma.couple_id, target_user_id)
    );
$$;

create or replace function private.is_uploaded_media_owned_by_user(
  target_media_asset_id uuid,
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
      where ma.id = target_media_asset_id
        and ma.owner_id = target_user_id
        and ma.upload_status = 'uploaded'
        and private.is_active_couple_member(ma.couple_id, target_user_id)
    );
$$;

create or replace function private.can_read_media_asset(
  target_media_asset_id uuid,
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
      where ma.id = target_media_asset_id
        and ma.upload_status = 'uploaded'
        and (
          (
            ma.owner_id = target_user_id
            and private.is_active_couple_member(ma.couple_id, target_user_id)
          )
          or exists (
            select 1
            from public.ritual_completions rc
            join public.couple_rituals cr
              on cr.id = rc.couple_ritual_id
            where rc.media_asset_id = ma.id
              and cr.couple_id = ma.couple_id
              and private.is_active_couple_member(cr.couple_id, target_user_id)
              and (
                cr.status = 'completed'
                or private.ritual_is_revealed(cr.id)
              )
          )
          or exists (
            select 1
            from public.memory_capsule_contents mcc
            join public.memory_capsules mc
              on mc.id = mcc.capsule_id
            where mcc.media_asset_id = ma.id
              and mc.couple_id = ma.couple_id
              and (
                mc.creator_id = target_user_id
                or (
                  private.is_active_couple_member(mc.couple_id, target_user_id)
                  and mc.opened_at is not null
                )
              )
          )
        )
    );
$$;

create or replace function private.can_read_media_storage_path(
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
        and private.can_read_media_asset(ma.id, target_user_id)
    );
$$;

create or replace function public.reserve_media_asset(
  p_mime_type text,
  p_size_bytes bigint default null,
  p_width integer default null,
  p_height integer default null,
  p_purpose text default 'attachment'
)
returns table (
  id uuid,
  couple_id uuid,
  owner_id uuid,
  storage_path text,
  media_type text,
  mime_type text,
  size_bytes bigint,
  width integer,
  height integer,
  purpose text,
  upload_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_couple_id uuid;
  v_active_couple_count integer;
  v_active_member_count integer;
  v_mime_type text := lower(btrim(coalesce(p_mime_type, '')));
  v_purpose text := lower(btrim(coalesce(p_purpose, 'attachment')));
  v_extension text;
  v_media_asset_id uuid := extensions.gen_random_uuid();
  v_storage_path text;
  v_media_asset public.media_assets%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  if v_mime_type not in ('image/jpeg', 'image/png', 'image/webp') then
    raise exception 'Only JPEG, PNG, or WEBP images are supported'
      using errcode = '23514';
  end if;

  if p_size_bytes is not null and (p_size_bytes <= 0 or p_size_bytes > 5242880) then
    raise exception 'Image size must be positive and 5 MB or smaller'
      using errcode = '23514';
  end if;

  if p_width is not null and p_width <= 0 then
    raise exception 'Image width must be a positive integer'
      using errcode = '23514';
  end if;

  if p_height is not null and p_height <= 0 then
    raise exception 'Image height must be a positive integer'
      using errcode = '23514';
  end if;

  if v_purpose not in ('ritual_completion', 'memory_capsule_content', 'shared_moment', 'profile_avatar', 'attachment') then
    raise exception 'Unsupported media purpose'
      using errcode = '23514';
  end if;

  select count(*)::integer
  into v_active_couple_count
  from public.couple_members cm
  join public.couples c
    on c.id = cm.couple_id
  where cm.user_id = v_user_id
    and cm.status = 'active'
    and c.status = 'active';

  if v_active_couple_count = 0 then
    raise exception 'Active couple required'
      using errcode = '23514';
  end if;

  if v_active_couple_count > 1 then
    raise exception 'Expected exactly one active couple'
      using errcode = '23514';
  end if;

  select cm.couple_id
  into v_couple_id
  from public.couple_members cm
  join public.couples c
    on c.id = cm.couple_id
  where cm.user_id = v_user_id
    and cm.status = 'active'
    and c.status = 'active'
  limit 1;

  select count(*)::integer
  into v_active_member_count
  from public.couple_members cm
  where cm.couple_id = v_couple_id
    and cm.status = 'active';

  if v_active_member_count < 2 then
    raise exception 'Media uploads require a paired couple'
      using errcode = '23514';
  end if;

  if v_active_member_count > 2 then
    raise exception 'Couple membership exceeded two active partners'
      using errcode = '23514';
  end if;

  v_extension := case v_mime_type
    when 'image/jpeg' then 'jpg'
    when 'image/png' then 'png'
    when 'image/webp' then 'webp'
    else null
  end;

  v_storage_path := format('%s/%s/%s.%s', v_couple_id, v_user_id, v_media_asset_id, v_extension);

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
    upload_status
  )
  values (
    v_media_asset_id,
    v_couple_id,
    v_user_id,
    v_storage_path,
    'image',
    v_mime_type,
    p_size_bytes,
    p_width,
    p_height,
    v_purpose,
    'pending'
  )
  returning *
  into v_media_asset;

  return query
  select
    v_media_asset.id,
    v_media_asset.couple_id,
    v_media_asset.owner_id,
    v_media_asset.storage_path,
    v_media_asset.media_type,
    v_media_asset.mime_type,
    v_media_asset.size_bytes,
    v_media_asset.width,
    v_media_asset.height,
    v_media_asset.purpose,
    v_media_asset.upload_status;
end;
$$;

create or replace function public.mark_media_asset_uploaded(
  p_media_asset_id uuid,
  p_size_bytes bigint,
  p_width integer default null,
  p_height integer default null
)
returns setof public.media_assets
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_media_asset public.media_assets%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  if p_size_bytes is null or p_size_bytes <= 0 or p_size_bytes > 5242880 then
    raise exception 'Image size must be positive and 5 MB or smaller'
      using errcode = '23514';
  end if;

  if p_width is not null and p_width <= 0 then
    raise exception 'Image width must be a positive integer'
      using errcode = '23514';
  end if;

  if p_height is not null and p_height <= 0 then
    raise exception 'Image height must be a positive integer'
      using errcode = '23514';
  end if;

  select *
  into v_media_asset
  from public.media_assets ma
  where ma.id = p_media_asset_id
  for update;

  if not found then
    raise exception 'Media asset not found'
      using errcode = 'P0002';
  end if;

  if v_media_asset.owner_id <> v_user_id
    or not private.is_active_couple_member(v_media_asset.couple_id, v_user_id)
  then
    raise exception 'Media asset not found'
      using errcode = 'P0002';
  end if;

  if v_media_asset.upload_status <> 'pending' then
    raise exception 'Media asset is not pending upload'
      using errcode = '23514';
  end if;

  update public.media_assets as ma
  set upload_status = 'uploaded',
      uploaded_at = now(),
      size_bytes = p_size_bytes,
      width = p_width,
      height = p_height
  where ma.id = p_media_asset_id
  returning ma.*
  into v_media_asset;

  return query
  select v_media_asset.*;
end;
$$;

create or replace function public.mark_media_asset_failed(
  p_media_asset_id uuid
)
returns table (
  id uuid,
  upload_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  return query
  update public.media_assets as ma
  set upload_status = 'failed',
      uploaded_at = null
  where ma.id = p_media_asset_id
    and ma.owner_id = v_user_id
    and private.is_active_couple_member(ma.couple_id, v_user_id)
    and ma.upload_status = 'pending'
  returning ma.id, ma.upload_status;

  if not found then
    raise exception 'Media asset not found'
      using errcode = 'P0002';
  end if;
end;
$$;

alter table public.media_assets enable row level security;

drop policy if exists media_assets_select_active_members
on public.media_assets;

drop policy if exists media_assets_insert_owner_active_member
on public.media_assets;

drop policy if exists media_assets_update_owner
on public.media_assets;

drop policy if exists media_assets_select_readable_only
on public.media_assets;

create policy media_assets_select_readable_only
on public.media_assets
for select
to authenticated
using (private.can_read_media_asset(id));

revoke insert, update, delete on table public.media_assets from authenticated;
grant select on table public.media_assets to authenticated;

drop policy if exists couple_media_objects_select_active_members
on storage.objects;

drop policy if exists couple_media_objects_insert_owner_active_member
on storage.objects;

drop policy if exists couple_media_objects_update_owner_active_member
on storage.objects;

drop policy if exists couple_media_objects_select_readable_only
on storage.objects;

drop policy if exists couple_media_objects_insert_reserved_pending_owner
on storage.objects;

create policy couple_media_objects_select_readable_only
on storage.objects
for select
to authenticated
using (
  bucket_id = 'couple-media'
  and private.can_read_media_storage_path(name)
);

create policy couple_media_objects_insert_reserved_pending_owner
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'couple-media'
  and auth.uid() is not null
  and exists (
    select 1
    from public.media_assets ma
    where ma.storage_path = name
      and ma.owner_id = auth.uid()
      and ma.upload_status = 'pending'
      and private.is_active_couple_member(ma.couple_id, auth.uid())
  )
);

create or replace function public.complete_ritual(
  p_couple_ritual_id uuid,
  p_text_response text default null,
  p_media_asset_id uuid default null
)
returns table (
  couple_ritual_id uuid,
  status text,
  is_revealed boolean,
  completed_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_ritual public.couple_rituals%rowtype;
  v_template public.ritual_templates%rowtype;
  v_active_member_count integer;
  v_completed_count integer;
  v_text_response text := nullif(btrim(coalesce(p_text_response, '')), '');
  v_existing_completion public.ritual_completions%rowtype;
  v_status text;
  v_media_asset public.media_assets%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  select *
  into v_ritual
  from public.couple_rituals cr
  where cr.id = p_couple_ritual_id
  for update;

  if not found then
    raise exception 'Ritual not found'
      using errcode = 'P0002';
  end if;

  if not private.is_active_couple_member(v_ritual.couple_id, v_user_id) then
    raise exception 'Ritual not found'
      using errcode = 'P0002';
  end if;

  select count(*)::integer
  into v_active_member_count
  from public.couple_members cm
  where cm.couple_id = v_ritual.couple_id
    and cm.status = 'active';

  if v_active_member_count < 2 then
    raise exception 'Ritual completion requires a paired couple'
      using errcode = '23514';
  end if;

  if v_active_member_count > 2 then
    raise exception 'Couple membership exceeded two active partners'
      using errcode = '23514';
  end if;

  if v_ritual.status = 'completed' then
    raise exception 'This ritual is already complete'
      using errcode = '23514';
  end if;

  select *
  into v_template
  from public.ritual_templates rt
  where rt.id = v_ritual.ritual_template_id;

  if not found then
    raise exception 'Ritual template not found'
      using errcode = 'P0002';
  end if;

  if p_media_asset_id is not null then
    select *
    into v_media_asset
    from public.media_assets ma
    where ma.id = p_media_asset_id
    for update;

    if not found then
      raise exception 'Ritual media asset not found'
        using errcode = 'P0002';
    end if;

    if not private.is_uploaded_media_owned_by_user(v_media_asset.id, v_user_id) then
      raise exception 'Ritual media must be uploaded by you'
        using errcode = '23514';
    end if;

    if v_media_asset.couple_id <> v_ritual.couple_id then
      raise exception 'Ritual media does not belong to this couple'
        using errcode = '23514';
    end if;
  end if;

  if v_template.input_type = 'photo' then
    if p_media_asset_id is null then
      raise exception 'Photo rituals require uploaded media'
        using errcode = '23514';
    end if;
  elsif v_template.input_type = 'text_or_photo' then
    if v_text_response is null and p_media_asset_id is null then
      raise exception 'Ritual response requires text or uploaded media'
        using errcode = '23514';
    end if;
  elsif v_template.input_type = 'text' then
    if p_media_asset_id is not null then
      raise exception 'Text rituals do not accept media'
        using errcode = '23514';
    end if;

    if v_text_response is null then
      raise exception 'Ritual response text is required'
        using errcode = '23514';
    end if;
  else
    raise exception 'Unsupported ritual input type'
      using errcode = '23514';
  end if;

  if v_text_response is not null and char_length(v_text_response) > 1000 then
    raise exception 'Ritual response must be 1000 characters or fewer'
      using errcode = '22001';
  end if;

  select *
  into v_existing_completion
  from public.ritual_completions rc
  where rc.couple_ritual_id = v_ritual.id
    and rc.user_id = v_user_id
  for update;

  if found then
    if private.ritual_is_revealed(v_ritual.id) then
      raise exception 'This ritual is already revealed'
        using errcode = '23514';
    end if;

    update public.ritual_completions rc
    set text_response = v_text_response,
        media_asset_id = p_media_asset_id
    where rc.id = v_existing_completion.id;
  else
    insert into public.ritual_completions (
      couple_ritual_id,
      user_id,
      text_response,
      media_asset_id
    )
    values (
      v_ritual.id,
      v_user_id,
      v_text_response,
      p_media_asset_id
    );
  end if;

  select count(distinct rc.user_id)::integer
  into v_completed_count
  from public.ritual_completions rc
  join public.couple_members cm
    on cm.couple_id = v_ritual.couple_id
   and cm.user_id = rc.user_id
   and cm.status = 'active'
  where rc.couple_ritual_id = v_ritual.id;

  v_status := v_ritual.status;

  if v_completed_count >= v_active_member_count then
    update public.couple_rituals cr
    set status = 'completed'
    where cr.id = v_ritual.id
    returning cr.status into v_status;

    if not exists (
      select 1
      from public.timeline_items ti
      where ti.couple_id = v_ritual.couple_id
        and ti.type = 'ritual_completed'
        and ti.payload ->> 'couple_ritual_id' = v_ritual.id::text
    ) then
      insert into public.timeline_items (
        couple_id,
        actor_id,
        type,
        title,
        subtitle,
        payload
      )
      values (
        v_ritual.couple_id,
        v_user_id,
        'ritual_completed',
        'Completed today''s ritual',
        v_template.title,
        jsonb_build_object(
          'couple_ritual_id', v_ritual.id,
          'ritual_template_id', v_template.id,
          'scheduled_for', v_ritual.scheduled_for,
          'category', v_template.category,
          'input_type', v_template.input_type
        )
      );
    end if;
  end if;

  return query
  select
    v_ritual.id,
    v_status,
    v_completed_count >= v_active_member_count,
    v_completed_count;
end;
$$;

drop function if exists public.create_memory_capsule(text, text, timestamptz, text);

create function public.create_memory_capsule(
  p_title text,
  p_note text default null,
  p_unlock_at timestamptz default null,
  p_emotional_context text default null,
  p_media_asset_id uuid default null
)
returns table (
  id uuid,
  couple_id uuid,
  creator_id uuid,
  title text,
  unlock_type text,
  unlock_at timestamptz,
  emotional_context text,
  opened_by uuid,
  opened_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_couple_id uuid;
  v_active_couple_count integer;
  v_active_member_count integer;
  v_title text := btrim(coalesce(p_title, ''));
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_emotional_context text := nullif(btrim(coalesce(p_emotional_context, '')), '');
  v_capsule public.memory_capsules%rowtype;
  v_media_asset public.media_assets%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  select count(*)::integer
  into v_active_couple_count
  from public.couple_members cm
  join public.couples c
    on c.id = cm.couple_id
  where cm.user_id = v_user_id
    and cm.status = 'active'
    and c.status = 'active';

  if v_active_couple_count = 0 then
    raise exception 'Active couple required'
      using errcode = '23514';
  end if;

  if v_active_couple_count > 1 then
    raise exception 'Expected exactly one active couple'
      using errcode = '23514';
  end if;

  select c.id
  into v_couple_id
  from public.couple_members cm
  join public.couples c
    on c.id = cm.couple_id
  where cm.user_id = v_user_id
    and cm.status = 'active'
    and c.status = 'active'
  limit 1
  for update of c;

  select count(*)::integer
  into v_active_member_count
  from public.couple_members cm
  where cm.couple_id = v_couple_id
    and cm.status = 'active';

  if v_active_member_count < 2 then
    raise exception 'Memory capsules require a paired couple'
      using errcode = '23514';
  end if;

  if v_active_member_count > 2 then
    raise exception 'Couple membership exceeded two active partners'
      using errcode = '23514';
  end if;

  if char_length(v_title) < 1 or char_length(v_title) > 120 then
    raise exception 'Memory capsule title must be between 1 and 120 characters'
      using errcode = '22001';
  end if;

  if v_note is not null and char_length(v_note) > 5000 then
    raise exception 'Memory capsule note must be 5000 characters or fewer'
      using errcode = '22001';
  end if;

  if v_emotional_context is not null and char_length(v_emotional_context) > 240 then
    raise exception 'Memory capsule context must be 240 characters or fewer'
      using errcode = '22001';
  end if;

  if p_media_asset_id is not null then
    select *
    into v_media_asset
    from public.media_assets ma
    where ma.id = p_media_asset_id
    for update;

    if not found then
      raise exception 'Memory capsule media asset not found'
        using errcode = 'P0002';
    end if;

    if not private.is_uploaded_media_owned_by_user(v_media_asset.id, v_user_id) then
      raise exception 'Memory capsule media must be uploaded by you'
        using errcode = '23514';
    end if;

    if v_media_asset.couple_id <> v_couple_id then
      raise exception 'Memory capsule media does not belong to this couple'
        using errcode = '23514';
    end if;
  end if;

  if v_note is null and p_media_asset_id is null then
    raise exception 'Memory capsule requires a note or uploaded media'
      using errcode = '23514';
  end if;

  if p_unlock_at is null then
    raise exception 'Memory capsule unlock date is required'
      using errcode = '23514';
  end if;

  if p_unlock_at <= now() then
    raise exception 'Memory capsule unlock date must be in the future'
      using errcode = '23514';
  end if;

  if p_unlock_at > now() + interval '10 years' then
    raise exception 'Memory capsule unlock date is too far in the future'
      using errcode = '23514';
  end if;

  insert into public.memory_capsules (
    couple_id,
    creator_id,
    title,
    unlock_type,
    unlock_at,
    emotional_context
  )
  values (
    v_couple_id,
    v_user_id,
    v_title,
    'date',
    p_unlock_at,
    v_emotional_context
  )
  returning *
  into v_capsule;

  insert into public.memory_capsule_contents (
    capsule_id,
    note,
    media_asset_id
  )
  values (
    v_capsule.id,
    v_note,
    p_media_asset_id
  );

  insert into public.timeline_items (
    couple_id,
    actor_id,
    type,
    title,
    subtitle,
    payload
  )
  values (
    v_couple_id,
    v_user_id,
    'capsule_created',
    'Created a memory capsule',
    v_capsule.title,
    jsonb_build_object(
      'capsule_id', v_capsule.id,
      'unlock_at', v_capsule.unlock_at,
      'has_note', v_note is not null,
      'has_media', p_media_asset_id is not null
    )
  );

  return query
  select
    v_capsule.id,
    v_capsule.couple_id,
    v_capsule.creator_id,
    v_capsule.title,
    v_capsule.unlock_type,
    v_capsule.unlock_at,
    v_capsule.emotional_context,
    v_capsule.opened_by,
    v_capsule.opened_at,
    v_capsule.created_at,
    v_capsule.updated_at;
end;
$$;

revoke all on function private.is_media_owner(uuid, uuid) from public;
revoke all on function private.is_uploaded_media_owned_by_user(uuid, uuid) from public;
revoke all on function private.can_read_media_asset(uuid, uuid) from public;
revoke all on function private.can_read_media_storage_path(text, uuid) from public;

grant execute on function private.is_media_owner(uuid, uuid) to authenticated;
grant execute on function private.is_uploaded_media_owned_by_user(uuid, uuid) to authenticated;
grant execute on function private.can_read_media_asset(uuid, uuid) to authenticated;
grant execute on function private.can_read_media_storage_path(text, uuid) to authenticated;

revoke all on function public.reserve_media_asset(text, bigint, integer, integer, text) from public;
revoke all on function public.reserve_media_asset(text, bigint, integer, integer, text) from anon;
grant execute on function public.reserve_media_asset(text, bigint, integer, integer, text) to authenticated;

revoke all on function public.mark_media_asset_uploaded(uuid, bigint, integer, integer) from public;
revoke all on function public.mark_media_asset_uploaded(uuid, bigint, integer, integer) from anon;
grant execute on function public.mark_media_asset_uploaded(uuid, bigint, integer, integer) to authenticated;

revoke all on function public.mark_media_asset_failed(uuid) from public;
revoke all on function public.mark_media_asset_failed(uuid) from anon;
grant execute on function public.mark_media_asset_failed(uuid) to authenticated;

revoke all on function public.complete_ritual(uuid, text, uuid) from public;
revoke all on function public.complete_ritual(uuid, text, uuid) from anon;
grant execute on function public.complete_ritual(uuid, text, uuid) to authenticated;

revoke all on function public.create_memory_capsule(text, text, timestamptz, text, uuid) from public;
revoke all on function public.create_memory_capsule(text, text, timestamptz, text, uuid) from anon;
grant execute on function public.create_memory_capsule(text, text, timestamptz, text, uuid) to authenticated;
