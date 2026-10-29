# JANTA BOL — P4-T036 CP04 Consolidated Founder Release Gate
**16 October 2026 · Final CP01–CP04 checkpoint · Official P4-T036 status: HOLD**

## Non-negotiable basis
- 37-page Founder B7 FINAL MASTER BLUEPRINT WITH TESTS; T036 comprises ADS-016…ADS-023, requires **real E2 backend + E5 permissions and RUN-06**. CP01–03 isolated PostgreSQL and JS successes **do NOT satisfy official FINAL PASS+LOCK**.
- Founder new execution priority: editorial NEWS + contact-only "विज्ञापन के लिए संपर्क करें" soft launch first. The first true paid advertisement is a separate controlled go-live requiring all original ad commercial tests **BEFORE LIVE**. This is a scheduling/prioritization decision only, **not permission to bypass any payment, safety, media or AAL2 guard**.
- No new paid Supabase project/branch, project changes, DNS/domain cutover, production SQL/media/cron deployments, advertiser/payment writes or hidden mock payments in production. Original B7 canonical branch and T035 parent are not merged.

## Exact 8-test disposition — screenshot-friendly
| # | Canonical | Already proven at exact scope | Still DUE for OFFICIAL T036 |
| --: | --- | --- | --- |
| 1 | ADS-016 — Future Start | Original live read-only SQL `starts_at <= now()` for NEW feed requests; reviewed schedule guard isolated tests PASS | Real owner-approved scheduled ad, live E2 before/after opening and E5 |
| 2 | ADS-017 — Expiry | CP03 actual disposable PG17 bounded worker, expired status+durable history/audit, failure rollback/retry and replay PASS | Paired/installed worker, real elapsed-time, outage alert/retention and hosted E2/E5 |
| 3 | ADS-018 — Pause/Resume | CP01 original reviewed lifecycle/finance fixtures tested in actual disposable PG17 | Genuine host Owner AAL2 pause/resume and backend receipt/safe re-eligibility E2/E5 |
| 4 | ADS-019 — Emergency HIDE while Article remains open | CP02 existing Article one pinned ad + optional same-creative bool probe and 15-second fail-closed polling. Synthetic JS13/13 + actual PG17 tests PASS | Review safe public bool-RPC grants, deploy exact paired backend+frontend, real Owner HIDE and Founder Android E3 open-page without replacement; E2/E5 |
| 5 | ADS-020 — Financial/creative/history preserved on HIDE | Existing append-only history/audit source + CP02 HIDE isolated ledger checks PASS | Actual financial record/asset immutable evidence E2/E5 |
| 6 | ADS-021 — Retention-safe Permanent DELETE | Live table direct-delete grants denied anon/authenticated; B7 separate retention candidate tests present | Defined Owner legal-hold/preservation policy, real AAL2 positive/negative flows E2/E5; NEVER casually physical-delete history |
| 7 | ADS-022 — Invalid Schedule / India Time | Existing local client IST→UTC + negative date; isolated PG17 review-only `b7_schedule_window_guard` PASS | Reviewed guard not deployed live; E2 E5 Owner real past/future/half-window/date, sold-window immutability |
| 8 | ADS-023 — Failure Recovery / Replay | CP02 idempotent Owner SAFETY HIDE + CP03 atomic expiry worker retry after injected history outage and no duplicate audit, actual isolated PG17 PASS | Genuine hosted concurrent retries, delayed/missed cron, no second LIVE ad, News independence E2/E5 |

## Published evidence / exact versions
1. CP01 source+live-read-only audit `T036_CP01_SCHEDULE_LIFECYCLE_LIVE_AUDIT_20261016.md`; latest protected workflow [#38905796713](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38905796713) **SUCCESS**.
2. CP02 emergency HIDE/replay review-only evidence `T036_CP02_EMERGENCY_HIDE_REPLAY_20261016.md`; latest protected [#38905796931](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38905796931) **SUCCESS**, 13/13 new DOM/Owner tests + preserved old client/media suites and actual PG17.
3. CP03 expiry failure recovery `T036_CP03_EXPIRY_RETRY_20261016.md`; latest protected [#38905796767](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38905796767) **SUCCESS**, actual PG17 batch=1, 0/51 rejected, service_role-only, history+audit append, replay exact-once, injection rollback/recovery; 76/76 client + 7/7 lifecycle.
4. Branch `review/t036-schedule-lifecycle-20261016`, PR #31 DRAFT based on PR #30 DRAFT (not main). Production/DNS deploy **NOT PERFORMED**.
5. Both CP02 (same-card revocation) and CP03 (expiry worker) SQL are `REVIEW_ONLY`. CP02 browser `b7-ad-revocation-bridge.js` remains **not referenced by live HTML**. **No actual ad expiry cron was installed.** Neither E3 live paid ad nor E5 hosted Owner session performed.

## Soft-launch vs. commercial activate split
**Contact-only / newsroom soft-launch:** T036 code handles advertisement lifecycle and expiry *only when paid campaigns actually exist*. Currently the prior audited production dataset has **0 LIVE ads and 0 payments**. This T036 consolidation does not establish a new T036-specific contact-only blocker, provided no paid/approved ad is activated. That is a **limited planning judgment**, not a general release approval. The official DOMAIN root still serves a different legacy landing page, and editorial/public/RLS security smoke, corrections, Founder publish-only and Android E3 must pass independent Phase4/domain cutover gates before public soft launch.

**Before FIRST paid-ad LIVE: HARD STOP unless approved release gate**
- No paid campaign activation until real advertiser identity/consent/payment, terms, verified first-party media/receipt/codec/15-second bound, Article verified LGD scope (Gwalior/Pichhore), accessible `विज्ञापन` label, no crop, pinned one-ad policy, Owner AAL2 + verified hosted E2/E3/E5.
- Deploy schedule guard, expiry worker + cron, idempotent safety RPC, HIDE open-page watcher **as a paired source-reviewed bounded release**, prove there are no extra paid-ad API grants, cron can fail/retry, audit ledger persists and can be restored; fresh deployment SHA and Android proof before approval.
- Conduct official ADS016–023 and RUN-06 with actual evidence, mark official PASS only after every acceptance clause is verified. Commercial status remains IN PROGRESS rather than final PASS+LOCK.
- Protect existing T034 and T035 deferred first-paid-ad backlog; never imply isolated PG tests replace external receipts or real Founder E3.

## Final status
**T036 CP01–CP04 scoped engineering/reconciliation COMPLETE; OFFICIAL P4-T036 0/8 FINAL PASS+LOCK, HOLD.**
**NEXT:** proceed to next Phase4 soft-launch-critical Test Block with no duplicate T036 synthetic tests. Domain/social/soft launch only after respective product go-live reviews.
**Founder manual step now: NONE.**

NO REBUILD · NO FAKE PASS · NEWS FIRST · FIRST REAL AD HARD-GATED
