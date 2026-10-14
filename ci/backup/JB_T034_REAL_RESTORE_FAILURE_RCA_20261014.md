# JANTA BOL — T034 real G3 failure RCA, safe candidate fix
Date 2026-10-14. **No real rerun authorized; T034 HOLD.** Branch: review/t034-pgcron-fullrestore-rca-20261014.

## First verify ACTUAL run 38602777423 attempt 1 (source main eecd6c82)
- Founder manually authorized read-only JANTA BOL export and disposable restore.
- GitHub job 115985947832: setup, preflight, tools and pinned CLI passed.
- Actual offsite ciphertext G2 PASSED and persisted immutably:
  - `OFFSITE_ENCRYPTED_BACKUP_UPLOADED=true`
  - `OBJECT_SUFFIX=production/database/20261014T170454Z-run38602777423.tar.zst.age`
  - `SHA256_CIPHERTEXT=3f1b7df42fa233cc54bcbd395ed564b3c7b2fd17acfa3abcbe91fd29fdb17e6f`
  - `BYTES=10055326`
- Real B2-downloaded archive successfully decrypted using ONE-TIME RUNNER AGE key; recovered file bytes compared with original: `T034_ACTUAL_REMOTE_AGE_DECRYPT=PASS; OWNER_PRIVATE_KEY_NOT_USED=true`. This does NOT validate the Owner's offline private identity.
- Real G3 **FAILED** at pg_restore inside disposable container:
  `T034_FULL_DB_CLONE_HOLD: FULL PG restore failed (NO production change)`.
- Exact first error in real restore cannot be reconstructed from that GitHub run: script correctly suppressed confidential pg_restore diagnostics and deleted runner plaintext and one-time private identity at end. Do not claim exact production error without actual proof.
- Original JANTA BOL production DB and separate Cricket project were NOT modified by that restore.

## Independent read-only source authority evidence
- JANTA BOL live `cron.database_name=postgres`, extension `pg_cron=1.6.4` in `pg_catalog`.
- 67 public tables owned by `postgres`; 27 auth tables owned by `supabase_auth_admin`, 8 storage tables owned by `supabase_storage_admin`; hosted configuration includes `supabase_admin` and other internal roles.
- Previous helper created a *different* target DB named `jb_restored_test_db` and restored all owners through role `postgres` using `pg_restore --exit-on-error`, not superuser. The source's exact Supabase image is `supabase/postgres:17.6.1.136`.

## FAKE-ONLY independent RCA proof
- GitHub run **38604595481**, exact Supabase image, NO production secrets or data:
  - Supabase built-in role `postgres SUPER=false CREATE_ROLE=true`.
  - Built-in `supabase_admin SUPER=true`.
  - Fake archive including built-in-owned Supabase objects, target different DB: *first* error `must be able to SET ROLE "supabase_admin"`.
  - Retesting fake with `--no-owner` changes first error to `can only create extension in database postgres`.
- GitHub run **38604907035**, same image but fake source+target with NO NETWORK: verified a precise compatible solution. Use built-in `supabase_admin` only inside the disposable isolated container, reset ONLY its bootstrap database `postgres` to fresh template0, restore fake custom dump to database `postgres` (configured pg_cron DB). Successfully restored fake owners + `pg_cron` + synthetic table, GitHub step passed.
- **Deduction**, not actual-run log disclosure: the previous real pg_restore code has both objectively reproduced incompatibilities. These are specifically corrected in the candidate. Additional production-only differences may remain; successful restored real identity and 26 metrics are still necessary.

## Minimal safe code change
- Only `ci/backup/jb-t034-offline-full-pg-restore.sh` needed for root-cause correction: verify ephemeral DB superuser, drop/recreate *isolated networkless target's own empty postgres DB*, restore as `supabase_admin` into `postgres`. Do NOT touch any live/source/Cricket DB.
- All data stays in runner memory/ephemeral filesystem and networkless Docker. On failure, print allowlisted generic error CLASS only; never print actual SQL, data, passwords or sensitive function defs. Jobs leave no GitHub artifacts.
- **Still manual-only** workflow: exact Founder, repository, main, first attempt, explicit magic confirmation. No automated new real backup, retry or payment migration. Existing encrypted B2 copies remain immutable.
- Regression requirement: existing 26-field fake JANTA BOL data + ROLE/ACL restore, two fake AGE identity, wrong-key/tamper, and legacy backup regression, all green on final HEAD.

## Not established and still HOLD
- A complete hosted Supabase platform restore, storage FILE BYTES (4 metadata objects), non-DB config, Owner's paper private AGE key, fully equivalent function/security ownership in the real database, and ADS-008/009 genuine actor security evidence.
- A second actual B2 export/decrypt/restore requires NEW explicit Founder approval after synthetic CI/PR review. Never trigger from this document.
