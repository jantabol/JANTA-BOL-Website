\set ON_ERROR_STOP on
-- Disposable PG17 only, runs after T062 fixtures/tests.
-- Replicate current LIVE original role-only Owner Recovery RPC to prove
-- that a previously revoked JWT / absent auth.sessions could still verify key.
-- ALL key strings below are synthetic fixture data, NOT Founder credentials.
CREATE TABLE auth.sessions(id uuid PRIMARY KEY,user_id uuid NOT NULL);
INSERT INTO auth.sessions(id,user_id) VALUES
('10000000-0000-4000-8000-000000000063','11111111-1111-1111-1111-111111111111'),
('20000000-0000-4000-8000-000000000063','22222222-2222-2222-2222-222222222222');
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb
LANGUAGE sql STABLE SET search_path=''
AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb) $$;
CREATE OR REPLACE FUNCTION private.current_session_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$ SELECT nullif(auth.jwt()->>'session_id','')::uuid $$;
CREATE OR REPLACE FUNCTION private.current_session_active() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$ SELECT EXISTS(SELECT 1 FROM auth.sessions s WHERE s.id=private.current_session_id() AND s.user_id=auth.uid()) $$;
CREATE OR REPLACE FUNCTION private.verify_owner_recovery_key(p_uid uuid,p_key text)
RETURNS TABLE(success boolean,locked_until timestamptz,remaining_attempts integer)
LANGUAGE sql SECURITY DEFINER SET search_path=''
AS $$ SELECT (p_key='ISOLATED_DUMMY_KEY_ONLY' AND p_uid='11111111-1111-1111-1111-111111111111'),NULL::timestamptz,5 $$;
CREATE OR REPLACE FUNCTION public.jb_verify_owner_recovery_key(p_recovery_key text)
RETURNS TABLE(success boolean,locked_until timestamptz,remaining_attempts integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $old$
DECLARE v_uid uuid:=auth.uid();v_role public.app_role;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED';END IF;
 SELECT ur.role INTO v_role FROM public.user_roles ur WHERE ur.user_id=v_uid;
 IF v_role IS DISTINCT FROM 'owner'::public.app_role THEN
 RAISE EXCEPTION 'OWNER_REQUIRED'; END IF;
 RETURN QUERY SELECT * FROM private.verify_owner_recovery_key(v_uid,p_recovery_key);
END $old$;
REVOKE ALL ON FUNCTION public.jb_verify_owner_recovery_key(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.jb_verify_owner_recovery_key(text) TO authenticated,service_role;

-- Original F01 negative: revoked/nonexistent backend session still succeeded.
BEGIN;
SELECT set_config('b9.test_uid','11111111-1111-1111-1111-111111111111',true),
 set_config('b9.test_aal','aal1',true),
 set_config('request.jwt.claims','{"session_id":"90000000-0000-4000-8000-000000000063","aal":"aal1"}',true);
SET LOCAL ROLE authenticated;
DO $old_bypass$
BEGIN
 IF private.current_session_active() THEN RAISE EXCEPTION 'T063_FIXTURE_INVALID_SESSION_EXISTS';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.jb_verify_owner_recovery_key('ISOLATED_DUMMY_KEY_ONLY') WHERE success)
 THEN RAISE EXCEPTION 'T063_ORIGINAL_REVOKED_SESSION_RECOVERY_BYPASS_NOT_REPRODUCED';END IF;
END $old_bypass$;
ROLLBACK;
\echo 'T063 RED BEFORE FIX: original recovery RPC accepted synthetic invalid backend session JWT; no real key/account touched.'
