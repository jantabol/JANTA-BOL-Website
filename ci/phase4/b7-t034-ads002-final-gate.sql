\set ON_ERROR_STOP on
-- P4-T034 / ADS-002 — canonical FINAL E2 gate, disposable PostgreSQL ONLY.
-- 13 Oct 2026; real LIVE pg_get_functiondef and privilege parity separately
-- verified by read-only Supabase SQL; no LIVE inserts or authorization override.
-- Never change historical records. All fixture rows ROLLBACK.
BEGIN;

DO $preflight$
BEGIN
  IF NOT has_function_privilege('anon',
       'public.jb_ad_public_enquiry(text,text,boolean,text,uuid,text)',
       'EXECUTE')
  THEN RAISE EXCEPTION 'ADS002_ANON_PUBLIC_ENDPOINT_UNAVAILABLE'; END IF;
  IF (SELECT count(*) FROM public.ad_campaigns)<>0 OR
     (SELECT count(*) FROM public.advertisers)<>0 OR
     (SELECT count(*) FROM public.ad_history)<>0
  THEN RAISE EXCEPTION 'ADS002_FIXTURE_MUST_START_EMPTY'; END IF;
END $preflight$;

SET LOCAL ROLE anon;
DO $negative$
DECLARE
   arg jsonb; msg text; code text;
   tested int:=0;
BEGIN
  FOR arg IN SELECT value FROM jsonb_array_elements(
    jsonb_build_array(
      jsonb_build_object('case','blank WhatsApp',
        'name','Test Shop','phone','','consent',true,
        'error','INVALID_ENQUIRY_OR_CONSENT'),
      jsonb_build_object('case','letters',
        'name','Test Shop','phone','abcdefghij','consent',true,
        'error','INVALID_WHATSAPP_NUMBER'),
      jsonb_build_object('case','email address',
        'name','Test Shop','phone','test@example.com','consent',true,
        'error','INVALID_WHATSAPP_NUMBER'),
      jsonb_build_object('case','no consent FALSE',
        'name','Test Shop','phone','9876543210','consent',false,
        'error','INVALID_ENQUIRY_OR_CONSENT'),
      jsonb_build_object('case','no consent NULL',
        'name','Test Shop','phone','9876543210','consent',null,
        'error','INVALID_ENQUIRY_OR_CONSENT'),
      jsonb_build_object('case','Indian invalid number',
        'name','Test Shop','phone','+911234567890','consent',true,
        'error','INVALID_WHATSAPP_NUMBER'),
      jsonb_build_object('case','short foreign number',
        'name','Test Shop','phone','+4412','consent',true,
        'error','INVALID_ENQUIRY_OR_CONSENT')
    )
  ) LOOP
    BEGIN
      PERFORM public.jb_ad_public_enquiry(
        arg->>'name',arg->>'phone',(arg->>'consent')::boolean,
        'homepage',NULL,NULL);
      RAISE EXCEPTION 'ADS002_UNSAFE_ACCEPT: %',arg->>'case';
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT,code=RETURNED_SQLSTATE;
      IF msg IS DISTINCT FROM arg->>'error' THEN
        RAISE EXCEPTION 'ADS002_WRONG_REJECTION [%]: %',
           arg->>'case',msg;
      END IF;
      tested:=tested+1;
    END;
  END LOOP;
  IF tested<>7 THEN RAISE EXCEPTION 'ADS002_MATRIX_INCOMPLETE'; END IF;
  RAISE NOTICE 'PASS [ADS002 NEGATIVE] 7 anon server-side cases blocked';
END $negative$;
RESET ROLE;

DO $no_negative_writes$
BEGIN
  IF (SELECT count(*) FROM public.ad_campaigns)<>0 OR
     (SELECT count(*) FROM public.advertisers)<>0 OR
     (SELECT count(*) FROM public.ad_history)<>0
  THEN RAISE EXCEPTION 'ADS002_DENIED_INPUT_WROTE_A_RECORD'; END IF;
  RAISE NOTICE 'PASS [ADS002 NEGATIVE DB] denied input created zero rows';
END $no_negative_writes$;

SET LOCAL ROLE anon;
SELECT public.jb_ad_public_enquiry(
  'Good Indian Business','9876543210',true,'homepage',NULL,
  'Review requested') AS receipt_local_10_digits;
SELECT public.jb_ad_public_enquiry(
  'Good Intl Indian','+919876543211',true,'homepage',NULL,
  'Review requested') AS receipt_explicit_country_code;
SELECT public.jb_ad_public_enquiry(
  'Good International Shop','+447700900123',true,'homepage',NULL,
  'Review requested') AS receipt_international;
RESET ROLE;

DO $positive$
DECLARE n integer;invalid integer;
BEGIN
  SELECT count(*) INTO n FROM public.ad_campaigns c
    JOIN public.advertisers a ON a.id=c.advertiser_id
  WHERE c.status='requested'
    AND c.approved_at IS NULL AND c.paid_at IS NULL
    AND c.whatsapp_consent_at IS NOT NULL
    AND c.placement='homepage' AND c.scope='global'
    AND a.verification_state='pending'
    AND a.contact IN ('+919876543210','+919876543211','+447700900123');
  IF n<>3 THEN RAISE EXCEPTION 'ADS002_WHATSAPP_NORMALIZATION_CONSENT_FAILED: %',n; END IF;
  IF (SELECT count(*) FROM public.advertisers)<>3 OR
     (SELECT count(*) FROM public.ad_campaigns)<>3 OR
     (SELECT count(*) FROM public.ad_history WHERE event_type='public_enquiry')<>3
  THEN RAISE EXCEPTION 'ADS002_UNEXPECTED_CREATED_ROWS';END IF;
  RAISE NOTICE 'PASS [ADS002 POSITIVE] +91 auto normalize, explicit +91 and foreign code; 3 pending receipts, 3 history, 0 payments';
END $positive$;
ROLLBACK;
-- Official subgate is ADS-002 ONLY. Does NOT unlock T034 1/9 Final PASS.
