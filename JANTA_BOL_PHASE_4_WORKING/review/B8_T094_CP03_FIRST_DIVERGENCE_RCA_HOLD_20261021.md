# B8 / T094 / CP03 — Exact Source & FIRST DIVERGENCE Audit
Date 2026-10-21. No official SEND. No production writes. Verdict: **CP03 P0 SECURITY/DESIGN GAP — HOLD**.
Do not mark T094 official PASS or CP03 finished.

## Final authority (R3 beats older R1)
Locked `JANTA_BOL_B8_R3_FINAL_PRECODING_DESIGN_TEST_MASTER_2026-10-17`:
ACC-013 §845 requires evidence-based **specific questions drafted and linked**; unsupported inflammatory question must be rejected for editing. ACC-014 no AI send. ACC-015 *scoped ordinary Reporter* handoff R0, serious Editor approval R1, Founder R2: do **not** misstate as Founder approval for every R0. ACC-016 actual provider receipt cannot be invented. E2+E5+E9 mandatory.

## Read actual code and LIVE catalog
- G1: `JANTA_BOL_PHASE_4_WORKING/db/20261017_b8_g1_case_reporter_scope_REVIEW_ONLY.sql` lines 32–41 `b8_question_drafts` has case, reporter, text, recipient and state, but **no source evidence reference**. Lines 143–159: `jb_b8_g1_reporter_create_draft` inserts case and text only, no evidence/supporting source check.
- G2 `20261017_b8_g2_cp01_provenance_survival_REVIEW_ONLY.sql` lines 25–39 stores case-scoped source claims `CLAIM_UNVERIFIED_NO_BYTES`, with no question linkage.
- G3 `20261017_b8_g3_cp03_manual_handoff_truth_REVIEW_ONLY.sql` lines 53–98: scoped active reporter can prepare **R0** handoff after question and allowed channel without question-specific evidence. R1 screens Editor; R2 requires Founder. This FIRST DIVERGENCE means unsupported R0 questions can reach PREPARED_NOT_SENT. This is NOT actual external SEND, but fails R3 ACC-013.
- Old `ci/phase4/b8-g3-cp03-handoff-truth-regression.sql` lines 29–40 explicitly creates synthetic R0 question and prepares handoff **without source/claim link**. Prior CI success proves current behavior, not ACC-013 compliance.
- Live Supabase read-only `vrffsnkycvjithwtiylt`: drafts 0, handoffs 0, reply claims 0, G7 history 0, news 32, ads 7. The proposed evidence link table and RPC are **not deployed**.
- No actual real official contact or delivery; all R0/R1/R2 tests so far synthetic. Existing G7 no-reply / correction guards and G8 attestation are separately documented.

## Minimal safe candidate prepared, NOT production/CI PASS
Review-only migration `JANTA_BOL_PHASE_4_WORKING/db/20261021_b8_t094_cp03_question_evidence_binding_REVIEW_ONLY.sql` adds immutable question→same-case reporter claim linkage with RLS denial and safe RPC, and a R0/R1/R2 pre-handoff gate. Existing G3 function's all other authority gates remain copied from exact source. Private hash claim still unverified and cannot become E9 authenticity.
Isolated PG17 test candidate `ci/phase4/b8-t094-cp03-source-bound-question-regression.sql` exists but is **NOT RUN OR WIRED TO CI**. The test needs its `t094_intent` psql variable moved into a session setting before its PL/pgSQL DO block. Attempted edit was blocked by tooling; **STOP**, never claim it passed. Browser Reporter UI linkage is likewise NOT wired. Do not deploy this migration until the test is corrected, negative CI is green and Android E3 is verified.

## Frozen proof and next action
Baseline previous CP02 run 39557463327 (3 jobs successful) remains valid for its own scoped tests, not CP03 gap.
Next: rectify isolated test binding, add positive and negative case-specific link proof, wire reporter UI and private link RPC, run full PG17+protected B0–B7 regression. Independently review before LIVE deploy or real contact. Founder manual step is **not required yet**.
