# P4-T069 / JANTA BOL Phase-4 B11 — Executed Backend Test and Manual Release Gate
2026-10-24 IST; original `TEST-REGISTER.md` is preserved at `NOT RUN` because source-bound *full original real test* has not been performed. No claim of actual full PASS+LOCK.

## Independent E1: LIVE HEALTH — VERIFIED READ-ONLY
- Supabase project `vrffsnkycvjithwtiylt`: `ACTIVE_HEALTHY`; PostgreSQL 17.6.1.155; `ap-south-1` (connected Supabase project check).
- Live SQL `SELECT` results, 2026-10-24 11:05:43 UTC: articles=32, versions=878, audit_logs=1560, grievances=6, auth.users=5. 3 Storage buckets / 5 metadata objects; bucket breakdown: grievance-private=2, private-editorial=1, public-media=2. Exposed public RLS=100/100; storage RLS=8/8.
- **DB ACTIVE_HEALTHY != VERIFIED CURRENT BACKUP.** Free-tier does not include guaranteed user-downloadable managed backups or PITR; JANTA BOL instead has original Founder-controlled custom B2 encrypted export.
- No customer/article/media contents, private proof files, Auth JWT, password or B2 secret accessed.

## Independent E2: ACTUAL HISTORICAL ENCRYPTED B2 + REAL POSTGRES RESTORE
Protected original workflow run `38778388127`, Oct 15, exact commit `da3efacfa09a2b4323fbb2d9d3230ca8a9b3c523`, official job `116571883287`, SUCCESS. Actual log reviewed, verified:
`OFFSITE_ENCRYPTED_BACKUP_UPLOADED=true`,
`T034_ACTUAL_REMOTE_AGE_DECRYPT=PASS; OWNER_PRIVATE_KEY_NOT_USED=true`,
`T034_SOURCE_TO_CLONE_16_DEEP_SECURITY_METRICS=EXACT_MATCH`,
`T034_DATABASE_OWNER_ACL_LOCALE=EXACT_MATCH`,
`T034_SOURCE_TO_CLONE_26_METRICS=EXACT_MATCH`,
`T034_FULL_PG17_DATABASE_RESTORED=true`,
`STORAGE_FILE_BYTES_RESTORED=false; PLATFORM_SETTINGS_RESTORED=false`.
This proves previous real isolated DB restore, not a present-day B2 download/retention, current backup age, original Storage file bytes or platform configuration restore.

## E2 source drift / present manual availability
On 2026-10-24 main Git ref was `265856ca9cbfd6c7d51989d85435397b72f24c8d`. GitHub exact compare versus historical restore run `da3efacfa09a2b4323fbb2d9d3230ca8a9b3c523` found **2 changed files, ZERO changes to original reviewed `ci/backup/**` or `.github/workflows/b7-t034-dual-recipient-real-MANUAL.yml`**. Not a substitute for fresh real Source/B2 verification.
The existing protected manual workflow exists on main, is `workflow_dispatch` only, requires exact Founder actor `jantabol`, protected `janta-bol-production-backup`, `reviewed_sha` matching `github.sha`, typed `JANTA_BOL_DUAL_RESTORE_ONLY`. It reads LIVE JANTA BOL source, writes a new AGE ciphertext to **existing JANTA BOL-only B2** (small offsite storage use may affect quota), and conducts disposable networkless PG17 clone. Never run without distinct Founder intentional action.

## E3: B11 T069 backend safety implementation EXECUTED
Exact commit `ffc19027914c4940e3509361bfc0ced2a32b246e`. Protected development CI `40088982748` SUCCESS:
- New E1/E2 source-attributed T069 read-only evidence checker **5/5 PASS**, including false Final lock attempt rejected exit 3, current media/B2 proof missing forced HOLD, test clock/as-of and credential-free metadata.
- Original B11 offline integrity, signed evidence, media encrypted synthetic AGE roundtrip and three-bucket exporter suites GREEN.
- Original B0-B8 protected G0/G1 PostgreSQL17 jobs GREEN, B9/B10 source tests preserved, full source ZIP check GREEN.
- No new Live backups or DB/export, no Backblaze writes, no loss of Admin privileges, no Cricket resources touched.

## Exact T069 proof gate, no false full lock
- E1 SOURCE LIVE DB PROJECT/RLS HEALTH: PASS (read-only).
- E2 historical REAL B2 ENCRYPTION/PG17 RESTORE: PASS (Oct 15 only).
- E3 synthetic current CI / backup integrity code: PASS (development).
- NEW current real B2 ciphertext readback and immutable DB source export SHA: **HOLD**.
- Backup recency/health policy explicit target: **not yet Founder-approved** (`backup_recency_target_seconds: null`), so unknown RPO rather than invented.
- Offsite original 3-bucket media bytes and independent decrypt: **HOLD**, also separately tested in T074.
- Source-bound final `P4-T069 FINAL PASS+LOCK`: **HOLD**, original register remains NOT RUN.

## First genuine manual proof checkpoint
Backend has exhausted available account-safe non-secret read-only verification for current as-of. To generate a new source-bound real backup, Founder can manually launch **existing approved main GitHub workflow** `JANTA BOL T034 dual AGE encrypted backup + OFFLINE public restore (manual only)` only after deciding to authorize *one* real backup+disposable restore:
- protected branch `main`; `reviewed_sha = 265856ca9cbfd6c7d51989d85435397b72f24c8d` only if main still equals that SHA at dispatch;
- `confirmation = JANTA_BOL_DUAL_RESTORE_ONLY`;
- approve the protected `janta-bol-production-backup` environment as Founder.
Do not paste AGE private key, B2 application key, DB password, or JWT in chat. The T069 test cannot be official FINAL LOCKED based solely on permission; genuine job log, exact current ciphertext object/readback SHA, scope/Owner/private-source checks and corresponding release criteria require independent subsequent verification.

**No manual Founder action was taken by this assistant.** Never touch Cricket/Saarthi; do not change protected main or produce new B2 objects without separate Founder action. `B10` previous final held test statuses remain separate.
