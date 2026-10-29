\set ON_ERROR_STOP on
begin;

create temporary table ci_phase3_retention_results(
  test_id text primary key,
  ok boolean not null,
  detail text not null
) on commit drop;

do $$
declare
  v_owner uuid;
  v_r1 uuid;
  v_r1_row uuid;
  v_article uuid;
  v_session uuid;
  v_other_article uuid;
  v_other_session uuid;
  v_c uuid;
  v_del uuid;
  v_report uuid;
  v_result jsonb;
  v_url text;
  v_playback text;
  v_version_id uuid;
  v_ledger uuid;
begin
  select user_id into v_owner
  from public.user_roles
  where role='owner'::public.app_role
  limit 1;

  select r.user_id, r.id
  into v_r1, v_r1_row
  from public.reporters r
  join public.user_roles ur on ur.user_id=r.user_id
  where ur.role='reporter'::public.app_role
    and r.active=true
    and r.live_permission=true
  order by r.created_at
  limit 1;

  if v_owner is null or v_r1 is null then
    raise exception 'CI_RETENTION_FIXTURE_ACTORS_MISSING';
  end if;

  insert into public.articles(
    slug,title,body,status,location,created_by,updated_by
  ) values(
    'ci-retention-'||replace(gen_random_uuid()::text,'-',''),
    'CI Retention Live','fixture','draft','CI Retention Place',v_owner,v_owner
  )
  returning id into v_article;

  insert into public.live_sessions(
    article_id,reporter_id,assigned_reporter_id,headline,
    active,session_status,public_status,approved_at,started_at
  ) values(
    v_article,v_r1_row,v_r1,'CI Retention Live',
    true,'LIVE','LIVE',now(),now()
  )
  returning id into v_session;

  v_url := 'article.html?id='||v_article::text;
  v_playback := 'https://youtube.example.invalid/replay/'||v_session::text;

  insert into public.public_live_feed(
    article_id,permanent_url,headline,public_location,
    public_status,playback_reference,live_started_at
  ) values(
    v_article,v_url,'CI Retention Live','CI Retention Place',
    'LIVE',v_playback,now()
  );

  insert into public.live_session_members(
    session_id,user_id,permission,status,grant_version,member_role,is_current_primary
  ) values(
    v_session,v_r1,'BROADCAST','ACTIVE',1,'REPORTER',true
  );

  perform public.jb_live_grant_capability_internal(v_owner,v_session,v_r1,'TEXT_UPDATE',null);
  perform public.jb_live_grant_capability_internal(v_owner,v_session,v_r1,'FINAL_REPORT_DRAFT',null);

  v_result := public.jb_live_contribution_write_internal(
    v_r1,v_session,'TEXT','Routine retained update',null
  );
  v_c := (v_result->>'contribution_id')::uuid;

  perform public.jb_live_contribution_correct_internal(
    v_r1,v_c,'Routine corrected update',null,'CI routine correction'
  );

  select version_id into v_version_id
  from public.live_contribution_versions
  where contribution_id=v_c
  order by version_number desc
  limit 1;

  v_result := public.jb_live_contribution_write_internal(
    v_r1,v_session,'TEXT','Delete ledger seed',null
  );
  v_del := (v_result->>'contribution_id')::uuid;

  v_result := public.jb_live_contribution_hide_internal(
    v_owner,v_del,'CI accountability deletion',true
  );
  v_ledger := (v_result->>'deletion_ledger_id')::uuid;

  update public.live_sessions
  set session_status='ENDED',public_status='OFF',active=false,
      ended_at=now(),technical_end_at=now()
  where id=v_session;

  update public.public_live_feed
  set public_status='OFF'
  where article_id=v_article;

  v_result := public.jb_live_final_report_save_v2_internal(
    v_owner,v_session,
    'CI Retention Final',
    'CI Retention Final Body',
    'CI Retention Place',
    '[]'::jsonb,
    jsonb_build_array(jsonb_build_object('fact','retention verified')),
    now(),
    'JANTA BOL'
  );
  v_report := (v_result->>'final_report_id')::uuid;

  perform public.jb_live_final_report_transition_internal(v_owner,v_session,'SUBMIT');
  perform public.jb_live_final_report_transition_internal(v_owner,v_session,'FINALIZE');
  perform public.jb_live_final_report_transition_internal(v_owner,v_session,'PUBLISH');

  -- Unrelated ended Session proves targeted cleanup isolation.
  insert into public.articles(
    slug,title,body,status,created_by,updated_by
  ) values(
    'ci-retention-other-'||replace(gen_random_uuid()::text,'-',''),
    'CI Other','Other','draft',v_owner,v_owner
  )
  returning id into v_other_article;

  insert into public.live_sessions(
    article_id,reporter_id,assigned_reporter_id,headline,
    active,session_status,public_status,approved_at,ended_at,technical_end_at
  ) values(
    v_other_article,v_r1_row,v_r1,'CI Other',
    false,'ENDED','OFF',now(),now(),now()
  )
  returning id into v_other_session;

  perform public.jb_live_retention_register_session_internal(v_session);

  insert into ci_phase3_retention_results values(
    '3B-T117',
    exists(
      select 1 from public.live_retention_registry
      where session_id=v_session
        and record_type='live_contribution'
        and record_id=v_c::text
        and record_class='ROUTINE_TEMPORARY'
        and protected_from_routine_cleanup=false
        and cleanup_eligible_at>=retained_from + interval '7 months'
    )
    and exists(
      select 1 from public.live_retention_registry
      where session_id=v_session
        and record_type='live_contribution_version'
        and record_id=v_version_id::text
        and record_class='ROUTINE_TEMPORARY'
        and cleanup_eligible_at is not null
    ),
    'Routine Live contribution/correction history is classified for at-least-seven-month retention.'
  );

  perform public.jb_live_retention_cleanup_internal(
    v_owner,now()+interval '6 months',v_session,500
  );

  update ci_phase3_retention_results
  set ok = ok
    and exists(select 1 from public.live_contributions where contribution_id=v_c)
    and exists(select 1 from public.live_contribution_versions where version_id=v_version_id)
    and exists(
      select 1 from public.live_retention_registry
      where session_id=v_session
        and record_type='live_contribution'
        and record_id=v_c::text
        and cleaned_at is null
    ),
    detail = detail || ' Pre-7-month cleanup attempt preserves the records.'
  where test_id='3B-T117';

  perform public.jb_live_retention_cleanup_internal(
    v_owner,now()+interval '8 months',v_session,500
  );

  insert into ci_phase3_retention_results values(
    '3B-T118',
    not exists(select 1 from public.live_contributions where contribution_id=v_c)
    and not exists(select 1 from public.live_contribution_versions where version_id=v_version_id)
    and exists(
      select 1 from public.live_retention_registry
      where session_id=v_session
        and record_type='live_contribution'
        and record_id=v_c::text
        and cleaned_at is not null
    )
    and exists(select 1 from public.live_sessions where id=v_other_session)
    and exists(select 1 from public.articles where id=v_other_article),
    'After seven months, cleanup removes only eligible routine data and leaves unrelated Session/Article records intact.'
  );

  insert into ci_phase3_retention_results values(
    '3B-T119',
    exists(
      select 1 from public.articles
      where id=v_article and status='published'
        and title='CI Retention Final'
    )
    and exists(
      select 1 from public.live_final_reports
      where final_report_id=v_report
        and session_id=v_session
        and article_id=v_article
        and report_status='PUBLISHED'
    )
    and exists(
      select 1 from public.public_live_feed
      where article_id=v_article and permanent_url=v_url
    ),
    'Retention cleanup preserves the published Article, Final Report and Permanent Master URL.'
  );

  insert into ci_phase3_retention_results values(
    '3B-T120',
    exists(
      select 1 from public.public_live_feed
      where article_id=v_article and playback_reference=v_playback
    )
    and exists(
      select 1 from public.live_deletion_ledger
      where ledger_id=v_ledger and session_id=v_session
    )
    and exists(
      select 1 from public.live_retention_registry
      where session_id=v_session
        and record_type='deletion_ledger'
        and record_id=v_ledger::text
        and protected_from_routine_cleanup=true
        and cleanup_eligible_at is null
        and cleaned_at is null
    )
    and exists(
      select 1 from public.live_retention_registry
      where session_id=v_session
        and record_type='youtube_replay'
        and record_id=v_article::text
        and protected_from_routine_cleanup=true
        and cleanup_eligible_at is null
        and cleaned_at is null
    ),
    'Replay identity and critical deletion/accountability evidence are protected from routine seven-month cleanup.'
  );
end $$;

select
  case when ok then 'PASS' else 'FAIL' end
  || ' [' || test_id || '] '
  || detail
from ci_phase3_retention_results
order by test_id;

do $$
declare
  failed_ids text;
begin
  select string_agg(test_id, ', ' order by test_id)
  into failed_ids
  from ci_phase3_retention_results
  where not ok;

  if failed_ids is not null then
    raise exception 'PHASE3_RETENTION_REGRESSION_FAILED: %', failed_ids;
  end if;
end $$;

rollback;
