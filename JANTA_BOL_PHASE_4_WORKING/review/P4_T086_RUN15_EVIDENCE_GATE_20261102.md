# JANTA BOL — B13 / P4-T086 — Original RUN-15 CORE REGRESSION Evidence Reconciliation

**Date:** 2026-11-02 IST. **Founder instruction:** Finish and lock **T086**, avoid repeating already completed Android Article/Share/Incognito, preserve old product/security, soft-launch priority. **Scope:** one original `AUTO / CORE REGRESSION` test; NOT Phase-4 all-modules Final Closure/Production Release, NOT real provider Live rollout, NOT an editorial factual correction.

## Original authority — precise Evidence definitions (corrects earlier E-code misreading)
**Official JANTA BOL Phase-4 Final Test Blueprint, 321 pages, pages 12 & 280 (Evidence Codes), page 309 (P4-T086).** T086 maps Topic12 RUN-15 §§765–772. Required **E1 + E3 + E4 + E5**, **NOT E6**.
- **E1 = CI / automated test result / logs.**
- **E3 = real phone/tablet screenshot or screen recording.**
- **E4 = Article ID / Permanent Master URL / identity proof.**
- **E5 = audit / history / notification / lifecycle record.**
- **E6 (not required for T086) = real provider / payment / production external proof.**
T086 PASS wording: **"Article ID/PURL stays unchanged; share/navigation/home/category/district discovery remain intact; Live architecture is preserved; genuine Live-environment dependencies remain DUE."** The procedure names **Create → Draft → Final Review → Publish → Public Open → Share → Correction → Unpublish → Republish** plus Phase-3A/3B Live **regression**. Required protected old Phase-3 Article/Share/Live CI.

**IMPORTANT prior chat interpretation correction:** Notes in PR #106/#109 incorrectly labeled `E5` as *actual Live provider encoder start/stop* and `E4` as *mandatory real factual content correction*. Original Blueprint actually defines E4 as Article ID/PURL proof and E5 as audit/history/lifecycle record. An external Live provider runtime must remain a separately documented **DUE** under original T086 PASS condition; reporting a simulated Live start as real would be fake. Do not falsely demand Founder start a Live stream to pass AUTO/CORE regression; do not falsely claim that one happened.

## E1 — executable source and regression evidence, exact SHA
**Existing 2026-11-02 actual GitHub Actions (all GREEN at exact heads):**
- `#41391242714` SHA `edecc6290a0c87e36b7510dafffa11f4ad74e9f3`: original frozen V3 O ten/ten against authentic old source, approved A1 ten/ten + 8 exact-delta + 12 strict redirect, current A2 canonical V3 ten/ten + 20 strict security negative, original T077 and Founder AAL2, T080 Android lost-ACK/Owner CAS, T083 **120/120**, Phase-3A/3B original Live architecture functional/static, old News/Auth/B7 and actual disposable PostgreSQL17 G0/G1 SUCCESS. ZIP generation was SKIPPED, never release PASS.
- `#41391884335` SHA `af584fdd6cd83d254a62719c35921921bee435d9`: release-scope **9 product files different vs currently deployed jantabol.in**; **one** guarded nav-only change vs latest isolated T097 preview, old Auth/News/Live unchanged. **Do not deploy stacked Draft branch as if one-file Production hotfix.**
- New `ci/phase4/b13-t086-run15-lifecycle-full.test.mjs` **actual current Backend JS executed in isolated Node VM**, fake only: explicit Create → Draft → Publish → Correction (synthetic headline) → Unpublish → Republish, original UUID + same slug + version CAS, no duplicate row, history snapshots, reject stale correction and unpublish, reject non-Owner, keep published editor from auto-saving to Draft, canonical Share URL unchanged. **New exact-head CI pending**; no sandbox/synthetic News goes into real JANTA BOL DB.

**E1 status:** `T086_RUN15_E1_EXISTING_PROTECTED_CI=PASS_SCOPED`; `T086_RUN15_E1_NEW_CURRENT_FULL_LIFECYCLE_VM=CI_PENDING`.

## E3 — four genuine Android Chrome device proofs, no repeats
**Founder-provided screenshots Nov 2, 2026 IST**:
- **10:41** live Owner Published News Correction Editor correctly rendered **NVS-03** original server Article v12, headline/summary/body/date populated (no save).
- **10:47** public original NVS-03 Article rendered body/title/category with permanent Article UUID and Share controls.
- **10:49** Android's real native **Share sheet** opened with original headline and Copy/WhatsApp/other targets. No message sent, no external delivery claimed.
- **10:54** Chrome **Incognito** without Founder login loaded same published Article UUID/title/body after shared-link navigation (full address bar truncated; no complete raw query URL claimed). This verifies the public/anonymous path and Share intent end-to-end on a real phone without publishing anything.
**Recorded GitHub PR #109 user-proof comments:** `6569611183`, `6569690723`, `6569713830`, `6569779926`. These are actual Founder screenshot reviews, not generated fixtures.
**E3 status:** `T086_RUN15_E3_OWNER_EDITOR_PUBLIC_SHARE_INCOGNITO=PASS_SCOPED_REAL_DEVICE`, **no more Android screenshots required for these four checks**.

## E4 + E5 — immutable identity and actual real hosted lifecycle record
**READ-ONLY Live JANTA BOL Supabase connected project `vrffsnkycvjithwtiylt`**, SELECT only, 2026-11-02. Actual **NVS-03** Article:
- UUID `c49f00b6-0359-400c-a957-2082142ff8dd`, slug `jb-4b6e3d2a-dea8-4c83-b479-69504614ae0e`, currently **published v12**, **11 historical snapshot rows**. No separate Article created.
- `article_versions` historical **v8=draft → v9=published → v10=draft → v11=published → v12=current published**; all v8–v11 snapshots keep exact original UUID and **one distinct slug**. In `audit_logs`, same Article ID has **2 `draft→published`**, **1 `published→draft`**, **1 `published→published`** update, under original common `article_update` path.
- Historical pre/post **body MD5 unchanged** on v9/v11/current, so **DO NOT call a factual/semantic article correction proven** by this history. The actual observed records establish real Publish, Unpublish, Republish, post-publish update with same ID/PURL, plus immutable version and audit record. Full correction ability also exercised only by E1 synthetic current backend; B8 T098's *factual correction* remains separately DUE.
- Original **SpaDeX** Article `f17f6507-02a3-4881-ad37-0b02cadf3d3f`, published v15, **14** historical snapshots, same original slug. Its separate content not changed merely to pass test.
- Live public `jb_c1_public_articles(null,10)` published-only RPC returned **2** real published article results in prior scoped query; actual Android public/inprivate proof above; Homepage category route/source and B9 district search old CI green. No claim that all 12 categories/districts contain content.
**E4:** `T086_RUN15_E4_ACTUAL_SINGLE_UUID_PURL=PASS_SCOPED`.
**E5:** `T086_RUN15_E5_REAL_AUDIT_VERSION_STATUS_HISTORY=PASS_SCOPED`.

## Genuine Live architecture vs provider DUE — no fake video
Original Phase3A/3B Live source and protected old regressions were executed at reviewed current HEAD. Source shows Reporter `jb-live-api` controlled request, Owner approval, `jb-live-worker` private provider generation, server verified signal before public `LIVE`, interruption/recovery, and protected stop. Actual live hosted Supabase: **16** `live_sessions`: 14 `ENDED/OFF`, 1 `READY/OFF`, 1 `WAITING_SIGNAL/OFF`; **7** public feed records all `OFF/STABLE`. **Zero live public broadcast.** No paid encoder, new provider setup, stream start, stop or Viewer playback is claimed.
**`T086_LIVE_EXTERNAL_PROVIDER_RUNTIME=DUE`**, reopen when authorized configured Live provider/encoder+real Reporter/Owner availability permit external E6 in later Production/Live test. The original T086 PASS text expressly allows real Live-environment dependencies DUE; never call E6 accomplished.

## Accuracy boundaries
`T086_SYNTHETIC_FIXTURE_NOT_PUBLIC=YES`.
`T086_ACTUAL_FACTUAL_CONTENT_CORRECTION=NOT_CLAIMED`.
`T086_POST_MFA_EXPIRED_SESSION_CORRECTION_DEEPLINK_REAL_DEVICE=DUE`: separate reviewed strict navigation patch in **Draft PR #108** is **NOT MERGED OR DEPLOYED**, so the 10:41 in-session Android Correction Editor screenshot is not evidence that an expired-session deep link has passed live. The in-session editor itself was tested.
`T086_PRODUCTION_DEPLOY_MERGE_AUTHORITY=NOT_GRANTED`, `T086_B13_WHOLE_PLATFORM_FINAL_CLOSURE=HOLD`, original test execution order P4-T092–T109 final dependencies not auto-closed.
**Controlled T086 RUN-15 auto/core regression can be individually PASS+LOCK only when new mandatory exact-head CI is SUCCESS and all four original evidence classes above are present.** This does not close live Production launch, B8 T098 real factual correction, B13 T088 backup/real-device full commissioning or later T091 final all-tests gate.

## Candidate final verdict (requires actual CI)
`T086_E1=PASS_SCOPED_EXISTING_CI + PENDING_NEW_FULL_LIFECYCLE_CI`
`T086_E3=PASS_SCOPED_REAL_ANDROID`
`T086_E4=PASS_SCOPED_REAL_ARTICLE_ID_PURL`
`T086_E5=PASS_SCOPED_REAL_AUDIT_HISTORY`
`T086_LIVE_EXTERNAL_PROVIDER_RUNTIME=DUE`
`T086_CORE_RUN15_INDIVIDUAL_FINAL_LOCK=CI_PENDING`
`T086_B13_GLOBAL_FINAL_CLOSURE=HOLD`

**No Founder manual step. No production writes or deployment by this work.**
