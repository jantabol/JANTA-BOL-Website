# JANTA BOL / RUN-12 / P4-T096 — Master Accountability + Timeline + Outcome + Reopen

**Scope:** backend/current-source precheck of original Phase-4 Master PDF Topic 13 P4-T096, ACC025–ACC028, sections 875–890. **Required acceptance E2+E4+E5+E9; Phase3 Article UUID/PURL regression mandatory.** Official `TEST-REGISTER.md` still `NOT RUN`; current review branch is NOT release authority.

## Current LIVE JANTA BOL hosted catalog — real read-only inspection on Nov 1 2026
- Exact target `vrffsnkycvjithwtiylt`, never the separate Cricket project; **SELECT only** with no data, schema or Auth changes.
- All six dependencies exist: `b8_cases`, `b8_case_article_links`, `b8_t096_question_disposition_events`, `b8_g5_fact_events`, `b8_g4_public_revisions`, `b8_g7_history_events`.
- `b8_t096_article_single_master_case` **unique index on article_id** prevents attaching a single original news Article to two Master Cases. Different Article UUIDs can belong to the same Case. `jb_b8_g2_owner_link_article` reads the existing undeleted Article title/version/status from the canonical Article source and stores a private **snapshot**, with no `UPDATE articles` statement.
- Live Owner RPCs `jb_b8_g2_owner_link_article`, `jb_b8_t096_owner_record_question_disposition`, `jb_b8_g5_owner_record_outcome`, `jb_b8_g5_owner_reopen_case`, `jb_b8_g7_owner_record_history` are **SECURITY DEFINER** and include `B8_OWNER_AAL2_REQUIRED`, with anonymous EXECUTE DENY; Authenticated EXECUTE is limited by the runtime Owner AAL2 guard, not merely the SQL grant.
- Four private tables (Article links, immutable dispositions, G5 fact history, G7 chronology) have **RLS on** with **zero direct anon/authenticated grants**. Enabled append-only triggers on dispositions, G5 ledger and G4 public revision history.
- `jb_b8_g5_owner_record_outcome` **refuses close if any draft question lacks an explicit private disposition**, and requires same-case **private bytes receipt** for closure. `ANSWERED_REPORTED` needs private bytes and remains `FOUNDER_REPORTED_UNVERIFIED`, not authoritative government response. `jb_b8_g5_owner_reopen_case` requires a **different** same-case material private receipt not used to close/reopen, preserves old OUTCOME and appends REOPEN, and atomically **HIDEs a formerly public current case** rather than leaving stale CLOSED projection visible.
- Existing **TEST ONLY** NH-3 R0 private Case `0cf14822-6633-4bb5-a60f-6df2cf8cc19f`: as independently observed now, `case_state=draft`, `draft_count=1`, `case_article_links=0`, `question_dispositions=0`, `outcome_reopen_events=0`, `G7_history_events=0`. The 2018 NHAI PDF source claim, source-binding, and prepared-not-sent Handoff from T094 **do not** auto-satisfy closure or E9.
- All `b8_case_article_links` currently contain **zero repeated article IDs across different master cases** by read-only aggregation. This is a current inventory check, **not** proof of a real production Article-to-Case lifecycle.

## Original ACC acceptance / explicit truth classification
| Original checkpoint | Current technical protection (not human E-class acceptance) | What remains |
|---|---|---|
| ACC025 — one Master Case + initial/later Article IDs | Typed private links and unique global `article_id`, original Article UUID/PURL source unchanged | Original published Article E4, multi-article real Founder E5 lifecycle **NOT_RUN** |
| ACC026 — protected internal/public timeline | G7 append-only private dated attribution, G4 safe fixed public revision/milestone codes, Owner AAL2 and no anonymous private-table leakage | actual relevant E4/E5 human chronology and public validation **NOT_RUN** |
| ACC027 — monitoring vs closure | G5 `MONITORING` vs `CLOSED_WITH_REASONS`, no close without per-question disposition and scoped private bytes | real Founder E5 closure reason, real E9 external truth **NOT_RUN** |
| ACC028 — reopen when new material appears | new same-case receipt, reject reused, append permanent `REOPEN`; G4 public former CLOSED atomically HIDE | actual reviewed genuine new material receipt, Founder E5 and current public E4 **NOT_RUN** |

## Strict safety
- Do **NOT** fabricate a government reply, email or actual delivery; **PREPARED_NOT_SENT** is never sent.
- Do **NOT** link the test-only NH-3 case to the genuine published ISRO story just to pass ACC025, or change Article titles/status/version/PURLs.
- Do **NOT** close TEST ONLY private cases using an invented private byte receipt; prior uploaded NHAI PDF in ChatGPT is **not** an authenticated JANTA BOL private upload receipt.
- Do **NOT** run test transactional INSERT/UPDATE/RLS fixtures in LIVE JANTA BOL Supabase. Use only disposable local PG17 with fixture and ROLLBACK.
- Current test needs no Founder manual action. Later E5/E4 use original Founder Android and genuine appropriate Article/source material, only after meaningful reviewed test plan.
- No merge/deploy, staff/secret/policy change, publication, backup action or paid service.

## Engineering verdict before latest CI
`T096_LIVE_CATALOG_RLS_AND_OWNER_GATES=PASS_SCOPED_READ_ONLY`
`T096_CURRENT_SOURCE_NODE_GUARDS=CI_PENDING`
`T096_ORIGINAL_ISOLATED_PG17_ROLLBACK=CI_PENDING`
`T096_ORIGINAL_CURRENT_ARTICLE_E4=NOT_RUN`
`T096_REAL_FOUNDER_MULTI_ARTICLE_AND_OUTCOME_E5=NOT_RUN`
`T096_AUTHENTIC_EXTERNAL_FACT_OR_MATERIAL_E9=NOT_RUN`
`T096_OFFICIAL_FINAL_PASS_LOCK=HOLD`

Source reference: original existing `JANTA_BOL_PHASE_4_WORKING/db/20261021_b8_t096_master_outcome_reopen_guard_REVIEW_ONLY.sql` + `ci/phase4/b8-t096-master-outcome-reopen-regression-v3.sql` + `ci/phase4/b8-t096-t097-android-live-parity.test.mjs`. **No original migration or protected News file changed.**
