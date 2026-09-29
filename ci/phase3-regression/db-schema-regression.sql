\set ON_ERROR_STOP on
begin;

create temporary table ci_phase3_schema_results(
  test_id text primary key,
  ok boolean not null,
  detail text not null
) on commit drop;

do $$
begin
  insert into ci_phase3_schema_results values(
    '3A-P2-T024',
    to_regclass('public.live_requests') is not null,
    'Canonical live_requests table exists.'
  );

  insert into ci_phase3_schema_results values(
    '3A-P2-T025',
    not exists(
      select 1 from (values
        ('request_id'),('reporter_id'),('headline'),('location')
      ) req(column_name)
      where not exists(
        select 1 from information_schema.columns c
        where c.table_schema='public' and c.table_name='live_requests'
          and c.column_name=req.column_name
      )
    ),
    'live_requests contains request_id, reporter_id, headline and location.'
  );

  insert into ci_phase3_schema_results values(
    '3A-P2-T026',
    not exists(
      select 1 from (values
        ('state_version'),('requested_at'),('approved_at'),('approved_by'),('rejected_at')
      ) req(column_name)
      where not exists(
        select 1 from information_schema.columns c
        where c.table_schema='public' and c.table_name='live_requests'
          and c.column_name=req.column_name
      )
    ),
    'live_requests preserves version/decision timestamps and approving actor fields.'
  );

  insert into ci_phase3_schema_results values(
    '3A-P2-T027',
    to_regclass('public.live_sessions') is not null,
    'Canonical live_sessions runtime table exists.'
  );

  insert into ci_phase3_schema_results values(
    '3A-P2-T028',
    not exists(
      select 1 from (values
        ('id'),('request_id'),('article_id'),('assigned_reporter_id')
      ) req(column_name)
      where not exists(
        select 1 from information_schema.columns c
        where c.table_schema='public' and c.table_name='live_sessions'
          and c.column_name=req.column_name
      )
    ),
    'live_sessions contains canonical Session, Request, Article and assigned Reporter identity fields.'
  );

  insert into ci_phase3_schema_results values(
    '3A-P2-T029',
    not exists(
      select 1 from (values
        ('public_status'),('current_provider_generation'),('created_at'),('ready_at'),('started_at')
      ) req(column_name)
      where not exists(
        select 1 from information_schema.columns c
        where c.table_schema='public' and c.table_name='live_sessions'
          and c.column_name=req.column_name
      )
    ),
    'live_sessions contains public/provider mapping and core lifecycle timestamps.'
  );

  insert into ci_phase3_schema_results values(
    '3A-P2-T030',
    exists(
      select 1 from pg_indexes
      where schemaname='public' and tablename='live_sessions'
        and indexdef ilike 'CREATE UNIQUE INDEX%'
        and indexdef ~* '\\(request_id\\)'
    ),
    'Database uniqueness enforces maximum one canonical Live Session per Request ID.'
  );

  insert into ci_phase3_schema_results values(
    '3A-P2-T032',
    to_regclass('public.live_session_members') is not null,
    'Session-specific user permission mapping table exists.'
  );

  insert into ci_phase3_schema_results values(
    '3A-P2-T033',
    not exists(
      select 1 from (values
        ('membership_id'),('session_id'),('user_id'),('permission')
      ) req(column_name)
      where not exists(
        select 1 from information_schema.columns c
        where c.table_schema='public' and c.table_name='live_session_members'
          and c.column_name=req.column_name
      )
    ),
    'live_session_members contains membership/session/user/permission identity fields.'
  );

  insert into ci_phase3_schema_results values(
    '3A-P2-T034',
    not exists(
      select 1 from (values
        ('grant_version'),('granted_at'),('revoked_at'),('revoked_by'),('revocation_reason')
      ) req(column_name)
      where not exists(
        select 1 from information_schema.columns c
        where c.table_schema='public' and c.table_name='live_session_members'
          and c.column_name=req.column_name
      )
    ),
    'live_session_members contains grant-version and complete revocation evidence fields.'
  );

  insert into ci_phase3_schema_results values(
    '3A-P2-T035',
    to_regclass('public.live_provider_generations') is not null,
    'Provider generations are stored separately from JANTA BOL Live Session identity.'
  );

  insert into ci_phase3_schema_results values(
    '3A-P2-T037',
    not exists(
      select 1 from (values
        ('generation_id'),('session_id'),('generation_number'),('provider')
      ) req(column_name)
      where not exists(
        select 1 from information_schema.columns c
        where c.table_schema='public' and c.table_name='live_provider_generations'
          and c.column_name=req.column_name
      )
    ),
    'Provider generation contains generation/session/number/provider identity fields.'
  );

  insert into ci_phase3_schema_results values(
    '3A-P2-T038',
    not exists(
      select 1 from (values
        ('provider_state'),('credential_status'),('created_at'),('first_issued_at'),('active_at')
      ) req(column_name)
      where not exists(
        select 1 from information_schema.columns c
        where c.table_schema='public' and c.table_name='live_provider_generations'
          and c.column_name=req.column_name
      )
    ),
    'Provider generation contains provider state, credential lifecycle and timestamps.'
  );

  insert into ci_phase3_schema_results values(
    '3A-P2-T039',
    exists(
      select 1 from pg_indexes
      where schemaname='public' and tablename='live_provider_generations'
        and indexdef ilike 'CREATE UNIQUE INDEX%'
        and indexdef ~* '\\(session_id, generation_number\\)'
    )
    and exists(
      select 1 from pg_indexes
      where schemaname='public' and tablename='live_provider_generations'
        and indexdef ilike 'CREATE UNIQUE INDEX%'
        and indexdef ~* '\\(session_id\\)'
        and indexdef ilike '%WHERE is_current%'
    ),
    'Database enforces unique generation number per Session and maximum one current generation.'
  );

  insert into ci_phase3_schema_results values(
    '3A-P2-T040',
    not exists(
      select 1 from information_schema.columns
      where table_schema='public' and table_name='live_provider_generations'
        and column_name ~* '(stream.*key|raw.*key|credential.*secret|ingest.*password)'
    ),
    'Ordinary provider-generation table has no raw stream-key/credential-secret storage field.'
  );

  insert into ci_phase3_schema_results values(
    '3A-P2-T041',
    to_regclass('public.encoder_handoffs') is not null,
    'Dedicated encoder_handoffs lifecycle table exists.'
  );

  insert into ci_phase3_schema_results values(
    '3A-P2-T042',
    not exists(
      select 1 from (values
        ('handoff_id'),('token_hash'),('session_id'),('reporter_id')
      ) req(column_name)
      where not exists(
        select 1 from information_schema.columns c
        where c.table_schema='public' and c.table_name='encoder_handoffs'
          and c.column_name=req.column_name
      )
    )
    and exists(
      select 1 from pg_indexes
      where schemaname='public' and tablename='encoder_handoffs'
        and indexdef ilike 'CREATE UNIQUE INDEX%'
        and indexdef ~* '\\(token_hash\\)'
    ),
    'Encoder handoff tracks ID, token hash, Session and Reporter; token hash is unique.'
  );

  insert into ci_phase3_schema_results values(
    '3A-P2-T043',
    to_regclass('public.live_operations') is not null,
    'Durable privileged Live operation journal exists.'
  );

  insert into ci_phase3_schema_results values(
    '3A-P2-T044',
    not exists(
      select 1 from (values
        ('operation_id'),('operation_type'),('operation_state'),('operation_step'),
        ('attempt_count'),('provider_result_reference'),('last_safe_error_code')
      ) req(column_name)
      where not exists(
        select 1 from information_schema.columns c
        where c.table_schema='public' and c.table_name='live_operations'
          and c.column_name=req.column_name
      )
    ),
    'Operation journal can trace exact sub-step, state, attempts, provider result and safe failure code.'
  );

  insert into ci_phase3_schema_results values(
    '3A-P2-T045',
    not exists(
      select 1 from (values
        ('operation_id'),('operation_type'),('session_id'),('generation_id')
      ) req(column_name)
      where not exists(
        select 1 from information_schema.columns c
        where c.table_schema='public' and c.table_name='live_operations'
          and c.column_name=req.column_name
      )
    ),
    'live_operations contains operation/type/session/generation identity fields.'
  );

  insert into ci_phase3_schema_results values(
    '3A-P2-T046',
    exists(
      select 1 from pg_indexes
      where schemaname='public' and tablename='live_operations'
        and indexdef ilike 'CREATE UNIQUE INDEX%'
        and indexdef ilike '%operation_type%'
        and indexdef ilike '%session_id%'
        and indexdef ilike '%generation_id%'
    ),
    'Database uniqueness prevents duplicate canonical logical provider operations.'
  );

  insert into ci_phase3_schema_results values(
    '3A-P2-T047',
    to_regclass('public.public_live_feed') is not null
    and exists(
      select 1 from pg_policies
      where schemaname='public' and tablename='public_live_feed'
        and cmd='SELECT' and roles @> array['anon']::name[]
    )
    and exists(
      select 1 from pg_policies
      where schemaname='public' and tablename='live_provider_generations'
        and policyname='deny_client_all'
    ),
    'Dedicated public_live_feed projection is public-readable while internal provider table remains client-denied.'
  );

  insert into ci_phase3_schema_results values(
    '3A-P2-T048',
    not exists(
      select 1 from information_schema.columns
      where table_schema='public' and table_name='public_live_feed'
        and column_name in (
          'reporter_user_id','assigned_reporter_id','token_hash','grant_version',
          'provider_broadcast_id','provider_stream_id','operation_id','safe_error_code',
          'stream_key','refresh_token'
        )
    )
    and not exists(
      select 1 from (values
        ('article_id'),('permanent_url'),('headline'),('public_location')
      ) req(column_name)
      where not exists(
        select 1 from information_schema.columns c
        where c.table_schema='public' and c.table_name='public_live_feed'
          and c.column_name=req.column_name
      )
    ),
    'Public Live projection contains required safe public identity fields and excludes known internal credential/authority fields.'
  );

  insert into ci_phase3_schema_results values(
    '3A-P2-T053',
    to_regclass('public.youtube_integration') is not null
    and not exists(
      select 1 from (values
        ('provider'),('expected_channel_id'),('verified_channel_id'),('connection_state')
      ) req(column_name)
      where not exists(
        select 1 from information_schema.columns c
        where c.table_schema='public' and c.table_name='youtube_integration'
          and c.column_name=req.column_name
      )
    ),
    'Protected YouTube integration metadata stores provider, expected/verified channel and connection state.'
  );

  insert into ci_phase3_schema_results values(
    '3A-P2-T054',
    not exists(
      select 1 from (values
        ('last_verified_at'),('last_refresh_status'),('reauth_required_at'),('safe_error_code')
      ) req(column_name)
      where not exists(
        select 1 from information_schema.columns c
        where c.table_schema='public' and c.table_name='youtube_integration'
          and c.column_name=req.column_name
      )
    )
    and not exists(
      select 1 from information_schema.columns
      where table_schema='public' and table_name='youtube_integration'
        and column_name ~* '(refresh_token|access_token|client_secret)'
    )
    and exists(
      select 1 from pg_policies
      where schemaname='public' and tablename='youtube_integration'
        and policyname='deny_client_all'
    ),
    'YouTube integration stores safe refresh/reauth metadata but no OAuth refresh/access token or client secret in the normal table.'
  );

  insert into ci_phase3_schema_results values(
    '3A-P2-T060',
    exists(
      select 1 from information_schema.columns
      where table_schema='public' and table_name='live_sessions' and column_name='session_status'
    )
    and exists(
      select 1 from information_schema.columns
      where table_schema='public' and table_name='live_sessions' and column_name='public_status'
    ),
    'Technical Live Session state and public display state are separate authoritative fields.'
  );

  insert into ci_phase3_schema_results values(
    '3A-P2-T134',
    not exists(
      select 1 from (values
        ('worker_id'),('processing_started_at'),('lease_until')
      ) req(column_name)
      where not exists(
        select 1 from information_schema.columns c
        where c.table_schema='public' and c.table_name='live_operations'
          and c.column_name=req.column_name
      )
    ),
    'Operation journal includes durable worker ownership/lease fields for duplicate-worker protection.'
  );

  insert into ci_phase3_schema_results values(
    '3A-P3-RLS-LIVE-CORE',
    (select relrowsecurity from pg_class where oid='public.live_requests'::regclass)
    and (select relrowsecurity from pg_class where oid='public.live_session_members'::regclass)
    and (select relrowsecurity from pg_class where oid='public.live_provider_generations'::regclass)
    and (select relrowsecurity from pg_class where oid='public.encoder_handoffs'::regclass)
    and (select relrowsecurity from pg_class where oid='public.live_operations'::regclass)
    and exists(select 1 from pg_policies where schemaname='public' and tablename='live_requests' and policyname='deny_client_all')
    and exists(select 1 from pg_policies where schemaname='public' and tablename='live_session_members' and policyname='deny_client_all')
    and exists(select 1 from pg_policies where schemaname='public' and tablename='live_provider_generations' and policyname='deny_client_all')
    and exists(select 1 from pg_policies where schemaname='public' and tablename='encoder_handoffs' and policyname='deny_client_all')
    and exists(select 1 from pg_policies where schemaname='public' and tablename='live_operations' and policyname='deny_client_all'),
    'Security guardrail: critical Live internal tables have RLS enabled and explicit client-deny policies.'
  );
end $$;

select
  case when ok then 'PASS' else 'FAIL' end
  || ' [' || test_id || '] '
  || detail
from ci_phase3_schema_results
order by test_id;

do $$
declare
  failed_ids text;
begin
  select string_agg(test_id, ', ' order by test_id)
  into failed_ids
  from ci_phase3_schema_results
  where not ok;

  if failed_ids is not null then
    raise exception 'PHASE3_SCHEMA_REGRESSION_FAILED: %', failed_ids;
  end if;
end $$;

rollback;
