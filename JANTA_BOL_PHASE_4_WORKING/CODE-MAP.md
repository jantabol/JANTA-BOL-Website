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


## 2026-10-10 — B7-G3 Exact Article Geographic Candidate (STAGING ONLY)
- Source authority: B7 Final Master Blueprint §7 / F04,F05,F13, ADS-014,ADS-028 and G3. Article, never viewer/GPS/home profile, determines eligible district/tehsil; state and National ancestors only when explicitly purchased. MP 55 verified districts and verified tehsil parents required for final launch.
- `db/20261010_b7_geo_targeting_REVIEW_ONLY.sql` is **unapplied candidate**. Adds verified-provenance LGD district/tehsil directory (NO actual imported official codes yet), optional structured `articles.ad_geo_*` fields on existing canonical Article row (preserves Article ID/master URL/legacy classification), exact immutable `ad_campaign_area_grants` (campaign remains contract SOT), owner/AAL2-only `jb_ad_set_article_geo_internal` and `jb_ad_grant_area_internal`, RLS-denied tables, direct grant insert Owner/AAL2 trigger and audited commercial area decisions, and PRIVATE `private.b7_geo_matches_article(article_id,campaign_id)`.
- The geo matcher supports tehsil → district → MP state → National eligible ancestry. District-only Article NEVER implies a tehsil. Gwalior cannot show a Pichhore-only campaign. National news excludes MP-only/local. Unknown/unverified Article denies local; explicit Founder-reviewed `allow_unknown_geo` on NATIONAL grant is the only optional fallback. Multi-district campaign buys exact distinct grants. No caller-supplied asserted district/location permitted.
- `ci/phase4/b7-geo-fixture.sql` uses synthetic code 101/102/103/201/202 etc (**NOT actual LGD codes**); `ci/phase4/b7-geo-regression.sql` covers 25 positive/negative Article-by-campaign matches, wrong-parent/unverified codes, draft exclusion, Owner/AAL1 denial, paid-grant immutability, duplicate sale/area, directory RLS and after-the-fact direct privileged insert guard. Fixture rolls back all synthetic modifications.
- Existing `.github/workflows/p4-t035-candidate-static.yml` gains **additional isolated Postgres G3 job**. The existing protected `ci/phase3-regression/db-function-security-regression.sql` T123 recognizes precisely the new Owner/AAL2 functions only if present and denies public catalog/grant/private matcher exposure. No broad wildcard permissions.
- **NOT integrated** into canonical LIVE public feed or homepage/article UI, and no Production Supabase DDL/DML applied. Official all-55-district/verified tehsil LGD export, codes, provenance/version/parent import, RLS parity, Article metadata verification, Android E3 and full server live eligibility negative tests still outstanding. NO P4-T035 or T037 PASS/LOCK.


## 2026-10-10 — B7-G4 private weighted selection + inventory proof (STAGING-ONLY)
- Supersede (DO NOT RUN) old `review/b7_t037_weighted_feed_REVIEW_ONLY.sql`: it rotates on client supplied `p_scope`, which cannot establish verified Article geography. New `db/20261010_b7_weighted_private_REVIEW_ONLY.sql` is **only one private server-side selection helper** `private.b7_weighted_article_candidate(article_uuid)`, NOT a second public feed. The existing canonical `jb_ad_public_feed` and JS Article permanent URL remain unchanged until G3/G4/analytics staging and security gates pass.
- Candidate checks exact published Article metadata through `private.b7_geo_matches_article`; Owner-approved verified advertiser, approved latest creative, valid media/CTA, confirmed independent manual payment/evidence and linked acceptance, server schedule and no Hide, matching immutable `ad_package_versions` booking snapshot; weight 1–100. Zero eligible = no card, one eligible = same card, more candidates = one weighted ticket, no in-page interval. No buyer/private WhatsApp/payment evidence exposed.
- `ci/phase4/b7-weighted-fixture.sql` extends EXISTING synthetic payment fixture, `b7-weighted-regression.sql` tests 3,200 PostgreSQL server selections for 1:2:3 ratio, expired/hidden/unpaid/paused/unsupported top creative, mismatched frozen package snapshot, unknown/draft/wrong district and one-Article-one candidate. Candidate workflow's new `b7-weighted-postgres` job uses disposable Postgres + G3 and manual payment review SQL, never LIVE.
- `db/20261010_b7_inventory_guard_REVIEW_ONLY.sql` is a **single conservative shared capacity home** by Article/Home placement + nonoverlapping server time windows. Owner/AAL2 records evidence-backed capacity; `ad_inventory_reservations` serializes locked quota booking against one window. 600+400<=1000 allowed; 1100/another new sale denied; confirmed buyer's booked scope/price/period/package cannot be silently rewritten, emergency Hide allowed without deleting commercial history. No capacity rows or guarantees created in Production.
- `ci/phase4/b7-inventory-fixture.sql` augments old manual payment fixture; `b7-inventory-regression.sql` runs no-oversell, false terms, anonymous/AAL1/direct SQL, high-risk, immutable window/reservation, sold contract changes, adjacent/overlapping period and shared audit negative E2/E5 fixtures. New `b7-inventory-postgres` runs alongside all old workflows. Existing T123 check explicitly restricts 2 exact Owner booking RPCs and private tables/triggers if present (no broad weakening).
- This is **candidate backend infrastructure only**: unverified MP-55 LGD import, public feed Article-ID integration, package/geo agreement approval UI, Owner inventory forecast basis, real campaign rescue, impression caps/analytics and Android E3 are unresolved. No P4-T037 PASS and no Production deployment or source merge.


## B7 / Single canonical public feed Article-ID cutover — 10 Oct 2026

- **Source authority:** published `public.articles.id` + verified `articles.ad_geo_*` metadata. Purchased-area and parent permissions only from `ad_campaign_area_grants` and versioned official MP LGD catalog; no frontend geo assertion.
- **Backend STAGING REVIEW ONLY:** `db/20261010_b7_single_public_feed_cutover_REVIEW_ONLY.sql`. REPLACES existing exact `public.jb_ad_public_feed(text,text)` signature (same eight sanitized fields). `p_scope=article:<uuid>` binds Article; `p_scope=global` for homepage uses reviewed MP/National grants. No new parallel public feed; existing `jb_public_active_ads(text)` remains an alias. It delegates Article weighting to PRIVATE `b7_weighted_article_candidate`; no new Article/price/campaign/payment SOT.
- **Client STAGED, not wired to production:** `JANTA_BOL_PHASE_3C_WORKING/public-ads.js` now exports `scopeForVerifiedArticleId` and `renderVerifiedArticle`. Validates Article ID, reuses one pinned ad selection. Existing `article.html` still calls old `scopeForArticle`; switching requires simultaneous paired frontend/server rollout.
- **Tests:** `ci/phase4/b7-single-feed-regression.sql` (80 anonymous published Article calls, forged 11+ scopes denied, one slot, legacy alias, MP homepage, RLS privacy, emergency Hide) in NEW `b7-single-feed-postgres` workflow job. `ci/phase4/b7-client-regression.cjs` covers UUID normalization, no caller-supplied district and one pinned request. Old 3A-P3-T123 has additive conditional cutover safety guard; old checker/test logic remains.
- **Rollout authority and unresolved blockers:** `review/B7_SINGLE_PUBLIC_FEED_CUTOVER_GATES_20261010.md` lists official MP-55 LGD import, production compatibility, metrics, media/quoted inventory and E3/E5/Founder approval. All candidate SQL remains unapplied to LIVE. P4-T035/P4-T037 NOT PASS.


## B7 / P4-T040 staging source map — 10 Oct 2026 (NOT DEPLOYED)
- Blueprint map: ADS-048 safe CTA, ADS-049 qualified ad impressions, ADS-050 abuse/privacy/failure. Article/news 1-second preview remains **independent** and unchanged.
- Actual one-view frontend observer: `JANTA_BOL_PHASE_3C_WORKING/ad-viewability.js`, >=50% viewport for >=1000ms continuously, page visible; no referrer/GPS/trackers, callbacks once and fail closed. `ad-analytics-client.js` is its unlinked partner for cryptographically random open-nonce, short-lived ticket issuance and one-shot qualified report. NO `article.html` or `index.html` script dependency yet.
- Exact payment/geo/creative SOT shared: `db/20261010_b7_weighted_private_REVIEW_ONLY.sql` defines `private.b7_eligible_article_creatives(uuid)` (the previous weighted picker now reads it); `db/20261010_b7_qualified_impressions_REVIEW_ONLY.sql` creates *ephemeral* `ad_view_tickets` one-use hashes and stores qualifying event only in existing canonical `public.ad_events` (no second metrics ledger). Existing `jb_ad_event`/`jb_ad_record_event` signatures remain but revoke untrusted anon/auth execute. Old raw count rows stay preserved and labeled legacy/unverified.
- New exact public ticket RPCs: `jb_ad_issue_view_ticket(uuid,uuid,uuid,text)`, `jb_ad_qualify_view_ticket(text)`. New `jb_ad_qualified_analytics_internal(uuid)` is Owner/AAL2 only, and its output clearly labels client-estimated non-unique reach. Existing private pending portal and Article receipt architecture unchanged.
- Synthetic E1/E2 jobs: `ci/phase4/b7-viewability-regression.cjs` (10 deterministic threshold/scroll/hidden/error/no-network), `b7-analytics-client-regression.cjs` (8 ticket/nonce/authority/failure), `b7-view-ticket-fixture.sql`, `b7-view-ticket-regression.sql` (server 1s, wrong/draft/other creative, replay, nonce uniqueness, expired, emergency HIDE, RLS, Owner stats and canonical history). Runs in new isolated `b7-view-ticket-postgres` in additive Candidate workflow. Protected T123 detects raw-anon writers, exact function roles, table RLS and immutable ticket proof conditionally. All old phase3, B0-B7 jobs retained.
- Rollout readiness/deferred blockers: `review/B7_P4_T040_QUALIFIED_VIEW_ROLLOUT_20261010.md`. Official LGD MP-55/tehsil, risk/anti-bot independent validation, genuine 50% Android E3, homepage & CTA/click issuance, real delivered E5 and linked public feed pairing are DUE. B7 unmerged DRAFT, NOT PASS.


## B7 T040 optional public renderer bridge — 10 Oct 2026
- Existing `JANTA_BOL_PHASE_3C_WORKING/public-ads.js` now has a **no-op-until-enabled** post-render bridge: only a validated `article:<uuid>` scope, an already-added pinned ad element and the optional `JBAdAnalytics.prepare` hook may initiate a future protected ticket. It does not mutate Article text, master URL, share buttons, ad frequency, untrusted legacy `local`/`district:` scope or homepage.
- `article.html` still calls `scopeForArticle(item)` and does not load either ad analytics module; therefore Production continues the original existing ad path and no new view ticket is emitted. Introducing the scripts and new Article ID path requires single reviewed backend/frontend cutover. No changes to the canonical legacy API until authorized.
- `ci/phase4/b7-client-regression.cjs` now adds three DOM-behavior fixtures: qualified handshake is offered once only *after* one pinned Article ad rendered, legacy scope produces zero handshakes even when ad shows, backend rejection does not remove ad or repeat selection. Not Android E3.
