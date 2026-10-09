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
| P4-T034 | Ads | Ad Architecture + Public Request + Verification | B7 | NOT RUN |
| P4-T035 | Ads | Creative + Label + Placement + Targeting Privacy | B7 | IN PROGRESS |
| P4-T036 | Ads | Campaign Schedule + Start/Expiry/Pause/Hide/Delete Lifecycle | B7 | IN PROGRESS |
| P4-T037 | Ads | Packages + Price Versioning + Rotation + Inventory | B7 | NOT RUN |
| P4-T038 | Ads | Approval -> Payment -> LIVE + Non-Refund Disclosure | B7 | NOT RUN — EXTERNAL |
| P4-T039 | Ads | Advertiser Panel + Isolation + Creative Change + Renewal | B7 | NOT RUN |
| P4-T040 | Ads | CTA + Analytics + Privacy + Analytics Failure | B7 | NOT RUN |
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

T035/T036 remain IN PROGRESS. T036 lifecycle/retention/delete proof and T037-T042 are not complete. Fresh remote CI is pending this code commit and must be verified before closure.
