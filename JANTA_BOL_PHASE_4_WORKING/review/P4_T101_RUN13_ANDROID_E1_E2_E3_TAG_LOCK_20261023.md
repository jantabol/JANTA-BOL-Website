# P4-T101 — JANTA BOL B9 Search/Archive/Filters — Final Android Gate
**Date:** 2026-10-23 (IST)  
**Verdict:** P4-T101 **PASS + LOCK** (scoped functional search/filter behavior supported by real Android UI, real published-only backend read checks, and green CI).  
**Next:** P4-T102 **NOT RUN / NOT LOCKED**; B9 overall and pre-existing B8 FINAL remain **HOLD**.

## Source and integrity
- JANTA BOL project `vrffsnkycvjithwtiylt` ONLY. Cricket/Saarthi untouched.
- Code: GitHub isolated branch `codex/b9-precode-frozen-20261022`; B9 JS invalid-date RCA commits `1e50d8ecb4d9871c53e21a4b4bf8115dafe4de8e`, VM regression `e89b5354785686fba0a959d92a01d65a5985a67c`.
- **Actual GitHub CI 39914436555**: completed SUCCESS. Five executed inherited/B9 jobs green (disposable PG17/security/static and protected original regressions); legacy B8-specific ZIP job intentionally skipped on this B9 branch. Do not call skip PASS.
- Founder updated `b9-search-ui.js` manually in Android SPCK with logically equivalent invalid-filter fix; **byte-for-byte equality with GitHub version was not verified**. Screenshots and real UI retests independently show fixed behavior.
- No production website deployment, main merge, direct Article content/status update, or private-identifier disclosure was performed for this gate. Existing T032 published test story was updated only through authenticated owner/AAL2 B9 taxonomy RPC.

## E3 — real Android SPCK evidence (screenshots in Founder conversation, not stored inside repo)
- Public Search screen loads; default returns 16 published Articles; normal Reset after validation error returns same 16.
- Keyword `Cooler` finds `Cooler m aag lagi` (1); tap opens correct immutable URL `article.html?id=690405f8-21af-4e46-9ddc-3c2e45abca9c`, with article body/photo.
- Shivpuri district-only result list 5 (verified against LIVE count); Crime category-only result 1; Pichhore positive and Jaipur negative location filters.
- 2026 year returns 16, October 2026 returns 3; October 10–20 inclusive returns 1; exact Oct 18 returns 1; 2025 year 0.
- Exact Article UUID search returns 1 with visible UUID control and matching page. `Deepak` body keyword returns 1; `Deepak` + `Crime` yields 1.
- Sort oldest displayed Aug 21, Aug 23, Sep 7; latest Oct 18, Oct 5, Oct 4; `test` relevancy candidate returned 15 and first three consistent with backend results. Sorting selection screenshots cover oldest/newest; relevance option was not simultaneously captured with results, so the **sort-selector-specific E3 screenshot is limited**; backend verifies correct returned order.
- Unmatched `xyz987654notfound` returns empty/human-readable safe state; malformed Article ID `invalid-article-123` returns Hindi validation error and clears stale entries.
- **Bug 01 RCA:** invalid start Oct 20/end Oct 10 formerly displayed old `Cooler` results while showing `B9_INVALID_DATE_RANGE`. Exact source traced to submit catch leaving `b9Results` intact. GitHub fix clears stale DOM, cursor/more, invalidates prior pending request, shows Hindi message; SPCK manual fix; real Android shows no old results and reset recovers all 16. Automated VM regression covers invalid range/no extra RPC/results clear/Hindi.
- Invalid tag `no-such-tag-b9` returns 0; positive public tag `b9-qa-test` returns exactly **1** `T032 Android Social Test` and displays `#B9 QA Test` on Android. This last Android screenshot has both filter input and correct rendered result.
- Screenshot evidence resides in chat, not as repo binary and is not substituted by synthetic tests.

## E2 — real LIVE JANTA BOL cross-check, read-only verification
- Founder on Chrome authenticated with original secured Owner/AAL2 controls; `public.jb_b9_owner_assign_term` used with `p_kind='tag'`, `p_slug='b9-qa-test'`, `p_label='B9 QA Test'`, `p_action='add'`, `p_article='d943e80f-1d58-4f5c-8d8f-75e772955d56'` (Founder-approved).
- Confirmed via READ-ONLY SQL: one taxonomy term, one article-term assignment; linked article remains `published`, version **7**, stable slug `jb-543be352-d069-489a-ab79-5c52f817a78f`; audit row `b9_manual_term_add` exists.
- `SET LOCAL ROLE anon` + real `public.jb_b9_search(p_term=>'b9-qa-test')`: **1**, exact `d943e80f-1d58-4f5c-8d8f-75e772955d56`, title `T032 Android Social Test`. No unrelated article in result.
- `public.jb_b9_search(p_term=>'no-such-tag-b9')`: 0; `p_year=2025`: 0; `Deepak` + `Crime`: 1. Previously verified year 2026=16, Oct 2026=3, old/new sort, exact-date result.
- LIVE `articles` **32** total, **16 published**, **16 hidden** (15 draft + 1 soft-deleted), per-private-UUID B9 search returns **0 hidden exposures**.
- Cursor smoke test: page 1=3, page 2=3, **0 duplicates**; Article permanent URLs unchanged. This is backend-only pagination smoke, NOT a claim that manual Android pagination was exercised at 20-item threshold.

## Scope and limitation
- P4-T101 public Android Search filters, topic positive/negative, malformed-input handling and recovery, permissions/privacy isolation and basic pagination regression all show PASS.
- **No 2024/2025 genuine production historical articles** existed, so do not claim full-scale historical device performance (P4-T105). Positive tag test intentionally uses a Founder-approved, published *test* article and leaves it tagged for P4-T102 related/discovery verification. Do not silently remove tag.
- No proof of mandatory T102-109: these remain NOT RUN. No claim of B8/Phase4 overall final PASS, Main merge, or LIVE website production deployment. The optional gaps noted above must be revisited on future regression if archive scale or 20+ matching search articles makes them material.

**Release verdict for this specific functional T101 gate: PASS + LOCK.**
