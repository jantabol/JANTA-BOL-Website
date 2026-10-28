-- T070 G1 read-only source integrity check. Do NOT label as RESTORE.
-- No row IDs, private evidence paths, names, JWTs or secrets leave this query.
-- Check all real-source links before any future isolated E8 recovery.
WITH checks AS (
 SELECT 'articles_slug_uniqueness' check_name, (SELECT count(*) = count(DISTINCT slug) FROM public.articles) ok, (SELECT count(*) FROM public.articles) objects
 UNION ALL SELECT 'article_versions_fk', (SELECT count(*)=0 FROM public.article_versions v LEFT JOIN public.articles a ON v.article_id=a.id WHERE a.id IS NULL), (SELECT count(*) FROM public.article_versions)
 UNION ALL SELECT 'article_version_duplicate', (SELECT count(*)=0 FROM (SELECT article_id,article_version FROM public.article_versions GROUP BY 1,2 HAVING count(*)>1) v), (SELECT count(*) FROM public.article_versions)
 UNION ALL SELECT 'grievance_public_ids_unique', (SELECT count(*)=count(DISTINCT public_id) FROM public.grievances), (SELECT count(*) FROM public.grievances)
 UNION ALL SELECT 'grievance_article_fk', (SELECT count(*)=0 FROM public.grievances g LEFT JOIN public.articles a ON g.article_id=a.id WHERE g.article_id IS NOT NULL AND a.id IS NULL), (SELECT count(*) FROM public.grievances)
 UNION ALL SELECT 'grievance_history_fk', (SELECT count(*)=0 FROM public.grievance_history h LEFT JOIN public.grievances g ON h.grievance_id=g.id WHERE g.id IS NULL), (SELECT count(*) FROM public.grievance_history)
 UNION ALL SELECT 'grievance_evidence_fk', (SELECT count(*)=0 FROM public.grievance_evidence e LEFT JOIN public.grievances g ON e.grievance_id=g.id WHERE g.id IS NULL), (SELECT count(*) FROM public.grievance_evidence)
 UNION ALL SELECT 'live_session_article_fk', (SELECT count(*)=0 FROM public.live_sessions s LEFT JOIN public.articles a ON s.article_id=a.id WHERE s.article_id IS NOT NULL AND a.id IS NULL), (SELECT count(*) FROM public.live_sessions)
 UNION ALL SELECT 'live_update_session_fk', (SELECT count(*)=0 FROM public.live_updates u LEFT JOIN public.live_sessions s ON u.live_session_id=s.id WHERE s.id IS NULL), (SELECT count(*) FROM public.live_updates)
 UNION ALL SELECT 'advertiser_campaign_fk', (SELECT count(*)=0 FROM public.ad_campaigns c LEFT JOIN public.advertisers a ON c.advertiser_id=a.id WHERE a.id IS NULL), (SELECT count(*) FROM public.ad_campaigns)
 UNION ALL SELECT 'campaign_package_fk', (SELECT count(*)=0 FROM public.ad_campaigns c LEFT JOIN public.ad_packages p ON c.package_id=p.id WHERE c.package_id IS NOT NULL AND p.id IS NULL), (SELECT count(*) FROM public.ad_campaigns)
 UNION ALL SELECT 'payment_campaign_fk', (SELECT count(*)=0 FROM public.ad_payments p LEFT JOIN public.ad_campaigns c ON p.campaign_id=c.id WHERE c.id IS NULL), (SELECT count(*) FROM public.ad_payments)
 UNION ALL SELECT 'auth_article_creator_fk', (SELECT count(*)=0 FROM public.articles a LEFT JOIN auth.users u ON u.id=a.created_by WHERE a.created_by IS NOT NULL AND u.id IS NULL), (SELECT count(*) FROM public.articles)
 UNION ALL SELECT 'auth_article_versions_fk', (SELECT count(*)=0 FROM public.article_versions v LEFT JOIN auth.users u ON u.id=v.responsible_user WHERE v.responsible_user IS NOT NULL AND u.id IS NULL), (SELECT count(*) FROM public.article_versions)
)
SELECT check_name, ok, objects,
 CASE WHEN objects=0 THEN 'NOT_EXERCISED_NO_ROWS'
      WHEN ok THEN 'LIVE_SOURCE_CONSISTENT'
      ELSE 'FAIL_SOURCE_INTEGRITY' END AS evidence
FROM checks ORDER BY check_name;
