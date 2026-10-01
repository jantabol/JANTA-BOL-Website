# JANTA BOL — PHASE 4 WORKING

STATUS: B0 CLOSED ✅ | B1 CLOSED ✅ | B2 COMMON AUDIT + RETENTION — STARTED
CURRENT: P4-T021–T027 PASS | B2 P4-T051–P4-T059 AUDIT/IMPLEMENTATION START
STARTED: 2026-10-01
WORKING BRANCH: `phase4-execution-2026-10-01`
PHASE-3 BASELINE SHA: `8cbd22b7560f3fc49ecabeabbe88e0c61d9672b8`
PHASE-3 BASELINE CI: workflow run #202 / SUCCESS

## Source of truth

Primary offline handover:
- `JANTA_BOL_PHASE_4_MASTER_EXECUTION_PACK.pdf`
- Master Blueprint Sections: 1–1034
- Topics: 14
- Checkpoints: 682
- Final tests: P4-T001–P4-T109
- Practical Runs: 15
- Execution order: P4-T001–P4-T083 -> P4-T092–P4-T109 -> P4-T084–P4-T091 FINAL CLOSURE

The repository records below are execution records. They do not replace the Master Blueprint.

## Permanent rules

1. NO FAKE PASS.
2. NO EVIDENCE = NO PASS.
3. NO PASS = NO LOCK.
4. Every Phase-4 code change must preserve the protected Phase-3 baseline and run required Phase-3 CI.
5. Any locked Phase-3 failure is RED STOP: preserve evidence -> RCA -> minimum safe fix -> exact retest -> Phase-3 GREEN -> continue.
6. Never weaken/delete/reclassify an old checker/test/security control merely to obtain GREEN.
7. Existing working authority is preserved and extended before any parallel/rebuild design is considered.
8. Article ID/Permanent URL, Auth/MFA/session authority, Phase-3 Live, audit/history and recovery identities remain protected.
9. External/provider-dependent tests become DUE only for a real unavailable dependency with reason + reopen trigger.
10. Manual/device proof is not auto-PASSed by code.

## Coding blocks

- B0 Governance + CI Safety — P4-T001–T004
- B1 Team / Authority Extension — P4-T021–T027
- B2 Common Audit + Retention — P4-T051–T059
- B3 Unified Notifications — P4-T043–T050
- B4 Social Distribution — P4-T028–T033
- B5 Grievance Full Lifecycle — P4-T005–T014
- B6 Compliance — P4-T015–T020
- B7 Ads Backend + Lifecycle — P4-T034–T042
- B8 Accountability — P4-T092–T099
- B9 Search + Analytics — P4-T100–T109
- B10 Cross-Module Security Closure — P4-T060–T068
- B11 Backup + Recovery — P4-T069–T075
- B12 Production Integration — P4-T076–T083
- B13 Final Closure — P4-T084–T091 (always last)

Security is not postponed to B10. Each block must implement its own RLS/Auth/negative-access protection at the time it is built. B10 is the whole-platform security closure gate.

## Resume rule for future chats

Read this folder + current GitHub/Supabase live state + the attached Master Execution Pack. Resume from the first incomplete block/test. Do not restart completed work, do not assume PASS from chat text, and do not ask the Founder to re-paste the whole sequence.