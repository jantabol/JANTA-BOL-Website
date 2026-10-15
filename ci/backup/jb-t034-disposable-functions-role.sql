-- JANTA BOL P4-T034. Disposable OFFLINE PG17 restore target only.
-- Proven live source pg_roles/ACL audit: this global role is a grant recipient,
-- NOT a source TYPE/table owner. Per-database pg_dump omits CREATE ROLE.
-- Networkless Docker; never apply to real Supabase. Never copy credentials.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='supabase_functions_admin') THEN
    CREATE ROLE supabase_functions_admin WITH
      LOGIN NOSUPERUSER NOINHERIT NOCREATEDB CREATEROLE
      NOREPLICATION NOBYPASSRLS CONNECTION LIMIT -1
      PASSWORD NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles r
    WHERE r.rolname='supabase_functions_admin'
      AND r.rolcanlogin AND NOT r.rolsuper AND NOT r.rolinherit
      AND NOT r.rolcreatedb AND r.rolcreaterole
      AND NOT r.rolreplication AND NOT r.rolbypassrls
      AND r.rolconnlimit=-1 AND r.rolvaliduntil IS NULL
  ) THEN
    RAISE EXCEPTION 'T034_FUNCTIONS_ROLE_ATTRIBUTES_MISMATCH';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_auth_members m
    WHERE m.member=(SELECT oid FROM pg_roles WHERE rolname='supabase_functions_admin')
       OR m.roleid=(SELECT oid FROM pg_roles WHERE rolname='supabase_functions_admin')
  ) THEN
    RAISE EXCEPTION 'T034_FUNCTIONS_ROLE_MEMBERSHIPS_MISMATCH';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_authid WHERE rolname='supabase_functions_admin'
      AND rolpassword IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'T034_FUNCTIONS_ROLE_PASSWORD_MUST_BE_NULL';
  END IF;
END
$$;
SELECT 'T034_DISPOSABLE_FUNCTIONS_ROLE_GRANTEE_READY=PASS';
