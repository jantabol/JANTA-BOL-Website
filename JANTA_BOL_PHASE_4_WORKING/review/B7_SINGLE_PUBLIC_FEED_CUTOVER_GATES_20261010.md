# JANTA BOL — B7 SINGLE PUBLIC FEED CUTOVER GATES
Date: 10 October 2026 | Status: **STAGING REVIEW, NOT DEPLOYED / NOT PASS**
Source branch: `codex/b7-blueprint-20261010` | PR #5 remains **DRAFT**.

## Why this change exists

The live/legacy `jb_ad_public_feed(text,text)` accepts a client-selected ad scope such as `district:guna` or `local`. Such strings can be forged from a browser. Under the locked B7 Blueprint, geography is derived from a **published Article's verified server-side identity**; reader GPS, IP, profile, browser location, URL district parameter, or free-text news location are not targeting authorities.

A verified backend candidate already exists: `private.b7_geo_matches_article(uuid,uuid)` and `private.b7_weighted_article_candidate(uuid)`. Their source remains authoritative; no duplicate campaign, Article, approval, price, receipt or inventory SOT is created.

## Staged solution (new code; no Production change)

1. `db/20261010_b7_single_public_feed_cutover_REVIEW_ONLY.sql` replaces **the same existing canonical** `public.jb_ad_public_feed(text,text)` signature, returning the same eight sanitized fields. For an Article it accepts only `p_placement='article'` plus `p_scope='article:<published-uuid>'`, then uses the private server Article-ID/geo/weighted selector. An arbitrary `local`, `district:x`, malformed id or unpublished Article returns **zero** ads.
2. For `homepage`, the only accepted scope is `global`. It requires an Owner-reviewed `mp_state` or `national` purchased area grant, actual approved/paid/scheduled campaign and approved creative, and selects at most one weighted creative. No viewer geography or home-town inference.
3. The older public alias `jb_public_active_ads(text)` **delegates** to the same canonical feed; `article` through legacy `global` returns **none**. There is **not** a new second public feed RPC. Both return payloads keep the old field count; no advertiser contact/receipt/terms/capacity is included.
4. `public-ads.js` gains `scopeForVerifiedArticleId(id)` and `renderVerifiedArticle(id)` as a **not-yet-wired rollout adapter**. They validate a UUID and reuse the existing pinned `render('article', ...)` exactly once; old render/share/canonical Article URL do not change until paired rollout.
5. `ci/phase4/b7-single-feed-regression.sql` checks 80 anonymous Article calls plus malformed/district-claim/unpublished/wrong-district/draft requests, MP homepage, old alias, data privacy, one paid Article slot and emergency Hide. All records are synthetic, in a disposable PostgreSQL transaction that rolls back.
6. `ci/phase4/b7-client-regression.cjs` checks accepted/rejected Article IDs, one pinned request and **explicitly asserts that the new adapter is NOT yet called by article.html**. The protected Phase3/4 suites remain intact; conditional T123 security inventory verifies the new canonical cutover code if installed.

## Non-negotiable deployment gates still OPEN

- **Official MP-55 + verified tehsil LGD export/version/parent mapping**, proven with real source checksum and Founder-approved import; current synthetic LGD codes 101/102 are **not real IDs**.
- Real production-compatible Supabase migration dry-run, complete RLS/anon/AAL2 checks, legacy advertised package inventory/terms reconciliation and current campaigns validation.
- **Frontend/backend pairing:** original `article.html` *currently* calls `JBPublicAds.scopeForArticle(item)` and sends `local`/district strings. Deploying new canonical SQL without switching that call would hide Article ads. Conversely switching the client before backend deployment would silently pass `article:<uuid>` to a legacy free-text matcher. **Do neither until both are released and end-to-end tested together.**
- The homepage and Article page MUST retain one (1) ad slot, share top+bottom, one permanent Article master URL and fail-closed short-news slot. On an open Article the same ad must remain pinned (no timer/change).
- Booking capacity/minimum-reach and actual qualified impression ledger (>=50% area for >=1 sec, dedupe), click/bot resistance and analytics separation are **not** finished or integrated. A 3,200-draw synthetic rotation sample is NOT an actual ad reach guarantee.
- Final Android E3, Owner E5, anonymous HTTP parity, calendar/start-expiry provider failure, and original P4-T034..T042 evidence. P4-T038 external E6 remains honestly DUE if provider not integrated.

## Safe release sequencing (not authorized by this note)

Compare and snapshot current LIVE schema/migrations and deployed frontend SHA. Validate authoritative geography and explicit signed booking grants in isolated stage. Rehearse new backend + new frontend together against public **published** Article IDs and homepage plus negative unauthorized scenarios. Run every preexisting protected workflow and new candidate jobs on exact source SHA. Acquire Founder release approval if required, then controlled cutover with documented freeze/recovery. Avoid a rollback that reinstates an anonymous forged-district selection route; if necessary, pause paid display safely while News publishing stays independent.

**NO FAKE PASS: B7 not LOCKED, no Production changes and no new paid views in this checkpoint.**
