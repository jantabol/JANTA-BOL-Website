# JANTA BOL — PHASE 2 PRE-TEST CHANGELOG

Status: WORKING COPY ONLY. Baseline folder remains untouched.

## Pre-test round — 2026-09-06

- `backend-client.js`
  - Normal `signOut()` changed to current-device/local scope.
  - Added explicit global/all-device logout helper.
  - Owner guard now requires AAL2.
  - Added safe URL validator for public media rendering.
  - Added shadow-clear helper for explicit conflict resolution.
  - Pending/unverified TOTP factors are cleaned before fresh MFA enrollment.
  - Existing recovery MFA delete helper preserved.

- `add-news.html`
  - Manual save / auto-save concurrency guard.
  - Published correction cannot accidentally use Save Draft/unpublish path.
  - New-draft offline shadow recovery improved.
  - Version-mismatch conflict now explicit; stale local copy cannot auto-overwrite newer server state.
  - Local unsynced conflict copy stays visible/copyable until Founder explicitly chooses newer server version.
  - Admin draft preview URL now uses protected `preview=admin` mode.

- `article.html`
  - Added protected Owner+AAL2 Admin preview mode for unpublished drafts.
  - Canonical share URL strips preview-only parameters.
  - Admin preview sharing disabled.
  - Media href/src values restricted to http/https schemes.

- `phase2-client.js`
  - Audit insert field names aligned to actual deployed `audit_logs` schema.

- `analytics.html`, `compliance.html`, `grievances.html`, `live.html`, `reporters.html`, `settings.html`, `social.html`, `ads.html`
  - Auth/bootstrap execution ordering corrected where needed.

- `PRETEST-HARDENING-PENDING.sql`
  - New additive candidate only; NOT production-applied.
  - Contains safe public article column grants, `article_stats` hardening, `jb_is_owner` hardening, and Owner AAL2 RLS/storage enforcement candidate.

## PRETEST-CHG-008 — Admin login QR render hardening
- Files: `admin-login.html`
- Reason: remove direct HTML concatenation for MFA QR setup message.
- Change: QR/message now created with DOM nodes/textContent; no active secret is logged or persisted.
- Security impact: XSS/input-safety hardening for #127.
- Regression: login + initial MFA setup still needs Founder/manual UI verification.

## PRETEST-CHG-009 — Social status moved from local shadow to backend foundation
- Files: `social.html`
- Reason: page was reading/writing legacy `JBData` localStorage instead of Phase-2 `social_distribution` backend table.
- Change: page now uses `JBPhase2.socialRows()` / `JBPhase2.saveSocial()` and DOM-safe rendering.
- Scope: no social auto-post API added; publish remains independent as locked.
- Regression: authenticated UI save/reload remains manual verification.


## PRETEST-CHG-010 — Session/public-access checkpoint reconciliation
- Files: `TEST-REGISTER.md`, `CODE-MAP.md`, `DEBUG-MAP.md`, `PRETEST-HARDENING-PENDING.sql`.
- Live read-only DB audit confirmed the public article column grants are already present while private source columns remain denied; #064-#070 is no longer blocked by the earlier grant absence, but still requires Founder browser verification.
- #102-#104 Security Center/session-panel implementation is present in working code and pending SQL; support status corrected from “implementation pending” to “production migration pending”.
- No production migration or authority change was applied during this reconciliation.

## PRETEST-CHG-011 — Recent MFA AMR ordering hardening
- File: `backend-client.js`.
- Reason: recent-MFA helper used the first matching `amr` entry, which is order-dependent if multiple TOTP/phone records exist.
- Change: select the newest valid MFA timestamp before enforcing the 10-minute recent-MFA window.
- Regression: static syntax check required; manual fresh-MFA sensitive-action verification remains pending.


## PRETEST-CHG-012 — `jb_is_owner` PUBLIC EXECUTE revoke fix
- Files: `PRETEST-HARDENING-PENDING.sql`, `PRETEST-HARDENING-TRANSACTIONAL-TEST.sql`, `DEBUG-MAP.md`.
- Finding: revoking EXECUTE only from `anon` does not neutralize an inherited default `PUBLIC` function grant.
- Change: candidate now revokes all function privileges from `PUBLIC, anon`, then grants execute only to `authenticated`.
- Transactional test now explicitly checks that anon cannot execute `public.jb_is_owner()`.
- Production remains unchanged pending Founder approval.


## PRETEST-CHG-013 — Transactional hardening candidate synchronization
- Files: `PRETEST-HARDENING-TRANSACTIONAL-TEST.sql`, `DEBUG-MAP.md`.
- Finding: rollback test copy lagged behind the current pending candidate in two security-sensitive places.
- Fix: added the current Recovery Key set-RPC recent-MFA/active-session hardening and aligned Owner role-management policy to `current_owner_recent_mfa(600)`.
- Verification: candidate sections in pending and transactional files now match exactly before the commit/assertion boundary.
- Production was not modified.


## PRETEST-CHG-014 — Rollback test de-identification and portability
- File: `PRETEST-HARDENING-TRANSACTIONAL-TEST.sql`.
- Removed dependency on hardcoded Founder/session/article UUIDs in assertions.
- Test now resolves the Owner row dynamically and creates temporary synthetic current/other Auth sessions plus a synthetic article ID inside the transaction.
- Synthetic context is readable by the temporary `authenticated` role during assertions and is removed by rollback.
- This improves repeatability without touching persistent production state unless the rollback script is explicitly run.


## PRETEST-CHG-015 — Public grievance privacy-safe submit fix
- File: `phase2-client.js`.
- Finding: anon plain grievance INSERT is allowed, but `INSERT ... RETURNING` fails under RLS because grievance rows intentionally have no anon SELECT policy.
- Change: `createGrievance()` now generates a browser UUID and performs plain INSERT, then returns that known ID locally.
- Security effect: no public grievance SELECT policy/grant is introduced; complainant/contact/evidence remain non-public.
- Manual public form submission remains required.

## PRETEST-CHG-016 — Anon least-privilege hardening candidate
- Files: `PRETEST-HARDENING-PENDING.sql`, `PRETEST-HARDENING-TRANSACTIONAL-TEST.sql`.
- Live audit found broad anon table-level CRUD grants on multiple Phase-2 tables despite restrictive RLS.
- Candidate revokes anon CRUD from admin/private tables and limits public intake to `analytics_events INSERT` and `grievances INSERT`.
- Rollback-only privilege assertions passed; production privileges remain unchanged pending Founder approval.

## PRETEST-CHG-017 — Rollback evidence expansion
- #119: five intentionally invalid Recovery Key checks triggered the expected cooldown inside a rollback-only transaction; live failure counters were unchanged after rollback.
- #122/session security: synthetic Owner sessions proved active AAL2, newest recent-MFA selection, stale-MFA rejection, selected OTHER-session revoke, and AAL1 rejection.
- #129: synthetic AAL2 physical-check record proved initial due state, safe confirmation, and next due ~6 months; rollback removed test data.
- #096/#097 read access: rollback policy assertion proved AAL1 Owner read blocked and active AAL2 Owner read allowed.
- No test was marked FINAL PASS/LOCK.

## PRETEST-CHG-018 — Support-record evidence reconciliation
- Files: `TEST-REGISTER.md`, `DEBUG-MAP.md`, `CODE-MAP.md`.
- Recorded current live factor count (1 verified TOTP), empty `auth.audit_log_entries`, manual incident-runbook ranges #105-#113/#124-#126, and #129 mapping.
- Recorded browser automation limitation; visual/manual checks remain pending rather than silently assumed.


## PRETEST-CHG-019 — Grievance form DOM-reference hardening
- Files: `grievance-submit.html`, `grievances.html`.
- Public submit form no longer relies on undeclared named-element globals; this avoids the `name`/`window.name` collision and browser-dependent behavior.
- Admin grievance status text is escaped before dynamic HTML rendering.
- Manual public submit + admin intake display verification remains pending.


## PRETEST-CHG-020 — Non-destructive Permanent Delete pre-test
- File: `PRETEST-HARDENING-TRANSACTIONAL-TEST.sql`.
- Removed synthetic article creation + Permanent Delete execution from the automated rollback harness.
- Replacement assertions inspect the candidate RPC authority/guards without deleting an article: anon execute denied, authenticated execute present, recent-MFA guard present, Trash-status guard present.
- Actual irreversible-delete behavior remains Founder/manual verification only.


## PRETEST-CHG-021 — Founder-approved production hardening applied
- Date: 2026-09-06.
- Reviewed source snapshot: `PRETEST-HARDENING-PENDING.sql` (SHA-256 `0d2c24f77ccfb2612d802d0ebf0d05d38f93cdf4ae7893a6c5e8114c3ad3208a`). The source snapshot is intentionally kept unchanged in this checkpoint as the reviewed evidence artifact.
- Production migration: `20260906151124 phase2_pretest_security_hardening_20260906`.
- Applied only the reviewed hardening scope: public article column boundary, anon least privilege, `article_stats` invoker hardening, `jb_is_owner` ACL/invoker hardening, Owner AAL2/active-session/recent-MFA authority, Owner session RPCs, private/admin RLS/storage hardening, and #129 physical-check table/RPCs.
- Immediate post-migration checks confirmed public published rows remain readable, private article source column remains denied, private editorial storage remains invisible to anon, and grievance/analytics intake still INSERTs under rollback.

## PRETEST-CHG-022 — Exact reviewed recent-MFA regex restored
- During immediate live-definition comparison, one apply-payload transcription drift was detected: AMR timestamp regex was live as `^[0-9]+` instead of reviewed `^[0-9]+$`.
- No unrelated change was made. The exact reviewed function body was restored through migration `20260906151203 phase2_recent_mfa_regex_exact_candidate_fix_20260906`.
- Final live-definition assertion confirms `^[0-9]+$`.

## PRETEST-CHG-023 — Post-migration production regression
- Security Advisor: prior `article_stats` Security Definer ERROR removed; prior anon-executable `jb_is_owner` warning removed.
- Remaining Advisor findings are recorded, not hidden: authenticated Security Definer privileged-RPC warnings, intentional RLS/no-policy INFO for direct-access-revoked physical-check table, and leaked-password protection disabled.
- RLS: public schema RLS-off tables = 0; 20 Owner-AAL2 policy references + recent-MFA role-management policy live.
- Public/private: anon published rows visible = 2; anon private-editorial rows visible = 0; anon `source_name` denied; anon private/admin CRUD grants removed.
- Owner authority rollback regression: AAL1 reject, AAL2 allow, fresh MFA accept, stale MFA reject, nonexistent-session reject, Owner session list, synthetic OTHER-session revoke, current-session preserve — PASS.
- No-residue check: Owner sessions 3; session-label rows 0; physical-check rows 0; recovery failed attempts 0; cooldown inactive.
- No remaining test was marked FINAL PASS/LOCK.


## PRETEST-CHG-024 — #121 source-requirement gap made explicit
- Current checkpoint did not contain exact #121 Master test wording.
- Targeted saved-file/personal-context retrieval did not recover the exact requirement.
- `TEST-REGISTER.md` and `CODE-MAP.md` now explicitly mark #121 as source-recovery pending.
- #121 is not guessed, skipped, passed or locked.

## PRETEST-CHG-025 — #121 / SU-T29 exact requirement recovered + MFA privacy hardening
- Exact old-chat requirement recovered: Final Production Phone/Tab MFA Factors must remain PRIVATE; any factor exposed in testing/screenshot/chat cannot be a FINAL PRODUCTION factor.
- Live metadata shows the currently verified TOTP factor was created during the 2026-09-06 pre-test window. It is therefore treated as PRE-TEST/TEST factor for #121 and is not assumed final.
- Current checkpoint secret scan: no hard-coded TOTP seed, `otpauth://` URI, or literal MFA secret found.
- `admin-security.html`: factor IDs are no longer displayed; successful fresh-factor verification now destroys the QR DOM immediately; explicit #121 privacy notice added.
- `admin-login.html`: removed unused read of `enrolled.totp.secret`; QR remains runtime-only for enrollment.
- Saved-file/prior-interaction lookup did not produce direct evidence of an uploaded MFA enrollment QR/seed; absence of evidence is not used to certify the current pre-test factor as final.
- Final PASS/LOCK remains blocked until Founder privately enrolls fresh independent Phone + Tab production factors without screenshot/chat exposure and revokes any test/exposed factor.

## PRETEST-CHG-026 — #123 Auth audit evidence clarified
- Current Supabase documentation rechecked: Auth audit events are automatically captured and may be stored in Postgres and/or external dashboard storage; Postgres audit writes can be disabled without disabling the dashboard/external layer.
- Current `auth.audit_log_entries = 0` is therefore not treated as proof of missing Auth audit logging.
- Project organization is on Supabase Free plan; Platform Audit Logs are a separate Team/Enterprise feature and do not replace project Auth Audit Logs.
- Connector access cannot read the Auth Dashboard audit layer. No deliberate failed-login attempt was generated against the real Founder account.
- #123 remains manual/provider-proof pending; no FINAL PASS/LOCK.

## PRETEST-CHG-027 — #124/#126 incident-response UI hardening
- `admin-security.html`: selected OTHER-session revoke now best-effort preserves pre-revoke session metadata (target session ID, device label, browser/user-agent, IP, AAL, login/last-active time) into Owner AAL2 security audit activity before deletion.
- Synthetic Owner-AAL2 rollback assertion confirmed the app security-audit INSERT path is allowed by live RLS; test row rolled back.
- Evidence-save failure does not block urgent containment; UI clearly warns Founder if evidence preservation failed.
- Fresh MFA factor generation now requires explicit confirmation that the device is known-clean/trusted and the QR/secret will not be exposed in testing/screenshot/chat.
- These changes support #124 and #126 but do not replace Founder manual incident/root-cause/device-cleanliness drills.



## PRETEST-CHG-028 — #114-#118 Recovery cleanup integration + technical regression closure
- Gap found: `backend-client.js` and the active `jb-recovery-delete-mfa` Edge Function supported recovery factor deletion, but `admin-recovery.html` had no UI/action wired to invoke it after Recovery Key verification.
- Localized fix in `admin-recovery.html`: Limited Recovery now lists verified TOTP factors by friendly label/status only (factor IDs stay internal), allows explicit affected-factor revoke, clears persisted Limited Recovery state after cleanup/cancel, and requires re-verification after reload because the Recovery Key is never persisted.
- Successful cleanup path clears the in-memory Recovery Key, best-effort clears local Auth state, and directs Founder to fresh MFA setup + mandatory Recovery Key replacement.
- Live/provider technical checks: Edge Function ACTIVE, `verify_jwt=true`; recovery credential table stores `recovery_key_hash` only; set-RPC uses recent MFA; verify-RPC remains Owner-only + cooldown path. Current Supabase API reference confirms admin deletion of a verified MFA factor logs out all active sessions.
- No real Founder factor was deleted during PRE-TEST; destructive recovery remains manual.

## PRETEST-CHG-029 — Final assistant-side PRE-TEST consolidation
- Re-ran Security Advisor, RLS/grant/public-private/storage checks, source secret scan, local-reference scan and JavaScript syntax checks on the consolidated build.
- Reviewed hardening SQL snapshot SHA-256 remains `0d2c24f77ccfb2612d802d0ebf0d05d38f93cdf4ae7893a6c5e8114c3ad3208a`; no new production migration was applied in this consolidation round.
- Remaining items are explicitly Founder/device/provider/manual only: device tests, destructive recovery/permanent-delete drill, Auth Dashboard evidence, leaked-password platform toggle, #108 provider decision, final private Phone+Tab MFA enrollment, and #129 physical inspection.
- No test was auto-promoted to FINAL PASS/LOCK.

## MANUAL-PRETEST-CHG-001 — S4 manual-test bug batch (#023→#028)
- Date: 2026-09-07.
- Founder manual S4 flow completed with independent results for #023→#028.
- BUG-01 (`add-news.html`): DOM `input/change` listeners passed the Event object into `scheduleAutosave(delay)`. `setTimeout` coerced that Event to `0`, causing near-immediate server saves and rapid article version increments. Fixed with wrapper callbacks so the intended default debounce is used.
- BUG-02 (`admin-auth.js`, diagnostic copy in `admin-login.html`): active work twice landed on Login while the existing session remained usable on back/refresh. Shared guard now retries short-lived session/role/AAL reads; persistent no-session/AAL2 absence still redirects securely, while provider/transient errors fail closed on a retry screen instead of falsely implying logout. Activity tracking also includes input/change/click/focus activity.
- BUG-03/04 (`backend-client.js`): blank media strings were fed to `new URL('', currentPage)`, which resolved to the current article URL and made blank cover/video fields render as phantom media. `safeUrl()` now returns blank immediately for blank input.
- Production DB/schema/RLS was not changed by this bug batch.
- Founder manual regression remains required before affected behavior is re-locked.

## REGRESSION-CHG-001 — Trusted AAL2 inactivity local-device unlock
- Date: 2026-09-09.
- Connected regression after core/shared auth patch exposed BUG-05 and BUG-06.
- BUG-05: 15-minute inactivity routed the Founder to the full Login UI instead of a local biometric/device-credential lock.
- BUG-06: the valid existing AAL2 session was then forced through Password + TOTP again for routine inactivity unlock.
- Localized fix: `admin-login.html?locked=1` now has a distinct local-lock branch. It first verifies that the existing Supabase session is still Owner + AAL2, then uses WebAuthn platform user verification for biometric/secure-device-credential unlock. Successful unlock only refreshes `jbAdminLastActivity`; it does not sign out or re-run TOTP.
- If the session is actually missing or no longer AAL2, the page correctly falls back to fresh secure login/AAL2.
- No production DB/schema/RLS change. Android/SPCK biometric + device PIN/pattern behavior remains Founder manual evidence; no #017/#099/#100 FINAL PASS/LOCK is claimed by code alone.


## FLOW-G-CHG-001 — recovered-local autosave recovery hardening
- Date: 2026-09-09.
- Manual Flow G testing showed one article reopening as `RECOVERED OFFLINE CORRECTION • NOT SYNCED` while the device was online.
- Root cause was not failed shadow cleanup: `backend-client.js` already clears `SHADOW` after successful `saveDraft()` / `publish()`. Live DB still held Version 2 / title `FLOW G TEST 029-037 EDIT`, while the browser shadow contained the later local `FIXCHECK` edit, proving it was a genuine unsynced local correction.
- `add-news.html` used a 300000 ms (5-minute) default autosave debounce, and `init()` did not automatically queue sync when an equal-version local shadow was recovered while already online.
- Localized fix: default autosave debounce reduced to 10000 ms; recovered local draft/correction now queues a 1-second safe autosave when online; warning wording changed from `OFFLINE` to `LOCAL` so online pending edits are described accurately.
- Existing backend shadow clearing remains authoritative; no duplicate frontend `clearShadow()` was added. No DB/RLS/schema change.
- #037 remains NOT STARTED until a clean synced baseline is re-established.
- Verification Trail Note was separately confirmed in live `verification_history`; blank input on reopen is expected because the field represents a new trail entry, not the last-history display.

## 2026-09-10 — FLOW-H-038 offline reload recovery fix
- #037 Founder manual test remained PASS; historical result not rewritten.
- #038 reproduced failure: existing synced draft was edited offline, shadow was preserved, but an offline page reload attempted the server request before matching-shadow recovery. The edit form therefore stayed uninitialized/blank after fetch failure.
- Connected risk fixed: `scheduleAutosave()` now refuses to save an existing article while `editId` exists but `editing` has not initialized, preventing a blank form from replacing the previously preserved local correction after connectivity changes.
- `init()` now checks a matching existing-article shadow before a network-dependent fetch when offline, and falls back to the matching shadow if the server/API request fails.
- No schema/RLS/backend-client change. #038 requires Founder manual retest before PASS/LOCK.

## PHASE4-B3-CHG-001 — Unified Notifications coding
- Date: 2026-10-03.
- Preserved the existing Phase-3 `live_notifications` home and realtime semantics; extended it instead of creating a competing engine.
- Added canonical cross-domain notification adapter, consequence-based priority, recipient/revocation checks, privacy guard, dedupe, read/ack/resolved lifecycle, direct action paths, reminders/escalation, delivery history, retention link, external outbox/retry state, and protected configuration.
- Existing Phase-3 Live trigger path now enters the common notification emitter through `private.jb_live_safe_notify`.
- Added low-noise Android notification center UI to existing `live.html` and dashboard entry in `admin.html`.
- Provider delivery is deliberately adapter/outbox-based; no unapproved external provider was invented. Provider-dependent execution remains test/DUE governed.
- Coding completion does not itself mark P4-T043–P4-T050 PASS; RUN-07 evidence/testing is separate.


## PHASE4-B4-CHG-001 — Deep Social Distribution coding
- Date: 2026-10-03.
- Integrated existing `social_distribution` rather than rebuilding it; add-news social controls now persist to the canonical table.
- Replaced frontend/local-only global social authority with backend `social_settings`; protected global mutation requires Owner+AAL2.
- Added newsroom distribution boundary for Owner (existing AAL2 preserved) and active Admin/Editor without adding publish authority.
- Hardened write boundary after architecture review: authenticated clients cannot directly INSERT/UPDATE/DELETE canonical social rows; preference changes use a narrow RPC, while status/provider state is server-controlled. This prevents forged `Posted` success.
- Added independent per-platform attempt/status history, safe failure code, attempt count, audit evidence, retention policy and B3 notification routing for Pending/Failed.
- Added provider-independent manual-share fallback; MANUAL mode cannot be recorded as automated Posted success.
- Social provider failure is isolated from article publication/PURL identity.
- Added low-noise mobile workflow in existing `social.html`; no provider secret/token is stored in browser code.
- Coding completion is not P4-T028–P4-T033 PASS. RUN-05 testing remains separate.
