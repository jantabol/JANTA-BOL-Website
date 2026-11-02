-- JANTA BOL / B13 T087 / 2026-11-02 — REVIEW ONLY, NEVER AUTO-APPLY TO LIVE.
-- PR #111: detected stale-session RLS self-role read; prospective minimum remediation.
-- External signed 2-account E2 and complete E5 remain DUE. This is NOT production authorization.
-- Run ONLY after isolated PG17 red/green and explicit separate release approval.
--
-- Read-only production catalog verified existing RLS policy names:
--   public.user_roles.users_can_read_own_role
--   public.user_roles.owner_admin_can_read_roles
--
-- Real issue under simulated revoked/nonexistent session:
--   - the own-role policy permits 1 own row via user_id=auth.uid() without session guard
--   - the admin-read policy permits admin role via private.current_app_role() without session guard
--   - Owner AAL2 branch already demands active session; preserve it.
--
-- Do NOT drop public.user_roles, change other policies, disable RLS, relax AAL2,
-- or re-grant additional table EXECUTE/SELECT privileges.
BEGIN;
SET LOCAL statement_timeout = '10s';
DO $preflight$
DECLARE
  v_self text;
  v_admin text;
BEGIN
  SELECT qual INTO v_self FROM pg_policies
  WHERE schemaname='public' AND tablename='user_roles'
    AND policyname='users_can_read_own_role' AND cmd='SELECT';
  SELECT qual INTO v_admin FROM pg_policies
  WHERE schemaname='public' AND tablename='user_roles'
    AND policyname='owner_admin_can_read_roles' AND cmd='SELECT';
  IF v_self IS NULL OR v_admin IS NULL THEN
    RAISE EXCEPTION 'T087_POLICY_PRECONDITION_MISSING_STOP';
  END IF;
  IF v_self NOT LIKE '%auth.uid%' OR v_admin NOT LIKE '%current_app_role%' OR
     v_admin NOT LIKE '%current_owner_aal2%' THEN
    RAISE EXCEPTION 'T087_POLICY_DRIFT_STOP_REVIEW_BEFORE_APPLY';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class
      WHERE oid='public.user_roles'::regclass AND relrowsecurity) THEN
    RAISE EXCEPTION 'T087_RLS_DISABLED_STOP';
  END IF;
END $preflight$;
-- Retain ownership check and require a live matching auth.sessions row.
ALTER POLICY users_can_read_own_role ON public.user_roles
  USING ((user_id = (SELECT auth.uid())) AND private.current_session_active());
-- Prevent a revoked active-team Admin from enumerating all roles.
-- Owner branch retains existing AAL2 + session guard.
ALTER POLICY owner_admin_can_read_roles ON public.user_roles
  USING (
    (private.current_app_role() = 'admin'::public.app_role AND private.current_session_active())
    OR private.current_owner_aal2()
  );
-- Verify both exact policies after mutation before committing if separately authorized.
DO $verify$
BEGIN
  IF NOT EXISTS(
    SELECT 1 FROM pg_policies WHERE schemaname='public'
      AND tablename='user_roles' AND policyname='users_can_read_own_role'
      AND qual LIKE '%current_session_active%'
  ) OR NOT EXISTS(
    SELECT 1 FROM pg_policies WHERE schemaname='public'
      AND tablename='user_roles' AND policyname='owner_admin_can_read_roles'
      AND qual LIKE '%current_session_active%'
  ) THEN RAISE EXCEPTION 'T087_NEW_POLICIES_NOT_VERIFIED'; END IF;
END $verify$;
COMMIT;
-- DO NOT EXECUTE THIS FILE IN PRODUCTION AS PART OF T087. Stored for review.
