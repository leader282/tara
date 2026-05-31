create or replace function public.ensure_daily_ritual(
  p_scheduled_for date default null
)
returns table (
  couple_ritual_id uuid
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
  v_scheduled_for date := coalesce(p_scheduled_for, (now() at time zone 'utc')::date);
  v_today_utc date := (now() at time zone 'utc')::date;
  v_template_id uuid;
  v_couple_ritual_id uuid;
  v_day_offset integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  if v_scheduled_for < v_today_utc - 7
    or v_scheduled_for > v_today_utc + 7
  then
    raise exception 'Ritual date must be within 7 days of today'
      using errcode = '22008';
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

  perform 1
  from public.couples c
  where c.id = v_couple_id
  for update;

  select count(*)::integer
  into v_active_member_count
  from public.couple_members cm
  where cm.couple_id = v_couple_id
    and cm.status = 'active';

  if v_active_member_count < 2 then
    raise exception 'Daily rituals require a paired couple'
      using errcode = '23514';
  end if;

  if v_active_member_count > 2 then
    raise exception 'Couple membership exceeded two active partners'
      using errcode = '23514';
  end if;

  select cr.id
  into v_couple_ritual_id
  from public.couple_rituals cr
  where cr.couple_id = v_couple_id
    and cr.scheduled_for = v_scheduled_for;

  if v_couple_ritual_id is not null then
    return query select v_couple_ritual_id;
    return;
  end if;

  v_day_offset := (v_scheduled_for - date '2026-01-01');

  select rt.id
  into v_template_id
  from public.ritual_templates rt
  where rt.is_active = true
    and rt.input_type in ('text', 'text_or_photo')
  order by
    case
      when mod(v_day_offset, 4) = 0 and rt.category = 'parallel_moment' then 0
      when mod(v_day_offset, 4) in (1, 3) and rt.category = 'daily_checkin' then 0
      when mod(v_day_offset, 4) = 2 and rt.category not in ('parallel_moment', 'photo') then 0
      else 1
    end,
    md5(rt.id::text || v_scheduled_for::text),
    rt.id
  limit 1;

  if v_template_id is null then
    raise exception 'No active text ritual templates are available'
      using errcode = '23514';
  end if;

  insert into public.couple_rituals (
    couple_id,
    ritual_template_id,
    scheduled_for,
    status
  )
  values (
    v_couple_id,
    v_template_id,
    v_scheduled_for,
    'scheduled'
  )
  on conflict (couple_id, scheduled_for) do nothing
  returning id into v_couple_ritual_id;

  if v_couple_ritual_id is null then
    select cr.id
    into v_couple_ritual_id
    from public.couple_rituals cr
    where cr.couple_id = v_couple_id
      and cr.scheduled_for = v_scheduled_for;
  end if;

  return query select v_couple_ritual_id;
end;
$$;

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

  if v_template.input_type = 'photo' then
    raise exception 'Photo rituals are not available until media upload is ready'
      using errcode = '23514';
  end if;

  if v_template.input_type not in ('text', 'text_or_photo') then
    raise exception 'Unsupported ritual input type'
      using errcode = '23514';
  end if;

  if p_media_asset_id is not null then
    raise exception 'Ritual media upload is not available yet'
      using errcode = '23514';
  end if;

  if v_text_response is null then
    raise exception 'Ritual response text is required'
      using errcode = '23514';
  end if;

  if char_length(v_text_response) > 1000 then
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
        media_asset_id = null
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
      null
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

revoke all on function public.ensure_daily_ritual(date) from public;
revoke all on function public.ensure_daily_ritual(date) from anon;
grant execute on function public.ensure_daily_ritual(date) to authenticated;

revoke all on function public.complete_ritual(uuid, text, uuid) from public;
revoke all on function public.complete_ritual(uuid, text, uuid) from anon;
grant execute on function public.complete_ritual(uuid, text, uuid) to authenticated;

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
      and tablename = 'couple_rituals'
  ) then
    alter publication supabase_realtime add table public.couple_rituals;
  end if;
end;
$$;
