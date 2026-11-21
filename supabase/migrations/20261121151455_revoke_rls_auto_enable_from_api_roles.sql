-- public.rls_auto_enable() backs the hosted project's ensure_rls event trigger, which turns
-- row level security on for new tables in public. It was created outside these migrations, so
-- a local stack doesn't have it. Event triggers don't need EXECUTE grants, so stop exposing it
-- to signed-out and signed-in users as an RPC.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end
$$;
