-- T070 exact representative source->clone DB identity manifest, private in AGE bundle.
-- Preserve canonical Article ID/slug/PURL, grievances/history, LIVE, ads/payment,
-- audit, Auth user identity, roles and Storage metadata (entire row digests).
-- Never log identities or digest output. SELECT only; same SQL on both databases.
WITH facts AS (
SELECT '01_public_articles' AS metric,
  (SELECT count(*)::text || ':' || md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'|' ORDER BY md5(to_jsonb(t)::text)),'EMPTY')) FROM public.articles t) AS value
 UNION ALL 
SELECT '02_public_article_versions' AS metric,
  (SELECT count(*)::text || ':' || md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'|' ORDER BY md5(to_jsonb(t)::text)),'EMPTY')) FROM public.article_versions t) AS value
 UNION ALL 
SELECT '03_public_article_sources' AS metric,
  (SELECT count(*)::text || ':' || md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'|' ORDER BY md5(to_jsonb(t)::text)),'EMPTY')) FROM public.article_sources t) AS value
 UNION ALL 
SELECT '04_public_grievances' AS metric,
  (SELECT count(*)::text || ':' || md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'|' ORDER BY md5(to_jsonb(t)::text)),'EMPTY')) FROM public.grievances t) AS value
 UNION ALL 
SELECT '05_public_grievance_history' AS metric,
  (SELECT count(*)::text || ':' || md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'|' ORDER BY md5(to_jsonb(t)::text)),'EMPTY')) FROM public.grievance_history t) AS value
 UNION ALL 
SELECT '06_public_grievance_evidence' AS metric,
  (SELECT count(*)::text || ':' || md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'|' ORDER BY md5(to_jsonb(t)::text)),'EMPTY')) FROM public.grievance_evidence t) AS value
 UNION ALL 
SELECT '07_public_live_sessions' AS metric,
  (SELECT count(*)::text || ':' || md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'|' ORDER BY md5(to_jsonb(t)::text)),'EMPTY')) FROM public.live_sessions t) AS value
 UNION ALL 
SELECT '08_public_live_operations' AS metric,
  (SELECT count(*)::text || ':' || md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'|' ORDER BY md5(to_jsonb(t)::text)),'EMPTY')) FROM public.live_operations t) AS value
 UNION ALL 
SELECT '09_public_live_provider_generations' AS metric,
  (SELECT count(*)::text || ':' || md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'|' ORDER BY md5(to_jsonb(t)::text)),'EMPTY')) FROM public.live_provider_generations t) AS value
 UNION ALL 
SELECT '10_public_live_deletion_ledger' AS metric,
  (SELECT count(*)::text || ':' || md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'|' ORDER BY md5(to_jsonb(t)::text)),'EMPTY')) FROM public.live_deletion_ledger t) AS value
 UNION ALL 
SELECT '11_public_live_final_reports' AS metric,
  (SELECT count(*)::text || ':' || md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'|' ORDER BY md5(to_jsonb(t)::text)),'EMPTY')) FROM public.live_final_reports t) AS value
 UNION ALL 
SELECT '12_public_ad_campaigns' AS metric,
  (SELECT count(*)::text || ':' || md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'|' ORDER BY md5(to_jsonb(t)::text)),'EMPTY')) FROM public.ad_campaigns t) AS value
 UNION ALL 
SELECT '13_public_ad_payments' AS metric,
  (SELECT count(*)::text || ':' || md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'|' ORDER BY md5(to_jsonb(t)::text)),'EMPTY')) FROM public.ad_payments t) AS value
 UNION ALL 
SELECT '14_public_ad_history' AS metric,
  (SELECT count(*)::text || ':' || md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'|' ORDER BY md5(to_jsonb(t)::text)),'EMPTY')) FROM public.ad_history t) AS value
 UNION ALL 
SELECT '15_public_audit_logs' AS metric,
  (SELECT count(*)::text || ':' || md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'|' ORDER BY md5(to_jsonb(t)::text)),'EMPTY')) FROM public.audit_logs t) AS value
 UNION ALL 
SELECT '16_auth_users' AS metric,
  (SELECT count(*)::text || ':' || md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'|' ORDER BY md5(to_jsonb(t)::text)),'EMPTY')) FROM auth.users t) AS value
 UNION ALL 
SELECT '17_public_user_roles' AS metric,
  (SELECT count(*)::text || ':' || md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'|' ORDER BY md5(to_jsonb(t)::text)),'EMPTY')) FROM public.user_roles t) AS value
 UNION ALL 
SELECT '18_storage_objects' AS metric,
  (SELECT count(*)::text || ':' || md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'|' ORDER BY md5(to_jsonb(t)::text)),'EMPTY')) FROM storage.objects t) AS value
 UNION ALL 
SELECT '19_orphan_check' AS metric, (SELECT count(*) FROM public.grievances g WHERE g.article_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.articles a WHERE a.id=g.article_id))::text AS value
 UNION ALL 
SELECT '20_orphan_check' AS metric, (SELECT count(*) FROM public.grievance_evidence ge WHERE NOT EXISTS(SELECT 1 FROM public.grievances g WHERE g.id=ge.grievance_id))::text AS value
 UNION ALL 
SELECT '21_orphan_check' AS metric, (SELECT count(*) FROM public.article_versions av WHERE NOT EXISTS(SELECT 1 FROM public.articles a WHERE a.id=av.article_id))::text AS value
 UNION ALL 
SELECT '22_orphan_check' AS metric, (SELECT count(*) FROM public.live_sessions ls WHERE ls.article_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.articles a WHERE a.id=ls.article_id))::text AS value
 UNION ALL 
SELECT '23_orphan_check' AS metric, (SELECT count(*) FROM public.live_operations lo WHERE lo.session_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.live_sessions ls WHERE ls.id=lo.session_id))::text AS value
 UNION ALL 
SELECT '24_orphan_check' AS metric, (SELECT count(*) FROM public.ad_payments ap WHERE NOT EXISTS(SELECT 1 FROM public.ad_campaigns ac WHERE ac.id=ap.campaign_id))::text AS value
 UNION ALL 
SELECT '25_orphan_check' AS metric, (SELECT count(*) FROM public.user_roles ur WHERE NOT EXISTS(SELECT 1 FROM auth.users u WHERE u.id=ur.user_id))::text AS value
)
SELECT metric || '=' || value FROM facts ORDER BY metric;
