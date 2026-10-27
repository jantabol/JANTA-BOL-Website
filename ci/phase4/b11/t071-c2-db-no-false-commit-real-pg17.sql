\set ON_ERROR_STOP on
-- P4 T071 C2 Database #13: actual original B8 SECURITY DEFINER write RPC
-- against genuine disposable PostgreSQL17 forced table outage.
-- No production, no Supabase Auth credentials, no false success claims.
DO $g$
BEGIN
 IF current_database()<>'jb_t071_c2_commit'
 OR (SELECT count(*) FROM public.articles)<>1
 OR (SELECT count(*) FROM public.ad_campaigns)<>1
 THEN RAISE EXCEPTION 'C2_DB_WRONG_DATABASE_OR_SOURCE_FIXTURE'; END IF;
END $g$;
SELECT set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
SELECT set_config('b8.fixture_session','on',false);
SELECT set_config('b8.fixture_aal','aal2',false);
-- Baseline original B8 RPC: real backend committed write survives.
SET ROLE authenticated;
SELECT public.jb_b8_g1_owner_create_case(
 'C2 DB actual core baseline approved case',
 'Pichhore','R1'
) AS baseline_case \gset
RESET ROLE;
CREATE TEMP TABLE t071_c2_db_baseline(id uuid primary key);
INSERT INTO t071_c2_db_baseline VALUES(:'baseline_case'::uuid);
DO $check$
BEGIN
 IF (SELECT count(*) FROM public.b8_cases
  WHERE id=(SELECT id FROM t071_c2_db_baseline))<>1
 THEN RAISE EXCEPTION 'C2_BASELINE_B8_CASE_NOT_COMMITTED'; END IF;
END $check$;
\echo T071_C2_DB_ORIGINAL_B8_COMMIT_BASELINE=PASS

-- Real database fault, NOT a JavaScript mock/network dependency.
-- Reject all new B8 case insertions at the original table, leaving prior rows.
ALTER TABLE public.b8_cases
 ADD CONSTRAINT t071_c2_disposable_db_unavailable CHECK(false) NOT VALID;
-- Actual SOURCE function either propagates the PostgreSQL violation,
-- or the test would FAIL on any false success/UUID returned by RPC.
SET ROLE authenticated;
DO $fault$
DECLARE rejected boolean:=false; s text;
BEGIN
 BEGIN
  PERFORM public.jb_b8_g1_owner_create_case(
   'C2 DB outage must never acknowledge commit',
   'Pichhore','R1');
 EXCEPTION WHEN check_violation THEN rejected:=true;
 WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS s=MESSAGE_TEXT;
  RAISE EXCEPTION 'C2_DB_UNEXPECTED_SOURCE_RESULT: %',s;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'C2_DB_FALSE_COMMIT_ACK';END IF;
END $fault$;
RESET ROLE;
\echo T071_C2_DB_ORIGINAL_B8_WRITE_REJECTED_NO_FALSE_SUCCESS=PASS

DO $check$
BEGIN
 IF (SELECT count(*) FROM public.b8_cases)<>1
 OR NOT EXISTS(SELECT 1 FROM public.b8_cases
    WHERE id=(SELECT id FROM t071_c2_db_baseline))
 THEN RAISE EXCEPTION 'C2_DB_PARTIAL_FAILED_WRITE_OR_PREVIOUS_LOST'; END IF;
 IF (SELECT count(*) FROM public.articles
    WHERE headline='Existing News Article' AND status='published')<>1
 OR (SELECT count(*) FROM public.ad_campaigns
    WHERE status='requested')<>1
 THEN RAISE EXCEPTION 'C2_DB_OLD_PUBLISH_AD_REGRESSION'; END IF;
END $check$;
\echo T071_C2_DB_ABORTED_CASE_NOT_COMMITTED_PREVIOUS_NEWS_AD_OK=PASS

ALTER TABLE public.b8_cases DROP CONSTRAINT t071_c2_disposable_db_unavailable;
-- Recovery: original function commits new case again, once.
SET ROLE authenticated;
SELECT public.jb_b8_g1_owner_create_case(
 'C2 DB verified post-recovery core case',
 'Pichhore','R1'
) AS after_case \gset
RESET ROLE;
CREATE TEMP TABLE t071_c2_db_recovery(id uuid primary key);
INSERT INTO t071_c2_db_recovery VALUES(:'after_case'::uuid);
DO $recover$
BEGIN
 IF (SELECT count(*) FROM public.b8_cases)<>2
 OR NOT EXISTS(SELECT 1 FROM public.b8_cases
   WHERE id=(SELECT id FROM t071_c2_db_recovery))
 THEN RAISE EXCEPTION 'C2_DB_RECOVERY_DID_NOT_COMMIT'; END IF;
END $recover$;
\echo T071_C2_DB_ORIGINAL_B8_RECOVERY_REAL_COMMIT=PASS
-- Auth check: removing synthetic Owner session must deny the original RPC.
SELECT set_config('b8.fixture_session','off',false);
SET ROLE authenticated;
DO $denied$
DECLARE ok boolean:=false;
BEGIN
 BEGIN
  PERFORM public.jb_b8_g1_owner_create_case(
   'C2 DB forbidden anonymous owner escalation','Pichhore','R1');
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM='B8_OWNER_AAL2_REQUIRED' THEN ok:=true; END IF;
 END;
 IF NOT ok THEN RAISE EXCEPTION 'C2_DB_AAL2_SECURITY_NOT_ENFORCED'; END IF;
END $denied$;
RESET ROLE;
DO $end$
BEGIN
 IF (SELECT count(*) FROM public.b8_cases)<>2
 THEN RAISE EXCEPTION 'C2_DB_UNAUTHORIZED_CASE_CREATED'; END IF;
END $end$;
\echo T071_C2_DB_ORIGINAL_B8_AAL2_DENIAL_NO_WRITE=PASS
\echo T071_C2_DB_ACTUAL_LOCAL_PG17_NEGATIVE_ACK=PASS_COMPONENT_SCOPE
\echo T071_C2_DATABASE_FULL_HOSTED_TRANSACTION_E8=HOLD
\echo T071_C1_FINAL=HOLD
\echo T071_FINAL_PASS_LOCK=false
