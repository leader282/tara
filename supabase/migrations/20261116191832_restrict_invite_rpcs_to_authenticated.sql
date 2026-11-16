revoke all on function public.create_couple_with_invite(date, timestamptz, text) from public;
revoke all on function public.create_couple_with_invite(date, timestamptz, text) from anon;
grant execute on function public.create_couple_with_invite(date, timestamptz, text) to authenticated;

revoke all on function public.accept_couple_invite(text) from public;
revoke all on function public.accept_couple_invite(text) from anon;
grant execute on function public.accept_couple_invite(text) to authenticated;
