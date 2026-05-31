-- Phase 8 ritual writes must stay on the RPC path so paired-member checks,
-- response validation, reveal timing, and single timeline creation are enforced.
drop policy if exists couple_rituals_insert_active_members
on public.couple_rituals;

drop policy if exists couple_rituals_update_safe_status_for_active_members
on public.couple_rituals;

drop policy if exists ritual_completions_insert_own_active_member
on public.ritual_completions;

drop policy if exists ritual_completions_update_own
on public.ritual_completions;

drop policy if exists timeline_items_insert_actor_active_member
on public.timeline_items;

revoke insert on table public.couple_rituals from authenticated;
revoke update (status) on public.couple_rituals from authenticated;

revoke insert on table public.ritual_completions from authenticated;
revoke update (
  text_response,
  media_asset_id
) on public.ritual_completions from authenticated;

revoke insert on table public.timeline_items from authenticated;

-- The existing pulse RPC also writes timeline_items; keep it working after
-- timeline writes become RPC-only for clients.
alter function public.send_presence_pulse(text, text) security definer;
