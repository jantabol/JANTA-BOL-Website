\set ON_ERROR_STOP on
-- P4-T072 original B8 protected Owner case RPC via real local PG17, not a mock.
-- Intentionally accept only psql -v typed variables; no SQL string interpolation.
DO $check$
BEGIN
 IF current_database()<>'jb_t072_idempotent'
 THEN RAISE EXCEPTION 'T072_PG17_CLIENT_BRIDGE_WRONG_DATABASE';END IF;
END $check$;
SELECT pg_catalog.set_config('b8.fixture_actor', :'actor', false);
SELECT pg_catalog.set_config('b8.fixture_session', :'active', false);
SELECT pg_catalog.set_config('b8.fixture_aal', :'aal', false);
SET ROLE authenticated;
SELECT public.jb_b8_g1_owner_create_case_idempotent(
  :'request_id'::uuid, :'title'::text, :'area'::text, :'lane'::text);
