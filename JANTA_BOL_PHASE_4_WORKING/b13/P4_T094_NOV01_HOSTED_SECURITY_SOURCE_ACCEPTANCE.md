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


## 1 November — production deployment Git-source parity and first E3 Founder manual gate

Read-only checked connected Vercel current READY domain's **attributed source commit** `93df12aa8ffdfae38d9a4066b6a4556bb36969e5` against the current PR97 review HEAD. Git blob results are **identical** for all three B8 review UI files (current Vercel-attributed source versus draft branch):
- `JANTA_BOL_PHASE_3C_WORKING/b8-accountability.html` = `d9e0b79bacdd3b85fa23fee8310a16ea750f686d`
- `JANTA_BOL_PHASE_3C_WORKING/b8-accountability-ui.js` = `505d5ccd27bd62bb111061632b784aae77a56a89`
- `JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.js` = `0bf53ef35efdc21ac985493ccb49734cdd1a0fb1`

Git-source parity means these particular files did not change between these commits; it does **NOT** prove the deployed HTTPS route was fetched or that Android/real Reporter Editor Owner authorization currently succeeds. A direct independent public browser fetch was unavailable from the audit environment. Preserve SSO/session security and no credential sharing.

**Founder controlled first actual E3 manual checkpoint NOW AVAILABLE (one safe step, NO SEND):**
- **Device:** Founder Android Phone, Chrome or incognito with existing authorized Founder login.
- **Action:** Open `https://jantabol.in/JANTA_BOL_PHASE_3C_WORKING/b8-accountability.html` and navigate to the **Founder / निजी मामला** view, then send a screenshot of the loaded page showing the authenticated role and existing case picker/status **without any secrets, authentication tokens, identifiable source documents, government credentials or private person data**. Do not press create case, save fact, SEND, official reply, edit Article, upload evidence, or change publishing/private-upload flags.
- **Expected:** secure Founder-only view and existing one-case selector are available, no "Question SENT" success, no external dispatch or private content leak, 15-minute inactivity guard remains. If the UI says auth expired/backend unsupported or the page is inaccessible, send only that error screenshot and **STOP**; this is real FAIL/NOT_RUN data, not a reason to reconstruct the website.
- **Proof boundary:** Founder screenshot validates only the first **UI/role/HTTPS E3 observation**. It does not complete T094 E5 multi-actor Reporter/Editor work, real E9 delivery/response, nor final T094 PASS+LOCK. Any actual case-specific outbound official message requires separate explicit Founder editorial verification and authorization.

`T094_SOURCE_PRECHECK=PASS_SCOPED`; `FOUNDER_ANDROID_E3_MANUAL_STEP=NOW_DUE`; `T094_FINAL_PASS_LOCK=HOLD`. Zero production mutations by the assistant.


## 2026-11-01 Founder Android actual screenshot E3 checkpoint

- **Evidence:** Founder supplied a real Android Chrome screenshot in this conversation at **16:47 IST** on 2026-11-01. This is an **observed UI screenshot**, not synthetic CI. It shows the `jantabol.in/JANTA_BOL_PHASE_3C_W...` URL prefix, "जनता बोल — जवाबदेही कार्यक्षेत्र", the prominent no-official-send warning, and **"सत्यापित उपयोगकर्ता: संस्थापक"**. It also displays a server-confirmed identity banner that actions require server verification and no question has been sent.
- **Founder interface observed:** "संस्थापक — मामला और प्रमाण प्रबंधन"; **"अपना मामला नाम से चुनें"** dropdown ("मामला चुनें — UUID लिखने की जरूरत नहीं"), "मेरे मामले फिर से लाएँ" refresh button, and task selector currently **"नया निजी मामला"**. The screenshot does **not** show an existing case actually selected, Editor/Reporter successful logins, any new real question, handoff or private byte receipt.
- **Decision:** `T094_FOUNDER_ANDROID_PUBLIC_DOMAIN_ROUTE_AND_OWNER_UI_E3=PASS_SCOPED_BY_REAL_SCREENSHOT`; `T094_SERVER_PRIVATE_CASE_SELECTION_E3=NEXT_MANUAL_STEP`; `T094_REPORTER_EDITOR_OWNER_E5=NOT_RUN`; `T094_OFFICIAL_DELIVERY_REPLY_E9=NOT_RUN`; `T094_FINAL_PASS_LOCK=HOLD`. This is only a partial **one-device** E3 check.
- **Next safe step (Android Phone, Chrome):** tap **"मामला चुनें — UUID लिखने की जरूरत नहीं"**; choose the **previously existing** NH-3 Accountability case if listed. If empty, tap **"मेरे मामले फिर से लाएँ"** once and retry. Expected: the known case becomes selected, without starting a new case. Proof: one screenshot showing selected case title and role, with private IDs redacted. **Do not click create/save/send/upload, change roles, switch private upload ON, edit Article or post real official query.** No test new Case is required.
- The original user screenshot is held in ChatGPT conversation, **not** claimed embedded in GitHub. No account IDs, personal tokens or uploaded screenshot bytes are added here.
