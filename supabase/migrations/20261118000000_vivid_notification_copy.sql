-- Push copy now names the partner and what they shared (a hug, a good-morning pulse, a
-- revealed ritual) so a notification is recognizable at a glance. It still never includes
-- pulse notes, ritual responses, capsule titles or contents, media, or locations.

create or replace function private.notification_display_name(target_user_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select nullif(left(regexp_replace(btrim(p.display_name), '\s+', ' ', 'g'), 40), '')
      from public.profiles p
      where p.id = target_user_id
    ),
    'Your partner'
  );
$$;

revoke all on function private.notification_display_name(uuid) from public;

create or replace function public.enqueue_due_capsule_unlock_notifications()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_enqueued_count integer := 0;
  v_notification_id uuid;
  v_target record;
  v_is_creator boolean;
begin
  for v_target in
    select
      mc.id as capsule_id,
      mc.couple_id,
      mc.creator_id,
      cm.user_id as recipient_user_id
    from public.memory_capsules mc
    join public.couples c
      on c.id = mc.couple_id
     and c.status = 'active'
    join public.couple_members cm
      on cm.couple_id = mc.couple_id
     and cm.status = 'active'
    where mc.unlock_at <= v_now
      and mc.opened_at is null
  loop
    v_is_creator := v_target.creator_id = v_target.recipient_user_id;
    v_notification_id := private.enqueue_notification(
      target_user_id => v_target.recipient_user_id,
      target_couple_id => v_target.couple_id,
      notification_type => 'capsule_unlocked',
      notification_title => case
        when v_is_creator then '🎁 Your memory capsule is ready'
        else format('🎁 A memory capsule from %s is ready', private.notification_display_name(v_target.creator_id))
      end,
      notification_body => case
        when v_is_creator then 'The capsule you sealed can be opened now. Share the moment together in Tara.'
        else 'They sealed it for this day. Open it whenever you''re ready.'
      end,
      notification_data => jsonb_build_object(
        'type', 'capsule_unlocked',
        'capsule_id', v_target.capsule_id
      ),
      source_table => 'memory_capsules',
      source_id => v_target.capsule_id,
      dedupe_key => format('capsule_unlocked:%s:%s', v_target.capsule_id, v_target.recipient_user_id),
      requested_at => v_now
    );

    if v_notification_id is not null then
      v_enqueued_count := v_enqueued_count + 1;
    end if;
  end loop;

  return v_enqueued_count;
end;
$$;

create or replace function public.enqueue_due_ritual_reminders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_today_utc date := (now() at time zone 'utc')::date;
  v_enqueued_count integer := 0;
  v_notification_id uuid;
  v_target record;
begin
  for v_target in
    select
      cr.id as couple_ritual_id,
      cr.couple_id,
      cr.scheduled_for,
      cm.user_id as recipient_user_id
    from public.couple_rituals cr
    join public.couples c
      on c.id = cr.couple_id
     and c.status = 'active'
    join public.couple_members cm
      on cm.couple_id = cr.couple_id
     and cm.status = 'active'
    where cr.scheduled_for = v_today_utc
      and cr.status <> 'completed'
      and not exists (
        select 1
        from public.ritual_completions rc
        where rc.couple_ritual_id = cr.id
          and rc.user_id = cm.user_id
      )
  loop
    v_notification_id := private.enqueue_notification(
      target_user_id => v_target.recipient_user_id,
      target_couple_id => v_target.couple_id,
      notification_type => 'ritual_reminder',
      notification_title => '📝 Today''s ritual is waiting',
      notification_body => 'A small prompt for you two. Answer whenever you have a quiet moment.',
      notification_data => jsonb_build_object(
        'type', 'ritual_reminder',
        'couple_ritual_id', v_target.couple_ritual_id
      ),
      source_table => 'couple_rituals',
      source_id => v_target.couple_ritual_id,
      dedupe_key => format('ritual_reminder:%s:%s:%s', v_target.recipient_user_id, v_target.couple_id, v_target.scheduled_for),
      requested_at => v_now
    );

    if v_notification_id is not null then
      v_enqueued_count := v_enqueued_count + 1;
    end if;
  end loop;

  return v_enqueued_count;
end;
$$;

revoke all on function public.enqueue_due_capsule_unlock_notifications() from public;
revoke all on function public.enqueue_due_capsule_unlock_notifications() from anon;
revoke all on function public.enqueue_due_capsule_unlock_notifications() from authenticated;
grant execute on function public.enqueue_due_capsule_unlock_notifications() to service_role;

revoke all on function public.enqueue_due_ritual_reminders() from public;
revoke all on function public.enqueue_due_ritual_reminders() from anon;
revoke all on function public.enqueue_due_ritual_reminders() from authenticated;
grant execute on function public.enqueue_due_ritual_reminders() to service_role;

create or replace function public.send_presence_pulse(
  p_type text,
  p_optional_message text default null
)
returns table (
  id uuid,
  couple_id uuid,
  sender_id uuid,
  type text,
  optional_message text,
  created_at timestamptz
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
  v_type text := btrim(coalesce(p_type, ''));
  v_optional_message text := nullif(btrim(coalesce(p_optional_message, '')), '');
  v_pulse_label text;
  v_presence_event public.presence_events%rowtype;
  v_partner_user_id uuid;
  v_sender_name text;
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
    raise exception 'Presence pulses require a paired couple'
      using errcode = '23514';
  end if;

  if v_active_member_count > 2 then
    raise exception 'Couple membership exceeded two active partners'
      using errcode = '23514';
  end if;

  if v_type not in (
    'thinking_of_you',
    'miss_you',
    'hug',
    'good_morning',
    'good_night',
    'safe_arrived',
    'proud_of_you'
  ) then
    raise exception 'Invalid presence pulse type'
      using errcode = '23514';
  end if;

  if v_optional_message is not null and char_length(v_optional_message) > 240 then
    raise exception 'Presence pulse message must be 240 characters or fewer'
      using errcode = '22001';
  end if;

  v_pulse_label := case v_type
    when 'thinking_of_you' then 'Thinking of you'
    when 'miss_you' then 'Miss you'
    when 'hug' then 'Hug'
    when 'good_morning' then 'Good morning'
    when 'good_night' then 'Good night'
    when 'safe_arrived' then 'Arrived safely'
    when 'proud_of_you' then 'Proud of you'
    else null
  end;

  insert into public.presence_events (
    couple_id,
    sender_id,
    type,
    optional_message
  )
  values (
    v_couple_id,
    v_user_id,
    v_type,
    v_optional_message
  )
  returning *
  into v_presence_event;

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
    'presence_sent',
    'Sent a pulse',
    v_pulse_label,
    jsonb_build_object(
      'presence_event_id', v_presence_event.id,
      'pulse_type', v_presence_event.type,
      'has_optional_message', v_presence_event.optional_message is not null
    )
  );

  select cm.user_id
  into v_partner_user_id
  from public.couple_members cm
  where cm.couple_id = v_couple_id
    and cm.status = 'active'
    and cm.user_id <> v_user_id
  limit 1;

  if v_partner_user_id is not null then
    v_sender_name := private.notification_display_name(v_user_id);

    perform private.enqueue_notification(
      target_user_id => v_partner_user_id,
      target_couple_id => v_couple_id,
      notification_type => 'presence_pulse',
      notification_title => case v_type
        when 'thinking_of_you' then format('💭 %s is thinking of you', v_sender_name)
        when 'miss_you' then format('🥺 %s misses you', v_sender_name)
        when 'hug' then format('🤗 %s sent you a hug', v_sender_name)
        when 'good_morning' then format('☀️ Good morning from %s', v_sender_name)
        when 'good_night' then format('🌙 Good night from %s', v_sender_name)
        when 'safe_arrived' then format('🏡 %s arrived safely', v_sender_name)
        else format('🌟 %s is proud of you', v_sender_name)
      end,
      notification_body => case
        when v_optional_message is not null then 'They added a little note. Open Tara to read it.'
        when v_type = 'thinking_of_you' then 'A little reminder that you''re on their mind.'
        when v_type = 'miss_you' then 'The distance feels a little bigger today. Send something back?'
        when v_type = 'hug' then 'Wrapped up warm and sent across the miles.'
        when v_type = 'good_morning' then 'They''re starting the day thinking of you.'
        when v_type = 'good_night' then 'Sweet dreams are on their way to you.'
        when v_type = 'safe_arrived' then 'Just letting you know they made it.'
        else 'A little cheer, just for you.'
      end,
      notification_data => jsonb_build_object(
        'type', 'presence_pulse',
        'presence_event_id', v_presence_event.id
      ),
      source_table => 'presence_events',
      source_id => v_presence_event.id,
      dedupe_key => format('presence_pulse:%s:%s', v_presence_event.id, v_partner_user_id),
      requested_at => now()
    );
  end if;

  return query
  select
    v_presence_event.id,
    v_presence_event.couple_id,
    v_presence_event.sender_id,
    v_presence_event.type,
    v_presence_event.optional_message,
    v_presence_event.created_at;
end;
$$;

revoke all on function public.send_presence_pulse(text, text) from public;
revoke all on function public.send_presence_pulse(text, text) from anon;
grant execute on function public.send_presence_pulse(text, text) to authenticated;

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
  v_partner_user_id uuid;
  v_sender_name text;
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

revoke all on function public.complete_ritual(uuid, text, uuid) from public;
revoke all on function public.complete_ritual(uuid, text, uuid) from anon;
grant execute on function public.complete_ritual(uuid, text, uuid) to authenticated;
