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
    token_hash,session_id,reporter_id,generation_id,grant_version,expires_at
  ) values(
    encode(digest(gen_random_uuid()::text,'sha256'),'hex'),
    v_session,v_a,v_gen,1,now()+interval '5 minutes'
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

insert into ci_phase3_access_results
select
  '3A-P3-T108',
  not exists(
    select 1
    from public.live_requests r
    join ci_phase3_access_fixture f on r.request_id=f.request_b
  ),
  'Generic authenticated database role does not automatically gain Reporter/Owner access to internal Live Requests.';

insert into ci_phase3_access_results
select
  '3A-P3-T109',
  not exists(
    select 1
    from public.live_requests r
    join ci_phase3_access_fixture f on r.request_id=f.request_b
  )
  and not exists(
    select 1
    from public.live_sessions s
    join ci_phase3_access_fixture f on s.id=f.session_id
  ),
  'Knowing another Reporter Request/Session UUID does not grant direct authenticated access to internal Live state.';

with changed as (
  update public.live_sessions s
  set headline='UNAUTHORIZED DIRECT CHANGE'
  from ci_phase3_access_fixture f
  where s.id=f.session_id
  returning s.id
)
insert into ci_phase3_access_results
select
  '3A-P3-T110',
  not exists(select 1 from changed),
  'Authenticated client cannot broadly direct-UPDATE sensitive Live Session state.';

with changed as (
  update public.live_session_members m
  set revocation_reason='UNAUTHORIZED COLUMN CHANGE'
  from ci_phase3_access_fixture f
  where m.membership_id=f.membership_id
  returning m.membership_id
)
insert into ci_phase3_access_results
select
  '3A-P3-T111',
  not exists(select 1 from changed),
  'Sensitive membership columns are not broadly directly writable by an authenticated client.';

do $$
declare
  f ci_phase3_access_fixture%rowtype;
begin
  select * into f from ci_phase3_access_fixture limit 1;
  begin
    insert into public.live_session_members(
      session_id,user_id,permission,status,grant_version,member_role,is_current_primary
    ) values(
      f.session_id,f.reporter_b,'BROADCAST','ACTIVE',999,'REPORTER',false
    );
    insert into ci_phase3_access_results values(
      '3A-P3-T112',false,'Authenticated client unexpectedly self-assigned Live membership.'
    );
  exception when others then
    insert into ci_phase3_access_results values(
      '3A-P3-T112',true,
      'Authenticated client cannot self-assign membership/change permission/grant authority through direct table access.'
    );
  end;
end $$;

insert into ci_phase3_access_results
select
  '3A-P3-T113',
  not exists(
    select 1 from public.live_provider_generations g
    join ci_phase3_access_fixture f on g.generation_id=f.generation_id
  ),
  'Provider generations/provider internals are not directly readable by authenticated client role.';

insert into ci_phase3_access_results
select
  '3A-P3-T114',
  not exists(
    select 1 from public.encoder_handoffs h
    join ci_phase3_access_fixture f on h.handoff_id=f.handoff_id
  ),
  'Encoder handoff table is internal and not directly queryable by authenticated client role.';

insert into ci_phase3_access_results
select
  '3A-P3-T115',
  not exists(
    select 1 from public.live_operations o
    join ci_phase3_access_fixture f on o.operation_id=f.operation_id
  ),
  'Privileged Live operation journal is not directly readable by authenticated client role.';

with changed as (
  update public.audit_logs a
  set action='UNAUTHORIZED_AUDIT_CHANGE'
  from ci_phase3_access_fixture f
  where a.id=f.audit_id
  returning a.id
),
deleted as (
  delete from public.audit_logs a
  using ci_phase3_access_fixture f
  where a.id=f.audit_id
  returning a.id
)
insert into ci_phase3_access_results
select
  '3A-P3-T117',
  not exists(select 1 from changed) and not exists(select 1 from deleted),
  'Authenticated user cannot alter or delete security audit history directly.';

reset role;
set local role anon;

insert into ci_phase3_access_results
select
  '3A-P3-T118',
  exists(
    select 1 from public.public_live_feed p
    join ci_phase3_access_fixture f on p.article_id=f.article_id
  )
  and not exists(
    select 1 from public.live_sessions s
    join ci_phase3_access_fixture f on s.id=f.session_id
  ),
  'Anonymous viewer reads dedicated sanitized public Live projection but not internal Live Session table.';

with changed as (
  update public.public_live_feed p
  set headline='UNAUTHORIZED PUBLIC WRITE'
  from ci_phase3_access_fixture f
  where p.article_id=f.article_id
  returning p.article_id
),
deleted as (
  delete from public.public_live_feed p
  using ci_phase3_access_fixture f
  where p.article_id=f.article_id
  returning p.article_id
)
insert into ci_phase3_access_results
select
  '3A-P3-T120',
  not exists(select 1 from changed) and not exists(select 1 from deleted),
  'Anonymous/public client cannot UPDATE or DELETE public Live feed state.';

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
