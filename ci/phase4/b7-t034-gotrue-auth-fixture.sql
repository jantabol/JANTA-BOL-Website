-- P4-T034: DISPOSABLE local Supabase GoTrue-backed HTTP E5 integration.
-- Run only against `supabase start` on CI runner, NEVER on production.
-- Uses genuine auth.users / auth.sessions / auth.uid / auth.jwt from local Supabase.
\set ON_ERROR_STOP on
BEGIN;

CREATE SCHEMA IF NOT EXISTS private;
CREATE TYPE public.app_role AS ENUM ('owner','admin','editor','reporter');
CREATE TABLE public.user_roles (user_id uuid PRIMARY KEY,role public.app_role NOT NULL);
CREATE TABLE public.team_accounts (
 user_id uuid PRIMARY KEY,status text NOT NULL);
CREATE TABLE public.advertiser_users (
 user_id uuid PRIMARY KEY,advertiser_id uuid NOT NULL);

CREATE TABLE public.advertisers(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL,
 risk_level text NOT NULL DEFAULT 'normal',
 verification_state text NOT NULL DEFAULT 'pending',
 updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.ad_campaigns(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 advertiser_id uuid NOT NULL REFERENCES public.advertisers(id),
 status text NOT NULL DEFAULT 'requested',
 approved_at timestamptz,
 paid_at timestamptz,
 non_refund_accepted_at timestamptz,
 updated_at timestamptz DEFAULT now());
CREATE TABLE public.ad_payments(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id),
 provider_ref text, status text,amount_minor bigint,
 currency text NOT NULL DEFAULT 'INR');
CREATE TABLE public.ad_history(
 id bigint GENERATED ALWAYS AS IDENTITY,
 campaign_id uuid NOT NULL,
 event_type text NOT NULL,
 note text NOT NULL DEFAULT '',
 actor_user_id uuid,
 created_at timestamptz DEFAULT now());
CREATE TABLE public.audit_logs(
 id bigint GENERATED ALWAYS AS IDENTITY,
 actor_user_id uuid,action text,record_type text,record_id text,
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now());

-- Verified live JANTA BOL helpers, reproduced in this standalone local service.
CREATE OR REPLACE FUNCTION private.current_session_id()
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER
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

CREATE OR REPLACE FUNCTION private.current_session_active()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'auth','pg_temp'
AS $active$
 SELECT EXISTS(SELECT 1 FROM auth.sessions s
 WHERE s.id=private.current_session_id() AND s.user_id=auth.uid())
$active$;

CREATE OR REPLACE FUNCTION private.current_app_role()
RETURNS public.app_role LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public','private','auth','pg_temp'
AS $app$
 SELECT ur.role FROM public.user_roles ur
 WHERE ur.user_id=auth.uid() AND (
  ur.role='owner'::public.app_role OR
  EXISTS (SELECT 1 FROM public.team_accounts ta
   WHERE ta.user_id=ur.user_id AND ta.status='active'))
 LIMIT 1
$app$;

CREATE OR REPLACE FUNCTION private.current_owner_aal2()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public','private','auth','pg_temp'
AS $aal$
 SELECT private.current_app_role()='owner'::public.app_role
 AND coalesce(auth.jwt()->>'aal','')='aal2'
 AND private.current_session_active()
$aal$;

CREATE OR REPLACE FUNCTION private.p4_owner_allowed()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private'
AS $owner$
 SELECT EXISTS(SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id=auth.uid() AND ur.role::text='owner')
 AND private.current_owner_aal2()
$owner$;

CREATE OR REPLACE FUNCTION private.p4_staff_allowed()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private'
AS $staff$
 SELECT CASE WHEN EXISTS(SELECT 1 FROM public.user_roles ur
 WHERE ur.user_id=auth.uid() AND ur.role::text='owner')
 THEN private.current_owner_aal2()
 ELSE EXISTS(SELECT 1 FROM public.user_roles ur
 JOIN public.team_accounts ta ON ta.user_id=ur.user_id
 WHERE ur.user_id=auth.uid() AND ur.role::text IN ('admin','editor')
 AND lower(ta.status)='active') AND private.current_session_active()
 END
$staff$;

-- Existing exact Owner sensitive API forms adapted only for disposable fixture
-- (actual RPC bodies are catalog-audited; external dependencies stripped).
CREATE OR REPLACE FUNCTION public.jb_ad_confirm_payment_internal(
 p_campaign uuid,p_provider_ref text,p_amount_minor bigint)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private'
AS $pay$
DECLARE x uuid;s text;
BEGIN
 IF NOT private.p4_owner_allowed() THEN RAISE EXCEPTION 'OWNER_AAL2_REQUIRED'; END IF;
 SELECT status INTO s FROM public.ad_campaigns WHERE id=p_campaign FOR UPDATE;
 IF s NOT IN('approved','payment_pending') THEN
  RAISE EXCEPTION 'APPROVAL_REQUIRED_BEFORE_PAYMENT'; END IF;
 IF p_amount_minor<=0 OR length(trim(coalesce(p_provider_ref,'')))<3 THEN
  RAISE EXCEPTION 'INVALID_PAYMENT_CONFIRMATION'; END IF;
 INSERT INTO public.ad_payments(campaign_id,provider_ref,status,amount_minor)
 VALUES(p_campaign,left(trim(p_provider_ref),300),'confirmed',p_amount_minor)
 RETURNING id INTO x;
 UPDATE public.ad_campaigns SET status='paid',paid_at=now(),
 non_refund_accepted_at=coalesce(non_refund_accepted_at,now()),updated_at=now()
 WHERE id=p_campaign;
 INSERT INTO public.ad_history(campaign_id,event_type,note,actor_user_id)
 VALUES(p_campaign,'payment_confirmed','Payment confirmation recorded',auth.uid());
 RETURN x;
END $pay$;

CREATE OR REPLACE FUNCTION public.jb_ad_record_payment_internal(
 p_campaign uuid,p_provider_ref text,p_status text,p_amount bigint,
 p_currency text,p_non_refund_accepted boolean)
RETURNS public.ad_payments LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private'
AS $record$
DECLARE v public.ad_payments;
BEGIN
 IF NOT private.p4_owner_allowed() THEN RAISE EXCEPTION 'OWNER_AAL2_REQUIRED'; END IF;
 IF p_status NOT IN('pending','confirmed','failed','ambiguous') THEN
  RAISE EXCEPTION 'INVALID_PAYMENT_STATUS';END IF;
 IF p_status='confirmed' AND (
 nullif(trim(coalesce(p_provider_ref,'')),'') IS NULL OR
 NOT p_non_refund_accepted) THEN RAISE EXCEPTION 'PAYMENT_EVIDENCE_REQUIRED';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.ad_campaigns
 WHERE id=p_campaign AND status IN('approved','payment_pending','paid'))
 THEN RAISE EXCEPTION 'APPROVAL_REQUIRED_BEFORE_PAYMENT'; END IF;
 INSERT INTO public.ad_payments(campaign_id,provider_ref,status,amount_minor,currency)
 VALUES(p_campaign,left(coalesce(p_provider_ref,''),300),p_status,greatest(p_amount,0),
 upper(left(coalesce(p_currency,'INR'),3))) RETURNING * INTO v;
 IF p_status='confirmed' THEN
 UPDATE public.ad_campaigns SET status='paid',paid_at=now(),
 non_refund_accepted_at=CASE WHEN p_non_refund_accepted THEN now() ELSE NULL END,
 updated_at=now() WHERE id=p_campaign;
 END IF;
 INSERT INTO public.ad_history(campaign_id,event_type,note,actor_user_id)
 VALUES(p_campaign,'payment_'||p_status,'Payment state recorded',auth.uid());
 RETURN v;
END $record$;

CREATE OR REPLACE FUNCTION public.jb_ad_verify_advertiser_internal(
 p_advertiser uuid,p_state text,p_note text,p_evidence_ref text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private'
AS $verify$
DECLARE v public.advertisers;v_note text;v_ref text;
BEGIN
 IF NOT private.p4_owner_allowed() THEN RAISE EXCEPTION 'OWNER_AAL2_REQUIRED';END IF;
 v_note:=btrim(coalesce(p_note,''));
 v_ref:=btrim(coalesce(p_evidence_ref,''));
 IF p_state IS NULL OR p_state NOT IN('verified','rejected','pending')
 OR length(v_note)<8 OR length(v_note)>1000
 THEN RAISE EXCEPTION 'INVALID_VERIFICATION_DECISION';END IF;
 IF length(v_ref)>300 THEN RAISE EXCEPTION 'INVALID_EVIDENCE_REFERENCE';END IF;
 SELECT * INTO v FROM public.advertisers WHERE id=p_advertiser FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'ADVERTISER_NOT_FOUND';END IF;
 IF v.risk_level='high' AND p_state='verified' AND length(v_ref)<8
 THEN RAISE EXCEPTION 'ENHANCED_VERIFICATION_EVIDENCE_REQUIRED';END IF;
 UPDATE public.advertisers SET verification_state=p_state,updated_at=now()
 WHERE id=p_advertiser;
 INSERT INTO public.ad_history(campaign_id,event_type,note,actor_user_id)
 SELECT c.id,'verification_'||p_state,
 left(v_note||CASE WHEN v_ref='' THEN '' ELSE '; evidence reference='||v_ref END,1500),
 auth.uid() FROM public.ad_campaigns c WHERE c.advertiser_id=p_advertiser;
 INSERT INTO public.audit_logs(actor_user_id,action,record_type,record_id,metadata,created_at)
 VALUES(auth.uid(),'ad_verification','advertiser',p_advertiser::text,
 jsonb_build_object('state',p_state,'high_risk',v.risk_level='high','evidence_provided',v_ref<>''),now());
END $verify$;

-- Real PostgREST authenticated role access plus project-specific Owner AAL2.
REVOKE ALL ON FUNCTION public.jb_ad_confirm_payment_internal(uuid,text,bigint)
 FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.jb_ad_record_payment_internal(uuid,text,text,bigint,text,boolean)
 FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.jb_ad_verify_advertiser_internal(uuid,text,text,text)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.jb_ad_confirm_payment_internal(uuid,text,bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.jb_ad_record_payment_internal(uuid,text,text,bigint,text,boolean)
 TO authenticated;
GRANT EXECUTE ON FUNCTION public.jb_ad_verify_advertiser_internal(uuid,text,text,text)
 TO authenticated;

ALTER TABLE public.advertisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
-- FIRST DIVERGENCE (run 38887406736): local Supabase automatically grants
-- public table privileges to anon/authenticated; LIVE JANTA BOL does not.
-- Match exact live catalog: anon none; authenticated SELECT on staff tables
-- only, with RLS further filtering by private.p4_staff_allowed().
REVOKE ALL ON public.advertisers,public.ad_campaigns,public.ad_history,
 public.ad_payments,public.audit_logs,public.user_roles,public.team_accounts,
 public.advertiser_users FROM anon,authenticated;
GRANT SELECT ON public.advertisers,public.ad_campaigns,public.ad_history TO authenticated;
CREATE POLICY ad_staff_campaigns ON public.ad_campaigns FOR SELECT TO authenticated
 USING(private.p4_staff_allowed());
CREATE POLICY ad_staff_advertisers ON public.advertisers FOR SELECT TO authenticated
 USING(private.p4_staff_allowed());
CREATE POLICY ad_staff_history ON public.ad_history FOR SELECT TO authenticated
 USING(private.p4_staff_allowed());

INSERT INTO public.advertisers(id,name,risk_level,verification_state) VALUES
('10000000-0000-4000-8000-000000000001','CI high risk unverified','high','pending'),
('10000000-0000-4000-8000-000000000002','CI normal unverified','normal','pending'),
('10000000-0000-4000-8000-000000000003','CI normal verified','normal','verified');
INSERT INTO public.ad_campaigns(id,advertiser_id,status,approved_at) VALUES
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','payment_pending',now()),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','approved',now()),
('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000003','approved',now());

COMMIT;
-- Call existing REVIEW_ONLY additive payment guard in separate psql session
-- as this isolated DB has an exact matching minimal source schema.
