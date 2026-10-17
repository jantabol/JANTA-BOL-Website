# JANTA BOL — P4-T035 / CP04 VERIFIED DEPLOYED PREVIEW GATE
Date: 16 Oct 2026 (IST)
**Status: Source/URL binding and HTTPS READ-ONLY preflight PASS; Android E3 NOT RUN.**

## Why this gate matters: exact first divergence
- Vercel project `shubham-pichhore-2028` id `prj_xNb9G3xjW35qSXEyF7o2qiCqG4HI`.
- Vercel directly confirmed preview deployment **`dpl_5XdZMutNujbnaU5U1gUbskSgSHBg` READY**, preview target `null` (**NOT production**), exact GitHub branch `review/t035-cp02-media-safe-20261016` and SHA `a1f6135cc72e94dca1a2da9a610cfcdf2bd9f38d`.
- Preview hostname `shubham-pichhore-2028-mgj4krww4-shubhamshrivastava295-9848.vercel.app`.
- Important repo source map: **root `index.html` is an older/independent legacy landing page**; REAL Android news app source is `JANTA_BOL_PHASE_3C_WORKING/index.html`, `article.html`, `ads.html`, `public-ads.js`. The original public GET-only preflight checked `/index.html` (HTTP200 but missing ad slot) and correctly **FAILED**, rather than pretending the root site was the tested news app:
  [Initial CP04 CI failure #38897487296](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38897487296).
- FIRST DIVERGENCE RCA: **wrong deployment route path, not the Advertisement UI component**. The exact new minimum safe change updates ONLY the CI test paths to `/JANTA_BOL_PHASE_3C_WORKING/...`. No new Vercel rewrite, production alias, domain, DNS, news code or advertisement code deployed by this check.
- Final [CI **#38897613852** SUCCESS](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38897613852): independent GitHub Actions 4 READ-ONLY HTTPS GETs of the exact pinned READY Vercel deployed preview all returned HTTP200 with expected real frontend source markers:
  1. `/JANTA_BOL_PHASE_3C_WORKING/index.html`: one homepage ad-placement element.
  2. `/JANTA_BOL_PHASE_3C_WORKING/article.html`: Article paid slot element.
  3. `/JANTA_BOL_PHASE_3C_WORKING/ads.html`: Owner Local File Preview — NO UPLOAD control.
  4. `/JANTA_BOL_PHASE_3C_WORKING/public-ads.js`: CP02 decodedPoster frontend fix.
- No User JWT, Owner session, media POST, advertiser data, real article modification, payment, Production SQL or Cricket service involved.

## VERIFIED CP04 Android handoff — ONLY when Founder chooses to test
Exact verified preview **Ad Studio** page:
`https://shubham-pichhore-2028-mgj4krww4-shubhamshrivastava295-9848.vercel.app/JANTA_BOL_PHASE_3C_WORKING/ads.html`
This is a **PREVIEW** for Founder Android E3, NOT the future official public domain or Production release. First manual step: open with ordinary Android Chrome, send screenshot of initial page state; DO NOT upload creative, save/approve draft, mark payment or go LIVE. Continue one manual step at a time according to screenshot and Owner privacy.

## Unresolved mandatory launch gate
- The domain root still serves legacy `/index.html`. The eventual official domain must route correctly to the real news app and preserve Article permanent URLs. **DOMAIN ROOT ROUTING/PRODUCTION CUTOVER DUE** and requires separate Founder approval.
- The app continues to use legacy client `scopeForArticle` with Gwalior→global and no official district/tehsil verified pairing: **ADS-014 real backend geo authority DUE**, no first LIVE paid ad.
- In absence of approved paid ad: blank paid slots are correct; **not** E3 positive proof of live paid ad/media. Real Android media selection remains LOCAL PREVIEW ONLY and cannot be accepted as secure upload/approved release.
- B7 canonical final T035 E2+E3/ADS010..015 remain **DUE/NO LOCK**. CP03 E1 Chromium and synthetic PG are independently PASS only at their explicit scope; CP04 deployed route static GET proof is narrower than actual real Android E3.

**NO GUESS / NO ROOT-ROUTE FAKE PASS / NO PRODUCTION WRITE**
