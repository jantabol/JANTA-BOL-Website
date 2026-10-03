# JANTA BOL — PHASE 2 PRE-TEST REGISTER

IMPORTANT: This is PRE-CHECK status only. It does not grant FINAL PASS/LOCK to remaining tests.

## Protected existing status
- 20 tests: previously Founder-verified PASS + LOCKED (preserve; regression required if affected).
- #017, #018: DUE/DEFERRED.
- #099, #100: preserve as manual Phone+Tab device verification bucket per current handover.

## Current pre-check evidence

| Tests | Pre-test status | Evidence/Note |
|---|---|---|
| #023-#028 | ✅ PRE-CHECK SUCCESSFUL | Temporary lifecycle drill preserved one UUID Article ID through create/edit/publish/unpublish/republish/delete/restore; DB PK/UUID identity confirmed. No final PASS. |
| #029-#033 | ✅ CODE/BACKEND PRE-CHECK SUCCESSFUL | Create/draft/reload/edit paths mapped; lifecycle backend works. Founder UI verification still required. |
| #034-#037 | 🔧 BUGS FIXED / MANUAL RETEST REQUIRED | Save race/false-state risks reduced; authenticated browser final verification required. |
| #038-#044 | 🔧 BUG FIXED / MANUAL RETEST REQUIRED | Explicit conflict protection added; stale overwrite blocked; local shadow preserved. Offline/online device test still required. |
| #045-#050 | ✅ STATIC/DB PRE-CHECK PARTIAL | Source table private; source save/history path present. Full UI round still required. |
| #051-#056 | ✅ STATIC/DB PRE-CHECK PARTIAL | Storage bucket limits/policies present; public media render URL hardening added. Real upload test required. |
| #057-#063 | ✅ STATIC/DB PRE-CHECK PARTIAL | Publish path awaits backend before success; DB lifecycle drill confirmed status transitions. UI final review test required. |
| #064-#070 | ✅ LIVE DB ACCESS PRE-CHECK / MANUAL RETEST REQUIRED | Live read-only audit confirms anon has only the expected public `articles` SELECT columns, private `source_name` remains ungranted, published-row RLS remains active, and published rows are visible to anon. Public browser/direct-URL Founder verification still required. |
| #071-#081 | ✅ STATIC/DB PRE-CHECK PARTIAL | Share/canonical URL/lifecycle paths mapped; lifecycle drill successful. Native share/device verification required. |
| #093-#095 | ✅/PARTIAL PRE-CHECK | Owner/AAL2 frontend guard present. Live read-only count confirms 1 verified TOTP factor and 0 unverified factors; #094 independent second verified factor is still not established and remains Founder/device setup + manual verification. |
| #096-#097 | ✅ LIVE RLS TECHNICAL PRE-CHECK SUCCESSFUL / FOUNDER MANUAL PENDING | Founder-approved hardening is live. Post-migration synthetic regression proved Owner AAL1 DB authority blocked and active-session AAL2 authority allowed. No FINAL PASS/LOCK; Founder UI/manual verification remains. |
| #098 | ✅ STATIC PRE-CHECK | Existing valid AAL2 session guard does not force fresh TOTP on each page. |
| #099-#100 | 📱 MANUAL DEVICE VERIFICATION REQUIRED | Deferred Phone+Tab local biometric/device credential behavior. |
| #101 | 🔧 FIXED / MANUAL RETEST REQUIRED | Normal logout now uses local/current-device scope. |
| #102-#104 | ✅ LIVE DB TECHNICAL PRE-CHECK SUCCESSFUL / FOUNDER UI+DEVICE PENDING | `owner_session_labels` + session list/revoke RPC authority is live. Post-migration rollback regression proved active AAL2 session list, selected synthetic OTHER-session revoke, current-session preservation, stale-MFA rejection, and AAL1/nonexistent-session rejection. No FINAL PASS/LOCK. |
| #105-#113 | 📱 MANUAL INCIDENT/DEVICE RUNBOOK REQUIRED | Exact incident/replacement/compromise drills are documented in `SECURITY-RUNBOOK.md`. #108 SMS temporary bridge has no approved implementation and needs Founder/provider decision. These are not auto-PASSed by code. |
| #114-#118 | ✅ TECHNICAL RECOVERY REGRESSION SUCCESSFUL / FOUNDER DESTRUCTIVE RECOVERY DRILL PENDING | Recovery setup/verify RPCs remain live; Recovery Key is stored only as bcrypt hash in private schema; cooldown remains active; `jb-recovery-delete-mfa` Edge Function is ACTIVE with JWT verification. Missing frontend recovery-cleanup wiring was found and fixed: Limited Recovery now lists verified TOTP factors without exposing factor IDs and can invoke the existing recovery factor-delete path. Supabase current API reference confirms admin deletion of a verified factor logs the user out of all active sessions. Real factor deletion, fresh MFA rebuild, and old Recovery Key replacement remain Founder/manual because they are destructive/security-sensitive. No FINAL PASS/LOCK. |
| #119 | ✅ ROLLBACK TECHNICAL PRE-CHECK SUCCESSFUL / MANUAL RETEST REQUIRED | Five intentionally invalid recovery attempts inside one rollback-only transaction triggered the expected ~15-minute cooldown; post-ROLLBACK live state rechecked at `failed_attempts=0`, `locked_until=NULL`. No real Recovery Key was read or entered. Founder emergency/UI flow remains manual; no final PASS. |
| #120 | 🔧 BUG FIXED / MANUAL RETEST REQUIRED | Stale pending MFA cleanup added before fresh enrollment. |
| #121 — SU-T29 | 🔧 PRIVACY HARDENING TECHNICAL PRE-CHECK SUCCESSFUL / FOUNDER FINAL FACTOR SETUP PENDING | Exact requirement recovered: Final Production Phone/Tab MFA Factors PRIVATE rahenge; testing/screenshot/chat me exposed factor FINAL PRODUCTION factor nahi hoga. Current ZIP scan found no hard-coded TOTP seed/`otpauth://` URI/secret literal. Current verified TOTP factor was created during the 6 Sep pre-test window, so it is classified as PRE-TEST/TEST factor for #121 and must not be assumed FINAL. Security Center now removes factor IDs from display, destroys enrollment QR DOM after successful verify, and old login code no longer reads unused `totp.secret`. Fresh final Phone + Tab factors must be enrolled privately by Founder after testing and any test/exposed factor revoked. No FINAL PASS/LOCK. |
| #122 | ✅ LIVE BACKEND TECHNICAL PRE-CHECK SUCCESSFUL / FOUNDER MANUAL PENDING | Recent-MFA server helper + sensitive Owner gates are live. Exact reviewed `^[0-9]+$` AMR timestamp validation restored and verified. Post-migration regression accepted fresh MFA, rejected stale (>10 min) MFA, and rejected nonexistent-session AAL2 authority. |
| #123 | ⚠ PRE-CHECK PARTIAL / AUTH DASHBOARD MANUAL PROOF REQUIRED | App security audit UI exists. `auth.audit_log_entries = 0`, but current Supabase docs confirm Auth audit logs can remain in external/dashboard storage even when Postgres audit writes are disabled; therefore zero DB rows are not treated as PASS or FAIL. Project is on Supabase Free plan; Platform Audit Logs are a separate Team/Enterprise feature and are not a substitute for Auth Audit Logs. No deliberate failed-login attack was run against the real Founder account. Founder must verify the relevant Auth login/MFA/failed-login evidence in Supabase Dashboard before FINAL PASS/LOCK. |
| #124-#126 | 🔧 INCIDENT-SUPPORT HARDENED / 📱 FOUNDER MANUAL DRILL REQUIRED | Unknown-session investigation/root-cause/known-clean-device rules remain in `SECURITY-RUNBOOK.md`. Security Center now attempts to preserve selected OTHER-session metadata (session ID, label, browser, IP, AAL, timestamps) in Owner AAL2 audit activity before revoke; synthetic AAL2 rollback assertion confirmed security-audit INSERT authority works. Evidence-save failure does not block containment and is surfaced as a warning. Fresh MFA enrollment now requires explicit known-clean/trusted-device + no-screenshot/chat confirmation. Real incident/root-cause/clean-device drills remain Founder/manual; no FINAL PASS/LOCK. |
| #127 | ✅ MAJOR PRODUCTION DB HARDENING APPLIED + REGRESSION SUCCESSFUL / ⚠ PLATFORM CONFIG + FOUNDER MANUAL PENDING | `article_stats` Security Definer ERROR removed; anon `jb_is_owner` execute warning removed; anon private/admin CRUD grants removed; public article/private-column boundary and grievance/analytics INSERT intake reverified. Security Advisor still shows expected authenticated Security-Definer RPC warnings (guarded Owner/AAL2/recent-MFA paths), intentional no-direct-policy INFO for `owner_recovery_physical_checks`, and leaked-password protection disabled. No FINAL PASS/LOCK. |
| #128 | ✅ IMPLEMENTATION FOUNDATION CREATED / MANUAL GOVERNANCE PROOF PENDING | `SECURITY-GOVERNANCE.md` + `SECURITY-RUNBOOK.md` exist; does not equal final PASS. |
| #129 | ✅ LIVE TECHNICAL PRE-CHECK SUCCESSFUL / FOUNDER PHYSICAL TEST PENDING | Physical-check table + status/confirm RPCs are now live. Post-migration Owner-AAL2 status RPC was exercised in rollback context; direct anon/auth table access remains revoked and no test record persisted. Founder must still physically inspect Primary + Backup copies and confirm the real check; no FINAL PASS/LOCK. |

## Additional technical findings in this checkpoint
- Public grievance intake bug fixed in working code: anon plain INSERT works, but `INSERT ... RETURNING` is blocked by RLS because grievances are not public-readable. `createGrievance()` now generates a client UUID and performs plain INSERT, preserving private grievance rows while still returning an ID to the submitter. Manual public-form submit/reload verification remains required.
- Browser visual automation was unavailable in this environment (`agent-browser` CLI not installed); no visual/browser PASS was claimed.


## Production hardening event — 2026-09-06
- Founder approval received before authority migration.
- Applied migration: `20260906151124 phase2_pretest_security_hardening_20260906`.
- One apply-payload transcription drift was detected immediately in live definition (`^[0-9]+` instead of reviewed `^[0-9]+$`); corrected only to the reviewed exact function definition via `20260906151203 phase2_recent_mfa_regex_exact_candidate_fix_20260906`.
- Final live definition check confirms exact `^[0-9]+$` recent-MFA validation.
- Post-migration regressions: public intake PASS (rollback), AAL1 block/AAL2 allow PASS, stale MFA reject PASS, nonexistent session reject PASS, session list PASS, synthetic OTHER-session revoke/current-session preserve PASS, private storage anon rows=0.
- No synthetic session/label/physical-check/cooldown residue persisted.
- This is technical evidence only; Founder-manual tests remain non-PASS/non-LOCK.


## Assistant-side technical PRE-TEST closure — 2026-09-06
- Current assistant-side code/DB/static PRE-TEST scope has been exhausted without intentionally performing Founder-only/destructive/device actions.
- Final live recheck: public-schema RLS-off tables = 0; anon sensitive/admin table grants = none in checked scope; anon private article source columns denied; public article columns preserved; private editorial bucket remains private and anon-visible private rows = 0.
- Security Advisor rechecked after hardening: no return of the earlier `article_stats` Security Definer ERROR or anon `jb_is_owner` exposure. Remaining findings are documented intentionally: guarded authenticated Security-Definer RPC warnings, no-direct-policy INFO for the RPC-only physical-check table, and leaked-password protection disabled.
- Leaked-password protection is a Supabase Auth platform setting, not a ZIP/SQL bug. It was not silently changed outside the reviewed production-hardening authority. Founder manual platform setting remains required before its related security verification can be closed.
- #108 SMS bridge remains a Founder/provider decision because no SMS MFA provider/bridge was approved. No fake implementation or SKIP was created.
- Browser/device/destructive/manual proof remains outside automatic technical closure. No remaining test is FINAL PASS/LOCK until Founder verifies it.

## FOUNDER MANUAL S4 RUN — 2026-09-07
| Test | Actual Result | Status | Lock |
|---|---|---|---|
| #023 — S4-T1 | New Article A received UUID `b1521710-67a1-499b-97d6-c9b85de3d0a7`. | PASS | 🔒 Founder visually verified |
| #024 — S4-T2 | Article B received distinct UUID `379848c4-8f0e-4a52-ad1f-b6806dec85ec`; no duplicate ID observed. | PASS | 🔒 Founder visually verified |
| #025 — S4-T3 | Article A headline edited; UUID remained `b1521710-67a1-499b-97d6-c9b85de3d0a7`. | PASS | 🔒 Founder visually verified |
| #026 — S4-T4 | Article A published; UUID remained unchanged. | PASS | 🔒 Founder visually verified |
| #027 — S4-T5 | Article A unpublish→draft→republish completed; UUID remained unchanged. | PASS | 🔒 Founder visually verified |
| #028 — S4-T6 | Master URL before/after correction was identical: `article.html?id=b1521710-67a1-499b-97d6-c9b85de3d0a7` under the same local preview origin/path. | PASS | 🔒 Founder visually verified |

### Bugs discovered during S4 manual flow
- BUG-01 Auto-Save version storm — FIXED IN WORKING COPY / MANUAL RETEST REQUIRED.
- BUG-02 unexplained Login redirect during active work — FIXED/HARDENED IN WORKING COPY / MANUAL RETEST REQUIRED.
- BUG-03 blank cover phantom/broken render — FIXED IN WORKING COPY / MANUAL RETEST REQUIRED.
- BUG-04 blank YouTube phantom link — FIXED IN WORKING COPY / MANUAL RETEST REQUIRED.
- S4 identity results above remain independently recorded. A bug fix only reopens a locked test if its behavior is materially affected or regression contradicts the recorded result.

## CONNECTED REGRESSION — 2026-09-09 / trusted inactivity lock
- Historical PASS/LOCK records remain unchanged.
- BUG-05: 15-minute inactivity used full Login UI — FIX IMPLEMENTED / FOUNDER DEVICE RETEST REQUIRED.
- BUG-06: valid AAL2 inactivity unlock repeated Password + TOTP — FIX IMPLEMENTED / FOUNDER DEVICE RETEST REQUIRED.
- Connected tests: #017, #018, #098, #099, #100.
- Required manual proof: SPCK/Android must show local biometric/device-credential unlock without full logout; supported secure PIN/pattern fallback must be manually verified. No FINAL PASS/LOCK from code alone.


## FOUNDER MANUAL FLOW G — #029→#037 (2026-09-09, in progress)
| Test | Actual Result | Current status |
|---|---|---|
| #029 — S5-T1 | Fresh Flow G article created and received permanent UUID. | PASS observed |
| #030 — S5-T2 | Headline/body/category/geography/location/reporter/verification fields reloaded correctly. Verification Trail Note was confirmed retained as a `verification_history` entry; blank new-note input is not data loss. | PASS candidate; record interpretation corrected |
| #031 — S5-T3 | Manual Save Draft confirmed Supabase backend save. | PASS observed |
| #032 — S5-T4 | Saved draft reopened with saved values. | PASS observed |
| #033 — S5-T5 | Existing draft edit worked. | PASS observed |
| #034 — S5-T6 | Auto-save produced server Version 2 during manual test. | PASS observed; recovery timing regression now required after FLOW-G-CHG-001 |
| #035 — S5-T7 | Article UUID remained unchanged across autosave. | PASS observed |
| #036 — S5-T8 | Autosave updated the same draft/version stream; no accidental duplicate draft observed. | PASS observed |
| #037 — S5-T9 | Server-failure / false-success test. | NOT STARTED |

Flow-G recovery note: the later `FIXCHECK` edit was verified as a genuine local unsynced correction because live server data still showed Version 2 / `FLOW G TEST 029-037 EDIT`. This is not recorded as #037 evidence.

## FOUNDER MANUAL FLOW H — #038 (2026-09-10)
| Test | Actual Result | Current status |
|---|---|---|
| #038 | Version 4 existing draft edited offline. Local edit was initially protected (`OFFLINE / NOT SYNCED`), but offline page reload failed to recover the matching article shadow and exposed an uninitialized/blank Add News form. Reconnect did not restore the correction in that run. Root cause localized in `add-news.html` init/autosave recovery ordering; fix prepared. | FAIL observed → FIX PREPARED → FOUNDER RETEST REQUIRED |

Connected rule: #037 remains historical FINAL PASS; after #038 fix, perform a separate #037 regression recheck without rewriting the historical PASS record.

## PHASE 4 — RUN-07 UNIFIED NOTIFICATIONS

| Test | Result | Evidence | Status |
|---|---|---|---|
| P4-T043 — Unified Notification Engine + Existing Live Preservation | Existing Phase-3 Live notification triggers remain installed and route through `private.jb_live_safe_notify` into the single common `jb_notification_emit_internal` / `public.live_notifications` engine. All 144 pre-B3 Live notification rows remain preserved. Protected Phase 3A+3B workflow run #353 completed SUCCESS: static/source regression and Supabase transactional regression both SUCCESS. | E1: GitHub Actions run 353. E5: live notification trigger/row verification. E7: B3 migrations + `jb-live-api` + client/code-map changes. | PASS / LOCKED — 2026-10-03 |


| P4-T044 — Cross-Domain Notification Event Matrix | Transactional fixture verified representative grievance + compliance events use the same `public.live_notifications` / `notification_delivery_history` delivery engine. Re-emitting the same grievance dedupe key kept exactly one unresolved notification (no double-fire). Unsupported/invented domain was rejected. Protected Phase 3A+3B workflow run #355 completed SUCCESS. Later domain blocks remain owners of their real business triggers/state and will call the B3 adapter when implemented. | E2: live DB transactional integration/dedupe/unsupported-domain checks. E5: common delivery-history evidence. Protected regression: GitHub Actions #355 GREEN. | PASS / LOCKED — 2026-10-03 |

| P4-T045 — Priority + Low-Noise + Recipient Routing + Privacy | Transactional tests verified ROUTINE→NORMAL, ATTENTION/action-required→HIGH, CRITICAL→CRITICAL; explicit recipient isolation; routine dedupe prevents repeat noise; sensitive title/message patterns (token/recovery key) rejected; notification config/history/outbox have no direct authenticated/public policy. Protected Phase 3A+3B run #357 completed SUCCESS. | E2: live DB priority/routing/privacy/dedupe/security-negative checks. E5: notification lifecycle/security boundary. Protected regression: GitHub Actions #357 GREEN. | PASS / LOCKED — 2026-10-03 |

| P4-T047 — External Delivery Failure + Retry + In-App Authority | Transactional failure/retry fixture verified external PUSH failure records EXTERNAL_RETRY without changing authoritative ACTION_REQUIRED in-app state; repeated failure increments bounded attempt/history without duplicating domain action; later success transitions to EXTERNAL_SENT; repeated success is idempotent and does not add another attempt/delivery. Protected Phase 3A+3B run #359 completed SUCCESS. No real external provider was invented; provider-specific live delivery remains dependency-gated where applicable. | E1: GitHub Actions #359 GREEN. E2: live DB outbox/retry/idempotency transaction. E5: delivery history + authoritative in-app lifecycle preserved. | PASS / LOCKED — 2026-10-03 |
