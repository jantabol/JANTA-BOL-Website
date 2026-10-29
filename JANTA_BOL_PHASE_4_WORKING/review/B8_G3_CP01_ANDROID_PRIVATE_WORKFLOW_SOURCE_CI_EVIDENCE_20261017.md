# JANTA BOL — B8 G3 CP01 Android Private Accountability Workflow
**Date:** 17 October 2026. **Source actually tested:** `5b9a8be9d3ea711647bfbca97f82c909d010d86b`.
**Founder instruction:** "Thek h bhai start kro G3 ka kaam". Preserve founder-approved option A, avoid delaying Phase-4 News Soft Launch except genuine safety gates. **NO PRODUCTION DEPLOYMENT OR MAIN MERGE.**

## Changed source (E7 exact GitHub compare)
Reference base: G2 engineering checkpoint `ac43fe919ef3cd8a8def52663590f0166c9f47c4`. Exactly FIVE files were added/modified:
1. NEW `JANTA_BOL_PHASE_3C_WORKING/b8-accountability.html` Android-first single B8 workspace with separate Founder, assigned Reporter and Editor sections. NEW FILE not replacing an existing News page.
2. NEW `JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.mjs` narrow role-scoped client against EXACT reviewed B8 G1/G2 authenticated RPCs. No calls to existing Article publish/delete functions, mail/WhatsApp dispatch, direct Source read, or service_role.
3. NEW `JANTA_BOL_PHASE_3C_WORKING/b8-accountability-ui.mjs` 15-minute inactivity screen lock, fresh real authenticated user+staff role recheck before form actions, safe textContent (never untrusted innerHTML), UI server confirmation only. The private returned Owner/Editor packet is cleared on lock.
4. NEW `ci/phase4/b8-g3-cp01-android-workflow.test.mjs` 14 Node tests including negative roles, false SENT/verified-status rejection, Evidence only unverified, disabled upload while Hosted E2 outstanding.
5. EXISTING B8-ONLY workflow `.github/workflows/b8-g0-g1-disposable-pg17-and-protected-static.yml` extended with ESM syntax and Node CI tests. Old protected News/Auth/B0–B7 frontend and Phase3/Phase4 source files **UNCHANGED**.

## Actual Developer CI (bounded, NEVER fake final PASS)
- [GitHub Actions **#39008663211**](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/39008663211), exact SHA `5b9a8be9d3ea711647bfbca97f82c909d010d86b`, **2/2 jobs SUCCESS**.
- G3 Android workflow client **14/14 Node contract tests PASS, 0 fail**. Both browser ECMAScript module files passed `node --check`.
- Previous disposable **PostgreSQL17 G1 and G2** role/session/immutable History/Article-linked hard-delete and two-session deletion/link race continue GREEN with synthetic transaction ROLLBACK. Protected Phase3 STATIC plus original B7 truthful 9/60 HOLD and secret checks remain GREEN.
- These are **E1/browser-contract code tests and disposable E2 DB candidate only**, NOT a rendered physical Android device E3, Owner real AAL2 E5, hosted realistic E2, original official Accountability ACC/P4 test PASS, delivery/official reply.
- No B8 backend migration, Edge function, or page deployed to LIVE Vercel/Supabase. NEW G3 file URL shown as source link only, not a deployed public path. Do not send Founder a fake production URL.

## Workflow actually available in reviewed code
**Founder (Owner with AAL2)**: private Case R0/R1/R2 create, assignment to actual UUID Reporter or Editor with expiry, immutable linkage to original Article UUID, append-only legal hold event, request-specific **PRELIMINARY** proof packet. The UI explicitly requires packet labels `EVIDENCE_GAP`, `NOT_SENT`, `complete_proof_pack=false`; rejects any result asserting complete evidence before verification. No automatic Founder delivery/digest yet.
**Active scoped Reporter**: lookup assigned Case card by known UUID (not an unrestricted list), prepare neutral question and add server DRAFT (always `NOT_SENT`), request R1/R2 Editor review by Draft UUID, record SHA claim as `CLAIM_UNVERIFIED_NO_BYTES`. NO outward SEND; R0 independent send approved in design but requires a separate E9-safe transport implementation.
**Active scoped Editor**: read only assigned R1/R2 request, immutable decision `RETURN_FOR_EVIDENCE` / `EVIDENCE_REVIEW_PENDING` / `ESCALATE_TO_FOUNDER`. No approval-to-dispatch action can be forged.
**Private Android Upload**: UI input is present but button deliberately **disabled** and client adapter defaults `allowPrivateUpload:false` pending reviewed LIVE paired SQL, Edge, source/URL parity, real valid scoped session and genuine uploaded-byte validation. No filesystem contents persisted in `localStorage` and no automatic phone storage access.

## G3 CP01 status and next gates
- **G3 CP01 SOURCE + CI TEST CANDIDATE GREEN**. It is **NOT released, NOT physical Android PASS**, and must not be marked complete G3.
- **G3 CP02**: build server-enforced complete question review evidence attachment refs/verification, Editor negative tests, restricted Founder proof pack queue + safe B3 notification on actual event (no fake delivered), user-friendly assigned Case discovery that respects territory. No unverified accusation promoted to proven.
- **G3 CP03**: official Right-to-Reply transport truth model (attempted vs accepted vs delivered vs replied); R0 assigned Reporter direct, R1 reviewed Editor, R2 Founder approved, rate-limit/idempotency and no automatic external messages without actual user action. Do not use mailto composer as proven delivery.
- **G3 CP04**: safe staged network release/real Supabase Storage on existing Free resources with source parity, genuine Android E3 Reporters/Editor/Owner and Owner AAL2 E5, offline/dup/error cases. Founder user manual steps only at this checkpoint.
- Preserve B7 first real ad payment HOLD until after News Soft Launch; production code and payment remain untouched. B8 official P4-T092..T099 **0/8 full real PASS+LOCK**, ACC001..051 **0/51 final evidence complete**. Old G2 E2/E3/E5/E7 final held until tested with G3 Android.
**No new paid account, no production mutation, no fake PASS.**
