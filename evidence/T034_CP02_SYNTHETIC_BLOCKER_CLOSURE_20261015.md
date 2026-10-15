# JANTA BOL — P4-T034 CP-02 B1–B5 Isolated Engineering Evidence
**Date:** 2026-10-15
**Verified source:** `jantabol/JANTA-BOL-Website`, `review/t034-cp02-fix-20261015`, executable commit `58190a96c324a8126baa0d99798d6d27f81adaca`.
**PR:** #14, DRAFT / UNMERGED, base `main` `e70473b8b56ea96f3f7d0e9897a97d766ff68356`.
**Verdict:** **CP-02 CODE + SYNTHETIC CI = scoped PASS**. **NOT a real backup/restore PASS, T034 HOLD, no production deployment or migration.** Historic fake FAIL evidence is preserved.

## Verified Latest Fake-only GitHub Actions CI (same executable SHA)
- `38684276967`: full double-recipient fake AGE archive → ciphertext byte check → isolated Supabase PG17 data restore → 26 count/function/grant + 16 deep-security fingerprints → real anonymous role permission denial → affected sequence safety → immutable Docker cleanup. Completed **SUCCESS** at 2026-10-15T05:00:01Z.
- `38684276957`: matching amd64 immutable Supabase image, seven extension packages, pg_net 0.20.4 and pg_cron 1.6.4 actual runtime, cron+pg_net inert scheduled requests. Completed **SUCCESS**.
- `38684276985`: legacy backup fake regression **SUCCESS**.
- `38684054124`: prior exact 26+16 and anon role + sequence same-helper fake **SUCCESS**.
- A real 16-field protected hash query on LIVE JANTA BOL **READ ONLY** returned 16 rows. This checks that the SQL executes on real schema; it does **not** prove these rows restore.

## B1 — source database identity, ROLE, ACL
- `ci/backup/jb-t034-db-identity.sql` records DB owner, ICU provider, encoding/collation version, canonical DB grants (grantor, recipient, grantable) and database-specific settings in encrypted archive.
- `jb-t034-db-identity.py` allowlist reconstructs **only** the offline `postgres` database, with source owner `postgres`, source ACL/locale, fail-closed on wrong role/grant/setting/drift.
- Real live READ-ONLY source catalog independently shows database owner postgres, ICU en-US, and effective ACL to PUBLIC/postgres/dashboard_user/supabase_* service accounts. Not modified.
- Synthetic **negative** tests reject a forged extra `anon CREATE` database grant and wrong owner. Full fake clone owner/ACL parity **PASS**.
- Legacy fake fixture uses Debian PG17 libc source vs Supabase pinned image; its collation **library version** is an explicitly reported FAKE-only exception, never granted to actual JANTA BOL archives.
- **Production role-membership and live image collation parity are NOT yet proven by real archive.**

## B2 — match production image/extensions
- Restore clone pinned `linux/amd64` to `supabase/postgres@sha256:3e2a7ab48783077d0122dc72ed5174afb543110c38266c845716c51d130658e4` (reported build 17.6.1.155).
- Actual fake offline runtime checked PG17, all seven required versions; `pg_net 0.20.4` and `pg_cron 1.6.4` load in networkless container.
- First synthetic failure from missing `shared_preload_libraries` diagnosed and fixed by restoring Supabase preload list; no fake failures hidden.

## B3 — same-snapshot consistency
- New reviewed `jb-t034-shared-snapshot.sh` holds read-only `REPEATABLE READ` coordinator `pg_export_snapshot()`. Raw `pg_dump --snapshot=...` and source 26 + B1 + 16 manifests import the exact exported snapshot.
- Synthetic concurrent post-snapshot write changed live FAKE source `ad_history`; archive+manifest correctly kept pre-write data. Lost/incompatible snapshot is STOP; no new counts after the dump.
- Three auxiliary filtered Supabase dumps retain their independently labeled time basis, not misrepresented as same snapshot.
- Sequences not MVCC-bound: separate archive-captured, post-restore next-value checks on affected `ad_history` and `audit_logs` sequences. Behind-sequence fake negative was rejected.
- Live Supabase session-pooler `pg_export_snapshot` behavior **NOT VERIFIED**; cannot mark real snapshot PASS before Founder-authorized controlled read.

## B4 — workers inert from first boot
- No network and no host ports. Config asserts `cron.launch_active_jobs=off`, `cron.database_name=postgres`, and `pg_net.database_name=template1` from first server startup.
- Actual fake scheduler job waits 75 seconds without marker writes; queued fake pg_net loopback request remains unprocessed. Original cron metadata is not changed.
- Real-data helper keeps no real DB credentials inside Docker. Fail-closed teardown of disposable clone and ephemeral plaintext; current fake CI verified container absent after completion.

## B5 — stronger integrity/security + regressions
- 26 original metrics EXACT MATCH with source, plus 16 deep digests covering affected rows (articles, campaigns, advertisers, payments, ad_history, audit, auth.users, storage.objects metadata), policies, table ACL/owners/RLS, functions, triggers, constraints, sequences definitions, extension versions, default ACLs.
- Negative fake tests detect same-count row corruption, RLS policy-body mutation, trigger disabled, FK deletion, extra DB grant, wrong DB owner, behind-sequence, and wrong AGE key/tampered ciphertext.
- Actual isolated `SET ROLE anon`: public article SELECT succeeds while direct ad_payments SELECT is rejected by ACL. This is FAKE-role proof, not a real JWT / live ADS-009 E5 test.
- Full compatible fake PG17 clone PASS and **no residual Docker container** after test.
- Whole-project/Storage-file/Vault/Auth-service/Edge configuration recovery remains future B11 except when affected by proposed ADS-008 migration.

## Next gates (NOT waived)
- **CP-03:** independently review and run affected Phase-3/B7 payment, RLS, permission, migration/rollback and PR integrity regressions against exact app candidate code; assess remaining roles/default privileges and error injection, preserve core newsroom baseline.
- **CP-04:** verify GH branch/Environment safeguards, access scopes, Owner PAPER AGE identity offline (never send to ChatGPT or GitHub), explicit approved exact SHA, worker/locale/source pooler live compatibility GO/NO-GO; do not dispatch LIVE yet.
- **CP-05:** only after separate Founder approval, new real encrypted B2 backup + isolated restore, then distinct permission-gated ADS-008 production migration, real ADS-009 principals and outstanding Android E3 / E5 ADS-001..009 tests.
- **NO REAL backup/restore workflow_dispatch; NO Production DB write; NO Live ads; NO Cricket project access.** Existing ciphertext backups untouched.

**NO FAKE PASS: CP-02 fake implementation and CI proven; T034 remains HOLD.**
