# JANTA BOL — Phase-4 RUN-13 — P4-T106 FINAL E2 + E7

**Date:** 23 October 2026 (IST)
**Original requirement:** Topic 14; SRCH-051 to SRCH-052; sections 1015–1017.
**Title:** Current Implementation Audit + Historical Topic Adoption.
**Required proof:** E2 (backend/schema/RPC) and E7 (actual source/config/migration).
**Scoped outcome:** **P4-T106 PASS + LOCK.** P4-T105 is separately **DUE — real Android + meaningful large/1–2-year archive performance**, NOT waived.

## Exact original PASS bar
- Every current implementation path is classified **Preserve / Integrate / Extend / Add Missing**.
- Historical existing Articles lacking Topic/Tag remain valid and discoverable; do not require compulsory mass manual tagging.
- No duplicate Article authority, PURL, analytics event store, or reporter identity service; legacy B0–B8 locks unaffected.

## E2 — actual LIVE project read-only SQL, not simulated / NOT Cricket
Project `vrffsnkycvjithwtiylt`, PostgreSQL17. All queries were SELECT-only; no production Article mutation, migration, tagging, permission change, or test data generation.

### Real schema/data contract
- Existing canonical `public.articles` has exactly **32** records; **16** currently public-approved Published, **16** nonpublic; canonical Article primary key exists.
- Current B9 tags: exactly **one** approved taxonomy term and **one** Article-term assignment to **one** Published story. The other **15 of 16 Published** Articles are **untagged**, not blocked or invalidated.
- Exhaustive direct B9 search by each untagged Published Article UUID: **15 of 15** public responses contain exactly that Article. **0 missing**.
- Prior-dated actual public articles before **1 Oct 2026** lacking tags: **7**. All **7/7** are found through current search by exact UUID, proving history is still accessible without Topic/Tag. These are August–September 2026 stories, NOT fictitious 2024 articles.
- Extra real historical search: **August 2026**, year=2026/month=8, **two** Published untagged articles; B9 Search returned **two**. Approved `b9-qa-test` term filter returned **one** assigned article independently. Search without any Topic/Tag filter returned all **16 Published** articles.
- Canonical `public.b9_article_terms.article_id` has an actual foreign key to the *existing* `public.articles(id)`, not a replicated Article table. No `tag_id` or `topic_id` required columns were added to `public.articles`.
- Dedicated B9 tables `b9_article_terms` and `b9_article_share_settings` are term/metrics *adjuncts*, never competing Article copies. Existing `public.article_stats` view, `public.analytics_events` event store, `public.article_public_view_settings` are still present.
- LIVE B9 SQL definition of `jb_b9_search` reads the original `public.articles`, requires Published/nondeleted status, explicitly makes `term_filter` optional, returns original `article.html?id=<UUID>` links, and has no hard year cutoff.
- LIVE Founder analytics RPC still reads `public.analytics_events`; B9 public metrics projection reuses `public.article_public_view_settings`, not a parallel analytics store.
- Runtime additive B9 migration exists in `supabase_migrations.schema_migrations`; two Published-only Article Search indexes, one analytics period index and one B9 term index installed.
- Private `b9_taxonomy_terms` and `b9_article_terms` both have RLS enabled; `anon` has no direct SELECT on Article-term mappings or raw Analytics.
- Original Article/PURL identity remains unchanged. T100/T104 separate evidence dossiers verify same IDs through versions/correction and Live Final Reports.

## E7 — actual repository source/migration audit (not merely a design claim)

Immutable original Phase-4 B8 baseline: `77bd19639d8ffe173fcd109ca234e58aef6720dc`. B9 branch `codex/b9-precode-frozen-20261022`, predecessor test-verified head `16dae2e4ab194a6e35336dfdc9ecc0d420ba9053`.

| Official classification | Reviewed actual source path | Verified implementation |
| --- | --- | --- |
| **PRESERVE** | `JANTA_BOL_PHASE_3C_WORKING/backend-client.js`, `article.html`, `website-v3.js`; `public.articles`, Article history | Existing save/publish/Article access and one UUID/PURL master identity are kept. Public news card continues `article.html?id=UUID`. No duplicate Article insertion path introduced by B9. |
| **INTEGRATE** | `analytics.html`→`b9-analytics.html`; `b9-client.js`; `b9-article-ui.js`; `public.analytics_events`, `article_stats`, `article_public_view_settings`, reporter consent | Existing analytics/navigation/Article/Reporter data remain authoritative; B9 clients are additive RPC adapters on the existing backend, not another login or analytics store. |
| **EXTEND** | `JANTA_BOL_PHASE_4_WORKING/db/20261022_b9_search_analytics_REVIEW_ONLY.sql`; `b9-search.html`, `b9-search-ui.js`, `b9-home-link.js` | Adds public-only FTS/archive indexes and published-safe optional filtering, cursor/order/date/topic UI; existing homepage/article links preserved. Review-only filename is a source label; a separately approved additive B9 migration was deployed earlier. |
| **ADD MISSING** | `b9_taxonomy_terms`, `b9_article_terms`, `b9_article_share_settings`, `b9_metric_global_settings` | Only missing optional Topic/Tag links and shares/global settings; no mass backfill, no mandatory tagging, no new Article table or privileged public raw-stat endpoint. |

- `b9-search-ui.js` uses original `JBB9.search` and safe URL/PURL, optional filters/terms; `b9-home-link.js` only appends archive navigation without replacing homepage rendering.
- `ci/phase4/b9-pg17-fixture.sql` contains an **isolated 2024-08-22 Published synthetic Article** without mandatory tagging; `ci/phase4/b9-pg17-regression.sql` verifies 2024 year/month and combined filters, archived story visibility, privacy/security and identity. This is **synthetic coverage**, NOT an actual production 2024 story.
- Existing B0/B8 code map `JANTA_BOL_PHASE_4_WORKING/CODE-MAP.md` explicitly reserves Article/public URL and Analytics authority for their original homes; current branch adds B9 by integration, not replacement.
- Prior actual GitHub Actions at SHA `16dae2e4ab194a6e35336dfdc9ecc0d420ba9053`: run `39934988365` concluded SUCCESS for isolated B9 PG17, source lineage/governance, inherited Phase3/B7 G0 and B8 G1, plus full B0–B9 source ZIP. Inherited B8-specific ZIP job SKIPPED by branch design and must NOT be misreported as SUCCESS.

## Honest limits, unchanged release gate
- Production contains no true 2024–2025 Article corpus: historic 2024 coverage is *only* synthetic, while seven actually older (Aug–Sep 2026) untagged stories were LIVE-query verified. **T105** is explicitly **DUE** for large/1–2-year archive and Android practical performance; this T106 lock is not a proxy.
- Real Android `E3` is **not an original required class for T106**. No Founder screenshot or manual action needed, and no E3 is claimed.
- Security advisor cautions around public SECURITY DEFINER projection grants remain release-review items; no blind DDL/grant relaxation.
- Any later source change making tags mandatory or replacing canonical Articles/events invalidates this result and requires T106 regression.
- **No LIVE DML/DDL, no `main` merge, no prod site deploy, no B8 status relaxation, no Cricket/Saarthi operation.**
- T100–T104 independent locked dossiers unaffected. P4-T105 DUE; P4-T107–T109 remain separately evidence gated. **B9 overall HOLD. B10 not started.**

**Final test verdict: P4-T106 E2 + E7 PASS + LOCK, T105 remains DUE.**
