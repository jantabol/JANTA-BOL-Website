# JANTA BOL — B13 P4-T086 — Soft Launch Safe Release Scope Review

**Date:** 2026-11-02 IST. **Mode:** Source/connected Vercel READ-ONLY audit; no staging promotion, no `jantabol.in` alias change, no Supabase SQL mutation, no changes to published News, Backups, Ads, Auth, Live provider or G6 private upload.

## Release-specific authority
- T086 is original Topic 12 RUN-15 Core Article Lifecycle + Phase 3A/3B Live regression with E1 + E3 + E4 + E5; current **E1 backend regression scoped PASS**, but **real Android E3, actual same Article UUID/PURL correction/unpublish/republish E4, real Live provider encoder start/stop E5 not run**.
- Founder explicitly authorized A (Controlled Security Baseline) on Nov 2, *not* a production deployment or automatic merge. Original historical 2026-10-29 10/10, Founder A1 10/10 and A2 strict-return ten cases all passed at exact PR #108 `edecc6290a0c87e36b7510dafffa11f4ad74e9f3`, CI `41391242714` COMPLETED SUCCESS, including 20 new negative, original T080/T083 + Phase 3 source and disposable PG17. PR #108 **DRAFT UNMERGED**.
- Only approved new behavior: `b12-safe-nav.js` strict `published.html` read-only navigation and `add-news.html?edit=<UUID>&from=published` exactly two keys after Owner+AAL2, without granting new login/edit authorities.

## Connected Vercel facts independent of branch claims
**Vercel project** `shubham-pichhore-2028`, `prj_xNb9G3xjW35qSXEyF7o2qiCqG4HI`, under the connected existing team, Hobby. **Actual production domain alias `jantabol.in` → `dpl_6XpfdMa7gCF5SDXd7EKHZfbpLfeF`**, READY, original Git commit **`93df12aa8ffdfae38d9a4066b6a4556bb36969e5`**, ref `codex/t080-admin-ack-failclosed-review-20261031`. **Latest Vercel READY preview** is `dpl_BFbbNnd7nLSojHZsfNaBRNBmiKq5` from `codex/t097-t080-three-file-preview-20261101`, commit **`725df42de228bbe3fb1c263ee7b24455707b743f`**. The latter preview was **actually observed in Founder Android** as `JANTA BOL — Isolated Preview`; cannot claim real Founder login or T086 correction editor from its READY state. Project **SSO preview protection ENABLED**. Neither Source-GREEN nor READY is proof of a connected real admin session.

## Exact full Git tree comparison (real GitHub commit trees, not estimates)
Compare PR #108 **HEAD `edecc6290a0c87e36b7510dafffa11f4ad74e9f3`** to:
- **Current LIVE production source `93df12aa8...`**: 9 changed existing `JANTA_BOL_PHASE_3C_WORKING/` product files; **9 !== 1**. Exact names: `add-news.html`, `b12-safe-nav.js`, `b8-accountability-client.js`, `b8-accountability-ui.js`, `b8-accountability.html`, `backend-client.js`, `index.html`, `published.html`, `script.js`. There are additionally 27 additive review/workflow/test/release-support files and 4 changed legacy test files, not a one-file production hotfix.
- **T080 preview source `51b3f5fa...`**: only 4 changed existing product files: three T097 B8 frontend files and `b12-safe-nav.js`. T080 historical newer Article/public code must not be accidentally reverted.
- **Latest T097/T080 isolated READY preview source `725df42d...`**: exactly ONE changed existing product file: **`JANTA_BOL_PHASE_3C_WORKING/b12-safe-nav.js`** (original `a2107140321c2e099e785c678213ad278cbcfd5f` → approved A2 `d2d2742e46d3d373f6a6dd549f9d7b0fe684b862`). Same Git comparison also has one changed protected canonical test `ci/phase4/b12/v3-c1-public-integration.test.cjs` with historical security archives and documentation added.
- Current production branch **`main`** is at yet another commit `f447231c0677644ca5a44cc19f12cf0314ff38ea`; do not assume `main` equals currently deployed or merge this stacked Draft source to main.

**Security stop:** Direct Vercel deploy/promote of the entire PR #108 tree would replace **nine** product files relative to live production and mix several unmerged T080/T097/T098/B13 drafts. Old Founder requirement is *no rebuild, no old work broken*. Therefore **NO production promotion/alias update is authorized or safe based solely on scope CI**.

## Recommended safe rollout path — do NOT execute unapproved production step
1. Keep deployed `jantabol.in` at its current known SHA and alias. Preserve existing ISRO Article IDs/PURLs and public published News.
2. Reconcile T080 public Article/News fixes + T097 private B8 design and T086 navigation as a deliberately versioned and separately reviewed integration baseline, or if essential select a **one-file nav-only patch onto the CURRENT production commit** after independent exact-production dependency/routing proof. Never directly promote a stacked feature branch.
3. Dry-run source and Auth/redirect, lost-ACK CAS, no fake Live, active Content-Security-Policy and old Phase3 News/Auth/B7/PG17 fail-closed gates at the actual intended integrated SHA. A separate SSO-isolated Vercel preview is insufficient for real post-MFA Founder E3 unless an explicit protected Founder-safe end-to-end environment can be established without exposing Production secrets.
4. After review/Founder authorization of a release candidate only, controlled staged release with tested rollback path and post-release Android **read-only** correction navigation to same UUID (no Save/Publish for ISRO). Then collect E4 independently only using a verified legitimate correction, and Live E5 via actual provider/encoder evidence; cannot mark T086 Final PASS+LOCK just from deployment.
5. Do not open a fake government outreach, paid feature, synthetic Production News alteration or a G6 private upload for test-green.

## Scope verdict and remaining gates
`T086_CORRECTION_NAV_A2_SOURCE_CI=PASS_SCOPED`
`T086_CURRENT_PRODUCTION_ALIAS_VERIFIED_UNCHANGED=YES`
`T086_DIRECT_STACKED_PR108_PRODUCTION_PROMOTION=BLOCKED_9_PRODUCT_FILE_DELTA`
`T086_EXACT_T097_READY_PREVIEW_OVERLAY=ONE_PRODUCT_FILE`
`T086_ISOLATED_PREVIEW_REAL_OWNER_AUTH=NOT_PROVEN_OR_ENABLED`
`T086_RELEASE_CANDIDATE_PRODUCTION_AUDIT=NOT_RUN`
`T086_REAL_ANDROID_POST_MFA_CORRECTION_E3=NOT_RUN`
`T086_REAL_SAME_ARTICLE_CORRECTION_AND_REPUBLISH_E4=NOT_RUN`
`T086_REAL_LIVE_ENCODER_PROVIDER_E5=NOT_RUN`
**`T086_OFFICIAL_FINAL_PASS_LOCK=HOLD`**.

This is a **release-scope review and safe stopping point**, not a deployment authorization, final acceptance or promise of protected preview connectivity. No manual user action at this checkpoint.
