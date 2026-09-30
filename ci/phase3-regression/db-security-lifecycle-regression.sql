\set ON_ERROR_STOP on
begin;

create temporary table ci_phase3_security_lifecycle_results(
  test_id text primary key,
  ok boolean not null,
  detail text not null
) on commit drop;

do $$
declare
  v_owner uuid;
  v_reporter uuid;
  v_reporter_row uuid;
  v_request uuid;
  v_session uuid;
  v_article uuid;
  v_generation uuid;
  v_generation2 uuid;
  v_h1 uuid;
  v_h2 uuid;
  v_h3 uuid;
  v_token1 text:=encode(digest('ci-handoff-1-'||gen_random_uuid()::text,'sha256'),'hex');
  v_token2 text:=encode(digest('ci-handoff-2-'||gen_random_uuid()::text,'sha256'),'hex');
  v_token3 text:=encode(digest('ci-handoff-3-'||gen_random_uuid()::text,'sha256'),'hex');
  v_result jsonb;
  v_second jsonb;
  v_regrant jsonb;
  v_old_grant bigint;
  v_new_grant bigint;
  v_before bigint;
  v_after bigint;
  v_other_article uuid;
  v_other_session uuid;
  v_normal_article uuid;
  v_def text;
  v_ok boolean;
begin
  select user_id into v_owner
  from public.user_roles
  where role='owner'::public.app_role
  limit 1;

  select r.user_id,r.id into v_reporter,v_reporter_row
  from public.reporters r
  join public.user_roles ur on ur.user_id=r.user_id
  where ur.role='reporter'::public.app_role
    and r.active=true
    and r.live_permission=true
  order by r.created_at
  limit 1;

  if v_owner is null or v_reporter is null then
    raise exception 'CI_SECURITY_LIFECYCLE_ACTORS_MISSING';
  end if;

  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='jb_live_actor_context_internal'
  limit 1;

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P3-T025',
    v_def ilike '%auth.sessions%'
      and v_def ilike '%s.id=p_session_id%'
      and v_def ilike '%s.user_id=p_user_id%',
    'Current Supabase session ID is checked against the actual authenticated user before sensitive Live context is trusted.'
  );

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P3-T026',
    v_def ilike '%session_active%'
      and v_def ilike '%auth.sessions%',
    'Application security context derives current session activity from the server-side Auth session registry.'
  );

  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='jb_live_suspend_reporter_internal'
  limit 1;

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P3-T022',
    v_def ilike '%update public.reporters%'
      and v_def ilike '%active=false%'
      and v_def ilike '%jb_live_revoke_permission_internal%',
    'Account suspension is a broader control than a single-session permission revoke and explicitly revokes affected Live permissions.'
  );

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P3-T035',
    v_def ilike '%active=false%'
      and v_def ilike '%encoder_handoffs%'
      and v_def ilike '%revoked_at%'
      and v_def ilike '%jb_live_revoke_permission_internal%',
    'Reporter account suspension disables the Reporter, revokes current Live assignments and invalidates unused handoffs.'
  );

  -- Approval fixture: one request -> one article/session/generation/operation.
  insert into public.live_requests(
    reporter_id,headline,location,description,expected_duration_minutes,
    request_status,state_version,client_action_id
  ) values(
    v_reporter,'CI Security Lifecycle','CI Location','transactional security fixture',30,
    'PENDING',1,gen_random_uuid()
  ) returning request_id into v_request;

  v_result:=public.jb_live_approve_request_internal(v_owner,v_request,1);
  v_session:=(v_result->>'session_id')::uuid;
  v_article:=(v_result->>'article_id')::uuid;
  v_generation:=(v_result->>'generation_id')::uuid;

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P3-T054',
    (select request_status='APPROVED' and approved_by=v_owner from public.live_requests where request_id=v_request)
      and exists(select 1 from public.live_sessions where id=v_session and article_id=v_article)
      and exists(select 1 from public.live_provider_generations where generation_id=v_generation and session_id=v_session)
      and exists(select 1 from public.live_operations where session_id=v_session and generation_id=v_generation and operation_type='PROVISION_LIVE'),
    'Approval commits internal identities and a durable provider operation while external provider work remains asynchronous.'
  );

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P3-T056',
    (select request_status='APPROVED' and state_version=2 from public.live_requests where request_id=v_request)
      and (select session_status='PROVISIONING' and public_status='OFF' from public.live_sessions where id=v_session)
      and (select generation_number=1 and is_current from public.live_provider_generations where generation_id=v_generation),
    'Internal approval transaction produces APPROVED request, one canonical Session, Generation #1 and OFF public state.'
  );

  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='jb_live_approve_request_internal'
  limit 1;

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P3-T055',
    v_def ilike '%insert into public.live_operations%'
      and v_def not ilike '%http_post%'
      and v_def not ilike '%net.http%'
      and v_def not ilike '%functions/v1%'
      and v_def not ilike '%fetch(%',
    'Approval DB function queues provider work and contains no third-party HTTP/provider network call inside the database transaction.'
  );

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P3-T057',
    v_def ilike '%insert into public.live_operations%'
      and v_def ilike '%return jsonb_build_object%'
      and v_def not ilike '%exception when%',
    'Approval uses one uncaught PostgreSQL function transaction; operation enqueue failure aborts the call instead of returning half-approved success.'
  );

  select count(*) into v_before from public.live_sessions where request_id=v_request;
  v_second:=public.jb_live_approve_request_internal(v_owner,v_request,2);
  select count(*) into v_after from public.live_sessions where request_id=v_request;

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P3-T058',
    v_before=1 and v_after=1
      and (v_second->>'idempotent')::boolean
      and (v_second->>'session_id')::uuid=v_session,
    'Repeated approval cannot create a second canonical Live Session for the same request.'
  );

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P3-T060',
    v_after=1
      and exists(
        select 1 from pg_constraint
        where conrelid='public.live_sessions'::regclass
          and conname='live_sessions_request_unique'
          and contype='u'
      ),
    'Business uniqueness enforces one request -> one Session independently of caller/device retries.'
  );

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P3-T061',
    exists(
      select 1 from pg_indexes
      where schemaname='public' and tablename='live_operations'
        and indexdef ilike 'CREATE UNIQUE INDEX%'
        and indexdef ilike '%operation_type%'
        and indexdef ilike '%session_id%'
        and indexdef ilike '%generation_id%'
    ),
    'Provider operation uniqueness is database-enforced by operation type + Session + Provider Generation.'
  );

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P3-T062',
    v_def ilike '%for update%'
      and v_def ilike '%where request_id=p_request_id%',
    'Approval locks the canonical request row before state validation so concurrent approval attempts serialize.'
  );

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P3-T063',
    (v_second->>'session_id')::uuid=v_session
      and (v_second->>'article_id')::uuid=v_article
      and (v_second->>'idempotent')::boolean,
    'Retry after a committed approval returns the existing Session/Article rather than creating new business identity.'
  );

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P3-T064',
    not exists(
      select 1 from (values
        ('operation_id'),('operation_type'),('session_id'),('generation_id'),
        ('operation_state'),('operation_step'),('attempt_count'),
        ('provider_result_reference'),('last_safe_error_code')
      ) req(col)
      where not exists(
        select 1 from information_schema.columns c
        where c.table_schema='public' and c.table_name='live_operations' and c.column_name=req.col
      )
    ),
    'Durable provider operation journal records operation identity, step/state, attempt count and provider/safe-error references.'
  );

  -- Stale request state/version is rejected.
  insert into public.live_requests(
    reporter_id,headline,location,description,expected_duration_minutes,
    request_status,state_version,client_action_id
  ) values(
    v_reporter,'CI Stale Approval','CI Location','stale-version fixture',30,
    'PENDING',2,gen_random_uuid()
  ) returning request_id into v_other_session;

  begin
    perform public.jb_live_approve_request_internal(v_owner,v_other_session,1);
    v_ok:=false;
  exception when others then
    v_ok:=position('REQUEST_STATE_CHANGED' in sqlerrm)>0;
  end;

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P3-T078',
    v_ok and (select request_status='PENDING' and state_version=2 from public.live_requests where request_id=v_other_session),
    'Admin approval of a stale request version is rejected without silently approving changed request state.'
  );

  -- Handoff lifecycle: short-lived, latest-only, single-use.
  update public.live_sessions
  set session_status='READY',public_status='OFF',active=false,ready_at=now()
  where id=v_session;

  update public.live_provider_generations
  set provider_state='READY',credential_status='SERVER_ONLY',is_current=true,
      provider_broadcast_lifecycle='ready',provider_stream_status='inactive'
  where generation_id=v_generation;

  v_result:=public.jb_live_create_handoff_internal(v_reporter,v_session,v_token1,90);
  v_h1:=(v_result->>'handoff_id')::uuid;
  v_result:=public.jb_live_create_handoff_internal(v_reporter,v_session,v_token2,90);
  v_h2:=(v_result->>'handoff_id')::uuid;

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P3-T027',
    (select grant_version=1 from public.live_session_members where session_id=v_session and user_id=v_reporter and permission='BROADCAST')
      and (select grant_version=1 from public.encoder_handoffs where handoff_id=v_h2),
    'Live membership and encoder handoff carry the same explicit Grant Version.'
  );

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P4-T061',
    (select expires_at>created_at and expires_at<=created_at+interval '180 seconds' from public.encoder_handoffs where handoff_id=v_h2)
      and (select revoked_at is not null from public.encoder_handoffs where handoff_id=v_h1)
      and (select token_hash=v_token2 from public.encoder_handoffs where handoff_id=v_h2)
      and not exists(
        select 1 from information_schema.columns
        where table_schema='public' and table_name='live_provider_generations'
          and column_name ~* '(stream.*key|raw.*key|credential.*secret)'
      ),
    'Encoder credential handoff is token-hash based, short-lived/latest-only, and raw stream key is absent from ordinary generation storage.'
  );

  perform public.jb_live_consume_handoff_internal(v_token2);

  begin
    perform public.jb_live_consume_handoff_internal(v_token2);
    v_ok:=false;
  exception when others then
    v_ok:=position('HANDOFF_ALREADY_USED' in sqlerrm)>0;
  end;

  update ci_phase3_security_lifecycle_results
  set ok=ok and v_ok,
      detail=detail||' Handoff consumption is single-use.'
  where test_id='3A-P4-T061';

  -- Create one still-unused handoff, then revoke session permission.
  v_result:=public.jb_live_create_handoff_internal(v_reporter,v_session,v_token3,90);
  v_h3:=(v_result->>'handoff_id')::uuid;

  select grant_version into v_old_grant
  from public.live_session_members
  where session_id=v_session and user_id=v_reporter and permission='BROADCAST';

  perform public.jb_live_revoke_permission_internal(v_owner,v_session,'CI_PERMISSION_REVOKE');

  select grant_version into v_new_grant
  from public.live_session_members
  where session_id=v_session and user_id=v_reporter and permission='BROADCAST';

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P3-T028',
    v_new_grant=v_old_grant+1
      and (select status='REVOKED' and revoked_by=v_owner and revocation_reason='CI_PERMISSION_REVOKE'
           from public.live_session_members where session_id=v_session and user_id=v_reporter and permission='BROADCAST')
      and (select revoked_at is not null from public.encoder_handoffs where handoff_id=v_h3),
    'Session permission revoke increments Grant Version, records revoke evidence and invalidates pending old handoffs.'
  );

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P3-T029',
    (select provider_state='RETIRE_PENDING' and credential_status='RETIRE_PENDING'
       from public.live_provider_generations where generation_id=v_generation)
      and exists(
        select 1 from public.live_operations
        where session_id=v_session and generation_id=v_generation
          and operation_type in('RETIRE_STREAM','COMPLETE_LIVE')
          and operation_state in('QUEUED','RETRY_PENDING','PROCESSING','AMBIGUOUS','FAILED_NEEDS_ATTENTION','SUCCEEDED')
      ),
    'Revoking JANTA BOL permission also starts retirement of the issued provider credential/resource.'
  );

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P3-T030',
    (select status='REVOKED' from public.live_session_members where session_id=v_session and user_id=v_reporter and permission='BROADCAST')
      and (select revoked_at is not null from public.encoder_handoffs where handoff_id=v_h3)
      and (select credential_status='RETIRE_PENDING' from public.live_provider_generations where generation_id=v_generation),
    'Revocation evidence covers DB permission, pending handoff invalidation and provider-credential retirement state.'
  );

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P3-T031',
    (select status='REVOKED' from public.live_session_members where session_id=v_session and user_id=v_reporter and permission='BROADCAST')
      and (select public_status<>'LIVE' from public.live_sessions where id=v_session)
      and (select credential_status='RETIRE_PENDING' from public.live_provider_generations where generation_id=v_generation),
    'Provider retirement can remain pending without reopening DB permission or claiming a healthy public LIVE.'
  );

  begin
    perform public.jb_live_consume_handoff_internal(v_token3);
    v_ok:=false;
  exception when others then
    v_ok:=position('HANDOFF_REVOKED' in sqlerrm)>0
      or position('HANDOFF_GRANT_VERSION_STALE' in sqlerrm)>0
      or position('LIVE_PERMISSION_NOT_ACTIVE' in sqlerrm)>0;
  end;

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P4-T064',
    v_ok and (select revoked_at is not null from public.encoder_handoffs where handoff_id=v_h3),
    'A still-valid client/session cannot use an unused old handoff after Live permission revocation.'
  );

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P4-T065',
    (select credential_status='RETIRE_PENDING' and provider_state='RETIRE_PENDING'
       from public.live_provider_generations where generation_id=v_generation)
      and (select public_status<>'LIVE' from public.live_sessions where id=v_session),
    'Already-issued provider credential enters retirement and public healthy-LIVE is stopped before retirement completion.'
  );

  -- Session-specific revoke leaves Reporter account itself active.
  insert into ci_phase3_security_lifecycle_results values(
    '3A-P3-T034',
    (select active=true from public.reporters where user_id=v_reporter)
      and (select status='REVOKED' from public.live_session_members where session_id=v_session and user_id=v_reporter),
    'Revoking one Live assignment does not log out/suspend the whole Reporter account.'
  );

  -- Re-grant must create fresh authority and provider generation.
  v_regrant:=public.jb_live_regrant_permission_internal(v_owner,v_session);
  v_generation2:=(v_regrant->>'generation_id')::uuid;

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P3-T036',
    (select status='ACTIVE' and grant_version=v_new_grant+1
       from public.live_session_members where session_id=v_session and user_id=v_reporter and permission='BROADCAST')
      and v_generation2 is not null and v_generation2<>v_generation
      and (select is_current=false and credential_status in('RETIRE_PENDING','RETIRED')
           from public.live_provider_generations where generation_id=v_generation)
      and (select is_current=true and generation_number=2 and credential_status='SERVER_ONLY'
           from public.live_provider_generations where generation_id=v_generation2),
    'Re-grant never reopens the old grant: it increments Grant Version and creates a fresh Provider Generation.'
  );

  -- Account-suspension path is required to revoke all active assignments/handoffs.
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='jb_live_suspend_reporter_internal'
  limit 1;

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P3-T033',
    v_def ilike '%update public.reporters%'
      and v_def ilike '%jb_live_revoke_permission_internal%'
      and v_def ilike '%encoder_handoffs%'
      and v_def ilike '%revoked_at%',
    'Lost/stolen device containment has a server-side Reporter suspension path that revokes Live permissions and pending handoffs.'
  );

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P4-T066',
    v_def ilike '%active=false%'
      and v_def ilike '%jb_live_revoke_permission_internal%'
      and v_def ilike '%encoder_handoffs%',
    'Reporter suspension disables the account and revokes active/pending Live authority rather than relying on UI hiding.'
  );

  -- Retire-pending credentials cannot be reissued.
  update public.live_sessions
  set session_status='READY',public_status='OFF',current_provider_generation=v_generation2
  where id=v_session;
  update public.live_provider_generations
  set provider_state='RETIRE_PENDING',credential_status='RETIRE_PENDING',is_current=true
  where generation_id=v_generation2;

  begin
    perform public.jb_live_create_handoff_internal(
      v_reporter,v_session,encode(digest('ci-retire-pending-'||gen_random_uuid()::text,'sha256'),'hex'),90
    );
    v_ok:=false;
  exception when others then
    v_ok:=position('PROVIDER_CREDENTIAL_UNUSABLE' in sqlerrm)>0;
  end;

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P3-T021',
    v_ok
      and (select credential_status='RETIRE_PENDING' from public.live_provider_generations where generation_id=v_generation2),
    'RETIRE_PENDING provider credential cannot be handed out/reused while cleanup is unresolved.'
  );

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P4-T091',
    v_ok,
    'Cleanup-pending credential is non-reusable; retirement can remain retryable without reopening encoder authority.'
  );

  -- Normal technical end queues stream retirement while preserving identities/history.
  update public.live_provider_generations
  set provider_state='ACTIVE',credential_status='ACTIVE',
      provider_broadcast_lifecycle='complete',provider_stream_status='inactive'
  where generation_id=v_generation2;
  update public.live_sessions
  set session_status='LIVE',public_status='LIVE',active=true,started_at=coalesce(started_at,now())
  where id=v_session;
  update public.articles set status='published',published_at=coalesce(published_at,now()) where id=v_article;
  insert into public.public_live_feed(
    article_id,permanent_url,headline,public_location,public_status,playback_reference,live_started_at
  ) values(
    v_article,'article.html?id='||v_article::text,'CI Security Lifecycle','CI','LIVE','ci://security/'||v_session::text,now()
  )
  on conflict(article_id) do update set public_status='LIVE',playback_reference=excluded.playback_reference,updated_at=now();

  perform public.jb_live_finalize_end_internal(v_session,v_generation2);

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P3-T020',
    (select session_status='ENDED' and public_status='OFF' and not active from public.live_sessions where id=v_session)
      and exists(select 1 from public.live_operations where session_id=v_session and generation_id=v_generation2 and operation_type='RETIRE_STREAM')
      and exists(select 1 from public.live_provider_generations where generation_id=v_generation2)
      and exists(select 1 from public.articles where id=v_article),
    'Normal technical end removes public LIVE and queues stream-resource retirement without deleting Article/session/provider history.'
  );

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P4-T090',
    (select public_status='OFF' from public.live_sessions where id=v_session)
      and exists(select 1 from public.articles where id=v_article)
      and exists(select 1 from public.live_provider_generations where generation_id=v_generation2),
    'Technical end leaves canonical Article and provider-generation history intact while public LIVE turns OFF.'
  );

  -- Failure isolation: unrelated Live and normal article stay independent.
  insert into public.articles(slug,title,body,status,created_by,updated_by,published_at)
  values(
    'ci-security-other-'||replace(gen_random_uuid()::text,'-',''),
    'CI Other Live','fixture','published',v_owner,v_owner,now()
  ) returning id into v_other_article;

  insert into public.live_sessions(
    article_id,reporter_id,assigned_reporter_id,headline,active,session_status,public_status,approved_at
  ) values(
    v_other_article,v_reporter_row,v_reporter,'CI Other Live',true,'LIVE','LIVE',now()
  ) returning id into v_other_session;

  insert into public.articles(slug,title,body,status,created_by,updated_by)
  values(
    'ci-normal-security-'||replace(gen_random_uuid()::text,'-',''),
    'CI Normal Article','fixture','draft',v_owner,v_owner
  ) returning id into v_normal_article;

  update public.articles
  set status='published',published_at=now()
  where id=v_normal_article;

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P4-T092',
    (select status='published'::public.article_status from public.articles where id=v_normal_article)
      and (select session_status='ENDED' from public.live_sessions where id=v_session),
    'Provider/Live failure or end state does not block independent normal article publishing.'
  );

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P4-T095',
    (select session_status='LIVE' and public_status='LIVE' and active from public.live_sessions where id=v_other_session)
      and (select session_status='ENDED' and public_status='OFF' from public.live_sessions where id=v_session)
      and (select status='published'::public.article_status from public.articles where id=v_normal_article),
    'One Live/provider failure is isolated from another Live Session and the normal article system.'
  );

  -- Queue access and function execution boundaries.
  insert into ci_phase3_security_lifecycle_results values(
    '3A-P4-T068',
    not has_function_privilege('authenticated','public.jb_live_claim_operation_internal(text,integer)'::regprocedure,'EXECUTE')
      and not has_function_privilege('anon','public.jb_live_claim_operation_internal(text,integer)'::regprocedure,'EXECUTE'),
    'Privileged worker claim function is not executable by normal browser roles.'
  );

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P4-T069',
    (select relrowsecurity from pg_class where oid='public.live_operations'::regclass)
      and exists(select 1 from pg_policies where schemaname='public' and tablename='live_operations' and policyname='deny_client_all'),
    'Browser/Reporter access to the private durable operation queue is blocked by RLS/policy.'
  );

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P4-T072',
    exists(
      select 1 from pg_constraint
      where conrelid='public.live_sessions'::regclass
        and conname='live_sessions_request_unique' and contype='u'
    ),
    'Database constraint enforces exact one Request -> one canonical Session.'
  );

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P4-T073',
    exists(
      select 1 from pg_indexes
      where schemaname='public' and tablename='live_provider_generations'
        and indexname='live_provider_one_current_idx'
        and indexdef ilike '%WHERE is_current%'
    ),
    'Database permits at most one current Provider Generation per Live Session.'
  );

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P4-T083',
    not exists(
      select 1
      from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind='v'
        and not ('security_invoker=true'=any(coalesce(c.reloptions,array[]::text[])))
    ),
    'Public-schema views use security-invoker behavior and do not silently bypass intended caller RLS.'
  );

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P4-T087',
    exists(
      select 1 from pg_policies
      where schemaname='public' and tablename='public_live_feed'
        and cmd='SELECT' and roles @> array['anon']::name[]
    )
      and not exists(
        select 1 from information_schema.columns
        where table_schema='public' and table_name='public_live_feed'
          and (column_name ~* '(token|secret|password|credential|grant_version|operation_id|provider_stream_id|provider_broadcast_id)'
               or column_name in('assigned_reporter_id','reporter_user_id'))
      ),
    'Safe public_live_feed is anon-readable by policy while credential/authority/internal provider fields are absent from its projection.'
  );
end $$;

-- Direct browser-role negative access evidence.
set local role authenticated;

do $$
declare
  v_read_ok boolean:=false;
  v_write_ok boolean:=false;
  v_queue_ok boolean:=false;
  v_count bigint;
begin
  begin
    select count(*) into v_count from public.live_requests;
    v_read_ok:=(v_count=0);
  exception when insufficient_privilege then
    v_read_ok:=true;
  end;

  begin
    update public.live_sessions set headline='CI UNAUTHORIZED' where true;
    get diagnostics v_count=row_count;
    v_write_ok:=(v_count=0);
  exception when insufficient_privilege then
    v_write_ok:=true;
  end;

  begin
    select count(*) into v_count from public.live_operations;
    v_queue_ok:=(v_count=0);
  exception when insufficient_privilege then
    v_queue_ok:=true;
  end;

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P4-T079',
    v_read_ok,
    'Generic authenticated/non-privileged client cannot directly read internal Live request tables.'
  );

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P4-T081',
    v_write_ok,
    'Authenticated client cannot directly cross-write canonical Live Session state.'
  );

  update ci_phase3_security_lifecycle_results
  set ok=ok and v_queue_ok,
      detail=detail||' Direct authenticated queue read is also denied.'
  where test_id='3A-P4-T069';
end $$;

reset role;

set local role anon;

do $$
declare
  v_internal_ok boolean:=false;
  v_public_write_ok boolean:=false;
  v_count bigint;
begin
  begin
    select count(*) into v_count from public.live_sessions;
    v_internal_ok:=(v_count=0);
  exception when insufficient_privilege then
    v_internal_ok:=true;
  end;

  begin
    update public.public_live_feed set headline='CI UNAUTHORIZED' where true;
    get diagnostics v_count=row_count;
    v_public_write_ok:=(v_count=0);
  exception when insufficient_privilege then
    v_public_write_ok:=true;
  end;

  update ci_phase3_security_lifecycle_results
  set ok=ok and v_internal_ok,
      detail=detail||' Anonymous internal Live-table reads are denied.'
  where test_id='3A-P4-T079';

  insert into ci_phase3_security_lifecycle_results values(
    '3A-P4-T082',
    v_public_write_ok,
    'Anonymous/public client cannot directly mutate canonical public Live projection.'
  );
end $$;

reset role;

select
  case when ok then 'PASS' else 'FAIL' end
  || ' [' || test_id || '] '
  || detail
from ci_phase3_security_lifecycle_results
order by test_id;

do $$
declare
  failed_ids text;
begin
  select string_agg(test_id, ', ' order by test_id)
  into failed_ids
  from ci_phase3_security_lifecycle_results
  where not ok;

  if failed_ids is not null then
    raise exception 'PHASE3_SECURITY_LIFECYCLE_REGRESSION_FAILED: %', failed_ids;
  end if;
end $$;

rollback;
