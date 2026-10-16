\set ON_ERROR_STOP on
-- DISPOSABLE DATABASE ONLY. Mimics exact OLD LIVE payment RPC bodies.
-- No production or personal dataset. No real payment/network calls.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA private;
CREATE SCHEMA auth;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
 AS $$SELECT NULL::uuid$$;
CREATE FUNCTION private.p4_owner_allowed() RETURNS boolean
 LANGUAGE sql STABLE
 AS $$SELECT coalesce(current_setting('b7.test_owner',true),'')='enabled'$$;

CREATE TABLE public.advertisers(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL, risk_level text NOT NULL DEFAULT 'normal',
 verification_state text NOT NULL DEFAULT 'pending');
CREATE TABLE public.ad_campaigns(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 advertiser_id uuid NOT NULL REFERENCES public.advertisers(id),
 status text NOT NULL DEFAULT 'requested',
 approved_at timestamptz,approved_by uuid,
 paid_at timestamptz,non_refund_accepted_at timestamptz,
 updated_at timestamptz DEFAULT now());
CREATE TABLE public.ad_payments(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id),
 provider_ref text,status text,amount_minor bigint,
 currency text NOT NULL DEFAULT 'INR',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.ad_history(
 id bigint GENERATED ALWAYS AS IDENTITY,
 campaign_id uuid NOT NULL,event_type text,note text,actor_user_id uuid);

-- Copy of both original LIVE 13 Oct 2026 legacy payment RPC bodies.
-- Weak OLD version is intentional to reproduce FIRST DIVERGENCE.
CREATE FUNCTION public.jb_ad_confirm_payment_internal(
 p_campaign uuid,p_provider_ref text,p_amount_minor bigint)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private'
AS $old$
DECLARE x uuid;s text;
BEGIN
 IF NOT private.p4_owner_allowed() THEN RAISE EXCEPTION 'OWNER_AAL2_REQUIRED';END IF;
 SELECT status INTO s FROM public.ad_campaigns WHERE id=p_campaign FOR UPDATE;
 IF s NOT IN ('approved','payment_pending') THEN RAISE EXCEPTION 'APPROVAL_REQUIRED_BEFORE_PAYMENT';END IF;
 IF p_amount_minor<=0 OR length(trim(coalesce(p_provider_ref,'')))<3
 THEN RAISE EXCEPTION 'INVALID_PAYMENT_CONFIRMATION';END IF;
 INSERT INTO public.ad_payments(campaign_id,provider_ref,status,amount_minor)
 VALUES(p_campaign,left(trim(p_provider_ref),300),'confirmed',p_amount_minor)
 RETURNING id INTO x;
 UPDATE public.ad_campaigns
 SET status='paid',paid_at=now(),non_refund_accepted_at=coalesce(non_refund_accepted_at,now()),updated_at=now()
 WHERE id=p_campaign;
 INSERT INTO public.ad_history(campaign_id,event_type,note,actor_user_id)
 VALUES(p_campaign,'payment_confirmed','Payment confirmation recorded',auth.uid());
 RETURN x;
END $old$;

CREATE FUNCTION public.jb_ad_record_payment_internal(
 p_campaign uuid,p_provider_ref text,p_status text,p_amount bigint,
 p_currency text,p_non_refund_accepted boolean)
RETURNS public.ad_payments LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private'
AS $old$
DECLARE v public.ad_payments;
BEGIN
 IF NOT private.p4_owner_allowed() THEN RAISE EXCEPTION 'OWNER_AAL2_REQUIRED';END IF;
 IF p_status NOT IN('pending','confirmed','failed','ambiguous')
 THEN RAISE EXCEPTION 'INVALID_PAYMENT_STATUS';END IF;
 IF p_status='confirmed' AND
   (nullif(trim(coalesce(p_provider_ref,'')),'') IS NULL OR NOT p_non_refund_accepted)
 THEN RAISE EXCEPTION 'PAYMENT_EVIDENCE_REQUIRED';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.ad_campaigns
   WHERE id=p_campaign AND status IN('approved','payment_pending','paid'))
 THEN RAISE EXCEPTION 'APPROVAL_REQUIRED_BEFORE_PAYMENT';END IF;
 INSERT INTO public.ad_payments(campaign_id,provider_ref,status,amount_minor,currency)
 VALUES(p_campaign,left(coalesce(p_provider_ref,''),300),p_status,greatest(p_amount,0),
 upper(left(coalesce(p_currency,'INR'),3))) RETURNING * INTO v;
 IF p_status='confirmed' THEN
   UPDATE public.ad_campaigns SET status='paid',paid_at=now(),
   non_refund_accepted_at=CASE WHEN p_non_refund_accepted THEN now() ELSE NULL END,
   updated_at=now() WHERE id=p_campaign;
 END IF;
 INSERT INTO public.ad_history(campaign_id,event_type,note,actor_user_id)
 VALUES(p_campaign,'payment_'||p_status,'Payment state recorded; provider evidence required for confirmed.',auth.uid());
 RETURN v;
END $old$;

REVOKE ALL ON FUNCTION public.jb_ad_confirm_payment_internal(uuid,text,bigint)
 FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.jb_ad_record_payment_internal(uuid,text,text,bigint,text,boolean)
 FROM PUBLIC,anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.jb_ad_confirm_payment_internal(uuid,text,bigint)
 TO authenticated;
GRANT EXECUTE ON FUNCTION public.jb_ad_record_payment_internal(uuid,text,text,bigint,text,boolean)
 TO authenticated;

INSERT INTO public.advertisers(id,name,risk_level,verification_state) VALUES
('10000000-0000-4000-8000-000000000001','HISTORICAL HIGH RISK','high','pending'),
('10000000-0000-4000-8000-000000000002','NORMAL PENDING','normal','pending'),
('10000000-0000-4000-8000-000000000003','NORMAL VERIFIED','normal','verified'),
('10000000-0000-4000-8000-000000000004','HIGH VERIFIED','high','verified');
INSERT INTO public.ad_campaigns(id,advertiser_id,status,approved_at) VALUES
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','payment_pending',now()),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','approved',now()),
('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000003','approved',now()),
('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000004','payment_pending',now());
