-- T034 restore identity metrics; numeric counts and function MD5 ONLY.
-- Safe output: ZERO user rows, no passwords, no SQL function definitions.
-- Execute against live Postgres READ ONLY and against offline clone with the
-- EXACT SAME query, then compare byte-for-byte. DOES NOT check media bytes.
WITH facts AS (
  SELECT '01_articles' AS metric, (SELECT count(*)::text FROM public.articles) AS result
  UNION ALL SELECT '02_ad_campaigns', (SELECT count(*)::text FROM public.ad_campaigns)
  UNION ALL SELECT '03_advertisers', (SELECT count(*)::text FROM public.advertisers)
  UNION ALL SELECT '04_ad_payments', (SELECT count(*)::text FROM public.ad_payments)
  UNION ALL SELECT '05_ad_history', (SELECT count(*)::text FROM public.ad_history)
  UNION ALL SELECT '06_audit_logs', (SELECT count(*)::text FROM public.audit_logs)
  UNION ALL SELECT '07_auth_users', (SELECT count(*)::text FROM auth.users)
  UNION ALL SELECT '08_storage_object_metadata', (SELECT count(*)::text FROM storage.objects)
  UNION ALL SELECT '09_public_tables',
    (SELECT count(*)::text FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind='r')
  UNION ALL SELECT '10_public_RLS_tables',
    (SELECT count(*)::text FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity)
  UNION ALL SELECT '11_private_tables',
    (SELECT count(*)::text FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='private' AND c.relkind='r')
  UNION ALL SELECT '12_private_RLS_tables',
    (SELECT count(*)::text FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='private' AND c.relkind='r' AND c.relrowsecurity)
  UNION ALL SELECT '13_public_RLS_policies',
    (SELECT count(*)::text FROM pg_policies WHERE schemaname='public')
  UNION ALL SELECT '14_private_RLS_policies',
    (SELECT count(*)::text FROM pg_policies WHERE schemaname='private')
  UNION ALL SELECT '15_public_functions',
    (SELECT count(*)::text FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.prokind='f')
  UNION ALL SELECT '16_private_functions',
    (SELECT count(*)::text FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='private' AND p.prokind='f')
  UNION ALL SELECT '17_rpc_payment_confirm_MD5',
    COALESCE(md5(pg_get_functiondef(to_regprocedure('public.jb_ad_confirm_payment_internal(uuid,text,bigint)'))),'MISSING')
  UNION ALL SELECT '18_rpc_payment_record_MD5',
    COALESCE(md5(pg_get_functiondef(to_regprocedure('public.jb_ad_record_payment_internal(uuid,text,text,bigint,text,boolean)'))),'MISSING')
  UNION ALL SELECT '19_rpc_ad_transition_MD5',
    COALESCE(md5(pg_get_functiondef(to_regprocedure('public.jb_ad_transition_internal(uuid,text,text)'))),'MISSING')
  UNION ALL SELECT '20_rpc_public_enquiry_MD5',
    COALESCE(md5(pg_get_functiondef(to_regprocedure('public.jb_ad_public_enquiry(text,text,boolean,text,uuid,text)'))),'MISSING')
) SELECT metric || '=' || result FROM facts ORDER BY metric;
