# JANTA BOL — Phase-4 P4-T034 — Post-Restore Final Gate (E2 + E3 + E5)

**Evidence checkpoint:** 2026-10-15 | **Scope:** ADS-001…ADS-009 ONLY | **Decision:** **P4-T034 FINAL PASS + LOCK = HOLD**. This is a source/evidence register, **not** a database migration or permission to publish/approve an ad.

## Source of truth, revision and non-negotiable limits

- B7 Final Master Blueprint: `JANTA_BOL_B7_FINAL_MASTER_BLUEPRINT_WITH_TESTS(2).pdf` pp.23–24: ADS-001…009; E2 + E3 + E5; RUN-06.
- GitHub protected `main` source/RESTORE revision `da3efacfa09a2b4323fbb2d9d3230ca8a9b3c523`.
- Application and unmerged ADS-008 guard candidate **are not in main**: application working tree is on `codex/b7-t034-safe-guard-20261013`; reviewed additive guard SQL is on draft PR #15, `review/t034-cp03-ads008-20261015`. Never merge all working-tree files into main to solve a single ad guard.
- LIVE read-only catalog applies **only** to JANTA BOL Supabase `vrffsnkycvjithwtiylt`. Cricket project is separate and out of scope.
- Never say E2 (fixture), E3 (Android) or E5 (live role/JWT) passed merely because unrelated backup or mocked-role CI passed. A declined backend request must leave state unchanged.
- Do not change production SQL, payment, verification, advertiser, article or storage objects for a fake PASS. Do not republish historical high-risk campaigns.

## G3: REAL encrypted database backup + offline full restore — PASS (SCOPED)

Real manual run **[#38778388127](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38778388127)**, job `116571883287`, SHA `da3efacfa09a2b4323fbb2d9d3230ca8a9b3c523`, conclusion `SUCCESS`; Founder reviewed/approved protected `janta-bol-production-backup` environment.

Actual reviewable job log:
- `T034_SOURCE_RAW_DUMP_AND_MANIFEST_SHARED_SNAPSHOT=CONFIRMED`.
- `OFFSITE_ENCRYPTED_BACKUP_UPLOADED=true`; immutable B2 object `production/database/20261015T174213Z-run38778388127.tar.zst.age`.
- Ciphertext SHA256 `4c25feb5325e70f6da47f54d7aa9b94aa4899169984cd0042137d36fb4b43d7a`, 10,460,489 bytes.
- `T034_DISPOSABLE_NOLOGIN_REALTIME_OWNER=PASS`, `T034_DISPOSABLE_FUNCTIONS_ACL_GRANTEE=PASS`.
- `T034_SOURCE_TO_CLONE_16_DEEP_SECURITY_METRICS=EXACT_MATCH`.
- `T034_ANON_REAL_ROLE_ARTICLE_READ_AND_PAYMENT_DENIAL=PASS` (inside disposable clone, **not** authenticated JWT/AAL2 E5).
- `T034_AFFECTED_HISTORY_AUDIT_SEQUENCE_NEXTVALUE=PASS`.
- `T034_DATABASE_OWNER_ACL_LOCALE=EXACT_MATCH`.
- `T034_SOURCE_TO_CLONE_26_METRICS=EXACT_MATCH`.
- `T034_FULL_PG17_DATABASE_RESTORED=true`; workflow and all steps SUCCESS; disposable clone no network/no published ports.

**Explicit test scope limitation:** `STORAGE_FILE_BYTES_RESTORED=false; PLATFORM_SETTINGS_RESTORED=false`. Media object bytes and platform configuration are NOT proven restorable by this DB-only recovery gate. Owner paper AGE local file decrypt previously demonstrated on Founder Android tablet (user-controlled, no paper key disclosed), but do not equate that with storage-media disaster recovery. Preserve all real encrypted B2 backups.

## CP-03 ADS-008: candidate fake PASS, production safeguard ABSENT

Pre-existing additive migration candidate: `JANTA_BOL_PHASE_4_WORKING/db/20261013_b7_t034_payment_verification_GUARD_REVIEW_ONLY.sql` (PR #15, **DRAFT / UNMERGED**, based on working-tree branch).

Fake-only job/source evidence: `JANTA_BOL_PHASE_4_WORKING/review/T034_CP03_ADS008_ATOMIC_GUARD_EVIDENCE_20261015.md`, `T034_CP03_LEDGER_IMMUTABILITY_AND_LIVE_DRIFT_20261015.md`; includes historical high-risk paid-bypass RED, legacy RPC guards, real SQL direct-DML negative, immutable confirmed ledger, verified owner positive, reviewed rollback, late-failure atomicity and checked fake positives.

Independent LIVE, **read-only** SQL: exact repository `ci/phase4/b7-t034-predeploy-live-readonly-drift.sql` from PR #15 executed 2026-10-15. **15/15 passed**, verdict `SOURCE_SCHEMA_PARITY_ONLY_GO_NO_DEPLOY_PERMISSION`. It proves candidate compatibility with the presently observed source catalog, NOT production deployment, live principal matrix, or migration authorization.

LIVE catalog after real G3 PASS:
- `b7_t034_payment_verified_gate` and `b7_t034_paid_state_verified_gate` **ABSENT**.
- Internal `private.b7_t034_*` functions **ABSENT**.
- Original `p4_ad_guard_confirmed_payment` trigger ENABLED; app RLS enabled on `ad_campaigns`, `advertisers`, `ad_payments`.
- **7 total campaigns**, **2 `payment_pending`**, **0 `paid`/`live`**, **1 historical HIGH-risk/unverified campaign in approved-or-later state** (counts only; no private identities).
- `public.jb_ad_confirm_payment_internal` and `jb_ad_record_payment_internal` remain callable by `authenticated` (function internally checks Owner/AAL2; this ACL fact alone is NOT an authorization bypass proof).
- Existing historical HIGH-risk pending must not be auto-modified. Rollback to an unguarded payment path without explicit containment is unsafe.

**Release gate:** Additional specific Founder review of finance/identity immutability and rollback containment, reviewed source-hash repeat, controlled additive migration deployment, real E2/E5, all required regressions. Prior general approval for backup/restore never substitutes for authorizing payment-related production DDL.

## P4-T034 ADS-001…009 evidence register

| ID | Minimum mandatory proof | Current traceable evidence | REAL FINAL |
| --- | --- | --- | --- |
| ADS-001 | 360px homepage AND article CTA with real Android before/after, news undisturbed (E3) | Review-branch Chromium 360 E1 workflow candidate; real Android/deployed source not bound | **DUE** |
| ADS-002 | Actual backend rejects invalid WhatsApp/consent (no row); valid normalized (E2) | Disposable `b7-t034-ads002-final-gate.sql`, 7 negative and 3 positive synthetic cases; live signature/ACL verified READ-ONLY | **E2 fixture proven in CI, live E2 proof DUE** |
| ADS-003 | Public request cannot set media/geo/placement, even forged RPC; UI has no dangerous edit controls (E2+E3) | Disposable `b7-t034-ads003-no-public-geo-media.sql`; real Android E3 DUE | **DUE** |
| ADS-004 | Stable Pending receipt, never LIVE/payment, Owner review; real app/receipt (E2+E3+E5) | Fake positive/rollback and read-only LIVE source; no authorized staging E3 receipt captured | **DUE** |
| ADS-005 | Idempotent spam/duplicates, rate limit incl concurrency and payload rejection (E2) | `b7-t034-concurrent-intake-runtime.cjs` and isolated fixture pass reported in PR #15; real E2 matrix not released | **DUE** |
| ADS-006 | Owner pending queue standard/custom, ID/contact/source/time matches backend (E2+E3) | Fake dashboard client regression; `ads.html` one-file Android handoff **CANDIDATE ONLY**; actual Owner Android + backend E3 DUE | **DUE** |
| ADS-007 | Normal verification Owner/AAL2 role/audit (E2+E5) | Fake verification path and read-only function ACL; genuine principal/audit E5 not proven | **DUE** |
| ADS-008 | Old/new unverified HIGH-risk never approved/paid/live, historical payment_pending & legacy routes blocked (E2+E5) | Isolated fake candidate good; production additive guard undeployed; **CRITICAL** | **FAIL/HOLD** |
| ADS-009 | Anon/reporter/advertiser/revoked/AAL1 denied approval+verification, unchanged backend/audit (E2+E5) | Isolated role-fake matrix PR #8; live JWT/AAL2/revocation proof NOT RUN | **DUE** |

## Precisely scoped next execution order

1. **Preserve G3 PASS** and the actual real Run #9 evidence. Never repeat backup or paper key test merely to revisit unrelated E3/E5.
2. **ADS-008 STOP-GATE**: independently review actual immutable financial contract, payment freeze/rollback contingency, current source fingerprints and candidate PR #15. Obtain separate Founder decision before even additive production DDL. Run independent fake negative + affected regression first. Historical pending unverified data untouched.
3. **E5 role matrix**: controlled staging actual auth/JWT verification with anonymous, advertiser, reporter, Owner AAL1, Owner AAL2, revoked Owner; backend + audit before/after. No user passwords/OTP/tokens in chat.
4. **E3 Android**: first verify actual deployed source URL maps to reviewed app commit. Current Vercel project `shubham-pichhore-2028` has deployed GitHub `main` root HTML; real `JANTA_BOL_PHASE_3C_WORKING` app release binding is NOT established. Do not call localhost:7700 production or mark Android E3 PASS with synthetic Chrome screenshots.
5. Collect ADS-001…009 exact test fixture, action, expected/actual API + before/after state, screenshot, SHA, reviewer and date in TEST-REGISTER; run newsroom/security regressions.
6. Only after **nine evidence-backed ADS passes** (plus actual G3), mark **P4-T034 FINAL PASS + LOCK**. Remain scoped; do not claim B7 T035–042 or storage/media recovery.

**Conservative current overall verdict: BACKUP/DB RESTORE SCOPED PASS; P4-T034 FINAL HOLD. NO FAKE COMPLETION.**
