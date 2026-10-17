# JANTA BOL — PHASE 2 PRE-TEST DEBUG MAP

Status: WORKING / NOT FINAL LOCK RECORD

| Debug ID | Test area | Finding | Root cause | Current action |
|---|---|---|---|---|
| PRE-001 | #034/#036 Auto-save | Concurrent manual/auto save could race and create duplicate/overlapping saves | No shared busy guard | FIXED in working `add-news.html`; manual/auto save serialized |
| PRE-002 | #075 Published correction | Save Draft path could turn a published correction into draft/unpublish | Draft button remained usable on published edit | FIXED; Draft button hidden/blocked for published correction |
| PRE-003 | #038-#044 Offline/conflict | Stale local shadow could be silently ignored on version mismatch | Init only restored shadow when versions matched, otherwise loaded server with no conflict UI | FIXED; conflict is explicit, stale overwrite blocked, local copy preserved and inspectable |
| PRE-004 | #059 Preview | Draft/Admin preview opened public article page which intentionally hid non-published rows | No authenticated preview mode | FIXED; `preview=admin` requires Owner+AAL2 and can render draft safely |
| PRE-005 | #064/#069 Public feed/direct URL | Earlier anon SELECT blocker is no longer present in live DB | Live re-audit shows expected column-level anon grants + published-row RLS; private `source_name` remains denied | LIVE DB PRE-CHECK SUCCESSFUL; public browser/direct-URL Founder regression still required |
| PRE-006 | #070/#127 Private-data security | Granting full `articles` SELECT would risk legacy `source_name/source_url` exposure | Public/private fields coexist in same table | FIX uses column-level anon grants only; source columns remain ungranted |
| PRE-007 | #127 Analytics | `article_stats` was SECURITY DEFINER and anon-readable | View owner privileges + broad grant | FIX APPLIED: `security_invoker=true`, anon access revoked; post-migration Advisor ERROR removed |
| PRE-008 | #096/#097 AAL2 backend | Owner AAL1 token could perform direct DB article authority | RLS checked role but not JWT `aal`/active session | FIX APPLIED; post-migration synthetic regression proved AAL1 reject / active AAL2 allow |
| PRE-009 | #120 MFA pending conflict | Repeated setup could create multiple pending TOTP enrollments | Enrollment did not clean stale unverified factors | FIXED in working `backend-client.js`; stale pending TOTP cleaned before fresh enroll |
| PRE-010 | Admin support pages | Some pages executed data code before auth/bootstrap completion | Script ordering/race | FIXED on affected working pages; wait for `jb-auth-ready` |
| PRE-011 | #071-#074 Share | Preview URL could be shared with `preview=admin` parameter | `shareUrl()` used raw `location.href` | FIXED; canonical public article URL is constructed from Article ID; admin preview sharing disabled |
| PRE-012 | #055/#127 Media links | User-supplied media URL could use unsafe scheme in rendered href/src | HTML escaping does not validate URL schemes | FIXED; only http/https media links are rendered |

| PRE-013 | #102-#104 Sessions | Test Register had stale implementation status | Support-record drift after Security Center work | RECORD CORRECTED; session table/RPCs are now production-live; Founder UI/device final verification still pending |
| PRE-014 | #122/#127 Recent MFA | Client recent-MFA helper selected the first matching MFA AMR entry instead of the newest one | `Array.find()` is order-dependent when multiple MFA entries exist | FIXED in working `backend-client.js`; newest valid TOTP/phone timestamp is selected, matching server-side intent |
| PRE-015 | #127 Security Advisor | Authenticated Security Definer RPC warnings remain | Privileged RPC wrappers intentionally cross into private Auth/recovery/session tables | REVIEWED POST-MIGRATION: set/revoke/permanent-delete use recent-MFA; list/physical use Owner AAL2; verify recovery remains Owner-only emergency AAL1 + cooldown. Generic warnings remain documented, not silently suppressed. |

| PRE-016 | #127 `jb_is_owner` EXECUTE ACL | Candidate revoked EXECUTE from `anon` but not from default `PUBLIC`, so anon could still inherit function execute | Postgres functions grant EXECUTE to `PUBLIC` by default | FIXED in both hardening SQL files: revoke from `PUBLIC, anon`; rollback test now asserts anon execute=false |

| PRE-017 | Hardening test evidence | Rollback transactional SQL had drifted behind the pending candidate: recovery-key set recent-MFA hardening missing and role-management policy still AAL2-only | Candidate evolved after the test copy was created | FIXED: transactional candidate block synchronized exactly with pending candidate; no production execution performed |

| PRE-018 | Rollback pre-test portability | Transactional assertions embedded old live Owner/session IDs and depended on those sessions remaining active | Test evidence was tied to one momentary production state | FIXED: rollback-only temp context now resolves current Owner dynamically and creates synthetic sessions/article ID; no personal/live session IDs required |

## PRETEST-BUG-008 — MFA QR message used direct `innerHTML` concatenation
- Area: #127 XSS/Input Safety
- File: `admin-login.html`
- Risk: QR value was inserted into HTML string; source is Auth-generated, but DOM construction is safer and removes an avoidable injection sink.
- Fix: DOM `img` + `textContent` nodes.
- Status: 🔧 FIXED — static syntax pre-check successful; manual MFA-setup regression pending.

## PRETEST-BUG-009 — Social Distribution page used legacy local-only data
- Area: Phase-2 backend continuity / no hidden second source-of-truth
- File: `social.html`
- Root cause: legacy `JBData` localStorage path remained active despite `social_distribution` backend table/client functions existing.
- Fix: backend `JBPhase2.socialRows/saveSocial` path + DOM-safe render.
- Status: 🔧 FIXED — static pre-check successful; authenticated save/reload manual verification pending.

| PRE-019 | Public grievance intake | Public form used `.insert(...).select('*').single()`; anon INSERT succeeds but INSERT+RETURNING fails because grievance rows have no anon SELECT policy | Frontend requested returned row from a deliberately non-public table | FIXED in working `phase2-client.js`: generate client UUID + plain INSERT; no anon grievance SELECT grant added. Manual public form submission still required. |
| PRE-020 | #127 Least privilege | Several Phase-2 admin/private tables had broad anon table-level CRUD grants | Broad Data API/table grants exceeded actual public use | FIX APPLIED: private/admin anon CRUD removed; only grievance/analytics public intake INSERT retained; post-migration rollback intake PASS |
| PRE-021 | Browser regression evidence | Local static server could start, but `agent-browser` CLI is not installed in this execution environment | Browser automation runtime unavailable | NOT CLAIMED AS PASS; syntax/static checks continue and Founder/manual browser verification remains required. |
| PRE-022 | #119 Recovery cooldown | Dedicated wrong-attempt cooldown drill was previously unverified | No isolated rollback evidence | ROLLBACK TECHNICAL PRE-CHECK SUCCESSFUL: 5 invalid attempts triggered ~15-minute cooldown; live counters rechecked clean after rollback. No real key used. |
| PRE-023 | #094 Independent MFA factor | Current live factor state has only one verified TOTP factor | Second independent verified factor has not been enrolled | BLOCKED/MANUAL: Founder/device setup required; no factor auto-created. |
| PRE-024 | #123 Auth audit proof | `auth.audit_log_entries` currently contains zero rows | Platform audit proof is absent in project Postgres audit table | PARTIAL: do not manufacture failed logins against real Founder account; manual/provider-level proof remains pending. |

| PRE-025 | Public grievance form | `id="name"` was read through undeclared global `name`, which can collide with built-in `window.name`; other fields also relied on fragile named-element globals | Browser named-property access instead of explicit DOM references | FIXED in `grievance-submit.html`: all form controls use `getElementById`; admin grievance status render also escapes dynamic status text. Manual public form submit still required. |

| PRE-026 | Permanent Delete transactional evidence | Automated rollback script previously executed a synthetic irreversible-delete RPC even though final destructive behavior must be Founder-observed | Test harness was more destructive than necessary | HARDENED: rollback script now verifies RPC existence, anon denial, authenticated grant, recent-MFA guard and Trash-status guard statically; actual Permanent Delete remains Founder/manual. |

| PRE-027 | #121 / SU-T29 MFA factor privacy | Current verified TOTP factor was created during the pre-test window; old Security Center kept verified QR hidden in DOM, displayed partial factor ID, and legacy login read an unused `totp.secret` field | Test/runtime factor hygiene was weaker than the recovered final-production privacy rule | FIXED in working code: verified QR DOM destroyed after success; factor ID removed from UI; unused secret read removed. Current factor remains PRE-TEST/TEST only; fresh private Phone+Tab final factors + test-factor revoke require Founder/manual device setup. |

| PRE-028 | #123 Auth audit evidence | `auth.audit_log_entries` is empty despite recent Auth/MFA activity | Supabase allows Postgres Auth-audit writes to be disabled while dashboard/external Auth audit storage continues; connector cannot read that dashboard layer | CLARIFIED: zero DB rows are not interpreted as missing audit protection. Founder Dashboard Auth Audit Logs proof remains manual; no deliberate failed login against real Founder account. |
| PRE-029 | #124 Unknown-session evidence | Revoking an Auth session deletes the live session row and can remove browser/IP/time context before investigation | Revoke flow did not preserve pre-delete session metadata in the app audit trail | FIXED in working `admin-security.html`: best-effort pre-revoke evidence record to Owner AAL2 `audit_logs`; synthetic AAL2 rollback insert assertion passed; evidence failure is warned but does not block containment/revoke. |
| PRE-030 | #126 Known-clean device rule | Fresh MFA enrollment could be initiated without an explicit clean-device acknowledgement | Runbook rule existed but UI had no guardrail | FIXED in working `admin-security.html`: fresh-factor QR generation requires confirmation that device is known-clean/trusted and QR/secret will not be exposed in screenshot/chat. |


| PRE-031 | #114-#118 Recovery cleanup UI | Existing secure recovery Edge Function existed but no frontend call site invoked `recoveryDeleteMfa()`, leaving Limited Recovery unable to complete affected-factor removal from the UI | Backend capability and frontend recovery page were not integrated | FIXED in `admin-recovery.html`: verified factor list + explicit recovery delete action; factor ID remains internal; Recovery Key remains memory-only; stale Limited Recovery state is cleared on reload; real destructive drill remains Founder/manual. |
| PRE-032 | Recovery credential lifecycle | Recovery flow requires old Recovery Key replacement after fresh MFA; current key is not silently auto-rotated by ZIP code | Replacement is a deliberate post-recovery Founder security step and changing server credential-consumption semantics would be a major authority change | DOCUMENTED/MANUAL: successful cleanup UI explicitly requires fresh MFA + Recovery Key replacement; no unapproved production DB behavior change was made. |
| PRE-033 | #127 Auth leaked-password protection | Security Advisor still reports leaked-password protection disabled | Supabase Auth platform configuration, outside reviewed SQL/ZIP authority | MANUAL PLATFORM CONFIG: recorded with official remediation; not hidden and not changed silently. |

## MANUAL-PRETEST BUG BATCH — 2026-09-07

### BUG-01 — AUTO-SAVE VERSION STORM
- Symptom: a new/editing article jumped through many versions within seconds/minutes.
- Root cause: `addEventListener('input', scheduleAutosave)` / `change` passed a DOM Event as the first `delay` argument; timeout delay became effectively 0ms.
- File/function: `add-news.html` → `scheduleAutosave()` event binding.
- Fix: wrap event callbacks as `()=>scheduleAutosave()` so default debounce is preserved.
- Retest: edit/type normally; confirm no per-keystroke server version storm and later Auto-Save still persists changes.

### BUG-02 — FALSE LOGIN REDIRECT DURING ACTIVE WORK
- Symptom: Founder was sent to Login twice during active work; Android Back + refresh showed the protected session still usable.
- Root cause class: shared auth guard treated a one-shot session/AAL/provider read outcome as an immediate hard redirect; the exact transient provider condition was not visible in the old login UI.
- Files: `admin-auth.js`, `admin-login.html`.
- Fix: short bounded guard retry, fail-closed transient-error screen, explicit session/AAL redirect reason, expanded genuine-activity events. No protected init event is emitted until Owner+AAL2 verification succeeds.
- Retest: repeat publish/unpublish/edit navigation while actively working; no unexplained Login redirect. Real AAL1/no-session must still be blocked.

### BUG-03 — BLANK COVER RENDERS BROKEN IMAGE
- Symptom: no cover configured, but public article rendered a broken Cover image.
- Root cause: `safeUrl('')` resolved blank string relative to the current page URL.
- File: `backend-client.js` → `safeUrl()`.
- Fix: blank/whitespace input returns `''` before URL resolution.

### BUG-04 — BLANK YOUTUBE RENDERS PHANTOM LINK
- Symptom: no YouTube URL configured, but `YouTube: Video kholen` appeared.
- Root cause/fix: same `safeUrl('')` bug/fix as BUG-03.
- Retest for BUG-03/04: published article with blank cover/video must render neither element; real valid URLs must still render.

## BUG-05 — 15-minute inactivity showed full Login UI
- Observed in connected regression on 2026-09-09.
- Root cause: the `locked=1` route reused the normal login UI although the Supabase session could still be valid AAL2.
- Fix: locked route now hides normal email/password/MFA controls while existing Owner+AAL2 is alive and presents only local device-credential setup/unlock.
- Manual Android/SPCK retest required.

## BUG-06 — Routine inactivity unlock repeated Password + TOTP
- Observed: after inactivity, Password was accepted and Authenticator 6-digit code was requested again.
- Root cause: no separate trusted-device local unlock path existed in `admin-login.html`.
- Fix: WebAuthn platform user verification (`userVerification: required`) is used for local unlock; successful local unlock keeps the same server session and only resets the local activity timer. Actual lost/AAL1 session still requires normal 2FA.
- If SPCK Preview/WebView lacks WebAuthn/platform-credential support, the page stays locked and related device tests remain pending/fail rather than fake-PASS.


## FLOW G MANUAL FINDINGS — 2026-09-09

### BUG-07 — RECLASSIFIED / NOT A DATA-LOSS BUG
- Initial symptom: `Verification Trail Note` input was blank after reopening the draft.
- Root cause: the input is an event/trail-entry field. `saveSource()` writes it to `verification_history`; `getArticle()` intentionally does not reload the last historical note into the new-note input.
- Live DB evidence for Flow G article confirms note `Fresh article 29-37` and evidence `Flow G artical G test` were retained in `verification_history`.
- Result: no data-loss fix required. A future history-view UI is a separate UX feature, not #030 save failure.

### BUG-08 — RECOVERED LOCAL CORRECTION STAYS PENDING TOO LONG / MISLEADING OFFLINE LABEL
- Symptom: one online draft showed `RECOVERED OFFLINE CORRECTION • NOT SYNCED`; adding `FIXCHECK` remained local for more than a minute.
- Root cause: default `scheduleAutosave()` debounce was 300000 ms (5 minutes). Every edit immediately saved the local shadow, but server save waited 5 minutes after the latest input. On reopen, `init()` correctly recovered that genuine unsynced shadow, but did not immediately queue sync even though connectivity was available.
- DB confirmation: server remained Version 2 with title `FLOW G TEST 029-037 EDIT`; therefore the later `FIXCHECK` text was genuinely local/unsynced, not a stale shadow left after successful server save.
- Fix: 10-second normal debounce + 1-second online recovery autosave; wording changed to `RECOVERED LOCAL ...` to avoid falsely implying the device is offline. Backend successful-save shadow cleanup remains unchanged.
- Retest required before #037 starts.

## FLOW-H-038 — Existing article offline reload lost recovery context
**Observed:** Version 4 draft → internet OFF → headline offline edit → `OFFLINE / NOT SYNCED` → page reload while offline → blank `Nayi News Add Karein`/fetch failure; reconnect did not restore the offline edit.

**Root cause:** `init()` fetched the server article before checking the matching local shadow. On offline/server fetch failure, `load()` never initialized the existing article. A later online autosave event could call `saveShadow()` from that blank/uninitialized form and replace the preserved correction.

**Localized fix:** Recover matching `editId` shadow before network fetch when offline; use it as fetch-failure fallback; block `scheduleAutosave()` while an existing article is uninitialized (`editId && !editing`).

**Regression scope:** #038 direct retest; #037 connected offline→online sync recheck. Historical #037 PASS remains unchanged.

## PHASE4-B4-SEC-001 — Social status direct-write bypass caught during coding review — 2026-10-03
- Finding: initial B4 extension still allowed authenticated RLS-approved newsroom clients to directly update social_distribution.status, which could bypass the server rule that MANUAL provider mode must never claim automated Posted success.
- Root cause: legacy table-level ALL write path was broader than the new server-controlled attempt lifecycle.
- Minimum safe fix: revoked authenticated INSERT/UPDATE/DELETE on canonical social rows; added narrow jb_social_save_preferences_internal for enabled/platform/caption preferences; status/history/provider outcomes remain server-controlled through attempt RPC. Existing Owner path retains AAL2.
- No test PASS claimed from this fix; B4 RUN-05 remains pending after coding closure.


## PHASE4-B4-CI-001 — Protected function-security CI RED — 2026-10-03
- Evidence: protected Phase-3 run #386 failed only 3A-P3-T123 after B4 introduced new authenticated jb_social_* RPCs; static regression stayed GREEN.
- RCA: Phase-3 function-security inventory intentionally fail-closes every new authenticated jb_* RPC until it is explicitly reviewed. The B4 RPCs were secure/guarded but absent from the inventory allowlist, so the checker correctly rejected the new authority surface.
- Minimum safe fix: extended the existing security inventory (not bypassed/deleted) to explicitly enumerate the B4 social RPCs and added guard assertions: no anon execute; authenticated execute only for reviewed functions; social preference/attempt/history functions must contain jb_social_allowed; global setting must contain current_owner_aal2.
- Exact protected CI rerun required GREEN before B4 coding closure.
