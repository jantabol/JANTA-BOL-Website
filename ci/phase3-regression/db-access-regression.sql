\set ON_ERROR_STOP on
begin;

create temporary table ci_phase3_access_results(
  test_id text primary key,
  ok boolean not null,
  detail text not null
) on commit drop;

create temporary table ci_phase3_access_fixture(
  owner_id uuid,
  reporter_a uuid,
  reporter_b uuid,
  article_id uuid,
  session_id uuid,
  membership_id uuid,
  request_b uuid,
  generation_id uuid,
  operation_id uuid,
  handoff_id uuid,
  audit_id bigint
) on commit drop;

grant select,insert,update,delete on ci_phase3_access_results to authenticated, anon;
grant select on ci_phase3_access_fixture to authenticated, anon;

do $$
declare
  v_owner uuid;
  v_a uuid;
  v_b uuid;
  v_a_row uuid;
  v_article uuid;
  v_session uuid;
  v_member uuid;
  v_request uuid;
  v_gen uuid;
  v_op uuid;
  v_handoff uuid;
  v_audit bigint;
begin
  select user_id into v_owner
  from public.user_roles where role='owner'::public.app_role limit 1;

  select r.user_id,r.id into v_a,v_a_row
  from public.reporters r
  join public.user_roles ur on ur.user_id=r.user_id
  where ur.role='reporter'::public.app_role and r.active=true
  order by r.created_at
  limit 1;

  select r.user_id into v_b
  from public.reporters r
  join public.user_roles ur on ur.user_id=r.user_id
  where ur.role='reporter'::public.app_role and r.active=true and r.user_id<>v_a
  order by r.created_at
  limit 1;

  if v_owner is null or v_a is null or v_b is null then
    raise exception 'CI_ACCESS_ACTORS_MISSING';
  end if;

  insert into public.articles(
    slug,title,body,status,created_by,updated_by,published_at
  ) values(
    'ci-access-'||replace(gen_random_uuid()::text,'-',''),
    'CI Access Public','fixture','published',v_owner,v_owner,now()
  )
  returning id into v_article;

  insert into public.live_sessions(
    article_id,reporter_id,assigned_reporter_id,headline,
    active,session_status,public_status,approved_at
  ) values(
    v_article,v_a_row,v_a,'CI Access Session',
    false,'ENDED','OFF',now()
  )
  returning id into v_session;

  insert into public.public_live_feed(
    article_id,permanent_url,headline,public_status,final_report_published
  ) values(
    v_article,'article.html?id='||v_article::text,'CI Access Public','OFF',true
  );

  insert into public.live_session_members(
    session_id,user_id,permission,status,grant_version,member_role,is_current_primary
  ) values(
    v_session,v_a,'BROADCAST','ACTIVE',1,'REPORTER',true
  )
  returning membership_id into v_member;

  insert into public.live_requests(
    reporter_id,headline,location,description,expected_duration_minutes,
    request_status,state_version,client_action_id
  ) values(
    v_b,'Reporter B private request','Private location','private fixture',30,
    'PENDING',1,gen_random_uuid()
  )
  returning request_id into v_request;

  insert into public.live_provider_generations(
    session_id,generation_number,provider,provider_state,credential_status,is_current
  ) values(
    v_session,1,'youtube','PENDING','SERVER_ONLY',true
  )
  returning generation_id into v_gen;

  update public.live_sessions
  set current_provider_generation=v_gen
  where id=v_session;

  insert into public.live_operations(
    operation_type,session_id,generation_id,operation_state
  ) values(
    'PROVISION_LIVE',v_session,v_gen,'QUEUED'
  )
  returning operation_id into v_op;

  insert into public.encoder_handoffs(
    token_hash,session_id,reporter_id,generation_id,grant_version,expires_at,connector_key
  ) values(
    encode(digest(gen_random_uuid()::text,'sha256'),'hex'),
    v_session,v_a,v_gen,1,now()+interval '5 minutes','larix_android'
  )
  returning handoff_id into v_handoff;

  insert into public.audit_logs(
    actor_user_id,action,record_type,record_id,metadata
  ) values(
    v_owner,'ci_access_fixture','live_session',v_session::text,'{}'::jsonb
  )
  returning id into v_audit;

  insert into ci_phase3_access_fixture values(
    v_owner,v_a,v_b,v_article,v_session,v_member,v_request,v_gen,v_op,v_handoff,v_audit
  );
end $$;

set local role authenticated;

do $$
declare
  f ci_phase3_access_fixture%rowtype;
  v_count integer:=0;
begin
  select * into f from ci_phase3_access_fixture limit 1;
  begin
    select count(*) into v_count from public.live_requests where request_id=f.request_b;
    insert into ci_phase3_access_results values(
      '3A-P3-T108',v_count=0,
      'Generic authenticated role does not automatically gain internal Live Request access.'
    );
  exception when insufficient_privilege then
    insert into ci_phase3_access_results values(
      '3A-P3-T108',true,
      'Generic authenticated role is denied direct access to internal Live Requests at database privilege boundary.'
    );
  end;
end $$;

do $$
declare
  f ci_phase3_access_fixture%rowtype;
  v_req_ok boolean:=false;
  v_session_ok boolean:=false;
  v_count integer;
begin
  select * into f from ci_phase3_access_fixture limit 1;

  begin
    select count(*) into v_count from public.live_requests where request_id=f.request_b;
    v_req_ok := (v_count=0);
  exception when insufficient_privilege then
    v_req_ok := true;
  end;

  begin
    select count(*) into v_count from public.live_sessions where id=f.session_id;
    v_session_ok := (v_count=0);
  exception when insufficient_privilege then
    v_session_ok := true;
  end;

  insert into ci_phase3_access_results values(
    '3A-P3-T109',v_req_ok and v_session_ok,
    'Knowing another Reporter Request/Session UUID does not grant direct authenticated access to internal Live state.'
  );
end $$;

do $$
declare
  f ci_phase3_access_fixture%rowtype;
  v_rows integer:=0;
  v_ok boolean:=false;
begin
  select * into f from ci_phase3_access_fixture limit 1;
  begin
    update public.live_sessions
    set headline='UNAUTHORIZED DIRECT CHANGE'
    where id=f.session_id;
    get diagnostics v_rows = row_count;
    v_ok := (v_rows=0);
  exception when insufficient_privilege then
    v_ok := true;
  end;
  insert into ci_phase3_access_results values(
    '3A-P3-T110',v_ok,
    'Authenticated client cannot broadly direct-UPDATE sensitive Live Session state.'
  );
end $$;

do $$
declare
  f ci_phase3_access_fixture%rowtype;
  v_rows integer:=0;
  v_ok boolean:=false;
begin
  select * into f from ci_phase3_access_fixture limit 1;
  begin
    update public.live_session_members
    set revocation_reason='UNAUTHORIZED COLUMN CHANGE'
    where membership_id=f.membership_id;
    get diagnostics v_rows = row_count;
    v_ok := (v_rows=0);
  exception when insufficient_privilege then
    v_ok := true;
  end;
  insert into ci_phase3_access_results values(
    '3A-P3-T111',v_ok,
    'Sensitive membership columns are not broadly directly writable by an authenticated client.'
  );
end $$;

do $$
declare
  f ci_phase3_access_fixture%rowtype;
  v_ok boolean:=false;
begin
  select * into f from ci_phase3_access_fixture limit 1;
  begin
    insert into public.live_session_members(
      session_id,user_id,permission,status,grant_version,member_role,is_current_primary
    ) values(
      f.session_id,f.reporter_b,'BROADCAST','ACTIVE',999,'REPORTER',false
    );
    v_ok := false;
  exception when others then
    v_ok := (sqlstate='42501' or position('row-level security' in lower(sqlerrm))>0 or position('permission denied' in lower(sqlerrm))>0);
  end;

  insert into ci_phase3_access_results values(
    '3A-P3-T112',v_ok,
    'Authenticated client cannot self-assign Live membership or directly choose permission/grant authority.'
  );
end $$;

do $$
declare
  f ci_phase3_access_fixture%rowtype;
  v_count integer:=0;
  v_ok boolean:=false;
begin
  select * into f from ci_phase3_access_fixture limit 1;
  begin
    select count(*) into v_count from public.live_provider_generations where generation_id=f.generation_id;
    v_ok := (v_count=0);
  exception when insufficient_privilege then
    v_ok := true;
  end;
  insert into ci_phase3_access_results values(
    '3A-P3-T113',v_ok,
    'Provider generation/provider internals are denied to direct authenticated client access.'
  );
end $$;

do $$
declare
  f ci_phase3_access_fixture%rowtype;
  v_count integer:=0;
  v_ok boolean:=false;
begin
  select * into f from ci_phase3_access_fixture limit 1;
  begin
    select count(*) into v_count from public.encoder_handoffs where handoff_id=f.handoff_id;
    v_ok := (v_count=0);
  exception when insufficient_privilege then
    v_ok := true;
  end;
  insert into ci_phase3_access_results values(
    '3A-P3-T114',v_ok,
    'Encoder handoff table is internal and not directly queryable by authenticated client role.'
  );
end $$;

do $$
declare
  f ci_phase3_access_fixture%rowtype;
  v_count integer:=0;
  v_ok boolean:=false;
begin
  select * into f from ci_phase3_access_fixture limit 1;
  begin
    select count(*) into v_count from public.live_operations where operation_id=f.operation_id;
    v_ok := (v_count=0);
  exception when insufficient_privilege then
    v_ok := true;
  end;
  insert into ci_phase3_access_results values(
    '3A-P3-T115',v_ok,
    'Privileged Live operation journal is denied to direct authenticated client access.'
  );
end $$;

do $$
declare
  f ci_phase3_access_fixture%rowtype;
  v_rows integer:=0;
  v_update_ok boolean:=false;
  v_delete_ok boolean:=false;
begin
  select * into f from ci_phase3_access_fixture limit 1;

  begin
    update public.audit_logs set action='UNAUTHORIZED_AUDIT_CHANGE' where id=f.audit_id;
    get diagnostics v_rows = row_count;
    v_update_ok := (v_rows=0);
  exception when insufficient_privilege then
    v_update_ok := true;
  end;

  begin
    delete from public.audit_logs where id=f.audit_id;
    get diagnostics v_rows = row_count;
    v_delete_ok := (v_rows=0);
  exception when insufficient_privilege then
    v_delete_ok := true;
  end;

  insert into ci_phase3_access_results values(
    '3A-P3-T117',v_update_ok and v_delete_ok,
    'Authenticated user cannot alter or delete security audit history directly.'
  );
end $$;

reset role;
set local role anon;

do $$
declare
  f ci_phase3_access_fixture%rowtype;
  v_public_count integer:=0;
  v_internal_count integer:=0;
  v_public_ok boolean:=false;
  v_internal_ok boolean:=false;
begin
  select * into f from ci_phase3_access_fixture limit 1;

  begin
    select count(*) into v_public_count
    from public.public_live_feed where article_id=f.article_id;
    v_public_ok := (v_public_count=1);
  exception when insufficient_privilege then
    v_public_ok := false;
  end;

  begin
    select count(*) into v_internal_count
    from public.live_sessions where id=f.session_id;
    v_internal_ok := (v_internal_count=0);
  exception when insufficient_privilege then
    v_internal_ok := true;
  end;

  insert into ci_phase3_access_results values(
    '3A-P3-T118',v_public_ok and v_internal_ok,
    'Anonymous viewer can read dedicated safe public Live projection but cannot query internal Live Session state.'
  );
end $$;

do $$
declare
  f ci_phase3_access_fixture%rowtype;
  v_rows integer:=0;
  v_update_ok boolean:=false;
  v_delete_ok boolean:=false;
begin
  select * into f from ci_phase3_access_fixture limit 1;

  begin
    update public.public_live_feed
    set headline='UNAUTHORIZED PUBLIC WRITE'
    where article_id=f.article_id;
    get diagnostics v_rows = row_count;
    v_update_ok := (v_rows=0);
  exception when insufficient_privilege then
    v_update_ok := true;
  end;

  begin
    delete from public.public_live_feed where article_id=f.article_id;
    get diagnostics v_rows = row_count;
    v_delete_ok := (v_rows=0);
  exception when insufficient_privilege then
    v_delete_ok := true;
  end;

  insert into ci_phase3_access_results values(
    '3A-P3-T120',v_update_ok and v_delete_ok,
    'Anonymous/public client cannot UPDATE or DELETE public Live feed state.'
  );
end $$;

reset role;

select
  case when ok then 'PASS' else 'FAIL' end
  || ' [' || test_id || '] '
  || detail
from ci_phase3_access_results
order by test_id;

do $$
declare
  failed_ids text;
begin
  select string_agg(test_id, ', ' order by test_id)
  into failed_ids
  from ci_phase3_access_results
  where not ok;

  if failed_ids is not null then
    raise exception 'PHASE3_ACCESS_REGRESSION_FAILED: %', failed_ids;
  end if;
end $$;

rollback;
