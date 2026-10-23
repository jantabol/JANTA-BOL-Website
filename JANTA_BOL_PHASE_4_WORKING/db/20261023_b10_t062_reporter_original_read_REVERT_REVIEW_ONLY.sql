-- REVIEW ONLY: original Article SELECT policy restore (do not run automatically).
-- Restoring this original policy RE-EXPOSES other authors' nonpublic drafts to Reporters.
-- Use only if a proven deployment regression requires controlled emergency rollback.
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='25s';
DROP POLICY IF EXISTS b10_authenticated_read_published_articles ON public.articles;
DROP POLICY IF EXISTS b10_reporter_read_own_articles ON public.articles;
ALTER POLICY staff_can_read_all_articles ON public.articles USING (
 (private.current_app_role() = ANY(
  ARRAY['owner'::public.app_role,'admin'::public.app_role,
        'editor'::public.app_role,'reporter'::public.app_role]))
 AND (private.current_app_role()<>'owner'::public.app_role OR private.current_owner_aal2())
);
COMMIT;
