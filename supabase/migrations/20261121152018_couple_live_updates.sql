-- Let a partner's app hear about reunion edits, shared settings, and unpairing as they happen.
-- Realtime only delivers rows a subscriber can select. Couple rows already reach active members.
-- Unpairing archives the couple first, so the member left behind can no longer see it; letting
-- members read their own membership rows means they still receive theirs changing to 'left'.
create policy couple_members_select_own
on public.couple_members
for select
to authenticated
using (user_id = (select auth.uid()));

do $$
begin
  if exists (
    select 1
    from pg_catalog.pg_publication
    where pubname = 'supabase_realtime'
  ) then
    if not exists (
      select 1
      from pg_catalog.pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'couples'
    ) then
      alter publication supabase_realtime add table public.couples;
    end if;

    if not exists (
      select 1
      from pg_catalog.pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'couple_members'
    ) then
      alter publication supabase_realtime add table public.couple_members;
    end if;
  end if;
end;
$$;
