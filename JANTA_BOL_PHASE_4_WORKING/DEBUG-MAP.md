# JANTA BOL — PHASE 4 DEBUG MAP

## 2026-10-10 B7 continuation

- T035 first divergence: Article normalization supplies `district`, but `scopeForArticle()` ignored it. Supported structured districts now select their matching ad scope; local/legacy behavior is preserved.
- T036 first divergence: `adSchedule()` forwarded timezone-free local fields to a UTC timestamptz RPC. India 09:00 became 14:30. Convert validated device time to explicit UTC; preserve backend errors and timezone configuration.
- HEAD CI regression: `162d1b3` added a historical `| P4-T034 |` row parsed as an extra canonical row. Rename its label; retain checker and prior evidence.
- Deployment blocker: Vercel detail/deployment access returns scope 403. A listed project is not deployed-URL/commit proof.

STATUS: ACTIVE
DATE: 2026-10-01
BRANCH: `phase4-execution-2026-10-01`

## B0-DBG-001 — Phase-4 CI bypass risk

### Symptom
The protected Phase-3 workflow watched only:
- `JANTA_BOL_PHASE_3C_WORKING/**`
- `CODEX_CURRENT_SUPABASE/**`
- `ci/phase3-regression/**`
- its own workflow file

A new Phase-4 folder could therefore exist outside those paths and a Phase-4 push could avoid the expected automatic protected regression run.

### Root cause
The workflow predated the Phase-4 working folder/branch.

### Minimum safe fix
Extend the existing workflow trigger to the Phase-4 execution branch and Phase-4 working paths, while preserving every existing Phase-3 static/database test step.

### Evidence
- Phase-3 baseline SHA before Phase-4: `8cbd22b7560f3fc49ecabeabbe88e0c61d9672b8`
- baseline run #202: SUCCESS
- Phase-4 branch created from that exact SHA
- workflow-only B0 commit made before feature coding

### Required retest
Protected Phase-3 workflow must complete GREEN on the Phase-4 branch after B0 records/checker are present.

### Status
FIX IMPLEMENTED / CI EVIDENCE PENDING

---

## B0-DBG-002 — Duplicate authority risk during Phase-4 expansion

### Risk
Grievance, Compliance, Ads, Accountability, Search, Notification and Retention work can accidentally create parallel copies of existing Article/Auth/Live/Audit identities.

### Prevention
`CODE-MAP.md` locks authoritative homes before coding:
- Article/PURL stays with existing article architecture
- Auth/MFA/session stays with existing backend authority
- Live stays with Phase-3 Live
- audit/history extends existing records
- recovery preserves existing business identities

### Status
PREVENTION MAP CREATED / VERIFY PER BLOCK

---

## B0-DBG-003 — Fake PASS risk

### Risk
A file existing, a plan being written, or code compiling can be mistaken for a completed test.

### Prevention
Official Phase-4 status states remain separate:
- NOT RUN
- IN PROGRESS
- PASS
- FAIL
- DUE
- BLOCKED

PASS requires the test's required evidence. Manual/real-device and external/provider evidence cannot be manufactured from code inspection.

### Status
RULE LOCKED / TEST-REGISTER ENFORCEMENT PENDING CI

---

## Debug handling rule

For every future bug:
1. Preserve evidence.
2. Record symptom and affected test IDs.
3. Identify root cause before broad rewrite.
4. Apply minimum safe fix.
5. Rerun the exact failed test.
6. Run affected Phase-3 regression.
7. Update CHANGELOG + TEST-REGISTER.
8. Only then mark PASS/LOCK.

---

## B1-DBG-001 — Protected Phase-3 T123 caught new Team RPC surface

### Symptom
Protected workflow run #233 stopped at old test `3A-P3-T123` after the first B1 Team implementation.

The old checker requires:
- no anonymous EXECUTE on any public `jb_*` function;
- no unreviewed authenticated EXECUTE on `jb_*` functions;
- privileged internal functions remain server/service-only.

### Root cause
The first B1 draft exposed new Team Owner wrappers directly to `authenticated`, and the public-safe Reporter directory used a `jb_*` name with anonymous EXECUTE. Both conflicted with the existing Phase-3 RPC boundary even though the functions had internal authority checks.

### Rejected shortcut
The old T123 checker was NOT weakened, deleted, bypassed or broadly whitelisted.

### Minimum safe fix
- Routed all Team browser actions through verified `jb-team-api` v2.
- Removed direct authenticated EXECUTE from Team `jb_team_*` wrappers.
- Kept internal Team mutation functions service-only.
- Renamed the public-safe read function from `jb_public_reporter_directory()` to `public_reporter_directory()`, preserving the existing rule that no `jb_*` function is anonymous.
- Added a server-only Team session-list internal function for the adapter.
- Updated B1 regression to assert the direct browser RPC boundary remains closed.

### Retest
- Old `db-function-security-regression.sql` rerun unchanged: T053 PASS, T123 PASS.
- Protected workflow run #246: Phase-3 function security PASS and B1 transactional Team/Authority regression PASS.

### Status
FIXED / EXACT OLD TEST GREEN


## B7-G3 / 2026-10-10 — Source→Authority→Negative Regression Map
- FIRST DIVERGENCE: Old `JBPublicAds.scopeForArticle()` and `jb_ad_public_feed(text,text)` accept a client-derived free-text scope and only the pilot districts, while the founder's locked geo contract requires verified published Article identity, full MP-55+tehsils and exact reviewed multi-area purchase. Do not silently broaden `global` or infer from viewer GPS/article body.
- ROOT: canonical `articles` lacks trusted structured verified tehsil/district codes and ad bookings have single legacy free-text `scope`. No LGD directory/area grant model exists in LIVE Supabase (read-only schema audit 10 Oct).
- MINIMUM-SAFE CANDIDATE: `db/20261010_b7_geo_targeting_REVIEW_ONLY.sql`: optional fields on canonical Article, authenticated reviewed MP LGD directory placeholders, exact Owner grants, immutable paid terms and private `b7_geo_matches_article()`. Zero application to Production; current public feed remains exactly as before until all downstream guards, data imports and tests are approved.
- NEGATIVE PROOF: `ci/phase4/b7-geo-regression.sql` checks Gwalior ≠ Pichhore, district-only ≠ tehsil, mismatched/unverified parent, unpublished Article, legacy district text mismatch, unverified-only reject, paid campaign grant refusal, unauthorized Owner/AAL1/direct SQL, and private data access; synthetic only.
- REMAINING STOP-GATES: official verified LGD complete import and cross-check, secure Article metadata Owner UI, sanitized one-public-feed Article-ID binding, original public RPC compatibility hardening, package versions/rotation/inventory, actual Android E3 and audit E5, protected full CI on final SHA.


## B7-G4 2026-10-10 — No-oversell and weighted selection RCA
- FIRST DIVERGENCE: Existing LIVE `jb_ad_public_feed(text,text)` selects by client scope and newest approved creative; it does not implement verified Article-ID area grants, package-weight fairness, capacity reservation, or a linked qualified impression commitment. Existing `ad_packages`/`ad_package_versions` must be preserved, not recreated.
- MINIMUM SAFE RECONCILIATION: New *private* `b7_weighted_article_candidate(uuid)` checks Owner-reviewed geo + existing canonical campaigns/creatives/payment/package version. The old standalone review weighted SQL with `p_scope` is never auto-applied. No new public feed/area SOT.
- INVENTORY SOLUTION: `ad_inventory_windows` shared global forecast by placement/time, with Founder source reference and no overlap; `ad_inventory_reservations` hard 600+400 of synthetic 1000 limit, transactions serialize row locks. Append-only promise records, complete E5 common ad_history/audit. Booked price/period/area/package fields immutable, safety Hide remains allowed. This is deliberately conservative, not guaranteed revenue/actual traffic forecast.
- INTERMEDIATE CI FAILURE: `ci/phase4/b7-inventory-regression.sql` PL/pgSQL `select id into cap` conflicted with declared `id uuid` at line 136; true RED on 38056591494. Corrected using `select w.id ...` in commit `a0d475...`; no old CI/tests removed or whitelisted.
- LEFT OPEN: No authenticated public Article-ID feed, no geo-catalog official upload, no inventory window acceptance in real Production, no qualified impression counters/replay protection, no contract/real financial proof, no Android E3/E5 final. T037 and related ADS checkpoints IN PROGRESS, NOT PASS.


## B7 single canonical feed first-divergence / pairing gate — 2026-10-10
- **FIRST DIVERGENCE:** old live `JBPublicAds.scopeForArticle(item)` derives unverified `local` / `district:x` in JavaScript and passes it to old public `jb_ad_public_feed(text,text)`; viewer can forge this string. Even though new PRIVATE Article-ID geo + weight helpers passed isolated tests, they are not yet bound to the public page. Independent news publishing remains unaffected.
- **MINIMUM SAFE FIX:** `db/20261010_b7_single_public_feed_cutover_REVIEW_ONLY.sql` (same legacy public signature, no second public selection home), accept `article:<uuid>` for published Article and homepage `global` only with reviewed paid MP/National grants. `public-ads.js` exports strict Article-ID renderer NOT YET CALLED. No Production DDL/DML or unsafe split deployment.
- **TEST/POSITIVE:** isolated PostgreSQL 80 anon Article selections, one sanitized creative and labeled विज्ञापन, paid review/state/National homepage and legacy homepage alias.
- **TEST/NEGATIVE:** `local`/`district:guna`/forged SQL/malformed/draft/wrong-district/no matching Article IDs, no direct geo grants/private picker, hidden ad excluded on next open. Runs never equal Android E3 or real live ad view proof.
- **RCA:** CI failed `max(uuid)` (unsupported aggregator) then regprocedure private-schema lookup under anon role (permission denied schema); corrected fixture with text cast and catalog-OID authority check. No old tests disabled.
- **GATE:** original Article JS must NOT be switched before matching backend rollout. Backend must NOT be deployed before official complete LGD data, advertiser inventory/verified payment and paired frontend. T035/T037 remain IN PROGRESS.


## B7 T040 — first divergence and test RCA — 10 Oct 2026
- FIRST DIVERGENCE: Production grants anonymous raw `jb_ad_event(uuid,text)` and `jb_ad_record_event(uuid,text)` allowing unauthenticated 'impression'/'click' for a live campaign without the Advertisement actually being visible. Existing Owner `jb_ad_analytics_internal` summarizes raw `ad_events`. Neither is valid ADS-049 qualified reporting.
- REQUIRED: 50% visible Advertisement area + uninterrupted 1000ms + visible browser tab; only client-observed conditions can be proven locally. News/article 1-second preview analytics must remain independent.
- MINIMUM SAFE CANDIDATE: `ad-viewability.js` and `ad-analytics-client.js` (unlinked release hold), shared `private.b7_eligible_article_creatives(uuid)` authorizing exactly paid/current/Article geo-selected creative; one-use server ticket hash valid three minutes; SQL row lock, >1 second guard, same `ad_events` qualified metadata; raw event writers revoked only in review migration. Old browser and Article published URL untouched.
- E1/E2 PROOF: `ci/phase4/b7-viewability-regression.cjs`, `b7-analytics-client-regression.cjs`, `b7-view-ticket-regression.sql` staged synthetic role tests; forged Article/Gwalior/draft/cross-creative rejected, two requests same nonce rejected, under-one-second rejects, replay expires, Owner-only qualified analytics and privacy.
- RCA 1: static test matched `ad_events` in JS comment (38060102811 RED); only documentation comment changed at `b1630b85`, CI retested, assertions intact.
- RCA 2: SQL source split inserted raw replacement string with `$'` replacement interpolation and duplicated content (38060180001 RED). Restored from independently fetched GREEN commit `0859cdec`, converted replacement to safe callable callback and verified exact function count; fix `98f168cc`. Before SOURCE corruption no Production write; old CI preserved.
- SECURITY/REALITY GAP: Fresh anonymous nonce with fake browser visibility can still mimic an impression. Token replay prevention ≠ proven human reach. New report explicitly `client_reported_estimate_not_unique_people`; cannot use as guaranteed inventory/payable impression without further abuse protections, real device verification and Founder acceptance. Old production anonymous event weakness stays unresolved until controlled paired cutover.
- Next actions: complete trusted bot/abuse layer, CTA click validation, homepage token issuance and frontend/backend atomic activation after official MP LGD and tests. P4-T040 and B7 **NOT PASS/LOCK**.


## B7 ADS-048 CTA click source authority and remaining abuse gate — 10 Oct 2026
- First divergence: Existing client built clickable approved links but LIVE legacy `jb_ad_event`/`jb_ad_record_event` grants allowed anonymous "click" counts without a rendered/selected ad. News and raw historical counters must not be altered.
- Minimum safe review fix: no new redirect service; the **approved existing rendered anchor** remains clickable whether stats succeeds or fails. Optional analytics module reports trusted DOM click once with a previously server-issued Article+campaign+creative token; the backend independently validates approved safe CTA and expires/consumes ticket with row lock. Same canonical `public.ad_events` has unique (ticket,event_type) so impression and click are distinct.
- Negative probes: untrusted JS .click(), hidden document, DOM detached link, canceled event, forged/expired/replayed token, different creative, invalid javascript/data/file/http URL; no call/WhatsApp navigation interception. No publisher/reader GPS/identity. Node/browser synthetic + disposable PostgreSQL only, no real user device or network attestation.
- Residual exploit: a bot can issue a *fresh* random nonce/token and fake its click RPC directly after an eligible paid/geo ad selection; `isTrusted` is only a client-side gesture filter, not a server-trust proof. Owner report calls these `client_reported_user_interaction_not_verified_human` and sets `clicks_verified=0`; no payable click or unique reach claimed. Requires independent capacity/rate/abuse evaluation, real Android E3, Founder E5 and staged backend parity. NO T040 PASS.


## B7 20-minute pinned CTA expiry RCA — 10 Oct 2026
- Source divergence: The original staged `jb_ad_record_ticket_click` used the 3-minute view qualification `ad_view_tickets.expires_at` for click reporting. The canonical B7 article retains a single paid ad throughout the open view (including 20-minute waiting tests), so a genuine user tapping at minute 21 would navigate normally but fail to register the client-reported CTA click.
- Fix: bound click validity to `issued_at + 30 minutes` **only for click claims**; the impression expiry remains 3 minutes and the UI never rotates in place. Backend still validates ticket hash, click_at=NULL, matching approved creative+safe target, atomic one event_type-per-ticket insert. No new viewer identity or target tracking.
- Proof: existing isolated `b7-view-ticket-postgres` fixture now time-shifts synthetic tickets: at +21 min valid CTA reports once but impression is still denied; at +31 min stale click denied. Only commits proven through same SHA Candidate+Protected CI count as an Engineering checkpoint. Real Android 20-minute test and anti-bot checks remain DUE.


## B7 50pct view of blank media RCA — 10 Oct 2026
- First divergence: An ad `aside` might be >=50% on-screen while the remote photo is still unrendered or video has not loaded any frame. Viewability cannot count empty pixels as qualified advertisement exposure.
- Fix: stage ticket offer is now deferred until `img.complete && naturalWidth>0` or `video.readyState>=2` (or simple text content). Premature load/data event is ignored; failing/removing the creative means no ticket despite older element reference. Late asset load is allowed to begin a normal fresh 1000ms threshold count; no in-Article ad selection rotation.
- Evidence: additions to `ci/phase4/b7-client-regression.cjs` exercised image, video, repeated loads, early fake media event and broken-image removal in synthetic DOM; exact source HEAD protected CI proof required. True Android rendering remains unverified E3.


## B7 T041 existing B3 notification and audit/retention first divergence — 10 Oct 2026
- **FIRST DIVERGENCE:** EXISTING B7 campaigns/payment/verification/media and portal workflows recorded `ad_history` and `audit_logs` but did not route all key events through B3 unified in-app delivery; notification/provider outage had no explicit retriable ads failure audit. LIVE `ad_history` FK can cascade delete on campaign removal and older commercial events lack a guaranteed existing B3 retention registration. Owner needs retention authority and no fake external delivery.
- **AUTHORITY:** Existing B3 `jb_notification_emit_internal` owns sanitized Owner in-app notices, dedupe and delivery history; existing `record_retention_policies` (`ads_history_v1`, 2555 days, manual disposition), `record_retention_state`/history own retention; `audit_logs` has old immutable triggers, and `ad_campaigns`/creatives/payment sources remain canonical.
- **MINIMUM SAFE STAGING:** `db/20261010_b7_unified_notifications_REVIEW_ONLY.sql` routes standard ads events to B3 with only static safe text. A B3 failure inserts immutable `ad_notification_failed` with SQLSTATE `NOT_CONFIRMED` but cannot block News/Ads; two narrow Owner/AAL2 RPCs list/retry by failure audit ID, preserve old failure, only confirm B3 IN_APP receipt, and never claim WhatsApp SENT. Owner `ads.html` lazy panel minimizes routine work.
- `db/20261010_b7_retention_audit_REVIEW_ONLY.sql` blocks physical modification/deletion of ad_history, confirmed evidence-bearing campaign deletion and rewriting approved media. New events register in existing B3 retention state/history with truthful optional actor; existing events backfilled against original creation date, and HOLD/EXTEND rows untouched. This review migration contains NO actual physical disposition functionality.
- **CI NEGATIVES:** `ci/phase4/b7-notification-regression.sql` proves 12 synthetic B3 events, non-duplicate status, portal change/renewal, provider outage no false receipt, missing owner positive catch and AAL2 retry, no external msg. `b7-retention-regression.sql` proves old policy backfill, preexisting HOLD retention, no record rewrite/delete, no policy=>failed insertion, approved asset immutability and 7yr retention unchanged. Combined with protected T123 exact new RPC guards.
- **BUG RCA:** Old payments fixture's constant Owner auth.uid() made anonymous-origin retention test erroneously claim Founder as creator. Override with nullable actor fixture; fixed 2e7290e9. Notification test used PLpgSQL local `id` conflicting with audit_logs field; corrected unqualified references to `v_failure_id`, fixed b57b1add. No test disabled, old CI preserved.
- **OPEN GATES:** run *real* B3 engine against live-like staging, prove Owner account revoked/session + AAL1, real Android Owner notification read/ack, validate change/media/provider failure and retention/historical payments, security incident/more exact ADS-054..056 E5, production deployment and independent externally delivered receipts. P4-T041 IN PROGRESS only, B7 NOT LOCKED.

## B7 ADS-053/054/055 — independent RCA and verification — 10 Oct 2026
- **RCA #1, first divergence (concurrency):** Owner `jb_ad_notification_retry_internal` selected old immutable `audit_logs` failed notice with `FOR SHARE`. Shared row locks are compatible; two overlapping Owner sessions could both see no `ad_notification_retry_succeeded` record and each append their own. B3 notice UPSERT dedupe alone does NOT protect canonical audit uniqueness. Fix: exclusive `FOR UPDATE` row lock on that specific audit failure, then check prior success. No update to audit evidence.
- **Proof:** Candidate action runs actual PostgreSQL parallel `psql` processes with one-second synthetic B3 emitter slowdown. `ci/phase4/b7-notification-concurrency-verify.sql` checks one original NOT_CONFIRMED failure, ONE retry success audit and ONE in-app receipt; no WhatsApp/email message. Protected T123 source contract also requires `FOR UPDATE;`.
- **RCA #2, first divergence (retention):** New INSERT paths calculated seven-year due from `clock_timestamp()`, but backfill used `ad_history.created_at`; this silently granted old imported records a fresh retention period. Fix: original event timestamp for both, invalid dates denied, imported already-due records marked DUE but preserved, legal HOLD unchanged.
- **Proof:** real disposable PostgreSQL `b7-retention-regression.sql` inserts events dating 60 and 2600 days back, verifies exact due math and no auto-purge. Fixture includes an older held record that remains held.
- **Security negative:** existing B3 emitter refuses `team_accounts.status<>'active'`; locally model suspended Owner and verify zero notifications, original public ad enquiry still succeeds and audit failure is immutable. Mock account reactivated then existing Owner-safe B3 retry path handles it without false SENT. Does NOT establish real Auth session-revocation evidence.
- **Still unresolved:** real Supabase B3 RLS/auth/AAL2 (not just mock), external provider E6 receipts, actual production retention authorization, browser/Android E3 and Founder E5, verified geographic LGD, real anti-bot views. Test register remains IN PROGRESS; no P4-T041 PASS or B7 lock.



## B7 ADS-055 Original B3 source + stale notification first-divergence (10 October 2026)
- **Divergence 1 (evidence mismatch):** The 13-job Candidate used a deliberate small `jb_notification_emit_internal` stub in `ci/phase4/b7-notification-fixture.sql`. That does NOT establish compatibility with the actual live B3 emitter, whose approved source records `notification_delivery_history`, creates `notification_history_v1` retained records, enforces `RECIPIENT_REVOKED`, `UNSAFE_NOTIFICATION_CONTENT`, and maps HIGH priority to ATTENTION consequence. Corrective action: additive 14th `b7-original-b3-contract-postgres` job applies unchanged original migration files 001/002/005 and tests all named effects; no original source replaced or duplicated.
- **Divergence 2 (stale Owner message):** Concurrent or delayed failed event `ad_live` might be retried after the campaign was HIDDEN. Legacy code would create a false LIVE notice. Fix: read canonical current campaign status/advertiser verification/payment state during Owner AAL2 retry; when stale, emit sanitized `ad_workflow_updated` action-required notice while preserving immutable original failed event, and record `source_event` + `delivered_event` + `stale_state_sanitized` in separate success audit. Reject malformed audit record UUID. Real B3 fixture creates LIVE failed audit then HIDE, confirms no false LIVE after retry and correct history/retention.
- **RCA 3 (SQL patch corruption):** JavaScript `String.replace(from, toString)` interpreted the SQL UUID regex suffix `$'` as a special substitution, expanding the entire original suffix and leaving an unterminated SQL string (Candidate RED runs 38068722555 and 38068766516). Independently re-fetched previously GREEN migration source at `3a0bca06...`, rebuilt with `replace(from, () => to)`, enforced exact one BEGIN, COMMIT, retry function, failures function, regex, and no duplicate tail. Fix commit `9b1280a8`, real PostgreSQL CI then parsed original migration successfully.
- **RCA 4 (stale regression expectation):** two-session notification fixture had a fake `ad_hidden` event tied to backend campaign in `approved` status; after stale guard it correctly turned into `ad_workflow_updated`, but old test still counted `ad_hidden`. Replaced test's fake event with `ad_approved` (matching canonical state), keeping one success audit + one in-app receipt assertions fully enforced. Separate new test verifies intentional LIVE->HIDE stale sanitization in original B3 migration.
- **Evidence gate:** Candidate 38068932569 GREEN 14/14 on SHA `7342dbc2...`; protected workflow exact same SHA needs independent completed status. This is local/disposable source compatibility, not installed production RLS/AAL2 E5 or WhatsApp provider receipt; NO P4-T041 Final PASS.


## B7 ADS-046/052/056 RCA and evidence gap — 10 October 2026
- **FIRST DIVERGENCE — Owner creative replacement:** Actual `public.jb_ad_save_creative_internal` (live Supabase read-only inspected) sets all old campaign rows `approved=false` then inserts a new approved version; `jb_ad_approve_creative_internal` performs analogous toggles. REVIEW-only B7 retention trigger previously raised on ANY UPDATE when OLD.approved=true, so migration would make media correction impossible. Fixed safely by existing-table sticky `approved_once`, independently preserving all previous approved payload attributes. Owner/AAL2 status toggles allowed only with unchanged payload, old content immutable even after approved=false, no direct public/client write privilege introduced. No new creative table.
- **RCA — regression blast-radius:** First attempt added version/CTA columns to shared synthetic payment fixture; `b7-weighted-fixture.sql` already adds media_url, so paid weighted CI detected duplicate column. Exact old fixture restored from GREEN SHA and new columns restricted to isolated retention fixture. DO NOT touch shared schema fixtures for one niche regression.
- **FIRST DIVERGENCE — URL safety:** Earlier frontend `safe()` checked HTTPS+no credentials but allowed https://127.0.0.1 and private .internal host CTA/media. Backend `jb_ad_record_ticket_click` on approved creative also allowed click receipts for them, creating unsafe navigation and inconsistent reported click counts. Browser blocks entire private host class; independent same-rule REVIEW-only Postgres check denies paid click claims. Public HTTPS/WhatsApp/telephone remain valid. No GPS/IP fingerprint.
- **CI syntax RCA:** preexisting `p4-t035-static-contract.cjs` uses a literal `u.protocol==='https:'` assertion. New semantically equivalent `u.protocol!=='https:'` spelling failed source-based check; restored old exact positive syntax with logically identical check, no CI weakening. Legacy 22 other source contracts remain.
- **Evidence:** candidate 38070006423 GREEN 14/14 + protected 38070006421 GREEN on SHA 41f8bf95 after sticky creative-version fix. Later host-safety and 60-ADS preflight changes need new exact SHA proof, never inherit earlier green. Final real Android/Owner/Source/E6 plus official LGD still absent.
- **Protection:** new `b7-closure-gate.cjs` and 60-row `B7_FINAL_ZIP_CLOSURE_MANIFEST.json` prevent fake final ZIP and PASS. All B7 final cases remain UNLOCKED; Draft branch only, no Production SQL applied.



## B7 — 12 Oct 2026 — Media draft unexpectedly replaces LIVE campaign (RCA)
- **SOURCE:** Actual Live `jb_ad_save_creative_internal` Owner/AAL2 has `update public.ad_creatives set approved=false where campaign_id=p_campaign`; next INSERT `approved=true`. Thus clicking existing "Save and approve creative" can change public creative immediately before Founder preview. Not fixed by earlier sticky creative history trigger; that guard protects past bytes but allows flag toggle.
- **REPRODUCE:** copy exact old RPC procedural body into disposable PG fixture; create existing approved v1; invoke old SAVE; v1 becomes unapproved and new v2 approved. `ci/phase4/b7-creative-legacy-divergence.sql` verifies this then rolls back. Not an actual private LIVE advertiser read/write.
- **AUTHORITY + FIRST DIVERGENCE:** Founder blueprint §5.1 and §5.5: Gallery → Details → Preview → Approve and keep current LIVE creative until new approved. Existing `ad_creatives` + `ad_history` are canonical. Owner AAL2 is necessary but does not constitute a second explicit approval action.
- **FIX:** Update same two RPC bodies (REVIEW ONLY): save INSERT vN approved=false, canonical campaign serialization and append-only draft event; separate Owner/AAL2 latest-version approve, validated normal advertiser and safe text, update old approved false only at actual approval, preserve sticky historical payload. Image/video approval fail closed until byte/mime/orientation/codec/EXIF/GPS worker, no fake approval.
- **FRONTEND authority:** Old production backend capability absent => `JBPhase4.adCreative` refuses unsafe SAVE instead of silently falling back. Owner sees explicit confirmed approval button and local-only file preview. Owner file preview never uploads/approves or strips private EXIF. No new parallel creative table / news pipeline.
- **NEGATIVE:** AAL1/anon, stale versions, high-risk unverified, media unscanned, null type, invalid JS/file CTA, private IP/internal URL, malformed local files, oversized file. Old Article/media/News and protected 41 locked features untouched in review-only branch.
- **DEBUG-REGRESSION independent RCA:** JS `String.replace(from,toString)` encountered regex terminating with `$'` and interpreted that as replacement-token suffix, multiplying staged SQL to 91k bytes/unterminated literal. Older Candidate runs 38108254920 and 38108269142 RED. Refetched full ORIGINAL intact 9150-byte source at `e377ddef`, reapplied three changes via `replace(from,()=>to)`, asserted one BEGIN/COMMIT+3 function declarations, recovered 9460-byte SQL in `3e7b91a7`; Candidate 38108342059 16/16 GREEN. Never bypass/skip old protected regression.
- **REMAINING HOLD:** Production still has broad `b5_private_gateway_only` storage policy and unapproved B7 staged fix. Real anonymous & AAL1 media RLS negative, signed URL lifecycle, Founder Android gallery, official MP LGD, media processor, complete E3/E5/E7 and controlled deployment DUE. P4-T035/P4-T039 NOT PASS, final ZIP BLOCKED.


## B7 critical-first RCA: mistaken permissive classification (independent checkpoint)
- **Exact current source:** independent SQL checked `pg_policies.permissive='RESTRICTIVE'` and raw `pg_policy.polpermissive=false`. Earlier review of `cmd,roles,qual` omitted the decisive permissiveness bit. The synthetic test's `AS PERMISSIVE` did not reproduce deployed policy authority.
- **First divergence:** false conclusion of anonymous editorial media access from a restrictive `bucket_id <> grievance-private` rule. Restrictive policy is an AND guard, not an OR grant; there were no reviewed anon permissive rules.
- **RCA + safe fix:** DO NOT deploy old `DROP POLICY b5_private_gateway_only` proposal; doing so would remove an existing B5 grievance restriction. Replaced same REVIEW_ONLY path with read-only, fail-closed exact snapshot audit and ROLLBACK. Regenerated isolated fixture as RESTRICTIVE and tests to prove genuine anonymous denial + untouched Owner News upload; counterfactual PERMISSIVE simulation is labeled NOT LIVE and rolled back. Added explicit superseding note to prior incident review, historical evidence preserved.
- **Remaining unknown:** actual Storage HTTP public media behavior, anon REST/B5 signed URLs and Owner Android workflows still need real E3/E5; no assertion about actual historical incidents or comprehensive application safety. Status P4-T041 IN PROGRESS; ZIP BLOCKED.


## B7 continuation — new first divergence in media selection, previous Storage RCA corrected
- **Storage forensic root cause**: previous LIVE assessment omitted the decisive `pg_policy.polpermissive` bit. Actual policy is RESTRICTIVE. Old counterfactual synthetic PERMISSIVE scenario had reported a hypothetical anon leak as though deployed; that claim is not supported. A prior staged DROP would have weakened B5 grievance protection. Replaced with no-op audit/rollback, repaired synthetic privilege matrix, added LIVE READ-ONLY protected CI metadata check; historical notes flagged as superseded.
- **Media first divergence**: rapid Android file A then B produced asynchronous `inspect(file.slice(...).arrayBuffer())` completions B before A; original `stage` called `dispose` only AFTER await, so old A could overwrite chosen B. Also invalid replacement left prior `blob:` reference live even after caller cleared DOM text. Fixed with WeakMap per-container request generation and dispose invalidation, a current-failure revoke path, and UI cancellation tracking before await. Exact negative tests for deferred A/B, pagehide, invalid-current and stale-invalid paths.
- Authority kept: News first, Owner+AAL2 unchanged, not live ad approval, no Storage policy modification. Server-side codec/EXIF/GPS stripping, poster/video dimensions, real Android proof remain open. No failed old test has been bypassed.

## B7 paid URL selection — first divergence, real CI failure and final correction
- **Authority:** server-side approved+paid Article and Homepage projections, not the browser's `safe()` alone. Legacy Owner auto-approved media and website/map URLs could have HTTPS private numeric and intranet hosts under old SQL regex. The old public query could expose a link which the browser would reject; do not make client validation the SOT for eligible paid delivery. Exact fix is one private SQL helper shared by both placement selection paths, with literal HTTPS DNS/loopback guards and legacy newest-version refusal.
- **Actual RED from 38111575320:** a newly introduced rollback-only Homepage negative fixture `DO` declared `id uuid` and used `INSERT ... RETURNING id`; Postgres 17 reported ambiguous column/variable at `ci/phase4/b7-single-feed-regression.sql:186`. NOT Production, not an eligibility failure. Reproduced from decoded GitHub job logs, repaired single variable name to `v_creative_id`, qualified column. **38111683892** Candidate SUCCESS 16/16 and **38111683896** Protected SUCCESS 2/2 on same source SHA `774fdd6a...`. Preserved all previous assertions; no checker suppressed.
- **Boundary:** these HTTPS checks do not validate bytes, CDN redirects, malware, image/video codec, EXIF/GPS or bot activity. No actual LIVE ad activated; B5 RESTRICTIVE policy preserved, no Production write. All P4-T034..042 FINAL remain DUE.

## B7 new FIRST DIVERGENCE: old click SQL allowed loopback host aliases
- Existing private G4 article/homepage media+CTA rule excluded shortened IPv4 (127.1), numeric hex/octal forms and internal-only DNS. Staged `public.jb_ad_record_ticket_click` kept separate old regex, which would allow invalid CTA click estimates to be inserted although no safe ad CTA should render. Exact minimum-safe fix: replace only website/map CTA predicate with `private.b7_safe_public_ad_https(cr.cta_target)`, preserve call/WhatsApp and 30-min pinned session, preserve event ledger and original function signature.
- Synthetic negative tests prove rejected alias leaves `click_at=NULL` and no `ad_events` click, while valid original is counted once. T123 protected guard now rejects a weaker parallel backend URL rule on future G4 cutover. Candidate 38112503709 16/16 and Protected 38112503725 2/2 SUCCESS, not LIVE E5.
- Official MP geography data retrieval still has CAPTCHA/source provenance gap. Offline structural checker explicitly cannot claim government authenticity or Founder import. No Production write/incident and B5 original RESTRICTIVE preserved.

## B7 second URL RCA: valid DNS + invalid browser HTTPS port
- The same server-side SQL host policy accepted five-digit out-of-range HTTPS ports (`:99999`, `:65536`). Browser WHATWG URL parsing rejects these URLs before navigation. This is not evidence of a LIVE incident: the SQL remains REVIEW_ONLY, and no paid ad is currently LIVE.
- Added conservative range guard in existing private URL SOT (`1..65535`), reused by Article/Homepage/CTA click, plus isolated E2 negative `:99999` click ledger proof and direct validator negative/positive. Protected conditional T123 catches future regression. Candidate 38112739568 16/16 + protected 38112739610 2/2 SUCCESS. Release still waits on actual E3/E5/E7.

## B7 independent media WASM RCA (real source+CI logs, NOT fake production incident)
- New server-byte parser originally denied valid MagickWasm indexed PNG (colorType3). Fixed actual PLTE+tRNS pixel semantics while keeping derivative metadata forbidden.
- Pinned MagickWasm output generated private `orNT` despite `strip`; real decoded log confirmed exact chunk. Source-oriented fix sets orientation Undefined after auto-orient, before strip; did NOT whitelist `orNT`, eXIf or tEXt.
- Deno TS fixes: strict typed x, then independently investigated ArrayBufferLike vs ArrayBuffer WebCrypto; copy to non-shared explicit ArrayBuffer. Attempted generic `Orientation` symbol did not exist in pinned v0.0.30, switched to numeric enum Undefined=0 (typed property).
- Real head `9b6ace69080...` Candidate 38113900702 17/17 SUCCESS (includes actual WASM image processing, synthetic injected GPS comment removal). Only candidate and synthetic; no LIVE service, no AAL2 session/Storage. Final B7 0/9/ZIP BLOCKED.

## B7 ADS-009/010/015 OWNER MEDIA HTTP PREVIEW — 11 OCT 2026
- Real candidate RED 38114348621: 8 Deno strict TS7006/TS7031 implicit any errors from new handler. FIRST DIVERGENCE: untyped Request/stream/dependency callbacks. Minimum safe fix: explicit TypeScript types and strict check unchanged; no suppressed test.
- HTTP security review found Content-Length declared value could differ from actual bytes. Added fail-closed exact equality and negative 8MiB stream overflow; real HTTP synthetic E2 must not call decoder on mismatched/overlimit payload.
- Canonical Owner privilege tracing (LIVE read-only): p4_owner_allowed -> current_owner_aal2 -> current_session_active -> auth.sessions; owner-auth.ts also verifies authenticated user. This source trace is NOT actual Owner E5 session test.
- Exact source 2cc2e04dd21e232ceda53c998b49512f3ae47246 Candidate 38114596493 17/17 and Protected 38114596457 2/2 SUCCESS. Private preview/no storage only; no media approval or release evidence.

## B7 ADS-015 two private Storage buckets, immutable SHA receipts and B5 regression (11 Oct 2026)
- ACTUAL first divergence and RCA history, original RED NOT hidden: ledger SQL E2 initially expected append-only trigger to fire for a service_role UPDATE even though stricter GRANT did not include UPDATE/DELETE. GitHub 38117962806 RED. Correct E2 now first asserts permission denial, then IN DISPOSABLE ROLLBACK grants hypothetical UPDATE/DELETE+RLS and independently verifies trigger still blocks audit mutation. No real grant widened.
- Second RED: PL/pgSQL variable id conflicted with orphan_events.id column (38118034575); exact minimum fix v_asset_id qualifier in test only, no schema change.
- Storage E2 initial RED: pg_policies.roles is name[] (not text[]), fixed cast ARRAY[..]::name[]; later E2 used set_config(text,text) instead of required set_config(text,text,boolean) (38118105226), fixed explicit false arg. No B5 policy deletion, no old test skipped.
- Finally source 26e783b2434cdee1e4171bb9fd33be7aaca9e0b0: candidate 38118203598 17/17 jobs SUCCESS, protected 38118203562 2/2 SUCCESS. This proves synthetic E2 and code-only regressions, NOT real Storage upload, Production integration, Owner E5, Android E3 or final B7 PASS.

## Independent RCA: B7 ADS-015 11 OCT 2026 — REVIEW ONLY. Source 8756d39e3353280baaefdc3598cc3a96370db320. Candidate CI 38120325295 SUCCESS 17/17. Protected run 38120325252 verify separately. Added canonical Creative latest-draft + Owner AAL2 recheck AFTER private WASM Storage SHA readback; restricted service_role-only receipt/orphan RPCs to existing private append-only ledger, no other Creative SOT. Verified negative synthetic session-revoke, stale draft, forgery and absent DB migration. New private evidence trigger locks canonical campaign FOR UPDATE to serialize against Creative SAVE/APPROVE. Real E3/E5, original/derivative LIVE buckets, real private worker, video/poster, E7 and Founder final approval DUE. P4-T034..042 0/9 FINAL PASS+LOCK. ZIP BLOCKED. No full concurrency multi-session proof; source has campaign FOR UPDATE and existing SQL E2 assertion only. No real Owner/MFA session or actual Production receipt written.

## B7 ADS-015 11 Oct 2026: actual isolated private WASM image-job bridge (REVIEW ONLY)
- Auth-to-worker boundary stays nonpublic and privileged client separate. No fake completion; synthetic test is not actual Owner login or Production Storage/Database mutation.
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
