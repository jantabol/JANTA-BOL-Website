-- JANTA BOL / B10 P4-T063 — Security boundary for emergency recovery.
-- The original recovery-key verify RPC checked Owner role only, not actual
-- auth.sessions revocation. A JWT previously revoked by the Founder MUST NOT
-- reverify recovery / reach service-role MFA deletion.
-- Preserves AAL1 recovery after fresh password login (active valid session).
-- Narrow one-function change, NO data edits, NO GRANT changes, NO password/MFA edits.
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='25s';

DO $preflight$
BEGIN
 IF NOT EXISTS(
  SELECT 1 FROM pg_proc p
  WHERE p.oid='public.jb_verify_owner_recovery_key(text)'::regprocedure
    AND p.prosecdef AND pg_get_userbyid(p.proowner)='postgres'
    AND p.prolang=(SELECT oid FROM pg_language WHERE lanname='plpgsql')
    AND p.provolatile='v' AND 'search_path=""'=ANY(p.proconfig)
    AND p.prosrc ILIKE '%select * from private.verify_owner_recovery_key%'
    AND p.prosrc NOT LIKE '%private.current_session_active%'
 ) THEN RAISE EXCEPTION 'T063_EXPECTED_ORIGINAL_RECOVERY_SOURCE_CHANGED_ABORT'; END IF;
 IF NOT has_function_privilege('authenticated','public.jb_verify_owner_recovery_key(text)','EXECUTE')
 OR has_function_privilege('anon','public.jb_verify_owner_recovery_key(text)','EXECUTE')
 THEN RAISE EXCEPTION 'T063_EXPECTED_RECOVERY_RPC_ACL_MISMATCH_ABORT'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc p WHERE p.oid='private.current_session_active()'::regprocedure AND p.prosecdef)
 THEN RAISE EXCEPTION 'T063_ACTIVE_BACKEND_SESSION_GUARD_MISSING'; END IF;
END $preflight$;

CREATE OR REPLACE FUNCTION public.jb_verify_owner_recovery_key(p_recovery_key text)
RETURNS TABLE(success boolean, locked_until timestamptz, remaining_attempts integer)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path TO ''
AS $t063$
DECLARE
  v_uid uuid := auth.uid();
  v_role public.app_role;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;

  -- A caller-revoked JWT alone is insufficient. Recovery from a lost MFA
  -- still works after a valid fresh password login creating an auth.sessions row.
  IF NOT private.current_session_active() THEN
    RAISE EXCEPTION 'AUTH_SESSION_REVOKED';
  END IF;

  SELECT ur.role INTO v_role
  FROM public.user_roles ur WHERE ur.user_id=v_uid;
  IF v_role IS DISTINCT FROM 'owner'::public.app_role THEN
    RAISE EXCEPTION 'OWNER_REQUIRED';
  END IF;

  RETURN QUERY
  SELECT * FROM private.verify_owner_recovery_key(v_uid,p_recovery_key);
END;
$t063$;

DO $post$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_proc p
    WHERE p.oid='public.jb_verify_owner_recovery_key(text)'::regprocedure
      AND p.prosecdef
      AND 'search_path=""'=ANY(p.proconfig)
      AND p.prosrc LIKE '%private.current_session_active()%'
      AND p.prosrc LIKE '%AUTH_SESSION_REVOKED%')
 THEN RAISE EXCEPTION 'T063_POST_GUARD_MISSING_ABORT'; END IF;
 IF has_function_privilege('anon','public.jb_verify_owner_recovery_key(text)','EXECUTE')
 OR NOT has_function_privilege('authenticated','public.jb_verify_owner_recovery_key(text)','EXECUTE')
 THEN RAISE EXCEPTION 'T063_RPC_PERMISSION_DRIFT_ABORT'; END IF;
END $post$;
COMMIT;
