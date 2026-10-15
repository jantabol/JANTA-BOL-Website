# JANTA BOL — P4-T034 CP-02 / PARTIAL FAKE IMAGE + WORKER SAFETY EVIDENCE
**Date:** 2026-10-15. **Status:** CP-02 IN PROGRESS. **NEXT REAL TEST STOP**. All described runs use disposable fake data; not a real encrypted-backup restore.

## Source
- Repo jantabol/JANTA-BOL-Website.
- Branch review/t034-cp02-fix-20261015; reviewed image-contract/helper CI code commit 5df500f114fc00c692fb6b350685dd03f5386e33.
- PR #14 remains DRAFT, UNMERGED. `main` is unchanged; no LIVE or Cricket access.
- Offline image pinned to linux/amd64 immutable manifest `supabase/postgres@sha256:3e2a7ab48783077d0122dc72ed5174afb543110c38266c845716c51d130658e4`; user-provided independent registry/package audit maps to Supabase build 17.6.1.155.

## First failure and RCA (not concealed)
- Fake CI 38677657617 (same initial implementation commit b65ea311a14c) failed with `pg_cron can only be loaded via shared_preload_libraries`. FIRST DIVERGENCE: custom Docker `postgres -c` invocation overrode the image's default Supabase preload list. This was an independent fake runtime finding, NOT the previously failed LIVE archive cause.
- Minimum safe correction: explicit source read-only `shared_preload_libraries` list in reviewed image contract, together with `cron.database_name=postgres`, `cron.launch_active_jobs=off` **from first startup**, and `pg_net.database_name=template1` so pg_net does not target restored postgres.
- Restoration script now verifies required seven extension versions in running image before any archive restore and cron/net settings at first boot; cron/net settings reasserted after fingerprint comparison.
- All raw `pg_restore` diagnostic snippets suppressed from the full-helper runtime, even if a synthetic diagnostics env flag is set. Dedicated fake forensic workflow can print fake-only errors; real-data path only allowlisted error class.

## Fresh CI PASS — exact tested code
1. **38677813360 — SUCCESS**, Pinned Image + inert cron FAKE CI, job 116235308262, commit 5df500f114fc00c692fb6b350685dd03f5386e33.
   - Linux/amd64 digest pulled and inspected, PostgreSQL 17 stable isolated startup.
   - Verified preload includes pg_cron+pg_net, scheduler OFF from startup, cron DB postgres, pg_net worker DB configured to template1.
   - Seven matching source extension-version SQL packages are available. `pg_cron 1.6.4` and `pg_net 0.20.4` actually CREATE EXTENSION/load as required.
   - Insert-marking cron schedule registered while scheduler disabled; 75 seconds elapsed, zero fake marker rows inserted. Metadata preserved.
   - NO source credentials, NO network, NO host ports, NO B2, NO owner AGE key.
2. **38677813508 — SUCCESS**, existing dual-recipient encrypted fake bundle + offline full clone 26/26 regression, commit 5df500f114fc00c692fb6b350685dd03f5386e33; synthetic-only, not real restore proof.
3. **38677813485 — SUCCESS**, legacy encrypted backup fake regression at same source commit; no real secrets.

## Status by risk
- **B2 (image/PG17/pg_net version):** PASS in exact fake runtime/extension integration; production archive equivalence NOT VERIFIED.
- **B4 (cron):** Scheduler-off synthetic marker negative PASS. `pg_net.database_name=template1` effective config PASS; full fake restored queue isolation/other unknown worker effects still NOT VERIFIED.
- **B1 (database owner/ACL), B3 (same-snapshot source manifest), B5 (beyond 26 integrity/security checks):** NOT IMPLEMENTED/NOT TESTED in this PR. Require next minimum-safe fixes, negative tests, then real authorization gate.
- **G5 Owner paper AGE-key offline proof:** NOT VERIFIED; not to be requested in ChatGPT/GitHub.
- **B11 complete Storage/Vault/Auth disaster recovery:** separate future gate with affected-dependency exception.
- **P4-T034:** HOLD, no claim of PASS/LOCK or production guard deployment.

## Next internal coding
B1 DB owner/ACL + source-authoritative protected metadata contract; fake role/owner/extra grant negatives. Follow with shared snapshot B3 and full integrity B5. No real BACKUP/RESTORE or migration dispatch until separate Founder approval and all required synthetic gates green. Preserve historical backup objects and Phase-4 B7 branch.
