# JANTA BOL — PHASE-4 B9 SEARCH + ANALYTICS — FULL CODING CANDIDATE
**Status: IMPLEMENTATION SOURCE COMPLETE for all T100–T109 categories; tests NOT FINAL PASS.**  
**Founder instruction:** one full coding block, then full-source ZIP, then real tests before any B10.  
**Base:** immutable B8 full source `77bd19639d8ffe173fcd109ca234e58aef6720dc`; branch `codex/b9-precode-frozen-20261022`.

## 10/10 Requirement Coding Surfaces
| Official ID | Code & Contract | Staged Coding Status | Test Truth |
|---|---|---|---|
| P4-T100 | Existing Article UUID/PURL, no one-year archive cutoff; published+not soft-deleted; keyset, index, historic fixture | Implemented candidate | MANUAL & PROD NOT RUN |
| P4-T101 | `b9-search.html`, `b9-search-ui.js`, accessible Android filter/ID/date/year/month/district/location/category/topic/order/page/error | Implemented candidate | Android E3 NOT RUN |
| P4-T102 | `b9_taxonomy_terms`, `b9_article_terms`, manual Founder Approval, `jb_b9_related_news`, `jb_b9_public_article_author`, reporter opt-out/departure | Implemented candidate | Android ON/OFF E3 NOT RUN |
| P4-T103 | Reuses `analytics_events`, `article_stats`, `article_public_view_settings`, audited public global/article views/shares display and original raw counters | Implemented candidate | LIVE E2/E3/E5 NOT RUN |
| P4-T104 | Only public Article text indexed, corrections re-read same row, Live/PURL preserved, index rebuild and unpublish/republish synthetic tests | Implemented candidate | Real Article identity E4 NOT RUN |
| P4-T105 | PG17 native FTS and page keyset; responsive phone UX and IST analytics, old 2024 synthetic fixture | Implemented candidate | large archive Android PERF E3 NOT RUN |
| P4-T106 | Preserve/Integrate/Extend/Add Missing map in pre-code gate + implementation; historical Articles valid untagged | Implemented candidate | formal E2/E7 release gate NOT RUN |
| P4-T107 | PG17 synthetic privacy negative matrix + JS filter and UI contracts; no raw Source/hidden case index | Implemented candidate | Android and PROD E2 NOT RUN |
| P4-T108 | Separate share-button count, Today/7d/30d/custom IST, Owner/AAL2 view overrides; raw data never exposed publicly | Implemented candidate | Android/real audit E3/E5 NOT RUN |
| P4-T109 | B9 failure isolation from publishing/PURL/B7/B8, protected B0–B8 CI, synthetic negatives + RCA gate | Implemented candidate | full final gate NOT RUN |

## Exact Implementation
- New backend migration **REVIEW_ONLY** `db/20261022_b9_search_analytics_REVIEW_ONLY.sql`. No LIVE Supabase DDL applied. Reuses canonical Article, anonymous safe search, taxonomy, public reporters and metrics settings; owner actions require server `private.current_owner_aal2()`. Direct table grants to anon denied on new private tables and raw analytics.
- New public Search/Archive HTML/JS/CSS and Founder Advanced Analytics HTML/JS; existing Site/Article/Analytics changed **minimally** only to link B9 components and to prevent reporter name opt-out byline leakage and track WhatsApp Share-button use.
- No separate Article table, no new parallel login, no raw analytics public endpoint, no copy of B8 confidential case, no blanket anon SELECT of internal source columns.
- Existing service-only `jb_records_set_public_views_internal` remains the canonical article views update authority; this module delegates to it from an outer AAL2-guarded definer. Existing `article_public_view_settings` table not duplicated. New settings only global defaults & shares (previously missing).
- Search sort stable cursor (timestamp+UUID+rank), historic 2024 fixture demonstrates no one-year cutoff; actual Android with 1–2 year old article unavailable until sufficient real archive exists. No false E3 PASS.
- Site fallback: Search failure does not prevent direct `article.html?id=UUID` or News Publish. Analytics and optional Related/Counter RPC failures swallowed only in optional public widgets; server private denial remains fail-closed.
- All personal/secret values remain in live secure systems. Code snapshot includes synthetic test data, SQL migrations (not executed live), standard public Supabase publishable configuration, original B0–B8 source, no private dump.

## Real CI vs real product trials
- `b9-precode-protected-ci.yml` executes original protected Phase3 static/News/Auth/B7 and B8 PG17 regressions; B9 isolated PG17 fixture + migration + search/privacy/analytics/role negatives; and Node B9 client/UI contracts.
- `b9-pg17-regression.sql` uses disposable synthetic data only. Reached genuine RCA: first script unexpectedly prohibited article override (wrong `not p_global` guard); corrected to `p_global`, exact synthetic PG17 re-run passed. Error never affected production. Regression later extends correction/reindex and reporter byline ON/OFF.
- `build_b0_b9_full_source_zip.py` captures all tracked source files and validates member SHA256+CRC and immutable Git HEAD ancestry. GitHub Action produces exactly `PHASE_4_B9_BLOCK_COMPLETE.zip` when **all** protected and B9 coding jobs are GREEN.
- Archive source SHA and final GitHub run ID will be included dynamically in the ZIP manifest. Do not equate Green E1/E2 synthetic with live E2, E3, E4 or E5.
- B8 remains FINAL HOLD: real Editor E3, official E9 and unrelated B8 case-to-article operational E4 are NOT RUN; B9 was developed independently without modifying those states.

## Manual testing entry gate
- All B9 files can be audited in source ZIP; existing PROD and main are unchanged.
- First need separate Founder approval before applying review-only B9 SQL to live database or deploying any B9 preview. Only then real E2, E3 and E4 can run.
- B9 tests run as one formal RUN-13 family P4-T100..109; evidence E1/E2/E3/E4/E5/E7 exactly per original PDF. E3/real E4 require Founder Android screenshots and real article identity.
- All P4-T100..109 **NOT RUN** in official Final Test Register until genuinely tested. **B9 PASS+LOCK = HOLD**. B10 cannot start until evidence-based closure.
