# JANTA BOL — Phase 4 / B11 Backup + Recovery — G0 Source/Backend PRECHECK
Date: 2026-10-24 IST. Owner direction: B11 next after completing B10 engineering work. This review creates ZERO production changes, does not start the protected manual real backup, and never touches the separate Cricket project.

## Original B11 contract (unchanged original 109-test register)
T069 Backup Layers + Security + Health.
T070 Real Restore Drill + Identity Preservation.
T071 RPO/RTO + Cross-Module Failure-Isolation Matrix.
T072 DB Partial Write + Fail-Closed + Retry/Idempotency.
T073 Corruption + Deletion + Security Incident + Credential/Config/Deployment Recovery.
T074 Post-Restore Verification + Independent Backup + Founder Device Loss.
T075 Automatic Recovery Operations + Implementation/Test Coverage + Final Lock.

Seven tests, not a new backup system. All seven remain NOT RUN at G0.

## B10/B9/B8 dependency gate: no false certification
Final held B10 security rows: **T060 NOT RUN; T063 Android MFA/lost-device E3 HOLD; T064 hosted environment isolation E7 HOLD; T065 real hosted two-QA-actor IDOR proof HOLD; T066 real hosted session/advertiser proof HOLD; T068 exact release gate HOLD**. Previously certified T061, T062, T067 remain PASS+LOCK. CI GREEN only means security regression controls verified; it does not erase the above.
Legacy B8 final and B9 T105 real old Android archive evidence remain independent HOLD. B11 can be source-prepared in isolation but cannot be declared final locked or used for B12 until these release dependencies resolve or Founder explicitly revises source requirements with an auditable recorded decision.

## Existing B7/T034 backup-to-restore foundation (REUSE, no rebuild)
Existing protected backup system:
- `ci/backup/jb-free-offsite-backup.sh`, `jb-b2-rclone-config.py`; explicit encryption (AGE) and Backblaze B2 **JANTA BOL-only** manual offsite.
- `ci/backup/jb-t034-offline-full-pg-restore.sh`, shared source snapshot + exact database identity, 26 metrics, security parity SQL, owner/ACL/locale proof, sequences, fault/privacy/regression diagnostics.
- Manual-only release workflow `.github/workflows/b7-production-free-encrypted-backup-MANUAL.yml`: strict repository, Founder actor, main branch, typed confirmation, protected `janta-bol-production-backup` Environment; credentials not in git/logs/artifacts. **Do not run without fresh Founder approval.**
- Original real workflow **38778388127 SUCCESS** on 2026-10-15: encrypted JANTA BOL B2 archive readback/decrypt and isolated networkless full DB PostgreSQL17 clone; **26 exact metrics match** and 16 deep security parity. This is **SCOPED DB RESTORE PASS**, not whole platform/media restore.
- Real historical limitations: `STORAGE_FILE_BYTES_RESTORED=false`, `PLATFORM_SETTINGS_RESTORED=false`. AGE paper identity previously Founder-checked on Android tablet, not a universal second-device/device-loss drill.
- Existing B7 payment/ad workflows and B8/B9 protected features cannot be reimplemented by a second B11 backup engine.

## Independent 2026-10-24 production read-only scope inventory
JANTA BOL Supabase project `vrffsnkycvjithwtiylt` only:
`articles=32`, `article_versions=878`, `audit_logs=1560`, `grievances=6`, `ads=7`, `auth_users=5`, `storage.objects=5`, `storage.buckets=3`, `team_accounts=3`, `live_sessions=16`.
Schema baseline: public tables 100/100 RLS, auth tables 27 (16 RLS), private 5 (3 RLS), storage 8/8 RLS. Extensions `pg_cron=1.6.4`, `pg_net=0.20.4`, `pgcrypto=1.3`, `uuid-ossp=1.1`. No payload/secret/table row values exported. Counts are an as-of read-only metadata baseline, not a backup.
**Critical B11 gap**: 5 object metadata rows are NOT proof that 5 original storage *file bytes* can be restored. A DB clone does not restore file bytes in buckets or GitHub/Vercel/Supabase Auth/Edge settings.

## B11 single-block approach and original 7-test acceptance gates
1. **T069** inventory layered RPO/RTO backup objects: DB schema/data+auth, storage media file bytes, Edge/functions/app branch/deployment/config/secret rotation runbook, immutable offsite generations, AGE two-path recovery, health/lag/last verified restore. No plaintext in GitHub.
2. **T070** controlled fully isolated restore from a real approved encrypted backup — preserve Article ID/master URL, corrections, audit, roles, RLS, publications, advertiser payments, grievance private IDs, content media, and session safety. Never restore over LIVE or reuse production credentials on clone.
3. **T071** real measured RPO, RTO and worst-case restoration time; isolate broken Live/social/ads/analytics/media without blocking normal Article publishing or losing permanent identity. No fabricated timing targets.
4. **T072** simulate partial writes, interrupted transfer, atomic retry/idempotency, hash/tamper/wrong-key and permission-negative recovery. Temporary injected failures on disposable actors ONLY.
5. **T073** corrupted backup, accidental delete, compromised account/key, stolen device, Vercel/Supabase config loss recovery: explicit containment + human-gated safe remediation; don't reveal Owner paper key or use compromised device.
6. **T074** independent offsite copy and restored media bytes/content-hash parity, metadata counts, cron/extensions/roles/ACL/RLS, public API and admin authenticated checks, stable Article URL and two-device Founder survival. If Owner-device steps required, Founder is asked at that checkpoint.
7. **T075** scheduled *non-destructive* health checks and alerts after controls; never silent production restore, credential change, auto backup replay into LIVE, or paid infrastructure. Fail-closed Final T069–T075 test+proof matrix and B10/B8/B9 release gate prior to B12.
Use same locked 41 features and previously working Phase1–Phase4 code; no rebuild/duplicate source of truth.

## What G0 did NOW
- Created separate branch `codex/b11-backup-recovery-g0-preflight-20261024` from protected B10 source SHA `610b8f6d5080713ec2801baa0d1d7b6e3625095f`.
- Added read-only code/test `ci/phase4/b11-g0-readonly-source-and-release-gates.mjs` and `.test.mjs` and isolated GitHub workflow. Verifies original 109/7 IDs; existing Owner-only manually gated workflow; historical truthful 2026-10-15 DB restore scope; B10 outstanding held tests; explicit no release permit even with CI PASS. No production credentials/paid hosting.
- **G0 STATUS: SOURCE-REVIEW EXECUTED, CI PENDING at commit time; B11 Coding/Real Restore/Test and PASS+LOCK NOT STARTED.** Follow exact Github run results before lifting even an engineering gate.

## Founder rules before any REAL B11 operations
No starting or scheduling a production encrypted backup/decrypt/restore, authorizing AWS/B2 paid usage, modifying Owner MFA/credentials, deleting storage, rotating secrets, uploading confidential files to ChatGPT, or deploying production without explicit fresh scoped approval. Never touch Cricket repo/Supabase/Vercel.
