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


-- Phase 3B exact-gap evidence. All fixtures remain inside this transaction and roll back.
do $$$$
declare
  v_owner uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_r1_row uuid;
  v_article uuid;
  v_session uuid;
  v_other_article uuid;
  v_other_session uuid;
  v_normal_article uuid;
  v_repl_article uuid;
  v_repl_session uuid;
  v_generation uuid;
  v_source uuid;
  v_contribution uuid;
  v_url text;
  v_before bigint;
  v_after bigint;
  v_op uuid;
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
    raise exception 'CI_PHASE3B_GAP_FIXTURE_ACTORS_MISSING';
  end if;

  insert into public.articles(slug,title,body,status,created_by,updated_by)
  values(
    'ci-phase3b-gap-'||replace(gen_random_uuid()::text,'-',''),
    'CI Phase3B Gap Live','transactional fixture','draft',v_owner,v_owner
  ) returning id into v_article;

  insert into public.live_sessions(
    article_id,reporter_id,assigned_reporter_id,headline,
    active,session_status,public_status,approved_at
  )
  values(v_article,v_r1_row,v_r1,'CI Phase3B Gap Live',true,'LIVE','LIVE',now())
  returning id into v_session;

  insert into public.public_live_feed(
    article_id,permanent_url,headline,public_location,public_status,playback_reference
  )
  values(
    v_article,'article.html?id='||v_article::text,'CI Phase3B Gap Live',
    'CI','LIVE','ci://gap/'||v_session::text
  );
  select permanent_url into v_url from public.public_live_feed where article_id=v_article;

  insert into public.live_session_members(
    session_id,user_id,permission,status,grant_version,member_role,is_current_primary
  ) values(v_session,v_r1,'BROADCAST','ACTIVE',1,'REPORTER',true);

  insert into public.live_session_capabilities(
    session_id,user_id,capability,status,grant_version,granted_by
  ) values
    (v_session,v_r1,'BROADCAST_CONTROL','ACTIVE',1,v_owner),
    (v_session,v_r1,'TEXT_UPDATE','ACTIVE',1,v_owner);

  perform public.jb_live_admin_controls_internal(v_owner,v_session,'PRIORITY_ON',null,'CI identity');
  perform public.jb_live_reporter_expected_end_internal(v_r1,v_session,now()+interval '30 minutes');

  insert into ci_phase3_results values(
    '3B-T002',
    (select count(*)=1 and bool_and(id=v_session) from public.live_sessions where id=v_session),
    '3B controls preserve the canonical existing Live Session identity.'
  );

  insert into ci_phase3_results values(
    '3B-T003',
    (select count(*)=1 from public.articles where id=v_article)
    and
    (select count(*)=1 and bool_and(permanent_url=v_url)
       from public.public_live_feed where article_id=v_article),
    '3B controls preserve Article ID and Permanent Master URL without duplication.'
  );

  -- Expected End warning/overdue must be bounded and must never auto-end.
  update public.live_sessions
  set expected_end_at=now()-interval '1 minute',
      expected_end_updated_at=now()-interval '2 minutes',
      expected_end_updated_by=v_r1
  where id=v_session;

  perform public.jb_live_expected_end_tick_internal();
  perform public.jb_live_expected_end_tick_internal();

  insert into ci_phase3_results values(
    '3B-T018',
    (select session_status='LIVE' and public_status='LIVE' and active
       from public.live_sessions where id=v_session)
    and
    (select count(*)=1
       from public.live_notifications
       where recipient_user_id=v_r1
         and notification_type='EXPECTED_END_OVERDUE'
         and record_type='live_session'
         and record_id=v_session::text),
    'Expected End crossing creates one deduplicated Reporter reminder and does not auto-end Live.'
  );

  -- Give this Live a current provider generation so End can be provider-confirmed.
  insert into public.live_provider_generations(
    session_id,generation_number,provider,provider_state,credential_status,is_current,
    provider_broadcast_lifecycle,provider_stream_status,playback_reference
  ) values(
    v_session,1,'youtube','ACTIVE','ACTIVE',true,'live','active','ci://gap/'||v_session::text
  ) returning generation_id into v_generation;

  update public.live_sessions
  set current_provider_generation=v_generation
  where id=v_session;

  perform public.jb_live_advanced_end_internal(v_r1,v_session,'REPORTER_END',null);

  insert into ci_phase3_results values(
    '3B-T023',
    exists(
      select 1 from public.live_session_capabilities
      where session_id=v_session and user_id=v_r1
        and capability='BROADCAST_CONTROL' and status='REVOKED'
    ),
    'Reporter End revokes the session broadcast-control capability.'
  );

  -- Repeating End must reuse the unique COMPLETE_LIVE operation.
  perform public.jb_live_request_end_internal(v_r1,v_session);
  insert into ci_phase3_results values(
    '3B-T114',
    (select count(*)=1
       from public.live_operations
       where session_id=v_session
         and generation_id=v_generation
         and operation_type='COMPLETE_LIVE'),
    'Repeated End request is idempotent and does not duplicate provider operation.'
  );

  update public.live_provider_generations
  set provider_broadcast_lifecycle='complete',
      provider_stream_status='inactive',
      provider_broadcast_completed_at=now()
  where generation_id=v_generation;

  perform public.jb_live_finalize_end_internal(v_session,v_generation);

  insert into ci_phase3_results values(
    '3B-T021',
    (select session_status='ENDED' and public_status='OFF' and not active
       from public.live_sessions where id=v_session)
    and
    (select public_status='OFF'
       from public.public_live_feed where article_id=v_article),
    'Provider-confirmed Reporter End safely removes public LIVE state.'
  );

  insert into ci_phase3_results values(
    '3B-T022',
    exists(select 1 from public.articles where id=v_article)
    and exists(select 1 from public.live_sessions where id=v_session and article_id=v_article)
    and exists(select 1 from public.public_live_feed where article_id=v_article and permanent_url=v_url)
    and exists(
      select 1 from public.audit_logs
      where record_id=v_session::text
        and action in('phase3b_reporter_end','live_technical_end_confirmed')
    ),
    'End preserves Article, Session, Permanent URL and audit/history evidence.'
  );

  -- Website replay hide must not delete or retire the provider generation.
  select count(*) into v_before
  from public.live_provider_generations where generation_id=v_generation;
  perform public.jb_live_admin_controls_internal(v_owner,v_session,'REPLAY_HIDE',null,'CI replay hide');
  select count(*) into v_after
  from public.live_provider_generations where generation_id=v_generation;

  insert into ci_phase3_results values(
    '3B-T095',
    v_before=1 and v_after=1
    and (select replay_public_visible=false from public.live_sessions where id=v_session)
    and (select replay_public_visible=false from public.public_live_feed where article_id=v_article),
    'Website Replay hide changes only JANTA BOL visibility; provider generation remains preserved.'
  );

  -- Ambiguous provider outcome remains non-success and recoverable.
  insert into public.live_operations(
    operation_type,session_id,generation_id,operation_state,worker_id,lease_until,next_attempt_at
  ) values(
    'REFRESH_PROVIDER_STATE',v_session,v_generation,'PROCESSING','ci-phase3b',
    now()+interval '1 minute',now()
  ) returning operation_id into v_op;

  perform public.jb_live_mark_operation_ambiguous_internal(
    v_op,'ci-phase3b','CI_PROVIDER_RESULT_AMBIGUOUS'
  );

  insert into ci_phase3_results values(
    '3B-T113',
    (select operation_state='AMBIGUOUS'
            and completed_at is null
            and last_safe_error_code='CI_PROVIDER_RESULT_AMBIGUOUS'
       from public.live_operations where operation_id=v_op),
    'Ambiguous provider result is not marked SUCCESS and remains scheduled for reconciliation.'
  );

  -- A normal article remains independently publishable after a Live/provider failure path.
  insert into public.articles(slug,title,body,status,created_by,updated_by)
  values(
    'ci-normal-'||replace(gen_random_uuid()::text,'-',''),
    'CI Normal Article','normal article independent fixture','draft',v_owner,v_owner
  ) returning id into v_normal_article;

  update public.articles
  set status='published',published_at=now(),updated_by=v_owner
  where id=v_normal_article;

  insert into ci_phase3_results values(
    '3B-T006',
    (select status='published'::public.article_status from public.articles where id=v_normal_article),
    'Normal article publishing remains independent from Live/provider failure state.'
  );

  -- Keep a second unrelated Live active to prove failure isolation.
  insert into public.articles(slug,title,body,status,created_by,updated_by)
  values(
    'ci-unrelated-'||replace(gen_random_uuid()::text,'-',''),
    'CI Unrelated Live','transactional fixture','draft',v_owner,v_owner
  ) returning id into v_other_article;

  insert into public.live_sessions(
    article_id,reporter_id,assigned_reporter_id,headline,
    active,session_status,public_status,approved_at
  )
  values(v_other_article,v_r1_row,v_r2,'CI Unrelated Live',true,'LIVE','LIVE',now())
  returning id into v_other_session;

  insert into public.public_live_feed(
    article_id,permanent_url,headline,public_location,public_status,playback_reference
  )
  values(
    v_other_article,'article.html?id='||v_other_article::text,'CI Unrelated Live',
    'CI','LIVE','ci://unrelated/'||v_other_session::text
  );

  insert into ci_phase3_results values(
    '3B-T115',
    (select session_status='LIVE' and public_status='LIVE' and active
       from public.live_sessions where id=v_other_session)
    and
    (select public_status='LIVE'
       from public.public_live_feed where article_id=v_other_article)
    and
    (select status='published'::public.article_status
       from public.articles where id=v_normal_article),
    'Ended/ambiguous Live fixture does not break unrelated active Live or normal article publishing.'
  );

  -- Separate active fixture for replacement + Drone authority tests.
  insert into public.articles(slug,title,body,status,created_by,updated_by)
  values(
    'ci-repl-gap-'||replace(gen_random_uuid()::text,'-',''),
    'CI Replacement Gap','transactional fixture','draft',v_owner,v_owner
  ) returning id into v_repl_article;

  insert into public.live_sessions(
    article_id,reporter_id,assigned_reporter_id,headline,
    active,session_status,public_status,approved_at
  )
  values(v_repl_article,v_r1_row,v_r1,'CI Replacement Gap',true,'LIVE','LIVE',now())
  returning id into v_repl_session;

  insert into public.public_live_feed(
    article_id,permanent_url,headline,public_location,public_status,playback_reference
  )
  values(
    v_repl_article,'article.html?id='||v_repl_article::text,'CI Replacement Gap',
    'CI','LIVE','ci://repl/'||v_repl_session::text
  );

  insert into public.live_session_members(
    session_id,user_id,permission,status,grant_version,member_role,is_current_primary
  ) values(v_repl_session,v_r1,'BROADCAST','ACTIVE',1,'REPORTER',true);

  insert into public.live_session_capabilities(
    session_id,user_id,capability,status,grant_version,granted_by
  ) values
    (v_repl_session,v_r1,'BROADCAST_CONTROL','ACTIVE',1,v_owner),
    (v_repl_session,v_r1,'TEXT_UPDATE','ACTIVE',1,v_owner);

  insert into public.live_contributions(
    session_id,reporter_user_id,contribution_type,current_text
  ) values(v_repl_session,v_r1,'TEXT','CI pre-replacement contribution')
  returning contribution_id into v_contribution;

  -- Normal Reporter gets no automatic Drone authority.
  begin
    perform public.jb_live_register_feed_source_internal(
      v_r1,v_repl_session,'DRONE',v_r1,null
    );
    insert into ci_phase3_results values(
      '3B-T097',false,'Reporter unexpectedly obtained Drone authority without DRONE_CONTROL.'
    );
  exception when others then
    insert into ci_phase3_results values(
      '3B-T097',
      position('DRONE_CONTROL_REQUIRED' in sqlerrm)>0,
      'Drone source requires explicit session-scoped DRONE_CONTROL.'
    );
  end;

  insert into public.live_session_capabilities(
    session_id,user_id,capability,status,grant_version,granted_by
  ) values(v_repl_session,v_r1,'DRONE_CONTROL','ACTIVE',1,v_owner);

  -- Same capability must not authorize another Live Session.
  begin
    perform public.jb_live_register_feed_source_internal(
      v_r1,v_other_session,'DRONE',v_r1,null
    );
    insert into ci_phase3_results values(
      '3B-T098',false,'Session-scoped Drone authority unexpectedly crossed into another Live.'
    );
  exception when others then
    insert into ci_phase3_results values(
      '3B-T098',
      position('DRONE_CONTROL_REQUIRED' in sqlerrm)>0,
      'Drone authority is scoped to the authorized Live Session.'
    );
  end;

  select (public.jb_live_register_feed_source_internal(
    v_r1,v_repl_session,'DRONE',v_r1,null
  )->>'source_id')::uuid into v_source;

  perform public.jb_live_confirm_feed_source_internal(v_r1,v_repl_session,v_source);
  perform public.jb_live_revoke_capabilities_internal(
    v_owner,v_repl_session,v_r1,'CI drone/source revoke'
  );

  begin
    perform public.jb_live_register_feed_source_internal(
      v_r1,v_repl_session,'DRONE',v_r1,null
    );
    insert into ci_phase3_results values(
      '3B-T106',false,'Revoked Drone authority unexpectedly created a new source.'
    );
  exception when others then
    insert into ci_phase3_results values(
      '3B-T106',
      position('DRONE_CONTROL_REQUIRED' in sqlerrm)>0
      and (select source_status='REVOKED' from public.live_feed_sources where source_id=v_source),
      'Owner revoke invalidates Drone capability and existing source; stale authority cannot regain control.'
    );
  end;

  -- Invalid replacement target must be rejected without changing current Reporter.
  begin
    perform public.jb_live_replace_reporter_internal(
      v_owner,v_repl_session,v_owner,'CI invalid replacement target'
    );
    insert into ci_phase3_results values(
      '3B-T030',false,'Non-Reporter replacement target unexpectedly accepted.'
    );
  exception when others then
    insert into ci_phase3_results values(
      '3B-T030',
      position('REPORTER_NOT_ELIGIBLE' in sqlerrm)>0
      and (select assigned_reporter_id=v_r1 from public.live_sessions where id=v_repl_session),
      'Replacement requires a valid active Reporter with Live permission.'
    );
  end;

  perform public.jb_live_replace_reporter_internal(
    v_owner,v_repl_session,v_r2,'CI valid replacement'
  );

  insert into ci_phase3_results values(
    '3B-T029',
    (select assigned_reporter_id=v_r2 from public.live_sessions where id=v_repl_session)
    and exists(
      select 1 from public.live_session_members
      where session_id=v_repl_session and user_id=v_r2
        and permission='BROADCAST' and status='ACTIVE' and is_current_primary
    ),
    'Owner replacement process switches current Reporter on the existing Live Session.'
  );

  insert into ci_phase3_results values(
    '3B-T037',
    exists(
      select 1 from public.live_contributions
      where contribution_id=v_contribution
        and session_id=v_repl_session
        and reporter_user_id=v_r1
        and current_text='CI pre-replacement contribution'
    ),
    'Pre-replacement contribution and Reporter attribution remain preserved.'
  );
end $$$$;

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
