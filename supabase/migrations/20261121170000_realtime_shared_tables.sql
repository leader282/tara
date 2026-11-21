-- Stream the rest of what partners see to their apps: new timeline moments, profile edits (name,
-- timezone), and shared couple settings. Realtime only delivers rows a subscriber can select, and
-- the existing select policies already limit each table to the couple's own members.
do $$
declare
  v_table text;
begin
  if not exists (
    select 1
    from pg_catalog.pg_publication
    where pubname = 'supabase_realtime'
  ) then
    return;
  end if;

  foreach v_table in array array['timeline_items', 'profiles', 'couple_settings'] loop
    if not exists (
      select 1
      from pg_catalog.pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = v_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', v_table);
    end if;
  end loop;
end;
$$;
