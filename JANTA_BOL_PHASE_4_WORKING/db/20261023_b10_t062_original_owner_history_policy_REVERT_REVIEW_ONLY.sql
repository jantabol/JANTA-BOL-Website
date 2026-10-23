-- REVIEW ONLY / EMERGENCY REVERT, not automatic; restore PRE-T062 history policies
-- This reintroduces original insufficient Owner-only (no session/AAL2) gate; use
-- ONLY if a proven production regression requires urgent original-policy restore.
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='25s';
ALTER POLICY owner_read_versions ON public.article_versions
 USING(private.current_app_role()='owner'::public.app_role);
ALTER POLICY owner_insert_versions ON public.article_versions
 WITH CHECK(private.current_app_role()='owner'::public.app_role);
COMMIT;
