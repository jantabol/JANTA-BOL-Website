# JANTA BOL — PHASE 2 PRE-TEST CODE MAP

| Test range | Primary files/modules | Backend objects |
|---|---|---|
| #023-#028 Article identity | `backend-client.js`, `add-news.html`, `published.html`, `trash.html`, `article.html` | `public.articles`, lifecycle trigger, PK/slug indexes |
| #029-#037 Create/Draft/Auto-save | `add-news.html`, `backend-client.js`, `drafts.html` | `public.articles`, `article_sources`, `verification_history` |
| #038-#044 Offline/Conflict | `add-news.html`, `backend-client.js` shadow helpers | browser localStorage + article `version` |
| #045-#050 Internal source | `add-news.html`, `backend-client.js`, `article.html` | `article_sources`, `verification_history`, RLS |
| #051-#056 Media | `add-news.html`, `backend-client.js`, `article.html` | Storage `public-media`, article media columns |
| #057-#063 Review/Publish | `add-news.html`, `backend-client.js`, `published.html` | `articles.status`, version trigger |
| #064-#070 Public feed/URL | `website-v3.js`, `index.html`, `article.html`, `backend-client.js` | Published-row RLS + anon public-column grants |
| #071-#081 Share/Lifecycle | `article.html`, `published.html`, `trash.html`, `backend-client.js` | article lifecycle trigger/RLS |
| #082-#092 Regression/final | all frontend/backend files | all Phase-2 objects |
| #093-#097 Owner/AAL2 | `admin-auth.js`, `backend-client.js`, production hardening migration | Auth MFA + live AAL2/session-aware RLS policies |
| #098-#104 Sessions | `admin-login.html`, `admin-auth.js`, `backend-client.js`, `admin-security.html` | Supabase Auth scopes + live `owner_session_labels` / Owner session RPCs |
| #105-#113 Security incident/device drills | `SECURITY-RUNBOOK.md`, `admin-security.html`, `admin-recovery.html`, auth/recovery modules | Manual device/replacement/compromise procedures; #108 provider/SMS decision pending |
| #114-#120 Recovery/MFA | `admin-recovery.html`, `admin-recovery-setup.html`, `admin-login.html`, `backend-client.js` | recovery setup/verify RPCs, active JWT-protected `jb-recovery-delete-mfa` Edge Function, verified-factor cleanup + session invalidation behavior, MFA factors |
| #121 — SU-T29 Final MFA factor privacy | `admin-security.html`, `admin-login.html`, `backend-client.js`, `SECURITY-RUNBOOK.md` | Supabase Auth TOTP factors; final Phone/Tab factor QR/seed must remain private; exposed/test factor cannot be final production |
| #122 Recent-MFA step-up | `backend-client.js`, `admin-security.html`, production hardening migration | live `private.current_owner_recent_mfa(600)` + sensitive Owner RPC/policy gates |
| #123 Security audit evidence | `admin-security.html`, `SECURITY-RUNBOOK.md` | app `audit_logs` + platform Auth audit evidence/manual proof |
| #124-#126 Unknown-session response | `SECURITY-RUNBOOK.md`, `admin-security.html` | session list/revoke candidate + manual known-clean-device investigation |
| #127 Hardening | all public/admin rendering + production hardening migration | Security Advisor, live RLS/Storage policies, anon least-privilege grants |
| #128 Security governance | `SECURITY-GOVERNANCE.md`, `SECURITY-RUNBOOK.md` | quarterly/extraordinary review governance; manual cycle proof pending |
| #129 Recovery Key physical check | `admin-security.html`, `admin.html`, production hardening migration | live `owner_recovery_physical_checks`, status/confirm RPCs |

## 2026-09-07 S4 MANUAL BUG-FIX MAP
- BUG-01 / Auto-Save version storm → `add-news.html` → `scheduleAutosave()` input/change binding → affects #034/#035/#036 regression and observed S4 test workflow.
- BUG-02 / false Login redirect → `admin-auth.js` shared guard + `admin-login.html` diagnostics → affects #013/#017/#018/#019/#095/#098 regression.
- BUG-03 + BUG-04 / blank media phantom render → `backend-client.js` `safeUrl()` → affects #055/#056 and public-article regression.
- No new test number created: these are defects discovered while executing existing tests and must be closed by same-test/regression evidence.

## Connected local-lock regression patch — 2026-09-09
| Tests / behavior | File | Mapping |
|---|---|---|
| #017, #018, #098, #099, #100 connected inactivity/trusted-session behavior | `admin-login.html` locked branch + existing `admin-auth.js` timer | Existing Owner+AAL2 session preserved; 15-min lock uses platform device verification; actual missing/AAL1 session uses fresh secure login. |


## Flow G recovery mapping — 2026-09-09
- #029-#037 / recovered local correction → `add-news.html` → `scheduleAutosave()` + `init()` recovery branch.
- Shadow persistence/clear authority → `backend-client.js` → `saveShadow()`, `clearShadow()`, successful `saveDraft()` / `publish()` cleanup.
- Verification Trail Note retention → `backend-client.js` → `saveSource()` → `public.verification_history`; the edit input is a new event-note field and is not a current article property.

## FLOW-H-038 offline reload recovery — 2026-09-10
- `add-news.html` → `scheduleAutosave()`:
  - guard `editId && !editing` blocks blank/uninitialized existing-article shadow writes.
- `add-news.html` → `init()`:
  - matching existing-article local shadow is recovered before server fetch when offline;
  - matching shadow is fallback recovery when server/API fetch fails;
  - normal online same-version recovery and version-conflict paths remain intact.

## PHASE 4 B3 — Unified Notifications (2026-10-03)
- Protected home preserved: `public.live_notifications` + Phase-3 Live triggers/realtime client.
- Existing `private.jb_live_safe_notify` now adapts Live events into `jb_notification_emit_internal`; no parallel notification engine.
- Common domain adapter: `jb_notification_emit_domain_internal` for grievance/compliance/social/ads/security/team/system integrations as those domain blocks become active.
- Lifecycle: UNREAD / READ / ACTION_REQUIRED / RESOLVED + acknowledgement, direct action path, due/reminder/escalation and dedupe.
- Delivery: in-app authority + `notification_delivery_history` + `notification_delivery_outbox` external retry state. External failure cannot mutate domain truth.
- Security/privacy: authorized active-recipient check, safe-content guard, owner-only protected config, RLS/no direct authenticated access to internal history/config/outbox.
- Retention: notification history links to Topic-8 `record_retention_policies/state`; notification delivery history remains distinct from `audit_logs`.
- Android UI: `live.html#notifications` unified inbox with state/domain filters, action-first/priority grouping, read/ack/open/resolve controls; `admin.html` exposes Notifications entry.
- Client/API: `phase3a-live-client.js`, `jb-live-api` preserve existing notification list/read/realtime behavior and add lifecycle/config support.


## PHASE 4 B4 — Social Distribution (2026-10-03)
- Canonical home preserved: `public.social_distribution`; no second article/publishing engine.
- Global backend setting: `public.social_settings` + Owner/AAL2 mutation RPC.
- Attempt/status evidence: `public.social_distribution_history`; independent platform states remain Posted/Pending/Failed/Manual Share/Not Selected.
- Authority: `private.jb_social_allowed()` permits active newsroom Owner/Admin/Editor distribution without granting article-publish authority; Reporter/anon are excluded.
- Failure isolation: provider state/history never changes Article ID/PURL or article published state; MANUAL mode rejects fake Posted success.
- Shared engines: social state changes use existing `audit_logs`; Failed/Pending history routes into B3 notification domain adapter; Topic-8 retention policy `social_history_v1`.
- Frontend: `add-news.html` persists its social controls to canonical social_distribution after article save/publish; `social.html` reads backend global setting, displays independent states and provides manual-share fallback.
- Client: `phase2-client.js` social settings/save/attempt/history RPC adapters; authenticated direct INSERT/UPDATE/DELETE on `social_distribution` is revoked and preference writes use `jb_social_save_preferences_internal`, preventing client-forged Posted/provider state.
- Provider credentials are not stored/exposed in frontend; real API/provider execution remains dependency-gated for testing.
