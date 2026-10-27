# JANTA BOL — Phase 4 / B11 — P4-T071 startup and Soft Launch Critical Path
**Date:** 27 October 2026 IST • **Status:** T071 **PRE-FLIGHT STARTED**, NOT full AUTO test PASS • **Founder direction:** Soft Launch is the goal, no repeated T070 rehearsal, no old work damage, no fake pass.

## A. Blueprint contract — keep test identity unchanged

Primary source: `JANTA_BOL_PHASE_4_MASTER_EXECUTION_PACK.pdf`, Topic 10 RUN-10, sections **600–616 / RECOV-019–026**, P4-T071 **“RPO/RTO + Cross-Module Failure-Isolation Matrix”**. Procedure is controlled failures for social, analytics, notifications, grievance, compliance, ads, search, accountability, LIVE/provider, payment, messaging and database. Core acceptance:
- Nonessential module failure must NOT bring down the main news site.
- Provider/payment uncertainty cannot accidentally set an ad/LIVE action to successful.
- Failed delivery/messaging must not undo a committed business action.
- Database failure must not display a false success.
- Record **actual** recovery/loss objectives and independent **E1 + E2 + E5 + E8**, maintain baseline Article Publishing/Live regression.
- No production faults or production kill-switch activations authorized by this preflight. Fail closed with `NOT_RUN` for missing real failure proof.

**T070 dependency separation:** Actual joint source DB + five original media bytes backup/recovery `40452402698` genuinely PASS in isolated PG17+filesystem; full T070 original requirement `final_lock=false` because hosted Auth/Edge/Vercel and universal writer barrier/E8 remain unproven. T071 preliminary contract+source inspection does **not** override `ci/phase4/b11/t070-final-e8-gate.mjs` or claim full T071 authority.

## B. Failure inventory — test families and expected behaviors

| Domain | Classification | Expected upon induced isolated failure | Live test evidence |
|---|---|---|---|
| Social | Optional | Core article read and publish remain usable | NOT RUN |
| Analytics | Optional | Core article read and publish remain usable | NOT RUN |
| Notifications | Auxiliary | Delivery failure is audited, already-committed action stays | NOT RUN |
| Grievance | Protected | Sensitive action fails closed, private data remains private | NOT RUN |
| Compliance | Protected | Sensitive action fails closed, no permission bypass | NOT RUN |
| Advertising | Protected | Uncertain payment doesn't activate/publish | NOT RUN |
| Search | Optional | Core article read and publish remain usable | NOT RUN |
| Accountability | Protected | Protected write denied while audit integrity preserved | NOT RUN |
| LIVE | Protected | Provider failure cannot produce false LIVE success | NOT RUN |
| External provider | External | Unknown state explicit, WAIT rather than invented success | NOT RUN |
| Payment | Protected | Ambiguous transaction not promoted; no duplicate charge/action | NOT RUN |
| Messaging | Auxiliary | Notification failure can't roll back committed action | NOT RUN |
| Database | Critical | Failed write cannot appear committed; safe public-read behavior documented | NOT RUN |

**E2/E5 evidence requirements for each:** actual integrated adapter under test, controlled fault in safe isolated runtime, captured exception/result/negative observables, independent unredacted-to-authorized reviewer but publicly redacted run log proof, stable immutable code/run identity, affected old CI green. A paper matrix or fabricated failure engine is **NOT** execution of T071. The fail-closed code evaluator `t071-failure-isolation-contract.mjs` can never grant `final_pass`, `final_lock` or a release.

## C. RPO/RTO — no invented production objectives

- **RPO measured:** incident occurrence minus the *last independently verified restorable checkpoint* on the **same system**. It is **NOT** automatically zero or a snapshot age guessed from cron frequency.
- **RTO measured:** incident start until the affected **live service is independently observed functioning again**. GitHub T070 Run #3 elapsed 13m58s is only a combined backup/offline drill duration, **not** live-site RTO.
- With no externally approved RPO/RTO thresholds or genuine incident/recovery timeline, both are **NOT ESTABLISHED**, never PASS. No unsynced founder/reporter mobile edits may be discarded to force a metric.

## D. First actual repository production-readiness finding (E1, not deployed-source proof)

Fresh independent GitHub `main` inspection at `f447231c0677644ca5a44cc19f12cf0314ff38ea`:
- The checked-in `index.html` contains **static hard-coded news/breaking text** and a **static LIVE badge**; `script.js` contains **zero `fetch(...)` calls** and no Supabase client references. Example headlines must be independently editorially reviewed; risk is especially serious because one static headline alleges corruption. These are the **repo's old static website files**, and are NOT proof those files are the current deployed/production news source.
- Code tree has old static `index.html/script.js/style.css`, historic ZIP and CI recovery/test material, but no obvious current integrated Article Publish/Supabase runtime bundle in checked `main`. Do not invent it, replace it from zero or mislabel this repo as the full deployed source of truth.
- Separate connected Vercel project `shubham-pichhore-2028`, `prj_xNb9G3xjW35qSXEyF7o2qiCqG4HI`, latest deployment metadata shows `READY` and Vercel domains; **Git Source/commit mapping and current production Public/Admin/Auth endpoint parity are NOT VERIFIED**. `READY` is not proof correct JANTA BOL site/code on domain.
- Live JANTA BOL Supabase prior read-only inventory was `ACTIVE_HEALTHY`, 100/100 public RLS enabled, 13 currently active Edge functions; that proves backend existence/inventory, not end-to-end Android Publishing or API source integration.

**Highest-value soft-launch task found:** independently establish which deployed public domain + Admin route map to which source commit and Supabase project; on the selected actual production candidate ensure **editorially verified real news only**, remove/disable static/mock allegations and false LIVE signals before public visibility. This is a **readiness finding**, not approval to deploy, overwrite old site, mutate news content or bypass Founder Publish authority.

## E. Parallel production readiness T076–T083 (discovery only, NO premature start of their final tests)

| Test | Verified evidence available now | Missing before PASS |
|---|---|---|
| T076 domain/hosting/HTTPS | Vercel deployment metadata READY | real current URL/cert/public/Admin/Auth GET and repo/version proof |
| T077 Article/PURL/Auth & environment | T070 snapshot identity parity | live Publish/Correction/Unpublish/Republish PURL and trusted Auth redirects |
| T078 migrations/RLS/secrets | source 100/100 public RLS metadata | actual target config/secrets, migration/cutover rollback and private negative paths |
| T079 external providers | Inventory only | real partner evidence per provider, leave DUE if absent |
| T080 Android publishing & retry | Android workflow historical experience | Founder proof for final candidate on phone/tablet, no duplicate actions |
| T081 backup/deployment/cutover | actual offline DB+5 media successful | production version binding and safe write-aware rollback without overwrite |
| T082 multi-device real article | no new evidence collected | mobile production lifecycle + genuine public view/share and privacy check |
| T083 Topic-11 Ops/lock | project metadata only | operational runbook/dns ownership/evidence index/full old CI/Founder signoff |

## F. This PR's deliberately limited coding scope

- **NEW only** `ci/phase4/b11/t071-failure-isolation-contract.mjs` — 13-module independent fail-closed evidence gate, strict RPO/RTO provenance and repo static editorial-risk scanner.
- **NEW only** `ci/phase4/b11/t071-failure-isolation-contract.test.mjs` — adversarial preflight tests on original `main` static files; paper/synthetic boundary explicit.
- **NEW only** `.github/workflows/b11-t071-fault-matrix-preflight-NO-LIVE.yml` — PR-only checkout and no secret/live operation, with existing T070 fail-closed gate tests.
- **NEW only** this report. No production code, UI, active sessions, database tables, Edge deploy, Vercel deployment, GitHub main, Backblaze B2 or Cricket/Saarthi changes.

**Next real Go/No-Go:** Before fault injection, locate the actual integrated runtime code and isolate it. Public mock news/live risk must be reviewed by Founder before external site is exposed. No real product adapter faults have been run in this preflight, **T071 FINAL = HOLD**, **T070 FINAL E8 = HOLD**, Soft Launch release **NOT APPROVED**.
