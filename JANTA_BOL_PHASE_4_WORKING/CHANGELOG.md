## B7 T037 partial checkpoint — 10 Oct 2026 (NOT PASS)

Canonical `codex/b7-reconcile-20261009` package UI commit `fc4e6fa0d16770b3cdbe1f6806bb7ef5f7c1b334` modifies `JANTA_BOL_PHASE_3C_WORKING/ads.html`, `phase4-domain-client.js`, and extends `ci/phase4/b7-client-regression.cjs`. Owner/AAL2 existing package RPC, active-only booking dropdown, price minor/version/weight display and client validation were wired to the existing B7 backend, with no new authority home. Exact GitHub source passed 16 isolated V8 assertions; this is not final Node CI or real E3. Read-only live Supabase audit: 0 packages, 0 package versions, 5 campaigns, 0 LIVE, plus confirmed Owner package RPC and RLS/grants. A proposed weighted public-feed query planned successfully under EXPLAIN and a 4000-draw fixture returned 997/3003 selections (approximately 1:3), but this is NOT actual live rotation proof. REVIEW-ONLY SQL candidate commit `57d5d460d93d7a1393d08de3b3c9d255334638b5` is stored at `JANTA_BOL_PHASE_4_WORKING/review/b7_t037_weighted_feed_REVIEW_ONLY.sql`; NOT deployed or applied. Vercel READY preview target=null for client SHA, not production or Android evidence. Inventory/visibility caps, authenticated package-create/price-snapshot tests, staged weighted rotation, full protected CI, E2+E3+E5 remain due. No Production DB data/permission/DDL change; no B8 changes. **P4-T037 IN PROGRESS — NOT PASS / NOT LOCKED.**

# JANTA BOL — PHASE 4 CHANGELOG

## 2026-10-10 - B7 continuation

- Fix supported Article-district targeting and device-time schedule serialization/display.
- Add 22 isolated behavior checks to both workflows.
- Repair duplicate historical T034 row that broke B0 governance at previous HEAD; retain original checker.
- Record Vercel scope 403, unavailable local browser and outstanding Android/LIVE gates without granting PASS/LOCK.

## 2026-10-01 — B0 START

### Baseline
- Protected Phase-3 source branch: `phase3-regression-ci`
- Protected Phase-3 baseline SHA: `8cbd22b7560f3fc49ecabeabbe88e0c61d9672b8`
- Verified baseline workflow: `Phase 3A + 3B Regression`
- Baseline workflow run: #202
- Baseline conclusion: SUCCESS

### Working branch
- Created `phase4-execution-2026-10-01` directly from the protected Phase-3 baseline SHA.
- No Phase-3 application/backend code was changed to create the branch.

### B0 change — CI path protection
- Updated `.github/workflows/phase3-regression.yml`.
- Added Phase-4 execution branch to push coverage.
- Added Phase-4 working folder to path coverage.
- Added `phase3-regression-ci` as a PR base that triggers the protected workflow.
- Existing static and Supabase regression jobs were preserved.

Reason:
A Phase-4 file placed outside the old watched paths could otherwise be pushed without automatically running the protected Phase-3 workflow. B0 closes that governance gap before feature coding begins.

### B0 records created
- `JANTA_BOL_PHASE_4_WORKING/README.md`
- `JANTA_BOL_PHASE_4_WORKING/CODE-MAP.md`
- `JANTA_BOL_PHASE_4_WORKING/AFFECTED-FILES.md`

### Product behavior
- No application feature code changed.
- No Supabase schema/data migration applied.
- No production secret/config changed.
- No existing test/checker weakened or deleted.

### Next B0 actions
- Create Phase-4 DEBUG-MAP and TEST-REGISTER.
- Add B0 governance CI checker.
- Ensure Phase-4 CI files themselves trigger protected Phase-3 CI.
- Run/verify protected CI on the Phase-4 branch.
- Close only the evidence-supported B0 tests; keep real-device/manual proof honest.

## 2026-10-01 — B0 CLOSED

### Evidence closure
- Protected workflow run #214 completed static/source regression and Supabase transactional regression SUCCESS.
- Phase-4 B0 governance checker completed SUCCESS.
- Founder real-device Android/SPCK Preview screenshot verified the JANTA-BOL Admin Dashboard renders with routine newsroom actions available.
- Existing unchanged Phase-3 Article UUID/Permanent URL lifecycle evidence was reused because B0 changed no application feature code or DB schema.
- P4-T001, P4-T002, P4-T003, P4-T004 are PASS.

### B0 final state
- Governance + CI Safety: CLOSED.
- Phase-3 protected baseline remains GREEN.
- Next execution block: B1 Team / Authority Extension — P4-T021–P4-T027.

## 2026-10-01 — B1 TEAM / AUTHORITY EXTENSION — TECHNICAL GATE GREEN

### Live backend
Applied:
- `phase4_b1_team_authority_foundation`
- `phase4_b1_team_api_security_context`
- `phase4_b1_t123_minimum_security_fix`

Added:
- canonical Team lifecycle metadata + append-only history
- active/suspended/departed state separate from stable Auth/Reporter identity
- public-name visibility control
- stale-client protection through current backend Team state
- server-only invite/activation/suspend/reactivate/role/depart/session-revoke authority
- existing Phase-3 Live suspend/revoke integration
- deployed `jb-team-api` v2 with JWT + current-session + Owner/AAL2 + recent-MFA mutation checks

Existing three Reporter identities were backfilled without duplicate Team identity.

### Frontend
- `reporters.html` upgraded to Android-first Team & Reporters management.
- Added `phase4-team-client.js`.
- Browser has no direct privileged Team RPC authority; it uses `jb-team-api`.

### CI / RED STOP
First protected B1 run exposed old Phase-3 T123 failure.
No old checker was weakened.
Architecture was tightened so direct Team RPC authority was removed from browser roles and public Reporter discovery no longer uses the privileged `jb_*` namespace.

Unchanged old T123 then passed.
Protected workflow run #246 completed:
- Phase-3 static/security suites GREEN
- Phase-3 Supabase suites GREEN
- B1 static Team regression GREEN
- B1 transactional Team/Authority regression GREEN

### Test status
- P4-T021 PASS
- P4-T022 PASS
- P4-T023 PASS
- P4-T024 PASS
- P4-T025 PASS
- P4-T026 NOT RUN — real Android proof required
- P4-T027 IN PROGRESS — final Team lock waits for T026


## 2026-10-01 — B1 CLOSED / B2 STARTED

### B1 final evidence
- P4-T026 real Android Team workflow PASS.
- Routine Public Name OFF -> ON worked without recent-MFA friction while backend Owner/AAL2 authority remained.
- High-risk Suspend with stale MFA was denied with `MFA_TOO_OLD`.
- Team API repository source was aligned with the repaired deployed runtime and redeployed as `jb-team-api` v8 with JWT verification.
- Generic external authenticated identity had no newsroom role and no direct Owner Team RPC privilege.
- Protected Phase-3 workflow run #269 completed SUCCESS.
- P4-T021–P4-T027 = 7/7 PASS. B1 CLOSED.

### B2 start
- Started B2 Common Audit + Retention — P4-T051–P4-T059.
- Source-of-truth scope: Master Blueprint Sections 395–480 / RUN-08.
- First action is implementation/data-model audit before schema/code changes: preserve existing audit/version/history/deletion systems, classify Preserve/Integrate/Extend/Add Missing, then make minimum safe changes.


## 2026-10-01 — B2 IMPLEMENTATION + AUTO REGRESSION CHECKPOINT

### Implemented
- additive common audit/retention/disposition foundation
- secret-sanitized audit lookup/export path
- protected audit immutability with locked Live routine-cleanup compatibility
- domain-owned retention policies + due/extension/hold/archive state/history
- retention-gated Permanent Delete + retired Article identity ledger
- public displayed-view ON/OFF/override state preserving raw analytics
- Android-first Records UI + server Records API
- service-only privileged Records RPC boundary

### Live verification
- `jb-records-api` v1 ACTIVE with JWT verification.
- Supabase migration ledger contains all four B2 migrations.
- Existing protected audit/version/Live-retention homes remain present and populated.
- Authenticated direct privileged Records RPC EXECUTE is denied.

### Regression
- Protected workflow run #296 SUCCESS.
- B2 static/security regression SUCCESS.
- B2 transactional regression SUCCESS.
- Old Phase-3 regression families remained GREEN.

### Test checkpoint
- PASS: P4-T051, P4-T052, P4-T055, P4-T056, P4-T058.
- IN PROGRESS: P4-T053, P4-T059.
- MANUAL NOT RUN: P4-T054, P4-T057.
- No final B2 lock yet.


## 2026-10-10 — B7 P4-T039 advertiser portal staged implementation (NOT PASS)
- Preserved all previously coded canonical campaigns, creatives, original ad sessions, renewal requests and payment security. No changes made to production database.
- Staged Owner-first advertiser portal: one-time temporary credential, a short-lived per-tab token, own campaign/approved creative projection, textual change requests ONLY; upload/media/geo approval remains Founder-controlled. Owner queue and decision do not flip approved versions.
- Added pending-only renewal through preexisting renewal ledger with token-bound actor provenance, no silent campaign extension, status/payment or slot change. Legacy authenticated advertiser renewal rows remain compatible in isolated fixture.
- Added dedicated disposable PostgreSQL negative/positive sessions A/B, revoked/replay, creative immutability, old JWT renewal preservation and Owner-only queues. Candidate CI includes new job; protected Phase3/4 CI remains mandatory.
- Final gate remains **IN PROGRESS**. E2 production parity, E3 Android, E5 actual notifications/audit and other B7 features are due. Never auto deploy staging review SQL; no P4-T039 PASS/LOCK and no B8.


## 2026-10-10 — B7-G3 Geography hardening / exact Article area matching candidate
- Started G3 from protected Phase-3+4 GREEN source commit `9c3ace9292290b87bba7ac2b753200ed55a30326`; did NOT rebuild B7 or touch Production.
- Created additive staging-review LGD district/tehsil schema with source versions, verified parent relation, canonical Article structured verified metadata and immutable exact campaign area grants. No real MP codes/district/tehsil data claimed imported.
- Added Owner/AAL2 protected Article geo proof, campaign grant and verified parent guards; one PRIVATE Article-ID-based eligibility matcher (not a second public feed). Unknown/blank/unverified tehsil fails closed; only reviewed National-unknown fallback allowed.
- Added isolated disposable PostgreSQL fixture and 25 Article-to-campaign positive/negative cases; directory/code mismatch, unverified tehsil, district-only vs tehsil-only, multi-district, no viewer GPS, paid-booking change denial, direct role/privilege denial, audit and no Article ID rewrite tested.
- Protected T123 security inventory extended with two exact reviewed Owner RPC names and conditional new geo-table security rules; all existing check logic preserved, not disabled.
- Full B7-G3 launch cannot be declared until the complete official 55-district and verified tehsil code catalog, production-compatible backend selection, Android E3 and E5 source proof are present. P4-T035 / P4-T037 remain IN PROGRESS, B7 NOT LOCKED.


## 2026-10-10 — B7-G4 weighted candidates and non-dilution inventory (NOT LAUNCH / NOT PASS)
- Built a purely PRIVATE Article-ID-weighted selection candidate without touching the legacy public advertisement feed or its Article URL. 1:2:3 package snapshot version weights tested in PostgreSQL; invalid paid, hidden, expired, wrong-district or malformed creative excluded.
- Built reviewed global per-placement capacity windows and immutable Owner-accepted guaranteed minimum reservations with row-serialized quota checks and evidence source. Concurrent additions serialize on the capacity row; no duplicate physical Article slots sold across overlapping windows.
- Added read-only synthetic E1/E2/E5 tests: 1000 forecasted fixture units → 600 + 400 reserved; +100/+1 rejected, extra campaign cannot dilute. Owned agreement change, expired/suspended, AAL1/no Owner and direct SQL denied; emergency Hide retains commercial commitment history.
- RCA: intermediate Candidate CI inventory fixture failed with ambiguous PL/pgSQL variable `id` instead of `w.id` (workflow 38056591494), corrected test variable qualification (commit `a0d475273cdc7f84c5700ee763f436377c314f59`) without suppressing a checker. Subsequent enhancements lock booked campaign price/scope/schedule and preserve emergency Hide.
- Inventory/weighted SQL all REVIEW ONLY and not deployed to LIVE; actual independent forecast evidence, full LGD official catalog, sale/payment/analytics verification, Android E3 and long-run fairness still required for canonical P4-T037.


## 2026-10-10 — B7 single public feed Article-ID gate (STAGING REVIEW)
- Preserved existing `jb_ad_public_feed(text,text)` and `jb_public_active_ads(text)` signatures, canonical Article ID/master URL, one paid ad slot, pinned open Article and existing article/news analytics independence.
- Added safe **review-only** canonical feed candidate: Article advert eligibility now sourced by published Article UUID on backend, never browser `district:`/local/GPS; homepage selection only by commercial MP/National grants with confirmed verified payment and package weight. Returned schema remains eight public-only columns.
- Added not-yet-active Article-ID adapter in existing `public-ads.js`. Paired production frontend/backend release is explicitly blocked until authoritative LGD catalog and downstream Android/analytics proofs; no accidental partial rollout.
- Added isolated `b7-single-feed-postgres` and 80 anonymous Article feed selections with wrong district, unpublished, malformed, legacy alias, RLS and one-paid-card checks. Reused existing synthetic paid/weighted/geo fixtures; all Production Supabase data unaffected.
- RCA of intermediate Candidate CI: test `max(uuid)` unsupported in PostgreSQL 17 (workflow 38058598024); corrected to `max(campaign_id::text)::uuid`. Subsequent test mistakenly resolved a private function signature under the `anon` role without schema USAGE (workflow 38058659207); changed fixture to catalog OID privilege lookup. Both errors fixed in the test, without skipping or weakening checks.
- New conditional security invariant added to existing T123 protected checker; no other P4 or Phase-3 tests removed. Full final B7/E3/E5 not yet complete; no migrations applied to production.


## 2026-10-10 — B7-T040 qualified ad impressions (review only, NOT PASS)
- Reconciled LIVE (read-only): old anonymous `jb_ad_event` / `jb_ad_record_event` allow direct fake campaign impressions; existing `ad_events` raw entries not human view proof. New source remains STAGING ONLY and does not touch Production.
- Added independent 50%-for-one-second IntersectionObserver, hidden tab and rapid scroll reset and stats-outage isolation. Added an unlinked Article-only handoff with crypto nonce and 3-minute one-use backend view token.
- Refactored previously-tested weighted candidate pool to one `private.b7_eligible_article_creatives` integrity source, shared with paid/geo/approved creative token issuance (no duplicated business rule).
- Staged Review SQL adds `ad_view_tickets` limited ephemeral token hashes, `ad_events.qualified` + ticket linkage in SAME ad metrics ledger, disables public raw writers if and only if the controlled migration eventually applies; Owner analytics distinct qualified claims from unverified historical raw entries. A server-enforced minimum 1-second dwell time and unique Article/open nonce block instant replay, not all bot fraud.
- Added 10 front-end deterministic observer tests, 8 browser handshake tests and isolated real PostgreSQL one-use/token/replay/hide/raw event and Owner negative tests; all existing suites still run. Stage schema rolled back after testing. Not linked to Article/Home production pages.
- Intermediate RCA: CI static false positive because a documentation comment named `ad_events` (run 38060102811), fixed comment without checker changes at `b1630b85`. SQL refactor corrupted by `String.replace` interpreting SQL `$'` dollar tokens; detected and rebuilt from exact previously GREEN `0859cdec...` source, safe fix `98f168cc`. Neither issue affected LIVE.
- Anti-bot/human verification, real 7/30d owner analytics, CTA clicks, homepage issuance, actual advertised network and Android E3/E5 remain OPEN. P4-T040 only IN PROGRESS.


## 2026-10-10 — B7 ADS-048 secure CTA click milestone (staged, NOT FINAL PASS)
- Added new REVIEW-ONLY `db/20261010_b7_cta_click_REVIEW_ONLY.sql`. Real selected Article ad CTA clicks can share the one-use view ticket; one click and one qualified impression can coexist under a composite ticket+event unique index in the canonical `ad_events` ledger. No new analytics collection or redirect authority. The backend checks the approved creative ID/advertiser campaign and validated website/map/call/WhatsApp target, server expiry and row-locked click consumed flag. Raw legacy stats remain unchanged.
- Client `ad-analytics-client.js` records only a trusted user interaction on the actual rendered link; programmatic/hidden/removed/defaultPrevented clicks fail closed. Navigation is not intercepted, delayed or replaced by analytics. Stats downtime isolated. `public-ads.js` passes the already approved CTA element to the dormant click module. No Production page imports this staging module.
- Added disposable PostgreSQL positive/negative tests for same ticket ONE impression + ONE click, forged/doubled/stale/not-approved javascript target rejected, plus Source/DOM CTA scheme coverage for valid https/call/WhatsApp/maps and invalid javascript/data/file/http/embedded credential destinations.
- Candidate CI run **38062318242 GREEN** on `c9c6e9a6be8e0a882b9d1b1cac4a30d9a89b9b03`; full protected run 38062318238 was IN PROGRESS when first inspected. Any later source changes require exact new HEAD receipts. No real Android E3 nor verified-human/billing proof; Founder approval and controlled staging parity are still required.


## 2026-10-10 — B7 T041 common notifications and retained commercial evidence (NOT LIVE / NOT PASS)
- Read-only audited the EXISTING B3 notification emitter, roles, live_notifications/notification_delivery_history/outbox and records retention policy `ads_history_v1` (2555-day, no auto disposition). No second SOT was created.
- Implemented REVIEW-ONLY normalized ads domain adapters into B3 for request, verification, quote/pay status, approved media, LIVE/HIDE/expiry and change/renewal notifications. In-app only, no external WhatsApp/Email/PUSH-sent assumption. If B3 outages, ad request/news/payment stays intact; a safe failure audit is preserved for explicit Owner AAL2 in-app retry (new on-demand Owner panel, never auto-spam).
- Retention guards: every new ad_history gets existing B3 record retention and immutable audit history; legacy ads_history backfilled using ORIGINAL created_at (no reset of due date). Preexisting legal HOLD/EXTEND never overwritten, no physical purge even after due. In-place approved creative or evidence-bearing campaign delete blocked; draft edit allowed; existing audit_logs security triggers untouched.
- Isolated Candidate tests now include `b7-notification-postgres` (12 simulated B3 owner in-app events, manual paid transition, safe provider outage and retry) and `b7-retention-postgres` (original-date backfill/HOLD/append-only/delete guards). All synthetic transactions ROLLBACK, not actual provider deliveries.
- RCA1: prior payment fixture hardcoded `auth.uid()` Owner even for anonymous-origin events (initial B7 retention CI RED). Fixed to true NULL actor in fixture, without touching security checker (`2e7290e9`). RCA2: PLpgSQL test variable `id` ambiguous with audit_logs.id caused notification test RED, corrected exact variable to `v_failure_id` (`b57b1add`). Both corrected by full Candidate re-run.
- Production unchanged; full Phase3/Phase4 protected and Candidate CI required GREEN on exact current head; E5 actual Role/AAL2/RLS parity, multi-worker/provider retry/retention disposal remains DUE. Canonical P4-T041 IN PROGRESS; no fake PASS or B7 LOCK/B8.
