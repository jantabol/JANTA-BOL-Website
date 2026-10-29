\set ON_ERROR_STOP on
-- RUN-09 P4-T061: after applying minimal SAFE_FIX in disposable PG17.
-- Rollback every synthetic status/tamper change; NEVER connected to production.
BEGIN;
SET LOCAL statement_timeout='20s';
DO $guard_structure$
BEGIN
 IF has_table_privilege('anon','public.live_sessions','SELECT')
  OR has_table_privilege('anon','public.live_contributions','SELECT')
 THEN RAISE EXCEPTION 'T061_ANON_PRIVATE_SESSION_TABLE_EXPOSED'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc p
  WHERE p.oid='public.jb_b10_live_update_public_eligible(uuid,uuid)'::regprocedure
    AND p.prosecdef AND p.provolatile='s'
    AND 'search_path=""'=ANY(p.proconfig))
 THEN RAISE EXCEPTION 'T061_STABLE_DEFINER_SEARCH_PATH_MISSING'; END IF;
 IF (SELECT count(*) FROM pg_policies
  WHERE schemaname='public' AND tablename='public_live_updates'
    AND policyname='public_live_updates_read'
    AND qual LIKE '%jb_b10_live_update_public_eligible%')<>1
 THEN RAISE EXCEPTION 'T061_SAFE_POLICY_NOT_APPLIED'; END IF;
END;
$guard_structure$;
SET LOCAL ROLE anon;
DO $anon_positive_negative$
DECLARE c int;
BEGIN
 SELECT count(*) INTO c FROM public.public_live_updates;
 IF c<>3 THEN RAISE EXCEPTION 'T061_EXPECT_3_PUBLIC_UPDATES_GOT_%',c;END IF;
 IF EXISTS(SELECT 1 FROM public.public_live_updates
    WHERE public_text ~* 'SENSITIVE|HIDDEN|WRONG|NOT LIVE')
 THEN RAISE EXCEPTION 'T061_PRIVATE_DATA_OR_SESSION_MISMATCH_LEAK';END IF;
 IF NOT public.jb_b10_live_update_public_eligible(
    '10000000-0000-4000-8000-000000000001'::uuid,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid)
 THEN RAISE EXCEPTION 'T061_REAL_PUBLIC_SESSION_BLOCKED';END IF;
 IF public.jb_b10_live_update_public_eligible(
    '10000000-0000-4000-8000-000000000005'::uuid,
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid)
 THEN RAISE EXCEPTION 'T061_PRIVATE_DRAFT_ORACLE_TRUE';END IF;
 IF public.jb_b10_live_update_public_eligible(
    '10000000-0000-4000-8000-000000000008'::uuid,
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid)
 THEN RAISE EXCEPTION 'T061_CROSS_ARTICLE_SESSION_TAMPER_TRUE';END IF;
 IF public.jb_b10_live_update_public_eligible(
    '99999999-0000-4000-8000-000000009999'::uuid,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid)
 THEN RAISE EXCEPTION 'T061_NONEXISTENT_SESSION_EXPOSED';END IF;
END;
$anon_positive_negative$;
RESET ROLE;

-- Simulate publication revocation and visibility toggle WITHOUT COMMIT.
UPDATE public.articles SET deleted_at=now() WHERE id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
SET LOCAL ROLE anon;
DO $soft_deleted$
BEGIN
 IF (SELECT count(*) FROM public.public_live_updates)<>2 THEN
  RAISE EXCEPTION 'T061_SOFT_DELETED_ARTICLE_STILL_PUBLIC'; END IF;
END
$soft_deleted$;
RESET ROLE;

UPDATE public.live_sessions SET live_updates_public_visible=false
WHERE id='10000000-0000-4000-8000-000000000001';
SET LOCAL ROLE anon;
DO $disabled$
BEGIN
 IF (SELECT count(*) FROM public.public_live_updates)<>1 THEN
  RAISE EXCEPTION 'T061_PUBLIC_VISIBILITY_REVOCATION_IGNORED'; END IF;
END
$disabled$;
RESET ROLE;
ROLLBACK;
\echo 'B10 T061 PG17 PASS: real anonymous 42501 fixed in fixture, private session ACL unchanged, 8-case gates+revocation+soft deletion verified.'
