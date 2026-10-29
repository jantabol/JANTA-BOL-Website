# JANTA BOL — P4-T071 / G2 — 13 Domain Failure Matrix, Actual Source Adapter Execution
**Date:** 27 October 2026 IST  
**State:** SELECTED ISOLATED SOURCE-ADAPTER TESTS COMPLETE. FULL REAL HOSTED FAILURE MATRIX NOT COMPLETE. **T071 FINAL PASS+LOCK = HOLD.**  
**Founder constraints:** Soft Launch priority; no rebuild, no fake pass, no old work break; no production fault injection.

## Immutable verified evidence

- Test branch: `codex/b11-t071-failure-isolation-preflight-20261027`; pull request **#45** (unmerged).
- Executed GitHub source HEAD **`e371706dd3ea0d53d9763d3fcab896b994bc989d`**.
- Official GitHub Actions run **`40498177713`**, job **`122168854308`**, SUCCESS, **80/80 actual Node tests PASS, 0 FAIL**:
  - **30/30** suite A = 6 pre-existing B8 public/feed + 10 existing protected RPC negatives + **14 new tests** (13 individual domain-client injections + 1 no-hosted-authority guard).
  - **11/11** old B7 Ad/Analytics/payment and B8 accountability regressions.
  - **39/39** T070 E8 fail-closed, T071 matrix, RPO/RTO, source binding safety contract tests.
- Two *real existing* JANTA BOL source revisions were freshly checked out and Git SHA matched on the runner, separately:
  - integrated B8 frontend/domain source: **`658f474d6ee0f24efac60f069979e8adee1e9221`**;
  - B9 Search/Final Founder tagline source: **`b509c60fceb053a51686f67e587d4922a40fa6f4`**.
- The **actual browser/business JavaScript code from these pinned sources ran**, in a disposable GitHub-hosted Node VM. Dependencies (RPC, Live Edge, social send, camera provider, database selection) were replaced with deliberately failing **in-memory stubs**. This is **controlled dependency-failure execution of real adapters**, *not* real remote backend faults, a deployed isolated product, or actual end-to-end recovery.
- Isolated CI workflow uses read-only checkouts, no production credential, no service-role, no B2 credentials, no Supabase/Vercel writes; production fault injection not enabled.
- GitHub protected main **`f447231c0677644ca5a44cc19f12cf0314ff38ea`** and Vercel production `dpl_nFSo2MXg3ASBPgUfXRYDzv2ybP8C` remain attached to that same SHA on independent read-only recheck. No merge or production promotion.

## Thirteen separate exercised adapters (the distinction from hosted acceptance is deliberate)

| # | Family | Exact real adapter / injected failure | Observed in GitHub run | Source-VM result | Hosted/full E2/E5/E8 |
|---:|---|---|---|---|---|
| 01 | Social | `social.html` inline `saveStatus`: fabricated `Posted` blocked; rejected `socialAttempt` leaves existing status unchanged | No fabricated `Posted`, no mutation after failure | **PASS** | **HOLD** — actual provider delivery, publish independence |
| 02 | Analytics | `phase4-domain-client.js` `adQualifiedAnalytics`: RPC throws | Propagates failure; no invented 0 views | **PASS** | **HOLD** — actual analytics outage/core publisher read |
| 03 | Notifications | `adRetryNotification`: RPC returns error | Retry rejected; no delivered-success return | **PASS** | **HOLD** — persisted committed transaction/audit |
| 04 | Grievance | `grievanceTransition`: RPC network down | Sensitive transition rejected in client | **PASS** | **HOLD** — actual RLS, private row access, audit |
| 05 | Compliance | `complianceTransition`: RPC error | No approved/committed result | **PASS** | **HOLD** — database authorization, audit |
| 06 | Advertising | `adTransition(...,'live')`: missing safe backend capability | Stops *before* live-transition RPC | **PASS** | **HOLD** — actual payment/ad scheduling safety |
| 07 | Search | `b9-client.js` `search`: `jb_b9_search` network failure | Rejects without imaginary hits | **PASS** | **HOLD** — integrated website and publisher continue |
| 08 | Accountability | Actual `b8-public-case-client.js` `createPublicCaseReader` public RPC failure | Public projection rejected; existing B8 stale-HIDE source regression also green | **PASS** | **HOLD** — protected write audit preservation |
| 09 | LIVE | `phase3a-live-client.js` `adminOverview`: Live Edge error | No false successful response | **PASS** | **HOLD** — provider retries/live lifecycle |
| 10 | Provider | `phase3c-live-delivery.js` camera preparation throws | Browser location unchanged; no encoder handoff | **PASS** | **HOLD** — genuine outage/retry/WAIT contract |
| 11 | Payments | `adConfirmManualPayment`: RPC throws | No confirmed receipt, no ad scheduling RPC | **PASS** | **HOLD** — real transaction ambiguity/replay/double charge |
| 12 | Messaging | `JBLive.acknowledgeNotification`: Edge returns unknown/error | Ack rejected; not mislabeled successful | **PASS** | **HOLD** — committed action persists after message failure |
| 13 | Database | `adPackages` DB read failure and `adSavePackage` RPC write error | Neither empty-catalog success nor committed-write success | **PASS** | **HOLD** — real database transaction partition/recovery |

**Interpretation:** **13/13 source-adapter VM probes PASS; 0/13 actual *hosted product* fault families accepted.** Source-VM and hosted/transaction proof MUST NOT be merged into one percentage. Previous **66/66** checks remain covered; actual new tests = 14. Total current official suite = **80/80**.

## Missing before full T071 FINAL LOCK

1. **13 real *hosted isolated product* failure runs**: safe isolated runtime with real database/RLS/Edge/provider integration, each actual induced dependency fault, before/after records, no-false-success, old core read/publish retained. Never fault the existing public production system.
2. **E5 immutable evidence**: individual fault timestamps, failing response, persistence/audit reads, masked logs and independent source/runner identity; avoid exposing any grievance evidence, private UUIDs, credentials or payment data.
3. **E8 independent operational verification** of all domains, live Article + LIVE regression and service health after fault, exact release candidate, rollback boundary. A completed Node suite does not satisfy it.
4. **RPO/RTO**: Founder-approved targets plus independently observed last restorable same-system recovery point, incident start, service restored time, measured eligible data loss. Current **RPO: NOT ESTABLISHED; RTO: NOT ESTABLISHED**.
5. The user-facing **Soft Launch editorial blockers** are separate from T071: 16 public published news records audited; 15 are QA/testing, and 1 serious accusation/injury story lacks independently checked proof. No auto-unpublish and no promotion without Founder editorial permission.
6. Resource/permission boundary: earlier Vercel Free plan preview API deployment returned **402 daily cap**, full isolated hosted clone/backends are not validated as available. No cost-bearing project creation, production mutation or credentials were authorized/used here.

## Honest outcome and next executable gate

- **E1:** pinned source identity / adapter coverage **verified**.
- **E2 (source VM):** 13 actual adapters executed with deliberate failing dependency mocks **PASS**.
- **E2 (real hosted fault):** 13/13 **NOT RUN**.
- **E5:** actual GitHub test logs present, but **hosted failure/audit negative logs missing**.
- **E8:** **HOLD**.
- **T071 FINAL:** **HOLD, NOT PASS+LOCK**.
- **T070 FULL E8:** separate **HOLD** (never upgraded by T071).
- **Production:** unchanged; Founder has **no Android/manual action for this VM test stage**.

**Next safe action:** prepare/authorize a bounded, *genuinely isolated* product runtime and a resource-neutral Fault-Run gate before any real hosted 13-domain injection; collect approved per-family fault evidence, then measure RPO/RTO. Soft Launch editorial review and correction remains the separate near-term critical path.
