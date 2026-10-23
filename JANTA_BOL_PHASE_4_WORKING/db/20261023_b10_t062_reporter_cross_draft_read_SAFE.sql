-- B10 P4-T062 — least privilege Reporter/Staff Article SELECT, cross-role gap.
-- LIVE preflight 2026-10-23: active Reporter read all 32 articles,
-- including all 16 nonpublic Article records authored by others.
-- Founder-only preview + immutable published URL preserved. Scope: Article SELECT policies ONLY.
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='25s';
DO $pre$
BEGIN
 IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.articles'::regclass)
 THEN RAISE EXCEPTION 'T062_ARTICLE_RLS_REQUIRED';END IF;
 IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='articles'
     AND policyname='staff_can_read_all_articles' AND cmd='SELECT'
     AND roles=ARRAY['authenticated']::name[]
     AND qual LIKE '%reporter%')<>1
 THEN RAISE EXCEPTION 'T062_EXPECTED_ORIGINAL_REPORTER_GLOBAL_READ_MISSING';END IF;
 IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='articles'
    AND policyname IN ('b10_reporter_read_own_articles','b10_authenticated_read_published_articles'))
 THEN RAISE EXCEPTION 'T062_B10_NEW_POLICIES_ALREADY_EXIST';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc p WHERE p.oid='private.current_session_active()'::regprocedure AND p.prosecdef)
 THEN RAISE EXCEPTION 'T062_SESSION_GUARD_MISSING';END IF;
END;
$pre$;

-- Existing Owner stays Founder AAL2 only. Admin/Editor can read newsroom
-- private material ONLY with a current backend session. Reporter removed here.
ALTER POLICY staff_can_read_all_articles ON public.articles
 USING (
    ((private.current_app_role() = ANY (
       ARRAY['owner'::public.app_role,'admin'::public.app_role,'editor'::public.app_role]
     )))
    AND (
      (private.current_app_role() = 'owner'::public.app_role AND private.current_owner_aal2())
      OR
      (private.current_app_role() IN ('admin'::public.app_role,'editor'::public.app_role)
       AND private.current_session_active())
    )
 );

-- Logged-in users also see genuinely public published articles, preserving
-- public news and reporter browsing without revealing drafts or soft-deleted rows.
CREATE POLICY b10_authenticated_read_published_articles ON public.articles
 FOR SELECT TO authenticated
 USING(status='published'::public.article_status AND deleted_at IS NULL);

-- Reporter needs own drafts/reviews for editing; not another reporter/Owner's drafts.
CREATE POLICY b10_reporter_read_own_articles ON public.articles
 FOR SELECT TO authenticated
 USING(
 private.current_app_role()='reporter'::public.app_role
 AND private.current_session_active()
 AND created_by=auth.uid()
 AND deleted_at IS NULL
 AND status IN ('draft'::public.article_status,'review'::public.article_status,
                'published'::public.article_status,'unpublished'::public.article_status)
 );

DO $post$
BEGIN
 IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='articles'
 AND policyname IN('staff_can_read_all_articles','b10_authenticated_read_published_articles','b10_reporter_read_own_articles'))<>3
 THEN RAISE EXCEPTION 'T062_POST_EXPECTED_3_POLICIES_MISSING';END IF;
 IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='articles'
 AND policyname='staff_can_read_all_articles' AND qual LIKE '%reporter%')<>0
 THEN RAISE EXCEPTION 'T062_REPORTER_STILL_GLOBAL_READER';END IF;
 IF has_table_privilege('anon','public.articles','UPDATE')
 THEN RAISE EXCEPTION 'T062_PUBLIC_PUBLISH_GRANT_UNEXPECTED'; END IF;
END $post$;
COMMIT;
