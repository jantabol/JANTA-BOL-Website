# JANTA BOL — P4-T071 / C1 Exact Completion Attempt (27 Oct 2026)
**Founder:** "To complete kro c1". **Master:** T071 RECOV-019..026 p.304; route V1.0 C1 source identity and core publishing/LIVE baseline. **VERDICT: C1 SOURCE AND ISOLATED-HTTP PASS; C1 ACTUAL RELEASE-BASELINE STILL HOLD. DO NOT CLAIM FINAL C1 OR T071 LOCK.**

## What was actually accomplished

**1) Tested immutable complete news source over REAL local HTTP, not an imagined site:**
- New protected GitHub workflow `.github/workflows/b11-t071-c1-candidate-isolated-http-actual.yml` pinned Git candidate **`b509c60fceb053a51686f67e587d4922a40fa6f4`** (existing PR #46, unchanged).
- **GitHub Actions run `40521614075`, job `122249930247`: SUCCESS.**
- Started actual `python3 -m http.server --bind 127.0.0.1` on GitHub disposable runner with precisely that source tree; **six requested paths HTTP 200**, nonexistent 7th path **HTTP 404**:
  `JANTA_BOL_PHASE_3C_WORKING/index.html`,
  `article.html`,
  `live.html`,
  `b9-search.html`,
  `backend-client.js`,
  `phase3a-live-client.js`.
- **Scope:** real immutable static file/routing functionality in an isolated runner; NOT hosted authenticated frontend, JS executed in browser, Supabase-backed published Article body, current Vercel SHA parity, or real broadcaster LIVE.

**2) Verified older independent same-source CI and live read-only state:**
- C1 source identity/anti-fabrication run `40520079790` SUCCESS: 19/19 C1/source evidence cases; 19/19 PR46 B9 public-truth/search source tests; 2/2 original LIVE source parity; original Publisher Owner/AAL2/Compliance injection source simulation passed. Total 40/40 counted Node cases (not hosted Owner publish).
- Production `main` and Vercel production both pinned **`f447231c0677644ca5a44cc19f12cf0314ff38ea`**, Vercel `dpl_nFSo2MXg3ASBPgUfXRYDzv2ybP8C` READY. Production `/` 200, `/article.html`, `/live.html`, `/b9-search.html` **404**; production static homepage still embeds a LIVE badge despite 16 actual DB sessions OFF.
- Old PR46 preview `dpl_7HvpnryrKX6CSnKkrBefsZSTkuXk` (actual SHA **`cebc088d38e6bddcbb163ef5d84852dafdeb3f28`**) served full candidate paths **HTTP 200**, but did NOT match final PR46 candidate HEAD. A 200 static response does **not** prove authenticated or anonymous Article content loads.
- Live Supabase read-only: **16 nondeleted published, 15 nondeleted drafts**, 16 live sessions OFF, 7 public LIVE feed OFF. **`anon` direct `public.articles SELECT` grant = FALSE**, 100/100 public base tables RLS; `anon` `jb_b9_search('T032')` returns 1 accessible summary item. The B9 search result item fields are **`category,district,excerpt,id,location,news_date,permanent_url,published_at,terms,title`**; it **does not contain full article `body`**. Exact PR46 `getArticle` and `listPublishedPublic` access `.from('articles').select(...)`, which cannot be assumed accessible to anonymous users. This is an **actual backend contract gap**, not permission to GRANT unrestricted article access.
- No Founder AAL2 production publish was performed. 16 public published rows still have editorial QA-readiness concerns. Do **NOT** reveal article bodies by broad table grant / automatically flip Ad/LIVE/publicity before separate safety and Founder release approval.

**3) Attempted exact latest PR46 Vercel preview without changing Production:**
- Explicit Vercel **preview-only** Git-source deployment of current PR46 HEAD `b509c60f...` against the existing `shubham-pichhore-2028` project.
- First request with literal target `preview` returned `400` (tool/API requires omission of target to select default preview). Corrected immediately and retried **without a target**.
- Vercel then returned **`402 payment_required`, `api-deployments-free-per-day`, more than 100 deployments today, `retryAfter=86400`**. **No paid upgrade**, no bypass via new project, no main merge, no production deployment. Can't honestly claim same-SHA Vercel preview today.
- Old prior review preview has verified HTTP but cannot be used as a substitute for the final candidate source.

## Exact remaining items INSIDE existing C1 only — no extra gates

| Original C1 facet | Verified | Status |
|---|---|---|
| Git/Vercel production identity and exact repo tree | Yes, exact SHA match | **PASS** |
| Original phase3/Core Publishing + LIVE source regression | Yes, 40 source cases + 1 publisher simulated pass | **PASS scoped** |
| Full source candidate Page routes served over actual local HTTP | Yes, 6/6 HTTP 200 | **PASS isolated** |
| One exact final candidate source serving on a normal protected Vercel preview | **Vercel 402 daily free deployment cap**; latest known preview is older SHA | **HOLD** |
| Anonymous public Article **full body** read, unchanged private protection | Direct anon table SELECT denied, B9 Search only excerpts, cannot claim full article | **HOLD** |
| Real Owner/AAL2 publish protection + LIVE truthful/OFF in candidate runtime | Source guard only; Production static badge inconsistent with OFF; can't impersonate Founder | **HOLD** |

### Minimum safe path to actual C1 PASS (not a new numbered gate)
1. **Existing PR46 final HEAD exact SHA preview** on existing Vercel free account once deployment API cap resets (no paid/extra host); capture precise SHA and static + browser page delivery.
2. **Narrow auditable public-read endpoint** for published/nondeleted Article fields/body, with strict RLS/privacy and no broad `GRANT SELECT articles TO anon`; run isolated negative cases; no production mutation without Founder authorized publication safety. B9 search is not a full-body endpoint.
3. Same-SHA real guest Article read in browser and truthful LIVE OFF presentation, with old Core Publishing/LIVE regression; Founder/AAL2 real publishing assertion only via authorized Founder session or separate synthetic Auth integration—not an impersonated production Owner. Count any intentionally unavailable optional LIVE/provider as OFF/WAIT, not fabricated LIVE.
4. Independent C1 evidence review and then mark **C1 PASS+LOCK**. All are already C1 items under route V1; no sixth gate.

**Exactly current status:** `C1_BACKEND_SOURCE_AND_LOCAL_HTTP_AUDIT=PASS_WITH_SCOPE`; `C1_REAL_USER_RELEASE_BASELINE=HOLD`; `T071_FINAL=HOLD`; `T072=NOT_STARTED`; `jantaboli.in=FOUNDER_DEFERRED_OUTSIDE_T071`.

**Production unchanged:** Git Main, Vercel production SHA, Supabase RLS/News data, paid Ads, LIVE sessions, roles and email untouched. No Cricket/Saarthi.


## NEW independently observed release-preview breakthrough — 27 October 2026 (supersedes old Vercel 402 blocker)
**The old statement that an exact-Candidate Vercel Preview cannot be created is HISTORICAL; new preview now exists.**
- Founder continued execution. On existing Vercel project `shubham-pichhore-2028` / ID `prj_xNb9G3xjW35qSXEyF7o2qiCqG4HI`, explicitly made **one preview-only Git deployment**, no production target, from **unchanged PR #47 exact SHA `ddd80abbec0abd4f60e1e4556334365f599005ef`**, ref `codex/t071-c1-public-read-secure-20261027`. Vercel deployment `dpl_5se4Pgpa95ipioEreDP8nMF4VqXR` reached **READY**; `target=null` Preview (not Production); Git hash/branch independently retrieved from deployment metadata.
- Its existing-project preview URL is `https://shubham-pichhore-2028-nqwlwu9fa-shubhamshrivastava295-9848.vercel.app`. Vercel authenticated read-only HTTP probe confirmed `/` **200**, `/JANTA_BOL_PHASE_3C_WORKING/index.html` **200**, `article.html` **200**, `live.html` **200**, `b9-search.html` **200**, `backend-client.js` **200**. Bare root `/article.html` and `/live.html` are **404**, but root `/` redirects to the actual folder index; page-relative links are folder-scoped. **Do not claim root bare paths are supported.**
- **C1 exact Vercel Preview SHA + static full News/LIVE/Search Article delivery = PASS**, fixing one real prior blocker. **No live Founder published-content read or credentialed role/action E2E was performed**. HTML HTTP 200 is not evidence that JavaScript ran or fetched permitted Article body.
- **Live JANTA BOL Supabase independently inspected with `BEGIN TRANSACTION READ ONLY`, no private content output:** `jb_c1_public_articles` candidate RPC **NOT DEPLOYED** (`false` for function existence), `anon` direct `articles SELECT` denied. Exactly **16 nondeleted marked-published Articles**, **14 titles matching common QA/Test/Demo identifiers**, **6 empty body**, **7 bodies <40 characters**, **14 without cover**. These are diagnostic title/length **aggregate counts**, not independent editorial content review. It would be reckless to deploy a SECURITY DEFINER public full-body endpoint over these records by default, even though isolated PG17 function tests passed. The public visibility decision remains Founder-only; do not broad GRANT direct anon table SELECT.
- Production Git Main and Vercel Production remain SHA `f447231c0677644ca5a44cc19f12cf0314ff38ea`, READY (unchanged).
- **UPDATED C1:** exact-source Vercel Preview availability **PASS**; Hosted anonymous full published-body reading **HOLD** because function absent and QA-marked material could be exposed; real Founder/AAL2 publish E2E + truthful Browser LIVE state **HOLD**. **C1 FINAL PASS+LOCK = HOLD**, C2+C4 real fully-integrated dependencies HOLD. This is an original-scope C1 closure issue, **not** a sixth T071 gate.
- **Minimum safe path:** Founder verifies and voluntarily UNPUBLISHES old QA/demo records through current Founder-only lifecycle (no deletes/rebuild), approves which verified News content genuinely belongs in public feed; then independently security-check scoped RPC and deploy only when safe against exact preview with permitted guest read and real Founder AAL2 action (no pretending a synthetic owner is a real session). Nothing here silently authorizes changing Production Article status or migrating public RPC.

### Same-sha Preview static dependency verification (additional real hosted evidence)
The Preview's actual homepage HTML lists **10 local JS/CSS dependencies**. Independently fetched all ten through the exact candidate Vercel URL; every one returned **HTTP 200 and nonempty expected JavaScript/CSS content**: `style.css`, `public-ads.css`, `b9-home-entry.css`, `admin-data.js`, `script.js`, `supabase-config.js`, `backend-client.js`, `website-v3.js`, `b9-home-link.js`, `public-ads.js`. **10/10 real hosted static resources PASS.** This does not prove browser execution or any Supabase RPC succeeded. The published guest-body backend RPC is independently absent. No credentials logged.
