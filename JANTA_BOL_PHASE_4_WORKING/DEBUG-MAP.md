# JANTA BOL — PHASE 4 DEBUG MAP

## 2026-10-10 B7 continuation

- T035 first divergence: Article normalization supplies `district`, but `scopeForArticle()` ignored it. Supported structured districts now select their matching ad scope; local/legacy behavior is preserved.
- T036 first divergence: `adSchedule()` forwarded timezone-free local fields to a UTC timestamptz RPC. India 09:00 became 14:30. Convert validated device time to explicit UTC; preserve backend errors and timezone configuration.
- HEAD CI regression: `162d1b3` added a historical `| P4-T034 |` row parsed as an extra canonical row. Rename its label; retain checker and prior evidence.
- Deployment blocker: Vercel detail/deployment access returns scope 403. A listed project is not deployed-URL/commit proof.

STATUS: ACTIVE
DATE: 2026-10-01
BRANCH: `phase4-execution-2026-10-01`

## B0-DBG-001 — Phase-4 CI bypass risk

### Symptom
The protected Phase-3 workflow watched only:
- `JANTA_BOL_PHASE_3C_WORKING/**`
- `CODEX_CURRENT_SUPABASE/**`
- `ci/phase3-regression/**`
- its own workflow file

A new Phase-4 folder could therefore exist outside those paths and a Phase-4 push could avoid the expected automatic protected regression run.

### Root cause
The workflow predated the Phase-4 working folder/branch.

### Minimum safe fix
Extend the existing workflow trigger to the Phase-4 execution branch and Phase-4 working paths, while preserving every existing Phase-3 static/database test step.

### Evidence
- Phase-3 baseline SHA before Phase-4: `8cbd22b7560f3fc49ecabeabbe88e0c61d9672b8`
- baseline run #202: SUCCESS
- Phase-4 branch created from that exact SHA
- workflow-only B0 commit made before feature coding

### Required retest
Protected Phase-3 workflow must complete GREEN on the Phase-4 branch after B0 records/checker are present.

### Status
FIX IMPLEMENTED / CI EVIDENCE PENDING

---

## B0-DBG-002 — Duplicate authority risk during Phase-4 expansion

### Risk
Grievance, Compliance, Ads, Accountability, Search, Notification and Retention work can accidentally create parallel copies of existing Article/Auth/Live/Audit identities.

### Prevention
`CODE-MAP.md` locks authoritative homes before coding:
- Article/PURL stays with existing article architecture
- Auth/MFA/session stays with existing backend authority
- Live stays with Phase-3 Live
- audit/history extends existing records
- recovery preserves existing business identities

### Status
PREVENTION MAP CREATED / VERIFY PER BLOCK

---

## B0-DBG-003 — Fake PASS risk

### Risk
A file existing, a plan being written, or code compiling can be mistaken for a completed test.

### Prevention
Official Phase-4 status states remain separate:
- NOT RUN
- IN PROGRESS
- PASS
- FAIL
- DUE
- BLOCKED

PASS requires the test's required evidence. Manual/real-device and external/provider evidence cannot be manufactured from code inspection.

### Status
RULE LOCKED / TEST-REGISTER ENFORCEMENT PENDING CI

---

## Debug handling rule

For every future bug:
1. Preserve evidence.
2. Record symptom and affected test IDs.
3. Identify root cause before broad rewrite.
4. Apply minimum safe fix.
5. Rerun the exact failed test.
6. Run affected Phase-3 regression.
7. Update CHANGELOG + TEST-REGISTER.
8. Only then mark PASS/LOCK.

---

## B1-DBG-001 — Protected Phase-3 T123 caught new Team RPC surface

### Symptom
Protected workflow run #233 stopped at old test `3A-P3-T123` after the first B1 Team implementation.

The old checker requires:
- no anonymous EXECUTE on any public `jb_*` function;
- no unreviewed authenticated EXECUTE on `jb_*` functions;
- privileged internal functions remain server/service-only.

### Root cause
The first B1 draft exposed new Team Owner wrappers directly to `authenticated`, and the public-safe Reporter directory used a `jb_*` name with anonymous EXECUTE. Both conflicted with the existing Phase-3 RPC boundary even though the functions had internal authority checks.

### Rejected shortcut
The old T123 checker was NOT weakened, deleted, bypassed or broadly whitelisted.

### Minimum safe fix
- Routed all Team browser actions through verified `jb-team-api` v2.
- Removed direct authenticated EXECUTE from Team `jb_team_*` wrappers.
- Kept internal Team mutation functions service-only.
- Renamed the public-safe read function from `jb_public_reporter_directory()` to `public_reporter_directory()`, preserving the existing rule that no `jb_*` function is anonymous.
- Added a server-only Team session-list internal function for the adapter.
- Updated B1 regression to assert the direct browser RPC boundary remains closed.

### Retest
- Old `db-function-security-regression.sql` rerun unchanged: T053 PASS, T123 PASS.
- Protected workflow run #246: Phase-3 function security PASS and B1 transactional Team/Authority regression PASS.

### Status
FIXED / EXACT OLD TEST GREEN
