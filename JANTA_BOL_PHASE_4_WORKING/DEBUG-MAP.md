# JANTA BOL — PHASE 4 DEBUG MAP

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
