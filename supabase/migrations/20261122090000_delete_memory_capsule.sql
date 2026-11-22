-- Lets the partner who made a memory capsule delete it, at any stage, along with its note,
-- photos, videos, timeline moments, and any unlock notification still waiting to go out.
-- Files can't be removed from SQL, so their paths are queued for prune-couple-history.
create or replace function public.delete_memory_capsule(
  p_capsule_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_capsule public.memory_capsules%rowtype;
  v_legacy_media_asset_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  select *
  into v_capsule
  from public.memory_capsules mc
  where mc.id = p_capsule_id
  for update;

  if not found or not private.is_active_couple_member(v_capsule.couple_id, v_user_id) then
    raise exception 'Memory capsule not found'
      using errcode = 'P0002';
  end if;

  if v_capsule.creator_id <> v_user_id then
    raise exception 'Only the partner who made this capsule can delete it'
      using errcode = '42501';
  end if;

  select mcc.media_asset_id
  into v_legacy_media_asset_id
  from public.memory_capsule_contents mcc
  where mcc.capsule_id = v_capsule.id;

  insert into private.storage_cleanup_queue (storage_path)
  select ma.storage_path
  from public.media_assets ma
  where ma.memory_capsule_id = v_capsule.id
     or ma.id = v_legacy_media_asset_id
  on conflict (storage_path) do nothing;

  delete from public.media_assets ma
  where ma.memory_capsule_id = v_capsule.id
     or ma.id = v_legacy_media_asset_id;

  delete from public.timeline_items ti
  where ti.couple_id = v_capsule.couple_id
    and ti.payload ->> 'capsule_id' = v_capsule.id::text;

  update public.notification_queue nq
  set status = 'skipped',
      skipped_at = now(),
      failure_code = 'source_deleted',
      updated_at = now()
  where nq.source_table = 'memory_capsules'
    and nq.source_id = v_capsule.id
    and nq.status = 'pending';

  delete from public.memory_capsules mc
  where mc.id = v_capsule.id;

  -- Realtime can't deliver a deleted row to the partner (it checks access against the live
  -- table, and delete events can't be filtered by couple), so touch the couple row instead;
  -- the partner's app refreshes its capsules when that row changes.
  update public.couples c
  set updated_at = now()
  where c.id = v_capsule.couple_id;

  return v_capsule.id;
end;
$$;

revoke all on function public.delete_memory_capsule(uuid) from public;
revoke all on function public.delete_memory_capsule(uuid) from anon;
grant execute on function public.delete_memory_capsule(uuid) to authenticated;
