# JANTA BOL — PHASE 4 / B7 — P4-T036 CP03 EXPIRY & FAILURE RECOVERY
**Evidence date:** 16 October 2026 (IST)
**Source of truth:** Founder B7 Final Master Blueprint with Tests (37 pages), P4-T036 ADS-016…ADS-023, E2 + E5 and RUN-06.
**Founder lock:** Prioritize NEWS/contact-only soft launch. Genuine paid advertising requires all previously deferred media/geo/payment/schedule/authorization tests *before FIRST paid ad LIVE*. Do NOT fabricate a final T036 PASS.

## CHECKPOINT VERDICT
**CP03 = REAL disposable PostgreSQL17 expiry/failure-recovery and existing client CI PASS**.
**P4-T036 CANONICAL ADS-016..023 = DUE, E2 hosted and E5 real principal evidence DUE, T036 FINAL PASS+LOCK = HOLD**.
No Supabase project/branch upgrade, production migration, cron registration, advertisement activation, media file upload or real UTR, no GitHub merge, no Cricket project changes.

## Current exact authority and unchanged baseline
- Repo `jantabol/JANTA-BOL-Website`; review branch `review/t036-schedule-lifecycle-20261016` (PR #31 DRAFT based on PR #30 review branch, not `main`).
- Original B7 baseline `codex/b7-t034-safe-guard-20261013` SHA `bd03084b0e42f8d1a65c53a4a047f6c8686a51a8`, unchanged at the previous checkpoint; reverify before any future merge.
- Reused existing `ci/phase4/b7-payment-fixture.sql`, Phase4 `TEST-REGISTER.md`, 76-client regression, 7-lifecycle regression, 9 official test/60 ADS evidence closure audit. No change to `article.html`, `index.html`, `ads.html`, News publish or existing LIVE advertisement SQL.
- CP01 already identified FIRST DIVERGENCE: public feed's `ends_at>now()` prevents NEW post-expiry feed selection but no approved, deployed ad-expiry cron/worker changed Campaign state to `expired` with durable history/audit; a temporary worker outage/retry must not cause duplicate financial/News changes.
- CP02 independently built isolated same-card emergency revocation and Owner safety replay guards; not live.

## Minimum safe new candidate (REVIEW ONLY, no public endpoint)
`JANTA_BOL_PHASE_4_WORKING/db/20261016_b7_t036_expiry_replay_REVIEW_ONLY.sql`:
- Privileged private function `private.b7_ad_expire_due_core(p_limit integer=50)`; execute granted **service_role ONLY**, removed from anon/authenticated/Public. No caller-provided dates or Owner account impersonation.
- Uses trustworthy PostgreSQL **`clock_timestamp()`**. Lock eligible rows with `FOR UPDATE SKIP LOCKED`, bounded max 50, only Campaigns `status IN ('live','paused')` whose `ends_at<=clock_timestamp()`, preserves prior HIDDEN, rejected, review and future pending campaigns.
- Updates ONLY status to `expired` and `updated_at`; writes **one matching original `ad_history` and original `audit_logs` row** with SYSTEM actor NULL and nonpersonal expiration cause. No delete, payment mutation, approved media change, Article change, new URL or ad rotation.
- Single SQL invocation/transaction: an audit/history failure aborts the worker's state change atomically. Next authorized invocation can retry once. Already expired rows never counted again. **No `cron.schedule` is installed**; paid-ad operational scheduling and backup/runbook still require Founder signoff.
- Legacy Owner transition and existing real payment/verification triggers unmodified; no new bypass or positive LIVE action. This SQL is a REVIEW-ONLY *candidate*, not guaranteed production-compatible until source parity, real MFA, RLS/SQL function exposure and official release tests.

## REAL automated proof (not fake live Supabase)
[GitHub Actions **#38905494977 — SUCCESS**](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38905494977) 2/2 jobs:
1. Source + protected client governance **SUCCESS**: canonical eight ADS016..023 still DUE; no cron/live launch, no anonymous service grant or News/financial source mutation; **76/76 previous client**, **7/7 previous lifecycle**, B7 9 canonical/60 ADS closure audit SUCCESS but release correctly BLOCKED.
2. Actual isolated **PostgreSQL 17** applying the real REVIEW-ONLY SQL in a synthetic standalone schema, with transaction ROLLBACK. Validated:
   - anonymous/authenticated cannot execute; service_role can execute; invalid batches `0, -1, 51` denied.
   - synthetic active LIVE expired on 1-row batch, one ad history + one audit, every original payment/terms/start-end field preserved.
   - PAUSED expired on next batch; HIDDEN/REVIEW/FUTURE rows untouched.
   - repeat call returns zero, no duplicate state/history/audit.
   - **Injected ledger INSERT exception** during expiry proves status/history/audit rolled back together, and next run succeeded exactly once when injection disabled.
   - Final `ROLLBACK` for all fixture data; zero production changes.

## All 8 original Tests: remaining *real* release evidence
| ADS | Meaning / CP03 contribution | Canonical release |
| --- | --- | --- |
| 016 | Future ads not prematurely visible: existing live public feed has time gate; E1/isolated evidence | E2 positive real paid scheduled ad HOLD |
| 017 | Expiry: CP03 real PG SQL updates state + durable audit and safely retries outage; **cron NOT deployed** | E2 real timed positive and delayed expiry/audit E5 HOLD |
| 018 | Owner pause/resume isolated PostgreSQL lifecycle PASS CP01 | E2 real Owner+AAL2 held pending |
| 019 | Already-open Article emergency HIDE CP02 opt-in revocation bridge not wired | E2+real Android E3+Owner E5 HOLD |
| 020 | History after hide original audit/ledger preserved in isolated source | Real paid Owner E2/E5 HOLD |
| 021 | DELETE: currently direct grants deny anon/auth; separate retention/hold policy not executed here | Owner lawful permanent delete/full negative E2/E5 HOLD |
| 022 | Wrong time/negative durations: existing review-only schedule trigger and client tests PASS; live Owner RPC past-window protection not upgraded | Hosted Owner E2/E5 and production official timezone proof HOLD |
| 023 | CP02 safe replay and CP03 injected expiry outage atomic rollback+retry PASS in isolated DB | Actual production worker failure/restart/replay and no interference News E2/E5 HOLD |

## Next engineering checkpoint / launch priority
- Candidate source reviewed; do NOT run genuine paid campaign, ad payment, change current ads or public homepage for testing.
- Before FIRST paid ad LIVE, require reliable DB/cron authority, exact deployed Owner service identity/AAL2, schedule/expiry worker health alert & replay, emergency viewer HIDE, first-party uploaded media safety, Article verified LGD, real payment and Android public positive E3. Confirm technical capacity/cron and audit retention, avoid paid branches until authorized.
- News-only CONTACT-ONLY soft launch must separately pass DOMAIN root route mapping (known legacy index root), newsroom regression and Founder last-mile verification. T036 full commercial release can remain DUE without silently declaring advertising production-ready.
- Founder **NO MANUAL STEP** for CP03. Next CP04 should consolidate all T036 launch/first-paid gating into one decision-ready remaining register then move to other Phase4 blocks under founder prioritization, rather than repeating synthetic checks.

**NO REBUILD • NO PROD WRITES • NO OLD PASS REPEAT • NO FAKE PASS**
