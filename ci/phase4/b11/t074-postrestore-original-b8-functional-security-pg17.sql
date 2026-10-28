\set ON_ERROR_STOP on
-- P4-T074: real isolated PG17 *restored* original B8 functional/negative tests.
-- Supabase auth/session/AAL functions are TEST FIXTURE ONLY, NOT real hosted Auth.
-- Never run on production. Database must be jb_t074_restored.
SELECT CASE WHEN current_database()='jb_t074_restored' AND
  current_setting('server_version_num')::int >= 170000
 THEN 'T074_RESTORED_DATABASE_FENCE=PASS'
 ELSE 1/0::text END;

SELECT set_config('b8.fixture_case_id', :'case_id', false);
SELECT set_config('b8.fixture_draft_id', :'draft_id', false);

DO $test$
DECLARE
 c uuid:=current_setting('b8.fixture_case_id')::uuid;
 d uuid:=current_setting('b8.fixture_draft_id')::uuid;
BEGIN
 IF (SELECT count(*) FROM public.b8_cases WHERE id=c AND
     title='T074 genuine postrestore original Owner case' AND risk_lane='R1'
     AND created_by='11111111-1111-1111-1111-111111111111'::uuid)<>1
 THEN RAISE EXCEPTION 'T074_RESTORED_ORIGINAL_CASE_ID_OR_CONTENT_MISMATCH'; END IF;
 IF (SELECT count(*) FROM public.b8_case_reporter_grants
     WHERE case_id=c AND reporter_user_id='22222222-2222-2222-2222-222222222222'::uuid
     AND revoked_at IS NULL AND expires_at>now())<>1
 THEN RAISE EXCEPTION 'T074_RESTORED_REPORTER_GRANT_MISSING'; END IF;
 IF (SELECT count(*) FROM public.b8_question_drafts
     WHERE id=d AND case_id=c AND reporter_user_id='22222222-2222-2222-2222-222222222222'::uuid
     AND question_text='What is the verified status of the public-interest record?')<>1
 THEN RAISE EXCEPTION 'T074_RESTORED_REPORTER_DRAFT_ID_OR_CONTENT_MISMATCH'; END IF;
 IF (SELECT count(*) FROM public.articles
     WHERE id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
       AND headline='Existing News Article' AND status='published')<>1
 THEN RAISE EXCEPTION 'T074_EXISTING_NEWS_ARTICLE_WAS_MUTATED'; END IF;
 IF (SELECT count(*) FROM public.ad_campaigns
     WHERE id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
       AND status='requested')<>1
 THEN RAISE EXCEPTION 'T074_EXISTING_AD_WAS_MUTATED'; END IF;
 IF (SELECT count(*) FROM public.b8_cases)<>1
 THEN RAISE EXCEPTION 'T074_UNEXPECTED_CASE_COUNT'; END IF;
 IF (SELECT count(*) FROM public.b8_question_drafts)<>1
 THEN RAISE EXCEPTION 'T074_UNEXPECTED_DRAFT_COUNT'; END IF;
 IF EXISTS(
   SELECT 1 FROM pg_class
   WHERE oid IN('public.b8_cases'::regclass,
                'public.b8_case_reporter_grants'::regclass,
                'public.b8_question_drafts'::regclass) AND NOT relrowsecurity)
 THEN RAISE EXCEPTION 'T074_RESTORED_RLS_OFF'; END IF;
 IF has_table_privilege('anon','public.b8_cases','SELECT') OR
    has_table_privilege('authenticated','public.b8_cases','SELECT') OR
    has_table_privilege('authenticated','public.b8_question_drafts','SELECT') OR
    has_table_privilege('anon','public.b8_case_reporter_grants','SELECT')
 THEN RAISE EXCEPTION 'T074_PRIVATE_TABLE_EXPOSED'; END IF;
 IF has_function_privilege('anon','public.jb_b8_g1_owner_create_case(text,text,text)','EXECUTE')
 THEN RAISE EXCEPTION 'T074_ANON_OWNER_RPC_EXPOSED'; END IF;
END $test$;
\echo T074_RESTORED_CASE_GRANT_DRAFT_ARTICLE_AD_RLS_INTEGRITY=PASS

-- Real effective SQL permission denial as authenticated, not just catalog text.
SELECT set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
SELECT set_config('b8.fixture_session','on',false);
SELECT set_config('b8.fixture_aal','aal2',false);
SET ROLE authenticated;
DO $test$
DECLARE denied boolean:=false;
BEGIN
 BEGIN
   EXECUTE 'SELECT count(*) FROM public.b8_cases';
 EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'T074_RAW_CASE_AUTHENTICATED_READ_BYPASS'; END IF;
END $test$;
RESET ROLE;
\echo T074_RESTORED_EFFECTIVE_AUTHENTICATED_RAW_PRIVATE_READ_DENIED=PASS

-- AAL1 owner cannot create: check error, preserve count.
SELECT set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
SELECT set_config('b8.fixture_session','on',false);
SELECT set_config('b8.fixture_aal','aal1',false);
SET ROLE authenticated;
DO $test$
DECLARE denied boolean:=false;
BEGIN
 BEGIN
   PERFORM public.jb_b8_g1_owner_create_case('T074 unauthorized low assurance case','Pichhore','R1');
 EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='B8_OWNER_AAL2_REQUIRED'; END;
 IF NOT denied THEN RAISE EXCEPTION 'T074_AAL1_OWNER_CASE_CREATED'; END IF;
END $test$;
RESET ROLE;
\echo T074_RESTORED_AAL1_OWNER_WRITE_DENIED=PASS

-- Expired/inactive owner session cannot create even with fixture AAL2.
SELECT set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
SELECT set_config('b8.fixture_session','off',false);
SELECT set_config('b8.fixture_aal','aal2',false);
SET ROLE authenticated;
DO $test$
DECLARE denied boolean:=false;
BEGIN
 BEGIN
   PERFORM public.jb_b8_g1_owner_create_case('T074 unauthorized stale session case','Pichhore','R1');
 EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='B8_OWNER_AAL2_REQUIRED'; END;
 IF NOT denied THEN RAISE EXCEPTION 'T074_STALE_OWNER_SESSION_WRITE_BYPASS'; END IF;
END $test$;
RESET ROLE;
\echo T074_RESTORED_INACTIVE_OWNER_SESSION_DENIED=PASS

-- Unassigned reporter cannot read the revived case card.
SELECT set_config('b8.fixture_actor','33333333-3333-3333-3333-333333333333',false);
SELECT set_config('b8.fixture_session','on',false);
SELECT set_config('b8.fixture_aal','aal1',false);
SET ROLE authenticated;
DO $test$
DECLARE denied boolean:=false;
BEGIN
 BEGIN
   PERFORM public.jb_b8_g1_reporter_case_card(current_setting('b8.fixture_case_id')::uuid);
 EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='B8_ASSIGNED_ACTIVE_REPORTER_REQUIRED'; END;
 IF NOT denied THEN RAISE EXCEPTION 'T074_UNASSIGNED_REPORTER_CROSS_CASE_ACCESS'; END IF;
END $test$;
RESET ROLE;
\echo T074_RESTORED_UNASSIGNED_REPORTER_DENIED=PASS

-- Authorized reporter resumes real restored private read/write path.
SELECT set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
SELECT set_config('b8.fixture_session','on',false);
SELECT set_config('b8.fixture_aal','aal1',false);
SET ROLE authenticated;
SELECT CASE WHEN (public.jb_b8_g1_reporter_case_card(
  current_setting('b8.fixture_case_id')::uuid)->>'title')=
  'T074 genuine postrestore original Owner case' THEN 'T074_RESTORED_AUTHORIZED_REPORTER_CARD=PASS'
 ELSE 1/0::text END;
SELECT public.jb_b8_g1_reporter_create_draft(
 current_setting('b8.fixture_case_id')::uuid,
 'After clean restore, can the assigned reporter still draft securely?',
 'Local Public Office');
RESET ROLE;
\echo T074_RESTORED_AUTHORIZED_REPORTER_POSTRESTORE_NEW_DRAFT=PASS

-- Founder action revokes reporter after restore and must immediately deny future reads.
SELECT set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
SELECT set_config('b8.fixture_session','on',false);
SELECT set_config('b8.fixture_aal','aal2',false);
SET ROLE authenticated;
SELECT CASE WHEN public.jb_b8_g1_owner_revoke_reporter(
  current_setting('b8.fixture_case_id')::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid)
 THEN 'T074_RESTORED_OWNER_REPORTER_REVOKE=PASS'
 ELSE 1/0::text END;
RESET ROLE;
SELECT set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
SELECT set_config('b8.fixture_session','on',false);
SELECT set_config('b8.fixture_aal','aal1',false);
SET ROLE authenticated;
DO $test$
DECLARE denied boolean:=false;
BEGIN
 BEGIN
   PERFORM public.jb_b8_g1_reporter_case_card(current_setting('b8.fixture_case_id')::uuid);
 EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='B8_ASSIGNED_ACTIVE_REPORTER_REQUIRED'; END;
 IF NOT denied THEN RAISE EXCEPTION 'T074_REVOKED_REPORTER_STILL_CAN_READ_CASE'; END IF;
END $test$;
RESET ROLE;
\echo T074_RESTORED_REPORTER_REVOKE_EFFECTIVE=PASS

DO $test$
BEGIN
 IF (SELECT count(*) FROM public.b8_cases)<>1
  OR (SELECT count(*) FROM public.b8_question_drafts)<>2
  OR (SELECT count(*) FROM public.b8_case_reporter_grants WHERE revoked_at IS NOT NULL)<>1
 THEN RAISE EXCEPTION 'T074_POSTRESTORE_NEGATIVE_PROBES_CHANGED_UNEXPECTED_ROWS'; END IF;
 IF (SELECT count(*) FROM public.articles WHERE status='published')<>1 OR
    (SELECT count(*) FROM public.ad_campaigns WHERE status='requested')<>1
 THEN RAISE EXCEPTION 'T074_OLD_NEWS_AD_DISTURBED_BY_RECOVERY_TEST'; END IF;
END $test$;
\echo T074_POSTRESTORE_NEGATIVE_PROBES_NO_UNEXPECTED_WRITES=PASS
