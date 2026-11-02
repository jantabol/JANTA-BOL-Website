# JANTA BOL — B13 / P4-T086 — Core Article Lifecycle + Live Regression

**Date:** 2026-11-02 IST. **Scope:** E1 source + isolated synthetic regression + real JANTA BOL Supabase **SELECT-ONLY** baseline. **No production deployment, no credential mutation, no real public article correction, no Live broadcast.**

## Exact original Master authority
`JANTA_BOL_PHASE_4_MASTER_EXECUTION_PACK(20261101-074327).pdf`, original Final Test Blueprint **page 309**, **P4-T086**, **Topic 12 — Final Closure**, **RUN-15**, **AUTO / CORE REGRESSION**, initial **NOT RUN**, Sections **765–772**. Procedure: **Create → Draft → Final Review → Publish → Public Open → Share → Correction → Unpublish → Republish**, followed by **Phase 3A/3B Live regression**. Required **E1 + E3 + E4 + E5**. PASS requires same **Article UUID/permanent URL**, working share/navigation/home/category/district discovery, preserved Live architecture and genuine Live-environment dependencies properly marked DUE. Mandatory old **Phase-3 Article/Share/Live CI**. In live `JANTA_BOL_PHASE_4_WORKING/TEST-REGISTER.md`, T086 still **NOT RUN — FINAL**; the global order explicitly places T084–T091 Final Closure after T092–T109. **T086 backend-only completion cannot prove full formal Final Lock.**

## Current-source actual baseline, no changes
Branch parent: current T098 audited candidate commit `286decc4be4f3504043f2b139eb4d45f72d3d708` (Draft PR #105). This B13 branch is **source-only**, adds a review, tests and workflow but NO original product/backend/SQL files. Current live `jantabol.in` production deployed on another version, **not** this Draft branch; do not merge/alias-promote.

- **Create + Draft:** Native `JANTA_BOL_PHASE_3C_WORKING/backend-client.js` preserves browser create intent with one UUID, stores first draft, requires Owner and server acknowledgment, and reconciles after lost ACK. Existing T080 original Node VM tests exercise these without production writes.
- **Final Review + Publish:** `add-news.html` requires explicit Confirm Publish; `publish(item)` uses same pre-existing Article UUID for update, optimistic `version` compare-and-swap, server read-after-write, and no duplicate retry after unknown outcome. **A JavaScript mock/SQL fixture is synthetic, not a real Founder public publish.**
- **Public Open + Share:** Public `article.html?id=<original uuid>`, `JBPublicC1.get(id)` published-only allowlisted fields, stable canonical `shareUrl()` with UUID, browser/WhatsApp share guarded in admin preview; public homepage `JBPublicC1.list(30)` populates real articles and distinguishes RPC error from empty list.
- **Correction + Unpublish + Republish:** `published.html` opens `add-news.html?edit=<uuid>&from=published`; Editor page displays `Published News Correction`, hides Draft Save and prevents automatic unpublish of the published Article while locally drafting; `publish()` updates same UUID with optimistic version; `unpublish()` changes same UUID to `draft` with `published_at:null`, then republish uses same UUID. Original server trigger `trg_capture_article_history` retains version history.
- **Navigation, categories, districts, ads:** current `index.html`, `website-v3.js`, `b9-search.html`, B9 geo/index and native article links; source regression only, no claim all districts contain content. Article remains primary; original Ads implementation not modified.
- **Live independence:** Phase 3A/3B `phase3a-live-client.js` routes Reporter/Owner actions through controlled `jb-live-api`; `phase3c-live-delivery.js` uses authorized handoff only and status-specific fail-closed UI; homepage `public_live_feed` displays only `LIVE/INTERRUPTED` records, **not automatically from a reporter draft or video link**. Live requests/approvals and provider credentials/status are not created or altered. Old protected Phase-3 Live architecture and feature tests must actually run at this exact HEAD.

## Independently inspected live hosted Supabase, READ-ONLY
Connected JANTA BOL project `vrffsnkycvjithwtiylt`, never cricket Supabase. Actual safe SQL SELECT observations on 2026-11-02:
- Articles **34 total**; **2 published**, **31 draft**, **0 unpublished**, **1 deleted**; **34 distinct UUIDs, 34 distinct nonblank slugs**. These are point-in-time catalog observations, **not a full lifecycle scenario** and not proof that future concurrent writes cannot duplicate.
- Existing original historical Article versions **920 rows across 26 Article UUIDs**; `trg_capture_article_history`, `trg_enforce_article_lifecycle`, `trg_jb_article_retired_identity_guard`, and `b8_guard_linked_article_hard_delete` enabled on `articles`.
- Real original Founder ISRO SpaDeX article: `f17f6507-02a3-4881-ad37-0b02cadf3d3f`, slug `jb-003c4125-a4b3-451d-95ea-2de889f334d2`, Published, version **15**, history **14**. Second ISRO NVS-03 article `c49f00b6-0359-400c-a957-2082142ff8dd`, slug `jb-4b6e3d2a-dea8-4c83-b479-69504614ae0e`, Published, version **12**, history **11**. Earlier Founder Android screenshots showed the two published list cards; **no current real correction/unpublish/republish executed**. Do not edit genuine ISRO stories just to get a green test.
- Existing published-only `jb_c1_public_articles(null,10)` STABLE read-only RPC returned **2 items** with first status `published`; EXECUTE granted to anon, RLS on `articles` and `article_versions` enabled. This is **live backend read-only** and does not substitute for independent nonlogged-in HTTP/Android browser E3/E5.
- Existing live system: `live_sessions=16` (14 ENDED/OFF, 1 READY/OFF, 1 WAITING_SIGNAL/OFF); `public_live_feed=7` records **all OFF/STABLE**; `live_requests=18`, `live_final_reports=2`. No active real LIVE broadcast claimed. Original Phase3 provider credential validity, encoder stream start/stop and actual Viewer open are **E5/real-provider DUE**. No LIVE must be fabricated merely for final closure.
- Both currently published Articles categorized `Technology/India`; other actual district/category discovery cannot be passed just because component code exists. Real category/district results require genuine diverse content or separately labeled fixture.

## Scoped test execution vs formal user acceptance
`T086_E1_CURRENT_CORE_ARTICLE_LIFECYCLE_SOURCE=CI_PENDING`.
`T086_E1_PHASE3_ARTICLE_SHARE_LIVE_PROTECTED=CI_PENDING`.
`T086_E1_T080_LOST_ACK_CAS_AND_T083_PUBLIC=CI_PENDING`.
`T086_E2_HOSTED_ARTICLE_VERSION_ID_RLS_READ=PASS_SCOPED_READ_ONLY`.
`T086_E2_HOSTED_PUBLIC_PUBLISHED_ONLY_RPC_READ=PASS_SCOPED_READ_ONLY`.
`T086_E2_LIVE_FEED_ACTUAL_OFF_STATE_READ=PASS_SCOPED_READ_ONLY`.
`T086_E3_REAL_ANDROID_FULL_CREATE_TO_REPUBLISH=NOT_RUN`.
`T086_E4_REAL_SINGLE_ARTICLE_PURL_CORRECTION_UNPUBLISH_REPUBLISH=NOT_RUN`.
`T086_E5_REAL_PROVIDER_LIVE_APPROVE_START_STOP_VIEWER=NOT_RUN`.
`T086_E3_E5_REAL_CATEGORY_DISTRICT_SHARE_BROWSER=NOT_RUN`.
**`T086_OFFICIAL_FINAL_PASS_LOCK=HOLD`**.

### Acceptance boundaries
Back-end/source/static/PG17 regression may be **PASS_SCOPED** when actual exact-head CI proves it; cannot claim T086 Formal PASS/LOCK without real E3/E4/E5. No fake provider PASS, no payment, no production write, no Article ID/PURL change, no B8 receipt, no email. If a protected test fails, stop; fix only the actual issue, rerun same original tests. No duplicate T085 work or unnecessary Founder manual steps. Soft Launch stays priority.

## 2026-11-02 actual executable CI — mandatory old locked test RED STOP

**Source candidate HEAD before this documentation append** `78349821ac6a487193ab0690b3372cc16d9baa7e`, GitHub Actions `#41387894753`, **COMPLETED FAILURE overall**, with all jobs independently reported:
- **NEW original T086 source 16/16 PASS**, correct current same-UUID Article, public C1, B9 district/category search, canonical Share and Phase3 Live boundary checks. First candidate run `#41387547158` was **14/16 FAIL** solely from wrong newly added source-test expectations for multiline unpublish CAS and district filtering's actual B9 file; corrected these assertions to verify the **existing actual code** without weakening the required CAS or district filter. Second candidate `#41387661465` 16/16 PASS.
- **Existing current T080 Founder Article/Android restore/lost-ACK backend VM + current T083 original 120/120 + public C1, B9, B11 public truth + Phase3A/3B protected static/functional Live E1 source regression: SUCCESS** in source job. This does not demonstrate real provider Live.
- **Inherited actual disposable PostgreSQL17 B0–B8 including original News/Auth/B7:** Both independent G0 and G1 jobs **SUCCESS**, original case proofs/rollbacks intact. Old Source Master ZIP packaging **SKIPPED**, NOT a release pass.
- **MANDATORY older original locked V3/C1 test `ci/phase4/b12/v3-c1-public-integration.test.cjs` was executed UNMODIFIED as a separate fail-hard job** and **FAILED 8/10 PASS, 2/10 FAIL**. We did **not** delete, skip, edit, rebaseline or mark it green. As required by original Master: **ANY locked old CI FAIL = RED STOP**. Whole workflow `#41387894753` is correctly **FAILURE** even though current-source and PostgreSQL jobs passed. This is a **release/baseline mismatch under investigation**, not evidence that the real website was changed or damaged by this PR.

### Actual original V3 test failure evidence — not hidden
1. The old test asserts the **exact literal** CSS `#citizen-news-form,#official-reporter-form{display:none!important}`. Current live-source code instead uses the **stricter** selector `#citizen-news-form,#official-reporter-form,#top-story[hidden]{display:none!important}`. Both unsupported submission forms remain explicitly hidden/inert and top breaking is also hidden; the old exact-string checker does not match the extra selector.
2. The same locked V3 test pins `b12-safe-nav.js` **Git blob `ede5edac22f85759facb72b189c0b90a245f0d6c`**, but latest B12 reviewed candidate has blob **`a2107140321c2e099e785c678213ad278cbcfd5f`**. Direct old-vs-current blob comparison: current includes the `youtube-oauth-health.html` allowed after-login navigation path in addition to old allowlist. The test also pins older `backend-client.js` blob `0789934809c91a39d73a6d2570d0938fb6fbb47a`, while current is reviewed T080 blob `fb2c60d241ef772d4990536b577acc3c7d70fad7`, with lost-ACK and UUID/CAS enhancements. Updating pinned SHA to make test green **without separately validating a governed compatibility baseline** would violate Founder old-lock discipline. No revert of newer safe nav/Article is authorized either.
3. A **separate actual UI routing limitation** requiring follow-up: `b12-safe-nav.js` allows `add-news.html?id=<UUID>` after MFA but **does not currently allow** `add-news.html?edit=<UUID>&from=published` through this post-login helper (while native `published.html` links to that two-query editing URL). This can explain why a fresh-login deep link falls back to Admin Dashboard; it is **not** yet independently proven for every auth session, and must not be silently patched without a negative path traversal/open-redirect test. Native in-session `Published News → Edit / Correction` route is still available. Real Android correction E3 remains DUE.

### Honest verdict at this exact checkpoint
`T086_NEW_CURRENT_SOURCE_AND_T080_T083_PHASE3_LIVE_E1=PASS_SCOPED`
`T086_REAL_ISOLATED_PG17_AND_OLD_G0_B7=PASS_SCOPED`
`T086_ORIGINAL_LOCKED_V3_C1_GATE=FAIL_RED_STOP`
`T086_BACKEND_FULL_CLOSURE=BLOCKED_OLD_LOCK_GATE`
`T086_REAL_ANDROID_E3=NOT_RUN`
`T086_REAL_ARTICLE_ID_PURL_LIFECYCLE_E4=NOT_RUN`
`T086_REAL_PROVIDER_LIVE_E5=NOT_RUN`
**`T086_OFFICIAL_FINAL_PASS_LOCK=HOLD`**.

**Permitted path:** reconcile original locked V3 check against separately reviewed T080/T079 source history **with independent security evidence and Founder-approved governance if the lock must change**, then rerun the unchanged original required protections (not merely alternate newer tests). The correction/deep-link query path needs separately scoped negative review. Do NOT deploy, revert, edit old tests or simulate genuine Article/Live provider events to get green. Founder currently has **no required manual step in backend preflight**. Do not start T087 Final as if T086 is locked.
