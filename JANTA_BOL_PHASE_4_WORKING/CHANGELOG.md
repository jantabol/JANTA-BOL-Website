# JANTA BOL — PHASE 4 CHANGELOG

## 2026-10-01 — B0 START

### Baseline
- Protected Phase-3 source branch: `phase3-regression-ci`
- Protected Phase-3 baseline SHA: `8cbd22b7560f3fc49ecabeabbe88e0c61d9672b8`
- Verified baseline workflow: `Phase 3A + 3B Regression`
- Baseline workflow run: #202
- Baseline conclusion: SUCCESS

### Working branch
- Created `phase4-execution-2026-10-01` directly from the protected Phase-3 baseline SHA.
- No Phase-3 application/backend code was changed to create the branch.

### B0 change — CI path protection
- Updated `.github/workflows/phase3-regression.yml`.
- Added Phase-4 execution branch to push coverage.
- Added Phase-4 working folder to path coverage.
- Added `phase3-regression-ci` as a PR base that triggers the protected workflow.
- Existing static and Supabase regression jobs were preserved.

Reason:
A Phase-4 file placed outside the old watched paths could otherwise be pushed without automatically running the protected Phase-3 workflow. B0 closes that governance gap before feature coding begins.

### B0 records created
- `JANTA_BOL_PHASE_4_WORKING/README.md`
- `JANTA_BOL_PHASE_4_WORKING/CODE-MAP.md`
- `JANTA_BOL_PHASE_4_WORKING/AFFECTED-FILES.md`

### Product behavior
- No application feature code changed.
- No Supabase schema/data migration applied.
- No production secret/config changed.
- No existing test/checker weakened or deleted.

### Next B0 actions
- Create Phase-4 DEBUG-MAP and TEST-REGISTER.
- Add B0 governance CI checker.
- Ensure Phase-4 CI files themselves trigger protected Phase-3 CI.
- Run/verify protected CI on the Phase-4 branch.
- Close only the evidence-supported B0 tests; keep real-device/manual proof honest.

## 2026-10-01 — B0 CLOSED

### Evidence closure
- Protected workflow run #214 completed static/source regression and Supabase transactional regression SUCCESS.
- Phase-4 B0 governance checker completed SUCCESS.
- Founder real-device Android/SPCK Preview screenshot verified the JANTA-BOL Admin Dashboard renders with routine newsroom actions available.
- Existing unchanged Phase-3 Article UUID/Permanent URL lifecycle evidence was reused because B0 changed no application feature code or DB schema.
- P4-T001, P4-T002, P4-T003, P4-T004 are PASS.

### B0 final state
- Governance + CI Safety: CLOSED.
- Phase-3 protected baseline remains GREEN.
- Next execution block: B1 Team / Authority Extension — P4-T021–P4-T027.

## 2026-10-01 — B1 TEAM / AUTHORITY EXTENSION — TECHNICAL GATE GREEN

### Live backend
Applied:
- `phase4_b1_team_authority_foundation`
- `phase4_b1_team_api_security_context`
- `phase4_b1_t123_minimum_security_fix`

Added:
- canonical Team lifecycle metadata + append-only history
- active/suspended/departed state separate from stable Auth/Reporter identity
- public-name visibility control
- stale-client protection through current backend Team state
- server-only invite/activation/suspend/reactivate/role/depart/session-revoke authority
- existing Phase-3 Live suspend/revoke integration
- deployed `jb-team-api` v2 with JWT + current-session + Owner/AAL2 + recent-MFA mutation checks

Existing three Reporter identities were backfilled without duplicate Team identity.

### Frontend
- `reporters.html` upgraded to Android-first Team & Reporters management.
- Added `phase4-team-client.js`.
- Browser has no direct privileged Team RPC authority; it uses `jb-team-api`.

### CI / RED STOP
First protected B1 run exposed old Phase-3 T123 failure.
No old checker was weakened.
Architecture was tightened so direct Team RPC authority was removed from browser roles and public Reporter discovery no longer uses the privileged `jb_*` namespace.

Unchanged old T123 then passed.
Protected workflow run #246 completed:
- Phase-3 static/security suites GREEN
- Phase-3 Supabase suites GREEN
- B1 static Team regression GREEN
- B1 transactional Team/Authority regression GREEN

### Test status
- P4-T021 PASS
- P4-T022 PASS
- P4-T023 PASS
- P4-T024 PASS
- P4-T025 PASS
- P4-T026 NOT RUN — real Android proof required
- P4-T027 IN PROGRESS — final Team lock waits for T026


## 2026-10-01 — B1 CLOSED / B2 STARTED

### B1 final evidence
- P4-T026 real Android Team workflow PASS.
- Routine Public Name OFF -> ON worked without recent-MFA friction while backend Owner/AAL2 authority remained.
- High-risk Suspend with stale MFA was denied with `MFA_TOO_OLD`.
- Team API repository source was aligned with the repaired deployed runtime and redeployed as `jb-team-api` v8 with JWT verification.
- Generic external authenticated identity had no newsroom role and no direct Owner Team RPC privilege.
- Protected Phase-3 workflow run #269 completed SUCCESS.
- P4-T021–P4-T027 = 7/7 PASS. B1 CLOSED.

### B2 start
- Started B2 Common Audit + Retention — P4-T051–P4-T059.
- Source-of-truth scope: Master Blueprint Sections 395–480 / RUN-08.
- First action is implementation/data-model audit before schema/code changes: preserve existing audit/version/history/deletion systems, classify Preserve/Integrate/Extend/Add Missing, then make minimum safe changes.


## 2026-10-01 — B2 IMPLEMENTATION + AUTO REGRESSION CHECKPOINT

### Implemented
- additive common audit/retention/disposition foundation
- secret-sanitized audit lookup/export path
- protected audit immutability with locked Live routine-cleanup compatibility
- domain-owned retention policies + due/extension/hold/archive state/history
- retention-gated Permanent Delete + retired Article identity ledger
- public displayed-view ON/OFF/override state preserving raw analytics
- Android-first Records UI + server Records API
- service-only privileged Records RPC boundary

### Live verification
- `jb-records-api` v1 ACTIVE with JWT verification.
- Supabase migration ledger contains all four B2 migrations.
- Existing protected audit/version/Live-retention homes remain present and populated.
- Authenticated direct privileged Records RPC EXECUTE is denied.

### Regression
- Protected workflow run #296 SUCCESS.
- B2 static/security regression SUCCESS.
- B2 transactional regression SUCCESS.
- Old Phase-3 regression families remained GREEN.

### Test checkpoint
- PASS: P4-T051, P4-T052, P4-T055, P4-T056, P4-T058.
- IN PROGRESS: P4-T053, P4-T059.
- MANUAL NOT RUN: P4-T054, P4-T057.
- No final B2 lock yet.
