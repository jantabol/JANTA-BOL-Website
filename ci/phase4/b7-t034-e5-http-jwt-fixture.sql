-- JANTA BOL P4-T034: LOCAL POSTGREST JWT E5 FIXTURE ONLY
-- Never apply to real Supabase; created AFTER the existing disposable PG17 payment
-- fixture and reviewed additive guard, in isolated GitHub Actions database.
-- JWTs are cryptographically signed by a CI-local test issuer; they are NOT
-- GoTrue-issued Supabase production tokens, nor genuine live User sessions.
\set ON_ERROR_STOP on

CREATE TYPE public.app_role AS ENUM ('owner','admin','editor','reporter');
CREATE TABLE public.user_roles (user_id uuid PRIMARY KEY,role public.app_role NOT NULL);
CREATE TABLE public.team_accounts (user_id uuid PRIMARY KEY,status text NOT NULL);
CREATE TABLE auth.sessions (id uuid PRIMARY KEY,user_id uuid NOT NULL);
CREATE TABLE public.advertiser_users (user_id uuid PRIMARY KEY,advertiser_id uuid NOT NULL);
CREATE TABLE public.audit_logs (
 id bigint GENERATED ALWAYS AS IDENTITY,
 actor_user_id uuid,action text,record_type text,record_id text,
 metadata jsonb DEFAULT '{}'::jsonb,created_at timestamptz DEFAULT now());

-- Match LIVE authority lookup shape using the PostgREST verified request JWT.
CREATE FUNCTION auth.jwt() RETURNS jsonb
LANGUAGE sql STABLE AS $jwt$
 SELECT COALESCE(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb)
$jwt$;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE AS $uid$
 SELECT nullif(auth.jwt()->>'sub','')::uuid
$uid$;

CREATE FUNCTION private.current_session_id() RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'auth','pg_temp'
AS $sid$
DECLARE v_raw text:=coalesce(auth.jwt()->>'session_id','');
BEGIN
 IF v_raw !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
  RETURN NULL;
 END IF;
 RETURN v_raw::uuid;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END $sid$;

CREATE FUNCTION private.current_session_active() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'auth','pg_temp'
AS $active$
 SELECT EXISTS (SELECT 1 FROM auth.sessions s
 WHERE s.id=private.current_session_id() AND s.user_id=auth.uid())
$active$;

CREATE FUNCTION private.current_app_role() RETURNS public.app_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public','private','auth','pg_temp'
AS $app$
 SELECT ur.role FROM public.user_roles ur
 WHERE ur.user_id=auth.uid() AND
 (ur.role='owner'::public.app_role OR EXISTS (
   SELECT 1 FROM public.team_accounts ta
   WHERE ta.user_id=ur.user_id AND ta.status='active'
 )) LIMIT 1
$app$;

CREATE FUNCTION private.current_owner_aal2() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public','private','auth','pg_temp'
AS $aal$
 SELECT private.current_app_role()='owner'::public.app_role
  AND coalesce(auth.jwt()->>'aal','')='aal2'
  AND private.current_session_active()
$aal$;

CREATE OR REPLACE FUNCTION private.p4_owner_allowed() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private'
AS $own$
 SELECT EXISTS (SELECT 1 FROM public.user_roles ur
 WHERE ur.user_id=auth.uid() AND ur.role::text='owner')
 AND private.current_owner_aal2()
$own$;

CREATE FUNCTION private.p4_staff_allowed() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private'
AS $staff$
 SELECT CASE WHEN EXISTS (SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id=auth.uid() AND ur.role::text='owner')
 THEN private.current_owner_aal2()
 ELSE EXISTS(SELECT 1 FROM public.user_roles ur JOIN public.team_accounts ta
 ON ta.user_id=ur.user_id WHERE ur.user_id=auth.uid()
  AND ur.role::text IN ('admin','editor') AND lower(ta.status)='active')
  AND private.current_session_active()
 END
$staff$;

-- Synthetic fixtures. Fixed IDs are public test-only constants, never live IDs.
INSERT INTO public.user_roles(user_id,role) VALUES
 ('11111111-1111-4111-8111-111111111111','owner'),
 ('22222222-2222-4222-8222-222222222222','reporter'),
 ('33333333-3333-4333-8333-333333333333','editor');
INSERT INTO public.team_accounts(user_id,status) VALUES
 ('22222222-2222-4222-8222-222222222222','active'),
 ('33333333-3333-4333-8333-333333333333','active');
INSERT INTO auth.sessions(id,user_id) VALUES
 ('a1111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
 ('a1111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111'),
 ('a2222222-2222-4222-8222-222222222222','22222222-2222-4222-8222-222222222222'),
 ('a3333333-3333-4333-8333-333333333333','33333333-3333-4333-8333-333333333333'),
 ('a4444444-4444-4444-8444-444444444444','44444444-4444-4444-8444-444444444444');
INSERT INTO public.advertiser_users(user_id,advertiser_id) VALUES
 ('44444444-4444-4444-8444-444444444444','10000000-0000-4000-8000-000000000002');

-- Exact logic of inspected production verifier (only fixture table shapes differ).
CREATE OR REPLACE FUNCTION public.jb_ad_verify_advertiser_internal(
 p_advertiser uuid,p_state text,p_note text,p_evidence_ref text DEFAULT NULL::text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private'
AS $ver$
DECLARE v public.advertisers;v_note text;v_ref text;
BEGIN
 IF NOT private.p4_owner_allowed() THEN
  RAISE EXCEPTION 'OWNER_AAL2_REQUIRED';END IF;
 v_note:=btrim(coalesce(p_note,''));
 v_ref:=btrim(coalesce(p_evidence_ref,''));
 IF p_state IS NULL OR p_state NOT IN ('verified','rejected','pending')
    OR length(v_note)<8 OR length(v_note)>1000
 THEN RAISE EXCEPTION 'INVALID_VERIFICATION_DECISION';END IF;
 IF length(v_ref)>300 THEN RAISE EXCEPTION 'INVALID_EVIDENCE_REFERENCE';END IF;
 SELECT * INTO v FROM public.advertisers WHERE id=p_advertiser FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'ADVERTISER_NOT_FOUND';END IF;
 IF v.risk_level='high' AND p_state='verified' AND length(v_ref)<8 THEN
  RAISE EXCEPTION 'ENHANCED_VERIFICATION_EVIDENCE_REQUIRED';END IF;
 UPDATE public.advertisers SET verification_state=p_state WHERE id=p_advertiser;
 INSERT INTO public.ad_history(campaign_id,event_type,note,actor_user_id)
 SELECT c.id,'verification_'||p_state,
 left(v_note||CASE WHEN v_ref='' THEN '' ELSE '; evidence reference='||v_ref END,1500),
 auth.uid()
 FROM public.ad_campaigns c WHERE c.advertiser_id=p_advertiser;
 INSERT INTO public.audit_logs(actor_user_id,action,record_type,record_id,metadata,created_at)
 VALUES(auth.uid(),'ad_verification','advertiser',p_advertiser::text,
 jsonb_build_object('state',p_state,'high_risk',v.risk_level='high',
  'evidence_provided',v_ref<>''),now());
END $ver$;

-- Explicit PostgreSQL authenticator for test-only PostgREST HTTP listener.
CREATE ROLE b7_e5_authenticator LOGIN NOINHERIT PASSWORD 'e5_local_postgrest_only';
GRANT anon,authenticated TO b7_e5_authenticator;
GRANT USAGE ON SCHEMA public TO anon,authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon,authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA auth FROM anon,authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA private FROM anon,authenticated;
REVOKE ALL ON FUNCTION public.jb_ad_confirm_payment_internal(uuid,text,bigint) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.jb_ad_record_payment_internal(uuid,text,text,bigint,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.jb_ad_confirm_payment_internal(uuid,text,bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.jb_ad_record_payment_internal(uuid,text,text,bigint,text,boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.jb_ad_verify_advertiser_internal(uuid,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.jb_ad_verify_advertiser_internal(uuid,text,text,text) TO authenticated;

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.ad_campaigns,public.advertisers,public.ad_history TO authenticated;
CREATE POLICY ad_staff_campaigns ON public.ad_campaigns FOR SELECT TO authenticated
 USING(private.p4_staff_allowed());
CREATE POLICY ad_staff_advertisers ON public.advertisers FOR SELECT TO authenticated
 USING(private.p4_staff_allowed());
CREATE POLICY ad_staff_history ON public.ad_history FOR SELECT TO authenticated
 USING(private.p4_staff_allowed());

DO $check$
BEGIN
 IF has_table_privilege('anon','public.ad_campaigns','SELECT') OR
    has_function_privilege('anon','public.jb_ad_confirm_payment_internal(uuid,text,bigint)','EXECUTE') OR
    has_function_privilege('anon','public.jb_ad_verify_advertiser_internal(uuid,text,text,text)','EXECUTE')
 THEN RAISE EXCEPTION 'E5_FIXTURE_PUBLIC_PERMISSION_DRIFT';END IF;
 IF NOT has_function_privilege('authenticated','public.jb_ad_verify_advertiser_internal(uuid,text,text,text)','EXECUTE')
 THEN RAISE EXCEPTION 'E5_FIXTURE_OWNER_VERIFIER_UNREACHABLE';END IF;
 IF (SELECT COUNT(*) FROM public.ad_payments)<>0 OR
    (SELECT COUNT(*) FROM public.ad_history)<>0 OR
    (SELECT COUNT(*) FROM public.audit_logs)<>0 THEN
    RAISE EXCEPTION 'E5_FIXTURE_DIRTY_AUDIT';END IF;
 RAISE NOTICE 'E5 DISPOSABLE fixture prepared: signed-JWT role/session/AAL2 checks use real SQL functions and zero live identifiers';
END $check$;
