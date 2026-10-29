# JANTA BOL — P4-T107 RUN-13 FINAL TEST DOSSIER (23 OCT 2026 IST)

**Topic 14**: Complete Search Functional + Privacy Test Family. Original locked source: Phase-4 321-page Master Execution Pack, SRCH-053–058, sections 1018–1023.
**Official required proof**: **E1 + E2 + E3 + E4**; Phase-3 baseline/News/Auth regression.
**Verdict**: **P4-T107 PASS + LOCK** with **explicit reuse** of prior real Android screenshots from P4-T101/P4-T102 and original PURL/identity evidence from P4-T100/P4-T104. **No new Android test was performed in T107**. Do not confuse this with T105 or current production website deployment.

## E1 — current source-bound GitHub CI, actual logs, not estimated

- JANTA BOL repo `jantabol/JANTA-BOL-Website`, branch `codex/b9-precode-frozen-20261022`.
- New T107 scoped **CI-only synthetic** regression added at commit `ae584790e0623b024c7ebdf6e4c59c9775c1f4bf` to `ci/phase4/b9-pg17-regression.sql`. No product code, production SQL, public permissions or data touched.
- GitHub Actions run **39936748401** on exact commit: **completed SUCCESS**. B9 isolated PostgreSQL17 DB migration/functional/privacy/AAL2 tests, baseline/109 original test-selector source checks, inherited protected B0–B8 Phase3/B7 G0+B8 PG17 G1 and complete B0–B9 ZIP job all SUCCESS. The inherited B8-only ZIP job is **SKIPPED by branch policy**, not PASS.
- Actual PG17 job logs executed new T107 body search, exact UUID/PURL, historical 2024 untagged, inclusive year/month/date-range, district/location/category combined, latest/oldest, no automatic unapproved tag, nonpublic draft/unpublished/deleted UUID negatives, public projection allowlist, and Related News public-only. Job exits with `B9 PG17 regression PASS only on synthetic fixture`; SQL transaction **ROLLBACK**. Existing PG17 tests also cover Owner/AAL1/outsider negative, custom dates, corrected stale snippet, opt-out reporter/byline, pagination, index outage/rebuild recovery.

## E2 — independent LIVE JANTA BOL backend / anon / negative tests

Source Supabase project `vrffsnkycvjithwtiylt` only; **all live queries read-only**; no actual Article/Reporter status mutation, no new identity, no admin impersonation.

### Exhaustive status/PURL/privacy

- 32 Article IDs scanned. 16 currently public Published, 16 hidden. Current B9 search returns **16 public**, **0 hidden leaks**. Exhaustive exact-ID check: 0 Published missing, 0 wrong PURLs, 0 stale published titles, 0 hidden IDs discoverable.
- Executed **actual `SET LOCAL ROLE anon`** function calls in `BEGIN READ ONLY`: public Search gives 16; nonexistent UUID 0; `PRIVATE_ID_NUMBER_12345` 0. Search projection keys are strictly `category,district,excerpt,id,location,news_date,permanent_url,published_at,terms,title`. **No raw source, Govt-ID, audit, private reporter identity or analytics fields** in returned rows.
- `anon` direct SELECT denied for canonical `articles`, `article_sources`, `audit_logs`, `analytics_events`, `b9_taxonomy_terms`, `b9_article_terms`; `grievance_private_identity` and `grievance_evidence` ACL checks also negative. `anon` EXECUTE denied for all 3 B9 Owner analytics/display/manual term functions; public projections only.
- Safety distinction: search body source is the already-approved `public.articles.body`, not a private-source/identity table; a normal Published article body is intentionally searchable but never emitted wholesale as a Search snippet.

### LIVE functional matrix (independently rerun)

| Surface | Real public RPC result |
| --- | --- |
| Entire archive | 16 |
| Headline `Cooler` | 1 |
| Body `Deepak` | 1 |
| Body `Deepak` + Crime category | 1 |
| Year 2026 / year 2025 | 16 / 0 |
| October 2026 | 3 |
| 10–20 Oct 2026 inclusive | 1 |
| 18 Oct exact date | 1 |
| District Shivpuri / location Pichhore | 5 / 16 |
| Location Jaipur / Category Crime | 0 / 1 |
| Approved manual tag `b9-qa-test` / missing tag | 1 / 0 |
| Unmatched keyword | 0 |
| Historical 2024 (real production) | 0 — **no 2024 Article exists**, not a cutoff |
- LIVE keyset paging **4 records/page**: latest 4 pages **16/16 unique**; oldest 4 pages **16/16 unique**; relevance query `test` 4 pages **15/15 unique**; 0 duplicates in each mode.
- 16 Published Articles × 5 Related recommendations = **80** real public Related edges; 0 hidden targets, 0 self-hits, 0 wrong PURLs; response projection is public-safe.
- One manually approved Topic/Tag exists, **1** visible suggestion, **2** stored manual-term-add audit events; 15 Published remain untagged and searchable. Public reporter directory returns one consenting account; existing T102 public-byline/consent E2 and inherited B1 opt-out/role-change tests reused.
- Invalid `p_month=13`, `p_year=120`, `p_sort=arbitrary`, malformed cursor, overlong query produced their expected **fail-closed** backend errors. Reverse-date refusal already proven in inherited live T101 evidence and PG17 regression; a *new independent live reverse-date call was blocked by client safety checks* and is **not** counted as a freshly executed negative here.

## E3 — Previously captured REAL Founder Android (REUSED, not re-performed)

P4-T101 and T102 Android/SPCK tests were previously carried out on **the current B9 functional UI family**, before the T107 **CI-only** file addition. No B9 public Search/Related/Reporter/Article UI source was changed by T107, so their actual screenshots are valid inherited scope evidence:
- T101 public Search UI, headline/body search, combined filters, exact Article ID/PURL, year/month/date-range, district/location/category, latest/oldest, unmatched/no-result, missing tag, manually approved positive tag, reset and invalid-date stale-results recovery.
- T102 Android Related 5, same PURL link click, “Sab Dekhein” Archive 16, public consenting Reporter list; plus previously locked B1 Android Founder public-name OFF→ON history/consent test (not re-performed, current B9 negative consent regression verifies OFF branch).
- **Known limits** retained honestly: T101 notes that edited Android SPCK file bytes were not proven byte-identical to GitHub; relevance sort selection was not independently captured in the same screenshot. Full keyset/relevance/pagination checked by actual backend and synthetic PG17, not newly on Android T107. T105 still must test real large-archive phone/tablet performance.

## E4 — stable real Article identity proof (REUSED)

- Earlier locked **T100** genuine real Article history and URL; **T104** real same-ID correction history/current search + **2** real Published Live Final Reports both correctly attached to the original session Article UUID and permanent `article.html?id=<UUID>` (0 duplicate identities). The new T107 CI matrix also confirms exact UUID/PURL for existing and old untagged synthetic stories.
- T101/T102 Android clicked actual permanent Article links and matched published body. No new ID is generated by tag approval, Related News, reporter opt-out or Search paging. No new Live/Article status change was initiated here.

## Final gate and nonclaims

- **T107 E1/E2** newly executed; **E3/E4** legitimately reused existing Founder Android and Article/Live lifecycle proof. No new Founder manual step needed for this scoped matrix.
- Public/anonymous role checks and source verification cannot establish full production code-byte parity to Android SPCK; reopen if SPCK/site source changes or founder requests a new release parity proof.
- T105 **DUE** (large real history + Android performance); T108 and T109 **NOT FINAL LOCKED**. B9 block and B8 final gate remain HOLD; B10 not started.
- No LIVE business data writing, `main` merge, production deployment, public grant broadening, or Cricket/Saarthi touch.

**P4-T107 FINAL TEST: PASS + LOCK, E1+E2+E3(inherited)+E4(inherited)**.
