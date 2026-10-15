-- P4-T034 B5 canonical protected DB restore integrity/security digest overlay.
-- Output is fixed metric names + MD5 of full TABLE content/definition metadata.
-- NO plaintext rows, personal values, function bodies or secrets in logs.
-- Must be queried inside SAME exported snapshot as raw pg_dump.
-- Both source digest and clone result remain confidential ephemeral files.
WITH facts AS (
 SELECT '01_article_full_data' AS metric,
   (SELECT md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'|' ORDER BY md5(to_jsonb(t)::text)),'EMPTY')) FROM public.articles t) AS result
 UNION ALL SELECT '02_ad_campaigns_full_data',
   (SELECT md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'|' ORDER BY md5(to_jsonb(t)::text)),'EMPTY')) FROM public.ad_campaigns t)
 UNION ALL SELECT '03_advertisers_full_data',
   (SELECT md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'|' ORDER BY md5(to_jsonb(t)::text)),'EMPTY')) FROM public.advertisers t)
 UNION ALL SELECT '04_ad_payments_full_data',
   (SELECT md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'|' ORDER BY md5(to_jsonb(t)::text)),'EMPTY')) FROM public.ad_payments t)
 UNION ALL SELECT '05_ad_history_full_data',
   (SELECT md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'|' ORDER BY md5(to_jsonb(t)::text)),'EMPTY')) FROM public.ad_history t)
 UNION ALL SELECT '06_audit_logs_full_data',
   (SELECT md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'|' ORDER BY md5(to_jsonb(t)::text)),'EMPTY')) FROM public.audit_logs t)
 UNION ALL SELECT '07_auth_users_full_data',
   (SELECT md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'|' ORDER BY md5(to_jsonb(t)::text)),'EMPTY')) FROM auth.users t)
 UNION ALL SELECT '08_storage_metadata_full_data',
   (SELECT md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'|' ORDER BY md5(to_jsonb(t)::text)),'EMPTY')) FROM storage.objects t)
 UNION ALL SELECT '09_app_RLS_policy_definitions',
   (SELECT md5(COALESCE(string_agg(md5(
     schemaname||'.'||tablename||'.'||policyname||'|'||cmd||'|'||permissive||
     '|'||roles::text||'|'||COALESCE(qual,'<NULL>')||'|'||COALESCE(with_check,'<NULL>')
   ),'|' ORDER BY schemaname,tablename,policyname),'EMPTY'))
   FROM pg_policies WHERE schemaname IN ('public','private'))
 UNION ALL SELECT '10_table_owner_acl_RLS',
   (SELECT md5(COALESCE(string_agg(md5(
      n.nspname||'.'||c.relname||'|'||pg_get_userbyid(c.relowner)||'|'||
      COALESCE(c.relacl::text,'<NULL>')||'|'||c.relrowsecurity::text||'|'||
      c.relforcerowsecurity::text
   ),'|' ORDER BY n.nspname,c.relname),'EMPTY'))
   FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname IN ('public','private','auth','storage')
     AND c.relkind IN ('r','p','v','m','S'))
 UNION ALL SELECT '11_app_function_bodies_and_owners',
   (SELECT md5(COALESCE(string_agg(md5(
     p.oid::regprocedure::text||'|'||pg_get_userbyid(p.proowner)||'|'||
     p.prosecdef::text||'|'||COALESCE(p.proconfig::text,'<NULL>')||'|'||
     COALESCE(p.proacl::text,'<NULL>')||'|'||pg_get_functiondef(p.oid)
   ),'|' ORDER BY n.nspname,p.oid::regprocedure::text),'EMPTY'))
   FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname IN ('public','private') AND p.prokind='f')
 UNION ALL SELECT '12_app_triggers_definitions',
   (SELECT md5(COALESCE(string_agg(md5(
     n.nspname||'.'||c.relname||'.'||t.tgname||'|'||
     t.tgenabled::text||'|'||pg_get_triggerdef(t.oid)
   ),'|' ORDER BY n.nspname,c.relname,t.tgname),'EMPTY'))
   FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
     JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname IN ('public','private','auth','storage') AND NOT t.tgisinternal)
 UNION ALL SELECT '13_constraints_definitions_validation',
   (SELECT md5(COALESCE(string_agg(md5(
     n.nspname||'.'||c.relname||'.'||co.conname||'|'||
     co.convalidated::text||'|'||pg_get_constraintdef(co.oid)
   ),'|' ORDER BY n.nspname,c.relname,co.conname),'EMPTY'))
   FROM pg_constraint co JOIN pg_class c ON c.oid=co.conrelid
     JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname IN ('public','private','auth','storage'))
 UNION ALL SELECT '14_sequences_definition',
   (SELECT md5(COALESCE(string_agg(md5(
     n.nspname||'.'||c.relname||'|'||s.seqtypid::regtype::text||'|'||
     s.seqstart::text||'|'||s.seqincrement::text||'|'||
     s.seqmax::text||'|'||s.seqmin::text||'|'||s.seqcache::text||'|'||
     s.seqcycle::text
   ),'|' ORDER BY n.nspname,c.relname),'EMPTY'))
   FROM pg_sequence s JOIN pg_class c ON c.oid=s.seqrelid
     JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname IN ('public','private','auth','storage'))
 UNION ALL SELECT '15_database_extensions_versions',
   (SELECT md5(COALESCE(string_agg(extname||'='||extversion,'|' ORDER BY extname),'EMPTY'))
   FROM pg_extension)
 UNION ALL SELECT '16_app_default_privileges',
   (SELECT md5(COALESCE(string_agg(md5(
     COALESCE(n.nspname,'GLOBAL')||'|'||pg_get_userbyid(d.defaclrole)||'|'||
     d.defaclobjtype::text||'|'||d.defaclacl::text
   ),'|' ORDER BY COALESCE(n.nspname,'GLOBAL'),pg_get_userbyid(d.defaclrole),d.defaclobjtype),'EMPTY'))
   FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace
   WHERE d.defaclnamespace=0 OR n.nspname IN ('public','private','auth','storage'))
)
SELECT metric||'='||result FROM facts ORDER BY metric;
