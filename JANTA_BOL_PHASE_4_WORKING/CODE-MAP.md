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
