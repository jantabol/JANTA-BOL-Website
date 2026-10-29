# JANTA BOL — P4-T109 FINAL FAILURE ISOLATION / RCA / SECURITY / REGRESSION AUDIT

Date: 23 October 2026 IST. Official Phase-4 Master Execution Pack (321 pages), RUN-13, Topic 14 SRCH-064–069 (sections 1029–1034).
**Test class:** EVIDENCE-GATED / FINAL; evidence **E1 + E2 + E4 + E5 + E7** (NOT E3).
**Scoped test verdict:** **P4-T109 PASS + LOCK (development/test source, not production deployment)**.
**Overall B9 FINAL gate remains HOLD:** P4-T105 has demonstrable E1/E2 and real current Android E3, but lacks real Android evidence of a genuinely 1–2-year-old Article/large archive. T109 must NOT silently waive this original T105 condition, alter E3 meaning, or declare B9 FINAL LOCK. All T109 failure simulations are isolated and non-destructive.

## E1: intentional FAIL -> RCA -> smallest product fixes -> actual GREEN protected CI
**Exact branch:** `codex/b9-precode-frozen-20261022` in `jantabol/JANTA-BOL-Website`; NOT default/main.
1. Commit `12a470401c4d61d4d1f4fd90fa75aec812cbf6f2` added 3 dedicated Node VM injected-error tests to existing `ci/phase4/b9-client-and-ui.test.mjs`, without changing app code.
2. **Real GitHub Actions 39941595919**, B9 source/JS test job **FAILED as expected**: `not ok 7` Search backend failure left old visible Article results, `not ok 8` Founder Analytics backend failure left old previous-period summary. `ok 9` optional Reporter/Analytics/Related failures did NOT unmount canonical Article. These are genuine T109 red tests; not a fabricated defect or harmless pre-existing CI claim.
3. RCA-SEARCH: `b9-search-ui.js` caught remote errors and hid paging but did not empty `b9Results`; old entries risked being mistaken for a new query. Public caught-error text also echoed low-level remote error details.
4. **Minimal product fix** `3f9245f5df63b15b26433e8a1acb2680ed514de1`: on **current request** RPC failure, clear visible Results, hide pager/reset cursor, show readable privacy-safe Hindi message without exposing remote internals. Healthy retry uses same Search page and restores results. No Article publishing/back-end modifications.
5. RCA-ANALYTICS: `b9-analytics-ui.js` caught a failed Owner report but left the former period's raw rows/summary onscreen, potentially misrepresenting failed date period.
6. **Minimal product fix** `64d57f4313e383c1b9637bd0a3fcf50d4c681688`: on failed report clear `summary` and `articleRows`, show safe Hindi error and explicitly state News/Article publishing is independent; legitimate retries still possible. Original event store/Owner RPC/AAL2 unchanged.
7. **Real final code-bearing CI** run **39941684289**, source SHA `64d57f4313e383c1b9637bd0a3fcf50d4c681688`: **SUCCESS**, including B9 isolated PostgreSQL17 regression + full Node B9 frontend/controller tests + 109 test-ID source check + protected B0–B8 Phase3 News/Auth/B7 original G0 and B8 actual PG17 G1 + complete B0–B9 source ZIP. Legacy B8-only ZIP path intentionally SKIPPED, not treated as PASS. No production credentials present in CI.
8. Tests explicitly verify (a) old Search results vanish on injected failure, internal error details not echoed, pager hidden, (b) subsequent successful query recovers without reload, (c) Founder old analytics summary/rows vanish on remote error, (d) both page/fallback behaviors do not call publish, (e) 3 optional Article widgets fail independently while canonical Article remains mounted.

## E2: live JANTA BOL read-only security + continuity
Live Supabase project `vrffsnkycvjithwtiylt` **ONLY**. All production evidence is `BEGIN READ ONLY`, SELECT and `SET LOCAL ROLE anon`; no intentional production service outage, no operator/editor changes and no live data mutations.

| Verified surface | Actual observation at audit |
| --- | --- |
| Article records | 32 canonical UUIDs, 16 Published / 16 hidden |
| Search without filters under anon | 16 Published |
| Exhaustive hidden Article UUID Search | 16/16 hidden return 0 |
| Published exact UUID and permanent URL | 16/16 correctly `article.html?id=<UUID>` |
| Missing ID / unapproved tag / nonpublic sentinel under anon | 0 / 0 / 0 |
| anon direct SELECT private tables | No `articles`, `article_sources`, `grievance_private_identity`, `audit_logs`, `analytics_events` grants |
| anon privileged Owner analytics and settings RPC | Both EXECUTE denied |
| Public Views/Shares | Global defaults OFF/OFF; all 16 published counters null to public |
| Index and identity safeguards | Published-only B9 full-text index present; canonical retired-Article-ID guard enabled |

- Source confirms no Search, Analytics or optional Related RPC must be available for `article.html?id=<UUID>` to fetch the canonical Article via original `JBBackend.getArticle`, render its body and preserve Share buttons.
- Injected outage tests are isolated VM failures, **NOT a live production outage**; cross-system publishing independence is supported by original protected Phase3 publishing/News/Auth regression and unchanged public Article implementation. No fake LIVE-site media-network outage claim.

## E4: real Article identity / correction / LIVE -> Final report (prior evidence reused)
- Original published Article IDs/slugs remain stable across `article_versions` historical corrections, unpublish/republish (original P4-T100 and T104 real E4 records). Browser Android earlier opened 21 Aug 2026 Article `df97df06-a246-4e4e-ac5d-1f965fa6b381` by its immutable Article URL (T105 E3 reused, not re-executed).
- **2/2** real completed Phase3B LIVE Final Reports link back to their original Live Session Article UUID with **0 duplicate Article identity**; no forced fake new LIVE story. The PG17 B9 test corpus additionally exercises title/body correction, staleness gone, Unpublished hidden, republish SAME UUID/slug, retired-ID reinsertion denied, index rebuild and missing-index fallback in disposable PostgreSQL17.

## E5: immutable governance / raw analytics audit history reused
- Live `audit_logs` currently contains **890 `article_update` events**, **3** `b9_metric_display_control` before/after actor-authenticated real Founder controls events (original T103 E5) and **2** Phase3B Final Report `finalize` + **2** `publish` audit events.
- Founder-approved public display ON -> OFF test (T103) restored original display default/Article settings; no source/audit rows removed or rewritten for T109. B9 Owner settings use **server-side private.current_owner_aal2()**. Negative Owner AAL1 / non-owner AAL2 simulated PG17; actual anonymous permissions verified from source/live roles.
- No historical raw analytics was copied into new public event tables; existing 4-column event store retained.

## E7: exactly-scoped source diff / original regression / coverage
- Original official T109 coverage: Search and Analytics component failures; direct Article/PURL/publishing safety; public/Owner permission negatives and private-ID enumeration; Source privacy; event-display override restricted; old Article/Category/District/Homepage/Share/Correction/Unpublish-Republish/LIVE Final Report/Public View controls.
- The only product files changed for T109 were **`JANTA_BOL_PHASE_3C_WORKING/b9-search-ui.js`** and **`b9-analytics-ui.js`**, with only failure-visible-state fixes; one B9 Node regression test file. Original `backend-client.js`, `article.html`, `website-v3.js`, publishing and Live SQL remain unchanged by T109. Protected source checks and old G0/G1 suites passed exact final functional commit SHA.
- P4-T101/T102/T103/T104/T106/T107/T108 prior formal evidence and protected CI are reused, not silently repeated or weakened. No accidental crossing into Cricket/Saarthi repo/project.
- Current SPCK working copy or a deployed website **has not been verified byte-for-byte against the newly fixed GitHub source**; T109 is a developer/test source lock, NOT a claim that every user device already has the two new error-state fixes.
- Full original Phase4 B9 test family P4-T100..109 checked in official `TEST-REGISTER.md`. Original 109 selectors present, no change in old B0–B8 closure status. Existing B8 FINAL hold remains unchanged.

## Formal gate decision
- **T109 E1/E2/E4/E5/E7 PASS + LOCK**, with inherited LIVE lifecycle and original protected tests distinctly identified. No Founder manual E3 required by original T109.
- **B9 coding/security baseline can be frozen as candidate**, but **B9 FINAL PASS+LOCK MUST remain HOLD** due P4-T105's known unfulfilled real 1–2-year archive + large archive Android performance E3 requirement. User can share a legitimate dated historical corpus later; never manufacture old news or hide DUE.
- B10 is not authorized until B9 final gate legitimately closes. Small UI fixes to B9 on branch can be tracked with new exact-scope tests, but a final production release must also establish SPCK/production parity.

**Scoped T109 verdict: PASS+LOCK. Overall B9 FINAL verdict: HOLD (T105 single original evidence blocker).**
