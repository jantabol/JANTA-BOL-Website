-- JANTA BOL / P4-T066. Founder expressly approved minimal LIVE security fix 2026-10-24.
-- Change ONLY public.jb_ad_my_campaigns() SQL body: add current auth.sessions presence.
-- Existing signature, PostgreSQL owner, SECURITY DEFINER, search_path,
-- volatility, RETURN types, EXECUTE privileges, all user/Ad data unchanged.
-- Valid in GitHub isolated jb_b10_disposable and correct selected JANTA BOL postgres.
-- NEVER deploy to Cricket project. No paid resource or application release.
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='25s';
DO $pre$
DECLARE p record;
BEGIN
 IF current_database() NOT IN ('postgres','jb_b10_disposable') THEN
  RAISE EXCEPTION 'T066_NOT_APPROVED_DATABASE';
 END IF;
 SELECT proowner::regrole::text AS owner,prosecdef,provolatile,proretset,
        proacl::text AS acl,proconfig::text AS config,prosrc
 INTO p FROM pg_proc WHERE oid='public.jb_ad_my_campaigns()'::regprocedure;
 IF NOT FOUND OR p.owner<>'postgres' OR p.prosecdef IS DISTINCT FROM true
  OR p.provolatile<>'s' OR p.proretset IS DISTINCT FROM true THEN
  RAISE EXCEPTION 'T066_ORIGINAL_FUNCTION_IDENTITY_MISMATCH';
 END IF;
 IF NOT (lower(regexp_replace(p.prosrc,'[[:space:]]+',' ','g')) LIKE '%from public.ad_campaigns c join public.advertiser_users au on au.advertiser_id=c.advertiser_id%'
    AND lower(regexp_replace(p.prosrc,'[[:space:]]+',' ','g')) LIKE '%where au.user_id=auth.uid() order by c.created_at desc%'
    AND p.prosrc NOT LIKE '%current_session_active()%') THEN
  RAISE EXCEPTION 'T066_ORIGINAL_FUNCTION_SOURCE_DRIFT';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid='private.current_session_active()'::regprocedure AND prosecdef)
    OR NOT EXISTS(SELECT 1 FROM pg_class WHERE oid='auth.sessions'::regclass AND relkind='r') THEN
  RAISE EXCEPTION 'T066_REQUIRED_AUTH_SESSION_GUARD_ABSENT';
 END IF;
 IF has_function_privilege('anon','public.jb_ad_my_campaigns()','EXECUTE')
    OR NOT has_function_privilege('authenticated','public.jb_ad_my_campaigns()','EXECUTE')
    OR NOT has_function_privilege('service_role','public.jb_ad_my_campaigns()','EXECUTE') THEN
  RAISE EXCEPTION 'T066_EXISTING_RPC_ACL_UNEXPECTED';
 END IF;
 IF EXISTS(SELECT 1 FROM pg_class WHERE oid IN('public.ad_campaigns'::regclass,
    'public.advertiser_users'::regclass) AND NOT relrowsecurity) THEN
  RAISE EXCEPTION 'T066_ORIGINAL_AD_DATA_RLS_DISABLED';
 END IF;
END $pre$;

CREATE OR REPLACE FUNCTION public.jb_ad_my_campaigns()
RETURNS TABLE(
 id uuid, status text, placement text, scope text,
 starts_at timestamptz, ends_at timestamptz, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog','public'
AS $ad$
 SELECT c.id,c.status,c.placement,c.scope,c.starts_at,c.ends_at,c.created_at
 FROM public.ad_campaigns c
 JOIN public.advertiser_users au ON au.advertiser_id=c.advertiser_id
 WHERE au.user_id=auth.uid()
   AND private.current_session_active()
 ORDER BY c.created_at DESC
$ad$;

DO $post$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_proc
   WHERE oid='public.jb_ad_my_campaigns()'::regprocedure
     AND prosecdef AND provolatile='s'
     AND prosrc LIKE '%au.user_id=auth.uid()%'
     AND prosrc LIKE '%private.current_session_active()%')
 THEN RAISE EXCEPTION 'T066_SESSION_GUARD_NOT_INSTALLED'; END IF;
 IF has_function_privilege('anon','public.jb_ad_my_campaigns()','EXECUTE')
 OR NOT has_function_privilege('authenticated','public.jb_ad_my_campaigns()','EXECUTE')
 OR NOT has_function_privilege('service_role','public.jb_ad_my_campaigns()','EXECUTE')
 THEN RAISE EXCEPTION 'T066_RPC_ACL_CHANGED'; END IF;
END $post$;
COMMIT;
