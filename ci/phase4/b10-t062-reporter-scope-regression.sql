\set ON_ERROR_STOP on
-- RUN-09 T062: real SQL RLS roles on isolated PG17, all actor edits rolled back.
BEGIN;
SET LOCAL statement_timeout='20s';
DO $guards$
BEGIN
 IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='articles'
 AND policyname IN('staff_can_read_all_articles','b10_authenticated_read_published_articles','b10_reporter_read_own_articles'))<>3
 THEN RAISE EXCEPTION 'T062_ARTICLE_READ_POLICY_SET_MISSING';END IF;
 IF (SELECT count(*) FROM public.articles)<>6 THEN RAISE EXCEPTION 'T062_BASE_ARTICLES_CHANGED';END IF;
END $guards$;

-- Public visitors see exactly three public news stories, no private material.
SET LOCAL ROLE anon;
DO $public$
BEGIN
 IF (SELECT count(*) FROM public.articles)<>3 THEN
  RAISE EXCEPTION 'T062_ANON_PUBLIC_NEWS_REGRESSED';END IF;
 IF EXISTS(SELECT 1 FROM public.articles WHERE status<>'published')
 THEN RAISE EXCEPTION 'T062_ANON_PRIVATE_LEAK';END IF;
END $public$;
RESET ROLE;

-- Anonymous-credential App signed-in without a session: public news only.
SET LOCAL ROLE authenticated;
DO $loggedout$
BEGIN
 IF (SELECT count(*) FROM public.articles)<>3 THEN
  RAISE EXCEPTION 'T062_LOGGED_OUT_AUTH_NONPUBLIC_READ';END IF;
END $loggedout$;
RESET ROLE;

-- Reporter active: own draft + three published public, no other people's hidden.
UPDATE public.team_accounts SET status='active'
 WHERE user_id='22222222-2222-2222-2222-222222222222';
SELECT set_config('b9.test_uid','22222222-2222-2222-2222-222222222222',true),
set_config('b9.test_aal','aal1',true),
set_config('b10.session_active','on',true);
SET LOCAL ROLE authenticated;
DO $reporter$
BEGIN
 IF private.current_app_role() IS DISTINCT FROM 'reporter'::public.app_role
 THEN RAISE EXCEPTION 'T062_REPORTER_ROLE_MISSING';END IF;
 IF (SELECT count(*) FROM public.articles)<>4 THEN
  RAISE EXCEPTION 'T062_REPORTER_SHOULD_SEE_3_PUBLIC_PLUS_1_OWN_DRAFT';END IF;
 IF (SELECT count(*) FROM public.articles WHERE status<>'published' AND created_by=auth.uid())<>1
 THEN RAISE EXCEPTION 'T062_REPORTER_OWN_DRAFT_BLOCKED';END IF;
 IF EXISTS(SELECT 1 FROM public.articles WHERE status<>'published'
     AND created_by IS DISTINCT FROM auth.uid())
 THEN RAISE EXCEPTION 'T062_REPORTER_OTHER_AUTHOR_DRAFT_STILL_READABLE';END IF;
END $reporter$;
RESET ROLE;

-- Reporter has no active backend session: even own draft becomes invisible.
SELECT set_config('b10.session_active','off',true);
SET LOCAL ROLE authenticated;
DO $stale_reporter$
BEGIN
 IF (SELECT count(*) FROM public.articles)<>3 THEN
 RAISE EXCEPTION 'T062_REPORTER_SESSION_REVOCATION_NOT_REFLECTED';END IF;
END $stale_reporter$;
RESET ROLE;

-- Editor active (staff) can read the six articles as before.
SELECT set_config('b9.test_uid','33333333-3333-3333-3333-333333333333',true),
set_config('b10.session_active','on',true);
SET LOCAL ROLE authenticated;
DO $editor$
BEGIN
 IF private.current_app_role()<>'editor'::public.app_role
 THEN RAISE EXCEPTION 'T062_EDITOR_ACTIVE_ROLE_MISSING';END IF;
 IF (SELECT count(*) FROM public.articles)<>6 THEN
 RAISE EXCEPTION 'T062_EDITOR_ARTICLE_READ_REGRESSED';END IF;
END $editor$;
RESET ROLE;

-- Synthetic active Admin/Team actor: newsroom read as before, no Owner history.
INSERT INTO public.user_roles(user_id,role)
 VALUES('44444444-4444-4444-8444-444444444444','admin'::public.app_role);
INSERT INTO public.team_accounts(user_id,reporter_id,assigned_role,status)
 VALUES('44444444-4444-4444-8444-444444444444',NULL,'admin'::public.app_role,'active');
SELECT set_config('b9.test_uid','44444444-4444-4444-8444-444444444444',true),
set_config('b9.test_aal','aal2',true),set_config('b10.session_active','on',true);
SET LOCAL ROLE authenticated;
DO $admin$
BEGIN
 IF private.current_app_role()<>'admin'::public.app_role
 THEN RAISE EXCEPTION 'T062_ACTIVE_ADMIN_CONTEXT_MISSING';END IF;
 IF (SELECT count(*) FROM public.articles)<>6
 THEN RAISE EXCEPTION 'T062_ACTIVE_ADMIN_EDITORIAL_READ_REGRESSED';END IF;
 IF (SELECT count(*) FROM public.article_versions)<>0
 THEN RAISE EXCEPTION 'T062_ADMIN_SELF_PROMOTED_TO_OWNER_HISTORY';END IF;
 IF private.current_owner_aal2()
 THEN RAISE EXCEPTION 'T062_ADMIN_HAS_OWNER_AAL2';END IF;
END $admin$;
RESET ROLE;

-- Editor inactive session cannot keep reading nonpublic.
SELECT set_config('b9.test_uid','33333333-3333-3333-3333-333333333333',true),
set_config('b10.session_active','off',true);
SET LOCAL ROLE authenticated;
DO $editor_off$
BEGIN
 IF (SELECT count(*) FROM public.articles)<>3 THEN
 RAISE EXCEPTION 'T062_EDITOR_NO_SESSION_PRIVATE_READ';END IF;
END $editor_off$;
RESET ROLE;

-- Owner AAL1 read public only; real AAL2 active keeps whole newsroom.
SELECT set_config('b9.test_uid','11111111-1111-1111-1111-111111111111',true),
set_config('b9.test_aal','aal1',true),
set_config('b10.session_active','on',true);
SET LOCAL ROLE authenticated;
DO $owner_aal1$
BEGIN
 IF (SELECT count(*) FROM public.articles)<>3 THEN
 RAISE EXCEPTION 'T062_OWNER_AAL1_PRIVATE_READ';END IF;
END $owner_aal1$;
RESET ROLE;
SELECT set_config('b9.test_aal','aal2',true);
SET LOCAL ROLE authenticated;
DO $owner_aal2$
BEGIN
 IF (SELECT count(*) FROM public.articles)<>6 THEN
 RAISE EXCEPTION 'T062_OWNER_AAL2_PRIVATE_READ_REGRESSED';END IF;
END $owner_aal2$;
RESET ROLE;

-- An advertiser with a fabricated JWT "role": "owner" remains public only.
SELECT set_config('b9.test_uid','55555555-5555-4555-8555-555555555555',true),
set_config('b9.test_aal','aal2',true),
set_config('request.jwt.claims','{"app_metadata":{"role":"owner"}}',true);
SET LOCAL ROLE authenticated;
DO $advertiser$
BEGIN
 IF private.current_app_role() IS NOT NULL THEN
 RAISE EXCEPTION 'T062_ADVERTISER_SELF_PROMOTION';END IF;
 IF (SELECT count(*) FROM public.articles)<>3 THEN
 RAISE EXCEPTION 'T062_ADVERTISER_PRIVATE_STORY_EXPOSURE';END IF;
END $advertiser$;
RESET ROLE;

-- Inactive/departed reporter sees only public and cannot self-promote.
UPDATE public.team_accounts SET status='departed'
 WHERE user_id='22222222-2222-2222-2222-222222222222';
SELECT set_config('b9.test_uid','22222222-2222-2222-2222-222222222222',true),
set_config('b10.session_active','on',true);
SET LOCAL ROLE authenticated;
DO $departed$
BEGIN
 IF private.current_app_role() IS NOT NULL THEN
 RAISE EXCEPTION 'T062_DEPARTED_REPORTER_ACTIVE';END IF;
 IF (SELECT count(*) FROM public.articles)<>3 THEN
 RAISE EXCEPTION 'T062_DEPARTED_REPORTER_PRIVATE_READ';END IF;
END $departed$;
RESET ROLE;
ROLLBACK;
\echo 'T062 PASS: 3 public, own Reporter draft, Editor active, Owner AAL2, revocation, advertiser spoof, legacy compatibility on rollback-only PG17.'
