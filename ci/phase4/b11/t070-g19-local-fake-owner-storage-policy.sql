-- LOCAL SYNTHETIC ONLY: executed against disposable Supabase Docker PostgreSQL.
-- Explicit owner-only read of an imaginary bucket and UUID-prefixed test file.
-- NEVER invoke against the real JANTA BOL production project.
BEGIN;
CREATE POLICY t070_g19_synthetic_owner_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 't070-g19-private-fixture'
    AND split_part(name, '/', 1) = (select auth.uid()::text)
  );
COMMIT;
