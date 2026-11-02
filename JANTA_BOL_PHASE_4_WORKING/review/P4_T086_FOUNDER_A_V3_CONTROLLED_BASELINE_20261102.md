# JANTA BOL — B13 P4-T086 — Founder Decision A: V3/C1 Controlled Security Baseline

**Date:** 2026-11-02 IST. **Owner authorization:** Founder in conversation: **"Mera decision A h ab kaam continue kro"**, explicitly selecting **Controlled Baseline Update** with the historical version preserved, all ten tests retained and stronger checks, no fake PASS, no existing source/security regression or paid service.

## Exact historical baseline preserved BEFORE update
- Historical source commit: `5d5fa9bd703607f890851b7a6d5aad3e80e3285e`, 2026-10-29, where the following original pins coincide:
  - original `ci/phase4/b12/v3-c1-public-integration.test.cjs` **Git blob `47452e35d880b3123ff0782f00564d849f5a06ba`**, all original **10** named tests;
  - `JANTA_BOL_PHASE_3C_WORKING/b12-safe-nav.js`: `ede5edac22f85759facb72b189c0b90a245f0d6c`;
  - `JANTA_BOL_PHASE_3C_WORKING/backend-client.js`: `0789934809c91a39d73a6d2570d0938fb6fbb47a`;
  - `vercel.json`: `c4b515325b5766489e4af90a143887d98f8aaa8a`.
- Preserved **byte-for-byte** in new path `ci/phase4/b12/history/v3-c1-public-integration-20261029-frozen.cjs` (Git blob must remain **`47452e35d880b3123ff0782f00564d849f5a06ba`**). NO change to any bytes in the historical archive. Historic runner must checkout exact old commit and run original `ci/phase4/b12/v3-c1-public-integration.test.cjs` at its ORIGINAL location there; cannot use archived file with changed relative path as a test shortcut.
- SHA of revised current original test after explicit Founder authorization: **`474ff764ae65850863b8142318083964086d4e4e`**. The original 10 named test cases **all remain**, and a separate new reviewed parity/negative-security test asserts every change falls within this declaration.

## Precisely authorized changes — NO old product code changes
The *current-source* copy of original `ci/phase4/b12/v3-c1-public-integration.test.cjs` is updated under Founder A with **only** the exact following behavioral equivalence/strictly stronger assertions:
1. Original Fake Ticker + disabled demo forms: exact 2-form CSS matcher updated to assert current 3-selector CSS `#citizen-news-form,#official-reporter-form,#top-story[hidden]{display:none!important}`, **plus explicit** `hidden inert style="display:none" aria-hidden="true"` for BOTH original forms and `hidden` for breaking top story. The original **no false mock ticker/no fake LIVE** assertions remain unchanged.
2. Earlier text literal `जमा नहीं होगी` updated to the **current stronger truthful** `यहाँ कोई जानकारी जमा नहीं होती।`, plus explicit no-official-reporter-application copy `ऑनलाइन आवेदन अभी स्वीकार नहीं किया जा रहा है।`; the original `अभी स्वीकार नहीं किया जा रहा` assertion remains unchanged.
3. Reviewed T079 strict safe navigation addition **only** `youtube-oauth-health.html`: original pinned `b12-safe-nav.js` SHA `ede5edac...` updated to `a2107140...`; exact historical source was independently reconstructed by removing **only** that one allowlist entry. Existing negative security regression proves open redirect, encoded traversal, malicious query duplication and unknown destinations are denied.
4. Reviewed T080 correction/Article lost-ACK UUID/CAS: original `backend-client.js` SHA `07899348...` updated to `fb2c60d...`, plus existing original T080 write-outcome/error/CAS tests. This is explicitly NOT an assertion that a real production Article was edited.
5. Reviewed `vercel.json` header route now includes `published.html` in the Founder private `Cache-Control: private, no-store` route: old SHA `c4b51532...` → `ae086ea3...`. Separate source security checks confirm global headers and restricted route policy. No DNS, production preview or deploy changed.

## Mandatory independent gates, not a greenwash
**Current source run:** original *all 10* V3/C1 tests under revised original path, + new source-delta reconstruction check, + unchanged T086 16 source, 12 negative security compatibility tests, original T080 lost-ACK CAS/Founder Auth and original T083 120/120, Phase3A/3B Live source, public C1/B9/B11 and original reusable disposable PostgreSQL17 B0–B8/News/Auth/B7.
**Historical frozen run:** independent `git worktree` checkout of exact `5d5fa9bd703607f890851b7a6d5aad3e80e3285e`, verify old original test blob and the old pinned safe-nav/backend/vercel blobs and execute original 10 tests **unchanged** against its own authentic old source. Current-source FAIL cannot be excused by old-history PASS; both gated fail-hard. Archive SHA pinned in CI.
**Red conditions:** any old historical failure, current revised 10-case failure, new security negative failure, source diff outside declared 5 changes, any untouched Article/Live/News blob mutation or original PG17 failure → **STOP / not green**.

## Release truth and outstanding original T086 acceptance
This is documentary approval of a **new controlled security baseline**, NOT Founder approval to deploy, merge, publish, broadcast, enable private evidence uploads, invalidate prior original audit events or grant Owner authentication access on preview. Original commit is retained by immutable commit ref and preserved copy. Original **historical failure on latest source (old pins mismatch)** is explicitly logged in preceding PR #106 CI `#41389090262`; historic old test MUST NOT be silently retested on new code with stale pins. The current security baseline is now versioned **A/2026-11-02**, and only current revised test is eligible for current source closure after exact-head CI.

`T086_FOUNDER_DECISION_A=APPROVED_FOR_CONTROLLED_BASELINE_ONLY`.
`T086_HISTORIC_20261029_FROZEN_TEST=BYTE_IDENTICAL`.
`T086_HISTORIC_ORIGINAL_TEN_CASES=CI_PENDING`.
`T086_REVISED_ORIGINAL_TEN_CASES=CI_PENDING`.
`T086_T080_ARTICLE_CAS_AND_PHASE3_LIVE_SOURCE=CI_PENDING`.
`T086_ISOLATED_PG17_AND_OLD_NEWS_AUTH_B7=CI_PENDING`.
`T086_REAL_ANDROID_ARTICLE_E3=NOT_RUN`.
`T086_REAL_SAME_ARTICLE_PURL_CORRECT_UNPUBLISH_REPUBLISH_E4=NOT_RUN`.
`T086_REAL_PROVIDER_LIVE_E5=NOT_RUN`.
`T086_CURRENT_MFA_CORRECTION_DEEP_LINK=KNOWN_LIMITATION_NOT_FIXED`.
**`T086_OFFICIAL_FINAL_PASS_LOCK=HOLD`**.

Soft Launch priority and no rebuild: zero old product changes. No changes in live JANTA BOL database, public ISRO stories, Vercel production alias, Founder roles, login session, secrets or paid resources.
