-- EMERGENCY ROLLBACK SCRIPT — REVIEW ONLY. Do not run automatically.
-- Restores the EXACT original public_live_updates_read predicate observed LIVE 2026-10-23.
-- Note: original predicate causes anon SELECT SQLSTATE 42501; rollback only for severe regression.
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='25s';
ALTER POLICY public_live_updates_read ON public.public_live_updates
 USING (
  EXISTS(
   SELECT 1
   FROM public.live_sessions AS s
   JOIN public.articles AS a ON a.id=s.article_id
   WHERE s.id=public_live_updates.session_id
     AND a.status='published'::public.article_status
     AND s.live_updates_public_visible IS TRUE
     AND (s.public_status IN('LIVE','INTERRUPTED') OR s.session_status='ENDED')
  )
 );
DROP FUNCTION IF EXISTS public.jb_b10_live_update_public_eligible(uuid,uuid);
COMMIT;
