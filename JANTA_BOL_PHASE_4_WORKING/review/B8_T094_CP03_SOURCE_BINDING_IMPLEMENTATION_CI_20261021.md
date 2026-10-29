# JANTA BOL B8 — P4-T094 / CP03 complete engineering checkpoint
Date 2026-10-21. Source branch `codex/b8-g5-main-based-integration-20261017`.
**Verdict: CP03 isolated PG17 engineering/security regression PASS. Production deployment NOT DONE. Android E3 and real E9 NOT RUN. T094 official PASS+LOCK HOLD.**

## Design authority
Use newer locked B8 R3 final pre-coding design (2026-10-17), ACC-013…019 §§845–863; R0 Reporter ordinary handoff may be prepared with scoped authority, R1 Editor screen, R2 Founder AAL2 prior approval. A source-linked question is mandatory. Mere claim metadata and prepared manual handoff are NOT source authenticity nor official SEND.

## First divergence reproduced and corrected in candidate
Prior R0 Backend `public.jb_b8_g3_reporter_prepare_manual_handoff` checked scope/channel but **not an attributable question-specific supporting source**. R3 ACC-013 violation.
- Added `JANTA_BOL_PHASE_4_WORKING/db/20261021_b8_t094_cp03_question_evidence_binding_REVIEW_ONLY.sql`: additive private immutable `b8_question_evidence_links` table, same-case/same-Reporter source-claim guard, role checks, idempotent single link, and fail-closed handoff check for R0/R1/R2. Existing Editor and Founder approval checks retained; no outbound integration.
- Added `20261021_b8_t094_cp03_reporter_readiness_REVIEW_ONLY.sql`: authenticated-only readonly capability RPC. Reporter UI fails CLOSED on old backend until evidence binding is deployed. Owner/Editor role pages unaffected.
- `b8-accountability-client.js`: adds `reporterBindQuestionEvidence`, reports `CLAIM_UNVERIFIED_NO_BYTES` and `NOT_SENT`.
- `b8-accountability.html` and `b8-accountability-ui.js`: private Android source-link form, automatic prepared UUID transfer from existing draft/claim forms, phone workflow selection. No official/send action; client checks readonly readiness before exposing Reporter UI.
- Evidence hash claim may still be false/irrelevant; automatic verification of a source's narrative support and E9 source validation are **NOT IMPLEMENTED** by this guard. Reviewer/human verification is still required to complete ACC-013.

## Real, isolated tests
Workflow: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/39561435608
Source commit: `7bafb97eb19148220ba40cee543b00ce9dfae123`.
Independently checked workflow **completed success** with **3/3 successful jobs**:
1. PG17 G1-G9 existing real rollback and new T094 source-binding + capability tests PASS.
2. Protected original News/Auth/B7 regression PASS.
3. Full B0–B8 Master Source ZIP job PASS.
New tests included: `ci/phase4/b8-t094-cp03-source-bound-question-regression-v2.sql`, `ci/phase4/b8-t094-cp03-reporter-readiness-regression.sql`, and `ci/phase4/b8-t094-cp03-source-binding-android.test.mjs`.
Negatives cover: unsourced R0 handoff DENY, cross-case source DENY, unassigned/non-Reporter DENY, immutable link DENY, duplicate retry no second link, no fake SEND/provider receipt, client RPC-failure fail closed, Reporter UI without backend capability fail closed.
**Historical note:** earlier `ci/phase4/b8-t094-cp03-source-bound-question-regression.sql` is a superseded unexecuted first candidate with a psql variable mistake. Only explicitly wired `-v2.sql` is the independently CI-passed test; do not use old candidate.

## Production preservation / read-only proof after coding
Supabase project `vrffsnkycvjithwtiylt` current read-only totals: 32 News, 7 Ads, 5 historical G5 facts for test NH-3 case, 0 T094 drafts, 0 T094 handoffs, 0 reply claims, 0 G7 history. CP03 binding table and capability RPC **not deployed LIVE**. No externally sent messages, no Article publication, no restored or removed prior fact.
No final official T094 PASS+LOCK, and no E9 provider acceptance / genuine reply.

## Next gate
1. Independent release/security review of bounded additive migrations and preview parity.
2. Founder explicitly authorizes a scoped production rollout if/when safe; NEVER infer approval from ordinary engineering continuation.
3. Isolated Reporter+Editor+Founder Android E3 role handoff; **test-only private draft and claim**, no official outbound send without fresh explicit approval.
4. Real external E9 right-of-reply response/correction proof requires genuine case, permission and independently preserved documents.
Do not rebuild, change News/Ads, invent E9, or repeat Founder T093 historical data entry.
