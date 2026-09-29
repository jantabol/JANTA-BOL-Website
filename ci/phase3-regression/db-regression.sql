\set ON_ERROR_STOP on
begin;

create temporary table ci_phase3_results(
  test_id text primary key,
  ok boolean not null,
  detail text not null
) on commit drop;

do $$
declare
  v_owner uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_r1_row uuid;
  v_article uuid;
  v_session uuid;
  v_article2 uuid;
  v_session2 uuid;
  v_count_before bigint;
  v_count_after bigint;
  v_url text;
  v_gv_before bigint;
  v_expected timestamptz;
begin
  select user_id into v_owner
  from public.user_roles
  where role='owner'::public.app_role
  limit 1;

  select r.user_id, r.id into v_r1, v_r1_row
  from public.reporters r
  join public.user_roles ur on ur.user_id=r.user_id
  where ur.role='reporter'::public.app_role
    and r.active=true
    and r.live_permission=true
  order by r.created_at
  limit 1;

  select r.user_id into v_r2
  from public.reporters r
  join public.user_roles ur on ur.user_id=r.user_id
  where ur.role='reporter'::public.app_role
    and r.active=true
    and r.live_permission=true
    and r.user_id<>v_r1
  order by r.created_at
  limit 1;

  if v_owner is null or v_r1 is null or v_r2 is null then
    raise exception 'CI_FIXTURE_ACTORS_MISSING';
  end if;

  insert into public.articles(slug,title,body,status,created_by,updated_by)
  values(
    'ci-phase3-'||replace(gen_random_uuid()::text,'-',''),
    'CI Phase3 Regression','transactional fixture','draft',v_owner,v_owner
  )
  returning id into v_article;

  insert into public.live_sessions(
    article_id,reporter_id,assigned_reporter_id,headline,
    active,session_status,public_status,approved_at
  )
  values(v_article,v_r1_row,v_r1,'CI Phase3 Regression',true,'LIVE','LIVE',now())
  returning id into v_session;

  insert into public.public_live_feed(article_id,permanent_url,headline,public_status,playback_reference)
  values(v_article,'article.html?id='||v_article::text,'CI Phase3 Regression','LIVE','ci://playback/'||v_session::text);

  insert into public.live_session_members(
    session_id,user_id,permission,status,grant_version,member_role,is_current_primary
  )
  values(v_session,v_r1,'BROADCAST','ACTIVE',1,'REPORTER',true);

  insert into public.live_session_capabilities(
    session_id,user_id,capability,status,grant_version,granted_by
  )
  values(v_session,v_r1,'BROADCAST_CONTROL','ACTIVE',1,v_owner);

  perform public.jb_live_admin_controls_internal(v_owner,v_session,'PRIORITY_ON',null,'CI');
  insert into ci_phase3_results values(
    '3B-T009',
    (select is_priority from public.live_sessions where id=v_session),
    'Owner can set Priority on active Live.'
  );

  begin
    perform public.jb_live_admin_controls_internal(v_r1,v_session,'PRIORITY_OFF',null,'CI unauthorized');
    insert into ci_phase3_results values('3B-T010',false,'Reporter unexpectedly changed Priority.');
  exception when others then
    insert into ci_phase3_results values(
      '3B-T010',
      position('OWNER_REQUIRED' in sqlerrm)>0,
      'Unauthorized Reporter Priority control rejected.'
    );
  end;

  perform public.jb_live_admin_controls_internal(v_owner,v_session,'PRIORITY_OFF',null,'CI');
  insert into ci_phase3_results values(
    '3B-T013',
    (select not is_priority and session_status='LIVE' and public_status='LIVE' and active
       from public.live_sessions where id=v_session)
    and
    (select not is_priority and public_status='LIVE'
       from public.public_live_feed where article_id=v_article),
    'Priority removed without ending Live.'
  );

  insert into ci_phase3_results values(
    '3B-T014',
    exists(
      select 1 from public.audit_logs
      where record_type='live_session'
        and record_id=v_session::text
        and action='phase3b_admin_control'
        and actor_user_id=v_owner
        and metadata->>'control'='PRIORITY_ON'
    )
    and
    exists(
      select 1 from public.audit_logs
      where record_type='live_session'
        and record_id=v_session::text
        and action='phase3b_admin_control'
        and actor_user_id=v_owner
        and metadata->>'control'='PRIORITY_OFF'
    ),
    'Priority ON/OFF actions audited with actor.'
  );

  v_expected := now()+interval '1 hour';
  perform public.jb_live_reporter_expected_end_internal(v_r1,v_session,v_expected);
  insert into ci_phase3_results values(
    '3B-T016',
    (select id=v_session
            and article_id=v_article
            and expected_end_updated_by=v_r1
            and expected_end_at=v_expected
       from public.live_sessions where id=v_session),
    'Reporter expected-end update preserves Session/Article identity.'
  );

  v_expected := now()+interval '2 hours';
  perform public.jb_live_admin_controls_internal(
    v_owner,v_session,'EXPECTED_END_SET',v_expected::text,'CI override'
  );
  insert into ci_phase3_results values(
    '3B-T017',
    (select expected_end_updated_by=v_owner and expected_end_at=v_expected
       from public.live_sessions where id=v_session),
    'Owner expected-end override becomes authoritative.'
  );

  perform public.jb_live_request_end_internal(v_r1,v_session);
  insert into ci_phase3_results values(
    '3B-T019',
    (select end_requested_by=v_r1 and end_request_source='REPORTER'
       from public.live_sessions where id=v_session),
    'Assigned Reporter can initiate End request.'
  );

  update public.live_sessions
  set end_requested_at=null,end_requested_by=null,end_request_source=null
  where id=v_session;

  begin
    perform public.jb_live_advanced_end_internal(v_owner,v_session,'FORCE_STOP','   ');
    insert into ci_phase3_results values('3B-T026',false,'Blank Force Stop reason unexpectedly accepted.');
  exception when others then
    insert into ci_phase3_results values(
      '3B-T026',
      position('REASON_REQUIRED' in sqlerrm)>0,
      'Blank Force Stop reason rejected.'
    );
  end;

  perform public.jb_live_advanced_end_internal(v_owner,v_session,'FORCE_STOP','CI force stop');

  insert into ci_phase3_results values(
    '3B-T025',
    (select advanced_end_kind='ADMIN_FORCE_STOP'
            and advanced_ended_by=v_owner
            and advanced_ended_at is not null
       from public.live_sessions where id=v_session),
    'Owner can initiate Force Stop without Reporter cooperation.'
  );

  insert into ci_phase3_results values(
    '3B-T027',
    exists(
      select 1 from public.live_session_members
      where session_id=v_session
        and user_id=v_r1
        and permission='BROADCAST'
        and status='REVOKED'
        and not is_current_primary
    )
    and
    exists(
      select 1 from public.live_session_capabilities
      where session_id=v_session
        and user_id=v_r1
        and capability='BROADCAST_CONTROL'
        and status='REVOKED'
    )
    and
    exists(
      select 1 from public.audit_logs
      where record_id=v_session::text
        and action='phase3b_force_stop'
        and actor_user_id=v_owner
        and metadata->>'reason'='CI force stop'
    ),
    'Force Stop revokes broadcast authority and preserves audit reason.'
  );

  -- Separate active fixture for Reporter replacement tests.
  insert into public.articles(slug,title,body,status,created_by,updated_by)
  values(
    'ci-phase3-'||replace(gen_random_uuid()::text,'-',''),
    'CI Replacement','transactional fixture','draft',v_owner,v_owner
  )
  returning id into v_article2;

  insert into public.live_sessions(
    article_id,reporter_id,assigned_reporter_id,headline,
    active,session_status,public_status,approved_at
  )
  values(v_article2,v_r1_row,v_r1,'CI Replacement',true,'LIVE','LIVE',now())
  returning id into v_session2;

  insert into public.public_live_feed(article_id,permanent_url,headline,public_status,playback_reference)
  values(v_article2,'article.html?id='||v_article2::text,'CI Replacement','LIVE','ci://playback/'||v_session2::text);

  insert into public.live_session_members(
    session_id,user_id,permission,status,grant_version,member_role,is_current_primary
  )
  values(v_session2,v_r1,'BROADCAST','ACTIVE',1,'REPORTER',true);

  insert into public.live_session_capabilities(
    session_id,user_id,capability,status,grant_version,granted_by
  )
  values(v_session2,v_r1,'BROADCAST_CONTROL','ACTIVE',1,v_owner);

  select count(*) into v_count_before
  from public.live_sessions
  where article_id=v_article2;

  select permanent_url into v_url
  from public.public_live_feed
  where article_id=v_article2;

  perform public.jb_live_replace_reporter_internal(
    v_owner,v_session2,v_r2,'CI replacement'
  );

  select count(*) into v_count_after
  from public.live_sessions
  where article_id=v_article2;

  insert into ci_phase3_results values(
    '3B-T031',
    (select id=v_session2 from public.live_sessions where id=v_session2),
    'Replacement preserves same Session ID.'
  );

  insert into ci_phase3_results values(
    '3B-T032',
    (select article_id=v_article2 from public.live_sessions where id=v_session2)
    and
    (select permanent_url=v_url from public.public_live_feed where article_id=v_article2),
    'Replacement preserves Article ID and Permanent URL.'
  );

  insert into ci_phase3_results values(
    '3B-T033',
    exists(
      select 1 from public.live_session_members
      where session_id=v_session2
        and user_id=v_r2
        and permission='BROADCAST'
        and status='ACTIVE'
        and is_current_primary
    ),
    'Replacement Reporter receives active session-specific broadcast membership.'
  );

  insert into ci_phase3_results values(
    '3B-T034',
    exists(
      select 1 from public.live_session_members
      where session_id=v_session2
        and user_id=v_r1
        and permission='BROADCAST'
        and status='REVOKED'
        and not is_current_primary
    ),
    'Old Reporter broadcast membership revoked on replacement.'
  );

  insert into ci_phase3_results values(
    '3B-T038',
    v_count_before=1
    and v_count_after=1
    and (select count(*)=1 from public.articles where id=v_article2)
    and (select count(*)=1 from public.public_live_feed where article_id=v_article2),
    'Replacement creates no duplicate Session/Article/public feed.'
  );

  insert into ci_phase3_results values(
    '3B-T039',
    exists(
      select 1 from public.audit_logs
      where record_id=v_session2::text
        and action='phase3b_reporter_replaced'
        and actor_user_id=v_owner
        and metadata->>'new_reporter'=v_r2::text
    ),
    'Replacement audit records actor, Reporter transition and Session.'
  );

  begin
    perform public.jb_live_replace_reporter_internal(
      v_owner,v_session2,v_r1,'CI return attempt'
    );
    insert into ci_phase3_results values('3B-T036',false,'Officially replaced Reporter unexpectedly returned.');
  exception when others then
    insert into ci_phase3_results values(
      '3B-T036',
      position('REPORTER_RETURN_BLOCKED' in sqlerrm)>0,
      'Officially replaced Reporter return blocked.'
    );
  end;

  begin
    perform public.jb_live_admin_controls_internal(
      v_r2,v_session2,'PUBLIC_REPORTER_NAME_OFF',null,'CI bypass'
    );
    insert into ci_phase3_results values('3B-T058',false,'Reporter unexpectedly changed public-name visibility.');
  exception when others then
    insert into ci_phase3_results values(
      '3B-T058',
      position('OWNER_REQUIRED' in sqlerrm)>0,
      'Reporter public-name control bypass rejected.'
    );
  end;

  select grant_version into v_gv_before
  from public.live_session_members
  where session_id=v_session2
    and user_id=v_r2
    and permission='BROADCAST';

  perform public.jb_live_revoke_permission_internal(v_owner,v_session2,'CI revoke');

  insert into ci_phase3_results values(
    '3A-P4-T063',
    exists(
      select 1 from public.live_session_members
      where session_id=v_session2
        and user_id=v_r2
        and permission='BROADCAST'
        and status='REVOKED'
        and grant_version>v_gv_before
    ),
    'Session Live permission revoke invalidates current Reporter broadcast grant.'
  );
end $$;

select
  case when ok then 'PASS' else 'FAIL' end
  || ' [' || test_id || '] '
  || detail
from ci_phase3_results
order by test_id;

do $$
declare
  failed_ids text;
begin
  select string_agg(test_id, ', ' order by test_id)
  into failed_ids
  from ci_phase3_results
  where not ok;

  if failed_ids is not null then
    raise exception 'PHASE3_REGRESSION_FAILED: %', failed_ids;
  end if;
end $$;

rollback;
