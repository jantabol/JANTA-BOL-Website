# P4-T102 — RUN-13 — Topic/Tag, Related News, Public Reporter Discovery
**Date:** 23 Oct 2026 | **Verdict:** PASS + LOCK for T102 only, with explicitly reused pre-existing B1 Reporter lifecycle evidence.

## Official source
Phase-4 321-page Master Execution Blueprint, Topic 14, SRCH-022..024, Sections 965–976. Required E2 + E3 + E4; Related 3–5, "Sab Dekhein", public-only, reporter ON/OFF, departure preserves history.

## E3 — Android, actual Founder screenshots (23 October)
1. On `T032 Android Social Test`, Article ID `d943e80f-1d58-4f5c-8d8f-75e772955d56`, real SPCK Preview showed Related News **5**, "सभी खबरें देखें →", five links and original permanent UUID.
2. Tapping Related `099 test` opened the correct permanent Article ID `14539159-7091-4697-9e19-2927048a06a5`, full body, persistent related links, public byline only for opted-in reporter.
3. "सभी खबरें देखें →" opened `b9-search.html`, loading then completed; Android public Archive showed exactly **16** articles and opted-in directory `sonali1997 — 7 प्रकाशित खबरें`. User screenshots displayed initial loading, 16 results, full bottom of archive and public reporter directory.
4. One approved `b9-qa-test` tag on `T032` was previously verified on Android/public Search under P4-T101 (one correctly tagged article); existing articles without tags continue to appear.
5. **Reporter public-name OFF→ON real Android proof reused (NOT rerun)** from pre-existing locked P4-T026 original register: Founder toggled `Public Name OFF` to `ON` on device, UI/history recorded `team_public_name_changed`. This existed before B9 and is reused rather than touching a real reporter account twice. No new real departure performed.

## E2 — LIVE read-only verification (23 October)
- Supabase project `vrffsnkycvjithwtiylt`, not Cricket. `SET LOCAL ROLE anon` actual `public.jb_b9_search`: **16** currently published. 16 other (draft/deleted) never public.
- `public.jb_b9_related_news(T032,5)` = five stable JSON records and correct Permanent URLs, in Android same order: `099 test`, `T096 Final Report — Live engine test`, `Cooler m aag lagi`, `T006 Normal Publishing Independence Test`, `FLOW G TEST 029-037 EDIT FIXCHECK OFFLINE 42 NEWER`. Verified underlying five article records have `published` and `deleted_at IS NULL` and related set excludes T032 itself.
- Public reporter discovery returns exactly one consenting, eligible display name `sonali1997` with **7** published articles. Public author RPC for `099 test` returned same name. On Article UI the opted-in name shows, independently reproducing part of public discovery logic.
- Permission/privacy negative: for matching reporter/article combinations with OFF/ineligible status or hidden Article state, current `public.jb_b9_public_article_author` exposure count **0**. No raw private reporter identity/credentials query or output was involved.

## E4 — original lifecycle & protected synthetic regression evidence
- Existing **P4-T024 — PASS** test register: reporter departure preserved historical Article, Live Session, reporter identity while current newsroom privileges were revoked. This directly provides required departure E4 evidence without risky repeat action in LIVE.
- Existing **P4-T026 — PASS**: real device Public Name OFF→ON + history/audit from B1. Preserved B0–B8 test register and protected CI job.
- Isolated PostgreSQL17 B9 `ci/phase4/b9-pg17-regression.sql` checks opting in, draft byline null, opt-out directory negative, public-name OFF removes discovery and byline while leaving published archive searchable. No live account changes. Latest already-green B9 CI at start: `39922986784` (six jobs: SQL SUCCESS, B9 source SUCCESS, inherited G0/G1 SUCCESS, release ZIP SUCCESS, B8 ZIP deliberately SKIPPED). Any new documentation commits must re-pass CI; record final run separately.
- Relevant production routines require Owner/AAL2; no security bypass.

## Non-claims / scope
- This release **reuses** original P4-T024/T026 E3/E4 proofs for lifecycle. B9-specific live public discovery during OFF and live real departure were **not repeated** because reusing original evidence is sufficient to establish preserved behavior together with B9 synthetic/off-line guard; re-open T102 on divergence, if future code changes affect B9 directory, or if Founder requires new OFF-state Android capture.
- No independent 2024-25 historical corpus or high-scale performance claim (T105). No article status/publish/purl change. No B8 FINAL lock, no B9 overall lock, no deployment or main merge. P4-T103–T109 are NOT RUN.
- Android screenshots stored in ChatGPT conversation rather than attached to Git ZIP; archival binary import pending only if evidence bundle retention policy requires it.

**T102 verdict: PASS + LOCK on linked original and current evidence; no unnecessary Android repetition.**
