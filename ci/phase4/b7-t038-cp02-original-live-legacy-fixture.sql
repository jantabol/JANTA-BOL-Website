\set ON_ERROR_STOP on
-- T038 CP02: replicas of TWO currently hosted legacy payment RPCs.
-- Source checked from JANTA BOL LIVE pg_get_functiondef on 16 Oct 2026.
-- In disposable PG17 ONLY; no public legacy RPC deployment or changes.
CREATE OR REPLACE FUNCTION public.jb_ad_confirm_payment_internal(
 p_campaign uuid,p_provider_ref text,p_amount_minor bigint)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private'
AS $old$
DECLARE x uuid;s text;
BEGIN
 IF NOT private.p4_owner_allowed() THEN RAISE EXCEPTION 'OWNER_AAL2_REQUIRED'; END IF;
 SELECT status INTO s FROM public.ad_campaigns WHERE id=p_campaign FOR UPDATE;
 IF s NOT IN('approved','payment_pending') THEN RAISE EXCEPTION 'APPROVAL_REQUIRED_BEFORE_PAYMENT'; END IF;
 IF p_amount_minor<=0 OR length(trim(coalesce(p_provider_ref,'')))<3 THEN RAISE EXCEPTION 'INVALID_PAYMENT_CONFIRMATION'; END IF;
 INSERT INTO public.ad_payments(campaign_id,provider_ref,status,amount_minor)
 VALUES(p_campaign,left(trim(p_provider_ref),300),'confirmed',p_amount_minor) RETURNING id INTO x;
 UPDATE public.ad_campaigns SET status='paid',paid_at=now(),
 non_refund_accepted_at=coalesce(non_refund_accepted_at,now()),updated_at=now() WHERE id=p_campaign;
 INSERT INTO public.ad_history(campaign_id,event_type,note,actor_user_id)
 VALUES(p_campaign,'payment_confirmed','Payment confirmation recorded',auth.uid());
 RETURN x;
END $old$;

CREATE OR REPLACE FUNCTION public.jb_ad_record_payment_internal(
 p_campaign uuid,p_provider_ref text,p_status text,p_amount bigint,p_currency text,
 p_non_refund_accepted boolean)
RETURNS public.ad_payments LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private'
AS $old$
DECLARE v public.ad_payments;
BEGIN
 IF NOT private.p4_owner_allowed() THEN RAISE EXCEPTION 'OWNER_AAL2_REQUIRED'; END IF;
 IF p_status NOT IN('pending','confirmed','failed','ambiguous') THEN RAISE EXCEPTION 'INVALID_PAYMENT_STATUS'; END IF;
 IF p_status='confirmed' AND (nullif(trim(coalesce(p_provider_ref,'')),'') IS NULL
 OR NOT p_non_refund_accepted) THEN RAISE EXCEPTION 'PAYMENT_EVIDENCE_REQUIRED'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.ad_campaigns WHERE id=p_campaign
 AND status IN('approved','payment_pending','paid')) THEN RAISE EXCEPTION 'APPROVAL_REQUIRED_BEFORE_PAYMENT'; END IF;
 INSERT INTO public.ad_payments(campaign_id,provider_ref,status,amount_minor,currency)
 VALUES(p_campaign,left(coalesce(p_provider_ref,''),300),p_status,greatest(p_amount,0),
 upper(left(coalesce(p_currency,'INR'),3))) RETURNING * INTO v;
 IF p_status='confirmed' THEN
 UPDATE public.ad_campaigns SET status='paid',paid_at=now(),
 non_refund_accepted_at=CASE WHEN p_non_refund_accepted THEN now() ELSE NULL END,
 updated_at=now() WHERE id=p_campaign; END IF;
 INSERT INTO public.ad_history(campaign_id,event_type,note,actor_user_id)
 VALUES(p_campaign,'payment_'||p_status,
 'Payment state recorded; provider evidence required for confirmed.',auth.uid());
 RETURN v;
END $old$;
