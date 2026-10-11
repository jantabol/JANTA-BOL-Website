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
| P4-T041 | Ads | Ad Notifications + Audit + Retention + Security + Provider Failure | B7 | IN PROGRESS — B3 in-app adapter + immutable ad history/7yr retention, historical backfill, audited Owner retry E1/disposable E2 only; real E5/production/security incident DUE |
| P4-T042 | Ads | Ads Mobile + Founder-Time + Implementation/Coverage/Regression Lock | B7 | IN PROGRESS — E1 source 60-ADS/9-test audit and fail-closed Final ZIP gate only; real Android E3, full E7 source proof and Founder final sign-off DUE |
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


## B7 ADS-049 loaded-media-only impression staging — 10 Oct 2026
- **First divergence from qualified meaning:** With an image/video campaign, an Advertisement frame can occupy >=50% of screen while its actual Image is not loaded yet or Video has no first frame. Starting the 1-second timer on the empty box could report non-viewable ad pixels as a delivered view.
- **Minimum safe Source fix:** Existing `public-ads.js` text ads can offer an optional Article-ID view ticket immediately after the box is appended. For images, the optional ticket begins ONLY when `img.complete && img.naturalWidth>0`; for videos only once actual loaded data exists (`readyState>=2`), with event listeners for delayed media loading. Fake/early event without content, broken-image error, removed box or repeated load/data events never send a ticket. `IntersectionObserver` then enforces continuous 50%/1sec visible-tab viewing as before. No change to Article text, URL, existing ad frequency/rotation, or news 1-second preview.
- **E1 synthetic tests:** `ci/phase4/b7-client-regression.cjs` now contains separate image/video readiness and failure tests: zero initial ticket, zero for premature load, one after valid image pixels/video frame, no duplicate on repeat event, zero after broken ad removed. Existing original Phase3/Phase4, Ads and P4-T040 tests preserved. Candidate CI must be checked on exact final SHA.
- **Still DUE:** true Android E3 with slow 2G network/below-fold media, actual video frame and ad scrolling, server staleness and bot/fake-client abuse tests, qualified Home slot, Owner E5. Backend still REVIEW_ONLY. P4-T040 IN PROGRESS, NOT PASS.


## B7 / P4-T041 — ADS-051..056 staging checkpoint (10 October 2026)
**Status: IN PROGRESS · NOT FINAL PASS · NOT LOCKED.** Canonical test demands E1+E2+E5 and a complete ADS-051..056 matrix. This is a **disposable PostgreSQL contract fixture**, not confirmation that the live B3 notification service or any external provider delivered a real message.

### ADS-051/055 — Unified in-app notification routing (synthetic E1/E2 only)
- Existing B3 source authority read-only verified on Supabase: `jb_notification_emit_internal`, `live_notifications`, `notification_delivery_history`, `notification_delivery_outbox` and Owner `user_roles`. No new notification table, no parallel SOT.
- Review-only `db/20261010_b7_unified_notifications_REVIEW_ONLY.sql` adds narrowly scoped trigger adapters for ad request/status transitions (requested/review/paid/LIVE/hidden/expiry), advertiser verification, manual payment confirmed, approved creative and existing portal change/renewal requests. Only calls preexisting B3 **IN_APP** notification engine, with idempotency key and Owner priority. No WhatsApp/email/push claimed SENT, no personal contact, receipt, UTR or source identity emitted.
- Notification/provider failure does NOT revert advertisement enquiry, Owner payment or News. A sanitized `ad_notification_failed` event is appended to immutable common `audit_logs`, with safe SQLSTATE and `NOT_CONFIRMED`. Owner/AAL2-only `jb_ad_notification_failures_internal()` and `jb_ad_notification_retry_internal(bigint)` retry through the same B3 in-app engine, retaining original failure and adding one `ad_notification_retry_succeeded` audit row; retry is idempotent. New `ads.html` panel loads failures only on Owner action, never automatically sends or claims external WhatsApp delivery.
- `ci/phase4/b7-notification-fixture.sql` models the **existing B3 function signature as a local stub** (NOT actual production engine), and `ci/phase4/b7-notification-regression.sql` executes real Owner manual payment and twelve expected ads-domain in-app events, duplicate/no-op status guard, pending change/renewal, email/WhatsApp-sent negative, forced B3 outage with original campaign retained, failed retry denied, successful retry idempotent and AAL1 Owner negatives. PostgreSQL rollback ensures zero LIVE mutations.
- **Still due:** real B3 in-app notifications and RLS/role/AAL2 parity against deployed staging, app UI Android E3 and Owner E5 receipts, provider failure and safe external retries, duplicate across real workers; no synthetic CI can prove a WhatsApp message was sent.

### ADS-052/053 — Immutable commercial evidence and B3 retention (synthetic E1/E2)
- Read-only confirmed existing B3 `record_retention_policies` has `ads_history_v1`, 2555-day (7-year policy), manual disposition (`automatic_disposition=false`). No competing retention policy was introduced.
- `db/20261010_b7_retention_audit_REVIEW_ONLY.sql`: uses existing `public.ad_history`, `record_retention_state`, `record_retention_history`, `audit_logs`; every new commercial event registers under existing policy, regardless of whether auth.uid is Owner or NULL. **Existing pre-migration historical rows are backfilled by ORIGINAL created_at**, preserving any preexisting HOLD/EXTEND state. Records with missing/disabled policy fail closed. Approval/commercial history append-only: direct history update/delete, paid/evidence-bearing campaign physical DELETE and in-place approved-creative rewrite/delete denied. New unapproved draft remains editable. Soft hide/expiry still permitted. Does **not** authorize physical purge, including if retention due date has elapsed.
- `ci/phase4/b7-retention-fixture.sql` + `b7-retention-regression.sql` prove original-date backfill, preexisting legal hold preservation, historic and new-event registered and append-only, forbidden deletes, correction creates new history and retention row, approved creative immutability and no unretained writes with inactive policy. Synthetic rollback.
- **Still due:** actual migration on separately controlled staging with complete B3 retention RLS, historical LIVE ad records/parity, production audit trace and Founder-level disposal authorization; real E5 and retention schedule evidence. No physical deletion implementation.
- **RCA:** first Candidate retention fixture incorrectly inherited fixed `auth.uid()` from older payment fixture and represented an anonymous-origin event as Founder. Replaced with nullable per-test identity (commit `2e7290e9`); CI rerun GREEN. Later B3 notification retry test used ambiguous PL/pgSQL variable `id` vs audit_logs.id; renamed exact variable `v_failure_id` (commit `b57b1add`), not a weakened checker. Other temporary RED SHA receipts kept historically; exact final HEAD GREEN required.
- **Unfinished ADS-054/056:** production RLS/role matrix, client secret scanning, owner revoked account/session checks, storage/CTA/notification security incident drills still require E1+real E2/E5. Existing protected Phase 3A+3B and B7 Candidate CI not disabled; new exact Owner retry signatures are guarded conditionally under T123.
- **LIVE STATUS:** No B7 REVIEW_ONLY migration has been applied to Supabase production; public Article/News unaffected. All B7 P4-T034–T042 **0/9 FINAL PASS+LOCK**. External provider E6, qualified click/anti-bot, official MP55+tehsil, Android E3 remain DUE. No B8.

## B7 P4-T041 — concurrent Owner retry, time-correct retention & revoked Owner fixture — 10 Oct 2026

**Status remains IN PROGRESS · NOT FINAL PASS / LOCK.** These are disposable PostgreSQL E2 tests and read-only contract observations, not LIVE Supabase B3 delivery, Android E3 or authenticated Owner E5.

- **First divergence 1 (notification recovery)**: `jb_ad_notification_retry_internal` previously read the immutable failure row `FOR SHARE`; two concurrent Owner retries could both observe "not yet successfully retried" and append duplicate success-audit records. Minimum safe change in `db/20261010_b7_unified_notifications_REVIEW_ONLY.sql`: `FOR UPDATE` row lock on the failure audit ID (no update/delete of the immutable row), then check existing success receipt. The same B3 in-app dedupe remains authoritative.
- **Two real database sessions** are started by the additive Candidate GitHub job using `ci/phase4/b7-notification-concurrency-setup.sql` + `b7-notification-concurrency-verify.sql`. Fixture B3 emitter adds a one-second delay ONLY inside disposable test mode, making concurrent attempts overlap. Assert one original immutable failure, **exactly ONE successful retry audit** and exactly ONE existing B3 in-app receipt after two Owner attempts; zero EXTERNAL_SENT/WhatsApp claims. This is DB-level race evidence, NOT provider message proof.
- **First divergence 2 (commercial retention)**: new/imported ad_history originally calculated 7-year due date from registration time even if `created_at` was backdated, while legacy backfill correctly used original event time. `db/20261010_b7_retention_audit_REVIEW_ONLY.sql` now uses `new.created_at + policy days`, rejects invalid timestamps, and registers already-overdue evidence as DUE **without automatic disposal**. New E2 cases verify imports 60 and 2600 days old, due dates and unchanged legal HOLD.
- **Revoked/suspended recipient negative**: the disposable B3 fixture now mirrors `team_accounts.status` denial from LIVE emitter. Owner suspension generates no in-app notification but preserves the advertisement request and immutable NOT_CONFIRMED audit; after controlled mock reactivation, Owner-only retry creates ONE notice and one success audit. This is NOT a real revoked session/logout test.
- Existing Phase3-T123 now conditionally requires exact `FOR UPDATE;` clause in Owner retry function when review migrations are installed. **Old tests remain enabled; no Production writes.** Real B3 RLS, actual revoked sessions, legal retention sign-off, E5 Owner proof, Android E3, approved production rollout and full ADS-051..056 security matrix DUE.



## B7 P4-T041 — exact original B3 emitter parity + stale LIVE retry safety (10 Oct 2026)

- CANONICAL P4-T041 remains **IN PROGRESS / NOT PASS / NOT LOCKED**; 0/9 canonical B7 tests are final PASS. Proof here is a disposable PostgreSQL E2 test of the EXISTING SOURCE migrations, not actual production B3 delivery or Founder Android E5.
- The prior `b7-notification-fixture.sql` test used a simplified B3 stub, and by itself could not prove that actual B3 `notification_delivery_history`, `notification_history_v1` and privacy priority routing work. **New isolated CI job `b7-original-b3-contract-postgres`** adds synthetic base tables then runs EXACT existing source migrations `CODEX_CURRENT_SUPABASE/migrations/20261003000100...`, `20261003000200...` and `20261003000500...` verbatim before the B7 notification review SQL; NO alternative emitter function source copied, no Production DB changes.
- `ci/phase4/b7-b3-real-contract-regression.sql` verifies original B3 emitted Owner ACTION_REQUIRED/ATTENTION notice, exactly one `notification_delivery_history` IN_APP/EMITTED row, same canonical `record_retention_state` notification policy row; unchanged campaign status causes no duplicate, suspended Owner receives none (original enquiry survives and failure audit recorded), Owner AAL2 retry produces exactly one IN_APP history/retention/success audit, B3 rejects passwords/tokens with `UNSAFE_NOTIFICATION_CONTENT`.
- **Lifecycle first divergence fixed:** retry of a failed `ad_live` event AFTER canonical campaign changed to HIDDEN previously sent the misleading "Advertisement LIVE" Owner notice. Now `jb_ad_notification_retry_internal` checks current canonical `ad_campaigns.status` (and verified advertiser/payment state where applicable), routes stale event to `ad_workflow_updated` with HIGH/Owner action, preserves original failure unchanged and separately audits `source_event`, `delivered_event` and `stale_state_sanitized`. Malformed UUID record references denied before any privileged notification.
- **Genuine test RCAs and fixes:** SQL `String.replace` treated a regex string ending in `$'` as a replacement token and spliced the source file tail, causing CI syntax RED (runs 38068722555, 38068766516). Rebuilt full source from independently verified GREEN `3a0bca06...` with callback-safe replacements, verified exactly ONE migration begin/commit, retry function and complete UUID regex (`9b1280a8`). The two-session concurrency fixture's old `ad_hidden` event was *now correctly classified stale* for an approved campaign, so test expected a false hidden notice; corrected test fixture event to `ad_approved` matching actual source state (`7342dbc2`). No test skipped or assertion loosened.
- **Evidence:** Candidate Actions **38068932569** completed **14/14 jobs GREEN** on SHA **7342dbc2cb753f39b73e308475c778c2e4c545fb**, including real B3 source test and two-session retry race. Protected Phase3+4 Actions **38068932596** started on the same SHA; verify its final result independently. All code remains DRAFT PR #5, no Supabase LIVE migration, no external WhatsApp/PUSH/EMAIL delivery.
- **Open gates:** Supabase actual B3/RLS/AAL2 E5, full ADS-054–056 security/notification incident matrix, live-like integration, official MP55/tehsil, actual Android E3, provider proof, verified advertising click/view abuse controls and Founder release signoff. P4-T041 **NOT Final PASS**.


## B7 / ADS-046,052,056,060 — creative versions, hostile links and final ZIP lock (10 Oct 2026)
**Canonical results unchanged:** P4-T034..T041 remain IN PROGRESS or external NOT RUN; P4-T042 now has SOURCE/E1 engineering preflight, but **no Android E3 or final E7**. There are **0/9 complete PASS+LOCK**; no Production B7 migration, no final ZIP or B8.

- **Exact FIRST DIVERGENCE:** Existing Owner/AAL2 `jb_ad_save_creative_internal` and `jb_ad_approve_creative_internal` call `update ad_creatives set approved=false` before selecting the new approved version. The new B7 retention guard formerly raised `B7_APPROVED_CREATIVE_VERSION_IMMUTABLE` on ANY update of approved=true, so future valid Owner creative version changes would break at deployment. Fixed in REVIEW-ONLY `db/20261010_b7_retention_audit_REVIEW_ONLY.sql`: original creative payload remains immutable forever via sticky `ad_creatives.approved_once`, including after revocation; Owner/AAL2 alone may toggle `approved` true/false while payload/id/version/time stay constant. Existing `ad_history` approval events backfill old approved versions; new drafts remain editable. No parallel creative table and no Production change.
- **Disposable PostgreSQL E2:** `ci/phase4/b7-retention-regression.sql` tests revoked approved v1 still immutable, no Owner/AAL1 bypass, replacement draft v2 edited then approved under Owner, exactly one currently approved, original v1 cannot be rewritten/deleted/sticky flag reset. Protected Phase3 T123 requires sticky column and exact guarded trigger signature when review migration installed.
- **RCA regression:** Expanding shared `b7-payment-fixture.sql` broke existing weighted fixture due duplicate `media_url` column (Candidate RED). Restored shared fixture byte-for-byte from last GREEN; added missing current-schema columns only in isolated `b7-retention-fixture.sql`. This preserves all old weighted, ads/portal/payment tests. Previous Candidate 38070006423 and protected 38070006421 both GREEN on `41f8bf9584bb37f7d77ef48b028e47486f5de94b`; newer commits require exact-HEAD CI.
- **ADS-056 risky public destination:** `public-ads.js` HTTPS URL validator now rejects malformed credentials, control characters, loopback/IP/IPv6-literal/intranet/localhost and dotless hosts, for both media AND CTA. Staged backend `20261010_b7_cta_click_REVIEW_ONLY.sql` now independently denies client-reported clicks to those same unsafe host classes. Browser `ci/phase4/b7-client-regression.cjs` and PostgreSQL `b7-view-ticket-regression.sql` add positive public HTTPS and negative IP/localhost/.internal examples; user-click/navigation and ordinary News unaffected. Preserved old protected P4-T035 `u.protocol==='https:'` source assertion without weakening checker (fixed initial CI RED).
- **ADS-060 release evidence:** `review/B7_FINAL_ZIP_CLOSURE_MANIFEST.json` contains all **60 exact blueprint checkpoint titles**, nine canonical P4-T034..T042 homes and required evidence types (including external E6 due). All checkpoints explicitly `DUE` for final real proof. New `ci/phase4/b7-closure-gate.cjs` audits completeness and **refuses final ZIP release** if any ADS/test lacks PASS+LOCK, screenshots/real deployed provenance, Founder signature or provider E6. `b7-closure-regression.cjs` tests missing/duplicate ADS, fake PASS, wrong evidence and blocked ZIP. Candidate CI adds an E1 preflight that reports **BLOCKED**, not fake completion.
- **Remaining:** actual secure Media Studio, official MP-55/tehsil LGD, hosted Owner/AAL2+Android device E3/E5, real packages payment/production parity, qualified human/bot risk and full source/migration signed E7. Original E6 online gateway integration intentionally DUE. `B7 Advertisement FINAL ZIP` must be created only when final evidence gate is legitimately satisfied.



## B7 12 OCT 2026 — ADS-010/011/015 + ADS-045/046/047 backend/UI first-divergence checkpoint
- **P4-T035 IN PROGRESS, P4-T039 IN PROGRESS; NOT Final PASS / LOCK.** B7 remains 0/9 Final PASS+LOCK, Final ZIP BLOCKED. This is E1/disposable E2 only.
- Actual LIVE `jb_ad_save_creative_internal` source independently inspected: each Owner SAVE de-approves previous approved creative and INSERTS new creative with `approved=true` (even without separate Preview/Approve). This violates Master Blueprint §5.5, ADS-045/046 and Founder Authority. Reproduced using unchanged LIVE function body in isolated `ci/phase4/b7-creative-legacy-source-fixture.sql` + rollback-only `b7-creative-legacy-divergence.sql` before applying fix. NO production writes.
- Review-only `db/20261012_b7_creative_draft_approval_REVIEW_ONLY.sql` requires existing sticky `approved_once` retention migration and exact old RPC signature, then saves as **pending DRAFT** with new version + append-only history without touching current approved. Only deliberate Owner/AAL2 approval of latest safe text version changes active creative; repeat approval idempotent, stale version denied, high-risk unverified denied. Image/video approval remains **FAIL CLOSED** until independent server-side MIME/magic/dimensions/EXIF+GPS/codec/poster and safe derivative proof. Stage DOES NOT claim true Media Studio PASS.
- Paired Owner frontend `phase4-domain-client.js` checks exact reviewed Owner capability marker before invoking SAVE or APPROVE. Old Production RPC has no capability: an accidental UI-only rollout fails CLOSED, not silent autoapproval. `ads.html` displays separate pending SAVE and confirmed latest draft APPROVE after Founder preview, rather than single blind save+approve.
- Client-only local gallery `ad-media-preview.js` previews JPEG/PNG/WebP/MP4 using magic bytes+MIME+extension, inspected 50MiB cap, `contain` image, muted/not-autoplay MP4 and blob revocation. **NO upload, NO server decode/EXIF stripping, NO approval.** `ci/phase4/b7-media-preview-regression.cjs` covers spoofed files, size, no hidden upload and safe controls. Real Android E3 and worker E2 remain DUE.
- CI new isolated `b7-creative-two-stage-postgres` regression does old-state reproduction + Owner AAL2 draft/approve, version race/stale denial, previous LIVE preservation, false media approval blocked and private IP/media/CTA denial; protected T123 conditional source+Owner guard added. No old tests removed.
- **Independent RCA of intermediate RED:** SQL regex suffix `$'` misinterpreted by unsafe JavaScript replacement expanded review SQL to 91,261 bytes (runs 38108254920 / 38108269142 RED). Cleanly restored from verified original `e377ddef` and applied callback-safe replacements; exactly one BEGIN/COMMIT+each RPC, recovered 9,460 bytes in `3e7b91a7`. Candidate 38108342059 GREEN **16/16** on recovery SHA. All later commits require exact new SHA proof; no previous RED hidden.
- **Critical Storage Policy:** read-only LIVE still has `b5_private_gateway_only` broad permissive anonymous/authenticated ALL for non-grievance objects. `ADS-015/054/056` security incident is OPEN / NOT DEPLOYED. DO NOT use Owner local preview as excuse to publish/upload an ad or claim secure private asset storage. Actual recovery requires Founder production authorization and staging role-negative proof.
- For full B7 the official 55 MP districts+tehsil catalogue, media server worker, controlled paired deployment, Android E3, Owner E5, provider E6 where needed, complete source E7 and 9/9 canonical proof remain due. No B8.


## B7 P4-T041 / ADS-054/056 — independent Storage RLS source correction (review checkpoint)

**Final status: IN PROGRESS, NOT PASS/LOCK.** A previous checkpoint mistakenly described `b5_private_gateway_only` as PERMISSIVE and claimed anonymous access to private-editorial media. Independent **LIVE read-only** verification of `pg_policies.permissive` and `pg_policy.polpermissive` instead established it is **RESTRICTIVE (false)**. Because RESTRICTIVE policies cannot independently grant access, the prior alleged Storage data exposure was **not demonstrated**. The old Candidate test incorrectly built a PERMISSIVE synthetic policy.

Minimum safe fix: `db/20261010_b7_storage_rls_critical_REVIEW_ONLY.sql` no longer drops B5 or adds an anonymous policy; it is a zero-DDL/zero-DML audit with ROLLBACK that verifies exactly the restrictive B5 and Owner/AAL2 policy matrix. The old broad-policy-drop candidate MUST NOT BE DEPLOYED. `ci/phase4/b7-storage-rls-fixture.sql` now mirrors RESTRICTIVE; baseline E2 denies anon SQL SELECT/UPDATE/INSERT. A separate transaction tests the **counterfactual** PERMISSIVE exploit then rolls it back, while the preservation E2 proves Owner/AAL2 editorial read and News image upload/write/delete still work with B5 grievance guard intact. The original critical report is preserved with a prominent correction, not silently deleted. Independent RCA: `review/B7_STORAGE_POLICY_INDEPENDENT_RCA_CORRECTION_20261012.md`.

**Still due:** actual hosted anonymous/AAL1 Storage API deny test, public bucket HTTP delivery, signed URLs, Owner Android upload and B5 Grievance gateway E3/E5; live Production untouched. Final 9/9 B7 tests remain DUE and ZIP BLOCKED. No incident, remediation or PASS is claimed without external evidence.


## B7 ADS-010/015 + ADS-054/056 — independent RLS truth and latest-file-wins media (continuation checkpoint)
- **CANONICAL: P4-T035 and P4-T041 IN PROGRESS; P4-T042 IN PROGRESS.** Final 9/9 P4-T034..042 PASS+LOCK remains **0/9**; Final ZIP BLOCKED.
- Real LIVE read-only source check found `b5_private_gateway_only` **RESTRICTIVE**, `pg_policy.polpermissive=false`. Earlier incident report mistakenly said PERMISSIVE, and its synthetic model was wrong; initial reported anonymous private editorial exploit was **NOT VERIFIED**. Historical report superseded conspicuously, not erased. The dangerous previous proposed `DROP POLICY b5_private_gateway_only` review code has been rewritten to **zero-DDL SQL audit with ROLLBACK**; it MUST NOT be deployed. Existing Owner/AAL2 and B5 grievance restriction remain untouched.
- Isolated PostgreSQL RLS E2 now models RESTRICTIVE policy faithfully, denies anonymous SQL reads/writes and authenticated AAL1 edits, preserves Founder editorial reads/public-media uploads and B5 grievance restriction. A separately ROLLED BACK *counterfactual* PERMISSIVE policy demonstrates precisely why the previous test was a false-positive for LIVE. NEW `ci/phase4/db-b7-storage-policy-source-audit.sql` is included as **read-only** step in existing protected Supabase job, to fail closed if actual live policy classification/Owner grants change. This is source metadata proof, NOT full Storage REST/CDN/Android E3/E5.
- **Actual Android Owner Media Preview race RCA:** slow local file inspection previously could overwrite a newer selected file. `ad-media-preview.js` uses per-container WeakMap generation token; pagehide/load `dispose()` invalidates pending reads; older results return SUPERSEDED without replacing a newer image/video. Current invalid media revokes prior blob instead of leaving a stale/memory-leaking preview, while older invalid reads cannot erase a newer valid thumbnail. `ads.html` records pending previews before await and ignores stale file error. Deterministic `ci/phase4/b7-media-preview-regression.cjs` tests slow/fast ordering, invalid-current vs invalid-stale, blob revocation and cancellation. **LOCAL ONLY**: no upload, approval, EXIF removal or server processing implied.
- Due: actual Supabase credential-level Owner/AAL2/anon Storage API and Android camera/gallery E3/E5, B5 grievance gateway and signed URLs, production-like media validation/CDN/browser behavior, real source and permissions deploy, full ADS-001..060, all 9 canonical tests. No Production database writes.

## B7 private Article+Homepage paid URL authority — safe-host E2 checkpoint
- **Status:** source/STAGING REVIEW ONLY; P4-T035/T037/T040/T041 IN PROGRESS, final B7 **0/9 PASS+LOCK**; ADS-001..060 evidence incomplete; `B7_ADVERTISEMENT.zip` **BLOCKED**.
- **Real first divergence:** the legacy-approved-creative branch in `private.b7_eligible_article_creatives` and the separate Homepage query permitted HTTPS loopback / intranet media and CTA hosts (`127.0.0.1`, `*.local`, `*.internal`), even though the newer Owner draft path and browser safe() reject them. A manipulated or older approved record must not reach either public backend projection. This is **STAGED-CANDIDATE source weakness**, NOT evidence of an actual LIVE incident.
- **Minimum safe candidate code:** in `db/20261010_b7_weighted_private_REVIEW_ONLY.sql`, define ONE immutable, invoker-rights `private.b7_safe_public_ad_https(text)` (never anon-callable). `private.b7_eligible_article_creatives` reuses it for Article media and web/map CTA; `db/20261010_b7_single_public_feed_cutover_REVIEW_ONLY.sql` reuses the same exact helper for Homepage media and web/map CTA. Reject private/loopback names, abbreviated `127.1`, numeric/hex/octal IPv4 forms, fake userinfo, invalid paths and backslash. One existing `jb_ad_public_feed(text,text)` and immutable Article URL remain.
- **Real isolated evidence on code HEAD `774fdd6aaafb7b47dca7916b2fb0815cf89fa307`:** Candidate GitHub CI **38111683892 SUCCESS 16/16 jobs**; Protected Phase3A+3B **38111683896 SUCCESS 2/2 jobs**. `ci/phase4/b7-weighted-regression.sql` tests direct URL guard and legacy approved latest creative rejection; `ci/phase4/b7-single-feed-regression.sql` tests Homepage negative media/CTA and positive text fallback. Source guard also receives conditional Phase3 T123 coverage, plus existing `b7_article_ad_geo_insert_guard` required when B7 geo schema exists.
- **Historical failed fixture RCA:** Candidate **38111575320** RED only in new Homepage synthetic DO block: PL/pgSQL variable `id` shadowed `INSERT RETURNING id`; it did not prove a Production bug. Minimum-safe repair renamed the variable `v_creative_id` and qualified RETURNING. CI `38111683892` re-ran successful 16/16, no prior assertions skipped/weakened. The original failed receipt is preserved, not marked PASS.
- **LIVE read-only baseline:** 5 campaigns, 0 LIVE, 11 creative records, 1 approved; B7 candidate helper/view-ticket functions not deployed; `storage.objects.b5_private_gateway_only` is correctly **RESTRICTIVE**. No Supabase Production DDL/DML, no B5 policy drop, no PR merge.
- **Release hold:** HTTPS DNS preflight is not content decoding, anti-redirect, verified human view, safe image/video derivative, EXIF/GPS removal, H.264/AAC inspection, official MP 55 LGD codes/parent tehsils or real Owner Android evidence. Initial MP 55 district count is independently supported by Government of India IGOD directory; current OGD districts resource says updated 08 Oct 2026, but NO official district/subdistrict CSV plus SHA-256 or Founder-approved import is held here. **Do not import synthetic fixture codes**. No production/staging activation, E3/E5/real paid impression proof, E7 deployed source parity or Founder signoff.

## B7/P4-T040 ADS-048,049,050,056 + G3 Official LGD preflight — real continuation (12 Oct checkpoint)
- EXACT reviewed source head `231d2852a0c1ba4184a0ff26540a63c87c0a2cf8`. Candidate CI **38112503709 SUCCESS 16/16**, protected Phase3A+3B CI **38112503725 SUCCESS 2/2**; no skipped old suite or synthetic result promoted to real FINAL PASS.
- **T040 negative:** old `jb_ad_record_ticket_click` SQL regex could count `https://127.1/` / `0x7f...` / `0177...` alias clicks even though canonical frontend/server URL authority rejected them. Exact reviewer-only RPC now calls the same private `b7_safe_public_ad_https` as article+homepage. Disposable PostgreSQL tests assert zero click ledger entry, ticket not consumed, restored genuine click counts once (21-min pinned Article). T123 conditional regression enforces single-home.
- **G3 geographic intake:** added OFFLINE `b7-lgd-source-preflight.cjs` and synthetic Node regression through existing Candidate Workflow. Structural 55 MP district, subdistrict-parent, CSV shape and SHA256 checks; manifest source origin is unverified user-entered metadata, so even synthetic green returns government authentic **false**, Owner verified **false**, Production import authorized **false**, FINAL DUE. Original official GoI source bytes not acquired; no fake LGD district codes in Production.
- **Due release E2/E3/E5/E7:** actual official MP LGD CSV provenance, real Owner AAL2, real Android E3, confirmed media source/digest/sanitized derivative/verified poster, review-only SQL deployment and public source parity. 0/9 P4-T034..042 PASS+LOCK, `B7_ADVERTISEMENT.zip` BLOCKED.

## B7 T040/G4 URL port boundary (additional verified negative test)
- **Real FIRST DIVERGENCE:** staged shared SQL predicate formerly allowed `:99999` and `:65536` URLs because the regex accepted any five digits, but the browser WHATWG parser rejects them. A callback could therefore be counted for a destination that cannot be opened.
- Minimum safe fix in `db/20261010_b7_weighted_private_REVIEW_ONLY.sql`: after the existing hostname check, normalize extract the optional HTTPS port and enforce integer `BETWEEN 1 AND 65535`; no public ad/RPC signature changed. The same helper is reused by Article, Homepage and ticketed click. Zero-port is conservatively blocked.
- E2 disposable fixtures: direct validator denies `:99999`, `:65536`, `:00000`; accepts syntactically legal `:65535`; a ticket-bound invalid CTA port yields NO paid click in `ad_events`. Conditional protected T123 locks exact range into staged helper security review.
- **Exact source-only CI on `e8310c0cbd632d877fdba040e5c49e11756f930a`:** Candidate **38112739568 SUCCESS 16/16**, Protected **38112739610 SUCCESS 2/2**. No Android E3/live HTTP routing success implied. Final 0/9 B7 PASS+LOCK; ZIP BLOCKED.

## B7 ADS-010/011/015 — real server image parse + pinned WASM scrub E2 (candidate, NOT final P4-T035 PASS)
- `CODEX_CURRENT_SUPABASE/functions/_shared/b7-media-byte-policy.mjs`: non-browser SERVER magic/size/dimension parser, PNG CRC & ancillary validation, palette pixel support; JPEG/PNG/WebP source PREVIEW only; images NEVER auto-approved; SVG/HTML/PDF/MOV/HEIC/MP4 blocked until dedicated video processor proof.
- `b7-image-sanitize.ts`: REAL pinned Magick WASM decodes and re-encodes bounded image, normalizes orientation, strips metadata; strict PNG verifier checks no eXIf/tEXt etc on preview output. SHA-256 source+derivative, still `canApprove:false`.
- Evidence: disposable Node byte tests plus Deno WASM synthetic image and injected `Comment GPS=...` ancillary removal. Exact coding head `9b6ace69080b691a9a26b1d73bac52e337288323`, GitHub Candidate `38113900702` **17/17 SUCCESS**. Protected `38113900690` needs actual completion before claiming PASS.
- Open: private first-party upload, immutable derivative/asset registry, Owner+AAL2, actual Android gallery/camera, MIME spoof real images, video MP4 transcoder/poster, Storage API, official LGD and deployed E7. 0/9 B7 final PASS+LOCK and ZIP BLOCKED. No production edits.

## B7 ADS-009/010/015 OWNER MEDIA HTTP PREVIEW — 11 OCT 2026
- Exact coding SHA 2cc2e04dd21e232ceda53c998b49512f3ae47246. Candidate CI 38114596493: 17/17 SUCCESS. Protected Phase3A/3B 38114596457: 2/2 SUCCESS. Old jobs retained; added real Deno WASM image conversion+HTTP synthetic test.
- New REVIEW-ONLY Owner media HTTP Edge handler: POST Bearer, authenticate BEFORE reading bytes via canonical Auth user endpoint AND original Owner/AAL2 capability RPC; same client token/anon key, no service role. Missing RPC, revoked/nonowner/AAL1, wrong RPC result deny.
- Bounded multipart real body <=8MiB+16KiB and Content-Length equality; exactly ONE file; verified PRIVATE sanitizer output must say canApprove=false/canPublish=false; private PNG output with no-store, no CORS and no URL or creative publication.
- Actual synthetic E2: malformed/multiple files, unverified session, forged short/long Content-Length, oversized streamed bytes, dangerous uploaded format/approval receipt fail closed; genuine synthetic PNG passes through real ImageMagick WASM and metadata-free PNG parser. NO actual Android/Owner E3/E5 proof.
- Live READ-ONLY: 5 campaigns, zero live, 11 creatives; missing staged Owner capability RPC, B5 Storage RESTRICTIVE. No Production SQL/Storage mutation.
- Pending: production-like first-party immutable original+approved derivative+evidence ledger, real Android Owner AAL2, actual photo/video/poster, official LGD import and E7. P4-T034..T042 FINAL 0/9 PASS+LOCK, ZIP BLOCKED.

## B7 ADS-015 two private Storage buckets, immutable SHA receipts and B5 regression (11 Oct 2026)
- Exact coding checkpoint 26e783b2434cdee1e4171bb9fd33be7aaca9e0b0. Candidate CI 38118203598: COMPLETED SUCCESS 17/17 jobs. Protected Phase3A/3B 38118203562: COMPLETED SUCCESS 2/2 jobs. Includes all original tests, independent Server Media and disposable PG tests. The previous RED history is preserved; no skip and no assumed FINAL PASS.
- Server-only QUARANTINE stage b7-private-media-stage.mjs uses original Photo+real WASM decoded clean derivative, SHA256 from actual bytes, SHA read-after-write for TWO distinct private buckets, immutable unique content-addressed source/derivative keys, exact create-only (upsert=false), rejects public/shared B5 buckets, returns canPublish:false and approved:false. The orphan handler is an injected MANDATORY interface; production DURABLE orphan sink is still DUE.
- Actual Magick-WASM synthetic integration staged source and clean derivative in separate simulated private buckets. Supabase SDK adapter checked with injected fake backend: getBucket public=false and >=8MiB limit, never generates public/signed URL. NO real Storage object uploaded.
- REVIEW ONLY db/20261011_b7_media_immutable_evidence_REVIEW_ONLY.sql: private.b7_ad_media_receipts and append-only orphan_events linked to existing canonical ad_creatives + campaign/version, restricted to backend service_role INSERT+SELECT, NO owner/anon/auth direct data; immutable UPDATE/DELETE triggers; MUST NOT interpret digest text itself as proof of real media bytes.
- REVIEW ONLY db/20261011_b7_private_storage_bucket_REVIEW_ONLY.sql: private jb-ad-originals-private + jb-ad-previews-private and additional RESTRICTIVE AND policy for ALL anon/authenticated; DOES NOT alter existing B5 policy. Disposable E2 verifies old Owner editorial/public media still works, grievance remains protected, attempted direct private bucket reads/writes denied even with hypothetical broad permissive grant.
- Actual LIVE independent READ-ONLY: 5 ad campaigns, 0 LIVE, 11 creatives. Both planned B7 private buckets absent; receipt ledger absent; original B5 grievance Storage policy RESTRICTIVE. No real Supabase DDL/DML, no media upload, no PR merge, no Vercel exact-source deployed page.
- E3 Android, E5 actual Owner AAL2+revocation, official MP 55 district LGD source/import, real file EXIF/photo poster/video H.264/AAC, AV/polyglot validation, actual durable worker-to-ledger insert and orphan audit/reconciliation, permission-aware UI, E7 deployed-source parity & Founder signoff DUE. P4-T034..T042 0/9 canonical FINAL PASS+LOCK; final ZIP BLOCKED.

## Test evidence: B7 ADS-015 11 OCT 2026 — REVIEW ONLY. Source 8756d39e3353280baaefdc3598cc3a96370db320. Candidate CI 38120325295 SUCCESS 17/17. Protected run 38120325252 verify separately. Added canonical Creative latest-draft + Owner AAL2 recheck AFTER private WASM Storage SHA readback; restricted service_role-only receipt/orphan RPCs to existing private append-only ledger, no other Creative SOT. Verified negative synthetic session-revoke, stale draft, forgery and absent DB migration. New private evidence trigger locks canonical campaign FOR UPDATE to serialize against Creative SAVE/APPROVE. Real E3/E5, original/derivative LIVE buckets, real private worker, video/poster, E7 and Founder final approval DUE. P4-T034..042 0/9 FINAL PASS+LOCK. ZIP BLOCKED. Real CI RED history independently traced: wrong auth test call-count, PL/pgSQL id collision, public.ad_creatives read without fixture service_role grant; fixes did NOT relax privileges.

## B7 ADS-015 11 Oct 2026: actual isolated private WASM image-job bridge (REVIEW ONLY)
- Source coding SHA `30ab79a5a5c65b71ce7a4876b153bdc72fa38f9c`. Candidate CI run **38135952352 SUCCESS 17/17**, includes real Magick WASM generated PNG image -> canonical Owner user+AAL2 capability (synthetic Auth server) -> latest canonical ad_creatives/campaign check -> two private Supabase Storage create-only objects -> digest re-read -> service-role restricted private receipt RPC -> verified quarantine readback. This is real WASM execution with FAKE Auth/Storage/SQL adapters, NOT a Production integration.
- Added `CODEX_CURRENT_SUPABASE/functions/_shared/b7-private-image-job.ts` as **worker module only**, NO `Deno.serve`; frontend Owner Gateway remains separate and has NO service_role. Owner user ID from canonical server Auth + AAL2 RPC, not submitted owner ID. Original & sanitized bytes never exposed to public endpoint. No media approval/feed or public URL.
- Added `ci/phase4/b7-private-image-job.test.ts` with positive end-to-end real WASM, forged OwnerID ignored, Owner revocation after Storage causes durable orphan evidence, public bucket denial and forged receipt readback refusal. Original Project protected Phase3A+3B run 38135952365 requires exact completion check; no claim while in progress.
- RCA: initial Deno strict TS2345 from `rpc(args:unknown)` incompatible with test implementation requiring `Record<string,unknown>`; adjusted interface without bypass. Then TS18048 because JS coordinator return inferred optional: verified successful receipt explicitly via strict nonundefined assertion. Failed CI logs preserved; final candidate run 38135952352 green (17/17).
- Still DUE: real Owner signed E5, Android E3, original private Production buckets, audited private worker deployment and queue, private SQL migration, sanitized public derivative output, real photos/EXIF and MP4 H.264/AAC poster, E7 production parity and LGD official. B7 P4-T034..T042 0/9 FINAL PASS+LOCK; final ZIP BLOCKED. No PR merge or LIVE SQL/Storage writes.

## B7 ADS-010/011/015: actual sanitized video, responsive images and required poster
- Verified exact source `2677fa47859863a16da1907b1a6a124a3f2651c7`, candidate job run **38141280878 18/18 SUCCESS** (including real FFmpeg and ImageMagick WASM), protected Phase3A/3B **38141280810 2/2 SUCCESS**.

- `CODEX_CURRENT_SUPABASE/functions/_shared/b7-video-sanitize.mjs` in isolated Node worker only: real ffprobe MP4/H264/AAC codec+duration+pixel policy; separate ffmpeg transcoding to H264/AAC with metadata stripped and private PNG poster from decoded frame; no shell, bounded tools/resources, no video/storage publishing. Source photo/video remains private. VIDEO FFmpeg system package in dedicated CI job; VIDEO SOURCE MULTIPART OWNER UPLOAD remains unimplemented.

- `CODEX_CURRENT_SUPABASE/functions/_shared/b7-image-sanitize.ts` produces true 480/800/1200 (where eligible) static clean PNG responsive variants using pinned ImageMagick WASM, no upscaling, no EXIF/GPS, independent SHA256 per rendition. No automatic Storage or public links.

- `JANTA_BOL_PHASE_3C_WORKING/public-ads.js` now requires an HTTPS sanitized poster URL before video ad rendering; video always click-to-play controls, no autoplay, muted, no paid ticket before first actual video data. Existing backend public feed does NOT yet supply poster_url; video intentionally fails closed until paired backend / actual approved poster route. Article stays readable.

- Actual RED->RCA: FFmpeg scaling 720x400 upscaled to 1280x720 under force_original_aspect_ratio=decrease; fix uses min(iw,limit) and min(ih,limit); real codec/PNG tests green. Extra GPS-stamped input test proves output does not retain location/comment metadata. Existing Node and Deno tests preserved.

- NOT READY: actual Founder signed AAL2 / E5, Android E3, dedicated private media upload and durable queue, worker deploy and privileged secret runtime isolation, image renditions/private+approved public objects, immutable video receipt and poster, authoritative media approval/live feed with poster, official G3 LGD import and exact deployed E7. No Production SQL/Storage mutations, no PR merge, no advertiser LIVE. P4-T034..T042 **0/9 Final PASS+LOCK**; `B7_ADVERTISEMENT.zip` BLOCKED.

## 11 OCT 2026 B7 ADS-011/015: VIDEO three-private-bucket quarantine to server SQL evidence — review only
- Source `077012d171a82c61a0011089574fd9b2ff8cce80` (exact-head candidate CI **38142801173 SUCCESS 18/18**, protected Phase 3A+3B **38142801209 SUCCESS 2/2**). GitHub PR #5 remains DRAFT, no merge.
- New isolated `b7-video-private-stage.mjs`, `b7-video-server-adapter.mjs`: ACTUAL ffmpeg H264/AAC MP4 transcoding + actual PNG poster, SHA256 of private source+clean MP4+poster, three CREATE-ONLY PRIVATE Supabase bucket objects with read-back hash verification. Canonical Owner identity and live Creative latest draft revalidated after transcoding/upload; server-only receipt and forensic orphan RPCs. No other authority or public ad URL.
- New review-only private SQL `20261011_b7_video_private_evidence_REVIEW_ONLY.sql`: private immutable receipt and append-only orphan audit, campaign FOR UPDATE to serialize latest creative, explicit video type and pending-only guard, service_role-only RPC grants, browser/anon denial, never silent approval. Tested on disposable PostgreSQL 17 through `ci/phase4/b7-video-evidence-regression.sql`, while existing image/media and B5 remain preserved.
- New review-only storage `20261011_b7_video_storage_buckets_REVIEW_ONLY.sql`: three VIDEO-only private buckets + RESTRICTIVE RLS for anon/authenticated, no shared B5/Editorial/Public media contamination. `ci/phase4/b7-video-buckets-rls-regression.sql` tests simulated broad PERMISSIVE policy still cannot bypass RESTRICTIVE deny.
- Real E2 video test `ci/phase4/b7-video-private-stage.test.mjs` and full server contract `b7-video-server-adapter.test.mjs`: positive FFmpeg and private in-memory Storage/SQL; negative owner revocation, tampered receipt, public bucket, absence of service-side DB RPC. This is actual codec execution with **synthetic Auth, SQL and Storage**; not an uploaded Production asset.
- Independent RCA: CI RED test incorrectly expected generic evidence error when both receipt RPC and mandatory orphan RPC are missing; corrected expectation to *stricter* `B7_VIDEO_STAGE_DURABLE_ORPHAN_AUDIT_REQUIRED`, retained fail-closed; then E2 green.
- Still DUE: real authoritative signed Owner E5, Android E3, official LGD, deployed isolated private worker queue, actual Prod storage/schema migrations, verified first-party public media derivatives and release/approval, poster-aware backend public feed, real photos/videos, E7 deploy parity. No Production SQL/Storage writes, no media LIVE, no merged PR. 0/9 canonical P4-T034..T042 FINAL PASS+LOCK; final ZIP still BLOCKED.

## B7 11 OCT 2026 — Real private 3-object VIDEO quarantine, immutable PG ledger and single Owner verifier

- Engineering source commit `4bc5d6f8b4d524f075b5ae14945105aa5ca1e12d` — EXACT source CI **38143282410 SUCCESS 18/18** (FFmpeg real binary + video private staging + synthetic Storage / SQL + PostgreSQL disposable 17), protected Phase3A+3B **38143282358 SUCCESS 2/2** including Supabase transactional regressions. CI RED (earlier) independently traced to E2 overly weak expected denial: actual missing RPC causes strict DURABLE_ORPHAN_AUDIT_REQUIRED; test corrected without relaxing security.

- Three private-only media stages: original untrusted MP4 `jb-ad-video-originals-private`, freshly re-encoded H264/AAC MP4 `jb-ad-videos-private`, first frame PNG poster `jb-ad-video-posters-private`; all immutable create-only + SHA256 read-after-write; Owner AAL2 verified again after storage; stale source creative rejected; durable orphan audit on partial writes.

- Disposable PostgreSQL source `20261011_b7_video_private_evidence_REVIEW_ONLY.sql`, `ci/phase4/b7-video-evidence-regression.sql`; 3 video object hash/path matched to exact pending canonical ad_creatives ID/version with serialized campaign lock; immutable evidence and forensic orphan audit; service_role restricted executable RPC and no anon / browser access; **Owner media approval remains intentionally denied**.

- Disposable review-only bucket migration `20261011_b7_video_storage_buckets_REVIEW_ONLY.sql`, `ci/phase4/b7-video-buckets-rls-regression.sql`; only new dedicated B7 private video buckets, restrictive deny AND even against hypothetical accidental PERMISSIVE policy; original B5 restrictive, public-media, private-editorial and grievance untouched.

- Canonical Owner Auth+current Owner AAL2 capability is now **shared** between Deno preview and isolated Node media worker in `_shared/b7-owner-identity.mjs`; no parallel role database, no privileged secret in frontend. Extra E2 passes actual after-upload Owner capability revoke -> immutable 3 storage objects quarantined, no receipt, forensic event required.

- Production read-only audit on 11 Oct 2026: 5 campaigns, 0 LIVE, 11 creatives, **0** B7-specific Storage buckets, **0** video evidence server RPCs, B5 restrictive verified. No Production SQL mutation, Storage upload, PR merge or ad activation.

- **FINAL RELEASE GATES DUE**: actual deployed isolated Node media worker + durable queue, real E5 Owner signed AAL2, Android E3 upload/review, approved FIRST-PARTY public video/poster/image derivatives and backend feed poster projection with explicit Founder approval, official LGD, E7 exact deployed source and final 9 test proof. P4-T034..042 **0/9 FINAL PASS+LOCK**, `B7_ADVERTISEMENT.zip` BLOCKED.
