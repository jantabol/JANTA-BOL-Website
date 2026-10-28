-- Phase 4 B12 T078: READ-ONLY schema/authority inventory. No BEGIN/DDL/UPDATE.
-- Run only against JANTA BOL Supabase vrffsnkycvjithwtiylt, NOT Cricket.
-- Catalog metadata only; never SELECT private rows or tokens.
SELECT
 current_database() AS database_name,
 current_setting('server_version_num')::integer AS postgres_version_num,
 (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r') AS public_base_tables,
 (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity) AS public_rls_enabled,
 (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public') AS public_functions,
 to_regclass('public.articles') IS NOT NULL AS canonical_articles_present,
 to_regclass('public.article_versions') IS NOT NULL AS article_versions_present,
 to_regclass('public.audit_logs') IS NOT NULL AS audit_history_present,
 to_regclass('public.grievances') IS NOT NULL AS grievance_present,
 to_regclass('public.ad_campaigns') IS NOT NULL AS ads_present,
 to_regclass('public.b8_cases') IS NOT NULL AS b8_cases_present,
 to_regclass('public.live_sessions') IS NOT NULL AS live_sessions_present,
 to_regprocedure('public.jb_b8_g1_owner_create_case_idempotent(uuid,text,text,text)') IS NOT NULL
    AS proposed_t072_idempotent_rpc_deployed,
 (SELECT count(*) FROM pg_policies p WHERE p.schemaname='public') AS public_policies,
 (SELECT count(*) FROM pg_tables t WHERE t.schemaname='public'
    AND NOT t.rowsecurity) AS public_tables_without_rls;
