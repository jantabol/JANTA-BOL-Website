# JANTA BOL — Phase 4 / P4-T071 — 12 Remaining Failure Domains, Single-Shot Audit

**Date:** 27 October 2026 IST. **Repo:** `jantabol/JANTA-BOL-Website`. **Review PR:** #45, unmerged. **Founder:** wants all 12 modules tested now; **new website domain `jantaboli.in` kept DUE separately**. No rebuild, no fake PASS, preserve existing code, security, publication, LIVE and soft-launch priority.

## Executive final answer

**12 of 12 remaining real-source JS adapters have an executed controlled failure test: PASS (source/VM only).** **No integrated runtime full-system E8 acceptance is established for these 12.** The independent live Supabase read-only capability inventory exposes a concrete backend compatibility blocker: **11 of 27 distinct RPC names called in pinned B8 `phase4-domain-client.js` are absent from the currently connected JANTA BOL public Postgres function catalog.** The undeployed ones cluster in Ad workflow, qualified analytics, notification and payment — precisely components whose full fault scenarios cannot be certified on the connected backend today.

**T071 12 REAL CONNECTED END-TO-END FAILURE FAMILIES: HOLD. T071 FINAL PASS+LOCK: HOLD.** No deployment, migration, permission grant, paid action or production fault was performed merely to force a test pass.

## Evidence 1 — all 12 real-source adapters run in one GitHub CI batch

**GitHub Actions `40508982711` / job `122205566232`**, head SHA **`8e0b62efefcc4eecd47d50f1bb5c91761879ceed`**, **SUCCESS**. Workflow `.github/workflows/b11-t071-remaining-12-modules-single-batch.yml` pinned:
- Actual B8 source Git revision `658f474d6ee0f24efac60f069979e8adee1e9221`.
- Actual B9 source Git revision `b509c60fceb053a51686f67e587d4922a40fa6f4`.

Runner's true logs show **14/14 Node tests pass**, including **13 named adapter-failure tests** and explicit HOLD guard. The remaining 12 after the previously real PG17-tested Accountability domain were individually verified by exact log markers, not guessed from green UI. Separate original Core News publishing amid **simulated** Compliance outage, Owner/AAL2 denial/version conflict and recovery: **PASS source simulation**, script `ci/phase4/p4-t019-publishing-fault-injection.cjs`. Also **4/4** actual project renderer B7 Ad/News failure-source tests and B8 stale private HIDE race browser test PASS. **These are controlled in-memory dependency failures, NOT connected backend outages.**

**Important CI self-correction:** an earlier `40508833481` source-filter workflow incorrectly logged one Node test (script was not actually discovered with `--test-name-pattern`) while its echo claimed 12 selected. That result is **REJECTED**. Corrected workflow discarded name-filter selection, reran all 13 exact source tests and explicitly checked every one of the remaining 12 family log markers; verified green `40508982711`. Do not cite rejected run as 12 actual proofs.

## Evidence 2 — 12-family matrix, exact outcome and missing proof

| # | Remaining family | True code under test / safe controlled fault | Verified source/VM | *Genuine integrated connected* failure+recovery |
|---:|---|---|---|---|
| 01 | Social | `social.html` actual `saveStatus`: fake Posted rejected, social provider refusal leaves state unchanged | **PASS** | **HOLD**, provider delivery / persisted history |
| 02 | Analytics | `phase4-domain-client.js` qualified analytics RPC failure propagates; does not invent results | **PASS** | **HOLD**, `jb_ad_qualified_analytics_internal` missing from current DB |
| 03 | Notifications | `adRetryNotification` RPC throws; cannot claim delivered | **PASS** | **HOLD**, two requested notification RPC names missing from current DB |
| 04 | Grievance | real client grievance transition RPC failure rejects | **PASS** | **HOLD**, actual private authorization/persistence/failure and audit not injected |
| 05 | Compliance | real client transition RPC rejects; existing original `P4-T019` publish survives fake compliance API failure | **PASS** | **HOLD**, actual task transaction/publish under real compliance outage not injected |
| 06 | Advertisement | missing safe lifecycle capability fails closed before LIVE; real public renderer optional Ad outage preserved news | **PASS** | **HOLD**, owner workflow and payment/Ad state under genuine backend fault |
| 07 | Search | B9 real client `jb_b9_search` error does not fabricate results; connected `anon` read-only search separately worked | **PASS** | **HOLD**, failure in connected Search RPC while actual published news remains available |
| 09 | LIVE | `JBLive` actual Edge client admin request failure rejects false Success | **PASS** | **HOLD**, real Edge/encoder session lifecycle/publish independence |
| 10 | Provider | actual camera delivery JS rejects encoder unavailability without navigating | **PASS** | **HOLD**, real encoder/provider handoff and retry/recovery |
| 11 | Payments | actual manual payment client fails before auto-ad activation | **PASS** | **HOLD**, `jb_ad_confirm_manual_payment_internal` missing from current DB, real receipt/transaction replay unproved |
| 12 | Messaging | actual LIVE notification acknowledgement Edge failure rejects false Success | **PASS** | **HOLD**, persisted committed action versus genuine messaging failure |
| 13 | Database | actual package client read and write faults do not claim committed result; separate real PG17 synthetic crash+restore already performed | **PASS** | **HOLD**, live system transaction/point-in-time recovery/availability not injected |

**Numbering:** Family #08 Accountability had previously achieved **one genuine scoped disposable B8 PG17 function fault and recovery** in GitHub `40504645684`. It was intentionally not counted as one of the new 12. That earlier achievement also did **not** complete whole-system E8 for Accountability.

## Evidence 3 — production-connected function ABI inventory: high-priority finding

**Method:** JANTA BOL Supabase project `vrffsnkycvjithwtiylt`, `BEGIN TRANSACTION READ ONLY`, query names of `pg_proc` in `public` and aggregate **distinct function names** referenced in pinned B8 `phase4-domain-client.js`. No source code or credentials exported, no internal rows read, no SQL mutation. Actual result:

- **27 distinct front-end RPC names inspected.**
- **16 distinct names present** in the currently connected public Postgres function catalog.
- **11 distinct names absent** (NOT the same as 11 failed live provider calls or 11 application defects). Some may be intentional not-yet-deployed, while source capability flags are fail-closed.

Exact missing names:
1. `jb_ad_confirm_manual_payment_internal`
2. `jb_ad_creative_workflow_capability_internal`
3. `jb_ad_decide_change_request_internal`
4. `jb_ad_lifecycle_capability_internal`
5. `jb_ad_notification_failures_internal`
6. `jb_ad_notification_retry_internal`
7. `jb_ad_owner_change_requests_internal`
8. `jb_ad_owner_renewals_internal`
9. `jb_ad_qualified_analytics_internal`
10. `jb_ad_safety_transition_idempotent_internal`
11. `jb_ad_set_approved_quote_internal`

**Why this matters:** A full real-server end-to-end test cannot produce valid "pass" behavior for an RPC not deployed under the expected name/signature. Blindly granting permissions, applying review-only migrations on production, editing Founder approval, fabricating payment records, or aliasing old RPCs would risk violating prior locks. Source code checked is the B8 candidate revision, not proof those optional features were ever committed/promoted to production. Signature, overload, Auth and provider readiness would require additional verification even for the 16 names that exist.

## Evidence 4 — repeat baseline & actual independent PG17 checks

- **Real PG17 B8 Accountability module isolated failure:** `40504645684`, job `122190733649` SUCCESS. Original SQL applied from pinned B8, one anon public feed function denied and later restored, separate public case RPC stays readable and original Article/Ad synthetic sentinels unchanged. **Scope=1 function**, no full B8 in-production outage.
- **Real disposable PG17 crash & recovery:** `40501228346`, job `122179118305`, observed **local RPO-point age 0.422 s and local RTO 1.261 s**, explicitly **1 acknowledged synthetic row lost**. These are not Founder service objectives or production guarantees.
- Earlier PG17 CI runs intermittently failed during postgres:17 Docker *temporary initialization server* shutdown, before actual fixture testing. They are not counted as PASS. Safe stability fix now requires double real `SELECT 1` readiness and retries only transient connection errors; latest **`40509162785`: SUCCESS** after the fix. No prod credentials and no connected DB writes.
- Previously selected source News/LIVE/Ad/B8 + Founder-final B9 branding/Search **50/50 PASS** at `40506133975` (unit/source scope), not production E8.
- Production protected main remains `f447231c0677644ca5a44cc19f12cf0314ff38ea`, and Vercel production `dpl_nFSo2MXg3ASBPgUfXRYDzv2ybP8C` was last independently checked READY at same SHA. No merge/deploy aliases changed.
- Connected `anon` search `jb_b9_search('T032')` returned 1 item, while direct `anon` Articles Table SELECT is forbidden. Public direct Articles vs B9 RPC mismatch remains a separate soft-launch E2E verification issue.

## Remaining honest requirements — cannot mark completed by source-only tests
1. **Actual integrated 12-family fault/persistence/recovery results** for each existing and intended backend component, using available safe isolated runtime or a separately approved testing provider; source simulations do not satisfy this.
2. **Contract/source reconciliation** for the **11 currently absent candidate RPC names**. Before deploying functions, determine whether those are intentionally not in V0 soft-launch scope; only include actual enabled features in operational acceptance. Never silently change production grants, billing or B7/payment state.
3. **Founder-approved practical RPO/RTO limits and relevant measured recovery**; local synthetic 0.422/1.261 sec cannot be compared with nonexistent production targets.
4. Full independent **E8 original Publishing and LIVE continuity**, logs/Audit/RLS/private cases, same source identity and no false positive across real dependencies. Release remains Founder-only.
5. Separate domain/DNS `jantaboli.in` stays **DUE** per Founder. It is a hostname, not one of the 12 functional failure modules; no paid host needed for source simulations.

**Final factual verdict:** Remaining **12 source/VM fault paths executed and checked** ✅. Original full integrated 12-family E8 acceptance **NOT COMPLETED** ⏳. **T071 FINAL PASS + LOCK = HOLD**, no fake PASS. No Android manual action required for this source/SQL inventory batch. Production remains unchanged.
