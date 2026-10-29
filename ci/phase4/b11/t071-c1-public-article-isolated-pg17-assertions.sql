\set ON_ERROR_STOP on
-- Run only after PG17 fixture and proposed review-only RPC. No production keys.
BEGIN;
DO $guard$
BEGIN
 IF current_database() <> 'jb_t071_c1_ephemeral'
 OR (SELECT count(*) FROM public.articles) <> 4
 THEN RAISE EXCEPTION 'C1_NOT_EPHEMERAL_WRONG_FIXTURE'; END IF;
END $guard$;
SET LOCAL ROLE anon;
DO $test$
DECLARE d jsonb; i jsonb; result_count integer;
BEGIN
 IF has_table_privilege(current_user,'public.articles','SELECT') THEN
  RAISE EXCEPTION 'C1_ANON_DIRECT_TABLE_GRANT_UNSAFE'; END IF;
 IF NOT has_function_privilege(current_user,'public.jb_c1_public_articles(uuid,integer)','EXECUTE') THEN
  RAISE EXCEPTION 'C1_ANON_RPC_EXECUTE_DENIED'; END IF;
 d:=public.jb_c1_public_articles(NULL,20);
 IF jsonb_typeof(d->'items')<>'array' OR jsonb_array_length(d->'items')<>1 THEN
  RAISE EXCEPTION 'C1_PUBLISHED_FILTER_FAILED: %', d; END IF;
 i:=d->'items'->0;
 IF i->>'id'<>'00000000-0000-4000-8000-000000000001'
 OR i->>'status'<>'published'
 OR i->>'body'<>'THE FULL PUBLIC ARTICLE BODY'
 OR i->>'excerpt'<>'Verified public excerpt' THEN
  RAISE EXCEPTION 'C1_PUBLIC_ARTICLE_FULL_BODY_MISSING'; END IF;
 IF i ? 'source_name' OR i ? 'source_url' OR i ? 'created_by' OR i ? 'updated_by'
 OR i ? 'deleted_at' OR i ? 'internal_notes' THEN
  RAISE EXCEPTION 'C1_PRIVATE_COLUMNS_LEAKED';END IF;
 IF (d::text LIKE '%TOP SECRET%' OR d::text LIKE '%PRIVATE SOURCE%'
 OR d::text LIKE '%SOFT DELETED%' OR d::text LIKE '%UNVERIFIED BODY%') THEN
  RAISE EXCEPTION 'C1_UNPUBLISHED_OR_DELETED_CONTENT_LEAK'; END IF;
 IF jsonb_array_length((public.jb_c1_public_articles(
  '00000000-0000-4000-8000-000000000002'::uuid,1))->'items')<>0 THEN
  RAISE EXCEPTION 'C1_DRAFT_LOOKUP_LEAK';END IF;
 IF jsonb_array_length((public.jb_c1_public_articles(
  '00000000-0000-4000-8000-000000000003'::uuid,1))->'items')<>0 THEN
  RAISE EXCEPTION 'C1_SOFT_DELETED_LOOKUP_LEAK';END IF;
 IF jsonb_array_length((public.jb_c1_public_articles(
  '00000000-0000-4000-8000-000000000004'::uuid,1))->'items')<>0 THEN
  RAISE EXCEPTION 'C1_NULL_PUBLISHED_AT_LOOKUP_LEAK';END IF;
 IF jsonb_array_length((public.jb_c1_public_articles(
  '00000000-0000-4000-8000-000000000001'::uuid,1))->'items')<>1 THEN
  RAISE EXCEPTION 'C1_VALID_UUID_LOOKUP_FAILED';END IF;
 IF jsonb_array_length((public.jb_c1_public_articles(
  '00000000-0000-4000-8000-000000000005'::uuid,1))->'items')<>0 THEN
  RAISE EXCEPTION 'C1_UNKNOWN_UUID_LOOKUP_MUST_NOT_EXPOSE';END IF;
 IF jsonb_array_length((public.jb_c1_public_articles(NULL,-100))->'items')<>1
 OR jsonb_array_length((public.jb_c1_public_articles(NULL,999999))->'items')<>1 THEN
  RAISE EXCEPTION 'C1_UNSAFE_LIMIT';END IF;
END $test$;
RESET ROLE;
DO $original$
BEGIN
 IF (SELECT count(*) FROM public.articles)<>4
 THEN RAISE EXCEPTION 'C1_PUBLISH_STATE_WAS_MUTATED';END IF;
END $original$;
ROLLBACK;
\echo C1_TRUE_POSTGRESQL17_ANON_FULL_ARTICLE_BODY=PASS
\echo C1_TRUE_POSTGRESQL17_ANON_NO_DIRECT_TABLE_READ=PASS
\echo C1_TRUE_POSTGRESQL17_PRIVATE_DRAFT_DELETED_MISSING_TIME=DENIED
\echo C1_TRUE_POSTGRESQL17_INTERNAL_SOURCE_AND_AUTH_FIELDS=NOT_EXPOSED
\echo C1_TRUE_POSTGRESQL17_ORIGINAL_ARTICLE_STATE_UNCHANGED=PASS
\echo C1_REAL_HOSTED_BROWSER_PRODUCTION_STATE=NOT_VERIFIED
