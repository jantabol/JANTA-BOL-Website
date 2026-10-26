-- G16/T070 — read-only single SQL statement MVCC identity fingerprint.
-- NEVER represents DB+Storage object BYTE atomicity. Does NOT restore any data.
-- Only opaque aggregate SHA256, row counts; no row IDs, paths, JWTs, names or PII returned.
-- All subqueries in one SQL statement share one MVCC statement snapshot.
WITH expected_families AS (
 SELECT unnest(ARRAY['articles','article_versions','grievances','grievance_history','grievance_evidence','live_sessions','live_updates','ad_campaigns','ad_payments','auth_users','storage_metadata']) AS family
), families AS (
 SELECT 'articles' AS family, id::text AS ord, jsonb_build_array(id,slug,created_by,version) AS keys FROM public.articles
 UNION ALL SELECT 'article_versions',id::text,jsonb_build_array(id,article_id,article_version,responsible_user) FROM public.article_versions
 UNION ALL SELECT 'grievances',id::text,jsonb_build_array(id,public_id,article_id) FROM public.grievances
 UNION ALL SELECT 'grievance_history',id::text,jsonb_build_array(id,grievance_id,actor_user_id) FROM public.grievance_history
 UNION ALL SELECT 'grievance_evidence',id::text,jsonb_build_array(id,grievance_id,bucket_id,sha256,byte_size) FROM public.grievance_evidence
 UNION ALL SELECT 'live_sessions',id::text,jsonb_build_array(id,article_id,reporter_id) FROM public.live_sessions
 UNION ALL SELECT 'live_updates',id::text,jsonb_build_array(id,live_session_id) FROM public.live_updates
 UNION ALL SELECT 'ad_campaigns',id::text,jsonb_build_array(id,advertiser_id,package_id) FROM public.ad_campaigns
 UNION ALL SELECT 'ad_payments',id::text,jsonb_build_array(id,campaign_id) FROM public.ad_payments
 UNION ALL SELECT 'auth_users',id::text,jsonb_build_array(id) FROM auth.users
 UNION ALL SELECT 'storage_metadata',id::text,jsonb_build_array(id,bucket_id,name,updated_at,metadata->>'size') FROM storage.objects
 WHERE bucket_id IN ('grievance-private','private-editorial','public-media')
),fingerprints AS (
 SELECT family,count(*)::integer AS source_rows,
 encode(extensions.digest(convert_to(coalesce(jsonb_agg(keys ORDER BY ord)::text,'[]'),'UTF8'),'sha256'),'hex') AS identity_sha256
 FROM families GROUP BY family
)
SELECT family, source_rows, identity_sha256,
 'LIVE_SOURCE_SQL_SNAPSHOT_ONLY__NO_STORAGE_BYTES__NO_FULL_RESTORE' AS evidence_scope
FROM fingerprints ORDER BY family;
