-- JANTA BOL P4-T090 — REVIEW_ONLY CANDIDATE (NOT APPLIED TO PRODUCTION)
-- 2026-11-03. P2 read-only finding: stale/missing session JWT claims can
-- expose "own role" through users_can_read_own_role even though Owner AAL2
-- and other sensitive records are correctly blocked. Admin all-role SELECT
-- branch similarly lacks a session guard when an active admin exists.
-- No policy/RLS change is authorized on the production database here.
-- This file is rehearsed ONLY in a disposable PostgreSQL 17 CI fixture.
--
-- Exact current policies checked via Supabase pg_policies before authoring:
-- users_can_read_own_role: user_id = (SELECT auth.uid())
-- owner_admin_can_read_roles:
--   (private.current_app_role() = 'admin'::app_role)
--   OR private.current_owner_aal2()
--
-- Proposed minimal correction: add the existing trusted backend
-- private.current_session_active() check only to those two SELECT policies.
-- Do NOT change MFA-required manage-roles (ALL) policy, GRANTs, App roles,
-- table data, passwords, Auth sessions, Edge Functions or News data.
-- For authenticated real-browser users, active matching auth.sessions
-- must remain functional. Invalid session should now have zero role rows.
--
-- APPLY ONLY via separately reviewed/approved production migration and
-- explicit regression evidence; do not execute this file against production
-- as part of normal audit/CI.

ALTER POLICY users_can_read_own_role ON public.user_roles
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND (SELECT private.current_session_active())
  );

ALTER POLICY owner_admin_can_read_roles ON public.user_roles
  TO authenticated
  USING (
    (
      private.current_app_role() = 'admin'::public.app_role
      OR private.current_owner_aal2()
    )
    AND (SELECT private.current_session_active())
  );

-- Emergency rollback (review only; NOT run automatically):
-- ALTER POLICY users_can_read_own_role ON public.user_roles
--   TO authenticated USING (user_id = (SELECT auth.uid()));
-- ALTER POLICY owner_admin_can_read_roles ON public.user_roles
--   TO authenticated USING (
--     private.current_app_role() = 'admin'::public.app_role
--     OR private.current_owner_aal2()
--   );
