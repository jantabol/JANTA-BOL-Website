\set ON_ERROR_STOP on
-- C2 / Analytics #02: genuine PG17 original B7 owner analytics RPC
-- failure isolation, source-only candidate, NO live traffic or ad billing.
DO $guard$
BEGIN
 IF current_database()<>'jb_t071_c2_analytics'
 OR (SELECT count(*) FROM public.ad_campaigns)<>4
 OR (SELECT count(*) FROM public.articles)<>1
 THEN RAISE EXCEPTION 'C2_ANALYTICS_NON_SYNTHETIC_DB_REFUSED'; END IF;
END $guard$;

SELECT set_config('b7.test_owner','enabled',false);
INSERT INTO public.ad_events(campaign_id,event_type,created_at,qualified,qualification_source)
 VALUES
 ('30000000-0000-0000-0000-000000000001','impression',
 now()-interval '2 minutes',true,'client_reported_50pct_1000ms'),
 ('30000000-0000-0000-0000-000000000001','impression',
 now()-interval '1 minute',false,NULL);
SET ROLE authenticated;
DO $baseline$
DECLARE r jsonb;
BEGIN
 r:=public.jb_ad_qualified_analytics_internal(
  '30000000-0000-0000-0000-000000000001'::uuid);
 IF (r->>'total')::integer<>1
 OR (r->>'unverified_legacy')::integer<>1
 OR (r->>'anti_bot_verified')<>'false'
 OR r->>'reach_type'<>'client_reported_estimate_not_unique_people'
 THEN RAISE EXCEPTION 'C2_ANALYTICS_FALSE_BASELINE_OR_VERIFIED_REACH';END IF;
END $baseline$;
RESET ROLE;
\echo T071_C2_REAL_B7_ANALYTICS_BASELINE_CLIENT_ESTIMATE_LABEL=PASS

-- Real SQL permission denial; no mock RPC responses.
REVOKE EXECUTE ON FUNCTION public.jb_ad_qualified_analytics_internal(uuid)
 FROM authenticated;
SET ROLE authenticated;
DO $outage$
DECLARE denied boolean:=false;msg text;
BEGIN
 BEGIN
  PERFORM public.jb_ad_qualified_analytics_internal(
   '30000000-0000-0000-0000-000000000001'::uuid);
 EXCEPTION WHEN insufficient_privilege THEN denied:=true;
 WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
  RAISE EXCEPTION 'C2_ANALYTICS_WRONG_FAULT: %',msg;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'C2_ANALYTICS_FAULT_NOT_REAL';END IF;
END $outage$;
RESET ROLE;
\echo T071_C2_REAL_ANALYTICS_RPC_OUTAGE_PERMISSION_DENIED=PASS

DO $core$
BEGIN
 IF (SELECT count(*) FROM public.ad_campaigns WHERE status IN('paid','live'))<>0
 OR (SELECT count(*) FROM public.articles WHERE status='published')<>1
 OR (SELECT count(*) FROM public.ad_events
  WHERE campaign_id='30000000-0000-0000-0000-000000000001')<>2
 THEN RAISE EXCEPTION 'C2_ANALYTICS_FAILURE_MUTATED_NEWS_PAYMENT_EVENTS';END IF;
END $core$;
\echo T071_C2_REAL_ANALYTICS_FAILURE_DOES_NOT_CHANGE_NEWS_AD_EVENTS=PASS

GRANT EXECUTE ON FUNCTION public.jb_ad_qualified_analytics_internal(uuid)
 TO authenticated;
SET ROLE authenticated;
DO $recovery$
DECLARE r jsonb;
BEGIN
 r:=public.jb_ad_qualified_analytics_internal(
  '30000000-0000-0000-0000-000000000001'::uuid);
 IF (r->>'total')::integer<>1
 OR (r->>'unverified_legacy')::integer<>1
 OR r->>'anti_bot_verified'<>'false'
 THEN RAISE EXCEPTION 'C2_ANALYTICS_RECOVERY_MISREPORTED';END IF;
END $recovery$;
RESET ROLE;
\echo T071_C2_REAL_ANALYTICS_RECOVERED_AND_COUNTS_PRESERVED=PASS
\echo T071_C2_ANALYTICS_COMPONENT_PG17=PASS
\echo T071_C2_LIVE_HOSTED_ANALYTICS_AND_CORE_ARTICLE_BROWSER=HOLD
\echo T071_FINAL_PASS_LOCK=false
