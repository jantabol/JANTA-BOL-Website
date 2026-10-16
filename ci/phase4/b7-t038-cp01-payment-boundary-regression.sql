\set ON_ERROR_STOP on
-- T038 CP01 E1: genuinely executed disposable PostgreSQL17 synthetic data.
-- NO REAL bank payment, consent, Founder AAL2, provider or hosted Supabase.
BEGIN;
DO $negative$
DECLARE msg text;
 c1 uuid:='30000000-0000-0000-0000-000000000001';
 c2 uuid:='30000000-0000-0000-0000-000000000002';
 c4 uuid:='30000000-0000-0000-0000-000000000004';
BEGIN
 PERFORM set_config('b7.test_owner','enabled',true);
 -- Attempt confirmation on REQUESTED (not approved) campaign.
 BEGIN
  PERFORM public.jb_ad_confirm_manual_payment_internal(
  c4,'SYNTHETIC-PRE-APPROVAL-0001',50000,'upi',now(),
  'SYNTHETIC-NO-BANK','CI-NO-BUYER-ACCEPT',now()-interval '1 minute',
  'No real bank receipt in CI','CONFIRM');
  RAISE EXCEPTION 'CONFIRMED_BEFORE_OWNER_APPROVAL';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'OWNER_APPROVAL_REQUIRED_BEFORE_PAYMENT'
  THEN RAISE EXCEPTION 'ADS035_WRONG_GUARD %',msg;END IF;
 END;
 -- Approved campaign with NO documented price+terms cannot confirm.
 BEGIN
  PERFORM public.jb_ad_confirm_manual_payment_internal(
  c1,'SYNTHETIC-NO-QUOTE-0001',50000,'upi',now(),
  'SYNTHETIC-NO-BANK','CI-NO-BUYER-ACCEPT',now()-interval '1 minute',
  'No real bank receipt in CI','CONFIRM');
  RAISE EXCEPTION 'CONFIRMED_WITHOUT_TERMS';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'APPROVED_PRICE_TERMS_MISMATCH'
  THEN RAISE EXCEPTION 'ADS036_QUOTE_GUARD_WRONG %',msg;END IF;
 END;
 PERFORM public.jb_ad_set_approved_quote_internal(c1,50000,'SYNTHETIC-TERMS-50000');
 PERFORM public.jb_ad_set_approved_quote_internal(c2,28000,'SYNTHETIC-HIGH-RISK-TERMS');
 -- Explicit non-refundable acceptance is not optional.
 BEGIN
  PERFORM public.jb_ad_confirm_manual_payment_internal(
  c1,'SYNTHETIC-NO-CONSENT-0001',50000,'upi',now(),
  'SYNTHETIC-NO-BANK','',now()-interval '1 minute',
  'No real bank receipt in CI','CONFIRM');
  RAISE EXCEPTION 'CONFIRMED_WITHOUT_ACCEPTANCE';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'MANUAL_PAYMENT_EVIDENCE_REQUIRED'
  THEN RAISE EXCEPTION 'ADS036_ACCEPTANCE_GUARD_WRONG %',msg;END IF;
 END;
 -- Must not accept an amount that was not received.
 BEGIN
  PERFORM public.jb_ad_confirm_manual_payment_internal(
  c1,'SYNTHETIC-ZERO-PAYMENT-0001',0,'upi',now(),
  'SYNTHETIC-NO-BANK','CI-ACCEPT-ONLY',now()-interval '1 minute',
  'No real bank receipt in CI','CONFIRM');
  RAISE EXCEPTION 'CONFIRMED_ZERO_AMOUNT';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'INVALID_PAYMENT_AMOUNT'
  THEN RAISE EXCEPTION 'ADS039_ZERO_GUARD_WRONG %',msg;END IF;
 END;
 -- A method/provider kind not vetted in the manual flow cannot be accepted.
 BEGIN
  PERFORM public.jb_ad_confirm_manual_payment_internal(
  c1,'SYNTHETIC-UNSAFE-METHOD-0001',50000,'crypto',now(),
  'SYNTHETIC-NO-BANK','CI-ACCEPT-ONLY',now()-interval '1 minute',
  'No real bank receipt in CI','CONFIRM');
  RAISE EXCEPTION 'CONFIRMED_WRONG_PAYMENT_METHOD';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'MANUAL_PAYMENT_EVIDENCE_REQUIRED'
  THEN RAISE EXCEPTION 'ADS039_METHOD_GUARD_WRONG %',msg;END IF;
 END;
 -- Acceptance must precede receipt, not be created during Owner confirmation.
 BEGIN
  PERFORM public.jb_ad_confirm_manual_payment_internal(
  c1,'SYNTHETIC-ACCEPT-AFTER-RECEIPT',50000,'bank',
  now()-interval '5 minutes','SYNTHETIC-NO-BANK',
  'CI-ACCEPT-AFTER-RECEIPT',now()-interval '2 minutes',
  'No real bank receipt in CI','CONFIRM');
  RAISE EXCEPTION 'CONSENT_AFTER_RECEIPT_ACCEPTED';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'TERMS_ACCEPTANCE_CHRONOLOGY_INVALID'
  THEN RAISE EXCEPTION 'ADS036_CHRONOLOGY_WRONG %',msg;END IF;
 END;
 -- HIGH-risk original verified-state guard must reject pending identity.
 BEGIN
  PERFORM public.jb_ad_confirm_manual_payment_internal(
  c2,'SYNTHETIC-UNVERIFIED-HIGH',28000,'bank',now(),
  'SYNTHETIC-NO-BANK','CI-ACCEPT-ONLY',now()-interval '1 minute',
  'No real bank receipt in CI','CONFIRM');
  RAISE EXCEPTION 'HIGH_RISK_RECEIPT_CONFIRMED';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'ADVERTISER_VERIFICATION_REQUIRED'
  THEN RAISE EXCEPTION 'ADS038_VERIFICATION_WRONG %',msg;END IF;
 END;
 -- Deliberate invoice reference only, never a confirmed bank record.
 IF EXISTS(SELECT 1 FROM public.ad_payments WHERE status='confirmed')
  OR EXISTS(SELECT 1 FROM public.ad_campaigns
       WHERE status IN('paid','live') OR paid_at IS NOT NULL)
 THEN RAISE EXCEPTION 'FAILED_NEGATIVE_CASE_LEFT_PAYMENT_OR_LIVE';END IF;
 RAISE NOTICE 'T038 CP01 PASS ADS035/036/038/039: pre-approval, missing consent/terms, zero, bad method, late acceptance, high-risk all refused';
END $negative$;

DO $only_valid_synthetic$
DECLARE c1 uuid:='30000000-0000-0000-0000-000000000001';
 c3 uuid:='30000000-0000-0000-0000-000000000003';
 n_before int; n_after int; msg text;
BEGIN
 -- This is a SYNTHETIC fixture with invented receipt and consent strings,
 -- NOT a bank receipt or provider reconciliation.
 PERFORM public.jb_ad_confirm_manual_payment_internal(
 c1,'CI-UTR-Case-00001',50000,'upi',now(),
 'CI-NO-REAL-BANK-REFERENCE','CI-NO-REAL-CONSENT',now(),
 'Synthetic only - no bank was contacted','CONFIRM');
 IF (SELECT count(*) FROM public.ad_payments WHERE campaign_id=c1 AND status='confirmed')<>1
 OR (SELECT status FROM public.ad_campaigns WHERE id=c1)<>'paid'
 THEN RAISE EXCEPTION 'SYNTHETIC_VALID_NOT_MARKED_PAID';END IF;
 SELECT count(*) INTO n_before FROM public.ad_history WHERE campaign_id=c1;
 PERFORM public.jb_ad_set_approved_quote_internal(c3,50000,'SYNTHETIC-OTHER-TERMS-50000');
 BEGIN
  PERFORM public.jb_ad_confirm_manual_payment_internal(
  c3,'ci-utr-case-00001',50000,'upi',now(),
  'CI-NO-REAL-BANK-REFERENCE','CI-NO-REAL-CONSENT',now(),
  'Synthetic only - no bank was contacted','CONFIRM');
  RAISE EXCEPTION 'CASE_CHANGED_DUPLICATE_UTR_ACCEPTED';
 EXCEPTION WHEN unique_violation THEN NULL;
 END;
 IF (SELECT count(*) FROM public.ad_payments WHERE status='confirmed')<>1
 OR (SELECT count(*) FROM public.ad_history WHERE campaign_id=c1)<>n_before
 OR (SELECT status FROM public.ad_campaigns WHERE id=c3)='paid'
 THEN RAISE EXCEPTION 'UTR_REPLAY_CHANGED_FINANCIAL_STATE';END IF;
 RAISE NOTICE 'T038 CP01 PASS ADS037/039: EXACT one synthetic evidence tuple, duplicate case-insensitive UTR refused, immutable audit';
END $only_valid_synthetic$;
ROLLBACK;
