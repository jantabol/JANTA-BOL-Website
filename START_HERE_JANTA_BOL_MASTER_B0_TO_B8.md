# JANTA BOL — MASTER SOURCE SNAPSHOT, B0 TO B8
**MASTER CODE ZIP — SAVE THIS BEFORE YOU RUN YOUR FIRST MANUAL TEST.**
**Code status:** pre-manual-test source candidate with protected CI checks.
**NOT a production deployment, LIVE database backup or final test PASS/LOCK.**

## What is inside (FULL tracked Git branch, not just B8)
The ZIP is built from the **entire tracked repository tree at ONE immutable commit**.
It includes the original Main-root `index.html`, `script.js`, `style.css`,
the prior `JANTA-BOL v1 BACKUP.zip`, all `JANTA_BOL_PHASE_3C_WORKING/`
Website/Admin/Reporter/Ad pages and scripts, `JANTA_BOL_PHASE_4_WORKING/`
original register/review/evidence/review-only SQL, `CODEX_CURRENT_SUPABASE/`
migration + Edge Function sources, `.github/workflows/` and the
`ci/` automated safety and regression tests. It also includes this guide
and the test selector under `tools/`.

**Preserved Main baseline:** commit `265856ca9cbfd6c7d51989d85435397b72f24c8d`
(55/55 tracked Main files byte-identical in the integrated snapshot as audited
17 October 2026); the extra files are additive. No original News/B7 source overwritten.

**IMPORTANT: Code vs Data**
This is SOURCE CODE, scripts, migration candidates and tracked test/report
artifacts. It is NOT a Supabase production PostgreSQL dump, authenticated
user records, real Storage evidence/media, Backblaze private archive,
live Vercel configuration/aliases, secret keys, local Android screenshots,
master 321-page PDF (held separately by Founder), or independent E9 receipts.
Keep those in separate PRIVATE backups. **Never upload passwords to Git/ZIP.**

## Android first — no command line required
1. SAVE the master ZIP on the phone/tablet and an independent second location.
2. Extract it on Android; open folder `JANTA_BOL_MASTER_SOURCE/`.
3. Open `START_HERE_JANTA_BOL_MASTER_B0_TO_B8.md` in SPCK or a text viewer.
4. For the actual website code, open `JANTA_BOL_PHASE_3C_WORKING/`.
   The repository root `index.html` is the earlier original protected Main root,
   not automatically the later Phase-3/4 website deployment.
5. Open `JANTA_BOL_PHASE_4_WORKING/TEST-REGISTER.md` for all **109**
   canonical tests. Select **ANY** test ID — e.g. P4-T034 (ads),
   P4-T092 (accountability), P4-T098 (Android/accountability).
6. With Founder present, use the original Master 321-page Execution Pack's
   EXACT test procedure and E-class evidence. Ask ChatGPT to walk through
   that chosen ID one step at a time. No need to follow strict test order,
   BUT when a test depends on an untested prerequisite, mark it BLOCKED
   rather than pretending success.
7. STOP before any Production Supabase migration, Edge/Vercel deploy,
   owner AAL2 signing, external official message or paid service. Explicit
   Founder permission and the original release gates are required.

## Choose random tests on Termux or laptop (OPTIONAL)
Requires Python 3 (standard library only), no npm or subscription:
```sh
python3 tools/jb_manual_test.py --list
python3 tools/jb_manual_test.py --all-b8
python3 tools/jb_manual_test.py P4-T034
python3 tools/jb_manual_test.py T098
python3 tools/jb_manual_test.py 92 --start
```
`--start` ONLY creates a local intake with `status=NOT_RUN` under
`MANUAL_EVIDENCE_LOCAL/` (never automatically changes the original
TEST-REGISTER or any LIVE system). Keep that local PRIVATE folder safe.

### Core random test mapping
| Pick any test | Block | What you'll need |
|---|---|---|
| P4-T001–T004 | B0 | Governance, baseline, source authority |
| P4-T005–T014 | B5 | Grievance creation/privacy/lifecycle |
| P4-T015–T020 | B6 | Compliance/monthly office filing |
| P4-T034–T042 | B7 | Advertisement security, payment, creative, lifecycle |
| P4-T092–T099 | B8 | Accountability and full RUN-12, ACC001–051 |
| Other P4-T IDs | See full TEST-REGISTER | All 109 original Master tests have a register row |

**Why some status looks inconsistent:** A historical Test Register entry may show
PASS on a synthetic test while real E2/E3/E5/E9 is DUE. Use original Master
required evidence and independent real verification for official FINAL PASS.
No inferential PASS. B8 T092–099 official status remains DUE/NOT RUN.

## Test execution discipline
Exact Current Source → Reproduce → Authority Identify → End-to-End Trace →
FIRST DIVERGENCE → RCA → Minimum Safe Fix → Affected Regression →
Real Proof → PASS. After TWO failed targeted fixes, the third attempt must
begin with independent full RCA instead of patch guessing.

- Choose *any* canonical test, but keep its original immutable ID.
- Before changing code, record specific source branch/commit and verified URL.
- Capture actual Android E3 / database E2 / Founder E5 / external provider E9
  evidence **only as required** by the canonical test.
- Restore safety: no override of passed old B0–B7 and original News publish/PURL.
- Founder-only publishes/unpublishes/visible-corrects news on SAME permanent URL.
- Avoid auto-sending official communications and never invent "no reply".
- Do not put private evidence/credentials in public bug screenshots.

## Automated source tests (for developers; **do not run on production**)
The workflow `.github/workflows/b8-g0-g1-disposable-pg17-and-protected-static.yml`
runs real isolated PostgreSQL17 tests in a temporary CI service plus protected
News/Auth/B7 static and Android node suite. SQL under `JANTA_BOL_PHASE_4_WORKING/db/`
marked `REVIEW_ONLY` is **not authorized** for live application.
E3 is not tested by an Android emulation or CI green alone.

## Offline file-level integrity verification
The distributed ZIP embeds `MASTER_SHA256_MANIFEST.json` with the exact pinned
source commit and each archived tracked path's SHA256. Verify it on a laptop:
```sh
python3 ci/phase4/build_b0_b8_master_source_zip.py --verify /path/to/MASTER.zip
```
A separate `MASTER_ZIP_SHA256.txt` is published beside the ZIP in the CI artifact,
and the GitHub action page pins the source SHA.

## Safeguards and status
- No new paid service or B2 account.
- No GitHub main merge; source ZIP is immutable independent checkpoint.
- No live Supabase/Storage/Edge/Vercel writes in ZIP packaging.
- B8 G0–G9 source code candidate + isolated CI, NOT final.
- B0–B8 final lock only after evidence-backed Founder one-test-at-a-time review.

**JANTA BOL FAMILY — WITHOUT COMPROMISE.**
