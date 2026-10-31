# T081 — Live Release/Rollback NO-WRITE Dry-run (2026-10-31)

**Result:** RELEASE IDENTITY / DOMAIN BINDING PRECHECK PASS_SCOPED; LIVE ROLLBACK NOT RUN; FULL E8 HOLD. All connected tool calls were **GET / list / GitHub compare**. No alias reassignment, DNS change, deployment, database write, encryption key, bucket request or billable B2 operation.

## Current route and historic candidate
- `jantabol.in` `verified=true` in Vercel and currently aliases `dpl_6XpfdMa7gCF5SDXd7EKHZfbpLfeF`, Git `93df12aa8ffdfae38d9a4066b6a4556bb36969e5` (production READY).
- `www.jantabol.in` is verified, redirects with 308 to `jantabol.in`, same active deployment.
- Prior production deployment `dpl_EZRh8gzLQ1voeRKA2u5tF7DD3Byx`, Git `14a929180d99088e950475eeee609cae8e3f01c8`, still READY.
- GitHub exact predecessor→current compare: 3 commits ahead, 0 behind, 3 changed files (`.github/workflows/b12-t080-admin-retry-review.yml`, `JANTA_BOL_PHASE_3C_WORKING/add-news.html`, `ci/phase4/b12/t080-admin-ack-failclosed.test.mjs`). **No SQL migration file in this exact predecessor/current diff**.
- Protected `main` `f447231c0677644ca5a44cc19f12cf0314ff38ea` was 434 commits behind currently served production review branch; Main is NOT the live release source. Any blind Main merge/rollback risks losing the extensive new site code.

## Actual non-mutating Vercel alias / rollback lookup
- Explicit `Vercel.list_aliases({projectId,rollbackDeploymentId: prior_deployment_id})` returned an **empty alias subset**. This result **does not** prove that rollback would route the custom domains correctly or be safe; provider semantics / rollback state must be independently checked. It is *not* a simulated successful cutover and MUST NOT be marked PASS.
- Ordinary Vercel alias inventory independently shows the live `jantabol.in` and `www.jantabol.in` aliases bound to the current deployment; prior Git branch-scoped `*.vercel.app` alias still exists on its earlier deployment. The mere existence of an older READY build is NOT a recovered production runtime, nor does it prove public Auth/login still works after reverting frontend JS.
- A real Vercel rollback API call was deliberately **NOT** made: it can change live traffic and affect automatic domain assignment. No production release was created or promoted.

## Fail-closed GO / NO-GO
1. Source hashes, exact branch & deployment IDs in evidence are identifiable (E1 metadata scoped PASS), HTTPS domain identity independently verified (E6 metadata scoped PASS).
2. For data safety, **never** restore an old database on the live primary just to roll back frontend routing. Existing public Articles, permanent URLs, grievance identities, audit & user changes must remain newer. Fail-closed code guard enforces `operation_permitted=false` even when the synthetic preconditions are satisfied.
3. Historic Founder T070 DB/5 original Storage bytes were restored offline (scoped). Current DB/Media + Auth GoTrue + Edge runtime versions/config + Vercel settings/secrets at one point were NOT separately restored; full E8 is **NOT_RUN**.
4. Screenshots from Founder: 2026-10-31 17:18 IST B2 Caps & Alerts (163MB; display $0.00, capped categories, 0 transactions) and 17:20 IST Billing Estimated B2 Fees ($0.00) and “Enter Payment Method”. These do **not** guarantee account-wide zero future charges or independently prove old/new backup byte parity. Class D is not hard-capped. Do not turn on scheduled encrypted B2, use a paid option, or dispatch the original live workflow without a separate exact Founder decision and hard no-charge safeguards.
5. Release checklist remains: exact reviewed SHA of both baseline and candidate; protected original Phase3/B0–B11 CI; current-point coherent recovery E8; Founder AAL2 + protected environment required reviewers; Android Founder smoke; observe production before/after; and a separately authorized controlled rollback trial preserving fresh DB and all critical records. **NO GO until all are independently satisfied.**

**T081 FINAL PASS/LOCK=HOLD.** This review can be used to guide the next real Founder-controlled acceptance phase, not to bypass it. It does not block non-mutating, independently scoped T082 work during Soft Launch preparation.
