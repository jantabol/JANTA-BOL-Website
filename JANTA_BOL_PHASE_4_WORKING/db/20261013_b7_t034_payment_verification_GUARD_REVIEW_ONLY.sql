-- JANTA BOL B7 / P4-T034 / ADS-008 — INDEPENDENT CANDIDATE, NOT DEPLOYED.
-- Isolated disposable CI test ONLY until separate Founder-approved production
-- migration, schema diff, point-in-time restore check, rollback and E2 proof.
-- Additive: DO NOT replace or drop ANY existing RPC, trigger, article or data.
-- Origin: historical high-risk advertiser verification=PENDING while campaign
-- is payment_pending, with old Owner/AAL2 payment RPCs lacking this guard.
-- No auto-repair, update, deletion or verification of historical rows.

-- Atomic: any preflight/DDL/GRANT failure must roll back ALL new objects.
BEGIN;
DO $preflight$
DECLARE missing text;
BEGIN
  IF to_regclass('public.ad_campaigns') IS NULL
     OR to_regclass('public.advertisers') IS NULL
     OR to_regclass('public.ad_payments') IS NULL
     OR to_regprocedure('public.jb_ad_confirm_payment_internal(uuid,text,bigint)') IS NULL
     OR to_regprocedure('public.jb_ad_record_payment_internal(uuid,text,text,bigint,text,boolean)') IS NULL
     OR to_regprocedure('private.p4_owner_allowed()') IS NULL
  THEN RAISE EXCEPTION 'B7_T034_PAYMENT_EXISTING_AUTHORITY_MISSING'; END IF;
  SELECT string_agg(t.missing, ',') INTO missing
  FROM (VALUES
    ('ad_payments.status', to_regclass('public.ad_payments') IS NOT NULL AND
     EXISTS(SELECT 1 FROM information_schema.columns
       WHERE table_schema='public' AND table_name='ad_payments' AND column_name='status')),
    ('ad_payments.campaign_id', EXISTS(SELECT 1 FROM information_schema.columns
       WHERE table_schema='public' AND table_name='ad_payments' AND column_name='campaign_id')),
    ('ad_campaigns.status', EXISTS(SELECT 1 FROM information_schema.columns
       WHERE table_schema='public' AND table_name='ad_campaigns' AND column_name='status')),
    ('ad_campaigns.paid_at', EXISTS(SELECT 1 FROM information_schema.columns
       WHERE table_schema='public' AND table_name='ad_campaigns' AND column_name='paid_at')),
    ('ad_campaigns.advertiser_id', EXISTS(SELECT 1 FROM information_schema.columns
       WHERE table_schema='public' AND table_name='ad_campaigns' AND column_name='advertiser_id')),
    ('advertisers.verification_state', EXISTS(SELECT 1 FROM information_schema.columns
       WHERE table_schema='public' AND table_name='advertisers' AND column_name='verification_state'))
  ) AS t(missing,present) WHERE NOT t.present;
  IF missing IS NOT NULL THEN RAISE EXCEPTION 'B7_T034_PAYMENT_SCHEMA_DRIFT: %',missing; END IF;
  -- Never overwrite a same-named trigger from another release.
  IF EXISTS(SELECT 1 FROM pg_trigger
      WHERE tgname IN ('b7_t034_payment_verified_gate','b7_t034_paid_state_verified_gate')
        AND NOT tgisinternal)
  THEN RAISE EXCEPTION 'B7_T034_PAYMENT_GATE_ALREADY_PRESENT_REVIEW_FIRST'; END IF;
  IF to_regprocedure('private.b7_t034_assert_advertiser_verified(uuid)') IS NOT NULL
     OR to_regprocedure('private.b7_t034_confirmed_payment_guard()') IS NOT NULL
     OR to_regprocedure('private.b7_t034_paid_state_guard()') IS NOT NULL
  THEN RAISE EXCEPTION 'B7_T034_GUARD_FUNCTION_COLLISION'; END IF;
END $preflight$;

-- Single internal predicate shared by both independent write boundaries.
-- Verified status is mandatory for all business categories before payment:
-- protects historical HIGH and ordinary unverified businesses alike.
CREATE FUNCTION private.b7_t034_assert_advertiser_verified(p_campaign uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public'
AS $assert$
DECLARE v_verified text;
BEGIN
  SELECT a.verification_state INTO v_verified
  FROM public.ad_campaigns c JOIN public.advertisers a
    ON a.id=c.advertiser_id
  WHERE c.id=p_campaign;
  IF NOT FOUND OR v_verified IS DISTINCT FROM 'verified'
  THEN RAISE EXCEPTION 'B7_ADVERTISER_VERIFICATION_REQUIRED_BEFORE_PAYMENT'
    USING ERRCODE='23514'; END IF;
END $assert$;

CREATE FUNCTION private.b7_t034_confirmed_payment_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private'
AS $payment$
BEGIN
  IF NEW.status='confirmed' THEN
    IF NOT private.p4_owner_allowed()
    THEN RAISE EXCEPTION 'OWNER_AAL2_REQUIRED' USING ERRCODE='42501'; END IF;
    PERFORM private.b7_t034_assert_advertiser_verified(NEW.campaign_id);
  END IF;
  RETURN NEW;
END $payment$;

-- Every original confirmed-payment INSERT/UPDATE passes this trigger,
-- regardless of which original Owner payment RPC, SDK or SQL route is used.
CREATE TRIGGER b7_t034_payment_verified_gate
BEFORE INSERT OR UPDATE OF status, campaign_id ON public.ad_payments
FOR EACH ROW EXECUTE FUNCTION private.b7_t034_confirmed_payment_guard();

CREATE FUNCTION private.b7_t034_paid_state_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private'
AS $paid$
BEGIN
  -- Old Owner RPC guards cover transitions, but privileged direct DML must
  -- also fail closed for HIGH-risk approval/payment_pending/LIVE. Re-writing
  -- an unchanged historical payment_pending row is not a NEW transition.
  IF NEW.status IN ('approved','payment_pending','live')
     AND (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    IF NOT private.p4_owner_allowed()
    THEN RAISE EXCEPTION 'OWNER_AAL2_REQUIRED' USING ERRCODE='42501'; END IF;
    IF EXISTS (
      SELECT 1 FROM public.advertisers a
      WHERE a.id=NEW.advertiser_id AND a.risk_level='high'
        AND a.verification_state IS DISTINCT FROM 'verified'
    ) THEN
      RAISE EXCEPTION 'ENHANCED_VERIFICATION_REQUIRED'
        USING ERRCODE='23514';
    END IF;
    IF NEW.status='live' AND NOT EXISTS (
      SELECT 1 FROM public.ad_payments p
      WHERE p.campaign_id=NEW.id AND p.status='confirmed' AND p.amount_minor>0
    ) THEN
      RAISE EXCEPTION 'B7_CONFIRMED_PAYMENT_REQUIRED_BEFORE_LIVE'
        USING ERRCODE='23514';
    END IF;
  END IF;

  IF (NEW.status='paid' AND
        (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM NEW.status
            OR OLD.paid_at IS DISTINCT FROM NEW.paid_at))
      OR (NEW.paid_at IS NOT NULL AND
        (TG_OP='INSERT' OR OLD.paid_at IS DISTINCT FROM NEW.paid_at)) THEN
    IF NOT private.p4_owner_allowed()
    THEN RAISE EXCEPTION 'OWNER_AAL2_REQUIRED' USING ERRCODE='42501'; END IF;
    PERFORM private.b7_t034_assert_advertiser_verified(NEW.id);
    IF NOT EXISTS (
      SELECT 1 FROM public.ad_payments p
      WHERE p.campaign_id=NEW.id AND p.status='confirmed' AND p.amount_minor>0
    ) THEN RAISE EXCEPTION 'B7_CONFIRMED_PAYMENT_REQUIRED_BEFORE_PAID'
         USING ERRCODE='23514'; END IF;
  END IF;
  RETURN NEW;
END $paid$;

-- Covers direct Paid-state attempts that bypass the original payment RPC.
CREATE TRIGGER b7_t034_paid_state_verified_gate
BEFORE INSERT OR UPDATE OF status, paid_at ON public.ad_campaigns
FOR EACH ROW EXECUTE FUNCTION private.b7_t034_paid_state_guard();

REVOKE ALL ON FUNCTION private.b7_t034_assert_advertiser_verified(uuid)
  FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION private.b7_t034_confirmed_payment_guard()
  FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION private.b7_t034_paid_state_guard()
  FROM PUBLIC,anon,authenticated;
-- Intentionally NO GRANT, NO public RPC, NO data modification, NO deployment.
COMMIT;
