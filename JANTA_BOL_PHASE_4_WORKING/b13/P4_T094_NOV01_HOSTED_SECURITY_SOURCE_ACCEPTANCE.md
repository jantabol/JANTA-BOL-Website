# JANTA BOL / Phase 4 — P4-T094: Hosted source/RLS preflight (NOT external E9 acceptance)
**Date:** 2026-11-01 UTC 11:04. **Owner:** Founder reserved. **Project:** JANTA BOL only `vrffsnkycvjithwtiylt`. **Budget:** ₹0. **Mode:** read-only live SQL catalog + original immutable source and previous CI; no Founder account impersonation.

## Original test authority
P4-T094 = Questions + Right to Reply + No Reply + Later Response. Original ACC-013–019, requires E2 + E5 + E9. Last original test register row `P4-T094 | B8 | NOT RUN` is preserved. Original T094 CP03 21-Oct PG17 isolated R0/R1/R2 result was GitHub Actions run `39562469553` SUCCESS, source evidence `review/B8_T094_CP03_FINAL_ISOLATED_R0_R1_R2_REGRESSION_20261021.md` (git blob `fb339beacb5757aeadb39e00af0d5f81f84059bb`). That run is not currently serving Founder Android proof, an official dispatch or a genuine reply.

## Live provider SELECT-only proof, 1 November 2026 11:04:10 UTC
- Exact JANTA BOL Supabase project, **1 B8 case, 0 drafts, 0 question↔source links, 0 review requests, 0 Editor screenings, 0 Founder handoff authorizations, 0 handoff intents, 0 manual delivery attestations, 0 official reply claims**.
- B8 release controls with enabled=true: **0**; original two Published Article rows and five Storage objects remain; this read-only inventory did not touch them.
- Live `public.b8_question_evidence_links` has `relrowsecurity=true`, **anon direct SELECT=false**, authenticated direct INSERT=false and enabled `b8_t094_question_evidence_immutable` UPDATE/DELETE trigger.
- Live `public.jb_b8_g1_reporter_bind_question_evidence(uuid,uuid)` is `SECURITY DEFINER`, `anon EXECUTE=false`, authenticated entry `true` **guarded internally** by owner-of-question, active assigned Reporter grant, same-case own unverified source claim and immutable conflicting-link refusal. A role-grant alone is **not** proof of live multi-actor negative E5 execution.
- Live `public.jb_b8_g3_reporter_prepare_manual_handoff(uuid,text)` has `anon EXECUTE=false`, authenticated guarded entry; code contains fail-closed `B8_T094_QUESTION_SOURCE_LINK_REQUIRED`, `B8_G3_R1_SCREENING_REQUIRED`, `B8_G3_R2_FOUNDER_APPROVAL_REQUIRED`, and `B8_G3_REPLAY_CHANNEL_CONFLICT`. Existing R0, R1 Editor screening and R2 Founder reserved powers preserved; no public reply or dispatch claimed.
- Live `public.jb_b8_t094_source_binding_readiness()` is `SECURITY INVOKER`, `anon EXECUTE=false`, authenticated entry `true`. The function reports **`official_send_by_app=false`** and **`source_independently_verified=false`**; it can check code presence, not certify source factual accuracy.

## Immutable source and UI checks (non-production)
Original source-review candidate paths are pinned to the currently inherited Git objects:
- `JANTA_BOL_PHASE_4_WORKING/db/20261021_b8_t094_cp03_question_evidence_binding_REVIEW_ONLY.sql` blob `6f87dd0da5fe8ea713d78353af0863ea3027e64f`
- `JANTA_BOL_PHASE_4_WORKING/db/20261021_b8_t094_cp03_reporter_readiness_REVIEW_ONLY.sql` blob `5c46a7e09b575f4f73b759060d30ff5a9ff57217`
- `ci/phase4/b8-t094-cp03-source-binding-android.test.mjs` blob `b98f0f9654adfe01e5b20ef3fd790ab61f4eacae`
- `JANTA_BOL_PHASE_3C_WORKING/b8-accountability-ui.js` blob `505d5ccd27bd62bb111061632b784aae77a56a89`
The source-bound draft, UI fail-closed guard, no fake officially SENT, same-case source, immutable evidence-link negatives and original review/screening are checked in a separate current-source review-only CI. Original product source and all four original blobs must remain unchanged by this audit.

## Honest status, dependencies and next manual boundary
`T094_SOURCE_GUARDS=PASS_SCOPED`; `T094_HOSTED_RLS_AND_RPC_CATALOG=PASS_SCOPED`; `T094_LIVE_AUTHENTICATED_REPORTER_EDITOR_FOUNDER_E5=NOT_RUN`; `T094_ACTUAL_DELIVERY_REPLY_NO_REPLY_LATER_REPLY_E9=NOT_RUN`; `T094_FORMAL_FINAL_PASS_LOCK=HOLD`.

The original single case currently has **no drafts or attributable original official sent/received evidence**. To execute mandatory physical E5/E9, a genuinely authorized case must have a human evidence/recipient relevance decision, real assigned Reporter/Editor and Founder authenticated sessions, and (when appropriate) actual outward SEND or truthful no-reply proof with delivery receipts. Those are **manual/authentic/external** gates and cannot be silently generated using SQL, synthetic draft texts, spoofed actor JWT, public QA publication or speculative agency answers. Reopen manual steps only when the real Founder-controlled Android sequence and vetted actual source/recipient are ready; no current Founder step for the source/backend part.

B8 T092–T099 0/8 original full locks, T093 external E9 DUE, B9 T105 genuine historic article E3 DUE and B12 operational E3/E4/E8/release gates are still unresolved; P4-T084 original final RUN-15 remains HOLD. **NO REBUILD / NO FAKE PASS / old JANTA BOL work must not break.**
