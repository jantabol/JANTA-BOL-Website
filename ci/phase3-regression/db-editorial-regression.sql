\set ON_ERROR_STOP on
begin;

create temporary table ci_phase3_editorial_results(
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
  v_r1_name text;
  v_r2_name text;
  v_article uuid;
  v_session uuid;
  v_article2 uuid;
  v_session2 uuid;
  v_c1 uuid;
  v_c2 uuid;
  v_photo uuid;
  v_future uuid;
  v_del uuid;
  v_conflict uuid;
  v_result jsonb;
  v_report uuid;
  v_report2 uuid;
  v_correction_request uuid;
  v_url text;
  v_playback text;
  v_updates_before bigint;
  v_updates_after bigint;
  v_article_count bigint;
  v_session_count bigint;
begin
  select user_id into v_owner
  from public.user_roles
  where role='owner'::public.app_role
  limit 1;

  select r.user_id, r.id, r.name
  into v_r1, v_r1_row, v_r1_name
  from public.reporters r
  join public.user_roles ur on ur.user_id=r.user_id
  where ur.role='reporter'::public.app_role
    and r.active=true
    and r.live_permission=true
  order by r.created_at
  limit 1;

  select r.user_id, r.name
  into v_r2, v_r2_name
  from public.reporters r
  join public.user_roles ur on ur.user_id=r.user_id
  where ur.role='reporter'::public.app_role
    and r.active=true
    and r.live_permission=true
    and r.user_id<>v_r1
  order by r.created_at
  limit 1;

  if v_owner is null or v_r1 is null or v_r2 is null then
    raise exception 'CI_EDITORIAL_FIXTURE_ACTORS_MISSING';
  end if;

  insert into public.articles(
    slug,title,body,status,location,created_by,updated_by
  ) values(
    'ci-editorial-'||replace(gen_random_uuid()::text,'-',''),
    'CI Editorial Live','fixture body','draft','CI Place',v_owner,v_owner
  )
  returning id into v_article;

  insert into public.live_sessions(
    article_id,reporter_id,assigned_reporter_id,headline,
    active,session_status,public_status,approved_at,started_at
  ) values(
    v_article,v_r1_row,v_r1,'CI Editorial Live',
    true,'LIVE','LIVE',now(),now()
  )
  returning id into v_session;

  v_url := 'article.html?id='||v_article::text;
  v_playback := 'ci://playback/'||v_session::text;

  insert into public.public_live_feed(
    article_id,permanent_url,headline,public_location,
    public_status,playback_reference,live_started_at
  ) values(
    v_article,v_url,'CI Editorial Live','CI Place',
    'LIVE',v_playback,now()
  );

  insert into public.live_session_members(
    session_id,user_id,permission,status,grant_version,member_role,is_current_primary
  ) values(
    v_session,v_r1,'BROADCAST','ACTIVE',1,'REPORTER',true
  );

  perform public.jb_live_grant_capability_internal(v_owner,v_session,v_r1,'TEXT_UPDATE',null);
  perform public.jb_live_grant_capability_internal(v_owner,v_session,v_r1,'PHOTO_UPDATE',null);
  perform public.jb_live_grant_capability_internal(v_owner,v_session,v_r1,'FINAL_REPORT_DRAFT',null);

  v_result := public.jb_live_add_member_internal(v_owner,v_session,v_r2,'REPORTER');

  insert into ci_phase3_editorial_results values(
    '3B-T041',
    exists(
      select 1 from public.live_session_members
      where session_id=v_session and user_id=v_r2
        and status='ACTIVE' and member_role='REPORTER'
    )
    and exists(
      select 1 from public.live_session_capabilities
      where session_id=v_session and user_id=v_r2
        and capability='TEXT_UPDATE' and status='ACTIVE'
    ),
    'Owner can associate multiple eligible Reporters with one Live Session.'
  );

  insert into public.articles(
    slug,title,body,status,location,created_by,updated_by
  ) values(
    'ci-cross-'||replace(gen_random_uuid()::text,'-',''),
    'CI Cross Session','fixture','draft','CI Place 2',v_owner,v_owner
  )
  returning id into v_article2;

  insert into public.live_sessions(
    article_id,reporter_id,assigned_reporter_id,headline,
    active,session_status,public_status,approved_at,started_at
  ) values(
    v_article2,v_r1_row,v_r1,'CI Cross Session',
    true,'LIVE','LIVE',now(),now()
  )
  returning id into v_session2;

  insert into public.public_live_feed(
    article_id,permanent_url,headline,public_location,
    public_status,playback_reference,live_started_at
  ) values(
    v_article2,'article.html?id='||v_article2::text,'CI Cross Session','CI Place 2',
    'LIVE','ci://playback/'||v_session2::text,now()
  );

  begin
    perform public.jb_live_contribution_write_internal(v_r2,v_session2,'TEXT','unauthorized cross-session',null);
    insert into ci_phase3_editorial_results values('3B-T042',false,'Reporter membership leaked into another Live Session.');
  exception when others then
    insert into ci_phase3_editorial_results values(
      '3B-T042',
      position('CAPABILITY_REQUIRED' in sqlerrm)>0,
      'Reporter authority remains limited to the specifically authorized Live Session.'
    );
  end;

  v_result := public.jb_live_contribution_write_internal(v_r1,v_session,'TEXT','Reporter A text',null);
  v_c1 := (v_result->>'contribution_id')::uuid;

  v_result := public.jb_live_contribution_write_internal(v_r2,v_session,'TEXT','Reporter B text',null);
  v_c2 := (v_result->>'contribution_id')::uuid;

  insert into ci_phase3_editorial_results values(
    '3B-T044',
    exists(select 1 from public.live_contributions where contribution_id=v_c1 and session_id=v_session)
    and exists(select 1 from public.live_contributions where contribution_id=v_c2 and session_id=v_session)
    and (select count(*)=1 from public.live_sessions where id=v_session)
    and (select count(*)=1 from public.articles where id=v_article),
    'Multiple approved Reporters can submit text updates without duplicate Session/Article creation.'
  );

  v_result := public.jb_live_contribution_write_internal(v_r2,v_session,'PHOTO',null,'ci://photo/reporter-b');
  v_photo := (v_result->>'contribution_id')::uuid;

  insert into ci_phase3_editorial_results values(
    '3B-T045',
    exists(
      select 1 from public.live_contributions
      where contribution_id=v_photo and contribution_type='PHOTO'
        and media_reference='ci://photo/reporter-b'
    )
    and (select session_status='LIVE' from public.live_sessions where id=v_session),
    'Authorized Reporter photo update does not disturb the active Live Session.'
  );

  insert into ci_phase3_editorial_results values(
    '3B-T046',
    (select reporter_user_id=v_r1 from public.live_contributions where contribution_id=v_c1)
    and (select reporter_user_id=v_r2 from public.live_contributions where contribution_id=v_c2)
    and (select reporter_user_id=v_r2 from public.live_contributions where contribution_id=v_photo),
    'Each contribution preserves the correct internal Reporter user ID.'
  );

  insert into ci_phase3_editorial_results values(
    '3B-T047',
    (select reporter_user_id=v_r1 from public.live_contributions where contribution_id=v_c1)
    and position(
      'p_reporter' in lower(
        pg_get_function_identity_arguments(
          (select p.oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace
           where n.nspname='public' and p.proname='jb_live_contribution_write_internal' limit 1)
        )
      )
    )=0,
    'Contribution attribution is derived from the trusted actor, not a caller-supplied Reporter identity.'
  );

  v_result := public.jb_live_flag_conflict_internal(
    v_r1,v_session,v_c1,v_c2,'CI contradictory reports'
  );
  v_conflict := (v_result->>'conflict_id')::uuid;

  insert into ci_phase3_editorial_results values(
    '3B-T048',
    exists(
      select 1 from public.live_contribution_conflicts
      where conflict_id=v_conflict and conflict_status='REVIEW'
    )
    and (select public_visibility='HELD_REVIEW' from public.live_contributions where contribution_id=v_c1)
    and (select public_visibility='HELD_REVIEW' from public.live_contributions where contribution_id=v_c2),
    'Conflicting Reporter updates are held for review instead of silently becoming authoritative.'
  );

  perform public.jb_live_resolve_conflict_internal(
    v_owner,v_conflict,v_c1,'CI owner editorial decision'
  );

  insert into ci_phase3_editorial_results values(
    '3B-T049',
    exists(
      select 1 from public.live_contribution_conflicts
      where conflict_id=v_conflict
        and conflict_status='RESOLVED'
        and resolved_by=v_owner
        and winning_contribution_id=v_c1
        and decision_reason='CI owner editorial decision'
    )
    and (select public_visibility='VISIBLE' from public.live_contributions where contribution_id=v_c1)
    and (select public_visibility='HIDDEN' from public.live_contributions where contribution_id=v_c2),
    'Owner resolves contribution conflict and the editorial decision remains traceable.'
  );

  insert into ci_phase3_editorial_results values(
    '3B-T053',
    (select public_reporter_label=v_r1_name from public.public_live_updates where contribution_id=v_c1)
    and (select public_reporter_label=v_r2_name from public.public_live_updates where contribution_id=v_photo),
    'Public Name ON projects the correct Reporter public label.'
  );

  perform public.jb_live_admin_controls_internal(
    v_owner,v_session,'PUBLIC_REPORTER_NAME_OFF',null,'CI name privacy'
  );

  insert into ci_phase3_editorial_results values(
    '3B-T052',
    (select public_reporter_name_visible=false from public.live_sessions where id=v_session)
    and (select public_reporter_label='JANTA BOL Reporter' from public.public_live_feed where article_id=v_article),
    'Owner can switch public Reporter name visibility OFF for a specific Live Session.'
  );

  insert into ci_phase3_editorial_results values(
    '3B-T054',
    not exists(
      select 1 from public.public_live_updates
      where session_id=v_session and public_reporter_label<>'JANTA BOL Reporter'
    ),
    'Public Name OFF replaces actual Reporter names with JANTA BOL Reporter.'
  );

  v_result := public.jb_live_contribution_write_internal(
    v_r1,v_session,'TEXT','Future update while name hidden',null
  );
  v_future := (v_result->>'contribution_id')::uuid;

  insert into ci_phase3_editorial_results values(
    '3B-T055',
    (select public_reporter_label='JANTA BOL Reporter' from public.public_live_updates where contribution_id=v_c1)
    and (select public_reporter_label='JANTA BOL Reporter' from public.public_live_updates where contribution_id=v_future),
    'Public Name OFF applies retroactively to old updates and to future updates in the same Live Session.'
  );

  perform public.jb_live_admin_controls_internal(
    v_owner,v_session,'PUBLIC_REPORTER_NAME_ON',null,'CI restore name'
  );

  insert into ci_phase3_editorial_results values(
    '3B-T056',
    (select public_reporter_label=v_r1_name from public.public_live_updates where contribution_id=v_c1)
    and (select public_reporter_label=v_r1_name from public.public_live_updates where contribution_id=v_future)
    and (select public_reporter_label=v_r2_name from public.public_live_updates where contribution_id=v_photo),
    'Public Name ON restores correct labels for old and new same-session updates.'
  );

  insert into ci_phase3_editorial_results values(
    '3B-T057',
    (select reporter_user_id=v_r1 from public.live_contributions where contribution_id=v_c1)
    and (select reporter_user_id=v_r2 from public.live_contributions where contribution_id=v_photo)
    and exists(
      select 1 from public.live_session_capabilities
      where session_id=v_session and user_id=v_r1 and capability='TEXT_UPDATE' and status='ACTIVE'
    ),
    'Public-name visibility changes public presentation only; internal identity and permission records remain preserved.'
  );

  perform public.jb_live_contribution_correct_internal(
    v_r1,v_future,'Reporter corrected current fact',null,'CI factual correction'
  );

  insert into ci_phase3_editorial_results values(
    '3B-T059',
    (select current_text='Reporter corrected current fact' from public.live_contributions where contribution_id=v_future),
    'Reporter can correct their own Live text update.'
  );

  begin
    perform public.jb_live_contribution_correct_internal(
      v_r2,v_future,'Reporter B overwrite attempt',null,'CI unauthorized correction'
    );
    insert into ci_phase3_editorial_results values('3B-T060',false,'Reporter corrected another Reporter update.');
  exception when others then
    insert into ci_phase3_editorial_results values(
      '3B-T060',
      position('OWN_CONTRIBUTION_ONLY' in sqlerrm)>0,
      'Reporter cannot directly correct another Reporter contribution.'
    );
  end;

  insert into ci_phase3_editorial_results values(
    '3B-T061',
    exists(
      select 1 from public.live_contribution_versions
      where contribution_id=v_future
        and old_text='Future update while name hidden'
        and new_text='Reporter corrected current fact'
    ),
    'Correction preserves original and corrected values in internal version history.'
  );

  insert into ci_phase3_editorial_results values(
    '3B-T062',
    exists(
      select 1 from public.live_contribution_versions
      where contribution_id=v_future
        and changed_by=v_r1
        and change_reason='CI factual correction'
        and created_at is not null
    ),
    'Correction records actor, time and mandatory reason.'
  );

  insert into ci_phase3_editorial_results values(
    '3B-T065',
    (select public_text='Reporter corrected current fact' from public.public_live_updates where contribution_id=v_future),
    'Public projection shows the latest corrected information.'
  );

  perform public.jb_live_metadata_correct_internal(
    v_r1,v_session,'Reporter corrected headline','Reporter corrected place','CI reporter metadata correction'
  );
  perform public.jb_live_metadata_correct_internal(
    v_owner,v_session,'Admin authoritative headline','Admin authoritative place','CI admin final metadata'
  );

  insert into ci_phase3_editorial_results values(
    '3B-T063',
    (select headline='Admin authoritative headline' from public.live_sessions where id=v_session)
    and (select title='Admin authoritative headline' and location='Admin authoritative place' from public.articles where id=v_article)
    and exists(
      select 1 from public.live_session_correction_versions
      where session_id=v_session and changed_by=v_r1 and is_admin_authoritative=false
    )
    and exists(
      select 1 from public.live_session_correction_versions
      where session_id=v_session and changed_by=v_owner and is_admin_authoritative=true
    ),
    'Reporter and Owner metadata correction scopes work; Owner authoritative version becomes final.'
  );

  begin
    perform public.jb_live_metadata_correct_internal(
      v_r1,v_session,'Reporter undo attempt','Reporter undo place','CI undo attempt'
    );
    insert into ci_phase3_editorial_results values('3B-T064',false,'Reporter overwrote an Admin-authoritative metadata version.');
  exception when others then
    insert into ci_phase3_editorial_results values(
      '3B-T064',
      position('ADMIN_AUTHORITATIVE_' in sqlerrm)>0,
      'Reporter cannot overwrite or undo the Admin-authoritative metadata version.'
    );
  end;

  perform public.jb_live_contribution_hide_internal(
    v_r2,v_photo,'CI reporter public hide',false
  );

  insert into ci_phase3_editorial_results values(
    '3B-T067',
    exists(
      select 1 from public.live_contributions
      where contribution_id=v_photo and public_visibility='HIDDEN'
    )
    and not exists(
      select 1 from public.public_live_updates where contribution_id=v_photo
    ),
    'Reporter can public-hide their own update without permanently deleting the backend record.'
  );

  insert into ci_phase3_editorial_results values(
    '3B-T068',
    exists(
      select 1 from public.live_contributions
      where contribution_id=v_photo
        and hidden_by=v_r2
        and hidden_reason='CI reporter public hide'
        and hidden_at is not null
    )
    and exists(
      select 1 from public.audit_logs
      where action='phase3b_contribution_hidden'
        and record_id=v_photo::text
        and actor_user_id=v_r2
        and metadata->>'reason'='CI reporter public hide'
    ),
    'Reporter hide requires and preserves reason, actor, time and audit evidence.'
  );

  begin
    perform public.jb_live_contribution_hide_internal(
      v_r1,v_future,'CI reporter permanent delete attempt',true
    );
    insert into ci_phase3_editorial_results values('3B-T069',false,'Reporter performed permanent deletion.');
  exception when others then
    insert into ci_phase3_editorial_results values(
      '3B-T069',
      position('OWNER_REQUIRED_FOR_PERMANENT_DELETE' in sqlerrm)>0,
      'Permanent delete is rejected for Reporter authority.'
    );
  end;

  v_result := public.jb_live_contribution_write_internal(
    v_r1,v_session,'TEXT','Disposable owner-delete update',null
  );
  v_del := (v_result->>'contribution_id')::uuid;

  perform public.jb_live_contribution_hide_internal(
    v_owner,v_del,'CI owner permanent delete reason',true
  );

  insert into ci_phase3_editorial_results values(
    '3B-T070',
    not exists(select 1 from public.live_contributions where contribution_id=v_del)
    and exists(
      select 1 from public.live_deletion_ledger
      where record_id=v_del
        and record_type='LIVE_CONTRIBUTION'
        and session_id=v_session
        and article_id=v_article
        and deleted_by=v_owner
        and delete_reason='CI owner permanent delete reason'
        and deleted_at is not null
        and record_snapshot is not null
    ),
    'Owner permanent delete requires a reason and preserves deletion accountability ledger.'
  );

  insert into ci_phase3_editorial_results values(
    '3B-T072',
    (select count(*)=1 from public.live_sessions where id=v_session and article_id=v_article)
    and (select count(*)=1 from public.articles where id=v_article)
    and (select permanent_url=v_url from public.public_live_feed where article_id=v_article),
    'Correction/hide/delete operations preserve canonical Session, Article and Permanent URL identity.'
  );

  perform public.jb_live_revoke_reporter_capabilities_internal(
    v_owner,v_r2,'CI isolate Reporter-B failure'
  );

  v_result := public.jb_live_contribution_write_internal(
    v_r1,v_session,'TEXT','Reporter A continues after B revoke',null
  );

  insert into ci_phase3_editorial_results values(
    '3B-T050',
    (select session_status='LIVE' and public_status='LIVE' and active from public.live_sessions where id=v_session)
    and exists(
      select 1 from public.live_contributions
      where contribution_id=(v_result->>'contribution_id')::uuid
        and reporter_user_id=v_r1
    ),
    'One Reporter revoke/failure does not stop another authorized Reporter or the overall Live Session.'
  );

  insert into ci_phase3_editorial_results values(
    '3B-T051',
    (select article_id=v_article from public.live_sessions where id=v_session)
    and (select permanent_url=v_url from public.public_live_feed where article_id=v_article)
    and exists(
      select 1 from public.audit_logs
      where action='phase3b_session_member_added' and record_id=v_session::text
    )
    and exists(
      select 1 from public.audit_logs
      where action='phase3b_contribution_created'
        and metadata->>'session_id'=v_session::text
    ),
    'Multi-Reporter work preserves canonical identity and membership/contribution audit evidence.'
  );

  -- End the Live but preserve membership/capability for Final Report workflow.
  update public.live_sessions
  set session_status='ENDED',public_status='OFF',active=false,ended_at=now(),technical_end_at=now()
  where id=v_session;
  update public.public_live_feed
  set public_status='OFF'
  where article_id=v_article;

  perform public.jb_live_contribution_correct_internal(
    v_r1,v_future,'Post-End factual correction',null,'CI post-end factual correction'
  );

  v_result := public.jb_live_final_report_save_v2_internal(
    v_r1,v_session,
    'Reporter final headline',
    'Reporter complete final body',
    'Final location',
    '[]'::jsonb,
    jsonb_build_array(jsonb_build_object('fact','CI verified fact')),
    now(),
    null
  );
  v_report := (v_result->>'final_report_id')::uuid;

  insert into ci_phase3_editorial_results values(
    '3B-T073',
    exists(
      select 1 from public.live_final_reports
      where final_report_id=v_report and session_id=v_session and report_status='DRAFT'
    ),
    'After Live End, authorized Reporter can prepare a complete Final Report draft.'
  );

  insert into ci_phase3_editorial_results values(
    '3B-T074',
    exists(
      select 1 from public.live_final_reports
      where final_report_id=v_report and session_id=v_session and article_id=v_article
    )
    and (select permanent_url=v_url from public.public_live_feed where article_id=v_article),
    'Final Report remains linked to the same Session, Article and Permanent URL.'
  );

  insert into ci_phase3_editorial_results values(
    '3B-T075',
    exists(
      select 1 from public.live_final_reports
      where final_report_id=v_report
        and headline='Reporter final headline'
        and body='Reporter complete final body'
        and final_location='Final location'
        and jsonb_array_length(verified_facts)=1
        and final_event_at is not null
        and nullif(btrim(byline),'') is not null
    ),
    'Final Report safely stores required final-news content, verified facts, location, event time and byline.'
  );

  perform public.jb_live_final_report_transition_internal(v_r1,v_session,'SUBMIT');

  insert into ci_phase3_editorial_results values(
    '3B-T076',
    (select report_status='SUBMITTED' and submitted_at is not null from public.live_final_reports where final_report_id=v_report),
    'Reporter can send saved Final Report for Owner approval.'
  );

  perform public.jb_live_final_report_save_v2_internal(
    v_owner,v_session,
    'Admin authoritative final headline',
    'Admin authoritative final body',
    'Admin final location',
    '[]'::jsonb,
    jsonb_build_array(jsonb_build_object('fact','Admin verified fact')),
    now(),
    'JANTA BOL'
  );

  insert into ci_phase3_editorial_results values(
    '3B-T077',
    (select report_status='ADMIN_EDITING'
            and headline='Admin authoritative final headline'
            and body='Admin authoritative final body'
       from public.live_final_reports where final_report_id=v_report),
    'Owner can review and rewrite the submitted Final Report.'
  );

  -- Separate ended Session for failed-publish and cross-session publish-scope checks.
  update public.live_sessions
  set session_status='ENDED',public_status='OFF',active=false,ended_at=now(),technical_end_at=now()
  where id=v_session2;
  update public.public_live_feed set public_status='OFF' where article_id=v_article2;

  v_result := public.jb_live_final_report_save_v2_internal(
    v_owner,v_session2,'Second final headline','Second final body','Second final location',
    '[]'::jsonb,'[]'::jsonb,now(),'JANTA BOL'
  );
  v_report2 := (v_result->>'final_report_id')::uuid;

  begin
    perform public.jb_live_final_report_transition_internal(v_owner,v_session2,'PUBLISH');
    insert into ci_phase3_editorial_results values('3B-T086',false,'Unfinalized Final Report was published.');
  exception when others then
    insert into ci_phase3_editorial_results values(
      '3B-T086',
      position('FINAL_REPORT_NOT_FINALIZED' in sqlerrm)>0
      and (select report_status='DRAFT' and headline='Second final headline' from public.live_final_reports where final_report_id=v_report2),
      'Failed premature publish keeps Final Report content safely in draft state without false Published status.'
    );
  end;

  perform public.jb_live_final_report_transition_internal(v_owner,v_session,'FINALIZE');

  begin
    perform public.jb_live_final_report_save_internal(
      v_r1,v_session,'Reporter overwrite after finalize','Blocked body','Blocked location','[]'::jsonb
    );
    insert into ci_phase3_editorial_results values('3B-T078',false,'Reporter directly edited finalized Final Report.');
  exception when others then
    v_result := public.jb_live_final_report_correction_request_internal(
      v_r1,v_session,'CI factual correction request after finalize'
    );
    v_correction_request := (v_result->>'correction_request_id')::uuid;
    insert into ci_phase3_editorial_results values(
      '3B-T078',
      position('FINAL_REPORT_FINALIZED' in sqlerrm)>0
      and exists(
        select 1 from public.live_final_report_correction_requests
        where correction_request_id=v_correction_request
          and requested_by=v_r1
          and request_status='PENDING'
      ),
      'Finalized Admin report blocks Reporter overwrite and preserves correction-request route.'
    );
  end;

  begin
    perform public.jb_live_final_report_transition_internal(v_r1,v_session,'PUBLISH');
    insert into ci_phase3_editorial_results values('3B-T079',false,'Reporter published without explicit permission.');
  exception when others then
    insert into ci_phase3_editorial_results values(
      '3B-T079',
      position('FINAL_REPORT_PUBLISH_REQUIRED' in sqlerrm)>0,
      'Default Final Report publish authority remains with Owner.'
    );
  end;

  perform public.jb_live_grant_capability_internal(
    v_owner,v_session,v_r1,'FINAL_REPORT_PUBLISH',null
  );

  insert into ci_phase3_editorial_results values(
    '3B-T080',
    exists(
      select 1 from public.live_session_capabilities
      where session_id=v_session and user_id=v_r1
        and capability='FINAL_REPORT_PUBLISH' and status='ACTIVE'
    )
    and not exists(
      select 1 from public.live_session_capabilities
      where session_id=v_session2 and user_id=v_r1
        and capability='FINAL_REPORT_PUBLISH' and status='ACTIVE'
    ),
    'Reporter publish permission is explicit and scoped to one specific Live Session/Final Report.'
  );

  perform public.jb_live_final_report_transition_internal(v_owner,v_session2,'SUBMIT');
  perform public.jb_live_final_report_transition_internal(v_owner,v_session2,'FINALIZE');

  begin
    perform public.jb_live_final_report_transition_internal(v_r1,v_session2,'PUBLISH');
    insert into ci_phase3_editorial_results values('3B-T081',false,'Session-specific publish permission worked on another Final Report.');
  exception when others then
    insert into ci_phase3_editorial_results values(
      '3B-T081',
      position('FINAL_REPORT_PUBLISH_REQUIRED' in sqlerrm)>0,
      'Specific Reporter publish permission cannot be reused on another Live Session/Final Report.'
    );
  end;

  perform public.jb_live_final_report_transition_internal(v_r1,v_session,'PUBLISH');

  insert into ci_phase3_editorial_results values(
    '3B-T082',
    exists(
      select 1 from public.live_session_capabilities
      where session_id=v_session and user_id=v_r1
        and capability='FINAL_REPORT_PUBLISH'
        and status='REVOKED'
        and revoked_at is not null
        and revocation_reason='AUTO_EXPIRE_AFTER_SUCCESSFUL_FINAL_REPORT_PUBLISH'
    ),
    'Reporter Final Report publish permission automatically expires after successful publish.'
  );

  begin
    perform public.jb_live_final_report_transition_internal(v_r1,v_session,'PUBLISH');
    insert into ci_phase3_editorial_results values('3B-T083',false,'Expired Reporter publish permission was reusable.');
  exception when others then
    insert into ci_phase3_editorial_results values(
      '3B-T083',
      position('FINAL_REPORT_PUBLISH_REQUIRED' in sqlerrm)>0,
      'Used/expired Reporter publish permission cannot be reused.'
    );
  end;

  insert into ci_phase3_editorial_results values(
    '3B-T084',
    (select report_status='PUBLISHED' and published_at is not null from public.live_final_reports where final_report_id=v_report)
    and (select status='published' from public.articles where id=v_article)
    and (select final_report_published=true and public_status='OFF' from public.public_live_feed where article_id=v_article),
    'Publish is treated as successful only after authoritative backend state is PUBLISHED.'
  );

  select count(*) into v_article_count from public.articles where id=v_article;
  select count(*) into v_session_count from public.live_final_reports where session_id=v_session;

  v_result := public.jb_live_final_report_transition_internal(v_owner,v_session,'PUBLISH');

  insert into ci_phase3_editorial_results values(
    '3B-T085',
    (v_result->>'idempotent')::boolean=true
    and (select count(*)=v_article_count from public.articles where id=v_article)
    and (select count(*)=v_session_count from public.live_final_reports where session_id=v_session)
    and (select permanent_url=v_url from public.public_live_feed where article_id=v_article),
    'Publish retry is idempotent and creates no duplicate Article, Final Report or Permanent URL.'
  );

  begin
    perform public.jb_live_final_report_save_internal(
      v_r1,v_session,'Reporter post-publish overwrite','Blocked','Blocked','[]'::jsonb
    );
    insert into ci_phase3_editorial_results values('3B-T087',false,'Reporter edited published Final Report directly.');
  exception when others then
    insert into ci_phase3_editorial_results values(
      '3B-T087',
      position('FINAL_REPORT_FINALIZED' in sqlerrm)>0
      and exists(
        select 1 from public.live_final_report_correction_requests
        where final_report_id=v_report and requested_by=v_r1
      ),
      'Published Final Report blocks Reporter overwrite and retains correction-request workflow.'
    );
  end;

  insert into ci_phase3_editorial_results values(
    '3B-T071',
    (select current_text='Post-End factual correction' from public.live_contributions where contribution_id=v_future)
    and exists(
      select 1 from public.live_final_report_correction_requests
      where final_report_id=v_report and requested_by=v_r1
    ),
    'Post-End factual contribution correction works, while finalized report changes use the correction-request route.'
  );

  insert into ci_phase3_editorial_results values(
    '3B-T088',
    (select article_id=v_article from public.live_sessions where id=v_session)
    and (select article_id=v_article from public.live_final_reports where final_report_id=v_report)
    and (select permanent_url=v_url from public.public_live_feed where article_id=v_article),
    'Live-to-Final publish preserves the same Article ID and Permanent Master URL.'
  );

  insert into ci_phase3_editorial_results values(
    '3B-T089',
    (select a.title=fr.headline and a.body=fr.body and a.location=fr.final_location
     from public.articles a join public.live_final_reports fr on fr.article_id=a.id
     where a.id=v_article and fr.final_report_id=v_report),
    'Published canonical Article content is the authoritative Final Report content.'
  );

  select count(*) into v_updates_before
  from public.public_live_updates
  where session_id=v_session;

  insert into ci_phase3_editorial_results values(
    '3B-T091',
    v_updates_before>0,
    'Historical Live Updates remain available after Final Report publication.'
  );

  perform public.jb_live_admin_controls_internal(
    v_owner,v_session,'LIVE_UPDATES_HIDE',null,'CI hide historical updates'
  );

  select count(*) into v_updates_after
  from public.public_live_updates
  where session_id=v_session;

  insert into ci_phase3_editorial_results values(
    '3B-T092',
    (select live_updates_public_visible=false from public.live_sessions where id=v_session)
    and (select live_updates_public_visible=false from public.public_live_feed where article_id=v_article)
    and v_updates_after=v_updates_before,
    'Owner can hide public Live Updates without deleting underlying update history.'
  );

  insert into ci_phase3_editorial_results values(
    '3B-T093',
    (select report_status='PUBLISHED' from public.live_final_reports where final_report_id=v_report)
    and (select permanent_url=v_url and playback_reference=v_playback from public.public_live_feed where article_id=v_article),
    'Hiding Live Updates does not affect Final Report, Replay reference, Article ID or Permanent URL.'
  );

  perform public.jb_live_admin_controls_internal(
    v_owner,v_session,'REPLAY_HIDE',null,'CI hide website replay'
  );

  insert into ci_phase3_editorial_results values(
    '3B-T094',
    (select replay_public_visible=false and playback_reference=v_playback from public.public_live_feed where article_id=v_article),
    'Website replay can be hidden without deleting or changing the underlying playback reference.'
  );
end $$;

select
  case when ok then 'PASS' else 'FAIL' end
  || ' [' || test_id || '] '
  || detail
from ci_phase3_editorial_results
order by test_id;

do $$
declare
  failed_ids text;
begin
  select string_agg(test_id, ', ' order by test_id)
  into failed_ids
  from ci_phase3_editorial_results
  where not ok;

  if failed_ids is not null then
    raise exception 'PHASE3_EDITORIAL_REGRESSION_FAILED: %', failed_ids;
  end if;
end $$;

rollback;
