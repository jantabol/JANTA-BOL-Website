# JANTA BOL — Phase 4 B9: T103–T109 Backend-Only Checkpoint
Date: 2026-10-23 IST | Source: official Phase-4 Master Execution Pack (P4-T103..T109) + isolated B9 source.
**Scope: current LIVE JANTA BOL READ-ONLY SQL and disposable PG17 GitHub CI.**
**Decision: backend subchecks successful as below. T103–T109 FINAL PASS+LOCK is NOT claimed.**
Do not treat this record as production release, Android E3/E4/E5, or Founder E5 permission.

## Safe setup
- Supabase ref: `vrffsnkycvjithwtiylt` (JANTA BOL ONLY). Never touched Cricket/Saarthi.
- Live data inspected via SELECT, `BEGIN READ ONLY`, `SET LOCAL ROLE anon` and public RPCs; no LIVE INSERT/UPDATE/DELETE or schema migration, no Owner impersonation.
- GitHub B9 branch `codex/b9-precode-frozen-20261022` at `a1667a7688244b1b06defc6ab41bdccf7eb8ad46` after **one small CI-only test file change** (`ci/phase4/b9-pg17-regression.sql`). Main and original legacy code unchanged.
- Actual branch CI run **39927739806 COMPLETED SUCCESS**, B9 PG17/JS, inherited B0–B8 protected G0/G1, 109-selector validation, B0–B9 master ZIP build all successful. The inherited B8-specific full ZIP job was deliberately SKIPPED on B9 branch; do not label it PASS.

## T103 — Analytics & Public Toggles (backend E2/CI PASS; FINAL HOLD)
- Current LIVE `analytics_events` contained 86 events = **76 view + 10 share**. Immutable raw counters were NOT changed. IST boundary SELECT checks: Today 23 Oct **4** total, 7-day period 17–23 Oct **11**, 30-day period 24 Sep–23 Oct **59** (55 views/4 shares), custom 1–15 Oct **14**. These are as-observed counters and may increase after further browsing, not fixed expected values.
- Global public defaults **views=false, shares=false**; current all **16** published Articles returned both counters disabled, **0** public view/share counts exposed. All **16** nonpublic records have null public metrics.
- Under actual `anon`: `jb_b9_public_metrics(T032)` returned both OFF and null counters; nonexistent UUID returned null; Owner analytics/grant absent. Real Founder analytics screenshot from preceding manual T102 showed 30d view/share report; no manual Today/7d/custom or actual settings toggles performed in this backend-only checkpoint.
- CI synthetic asserts IST midnight and separate global/article metrics + unchanged raw events. Founder E3/E5 independent controls and no-leak regression remain required.

## T104 — Corrected Same-PURL, No Hidden News (backend E2/CI PASS; FINAL HOLD)
- 32 canonical Article UUIDs, **32 distinct**, all 32 have distinct nonempty slugs. 16 currently published, 16 hidden.
- For EACH of the 16 hidden IDs, published-search RPC returned **0**. No LIVE records edited.
- Disposable PG17 originally tests update title/body, search fresh correction, stale snippet absence, unpublish/republish same UUID+slug, and synthetic retired-identity reinsert rejection. Full correction article E4 and production lifecycle proofs must be cross-referenced in the T104 final dossier.

## T105 — Paging, Index/Performance (backend E2/CI PASS; large-scale E3 HOLD)
- REAL LIVE keyset cursor pages using 5-item page: `latest` **4 pages, 16 returned, 16 distinct**; `oldest` **4 pages, 16 returned, 16 distinct**. `relevance` query `test`, limit 4: **4 pages, 15 returned, 15 distinct**. Expected totals independently checked with one nonpaginated 50-limit query.
- Initial recursive *auditor query*, not JANTA BOL runtime, mistakenly treated JSONB literal `null` as SQL NULL and made an extra terminal RPC call, yielding expected `B9_INVALID_CURSOR`. Exact RCA: `result->'next_cursor' IS NOT NULL` is true when value is JSON null. Corrected query uses `jsonb_typeof(next_cursor)='object'`; all three full traversals then PASS. No speculative application fix.
- To prevent future misinterpretation/missing-page regression, committed an additional synthetic exhaustive 1-record-per-page **latest/oldest/relevance** test to `ci/phase4/b9-pg17-regression.sql` on separate branch only. Green CI `39927739806` proves it passes against disposable PG17.
- Presence of B9 GIN public-only text index, partial btree archive index, analytics period btree, taxonomy index verified on LIVE. Single current 16-article `EXPLAIN ANALYZE` measured **12.683ms** for one `Deepak` search; one small sample is **not** a credible historical high-load performance PASS. 2024 synthetic fixture exists in CI; actual 2-year live Android historical corpus unavailable. T105 full-scale gate stays HOLD.

## T106 — Preserve/Re-use Source (backend/code E7 PASS; FINAL HOLD)
- No parallel Article store: same `public.articles`, `analytics_events`, Phase-4 B2 view settings reused, new shares metadata independent. 32 live articles retain original identity, current 1 Approved Tag assignment, no mass tagging.
- Original protected Phase3 News/Auth/B7 and B8 RLS/Owner G0/G1 workflow jobs SUCCESS on new source SHA. Runtime cross-component end-to-end regression remains separate.

## T107 — Search Negative Matrix (backend E2 PASS; FINAL HOLD)
- Actual `anon` RPC: `xyz987654notfound` 0, nonexistent UUID 0, `no-such-tag-b9` 0, positive `b9-qa-test` exactly 1, public archive 16. Direct `anon` SELECT on articles was correctly **DENIED**; query path is RPC, not full-table ACL.
- Invalid reverse date -> `B9_INVALID_DATE_RANGE`; malformed cursor -> `B9_INVALID_CURSOR`; month 13 -> `B9_INVALID_MONTH`. These are intentional fail-closed backend denials.
- 16 hidden Article IDs exposed 0. Prior T101 Android invalid-range stale-results RCA/fix and reset screenshots are independently recorded; T107 all mandatory E1/E2/E3/E4 follow-on gate not yet certified.

## T108 — Analytics Owner Gate / Privacy (backend E2 PASS; FINAL HOLD)
- Anon has NO EXECUTE on `jb_b9_owner_analytics`, `jb_b9_owner_metric_settings`, `jb_b9_owner_assign_term`; raw analytics and private metric/share/topic tables have no direct anon SELECT.
- Live anon attempted owner-analytics RPC and received genuine `42501 permission denied`. All 16 public counters OFF/null, no hidden metrics.
- Disposable PG17 verifies Owner AAL2 and rejects AAL1/outsider, separate raw/display override consistency. Real Founder E5 ON/OFF/Override and 7d/30d/custom UI proof NOT RUN in this checkpoint.

## T109 — Failure Isolation & Original Regression (backend/CI E2/E7 PASS; FINAL HOLD)
- Malformed filters fail closed with errors; next healthy anon Search returned the unchanged **16 published** and original `article.html?id=d943e80f-1d58-4f5c-8d8f-75e772955d56` PURL.
- Actual GitHub G0/G1 protected suites + original 109 official test selector + PG17 B9 DB ACL checks + optional artifact build SUCCESS.
- A real forced outage/partial-media failure and full Android regression of all original modules were NOT carried out and must not be claimed.

## Advisor review — No blind security changes
- LIVE Supabase Security Advisor reported existing general WARN about public `SECURITY DEFINER` RPC execute exposure (six intentional B9 read-only public projections, three authenticated Owner/AAL2 actions), and INFO for several B9 RLS-enabled tables with **no direct policies**. That is intentional deny-by-default only if grants/RPC authorization remain correct; this checkpoint verified PUBLIC EXECUTE only on the approved projected functions and no direct private-table access. These advisor warnings are NOT automatically exploitable proof, but must stay visible for release review.
- Existing Performance Advisor noted B9 new text index currently unused on tiny data, and old `articles` staff RLS initplan warning. No performance index/RLS rewrites on LIVE because this is not approval to risk previous B0–B8.

## Release control
**P4-T100, T101, T102 remain individually LOCKED by earlier evidence.**
**P4-T103..T109: BACKEND E2/E7 CHECKS COMPLETED AS ABOVE; FINAL PASS+LOCK HOLD pending genuine other mandatory evidence.**
**B9 block overall not locked. B10 not started.**
No production DB writes, migrations, website deploy, main merge, credentials or private DB exports during this checkpoint.
