\set ON_ERROR_STOP on
-- JANTA BOL / P4-T073: selected REAL PG17 component negatives only.
-- Precondition: original B8 fixture + unchanged B8 G1 RPC, disposable jb_t073_security.
-- NO production database, credentials, secret rotation, or Vercel deployment touched.
DO $verify$
BEGIN
 IF current_database()<>'jb_t073_security'
 OR (SELECT count(*) FROM public.b8_cases)<>0
 OR (SELECT count(*) FROM public.articles)<>1
 OR (SELECT count(*) FROM public.ad_campaigns)<>1
 THEN RAISE EXCEPTION 'T073_WRONG_DB_OR_OLD_SOURCE_FIXTURE';END IF;
END $verify$;
\echo T073_ORIGINAL_AUTH_CASE_ARTICLE_AD_SOURCE_BASELINE=PASS

SELECT set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
SELECT set_config('b8.fixture_session','on',false);
SELECT set_config('b8.fixture_aal','aal2',false);
SET ROLE authenticated;
SELECT public.jb_b8_g1_owner_create_case(
 'T073 real original protected case for rollback evidence',
 'Pichhore','R1'
) AS protected_id \gset
RESET ROLE;
CREATE TEMP TABLE t073_original(id uuid primary key);
INSERT INTO t073_original VALUES(:'protected_id'::uuid);
GRANT SELECT ON t073_original TO authenticated;

-- Add legitimate linked reporter grant; deletion of the case must be rejected by
-- the original restrictive FK, NOT silently erase attached verified records.
SET ROLE authenticated;
SELECT public.jb_b8_g1_owner_assign_reporter(
 (SELECT id FROM t073_original),
 '22222222-2222-2222-2222-222222222222'::uuid,
 now()+interval '2 days') AS grant_ok \gset
RESET ROLE;
DO $link$
BEGIN
 IF (SELECT count(*) FROM public.b8_case_reporter_grants
   WHERE case_id=(SELECT id FROM t073_original))<>1
 THEN RAISE EXCEPTION 'T073_ORIGINAL_REPORTER_LINK_NOT_PRESENT';END IF;
END $link$;
\echo T073_ORIGINAL_B8_CASE_AND_REPORTER_FK_LINK_PERSISTED=PASS

-- Real constraint failure, not a mocked reply.
DO $corrupt$
DECLARE denied boolean:=false; 
BEGIN
 BEGIN
  UPDATE public.b8_cases SET risk_lane='DANGEROUS_INVALID'
  WHERE id=(SELECT id FROM t073_original);
 EXCEPTION WHEN check_violation THEN denied:=true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'T073_INVALID_RISK_LANE_CORRUPTED_SAVED_CASE';END IF;
 IF (SELECT risk_lane FROM public.b8_cases WHERE id=(SELECT id FROM t073_original))<>'R1'
 THEN RAISE EXCEPTION 'T073_FAILED_CORRUPTION_CHANGED_ORIGINAL_LANE';END IF;
END $corrupt$;
\echo T073_REAL_PG17_INVALID_AUTHORITATIVE_CASE_CORRUPTION_DENIED=PASS

-- Accidental hard delete of a linked case MUST fail on the authentic FK RESTRICT.
DO $delete$
DECLARE denied boolean:=false;
BEGIN
 BEGIN
  DELETE FROM public.b8_cases WHERE id=(SELECT id FROM t073_original);
 EXCEPTION WHEN foreign_key_violation THEN denied:=true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'T073_LINKED_CASE_HARD_DELETE_WAS_ALLOWED'; END IF;
 IF (SELECT count(*) FROM public.b8_cases WHERE id=(SELECT id FROM t073_original))<>1
 OR (SELECT count(*) FROM public.b8_case_reporter_grants
    WHERE case_id=(SELECT id FROM t073_original))<>1
 THEN RAISE EXCEPTION 'T073_FAILED_DELETE_DAMAGED_LINKED_RECORDS'; END IF;
END $delete$;
\echo T073_REAL_PG17_LINKED_CASE_ACCIDENTAL_DELETE_RESTRICTED=PASS

-- Simulate an explicit DB function grant being taken away, with role authenticated
-- and real RPC SQL permission failure, restore grant only on isolated PG17.
REVOKE EXECUTE ON FUNCTION public.jb_b8_g1_owner_create_case(text,text,text)
 FROM authenticated;
SET ROLE authenticated;
DO $security$
DECLARE denied boolean:=false;
BEGIN
 BEGIN
  PERFORM public.jb_b8_g1_owner_create_case(
    'T073 forbidden new case during revoked function permission',
    'Pichhore','R1');
 EXCEPTION WHEN insufficient_privilege THEN denied:=true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'T073_REVOKED_HIGH_AUTH_RPC_REMAINED_CALLABLE'; END IF;
END $security$;
RESET ROLE;
GRANT EXECUTE ON FUNCTION public.jb_b8_g1_owner_create_case(text,text,text)
 TO authenticated;
\echo T073_REAL_PG17_PROTECTED_HIGH_AUTH_FUNCTION_REVOKE_DENIED_AND_RECOVERED=PASS

-- One authentic proposed additive SQL migration deployed and ROLLED BACK
-- within one same transaction. Never run against actual Supabase/Production.
BEGIN;
\i JANTA_BOL_PHASE_4_WORKING/db/20261028_t072_b8_case_idempotency_PROPOSAL_REVIEW_ONLY.sql
DO $migration$
BEGIN
 IF pg_catalog.to_regclass('public.b8_owner_case_idempotency') IS NULL
 OR pg_catalog.to_regprocedure(
 'public.jb_b8_g1_owner_create_case_idempotent(uuid,text,text,text)') IS NULL
 THEN RAISE EXCEPTION 'T073_PROPOSAL_DDL_NOT_MATERIALIZED_IN_TX';END IF;
END $migration$;
ROLLBACK;
DO $rolled$
BEGIN
 IF pg_catalog.to_regclass('public.b8_owner_case_idempotency') IS NOT NULL
 OR pg_catalog.to_regprocedure(
 'public.jb_b8_g1_owner_create_case_idempotent(uuid,text,text,text)') IS NOT NULL
 THEN RAISE EXCEPTION 'T073_REVIEW_ONLY_DDL_LEFT_AFTER_REAL_TRANSACTION_ROLLBACK'; END IF;
 IF (SELECT count(*) FROM public.b8_cases)<>1
 OR (SELECT count(*) FROM public.b8_case_reporter_grants)<>1
 OR (SELECT count(*) FROM public.articles WHERE headline='Existing News Article' AND status='published')<>1
 OR (SELECT count(*) FROM public.ad_campaigns WHERE status='requested')<>1
 THEN RAISE EXCEPTION 'T073_MIGRATION_ROLLBACK_LOST_ORIGINAL_DATA';END IF;
END $rolled$;
\echo T073_REAL_PG17_ADDITIVE_PROPOSAL_SQL_TRANSACTION_ROLLBACK_OLD_RECORDS_SURVIVE=PASS

-- After the simulated permission incident, a fresh Owner/AAL2 source RPC still
-- creates a valid case. No old state silently reconstructed or overwritten.
SET ROLE authenticated;
SELECT public.jb_b8_g1_owner_create_case(
 'T073 post incident recovery original Owner case created',
 'Pichhore','R0') AS after_recovery \gset
RESET ROLE;
DO $post$
BEGIN
 IF (SELECT count(*) FROM public.b8_cases)<>2
 OR NOT EXISTS(SELECT 1 FROM public.b8_cases
   WHERE title='T073 post incident recovery original Owner case created' AND risk_lane='R0')
 THEN RAISE EXCEPTION 'T073_PERMISSIONS_RESTORED_BUT_ORIGINAL_CASE_RPC_FAILED';END IF;
 IF (SELECT count(*) FROM public.articles WHERE status='published')<>1
 OR (SELECT count(*) FROM public.ad_campaigns WHERE status='requested')<>1
 THEN RAISE EXCEPTION 'T073_OLD_NEWS_AD_CHANGED_AFTER_REPAIR';END IF;
END $post$;
\echo T073_REAL_PG17_OWNER_RPC_RECOVERS_WITH_OLD_NEWS_AD_PRESERVED=PASS
\echo T073_REAL_PRODUCTION_SECRET_ROTATION_OR_DEPLOY_ROLLBACK=NOT_TESTED
\echo T073_ACCIDENTAL_SOFT_DELETE_VS_DISASTER_RESTORE=NOT_TESTED
\echo T073_FULL_E8_AND_B11_T075_FINAL=HOLD
