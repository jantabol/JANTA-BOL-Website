# JANTA BOL • Phase-4 B11 • T070 G3 — Offsite Media Readback & Database Snapshot Parity Gate
Date: 2026-10-25 (India); backend read-only observation: 2026-10-25 17:55:10 UTC.
Authority: Founder direction to proceed with safe backend work; no authorization to execute another production backup, access private keys, restore production, merge, or begin T071.

## Scope / evidentiary separation
**Media, Founder Android evidence (2026-10-25):**
- Exactly three non-grievance objects (2 public JPG; 1 private-editorial PNG) were locally hashed and re-downloaded. Phone-side comparison reported 3/3 SHA-256 MATCH.
- Android offline browser generated an AES-256-GCM encrypted archive of these THREE objects using a Founder-held passphrase. Local saved archive was decrypted and verified as 3/3 hashes.
- Founder uploaded ciphertext-only archive to an existing PRIVATE Backblaze B2 bucket under a distinct media/t070 prefix, refreshed the listing, downloaded the ciphertext to Android under a new '(1)' filename, and re-ran browser Decrypt + 3 SHA-256 Verify. User screenshot reports 3/3 VERIFIED.
- This supports **THREE-MEDIA OFFSITE CIPHERTEXT READBACK + DECRYPT/HASH CHECK: USER-OBSERVED PASS**. Tool is founder-supplied Android offline browser, not an independent server recovery, not an atomic source snapshot, and not complete T070 E8.
- Founder expressly excluded two grievance-private files from hash matching/offsite media archive. Their bytes, remote recovery and user acceptance are **NOT VERIFIED**; these are not silently marked PASS. Never copy such content/keys/receipts to GitHub or ChatGPT.
- No ciphertext blob, digest, password, source image, private object path or identifying data is committed here.

## Historical independent evidence (GitHub Actions 39602669748, 2026-10-21)
Job 119230861685, successful. Exact log markers reviewed:
- T034_SOURCE_RAW_DUMP_AND_MANIFEST_SHARED_SNAPSHOT=CONFIRMED
- T034_SOURCE_TO_CLONE_16_DEEP_SECURITY_METRICS=EXACT_MATCH
- T034_SOURCE_TO_CLONE_26_METRICS=EXACT_MATCH
- T034_FULL_PG17_DATABASE_RESTORED=true
- **STORAGE_FILE_BYTES_RESTORED=false; PLATFORM_SETTINGS_RESTORED=false**
- T034 record counts: TABLES_PUBLIC=93, TABLES_PRIVATE=5, TABLES_AUTH=27, TABLES_STORAGE=8; RLS_PUBLIC=93, RLS_PRIVATE=3, POLICIES_APP_STORAGE=79; ROWS_ARTICLES=32, ROWS_AD_CAMPAIGNS=7, ROWS_AUTH_USERS=5, ROWS_STORAGE_METADATA=5.

## G3 backend read-only recheck
Source: JANTA BOL Supabase project, no write or schema migration. Queries re-executed from existing `ci/phase4/b11/t070-live-source-integrity.sql` and `t070-storage-source-preflight.sql`. **12/12 nonempty relationship/integrity predicates consistent**; **2/2 NOT_EXERCISED_NO_ROWS** for LIVE updates and Ads payments; not 14/14 PASS. Storage: 3 buckets, 5 objects (2 grievance-private, 1 private-editorial, 2 public), size metadata 5/5, storage SHA metadata 0/5. Application grievance-evidence rows 2/2 have recorded SHA/size and match object paths, *not original byte validation*.

New read-only SQL aggregate **2026-10-25 17:55:10 UTC**:
- TABLES_PUBLIC=100 (all 100 RLS-enabled); TABLES_PRIVATE=5, TABLES_AUTH=27, TABLES_STORAGE=8.
- RLS_PRIVATE=3; POLICIES_APP_STORAGE=81.
- ROWS_ARTICLES=32, ROWS_ARTICLE_VERSIONS=878, ROWS_GRIEVANCES=6, ROWS_GRIEVANCE_HISTORY=57, ROWS_LIVE_SESSIONS=16, ROWS_LIVE_UPDATES=0, ROWS_AD_CAMPAIGNS=7, ROWS_AD_PAYMENTS=0, ROWS_AUTH_USERS=5, ROWS_STORAGE_METADATA=5.
- To compare counts with T034, inspected `ci/backup/jb-t034-offline-full-pg-restore.sh`: table counts use pg_class relkind='r', RLS and pg_policies. Current query rechecked relkind=r only, so this is a **like-for-like metric comparison**.

**NEW G3 FINDING — T070-DRIFT-001 • HIGH • OPEN:** 2026-10-21 production DB restore baseline shows **93 public tables, 79 public/private/storage policies**, whereas 2026-10-25 current source has **100 public tables, 81 policies**. Drift is **+7 tables and +2 policies** despite matching aggregate Article/Ads/Auth/Storage row counts. Old restored DB is NOT equivalent to current source schema/security; no authority to call same-snapshot restore or current parity PASS.

**G3-PROVENANCE-002 • HIGH • OPEN:** 2026-10-21 DB ciphertext snapshot and 2026-10-25 3-media ciphertext backup were captured at different times. No atomic DB+media snapshot proof, source-versus-restore identity manifest, or proof of both grievance-private bytes.

**G3-RECOVERY-003 • HIGH • OPEN:** Connected connectors allow read-only source and GitHub tests but have not executed/observed a current same-snapshot, network-isolated database+media+Auth+platform restore. T034's historical PG17 clone is genuine but older and DB-only. No T070 E8 attestation.

## Safe next engineering sequence (requires explicit separate release authorization)
1. Freeze a new source recovery checkpoint/manifest with complete schema, roles/RLS, relevant IDs/PURLs, relationships and storage content inventory at a verified consistency boundary; no PII/keys in logs.
2. Review T034 gated manual backup preflight and separate Founder authorization before any current production backup or ciphertext B2 upload. Do not reuse 2026-10-21 snapshot as current.
3. In an independently isolated disposable PG17 environment, restore that exact DB ciphertext and verify all schema/ACL/policy and record-identity fingerprints (not just counts). Account for 2 empty runtime types without seeding production data.
4. Restore object bytes into an isolated destination. For THREE supplied media objects, compare SHA-256 and offsite archive provenance. The TWO grievance private files remain explicitly excluded by Founder; T070 full media acceptance cannot be signed while excluded.
5. Rebuild/verify authorized platform configuration and Auth/RLS/anon denials in clone without disclosing secrets. Regression and Founder proof, then final independent audit / separate Founder LOCK.
6. Until all gates complete: **T070 FINAL HOLD; T071 NOT STARTED.**

## Changes and preservation
Document-only addition on existing T070 DRAFT development branch. No Supabase write, DB migration, secret read, new key, B2 write via connectors, Vercel deploy, main merge, production restore or cross-project touch. All old locked functionality preserved.
