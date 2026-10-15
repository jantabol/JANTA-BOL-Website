-- P4-T034 RCA4: restore one proven missing CLUSTER role in a throwaway,
-- networkless, no-port, pinned PostgreSQL17 clone. NEVER run on live Supabase.
-- Source: read-only JANTA BOL pg_roles/pg_auth_members, 2026-10-15.
-- Backup custom pg_dump does not include global roles; default image lacks this one.
-- The owner is NOLOGIN and has NO escalated rights. No passwords are replayed.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='supabase_realtime_admin') THEN
    CREATE ROLE supabase_realtime_admin WITH
      NOLOGIN NOSUPERUSER NOINHERIT NOCREATEDB NOCREATEROLE
      NOREPLICATION NOBYPASSRLS CONNECTION LIMIT -1;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname='supabase_realtime_admin'
      AND NOT rolcanlogin AND NOT rolsuper AND NOT rolinherit
      AND NOT rolcreatedb AND NOT rolcreaterole
      AND NOT rolreplication AND NOT rolbypassrls
      AND rolconnlimit = -1 AND rolvaliduntil IS NULL
  ) THEN
    RAISE EXCEPTION 'T034_TARGET_ROLE_SECURITY_MISMATCH';
  END IF;
END
$$;

-- Only the three source-confirmed memberships. PostgreSQL 17 INHERIT FALSE
-- preserves source membership semantics; this NOLOGIN role must never gain
-- an elevated membership or an unexpected ability to connect.
GRANT anon TO supabase_realtime_admin WITH INHERIT FALSE, SET TRUE;
GRANT authenticated TO supabase_realtime_admin WITH INHERIT FALSE, SET TRUE;
GRANT service_role TO supabase_realtime_admin WITH INHERIT FALSE, SET TRUE;

DO $$
BEGIN
  IF (
    SELECT count(*) FROM pg_auth_members m
    JOIN pg_roles member ON member.oid=m.member
    JOIN pg_roles parent ON parent.oid=m.roleid
    WHERE member.rolname='supabase_realtime_admin'
      AND parent.rolname IN ('anon','authenticated','service_role')
      AND NOT m.admin_option AND NOT m.inherit_option AND m.set_option
  ) <> 3 OR (
    SELECT count(*) FROM pg_auth_members m
    JOIN pg_roles member ON member.oid=m.member
    WHERE member.rolname='supabase_realtime_admin'
  ) <> 3 THEN
    RAISE EXCEPTION 'T034_REALTIME_MEMBERSHIP_SECURITY_MISMATCH';
  END IF;
END
$$;
SELECT 'T034_TARGET_REALTIME_ROLE_SECURITY_REPLAY=PASS';
