# JANTA BOL — B8 CP06 / Complete B0–B8 Random-Testable Master ZIP
**Founder requirement received 17 Oct 2026:** AFTER B8 implementation/testing, deliver **ONE complete source-and-test archive (each relevant file)**, so Founder can import it in SPCK/Android and select arbitrary B0–B8 tests. No patch-only ZIP, no replaced/stale Oct-12 source, no hidden omission, no false PASS. **Design/audit only today; do not generate a deceptively 'final' B8 ZIP before coding and real evidence.**

## 1. Independent exact current-source audit
- Repo: `jantabol/JANTA-BOL-Website` / `review/b8-precode-design-tests-20261017`; pre-audit pinned source HEAD **`63b419ee2b74c20d05ef902a9bd3cf9dd81e57d1`** and exact Git TREE **`d55a7530f8a5965d7d4d9ce1c05cd2cdb22fce5b`**. Fetched complete recursive Git tree: **`truncated=false`; 454 tracked files + 26 tree entries, ~3,842,630 bytes of tracked blobs**. Count is current audit baseline, not a future frozen ZIP count.
- Source distribution, read straight from Git tree: **74** `JANTA_BOL_PHASE_3C_WORKING`; **131** `JANTA_BOL_PHASE_4_WORKING`; **172** `ci`; **39** `CODEX_CURRENT_SUPABASE`; **30** `.github`; and **8** root files (3 HTML/CSS/JS, README + three CODEX handoff MD + legacy `JANTA-BOL v1 BACKUP.zip`). Full source snapshot != existing SPCK-only package.
- Current original **B7 SPCK packager** `.github/workflows/p4-t035-candidate-static.yml`, lines 870–930, copies ONLY `JANTA_BOL_PHASE_3C_WORKING` to flat SPCK app and additionally `CODEX_CURRENT_SUPABASE`, `JANTA_BOL_PHASE_4_WORKING/db`, `review` under `B7_BACKEND_REVIEW_ONLY`. It **does not package `ci`, `.github/workflows`, complete `JANTA_BOL_PHASE_4_WORKING` registers/evidence, or root complete source**. Thus old `B7_SPCK_TEST_BUILD.zip` **cannot** meet Founder's new “B0–B8 random test from complete ZIP” requirement.
- User's Oct-12 ZIP has **175 files** and embeds source `069761105ab62f941825ffa43d6625209f736fa7`, now **320 commits behind** current pre-audit HEAD, with no reverse behind. Keep it historical ONLY. Other two uploaded `AGE_KEYGEN` / `BACKUP_ENCRYPTION_TEST` are independent crypto tools, NOT part of website archive; never bundle a key, recovery phrase or real secret.
- Existing `ci/phase3-regression` has **30 files**, source policy documents note 705 prior Phase3A/B test IDs and **40 real manual-only** test cases. EXISTING Phase3 workflow includes an authenticated `supabase-regression` job requiring GitHub secret `SUPABASE_DB_PASSWORD`; any future `random test` launcher must **NOT** implicitly invoke live-DB mutation on Founder production. The current original B7 closure gate `ci/phase4/b7-closure-gate.cjs` verifies 9/60 B7 evidence but correctly **BLOCKS** final B7 ZIP until true hosted/device/Owner E5 and first-ads evidence; do not remove/bypass.
- Current Phase4 TEST-REGISTER has **mixed/stale canonical statuses** for some B0–B6 IDs, even though Founder has separately confirmed them locked. Examples as READ, not a judgment on past execution: `P4-T005..T014 NOT RUN`, `T015/T016 NOT RUN`, `T017 IN PROGRESS`, `T020 IN PROGRESS`, `T028..033 NOT RUN`, `T043..050 NOT RUN`; several other B0/B1/B2 entries PASS. The future final ZIP must **reconcile historical Founder evidence against exact register file, with citations**; never silently change DUE/NOT RUN to PASS nor erase Founder confirmation. B8 itself T092–T099 **NOT RUN**.
- GitHub `main` / verified actual Vercel production currently not source-parity with tested News Preview; future release ZIP may be a self-contained *source/test candidate*, **not** proof it is deployed. Exact production release is a separate Founder-approved B12/URL/rollback gate, never automatic because master ZIP built.

## 2. Canonical B0–B8 random-test index — all 67 official Phase4 IDs (the previous Phase3 CI remains required)
| Block | Test IDs | Count | Material to retain |
|---|---|---:|---|
| **B0** | P4-T001..T004 | 4 | governance, protected baseline and historical CI evidence |
| **B1** | P4-T021..T027 | 7 | team/identity/role/AAL2/revoke regression |
| **B2** | P4-T051..T059 | 9 | immutable audit, legal HOLD, archive/retention tests |
| **B3** | P4-T043..T050 | 8 | existing B3 common notifications/outbox/source-and-history |
| **B4** | P4-T028..T033 | 6 | social publication-independent controls and platform status |
| **B5** | P4-T005..T014 | 10 | Grievance/Correction/Evidence/RLS/Android |
| **B6** | P4-T015..T020 | 6 | Compliance, deadline, gov-submission synthetic-vs-real distinctions |
| **B7** | P4-T034..T042 | 9 | **ADS001–060** subtests, candidate media/privacy/payment, true payment/HOST E2/DUE clearly visible |
| **B8** | P4-T092..T099 | 8 | **ACC001–051**, right to reply, cost, timelines, audit, neutrality, privacy, Android E3 |

TOTAL **67 disjoint canonical IDs**, plus 60 B7 ADS sub-checkpoints, 51 B8 ACC cases and protected historical Phase3A/B requirements. Exact test-coverage/index and evidence are mandatory; `node --test` alone is NOT a substitute for phone E3 or hosted E2/E5.

## 3. Future mandatory ONE master archive (CONTRACT, NOT YET BUILT)
**Proposed release filename:** `JANTA_BOL_B0_TO_B8_COMPLETE_SOURCE_AND_TESTS_<YYYYMMDD>_<SHORT_SHA>.zip`.
Package `JANTA_BOL_B0_TO_B8_MASTER/`:
```text
00_START_HERE/
  README_ANDROID_SPCK.md              ← short import instructions and exact main page
  README_TEST_ANY_ID.md               ← 67-ID selector and what each mode actually proves
  REQUIREMENTS_SOURCE.md              ← original phase4 requirements + 10-Oct B7 + Founder decisions
  RELEASE_STATUS_AND_HOLDS.json       ← truthful B8 test status and B7 first-paid hold
  PACKAGE_MANIFEST.json               ← exact Git commit/tree, manifest schema, source paths
  FILE_INVENTORY.csv                  ← every tracked source path, actual size, SHA256
  SHA256SUMS.txt                      ← verify all archive members; source/output provenance
  EXCLUSIONS_AND_PRIVATE_EVIDENCE.md  ← omitted user secrets / old backups / sensitive screenshots
01_SPCK_ANDROID/
  SPCK_IMPORT_READY.zip               ← generated FROM THE SAME frozen source, News/Owner/B8 UI included
  ANDROID_RUNS_B0_B8.md               ← physical Android E3 steps, expected proof, screenshot privacy
02_FULL_SOURCE/
  JANTA_BOL_PHASE_3C_WORKING/         ← exact frontend originals, Article/permanent URL/Owner
  JANTA_BOL_PHASE_4_WORKING/          ← all source, DB proposals, code maps, registers, sanitized reviews
  CODEX_CURRENT_SUPABASE/             ← all migrations and Edge Workers, source only, no keys
  ci/                                 ← ALL B0–B8 relevant + protected Phase3 test scripts/fixtures
  .github/workflows/                  ← CI workflows (production-dangerous jobs marked MANUAL/BLOCKED)
  [remaining safe tracked root files] ← include explicit source metadata / record exceptions
03_TEST_RUNNER/
  TEST_INDEX_B0_B8.json               ← exactly 67 canonical IDs and ADS/ACC subordinate cases
  TEST_SELECTOR.md                     ← "run P4-T___" Android/source/isolated/backend proof distinctions
  SAFE_TEST_ENVIRONMENTS.md            ← fixtures, disposable PG17, no dangerous prod writes
  EXPECTED_PROOFS.md                  ← E1,E2,E3,E4,E5,E6,E7,E9 per official ID
  REGRESSION_MATRIX.md                ← B8→B0-B6/B7/Phase3 protected dependencies
04_EVIDENCE/
  EVIDENCE_INDEX.md                   ← sanitized source links, CI runs and signed Founder E3 references
  LOCKED_BASELINES.md                 ← historical PASS evidence; unresolved register disparities explicit
  B7_PAYMENT_AFTER_SOFT_LAUNCH.md     ← reopen real first shop receipt/LIVE/payment tests
  B8_T092_T099.md                    ← source SHA and actual case outcomes; NOT RUN before execution
05_RELEASE_CONTROLS/
  README_DEPLOYMENT_NOT_AUTOMATIC.md   ← source ZIP != production migration or hostname/URL
  SOURCE_DRIFT_AND_ROLLBACK.md         ← GitHub main/preview/actual production reconciliation gate
  DEPENDENCY_VERSIONS.md              ← Node, Postgres17, browser tooling, FFmpeg etc version policy
```
This directory shape is a design contract; future implementation must compare generated filelist with the **entire actual pinned release tree**, not only this outline. The SPCK sub-ZIP is derived/verified, not a different engine or editable master.

## 4. Required **arbitrary-test** UX (to be implemented LAST)
- Founder picks **any** of the 67 official IDs, or sub-ID `ADS-001..060`/`ACC-001..051`; selector resolves `ID → source criterion → test method → expected proof → code paths → fixture → live evidence status`. No silently skipped or unmatched ID.
- **Mode 1 SAFE_LOCAL:** static/source tests, browser/fixture checks; can run with Node where available; selected SPCK screen on Android only. Does NOT assert full DB/security E2 or E3.
- **Mode 2 DISPOSABLE_BACKEND:** ephemeral **PostgreSQL 17**, synthetic fixtures, rollback/no production credentials, deliberate IDOR/privilege negatives; never mixes with real production via copied config.
- **Mode 3 OWNER_ANDROID:** explicit human Android steps with Founder Owner/AAL2 where required, captures device evidence, no fake screenshots, no passwords/screenshots of private data.
- **Mode 4 HOSTED_READ_ONLY:** anonymous/public GET and catalog/health proofs, only allowlisted operations; no arbitrary `sql` or credential injection.
- **Mode 5 PRODUCTION_MUTATION / REAL PAYMENT / RESTORE:** **NEVER available through random test launcher**. Requires separate authorized controlled environment/backup/founder signoff; B7 first paid test held until post-Soft-Launch, and backup/restore scope obeys B11 gates.
- Wrong environment → **NOT RUN/BLOCKED**, never PASS. Offline SPCK cannot execute PostgreSQL/Auth/AAL2/RLS/provider proof; a ZIP with source doesn't confer deployment/config/secrets.
- Before every test log: source SHA + test ID + environment + actor/role/AAL + fixture + expected + observed + sanitized proof + time + delta and old baseline CI. 2 failed fixes→third independent full RCA. Each test must be **individually rerunnable** without test-order dependence or legacy-data corruption.
- Existing Phase3 regression FAIL is RED STOP. Stage tests may indicate Code Check PASS, never independently conclude final `PASS+LOCK` without required actual E-class evidence.

## 5. Mandatory ZIP acceptance gates *after* B8 coding
**M01 SOURCE:** one frozen reviewed release SHA, not old 12-Oct files; compare every source path+SHA to Git tree. Filename collisions, duplicate roots and untracked staging artifacts detected.
**M02 ALL FILES:** exhaustive tracked 454-file baseline expanded dynamically after B8; every required safe frontend, backend, SQL, CI, test fixture, workflow and documentation included with per-file SHA256. Intentionally excluded secrets/binary backups recorded path-by-path and reason, no fabricated "100% inclusive" claim.
**M03 B8 CLOSED:** all 8 official T092..099 + 51 ACC mapped, run with required E1/E2/E3/E4/E5/E7/E9 and independent protected regressions. No B8 final ZIP if critical blocker open.
**M04 B0–B6 SAFETY:** preserved functions/article UUID/PURL, Founder prior locks evidence reconciled to formal TEST-REGISTER. No hidden regressions due to B8; do not overwrite unrelated domains.
**M05 B7 ACCURATE HOLD:** do not turn B7 payment/real HOST E3 into fake PASS. First real shop paid ad subject to Founder separate post-Soft-Launch authorization; 9/60 canonical final ledger remains distinct.
**M06 TEST PICKER:** 67 IDs, 60 ADS and 51 ACC all resolve to explicit runner or manual card with *truthful* status; 10 sampled arbitrary IDs across blocks verified on exact archive and core negative security IDs selected.
**M07 ANDROID:** extract SPCK sub-ZIP cleanly to new Android SPCK project; import and browse every required B0–B8 UI entry; independent actual Android flows and screenshots; no local-file-only simulation mistaken for hosted.
**M08 PROTECTION:** never ship service-role secret, GitHub key, DB password, private AGE key, real UTR, credential dump, private source info, personal numbers, raw confidential media, production export or keygen reference seed. Scan recursively including nested ZIP and scripts; verify allowed public Supabase publishable key context and no server secret leak.
**M09 PROOF:** original protected Phase3 regression plus affected Phase4 CI run at same source SHA, isolated PG17 and browser; immutable evidence-index links and SHA fields, not screenshot-count alone.
**M10 ARCHIVE QUALITY:** ZIP CRC `unzip -t` pass, extract on clean machine, filename/path unicode Android safe, no symlink/path-traversal, all hashes verified, no empty placeholder shell scripts/fixtures, no missing declared files.
**M11 BUILD ID:** release file name/date/source commit/tree, freeze SHA256 master archive and derived SPCK zip, build log, manifest verification CI signed by same commit.
**M12 DEPLOYMENT BOUNDARY:** source ZIP is *not* production, does not auto-install SQL/Edge or share credentials. Actual domain/URL and Founder authorization separately tested before News production changes.
**M13 USER EXPERIENCE:** Founder can choose a test by ID in readable instructions and learn exactly what device/CI/service is required, without scrolling hundreds of unindexed files.
**M14 NO FAKE FINAL:** if M01–M13 incomplete, output may be called **B0-B8 ENGINEERING HANDOFF / NOT FINAL**, but cannot be marked `FINAL PASS+LOCK`. Do not omit valid evidence due to a single held external service.

## 6. Immediate audit result / next steps
**TODAY:** Audit and contract only. **B8 CODE = NOT STARTED**, original `P4-T092..099` = 0/8 official PASS, 51 ACC tests = 0 run. Existing repo is not yet a one-click random-tester and existing B7 SPCK ZIP is NOT a full source/testing package. No new paid resource, Vercel change, GitHub main merge, Supabase write, production login, ZIP falsely labeled complete, or code modification.
**NEXT DESIGN GATE:** incorporate this archive contract into B8 R2 self-critic and Freeze after Founder decisions. **AFTER B8 CODING AND VALIDATED TESTING:** generate single whole-project pinned ZIP + integrated SPCK import + all 67 official ID lookups and proof indices, then run archive-integrity, sampled randomized source/Android, and protected regressions before delivery.
