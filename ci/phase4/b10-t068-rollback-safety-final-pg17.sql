\set ON_ERROR_STOP on
-- Final B10 coding regression identity check against disposable PostgreSQL17.
-- Execute AFTER T067 PG17 rollback. No Supabase LIVE writes. NEVER grants lock.
DO $pre$
BEGIN
 IF current_database()<>'jb_b10_disposable' THEN
 RAISE EXCEPTION 'T068_NEVER_RUN_OUTSIDE_DISPOSABLE_PG17';END IF;
END $pre$;
BEGIN;
SET LOCAL statement_timeout='20s';
DO $audit$
BEGIN
 -- T067 incident simulation was wrapped in ROLLBACK and touched no permanent actor.
 IF EXISTS(SELECT 1 FROM public.audit_logs WHERE action='t067_controlled_incident_contained')
 OR to_regclass('public.live_notifications') IS NOT NULL
 THEN RAISE EXCEPTION 'T068_T067_SIMULATED_INCIDENT_NOT_ROLLED_BACK';END IF;
 IF (SELECT count(*) FROM public.articles) < 6
 THEN RAISE EXCEPTION 'T068_EXISTING_ARTICLES_MISSING';END IF;
 -- T065 disposable fixture adds Reporter B, and T066 adds a 5th synthetic suspended Reporter principal.
 -- Do not mistake this deliberately persisted fixture for a T067 rollback leak.
 IF (SELECT count(*) FROM public.user_roles) <> 5
 OR NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id='11111111-1111-1111-1111-111111111111'::uuid AND role='owner')
 OR NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id='33333333-3333-3333-3333-333333333333'::uuid AND role='editor')
 THEN RAISE EXCEPTION 'T068_EXISTING_ROLE_FIXTURE_UNEXPECTED';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc
  WHERE oid='public.jb_ad_my_campaigns()'::regprocedure
  AND prosecdef AND prosrc LIKE '%private.current_session_active()%')
 THEN RAISE EXCEPTION 'T068_T066_REVOKED_ADVERTISER_GUARD_REGRESSED';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc
  WHERE oid='public.jb_verify_owner_recovery_key(text)'::regprocedure
  AND prosecdef AND prosrc LIKE '%AUTH_SESSION_REVOKED%')
 THEN RAISE EXCEPTION 'T068_T063_RECOVERY_GUARD_REGRESSED';END IF;
 IF has_function_privilege('anon','public.jb_ad_my_campaigns()','EXECUTE')
 OR has_table_privilege('anon','public.audit_logs','SELECT')
 OR has_table_privilege('anon','public.analytics_events','SELECT')
 THEN RAISE EXCEPTION 'T068_OLD_ANON_PRIVACY_BOUNDARY_REGRESSED';END IF;
 IF (SELECT count(*) FROM public.analytics_events)<>4
 THEN RAISE EXCEPTION 'T068_B9_RAW_EVENTS_CHANGED';END IF;
END $audit$;
ROLLBACK;
\echo 'PASS T068 disposable final regression: T067 no persisted incident; T063/T066 session guards; old confidential ACLs and Article/B9 raw analytics preserved. Official full LOCK still EVIDENCE-GATED.';
