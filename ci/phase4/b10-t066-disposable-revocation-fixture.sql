\set ON_ERROR_STOP on
-- Synthetic T066 fixtures AFTER prior B10/T065 isolated fixture.
-- NEVER on LIVE. Test real signed HTTP via PostgREST, no production tokens.
DO $guard$
BEGIN
 IF current_database()<>'jb_b10_disposable' THEN
  RAISE EXCEPTION 'T066_NEVER_RUN_OUTSIDE_DISPOSABLE_PG17';
 END IF;
 IF to_regprocedure('private.current_session_active()') IS NULL
 OR to_regprocedure('auth.uid()') IS NULL
 THEN RAISE EXCEPTION 'T066_PREVIOUS_AUTH_FIXTURE_MISSING'; END IF;
END $guard$;
CREATE TABLE public.advertiser_users(
 advertiser_id uuid NOT NULL, user_id uuid NOT NULL,
 PRIMARY KEY(advertiser_id,user_id));
CREATE TABLE public.ad_campaigns(
 id uuid PRIMARY KEY, advertiser_id uuid NOT NULL,
 status text NOT NULL, placement text NOT NULL, scope text NOT NULL,
 starts_at timestamptz, ends_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.advertiser_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.advertiser_users,public.ad_campaigns FROM PUBLIC,anon,authenticated;
INSERT INTO public.advertiser_users(advertiser_id,user_id) VALUES
 ('55000000-0000-4000-8000-000000000066','55555555-5555-4555-8555-555555555555'),
 ('66000000-0000-4000-8000-000000000066','66666666-6666-4666-8666-666666666666');
INSERT INTO public.ad_campaigns(id,advertiser_id,status,placement,scope) VALUES
 ('55000000-0000-4000-8000-000000000065','55000000-0000-4000-8000-000000000066','review','homepage','local'),
 ('66000000-0000-4000-8000-000000000065','66000000-0000-4000-8000-000000000066','review','article','global');
INSERT INTO auth.sessions(id,user_id) VALUES
 ('66000000-0000-4000-8000-000000000067','66666666-6666-4666-8666-666666666666'),
 ('77000000-0000-4000-8000-000000000067','77777777-7777-4777-8777-777777777777');
INSERT INTO public.user_roles(user_id,role) VALUES
 ('77777777-7777-4777-8777-777777777777','reporter');
INSERT INTO public.team_accounts(user_id,reporter_id,assigned_role,status)
 VALUES('77777777-7777-4777-8777-777777777777',NULL,'reporter','suspended');

-- Snapshot of exact LIVE function before T066 fix: auth.uid linked but
-- no auth.sessions check. Synthetic regression MUST reproduce first.
CREATE OR REPLACE FUNCTION public.jb_ad_my_campaigns()
RETURNS TABLE(
 id uuid, status text, placement text, scope text,
 starts_at timestamptz, ends_at timestamptz, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog','public'
AS $ad$
 SELECT c.id,c.status,c.placement,c.scope,c.starts_at,c.ends_at,c.created_at
 FROM public.ad_campaigns c
 JOIN public.advertiser_users au ON au.advertiser_id=c.advertiser_id
 WHERE au.user_id=auth.uid()
 ORDER BY c.created_at DESC
$ad$;
REVOKE ALL ON FUNCTION public.jb_ad_my_campaigns() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.jb_ad_my_campaigns() TO authenticated;

-- CI-only visibility probe, NO production equivalent. Tests real JWT
-- sub/session/Owner AAL2, suspension from DB rather than client role metadata.
CREATE FUNCTION public.jb_t066_ci_actor_state()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $probe$ SELECT jsonb_build_object(
 'app_role',private.current_app_role(),
 'active_session',private.current_session_active(),
 'owner_aal2',private.current_owner_aal2()) $probe$;
REVOKE ALL ON FUNCTION public.jb_t066_ci_actor_state() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.jb_t066_ci_actor_state() TO authenticated;
\echo 'T066 synthetic original-ad RPC, active/stale advertisers, suspended reporter and real JWT wire fixtures ready.'
