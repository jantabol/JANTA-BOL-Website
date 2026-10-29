-- P4-T066 REVIEW-ONLY. DORMANT risk: an already-signed advertiser JWT
-- with no matching auth.sessions must NOT read linked private campaigns.
-- Deploy to LIVE only after Founder release approval and hosted-identity E5.
-- Isolated PG17 CI test only. Do not modify any production object here.
BEGIN;
SET LOCAL lock_timeout='4s';
SET LOCAL statement_timeout='30s';
DO $guard$
BEGIN
 IF current_database()<>'jb_b10_disposable' THEN
  RAISE EXCEPTION 'T066_REVIEW_ONLY_DO_NOT_APPLY_TO_LIVE';
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_proc p
   WHERE p.oid='public.jb_ad_my_campaigns()'::regprocedure
   AND p.prosecdef AND p.prosrc LIKE '%advertiser_users%')
 THEN RAISE EXCEPTION 'T066_EXPECTED_ORIGINAL_ADVERTISER_RPC_MISSING'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_proc p
   WHERE p.oid='private.current_session_active()'::regprocedure AND p.prosecdef)
 THEN RAISE EXCEPTION 'T066_ACTIVE_SESSION_AUTHORITY_MISSING'; END IF;
END $guard$;

-- Exact pre-existing return structure and EXECUTE ACL retained.
-- Add ONLY one AND condition. No public/anon EXECUTE grant.
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
 IF NOT EXISTS(SELECT 1 FROM pg_proc p
   WHERE p.oid='public.jb_ad_my_campaigns()'::regprocedure
   AND p.prosecdef AND p.prosrc LIKE '%private.current_session_active()%')
 THEN RAISE EXCEPTION 'T066_BACKEND_SESSION_FILTER_NOT_PRESENT'; END IF;
 IF has_function_privilege('anon','public.jb_ad_my_campaigns()','EXECUTE')
 OR NOT has_function_privilege('authenticated','public.jb_ad_my_campaigns()','EXECUTE')
 THEN RAISE EXCEPTION 'T066_ADVERTISER_RPC_EXECUTE_REGRESSED'; END IF;
END $post$;
COMMIT;
