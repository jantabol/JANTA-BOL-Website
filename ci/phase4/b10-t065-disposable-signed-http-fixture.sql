\set ON_ERROR_STOP on
-- P4-T064/T065 zero-cost ISOLATED GitHub Actions PostgreSQL17 + PostgREST wire test.
-- Executed ONLY on throwaway PG17 AFTER all existing B10 policy regressions.
-- NEVER execute on live Supabase: isolated fixtures only, no real IDs/keys/tokens.
DO $isolated$
BEGIN
 IF current_database() <> 'jb_b10_disposable' THEN
  RAISE EXCEPTION 'P4_T065_WIRE_RUNS_ONLY_IN_JB_B10_DISPOSABLE';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') OR
    NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated')
 THEN RAISE EXCEPTION 'T065_WIRE_ROLE_FIXTURE_ABSENT'; END IF;
END $isolated$;
CREATE ROLE jb_t065_wire_authenticator LOGIN NOINHERIT PASSWORD 'JB_T065_ISOLATED_WIRE_ONLY_NO_REAL_ACCOUNT';
GRANT anon,authenticated TO jb_t065_wire_authenticator;

-- Only the dummy database, only after earlier SQL regression has finished:
-- bridge real, cryptographically verified PostgREST JWT sub to fixture auth.uid().
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
 LANGUAGE sql STABLE SET search_path=''
 AS $$ SELECT nullif(auth.jwt()->>'sub','')::uuid $$;

-- Founder AAL2 fixture updated to read actual wire JWT claim, not SQL helper flags.
CREATE OR REPLACE FUNCTION private.current_owner_aal2() RETURNS boolean
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
 AS $$ SELECT private.current_app_role()='owner'
   AND auth.jwt()->>'aal'='aal2'
   AND private.current_session_active() $$;

-- Two independent authenticated dummy reporters. All evidence is fake/non-public.
UPDATE public.team_accounts SET status='active'
 WHERE user_id='22222222-2222-2222-2222-222222222222';
INSERT INTO public.user_roles(user_id,role) VALUES
 ('44444444-4444-4444-8444-444444444444','reporter');
INSERT INTO public.team_accounts(user_id,reporter_id,assigned_role,status) VALUES
 ('44444444-4444-4444-8444-444444444444',NULL,'reporter','active');
INSERT INTO auth.sessions(id,user_id) VALUES
 ('40000000-0000-4000-8000-000000000065','44444444-4444-4444-8444-444444444444'),
 ('30000000-0000-4000-8000-000000000065','33333333-3333-3333-3333-333333333333');
INSERT INTO public.articles(id,status,slug,title,body,created_by) VALUES
 ('88888888-8888-4888-8888-888888888888','draft',
  't065-disposable-reporter-b-private','DUMMY_PRIVATE_REPORTER_B_ONLY',
  'SYNTHETIC_CI_ONLY','44444444-4444-4444-8444-444444444444');

DO $post$
BEGIN
 IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.articles'::regclass)
 THEN RAISE EXCEPTION 'T065_ARTICLE_RLS_DISABLED'; END IF;
 IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='articles'
   AND policyname IN('staff_can_create_articles','editorial_staff_can_update_articles',
                      'reporter_can_update_own_drafts')
   AND with_check LIKE '%current_session_active()%')<>3
 THEN RAISE EXCEPTION 'T065_SIGNED_WIRE_SESSION_GUARD_MISSING'; END IF;
END $post$;
\echo 'PASS: T064/T065 zero-cost isolated PG17 disposable wire fixture ready; real production untouched.'
