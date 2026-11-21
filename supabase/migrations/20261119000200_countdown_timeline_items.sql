-- Saving or clearing a reunion only wrote to couples, so the shared timeline never got the
-- countdown_updated moments the app renders. The place stays out of the payload; the timeline
-- only says whether one was set.
create or replace function private.add_countdown_timeline_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.next_meetup_at is not distinct from old.next_meetup_at
    and new.next_meetup_location is not distinct from old.next_meetup_location then
    return null;
  end if;

  insert into public.timeline_items (couple_id, actor_id, type, title, payload)
  values (
    new.id,
    auth.uid(),
    'countdown_updated',
    case
      when new.next_meetup_at is null then 'Cleared the reunion date'
      else 'Planned your next reunion'
    end,
    jsonb_strip_nulls(
      jsonb_build_object(
        'next_meetup_at', new.next_meetup_at,
        'has_location', coalesce(btrim(new.next_meetup_location), '') <> ''
      )
    )
  );

  return null;
end;
$$;

revoke all on function private.add_countdown_timeline_item() from public;

create trigger add_countdown_timeline_item
after update of next_meetup_at, next_meetup_location on public.couples
for each row
execute function private.add_countdown_timeline_item();
