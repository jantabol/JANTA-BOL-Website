-- Phase 4 B2 Records API security context
create or replace function public.jb_records_actor_context_internal(
  p_user_id uuid,
  p_session_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_role public.app_role;
  v_session_active boolean:=false;
begin
  select role into v_role from public.user_roles where user_id=p_user_id limit 1;
  select exists(
    select 1 from auth.sessions
    where id=p_session_id and user_id=p_user_id
  ) into v_session_active;
  return jsonb_build_object(
    'app_role',case when v_role is null then null else v_role::text end,
    'session_active',v_session_active
  );
end;
$$;

revoke execute on function public.jb_records_actor_context_internal(uuid,uuid)
from public,anon,authenticated;
grant execute on function public.jb_records_actor_context_internal(uuid,uuid)
to service_role;