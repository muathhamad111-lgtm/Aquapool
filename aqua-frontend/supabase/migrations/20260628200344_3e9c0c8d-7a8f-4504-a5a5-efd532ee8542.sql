
revoke execute on function public.bootstrap_first_admin() from public;
revoke execute on function public.set_updated_at() from public;
revoke execute on function public.has_role(uuid, public.app_role) from public;
grant execute on function public.has_role(uuid, public.app_role) to anon, authenticated, service_role;
