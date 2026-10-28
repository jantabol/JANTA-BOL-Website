\set ON_ERROR_STOP on
-- Test the minimal additive REVIEW-ONLY idempotent Owner/AAL2 case creation.
-- Real original B8 SQL + genuine PG17 in ephemeral jb_t072_idempotent.
DO $guard$
BEGIN
 IF current_database()<>'jb_t072_idempotent'
 OR (SELECT count(*) FROM public.articles)<>1
 OR (SELECT count(*) FROM public.b8_cases)<>0
 OR (SELECT count(*) FROM public.ad_campaigns)<>1
 THEN RAISE EXCEPTION 'T072_IDEMPOTENCY_WRONG_DB_OR_NON_ORIGINAL_FIXTURE';END IF;
END $guard$;
SELECT set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
SELECT set_config('b8.fixture_session','on',false);
SELECT set_config('b8.fixture_aal','aal2',false);

-- First commit; emulate client acknowledgement lost, then retry SAME UUID and args.
SET ROLE authenticated;
SELECT public.jb_b8_g1_owner_create_case_idempotent(
 '77777777-7777-4777-8777-777777777771',
 'T072 Founder case idempotency replay exact payload',
 'Pichhore','R1') AS initial_case_id \gset
RESET ROLE;
CREATE TEMP TABLE t072_replay_ids(kind text primary key,case_id uuid not null);
GRANT SELECT ON t072_replay_ids TO authenticated;
INSERT INTO t072_replay_ids VALUES ('initial',:'initial_case_id'::uuid);
SET ROLE authenticated;
SELECT public.jb_b8_g1_owner_create_case_idempotent(
 '77777777-7777-4777-8777-777777777771',
 'T072 Founder case idempotency replay exact payload',
 'Pichhore','R1') AS replay_case_id \gset
RESET ROLE;
INSERT INTO t072_replay_ids VALUES ('retry',:'replay_case_id'::uuid);
DO $same$
BEGIN
 IF (SELECT case_id FROM t072_replay_ids WHERE kind='initial') <>
    (SELECT case_id FROM t072_replay_ids WHERE kind='retry')
 OR (SELECT count(*) FROM public.b8_cases)<>1
 OR (SELECT count(*) FROM public.b8_owner_case_idempotency)<>1
 THEN RAISE EXCEPTION 'T072_REPLAY_CREATED_DUPLICATE'; END IF;
END $same$;
\echo T072_PROPOSED_PG17_AMBIGUOUS_ACK_RETRY_SAME_UUID_ONE_CASE=PASS_SCOPED

-- Key reuse with mismatched payload cannot change/corrupt prior case.
SET ROLE authenticated;
DO $mismatch$
DECLARE denied boolean:=false;
BEGIN
 BEGIN
  PERFORM public.jb_b8_g1_owner_create_case_idempotent(
   '77777777-7777-4777-8777-777777777771',
   'T072 altered second case with stolen reused key',
   'Pichhore','R1');
 EXCEPTION WHEN OTHERS THEN
  denied:=SQLERRM='B8_IDEMPOTENCY_KEY_PAYLOAD_MISMATCH';
 END;
 IF NOT denied THEN RAISE EXCEPTION 'T072_KEY_REUSE_PAYLOAD_TAMPERING_SUCCEEDED';END IF;
END $mismatch$;
RESET ROLE;
\echo T072_PROPOSED_SAME_UUID_DIFFERENT_PAYLOAD_REJECTED=PASS_SCOPED

-- New key with SAME title must still be allowed as a distinct intentional case.
SET ROLE authenticated;
SELECT public.jb_b8_g1_owner_create_case_idempotent(
 '77777777-7777-4777-8777-777777777772',
 'T072 Founder case idempotency replay exact payload',
 'Pichhore','R1') AS intentional_new_id \gset
RESET ROLE;
DO $intentional$
BEGIN
 IF (SELECT count(*) FROM public.b8_cases)<>2
 OR (SELECT count(*) FROM public.b8_owner_case_idempotency)<>2
 OR (SELECT count(DISTINCT case_id) FROM public.b8_owner_case_idempotency)<>2
 THEN RAISE EXCEPTION 'T072_NEW_KEY_LEGIT_CASE_BLOCKED';END IF;
END $intentional$;
\echo T072_PROPOSED_NEW_KEY_PERMITS_LEGIT_NEW_CASE=PASS_SCOPED

-- Simulate actual database partial-write rejection before case+ledger can commit.
ALTER TABLE public.b8_cases
 ADD CONSTRAINT t072_candidate_case_write_down CHECK (false) NOT VALID;
SET ROLE authenticated;
DO $failed$
DECLARE denied boolean:=false;info text;
BEGIN
 BEGIN
  PERFORM public.jb_b8_g1_owner_create_case_idempotent(
   '77777777-7777-4777-8777-777777777773',
   'T072 failed original transaction cannot leave request ledger',
   'Pichhore','R1');
 EXCEPTION WHEN check_violation THEN denied:=true;
 WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS info=MESSAGE_TEXT;
  RAISE EXCEPTION 'T072_UNEXPECTED_FAILED_WRITE %',info;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'T072_FALSE_ACK_ON_DB_CHECK_FAILURE';END IF;
END $failed$;
RESET ROLE;
DO $noleak$
BEGIN
 IF (SELECT count(*) FROM public.b8_cases)<>2
 OR (SELECT count(*) FROM public.b8_owner_case_idempotency)<>2
 OR EXISTS (SELECT 1 FROM public.b8_owner_case_idempotency
   WHERE request_key='77777777-7777-4777-8777-777777777773')
 THEN RAISE EXCEPTION 'T072_FAILED_WRITE_LEFT_PARTIAL_LEDGER_OR_CASE';END IF;
END $noleak$;
\echo T072_PROPOSED_PG17_PARTIAL_WRITE_ROLLS_BACK_LEDGER_AND_CASE=PASS_SCOPED

-- Original table repairs; same idempotency request key now creates once, then replays.
ALTER TABLE public.b8_cases DROP CONSTRAINT t072_candidate_case_write_down;
SET ROLE authenticated;
SELECT public.jb_b8_g1_owner_create_case_idempotent(
 '77777777-7777-4777-8777-777777777773',
 'T072 failed original transaction cannot leave request ledger',
 'Pichhore','R1') AS after_repair \gset
SELECT public.jb_b8_g1_owner_create_case_idempotent(
 '77777777-7777-4777-8777-777777777773',
 'T072 failed original transaction cannot leave request ledger',
 'Pichhore','R1') AS after_repair_retry \gset
RESET ROLE;
DO $fixed$
BEGIN
 IF :'after_repair'::uuid<>:'after_repair_retry'::uuid
 OR (SELECT count(*) FROM public.b8_cases)<>3
 OR (SELECT count(*) FROM public.b8_owner_case_idempotency)<>3
 THEN RAISE EXCEPTION 'T072_FAILED_WRITE_RETRY_DUPLICATE_AFTER_REPAIR';END IF;
END $fixed$;
\echo T072_PROPOSED_REPAIR_THEN_RETRY_NO_DUPLICATE=PASS_SCOPED

-- Return old UUID must be forbidden without fresh Owner AAL2 session.
SELECT set_config('b8.fixture_session','off',false);
SET ROLE authenticated;
DO $noauth$
DECLARE denied boolean:=false;
BEGIN
 BEGIN
  PERFORM public.jb_b8_g1_owner_create_case_idempotent(
   '77777777-7777-4777-8777-777777777771',
   'T072 Founder case idempotency replay exact payload',
   'Pichhore','R1');
 EXCEPTION WHEN OTHERS THEN
  denied:=SQLERRM='B8_OWNER_AAL2_REQUIRED';
 END;
 IF NOT denied THEN RAISE EXCEPTION 'T072_UNAUTHORIZED_REPLAY_REVEALED_CASE_ID'; END IF;
END $noauth$;
RESET ROLE;
DO $privacy$
BEGIN
 IF pg_catalog.has_table_privilege('anon','public.b8_owner_case_idempotency','SELECT')
 OR pg_catalog.has_function_privilege('anon',
  'public.jb_b8_g1_owner_create_case_idempotent(uuid,text,text,text)','EXECUTE')
 OR (SELECT count(*) FROM public.articles WHERE headline='Existing News Article' AND status='published')<>1
 OR (SELECT count(*) FROM public.ad_campaigns WHERE status='requested')<>1
 THEN RAISE EXCEPTION 'T072_PRIVATE_LEDGER_OR_ORIGINAL_NEWS_AD_REGRESSION'; END IF;
END $privacy$;
\echo T072_PROPOSED_FRESH_AAL2_AND_ANON_LEDGER_DENIAL_NEWS_AD_UNCHANGED=PASS_SCOPED
\echo T072_ORIGINAL_G1_CREATE_CASE_NO_KEY=STILL_HAS_P2_FINDING_UNCHANGED
\echo T072_IDEMPOTENT_PROPOSAL_SQL_REVIEW_NOT_DEPLOYED=true
\echo T072_FULL_E1_E2_E5_RELEASE_AND_CLIENT_KEY_DURABILITY=HOLD
\echo T075_B11_FINAL_PASS_LOCK=false
