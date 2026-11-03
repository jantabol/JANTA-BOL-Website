\set ON_ERROR_STOP on
-- Disposable PostgreSQL 17 ONLY. Zero production credentials/records/queries.
-- Faithful simplified RLS fixture: exact three live user_roles policies and
-- relevant live auth/private helpers. Distinct synthetic Owner/Admin/Reporter/Editor.
CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth;
CREATE SCHEMA private;
CREATE TYPE public.app_role AS ENUM ('owner','admin','editor','reporter');
CREATE TABLE auth.sessions (id uuid PRIMARY KEY,user_id uuid NOT NULL);
CREATE TABLE public.user_roles (user_id uuid PRIMARY KEY,role public.app_role NOT NULL);
CREATE TABLE public.team_accounts (user_id uuid PRIMARY KEY,status text NOT NULL);
INSERT INTO public.user_roles VALUES
 ('11111111-1111-4111-8111-111111111111','owner'),
 ('22222222-2222-4222-8222-222222222222','admin'),
 ('33333333-3333-4333-8333-333333333333','reporter'),
 ('44444444-4444-4444-8444-444444444444','editor');
INSERT INTO public.team_accounts VALUES
 ('22222222-2222-4222-8222-222222222222','active'),
 ('33333333-3333-4333-8333-333333333333','active'),
 ('44444444-4444-4444-8444-444444444444','active');
INSERT INTO auth.sessions VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','33333333-3333-4333-8333-333333333333'),
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','44444444-4444-4444-8444-444444444444');
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
 SELECT COALESCE(NULLIF(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb)
$$;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
 SELECT NULLIF(auth.jwt()->>'sub','')::uuid
$$;
CREATE FUNCTION private.current_session_id() RETURNS uuid LANGUAGE sql STABLE AS $$
 SELECT NULLIF(auth.jwt()->>'session_id','')::uuid
$$;
CREATE FUNCTION private.current_session_active() RETURNS boolean
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'auth','pg_temp'
AS $$
 SELECT exists(
 SELECT 1 FROM auth.sessions s
 WHERE s.id=private.current_session_id() AND s.user_id=auth.uid())
$$;
CREATE FUNCTION private.current_app_role() RETURNS public.app_role
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','private','auth','pg_temp'
AS $$
 SELECT ur.role FROM public.user_roles ur WHERE ur.user_id=auth.uid()
 AND (ur.role='owner'::public.app_role
 OR exists(SELECT 1 FROM public.team_accounts ta WHERE ta.user_id=ur.user_id AND ta.status='active'))
 LIMIT 1
$$;
CREATE FUNCTION private.current_owner_aal2() RETURNS boolean
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','private','auth','pg_temp'
AS $$
 SELECT private.current_app_role()='owner'::public.app_role
 AND coalesce(auth.jwt()->>'aal','')='aal2'
 AND private.current_session_active()
$$;
CREATE FUNCTION private.current_owner_recent_mfa(max_age_seconds integer DEFAULT 600)
 RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER
 SET search_path TO 'public','private','auth','pg_temp'
AS $$
DECLARE v_ts bigint; v_now bigint:=floor(extract(epoch FROM now()))::bigint;
        v_max integer:=greatest(0,least(coalesce(max_age_seconds,600),3600));
BEGIN
 IF NOT private.current_owner_aal2() THEN RETURN false; END IF;
 SELECT (x->>'timestamp')::bigint INTO v_ts
 FROM jsonb_array_elements(coalesce(auth.jwt()->'amr','[]'::jsonb)) x
 WHERE x->>'method' IN ('totp','phone')
 AND coalesce(x->>'timestamp','') ~ '^[0-9]+$'
 ORDER BY (x->>'timestamp')::bigint DESC LIMIT 1;
 IF v_ts IS NULL THEN RETURN false; END IF;
 RETURN (v_now-v_ts) BETWEEN -60 AND v_max;
EXCEPTION WHEN others THEN RETURN false;
END;
$$;
GRANT USAGE ON SCHEMA public,auth,private TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth,private TO authenticated;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY owner_admin_can_read_roles ON public.user_roles
 FOR SELECT TO authenticated
 USING ((private.current_app_role()='admin'::public.app_role) OR private.current_owner_aal2());
CREATE POLICY owner_can_manage_roles ON public.user_roles
 FOR ALL TO authenticated
 USING (private.current_owner_recent_mfa(600))
 WITH CHECK (private.current_owner_recent_mfa(600));
CREATE POLICY users_can_read_own_role ON public.user_roles
 FOR SELECT TO authenticated USING (user_id=(SELECT auth.uid()));

-- Confirm the precise old policy fails stale-session privacy (fixture only).
SET ROLE authenticated;
SET request.jwt.claims='{"sub":"11111111-1111-4111-8111-111111111111","session_id":"99999999-9999-4999-8999-999999999999","aal":"aal2"}';
DO $t$ BEGIN
 IF (SELECT COUNT(*) FROM public.user_roles)!=1 THEN
  RAISE EXCEPTION 'BASELINE_OWNER_STALE_SESSION_SELF_ROLE_LEAK_NOT_REPRODUCED';
 END IF;
END $t$;
SET request.jwt.claims='{"sub":"22222222-2222-4222-8222-222222222222","session_id":"99999999-9999-4999-8999-999999999999","aal":"aal1"}';
DO $t$ BEGIN
 IF (SELECT COUNT(*) FROM public.user_roles)!=4 THEN
  RAISE EXCEPTION 'BASELINE_ADMIN_STALE_SESSION_ALL_ROLES_LEAK_NOT_REPRODUCED';
 END IF;
END $t$;
RESET ROLE;
\echo T090_PG17_BASELINE_STALE_OWNER_SELF_AND_ADMIN_ALL_ROLES_LEAK_REPRODUCED=PASS

-- Apply ONLY the review candidate on this isolated synthetic Postgres 17.
\i JANTA_BOL_PHASE_4_WORKING/review/P4_T090_STALE_SESSION_USER_ROLES_RLS_MIN_FIX_REVIEW_ONLY_20261103.sql

-- Defensive catalog check: must retain all three original named policy roles/commands.
DO $t$ BEGIN
 IF (SELECT COUNT(*) FROM pg_policies WHERE schemaname='public'
     AND tablename='user_roles'
     AND policyname IN ('users_can_read_own_role','owner_admin_can_read_roles','owner_can_manage_roles'))!=3
 THEN RAISE EXCEPTION 'ORIGINAL_THREE_RLS_POLICIES_CHANGED'; END IF;
 IF (SELECT cmd FROM pg_policies WHERE schemaname='public'
     AND tablename='user_roles' AND policyname='owner_can_manage_roles')!='ALL'
 THEN RAISE EXCEPTION 'ORIGINAL_MFA_MANAGEMENT_POLICY_BROKEN'; END IF;
END $t$;

SET ROLE authenticated;
-- Stale Owner with AAL2 => no role metadata or Owner permissions.
SET request.jwt.claims='{"sub":"11111111-1111-4111-8111-111111111111","session_id":"99999999-9999-4999-8999-999999999999","aal":"aal2"}';
DO $t$ BEGIN
 IF private.current_session_active() OR (SELECT COUNT(*) FROM public.user_roles)!=0 THEN
  RAISE EXCEPTION 'PATCH_OWNER_STALE_SESSION_LEAK'; END IF;
END $t$;
-- Stale Admin should not read *any* roles.
SET request.jwt.claims='{"sub":"22222222-2222-4222-8222-222222222222","session_id":"99999999-9999-4999-8999-999999999999","aal":"aal1"}';
DO $t$ BEGIN
 IF private.current_session_active() OR (SELECT COUNT(*) FROM public.user_roles)!=0 THEN
  RAISE EXCEPTION 'PATCH_ADMIN_STALE_SESSION_LEAK'; END IF;
END $t$;
-- Active Owner AAL1: self role only; Owner-wide AAL2 remains protected.
SET request.jwt.claims='{"sub":"11111111-1111-4111-8111-111111111111","session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","aal":"aal1"}';
DO $t$ BEGIN
 IF NOT private.current_session_active() OR private.current_owner_aal2()
 OR (SELECT COUNT(*) FROM public.user_roles)!=1 THEN
  RAISE EXCEPTION 'PATCH_OWNER_AAL1_REGRESSION'; END IF;
END $t$;
-- Active Owner AAL2: 4 roles visible through existing owner policy; no regression.
SET request.jwt.claims='{"sub":"11111111-1111-4111-8111-111111111111","session_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","aal":"aal2"}';
DO $t$ BEGIN
 IF NOT private.current_session_active() OR NOT private.current_owner_aal2()
 OR (SELECT COUNT(*) FROM public.user_roles)!=4 THEN
  RAISE EXCEPTION 'PATCH_OWNER_AAL2_REGRESSION'; END IF;
END $t$;
-- Active Admin: intended 4 role rows visible, provided active session/team.
SET request.jwt.claims='{"sub":"22222222-2222-4222-8222-222222222222","session_id":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","aal":"aal1"}';
DO $t$ BEGIN
 IF NOT private.current_session_active() OR (SELECT COUNT(*) FROM public.user_roles)!=4 THEN
  RAISE EXCEPTION 'PATCH_ACTIVE_ADMIN_REGRESSION'; END IF;
END $t$;
-- Active Reporter: own role visible, other three denied.
SET request.jwt.claims='{"sub":"33333333-3333-4333-8333-333333333333","session_id":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","aal":"aal1"}';
DO $t$ BEGIN
 IF NOT private.current_session_active() OR (SELECT COUNT(*) FROM public.user_roles)!=1
 OR (SELECT COUNT(*) FROM public.user_roles WHERE role!='reporter')!=0 THEN
  RAISE EXCEPTION 'PATCH_ACTIVE_REPORTER_REGRESSION'; END IF;
END $t$;
-- Active Editor: own role visible, no Owner or Admin roles.
SET request.jwt.claims='{"sub":"44444444-4444-4444-8444-444444444444","session_id":"dddddddd-dddd-4ddd-8ddd-dddddddddddd","aal":"aal1"}';
DO $t$ BEGIN
 IF NOT private.current_session_active() OR (SELECT COUNT(*) FROM public.user_roles)!=1
 OR (SELECT COUNT(*) FROM public.user_roles WHERE role!='editor')!=0 THEN
  RAISE EXCEPTION 'PATCH_ACTIVE_EDITOR_REGRESSION'; END IF;
END $t$;
RESET ROLE;
-- Simulated genuine-session revocation on disposable DB only.
DELETE FROM auth.sessions WHERE id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
SET ROLE authenticated;
SET request.jwt.claims='{"sub":"33333333-3333-4333-8333-333333333333","session_id":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","aal":"aal1"}';
DO $t$ BEGIN
 IF private.current_session_active() OR (SELECT COUNT(*) FROM public.user_roles)!=0 THEN
  RAISE EXCEPTION 'PATCH_DISPOSABLE_REPORTER_SESSION_REVOCATION_LEAK'; END IF;
END $t$;
RESET ROLE;
\echo T090_PG17_STALE_SESSION_RLS_OWNER_ADMIN_REPORTER_EDITOR_ISOLATED_NEGATIVE_AND_POSITIVE=PASS
\echo T090_USER_ROLES_PRODUCTION_MIGRATION_APPLIED=false
\echo T090_REAL_SIGNED_HTTP_FULL_E5_E8_FINAL=HOLD
