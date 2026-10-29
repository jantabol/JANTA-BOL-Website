# JANTA BOL B9 — Viewer Home Search Discovery + Related News Readability Fix
Date: 23 October 2026 IST
**Scope:** two founder-reported public-UI defects only. **Status:** CODING + AUTOMATED CI PASS; **Android/SPCK visual parity not yet checked**. **B9 final block HOLD** as original P4-T105 real 1–2-year LIVE Article/Android at-scale proof remains missing.

## RCA 1 — "Where will visitors Search on the website?"
- Search already works as `b9-search.html`, but `b9-home-link.js` appended its only public entry to the existing `header.navbar` flex area beside the logo/hamburger; on small screens it could be overlooked/compete with header width. The standalone Search URL was proven on Android in T100/T101/T105, but homepage discovery was not independently proven.
- Minimal correction in `JANTA_BOL_PHASE_3C_WORKING/index.html`: an explicit, normal-HTML `<nav class="b9-search-entry">...` immediately after legacy `</header>` and **before** full-height homepage Hero, with one conspicuous high-contrast **“🔎 खबरें खोजें • पुरानी खबरें”** link to `b9-search.html` (44+ px touch area), plus clear explainer “शब्द, जिला, तारीख और विषय से खोजें”. Accessible aria label and keyboard focus.
- Add scoped `JANTA_BOL_PHASE_3C_WORKING/b9-home-entry.css` for dark-theme full-width compact CTA, phone width/full tap target and focus contrast. Original `style.css`, `navbar`, hamburger/menu, News cards, Ads, homepage live flow, and **protected repository-root `index.html` remain byte-for-byte unchanged**.
- Existing `b9-home-link.js` checks `id=b9SearchNav` and no-ops when the new static link exists, preventing duplicates. Static CTA remains present without backend/JS. No additional login or API required.

## RCA 2 — Related News blue URLs hard to read
- `b9-ui.css` previously defined `.b9-related a{color:#ff9092}`, but the **actual public `article.html` does not load that stylesheet**. Consequently the Related News anchors created by `b9-article-ui.js` inherited default browser **blue**.
- Surgical fix to existing `JANTA_BOL_PHASE_3C_WORKING/article.html` inline stylesheet (already shipped with this Article): `.b9-related` only, use high-contrast coral/cream `#ffd1c9` for **both normal and visited**, underline with offset, white hover/focus and visible keyboard outline. Background `#191b20`. Includes `सभी खबरें देखें →` link. No global anchor color changes, no Article ID/URL or content HTML changed. The new CSS is scoped, avoids overriding ads, login, grievance, admin or main controls.
- Automatic test computes WCAG contrast of #ffd1c9 versus #191b20 **>=7:1**; 2 classes of focus/visited coverage and original Article PURL + Search link checks.

## E1 — Real GitHub CI (NOT an Android screenshot)
- Changed `JANTA_BOL_PHASE_3C_WORKING/index.html`, created `b9-home-entry.css`, changed `article.html` scoped `style`, extended existing `ci/phase4/b9-client-and-ui.test.mjs` with two UI regression tests.
- New Node tests: exactly one `b9SearchNav`, rendered after header and before giant Hero, points to real `b9-search.html`; 46px+ touch target, mobile full-width, no JS duplicate. Article Related titles/visited contrast and PURL preserved.
- Code SHA `c56b867fde280e761b45243af9d860a2b52e2637`, GitHub Actions **39943317955 — COMPLETED SUCCESS**, verified B9 Node UI/static + isolated PostgreSQL17 (including T105 5000 synthetic Articles), 109 original Test selector, preserved original Phase3/B7 G0 and B8 PG17 G1, complete B0–B9 ZIP job. Inherited B8-only ZIP is **SKIPPED by design**, not counted as PASS.
- CI validates source logic and regression. It does not constitute an actual Android browser screenshot at this SHA or deploy to Production.

## Release boundaries and honest status
- These GitHub B9-branch commits **are not auto-synced** into the Founder's existing Android SPCK workspace nor Production root deployment. Before founder can see changes, B9 working directory files must be updated in his preview/release bundle, and if desired separately approved deployment.
- Important root `index.html` in top-level repo still protected by original B0–B8 Git hash and not changed. A production site serving only the old root will therefore **not suddenly have** the B9 Search entry until the B9-aware homepage is deployed through a reviewed release process. Do not pretend current live visitor website is already changed.
- Article Related News anchors will show coral/cream **only after updated `article.html` reaches browser**, not the old SPCK file.
- No DB DML/DDL, no Owner state changes, no GitHub main merge, no Vercel deployment, no Cricket/Saarthi cross-project action.
- P4-T100..104 and T106..109 prior locked evidence not invalidated by these cosmetic additions; revalidate any impacted production/mobile UI after updated code copied. Original P4-T105 still HOLD; **B9 FINAL PASS + LOCK still HOLD**, B10 not started.

**Scoped UI defect-fix verdict:** Source + CI PASS; **Actual viewer UI proof pending deployment/SPCK parity**.
