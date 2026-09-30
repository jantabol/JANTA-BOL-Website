\set ON_ERROR_STOP on
begin;

create temporary table ci_phase3_state_results(
  test_id text primary key,
  ok boolean not null,
  detail text not null
) on commit drop;

do $$
declare
  v_owner uuid;
  v_reporter uuid;
  v_request uuid;
  v_req_constraint text;
  v_session_constraint text;
  v_operation_constraint text;
  v_activate_def text;
  v_interrupt_def text;
  v_succeeded_def text;
  v_failed_def text;
  v_retry_def text;
  v_ambiguous_def text;
  v_cancel_blocks_approval boolean:=false;
begin
  select user_id into v_owner
  from public.user_roles
  where role='owner'::public.app_role
  limit 1;

  select r.user_id into v_reporter
  from public.reporters r
  join public.user_roles ur on ur.user_id=r.user_id
  where ur.role='reporter'::public.app_role and r.active=true
  order by r.created_at
  limit 1;

  if v_owner is null or v_reporter is null then
    raise exception 'CI_STATE_MACHINE_ACTORS_MISSING';
  end if;

  select pg_get_constraintdef(oid) into v_req_constraint
  from pg_constraint
  where conrelid='public.live_requests'::regclass
    and conname='live_requests_request_status_check';

  select pg_get_constraintdef(oid) into v_session_constraint
  from pg_constraint
  where conrelid='public.live_sessions'::regclass
    and conname='live_sessions_session_status_check';

  select pg_get_constraintdef(oid) into v_operation_constraint
  from pg_constraint
  where conrelid='public.live_operations'::regclass
    and conname='live_operations_operation_state_check';

  select pg_get_functiondef(p.oid) into v_activate_def
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='jb_live_activate_public_internal'
  limit 1;

  select pg_get_functiondef(p.oid) into v_interrupt_def
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='jb_live_mark_interrupted_internal'
  limit 1;

  select pg_get_functiondef(p.oid) into v_succeeded_def
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='jb_live_mark_operation_succeeded_internal'
  limit 1;

  select pg_get_functiondef(p.oid) into v_failed_def
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='jb_live_mark_operation_failed_internal'
  limit 1;

  select pg_get_functiondef(p.oid) into v_retry_def
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='jb_live_mark_operation_retry_internal'
  limit 1;

  select pg_get_functiondef(p.oid) into v_ambiguous_def
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='jb_live_mark_operation_ambiguous_internal'
  limit 1;

  insert into public.live_requests(
    reporter_id,headline,location,description,expected_duration_minutes,
    request_status,state_version,client_action_id
  ) values(
    v_reporter,'CI State T056','CI State Location','state machine fixture',30,
    'PENDING',1,gen_random_uuid()
  ) returning request_id into v_request;

  update public.live_requests
  set request_status='CANCELLED',
      cancelled_at=now(),
      state_version=state_version+1
  where request_id=v_request and request_status='PENDING';

  begin
    perform public.jb_live_approve_request_internal(v_owner,v_request,2);
  exception when others then
    v_cancel_blocks_approval := position('REQUEST_NOT_PENDING' in sqlerrm)>0;
  end;

  insert into ci_phase3_state_results values(
    '3A-P2-T056',
    v_req_constraint ilike '%PENDING%'
      and v_req_constraint ilike '%APPROVED%'
      and v_req_constraint ilike '%REJECTED%'
      and v_req_constraint ilike '%CANCELLED%'
      and v_cancel_blocks_approval,
    'Request state constraint includes PENDING/APPROVED/REJECTED/CANCELLED and a CANCELLED request cannot later take the approval path.'
  );

  insert into ci_phase3_state_results values(
    '3A-P2-T057',
    v_session_constraint ilike '%PROVISIONING%'
      and v_session_constraint ilike '%READY%'
      and v_session_constraint ilike '%WAITING_SIGNAL%'
      and v_session_constraint ilike '%SIGNAL_ACTIVE%',
    'Canonical Session-state constraint contains PROVISIONING -> READY -> WAITING_SIGNAL -> SIGNAL_ACTIVE concepts.'
  );

  insert into ci_phase3_state_results values(
    '3A-P2-T058',
    v_session_constraint ilike '%LIVE%'
      and v_session_constraint ilike '%RECONNECTING%'
      and v_session_constraint ilike '%PROVISIONING_FAILED%'
      and v_activate_def ilike '%session_status=''LIVE''%'
      and v_interrupt_def ilike '%session_status=''RECONNECTING''%',
    'Session-state constraint contains LIVE/RECONNECTING/PROVISIONING_FAILED and backend transitions implement LIVE and RECONNECTING.'
  );

  insert into ci_phase3_state_results values(
    '3A-P2-T059',
    v_session_constraint ilike '%SIGNAL_ACTIVE%'
      and v_session_constraint ilike '%PROVISIONING_FAILED%'
      and exists(
        select 1 from pg_constraint
        where conrelid='public.live_sessions'::regclass
          and conname='live_sessions_public_status_check'
          and pg_get_constraintdef(oid) ilike '%OFF%'
          and pg_get_constraintdef(oid) ilike '%LIVE%'
          and pg_get_constraintdef(oid) ilike '%INTERRUPTED%'
      ),
    'Database-standardized technical state names remain authoritative concepts and public state is constrained separately.'
  );

  insert into ci_phase3_state_results values(
    '3A-P2-T064',
    v_operation_constraint ilike '%QUEUED%'
      and v_operation_constraint ilike '%PROCESSING%'
      and v_operation_constraint ilike '%SUCCEEDED%'
      and v_succeeded_def ilike '%operation_state=''SUCCEEDED''%',
    'Privileged operation state constraint and success RPC implement QUEUED -> PROCESSING -> SUCCEEDED.'
  );

  insert into ci_phase3_state_results values(
    '3A-P2-T065',
    v_operation_constraint ilike '%RETRY_PENDING%'
      and v_operation_constraint ilike '%FAILED_NEEDS_ATTENTION%'
      and v_operation_constraint ilike '%CANCELLED_STALE%'
      and v_operation_constraint ilike '%AMBIGUOUS%'
      and v_retry_def ilike '%operation_state=''RETRY_PENDING''%'
      and v_failed_def ilike '%operation_state=''FAILED_NEEDS_ATTENTION''%'
      and v_ambiguous_def ilike '%operation_state=''AMBIGUOUS''%',
    'Privileged operation failure/recovery states are constrained and implemented through dedicated transition RPCs.'
  );
end $$;

select
  case when ok then 'PASS' else 'FAIL' end
  || ' [' || test_id || '] '
  || detail
from ci_phase3_state_results
order by test_id;

do $$
declare
  failed_ids text;
begin
  select string_agg(test_id, ', ' order by test_id)
  into failed_ids
  from ci_phase3_state_results
  where not ok;
  if failed_ids is not null then
    raise exception 'PHASE3_STATE_MACHINE_REGRESSION_FAILED: %', failed_ids;
  end if;
end $$;

rollback;
