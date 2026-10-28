\set ON_ERROR_STOP on
-- T071 C2 / families Advertising and Payments:
-- Execute original B7 REVIEW_ONLY triggers/functions only in disposable real PG17.
-- No merchant, no real receipt, no production network, no charge.
DO $gate$
BEGIN
 IF current_database()<>'jb_t071_c2_ads' OR
 (SELECT count(*) FROM public.ad_campaigns)<>4 OR
 NOT EXISTS (SELECT 1 FROM public.ad_campaigns
  WHERE id='30000000-0000-0000-0000-000000000001'::uuid AND status='approved')
 THEN RAISE EXCEPTION 'T071_C2_B7_WRONG_DATABASE_OR_SOURCE_FIXTURE';END IF;
END $gate$;

-- Baseline original B7 approvals intact, but no synthetic money confirmed.
DO $before$
BEGIN
 IF EXISTS(SELECT 1 FROM public.ad_campaigns WHERE status IN ('paid','live')) OR
 EXISTS(SELECT 1 FROM public.ad_payments WHERE status='confirmed')
 THEN RAISE EXCEPTION 'C2_B7_BEFORE_ALREADY_PAID_LIVE'; END IF;
END $before$;

-- Existing Owner/AAL2 model simulated ONLY inside disposable B7 fixture.
SELECT set_config('b7.test_owner','enabled',false);
SELECT public.jb_ad_set_approved_quote_internal(
 '30000000-0000-0000-0000-000000000001'::uuid,
 50000,'C2-DISPOSABLE-AGREEMENT'
);
-- Preserve order: quote must predate consent in the fixture. This is
-- deliberately fake test evidence, NEVER an assertion money was received.
UPDATE public.ad_campaigns
SET agreed_terms_recorded_at=now()-interval '30 minutes'
WHERE id='30000000-0000-0000-0000-000000000001'::uuid;

-- Actual PG17 payment storage outage: NEW payment writes fail at SQL engine.
-- Constrain this disposable table only; existing records remain intact.
ALTER TABLE public.ad_payments
 ADD CONSTRAINT t071_c2_payment_storage_down CHECK(false) NOT VALID;
DO $fault$
DECLARE got boolean:=false; msg text;
BEGIN
 BEGIN
  PERFORM public.jb_ad_confirm_manual_payment_internal(
   '30000000-0000-0000-0000-000000000001'::uuid,
   'NOT-REAL-C2-REF-0001',50000,'upi',
   now()-interval '2 minutes','NOT-REAL-C2-EVIDENCE-0001',
   'NOT-REAL-C2-CONSENT-0001',now()-interval '10 minutes',
   'No money moved: C2 isolated payment failure drill','CONFIRM'
  );
 EXCEPTION WHEN check_violation THEN got:=true;
 WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  RAISE EXCEPTION 'C2_B7_PAYMENT_OUTAGE_GUARD_UNEXPECTED: %',msg;
 END;
 IF NOT got THEN RAISE EXCEPTION 'C2_B7_PAYMENT_FAULT_NOT_PROVEN';END IF;
END $fault$;
\echo T071_C2_REAL_PG17_PAYMENT_WRITE_FAILURE=PASS

DO $audit$
DECLARE got boolean:=false;msg text;
BEGIN
 IF EXISTS (SELECT 1 FROM public.ad_campaigns
    WHERE status IN('paid','live')) OR
 EXISTS (SELECT 1 FROM public.ad_payments WHERE status='confirmed')
 THEN RAISE EXCEPTION 'C2_B7_AMBIGUOUS_PAYMENT_PROMOTED_AD'; END IF;
 -- Genuine existing B7 triggers deny status forgery despite a local fault.
 BEGIN
  UPDATE public.ad_campaigns SET status='live',paid_at=now(),
    non_refund_accepted_at=now()
  WHERE id='30000000-0000-0000-0000-000000000001'::uuid;
 EXCEPTION WHEN OTHERS THEN
  got:=true;
 END;
 IF NOT got THEN RAISE EXCEPTION 'C2_B7_DIRECT_LIVE_BYPASS';END IF;
 IF (SELECT status FROM public.ad_campaigns
  WHERE id='30000000-0000-0000-0000-000000000001'::uuid)<>'approved'
 THEN RAISE EXCEPTION 'C2_B7_APPROVAL_BROKEN_BY_OUTAGE';END IF;
END $audit$;
\echo T071_C2_AD_CANNOT_GO_LIVE_DURING_PAYMENT_OUTAGE=PASS

-- Repair disposable storage only. Lack of real receipt is still fail-closed.
ALTER TABLE public.ad_payments DROP CONSTRAINT t071_c2_payment_storage_down;
DO $recovery$
DECLARE denied boolean:=false;msg text;
BEGIN
 BEGIN
  PERFORM public.jb_ad_confirm_manual_payment_internal(
   '30000000-0000-0000-0000-000000000001'::uuid,
   '',50000,'upi',now(),'', '',now(),
   'missing independent receipt must be rejected','CONFIRM');
 EXCEPTION WHEN OTHERS THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'C2_B7_NO_RECEIPT_ACCEPTED_AFTER_RECOVERY';END IF;
 IF EXISTS(SELECT 1 FROM public.ad_campaigns WHERE status IN('paid','live'))
 OR EXISTS(SELECT 1 FROM public.ad_payments WHERE status='confirmed')
 THEN RAISE EXCEPTION 'C2_B7_POST_RECOVERY_FALSE_PAID';END IF;
END $recovery$;
\echo T071_C2_PAYMENT_STORAGE_RECOVERED_BUT_NO_RECEIPT_STILL_DENIED=PASS
\echo T071_C2_B7_ORIGINAL_PAYMENT_AND_LIVE_TRIGGERS_EXERCISED=PASS
\echo T071_C2_B7_ISOLATED_SYNTHETIC_PAYMENT_AD_GUARD=PASS
\echo T071_C2_REAL_BANK_SETTLEMENT_OR_HOSTED_E8=NOT_TESTED
\echo T071_FINAL_PASS_LOCK=false
