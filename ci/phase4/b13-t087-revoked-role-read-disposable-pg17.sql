\set ON_ERROR_STOP on
-- B13 T087 test-only; original old B10 PG17 fixtures must have run first.
-- Never run against Supabase production; synthetic actors and rollback only.
-- Original observed LIVE policy behavior is reproduced RED, then an isolated
-- hardened policy is verified GREEN, without altering the actual database.
BEGIN;
SET LOCAL statement_timeout = '12s';
DO $prereqs$
BEGIN
  IF to_regclass('public.user_roles') IS NULL OR
     to_regclass('auth.sessions') IS NULL OR
     to_regclass('public.team_accounts') IS NULL THEN
    RAISE EXCEPTION 'T087_ISOLATED_FIXTURE_DEPENDENCY_MISSING';
  END IF;
END $prereqs$;
INSERT INTO public.user_roles(user_id,role)
VALUES('44444444-4444-4444-8444-444444444487','admin');
INSERT INTO public.team_accounts(user_id,assigned_role,status)
VALUES('44444444-4444-4444-8444-444444444487','admin','active');
INSERT INTO auth.sessions(id,user_id)
VALUES('44444444-4444-4444-8444-444444444488','44444444-4444-4444-8444-444444444487');
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_roles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
DROP POLICY IF EXISTS users_can_read_own_role ON public.user_roles;
DROP POLICY IF EXISTS owner_admin_can_read_roles ON public.user_roles;
-- Exact policy meanings observed read-only in production on 2026-11-02.
CREATE POLICY users_can_read_own_role ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY owner_admin_can_read_roles ON public.user_roles FOR SELECT TO authenticated
  USING ((private.current_app_role()='admin'::public.app_role)
         OR private.current_owner_aal2());
-- Old policy RED: nonexistent backend session still permits own-role read.
SELECT set_config('b9.test_uid','11111111-1111-1111-1111-111111111111',true),
       set_config('b9.test_aal','aal1',true),
       set_config('b10.session_active','off',true),
       set_config('request.jwt.claims','{"sub":"11111111-1111-1111-1111-111111111111","session_id":"90000000-0000-4000-8000-000000000087","aal":"aal1"}',true);
SET LOCAL ROLE authenticated;
DO $red_owner$
BEGIN
  IF private.current_session_active() THEN
    RAISE EXCEPTION 'T087_RED_OWNER_SESSION_SHOULD_BE_REVOKED';
  END IF;
  IF (SELECT count(*) FROM public.user_roles)<>1 THEN
    RAISE EXCEPTION 'T087_RED_STALE_SELF_ROLE_GAP_NOT_REPRODUCED count=% uid=% session=% aal2=% dbrole=%', (SELECT count(*) FROM public.user_roles), auth.uid(), private.current_session_active(), private.current_owner_aal2(), current_user;
  END IF;
END $red_owner$;
RESET ROLE;
-- Old policy RED: a revoked Admin still enumerates all user roles.
SELECT set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444487","session_id":"90000000-0000-4000-8000-000000000087","aal":"aal1"}',true);
SET LOCAL ROLE authenticated;
DO $red_admin$
BEGIN
  IF private.current_session_active() THEN
    RAISE EXCEPTION 'T087_RED_ADMIN_SESSION_SHOULD_BE_REVOKED';
  END IF;
  IF (SELECT count(*) FROM public.user_roles)<4 THEN
    RAISE EXCEPTION 'T087_RED_STALE_ADMIN_ENUMERATION_GAP_NOT_REPRODUCED';
  END IF;
END $red_admin$;
RESET ROLE;
-- Proposed candidate: guards on BOTH SELECT policies. No new grants.
ALTER POLICY users_can_read_own_role ON public.user_roles
  USING ((user_id = (SELECT auth.uid())) AND private.current_session_active());
ALTER POLICY owner_admin_can_read_roles ON public.user_roles
  USING (
     (private.current_app_role()='admin'::public.app_role AND private.current_session_active())
     OR private.current_owner_aal2()
  );
-- Proposed candidate GREEN: stale Admin cannot enumerate even own role.
SET LOCAL ROLE authenticated;
DO $green_admin_revoked$
BEGIN
  IF (SELECT count(*) FROM public.user_roles)<>0 THEN
    RAISE EXCEPTION 'T087_GREEN_REVOKED_ADMIN_ROLE_LEAK';
  END IF;
END $green_admin_revoked$;
RESET ROLE;
-- Proposed candidate GREEN: stale Owner cannot see own role.
SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-1111-1111-111111111111","session_id":"90000000-0000-4000-8000-000000000087","aal":"aal1"}',true);
SET LOCAL ROLE authenticated;
DO $green_owner_revoked$
BEGIN
  IF (SELECT count(*) FROM public.user_roles)<>0 THEN
    RAISE EXCEPTION 'T087_GREEN_REVOKED_OWNER_ROLE_LEAK';
  END IF;
END $green_owner_revoked$;
RESET ROLE;
-- Positive control: active Owner AAL1 can still read their own role to
-- bootstrap Login/MFA, but cannot enumerate other users.
SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-1111-1111-111111111111","session_id":"10000000-0000-4000-8000-000000000063","aal":"aal1"}',true);
SET LOCAL ROLE authenticated;
DO $green_owner_active$
BEGIN
  IF NOT private.current_session_active() OR (SELECT count(*) FROM public.user_roles)<>1 THEN
    RAISE EXCEPTION 'T087_GREEN_ACTIVE_OWNER_SELF_ROLE_BOOTSTRAP_BROKEN';
  END IF;
END $green_owner_active$;
RESET ROLE;
-- Positive control: active Admin may list role accounts as originally intended.
SELECT set_config('b9.test_uid','44444444-4444-4444-8444-444444444487',true),
       set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444487","session_id":"44444444-4444-4444-8444-444444444488","aal":"aal1"}',true);
SET LOCAL ROLE authenticated;
DO $green_admin_active$
BEGIN
  IF NOT private.current_session_active() OR (SELECT count(*) FROM public.user_roles)<4 THEN
    RAISE EXCEPTION 'T087_GREEN_ACTIVE_ADMIN_LEGITIMATE_ROLE_ACCESS_BROKEN';
  END IF;
END $green_admin_active$;
RESET ROLE;
ROLLBACK;
\echo 'T087_DISPOSABLE_PG17_REVOKED_OWNER_AND_ADMIN_RED_GREEN=PASS_SCOPED'
\echo 'T087_PRODUCTION_POLICY_CHANGED=NO'
\echo 'T087_REAL_SIGNED_HOSTED_HTTP_TEST=NOT_RUN'
