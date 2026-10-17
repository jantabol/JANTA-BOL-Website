# JANTA BOL / Phase-4 B7 — 5×5 Issue Checkpoints
**Date:** 2026-10-12 | **Type:** execution grouping only; NOT a new source of truth or completed-test claim.
**Canonical authorities:** `review/B7_20261012_CONSOLIDATED_ISSUE_PUNCHLIST.md`, `TEST-REGISTER.md`, `review/B7_FINAL_ZIP_CLOSURE_MANIFEST.json` and the B7 Final Master Blueprint/Phase-4 Master Pack. Keep all statuses and evidence in those original records.

**Founder rule:** Complete work in exactly one group of five findings, report progress once, then await `CP-0N START`. Do not reimplement existing verified fixes. Preserve existing GitHub/Supabase/CI/News/B3/B5; no production SQL, deployment, new Supabase staging, real payment, PR merge, or Cricket writes without separate permission. Use disposable PostgreSQL/CI Option A first. RED → independent RCA → minimum safe fix → regression → actual proof. Do not loop polling CI.

**Verified pre-map snapshot:** Working branch `codex/b7-blueprint-20261010`; engineering HEAD `647b9aed3ec2f4f891513ad78e5c44c3422be017`; PR #5 Draft/unmerged. P4-T035 Candidate GitHub Actions 23/23 green; protected Phase 3A+3B green at same HEAD. Findings = A 9 UI, B 16 backend, C 5 environmental (old ENV06 alias preserved under BE16). Already code/isolated-CI checked: UI01..08, BE07, BE08, BE09, BE10; UI09 has earlier CSS source fix. **None of these are automatically live E2/E3/E5/E7 PASS.** Final P4-T034..T042 = **0/9 PASS+LOCK**; final B7 ZIP BLOCKED.

## CP-01: Owner backend queues + diagnostics (5)
- [ ] BE01 — Qualified analytics private Owner RPC; accurate, privacy-safe counts.
- [ ] BE02 — Unified B3 notification failures/retry, immutable audit.
- [ ] BE03 — Owner renewal queue; manual new quote/inventory/approval, no automatic extension.
- [ ] BE04 — Advertiser text-change Owner queue; approved LIVE version must remain.
- [ ] BE16 — Missing RPC vs Owner AAL2 vs wrong configuration; no fabricated success/zero.
**Exit:** source+disposable Owner/RLS/negative CI, trace each missing production RPC separately; production E2/E5/E7 still DUE.

## CP-02: Media + LIVE lifecycle + schedule + payment (5)
- [ ] BE05 — Authenticated Owner private image/video upload, receipt, durable worker and clean release.
- [ ] BE06 — FFmpeg/poster/GPS/metadata sanitize and revocation, isolated worker E2.
- [ ] BE07 — Positive status/LIVE denied without Owner approval, verified advertiser, media and receipt; preserve old guard.
- [ ] BE08 — UTC/local schedule, paid-window immutability, pause/resume/hide, inventory.
- [ ] BE09 — Agreed quote, explicit non-refund, genuine receipt, replay prevention; weak legacy client API already disabled by CI, server E6/E7 DUE.
**Exit:** fail-closed negative proofs; NEVER mark true media/payment or external provider complete from synthetic CI.

## CP-03: Verification + intake + official geo + public ad feed + packages (5)
- [ ] BE10 — High-risk verification/AAL2, portal revoke, tenant isolation; source+isolated CI already exists.
- [ ] BE11 — Server-side enquiry WhatsApp normalization, consent, cooldown, pending-only receipt.
- [ ] BE12 — Official MP LGD code/provenance, article vs viewer geo, invalid-area denial.
- [ ] BE13 — One paid ad per article, pinned while article open, approved canonical public feed.
- [ ] BE14 — True empty package inventory versus bug, owner price/version, preserve past contract.
**Exit:** exact existing source traced; disposable API/RLS/geography/public negative and protected regressions; real rollout DUE.

## CP-04: Android Owner UI batch 1 (5)
- [ ] UI01 — CTA pair reset and server semantics; No CTA/Call/WhatsApp/Website/Map.
- [ ] UI02 — Image→Video invalidates old JPG chooser/preview/blob; no mismatched media.
- [ ] UI03 — Image→Text removes stale image and old asynchronous decode.
- [ ] UI04 — Text creative hides/disables file/media URL/preview inputs.
- [ ] UI05 — Remove local file revokes URL but preserves other unsaved fields.
**Exit:** reverify existing source fixes, only minimal regression repairs; Android physical E3 remains DUE until matching build tested.

## CP-05: Android UI batch 2 + release readiness (5)
- [ ] UI06 — New file selection clears stale old error.
- [ ] UI07 — Type-specific CTA target label/placeholder, phone/HTTPS validation.
- [ ] UI08 — Mobile package/quote/payment/request controls and tap targets.
- [ ] UI09 — Homepage 'विज्ञापन के लिए संपर्क करें' tap-target retest on current Android.
- [ ] BE15 — Exact SHA→artifact→deployed URL; migration/rollback and Founder E5/E7 release preparation. **No actual deployment without Founder permission.**
**Exit:** CI+source review, exact-build Android retest checklist and only genuinely necessary Founder steps; final production E7 gate DUE.

## CP-06: Five environmental/device observations (5)
- [ ] ENV01 — SPCK localhost server lifecycle/ERR_CONNECTION_REFUSED, distinguish preview from app bug.
- [ ] ENV02 — Advertiser portal same-tab navigation vs failed separate localhost tab.
- [ ] ENV03 — Biometric/PIN secure context in Android Chrome vs embedded SPCK WebView.
- [ ] ENV04 — Picked original Gallery image vs screenshot/crop; do not assume server corruption.
- [ ] ENV05 — Real photo aspect variants and 15s video; preview does not prove sanitization/poster/upload.
**Exit:** exact device reproduction and honest E3/E7 classification; do not mark device-only tests PASS on screenshots of local preview alone.

## Closure and reporting policy
Unique issue coverage: CP01(5)+CP02(5)+CP03(5)+CP04(5)+CP05(5)+CP06(5) = **30/30 identified**, NOT 30/30 resolved.
For each checkpoint report: `IDs 5/5 reviewed` + independent per-ID `SOURCE+CI VERIFIED / PARTIAL / DEVICE DUE / DEPLOY DUE / NOT STARTED`, exact GitHub SHA, changed files, RCA and CI run IDs, original regression preservation, and remaining E2/E3/E5/E6/E7. Never show `5/5 FINAL PASS` without its full real proof.
Final separate release gate after all six groups: every canonical `P4-T034..T042` with its required E1/E2/E3/E5/E6/E7 proof, approved Founder action and ZIP release. `RUN-14 EXTERNAL E6` remains DUE until true provider evidence. Zero fake PASS, no accidental changes to JANTA BOL or Cricket production.
