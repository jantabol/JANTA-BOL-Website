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


## 2026-11-01 Founder Android case picker E3 — existing TEST ONLY NH-3 selected

- **Real Founder screenshot in conversation at 16:52 IST**, Android Chrome on `jantabol.in`, shows the owner identity banner **"सत्यापित उपयोगकर्ता: संस्थापक"**, successful prior refresh green **"सर्वर से निजी मामले दोबारा लाए गए। कोई रिकॉर्ड बदला नहीं गया।"** and the **previously existing** selected private case `TEST ONLY - Shivpuri Dewas NH-3 Project - Source Verification — Shivpuri, Madhy...` in **"अपना मामला नाम से चुनें"**. The label and location are transcribed only from visible screenshot, no private UUID. No new case created.
- This is **actual Android Founder role + existing case-picker E3 positive observation**. It demonstrates the list was populated and one existing private case was selectable, not independent proof of all backend row-level grants, Reporter/Editor role operation, real government SEND/reply, private receipts, true source provenance, Article lifecycle or any official T094 E5/E9.
- **Verdict:** `T094_FOUNDER_ANDROID_EXISTING_CASE_PICKER_E3=PASS_SCOPED_BY_REAL_SCREENSHOT`, `T094_EXISTING_CASE_DISPLAY_STATUS=PASS_SCOPED`, `T094_REPORTER_EDITOR_CROSS_ROLE_E5=NOT_RUN`, `T094_ACTUAL_HUMAN_GOVERNMENT_DELIVERY_AND_REPLY_E9=NOT_RUN`, `T094_ORIGINAL_FINAL_PASS_LOCK=HOLD`.
- **Next read-only mobile step:** With the already selected NH-3 case, choose the owner task dropdown **"अभी कौन-सा काम करना है?" → "केवल संस्थापक के लिए मामले का घटनाक्रम"** (`g7HistoryRead`, not `g7History` writer). The existing selected case should auto-populate the `g7ReadCase` field because it belongs to `B8_CASE_FIELDS`. Then tap **"निजी स्थायी इतिहास देखें"** only; it calls a read-only RPC. Expected result: historic event list or explicit empty state, never a fake sent/response or new record. Screenshot can redact private IDs. Stop if an error occurs; never press **"निजी घटनाक्रम में स्थायी प्रविष्टि"** or any SEND/Upload/Publish/permission toggle. This validates only scoped Founder readback, not an external E9.
- **Screenshot asset** is present in original ChatGPT conversation, not checked into repo. Preserves historical source/status and original existing one-case choice; no production data mutation by this audit.

## 2026-11-01 mobile event-history readback check
Founder Android screenshot shows a successful private history read with an empty list and explicit no-older-records message. A separate read-only database count returned zero history events for the selected existing case. This Android readback is PASS_SCOPED. The case has no Reporter or Editor grants, no question drafts, reviews or handoffs. Original P4-T094 full E5 and external E9 are NOT_RUN; official Final PASS+LOCK stays HOLD. Do not invent official reply or modify original news to claim PASS.

## 2026-11-01 Founder-assigned Reporter grant: actual LIVE readback

A real Founder Android screenshot at 17:09 IST shows the green server success message: "असली Backend ने Case-Specific Staff Permission स्वीकार की। कोई Global Permission नहीं बदली।" An independent read-only LIVE Supabase query at 2026-11-01 11:40:06 UTC confirmed a single case-scoped Reporter grant for the previously selected NH-3 private case and active Reporter account `sonali1997`. Server `granted_at=2026-11-01 11:39:17 UTC`, `expires_at=2026-11-02 12:30:00 UTC` = **2026-11-02 18:00 IST**, `revoked_at=NULL`, `currently_active=true`; **exactly one Reporter grant** and **zero Editor grants**, **zero draft questions**, **zero handoff records** for this case. This is genuine **Founder permission/write runtime E3** proof, not a mock role or source test.

`T094_FOUNDER_ANDROID_CASE_SCOPED_REPORTER_PERMISSION=PASS_SCOPED_LIVE`; `T094_REPORTER_GRANT_DB_EXPIRY=PASS_SCOPED_LIVE`; `T094_OTHER_CASE_AND_GLOBAL_ROLES_UNCHANGED=NOT_INDEPENDENTLY_VERIFIED` (green UI text is not an exhaustive global audit); `T094_REPORTER_LOGIN_CASE_READ_E5=NEXT_MANUAL`; `T094_REAL_OFFICIAL_SEND_REPLY_E9=NOT_RUN`; `T094_FORMAL_FINAL_PASS_LOCK=HOLD`.

Next safe permission test is to use the existing **sonali1997 Reporter login** (prefer separate Android tablet or isolated session without signing out Founder), open the B8 accountability page, choose task **"मुझे सौंपा गया मामला"**, enter already known private Case UUID **locally** and tap **"मामले की अनुमति और जोखिम जाँचें"**, then capture only success/error and risk lane (R0), redacting IDs. Do not draft/dispatch a question, elevate role, create a new case, upload or modify data. No credentials must be pasted in ChatGPT. This validates E5 Reporter-only read access, not actual government communication.

## 2026-11-01 Founder-supplied Reporter Android live role screenshot
At **17:16 IST**, the Founder supplied an Android Chrome screenshot from the real JANTA BOL public domain showing authenticated B8 role banner **"सत्यापित उपयोगकर्ता: संवाददाता"** and the **"मुझे सौंपा गया मामला"** Reporter-only form. The question-send safety banner remains explicit, and the task's Case UUID field was **blank**. This is an **actual E3 role/page screenshot PASS_SCOPED**, not yet an E5 proof that this specific account can read the assigned NH-3 case and NOT E9 proof of an official question/reply. Earlier real Founder grant was verified independently; no new Editor permission or backend mutation occurred in this screenshot.

Next safe Android action: enter only the existing private NH-3 Case UUID into **"मामले की पहचान (UUID)"**, tap **"मामले की अनुमति और जोखिम जाँचें"**, and screenshot the result. Expected R0 existing case read permission, or an explicit denial to diagnose without editing credentials, sending questions, creating news or changing the role. `T094_REPORTER_LOGIN_ROLE_UI_E3=PASS_SCOPED`; `T094_REPORTER_ASSIGNED_CASE_READ_E5=NEXT_MANUAL`; `T094_REAL_EXTERNAL_SEND_REPLY_E9=NOT_RUN`; `T094_FORMAL_FINAL_LOCK=HOLD`. Screenshot stays in user conversation, not GitHub.
