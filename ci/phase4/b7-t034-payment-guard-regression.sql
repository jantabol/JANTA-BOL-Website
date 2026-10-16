\set ON_ERROR_STOP on
-- B7 T034 ADS-008 isolated rollback; fail-closed both legacy payment RPCs.
BEGIN;
DO $test$
DECLARE msg text; before_pay int;before_history int; s text; confirmed_payment_id uuid; before_updated timestamptz;
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
 -- Privileged direct UPDATE must not bypass high-risk approval/LIVE
 -- even when the old Owner transition RPC was not called.
 BEGIN
  UPDATE public.ad_campaigns SET status='approved'
  WHERE id='20000000-0000-4000-8000-000000000001';
  RAISE EXCEPTION 'DIRECT_HIGH_RISK_APPROVAL_BYPASS';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'ENHANCED_VERIFICATION_REQUIRED'
  THEN RAISE EXCEPTION 'UNEXPECTED_DIRECT_APPROVAL: %',msg;END IF;
 END;
 BEGIN
  UPDATE public.ad_campaigns SET status='live'
  WHERE id='20000000-0000-4000-8000-000000000001';
  RAISE EXCEPTION 'DIRECT_HIGH_RISK_LIVE_BYPASS';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'ENHANCED_VERIFICATION_REQUIRED'
  THEN RAISE EXCEPTION 'UNEXPECTED_DIRECT_LIVE: %',msg;END IF;
 END;
 BEGIN
  UPDATE public.ad_campaigns SET status='live'
  WHERE id='20000000-0000-4000-8000-000000000003';
  RAISE EXCEPTION 'DIRECT_NO_LEDGER_LIVE_BYPASS';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'B7_CONFIRMED_PAYMENT_REQUIRED_BEFORE_LIVE'
  THEN RAISE EXCEPTION 'UNEXPECTED_DIRECT_NO_LEDGER_LIVE: %',msg;END IF;
 END;
 IF EXISTS (SELECT 1 FROM public.ad_campaigns
    WHERE id='20000000-0000-4000-8000-000000000001'
      AND status<>'payment_pending')
 THEN RAISE EXCEPTION 'DENIED_DIRECT_TRANSITION_MUTATED_HISTORICAL_STATE'; END IF;
 RAISE NOTICE 'PASS [ADS-008] direct privileged high-risk approval/live and verified no-payment LIVE rejected';
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
 -- LEDGER IMMUTABILITY RED tests: a previously confirmed receipt MUST NOT
 -- be re-bound to ANOTHER VERIFIED campaign or silently changed/deleted.
 -- This is more subtle than the existing unverified-advertiser guard:
 -- both campaigns are valid, but moving the receipt launders payment evidence.
 SELECT id INTO STRICT confirmed_payment_id
 FROM public.ad_payments WHERE provider_ref='FAKE-VERIFIED-NORMAL';
 -- Existing LIVE schema has updated_at; it is NOT financial receipt
 -- identity. Regression: service-side timestamp-only maintenance was not
 -- subject to Owner AAL2 in the pre-existing trigger. Preserve behavior.
 SELECT updated_at INTO STRICT before_updated
 FROM public.ad_payments WHERE id=confirmed_payment_id;
 PERFORM set_config('b7.test_owner','',true);
 UPDATE public.ad_payments
 SET updated_at=before_updated + interval '1 second'
 WHERE id=confirmed_payment_id;
 IF (SELECT updated_at FROM public.ad_payments
     WHERE id=confirmed_payment_id) IS DISTINCT FROM
        before_updated + interval '1 second'
 THEN RAISE EXCEPTION 'NONFINANCIAL_UPDATED_AT_MAINTENANCE_BLOCKED';END IF;
 PERFORM set_config('b7.test_owner','enabled',true);
 RAISE NOTICE 'PASS [ADS-008] confirmed ledger updated_at-only legacy maintenance preserved';
 BEGIN
   UPDATE public.ad_payments
     SET campaign_id='20000000-0000-4000-8000-000000000004'
     WHERE id=confirmed_payment_id;
   RAISE EXCEPTION 'CONFIRMED_LEDGER_CAMPAIGN_REBIND_BYPASS';
 EXCEPTION WHEN OTHERS THEN
   GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
   IF msg<>'B7_CONFIRMED_LEDGER_IMMUTABLE'
   THEN RAISE EXCEPTION 'UNEXPECTED_CONFIRMED_REBIND: %',msg;END IF;
 END;
 BEGIN
   UPDATE public.ad_payments SET amount_minor=20000
    WHERE id=confirmed_payment_id;
   RAISE EXCEPTION 'CONFIRMED_LEDGER_AMOUNT_MUTATION_BYPASS';
 EXCEPTION WHEN OTHERS THEN
   GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
   IF msg<>'B7_CONFIRMED_LEDGER_IMMUTABLE'
   THEN RAISE EXCEPTION 'UNEXPECTED_CONFIRMED_AMOUNT_CHANGE: %',msg;END IF;
 END;
 BEGIN
   UPDATE public.ad_payments SET status='failed'
    WHERE id=confirmed_payment_id;
   RAISE EXCEPTION 'CONFIRMED_LEDGER_DOWNGRADE_BYPASS';
 EXCEPTION WHEN OTHERS THEN
   GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
   IF msg<>'B7_CONFIRMED_LEDGER_IMMUTABLE'
   THEN RAISE EXCEPTION 'UNEXPECTED_CONFIRMED_DOWNGRADE: %',msg;END IF;
 END;
 BEGIN
   UPDATE public.ad_payments SET provider_ref='FAKE-FORGED-RECEIPT'
    WHERE id=confirmed_payment_id;
   RAISE EXCEPTION 'CONFIRMED_LEDGER_RECEIPT_REPLACEMENT_BYPASS';
 EXCEPTION WHEN OTHERS THEN
   GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
   IF msg<>'B7_CONFIRMED_LEDGER_IMMUTABLE'
   THEN RAISE EXCEPTION 'UNEXPECTED_RECEIPT_MUTATION: %',msg;END IF;
 END;
 BEGIN
   UPDATE public.ad_payments SET currency='USD'
    WHERE id=confirmed_payment_id;
   RAISE EXCEPTION 'CONFIRMED_LEDGER_CURRENCY_MUTATION_BYPASS';
 EXCEPTION WHEN OTHERS THEN
   GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
   IF msg<>'B7_CONFIRMED_LEDGER_IMMUTABLE'
   THEN RAISE EXCEPTION 'UNEXPECTED_CONFIRMED_CURRENCY_CHANGE: %',msg;END IF;
 END;
 BEGIN
   DELETE FROM public.ad_payments WHERE id=confirmed_payment_id;
   RAISE EXCEPTION 'CONFIRMED_LEDGER_DELETE_BYPASS';
 EXCEPTION WHEN OTHERS THEN
   GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
   IF msg<>'B7_CONFIRMED_LEDGER_IMMUTABLE'
   THEN RAISE EXCEPTION 'UNEXPECTED_CONFIRMED_DELETE: %',msg;END IF;
 END;
 IF (SELECT count(*) FROM public.ad_payments WHERE status='confirmed')<>2
 OR NOT EXISTS (
   SELECT 1 FROM public.ad_payments p
   WHERE p.id=confirmed_payment_id
     AND p.campaign_id='20000000-0000-4000-8000-000000000003'
     AND p.provider_ref='FAKE-VERIFIED-NORMAL'
     AND p.amount_minor=10000 AND p.currency='INR'
 ) THEN RAISE EXCEPTION 'LEDGER_IMMUTABILITY_NEGATIVE_CHANGED_PAYMENT';END IF;
 RAISE NOTICE 'PASS [ADS-008] confirmed ledger campaign/status/amount/receipt/currency/delete mutation denied';
 -- Preserve normal business continuation: Owner+AAL2 can move verified
 -- campaign (with confirmed positive ledger) to LIVE and back to PAID.
 UPDATE public.ad_campaigns SET status='live'
 WHERE id IN ('20000000-0000-4000-8000-000000000003',
              '20000000-0000-4000-8000-000000000004');
 IF (SELECT count(*) FROM public.ad_campaigns WHERE status='live')<>2
 THEN RAISE EXCEPTION 'VERIFIED_OWNER_VALID_LIVE_BLOCKED'; END IF;
 UPDATE public.ad_campaigns SET status='paid'
 WHERE id IN ('20000000-0000-4000-8000-000000000003',
              '20000000-0000-4000-8000-000000000004');
 IF (SELECT count(*) FROM public.ad_campaigns WHERE status='paid')<>2
 THEN RAISE EXCEPTION 'VERIFIED_OWNER_PAID_REVERSION_BROKEN'; END IF;
 -- A paid campaign binds payment/history to the original advertiser.
 -- Changing advertiser_id with an unchanged paid status must not launder
 -- approved ledger receipts onto an unverified advertiser (direct SQL).
 BEGIN
  UPDATE public.ad_campaigns SET advertiser_id='10000000-0000-4000-8000-000000000002'
  WHERE id='20000000-0000-4000-8000-000000000003';
  RAISE EXCEPTION 'PAID_CAMPAIGN_ADVERTISER_REBIND_BYPASS';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'APPROVED_CAMPAIGN_ADVERTISER_REASSIGN_DENIED'
  THEN RAISE EXCEPTION 'UNEXPECTED_PAID_REBIND_RESULT: %',msg;END IF;
 END;
 -- A PAUSED campaign with a previous payment/approval MUST keep
 -- the original advertiser identity even though status is not 'paid'.
 UPDATE public.ad_campaigns SET status='paused'
 WHERE id='20000000-0000-4000-8000-000000000003';
 BEGIN
  UPDATE public.ad_campaigns SET advertiser_id='10000000-0000-4000-8000-000000000002'
  WHERE id='20000000-0000-4000-8000-000000000003';
  RAISE EXCEPTION 'PAUSED_PAID_ADVERTISER_REBIND_BYPASS';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'APPROVED_CAMPAIGN_ADVERTISER_REASSIGN_DENIED'
  THEN RAISE EXCEPTION 'UNEXPECTED_PAUSED_REBIND_RESULT: %',msg;END IF;
 END;
 UPDATE public.ad_campaigns SET status='paid'
 WHERE id='20000000-0000-4000-8000-000000000003';
 -- Historical HIGH-risk payment_pending must also remain bound to the
 -- original identity, even if only advertiser_id is updated.
 BEGIN
  UPDATE public.ad_campaigns SET advertiser_id='10000000-0000-4000-8000-000000000003'
  WHERE id='20000000-0000-4000-8000-000000000001';
  RAISE EXCEPTION 'HIGH_PENDING_ADVERTISER_REBIND_BYPASS';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'APPROVED_CAMPAIGN_ADVERTISER_REASSIGN_DENIED'
  THEN RAISE EXCEPTION 'UNEXPECTED_HIGH_REBIND_RESULT: %',msg;END IF;
 END;
 IF (SELECT advertiser_id FROM public.ad_campaigns
     WHERE id='20000000-0000-4000-8000-000000000003')
      <> '10000000-0000-4000-8000-000000000003'
 OR (SELECT advertiser_id FROM public.ad_campaigns
     WHERE id='20000000-0000-4000-8000-000000000001')
      <> '10000000-0000-4000-8000-000000000001'
 THEN RAISE EXCEPTION 'ADVERTISER_REBIND_CHANGED_PAYMENT_IDENTITY'; END IF;
 RAISE NOTICE 'PASS [ADS-008 reassignment] paid ledger and historical pending advertiser identity locked';
 -- A harmless same-status write of the historical high-risk pending record
 -- is NOT an illegal new transition and must not corrupt its state.
 UPDATE public.ad_campaigns SET status='payment_pending'
 WHERE id='20000000-0000-4000-8000-000000000001';
 IF (SELECT status FROM public.ad_campaigns
     WHERE id='20000000-0000-4000-8000-000000000001') <> 'payment_pending'
 THEN RAISE EXCEPTION 'HISTORICAL_SAME_STATUS_WAS_REJECTED'; END IF;
 RAISE NOTICE 'PASS [ADS-008] verified Owner LIVE positive and historical unchanged-status preserved';
 RAISE NOTICE 'PASS [ADS-008] both verified old RPC positive, direct bypass denied, Owner AAL2 retained';
END $test$;
ROLLBACK;
-- No fixture survives in GitHub Actions disposable Postgres.
