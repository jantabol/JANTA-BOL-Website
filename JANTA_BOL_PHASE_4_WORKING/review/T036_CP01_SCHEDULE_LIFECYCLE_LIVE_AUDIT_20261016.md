# JANTA BOL — P4-T036 / CP01 schedule + lifecycle + time / real authority audit
**Evidence date:** 16 October 2026 (IST)  
**Founder scope:** Finish essential Phase-4 News/contact-only safely → domain/social → soft launch. Real receipt/first paid advertisement is deferred until post-soft-launch **but must pass full guards before the first LIVE paid ad**.
**Canonical SOT:** Founder-supplied 37-page B7 Final Master Blueprint with Tests, PDF pages 25–27: P4-T036 = **ADS-016..023**, required E2+E5, RUN-06. Planning PDF says NOT RUN at design baseline, superseded by actual CI/source evidence below only at claimed scope.
**Verdict:** T036 CP01 source/audit and **3-job disposable CI PASS**; T036 FULL E2/E5 / RUN-06 PASS+LOCK **HOLD**.

## Source, branch, discipline
- JANTA BOL repository `jantabol/JANTA-BOL-Website`; child review branch `review/t036-schedule-lifecycle-20261016` forks **exact existing T035 draft review SHA `277d2937071b9df65a4823e6671dc418ec21b941`**. T035 PR #30 remains DRAFT and unchanged during initial CP01. The original canonical B7 branch remains `bd03084b0e42f8d1a65c53a4a047f6c8686a51a8`, unchanged.
- Reused existing verified source, **NO REBUILD**: `phase4-domain-client.js`, `public-ads.js`, `20261012_b7_lifecycle_state_guard_REVIEW_ONLY.sql`, `20261012_b7_schedule_integrity_REVIEW_ONLY.sql`, original SQL fixtures/regressions, canonical B7 60 ADS closure register.
- New files only: `ci/phase4/b7-t036-source-contract.cjs` and `.github/workflows/b7-t036-cp01-disposable-regression.yml`.
- No paid Supabase branch, third project, real Owner JWT, company operations, scheduler mutation, production SQL, LIVE campaign, real payment, newsroom or Cricket project changes.

## Green isolated CI (REAL executed, not mocked Postgres)
[**GitHub Actions #38902102715 — SUCCESS**](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38902102715) three completed successful jobs:
1. **Source/client governance** checks original official 8 ADS mapping, client server-capability gate for `approved/payment_pending/live`, pinned Article no automatic ad replacement, review-only Owner schedule/lifecycle guard source, DUE final status. Re-ran related unchanged regression suites **7/7 lifecycle-client**, **76/76 combined client/Article/time** plus B7 9 canonical/60 ADS coverage audit; release remains correctly **BLOCKED**.
2. **Actual isolated PostgreSQL 17 lifecycle:** Existing original payment fixture + review-only payment/lifecycle guards. Actual invalid transitions denied, Owner/high-risk/no verified creative/forged paid receipts blocked, synthetic verified Owner+receipt positive lifecycle, pause→resume→emergency hide, expiry and rollback **PASS**. Test: `ci/phase4/b7-lifecycle-state-regression.sql`; no production campaign touched.
3. **Actual isolated PostgreSQL 17 schedule:** Existing legacy source fixture + same guard + review-only Owner schedule integrity trigger, tested illegal partial/backward/past windows, anonymous DML, Owner future positive, audit append, identical retry no duplicate schedule-change audit, paid/hidden windows immutable, failure ROLLBACK **PASS**. Test: `ci/phase4/b7-schedule-integrity-regression.sql`.
- These real ephemeral PostgreSQL tests use **synthetic finance receipts**; no claim of actual E2 hosted Supabase Owner session or E5 permission proof.

## Actual LIVE Supabase READ ONLY, before/after
JANTA BOL production ref `vrffsnkycvjithwtiylt` only. Queries inspect `pg_proc`, `pg_trigger`, `pg_class`, ad status aggregate, cron jobname inventory. No mutation.
- Advertisers **7**, Campaigns **7**, History **29**, Payment rows **0**, LIVE **0**; campaign statuses `requested=4, review=1, payment_pending=2`.
- `jb_ad_public_feed(text,text)` requires `c.status='live'`, `starts_at<=now()`, `ends_at>now()`, Owner approval, confirmed payment and other guards. Therefore time-filter exists at server source for **fresh feed requests**, but no real future/expired paid campaign can be sampled today. **ADS016+ADS017 not finalized.**
- Existing Owner `jb_ad_schedule_internal(uuid,timestamptz,timestamptz)` checks AAL2 `private.p4_owner_allowed()`, rejects null/end<=start. **It does NOT reject a start in the past and does not check paid/hidden immutability itself.** The stronger `private.b7_schedule_window_guard` is only a review-only PostgreSQL candidate; **not installed on LIVE**.
- Existing Owner `jb_ad_transition_internal(uuid,text,text)` checks Owner AAL2, accepts specified state set and requires confirmed payment before LIVE, inserts both `ad_history` and `audit_logs`. Current frontend intentionally blocks positive promotions without `jb_ad_lifecycle_capability_internal()`; this capability **not deployed**; existing production active T034 payment guards are present. But existing production lifecycle still does **not implement** the complete review-only positive state/terms/media/schedule invariants for protected LIVE. Do not assume good CI means live guards installed.
- LIVE enabled triggers: `ad_campaigns.b7_t034_paid_state_verified_gate`, `ad_payments.b7_t034_payment_verified_gate`, `ad_payments.p4_ad_guard_confirmed_payment`. No live `b7_schedule_window_guard` or `b7_verified_state_guard` identified.
- ad_campaigns/ad_creatives/ad_history/ad_payments each RLS-enabled and `anon`/ `authenticated` both have **DELETE grant false**; no authorized retention-aware Owner permanent-delete RPC found in named checked source. This is a safe **deny** condition for lower users, **NOT an end-to-end Owner lawful deletion PASS**.
- Actual live project has `cron.job`; jobnames scoped for '%ad%'/'%campaign%' showed only unrelated compliance-deadline service and **no identifiable advertisement-expiry job**. A future expiry must be matched with an audited state transition and failure/retry in ADS017/023, not merely invisible public feed.

## First divergences and eight honest statuses
| Canonical test | Known scoped evidence | Full proof still required |
| --- | --- | --- |
| **ADS-016 Future start denied** | Live read-only public RPC contains `starts_at<=now()`; CI future window guard PASS | Controlled real paid/scheduled positive E2, before/after feed evidence. **DUE** |
| **ADS-017 Expiry + audit** | Live feed has `ends_at>now()` for new selection | Worker delayed expiry/transition/audit positive/negative E2/E5. No verified deployed ad-expiry worker. **DUE** |
| **ADS-018 Pause/resume** | Real isolated PG17 synthetic receipt pause/resume + denial guards PASS | Real hosted Owner+AAL2 transition and resume-check E2/E5. **DUE** |
| **ADS-019 Emergency HIDE while-open** | Owner HIDE/PAUSE legacy paths exist; frontend pins Article selection | **FIRST DIVERGENCE:** no verified server-to-open-article revocation delivery: existing JS keeps already mounted ad until page close/re-render; deleting/newly choosing second ad would violate founder lock. Full E2+real Android E3+E5 **DUE**. |
| **ADS-020 Retain history after hide** | Isolated PG17 HIDE positive PASS; Owner transition source appends immutable ad_history/audit | Real finance/creative/commercial record integrity after HIDE in E2/E5. **DUE** |
| **ADS-021 Permanent DELETE authority** | LIVE RLS/grants deny `anon` & `authenticated` direct table DELETE | Explicit Owner retention-aware deletion flow & holds, real nonOwner/AAL1 tests E2/E5. **DUE** |
| **ADS-022 Invalid schedule/clock** | Existing local client has timezone+bad date tests; PG17 review-only source denies past, half-window, reverse, paid changes | LIVE original Owner schedule RPC does **not reject past start**; review-only guard not live. Server truth DST/UTC/IST E2 **DUE**. |
| **ADS-023 Failure isolation/replay** | Existing PostgreSQL rollback and repeat identical schedule avoids duplicate changed-window audit | Actual delayed cron/retries/worker outage, genuine idempotent state, no duplicate LIVE or News interference E2+E5 **DUE**. Existing Owner legacy transition may insert repeated audit/history for repeated same status; needs independent replay RCA before altering production. |

## Launch decision and hard blockers
- Contact-only news soft launch requires **NO paid LIVE advertisement**. Its deadline/domain/news regression gate is independent from the missing commercial expiry/paid schedule system. This audit did not perform a real advertiser run or release any ad.
- **BEFORE FIRST PAID LIVE:** deploy/pair versioned, reviewed schedule/state guards, real host signed Owner E5, safe video/image media server E2, verified Article geo E2, emergency open-page revocation without replacement, replay/worker resilience, retention-aware delete policy and E2/E5 RUN-06. No fake commercial test pass.
- No manual Founder step for CP01. Next CP02: identify minimum compatible treatment of *ADS019 live viewer revocation* and *ADS023 replay* without violating current one Article=one pinned ad / no change while open except revocation, then review-only CI. Domain/social/editorial soft-launch may proceed separately under their own approval.

**P4-T036 CP01 Source+Disposable PG17 = PASS; P4-T036 FULL 8/8 = NOT PASS; NO BACKEND/NEWS PRODUCTION CHANGES.**
