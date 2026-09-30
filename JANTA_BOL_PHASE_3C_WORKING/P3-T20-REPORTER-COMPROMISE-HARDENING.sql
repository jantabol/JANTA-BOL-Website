create or replace function public.jb_live_suspend_reporter_internal(
  p_owner_user_id uuid,
  p_reporter_user_id uuid,
  p_reason text default 'REPORTER_ACCOUNT_SUSPENDED'::text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_session_id uuid;
  v_count integer:=0;
  v_auth_sessions_revoked integer:=0;
  v_reason text:=left(btrim(coalesce(p_reason,'REPORTER_ACCOUNT_SUSPENDED')),240);
begin
  if not exists(
    select 1 from public.user_roles
    where user_id=p_owner_user_id and role='owner'::public.app_role
  ) then raise exception 'OWNER_REQUIRED'; end if;

  if not exists(
    select 1 from public.user_roles
    where user_id=p_reporter_user_id and role='reporter'::public.app_role
  ) then raise exception 'REPORTER_ROLE_REQUIRED'; end if;

  update public.reporters
  set active=false
  where user_id=p_reporter_user_id;

  for v_session_id in
    select distinct session_id
    from public.live_session_members
    where user_id=p_reporter_user_id
      and permission='BROADCAST'
      and status in ('ACTIVE','SUSPENDED','REVOKING')
  loop
    perform public.jb_live_revoke_permission_internal(
      p_owner_user_id,v_session_id,v_reason
    );
    v_count:=v_count+1;
  end loop;

  update public.encoder_handoffs
  set revoked_at=coalesce(revoked_at,now())
  where reporter_id=p_reporter_user_id
    and used_at is null
    and revoked_at is null;

  delete from auth.sessions
  where user_id=p_reporter_user_id;
  get diagnostics v_auth_sessions_revoked=row_count;

  insert into public.audit_logs(actor_user_id,action,record_type,record_id,metadata)
  values(
    p_owner_user_id,'reporter_account_suspended','reporter_user',p_reporter_user_id::text,
    jsonb_build_object(
      'reason',v_reason,
      'live_permissions_revoked',v_count,
      'auth_sessions_revoked',v_auth_sessions_revoked
    )
  );

  return jsonb_build_object(
    'reporter_user_id',p_reporter_user_id,
    'reporter_active',false,
    'live_permissions_revoked',v_count,
    'auth_sessions_revoked',v_auth_sessions_revoked
  );
end;
$function$;
