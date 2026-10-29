-- JANTA BOL / P4-T065 - REVIEW ONLY until isolated PG17 + explicit production release decision.
-- ACTUAL LIVE read-only probe: active Editor with forged/unmatched backend session is
-- role='editor', session_active=false, yet legacy editorial_staff_can_update_articles
-- USING evaluates TRUE for 16 published articles and direct UPDATE grant is present.
-- Scope: ONLY THREE existing Article INSERT/UPDATE policies, no grants, schema/data,
-- DELETE/SELECT policy, sessions, Founder recovery, public URLs or Cricket touched.
BEGIN;
SET LOCAL lock_timeout='4s';
SET LOCAL statement_timeout='30s';
DO $t065_pre$
BEGIN
 IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.articles'::regclass)
 THEN RAISE EXCEPTION 'T065_ARTICLES_RLS_MUST_REMAIN_ENABLED';END IF;
 IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='articles'
      AND ((policyname='staff_can_create_articles' AND cmd='INSERT')
        OR (policyname IN ('editorial_staff_can_update_articles','reporter_can_update_own_drafts') AND cmd='UPDATE'))
      AND roles=ARRAY['authenticated']::name[])<>3
 THEN RAISE EXCEPTION 'T065_ORIGINAL_3_MUTATION_POLICIES_MISSING';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc p
   WHERE p.oid='private.current_session_active()'::regprocedure AND p.prosecdef)
 THEN RAISE EXCEPTION 'T065_BACKEND_SESSION_GUARD_UNAVAILABLE';END IF;
END $t065_pre$;

-- Preserve ALL original positive role, ownership, AAL2 guards; only add backend session.
ALTER POLICY staff_can_create_articles ON public.articles
 WITH CHECK (
  private.current_session_active()
  AND private.current_app_role()=ANY(ARRAY[
   'owner'::public.app_role,'admin'::public.app_role,
   'editor'::public.app_role,'reporter'::public.app_role])
  AND (created_by IS NULL OR created_by=auth.uid())
  AND (private.current_app_role()<>'owner'::public.app_role OR private.current_owner_aal2())
 );

ALTER POLICY editorial_staff_can_update_articles ON public.articles
 USING (
  private.current_session_active()
  AND private.current_app_role()=ANY(ARRAY[
   'owner'::public.app_role,'admin'::public.app_role,'editor'::public.app_role])
  AND (private.current_app_role()<>'owner'::public.app_role OR private.current_owner_aal2())
 )
 WITH CHECK (
  private.current_session_active()
  AND private.current_app_role()=ANY(ARRAY[
   'owner'::public.app_role,'admin'::public.app_role,'editor'::public.app_role])
  AND (private.current_app_role()<>'owner'::public.app_role OR private.current_owner_aal2())
 );

ALTER POLICY reporter_can_update_own_drafts ON public.articles
 USING (
  private.current_session_active()
  AND private.current_app_role()='reporter'::public.app_role
  AND created_by=auth.uid()
  AND status='draft'::public.article_status
 )
 WITH CHECK (
  private.current_session_active()
  AND private.current_app_role()='reporter'::public.app_role
  AND created_by=auth.uid()
  AND status='draft'::public.article_status
 );
DO $t065_post$
BEGIN
 IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='articles'
   AND policyname IN ('staff_can_create_articles','editorial_staff_can_update_articles','reporter_can_update_own_drafts')
   AND ((cmd='INSERT' AND with_check LIKE '%current_session_active()%')
     OR (cmd='UPDATE' AND qual LIKE '%current_session_active()%' AND with_check LIKE '%current_session_active()%')))<>3
 THEN RAISE EXCEPTION 'T065_MUTATION_GUARDS_NOT_APPLIED';END IF;
END $t065_post$;
COMMIT;
