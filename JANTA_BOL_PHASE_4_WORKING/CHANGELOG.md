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

## 2026-10-10 — B7 T041 hardening: Owner retry race + timestamp-accurate retention (REVIEW ONLY)
- Reproduced the independent risk: `FOR SHARE` allows two Owner sessions to race the same failed notice, creating duplicate retry-succeeded audit records even if B3 dedupes notification content. Changed only the Owner retry audit row lock to `FOR UPDATE` and added a real two-psql-session CI test with controlled 1-second B3 stub delay; assert exactly ONE success audit and ONE in-app receipt. No immutable history mutation and no external provider claim.
- Fixed evidence-retention mismatch: new `ad_history` insertion formerly used registration clock rather than original `created_at`. Align with preexisting historical backfill; reject invalid timestamp, mark already overdue records DUE without physical purge. E2 covers 60- and 2600-day backdated imports and preexisting HOLD.
- Added suspended B3 Owner-recipient negative fixture (real LIVE B3 reads `team_accounts.status`): no notice to suspended account; request remains and sanitized immutable failure recorded; reactivate within disposable fixture and retry once. No LIVE account/session altered.
- Preserved previous paid ad, notification B3, Article URL, editorial analytics, old RLS and all protected Phase3/Phase4 checks. Strengthened T123 exact `FOR UPDATE;` signature contract, not a broad allowlist bypass. **All changes Draft PR #5 only, Production unchanged; P4-T041 not final PASS/LOCK.**



## 2026-10-10 — B7 P4-T041 deeper proof against original B3 migrations (DRAFT / NOT DEPLOYED)
- Previous CI's synthetic B3 stub was not sufficient to validate the existing B3 engine's real IN_APP delivery history, retained notification records and content/priority guards. Added a **14th Candidate CI job** that installs original B3 SQL migrations unchanged in disposable PostgreSQL and performs end-to-end B7 notification tests against them. No parallel emitter was created.
- Detected and corrected stale-notification truth bug: a failed `ad_live` receipt retried after a campaign was HIDDEN would advertise the wrong current state. Owner retry now consults canonical campaign/current verification/payment state; stale state is reported generically as an Owner workflow-review notification, while immutable original failure and appended success audit record both original and effective event names.
- Added negative evidence: malformed audit UUID denied, post-HIDE old LIVE cannot reappear, B3 sender rejects tokens/passwords, revoked Owner gets no notice, real B3 history/retention registers exactly once.
- RCA: first source patch accidentally used JavaScript replacement-string interpolation of SQL `$'` regex, corrupting migration length and causing Candidate RED at 38068722555 and 38068766516. Reconstructed source safely from last verified GREEN `3a0bca06...` and checked one complete migration/functions/UUID regex before commit `9b1280a8`. The concurrency fixture incorrectly expected old `ad_hidden` from an actually approved campaign; updated the fixture to `ad_approved` matching backend state, preserving race assertions. No Production effects or CI bypass.
- Candidate job **38068932569**, SHA `7342dbc2cb753f39b73e308475c778c2e4c545fb`: **14/14 GREEN**, including real B3 emitter and two-session SQL lock proof. Protected workflow was still being checked when preparing this note; do not claim its final result without new tool check. B7 P4-T041 remains IN PROGRESS, not final PASS/LOCK, PR #5 DRAFT.


## 2026-10-10 — B7 ADS-046/052/056/060 safe source fixes + final ZIP proof gate (REVIEW ONLY)
- Source inspection of actual Supabase `jb_ad_save_creative_internal` and `jb_ad_approve_creative_internal` revealed hard conflict with REVIEW-only approved creative immutable trigger. Previous trigger denied old approved=true row updates; actual Owner version rotation revokes existing approved rows first. Minimum safe redesign adds sticky approved_once to existing creative rows and guards actual payload and version forever, while allowing AAL2-controlled approval status transitions. Existing old approval events backfill historic sticky state. Approved media cannot be deleted; unapproved drafts editable. Synthetic positive/negative isolated PG tests added.
- First CI divergence: modifying shared `b7-payment-fixture.sql` introduced duplicate media_url against weighted fixture (candidate RED). Reverted shared fixture to last GREEN and restricted new columns to b7-retention-fixture. Actual previous GREEN candidate 38070006423 and protected run 38070006421 confirm all 14 jobs and protected baseline on exact SHA 41f8bf95; newer work requires full re-run.
- Risky CTA/local asset root: previous frontend `safe()` accepted HTTPS IP loopback/intranet, and server ticket click receipt accepted approved localhost destinations. Both now reject IP-literal, localhost, .local, .internal, dotless and credential URLs. Added click and browser regressions. Old static P4-T035 source checker requires exact `u.protocol==='https:'`; logically equivalent source spelling restored rather than weakening or skipping checker after temporary candidate RED.
- Introduced new 60/60 ADS + nine canonical ID evidence manifest and fail-closed final ZIP builder preflight: no mock, CI green, screenshotless or deploymentless "B7 100%"/PASS/LOCK. Full Founder E3/E5/E7 and provider E6 still DUE; final ZIP explicitly BLOCKED.
- All files on isolated Draft PR #5, Production untouched, News FIRST / Ads SECOND, canonical permanent Article URLs preserved.



## 12 October 2026 — B7 Founder approved media draft safety and local preview (NOT DEPLOYED)
- Verified Last HEAD/PR/15-job protected and Candidate baseline. Rechecked LIVE Supabase RLS broad anonymous storage policy remains present; production fix still held for Founder/security decision.
- Found a real source deviation while reading B7 Master: old Owner Creative SAVE RPC immediately approved pending media/text and revoked old currently LIVE ad. Reproduced old exact server code in real disposable PG, then coded a staged two-step Owner approval flow in the original two function signatures + approved_once sticky evidence trigger. Current ad survives all draft creation; new latest safe text draft goes LIVE only on Owner explicit separate approval. High-risk and external/raw media approvals intentionally fail closed until independent worker.
- Added Owner-gated backend capability handshake so frontend-only deployment against old autoapprove RPC cannot create silently approved advertisement. Updated `ads.html` to separate Save Pending DRAFT and Review latest + Confirm APPROVE; added browser-only JPEG/PNG/WebP/MP4 local preview with magic bytes, contain and silent video controls. Does NOT upload or strip EXIF/approve; full Media Studio still DUE.
- New isolated SQL and Node tests; additive 16th Candidate PostgreSQL job; kept all original protected tests. SQL patch interpolation RCA led to temporary RED, then intact source reconstruction (commit `3e7b91a7`) and complete Candidate 38108342059 GREEN **16/16**. Later commits require same-HEAD Candidate + protected GREEN.
- No Production changes, no PR merge, no final zip. Current B7 ~80% previous subjective estimate may change after full dependency review. Canonical final 0/9 PASS+LOCK. NO FAKE PASS, NEWS FIRST.


## B7 independent RLS RCA correction — no Production migration
- Discovered serious *assessment bug*: `b5_private_gateway_only` was labeled PERMISSIVE despite LIVE `pg_policy.polpermissive=false`. The previous synthetic model deliberately granted broader anonymous access because its policy `AS PERMISSIVE` did not match LIVE. No evidence was obtained of the claimed deployed anonymous exposure.
- Replaced potentially unsafe review SQL that dropped the live B5 restriction with a **zero-DDL audit**; edited fixture and positive/negative RLS checks to validate actual restrictive semantics, original Owner upload, Grievance gateway barrier and denial to anon/AAL1. Hypothetical permissive policy demonstrated only under transaction ROLLBACK. Workflow job title corrected; all old CI jobs retained.
- Historical false-positive report is preserved with a prominent superseding note and a new independent RCA document. Never claim production vulnerability/remediation, PASS or incident closure from incorrect or synthetic evidence. P4-T041 IN PROGRESS, final ZIP BLOCKED. E3/E5 and external public CDN tests pending.


## B7 continuation — independent Storage RLS correction and Android preview race hardening
- Verified exact latest GitHub branch and full previous protected+Candidate CI GREEN before coding. Independently inspected LIVE `pg_policies.permissive` AND `pg_policy.polpermissive=false`; corrected serious false-positive: B5 Storage policy is RESTRICTIVE and does not grant anonymous private editorial CRUD. Previous review-only code to drop it is now a ZERO-DDL read-only audit with ROLLBACK; no Production policy or data changed. Real vs hypothetical permissive negative SQL tests preserved separately and labeled truthfully.
- Added read-only storage policy metadata check to EXISTING protected live Supabase CI, no old regression removed, to catch source semantic drift. Historical incident report remains with explicit correction; no fake resolved breach.
- Coding: Android local ad media preview uses latest-file-wins per-container generation and cancellation on dispose/pagehide/Owner reload. Invalid current file revokes previous blob URL and clears stale image; old invalid media read can no longer blank new preview. Owner UI catches stale file errors without overwriting chosen current file. Deterministic isolated Node regression for races/cleanup; no media upload/EXIF/poster/server validation claimed.
- P4-T035/P4-T041/P4-T042 still IN PROGRESS, B7 final 0/9 PASS+LOCK and Final ZIP BLOCKED. Only exact final commit paired CI GREEN may be used as a technical checkpoint.

## B7 isolated safe URL and Homepage legacy approval hardening — source-only continuation
- Independently verified prior CI and PR Draft HEAD, traced missing backend media/CTA hostname check on Article and Homepage candidate selection. Added shared private `b7_safe_public_ad_https` guard (including numeric-shorthand IPv4, `localhost`, `*.local`, `*.internal`), reused it in both existing single-feed branches, and protected it conditionally in T123. Article geo INSERT guard now a protected conditional invariant too.
- Added real disposable PostgreSQL positive/negative checks: private/intranet media URL and CTA cannot be selected through legacy approved highest version; normal text ad remains eligible. Corrected synthetic PL/pgSQL returning-variable shadow after diagnosing Candidate RED 38111575320. Full Candidate 38111683892 SUCCESS 16/16, full Protected 38111683896 SUCCESS 2/2 on exact source `774fdd6aaafb7b47dca7916b2fb0815cf89fa307`.
- No B5 Storage policy changes, no LIVE DB migration, no PR merge or production ads. Staging URL safety is NOT media sanitation; verified official MP LGD import, server image/video worker, real Android/Owner/paid-ad E3/E5 and source-parity E7 still DUE. B7 0/9 Final PASS+LOCK and ZIP BLOCKED.

## B7 P4-T040 click policy single home + G3 MP official CSV preflight
- Started from `d859fb7b6939f4a57fd363ba72473e4ec5df8951` fully green. Found a second security divergence: old ticket-click regex could count numeric loopback alias web/map destinations the Article/Homepage renderer and G4 private helper disallow. Staged click RPC reuses same private helper with no API signature change. Added three targeted Postgres negative forms and no-ledger/no-ticket-consume assertions; conditional protected T123 now verifies no duplicate weak URL rule.
- Added offline LGD district/subdistrict CSV precheck requiring 55 MP districts, parent integrity, source-hash matching, canonical state code/name and recognizable official HTTPS source domain. Tests use invented synthetic rows only; no actual official rows or verified state imported. Output ALWAYS remains official_provenance=false / owner_verification=false / production_authorization=false.
- On coding HEAD `231d2852a0c1ba4184a0ff26540a63c87c0a2cf8`: Candidate CI **38112503709 SUCCESS 16/16** and Protected CI **38112503725 SUCCESS 2/2**. PR #5 still DRAFT, Production untouched, B5 RESTRICTIVE preserved, final P4-T034..T042 0/9 PASS+LOCK and ZIP BLOCKED. E3/E5/E7, real LGD source and image/video worker DUE. No fake completion.

## B7 G4 shared public URL HTTPS port hardening
- Follow-up RCA to click/link single-home: five-digit URL regex accepted `:65536` and `:99999`, which browsers reject. Safe minimum source fix enforces optional HTTPS port 1..65535 in the EXISTING private URL gate; Article/Homepage selection and click all consume same guard.
- New isolated invalid-port test cases cover E2 no eligible ad/no fraudulent click to unopenable destination, preserve good-port behavior and all previous anti-replay checks. Protected T123 updated conditionally without downgrading live 3A/3B security.
- Exact head `e8310c0cbd632d877fdba040e5c49e11756f930a` Candidate **38112739568 SUCCESS 16/16**, Protected **38112739610 SUCCESS 2/2**. No production change; final 0/9 canonical PASS+LOCK, ZIP BLOCKED, PR #5 DRAFT/UNMERGED.

## B7 ADS-015 real WASM image decoder preview (review-only)
- Added server-side magic/MIME/dimensions/pixel/PNG-CRC validation and pinned Magick WASM decoder/transcoder with no Storage/approval/public RPC. Actual preview pixel orientation normalization, private PNG re-encode, strict no-ancillary metadata proof and original+derivative SHA-256.
- Negative Node tests plus Deno real WASM tests include synthetic GPS text injected into image metadata, verified stripped; failures restored through independent RCA, not by weakening `orNT`/eXIf defense. Candidate 38113900702 17/17 SUCCESS on `9b6ace69080...`.
- Still DUE: private upload, Owner AAL2, immutable processed media ledger, protected public derivative, image Malware/Codec checks, video+poster, real Android E3/E5 and deployed E7, official LGD. No Production writes / no merge / no final ZIP. 0/9 canonical Final PASS+LOCK.

## B7 ADS-009/010/015 OWNER MEDIA HTTP PREVIEW — 11 OCT 2026
- Added isolated Owner HTTP private media-preview endpoint with canonical Auth + current Owner/AAL2 capability, byte-bound multipart, one-file real ImageMagick WASM PNG output, no-store and no-CORS. New code is REVIEW-ONLY, never deployed.
- Added true synthetic end-to-end POST -> Magick WASM -> clean PNG plus fake revocation, AAL1 denial, URL spoof, duplicate file, wrong Content-Length and oversized stream tests; fixed real strict TS compile RCA.
- Verified SHA 2cc2e04dd21e232ceda53c998b49512f3ae47246 Candidate 38114596493 SUCCESS 17/17, Protected 38114596457 SUCCESS 2/2. Production untouched, B5 RESTRICTIVE, current published ad 0. PR#5 Draft. Official 9/9 not passed, ZIP BLOCKED.

## B7 ADS-015 two private Storage buckets, immutable SHA receipts and B5 regression (11 Oct 2026)
- Added B7 private-only image quarantine stage (original+sanitized derivative SHA256 unique create-only keys, Storage readback, mandatory orphan-reconciliation sink contract, no public URL and NO approval), separate server-only private Supabase SDK adapter, REAL pinned Magick WASM synthetic stage regression.
- Added REVIEW-ONLY immutable private media receipt/orphan event tables tied to existing canonical ad_creatives and exact Creative version; service_role INSERT+SELECT only and append-only triggers even if hypothetical privileges widened under disposable rollback.
- Added REVIEW-ONLY two new private Original/Derivative Storage buckets and DENY/RESTRICTIVE policy that preserves existing News/Owner and B5 grievance policies. Disposable E2 checks future mistaken broad PERMISSIVE storage grant cannot access private B7 objects.
- Independently repaired actual RED failures from role privilege vs trigger expectation, PL/pgSQL id ambiguity, pg_policies name[] type, and three-arg set_config; all errors/CI retained in DEBUG-MAP.
- Exact source 26e783b2434cdee1e4171bb9fd33be7aaca9e0b0: Candidate GitHub run 38118203598 SUCCESS 17/17; Protected run 38118203562 SUCCESS 2/2. PR #5 stays DRAFT and UNMERGED. LIVE Supabase unchanged 5 campaigns/0 LIVE/11 creatives/B5 RESTRICTIVE, no B7 buckets/ledger. Stage durable register worker, E3/E5/E7, official LGD, real video and Founder signoff all DUE; 0/9 P4-T034..T042 final PASS+LOCK, B7_ADVERTISEMENT.zip BLOCKED.

## Coding checkpoint: B7 ADS-015 11 OCT 2026 — REVIEW ONLY. Source 8756d39e3353280baaefdc3598cc3a96370db320. Candidate CI 38120325295 SUCCESS 17/17. Protected run 38120325252 verify separately. Added canonical Creative latest-draft + Owner AAL2 recheck AFTER private WASM Storage SHA readback; restricted service_role-only receipt/orphan RPCs to existing private append-only ledger, no other Creative SOT. Verified negative synthetic session-revoke, stale draft, forgery and absent DB migration. New private evidence trigger locks canonical campaign FOR UPDATE to serialize against Creative SAVE/APPROVE. Real E3/E5, original/derivative LIVE buckets, real private worker, video/poster, E7 and Founder final approval DUE. P4-T034..042 0/9 FINAL PASS+LOCK. ZIP BLOCKED.

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

## 11 Oct 2026 B7 ADS-011: SINGLE FEED POSTER + ORIGINAL OWNER VIDEO APPROVAL (REVIEW ONLY)

- Verified code SHA `b800c4d049ce62f2ae80e738d124ecd0bb1b0e3c`. Candidate CI **38148987486 SUCCESS 18/18**, protected Phase 3A+3B **38148987509 SUCCESS 2/2**. Original PR #5 remains DRAFT and UNMERGED. These are isolated/synthetic E2 proofs, NOT real Founder E5, device E3 or deployed E7.

- First-party Clean Origin is SINGLE HOME (`db/20261011_b7_clean_origin_SINGLE_HOME_REVIEW_ONLY.sql`, disabled by default). Image Owner approval and video poster selector reference exactly this source; no duplicate Origin authority.

- Rebuilt the **ORIGINAL** `public.jb_ad_public_feed(text,text)` with 9th `poster_url` field while preserving its original legacy 7-field alias. SQL `db/20261011_b7_canonical_public_video_poster_REVIEW_ONLY.sql` recreates functions transactionally with DROP RESTRICT, never CASCADE, so unreviewed dependencies cause ROLLBACK. Public Video eligible ONLY with SHA-verified private originals/encoded MP4/PNG poster, Owner-matched immutable clean release, latest canonical Creative approved, canonical first-party MP4 URL and enabled Origin. Otherwise VIDEO excluded, news body remains readable. No parallel ad selector.

- Original SAME Owner approval `public.jb_ad_approve_creative_internal(uuid)` now has review-only candidate `db/20261011_b7_owner_video_atomic_approval_REVIEW_ONLY.sql` integrating VIDEO and POSTER SHA; Owner/AAL2, publisher locks, pending/latest Creative, risk/advertiser verification, original approved creative retained until new verified approval, history append-only and duplicate-tap idempotence unchanged. After UPDATE to approved it calls the SAME verified poster helper; missing/forged poster aborts the entire SQL approval transaction. Image approval continues unchanged.

- Real PostgreSQL17 disposable E2 `ci/phase4/b7-video-poster-single-feed-regression.sql` verifies one authentic 9-field public video, legacy alias, default-off origin / fake URL / anonymous helper privacy. `ci/phase4/b7-owner-video-atomic-approval-regression.sql` verifies missing private ledger refusal, missing origin refusal, old approved creative sticky, genuine synthetic SHA-matched Owner VIDEO approval, mandatory exact poster, once-only history and new draft not preempting existing approved ad. Tests ROLLBACK all synthetic state.

- RED->RCA->FIX independent trace: (1) shared clean release migration failed because isolated feed CI omitted original canonical approval fixture; restored actual preexisting RPC test source. (2) payment evidence required prior approved Creative; reordered E2 synthetic approval before payment without removing guard. (3) anon had no private schema USAGE for textual function resolver; privilege tested by pg_proc OID without granting access. (4) PL/pgSQL E2 `approved` variable collided with ad_creatives.approved column, renamed synthetic record only. No shortcuts, skipped tests, or downgraded security.

- STILL DUE: no genuine Founder Owner E5, no Android E3, no Supabase production Storage/SQL migrations, no deployed isolated media worker/durable queue or production first-party media objects, no official MP LGD, no E7 deployed exact-source check; canonical P4-T034..042 still **0/9 FINAL PASS+LOCK** and `B7_ADVERTISEMENT.zip` **BLOCKED**. No Production writes, no ad LIVE/merge. Only isolated CI E2 verified.


## 12 Oct 2026 B7 / ADS-011,015 — REAL FFmpeg PNG POSTER PRIVACY RCA (REVIEW ONLY)

- Independent current source: branch `codex/b7-blueprint-20261010`; code+test commit `c655d56e18c16f0a313d3e5744cc960106a2836c`. Candidate 18/18 jobs **SUCCESS**: GitHub Actions 38203831368. Protected Phase3A+3B on same SHA: 38203831494 started; **do not claim SUCCESS until completed and checked**. Earlier candidate 38203613186 **FAILED** after the stronger real poster check; RED preserved.
- FIRST DIVERGENCE: existing H.264/AAC video sanitizer checked generated poster's PNG **8-byte signature only**. An FFmpeg poster carried real ancillary `pHYs` after `-map_metadata -1`; the hardened canonical `inspectCleanPngContainer` correctly refused it. This is benign pixel-density metadata but conflicts with the locked derivative privacy policy. Reproduced using actual FFmpeg-generated `IHDR,pHYs,IDAT,IEND` and inspected chunk boundaries/CRC; source failure code `B7_VIDEO_POSTER_CONTAINER_OR_METADATA_UNVERIFIED`.
- MINIMUM SAFE FIX: reuse the **existing** `b7-media-byte-policy.mjs` strict PNG validator; on the trusted FFmpeg output remove ONLY one `pHYs` chunk after validating its length (9) and CRC32, never relax the clean-PNG policy. Disallow duplicates, malformed/trailing bytes, unknown ancillary chunks, impossible poster dimensions, and keep original JPEG/News/B5 code untouched. SHA-256 is computed on the final scrubbed private poster bytes.
- REAL isolated test: `ci/phase4/b7-video-sanitize.test.mjs` verifies actual FFmpeg H.264/AAC output poster has no ancillary metadata, validated width/height <=800 and encoded video, rejects trailing synthetic GPS-like polyglot bytes; all earlier private Storage readback, revoked Owner, orphan and media approval negative cases remain. All results are only private quarantined candidates, **never approved or LIVE**.
- Actual Supabase READ-ONLY 12-Oct: 5 campaigns, 0 LIVE, 11 Creative records, 1 previously approved, 0 B7-specific Storage buckets; original `b5_private_gateway_only` remains **RESTRICTIVE**. PR #5 DRAFT/UNMERGED. **No production SQL/Storage mutation, deployment, Founder E5, Android E3 or source E7 release**.
- Official P4-T034..T042 = **0/9 FINAL PASS+LOCK**, all ADS-001..060 final evidence DUE, `B7_ADVERTISEMENT.zip` BLOCKED. Unfinished major gates: actual secure file ingress + isolated durable private queue worker, reviewed staged migrations/first-party verified media release, official MP LGD district+tehsil data, real owner AAL2 and Android, Vercel exact source deploy proof, final signoff. E6 external payment provider remains explicit DUE.


## 12 OCT 2026 — B7 ADS-011 PRIVATE POSTER pHYs BOUNDARY / EXACT CI

- Branch `codex/b7-blueprint-20261010` E2 source commit `8bde94c67c891c4a0585b1596415c9e3126f93df`. GitHub Candidate workflow **38204239346 COMPLETED SUCCESS (18/18)** and original protected Phase 3A+3B **38204239352 COMPLETED SUCCESS (2/2)**, independently read from GitHub on this **exact same SHA**. Earlier hardened-poster E2 fixture 38203613186 was genuine RED; fixes were followed by 38203831368/38203965596 green and final 38204239346 green. Preserve RED evidence.
- Additional minimum-safe hardening: reusable `stripFfmpegPosterDensity` now accepts at most one FFmpeg `pHYs` chunk of **exact nine-byte payload and valid CRC32**, situated only **after IHDR and before IDAT**; duplicate, corrupt, post-IEND, or out-of-order pHYs fails closed. It never suppresses an unknown metadata chunk or extra trailing polyglot bytes. The unchanged canonical `inspectCleanPngContainer` verifies the complete final PNG; SHA256 and private receipt match these stripped real poster bytes.
- `ci/phase4/b7-video-sanitize.test.mjs` generates an actual H264/AAC video via FFmpeg, obtains its actual clean poster, injects a valid pHYs chunk with CRC, confirms exact lossless stripping and tests CRC corruption, duplicate, post-IEND, and forbidden ancillary denial; earlier Owner revocation, private storage readbacks, stable Creative/version and immutable evidence tests remain active. No media approval/public exposure is claimed.
- CURRENT FINAL B7 STATUS UNCHANGED: P4-T034..P4-T042 = **0/9 FINAL PASS+LOCK**. Mandatory LIVE Supabase media migrations, isolated durable worker/queue and Owner upload binding, official LGD MP district/tehsil, real E3 Android, Owner E5+AAL2, exact deployment E7 and Founder signoff **DUE**. E6 provider remains external DUE. PR #5 DRAFT / UNMERGED, no Production SQL/Storage mutation, no B5 policy change, no paid LIVE campaign, **B7_ADVERTISEMENT.zip BLOCKED**.


## B7 / 12 OCT 2026 — PRIVATE MEDIA QUEUE + SPCK DRAFT SAFETY (NOT FINAL PASS)
- Exact code HEAD: 976d054a7bb981c6001dfdd8c23adabaa4448e21, PR #5 Draft / unmerged. No production SQL, bucket, advertiser, payment or LIVE updates.
- CODE: CODEX_CURRENT_SUPABASE/functions/_shared/b7-private-media-command-queue.mjs; private media command source-only with existing Owner AAL2 active-session checks, canonical latest Creative check, private source SHA256 readback, durable lease/retry/reconciliation and existing immutable evidence receipts; no persisted Owner JWT/media bytes/public URL. This code is NOT an operational public gateway, and neither worker nor media uploading is deployed.
- SQL: JANTA_BOL_PHASE_4_WORKING/db/20261012_b7_private_media_durable_queue_REVIEW_ONLY.sql. Private service-only durable queue, lease and receipt-based completion, atomic idempotency, strict revokes from anon/authenticated, append-only failure audit. NOT applied to live Supabase.
- SPCK: ads.html fails closed if Owner selects a LOCAL-only phone image/video and tries to Save DRAFT; source-only local preview must not be misrepresented as uploaded. URL-only guarded Creative draft path preserved.
- REAL E1/E2: Node synthetic and isolated disposable PostgreSQL. Candidate RED run 38208827410: exact PL/pgSQL id variable shadowed campaign id, fixed by renaming to v_job_id; no checker disabled. Corrected Candidate 38208896353 = 20/20 SUCCESS; protected Phase3A+3B 38208896421 = 2/2 SUCCESS, same engineering SHA.
- Outstanding: actual authenticated Owner browser-to-server upload command gateway, separated production/staging worker + buckets + migrations, verified LGD geography, Article-ID public-feed/analytics atomic cutover, deployed E7 parity, real Android E3, real Owner AAL2 E5 and Founder signoff DUE. E6 external provider DUE.
- FINAL STATUS remains P4-T034..P4-T042 0/9 FINAL PASS+LOCK; ADS-001..060 NOT finally closed. B7_ADVERTISEMENT.zip FINAL BLOCKED. SPCK ZIP is UI TEST BUILD ONLY. B5 RESTRICTIVE grievance policy, Article canonical URL and all protected Phase3 features preserved.



## B7 Android E3 UI consolidated batch — 12 Oct 2026, code d12ece4
- RCA from Founder Android screenshots 6023..6039 and exact `ads.html`/`ad-media-preview.js`: creative type was not bound to byte-inspected local file type, previous blob preview and chooser persisted across type changes, stale CTA destination survived Website→No CTA→Call, and Owner phone inputs were cramped.
- SOURCE CHANGES (commit `d12ece4db263816e48375fc5abce79e0ebf3884b`): `JANTA_BOL_PHASE_3C_WORKING/ads.html` now invalidates previous local preview/blob and chooser when switching Image/Video/Text, blocks incompatible file types using `stage(box,file,requested)`, adds a local Remove action and change-driven stale-status reset, hides Text media controls, clears incompatible CTA targets and uses CTA-specific field labels/HTTPS-or-phone local validation, and stacks Owner controls with mobile 44px tap targets. `JANTA_BOL_PHASE_3C_WORKING/ad-media-preview.js` rejects byte-inspected kind mismatch before creating preview blob (retains local-only fail-closed semantics).
- REGRESSION ADDED in `ci/phase4/b7-media-preview-regression.cjs`: wrong file kind, type-switch preview teardown, CTA cross-type clearing, mobile layout and local Remove. Existing `ci/phase4/b7-spck-local-media-save-safety.test.cjs` preserved exactly and no local-to-server bypass added.
- REAL RED evidence: candidate run `38263533938` (commit 166c041) failed original URL-only Creative no-file control after stricter CTA regex was accidentally double-escaped; same issue persisted at test commit 6851c92 (`38263890303`). **First divergence traced to `ads.html` URL/phone regex escape, not a legitimate backend denial**. Only the two regex escapes corrected at `d12ece4`; no tests relaxed or disabled. Green proof: candidate run `38264147918` **20/20 jobs completed SUCCESS**, protected Phase3A+3B run `38264147842` **2/2 SUCCESS** on exactly same code SHA.
- ISSUE STATE: UI01..UI08 **SOURCE FIXED + CI VERIFIED**, but **DEVICE RETEST DUE** on an Android bundle built from this SHA; UI09 prior source fix still phone retest DUE. This is not Owner E2 backend proof nor final P4-T035/T042 PASS. Backend RPC/worker/queued media/official LGD/deployment/E5/E6 remain DUE. Source only on draft unmerged PR #5, no Supabase production DDL/DML, no LIVE, payment, advertiser, media upload or branch merge.
- OFFICIAL FINAL: P4-T034..P4-T042 **0/9 FINAL PASS+LOCK**; B7_ADVERTISEMENT.zip BLOCKED. DO NOT CLAIM a shipped Android fix until Founder tests a matching SPCK build.


## B7 A9/B16/C5 Founder regression reconciliation — code b82d0c1
- EXACT SOT index: `review/B7_20261012_CONSOLIDATED_ISSUE_PUNCHLIST.md`. Original 30 findings assigned A UI01..UI09 (9), B BE01..BE16 (16), C ENV01..ENV05 (5). Earlier ENV06 moved under BE16, full historical alias remains (no lost issues).
- Source-safe Owner changes: 1) media-type mismatch/race cleanup, explicit local remove and CTA target reset/responsive mobile; 2) `phase4-domain-client.js` positive `approved/payment_pending/live` transitions denied without a future audited `B7_LIFECYCLE_PROTECTED_V1` Owner backend sentinel; emergency HIDE/PAUSE/REJECT/CANCEL still call original owner-gated backend; 3) sanitized Owner diagnostic classification for missing backend RPC vs denied AAL2 vs unknown failure, no raw secret/error leak; 4) same-tab local advertiser portal link.
- NEW independent CI: `ci/phase4/b7-lifecycle-client-gate.test.cjs`; `ci/phase4/b7-owner-readiness.test.cjs`; `ci/phase4/b7-issue-coverage.test.cjs`. Candidate source/boundary at commit `b82d0c1d7b3876707d8e93fc193050cecc533904` GitHub run `38272166326`: **20/20 SUCCESS**; protected Phase3A+3B `38272166443`: **2/2 SUCCESS**. Existing safety check not disabled. Prior RED `c470a3b` protected run `38271443461` (legacy expected `unavailable` word) fixed minimally at `64b8c559`, not suppressed.
- READ-ONLY live database snapshot: project `vrffsnkycvjithwtiylt` matches SPCK config; **five Owner RPCs missing** (`jb_ad_qualified_analytics_internal`, `jb_ad_notification_failures_internal`, `jb_ad_notification_retry_internal`, `jb_ad_owner_renewals_internal`, `jb_ad_owner_change_requests_internal`); 0 `ad_packages` rows (legitimate empty), 5 campaigns, 0 LIVE, 0 B7 private buckets. Live legacy `jb_ad_transition_internal` lacks some modern verified-media/receipt/schedule/inventory gates; browser safety interlock **does not fix server authority**, strict server replacement + sentinel must be staged before E7.
- Source candidates and disposable PG/real isolated WASM/FFmpeg CI are useful E1/E2 isolated evidence, **NOT live E2/E5 or production release**. Required: actual Owner AAL2 private upload/queue/worker, backend migrations, verified LGD geography, real Android E3 after importing exact SHA SPCK candidate, audit E5, final E7, provider E6. Founder permission required for production deployment; no production DDL/DML made.
- B7 final canonical P4-T034..P4-T042 **0/9 FINAL PASS+LOCK**, final `B7_ADVERTISEMENT.zip` blocked. Original public Article URL, B5 restrictive grievance RLS and protected branch baseline not deliberately changed. PR #5 Draft/unmerged; Cricket repository unmodified.



## BE07 isolated Owner lifecycle guard CI checkpoint — 12 October 2026
- User authorized **A only**: GitHub Actions + disposable PostgreSQL, no new Supabase Staging and no production DB migration, developer-credential changes, old files reset, PR merge, LIVE, payment, Cricket backend or real advertiser edits.
- New **review-only** additive SQL `JANTA_BOL_PHASE_4_WORKING/db/20261012_b7_lifecycle_state_guard_REVIEW_ONLY.sql`. Uses existing single ad_campaigns/ad_creatives/ad_payments/advertisers and requires the original pre-existing `private.b7_campaign_live_guard`; does not change original RPC source or drop any old trigger. Adds private verified status trigger for Owner AAL2, approved text creative, verified advertiser, positive transition order, real structured receipt matching agreed quote and live schedule. Image/Video deliberately fail-closed until private worker and approved public release; no `jb_ad_lifecycle_capability_internal` sentinel yet. Owner emergency HIDE/PAUSE/REJECT/CANCEL preserved. Uninstalled source-only candidate, **NOT LIVE E2/E7 PASS**.
- CI: disposable PG17 `ci/phase4/b7-payment-fixture.sql` + EXISTING `20261010_b7_manual_payment_REVIEW_ONLY.sql` + new SQL + `ci/phase4/b7-lifecycle-state-regression.sql` in a single transaction ROLLBACK. Tests deny unauthenticated, direct approved→LIVE, high-risk pending, no creative, fake paid date, future/expired; positive approved text with **synthetic** quoted receipt under Owner; pause/resume and emergency hide. Synthetic payment never reaches real Supabase.
- RED RCA: candidate `38276019206` failed because preexisting alphabetically-earlier LIVE trigger correctly returned `AD_NOT_ELIGIBLE_FOR_LIVE` instead of the new guard's custom error. `38276171939` caught same first-divergence on forged paid date. Did **not** disable or replace the original safety guard; tests now explicitly require both guards and accept only the two known fail-closed error paths. Strict no-fake-proof.
- GREEN exact engineering SHA `0ef8073bda8e8226ba45e647e5dd7046354abf1d`: new **lifecycle PostgreSQL isolated job SUCCESS**; Candidate workflow `38276288709` recorded `completed/success` and 20/21 individual job conclusions separately show SUCCESS (one other original isolated PostgreSQL job was still reported running at documentation check — do not claim 21/21 individual proof until confirmed); protected Phase3A+3B workflow `38276288702` `completed/success`, prior run `38272720697` `completed/success`. No test suppressed.
- Official P4-T034..P4-T042 **0/9 FINAL PASS+LOCK**; B7 ZIP FINAL BLOCKED. Source+disposable candidate ≠ authorized staging, actual Owner AAL2, Android E3, media worker, first-party LGD, E5 audit, E6 provider, E7 deployment.



## B7 BE08 Owner schedule integrity — candidate evidence 4ffd3161
- New additive private window integrity + audit trigger `JANTA_BOL_PHASE_4_WORKING/db/20261012_b7_schedule_integrity_REVIEW_ONLY.sql`. Single existing `public.ad_campaigns` source + original `jb_ad_schedule_internal`, `ad_history` and BE07 payment/lifecycle triggers preserved. This is **SOURCE-ONLY**, not installed on real Supabase.
- Disposable test files: `ci/phase4/b7-schedule-legacy-source-fixture.sql`, `ci/phase4/b7-schedule-integrity-regression.sql`, isolated CI job `b7-schedule-postgres`. Negative Owner-AAL2, initial schedule forgery, past/partial/backward, sold/hidden edit, original audit/history preserved; positive synthetic Owner future schedule; DB transaction rollback. No real advertiser or production data.
- RCA: candidate RED run `38277959703` exact live RPC fixture whitespace differed from strict guard preflight; corrected fixture only, no guard relaxed. Last code SHA `4ffd3161c7dbdd4b4fb784d138c6492c56e0ff0e`; Candidate `38278183871` 22/22 jobs SUCCESS and Protected Phase3A+3B `38278183827` 2/2 SUCCESS. Native Android/backend/production evidence DUE; 0/9 final tests PASS+LOCK. No B7 final zip, PR #5 stays Draft.
