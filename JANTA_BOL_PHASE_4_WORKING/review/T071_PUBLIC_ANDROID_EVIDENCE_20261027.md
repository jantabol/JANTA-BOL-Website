# JANTA BOL — T071 / SOFT LAUNCH — Founder Android public evidence

**Observed:** 2026-10-27, 16:16 IST (device screenshot clock).  
**Target:** `https://shubham-pichhore-2028.vercel.app/` (public unauthenticated page).  
**Evidence type:** Founder-provided real Android public-screen screenshots (3 images in ChatGPT discussion; images are not uploaded to this Git repository). **Not** an independent automated HTTP assertion or secret-bearing authenticated test.

## What the public browser actually displayed

1. Header **JANTA BOL** and **red "LIVE"** badge in hero area.
2. Red **"Breaking News"** ticker containing the headline **"शिवपुरी अस्पताल में भ्रष्टाचार का आरोप।"** and **"पिछोर में भारी बारिश से कई रास्ते बंद।"**; screenshots do **not** establish whether these statements are true/false or independently editorially verified. Treat them as **unsupported static-content publication risk**, not authenticated reporting.
3. Prominent **"शिवपुरी में भारी बारिश, कई रास्ते बंद"** top-story card.
4. A **"Trending News"** display with precise claims of **28.4K, 24.7K, 21.3K, 18.6K, 15.1K views**. Existing GitHub main `index.html` contains identical hard-coded sample copy and view numbers. No actual viewer-analytics proof has been provided.

## Source / deployment reconciliation (read only)

- Vercel production target `dpl_nFSo2MXg3ASBPgUfXRYDzv2ybP8C` is READY, attached to domain above, and links to GitHub `main` SHA `f447231c0677644ca5a44cc19f12cf0314ff38ea`. Public screenshots match the visible sections of that original static root HTML.
- This resolves the earlier **"is the static editorial material visible on actual public website?"** uncertainty to **YES for the 3 photographed regions**. It does *not* mean every URL, live-service state or private route has been tested.
- This is a **material SOFT LAUNCH editorial truthfulness blocker**: a static red LIVE badge and unsourced demo headlines/views should not represent current authenticated news.
- Existing PR #36 (unmerged DRAFT, head `658f474d6ee0f24efac60f069979e8adee1e9221`) has a reviewed source candidate which clears hard-coded mock headlines, static LIVE and fake counters **in the nested homepage**, with a `vercel.json` public-root redirect candidate. This candidate is **not deployed** and remains subject to safe review / regression / Founder scoped release.
- Additional **candidate risk discovered on read-only code inspection**: `JANTA_BOL_PHASE_3C_WORKING/script.js` still handles `citizen-news-form` and `official-reporter-form` by showing **"जानकारी प्राप्त हुई"** / **"आवेदन प्राप्त हुआ"** while its own text admits **"यह V2 डेमो है"**. For a public launch, these must be connected to a proven persisted workflow or unambiguously disabled/marked unavailable before any submission; otherwise the UI can misleadingly acknowledge a request never submitted. This is *source* risk; Founder has **not** tested those candidate forms on the actual served page.
- Contact-only Ads and article/PURL source mappings must be independently checked before any redirect/cutover; no automatic migration or privileged release.

## Classification / next gates

- **Public root visible confirmation (Founder Android, 3 pictured regions): E3 OBSERVED / ISSUE CONFIRMED.**
- **T071 selected offline CI:** 66/66 PASS on run `40489474106`, unaffected.
- **T071 full 13/13 hosted fault matrix:** NOT RUN; full RPO/RTO NOT ESTABLISHED; E8 and **T071 FINAL LOCK HOLD**.
- **Soft Launch:** NO GO pending correction, reviewed article/feed/Ad+privacy/route regressions and explicit Founder release authorization.
- **T070 full E8:** HOLD, separate requirement.

## Safe next task

Prepare a **branch-only reviewed public-only mitigation** that preserves existing root HTML SHA and canonical Article/PURL paths; verify source integrity + negative UI behavior for LIVE, mock headline, fake views and demo form false-success; verify actual preview routes + Android public page before seeking a Founder-scoped production release. No live fault injection, real DB write, Vercel deploy, root replacement, main merge, or Cricket/Saarthi access is authorized by this checkpoint.
