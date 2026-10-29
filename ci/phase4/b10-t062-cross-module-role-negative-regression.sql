\set ON_ERROR_STOP on
-- B10 P4-T062, PG17 fixture AND MANDATORY T062 migration already applied.
-- Exercise actual SQL GRANT+RLS with synthetic Reporter, Editor, Owner and invalid principals.
-- No token forgery in production; changes in this file are rolled back.
BEGIN;
SET LOCAL statement_timeout='20s';
DO $policy_bound$
BEGIN
 IF (SELECT count(*) FROM pg_policies
 WHERE schemaname='public' AND tablename='article_versions'
 AND ((policyname='owner_read_versions' AND qual='private.current_owner_aal2()')
 OR (policyname='owner_insert_versions' AND with_check='private.current_owner_aal2()')))<>2
 THEN RAISE EXCEPTION 'T062_OWNER_AAL2_POLICIES_NOT_ACTIVE';END IF;
 IF (SELECT count(*) FROM public.article_versions)<>2 THEN
  RAISE EXCEPTION 'T062_PREEXISTING_HISTORY_CHANGED'; END IF;
END $policy_bound$;

-- Public user: no direct access and no ability to query history.
SET LOCAL ROLE anon;
DO $public_access$
DECLARE blocked boolean:=false;
BEGIN
 BEGIN PERFORM count(*) FROM public.article_versions;
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true; END;
 IF NOT blocked THEN RAISE EXCEPTION 'T062_PUBLIC_READ_HISTORY';END IF;
 IF has_table_privilege('anon','public.article_versions','INSERT') THEN
  RAISE EXCEPTION 'T062_PUBLIC_HISTORY_INSERT_GRANTED';END IF;
END $public_access$;
RESET ROLE;

-- Editor active, aal2: newsroom access does NOT grant Owner history access.
SELECT set_config('b9.test_uid','33333333-3333-3333-3333-333333333333',true),
set_config('b9.test_aal','aal2',true),set_config('b10.session_active','on',true);
SET LOCAL ROLE authenticated;
DO $editor$
DECLARE permitted boolean:=false;
BEGIN
 IF private.current_app_role() IS DISTINCT FROM 'editor'::public.app_role THEN
 RAISE EXCEPTION 'T062_FIXTURE_EDITOR_ROLE_NOT_AUTHENTIC';END IF;
 IF (SELECT count(*) FROM public.article_versions)<>0 THEN
 RAISE EXCEPTION 'T062_EDITOR_READS_HISTORY';END IF;
 BEGIN
 INSERT INTO public.article_versions VALUES('cccccccc-cccc-4ccc-8ccc-cccccccccccc',2,'{"bad":"editor-write"}');
 permitted:=true;
 EXCEPTION WHEN insufficient_privilege OR check_violation THEN NULL; END;
 IF permitted THEN RAISE EXCEPTION 'T062_EDITOR_INSERTED_OWNER_HISTORY';END IF;
END $editor$;
RESET ROLE;

-- Reporter active, aal2, own draft author or not: still no private Owner history.
UPDATE public.team_accounts SET status='active' WHERE user_id='22222222-2222-2222-2222-222222222222';
SELECT set_config('b9.test_uid','22222222-2222-2222-2222-222222222222',true),
set_config('b9.test_aal','aal2',true),set_config('b10.session_active','on',true);
SET LOCAL ROLE authenticated;
DO $reporter$
DECLARE permitted boolean:=false;
BEGIN
 IF private.current_app_role() IS DISTINCT FROM 'reporter'::public.app_role THEN
 RAISE EXCEPTION 'T062_FIXTURE_REPORTER_ROLE_NOT_AUTHENTIC';END IF;
 IF (SELECT count(*) FROM public.article_versions)<>0 THEN
  RAISE EXCEPTION 'T062_REPORTER_READS_OWNER_HISTORY'; END IF;
 BEGIN
 INSERT INTO public.article_versions VALUES('cccccccc-cccc-4ccc-8ccc-cccccccccccc',3,'{"bad":"reporter-write"}');
 permitted:=true;
 EXCEPTION WHEN insufficient_privilege OR check_violation THEN NULL;END;
 IF permitted THEN RAISE EXCEPTION 'T062_REPORTER_INSERTED_OWNER_HISTORY';END IF;
END $reporter$;
RESET ROLE;

-- External Advertiser: no newsroom role row, even if claims say Owner.
SELECT set_config('b9.test_uid','55555555-5555-4555-8555-555555555555',true),
set_config('b9.test_aal','aal2',true),set_config('b10.session_active','on',true),
set_config('request.jwt.claims','{"app_metadata":{"role":"owner"}}',true);
SET LOCAL ROLE authenticated;
DO $advertiser$
BEGIN
 IF private.current_app_role() IS NOT NULL OR private.current_owner_aal2() THEN
 RAISE EXCEPTION 'T062_ADVERTISER_OR_JWT_META_SELF_PROMOTED';END IF;
 IF (SELECT count(*) FROM public.article_versions)<>0 THEN
 RAISE EXCEPTION 'T062_ADVERTISER_HISTORY_EXPOSED';END IF;
END $advertiser$;
RESET ROLE;

-- Real owner role with aal1 OR inactive/revoked session: deny private history.
SELECT set_config('b9.test_uid','11111111-1111-1111-1111-111111111111',true),
set_config('b9.test_aal','aal1',true),set_config('b10.session_active','on',true);
SET LOCAL ROLE authenticated;
DO $owner_stale_aal$
BEGIN
 IF private.current_app_role() IS DISTINCT FROM 'owner'::public.app_role THEN
 RAISE EXCEPTION 'T062_OWNER_FIXTURE_WRONG';END IF;
 IF (SELECT count(*) FROM public.article_versions)<>0 THEN
 RAISE EXCEPTION 'T062_OWNER_AAL1_HISTORY_LEAK';END IF;
END $owner_stale_aal$;
RESET ROLE;
SELECT set_config('b9.test_aal','aal2',true),set_config('b10.session_active','off',true);
SET LOCAL ROLE authenticated;
DO $owner_revoked_session$
BEGIN
 IF (SELECT count(*) FROM public.article_versions)<>0 THEN
 RAISE EXCEPTION 'T062_REVOKED_OWNER_SESSION_HISTORY_LEAK';END IF;
END $owner_revoked_session$;
RESET ROLE;

-- Positive authorized owner AAL2+active session: readable and one insert succeeds.
SELECT set_config('b10.session_active','on',true);
SET LOCAL ROLE authenticated;
DO $owner_positive$
DECLARE got int;
BEGIN
 SELECT count(*) INTO got FROM public.article_versions;
 IF got<>2 THEN RAISE EXCEPTION 'T062_OWNER_AAL2_POSITIVE_READ_NOT_2_GOT_%',got; END IF;
 INSERT INTO public.article_versions VALUES('cccccccc-cccc-4ccc-8ccc-cccccccccccc',99,'{"ok":"authorized-owner"}');
 IF (SELECT count(*) FROM public.article_versions)<>3 THEN
 RAISE EXCEPTION 'T062_OWNER_AAL2_POSITIVE_INSERT_FAILED';END IF;
END $owner_positive$;
RESET ROLE;

-- Reporter leave invalidates role on next request; no client-local bypass.
UPDATE public.team_accounts SET status='departed' WHERE user_id='22222222-2222-2222-2222-222222222222';
SELECT set_config('b9.test_uid','22222222-2222-2222-2222-222222222222',true),
set_config('b9.test_aal','aal2',true),set_config('b10.session_active','on',true);
SET LOCAL ROLE authenticated;
DO $departed$
BEGIN
 IF private.current_app_role() IS NOT NULL THEN
 RAISE EXCEPTION 'T062_INACTIVE_TEAM_ROLE_STILL_ACTIVE';END IF;
 IF (SELECT count(*) FROM public.article_versions)<>0 THEN
 RAISE EXCEPTION 'T062_DEPARTED_REPORTER_HISTORY_LEAK';END IF;
END $departed$;
RESET ROLE;
ROLLBACK;
\echo 'T062 PASS (isolated PG17): anon, Editor, Reporter, Advertiser, stale Owner AAL1, revoked Owner session, departed Reporter denied; Owner active AAL2 positive; no persisted writes.'
