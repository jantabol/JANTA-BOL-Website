\set ON_ERROR_STOP on
-- P4-T072 first genuine backend negative observation, without production writes.
-- Run only in brand-new disposable GitHub Actions PG17 named jb_t072_retry.
-- Preserve old authentic B8 SQL. Not a full T072 or T071 acceptance.
DO $scope$
BEGIN
 IF current_database() <> 'jb_t072_retry'
 OR (SELECT count(*) FROM public.articles)<>1
 OR (SELECT count(*) FROM public.ad_campaigns)<>1
 OR (SELECT count(*) FROM public.b8_cases)<>0
 OR NOT EXISTS (SELECT 1 FROM public.articles
  WHERE id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
    AND headline='Existing News Article' AND status='published')
 OR NOT EXISTS (SELECT 1 FROM public.ad_campaigns
  WHERE id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid AND status='requested')
 THEN RAISE EXCEPTION 'T072_WRONG_DB_OR_NON_ORIGINAL_FIXTURE_REFUSED'; END IF;
END $scope$;
\echo T072_EXACT_DB_ORIGINAL_FIXTURE_IDENTITY=PASS

SELECT set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
SELECT set_config('b8.fixture_session','on',false);
SELECT set_config('b8.fixture_aal','aal2',false);

-- 1: Real original authenticated Founder/AAL2 RPC commits first case.
-- Simulate only lost HTTP acknowledgement by not using the first UUID to de-duplicate.
SET ROLE authenticated;
SELECT public.jb_b8_g1_owner_create_case(
 'T072 ambiguous acknowledgement repeated business request',
 'Pichhore','R1'
) AS first_uuid \gset
RESET ROLE;
CREATE TEMP TABLE t072_attempt_ids(kind text PRIMARY KEY,id uuid NOT NULL UNIQUE);
-- The one disposable session switches to authenticated while still referencing the test UUID.
GRANT SELECT ON t072_attempt_ids TO authenticated;
INSERT INTO t072_attempt_ids VALUES ('first', :'first_uuid'::uuid);
-- The original B8 RPC executes SET ROLE authenticated; permit this fixture read only.
GRANT SELECT ON t072_attempt_ids TO authenticated;
DO $first$
BEGIN
 IF (SELECT count(*) FROM public.b8_cases)<>1
 THEN RAISE EXCEPTION 'T072_INITIAL_REAL_COMMIT_NOT_PRESENT'; END IF;
END $first$;
\echo T072_FIRST_ORIGINAL_B8_CASE_RPC_COMMITTED=PASS

-- 2: Same parameters retried. The ORIGINAL RPC has no idempotency key
-- and returns a NEW UUID; record this as a FAIL/FINDING, never PASS.
SET ROLE authenticated;
SELECT public.jb_b8_g1_owner_create_case(
 'T072 ambiguous acknowledgement repeated business request',
 'Pichhore','R1'
) AS retry_uuid \gset
RESET ROLE;
INSERT INTO t072_attempt_ids VALUES ('retry', :'retry_uuid'::uuid);
DO $dup$
BEGIN
 IF (SELECT id FROM t072_attempt_ids WHERE kind='first') = (SELECT id FROM t072_attempt_ids WHERE kind='retry')
 THEN RAISE EXCEPTION 'T072_SOURCE_CHANGED_EXPECTED_IDENTITY_RECHECK_REQUIRED'; END IF;
 IF (SELECT count(*) FROM public.b8_cases
      WHERE title='T072 ambiguous acknowledgement repeated business request') <> 2
 THEN RAISE EXCEPTION 'T072_OBSERVED_DUPLICATE_COUNT_CHANGED_RECHECK_REQUIRED';END IF;
 IF (SELECT count(DISTINCT id) FROM public.b8_cases)<>2
 THEN RAISE EXCEPTION 'T072_DUPLICATE_ORIGINAL_UUID_GUARD_FAILED';END IF;
END $dup$;
\echo T072_REAL_AMBIGUOUS_RETRY_DUPLICATED_CRITICAL_B8_CASE=OBSERVED_P2_OPEN
\echo T072_RETRY_IDEMPOTENCY_MASTER_PASS=false

-- 3: Protect valid old business records during a real transactional write failure.
ALTER TABLE public.b8_cases
 ADD CONSTRAINT t072_force_failed_partial_write CHECK (false) NOT VALID;
SET ROLE authenticated;
DO $failed$
DECLARE denied boolean:=false; details text;
BEGIN
 BEGIN
  PERFORM public.jb_b8_g1_owner_create_case(
   'T072 forced partial write must reject transaction',
   'Pichhore','R1'
  );
 EXCEPTION WHEN check_violation THEN denied:=true;
 WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS details=MESSAGE_TEXT;
  RAISE EXCEPTION 'T072_UNEXPECTED_BACKEND_ERROR %',details;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'T072_FALSE_SUCCESS_ON_FAILED_WRITE'; END IF;
END $failed$;
RESET ROLE;
DO $intact$
BEGIN
 IF (SELECT count(*) FROM public.b8_cases)<>2
 OR (SELECT count(*) FROM public.articles WHERE status='published')<>1
 OR (SELECT count(*) FROM public.ad_campaigns WHERE status='requested')<>1
 THEN RAISE EXCEPTION 'T072_FAILED_RPC_MUTATED_OLD_BUSINESS_STATE';END IF;
END $intact$;
\echo T072_REAL_PG17_FAILED_WRITE_NO_ACK_NO_PARTIAL_RECORD_AND_NEWS_AD_SURVIVE=PASS_SCOPED

-- 4: Auth dependency fail-closed while true Owner session unavailable.
SELECT set_config('b8.fixture_session','off',false);
SET ROLE authenticated;
DO $auth$
DECLARE denied boolean:=false;
BEGIN
 BEGIN
  PERFORM public.jb_b8_g1_owner_create_case(
   'T072 missing current session must deny protected write',
   'Pichhore','R1');
 EXCEPTION WHEN OTHERS THEN
  denied:=SQLERRM='B8_OWNER_AAL2_REQUIRED';
 END;
 IF NOT denied THEN RAISE EXCEPTION 'T072_FAILED_SECURITY_CHECK_ACCEPTED_WRITE';END IF;
END $auth$;
RESET ROLE;
\echo T072_MISSING_OWNER_SESSION_PROTECTED_WRITE_DENIED=PASS_SCOPED

-- 5: After repair, original B8 grant RPC is *already* idempotent by
-- primary key (case_id, reporter_user_id) and ON CONFLICT UPDATE.
ALTER TABLE public.b8_cases DROP CONSTRAINT t072_force_failed_partial_write;
SELECT set_config('b8.fixture_session','on',false);
SET ROLE authenticated;
DO $grant$
DECLARE one boolean;two boolean;
BEGIN
 one:=public.jb_b8_g1_owner_assign_reporter(
   (SELECT id FROM t072_attempt_ids WHERE kind='first'),'22222222-2222-2222-2222-222222222222'::uuid,
   now()+interval '1 day');
 two:=public.jb_b8_g1_owner_assign_reporter(
   (SELECT id FROM t072_attempt_ids WHERE kind='first'),'22222222-2222-2222-2222-222222222222'::uuid,
   now()+interval '2 days');
 IF NOT coalesce(one,false) OR NOT coalesce(two,false)
 THEN RAISE EXCEPTION 'T072_ORIGINAL_GRANT_RETRY_FAILED';END IF;
END $grant$;
RESET ROLE;
DO $end$
BEGIN
 IF (SELECT count(*) FROM public.b8_case_reporter_grants
     WHERE case_id=(SELECT id FROM t072_attempt_ids WHERE kind='first')
       AND reporter_user_id='22222222-2222-2222-2222-222222222222'::uuid)<>1
 THEN RAISE EXCEPTION 'T072_RETRY_DUPLICATED_REPORTER_GRANT';END IF;
 IF (SELECT count(*) FROM public.b8_cases)<>2
 OR (SELECT count(*) FROM public.articles WHERE status='published')<>1
 OR (SELECT count(*) FROM public.ad_campaigns WHERE status='requested')<>1
 THEN RAISE EXCEPTION 'T072_FINAL_SOURCE_NEWS_AD_CHANGED';END IF;
END $end$;
\echo T072_ORIGINAL_REPORTER_GRANT_SECOND_RETRY_NO_DUPLICATE=PASS_SCOPED
\echo T072_FULL_P4_T072_DATA_INTEGRITY_GATE=HOLD_P2_DUPLICATE_CASE_CREATION
\echo T071_FULL_E8=HOLD
\echo T075_B11_FINAL=HOLD
