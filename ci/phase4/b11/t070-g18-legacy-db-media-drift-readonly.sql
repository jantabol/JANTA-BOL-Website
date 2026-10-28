-- T070 G18 legacy T034 DB snapshot + T069 storage compatibility preflight.
-- READ-ONLY: aggregate write indicators in ONE current source SQL statement snapshot.
-- This DOES NOT verify that past DB dump and later media backup are one immutable point.
-- Use conservative T034 workflow start time, not guessed exact exported DB snapshot time.
WITH bounds AS (
 SELECT timestamptz '2026-10-25 18:49:51+00' AS db_run_start,
        timestamptz '2026-10-26 05:30:50+00' AS media_run_start
), indicators AS (
 SELECT 'articles' AS family,count(*)::integer AS row_count,
        count(*) FILTER (WHERE updated_at>(SELECT db_run_start FROM bounds))::integer AS touched_since_db_start
 FROM public.articles
 UNION ALL SELECT 'article_versions', count(*)::integer,
        count(*) FILTER (WHERE created_at>(SELECT db_run_start FROM bounds))::integer FROM public.article_versions
 UNION ALL SELECT 'grievances',count(*)::integer,
        count(*) FILTER (WHERE updated_at>(SELECT db_run_start FROM bounds))::integer FROM public.grievances
 UNION ALL SELECT 'grievance_history',count(*)::integer,
        count(*) FILTER (WHERE created_at>(SELECT db_run_start FROM bounds))::integer FROM public.grievance_history
 UNION ALL SELECT 'grievance_evidence',count(*)::integer,
        count(*) FILTER (WHERE created_at>(SELECT db_run_start FROM bounds))::integer FROM public.grievance_evidence
 UNION ALL SELECT 'live_sessions',count(*)::integer,
        count(*) FILTER (WHERE created_at>(SELECT db_run_start FROM bounds)
         OR approved_at>(SELECT db_run_start FROM bounds)
         OR started_at>(SELECT db_run_start FROM bounds)
         OR ended_at>(SELECT db_run_start FROM bounds)
         OR priority_updated_at>(SELECT db_run_start FROM bounds)
         OR expected_end_updated_at>(SELECT db_run_start FROM bounds))::integer FROM public.live_sessions
 UNION ALL SELECT 'live_updates',count(*)::integer,
        count(*) FILTER (WHERE created_at>(SELECT db_run_start FROM bounds))::integer FROM public.live_updates
 UNION ALL SELECT 'ad_campaigns',count(*)::integer,
        count(*) FILTER (WHERE updated_at>(SELECT db_run_start FROM bounds))::integer FROM public.ad_campaigns
 UNION ALL SELECT 'ad_payments',count(*)::integer,
        count(*) FILTER (WHERE updated_at>(SELECT db_run_start FROM bounds))::integer FROM public.ad_payments
 UNION ALL SELECT 'auth_users',count(*)::integer,
        count(*) FILTER (WHERE updated_at>(SELECT db_run_start FROM bounds))::integer FROM auth.users
 UNION ALL SELECT 'storage_metadata',count(*)::integer,
        count(*) FILTER (WHERE updated_at>(SELECT db_run_start FROM bounds))::integer
        FROM storage.objects WHERE bucket_id IN ('grievance-private','private-editorial','public-media')
) SELECT family,row_count,touched_since_db_start,
  'AGGREGATED_CURRENT_METADATA_ONLY;NOT_HISTORICAL_ATOMICITY_OR_FILE_BYTES' AS scope
FROM indicators ORDER BY family;
