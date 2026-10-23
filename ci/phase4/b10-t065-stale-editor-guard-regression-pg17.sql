\set ON_ERROR_STOP on
-- T065 GREEN regression - after REVIEW_ONLY migration in isolated PG17; NOTHING permanent.
BEGIN;
SET LOCAL statement_timeout='20s';
-- Add synthetic valid Editor session and activate Reporter in disposable fixture ONLY.
INSERT INTO auth.sessions(id,user_id)
VALUES('30000000-0000-4000-8000-000000000065','33333333-3333-3333-3333-333333333333');
UPDATE public.team_accounts SET status='active' WHERE user_id='22222222-2222-2222-2222-222222222222';
SELECT set_config('b9.test_uid','33333333-3333-3333-3333-333333333333',true),
       set_config('b9.test_aal','aal1',true),
       set_config('request.jwt.claims','{"session_id":"90000000-0000-4000-8000-000000000065","aal":"aal1"}',true);
SET LOCAL ROLE authenticated;
DO $stale_editor$
DECLARE n int;blocked boolean:=false;
BEGIN
 IF private.current_session_active() THEN RAISE EXCEPTION 'T065_STALE_EDITOR_SESSION_WRONGLY_ACTIVE';END IF;
 UPDATE public.articles SET excerpt='SHOULD_NOT_APPLY' WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>0 THEN RAISE EXCEPTION 'T065_STALE_EDITOR_UPDATE_STILL_ALLOWED';END IF;
 BEGIN
  INSERT INTO public.articles(id,slug,status,title,body,created_by)
  VALUES('99990000-0000-4000-8000-000000000065','t065-stale-editor-new','draft','No','No',auth.uid());
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'T065_STALE_EDITOR_INSERT_STILL_ALLOWED';END IF;
END $stale_editor$;
RESET ROLE;
SELECT set_config('request.jwt.claims','{"session_id":"30000000-0000-4000-8000-000000000065","aal":"aal1"}',true);
SET LOCAL ROLE authenticated;
DO $active_editor$
DECLARE n int;
BEGIN
 IF NOT private.current_session_active() THEN RAISE EXCEPTION 'T065_ACTIVE_EDITOR_SESSION_LOST';END IF;
 UPDATE public.articles SET excerpt='T065_VALID_EDITOR_ROLLBACK_ONLY' WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>1 THEN RAISE EXCEPTION 'T065_REAL_EDITOR_UPDATE_REGRESSED';END IF;
 INSERT INTO public.articles(id,slug,status,title,body,created_by)
 VALUES('99990000-0000-4000-8000-000000000065','t065-valid-editor','draft','Yes','Yes',auth.uid());
END $active_editor$;
RESET ROLE;
SELECT set_config('b9.test_uid','22222222-2222-2222-2222-222222222222',true),
       set_config('request.jwt.claims','{"session_id":"90000000-0000-4000-8000-000000000065","aal":"aal1"}',true);
SET LOCAL ROLE authenticated;
DO $stale_reporter$
DECLARE blocked boolean:=false;
BEGIN
 IF private.current_session_active() THEN RAISE EXCEPTION 'T065_STALE_REPORTER_SESSION_WRONGLY_ACTIVE';END IF;
 BEGIN
  INSERT INTO public.articles(id,slug,status,title,body,created_by)
  VALUES('99990000-0000-4000-8000-000000000066','t065-stale-reporter','draft','No','No',auth.uid());
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'T065_STALE_REPORTER_INSERT_STILL_ALLOWED';END IF;
END $stale_reporter$;
RESET ROLE;
SELECT set_config('request.jwt.claims','{"session_id":"20000000-0000-4000-8000-000000000063","aal":"aal1"}',true);
SET LOCAL ROLE authenticated;
DO $active_reporter$
DECLARE n int;
BEGIN
 IF NOT private.current_session_active() THEN RAISE EXCEPTION 'T065_ACTIVE_REPORTER_SESSION_LOST';END IF;
 UPDATE public.articles SET excerpt='T065_REPORTER_OWN_DRAFT_ROLLBACK_ONLY'
 WHERE id='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>1 THEN RAISE EXCEPTION 'T065_REAL_REPORTER_OWN_DRAFT_REGRESSED';END IF;
END $active_reporter$;
RESET ROLE;
SELECT set_config('b9.test_uid','11111111-1111-1111-1111-111111111111',true),
       set_config('b9.test_aal','aal2',true),
       set_config('request.jwt.claims','{"session_id":"10000000-0000-4000-8000-000000000063","aal":"aal2"}',true);
SET LOCAL ROLE authenticated;
DO $owner_positive$
DECLARE n int;
BEGIN
 IF NOT private.current_session_active() OR NOT private.current_owner_aal2()
 THEN RAISE EXCEPTION 'T065_OWNER_SESSION_AAL2_POSITIVE_MISSING';END IF;
 UPDATE public.articles SET excerpt='T065_OWNER_VALID_ROLLBACK_ONLY'
 WHERE id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>1 THEN RAISE EXCEPTION 'T065_OWNER_UPDATE_REGRESSED rows=% role=% backend_session=% owner_aal2=% visible_bbb=% b10_session_flag=%',n,private.current_app_role(),private.current_session_active(),private.current_owner_aal2(),(SELECT count(*) FROM public.articles WHERE id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),current_setting('b10.session_active',true);END IF;
END $owner_positive$;
RESET ROLE;
ROLLBACK;
\echo 'T065 GREEN: stale Editor/Reporter INSERT+UPDATE DENIED; valid Editor/Reporter/Owner positive paths PASS; no fixture writes retained.'
