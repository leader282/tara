-- Keep shared history small: today's ritual plus the five before it, and the last seven days of
-- the timeline. Files can't be removed from SQL, so their paths are queued for the
-- prune-couple-history Edge Function, which deletes them through the Storage API.
create table if not exists private.storage_cleanup_queue (
  storage_path text primary key,
  queued_at timestamptz not null default now(),
  attempts integer not null default 0
);

alter table private.storage_cleanup_queue enable row level security;
revoke all on table private.storage_cleanup_queue from public, anon, authenticated;

create or replace function public.prune_couple_history(
  p_previous_rituals_to_keep integer default 5,
  p_timeline_days_to_keep integer default 7
)
returns table (
  deleted_rituals integer,
  deleted_timeline_items integer,
  deleted_media integer,
  queued_files integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_ritual_ids uuid[];
  v_media_ids uuid[];
  v_deleted_rituals integer;
  v_deleted_timeline_items integer;
  v_deleted_media integer;
  v_queued_files integer;
begin
  if p_previous_rituals_to_keep is null or p_previous_rituals_to_keep < 0
    or p_timeline_days_to_keep is null or p_timeline_days_to_keep < 1
  then
    raise exception 'Invalid retention settings'
      using errcode = '22023';
  end if;

  select coalesce(array_agg(ranked.id), '{}'::uuid[])
  into v_ritual_ids
  from (
    select
      cr.id,
      row_number() over (
        partition by cr.couple_id
        order by cr.scheduled_for desc, cr.created_at desc
      ) as previous_rank
    from public.couple_rituals cr
    where cr.scheduled_for < v_today
  ) as ranked
  where ranked.previous_rank > p_previous_rituals_to_keep;

  -- Media from those rituals, plus uploads that never made it into an answer or capsule.
  select coalesce(array_agg(ma.id), '{}'::uuid[])
  into v_media_ids
  from public.media_assets ma
  where exists (
      select 1
      from public.ritual_completions rc
      where rc.couple_ritual_id = any(v_ritual_ids)
        and (rc.id = ma.ritual_completion_id or rc.media_asset_id = ma.id)
    )
    or (
      ma.created_at < now() - interval '1 day'
      and ma.ritual_completion_id is null
      and ma.memory_capsule_id is null
      and (
        ma.upload_status in ('pending', 'failed')
        or ma.purpose in ('ritual_completion', 'memory_capsule_content')
      )
      and not exists (
        select 1
        from public.ritual_completions rc
        where rc.media_asset_id = ma.id
      )
      and not exists (
        select 1
        from public.memory_capsule_contents mcc
        where mcc.media_asset_id = ma.id
      )
    );

  insert into private.storage_cleanup_queue (storage_path)
  select ma.storage_path
  from public.media_assets ma
  where ma.id = any(v_media_ids)
  on conflict (storage_path) do nothing;
  get diagnostics v_queued_files = row_count;

  delete from public.media_assets ma
  where ma.id = any(v_media_ids);
  get diagnostics v_deleted_media = row_count;

  delete from public.timeline_items ti
  where ti.created_at < now() - make_interval(days => p_timeline_days_to_keep)
    or ti.payload ->> 'couple_ritual_id' = any(v_ritual_ids::text[]);
  get diagnostics v_deleted_timeline_items = row_count;

  delete from public.couple_rituals cr
  where cr.id = any(v_ritual_ids);
  get diagnostics v_deleted_rituals = row_count;

  return query
  select v_deleted_rituals, v_deleted_timeline_items, v_deleted_media, v_queued_files;
end;
$$;

-- Hands out queued file paths. Each claim counts as an attempt, so a file that keeps failing to
-- delete stops being retried after ten runs.
create or replace function public.claim_storage_cleanup_batch(
  p_limit integer default 100
)
returns table (storage_path text)
language sql
security definer
set search_path = ''
as $$
  update private.storage_cleanup_queue as q
  set attempts = q.attempts + 1
  where q.storage_path in (
    select pending.storage_path
    from private.storage_cleanup_queue as pending
    where pending.attempts < 10
    order by pending.queued_at, pending.storage_path
    limit least(greatest(coalesce(p_limit, 100), 1), 1000)
    for update skip locked
  )
  returning q.storage_path;
$$;

create or replace function public.complete_storage_cleanup(
  p_storage_paths text[]
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_removed integer;
begin
  delete from private.storage_cleanup_queue as q
  where q.storage_path = any(coalesce(p_storage_paths, '{}'::text[]));
  get diagnostics v_removed = row_count;

  return v_removed;
end;
$$;

revoke all on function public.prune_couple_history(integer, integer) from public, anon, authenticated;
revoke all on function public.claim_storage_cleanup_batch(integer) from public, anon, authenticated;
revoke all on function public.complete_storage_cleanup(text[]) from public, anon, authenticated;

grant execute on function public.prune_couple_history(integer, integer) to service_role;
grant execute on function public.claim_storage_cleanup_batch(integer) to service_role;
grant execute on function public.complete_storage_cleanup(text[]) to service_role;

-- Runs at 00:15 UTC, just after the new ritual day starts. Like the other jobs, it reads the
-- 'project_url' and 'cron_secret' Vault secrets and does nothing until both exist.
select cron.schedule(
  'prune-couple-history',
  '15 0 * * *',
  $$
  select net.http_post(
    url := project_url.decrypted_secret || '/functions/v1/prune-couple-history',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', cron_secret.decrypted_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  )
  from vault.decrypted_secrets as project_url
  cross join vault.decrypted_secrets as cron_secret
  where project_url.name = 'project_url'
    and cron_secret.name = 'cron_secret';
  $$
);
