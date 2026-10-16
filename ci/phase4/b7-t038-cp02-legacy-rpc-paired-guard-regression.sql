\set ON_ERROR_STOP on
-- T038 CP02: REAL PostgreSQL17, disposable synthetic dataset ONLY.
-- Paired existing *old* LIVE Owner payment bodies + existing T034 guard
-- + existing REVIEW manual receipt requirement. ALL writes rolled back.
BEGIN;
DO $no_leak$
BEGIN
 IF has_function_privilege('anon',
 'public.jb_ad_confirm_payment_internal(uuid,text,bigint)','EXECUTE')
 OR has_function_privilege('anon',
 'public.jb_ad_record_payment_internal(uuid,text,text,bigint,text,boolean)','EXECUTE')
 THEN RAISE EXCEPTION 'OLD_PAYMENT_ANONYMOUS_RPC_LEAK';END IF;
 IF NOT has_function_privilege('authenticated',
 'public.jb_ad_confirm_payment_internal(uuid,text,bigint)','EXECUTE')
 THEN RAISE EXCEPTION 'OLD_SOURCE_AUTH_PRIVILEGE_DRIFT';END IF;
 RAISE NOTICE 'CP02 T038 PASS anon cannot execute both old payment RPCs';
END $no_leak$;

DO $negative$
DECLARE c1 uuid:='30000000-0000-0000-0000-000000000001';
 c2 uuid:='30000000-0000-0000-0000-000000000002';
 original_history int;msg text;
BEGIN
 PERFORM set_config('b7.test_owner','enabled',true);
 SELECT count(*) INTO original_history FROM public.ad_history;
 -- The two OLD actual LIVE function signatures must be stopped at one
 -- canonical receipt+consent trigger, despite Owner's valid AAL2.
 BEGIN
  PERFORM public.jb_ad_confirm_payment_internal(
   c1,'NO-REAL-UTR-OLD-1',50000);
  RAISE EXCEPTION 'OLD_THREE_FIELD_CONFIRMED_WITHOUT_RECEIPT';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg <> 'MANUAL_PAYMENT_EVIDENCE_REQUIRED'
  THEN RAISE EXCEPTION 'OLD_CONFIRM_FIRST_DIVERGENCE: %',msg;END IF;
 END;
 BEGIN
  PERFORM public.jb_ad_record_payment_internal(
   c1,'NO-REAL-UTR-OLD-2','confirmed',50000,'INR',true);
  RAISE EXCEPTION 'OLD_FLAG_CONFIRM_WITHOUT_BUYER_ACCEPTANCE';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg <> 'MANUAL_PAYMENT_EVIDENCE_REQUIRED'
  THEN RAISE EXCEPTION 'OLD_RECORD_FIRST_DIVERGENCE: %',msg;END IF;
 END;
 -- Business in HIGH verification pending is blocked in T034's earlier guard.
 BEGIN
  PERFORM public.jb_ad_confirm_payment_internal(
   c2,'CI-OLD-HIGH-RISK-1',28000);
  RAISE EXCEPTION 'HIGH_RISK_VERIFICATION_BYPASS';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'MANUAL_PAYMENT_EVIDENCE_REQUIRED'
  THEN RAISE EXCEPTION 'HIGH_RISK_WEAK_LEGACY_PRECEDENCE_CHANGED: %',msg;END IF;
 END;
 -- Trigger names fire in PostgreSQL lexical order:
 -- b7_guard_manual_payment_evidence BEFORE b7_t034_payment_verified_gate.
 -- Thus a legacy high-risk RPC is stopped first by missing evidence.
 -- To independently test HIGH-risk identity under the paired candidate,
 -- give the disposable fixture structurally complete dummy evidence.
 PERFORM public.jb_ad_set_approved_quote_internal(
 c2,28000,'CI-HIGH-RISK-SIGNED-QUOTE');
 BEGIN
  INSERT INTO public.ad_payments(campaign_id,status,provider_ref,
   amount_minor,currency,method,receipt_at,evidence_ref,acceptance_ref,
   terms_accepted_at,verified_by,verified_at,verification_note)
  VALUES(c2,'confirmed','CI-NO-REAL-HIGH-UTR',28000,'INR','upi',now(),
   'CI-NO-REAL-LEDGER','CI-NO-REAL-ACCEPT',now(),auth.uid(),now(),
   'CI synthetic evidence only, never bank');
  RAISE EXCEPTION 'HIGH_RISK_WITH_SYNTHETIC_COMPLETE_FIELDS_ACCEPTED';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'ADVERTISER_VERIFICATION_REQUIRED'
  THEN RAISE EXCEPTION 'HIGH_RISK_PAIRED_EVIDENCE_FIRST_DIVERGENCE: %',msg;END IF;
 END;
 -- Direct INSERT or later UPDATE cannot bypass the new receipt evidence.
 BEGIN
  INSERT INTO public.ad_payments(campaign_id,status,provider_ref,
  amount_minor,currency) VALUES(c1,'confirmed','DIRECT-FAKE-UTR',50000,'INR');
  RAISE EXCEPTION 'DIRECT_CONFIRMED_WITHOUT_DOCUMENTS_ACCEPTED';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'MANUAL_PAYMENT_EVIDENCE_REQUIRED'
  THEN RAISE EXCEPTION 'DIRECT_INSERT_GUARD_MISMATCH: %',msg;END IF;
 END;
 -- Original paid trigger is independent of new consent/receipt requirement.
 BEGIN
  UPDATE public.ad_campaigns SET status='paid',paid_at=now() WHERE id=c1;
  RAISE EXCEPTION 'DIRECT_PAID_WITHOUT_RECEIPT';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'B7_CONFIRMED_PAYMENT_REQUIRED_BEFORE_PAID'
  THEN RAISE EXCEPTION 'PAID_T034_GUARD_MISMATCH: %',msg;END IF;
 END;
 -- Invalid partial writes must leave all prior protected business data.
 IF (SELECT count(*) FROM public.ad_payments)<>0
 OR (SELECT count(*) FROM public.ad_campaigns WHERE status IN('paid','live')
   OR paid_at IS NOT NULL)<>0
 OR (SELECT count(*) FROM public.ad_history)<>original_history
 THEN RAISE EXCEPTION 'FAILED_LEGACY_RECEIPT_ATTEMPTS_CHANGED_DATA';END IF;
 RAISE NOTICE 'CP02 T038 PASS Owner old 3-field+flagged 6-field confirmed denied, direct INSERT/DML denied, high-risk T034 preserved, zero mutations';
END $negative$;

DO $positive_and_immutability$
DECLARE c1 uuid:='30000000-0000-0000-0000-000000000001';
 c3 uuid:='30000000-0000-0000-0000-000000000003';
 msg text; paid uuid; original_history int; original_audit int;
BEGIN
 -- FIRST agreed quote may be documented once before mock payment.
 PERFORM public.jb_ad_set_approved_quote_internal(
 c1,50000,'SYNTHETIC-QUOTE-NO-REAL-BUYER');
 PERFORM public.jb_ad_set_approved_quote_internal(
 c3,50000,'SYNTHETIC-SECOND-QUOTE');
 PERFORM public.jb_ad_confirm_manual_payment_internal(
 c1,'NO-REAL-UTR-CP02-0001',50000,'upi',now(),
 'NO-REAL-LEDGER-CP02','NO-REAL-BUYER-CP02',now(),
 'Verified ONLY in a disposable test database','CONFIRM');
 IF (SELECT count(*) FROM public.ad_payments
 WHERE campaign_id=c1 AND status='confirmed')<>1
 OR (SELECT status FROM public.ad_campaigns WHERE id=c1)<>'paid'
 THEN RAISE EXCEPTION 'REVIEWED_MANUAL_RECEIPT_POSITIVE_DAMAGED';END IF;
 SELECT count(*) INTO original_history FROM public.ad_history;
 SELECT count(*) INTO original_audit FROM public.audit_logs;
 BEGIN
  PERFORM public.jb_ad_confirm_payment_internal(
  c3,'NO-REAL-UTR-OLD-3',50000);
  RAISE EXCEPTION 'OLD_ROUTE_BYPASS_AFTER_NEW_VALID_CONFIRM';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'MANUAL_PAYMENT_EVIDENCE_REQUIRED'
  THEN RAISE EXCEPTION 'OLD_AFTER_NEW_GUARD_WRONG: %',msg;END IF;
 END;
 BEGIN
  UPDATE public.ad_payments SET amount_minor=1 WHERE campaign_id=c1;
  RAISE EXCEPTION 'CONFIRMED_LEDGER_CHANGED';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'CONFIRMED_PAYMENT_IMMUTABLE'
  THEN RAISE EXCEPTION 'IMMUTABLE_PAID_LEDGER_WRONG: %',msg;END IF;
 END;
 BEGIN
  DELETE FROM public.ad_payments WHERE campaign_id=c1;
  RAISE EXCEPTION 'CONFIRMED_LEDGER_DELETED';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'CONFIRMED_PAYMENT_IMMUTABLE'
  THEN RAISE EXCEPTION 'DELETE_LEDGER_GUARD_WRONG: %',msg;END IF;
 END;
 IF (SELECT count(*) FROM public.ad_history)<>original_history
 OR (SELECT count(*) FROM public.audit_logs)<>original_audit
 OR (SELECT count(*) FROM public.ad_payments WHERE status='confirmed')<>1
 THEN RAISE EXCEPTION 'REPLAY_OR_DENIAL_WROTE_DUPLICATE_AUDIT_OR_RECEIPT';END IF;
 RAISE NOTICE 'CP02 T038 PASS reviewed manual mock receipt positive with old RPC still denied, immutable ledger and no duplicate audit';
END $positive_and_immutability$;

DO $non_owner$
DECLARE c1 uuid:='30000000-0000-0000-0000-000000000001';
 msg text;
BEGIN
 PERFORM set_config('b7.test_owner','disabled',true);
 BEGIN
  PERFORM public.jb_ad_confirm_payment_internal(c1,'CI-NONOWNER-OLD',50000);
  RAISE EXCEPTION 'NONOWNER_OLD_RPC_ACCEPTED';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'OWNER_AAL2_REQUIRED'
  THEN RAISE EXCEPTION 'NONOWNER_WRONG_DENIAL %',msg;END IF;
 END;
 BEGIN
  PERFORM public.jb_ad_confirm_manual_payment_internal(
   c1,'CI-NONOWNER-NEW',50000,'upi',now(),
   'CI-NO-REAL-LEDGER','CI-NO-REAL-CONSENT',now(),
   'Fake note only, untrusted','CONFIRM');
  RAISE EXCEPTION 'NONOWNER_REVIEW_RPC_ACCEPTED';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'OWNER_AAL2_REQUIRED'
  THEN RAISE EXCEPTION 'NONOWNER_REVIEW_WRONG_DENIAL %',msg;END IF;
 END;
 RAISE NOTICE 'CP02 T038 PASS nonOwner both legacy and reviewed routes denied';
END $non_owner$;
ROLLBACK;
