# JANTA BOL — P4-T094 / RUN-12 / CP01 backend & security audit
Date: 2026-10-21 | Status: **CP01 READ-ONLY PREFLIGHT VERIFIED**; T094 official **NOT RUN**. NO FAKE PASS.

## Authority and scope
Phase-4 Master Execution Pack (2026-10-16, p. 312), P4-T094:
Questions + Right to Reply + No-Reply + Later Response. ACC-013–ACC-019, Sections 845–863.
Official requirement: evidence-based draft (AI only optional suggestion); unauthorized send denied; authorized send backed by genuine evidence; reply/partial/no-reply/urgent/late/correction/unanswered chronology preserved.
Required: E2+E5+E9, baseline CI and auth/notification/article-update regression as applicable.

## Exact source
Repo `jantabol/JANTA-BOL-Website`, review branch starting commit `14bb9d4813868d8b7a7badcfd76de6068f048910`. Do not merge/rebuild or modify News/Auth/B7.
- G1 source: `JANTA_BOL_PHASE_4_WORKING/db/20261017_b8_g1_case_reporter_scope_REVIEW_ONLY.sql`.
- G3 sources: `20261017_b8_g3_cp03_manual_handoff_truth_REVIEW_ONLY.sql` and `20261017_b8_g3_cp04_reply_claim_REVIEW_ONLY.sql`.
- G7 source: `20261017_b8_g7_accountability_chronology_REVIEW_ONLY.sql`.
- G8 source: `20261017_b8_g8_manual_delivery_public_status_REVIEW_ONLY.sql`.
- G9 source: `20261017_b8_g9_due_followup_safe_notifications_REVIEW_ONLY.sql`.
- Private Android JS: `JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.js`, `b8-accountability-ui.js`.

## Independent LIVE read-only database result
JANTA BOL Supabase project `vrffsnkycvjithwtiylt` (NOT Cricket).
- `b8_question_drafts` 0 (case `0cf14822-6633-4bb5-a60f-6df2cf8cc19f`: 0).
- Review requests 0; Editor screenings 0; Founder approvals 0.
- Manual handoff intents 0; attempted delivery observations 0; Founder attested external delivery 0.
- Claimed official replies 0; G7 chronology 0.
- Original News 32, advertising campaigns 7. No new data written in this audit.
- All inspected B8 tables have RLS enabled. Named 10 relevant B8 owner/reporter RPCs are SECURITY DEFINER, `anon EXECUTE = false`, `authenticated EXECUTE = true`, with role/AAL2 guards in their bodies.
- Reporter G1 draft role/scope and G3 handoff preparation role/scope checks present.
- G3 manual handoff checks Editor R1 and Owner R2 approval for serious cases; only prepares manual workflow, **does not deliver an official message**.
- G3 handoff truth reports `official_delivery_verified=false`, `external_delivery_status=NOT_VERIFIED` without attested receipt. Reply claim remains `REPORTER_CLAIM_UNVERIFIED`.
- G7 private chronology has `NO_REPLY_AS_OF_CLAIM` requiring an observed contact attempt; late/partial/full claims, urgent escalation, summary correction and versions are append-only attributed statuses, not independently authenticated replies. G8 Founder AAL2 evidence receipt attestation separate from mere reporter observations.
- G9 follows up using safe internal notifications; no automatic official messages.

## Existing isolated regression proof (candidate not E9)
GitHub B8 PG17 workflow last confirmed 3/3 success run 39552145588 at source commit `5b1e57467efbd7ca18e810ddd9e2734314613e69`. This is prior source to the **doc-only** T093 report and THIS new doc.
The workflow tests relevant files:
- `ci/phase4/b8-g1-real-postgres-regression.sql`: RLS, anon, Reporter scope, revoked/expired grants, draft session negatives.
- `ci/phase4/b8-g3-cp03-handoff-truth-regression.sql`: R0/R1/R2 gating, blocked unauthorised channel, no fake SENT, idempotency.
- `ci/phase4/b8-g3-cp04-reply-claim-regression.sql`: private bytes/case binding, AAL2, reply claims NOT verified.
- `ci/phase4/b8-g7-chronology-regression.sql`: no-reply cannot precede attempt; immutable later reply, correction, cross-case rejections.
- `ci/phase4/b8-g8-manual-delivery-public-status-regression.sql`: no PUBLIC response projection without Founder reviewed evidence; immutable.
- `ci/phase4/b8-g9-due-followup-notification-regression.sql`: internal only followups.
**Do not claim those synthetic fixtures were real official delivery or a real reply.**

## ACC-013…ACC-019 gate map — not official PASS
- ACC-013 evidence-backed question / AI only suggestion: synthetic role controls present; no live T094 case draft, human review NOT RUN.
- ACC-014 unauthorized-send denial: handoff permission guards/PG17 negative proof present; real user negative action NOT RUN, no outbound API claimed.
- ACC-015 authorized delivery: owner/editor review state-machine candidate exists but E9 genuinely received acknowledgment NOT RUN.
- ACC-016 full/partial/no-reply: synthetic immutable claims separate, no real reply/absence proof.
- ACC-017 urgent exception: G7 restricted private event code candidate, no real urgent evidence.
- ACC-018 later reply + chronology: synthetic tested, no real late reply receipt.
- ACC-019 material summary correction / unanswered tracking: G7 and G9 candidate regression, original real response and E9 correction NOT RUN.

## Risk / decisions
1. **No external official message or publication** without new, explicit Founder approval. Draft and internal simulation can proceed; no fabricated SEND or acknowledgment.
2. `b8_g6_release_controls.PRIVATE_EVIDENCE_UPLOAD` has been OFF in latest read-only T093 audit: no E9 byte receipt ingestion unless separately safety-gated later.
3. Do NOT use legacy NH3 historical MPPCB consultant document as proof an agency received a question or sent a reply.
4. Prefer evaluating offline verified true delivery, no-reply wording, later-response/misquotation proof after Founder decision; avoid turning fake replies into verified.
5. Preserve T093 partial PASS / evidence HOLD separately; not silently conflated with T094.

## Next checkpoint
CP02: source/RPC threat trace and a reproducible isolated negative-test matrix for R0/R1/R2, anon/not-owner/AAL1, no fake SEND, invalid/cross-case evidence, no-reply before attempt, G7 immutability and offline attestation. Run updated CI and only then propose an Android action. LIVE contact/write remains held.
