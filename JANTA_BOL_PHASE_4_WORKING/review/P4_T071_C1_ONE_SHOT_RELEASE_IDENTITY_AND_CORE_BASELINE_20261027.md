# JANTA BOL — Phase 4 / P4-T071 — C1 Source Identity + Core News/LIVE Baseline
**Date:** 27 October 2026 IST. **Founder instruction:** start C1, finish one-shot/backend-first, single report.  
**Authority:** latest Phase4 Master p.304, P4-T071 / RECOV-019–026 / RUN-10 and fixed T071 Closure Route V1.0 **C1**.  
**FINAL VERDICT: C1 E1 IDENTITY/BASELINE AUDIT COMPLETED; C1 END-TO-END BASELINE = HOLD. NOT A C1 PASS OR T071 LOCK.**

## 1. Single-shot independently executed proofs

**Verified GitHub Actions run: `40520079790`, job `122244472675` — SUCCESS.** Test workflow:
`.github/workflows/b11-t071-c1-real-source-and-baseline-READONLY.yml`. It ran independent source/negative guards under PR #45 with **read-only** checkouts:

- **Production source SHA** `f447231c0677644ca5a44cc19f12cf0314ff38ea`, identical to Vercel Production deployment `dpl_nFSo2MXg3ASBPgUfXRYDzv2ybP8C` (**READY**). Exact Git source tree verified in separate checkout.
- **PR #45 T071 review branch** itself contains a standalone static root `index.html` but **not** the full `JANTA_BOL_PHASE_3C_WORKING/article.html`, `live.html` or B9 Search. PR #45 is not the public-news release tree.
- **PR #46 full news candidate** `b509c60fceb053a51686f67e587d4922a40fa6f4` has News index, Article, LIVE and B9 Search files plus `vercel.json` root redirect. **Not merged and no Vercel preview for that exact latest SHA was confirmed.** Existing verified preview `dpl_7HvpnryrKX6CSnKkrBefsZSTkuXk` serves SHA `cebc088d38e6bddcbb163ef5d84852dafdeb3f28`, NOT current PR #46 HEAD.
- **Independent C1 source/deploy/DB negative-evidence suite: 19/19 PASS**. The tests deliberately REJECT fake Article `200`, fake Founder/AAL2 publish PASS, falsely active LIVE, prematurely passed full C1, and source SHA substitution.
- **Same exact PR #46 source** B9 Search/public-truth/branding: **19/19 PASS** (source/VM scope). Original Owner/AAL2 publishing denial, publish under simulated Compliance outage and immutable/recovery regression **PASS** via `p4-t019-publishing-fault-injection.cjs` (**mocked API, not real Founder write**). B8 LIVE parity source guard **2/2 PASS**.
- **Total numbered Node cases freshly executed = 40/40 PASS**, plus one standalone simulated publishing test. These tests **do not assert deployed public-end-to-end recovery**, since the audited release is not that source tree.

## 2. Actual Vercel public HTTP evidence, fetched read-only

| Deployment | Route | HTTP | Source identity / conclusion |
|---|---|---:|---|
| Production `dpl_nFSo2MXg3ASBPgUfXRYDzv2ybP8C` | `/` | **200** | Old standalone static landing, with LIVE badge and unreviewed headline strings still embedded. |
| Same Production | `/article.html` | **404** | Actual news Article route not served from this production source. |
| Same Production | `/live.html` | **404** | The actual LIVE control/read route not served at this URL. |
| Same Production | `/b9-search.html` | **404** | B9 Search not served at this URL. |
| PR45 review preview `dpl_5mDrS1nUwvVQpLu4Kd9KSMapecnE`, SHA `ba067def545043489e76af9eec31785a1aca2b83` | `/` | **200** | Same static root approach; not PR45's exact current HEAD. |
| Same PR45 preview | `/article.html`, `/live.html`, `/b9-search.html` | **404** | No integrated news Article/LIVE/B9 baseline, so cannot award C1 PASS. |
| Separate PR46 preview `dpl_7HvpnryrKX6CSnKkrBefsZSTkuXk`, SHA `cebc088d38e6bddcbb163ef5d84852dafdeb3f28` | `/`, `/JANTA_BOL_PHASE_3C_WORKING/article.html`, `.../live.html`, `.../b9-search.html` | **200 each** | Candidate paths are delivered from **older preview**, **not** from the newest PR46 HEAD. HTTP 200 does **NOT** prove article data loaded / Owner publish / LIVE streaming. |

**Source mismatch is a concrete existing C1 sub-requirement blocker**, not a newly invented sixth T071 gate.

## 3. Live Supabase read-only E1 baseline — no Founder impersonation

Actual connected Supabase project `vrffsnkycvjithwtiylt`; every query executed inside a **READ ONLY** transaction. No production mutation and no private grievance/payment/source documents retrieved.

- **16** non-deleted `published` Articles, **15** non-deleted `draft` Articles; **not an independently reviewed public editorial-launch approval**.
- **16 LIVE sessions** were `public_status=OFF`; **7** `public_live_feed` records `public_status=OFF`. **Zero positive live-stream evidence.** Production public root has a static LIVE badge despite these states; cannot call the visible live state truthful without a real UI check.
- **100/100** public base tables RLS enabled (scope: tables checked). `anon` role cannot directly `SELECT public.articles`; `authenticated` role has a table-level select grant (RLS still applies).
- **Anonymous B9 Search RPC** `jb_b9_search('T032')` returned one item through the role-appropriate RPC. However candidate `backend-client.js` `listPublishedPublic()` directly uses `.from('articles').select(...)`, conflicting with missing `anon` table grant. This is a **specific possible public-home news-read gap** to resolve via authorized minimal public read path; opening private tables or bypassing RLS is **NOT approved**.
- Owner/AAL2 publish was **not** performed on Production. Publishing permission and conflict/failure checks PASSED in source-level mock only. No unauthorized Founder approval or permanent news PURL was generated.

## 4. C1 closure ledger — only original four facets, NO NEW GATES

| Original fixed C1 component | Evidence today | Honest verdict |
|---|---|---|
| Exact current production Git+Vercel source identity | Exact SHA parity `f447231c...`, read-only Git tree and Vercel GET | **PASS for production identity binding** |
| One complete same-source current **release candidate** for Article read, News Publishing and LIVE baseline | PR45 review branch is static-only; latest PR46 full source is separate and not served from its exact latest HEAD | **HOLD** |
| Public Article read and correctly represented LIVE **actually available** to citizen | Live production Article/LIVE/B9 routes 404, public root stale static badge; 16 LIVE DB OFF and anon direct Article SELECT denied | **HOLD** |
| Original Founder-publish protection + Phase3/Core Publishing and LIVE regression | Same PR46 source: 19/19 B9 public truth, mock Publisher PASS, 2/2 LIVE guard | **PASS selected source/VM only; LIVE end-to-end HOLD** |

**C1 final = HOLD**. Same-release public Article and truthful LIVE baseline is the current hard stop. A green source guard does not close C1.

## 5. Exact minimal clearing plan when source/release work resumes — no surprise new condition
1. **Bind the already-built full News/LIVE/Article candidate to one exact release preview** (use PR #46 existing code, no rebuild; retain source SHA and existing Founder sign-off gates). Do NOT merge PR #45 to Main merely to claim preview parity.
2. **In that exact candidate** verify a logged-out public Article link reads truly permitted published content (or an honest empty-state). Ensure direct anonymous read doesn't bypass RLS; use existing public-safe RPC/approved API if needed, no broad GRANT/false read PASS.
3. **Show only genuine LIVE/OFF state** on that same candidate and original Core Publisher behavior under proper Owner/AAL2 with the smallest genuinely authorized isolated test and logs. Continue using source-only mocks for safety only, not as runtime substitute.
4. Re-run **only the newly affected** Phase3 News/LIVE regression and independently compare the exact Git SHA with the served candidate. If all those existing C1 facts PASS, recommend **C1 PASS+LOCK** and begin C2. Unrelated editorial cleanup and custom `jantaboli.in` remain separate launch items, not added C1 requirements.

## Safety and scope
- No JANTA BOL Production Database writes, Supabase grants, Edge deploy, Founder login, LIVE/Ads operations, payment, Vercel deployment/promotion, GitHub merge, or Cricket/Saarthi resource touched.
- Source inspection and PR45 test code/report changes are **unmerged** in review branch.
- **No mandatory Android Manual step was requested or performed in this single-shot audit**; finishing actual Founder publish evidence may eventually require authorized Android AAL2 action, but don't ask for it until a genuinely testable isolated candidate exists.
- **`jantaboli.in` domain stays DUE separately**. `P4-T071` Final HOLD; `P4-T072` NOT STARTED.

**This is the truthful single-shot result: C1 inspection complete and concrete release blockers established; C1 actual full PASS not achieved. No invented completion.**
