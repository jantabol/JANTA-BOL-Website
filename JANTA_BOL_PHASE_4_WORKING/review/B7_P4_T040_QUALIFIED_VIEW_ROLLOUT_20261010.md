# JANTA BOL — B7 / P4-T040 qualified ad views
Checkpoint: 2026-10-10 | **STAGED ONLY / NOT PASS / NOT LIVE**
Master SOT: B7 Final Master Blueprint, ADS-048–050, E1+E2+E3.
Owner principle: **News first; exactly one paid Article ad; no in-page swap.**

## Reconciliation / first divergence
The current LIVE database has `ad_events(id,campaign_id,event_type,created_at)` and two anonymous raw writers, `jb_ad_event(uuid,text)` and `jb_ad_record_event(uuid,text)`. An anonymous request can currently submit arbitrary impression/click counts for a live campaign; the existing Owner `jb_ad_analytics_internal` mixes raw entries into total/d7/d30. The previous Article 1-second preview is editorial analytics, NOT evidence of qualified paid ad visibility.

A qualified impression requires **>=50% of a visible Advertisement box for >=1000ms continuously**. A hidden tab, rapid scroll, below-fold impression, removed element or JS exception must NOT count an impression. No viewer GPS, ID, IP, browser fingerprint, third-party pixels or location is needed.

## Staged implementation — not yet active
- `JANTA_BOL_PHASE_3C_WORKING/ad-viewability.js`: IntersectionObserver threshold 0/0.5/1, performance-clock 1000ms, hidden-tab reset, no timer loop or network; one callback per element, cancellation and fail-closed missing browser APIs.
- `JANTA_BOL_PHASE_3C_WORKING/ad-analytics-client.js`: synthetic-ready browser handshake. Only a valid published Article UUID + selected campaign+creative IDs; cryptographically strong browser 16-byte random open nonce; no persistent/raw viewer identity. Obtains short-lived ticket, then watches actual ad element and calls secure qualification once. Stats/network failure never interrupts News.
- `db/20261010_b7_weighted_private_REVIEW_ONLY.sql`: refactored existing candidate eligibility into ONE private `b7_eligible_article_creatives(uuid)` source; weighted selector still uses it. No second eligibility list, no public role execution.
- `db/20261010_b7_qualified_impressions_REVIEW_ONLY.sql`: one 3-minute server-generated opaque ticket. Only a LIVE, paid, Owner-approved, verified-geo Article campaign+creative pair can receive it. The raw token exists only in the browser closure; database stores SHA-256 hash and 128-bit random open nonce *hash*, not user identity. Unique Article/open nonce, one use, SQL row lock, server >=1s issuance delay, expiration and replay denial.
- **Same existing** `public.ad_events` ledger gains nullable ticket hash + `qualified` + source metadata. Previous records are retained unmodified but segregated from client-reported qualified counts. Legacy arbitrary anonymous writers lose EXECUTE; no drop/signature change. New `jb_ad_qualified_analytics_internal(uuid)` is Owner/AAL2-only and reports today/d7/d30/total, unverified legacy and zero verified clicks until a separately tested click design is complete.
- Protected old `ci/phase3-regression/db-function-security-regression.sql` T123 now conditionally reviews exact 2 new anonymous ticket signatures + exact Owner-only analytics and rejects direct anon event/ticket-table access, new missing functions and unsafe raw writers. No broad allowlist relaxation.
- CI `b7-view-ticket-postgres` reuses disposable payment + verified geography + shared weighted candidate. It makes actual role/RLS calls, sleeps >1 server second, rejects <1s/replays, wrong geography/draft/other creative, prevents second ticket for same open, rejects expired or forged token, and proves one qualified event + raw legacy segregation with an Owner-only report. All fixture data rolls back.

## Limits / unresolved dependencies (release BLOCKERS)
1. **No real human-attestation yet.** An anonymous adversary can mint *fresh* Article-open nonces for eligible ads and claim visibility after one second without truly viewing the page. Server proves eligibility, elapsed time and token uniqueness only; browser viewport geometry is client-reported. **Do NOT equate qualified reports with verified people, contractual minimum reach or billable impressions.** Bot/rate controls and independent abuse review must be designed and adversarially tested (no IP fingerprinting assumptions).
2. Backend/client is *deliberately not linked into article.html/index.html*. Geo and canonical public-feed REVIEW_ONLY migrations also remain unapplied; linking out of order would cause silent no-ads, false stats or old raw-event fallback. Pair staging/backend/frontend releases only after MP-55 district + verified tehsil LGD, legal/pricing/approval and Android E3.
3. Homepage qualified ticket not implemented. This candidate validates **Article only**; homepage separate grant/picker compatibility requires proof. CTA click counting, bot-like duplicate test beyond same nonce, 7d/30d genuine delivery counts, 20-minute pinned article E3, JS media load/outage resilience and external provider cases all DUE.
4. No Production database writes/migrations or new LIVE campaign. Production has **zero LIVE campaigns** as of read-only checkpoint. Server source role schema/security and OWNER AAL2 parity on actual installed functions remain UNVERIFIED. Supabase function schema/version conflicts must be reconciled before DDL.
5. Existing `jb_ad_analytics_internal` is not switched to qualified totals. Historical raw events must remain available for audit but must never be silently relabeled.
6. Source and CI evidence means **E1 + disposable synthetic E2 only**. Android real E3, authenticated Owner E5, privacy/abuse negative tests against a fully deployed staging environment and Founder signoff are NOT earned.

## First-divergence RCA / previous regressions
- New observer's CI static scanner initially saw `ad_events` identifier inside a comment and failed. Runtime had no tracking call. Renamed the comment (commit `b1630b85`) without excluding or weakening the test. CI then GREEN.
- Attempt to split the weighted SQL into shared eligibility used JavaScript `String.replace` with raw SQL replacement text containing `$'`, which expanded file suffixes. The corruption was detected by source inventory/CI; source was rebuilt from the exact previously GREEN blob and replaced with callback-safe logic in commit `98f168cc`. CI retested the original 3,200-draw weighted job GREEN; no LIVE alteration.

**Final test status:** P4-T040 = **IN PROGRESS**, not PASS or LOCK. ADS-048 click scheme and ADS-049/050 Android/server anti-bot proofs remain incomplete. No B8.


## Optional renderer hook (staging only; added after first report)
`public-ads.js` now invokes `JBAdAnalytics.prepare` only if the element is already rendered, `p_scope` contains a valid verified Article UUID and the optional analytics module is actually present. Legacy Article scopes are explicitly denied a ticket. The current article page has not switched from `JBPublicAds.scopeForArticle`, and analytics scripts are still unloaded; hence no new Production impressions or anonymous ticket endpoint requests are made. Three deterministic source/DOM regression tests defend this claim. The hook never awaits analytics, so network failure cannot blank News or change the pinned ad. This is NOT Android E3; final paired release gate stays OPEN.
