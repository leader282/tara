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

do $$
begin
  if exists (
    select 1
    from pg_catalog.pg_publication
    where pubname = 'supabase_realtime'
  )
  and not exists (
    select 1
    from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'presence_events'
  ) then
    alter publication supabase_realtime add table public.presence_events;
  end if;
end;
$$;
