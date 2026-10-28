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
- **New independently verified Vercel production source binding:** Vercel project `shubham-pichhore-2028`, `prj_xNb9G3xjW35qSXEyF7o2qiCqG4HI` has a READY **production-target** deployment `dpl_nFSo2MXg3ASBPgUfXRYDzv2ybP8C` at Git repo `jantabol/JANTA-BOL-Website`, branch `main`, SHA `f447231c0677644ca5a44cc19f12cf0314ff38ea` (EXACT GitHub main match), plus three aliases including `shubham-pichhore-2028.vercel.app`. Branch PREVIEW deployments have target `null`, and must not be mistaken for production. **However, the actual served HTTP HTML was NOT retrieved/verified** (public HTTP requests unavailable in this runtime), and Public/Admin/Auth route behavior remains UNVERIFIED. This is source-binding proof, not public page-content or editorial release approval.
- Live JANTA BOL Supabase prior read-only inventory was `ACTIVE_HEALTHY`, 100/100 public RLS enabled, 13 currently active Edge functions; that proves backend existence/inventory, not end-to-end Android Publishing or API source integration.

**Highest-value soft-launch task found:** independently establish which deployed public domain + Admin route map to which source commit and Supabase project; on the selected actual production candidate ensure **editorially verified real news only**, remove/disable static/mock allegations and false LIVE signals before public visibility. This is a **readiness finding**, not approval to deploy, overwrite old site, mutate news content or bypass Founder Publish authority.

## E. Parallel production readiness T076–T083 (discovery only, NO premature start of their final tests)

| Test | Verified evidence available now | Missing before PASS |
|---|---|---|
| T076 domain/hosting/HTTPS | **Real Vercel production target/branch/Git SHA and aliases VERIFIED** | actual HTTP GET + TLS certificate, Public/Admin/Auth routes and content review (NOT DONE) |
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

## G. Fresh source-binding discovery / highest priority launch STOP (read-only)

The prior missing Git⇄Vercel deployment mapping is now **CLOSED with real Vercel metadata**, not just speculation:
- Production deployment `dpl_nFSo2MXg3ASBPgUfXRYDzv2ybP8C` reports `target=production`, `state=READY`, origin `jantabol/JANTA-BOL-Website`, branch `main`, immutable Git SHA `f447231c0677644ca5a44cc19f12cf0314ff38ea`. This exactly matches the GitHub main at observation. Three attached aliases include `shubham-pichhore-2028.vercel.app`.
- Vercel has separate PR preview deployments with `target=null`. Latest project deployment alone must never be called “production”; the production-target query above provided the correct candidate.
- A production deployment **built from source containing hard-coded, apparently unverified news claims and static LIVE decorations** is an urgent Founder editorial-review issue. The source is linked, but because no live public HTTP response could be obtained the site **as actually served** is NOT independently verified. Do not claim the allegations are live merely from the repo or assume they are false/true. They require editorial evidence before publication.
- No release, domain update, rollback, source overwrite, toggle, repository merge or actual fault injection occurred. Evidence is stored in `ci/phase4/b11/t071-vercel-production-git-source-observed-20261027.json` and three new negative-contract tests. The production project may be reachable to viewers; an authenticated Founder Android visual check is the minimum external confirmation if automated HTTP remains unavailable.

**Practical Soft Launch sequence:** 1. Verify served public and Admin site using Founder phone with no account changes; 2. identify whether static sample allegations and red LIVE indicator are visible; 3. keep unverified placeholders out of any public release via reviewed minimal update and affected security regression (Founder-only release), 4. then verify actual article publishing lifecycle and module fault isolation on isolated clone. Soft Launch remains **NO GO** until material editorial/security blockers clear.

## H. Executed *actual integrated B8 source* with controlled isolated fault injection — targeted E1+E2 (not hosted recovery)

The originally inspected GitHub `main` did not contain the active B8 integration code, so the test now checks out one **exact historic candidate SHA** `658f474d6ee0f24efac60f069979e8adee1e9221` (`review/b8-softlaunch-factual-public-20261022`) *as a second read-only source checkout* in GitHub CI, asserts `git rev-parse HEAD` equals that SHA and actually executes its unchanged business/frontend JavaScript in a disposable Node VM with injected dependency failures. We intentionally do **not** merge/deploy that nested branch, and do not supply Supabase/Vercel keys to the test.

**Real GitHub proof:** Run `40489211650`, exact PR candidate SHA `7efe96d1be2833ef4bbde116b09f6bdc932a7b76`, successful workflow `B11 T071 RPO-RTO and Failure Matrix PRE-FLIGHT (NO LIVE)`, job `122138605604`, independently inspected log:

| Executed group | Real code that actually ran | Tests |
|---|---|---:|
| B8 published-news/LIVE actual frontend: feed down, LIVE down, independent article rendering, no false breaking/splash/news | `JANTA_BOL_PHASE_3C_WORKING/website-v3.js` from pinned integration candidate, VM controlled fault inputs | **6/6 PASS** |
| Actual integrated Owner/Ads/Notifications/Grievance/Compliance domain client: unexpected RPC errors, failure result, payment no false confirmation or auto scheduling, notification retry failure no fake success, lower authority denial and legacy payment hard-block | `JANTA_BOL_PHASE_3C_WORKING/phase4-domain-client.js` from pinned candidate, VM controlled fault inputs | **10/10 PASS** |
| Existing integrated B7 analytics-failure/Ad feed regression, manual-payment source and B8 accountability HIDE stale-response race | Existing `ci/phase4/b7-t040-cp02-analytics-failure-isolation.test.cjs`, `ci/phase4/b7-t038-cp01-manual-payment-source.test.cjs`, `ci/phase4/b8-g4-cp04-public-browser-lifecycle.test.mjs` from same pinned candidate | **11/11 PASS** |
| Main Branch T071 RPO/RTO/13-matrix, Vercel production-binding and T070 E8 prior fail-closed preflight | Existing PR #45 preflight test sources | **39/39 PASS** |
| **Total reported by GitHub CI** | Source-based/isolated/synthetic E1+targeted E2, NOT hosted E8 | **66/66 PASS; 0 FAIL** |

**Scope reconciliation:** Within these checks, real B8 frontend survives Live-provider outage when the news feed is healthy; when the news DB feed fails it shows a clean `server unavailable` message rather than static articles or fake breaking. Analytics throw/reject and ad feed outage do not remove the article. Actual Ads Owner RPC errors do not report a confirmed payment, launch an ad schedule or issue legacy unauthorized confirmation. Notification-failure audit queue must propagate RPC failure rather than falsely return an empty queue. Grievance/Compliance RPC client returns rejection when the server fails; **this does not demonstrate real server authorization or audit persistence**. B8 stale case-response regression ensures outdated approved data does not resurrect a hidden case in controlled test.

**Honest T071 classification:** Some fault scenarios are now *source-level actual code executed with synthetic failures* (E1 + isolated E2 selected domains), **not** `real_product_adapter_tested` end-to-end for all 13, not restored external providers, not genuine database partitions, not Android proof E3, and not independent E8 acceptance. RPO/RTO are still **NOT ESTABLISHED** (no actual downtime recovery or Founder-approved targets). Thus **T071 FINAL PASS+LOCK = HOLD**, **T070 full E8 = HOLD** and **Soft Launch release = NOT APPROVED**. The old main production source remains untouched.

**New soft-launch dependency exposed and explicitly not bypassed:** PR #36 contains a candidate homepage that suppresses hardcoded mock public claims and uses only server-published news, but its base is a **separate integrated B8 branch**; source tests passing does **not** automatically release it, and public production still maps to old `main`. It needs a separate Founder-approved integration/cutover after independent served-content and Android tests, with no duplicate article/PURL migration.
