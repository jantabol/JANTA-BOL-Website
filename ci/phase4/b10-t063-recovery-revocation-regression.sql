\set ON_ERROR_STOP on
-- T063: After original-red fixture + minimum reviewed recovery session guard.
-- Runs ONLY on disposable PG17 with fake synthetic recovery verifier.
BEGIN;
SET LOCAL statement_timeout='20s';
DO $structure$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_proc p WHERE p.oid='public.jb_verify_owner_recovery_key(text)'::regprocedure
 AND p.prosecdef AND 'search_path=""'=ANY(p.proconfig)
 AND p.prosrc LIKE '%AUTH_SESSION_REVOKED%'
 AND p.prosrc LIKE '%private.current_session_active()%')
 THEN RAISE EXCEPTION 'T063_REAL_RECOVERY_GUARD_MISSING';END IF;
 IF has_function_privilege('anon','public.jb_verify_owner_recovery_key(text)','EXECUTE')
 OR NOT has_function_privilege('authenticated','public.jb_verify_owner_recovery_key(text)','EXECUTE')
 THEN RAISE EXCEPTION 'T063_RECOVERY_RPC_ACL_CHANGED';END IF;
END $structure$;

-- An attacker with a previously revoked JWT, even with MFA-looking AAL2,
-- cannot verify recovery in absence of actual matching auth.sessions.
SELECT set_config('b9.test_uid','11111111-1111-1111-1111-111111111111',true),
set_config('b9.test_aal','aal2',true),
set_config('request.jwt.claims','{"session_id":"90000000-0000-4000-8000-000000000063","aal":"aal2","amr":[{"method":"totp","timestamp":1800000000}]}',true);
SET LOCAL ROLE authenticated;
DO $revoked$
DECLARE msg text:='';
BEGIN
 IF private.current_session_active() THEN RAISE EXCEPTION 'T063_FAKE_REVOKED_SESSION_ACTIVE';END IF;
 BEGIN
 PERFORM public.jb_verify_owner_recovery_key('ISOLATED_DUMMY_KEY_ONLY');
 EXCEPTION WHEN OTHERS THEN msg:=SQLERRM;END;
 IF msg<>'AUTH_SESSION_REVOKED' THEN RAISE EXCEPTION 'T063_REVOKED_SESSION_KEY_VERIFY_BYPASS_%',msg;END IF;
END $revoked$;
RESET ROLE;

-- A real backend session created after password login can enter
-- LIMITED recovery with AAL1; do not require unavailable TOTP to recover TOTP.
SELECT set_config('b9.test_aal','aal1',true),
set_config('request.jwt.claims','{"session_id":"10000000-0000-4000-8000-000000000063","aal":"aal1"}',true);
SET LOCAL ROLE authenticated;
DO $password_recovery_allowed$
BEGIN
 IF NOT private.current_session_active() THEN RAISE EXCEPTION 'T063_FRESH_VALID_SESSION_NOT_ACTIVE';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.jb_verify_owner_recovery_key('ISOLATED_DUMMY_KEY_ONLY') WHERE success)
 THEN RAISE EXCEPTION 'T063_VALID_AAL1_LIMITED_RECOVERY_BLOCKED';END IF;
 IF EXISTS(SELECT 1 FROM public.jb_verify_owner_recovery_key('WRONG_DUMMY_KEY_ONLY') WHERE success)
 THEN RAISE EXCEPTION 'T063_WRONG_RECOVERY_KEY_ACCEPTED';END IF;
END $password_recovery_allowed$;
RESET ROLE;

-- Reporter with own valid session cannot impersonate Owner recovery.
SELECT set_config('b9.test_uid','22222222-2222-2222-2222-222222222222',true),
set_config('request.jwt.claims','{"session_id":"20000000-0000-4000-8000-000000000063","aal":"aal2"}',true);
SET LOCAL ROLE authenticated;
DO $reporter$
DECLARE msg text:='';
BEGIN
 IF NOT private.current_session_active() THEN RAISE EXCEPTION 'T063_REPORTER_TEST_SESSION_MISSING';END IF;
 BEGIN PERFORM public.jb_verify_owner_recovery_key('ISOLATED_DUMMY_KEY_ONLY');
 EXCEPTION WHEN OTHERS THEN msg:=SQLERRM;END;
 IF msg<>'OWNER_REQUIRED' THEN RAISE EXCEPTION 'T063_REPORTER_RECOVERY_BYPASS_%',msg;END IF;
END $reporter$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $anonymous$
DECLARE denied boolean:=false;
BEGIN
 BEGIN PERFORM public.jb_verify_owner_recovery_key('ISOLATED_DUMMY_KEY_ONLY');
 EXCEPTION WHEN insufficient_privilege THEN denied:=true;END;
 IF NOT denied THEN RAISE EXCEPTION 'T063_ANON_RECOVERY_EXEC_ALLOWED';END IF;
END $anonymous$;
RESET ROLE;
ROLLBACK;
\echo 'T063 PG17 PASS: revoked access token denied, fresh AAL1 limited recovery allowed, wrong key/reporter/anonymous denied; zero persistent writes.'
