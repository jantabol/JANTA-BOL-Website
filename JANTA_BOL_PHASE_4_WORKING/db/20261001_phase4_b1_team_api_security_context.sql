-- Applied live: phase4_b1_team_api_security_context
create or replace function public.jb_team_actor_context_internal(
  p_user_id uuid,p_session_id uuid
)
returns table(app_role text,session_active boolean)
language sql stable security definer set search_path=''
as $$
  select ur.role::text,
         exists(
           select 1 from auth.sessions s
           where s.id=p_session_id and s.user_id=p_user_id
         ) as session_active
  from public.user_roles ur
  where ur.user_id=p_user_id
  limit 1;
$$;

revoke all on function public.jb_team_actor_context_internal(uuid,uuid)
  from public,anon,authenticated;
grant execute on function public.jb_team_actor_context_internal(uuid,uuid)
  to service_role;
