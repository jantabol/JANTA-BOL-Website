# JANTA BOL — PHASE 4 TEST REGISTER

STATUS: ACTIVE EXECUTION RECORD
DATE STARTED: 2026-10-01
SOURCE: Phase 4 Final Test Blueprint / Master Execution Pack

## Status vocabulary
- NOT RUN — no execution evidence yet
- IN PROGRESS — implementation/test work active; not PASS
- PASS — required expected result observed with required evidence
- FAIL — executed and failed
- DUE — genuine unavailable external dependency recorded with reason + reopen trigger
- BLOCKED — internal blocker prevents safe execution

NO FAKE PASS. Code existence, a plan, a backup listing or a document alone is not PASS.

## Execution order
P4-T001–P4-T083 -> P4-T092–P4-T109 -> P4-T084–P4-T091 FINAL CLOSURE.

## Register

| Test ID | Topic | Test | Block | Status |
|---|---|---|---|---|
| P4-T001 | Governance | Phase 3 Baseline + Source Authority Protection | B0 | PASS |
| P4-T002 | Governance | Evidence-Based Status / No Fake PASS | B0 | PASS |
| P4-T003 | Governance | Single-Home + Duplicate Architecture Audit | B0 | PASS |
| P4-T004 | Governance | Founder Authority + Mobile + Fail-Closed | B0 | PASS |
| P4-T005 | Grievance | Grievance Creation + Unique Identity + Article Linking | B5 | NOT RUN |
| P4-T006 | Grievance | Identity + Govt ID + Private Evidence Security | B5 | NOT RUN |
| P4-T007 | Grievance | Multi-Issue Lifecycle + Urgency + Deadline | B5 | NOT RUN |
| P4-T008 | Grievance | Duplicate + Evidence + Reopen + Withdrawal | B5 | NOT RUN |
| P4-T009 | Grievance | Clarification -> Final Decision -> Reply -> Resolve -> Archive | B5 | NOT RUN |
| P4-T010 | Grievance | Retention + Extension + Hold + Permanent Delete | B5 | NOT RUN |
| P4-T011 | Grievance | Public Article / Correction / Shared Engines / Failure Isolation | B5 | NOT RUN |
| P4-T012 | Grievance | Mobile Queue + Founder-Time + Single Authoritative Record | B5 | NOT RUN |
| P4-T013 | Grievance | Grievance Implementation + Data Model Audit | B5 | NOT RUN |
| P4-T014 | Grievance | Grievance Coverage + Failure Repair + Regression + Lock | B5 | NOT RUN |
| P4-T015 | Compliance | Compliance Architecture + Shared Grievance Source | B6 | NOT RUN |
| P4-T016 | Compliance | Monthly Compliance + Zero-Grievance + Public-Safe Approval | B6 | NOT RUN |
| P4-T017 | Compliance | Compliance Calendar + Deadline + Notification | B6 | IN PROGRESS — CI #494/#493 PASS: deterministic 4-state boundary + rollback-isolated actual deadline transitions, history, complete-task exclusion and anonymous denial; notification hook present, but delivery/dedup, scheduled execution and mobile evidence DUE. Evidence: evidence/P4-T015-T017-backend-2026-10-08.md |
| P4-T018 | Compliance | Government Submission Full Lifecycle | B6 | PASS + LOCK (SYNTHETIC LIFECYCLE ONLY; REAL GOVERNMENT SUBMISSION DEFERRED) |
| P4-T019 | Compliance | Compliance Security + Audit + Failure + Mobile + Founder-Time | B6 | IN PROGRESS — isolated real backend-client.js publishing fault-injection mock PASS (CI #456 static SUCCESS), LIVE read-only article RLS/trigger isolation inspected; official MIB/MeitY source trace PARTIAL. Real authenticated publishing API during compliance failure + complete legal applicability still DUE. Evidence: evidence/P4-T019-2026-10-08.md |
| P4-T020 | Compliance | Compliance Implementation + Coverage + Regression + Lock | B6 | IN PROGRESS — CMP-035 FAIL/RCA/RETEST verified (#428 FAIL → 84ac19b CI-only fix → #430 PASS); CMP-033 LIVE backend exists but tracked compliance.html read-only UI source gap; CMP-036 #456 CI PASS; CMP-034 full coverage and T015–T017 evidence discrepancy DUE; CMP-037 NOT LOCK. Evidence: evidence/P4-T020-2026-10-08.md |
| P4-T021 | Team | Team Invite -> Identity -> Role -> Activation | B1 | PASS |
| P4-T022 | Team | Permission Matrix + Super Admin Reserved Authority + Live Separation | B1 | PASS |
| P4-T023 | Team | Suspend -> Revoke -> Reactivate -> Permission Change | B1 | PASS |
| P4-T024 | Team | Internal Reporter Identity + Public Name + Departure + Live History | B1 | PASS |
| P4-T025 | Team | Lost Device + Common Audit/Notification/Retention + Failure Isolation | B1 | PASS |
| P4-T026 | Team | Android Team Management + Founder-Time + Role Simplicity | B1 | PASS |
| P4-T027 | Team | Team Implementation/Migration + Coverage + Regression + Lock | B1 | PASS |
| P4-T028 | Social | Social Master Article + Distribution Controls | B4 | NOT RUN |
| P4-T029 | Social | Social Caption + Preview + Independent Platform Status | B4 | NOT RUN |
| P4-T030 | Social | Social Failure + Retry + Manual Fallback | B4 | NOT RUN |
| P4-T031 | Social | Social Credentials + Authority + Common Audit/Notification | B4 | NOT RUN |
| P4-T032 | Social | Social Android + Low-Noise + Founder-Time | B4 | NOT RUN |
| P4-T033 | Social | Social Implementation + Coverage + Security + Regression Lock | B4 | NOT RUN |
| P4-T034 | Ads | Ad Architecture + Public Request + Verification | B7 | IN PROGRESS — code + isolated E2 fixtures only; E3/E5 and production compatibility pending |
| P4-T035 | Ads | Creative + Label + Placement + Targeting Privacy | B7 | IN PROGRESS |
| P4-T036 | Ads | Campaign Schedule + Start/Expiry/Pause/Hide/Delete Lifecycle | B7 | IN PROGRESS |
| P4-T037 | Ads | Packages + Price Versioning + Rotation + Inventory | B7 | IN PROGRESS — G3 private geo 25-case matrix; G4 weighted 3,200 draws + inventory quota synthetic E2 only. Official LGD/E3/E5/Production gates DUE |
| P4-T038 | Ads | Approval -> Payment -> LIVE + Non-Refund Disclosure | B7 | NOT RUN — EXTERNAL |
| P4-T039 | Ads | Advertiser Panel + Isolation + Creative Change + Renewal | B7 | IN PROGRESS — staging text-only portal + A/B isolated E2; Owner/Android E3, renewal and production integration DUE |
| P4-T040 | Ads | CTA + Analytics + Privacy + Analytics Failure | B7 | IN PROGRESS — staged 50%/1s + one-time view tickets E1/disposable E2 only; click/homepage, bot resistance, real E3/E5/analytics parity DUE |
| P4-T041 | Ads | Ad Notifications + Audit + Retention + Security + Provider Failure | B7 | NOT RUN |
| P4-T042 | Ads | Ads Mobile + Founder-Time + Implementation/Coverage/Regression Lock | B7 | NOT RUN |
| P4-T043 | Notifications | Unified Notification Engine + Existing Live Preservation | B3 | NOT RUN |
| P4-T044 | Notifications | Cross-Domain Notification Event Matrix | B3 | NOT RUN |
| P4-T045 | Notifications | Priority + Low-Noise + Recipient Routing + Privacy | B3 | NOT RUN |
| P4-T046 | Notifications | Notification Center Lifecycle + Direct Action + Reminder | B3 | NOT RUN |
| P4-T047 | Notifications | External Delivery Failure + Retry + In-App Authority | B3 | NOT RUN |
| P4-T048 | Notifications | Notification History + Audit/Retention/Security Boundary | B3 | NOT RUN |
| P4-T049 | Notifications | Mobile Filtering + Grouping + Founder-Time + Critical Safety | B3 | NOT RUN |
| P4-T050 | Notifications | Notification Implementation + Functional/Privacy/Failure/Regression Lock | B3 | NOT RUN |
| P4-T051 | Audit/Retention | Common Audit Engine + Immutable Core Audit | B2 | PASS |
| P4-T052 | Audit/Retention | Article Lifecycle + Delete + Public View Audit | B2 | PASS |
| P4-T053 | Audit/Retention | Cross-Module Critical Action Audit | B2 | IN PROGRESS |
| P4-T054 | Audit/Retention | Audit Lookup + Access + Export + Secret-Free Records | B2 | NOT RUN — MANUAL |
| P4-T055 | Audit/Retention | Domain-Specific Retention Rules + Identity Preservation | B2 | PASS |
| P4-T056 | Audit/Retention | Due -> Extension -> Hold -> Permanent Delete Lifecycle | B2 | PASS |
| P4-T057 | Audit/Retention | Retention Across Domains + Archive/Backup + Evidence/Version Privacy | B2 | NOT RUN — MANUAL |
| P4-T058 | Audit/Retention | Records Implementation + Migration Integrity | B2 | PASS |
| P4-T059 | Audit/Retention | Retention/Security/Cross-Module/Failure Regression + Topic Lock | B2 | IN PROGRESS |
| P4-T060 | Security | Existing Security Baseline + Backend Authority + Fail-Closed | B10 | NOT RUN |
| P4-T061 | Security | Public/Private/Sensitive Data Boundary Matrix | B10 | NOT RUN |
| P4-T062 | Security | Cross-Module Authority + Privilege Boundary | B10 | NOT RUN |
| P4-T063 | Security | Authentication + MFA + Session + Lost Device + Recovery Lifecycle | B10 | NOT RUN |
| P4-T064 | Security | Secrets + Environment + RLS + Data Minimization + File Controls | B10 | NOT RUN |
| P4-T065 | Security | Direct Attack / IDOR / Tampering / Cross-Account Test Family | B10 | NOT RUN |
| P4-T066 | Security | Revocation + Suspension + Super-Admin-Only + Advertiser/Search Isolation | B10 | NOT RUN |
| P4-T067 | Security | Security Audit + Notification + Failure Isolation + Incident RCA | B10 | NOT RUN |
| P4-T068 | Security | Security Implementation Audit + Regression + Evidence + Lock | B10 | NOT RUN |
| P4-T069 | Backup/Recovery | Backup Layers + Security + Health | B11 | NOT RUN |
| P4-T070 | Backup/Recovery | Real Restore Drill + Identity Preservation | B11 | NOT RUN |
| P4-T071 | Backup/Recovery | RPO/RTO + Cross-Module Failure-Isolation Matrix | B11 | NOT RUN |
| P4-T072 | Backup/Recovery | DB Partial Write + Fail-Closed + Retry/Idempotency | B11 | NOT RUN |
| P4-T073 | Backup/Recovery | Corruption + Deletion + Security Incident + Credential/Config/Deployment Recovery | B11 | NOT RUN |
| P4-T074 | Backup/Recovery | Post-Restore Verification + Independent Backup + Founder Device Loss | B11 | NOT RUN |
| P4-T075 | Backup/Recovery | Automatic Recovery Operations + Implementation/Test Coverage + Final Lock | B11 | NOT RUN |
| P4-T076 | Production | Production Baseline + Hosting + Domain + HTTPS | B12 | NOT RUN |
| P4-T077 | Production | Permanent URL + Auth/API + Environment Separation | B12 | NOT RUN |
| P4-T078 | Production | Production DB Migration + Secret Protection | B12 | NOT RUN |
| P4-T079 | Production | External Provider Production Integration + Adapter Safety | B12 | NOT RUN — EXTERNAL |
| P4-T080 | Production | Public/Admin Production + Android + Network/Retry/Error Safety | B12 | NOT RUN |
| P4-T081 | Production | Production Backup + Deployment + Rollback + Cutover | B12 | NOT RUN |
| P4-T082 | Production | Production Smoke + Real Article/Multi-Device Integration | B12 | NOT RUN |
| P4-T083 | Production | Production Operations + Audit + Due + Topic-11 Lock | B12 | NOT RUN |
| P4-T084 | Final Closure | Final Test Governance + Status Integrity | B13 | NOT RUN — FINAL |
| P4-T085 | Final Closure | Cross-Module Integration Boundary Test | B13 | NOT RUN — FINAL |
| P4-T086 | Final Closure | Core Article Lifecycle + Live Regression | B13 | NOT RUN — FINAL |
| P4-T087 | Final Closure | Whole Phase-4 Module Regression + Security Negatives | B13 | NOT RUN — FINAL |
| P4-T088 | Final Closure | Backup/Recovery + Production + Multi-Device + Operational Readiness | B13 | NOT RUN — FINAL |
| P4-T089 | Final Closure | Nothing-Missing / Nothing-Duplicated + Official Records Audit | B13 | NOT RUN — FINAL |
| P4-T090 | Final Closure | Failure Repair + Unresolved/DUE + Final Build Readiness | B13 | NOT RUN — FINAL |
| P4-T091 | Final Closure | Production Closure Report + Final Lock + Post-Lock Change Rule | B13 | NOT RUN — FINAL |
| P4-T092 | Accountability | Accountability Architecture + Applicability + Evidence-First | B8 | NOT RUN |
| P4-T093 | Accountability | Reason + Cost + Public Impact + Alternatives | B8 | NOT RUN |
| P4-T094 | Accountability | Questions + Right to Reply + No-Reply + Later Response | B8 | NOT RUN |
| P4-T095 | Accountability | Ground Verification + Deadline + Responsibility Map | B8 | NOT RUN |
| P4-T096 | Accountability | Timeline + Master Accountability Record + Outcome + Reopen | B8 | NOT RUN |
| P4-T097 | Accountability | Neutral Evidence Standard + Conflict + Evidence Integrity + Versioning | B8 | NOT RUN |
| P4-T098 | Accountability | Correction + Notification + Audit + Retention + Security + Failure + Android | B8 | NOT RUN |
| P4-T099 | Accountability | Accountability Full Functional + Neutrality + Privacy + Failure + Lock | B8 | NOT RUN |
| P4-T100 | Search/Analytics | Search Architecture + Long-Term Archive + Public-State Boundary | B9 | NOT RUN |
| P4-T101 | Search/Analytics | Public Search UX + Filters + Ordering + Pagination + Failure | B9 | NOT RUN |
| P4-T102 | Search/Analytics | Topic/Tag + Related News + Reporter Discovery | B9 | NOT RUN |
| P4-T103 | Search/Analytics | Analytics Baseline + Time Ranges + Public Controls + Raw Integrity | B9 | NOT RUN |
| P4-T104 | Search/Analytics | Search Index Privacy + Correction + Live Identity + Admin Boundary | B9 | NOT RUN |
| P4-T105 | Search/Analytics | Search Performance + Android + Founder-Time | B9 | NOT RUN |
| P4-T106 | Search/Analytics | Current Implementation Audit + Historical Topic Adoption | B9 | NOT RUN |
| P4-T107 | Search/Analytics | Complete Search Functional + Privacy Test Family | B9 | NOT RUN |
| P4-T108 | Search/Analytics | Complete Analytics Functional + Public Display + Privacy Test Family | B9 | NOT RUN |
| P4-T109 | Search/Analytics | Failure Isolation + Security + Regression + RCA + Topic Lock | B9 | NOT RUN |

## B0 evidence ledger

### P4-T001 — PASS
Evidence:
- Phase-4 branch was created from exact protected Phase-3 SHA `8cbd22b7560f3fc49ecabeabbe88e0c61d9672b8`.
- Baseline source/affected/code maps exist.
- Pull request #2 targets `phase3-regression-ci`.
- Protected workflow run #212 completed both static/source and Supabase transactional jobs SUCCESS on Phase-4 head `028208630f460f28bc0b87a65b104e57a965f907`.
- No application feature code or DB migration was required for B0.

### P4-T002 — PASS
Evidence:
- This register keeps implementation/test/PASS states separate.
- B0 governance checker completed SUCCESS in workflow run #212.
- Checker verified 109 unique P4 test IDs, no gaps/out-of-range IDs, legal status vocabulary and non-PASS handling for P4-T004/P4-T038/P4-T079.
- Manual/provider items remain NOT RUN rather than being auto-PASSed.

### P4-T003 — PASS
Evidence:
- CODE-MAP records authoritative homes for Article/PURL, Auth/session, Phase-3 Live, audit/history and recovery.
- Delta strategy is Preserve/Integrate/Extend/Add Missing; no parallel Article/Auth/Live authority was introduced.
- B0 governance checker completed SUCCESS and all protected Phase-3 static/database regression steps stayed GREEN.

### P4-T004 — PASS
Evidence:
- Founder real-device screenshot 2026-10-01 shows JANTA-BOL Admin Dashboard rendering and usable in Android/SPCK Preview.
- The visible dashboard presents routine newsroom actions such as Add News, Drafts, Published News and Deleted News, satisfying the real-device/mobile usability portion of the test.
- Protected Phase-3 CI run #214 completed the static security architecture, negative access, function security, security lifecycle and Supabase transactional regressions GREEN, supplying backend fail-closed/authority evidence.
- Existing Phase-3 Founder-verified article lifecycle evidence preserved the same Article UUID and Permanent Master URL through edit/publish/unpublish/republish; B0 changed no application feature or DB schema, so that unchanged-build identity evidence is reused rather than repeated.
- No lower-role authority is inferred from the Android screenshot itself; backend/RLS negative regression is the authority evidence.

B0 result: P4-T001–P4-T004 = 4/4 PASS. B0 GOVERNANCE + CI SAFETY CLOSED.

## B1 evidence ledger

### P4-T021 — PASS
Evidence:
- Existing 3 Reporter identities were migrated/backfilled into one canonical `team_accounts` lifecycle layer with no duplicate non-owner identity.
- Rollback-only B1 transaction removed one existing Reporter role, created the same user's pending Team Account, verified no effective newsroom role before activation, then explicitly activated the same Team Account identity and restored Reporter authority.
- Open browser self-registration was not introduced; Team invite creation is server-side through deployed `jb-team-api` v2.
- Invite alone does not write `user_roles`; authority begins only at explicit Founder activation.
- Team invite/activation actions write domain history and common audit records.

### P4-T022 — PASS
Evidence:
- Transactional role matrix changed the fixture Reporter to Editor and back.
- Owner/Super-Admin self-promotion through Team role change was rejected by backend.
- Newsroom role changes did not auto-create/regrant active Live membership.
- Browser Team client has no direct privileged Team RPC authority; all operations route through the verified server adapter.
- Protected Phase-3 Auth/Live/function-security regressions remained GREEN in workflow run #246.

### P4-T023 — PASS
Evidence:
- Same simulated stale client identity resolved as Reporter before suspension, no effective role immediately after suspension, Reporter only after controlled reactivation, and Editor after authorized role change.
- Suspension reuses existing Phase-3 Reporter/Live revocation paths and removes effective newsroom role.
- Reactivation does not automatically restore old Live grants.
- Lifecycle changes are recorded in Team history + common audit.

### P4-T024 — PASS
Evidence:
- Public Reporter discovery can be toggled independently with `public_name_enabled`.
- Public-safe directory exposes only Reporter ID + display name and is not a newsroom authority path.
- Departure test preserved the historical Article, Live Session and Reporter identity while disabling current Reporter authority.
- Old content/history is therefore not deleted merely because a Reporter departs.

### P4-T025 — PASS
Evidence:
- Rollback-only test created a synthetic device session and revoked only that target session.
- Session revoke produced Team domain history and common `audit_logs` evidence.
- Invalid Team authority action failed closed while the Article record remained intact.
- Existing Live notification machinery is reused for current Team critical notifications; B3 remains the future unified-notification home.
- Full protected Phase-3 security, recovery, editorial and retention regressions were GREEN in workflow run #246.

### P4-T026 — PASS
Evidence:
- Founder real Android/SPCK flow loaded the Team & Reporters screen with 3 Team Accounts and usable role/status/history controls.
- T029 Reporter B Test showed ACTIVE / EDITOR state and existing lifecycle history for role change, suspend and reactivate.
- Public Name OFF -> ON succeeded on Android without fresh 10-minute MFA after the routine-action fix; the UI refreshed to Public name ON and History recorded a new `team_public_name_changed` event.
- A high-risk Suspend attempt with stale MFA was blocked with `MFA_TOO_OLD`; the account remained ACTIVE and no new suspension history event was created.
- This proves the intended split: routine reversible public-name visibility stays Owner/AAL2/backend-authorized without recent-MFA friction, while high-risk Team authority changes remain step-up protected.
- Android proof is manual evidence; it does not replace the transactional lifecycle/security regressions already recorded under T021-T025.

### P4-T027 — PASS
Evidence:
- Required B1 migrations are mirrored in the repository and the Team API source is aligned with the repaired deployed runtime.
- `jb-team-api` v8 is ACTIVE with JWT verification; Owner/current-session/AAL2 remain backend authority and recent MFA remains required for high-risk Team mutations.
- Generic external authenticated identity resolves to no newsroom role and has no EXECUTE privilege on the Owner Team management RPC.
- P4-T026 real Android evidence is PASS, including routine Public Name toggle and stale-MFA denial for high-risk Suspend.
- Protected Phase-3 workflow run #269 completed SUCCESS on Phase-4 head `a1c7673dd37090b2a0b1165ec363c282e38a5683`.
- Earlier T123 regression was repaired without weakening the old checker; the protected boundary remains GREEN.

B1 result: P4-T021–P4-T027 = 7/7 PASS. B1 TEAM / AUTHORITY EXTENSION CLOSED.


## B2 evidence ledger

### P4-T051 — PASS
Evidence:
- Phase-4 B2 transactional regression explicitly passed the common audit shape, metadata sanitization and immutable-history checks.
- Ordinary UPDATE/DELETE attempts against protected audit history are blocked by the immutable guard.
- Article update/publish/unpublish activity continues to write the existing common `audit_logs` path.
- Protected workflow run #296 completed SUCCESS with the B2 static and transactional regressions included.

### P4-T052 — PASS
Evidence:
- Transactional regression exercised Article correction/status transitions plus public displayed-view controls.
- Raw analytics views remained unchanged while Public View ON/OFF and displayed-view override state changed independently.
- Audit history preserved previous/new display state plus raw-view evidence.
- Existing Article identity/version history remained present.

### P4-T053 — IN PROGRESS
Backend evidence completed on 2026-10-01:
- Grievance: existing `grievance_status` actions are present in common `audit_logs`.
- Live: `phase3b_admin_control`, `phase3b_force_stop`, `live_permission_revoked` and Live metadata-correction actions are present in common `audit_logs`.
- Team: role change, suspend, reactivate and public-name changes are present in common `audit_logs` while Team domain history remains separate.
- Security: session revoke, MFA-factor changes, recovery-key and Permanent Delete security actions are present in common `audit_logs`.
- B2 audit/export machinery is implemented and protected; protected workflow run #302 is SUCCESS after the B2 evidence-record update.
- Current Social save path persists `social_distribution` but does not yet write its canonical Phase-4 audit action.
- Current Compliance screen is read-only and does not yet implement Phase-4 approval actions.
- Current Ads screen is still localStorage/prototype and therefore has no canonical backend ad-control audit event yet.
- Unified Notification configuration is a later B3 capability and is not yet present.
Result:
- Common audit architecture is proven for existing critical domains, but the exact T053 cross-module matrix cannot honestly PASS until B3/B4/B6/B7 implement and test their domain-owned critical actions. No synthetic/fake audit rows were created just to obtain PASS.

### P4-T054 — NOT RUN — MANUAL
Required:
- Real Android authorized Audit Lookup by representative record IDs.
- Public/unauthorized access negative proof.
- Permissioned Audit Export proof and stored-value inspection showing secret-free output.

### P4-T055 — PASS
Evidence:
- Transactional regression proved different domain retention policies can coexist; no universal duration is imposed.
- Article Unpublish preserved the same Article identity.
- Common retention machinery is separate from domain-specific retention meaning.

### P4-T056 — PASS
Evidence:
- Transactional regression exercised DUE -> EXTEND -> DUE -> HOLD -> blocked Permanent Delete -> RELEASE HOLD -> authorized Permanent Delete.
- Unauthorized delete and Hold-protected delete were denied.
- Disposition history was preserved and the retired Article identity could not be reused.

### P4-T057 — NOT RUN — MANUAL
Required:
- Real Android records workflow plus Archive/Backup distinction, archived-private access, related links/version-evidence privacy and recovery/notification relationship evidence.
- E8 backup/recovery evidence remains required; code/CI alone is not sufficient.

### P4-T058 — PASS
Evidence:
- Supabase migration ledger confirms all four B2 migrations are applied: `phase4_b2_common_records_foundation`, `phase4_b2_retention_policy_index`, `phase4_b2_records_api_context`, `phase4_b2_live_retention_compat_fix`.
- Existing protected homes remain live and populated: `audit_logs`, `article_versions`, `verification_history`, `live_retention_registry`, and `live_deletion_ledger`.
- B2 adds common retention/disposition/public-view machinery rather than replacing those historical homes.
- Direct authenticated EXECUTE on privileged Records RPCs is denied; service-role adapter access is preserved.
- `jb-records-api` v1 is ACTIVE with JWT verification.
- Protected workflow run #296 completed the B2 static implementation audit and B2 transactional DB family SUCCESS.

### P4-T059 — IN PROGRESS
Current:
- Required protected Phase-3 + B2 static/DB regression is GREEN in workflow run #296.
- Final Topic lock is not allowed yet because P4-T053 is incomplete and P4-T054/P4-T057 still require real-device/recovery evidence.

B2 current result: 5 / 9 PASS; P4-T053 and P4-T059 IN PROGRESS; P4-T054 and P4-T057 remain manual NOT RUN.


## B7 / P4-T035 — verified checkpoint, 09 October 2026

Engineering source: `codex/b7-reconcile-20261009`, code commit `1e3e217dfabeb852ebca0632cdde309ecfbb1e9f`.

**P4-T035 remains IN PROGRESS, NOT PASS, NOT LOCKED.** No other B7 final test is newly marked PASS.

| Check | Actual result | Evidence source | Status / remaining work |
|---|---|---|---|
| T35-01 source baseline | Main/candidate ancestry and deployed B7 definitions/permissions inspected; candidate retained | Git commit above; current catalog audit | B7 source baseline verified; whole-platform source parity is not claimed |
| T35-02 isolated SQL | 33 assertions pass, including six valid call/WhatsApp cases and historical draft preservation | Candidate CI run 37942726859, attempt 2, isolated PostgreSQL job | PASS for this suite only |
| T35-03/04 security hardening | Existing public search paths and private-trigger restrictions preserved | Protected function-security CI | VERIFIED |
| T35-05 legacy route | Existing delegation to canonical feed preserved | Protected DB and isolated SQL checks | VERIFIED |
| T35-06 creative validation | Positive/negative CTA and content tests; unchanged legacy draft handling retained | Isolated SQL suite | VERIFIED; earlier phone-regex suspicion was a diagnostic escaping mistake, not a Production defect |
| T35-07 input/compatibility/API | Empty/oversized scope defect reproduced with eligible isolated campaign; minimum guard deployed. Historical drafts unchanged in rollback verification. Actual HTTP private-table reads denied | Migration `p4_t035_public_feed_input_guard`, version `20261009141706`; candidate CI HTTP job | Backend checks VERIFIED; deployed browser/runtime privacy and positive LIVE payload still DUE |
| T35-08 protected regression | Full source + Supabase transactional workflow SUCCESS after migration, including B1/B2/B6 | https://github.com/jantabol/JANTA-BOL-Website/actions/runs/37942726926 (attempt 2) | PASS for required automated regression run |
| Public HTTP | Transport/schema assertions and eight anonymous private-table denial cases SUCCESS after deployment | https://github.com/jantabol/JANTA-BOL-Website/actions/runs/37942726859 (attempt 2) | Empty public feeds are not positive paid-LIVE proof |
| Renderer runtime | Isolated Chromium verifies text escaping, label, image load, 360px layout, video controls, stale responses, safe CTA/media, news survival and zero GPS calls | Local synthetic browser harness | Supporting evidence only; video playback, deployed site and Android not proven |
| T35-09/10/11 | Actual Android photo/text/video/label/placement/privacy run not performed | No E3 supplied | DUE |
| T35-12 | Evidence gate remains open | This register | NOT PASS / NOT LOCKED |
| Historical P4-T034 evidence | Previous PASS + LOCK is preserved as historical status | Original Founder evidence still to reconcile | No new final PASS claim |
| P4-T036–T042 | No new end-to-end completion established in this checkpoint | Master Blueprint | NOT newly PASS / not locked |

Protection: only the intended public-feed definition changed during deployment; its grants and the remaining application function definitions/permissions were unchanged in the before/after comparison. Creative data was unchanged. No old regression test was removed or relaxed. The wider candidate SQL was not blindly deployed.

Raw Production exports were excluded from the GitHub commit after automatic approval review rejected their upload. This register contains a sanitized engineering summary, not raw Production definitions/records.

Next actual gate: identify the exact frontend version running on Android and obtain E3 plus real positive campaign evidence. Continue the remaining B7 requirements without treating this checkpoint as B7 completion.

## B7 continuation - 10 October 2026 (India)

Source recovered at `162d1b36b751339b21224e79667c0f9f13d7d947` on `codex/b7-reconcile-20261009`. No B7 final test is newly PASS or LOCKED.

- T035 defect reproduced: structured Guna/Ashoknagar Article districts reached the ad feed as global. `scopeForArticle()` now uses supported explicit districts, preserving Local-Pichhore priority and legacy Shivpuri classification. No GPS or free-text location inference.
- T036 defect reproduced: timezone-free datetime-local values were sent to a UTC database. A read-only timestamp conversion confirmed India 09:00 was interpreted as India 14:30. The client now validates dates/order and sends explicit UTC instants to the unchanged Owner/AAL2 RPC. Admin shows saved schedule values in device time with a timezone label.
- Existing HEAD governance failure reproduced: a historical evidence row beginning with `P4-T034` became a 110th canonical test row with an empty status. GitHub run `37943636324` failed at B0; its Supabase job was skipped. Only that historical row label was repaired; the checker and 109 canonical rows are preserved.
- `ci/phase4/b7-client-regression.cjs`: 22/22 local behavior checks, including supported districts, UTC conversion, invalid inputs rejected before RPC, backend denial propagation, and actual Admin inline field/render/click logic in a Node VM. The initial 20-test suite failed 14 cases on old code. These are isolated client tests, not real browser/Android E3 evidence.
- All 10 existing Phase-3 static suites, B0/B1/B2, T019 fault injection, exact coverage audit and 23 T035 contract assertions succeeded locally after repair. Both workflows now run the new client suite. No old check was relaxed or removed.
- Vercel verification BLOCKED: project detail/deployment access returns 403 for scope `shubhamshrivastava295-9848`. Project-list visibility is not deployed-URL/commit proof. No Vercel release was made.
- Local Chromium was unavailable and its download failed; no new browser success is claimed. Existing Android and paid-LIVE deferrals remain. Read-only live campaign count is zero.
- No production database definition, business row, payment, verification flag or permission was changed.

T035/T036 remain IN PROGRESS. T036 lifecycle/retention/delete proof and T037-T042 are not complete.

Fresh remote evidence verified for code commit `d64c83dc6c2d16bf0c09a5e16d16935bb660f833`:

- Protected Phase 3A + 3B Regression: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/37981663751 - SUCCESS; static/source and Supabase transactional jobs both successful.
- T035 candidate gate: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/37981663797 - SUCCESS; source checks including 22/22 client cases, isolated PostgreSQL rollback regression and real anonymous read-only HTTP/security-denial job successful.
- These results validate this code change and the automated suites only. They do not establish Vercel deployment, real browser playback, Android E3, real paid-LIVE delivery or final B7 closure.

## B7 T037 partial checkpoint — 10 Oct 2026 (NOT PASS)

Canonical `codex/b7-reconcile-20261009` package UI commit `fc4e6fa0d16770b3cdbe1f6806bb7ef5f7c1b334` modifies `JANTA_BOL_PHASE_3C_WORKING/ads.html`, `phase4-domain-client.js`, and extends `ci/phase4/b7-client-regression.cjs`. Owner/AAL2 existing package RPC, active-only booking dropdown, price minor/version/weight display and client validation were wired to the existing B7 backend, with no new authority home. Exact GitHub source passed 16 isolated V8 assertions; this is not final Node CI or real E3. Read-only live Supabase audit: 0 packages, 0 package versions, 5 campaigns, 0 LIVE, plus confirmed Owner package RPC and RLS/grants. A proposed weighted public-feed query planned successfully under EXPLAIN and a 4000-draw fixture returned 997/3003 selections (approximately 1:3), but this is NOT actual live rotation proof. REVIEW-ONLY SQL candidate commit `57d5d460d93d7a1393d08de3b3c9d255334638b5` is stored at `JANTA_BOL_PHASE_4_WORKING/review/b7_t037_weighted_feed_REVIEW_ONLY.sql`; NOT deployed or applied. Vercel READY preview target=null for client SHA, not production or Android evidence. Inventory/visibility caps, authenticated package-create/price-snapshot tests, staged weighted rotation, full protected CI, E2+E3+E5 remain due. No Production DB data/permission/DDL change; no B8 changes. **P4-T037 IN PROGRESS — NOT PASS / NOT LOCKED.**


## B7 NEW BLUEPRINT / G1 + ONE ARTICLE ONE AD — 10 October 2026

Execution branch: `codex/b7-blueprint-20261010`, directly based on `777341a37e73a1ec469d1f3180db131c74d5e838`. Draft PR #5 targets original reconciled B7 branch; DO NOT merge/deploy as completion.

- F01/F02/ADS-013 source: the *existing single* paid article ad region is moved after the third **semantic** article paragraph (second when exactly three); 0–2 paragraphs fall back to article end; original text, Article ID/PURL, 1-second article preview and news-sharing homes unchanged. One selection pinned for the life of the article page; never refreshes in place. Node VM regression covers 0/1/2/3/10 paragraphs and exact content preservation. No real Android proof.
- F05: removed homepage viewer-facing advertisement geo selector; single static homepage slot remains, state/national rotation backend still DUE.
- ADS-001: separate unobtrusive home/article "विज्ञापन के लिए संपर्क करें" CTA; new mobile-first `advertise-request.html` collects only name, WhatsApp, consent, optional note. UI displays Pending only on a real UUID receipt. No GPS/forced ad placement/media choice. Real browser/Android E3 DUE.
- ADS-002..005: `db/20261010_b7_public_enquiry_review.sql` STAGING/REVIEW ONLY, NOT APPLIED TO PRODUCTION. Candidate introduces normalized WhatsApp + affirmative server consent, immutable pending request ID, origin/verified Article ID, phone-keyed cooldown with advisory lock, Owner-only legacy RPC overloads; does not auto approve or go LIVE.
- ADS-006..009: candidate Owner verification RPC with normal/high-risk evidence rules, shared ad_history+audit_logs (no parallel home); admin queue shows private contact/source/consent and explicit Owner decision with note. This SQL is NOT deployed; do not claim live Owner/AAL2 pass.
- Independent disposable PostgreSQL `ci/phase4/b7-enquiry-fixture.sql` + `b7-enquiry-regression.sql`, added to candidate workflow; all prior protected checks preserved. Security T123 inventory extended to explicitly recognize new reviewed public and Owner-only signatures without weakening existing assertions.
- **No canonical B7 test is claimed PASS/LOCK.** T034 IN PROGRESS, T035/T036/T037 IN PROGRESS; T038 external E6 DUE, other T039..T042 NOT RUN. Exact final evidence requires staging integration, actual full protected CI on final source SHA, real E2/E3/E5, then Android proof.
- **Production untouched** by this change set: zero applied DDL/DML, no paid/LIVE data, no PR merge, no Vercel production deploy. Current backend behavior continues from pre-existing source. Do not silently run review SQL on LIVE project.


## B7-G5 / T038 MANUAL PAYMENT CANDIDATE — 10 OCT 2026 (NOT PASS)

- Branch `codex/b7-blueprint-20261010` builds on earlier reconciled B7 code and G1/one-inline-ad changes. Review-only migration: `db/20261010_b7_manual_payment_REVIEW_ONLY.sql`, **not deployed** and no production data altered.
- Canonical old payment records retained. Candidate Owner/AAL2 quote RPC `jb_ad_set_approved_quote_internal` stores an agreed paise price + evidence reference; quote immutable after confirmed receipt.
- New Owner/AAL2 `jb_ad_confirm_manual_payment_internal` requires literal typed `CONFIRM`, unique UTR/cash ledger receipt, method, timestamp, independent receipt evidence reference, advertiser consent evidence reference and timestamp, Owner note and approved price.
- BEFORE trigger on `ad_payments` enforces the SAME evidence for legacy RPC inserts, blocks zero/negative/mismatched price, unverified/high-risk campaigns, missing creative, duplicate confirmed UTR and mutation/deletion of confirmed receipt. Campaign LIVE trigger blocks premature/expired/unpaid campaigns regardless of legacy status RPC.
- Existing Owner `ads.html` manual payment section now calls new evidence RPC, never legacy 3-argument payment shortcut. Separate protected `ci/phase4/b7-client-regression.cjs` tests positive/negative Owner frontend behavior.
- `ci/phase4/b7-payment-fixture.sql` and `b7-payment-regression.sql` execute the candidate on GitHub isolated disposable PostgreSQL with rollback, including Owner rejection, consent missing, duplicate UTR, immutable payment, high-risk pending denial and future schedule. These are **synthetic E2**, never real bank settlement/E5 or E6.
- All P4-T034–T042 canonical PASS/LOCK still **NOT CLAIMED**. P4-T038 row deliberately remains `NOT RUN — EXTERNAL` under B0 source governance, because E5 real Owner and E6 external evidence are not available. Isolated code/test success is a PARTIAL checkpoint, not launch readiness.
- Existing full Phase3+4 Protected CI and candidate CI need both be GREEN on every eventual merge/build SHA. No backend SQL applied to production. Full B7 still requires G2 geography/media, G3 inventory+rotation, G5 advertiser portal, G6 analytics/audit and G7 Android E3 and final closure.

## B7 / P4-T039 Advertiser Portal — 10 Oct 2026 (IN PROGRESS · NOT PASS)
- Source branch `codex/b7-blueprint-20261010`, draft PR #5. Built on the protected GREEN branch; none of the existing News/Live/Grievance source homes were replaced.
- Owner/AAL2 *existing* `jb_ad_issue_portal_internal` reused. New Owner UI issues temporary login and displays credentials once for **manual delivery only**; no automated WhatsApp delivery claimed.
- `advertiser-portal.html` is new Android-friendly advertiser portal. One-time issued credential is consumed by a staging override of the existing login RPC. Signed-in session remains in **tab sessionStorage only** (never permanent localStorage/URL); revoked/expired session fails closed. Own campaign + approved creative only, no cross-tenant reads.
- REVIEW-ONLY candidate `db/20261010_b7_portal_text_change_REVIEW_ONLY.sql`: reuses canonical `ad_campaigns`, `ad_creatives`, `ad_portal_credentials`, `ad_portal_sessions`, `ad_history`, `audit_logs`. Adds **only** `ad_change_requests` as a pending text-request queue, **not** a second approved creative home. Existing `jb_ad_portal_submit_creative` signature now rejects media/CTA/direct edits and stores only a text request, preserving current approved asset.
- Owner queue `jb_ad_owner_change_requests_internal` + Owner decision `jb_ad_decide_change_request_internal`. Accept for work **never** replaces an approved LIVE creative; Founder must separately approve any actual media/geo change. Request status, actor, time and history recorded.
- Separate disposable PostgreSQL `ci/phase4/b7-portal-fixture.sql` and `b7-portal-regression.sql` test Advertiser A/B, forged/expired/revoked sessions, direct asset/edit attempts, single-use temporary credential, duplicate request cooldown, Owner/AAL2 negative path, audit, old creative unchanged and rollback. Added as a **new** job in the existing Candidate CI workflow; full protected CI remains untouched except additive explicit RPC security inventory.
- ADS-041/042/043/044/045/046: **isolated E2+source proof only**. Android E3, real Supabase owner AAL2/anon permission parity, end-to-end issuance and media review, plus ADS-047 renewal still DUE. DO NOT label P4-T039 PASS/LOCK.
- No production DDL/DML or paid/LIVE record created by this checkpoint; review migration must not be applied without complete staging parity and launch authorization. Original P4-T038 external E6 still DUE, B8 not started.


## B7 / ADS-047 renewal checkpoint — 10 Oct 2026 (STAGING / NOT PASS)
- Source: `db/20261010_b7_portal_text_change_REVIEW_ONLY.sql`. Reuses *existing* `public.ad_renewal_requests` rather than creating a parallel renewal table. Adds origin `request_channel` and private `source_portal_session`; retains `requested_by` for existing authenticated account requests. One pending request per campaign via atomic lock + partial unique index. Future end must exceed current contract and server time.
- `jb_ad_portal_request_renewal` accepts only server-validated short-lived own campaign portal token. Inserts Pending renewal and append-only `ad_history`; NEVER updates `ad_campaigns.ends_at`, `status`, `paid_at`, `ad_payments` or published creative. Revoked/expired session, past/short date and repeat requests denied.
- Owner-only `jb_ad_owner_renewals_internal` reads the canonical queue. No automatic acceptance or payment: Founder must separately review terms, payment, geo and schedule. Android portal and Owner queue show Pending only.
- Disposable PostgreSQL `ci/phase4/b7-portal-fixture.sql` + `b7-portal-regression.sql` include old JWT renewal record, cross-token denial, duplicate rejection, direct-table access denial, Owner negative role, Owner queue and unchanged current LIVE expiry, inside rollback. `ci/phase4/b7-client-regression.cjs` adds no-auto-extend and escaped UI checks.
- Evidence classes available only on exact GREEN CI SHA after workflow completion: E1 + synthetic E2. **Still DUE:** actual Supabase migration/role/parity and privileged integration E2/E5, real Android E3, real manual Owner renewal quote/payment/approval, public and private safety matrix. P4-T039 stays IN PROGRESS; NOT PASS/LOCK. P4-T038 original provider E6 stays DUE under launch-scope rules.


## B7-G3/G4 Article geo, weighted selection and no-oversell checkpoint — 10 Oct 2026

**Source:** `codex/b7-blueprint-20261010` (DRAFT PR #5, production unchanged); source approval: B7 Final Master Blueprint, F01-F06/F13-F14; P4-T035 ADS-014 and P4-T037 ADS-024..034. **NO CANONICAL TEST PASS OR B7 LOCK**; E2 below means disposable fixture evidence, NOT approved LIVE Supabase functionality.

### G3 — ADS-014 / ADS-028 (partial E1/E2 only)
- Additive `db/20261010_b7_geo_targeting_REVIEW_ONLY.sql`: canonical published Article verified LGD code fields, exact campaign area grants and private Article-ID matcher. No caller area/GPS; Owner/AAL2 writes, immutable paid area changes and audit; unverified district/tehsil parent blocked; national fallback only if explicitly reviewed. Existing Article ID, URL and free-text newsroom fields not rewritten.
- `ci/phase4/b7-geo-fixture.sql` and `b7-geo-regression.sql` prove **25 synthetic** expected positive/negative Article/campaign combinations; 3 pilot synthetic district codes are **not verified official MP geography**. Gwalior excludes Pichhore-only, district-only excludes tehsil-only, unknown local denied, unpublished denied, Owner denial, direct SQL denial.
- **Due:** official authoritative MP 55 district+verified tehsil source/version/parent import, credible Article metadata integration, old public RPC safe cutover to one Article-ID feed, deployed E2/RLS, Android E3 and cross-area negative matrix.

### G4 — ADS-029..034 (synthetic E1/E2/E5 only, NOT complete)
- `db/20261010_b7_weighted_private_REVIEW_ONLY.sql` selects **at most one private candidate** from canonical Article ID; exact Owner granted area, approved advertiser/creative, real-evidence manual payment candidate, current server schedule and paid immutable package version. No alternative public feed and no 20-minute in-Article swaps.
- CI `b7-weighted-postgres` executed 3,200 random server selections with package weight **1:2:3**. One documented successful sample at commit `769ac23bc3cb3dd47767061f31a3d598177f43cb`: weight1=529, weight2=1033, weight3=1638 (expected ~533/~1067/1600, within published relative 20% fixture tolerance). Checked zero/one/many candidates, missing/invalid newest asset, expired/hidden/paused/unpaid, package snapshot tampering, wrong Article/unknown/draft.
- `db/20261010_b7_inventory_guard_REVIEW_ONLY.sql` adds independent evidence-indexed conservative shared Article/Home window caps (cannot overlap), Owner/AAL2 serialized reservations and immutable sold commitments, with price/area/period/package contract guard and safety Hide exemption. `b7-inventory-postgres` fixture: capacity 1,000, first buyer guarantee 600 + second 400, attempted +500 / third new sale denied; Owner/AAL1/direct SQL/duplicate/oversized/old-period, high-risk, immutable terms, common audit/history and rollback.
- RCA: `b7-inventory-regression.sql` originally failed from ambiguous PL/pgSQL `id` on run 38056591494. Exact fixture repaired to qualified `w.id` in commit `a0d475273cdc7f84c5700ee763f436377c314f59`; subsequent candidate suite successful on this code before later guards. Failed CI is documented, never marked PASS.
- **Still due:** actual approved published packages/terms/quote, independent inventory forecast+historical sold-reach reconcile, official geo, one LIVE public sanitized feed, race/capacity concurrency staging, anti-starvation, served vs qualified impression counters, tokens/dedupe, Android E3, actual E2/E5/AAL2, Owner final sign-off. P4-T037 NOT PASS / NOT LOCK. No synthetic test is E6 or real traffic proof.

**Preservation:** Protected Phase 3A+3B + existing Phase4 static/database CI and new G3/G4 isolated jobs run on every feature commit; do not bypass any checker. All SQL named `REVIEW_ONLY` remains unapplied to LIVE. P4-T034..T042 still have NO final PASS; external provider E6 in P4-T038 remains genuinely DUE and cannot be disguised as 9/9 PASS. After latest source commit, record exact SHA + corresponding protected/Candidate GREEN CI receipts before promoting any further checkpoint.


## B7-G3/G4 single canonical public feed staging — 10 October 2026

- **Current branch / DRAFT PR:** `codex/b7-blueprint-20261010`, PR #5; all backend migrations under `*_REVIEW_ONLY.sql` STAGED, NOT APPLIED TO LIVE Supabase, not production-deployed. Existing Article ID/master URL/share and one ad opening pin preserved.
- **New backend code:** `db/20261010_b7_single_public_feed_cutover_REVIEW_ONLY.sql` retains the exact public `jb_ad_public_feed(text,text)` and legacy `jb_public_active_ads(text)` signatures and 8-field sanitized projection; no second public ad selection. Article selection accepts **only** `article:<published-uuid>` and private server verified Article geo/weight. Homepage selection accepts only `global` with reviewed MP-State/National commercial area grants, current approved/paid/start-end and package weight. Old client `local`/`district:x` claims fail closed; no GPS.
- **Frontend future-ready only:** `public-ads.js` `scopeForVerifiedArticleId()/renderVerifiedArticle()` validates Article UUID and reuses the pinned one-slot renderer. `article.html` remains on original legacy client scope for **deliberate paired rollout hold**, keeping all prior source tests and news behavior. The new backend cannot safely deploy without simultaneously changing this call; official 55-district/tehsil LGD, original article classification proof and Android E3 still DUE.
- **Synthetic E2 CI:** `ci/phase4/b7-single-feed-regression.sql` makes 80 anonymous Article calls, rejects 11+ fake/wrong/malformed/unknown/draft claims, proves MP homepage + legacy homepage alias, private geo/business data denial, and next-open emergency Hide. Separate new `b7-single-feed-postgres` Candidate job, existing old CI unaltered. No Production ad, click or qualified impression analytics claimed.
- **Evidence/RCA:** Earlier Candidate failure at 38058598024 came from unsupported test-only PostgreSQL `max(uuid)` aggregator; fix `c4b6596e`. Follow-on candidate failure at 38058659207 came from resolving a `private` regprocedure under anon lacking schema USAGE; fix `97800c7c` catalog OID lookup. No tester bypass or old suite deleted. Conditional new Article-ID review added to locked T123 rather than whitelisting any other new public feed.
- **STATUS:** P4-T035 **IN PROGRESS**, P4-T037 **IN PROGRESS**, P4-T040/T041 untouched **NOT RUN**. No B7 final PASS/LOCK. Actual LIVE credential/anon/AAL2/tehsil/inventory/audit/browser Android E3 and provider E6 gaps remain. Release checklist: `review/B7_SINGLE_PUBLIC_FEED_CUTOVER_GATES_20261010.md`.


## B7 / P4-T040 ADS-049/050 viewability and ticket milestone — 10 Oct 2026

**CANONICAL STATUS: IN PROGRESS (NOT PASS · NOT LOCKED).** No change to P4-T034..T039 or T041/T042 final PASS status. B7 PR #5 remains DRAFT; Production unchanged.

- **Source/E1:** `JANTA_BOL_PHASE_3C_WORKING/ad-viewability.js` enforces browser visible area >=50% for continuous >=1000ms, cancels below fold/quick scroll/hidden tab; no in-Article rotating or editor preview counting. `ad-analytics-client.js` adds a prospective anonymous 128-bit crypto random Article-view nonce and memory-only one-use ticket. Neither new file is imported by the LIVE homepage/article. 10 observer tests + 8 browser handshake tests ran in Candidate Node CI.
- **Source/E2 synthetic:** `db/20261010_b7_qualified_impressions_REVIEW_ONLY.sql` adds 3-minute hashed one-use Article ticket linked to canonical *existing* `ad_events`, marks qualified client claims separately from old raw events; revokes two unsafe anonymous raw writer RPC grants, preserves their signatures and existing history. Owner-only `jb_ad_qualified_analytics_internal` reports today/d7/d30/total, old unverified raw and explicitly `client_reported_estimate_not_unique_people`.
- **Shared eligibility:** Existing weighted selector now calls `private.b7_eligible_article_creatives` for one trusted Article-ID/Geo, approved/latest creative, verified advertiser, payment and server schedule. Ticket issuance calls that SAME private function; wrong Article/district/draft/other campaign creative cannot obtain a ticket.
- **Real isolated PostgreSQL tests** `ci/phase4/b7-view-ticket-fixture.sql` + `b7-view-ticket-regression.sql` via `b7-view-ticket-postgres`: anon legacy writers denied, ticket hash/RLS private, malformed/wrong/draft/cross-creative denied; same Article/open nonce cannot be reused; server rejects under-one-second impression; after 1.15s server time accepts one view and denies replay/forgery; expiry and Owner Hide stop new tickets; an already-open pinned eligible ticket remains historical. Owner analytics show 1 qualified client report vs 1 preexisting RAW unverified event, clicks verified 0; all fixture writes rolled back. Run 38060747455 **GREEN on source `2cdbb7f18e94c1e68f797e78aef2ec71f0266aec`**.
- **Security:** existing 3A-P3-T123 conditional allowlist covers only the two exact anon ticket signatures and exact Owner-qualified-stats RPC; failure if raw anonymous inserts/ticket tables are exposed or the one-use components are missing. Protected Phase3 checks remain active, no test bypass.
- **RCA:** temporary Candidate failure 38060102811 was static comment literal `ad_events`; fix `b1630b85` changed comment, not checker. A SQL string patch interpreter duplicated text because it treated SQL `$'` as a JavaScript replacement token; reconstructed safely from formerly verified source, fix `98f168cc`. Retested old weighted 3,200 draws and new issued tokens in disposable CI.
- **Still DUE (hard blockers):** 50% visibility is currently **client reported**. Fresh forged browser nonce and fake visibility can still be submitted by a bot; one-use token does NOT prove a distinct human or payable view. Provider/bot-rate risk gates, verified safe CTA/click tracking, homepage tracking, real Android below-fold/hidden tab/20-minute no-swap E3, actual authorized Owner E5 and qualified d7/d30 production parity all unverified. Production retains old raw anonymous RPC privileges until an authorized controlled deployment. Official MP-55 LGD, public Article-ID paired cutover and business/quote/inventory gates remain outstanding. Never assert T040 PASS from synthetic evidence.
- **Detailed release hold:** `review/B7_P4_T040_QUALIFIED_VIEW_ROLLOUT_20261010.md`. **NO FAKE PASS · NO B8**.


## B7 P4-T040 optional renderer bridge source addendum — 10 Oct 2026
- Exact `public-ads.js` render bridge: when future official Article-ID API and optional `JBAdAnalytics` runtime are BOTH present, renderer appends the one ad and *then* asks the short-lived token/observer handshake to prepare (never awaiting stats). In current tracked `article.html`, old `scopeForArticle` continues and no analytics script is loaded, so both activation requirements are false.
- Added three `ci/phase4/b7-client-regression.cjs` tests: one handshake for one pinned element, no request for legacy/forged `local`/`district:` Article scope, and stats rejection cannot blank/rotate a visible News-ad card. E1 and synthetic DOM only; not an E3 Android or Production test.
- **Still:** ADS-049/050 and canonical P4-T040 remain IN PROGRESS; anti-bot human proof, verified complete LGD + real deployment parity, qualified counts / click/historical view reconciliation and Founder E5 are required. Never convert this small bridging change to PASS.

## B7 ADS-049 continuous-threshold stability check — 10 Oct 2026
- **First divergence after isolated observer audit:** old source restarted the 1000ms countdown on every IntersectionObserver ratio update, even if visible proportion remained >=50% (e.g. scrolling 55%→85%→62%). It would conservatively undercount genuine continuous viewability and was not semantically correct.
- **Minimum safe fix:** `ad-viewability.js` now begins timing once upon entering >=50% in a visible tab and **does not reset while remaining >=50%**. It cancels instantly if below threshold, tab hidden or ad removed. No ad rotation or extra network events introduced.
- **Negative/positive proof:** `ci/phase4/b7-viewability-regression.cjs` now tests continuously above threshold while ratio changes and exact >=1000ms acceptance; older below-threshold/hidden/background/duplicate tests retained. CI receipt must be tied to final exact HEAD; P4-T040 still **IN PROGRESS**, no live E3 or human-verified reach.


## B7 ADS-048 secure CTA click checkpoint — 10 Oct 2026
- **Status:** P4-T040 IN PROGRESS; ADS-048 synthetic E1+E2 only (NOT final E3), ADS-049/050 full provider/device/privacy remains DUE. B7 PR #5 DRAFT and none of the backend migrations are LIVE.
- Server review SQL: `db/20261010_b7_cta_click_REVIEW_ONLY.sql` reuses one-use Article view ticket and the same `ad_events` ledger. Validation gates: short-lived opaque ticket hash, one click only, approved matching creative+safe URL/type, no asserted client target, event type+ticket unique; one simultaneous qualified impression does not block one CTA click. Legacy click/impression writer signatures remain but their anonymous grants are revoked ONLY if the review migrations are deployed together. Same locked Owner report keys; new `clicks_reported` vs explicitly zero `clicks_verified` and `anti_bot_verified=false`.
- Frontend staging: `public-ads.js` supplies validated CTA element to optional `ad-analytics-client.js`. Only trusted real click, not programmatic, removed/hidden/blocked event; analytics outage never cancels navigation. `article.html` and `index.html` unchanged/unlinked; no original Article PURL/sharing and news metrics were touched.
- E1/isolated E2 proof: Node click/renderer regression verifies 12 approved/rejected destination cases: website/maps https, tel, WhatsApp; rejects js/data/file/http/credential-bearing URLs. Browser gesture tests validate once-only, malicious/hidden/offline no-click. Disposable PostgreSQL run `38062318242` (at SHA `c9c6e9a6be8e0a882b9d1b1cac4a30d9a89b9b03`) returns proper 1 impression + 1 click per valid token, denies replay/fake token/unsafe stored JS CTA and protects old raw event history. **CI synthetic PASS does not mean ADS-048 canonical PASS.**
- **Remaining:** actual approved CTA navigation on Android, server/client paired staging, E3 viewport/click measurement with negative tap tests, bot-like fresh-token spam and integrity/rate limitations, real Owner AAL2/E5, genuine qualified 7/30-day counters & old raw vs new counts. No human-verified or billable views/clicks can yet be claimed. NO PASS/NO LOCK, no B8.


## B7 T040 Owner estimated analytics panel addendum — 10 Oct 2026
- **Staging UI only:** Owner's existing `ads.html` shows on-demand qualified-claim summary via `JBPhase4.adQualifiedAnalytics` which requires existing Owner/AAL2 authority and calls only the new review RPC `jb_ad_qualified_analytics_internal`. No provider/WhatsApp claims, no direct `ad_events` table browser read, no public exposure.
- Discloses `clicks_reported` vs `clicks_verified=0`, client-reported qualified views vs historical unverified raw events, independent News analytics, and "Unique-human/bot-free reach: NOT VERIFIED." All content through `textContent` and numeric safe formatting; missing RPC displays **unavailable**, never substitutes misleading raw click/view totals or zero.
- New client Node negative tests: unauthorized Owner AAL2 denied before RPC, malformed campaign UUID no write, correct approved JSON projection, backend unavailable/legacy metrics fail closed. This is synthetic E1; no real LIVE advertising campaign, no Android or Owner E5. **P4-T040 stays IN PROGRESS, 0/9 canonical B7 PASS/LOCK.**


## B7 ADS-029/048 late CTA after 20-minute pinned Article — 10 Oct 2026
- RCA: Staged one-use view ticket originally expired at 3 minutes for BOTH impression and click, causing a legitimate CTA click after 20 minutes on a pinned Article to be uncounted. Article must show the SAME paid ad while open; that is an accepted normal user reading path. This is an engineering functional divergence, not a reason to rotate ad or extend its short view qualification deadline.
- **Minimum safe fix** in `db/20261010_b7_cta_click_REVIEW_ONLY.sql`: keep 3-minute *impression* qualification expiration unchanged; allow a click on the same originally issued token up to 30 minutes after issuance. It remains one click maximum, requires exact original approved CTA, row-locked atomic consume and a live displayed link. No late impression can be fabricated by this click route; real CTA navigation is unaffected.
- Added disposable PostgreSQL negative/positive scenarios in `ci/phase4/b7-view-ticket-regression.sql`: 21-minute-old ticket with expired view claim still permits **one** CTA click; replay denied; 31-minute-old ticket fails. Owner report shows **one** original impression and **two** separate CTA click claims (two Article openings), excluding a third stale attempted click. No real external traffic/billing claim.
- This 30-minute safety window is a staged engineering bound covering the explicit 20-minute Blueprint run; actual Android E3 including 20min visible ad and tap remains DUE. Other bot/human-attestation and production migration gates remain open. P4-T040 **IN PROGRESS**.
