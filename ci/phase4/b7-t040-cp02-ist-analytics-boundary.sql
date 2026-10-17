\set ON_ERROR_STOP on
-- T040 CP02: real disposable PostgreSQL17 / Owner client-reported daily
-- analytics must align with the UI's INDIA business calendar day, not UTC.
-- No actual viewers, money, login, advertising, traffic, geo or PII.
BEGIN;
SET LOCAL TIME ZONE 'UTC';
DO $ist_daily$
DECLARE
  c uuid:='30000000-0000-0000-0000-000000000005';
  start_utc timestamptz:=date_trunc('day',now());
  start_ist timestamptz:=date_trunc('day',now() AT TIME ZONE 'Asia/Kolkata')
      AT TIME ZONE 'Asia/Kolkata';
  boundary timestamptz;
  expected_today integer;
  stats jsonb;
BEGIN
  -- The boundary point sits STRICTLY between the two dates' day starts.
  -- Works regardless of whether GitHub CI runs before or after 18:30 UTC.
  boundary:=least(start_utc,start_ist)+interval '1 minute';
  expected_today:=case when boundary>=start_ist then 2 else 1 end;
  IF boundary>=now() OR start_ist=start_utc THEN
    RAISE EXCEPTION 'T040_BAD_CLOCK_FIXTURE';END IF;
  PERFORM set_config('b7.test_owner','enabled',true);
  INSERT INTO public.ad_events(
    campaign_id,event_type,created_at,qualified,qualification_source
  ) VALUES
    (c,'impression',boundary,true,'client_reported_50pct_1000ms'),
    (c,'impression',now()-interval '1 minute',true,'client_reported_50pct_1000ms'),
    (c,'impression',now()-interval '2 minutes',false,null),
    (c,'click',now()-interval '1 minute',true,'client_reported_cta_click');
  stats:=public.jb_ad_qualified_analytics_internal(c);
  IF (stats->>'today')::int<>expected_today THEN
   RAISE EXCEPTION
    'T040_IST_TODAY_DIVERGENCE got=% expected=% IST_midnight=% UTC_midnight=%',
    stats->>'today',expected_today,start_ist,start_utc;END IF;
  IF (stats->>'d7')::int<>2 OR (stats->>'d30')::int<>2
     OR (stats->>'total')::int<>2
     OR (stats->>'unverified_legacy')::int<>1
     OR (stats->>'clicks_reported')::int<>1
     OR (stats->>'clicks_verified')::int<>0
     OR stats->>'anti_bot_verified'<>'false'
     OR stats->>'reach_type'<>'client_reported_estimate_not_unique_people'
  THEN
   RAISE EXCEPTION 'T040_QUALIFIED_REPORT_HAS_UNSAFE_COUNTS %',stats;
  END IF;
  RAISE NOTICE 'T040 CP02 PASS: Today India timezone %, 7d/30d/total unqualified segregated, clicks explicitly unverified',expected_today;
END $ist_daily$;
ROLLBACK;
