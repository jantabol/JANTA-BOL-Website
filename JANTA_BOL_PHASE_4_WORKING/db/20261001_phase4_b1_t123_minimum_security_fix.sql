-- Applied live: phase4_b1_t123_minimum_security_fix
-- Preserve the Phase-3 T123 contract exactly:
-- no jb_* function is anonymous and Team browser authority stays behind
-- the verified jb-team-api server adapter.

create or replace function public.public_reporter_directory()
returns table(reporter_id uuid,display_name text)
language sql stable security definer set search_path=''
as $$
  select r.id,r.name
  from public.reporters r
  join public.team_accounts ta on ta.reporter_id=r.id
  where r.public_name_enabled=true
    and ta.status in('active','departed')
  order by lower(r.name),r.id;
$$;

revoke all on function public.public_reporter_directory() from public;
grant execute on function public.public_reporter_directory() to anon,authenticated;

revoke all on function public.jb_public_reporter_directory()
  from public,anon,authenticated,service_role;
drop function public.jb_public_reporter_directory();

revoke all on function public.jb_team_activate(uuid) from public,anon,authenticated;
revoke all on function public.jb_team_suspend(uuid,text) from public,anon,authenticated;
revoke all on function public.jb_team_reactivate(uuid) from public,anon,authenticated;
revoke all on function public.jb_team_change_role(uuid,public.app_role,text) from public,anon,authenticated;
revoke all on function public.jb_team_set_public_name(uuid,boolean) from public,anon,authenticated;
revoke all on function public.jb_team_depart(uuid,text) from public,anon,authenticated;
revoke all on function public.jb_team_list_sessions(uuid) from public,anon,authenticated;
revoke all on function public.jb_team_revoke_session(uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.jb_team_list() from public,anon,authenticated;
revoke all on function public.jb_team_history(uuid) from public,anon,authenticated;

grant execute on function public.jb_team_activate(uuid) to service_role;
grant execute on function public.jb_team_suspend(uuid,text) to service_role;
grant execute on function public.jb_team_reactivate(uuid) to service_role;
grant execute on function public.jb_team_change_role(uuid,public.app_role,text) to service_role;
grant execute on function public.jb_team_set_public_name(uuid,boolean) to service_role;
grant execute on function public.jb_team_depart(uuid,text) to service_role;
grant execute on function public.jb_team_list_sessions(uuid) to service_role;
grant execute on function public.jb_team_revoke_session(uuid,uuid,text) to service_role;
grant execute on function public.jb_team_list() to service_role;
grant execute on function public.jb_team_history(uuid) to service_role;

create or replace function public.jb_team_list_sessions_internal(
  p_owner_user_id uuid,p_team_account_id uuid
)
returns table(session_id uuid,created_at timestamptz,updated_at timestamptz,
  refreshed_at timestamp,aal text,user_agent text,ip text)
language plpgsql security definer set search_path=''
as $$
declare v_user uuid;
begin
  if not exists(
    select 1 from public.user_roles
    where user_id=p_owner_user_id and role='owner'::public.app_role
  ) then raise exception 'OWNER_REQUIRED'; end if;

  select user_id into v_user from public.team_accounts where id=p_team_account_id;
  if v_user is null then return; end if;

  return query
  select s.id,s.created_at,s.updated_at,s.refreshed_at,
         s.aal::text,s.user_agent,s.ip::text
  from auth.sessions s
  where s.user_id=v_user
  order by coalesce(s.refreshed_at,s.updated_at::timestamp) desc;
end;
$$;

revoke all on function public.jb_team_list_sessions_internal(uuid,uuid)
  from public,anon,authenticated;
grant execute on function public.jb_team_list_sessions_internal(uuid,uuid)
  to service_role;
