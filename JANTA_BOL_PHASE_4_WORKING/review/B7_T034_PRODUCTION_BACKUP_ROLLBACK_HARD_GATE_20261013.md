# JANTA BOL B7 / ADS-008 — Production Backup + Rollback Hard Gate
Date 13 October 2026. **LIVE DEPLOYMENT: BLOCKED / NOT APPLIED.**
Production project `vrffsnkycvjithwtiylt` region ap-south-1 (JANTA BOL only; NOT Cricket). Founder authorized fixing the backup/rollback gate and then deploying only after it is proven safe. There is NO authorization to incur subscription charges or copy private data to an unapproved destination.

## Verified blockers and explicit truth
- Connected Supabase API `get_organization`: org `pnkatuwzdkyyjfbivkua` plan `free`, tier `tier_free`.
- Official Supabase docs (Oct 2026): Free Plan has NO downloadable automatic backup/PITR; Supabase recommends `supabase db dump`/pg_dump as an offsite manual alternative. Automatic 7-day backups are on Pro (paid); payment/upgrade requires Founder choice.
- Connected Supabase tools: read/write SQL, migrations, logs/branches, but **no export database backup, download encrypted backup, verify point-in-time restore or restore SQL dump** action. No existing usable development branch. No proven current backup file/location/encryption key or restored clone exists.
- GitHub Actions can connect to the production DB for existing SELECT/ROLLBACK regression using `SUPABASE_DB_PASSWORD`; DO NOT dump private data to Github logs/artifacts, public repo or ad-hoc external storage. Cryptographically encrypted and user-controlled offsite destination must be approved and independently restored before any Production ALTER/CREATE.
- Project pause/restore action is NOT a backup or safe substitute. Supabase `restore_project` unpauses a paused project; DO NOT invoke.
- No existing file, archive, old trigger, old RPC, older news Article or Cricket project was modified by this checkpoint.

## E2 LIVE read-only baseline, exact as inspected
- articles=31; ad_campaigns=7; advertisers=7; ad_history=26; ad_payments=0; audit_logs=1537; ad_live=0; ad_paid=0.
- Existing function MD5 of PG `pg_get_functiondef`:
  - `jb_ad_confirm_payment_internal(uuid,text,bigint)`: `fed4e4f0c3c61091c9bfbeb59802f3a2`.
  - `jb_ad_record_payment_internal(uuid,text,text,bigint,text,boolean)`: `441749b81dbbc287b4ef752ac1a1e9f8`.
  - `jb_ad_transition_internal(uuid,text,text)`: `6327cf8cdfeb0d677783e3f396408416`.
  - `jb_ad_public_enquiry(text,text,boolean,text,uuid,text)`: `ddae7ec443ab61b61a8c5425b45c7ad6`.
- Existing payment trigger `p4_ad_guard_confirmed_payment` MD5 of definition `f4e77c5dfd11e41e7005f6895fd95eea`. No new `b7_t034_*` LIVE triggers installed.
- These hashes establish **source rollback reference**, NOT backup/restore of the actual database.

## Completed review-only engineering
- Isolated branch `codex/b7-t034-safe-guard-20261013` forked from B7 checkpoint `8d6c7824641c04a59f1b45f68fc6111232736d74`; all work is additive new files.
- Candidate SQL `20261013_b7_t034_payment_verification_GUARD_REVIEW_ONLY.sql` adds narrow payment and PAID-state guard, never changes old RPCs. Existing high-risk Pending verification record is left unchanged.
- Exact rollback script `20261013_b7_t034_payment_verification_ROLLBACK_REVIEW_ONLY.sql` removes ONLY candidate triggers/functions after source/ownership/dependency preflight; no CASCADE. **Rolling it back reopens old payment-verification gap**, so a production emergency rollback additionally requires incident containment (disable payment confirmation via a reviewed deny-first toggle/permission gate until a corrected patch is shipped).
- GitHub Actions isolated (PostgreSQL 17) CI `38384413487`, source `258e1ec9744e30703142b8106f5b0a416d849f35`: 2/2 jobs green. Includes RED old-flow reproduction in rolled-back sandbox, protected high-risk negative, verified normal/high payment positive, two-client concurrent enquiry, forged/oversized input, pre-migration baseline function hashes, exact reversal, unchanged old function hash and row counts after rollback, then reapply and regress. First rollback CI attempt `38384137484` failed SQL parsing of an unparenthesized CASE in a PL/pgSQL IF; independently fixed and green; no production touched.

## Hard hold: required evidence before authorizing any LIVE migration
G1. User-selected backup route: **A:** Supabase Pro daily backups (fee authorization) *and confirm a real restorable snapshot*, **or** **B:** owner-controlled offsite encrypted full SQL/roles/schema/data dump using session pooler and secure key management. NO default assumption.
G2. Backup has a unique UTC time, storage destination under user's control, SHA-256, encryption/key custody and verified SQL roles/schema/data inventory. Storage objects are not included in DB backups; address independently if disaster recovery expects media recovery.
G3. Actual restore in a disposable isolated Postgres/Supabase clone (not this production or the Cricket project), with schema/roles/core count parity, legacy RPC source fingerprints and a successful high-risk historical fixture check. An `ls`, backup filename or untested dashboard banner alone is NOT restore proof.
G4. Review exact production schema parity + release lock, capture and preserve 4 original function/trigger definitions, grant matrix, migration identity, rollback script and tested emergency payment hold.
G5. Only after G1–G4 positive: explicit verified migration + trigger list via Supabase `apply_migration`; 0 historical data writes in migration; read-only post-deploy fingerprint, triggers, campaign status, no payment/ads live; existing Phase3A/B regressions; independent E2 security tests; no old QA claims fabricated.

## Current decision
**BACKUP VERIFIED: NO. RESTORE VERIFIED: NO. REVIEW-ONLY ROLLBACK TESTED: YES. PRODUCTION GUARD LIVE: NO.**
Strict fail closed: refuse a production migration until G1/G2/G3 are real. Do not claim live, P4-T034 PASS or B7 LOCK.
