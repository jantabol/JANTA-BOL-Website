-- JANTA BOL Phase 3C M2
-- Future-session capability sync on Live approval.
-- Applied to production as migration: phase3c_sync_default_capabilities_on_live_approval
-- Purpose: every newly approved canonical Live Session receives the Phase 3B
-- default Reporter capabilities immediately, without a manual/backfill step.
-- Existing session/article/provider identity rules are unchanged.

create or replace function public.jb_live_approve_request_internal(
  p_owner_user_id uuid,
  p_request_id uuid,
  p_expected_state_version bigint
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_req public.live_requests%rowtype;
  v_reporter_profile public.reporters%rowtype;
  v_article_id uuid;
  v_session_id uuid;
  v_generation_id uuid;
  v_operation_id uuid;
  v_existing_session public.live_sessions%rowtype;
begin
  if not exists(
    select 1 from public.user_roles
    where user_id=p_owner_user_id and role='owner'::public.app_role
  ) then
    raise exception 'OWNER_REQUIRED';
  end if;

  select * into v_req
  from public.live_requests
  where request_id=p_request_id
  for update;

  if not found then raise exception 'REQUEST_NOT_FOUND'; end if;

  if v_req.request_status='APPROVED' then
    select * into v_existing_session
    from public.live_sessions where request_id=p_request_id;

    if v_existing_session.id is not null then
      perform public.jb_live_sync_default_capabilities_internal(
        p_owner_user_id,
        v_existing_session.id
      );
    end if;

    return jsonb_build_object(
      'request_id',v_req.request_id,
      'request_status',v_req.request_status,
      'state_version',v_req.state_version,
      'session_id',v_existing_session.id,
      'article_id',v_existing_session.article_id,
      'session_status',v_existing_session.session_status,
      'public_status',v_existing_session.public_status,
      'idempotent',true
    );
  end if;

  if v_req.request_status<>'PENDING' then raise exception 'REQUEST_NOT_PENDING'; end if;
  if v_req.state_version<>p_expected_state_version then raise exception 'REQUEST_STATE_CHANGED'; end if;

  select * into v_reporter_profile
  from public.reporters
  where user_id=v_req.reporter_id
  limit 1;

  if v_reporter_profile.id is not null and v_reporter_profile.active=false then
    raise exception 'REPORTER_DISABLED';
  end if;

  insert into public.articles(
    slug,title,body,excerpt,category,location,reporter_name,status,
    created_by,updated_by
  ) values (
    'live-'||replace(v_req.request_id::text,'-',''),
    v_req.headline,'',v_req.description,'Live',v_req.location,
    coalesce(v_reporter_profile.name,'JANTA BOL Reporter'),
    'draft'::public.article_status,p_owner_user_id,p_owner_user_id
  ) returning id into v_article_id;

  insert into public.article_sources(
    article_id,source_type,source_name,internal_note,verification_status,public_attribution
  ) values (
    v_article_id,'JANTA BOL Reporter',coalesce(v_reporter_profile.name,'JANTA BOL Reporter'),
    'Phase 3A Live Request '||v_req.request_id::text,
    'Pending Verification',''
  );

  update public.live_requests
  set request_status='APPROVED',
      approved_at=now(),
      approved_by=p_owner_user_id,
      state_version=state_version+1
  where request_id=p_request_id;

  insert into public.live_sessions(
    request_id,article_id,reporter_id,assigned_reporter_id,headline,
    active,session_status,public_status,state_version
  ) values (
    p_request_id,v_article_id,v_reporter_profile.id,v_req.reporter_id,v_req.headline,
    false,'PROVISIONING','OFF',1
  ) returning id into v_session_id;

  insert into public.live_session_members(
    session_id,user_id,permission,status,grant_version
  ) values (
    v_session_id,v_req.reporter_id,'BROADCAST','ACTIVE',1
  );

  perform public.jb_live_sync_default_capabilities_internal(
    p_owner_user_id,
    v_session_id
  );

  insert into public.live_provider_generations(
    session_id,generation_number,provider,provider_state,credential_status,is_current
  ) values (
    v_session_id,1,'youtube','PENDING','SERVER_ONLY',true
  ) returning generation_id into v_generation_id;

  update public.live_sessions
  set current_provider_generation=v_generation_id
  where id=v_session_id;

  insert into public.live_operations(
    operation_type,session_id,generation_id,operation_state
  ) values (
    'PROVISION_LIVE',v_session_id,v_generation_id,'QUEUED'
  ) returning operation_id into v_operation_id;

  insert into public.audit_logs(actor_user_id,action,record_type,record_id,metadata)
  values
    (p_owner_user_id,'live_request_approved','live_request',p_request_id::text,
      jsonb_build_object('state_version',p_expected_state_version)),
    (p_owner_user_id,'live_session_created','live_session',v_session_id::text,
      jsonb_build_object('article_id',v_article_id,'request_id',p_request_id)),
    (p_owner_user_id,'live_provisioning_queued','live_operation',v_operation_id::text,
      jsonb_build_object('session_id',v_session_id,'generation_id',v_generation_id));

  return jsonb_build_object(
    'request_id',p_request_id,
    'request_status','APPROVED',
    'state_version',p_expected_state_version+1,
    'session_id',v_session_id,
    'article_id',v_article_id,
    'generation_id',v_generation_id,
    'operation_id',v_operation_id,
    'session_status','PROVISIONING',
    'public_status','OFF',
    'idempotent',false
  );
end;
$function$;
