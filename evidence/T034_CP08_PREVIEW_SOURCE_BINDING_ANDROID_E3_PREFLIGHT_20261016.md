# JANTA BOL — P4-T034 — CP08 exact E3 Android preview source-binding audit
**Date:** 2026-10-16 | **Decision:** **CP08 SOURCE CODE BINDING = VERIFIED (selected frontend files); ACTUAL HTTP ROUTE + ANDROID E3 = NOT TESTED**. **T034 FINAL PASS+LOCK = HOLD**.

## 1. Identified production-versus-B7 source divergence — proven

- Protected GitHub production branch `main`, reviewed SHA `265856ca9cbfd6c7d51989d85435397b72f24c8d`.
- Vercel production project `shubham-pichhore-2028` ID `prj_xNb9G3xjW35qSXEyF7o2qiCqG4HI`, known ready production deployment `dpl_77cFA5hkJbSZodB32vok79yQG71y`, source `main` commit `b59da2c674c7c9bb924419cf2e14dbd70d908992`. Later documentation commits do not establish that frontend B7 was promoted.
- `main/index.html` blob `e82e88aee6e953f0eb0f817361cb87c3a5194aae`: no B7 advertisement request CTA and no `advertise-request.html` route reference.
- Working B7 application is under **`JANTA_BOL_PHASE_3C_WORKING/`** on review branch `review/t034-cp03-ads008-20261015`, head `6227cb950b042576b1acea5b0e81b2a5175d2e14`. **NOT MERGED into main**. Thus the Vercel production root is **NOT** an authorized ADS001 or ADS006 Android E3 evidence target.

## 2. Suitable existing Vercel PREVIEW source identity — established only at deployment metadata / Git blob level

- Reviewed Vercel **READY, target=preview (null)** deployment `dpl_CAvS9JgK7PdpGHXMAqoUkwHV8BB1`.
- Its URL: `https://shubham-pichhore-2028-ech17huzo-shubhamshrivastava295-9848.vercel.app`.
- Its Git metadata is `review/t034-cp03-ads008-20261015` at commit `c998b5cc612fccf0908aefd541437c5ab1260a94` (older than branch head).
- Independently compared actual Git **blob SHA equality for the following 12 E3 frontend/static files between this exact older deployed commit and newer review head**:
  - `index.html`: `14beb7ab0de1d9f8fa3aad8ae3404aad28407b4e`.
  - `article.html`: `d2d414bef645c21404bcc45baa5aebbf7f9ff43e`.
  - `advertise-request.html`: `676e39bca7c311aba6170c7d91264e53c500e93d`.
  - `ads.html`: `6021678bd6ae6603afd7eccd447bd78e32bbf8d3`.
  - `public-ads.js`: `6c5fe29e8a68148b8bd728e1776387b11a6311d6`.
  - `public-ads.css`: `bcab554388387b6371c8948883b3f101a7bd0416`.
  - `phase4-domain-client.js`: `eb522ba7c3e8aa3471ea6051c3033b70c5804700`.
  - `backend-client.js`: `0789934809c91a39d73a6d2570d0938fb6fbb47a`.
  - `supabase-config.js`: `ceb2d5d3a5ccd1b31f561a2511f92d39c9bfdfff`.
  - `admin-auth.js`: `e0c751cbaa6582aa00ffd82d23f03c01956142f7`.
  - `website-v3.js`: `b2fec2b015c959938b6f7294bd77fc191f1165f4`.
  - `phase2-client.js`: `cec4bb870aa59d5a18e2401922f7de347bdbc40e`.
- These are **source blob equalities**, not HTTP URL accessibility, deployed response byte-for-byte proof, real Supabase E2, or Android E3.
- Vercel source file-list API returned `404: File tree not found` for both inspected Git deployments. Independent HTTP read from execution environment was unavailable. Do **not** claim the preview route has been verified remotely.

## 3. Verified relevant UI contracts in review source

- Working homepage `JANTA_BOL_PHASE_3C_WORKING/index.html` has `<a href="advertise-request.html?origin=homepage">विज्ञापन के लिए संपर्क करें</a>` and a single `.jb-ad-region`.
- Working article `article.html` loads shared `public-ads.js`, and article CTA/UI still must be validated on-device (especially a real published Article UUID).
- Working public request page `advertise-request.html` clearly says submission is Pending, not automatic LIVE, and uses `jb_ad_public_enquiry` with an explicit WhatsApp consent. This is connected to **real JANTA BOL Supabase publishable frontend configuration**; preview is NOT a sandbox DB merely because hostname is Vercel Preview.
- Owner queue `ads.html` lists Pending entries and custom/standard request kind, with IST timestamp; requires real Owner access and backend UI E3 evidence.
- Supporting Chromium 360px fake browser test and fake owner queue test exist on review head, but do **not** replace real Android.

## 4. Strict Android preview preflight — NEXT REQUIRED USER STEP

First perform **view-only**, **without submitting any contact/WhatsApp data** or authenticating as Owner:

- On user's Android tablet/phone open:
  `https://shubham-pichhore-2028-ech17huzo-shubhamshrivastava295-9848.vercel.app/JANTA_BOL_PHASE_3C_WORKING/index.html`
- Capture screenshot including browser address bar and page CTA or exact HTTP/protection error; send to reviewer.
- If 404/403/SSO/password gate, mark ROUTE=HOLD and diagnose release routing; do not fabricate success or disable protection.
- If homepage accessible, verify **only** CTA visibility/click destination and viewport; the next step requires explicit consent to controlled TEST request against LIVE Supabase (do not create duplicate, paid/live, or advertiser account records).
- Follow on with a real published Article view, then Owner queue after separately verifying login/MFA and no write actions. No password/OTP/token screenshots.

## 5. Release gates & stop conditions

1. Bind preview's full **HTTP route** to reviewed deployment metadata and immutable file SHAs. Preview not to be confused with production.
2. Real Founder Android E3 homepage+article 360px/contact CTA, pending form readability, Owner pending queue. Record real screenshots + URL+device+date+result without exposing contact or private IDs.
3. Complete controlled E2 backend and real E5 JWT/AAL1/AAL2 role negatives/positive, including ADS008 payment guard, using staging/safe nonfinancial fixtures where possible. Never fabricate live financial records for tests.
4. Re-audit all nine ADS-001…009; preserve live ADS008 guard and actual real Backup G3 PASS.
5. Only then decide if limited, nonbreaking frontend files should be promoted to main and subsequent production Android test; do not merge whole Phase3C / B7 working tree or unreviewed PR #15.

**Lock status: CP08 STATIC SOURCE BINDING VERIFIED / E3 MANUAL UNRUN / T034 FINAL HOLD — NO FAKE PASS.**
