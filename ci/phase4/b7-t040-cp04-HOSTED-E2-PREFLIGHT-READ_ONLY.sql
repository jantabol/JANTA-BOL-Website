-- JANTA BOL P4-T040 CP04 — GENUINE HOSTED SUPABASE *READ-ONLY* E2 PREFLIGHT.
-- DO NOT CLASSIFY THIS AS HOSTED POSITIVE ADS048–050 TEST E2.
-- NEVER ADD FAKE PAYMENT, CONFIRM, AD LIVE, EVENT, OWNER OR USER MUTATIONS.
-- Safe to run with the authorized Owner's ordinary SQL auditor only.
BEGIN READ ONLY;
SELECT current_database() database_name,
       current_setting('TimeZone') db_timezone,
       now() checked_at,
       current_setting('server_version') pg_version;
SELECT 'ad_campaigns' item,count(*)::bigint count FROM public.ad_campaigns
UNION ALL SELECT 'ad_live',count(*) FROM public.ad_campaigns WHERE status='live'
UNION ALL SELECT 'ad_payments_confirmed',count(*) FROM public.ad_payments WHERE status='confirmed'
UNION ALL SELECT 'ad_events',count(*) FROM public.ad_events
UNION ALL SELECT 'published_news',count(*) FROM public.articles WHERE status='published'
ORDER BY item;
SELECT p.oid::regprocedure::text signature,
       p.prosecdef security_definer,
       has_function_privilege('anon',p.oid,'EXECUTE') anonymous_callable,
       has_function_privilege('authenticated',p.oid,'EXECUTE') signed_in_callable
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname IN (
'jb_ad_public_feed','jb_ad_event','jb_ad_record_event',
'jb_ad_analytics_internal','jb_ad_issue_view_ticket',
'jb_ad_qualify_view_ticket','jb_ad_record_ticket_click',
'jb_ad_qualified_analytics_internal')
ORDER BY signature;
SELECT 'tickets_table' requirement,
       to_regclass('public.ad_view_tickets') IS NOT NULL deployed
UNION ALL SELECT 'qualified_view_ticket_rpc',
       to_regprocedure('public.jb_ad_qualify_view_ticket(text)') IS NOT NULL
UNION ALL SELECT 'qualified_owner_stats_rpc',
       to_regprocedure('public.jb_ad_qualified_analytics_internal(uuid)') IS NOT NULL
UNION ALL SELECT 'click_ticket_rpc',
       to_regprocedure('public.jb_ad_record_ticket_click(text)') IS NOT NULL
UNION ALL SELECT 'issue_ticket_rpc',
       to_regprocedure('public.jb_ad_issue_view_ticket(uuid,uuid,uuid,text)') IS NOT NULL;
SELECT c.relname table_name,c.relrowsecurity rls,
       has_table_privilege('anon',c.oid,'SELECT') anon_select,
       has_table_privilege('anon',c.oid,'INSERT') anon_insert
FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid
WHERE n.nspname='public' AND c.relname IN
('ad_events','ad_view_tickets','ad_campaigns','ad_creatives','articles')
ORDER BY table_name;
SET LOCAL ROLE anon;
SELECT 'homepage_anon_no_ads_with_zero_live' as check_name,count(*)::bigint AS result
  FROM public.jb_ad_public_feed('homepage','global')
UNION ALL SELECT 'article_anon_no_ads_with_zero_live',count(*)::bigint
  FROM public.jb_ad_public_feed('article','global');
ROLLBACK;
