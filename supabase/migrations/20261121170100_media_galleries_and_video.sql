-- Let a ritual answer or memory capsule hold up to five photos or short videos (5 seconds max).
-- Each media asset now points at the answer or capsule it belongs to, so deleting either one also
-- deletes its media rows. The single media_asset_id columns keep the first item so app versions
-- that only show one photo still work.

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']::text[],
    file_size_limit = 31457280
where id = 'couple-media';

alter table public.media_assets
  add column if not exists ritual_completion_id uuid references public.ritual_completions(id) on delete cascade,
  add column if not exists memory_capsule_id uuid references public.memory_capsules(id) on delete cascade,
  add column if not exists sort_order smallint,
  add column if not exists duration_ms integer;

alter table public.media_assets
  drop constraint if exists media_assets_media_type_check,
  drop constraint if exists media_assets_single_parent_check,
  drop constraint if exists media_assets_sort_order_check,
  drop constraint if exists media_assets_duration_ms_check;

alter table public.media_assets
  add constraint media_assets_media_type_check
    check (media_type in ('image', 'video')),
  add constraint media_assets_single_parent_check
    check (num_nonnulls(ritual_completion_id, memory_capsule_id) <= 1),
  add constraint media_assets_sort_order_check
    check (sort_order is null or sort_order between 0 and 4),
  add constraint media_assets_duration_ms_check
    check (duration_ms is null or (duration_ms > 0 and duration_ms <= 6000));

create index if not exists media_assets_ritual_completion_id_idx
on public.media_assets (ritual_completion_id, sort_order)
where ritual_completion_id is not null;

create index if not exists media_assets_memory_capsule_id_idx
on public.media_assets (memory_capsule_id, sort_order)
where memory_capsule_id is not null;

update public.media_assets as ma
set ritual_completion_id = rc.id,
    sort_order = 0
from public.ritual_completions rc
where rc.media_asset_id = ma.id
  and ma.ritual_completion_id is null
  and ma.memory_capsule_id is null;

update public.media_assets as ma
set memory_capsule_id = mcc.capsule_id,
    sort_order = 0
from public.memory_capsule_contents mcc
where mcc.media_asset_id = ma.id
  and ma.ritual_completion_id is null
  and ma.memory_capsule_id is null;

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
            where (rc.id = ma.ritual_completion_id or rc.media_asset_id = ma.id)
              and cr.couple_id = ma.couple_id
              and private.is_active_couple_member(cr.couple_id, target_user_id)
              and (
                cr.status = 'completed'
                or private.ritual_is_revealed(cr.id)
              )
          )
          or exists (
            select 1
            from public.memory_capsules mc
            left join public.memory_capsule_contents mcc
              on mcc.capsule_id = mc.id
            where (mc.id = ma.memory_capsule_id or mcc.media_asset_id = ma.id)
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

-- Links the given uploads to one ritual answer or capsule in the given order, and detaches any
-- of its earlier media that isn't in the new list. Detached uploads are cleaned up later.
create or replace function private.attach_media_assets(
  p_user_id uuid,
  p_couple_id uuid,
  p_media_asset_ids uuid[],
  p_label text,
  p_ritual_completion_id uuid default null,
  p_memory_capsule_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_media_asset_ids uuid[] := coalesce(p_media_asset_ids, '{}'::uuid[]);
  v_count integer := coalesce(cardinality(p_media_asset_ids), 0);
  v_media_asset public.media_assets%rowtype;
begin
  if num_nonnulls(p_ritual_completion_id, p_memory_capsule_id) <> 1 then
    raise exception 'Media must be attached to exactly one answer or capsule'
      using errcode = '22023';
  end if;

  if v_count > 5 then
    raise exception 'You can add up to 5 photos or videos'
      using errcode = '23514';
  end if;

  if array_position(v_media_asset_ids, null) is not null
    or (select count(distinct media_asset_id) from unnest(v_media_asset_ids) as media_asset_id) <> v_count
  then
    raise exception 'Each photo or video can only be added once'
      using errcode = '23514';
  end if;

  for v_index in 1 .. v_count loop
    select *
    into v_media_asset
    from public.media_assets ma
    where ma.id = v_media_asset_ids[v_index]
    for update;

    if not found then
      raise exception '% media asset not found', p_label
        using errcode = 'P0002';
    end if;

    if not private.is_uploaded_media_owned_by_user(v_media_asset.id, p_user_id) then
      raise exception '% media must be uploaded by you', p_label
        using errcode = '23514';
    end if;

    if v_media_asset.couple_id <> p_couple_id then
      raise exception '% media does not belong to this couple', p_label
        using errcode = '23514';
    end if;

    if (
      v_media_asset.ritual_completion_id is not null
      and v_media_asset.ritual_completion_id is distinct from p_ritual_completion_id
    ) or (
      v_media_asset.memory_capsule_id is not null
      and v_media_asset.memory_capsule_id is distinct from p_memory_capsule_id
    ) then
      raise exception '% media is already attached elsewhere', p_label
        using errcode = '23514';
    end if;
  end loop;

  update public.media_assets as ma
  set ritual_completion_id = null,
      memory_capsule_id = null,
      sort_order = null
  where (
      (p_ritual_completion_id is not null and ma.ritual_completion_id = p_ritual_completion_id)
      or (p_memory_capsule_id is not null and ma.memory_capsule_id = p_memory_capsule_id)
    )
    and not (ma.id = any(v_media_asset_ids));

  update public.media_assets as ma
  set ritual_completion_id = p_ritual_completion_id,
      memory_capsule_id = p_memory_capsule_id,
      sort_order = (array_position(v_media_asset_ids, ma.id) - 1)::smallint
  where ma.id = any(v_media_asset_ids);
end;
$$;

drop function if exists public.reserve_media_asset(text, bigint, integer, integer, text);

create function public.reserve_media_asset(
  p_mime_type text,
  p_size_bytes bigint default null,
  p_width integer default null,
  p_height integer default null,
  p_purpose text default 'attachment',
  p_duration_ms integer default null
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
  duration_ms integer,
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
  v_is_video boolean;
  v_extension text;
  v_media_asset_id uuid := extensions.gen_random_uuid();
  v_storage_path text;
  v_media_asset public.media_assets%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  if v_mime_type not in ('image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime') then
    raise exception 'Unsupported file type: use a JPEG, PNG, or WEBP photo or an MP4 or MOV video'
      using errcode = '23514';
  end if;

  v_is_video := v_mime_type like 'video/%';

  if v_is_video then
    if p_size_bytes is not null and (p_size_bytes <= 0 or p_size_bytes > 31457280) then
      raise exception 'Video size must be positive and 30 MB or smaller'
        using errcode = '23514';
    end if;

    if p_duration_ms is null or p_duration_ms <= 0 or p_duration_ms > 6000 then
      raise exception 'Videos must be 5 seconds or shorter'
        using errcode = '23514';
    end if;

    if v_purpose not in ('ritual_completion', 'memory_capsule_content') then
      raise exception 'Videos can only be added to rituals or memory capsules'
        using errcode = '23514';
    end if;
  elsif p_size_bytes is not null and (p_size_bytes <= 0 or p_size_bytes > 5242880) then
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
    when 'video/mp4' then 'mp4'
    when 'video/quicktime' then 'mov'
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
    duration_ms,
    purpose,
    upload_status
  )
  values (
    v_media_asset_id,
    v_couple_id,
    v_user_id,
    v_storage_path,
    case when v_is_video then 'video' else 'image' end,
    v_mime_type,
    p_size_bytes,
    p_width,
    p_height,
    case when v_is_video then p_duration_ms end,
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
    v_media_asset.duration_ms,
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

  if v_media_asset.media_type = 'video' then
    if p_size_bytes is null or p_size_bytes <= 0 or p_size_bytes > 31457280 then
      raise exception 'Video size must be positive and 30 MB or smaller'
        using errcode = '23514';
    end if;
  elsif p_size_bytes is null or p_size_bytes <= 0 or p_size_bytes > 5242880 then
    raise exception 'Image size must be positive and 5 MB or smaller'
      using errcode = '23514';
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

drop function if exists public.complete_ritual(uuid, text, uuid);

create function public.complete_ritual(
  p_couple_ritual_id uuid,
  p_text_response text default null,
  p_media_asset_id uuid default null,
  p_media_asset_ids uuid[] default null
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
  v_media_asset_ids uuid[] := coalesce(
    p_media_asset_ids,
    case when p_media_asset_id is null then '{}'::uuid[] else array[p_media_asset_id] end
  );
  v_has_media boolean;
  v_existing_completion public.ritual_completions%rowtype;
  v_completion_id uuid;
  v_status text;
  v_partner_user_id uuid;
  v_sender_name text;
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  v_has_media := cardinality(v_media_asset_ids) > 0;

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

  if v_template.input_type = 'photo' then
    if not v_has_media then
      raise exception 'Photo rituals require uploaded media'
        using errcode = '23514';
    end if;
  elsif v_template.input_type = 'text_or_photo' then
    if v_text_response is null and not v_has_media then
      raise exception 'Ritual response requires text or uploaded media'
        using errcode = '23514';
    end if;
  elsif v_template.input_type = 'text' then
    if v_has_media then
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
        media_asset_id = v_media_asset_ids[1]
    where rc.id = v_existing_completion.id
    returning rc.id into v_completion_id;
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
      v_media_asset_ids[1]
    )
    returning id into v_completion_id;
  end if;

  perform private.attach_media_assets(
    p_user_id => v_user_id,
    p_couple_id => v_ritual.couple_id,
    p_media_asset_ids => v_media_asset_ids,
    p_label => 'Ritual',
    p_ritual_completion_id => v_completion_id
  );

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

    v_sender_name := private.notification_display_name(v_user_id);

    for v_partner_user_id in
      select cm.user_id
      from public.couple_members cm
      where cm.couple_id = v_ritual.couple_id
        and cm.status = 'active'
        and cm.user_id <> v_user_id
    loop
      perform private.enqueue_notification(
        target_user_id => v_partner_user_id,
        target_couple_id => v_ritual.couple_id,
        notification_type => 'ritual_ready',
        notification_title => format('✨ %s answered too', v_sender_name),
        notification_body => 'Your answers are revealed. See what you both shared today.',
        notification_data => jsonb_build_object(
          'type', 'ritual_ready',
          'couple_ritual_id', v_ritual.id
        ),
        source_table => 'couple_rituals',
        source_id => v_ritual.id,
        dedupe_key => format('ritual_ready:%s:%s', v_ritual.id, v_partner_user_id),
        requested_at => now()
      );
    end loop;
  end if;

  return query
  select
    v_ritual.id,
    v_status,
    v_completed_count >= v_active_member_count,
    v_completed_count;
end;
$$;

drop function if exists public.create_memory_capsule(text, text, timestamptz, text, uuid);

create function public.create_memory_capsule(
  p_title text,
  p_note text default null,
  p_unlock_at timestamptz default null,
  p_emotional_context text default null,
  p_media_asset_id uuid default null,
  p_media_asset_ids uuid[] default null
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
  v_media_asset_ids uuid[] := coalesce(
    p_media_asset_ids,
    case when p_media_asset_id is null then '{}'::uuid[] else array[p_media_asset_id] end
  );
  v_has_media boolean;
  v_capsule public.memory_capsules%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  v_has_media := cardinality(v_media_asset_ids) > 0;

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

  if v_note is null and not v_has_media then
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
    v_media_asset_ids[1]
  );

  perform private.attach_media_assets(
    p_user_id => v_user_id,
    p_couple_id => v_couple_id,
    p_media_asset_ids => v_media_asset_ids,
    p_label => 'Memory capsule',
    p_memory_capsule_id => v_capsule.id
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
      'has_media', v_has_media
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

revoke all on function private.attach_media_assets(uuid, uuid, uuid[], text, uuid, uuid) from public, anon, authenticated;

revoke all on function public.reserve_media_asset(text, bigint, integer, integer, text, integer) from public;
revoke all on function public.reserve_media_asset(text, bigint, integer, integer, text, integer) from anon;
grant execute on function public.reserve_media_asset(text, bigint, integer, integer, text, integer) to authenticated;

revoke all on function public.complete_ritual(uuid, text, uuid, uuid[]) from public;
revoke all on function public.complete_ritual(uuid, text, uuid, uuid[]) from anon;
grant execute on function public.complete_ritual(uuid, text, uuid, uuid[]) to authenticated;

revoke all on function public.create_memory_capsule(text, text, timestamptz, text, uuid, uuid[]) from public;
revoke all on function public.create_memory_capsule(text, text, timestamptz, text, uuid, uuid[]) from anon;
grant execute on function public.create_memory_capsule(text, text, timestamptz, text, uuid, uuid[]) to authenticated;
