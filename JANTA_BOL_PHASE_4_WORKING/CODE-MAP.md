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


## B7 P4-T040 ADS-048 click safety — 10 Oct 2026 (REVIEW-ONLY)
- **CTA original authority:** `public.ad_creatives` approved `cta_type` + `cta_target` only; existing `public-ads.js` validates `https:` website/maps, `tel:` calls and normalized `https://wa.me/` WhatsApp before rendering. Illegal javascript/data/file/http/credential URLs cannot become rendered links. Existing Article one-paid-ad pin and top/bottom share controls unchanged.
- **Browser staged handoff:** `public-ads.js` supplies the *same validated rendered CTA anchor* via `ctaElement` to optional `JBAdAnalytics.prepare`. `ad-analytics-client.js` attaches a click callback only after successfully receiving a short-lived, approved, Article-bound ticket. Requires browser `isTrusted===true`, real live element, tab not hidden, no canceled/defaultPrevented click; local once-only guard. Never calls `preventDefault`, never redirects via tracking endpoint, logs no URL or viewer identifier; stats failure cannot block the approved navigation.
- **Server click gate:** `db/20261010_b7_cta_click_REVIEW_ONLY.sql`, applied AFTER the staged qualified-ticket migration in disposable CI. Adds nullable `ad_view_tickets.click_at` to the existing per-opening ticket, implements exact `public.jb_ad_record_ticket_click(text)` with hashed+row-locked one-use ticket, <3min expiry, exact ticket campaign+creative & approved safe CTA target validation. Reports to **existing `ad_events`**; new per-ticket-and-event-type unique index allows exactly ONE qualified impression plus ONE claimed CTA click for same opening. Existing Owner stats JSON retains `clicks_verified:0` and adds explicitly labeled `clicks_reported`, no human-attestation claims.
- **CI:** `ci/phase4/b7-view-ticket-regression.sql` now proves same valid ticket can yield exactly one impression and one reported click, duplicate/forged/invalid JS target rejected, raw previous counters remain labeled legacy, Owner reads require AAL2, all transaction-rolled back. `ci/phase4/b7-analytics-client-regression.cjs` covers trusted vs programmatic clicks, disconnected/hidden/foreign CTA, failure isolation; `b7-client-regression.cjs` adds 12 call/WhatsApp/HTTPS/maps and unsafe target cases. Protected T123 allowlist includes only the exact click signature with approved CTA/current token/index checks.
- **NO production application:** article.html still does not load analytics scripts and remains on legacy caller-scope; the click migration and paired backend remain REVIEW_ONLY. Bot impersonation via fresh nonce is STILL POSSIBLE; clicks and views are `client_reported`, not verified users or payable guarantees. P4-T040 stays IN PROGRESS; Android E3/E5, click physical navigation and anti-abuse external proof are DUE.


## B7 T040 Owner estimate-on-demand panel — 10 Oct 2026
- The existing Owner `ads.html` campaign card now shows a **manual** "View estimated ad analytics (Owner)" action (no automatic N-campaign data fetch), never visible in public News or the Advertiser Portal. `phase4-domain-client.js` `adQualifiedAnalytics(uuid)` enforces existing Owner/AAL2 preflight and exact `jb_ad_qualified_analytics_internal(uuid)`, rejects malformed IDs and absent/unrecognized response. No legacy raw stats fallback.
- The Owner read-only result is rendered with DOM `textContent` (not HTML), labeling Today, last 7 days, last 30 days, total client-reported qualified-view claims, click claims and **separate historical raw-unverified events**; explicitly displays "NOT VERIFIED" for humans/bot-free reach and independent News Article analytics. When staging RPC is not installed it reports **unavailable**, not fabricated zeros.
- Existing `ci/phase4/b7-client-regression.cjs` now checks Owner denial, invalid UUID refusal, exact source RPC, estimated vs legacy separation and backend-outage fail-closed UI behavior. Candidate E1 proof only; actual Owner AAL2 E5 and Android E3 remain DUE.


## B7 T041 notification + retention source map — 10 Oct 2026 (STAGING / NOT PASS)
- **Master SOT:** B7 Final Blueprint P4-T041 / ADS-051..056, E1+E2+E5. B3 retained-record and notification engines already exist in LIVE Supabase; do NOT add a duplicate system.
- **B3 NOTIFICATION adapter:** `JANTA_BOL_PHASE_4_WORKING/db/20261010_b7_unified_notifications_REVIEW_ONLY.sql`: private `b7_ad_emit_inapp_owner` calls preexisting `jb_notification_emit_internal` with `domain='ads'`, Owner recipient only, sanitized static title/message, B3 dedupe and IN_APP only. Protected source triggers `b7_ad_domain_notification_trigger` on canonical ad_campaigns, advertisers, ad_payments, ad_creatives, and optionally existing ad_renewal_requests/ad_change_requests (no parallel request tables).
- **Failure authority:** notification outage caught; ad enquiry/paid/LIVE/News continue. `ad_notification_failed` is stored in immutable existing `audit_logs` with safe SQLSTATE and NOT_CONFIRMED; external message is never assumed delivered. `jb_ad_notification_failures_internal()` and `jb_ad_notification_retry_internal(bigint)` are new exact Owner/AAL2-only recovered in-app B3 receipt RPCs; retries preserve original failure audit, append one success receipt and dedupe repeated Owner tap. No autonomous WhatsApp.
- **Owner UI:** existing `phase4-domain-client.js` methods `adNotificationFailures()/adRetryNotification()`; existing `ads.html` a lazily loaded pending-notification-failure panel, manual retry in-app only, no secret/UTR/contact in notification payload. Error path fails closed: not confirmed, not false sent claim.
- **B3 RETENTION:** `db/20261010_b7_retention_audit_REVIEW_ONLY.sql` uses only existing `ad_history`, `record_retention_state`, `record_retention_history`, `record_retention_policies` and `audit_logs`. Existing `ads_history_v1` >=2555 days/automatic disposition=false required. Every new ad_history inserted registers with truthful actor (nullable anon), older history backfilled by original event timestamp, existing HOLD/EXTEND not overwritten. Immutable commercial history and approved creative plus campaign delete guard preserve evidence; no physical disposal/retention auto-purge.
- **CI:** `ci/phase4/b7-notification-fixture.sql` (exact B3 signature SHIM) + `b7-notification-regression.sql` (12 events/denials/audited outage/Owner retry). `b7-retention-fixture.sql` + `b7-retention-regression.sql` (historical backfill, original-date expiry, pre-existing HOLD, immutable and disabled policy denial). Additive `b7-notification-postgres` and `b7-retention-postgres` Candidate PostgreSQL jobs. Existing Phase3 function security T123 now conditionally inventories only the two exact Owner notification RPCs and old B3 audit trigger/history retention invariants. No old CI removed.
- **Release hold:** Both migrations REVIEW_ONLY and *not applied* to LIVE; E5 actual B3/RLS/Android/provider retries, owner verification and anti-bot remain DUE. P4-T041 IN PROGRESS only, no PASS/LOCK/B8.

## B7 T041 race/retention hardening — 10 October 2026
- `db/20261010_b7_unified_notifications_REVIEW_ONLY.sql`: immutable `audit_logs` failure row locked `FOR UPDATE` to serialize concurrent Owner/AAL2 retry; original failure preserved; actual B3 in-app notification source and dedupe unchanged; no external provider delivery claim.
- `ci/phase4/b7-notification-concurrency-setup.sql`, `b7-notification-concurrency-verify.sql`: two genuinely separate PG17 sessions racing one failure ID via Candidate `b7-notification-postgres`; enforce exactly one success audit plus one in-app B3 stub receipt. The B3 fixture `b7.test_notify_delay` is test-only, never a production function setting.
- `db/20261010_b7_retention_audit_REVIEW_ONLY.sql`: registration due date for new/backdated commercial history derives from immutable original `created_at` and existing active `ads_history_v1` policy. Overdue imports marked `due`, NEVER auto-deleted. Historical backfill still unchanged and preexisting legal HOLD preserved. `ci/phase4/b7-retention-regression.sql` covers 60/2600-day records.
- `ci/phase4/b7-notification-fixture.sql` and `b7-notification-regression.sql`: replicate **existing B3** `team_accounts.status` suspended-recipient denial; test no sensitive notice is routed to suspended owner, ad request remains, safe audit and mock reactivated in-app-only retry.
- Protected `ci/phase3-regression/db-function-security-regression.sql`: conditional T123 checks `FOR UPDATE;` in the single reviewed Owner retry RPC. Still requires Owner/AAL2, existing B3 source and exact role grants; no previous test skips.
- **Not deployed or connected to Article until paired official geography/backend release.** No Public News or canonical master URL change. ADS-054/055 synthetic E2 only, P4-T041 remains IN PROGRESS.



## B7 P4-T041 — original B3 source compatibility and stale-state guard (10 Oct 2026)
- `ci/phase4/b7-b3-real-contract-setup.sql` prepares a disposable baseline for exact preexisting **original B3** migrations, no fake duplicate B3 emitter.
- New Candidate job `b7-original-b3-contract-postgres` runs unchanged `CODEX_CURRENT_SUPABASE/migrations/20261003000100_phase4_b3_unified_notifications_foundation.sql`, `20261003000200_phase4_b3_notification_delivery_and_adapters.sql`, `20261003000500_phase4_b3_notification_privacy_priority_reminders.sql`, then `db/20261010_b7_unified_notifications_REVIEW_ONLY.sql` and `ci/phase4/b7-b3-real-contract-regression.sql` in an isolated PostgreSQL 17 transaction. Tests B3 real lifecycle/priority, history IN_APP/EMITTED, existing notification_history_v1 policy, Owner revoke, retry and B3 password/token rejection.
- Backend retry `public.jb_ad_notification_retry_internal(bigint)` now checks current canonical campaign status before showing a retried `ad_live`/HIDE/REQUEST to Owner. Stale campaign/advertiser verification/payment events are converted into sanitized `ad_workflow_updated` Owner review, NOT a false current status. Original immutable failure remains; appended success audit distinguishes `source_event` vs `delivered_event`. Strict lowercase canonical UUID audit references required. Does not add new notification store or external channel.
- `ci/phase4/b7-notification-concurrency-setup.sql` and `...verify.sql`: revised synthetic event is `ad_approved` because its campaign's backend state really IS approved; the stale-event regression is separately covered in the original B3 source fixture. Two-session FOR UPDATE race still expects one IN_APP plus one success audit.
- Production frontend and Supabase database remain unchanged; both pre-existing Phase3/4 regression and B7 candidate jobs preserved. Real E5, external providers and Android E3 remain due; P4-T041 not LOCKED.


## B7 creative version + hostile-ad host hardening + strict release artifact map (10 October 2026)
- **One creative authority** `public.ad_creatives` + `public.ad_history`. Original LIVE `jb_ad_save_creative_internal` and `jb_ad_approve_creative_internal` perform approved flag revocation on older rows and approval on new row. The prior blanket approved=true UPDATE trigger in REVIEW-ONLY retention migration would have broken valid AAL2 version change. Fixed by adding historical sticky `approved_once` to the EXISTING table (not parallel SOT) and a BEFORE UPDATE/DELETE trigger comparing all non-approval fields via `to_jsonb(new)` minus keys. Old payload immutable forever even after Owner revocation; only Owner/AAL2 may toggle approved flag. Historical `creative_approved` vN events backfill sticky prior state.
- **Isolation:** `ci/phase4/b7-retention-fixture.sql` adds canonical source columns in its own disposable Postgres only; `ci/phase4/b7-payment-fixture.sql` reverted to original shared baseline, so 13 other current Candidate tests keep their own fixtures. Owner-positive/negative version tests `b7-retention-regression.sql`. Conditional T123 trigger/column/AAL2 check in `ci/phase3-regression/db-function-security-regression.sql` added, not weakened.
- **Host safety source:** Existing `JANTA_BOL_PHASE_3C_WORKING/public-ads.js` one quiet responsive ad card now denies ad media and CTA HTTPS URLs that point to loopback IPv4, all IP literals, localhost, dotless or .local/.internal hosts (plus credentials/control text). It never requests GPS/IP and leaves Article text, permanent URL, one ad pin intact. Paired review-only server `db/20261010_b7_cta_click_REVIEW_ONLY.sql` checks the exact same approved creative host before accepting a one-time reported click. `b7-client-regression.cjs` and `b7-view-ticket-regression.sql` cover positive/negative.
- **Canonical B7 Final ZIP authority:** `review/B7_FINAL_ZIP_CLOSURE_MANIFEST.json` maps ADS-001..060 to P4-T034..T042 with their REQUIRED E1/E2/E3/E5/E6/E7 evidence matrix, all final evidence DUE. `ci/phase4/b7-closure-gate.cjs --audit` validates exact unique 60/9 homes without claiming PASS; `--release` is designed to **FAIL** until all final real proof, Owner signature, official E7 source hash/deploy receipts and provider E6 are provided. `b7-closure-regression.cjs` negative tests; workflow `p4-t035-candidate-static.yml` adds only that preflight, preserving old CI. No B7 final ZIP issued prematurely.



## B7 2026-10-12 — Owner DRAFT/APPROVE + Founder LOCAL media preview (REVIEW ONLY)
- Actual current LIVE `public.jb_ad_save_creative_internal(uuid,text,text,text,text,text)` was inspected read-only; it revokes all old approved versions and autoapproves a new submitted version immediately. `jb_ad_approve_creative_internal(uuid)` exists separately. First-divergence evidence is in `ci/phase4/b7-creative-legacy-source-fixture.sql` (unchanged live procedural code) + `b7-creative-legacy-divergence.sql` (rollback-only).
- `db/20261012_b7_creative_draft_approval_REVIEW_ONLY.sql`: same two old RPC signatures+return types, existing `ad_creatives + ad_history` homes. Preflight requires prior sticky `approved_once` migration and old LIVE procedural source. Owner SAVE serializes campaign row, stores only `approved=false` newer draft + `creative_draft_saved`; current approval unaffected. Owner APPROVE locks campaign, requires latest version and advertiser verification; ONLY text passes until independent server media checks are ready, atomically toggles exact approved flags, emits one append-only `creative_approved`.
- New exact Owner AAL2 capability `jb_ad_creative_workflow_capability_internal()` returns `B7_DRAFT_THEN_EXPLICIT_APPROVE_V1`. Existing frontend `phase4-domain-client.js` never calls legacy SAVE/APPROVE without it; new `adApproveCreative()` explicit. `ads.html` Founder preview dialog then approves chosen latest pending creative; draft SAVE does not hide the currently displayed paid card. Source remains Draft PR #5, not LIVE.
- Owner local preview `JANTA_BOL_PHASE_3C_WORKING/ad-media-preview.js`: Browser File first-32-byte JPEG/PNG/WebP/MP4 match MIME/extension; max bound from current public-media bucket; contains object-fit/portrait/landscape and no-autoplay MP4 plus blob dispose. Included ONLY in Owner `ads.html`, no upload client, no approval and not shipped as evidence of server image/EXIF/virus/codec validation.
- Exact E1/isolated E2: `ci/phase4/b7-creative-two-stage-regression.sql`, `b7-creative-legacy-divergence.sql`, `b7-client-regression.cjs`, `b7-media-preview-regression.cjs`, additive `b7-creative-two-stage-postgres` Candidate job. Protected T123 conditionally checks Owner grant and two-stage source when capability is installed; all older News/Ads checks retained.
- **Production release dependencies:** B7 privacy `b5_private_gateway_only` RLS incident unresolved, backend first-party media processor mandatory, production-like staging parity, full Android/Owner E3/E5 signoff, official LGD. Final ZIP BLOCKED.


## B7 Storage RLS source authority correction (Independent RCA checkpoint)
- Actual LIVE `pg_policy.polpermissive=false` for `storage.objects.b5_private_gateway_only`: **RESTRICTIVE**, AND-constrained with permissive Owner policies, never a standalone anonymous GRANT. The original staged script to drop it was wrong; now neutralized as read-only zero-DDL audit with ROLLBACK.
- `ci/phase4/b7-storage-rls-fixture.sql`: original B5 `AS RESTRICTIVE`; `...before-regression.sql` proves anonymously zero SQL visible objects and no insert, plus **hypothetical only** transaction-switch to PERMISSIVE showing the logical distinction, rollback. `...after-regression.sql` verifies original B5 remains, no new public SQL access, AAL1 denial, original Owner media writes/read and Grievance guard. New Candidate workflow job description explicitly states RESTRICTIVE, not incident reproduction. Existing jobs all preserved.
- Exact independent audit: `review/B7_STORAGE_POLICY_INDEPENDENT_RCA_CORRECTION_20261012.md`. Original critical hold prefaced with superseding correction; no silent historical erasure. Public-media bucket HTTP read is a separate Storage API/CDN behavior, not direct SQL SELECT. Future sensitive Production authorization remains mandatory.


## B7 continued — LIVE RLS source check and Owner local Media Preview race guard
- Existing LIVE `storage.objects.b5_private_gateway_only`: `polpermissive=false`, **RESTRICTIVE AND guard**, not anonymous GRANT. `db/20261010_b7_storage_rls_critical_REVIEW_ONLY.sql` was corrected to zero-DDL read-only audit, no DROP/CREATE policy; `ci/phase4/b7-storage-rls-{fixture,before-regression,after-regression}.sql` now verifies actual restrictive matrix plus counterfactual permissive rollback. New `ci/phase4/db-b7-storage-policy-source-audit.sql` runs **READ ONLY** in the existing protected Supabase transaction job; broad old tests still enabled. Correction document `review/B7_STORAGE_POLICY_INDEPENDENT_RCA_CORRECTION_20261012.md`; old incident audit prefaced with historical correction.
- `JANTA_BOL_PHASE_3C_WORKING/ad-media-preview.js`: `generations` WeakMap per preview container, last async local selection wins; stale result returns `SUPERSEDED_LOCAL_PREVIEW_NO_CHANGE`, current invalid file cleans old object URL and preview, stale invalid never destroys new. `dispose` increments generation to cancel in-flight Android File reads and calls `URL.revokeObjectURL` for existing previews.
- `ads.html`: adds preview container to cleanup set *before* await, suppresses outdated selection errors and detached element updates. `ci/phase4/b7-media-preview-regression.cjs` adds deterministic deferred File.arrayBuffer() slow/fast tests, pagehide cancellation, invalid-current blob revocation and stale-invalid guard. Preview is local-only, never upload/creative approval.
- Still E1 + synthetic E2/source-only, no real Android E3/Owner E5 or final B7 PASS/LOCK.

## B7 paid media/CTA URL policy — single private Source of Truth
- `db/20261010_b7_weighted_private_REVIEW_ONLY.sql` adds `private.b7_safe_public_ad_https(text)` (SQL IMMUTABLE, SECURITY INVOKER, no anon/authenticated EXECUTE) and uses it for both Article media and website/map CTA.
- `db/20261010_b7_single_public_feed_cutover_REVIEW_ONLY.sql` reuses SAME private helper for Homepage selection; not a second public selector. No server media scan exists yet, so media approval MUST stay blocked until first-party verified derivatives.
- `ci/phase4/b7-weighted-regression.sql` (HTTP/loopback/local/internal/IPv4 shortening / invalid CTA and safe DNS positives) and `ci/phase4/b7-single-feed-regression.sql` (old approved Homepage media/CTA rejected). `ci/phase3-regression/db-function-security-regression.sql` conditioned T123 requires shared helper and Article geo INSERT trigger once staging schema exists.
- Exact parent CI on `774fdd6aaafb7b47dca7916b2fb0815cf89fa307`: Candidate 38111683892 GREEN 16/16, Protected 38111683896 GREEN 2/2. Not Production migration/test PASS. 0/9 FINAL.

## B7 continuation — single CTA authorization + offline government LGD preflight
- `db/20261010_b7_cta_click_REVIEW_ONLY.sql`: immutable ticketed click uses existing `private.b7_safe_public_ad_https(cr.cta_target)`; no secondary regexp or parallel advertisement click endpoint.
- `ci/phase4/b7-view-ticket-regression.sql`: loopback-shorthand/hex/octal negative click events; verifies ticket and shared `ad_events` unchanged on reject, positive genuine CTA still works.
- `ci/phase3-regression/db-function-security-regression.sql`: conditional protected T123 requires click URL authority to reference private helper once G4 table/helper has been deployed.
- `ci/phase4/b7-lgd-source-preflight.cjs`: offline CSV + manifest SHA256, 55 MP district and parent consistency; **cannot** set verified, generate SQL imports or authenticate source independently.
- `ci/phase4/b7-lgd-source-preflight.test.cjs` + `.github/workflows/p4-t035-candidate-static.yml`: 100% synthetic negative contract cases; historical suite preserved, no official import.
- `review/B7_20261012_CLICK_LGD_CHECKPOINT_RCA.md`: source trace, RCA and verified CI receipts. Exact pre-doc coding CI `231d2852a0...`: Candidate 38112503709 GREEN 16/16 and Protected 38112503725 GREEN 2/2.

## B7 shared URL valid-port boundary
- `db/20261010_b7_weighted_private_REVIEW_ONLY.sql` — inside existing `private.b7_safe_public_ad_https(text)`, reject impossible `:65536`, `:99999` and unusable `:00000` before candidate selection/click. This is same SOT for Article, Homepage and protected CTA click; no URL parsing logic duplicated.
- `ci/phase4/b7-weighted-regression.sql` and `ci/phase4/b7-view-ticket-regression.sql`: negative aliases plus invalid-port no-click event, valid port positive.
- `ci/phase3-regression/db-function-security-regression.sql` T123 ensures approved helper includes `BETWEEN 1 AND 65535` whenever staged G4 is deployed. Verified exact original source HEAD `e8310c0cbd632d877fdba040e5c49e11756f930a` Candidate 38112739568 16/16 and Protected 38112739610 2/2 GREEN.

## B7 new REVIEW-ONLY server Media Studio code (not exposed nor deployed)
- `CODEX_CURRENT_SUPABASE/functions/_shared/b7-media-byte-policy.mjs`: HEADER/PAYLOAD preflight, PNG safe palette and CRC, JPEG SOF, WebP static structure, strict postprocess PNG container; NOT a decoder or media approval grant.
- `CODEX_CURRENT_SUPABASE/functions/_shared/b7-image-sanitize.ts`: pinned magick-wasm@0.0.30 actual WASM decode, pixel orientation normalization, 1200px output limit, `img.strip()`, `Orientation Undefined=0`, PNG metadata restriction, source/derivative SHA-256; PREVIEW ONLY, no service-role/db/storage.
- `ci/phase4/b7-media-byte-policy.test.mjs` and `ci/phase4/b7-image-sanitize.test.ts`, `.github/workflows/p4-t035-candidate-static.yml`: additive Node tests + new Deno WASM CI job, no old G3/G4/Phase3 test suppressed.
- Proof `38113900702` Candidate 17/17 green (source `9b6ace69080...`). No actual owner upload/deploy PASS.

## B7 ADS-009/010/015 OWNER MEDIA HTTP PREVIEW — 11 OCT 2026
- CODEX_CURRENT_SUPABASE/functions/jb-ad-media-preview/handler.ts : bounded streaming multipart + exact declared length; one file; no-store sanitized PNG preview; no upload/approve.
- CODEX_CURRENT_SUPABASE/functions/jb-ad-media-preview/owner-auth.ts : canonical Auth /user PLUS jb_ad_creative_workflow_capability_internal Owner/AAL2 RPC, same Bearer and anon key only.
- CODEX_CURRENT_SUPABASE/functions/jb-ad-media-preview/index.ts : isolated REVIEW-ONLY Edge entry (not deployed); imports real WASM sanitizer, no service-role, no writes.
- ci/phase4/b7-ad-media-gateway.test.ts : real synthetic FormData/WASM e2e, mocked Owner, header spoof and streaming overflow, no CORS, no approval.
- ci/phase4/b7-ad-owner-auth.test.ts : synthetic invalid, AAL1/revoked, wrong server capability, forged Supabase origin negative tests.
- .github/workflows/p4-t035-candidate-static.yml : Deno v2.9.7 + pinned magick-wasm 0.0.30 real tests alongside previous 16 jobs. Exact SHA 2cc2e04dd21e232ceda53c998b49512f3ae47246 Candidate 38114596493 17/17 SUCCESS and Protected 38114596457 2/2 SUCCESS.

## B7 ADS-015 two private Storage buckets, immutable SHA receipts and B5 regression (11 Oct 2026)
- CODEX_CURRENT_SUPABASE/functions/_shared/b7-private-media-stage.mjs: synthetic/isolated Owner gate + server WASM converter + SHA256 source/derivative re-verification, unique staged paths, sequential create-only readback, onOrphan mandatory, unapproved-only private receipt.
- CODEX_CURRENT_SUPABASE/functions/_shared/b7-supabase-private-store.mjs: server-supplied Supabase Storage SDK adapter, private allowlist exactly two NEW B7 buckets (never existing editorial/public/grievance); bucket visibility check before each read/write; upload upsert=false; re-download bytes.
- ci/phase4/b7-media-private-storage.test.mjs, ci/phase4/b7-image-sanitize.test.ts: synthetic storage negative tests (denial, missing/private drift, hash forgery, corrupt stored bytes, orphan audit failure) and REAL pinned Magick WASM from pixels to two fake private objects; NO live upload.
- JANTA_BOL_PHASE_4_WORKING/db/20261011_b7_media_immutable_evidence_REVIEW_ONLY.sql: private service_role insert-only restricted evidence+orphan audit; foreign keys to canonical ad_creatives, version check, digest-shaped storage paths, immutable triggers. Not deployed.
- JANTA_BOL_PHASE_4_WORKING/db/20261011_b7_private_storage_bucket_REVIEW_ONLY.sql: two private buckets and additional RESTRICTIVE AND policy while preserving original RESTRICTIVE B5. Not deployed.
- ci/phase4/b7-media-evidence-regression.sql and ci/phase4/b7-private-storage-bucket-regression.sql: disposable PG Owner authorization, evidence matching, service-role no delete; hypothetical widened grant/RLS rollback proves append-only; broad storage grant also cannot defeat RESTRICTIVE rule. Same 17-job Candidate CI source 26e783b2434cdee1e4171bb9fd33be7aaca9e0b0 GREEN 38118203598, protected 38118203562 2/2 GREEN.

## File map: B7 ADS-015 11 OCT 2026 — REVIEW ONLY. Source 8756d39e3353280baaefdc3598cc3a96370db320. Candidate CI 38120325295 SUCCESS 17/17. Protected run 38120325252 verify separately. Added canonical Creative latest-draft + Owner AAL2 recheck AFTER private WASM Storage SHA readback; restricted service_role-only receipt/orphan RPCs to existing private append-only ledger, no other Creative SOT. Verified negative synthetic session-revoke, stale draft, forgery and absent DB migration. New private evidence trigger locks canonical campaign FOR UPDATE to serialize against Creative SAVE/APPROVE. Real E3/E5, original/derivative LIVE buckets, real private worker, video/poster, E7 and Founder final approval DUE. P4-T034..042 0/9 FINAL PASS+LOCK. ZIP BLOCKED. New files CODEX_CURRENT_SUPABASE/functions/_shared/b7-media-coordinator.mjs, b7-media-server-evidence.mjs; jb-ad-media-preview/owner-auth.ts ID return; JANTA_BOL_PHASE_4_WORKING/db/20261011_b7_private_media_server_rpcs_REVIEW_ONLY.sql. Tests ci/phase4/b7-media-coordinator.test.mjs, b7-media-server-evidence.test.mjs, b7-media-server-rpc-regression.sql.

## B7 ADS-015 11 Oct 2026: actual isolated private WASM image-job bridge (REVIEW ONLY)
- Worker: `CODEX_CURRENT_SUPABASE/functions/_shared/b7-private-image-job.ts`, integrates existing reusable modules `jb-ad-media-preview/owner-auth.ts`, `_shared/b7-image-sanitize.ts`, `_shared/b7-media-server-evidence.mjs`, `_shared/b7-supabase-private-store.mjs`, `_shared/b7-media-coordinator.mjs`.
- E2 test: `ci/phase4/b7-private-image-job.test.ts`, full real WASM with synthetic server connectors. Added to original `.github/workflows/p4-t035-candidate-static.yml` Deno job; no E2 skipped.
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

## B7 ADS-010/011 — Clean public media + explicit Owner IMAGE approval candidate (11 Oct 2026)

- VERIFIED SOURCE SHA `3a65d8c0c41aad76b84bf6eb2c7374c9a80231c2`: Candidate CI **38146543543 SUCCESS 18/18**, protected Phase 3A+3B **38146543545 SUCCESS 2/2**. All coding is on PR #5 DRAFT, UNMERGED. These are code/transactional fixtures, NOT Founder release or public production assets.

- NEW `CODEX_CURRENT_SUPABASE/functions/_shared/b7-public-release-worker.mjs`: first-party CLEAN public copy only AFTER explicit Owner release intent; checks Owner AAL2 twice, canonical latest pending Creative, immutable private video/image SHA receipt, byte-level private and public readback hash, consent exact asset+version and durable public orphan audit. Copies NEVER contain raw original. Returns `approved:false,publishable:false` until canonical Owner approval.

- NEW `_shared/b7-clean-public-supabase.mjs` pairs actual server API adapter with canonical Owner identity, restricted receipt/orphan SQL RPCs, dedicated `jb-ad-clean-public` bucket, immutable upsert:false; no HTTP endpoint or client service_role. Tests with fake external Auth/Storage/RPC adapters, and new actual Deno ImageMagick WASM GPS-comment -> clean PNG -> public candidate proof with synthetic Storage. No live uploads.

- NEW review-only `db/20261011_b7_clean_public_release_evidence_REVIEW_ONLY.sql` append-only canonical pending Creative/private SHA public candidate evidence and private orphan log; `db/20261011_b7_clean_public_bucket_REVIEW_ONLY.sql` only generated photo PNG/H264 MP4 public bucket + restrictive no-anon/auth INSERT/UPDATE/DELETE policies; B5 RESTRICTIVE and existing Editorial/Grievance buckets untouched. All SQL E2 tests run disposable PostgreSQL 17.

- NEW review-only `db/20261011_b7_owner_clean_image_approval_REVIEW_ONLY.sql` preserves ORIGINAL Owner approval RPC name/return type, existing Owner+AAL2, campaign locking, latest version, advertiser risk, sticky approved audit. IMAGE approval possible only when EXACT immutable private & clean-public sha/Owner/latest evidence exists, and DBA-controlled first-party origin is EXPLICITLY enabled. Origin config is **OFF by default** and no client can enable it. Synthetic SQL tests approve a valid image while original approved history and idempotency are preserved. VIDEO remains safely blocked `B7_VIDEO_PUBLIC_POSTER_FEED_NOT_READY`: current public feed does not project poster URL, so never silently approve a non-playable video.

- Independent RCA: initial new SQL syntax error on CASE+OR guard fixed with explicit suffix; later receipt-match negative was due to retention fixture setting `auth.uid()` NULL, not a Production authority flaw; E2 now sets synthetic actor claim while production Owner ID check stays strict. Real Deno TS18048 optional result fixed by asserting mandatory verified successful receipt, not skipping tests.

- Production READ-ONLY check: 5 campaigns, 0 LIVE, 11 creatives, 0 B7-specific Storage buckets, 0 clean media RPCs, B5 RESTRICTIVE intact. **NO** Production Storage/SQL, PR merge, Ad LIVE or frontend deployment. Unresolved: VIDEO poster feed/release approval, durable queue/deployed isolated worker, actual Founder Owner E5 & Android E3, official MP LGD G3 and exact production E7. Canonical P4-T034..T042 still 0/9 **FINAL PASS+LOCK**, `B7_ADVERTISEMENT.zip` BLOCKED.

## B7 ADS-011 11 Oct 2026 — Verified Video Poster on ONE Canonical Public Feed (Review Only)

- Exact code SHA `901b14954aa9e695134e497c19df91de3652e787`; candidate `38148390738` **18/18 SUCCESS**, protected Phase 3A+3B `38148390751` **2/2 SUCCESS** (real rollback-safe regressions). PR #5 remains DRAFT/UNMERGED.

- Extracted disabled-by-default `private.b7_ad_clean_public_origin` as SINGLE HOME via `db/20261011_b7_clean_origin_SINGLE_HOME_REVIEW_ONLY.sql`, reused by original Owner image approval and video poster lookup. No duplicate origin settings or parallel public ad picker.

- Added `db/20261011_b7_canonical_public_video_poster_REVIEW_ONLY.sql`: same original `public.jb_ad_public_feed(text,text)` now returns *ninth* `poster_url` for video only when canonical Creative approved, existing private 3-asset video receipt, first-party clean release SHA/path, OwnerID, latest version, media URL and origin all match. **NO** raw/video hotlinks, standalone poster RPC or fallback. Unverified video returns ZERO rows, fail closed. Legacy `jb_public_active_ads` remains same seven-field alias to the original picker. Return signature changes through **transactional DROP RESTRICT**, not CASCADE: unknown dependents abort. Requires coordinated source/deployment review before any LIVE cutover.

- Actual PostgreSQL E2 `ci/phase4/b7-video-poster-single-feed-regression.sql` reuses existing paid/geo/campaign/creative source. Positive: ONE original anonymous homepage video with SHA-bound safe poster, anonymous cannot EXECUTE private helper, legacy alias still works. Negative: receipt alone never approves, origin disabled kills video, approved-looking HTTPS foreign URL denied, payment-before-approval guard preserved; E2 transaction ROLLBACK.

- RED->RCA->FIX: first new feed suite lacked actual old Owner Creative approve RPC required by existing release migration; installed exact old fixture (NO alternate authority). Second failure `APPROVED_CREATIVE_REQUIRED` from canonical payment guard fixed E2 operation order (pending receipt -> simulated approval -> payment), no payment gate weakened. Third failure 42501 from anon using text regprocedure without private schema USAGE; used pg_catalog OID for real anon EXECUTE privilege test, no grant enabled.

- Still DUE: **actual canonical Owner video approval** with signed E5 and tested paired `poster_url`, a safely deployed private worker/durable media queue, real public clean bucket and private asset migrations, real Android E3, official MP LGD, exact Production E7, Founder-reviewed B7 Final Tests. No Production SQL/storage writes, ad LIVE, or PR merge. Canonical P4-T034..T042 remain **0/9 FINAL PASS+LOCK**; `B7_ADVERTISEMENT.zip` is **BLOCKED**.
