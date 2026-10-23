-- JANTA BOL B10 P4-T061 — minimal RLS dependency repair, security-scoped.
-- The original public_live_updates_read policy SELECTs private live_sessions
-- under anon, failing SQLSTATE 42501. DO NOT grant anon SELECT on live_sessions.
-- Maintains session-ID / article-ID binding and published/visible state gates.
-- Production use only after real isolated PG17 positives/negatives and rollback preflight.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '25s';

DO $preflight$
BEGIN
 IF NOT EXISTS(
   SELECT 1 FROM pg_class WHERE oid='public.public_live_updates'::regclass
     AND relrowsecurity
 ) THEN RAISE EXCEPTION 'T061_REQUIRES_EXISTING_LIVE_UPDATES_RLS'; END IF;
 IF (SELECT count(*) FROM pg_policies
    WHERE schemaname='public' AND tablename='public_live_updates'
      AND policyname='public_live_updates_read' AND cmd='SELECT'
      AND roles @> ARRAY['anon','authenticated']::name[]) <> 1
 THEN RAISE EXCEPTION 'T061_EXPECTED_ORIGINAL_PUBLIC_UPDATES_POLICY_NOT_FOUND'; END IF;
 IF has_table_privilege('anon','public.live_sessions','SELECT')
 THEN RAISE EXCEPTION 'T061_PRIVATE_LIVE_SESSIONS_ALREADY_EXPOSED'; END IF;
 IF EXISTS(SELECT 1 FROM pg_proc
     WHERE pronamespace='public'::regnamespace
       AND proname='jb_b10_live_update_public_eligible')
 THEN RAISE EXCEPTION 'T061_HELPER_ALREADY_EXISTS_STOP_FOR_REVIEW'; END IF;
END;
$preflight$;

-- Strictly scoped boolean predicate. No privileged data, sessions, or IDs returned.
-- This intentionally uses SECURITY DEFINER to evaluate private live_sessions,
-- keeping live_sessions DIRECT SELECT unavailable to anonymous clients.
CREATE FUNCTION public.jb_b10_live_update_public_eligible(
  p_session_id uuid, p_article_id uuid
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $b10_t061$
 SELECT EXISTS (
   SELECT 1
   FROM public.live_sessions AS s
   JOIN public.articles AS a ON a.id=s.article_id
   WHERE s.id=p_session_id
     AND s.article_id=p_article_id
     AND a.status='published'::public.article_status
     AND a.deleted_at IS NULL
     AND s.live_updates_public_visible IS TRUE
     AND (
       s.public_status IN('LIVE','INTERRUPTED')
       OR s.session_status='ENDED'
     )
 );
$b10_t061$;

REVOKE ALL ON FUNCTION public.jb_b10_live_update_public_eligible(uuid,uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.jb_b10_live_update_public_eligible(uuid,uuid)
  TO anon, authenticated;

-- Alter only the existing SELECT predicate, preserving policy name, role scope,
-- all table ACLs and all existing Live data/rows/functions.
ALTER POLICY public_live_updates_read ON public.public_live_updates
 USING (
  public.jb_b10_live_update_public_eligible(session_id,article_id)
 );

DO $postguard$
BEGIN
 IF has_table_privilege('anon','public.live_sessions','SELECT') OR
    has_table_privilege('anon','public.live_contributions','SELECT')
 THEN RAISE EXCEPTION 'T061_BROKE_PRIVATE_LIVE_TABLE_ACL'; END IF;
 IF NOT has_function_privilege('anon',
    'public.jb_b10_live_update_public_eligible(uuid,uuid)','EXECUTE')
 THEN RAISE EXCEPTION 'T061_PUBLIC_PROJECTION_BROKEN'; END IF;
 IF (SELECT count(*) FROM pg_policies
     WHERE schemaname='public' AND tablename='public_live_updates'
       AND policyname='public_live_updates_read' AND cmd='SELECT') <> 1
 THEN RAISE EXCEPTION 'T061_ORIGINAL_SELECT_POLICY_DROPPED'; END IF;
END;
$postguard$;
COMMIT;
