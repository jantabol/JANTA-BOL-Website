\set ON_ERROR_STOP on
-- T065 isolated PG17 - reproduce LIVE stale-JWT editor write boundary, never LIVE.
-- Input: T062 fixed Article SELECT + T063 auth.sessions fixture. No production tokens.
GRANT INSERT,UPDATE ON public.articles TO authenticated;
CREATE POLICY staff_can_create_articles ON public.articles FOR INSERT TO authenticated
 WITH CHECK (
   private.current_app_role()=ANY(ARRAY['owner'::public.app_role,'admin'::public.app_role,'editor'::public.app_role,'reporter'::public.app_role])
   AND (created_by IS NULL OR created_by=auth.uid())
   AND (private.current_app_role()<>'owner'::public.app_role OR private.current_owner_aal2()));
CREATE POLICY editorial_staff_can_update_articles ON public.articles FOR UPDATE TO authenticated
 USING (
   private.current_app_role()=ANY(ARRAY['owner'::public.app_role,'admin'::public.app_role,'editor'::public.app_role])
   AND (private.current_app_role()<>'owner'::public.app_role OR private.current_owner_aal2()))
 WITH CHECK (
   private.current_app_role()=ANY(ARRAY['owner'::public.app_role,'admin'::public.app_role,'editor'::public.app_role])
   AND (private.current_app_role()<>'owner'::public.app_role OR private.current_owner_aal2()));
CREATE POLICY reporter_can_update_own_drafts ON public.articles FOR UPDATE TO authenticated
 USING (private.current_app_role()='reporter'::public.app_role
        AND created_by=auth.uid() AND status='draft'::public.article_status)
 WITH CHECK (private.current_app_role()='reporter'::public.app_role
        AND created_by=auth.uid() AND status='draft'::public.article_status);
BEGIN;
SET LOCAL statement_timeout='20s';
SELECT set_config('b9.test_uid','33333333-3333-3333-3333-333333333333',true),
       set_config('b9.test_aal','aal1',true),
       set_config('request.jwt.claims','{"session_id":"90000000-0000-4000-8000-000000000065","aal":"aal1"}',true);
SET LOCAL ROLE authenticated;
DO $red$
DECLARE touched int;
BEGIN
 IF private.current_app_role() IS DISTINCT FROM 'editor'::public.app_role OR private.current_session_active()
 THEN RAISE EXCEPTION 'T065_RED_EDITOR_ACTOR_FIXTURE_INVALID';END IF;
 UPDATE public.articles SET excerpt='T065_ROLLBACK_ONLY_PROOF' WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 GET DIAGNOSTICS touched=ROW_COUNT;
 IF touched<>1 THEN RAISE EXCEPTION 'T065_ORIGINAL_STALE_EDITOR_WRITE_GAP_NOT_REPRODUCED';END IF;
 INSERT INTO public.articles(id,slug,status,title,body,created_by)
 VALUES('99990000-0000-4000-8000-000000000065','t065-old-stale-editor','draft','T065 Disposable','T065',auth.uid());
END $red$;
ROLLBACK;
\echo 'T065 RED verified on disposable PG17: stale editor JWT could UPDATE public content and INSERT a draft; transaction ROLLBACK.'
