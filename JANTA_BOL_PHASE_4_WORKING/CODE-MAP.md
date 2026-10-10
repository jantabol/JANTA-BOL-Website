## B7 T037 partial checkpoint — 10 Oct 2026 (NOT PASS)

Canonical `codex/b7-reconcile-20261009` package UI commit `fc4e6fa0d16770b3cdbe1f6806bb7ef5f7c1b334` modifies `JANTA_BOL_PHASE_3C_WORKING/ads.html`, `phase4-domain-client.js`, and extends `ci/phase4/b7-client-regression.cjs`. Owner/AAL2 existing package RPC, active-only booking dropdown, price minor/version/weight display and client validation were wired to the existing B7 backend, with no new authority home. Exact GitHub source passed 16 isolated V8 assertions; this is not final Node CI or real E3. Read-only live Supabase audit: 0 packages, 0 package versions, 5 campaigns, 0 LIVE, plus confirmed Owner package RPC and RLS/grants. A proposed weighted public-feed query planned successfully under EXPLAIN and a 4000-draw fixture returned 997/3003 selections (approximately 1:3), but this is NOT actual live rotation proof. REVIEW-ONLY SQL candidate commit `57d5d460d93d7a1393d08de3b3c9d255334638b5` is stored at `JANTA_BOL_PHASE_4_WORKING/review/b7_t037_weighted_feed_REVIEW_ONLY.sql`; NOT deployed or applied. Vercel READY preview target=null for client SHA, not production or Android evidence. Inventory/visibility caps, authenticated package-create/price-snapshot tests, staged weighted rotation, full protected CI, E2+E3+E5 remain due. No Production DB data/permission/DDL change; no B8 changes. **P4-T037 IN PROGRESS — NOT PASS / NOT LOCKED.**

# JANTA BOL — PHASE 4 CODE MAP

STATUS: B0 BASELINE MAP
DATE: 2026-10-01
BRANCH: `phase4-execution-2026-10-01`

## Protected existing homes — preserve first

### Article / publishing identity
Primary files:
- `JANTA_BOL_PHASE_3C_WORKING/backend-client.js`
- `JANTA_BOL_PHASE_3C_WORKING/add-news.html`
- `JANTA_BOL_PHASE_3C_WORKING/article.html`
- `JANTA_BOL_PHASE_3C_WORKING/website-v3.js`

Backend authority:
- `public.articles`
- `public.article_sources`
- `public.article_versions`
- `public.verification_history`

Rule: one Article ID / one Permanent URL identity. Do not create a parallel article authority.

### Auth / Founder authority / sessions
Primary files:
- `JANTA_BOL_PHASE_3C_WORKING/backend-client.js`
- existing Admin security / recovery pages and helpers

Backend authority:
- Supabase Auth
- `public.user_roles`
- existing Owner/AAL2/session/recent-MFA controls
- existing recovery functions/tables

Rule: frontend flags are never authority. Phase-4 modules reuse backend current-state authority.

### Phase-3 Live
Primary code:
- `JANTA_BOL_PHASE_3C_WORKING/phase3a-live-client.js`
- existing Live/Admin/Reporter UI
- `CODEX_CURRENT_SUPABASE/functions/jb-live-*/`
- existing YouTube/encoder functions

Backend authority:
- existing `live_*` objects, provider generations, operations, memberships, final reports and public live feed.

Rule: preserve locked Live identities and recovery architecture. Phase 4 extends around Live; it does not rebuild Live.

### Audit / history
Existing authority:
- `public.audit_logs`
- `public.article_versions`
- `public.verification_history`
- existing Live history/deletion/correction records

Rule: common audit/history is extended; domain-specific history remains in its domain. Notifications/analytics are not substitutes for audit.

### Recovery / failure isolation
Existing authority:
- Phase-3 recovery worker/journal/lease/reconcile paths
- `SECURITY-RUNBOOK.md`
- `SECURITY-GOVERNANCE.md`
- Phase-3 CI recovery suites

Rule: preserve business identities through recovery; no random replacement Article/Live identities.

## Phase-4 domain map

| Block | Domain | Strategy | Main current home / planned integration |
|---|---|---|---|
| B0 | Governance + CI | Preserve + harden | GitHub Actions, Phase-4 records, Phase-3 baseline CI |
| B1 | Team / Authority | Extend | `reporters`, `user_roles`, Auth/session + Live permission boundary |
| B2 | Audit + Retention | Integrate + extend | audit/version/history + common retention machinery |
| B3 | Notifications | Integrate + extend | preserve `live_notifications`; add common domain routing without breaking Live |
| B4 | Social | Preserve + extend | `social_distribution`, `social.html`, `add-news.html`, settings gap |
| B5 | Grievance | Extend | `grievances`, `grievance_evidence`, existing client/UI |
| B6 | Compliance | Extend heavily | `compliance_tasks`, grievance authoritative source |
| B7 | Ads | Add missing backend | current `ads.html` is local-state prototype; canonical backend required |
| B8 | Accountability | Extend + add relations | articles/source/history/audit reused; structured accountability records added |
| B9 | Search + Analytics | Extend | articles remain source; `analytics_events` / `article_stats` preserved |
| B10 | Security closure | Preserve + cross-module harden | Auth/MFA/session/RLS/API/files/functions/logging |
| B11 | Backup + Recovery | Preserve + extend | current Phase-3 recovery + platform-wide backup/restore evidence |
| B12 | Production | Audit + integrate | GitHub Actions, production Supabase, functions, domain/HTTPS/providers |
| B13 | Final Closure | No feature engine | test/evidence/integration/production lock only |

## Known implementation gaps confirmed before coding

1. Social controls exist in Add News, but inspected article save/publish path does not itself prove canonical persistence to `social_distribution`.
2. Global Social setting is local frontend state and needs canonical backend integration.
3. Ads are currently localStorage/prototype level; dedicated production advertiser/campaign/payment backend was not found in the audited schema-name scan.
4. `compliance_tasks` is currently basic and does not yet represent the complete Phase-4 compliance lifecycle.
5. Grievance foundation exists but the full Phase-4 issue/deadline/reopen/withdraw/retention lifecycle is not yet represented.
6. Existing notifications are Live-centered; Phase 4 needs common domain notification capability while preserving Live.
7. Search currently has article/category/district/status indexes and basic public article paths, but dedicated Topic/Tag/Related/Search structures/full-text index were not found in the inspected set.
8. Analytics foundation is Views/Shares; advanced ranges/public-display controls require extension.
9. Accountability must reuse Article/source/version/audit identity; no competing article/accountability publication engine.

## Coding discipline

For every block:
1. Read current live code/DB before editing.
2. Identify exact affected files/objects.
3. Prefer existing module -> adapter/client -> minimum localized edit -> only then new module.
4. Add/adjust RLS/security with the module, not at the end.
5. Run targeted Phase-4 tests.
6. Run protected Phase-3 CI.
7. Record evidence/status in TEST-REGISTER.
8. If old CI fails: RED STOP and repair before next block.


## B7 minimum reconciliation patch — 09 October 2026

- Canonical UI remains `JANTA_BOL_PHASE_3C_WORKING/ads.html`; public renderer remains `public-ads.js` / `public-ads.css` in that folder. Existing article/publishing/auth homes are preserved.
- `db/20261009140153_p4_t035_public_feed_input_guard.sql`: definition-hash-guarded, unique-target patch of the existing public ad feed. Only placement/scope input checks are added; no domain rows are rewritten. Applied Production ledger version is `20261009141706` (tool-assigned version differs from local CLI filename).
- `db/p4_t035_public_ads_review.sql`: wider historical review candidate; NOT a declaration of exact Production parity. Do not apply it as a blanket synchronization.
- `ci/phase4/p4-t035-postgres-regression.sql`: existing isolated suite plus valid phone and old-draft compatibility coverage.
- `ci/phase4/p4-t035-http-access-denial.cjs`: anonymous read-only private-table denial probes; no real records retrieved or logged.
- `ci/phase4/p4-t035-live-http-readonly.cjs`: independent timeout per HTTP request; all original assertions retained.
- Both existing GitHub workflows include the B7 work branch. Protected suites remain enabled.
- Current status and CI links live in TEST-REGISTER.md; no parallel status authority is introduced.

## B7 client corrections - 10 October 2026

- T035: `public-ads.js` uses normalized Article `district` with existing geography classification; public page script versions advance together. No new location authority.
- T036: `phase4-domain-client.js` validates device-local schedule fields and sends ISO UTC to existing `jb_ad_schedule_internal`. `ads.html` displays stored schedule in device time and labels timezone. Backend authority unchanged.
- `ci/phase4/b7-client-regression.cjs` covers these behaviors and actual inline Admin handlers; both workflows invoke it. Node VM tests do not replace real-device proof.
- Historical evidence table labels must not create duplicate canonical test rows. The original governance checker is unchanged.


## B7 / P4-T039 Owner and advertiser portal source map — 10 Oct 2026 (staging ONLY)

- Canonical campaign/creative authority remains LIVE `public.ad_campaigns` / `public.ad_creatives` (unchanged). Original `ad_portal_credentials`, `ad_portal_sessions`, `ad_renewal_requests`, `ad_history`, common `audit_logs` stay home.
- New **review-only** `db/20261010_b7_portal_text_change_REVIEW_ONLY.sql`: one dedicated `ad_change_requests` workflow table (NOT a second creative SOT), text-only compatibility for `jb_ad_portal_submit_creative`, approved creative projection in `jb_ad_portal_campaign`, exact Owner queue/decision RPC, one-time temp login consumption, and pending portal renewal in EXISTING `ad_renewal_requests`. No automatic LIVE transition, creative replace, payment, geo or schedule mutation from advertiser.
- UI: `JANTA_BOL_PHASE_3C_WORKING/advertiser-portal.html` (own approved view, one-time login, tab session, text request, pending renewal); `ads.html` (Owner issues one-time credentials, reviews change requests and renewals; manual WhatsApp follow-up only).
- Client Owner router: `JANTA_BOL_PHASE_3C_WORKING/phase4-domain-client.js` (Owner-restricted issue, Owner list/decide change, Owner renewal list), no new general News/Admin authority.
- CI: `ci/phase4/b7-portal-fixture.sql` + `b7-portal-regression.sql` in existing `p4-t035-candidate-static.yml` isolated Postgres; `ci/phase4/b7-client-regression.cjs` VM/source guard; explicit reviewed signatures and denied direct media/renewal in old `ci/phase3-regression/db-function-security-regression.sql` T123 without broad whitelisting.
- This staged change is **NOT** Production DB applied, merged or final P4-T039 PASS. Android E3, real AAL2/anon/live Supabase parity, full Owner manual renewal processing, history/notification integration and broader B7 gates are DUE. No B8 coding.
