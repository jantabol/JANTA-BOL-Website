\set ON_ERROR_STOP on
begin;

create temporary table ci_phase3_flow_results(
  test_id text primary key,
  ok boolean not null,
  detail text not null
) on commit drop;

do $$
declare
  v_owner uuid;
  v_reporter uuid;
  v_req_approve uuid;
  v_req_reject uuid;
  v_result jsonb;
  v_second jsonb;
  v_session uuid;
  v_article uuid;
  v_count_before bigint;
  v_count_after bigint;
begin
  select user_id into v_owner
  from public.user_roles
  where role='owner'::public.app_role
  limit 1;

  select r.user_id into v_reporter
  from public.reporters r
  join public.user_roles ur on ur.user_id=r.user_id
  where ur.role='reporter'::public.app_role
    and r.active=true
  order by r.created_at
  limit 1;

  if v_owner is null or v_reporter is null then
    raise exception 'CI_FLOW_ACTORS_MISSING';
  end if;

  insert into public.live_requests(
    reporter_id,headline,location,description,expected_duration_minutes,
    request_status,state_version,client_action_id
  ) values(
    v_reporter,'CI Approve Flow','CI Location','CI approval transaction',30,
    'PENDING',1,gen_random_uuid()
  )
  returning request_id into v_req_approve;

  begin
    perform public.jb_live_approve_request_internal(v_reporter,v_req_approve,1);
    insert into ci_phase3_flow_results values(
      '3A-P1-T028',false,'Reporter unexpectedly approved own Live Request.'
    );
  exception when others then
    insert into ci_phase3_flow_results values(
      '3A-P1-T028',
      position('OWNER_REQUIRED' in sqlerrm)>0,
      'Live approval is rejected for Reporter authority; Owner is required.'
    );
  end;

  v_result := public.jb_live_approve_request_internal(v_owner,v_req_approve,1);
  v_session := (v_result->>'session_id')::uuid;
  v_article := (v_result->>'article_id')::uuid;

  insert into ci_phase3_flow_results values(
    '3A-P1-T029',
    (select request_status='APPROVED' and approved_at is not null and approved_by=v_owner
       from public.live_requests where request_id=v_req_approve)
    and (select session_status='PROVISIONING' and public_status='OFF'
       from public.live_sessions where id=v_session),
    'Approval creates Approved + Live Setup/PROVISIONING state; it does not falsely claim Live Ready/Public LIVE.'
  );

  select count(*) into v_count_before
  from public.live_sessions where request_id=v_req_approve;

  v_second := public.jb_live_approve_request_internal(v_owner,v_req_approve,2);

  select count(*) into v_count_after
  from public.live_sessions where request_id=v_req_approve;

  insert into ci_phase3_flow_results values(
    '3A-P1-T032',
    v_count_before=1
    and v_count_after=1
    and (v_second->>'idempotent')::boolean=true
    and (v_second->>'session_id')::uuid=v_session
    and (v_second->>'article_id')::uuid=v_article,
    'Approved Request produces exactly one canonical Session; repeated approval returns the same Session/Article.'
  );

  insert into ci_phase3_flow_results values(
    '3A-P1-T033',
    v_session is not null
    and exists(select 1 from public.live_sessions where id=v_session)
    and exists(
      select 1 from pg_constraint
      where conrelid='public.live_sessions'::regclass
        and contype='p'
    ),
    'Live Session has a non-null UUID identity protected by the table primary key.'
  );

  insert into ci_phase3_flow_results values(
    '3A-P2-T030',
    v_count_after=1
    and exists(
      select 1 from pg_constraint
      where conrelid='public.live_sessions'::regclass
        and conname='live_sessions_request_unique'
        and contype='u'
    ),
    'One Live Request is functionally idempotent and database-enforced to maximum one canonical Live Session.'
  );

  insert into ci_phase3_flow_results values(
    '3A-P2-T055',
    (select request_status='APPROVED' and state_version=2
       from public.live_requests where request_id=v_req_approve),
    'Canonical Pending Request successfully follows the controlled PENDING -> APPROVED path.'
  );

  insert into public.live_requests(
    reporter_id,headline,location,description,expected_duration_minutes,
    request_status,state_version,client_action_id
  ) values(
    v_reporter,'CI Reject Flow','CI Location','CI rejection transaction',30,
    'PENDING',1,gen_random_uuid()
  )
  returning request_id into v_req_reject;

  begin
    perform public.jb_live_reject_request_internal(
      v_owner,v_req_reject,1,'   '
    );
    insert into ci_phase3_flow_results values(
      '3A-P1-T030',false,'Blank rejection reason unexpectedly accepted.'
    );
  exception when others then
    insert into ci_phase3_flow_results values(
      '3A-P1-T030',
      position('REJECTION_REASON_REQUIRED' in sqlerrm)>0,
      'Reject path requires a reason before decision is accepted.'
    );
  end;

  v_result := public.jb_live_reject_request_internal(
    v_owner,v_req_reject,1,'CI Verification Needed'
  );

  update ci_phase3_flow_results
  set ok = ok
    and (select request_status='REJECTED'
                and rejection_reason='CI Verification Needed'
                and rejected_at is not null
                and rejected_by=v_owner
         from public.live_requests where request_id=v_req_reject)
    and exists(
      select 1 from public.audit_logs
      where action='live_request_rejected'
        and record_type='live_request'
        and record_id=v_req_reject::text
        and actor_user_id=v_owner
        and metadata->>'reason'='CI Verification Needed'
    ),
    detail = detail || ' Accepted rejection preserves reason, actor, time and audit history.'
  where test_id='3A-P1-T030';

  insert into ci_phase3_flow_results values(
    '3A-P1-T031',
    (select request_status='REJECTED' from public.live_requests where request_id=v_req_reject)
    and not exists(select 1 from public.live_sessions where request_id=v_req_reject)
    and exists(
      select 1 from public.audit_logs
      where action='live_request_rejected'
        and record_id=v_req_reject::text
    ),
    'Rejected Request remains recorded/audited and creates no public/canonical Live Session.'
  );

  insert into ci_phase3_flow_results values(
    '3A-P2-T073',
    (select rejection_reason='CI Verification Needed'
       from public.live_requests where request_id=v_req_reject)
    and exists(
      select 1 from public.audit_logs
      where action='live_request_rejected'
        and record_id=v_req_reject::text
        and metadata->>'reason'='CI Verification Needed'
    ),
    'Admin Reject operation preserves the rejection reason in canonical state and audit.'
  );

  update ci_phase3_flow_results
  set ok = ok
    and (select request_status='REJECTED' and state_version=2
         from public.live_requests where request_id=v_req_reject),
    detail = 'Canonical Request states prove both controlled PENDING -> APPROVED and PENDING -> REJECTED paths.'
  where test_id='3A-P2-T055';

  begin
    perform public.jb_live_approve_request_internal(v_owner,v_req_reject,2);
    if true then
      raise exception 'CI_ARBITRARY_JUMP_ACCEPTED';
    end if;
  exception
    when others then
      if position('REQUEST_NOT_PENDING' in sqlerrm)=0 then
        raise;
      end if;
  end;
end $$;

select
  case when ok then 'PASS' else 'FAIL' end
  || ' [' || test_id || '] '
  || detail
from ci_phase3_flow_results
order by test_id;

do $$
declare
  failed_ids text;
begin
  select string_agg(test_id, ', ' order by test_id)
  into failed_ids
  from ci_phase3_flow_results
  where not ok;

  if failed_ids is not null then
    raise exception 'PHASE3_FLOW_REGRESSION_FAILED: %', failed_ids;
  end if;
end $$;

rollback;
