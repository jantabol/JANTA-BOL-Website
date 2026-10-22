# JANTA BOL — Phase-4 B9 PRE-CODING GATE / SOURCE FREEZE
**Date:** 2026-10-22 (Asia/Kolkata)  
**Scope:** ONLY source freeze, lineage, baseline CI, exact requirements/impact/evidence matrix. **No B9 product code, no SQL DDL, no deploy.**

## Founder authority / original baseline
- Founder selected the complete Phase-4 B8 master source ZIP as B9 coding STARTING POINT, explicitly requested professional pre-coding gates before writing B9 product code.
- **Immutable base commit:** `77bd19639d8ffe173fcd109ca234e58aef6720dc` (608 tracked source files, archive CRC/SHA256 checked in pre-code audit; user also owns copy).
- **B9 preparation branch:** `codex/b9-precode-frozen-20261022` created DIRECTLY at that exact commit. The B9 branch's HEAD advances only for PRE-CODE evidence/governance/CI scaffolding until Founder explicitly starts coding.
- Main is ancestor `265856ca9cbfd6c7d51989d85435397b72f24c8d`, **not the selected source HEAD**, and was not merged or touched.
- `codex/b8-e5-owner-idle-lock-20261022` remains DRAFT PR #37, unmerged. No live production merge.
- `review/b8-softlaunch-factual-public-20261022` head `658f474d6ee0f24efac60f069979e8adee1e9221` is a DIVERGED sibling, *not included*. `git compare 77bd..658f` shows six affected paths, including `JANTA_BOL_PHASE_3C_WORKING/index.html`, `website-v3.js`, `vercel.json`, a shared B8 workflow and added softlaunch tests/report. **Conflict policy:** before modifying homepage/feed files in B9, audit that sibling's exact relevant diffs; no blind cherry-pick, no parallel homepage authority. This is a recorded integration watch, not a base blocker.
- Protected root `index.html`, `script.js`, `style.css` hash-pinned by pre-code workflow; no file overwritten to pass tests.

## Formal requirement mapping (PDF is higher source of truth)
Original user-supplied `JANTA_BOL_PHASE_4_MASTER_EXECUTION_PACK.pdf` (321 pp, Sections 1–1034 and final 109 tests) is the canonical requirement, not this summary. B9 = Topic14, **Sections 924–1034, P4-T100..T109, RUN-13**, B0–B8 not rebuilt. Actual test outcomes rely on E1/E2/E3/E4/E5/E7 as prescribed for each ID; code existence alone never PASS.

| ID | Focus | Real required proof | Pre-code result |
|---|---|---|---|
| T100 | Source/PURL/public-state/archive boundary | E1 E2 E4 E7 | NOT RUN |
| T101 | Search/filter/sort/pagination/error Android | E1 E2 E3 E4 | NOT RUN |
| T102 | Topic/tag, related, reporter ON/OFF/departure | E2 E3 E4 | NOT RUN |
| T103 | Time ranges, 2 counters, public display controls | E1 E2 E3 E5 | NOT RUN |
| T104 | Corrected index, live identity, Admin boundary | E1 E2 E4 E5 | NOT RUN |
| T105 | Actual large archive + Android performance | E1 E2 E3 | NOT RUN |
| T106 | Existing source audit, historical untagged valid | E2 E7 | NOT RUN |
| T107 | Full search privacy/functional matrix | E1 E2 E3 E4 | NOT RUN |
| T108 | Full analytics privacy/raw-versus-display | E1 E2 E5 | NOT RUN |
| T109 | Failure isolation / negative / old CI / RCA | E1 E2 E4 E5 E7 | NOT RUN |

## Read-only live Supabase evidence snapshot
- JANTA BOL project `vrffsnkycvjithwtiylt`; ACTIVE_HEALTHY PostgreSQL 17.6.1.155.
- `articles`: 32 (16 published, 15 drafts, 1 soft-deleted).
- `analytics_events`: 82 (72 view, 10 share), 0 checked orphan IDs.
- `b8_cases`: 1 private; `b8_g4_public_revisions`: 0 public releases.
- Source and metrics REUSE: `articles`, `analytics_events`, existing `article_stats` (`security_invoker=true`), `article_public_view_settings`, `public_reporter_directory()` with `public_name_enabled` and team status checks.
- Public anonymous article permission is **column-level**, not blanket table grants. No new PUBLIC SELECT on private columns.
- No observed dedicated public/private table named search/topic/tag/related, nor pg_trgm/unaccent extension. Search index must never scrape `article_sources`, identity, private B8, audit/history or raw analytics.
- Only Aug–Oct 2026 actual dated articles: real 1–2-year-old archive Android proof impossible now. Use isolated historical fixtures, report real old-story evidence NOT RUN, never fabricate a LIVE record.

## Scoped preservation plan
- Incremental B9 architecture/source mapping FIRST, then implementation only on later explicit coding instruction.
- Reuse articles UUID/PURL and owner/AAL2, existing analytics event records, reporter opt-in authority; preserve core homepage, article lifecycle, B7, B8 private/public boundary.
- Native PG17 low-cost search strategy in disposable test DB, deterministic pagination, Hindi/English behavior, fail-closed public-state filtering, no hard one-year cutoff.
- Public search / analytics failures MUST NOT break direct article URL, publishing, correction, ads, or B8 private-case visibility.
- Story tags optional for historic Articles; Reporter OFF/departed privacy tested; public Views/Shares controls must never mutate raw counts.
- B8 E4/E5(Editor)/E9 evidence and final official lock remain HOLD. B9 may be developed independently but never silently turn those to PASS.

## CI architecture gate
- Precode branch CI is activated for **every push**, no limited path filter, by `.github/workflows/b9-precode-protected-ci.yml`.
- That wrapper invokes the EXISTING `.github/workflows/b8-g0-g1-disposable-pg17-and-protected-static.yml` via its newly enabled `workflow_call` entry. This **reuses** original isolated PG17 B8 role/ACL/safety and old Phase3 News/Auth STATIC + B7 gates. No duplicated weaker checkers.
- Separate branch-origin guard verifies ancestry of `77bd`, protected original hash, 109 unique canonical random test selector IDs including B9 100–109.
- **Limit:** inherited workflow's named "Phase3" job is static/security and B7 source/closure, not proof that all historical Phase3 LIVE/DB/device suites ran at this SHA. Those full impacted suites remain mandatory at first coding/release gate. No fake full-Phase3 PASS.
- Workflow run ID and observed conclusion must be appended after actual CI finishes; Green before feature code.

## Evidence reconciliation (append-only; no fake promotion)
- Current official `TEST-REGISTER.md` contains old RUN-07 notification PASS entries from 2026-10-03 but no up-to-date individual T092–T109 outcomes. Preserve its old facts; do not change historic B3 statuses.
- Historical B8 G5 evidence manifest `B8_G5_OFFICIAL_EVIDENCE_MANIFEST_20261017.json` still classifies P4-T092..T099 as DUE with incomplete real external E9; this remains authoritative until revised with complete evidence.
- Real Android screenshots on 2026-10-22 showed Anonymous B8 access denied, an unreleased private case not publicly served, Sonali Reporter login, server denial of unassigned B8 case, owner-only Admin/Published/Edit routes denied to Reporter, and 15-min inactivity lock. These are SCOPED observed E3 NEGATIVE tests only, not overall B8 topic PASS.
- Reporter/Editor temporary E5 preview is **not** general Editor proof; editor-login credential missing, so Editor E3 NOT RUN. Real E9 records NOT RUN.
- A separate real public article correction preserved its UUID and changed body on public URL (2026-10-22); this does **not** constitute B8 linked-case operational E4.
- Keep B8 FINAL HOLD; no article, case, permission or production record generated by this precode process.

## First feature-code rule (NOT YET AUTHORIZED/STARTED)
1. Read Master PDF T100/T106 and exact existing code/tests at frozen branch.
2. Enter B9 via separate small coding group **T100 / T106** preserving Article identity and security. Run targeted E1/E2 and inherited CI per push.
3. Homepage/feed changes must be reconciled with soft-launch sibling diff before touching `index.html` or `website-v3.js`.
4. Fail any old gate => STOP, first divergence RCA, minimal fix, regression, real proof. After two failed fixes, third requires independent RCA.
5. Every individual P4-T100..109 retains NOT RUN until actually executed with prescribed evidence.
