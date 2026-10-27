# JANTA BOL • Phase 4 • P4-T071 → P4-T072
## Founder’s No-New-Gate Closure Route • V1.0 • 27 Oct 2026
**State: ROUTE DOCUMENTED; NOT A T071 PASS / NOT FOUNDER FINAL LOCK.** No production change.  
**Primary authority:** latest Founder Master PDF `JANTA_BOL_PHASE_4_MASTER_EXECUTION_PACK(20261027-041849).pdf`, p.304, RUN-10 / P4-T071 / RECOV-019–026 / §§600–616. This route is a transparent execution plan, NOT an amendment to the Master. Machine-readable closure list: `ci/phase4/b11/t071-closure-route-v1-frozen.json`.

### 0. Binding original test — exactly what the Master asks
- **Procedure:** Controlled failures for **social, analytics, notifications, grievance, compliance, ads, search, accountability, LIVE, provider, payment, messaging and database**, plus practical recovery-objective review.
- **Exactly four main PASS invariants:**
  1. Optional-module failure does **not** crash the whole site.
  2. Payment ambiguity **cannot accidentally put an advertisement LIVE**.
  3. Messaging failure **cannot undo a successful committed business action**.
  4. Database failure **cannot claim false success**.
- **Evidence:** E1 + E2 + E5 + E8.
- **Phase-3 protection:** Existing baseline CI + Core News Publishing/LIVE regression.
- **No** mandatory new `jantaboli.in` domain, paid hosting, forced production fault or numerical SLA is stated in this Master test. The numeric acceptable recovery policy, if required for a particular project, is a Founder risk decision **within** the practical review, not a new arbitrary external gate.

### 1. Fixed route — five and ONLY five T071 closure gates

| Gate | Exact deliverable / passing evidence | As of route creation | Whose action? |
|---|---|---|---|
| **C1 — E1 Identity & Baseline** | Record the tested exact candidate source/commit and a real baseline: public Article read, protected Founder publication outcome, truthful LIVE existing/OFF state and original Phase-3 CI. Bind all records to SAME candidate. | **PARTIAL:** CI/source pins known, complete release-candidate integrated baseline not independently validated. | Backend first; Founder only if real Android login/UI proof is indispensable. |
| **C2 — E2 Controlled 13-Family Matrix** | For every one of 13 rows below, demonstrate an **actual controlled isolated integration failure** (or real unavailable/capability-OFF outcome for a genuinely disabled optional module) plus before/after persistence and core continuity. Each receives `PASS`, `FAIL`, or `HOLD` with exact logs. Mock responses alone cannot award complete acceptance. | **PARTIAL:** 13/13 JS source simulations; **1 scoped** real disposable PostgreSQL Accountability Feed RPC outage with surviving peer; other families’ whole-integrated proofs HOLD. | Backend/integration. |
| **C3 — Four Behaviors + RPO/RTO Practical Review** | Four original PASS behaviors above proved across C2. Record which restore point was recoverable, fault time, real same-system restoration/data loss and practical acceptable recovery policy/risk disposition. No false promises about Production. | **PARTIAL:** actual disposable PG17 checkpoint point-age **0.422 s**, recovery **1.261 s**, **one synthetic committed post-backup row lost**. Real system-wide objectives not established. | Backend first; Founder decides acceptable risk/objectives, not the assistant silently. |
| **C4 — E5 Negative Logs + Phase-3 Protection** | Per-family failed response, timestamps, source identity, before/after transaction or visible readback, protected data/nonduplication result, recovery or safe-hold; old Phase-3 CI + Core Publishing/LIVE regression on same candidate must remain green. | **PARTIAL:** source/VM logs, 20/20 RPC source reconciliation and 50/50 selected News/LIVE/Ad/Search CI exist; no E5 real integrated 13-family logs. | Backend first, Android if later essential. |
| **C5 — E8 Independent Final Review + Founder Decision** | Independent reviewer assesses **only C1–C4** against Master p.304; all mandatory sub-gates PASS and no unresolved original-scope regression. Founder explicitly accepts/locks documented verdict; then and ONLY then `P4-T071 FINAL PASS+LOCK` and **start `P4-T072`**. | **HOLD** — old 21/21 audit verifies narrower evidence, not full platform E8. | Independent review + Founder final authority. |

**All five must pass** for T071 FINAL PASS+LOCK; partial proofs are retained, not rerun merely for a newer document. If a gate genuinely fails, fix/retest only that requirement. Each claimed PASS must have runner/log/real-state evidence; no automatic PASS based only on a green source-VM CI.

### 2. Thirteen rows to work through inside Gate C2 (no 14th family)

| # | Module | A meaningful acceptable actual failure observation |
|---:|---|---|
| 01 | Social | Provider/offline or unavailable path observed; publishing/news unaffected, no fabricated `Posted`. |
| 02 | Analytics | Analytics unavailable; public Article read and publish unaffected, no fabricated reach. |
| 03 | Notifications | Delivery failure audited; previously committed business action not reversed; no fabricated delivery. |
| 04 | Grievance | Protected operation safely denies on dependency outage; private data remains private. |
| 05 | Compliance | Protected operation denies, safe independent News Publishing still behaves correctly; no false approval. |
| 06 | Advertisement | Safe pause/HIDE continues; unavailable upgraded Ad capability cannot falsely approve/schedule/put paid Ad LIVE. |
| 07 | Search | Search failure isolated; published article read/publish continues and errors aren't fake results. |
| 08 | Accountability | Protected write denied and audit survives; independent public read behaves safely. **Scoped PG17 optional-feed failure already tested**; full candidate still pending. |
| 09 | LIVE | Genuine LIVE/Edge failure does not become false `LIVE`/command success; graceful stop/wait and bounded retry. |
| 10 | Provider | Encoder/provider unavailable means UNKNOWN/WAIT; never invent successful handoff. |
| 11 | Payment | Uncertain/unverified payment not promoted as paid or advertisement LIVE; no false success. |
| 12 | Messaging | Messaging failure does not roll back a genuine committed transaction; failure is visible/audited. |
| 13 | Database | Failed/ambiguous database write cannot appear committed; safe public-read behavior and clean recovery described. |

**Optional release-OFF rule (critical):** If paid Advertising, optional social, advanced analytics or provider integration is **not actually released**, no one must deploy it merely to make this test green. Its acceptance path is to verify the **actual release candidate** transparently says unavailable/WAIT/disabled, prevents dangerous writes/false success, and does not impact core News. A standalone mock or an undocumented “not deployed” assertion is insufficient. A genuine active backend path, if enabled, must be fault-tested safely. No privileged production fault injection.

### 3. Existing evidence we KEEP — no repeats without a real contradiction
- **13 source adapters with synthetic failed dependencies:** GitHub `40508982711` selected `14/14` Node checks incl. 13 modules and scope guard; *source/VM only*, not whole connected E8.
- **Actual isolated B8 backend failure:** GitHub `40504645684`, PG17 Accountability feed denied, peer case RPC survived, synthetic Article/Ad rows survived, feed restored — `PASS` scoped, not all-platform.
- **Actual isolated PG17 crash/recovery:** `40501228346`, local RPO-point age 0.422s / RTO 1.261s and 1 lost post-backup synthetic committed row; not a live Supabase/Site guarantee.
- **50 selected no-DNS original regressions:** `40506133975`, `50/50 PASS` *source/selected unit and simulation scope*; newer candidate or LIVE provider still needs C1/C4.
- **11 absent RPC reconciliation:** `40511005431`, `20/20 PASS` documentary; 10 definitions in `REVIEW_ONLY` SQL, **one intentionally omitted `jb_ad_lifecycle_capability_internal` sentinel**. **No authorization to deploy these**, and their absence alone is not a T071 failure if unused/disabled correctly.
- **Independent narrow evidence audit:** `40502445962`, `21/21 PASS` scoped; **not full E8**.

### 4. Explicit NOT-T071 blockers — cannot be secretly added later
These **may matter to Soft Launch or other test numbers**, but cannot be sprung on Founder as a newly invented T071 condition:
- Custom website hostname **`jantaboli.in`** registration/DNS/SSL/cross-domain cookies/PURL — **DUE** as separate domain/release task.
- Paid Hosting, new Vercel plan, new Supabase project, paid encoder/provider subscription — **NOT mandatory methods** in the T071 Master.
- Deploying all 11 missing reviewed B7 RPCs, switching paid Ads ON or turning on social/analytics/notifications solely to manufacture a failure — **not required**. No unsafe legacy shortcut.
- Editorial cleanup of published QA/test news, removing fake LIVE/static headlines, final public branding, and the separate guest-read launch risk — **Soft Launch tasks, not extra T071 acceptance criteria**, except evidence of **core Article read/publish continuity** explicitly demanded by T071.
- `P4-T072` DB partial-write/rollback, ambiguous retry, idempotency and duplication/journal scenarios are **NEXT TEST** (`RECOV-027–032`, §§617–622); do not absorb its entire suite into T071. T071 still checks its narrower DB false-success and messaging-commit requirements.
- T070’s separate final E8 or broader restore policies cannot silently become a fresh T071 gate unless an actual T071 baseline/recovery fact depends on them.

### 5. Strict no-goalpost policy
**Route version:** `T071-CLOSURE-ROUTE-V1.0`. Machine readable contract enumerates **exactly C1–C5, 13 families, four PASS invariants, and E1/E2/E5/E8**. No sixth gate; no 14th family.

A genuine newly discovered defect is classified:
1. **DIRECT T071:** reproducibly violates one of the original four PASS invariants, the 13 specified module failures, E1/E2/E5/E8, or Phase-3 core regression → attach to the **existing** matching C1–C5 gate with evidence. No new gate number.
2. **SEPARATE:** unrelated new Feature/DNS/Editorial/T072/etc. → independent issue/test. Cannot retroactively prevent T071 purely as “another thing to check.” Do not claim this authorizes unsafe Soft Launch.
3. **Founder's explicit change:** if new scope actually needed, show Master clause + risk + minimum amendment and obtain Founder approval before `V1.1`. Never amend silently.

**Closure packet once and only when C1–C5 are genuinely satisfied:** 13-row failure matrix with `PASS` and run IDs; 4 behavior assertions with direct evidence; practical RPO/RTO assessment with limitations and Founder risk decision; original CI/Core Publishing/LIVE PASS; E1/E2/E5/E8 independent verdict; immutable source identity; Founder final lock; **handoff P4-T072**. Any still-DUE future domain or editorial release item is tracked separately, never smuggled into T071.

**Current final verdict:** `T071 ROUTE V1.0 DOCUMENTED` ✅; `T071 FINAL PASS+LOCK = HOLD` ⏳; `T072 NOT STARTED`. No Production/DB/permissions/payment/Domain changes authorized by this route.
