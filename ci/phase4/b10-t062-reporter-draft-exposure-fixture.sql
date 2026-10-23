\set ON_ERROR_STOP on
-- Disposable PostgreSQL17: AFTER B9 base fixture, T062 Owner History fixture/migration/regression.
-- Reproduce real LIVE flaw: authenticated Reporter can read others' 16 private Articles.
-- Fixture uses three Published, one own Draft, two other nonpublic.
ALTER TABLE public.articles ADD COLUMN created_by uuid;
-- Existing LIVE JANTA BOL grants authenticated SELECT, but early B9 tiny fixture only grants anon.
GRANT SELECT ON public.articles TO authenticated;
UPDATE public.articles SET created_by=CASE
 WHEN id='dddddddd-dddd-4ddd-8ddd-dddddddddddd' THEN '22222222-2222-2222-2222-222222222222'::uuid
 WHEN id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' THEN '11111111-1111-1111-1111-111111111111'::uuid
 WHEN id='ffffffff-ffff-4fff-8fff-ffffffffffff' THEN '33333333-3333-3333-3333-333333333333'::uuid
 ELSE NULL END;
CREATE OR REPLACE FUNCTION private.current_session_active() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$ SELECT current_setting('b10.session_active',true)='on' $$;
CREATE POLICY staff_can_read_all_articles ON public.articles FOR SELECT TO authenticated
USING ((private.current_app_role()=ANY(ARRAY[
'owner'::public.app_role,'admin'::public.app_role,
'editor'::public.app_role,'reporter'::public.app_role]))
 AND (private.current_app_role()<>'owner'::public.app_role
   OR private.current_owner_aal2()));
-- Baseline: role-only staff policy is too wide for Reporter.
BEGIN;
UPDATE public.team_accounts SET status='active'
 WHERE user_id='22222222-2222-2222-2222-222222222222';
SELECT set_config('b9.test_uid','22222222-2222-2222-2222-222222222222',true),
set_config('b9.test_aal','aal1',true),set_config('b10.session_active','on',true);
SET LOCAL ROLE authenticated;
DO $vulnerability$
BEGIN
 IF private.current_app_role()<>'reporter'::public.app_role
 THEN RAISE EXCEPTION 'T062_TEST_REPORTER_NOT_ACTIVE';END IF;
 IF (SELECT count(*) FROM public.articles)<>6
 THEN RAISE EXCEPTION 'T062_ORIGINAL_REPORTER_READ_GAP_NOT_REPRODUCED';END IF;
 IF (SELECT count(*) FROM public.articles
   WHERE status <> 'published' AND created_by IS DISTINCT FROM auth.uid())<>2
 THEN RAISE EXCEPTION 'T062_REAL_CLASS_OF_OTHER_DRAFT_PRIVACY_GAP_NOT_REPRODUCED';END IF;
END $vulnerability$;
ROLLBACK;
\echo 'T062 BEFORE FIX: active Reporter read 2 other-user unpublished/deleted records on disposable PG17.'
