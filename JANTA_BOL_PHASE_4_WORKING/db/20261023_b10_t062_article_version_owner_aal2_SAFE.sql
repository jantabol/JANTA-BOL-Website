-- JANTA BOL B10 P4-T062 — tighten exactly two legacy Article-history RLS policies.
-- Source of truth: LIVE catalog, 2026-10-23. Never GRANT access; no Article/Version edits.
-- This is an additive security-only tightening: old owner role without an active
-- AAL2 Supabase session must NOT read or insert private Article-version snapshots.
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='25s';
DO $t062_preflight$
BEGIN
 IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.article_versions'::regclass)
 THEN RAISE EXCEPTION 'T062_HISTORY_RLS_NOT_ENABLED'; END IF;
 IF (SELECT count(*) FROM pg_policies
  WHERE schemaname='public' AND tablename='article_versions'
    AND policyname IN ('owner_read_versions','owner_insert_versions'))<>2
 THEN RAISE EXCEPTION 'T062_EXPECTED_OLD_POLICIES_NOT_PRESENT';END IF;
 IF (SELECT count(*) FROM pg_policies
    WHERE schemaname='public' AND tablename='article_versions'
      AND ((policyname='owner_read_versions' AND cmd='SELECT' AND roles=ARRAY['authenticated']::name[] AND qual='(private.current_app_role() = ''owner''::app_role)')
        OR (policyname='owner_insert_versions' AND cmd='INSERT' AND roles=ARRAY['authenticated']::name[] AND with_check='(private.current_app_role() = ''owner''::app_role)'))
   )<>2 THEN
    RAISE EXCEPTION 'T062_OLD_POLICY_CHANGED_ABORT_NO_REPLACEMENT';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid='private.current_owner_aal2()'::regprocedure AND prosecdef) THEN
    RAISE EXCEPTION 'T062_OWNER_AAL2_GUARD_MISSING';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_trigger t JOIN pg_proc p ON t.tgfoid=p.oid
   WHERE t.tgrelid='public.articles'::regclass AND t.tgname='trg_capture_article_history' AND p.prosecdef)
 THEN RAISE EXCEPTION 'T062_PRIVILEGED_HISTORY_CAPTURE_MISSING';END IF;
END $t062_preflight$;

ALTER POLICY owner_read_versions ON public.article_versions
  USING (private.current_owner_aal2());
ALTER POLICY owner_insert_versions ON public.article_versions
  WITH CHECK (private.current_owner_aal2());

DO $t062_post$
BEGIN
 IF (SELECT count(*) FROM pg_policies WHERE schemaname='public'
     AND tablename='article_versions'
     AND ((policyname='owner_read_versions' AND qual='private.current_owner_aal2()')
       OR (policyname='owner_insert_versions' AND with_check='private.current_owner_aal2()')))<>2
 THEN RAISE EXCEPTION 'T062_FAIL_CLOSED_POST_POLICY_INVALID'; END IF;
 IF has_table_privilege('anon','public.article_versions','SELECT')
 THEN RAISE EXCEPTION 'T062_ANON_VERSION_GRANT_INTRODUCED'; END IF;
END $t062_post$;
COMMIT;
