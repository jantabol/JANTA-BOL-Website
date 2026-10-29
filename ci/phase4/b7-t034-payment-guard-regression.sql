\set ON_ERROR_STOP on
-- B7 T034 ADS-008 isolated rollback; fail-closed both legacy payment RPCs.
BEGIN;
DO $test$
DECLARE msg text; before_pay int;before_history int; s text;
BEGIN
 PERFORM set_config('b7.test_owner','enabled',true);
 SELECT count(*) INTO before_pay FROM public.ad_payments;
 SELECT count(*) INTO before_history FROM public.ad_history;

 -- FIRST FIX: both exact historical Owner payment RPCs are denied before
 -- touching the existing HIGH-risk payment_pending/verification=PENDING row.
 BEGIN
   PERFORM public.jb_ad_confirm_payment_internal(
    '20000000-0000-4000-8000-000000000001','FAKE-HIGH-OLD-RPC',50000);
   RAISE EXCEPTION 'HIGH_RISK_OLD_CONFIRM_BYPASS';
 EXCEPTION WHEN OTHERS THEN
   GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
   IF msg<>'B7_ADVERTISER_VERIFICATION_REQUIRED_BEFORE_PAYMENT'
   THEN RAISE EXCEPTION 'UNEXPECTED_CONFIRM_PATH_RESULT: %',msg;END IF;
 END;
 BEGIN
   PERFORM public.jb_ad_record_payment_internal(
    '20000000-0000-4000-8000-000000000001','FAKE-HIGH-SECOND-RPC',
    'confirmed',50000,'INR',true);
   RAISE EXCEPTION 'HIGH_RISK_OLD_RECORD_BYPASS';
 EXCEPTION WHEN OTHERS THEN
   GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
   IF msg<>'B7_ADVERTISER_VERIFICATION_REQUIRED_BEFORE_PAYMENT'
   THEN RAISE EXCEPTION 'UNEXPECTED_RECORD_PATH_RESULT: %',msg;END IF;
 END;
 -- NORMAL pending must also be guarded by verified before payment.
 BEGIN
  PERFORM public.jb_ad_record_payment_internal(
   '20000000-0000-4000-8000-000000000002','FAKE-NORMAL-NOT-VERIFIED',
   'confirmed',20000,'INR',true);
  RAISE EXCEPTION 'NORMAL_UNVERIFIED_BYPASS';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'B7_ADVERTISER_VERIFICATION_REQUIRED_BEFORE_PAYMENT'
  THEN RAISE EXCEPTION 'UNEXPECTED_NORMAL_PENDING_RESULT: %',msg;END IF;
 END;
 IF (SELECT count(*) FROM public.ad_payments)<>before_pay OR
    (SELECT count(*) FROM public.ad_history)<>before_history OR EXISTS(
     SELECT 1 FROM public.ad_campaigns
     WHERE id IN ('20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002')
       AND (paid_at IS NOT NULL OR status='paid'))
 THEN RAISE EXCEPTION 'DENIED_PAYMENT_CHANGED_STATE_OR_AUDIT';END IF;
 RAISE NOTICE 'PASS [ADS-008] historical high-risk and normal pending blocked in BOTH old RPCs, no writes';

 -- Direct insert bypass also intercepted, even via privileged connection.
 BEGIN
  INSERT INTO public.ad_payments(campaign_id,provider_ref,status,amount_minor)
  VALUES('20000000-0000-4000-8000-000000000001','FAKE-DIRECT','confirmed',50000);
  RAISE EXCEPTION 'DIRECT_PAYMENT_BYPASS';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'B7_ADVERTISER_VERIFICATION_REQUIRED_BEFORE_PAYMENT'
  THEN RAISE EXCEPTION 'UNEXPECTED_DIRECT_PAYMENT_RESULT: %',msg;END IF;
 END;
 BEGIN
  UPDATE public.ad_campaigns SET status='paid',paid_at=now()
  WHERE id='20000000-0000-4000-8000-000000000001';
  RAISE EXCEPTION 'DIRECT_PAID_STATE_BYPASS';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'B7_ADVERTISER_VERIFICATION_REQUIRED_BEFORE_PAYMENT'
  THEN RAISE EXCEPTION 'UNEXPECTED_DIRECT_STATE_RESULT: %',msg;END IF;
 END;
 -- Verified but no confirmed payment cannot leap directly to PAID.
 BEGIN
  UPDATE public.ad_campaigns SET status='paid',paid_at=now()
  WHERE id='20000000-0000-4000-8000-000000000003';
  RAISE EXCEPTION 'NO_LEDGER_DIRECT_PAID_BYPASS';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'B7_CONFIRMED_PAYMENT_REQUIRED_BEFORE_PAID'
  THEN RAISE EXCEPTION 'UNEXPECTED_MISSING_LEDGER_RESULT: %',msg;END IF;
 END;

 -- Owner AAL2 remains mandatory even for already VERIFIED businesses.
 PERFORM set_config('b7.test_owner','',true);
 BEGIN
   PERFORM public.jb_ad_confirm_payment_internal(
    '20000000-0000-4000-8000-000000000003','FAKE-ANON',10000);
   RAISE EXCEPTION 'OWNER_REQUIRED_BYPASS';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'OWNER_AAL2_REQUIRED'
  THEN RAISE EXCEPTION 'UNEXPECTED_UNAUTHORIZED_RESULT: %',msg;END IF;
 END;
 PERFORM set_config('b7.test_owner','enabled',true);

 -- Positive preservation: existing Owner RPCs still work for verified
 -- normal/high fixtures; audit and historical payment schema unchanged.
 PERFORM public.jb_ad_confirm_payment_internal(
  '20000000-0000-4000-8000-000000000003','FAKE-VERIFIED-NORMAL',10000);
 PERFORM public.jb_ad_record_payment_internal(
  '20000000-0000-4000-8000-000000000004','FAKE-VERIFIED-HIGH',
  'confirmed',12000,'INR',true);
 IF (SELECT count(*) FROM public.ad_payments WHERE status='confirmed')<>2
 OR (SELECT count(*) FROM public.ad_campaigns WHERE status='paid' AND paid_at IS NOT NULL)<>2
 OR (SELECT count(*) FROM public.ad_history WHERE event_type LIKE 'payment_%')<>2
 THEN RAISE EXCEPTION 'LEGACY_VERIFIED_POSITIVE_BROKEN';END IF;
 IF EXISTS(SELECT 1 FROM public.ad_campaigns
    WHERE id='20000000-0000-4000-8000-000000000001'
      AND (status<>'payment_pending' OR paid_at IS NOT NULL))
 THEN RAISE EXCEPTION 'HISTORICAL_HIGH_RISK_WAS_MUTATED';END IF;
 RAISE NOTICE 'PASS [ADS-008] both verified old RPC positive, direct bypass denied, Owner AAL2 retained';
END $test$;
ROLLBACK;
-- No fixture survives in GitHub Actions disposable Postgres.
