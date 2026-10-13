\set ON_ERROR_STOP on
-- P4-T034 ADS-003 server-side forged public media/geo/placement negative.
-- Run only in disposable PG17 against exact LIVE matched public enquiry body.
-- The public request form and Owner review are separate from auto-approval.
BEGIN;
DO $pre$
BEGIN
 IF (SELECT count(*) FROM public.ad_campaigns)<>0
 THEN RAISE EXCEPTION 'ADS003_DIRTY_FIXTURE';END IF;
 IF has_function_privilege('anon','public.jb_ad_public_request(text,text,text,text,text)','EXECUTE')
    OR has_function_privilege('anon','public.jb_ad_public_request(text,text,uuid,text,text,text)','EXECUTE')
    OR has_function_privilege('anon','public.jb_ad_public_request(text,text,uuid,text,text,text,text)','EXECUTE')
 THEN RAISE EXCEPTION 'ADS003_LEGACY_PUBLIC_OWNER_ESCAPE';END IF;
END $pre$;
SET LOCAL ROLE anon;
DO $forge$
DECLARE p text; msg text; state text; count_ok int:=0;
BEGIN
 FOREACH p IN ARRAY ARRAY[
   'p_scope','p_placement','p_area','p_geo',
   'p_district','p_state','p_creative','p_media_url','p_package'
 ] LOOP
  BEGIN
   EXECUTE format(
     'SELECT public.jb_ad_public_enquiry(p_name=>''Fake Placement'',p_whatsapp=>''9876543210'',p_consent=>true,p_origin=>''homepage'',%I=>''hijacked'')',p);
   RAISE EXCEPTION 'ADS003_FORGED_FIELD_ACCEPTED: %',p;
  EXCEPTION WHEN OTHERS THEN
   GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT,state=RETURNED_SQLSTATE;
   IF state<>'42883' THEN
      RAISE EXCEPTION 'ADS003_UNEXPECTED_FORGE_RESULT %: %, SQLSTATE %',p,msg,state;
   END IF;
   count_ok:=count_ok+1;
  END;
 END LOOP;
 IF count_ok<>9 THEN RAISE EXCEPTION 'ADS003_FORGERY_MATRIX_INCOMPLETE';END IF;
 BEGIN
  PERFORM public.jb_ad_public_enquiry(
   'Fraud Geo Origin','9876543210',true,'district:shivpuri',NULL,NULL);
  RAISE EXCEPTION 'ADS003_FORGED_ORIGIN_ACCEPTED';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'INVALID_ENQUIRY_ORIGIN' THEN
   RAISE EXCEPTION 'ADS003_ORIGIN_DENIAL_WRONG_RESULT: %',msg;END IF;
 END;
 BEGIN
  PERFORM public.jb_ad_public_enquiry(
   'Fraud Article Scope','9876543210',true,'homepage',
   '10000000-0000-0000-0000-000000000001'::uuid,NULL);
  RAISE EXCEPTION 'ADS003_FORGED_ARTICLE_ACCEPTED';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  IF msg<>'INVALID_ARTICLE_CONTEXT' THEN
   RAISE EXCEPTION 'ADS003_ARTICLE_DENIAL_WRONG_RESULT: %',msg;END IF;
 END;
 RAISE NOTICE 'PASS [ADS-003] all 9 forged media/geo/placement named RPC arguments denied; origin/article context cannot be hijacked';
END $forge$;
RESET ROLE;
DO $negative_state$
BEGIN
 IF (SELECT count(*) FROM public.ad_campaigns)<>0
    OR (SELECT count(*) FROM public.advertisers)<>0
    OR (SELECT count(*) FROM public.ad_history)<>0
 THEN RAISE EXCEPTION 'ADS003_NEGATIVE_CREATED_STATE';END IF;
END $negative_state$;
SET LOCAL ROLE anon;
SELECT public.jb_ad_public_enquiry(
 'Normal public request','9876543210',true,'homepage',NULL,'Need a local ad') AS receipt;
RESET ROLE;
DO $positive$
BEGIN
 IF (SELECT count(*) FROM public.ad_campaigns c
      WHERE c.status='requested' AND c.placement='homepage'
        AND c.scope='global' AND c.request_kind='standard'
        AND c.enquiry_origin='homepage' AND c.approved_at IS NULL
        AND c.paid_at IS NULL)=1
    AND (SELECT count(*) FROM public.ad_history WHERE event_type='public_enquiry')=1
 THEN RAISE NOTICE 'PASS [ADS-003] simple public request cannot select placement/geo/media or grant approval; one pending audited receipt';
 ELSE RAISE EXCEPTION 'ADS003_PUBLIC_REQUEST_TAMPERED_FINAL_STATE';END IF;
END $positive$;
ROLLBACK;
