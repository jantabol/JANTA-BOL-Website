# JANTA BOL — P4-T036 / CP02 Owner emergency HIDE + same-open-page revocation + replay (16 Oct 2026)

**Official authority:** Founder-provided JANTA BOL B7 FINAL MASTER BLUEPRINT WITH TESTS, PDF p.26–27, ADS-019 and ADS-023 in T036 ADS-016..023, final E2+E5 (ADS019 explicit real Android E3). Founder soft-launch-first: CONTACT ONLY ads before real commercial onboarding.

**Status:** CP02 E1 local JS + **REAL disposable PostgreSQL 17** source/safety checks **PASS**. Official **ADS-019 + ADS-023 final DUE / P4-T036 final PASS+LOCK HOLD**. Nothing deployed to production, public website, database, Vercel or any Cricket resources.

## Tested source exact scope
- Working branch `review/t036-schedule-lifecycle-20261016` (PR #31 DRAFT, parent T035 review PR#30). Parent T035 SHA `277d2937071b9df65a4823e6671dc418ec21b941`; canonical B7 `bd03084b0e42f8d1a65c53a4a047f6c8686a51a8` unchanged.
- Existing `public-ads.js` pins one Article ad and never auto-replaces; existing `jb_ad_transition_internal` is the Owner/AAL2 change+history/audit authority. No new ad rotation, Article URL, permanent news modification, payments, approval, realtime subscriber or production SQL.
- FIRST DIVERGENCE ADS019: current open Article does not hear about `hidden` / `paused` / expired states after first fetch. A fresh `jb_ad_public_feed` would reselect a different creative, violating Founder lock. Therefore a specific same-`campaign_id`+`creative_id` boolean probe is necessary, with **no feed rotation and no personal data**, not a generic refetch.
- FIRST DIVERGENCE ADS023: legacy Owner status transition inserts new `ad_history` and `audit_logs` for every repeat, including same-state HIDE. Replays should have no second state event while retaining the original Owner audit. No positive LIVE status bypass.

## Minimal review-only proposal (NOT deployed)
1. `JANTA_BOL_PHASE_4_WORKING/db/20261016_b7_t036_revocation_replay_REVIEW_ONLY.sql`: new `jb_ad_visibility_alive_public(uuid,uuid)` only returns bool about exact currently shown pair, checks LIVE, not hidden, approved creative, paid/confirmed receipt, schedule and risk. Explicitly revokes default function EXECUTE, grants narrow bool probe to anon/authenticated; uses pinned catalog search_path/security definer ONLY to read the minimally permitted response, no raw rows or PII.
2. In SAME review SQL, `jb_ad_safety_transition_idempotent_internal(uuid,text,text)` is authenticated-EXECUTE-only and strictly requires `private.p4_owner_allowed()` before locking campaign row; accepts only `hidden/paused/expired/rejected/cancelled`, never `live/approved/payment_pending/paid`. Exact repeated status returns without second history/audit, actual first change delegates existing legacy Owner RPC under row lock. **Original emergency HIDE remains operational until paired release; do not silently change it.**
3. `b7-ad-revocation-bridge.js` optional, no current HTML references it. If and only if future vetted public LIVE release explicitly loads it, check the SAME card every 15 seconds. False, malformed payload or failed RPC removes only current ad (pause video first), stops timer, never auto-selects replacement and never touches Article body. Pagehide cleanup and overlapping polling guards. No geolocation or private userdata. 15-second **best-effort polling latency**, not instantaneous broadcast SLA and not yet hosted.
4. `public-ads.js` adds strictly optional `JBAdRevocation.watch` hook; when module isn't loaded, existing public source behavior is unchanged. `phase4-domain-client.js` adds optional Owner `adSafetyTransitionIdempotent` method, but Admin HTML does NOT call it until corresponding server RPC passes real E2/E5. Missing new RPC denies, never retries unsafe legacy path.
5. Test artifacts only: `ci/phase4/b7-t036-legacy-transition-fixture.sql` copies the reviewed legacy function into disposable DB (not a migration), `ci/phase4/b7-t036-revocation-replay-regression.sql`, `ci/phase4/b7-t036-cp02-bridge-regression.test.cjs`, and `.github/workflows/b7-t036-cp02-safety-bridge.yml`.

## Exact first RED -> RCA -> GREEN (no hidden failures)
- [Initial real Actions **#38903989256 — FAILURE**](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38903989256): JS harness syntax typo `Unexpected token '}'` and SQL test ambiguous unqualified `id` composite projection. Neither was a Production bug. FIRST DIVERGENCE inspected from actual CI logs; minimum changes limited to **test harness + SQL test assertion** (not weakening runtime gates).
- [Final Actions **#38904148468 — 2/2 jobs SUCCESS**](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38904148468):
  - **13/13 new bridge/Owner safety API tests**: legacy no module, TRUE unchanged, FALSE removes with no reselection, error/throw/null/untrusted results fail closed, wrong UUID rejected, pagehide, overlap prevention, video paused, nonOwner/positive state blocked, missing server RPC no fallback.
  - **6/6 previous T035 poster tests**, **76/76 protected client/Article/Analytics regressions**, **7/7 protected lifecycle client tests** = **102/102 JS tests PASS** (13+6+76+7). B7 closure checker sees 9 canonical / 60 ADS map and correctly leaves FINAL ZIP **BLOCKED**.
  - **Actual disposable PostgreSQL 17** applied existing original schedule/payment schema replica + reviewed exact legacy Owner transition, then NEW review-only SQL. Boolean probe rejected unpaid/future/expired/paused/wrong creative/unknown, accepted synthetic paid+active, then denied hidden. Owner first HIDE wrote exactly 1 ad_history and 1 audit; exact replay wrote **zero** new entries, unauthorized and LIVE promotion denied, **ROLLBACK**. No real payment/UTR/Owner session involved.
- Existing separate CP01 3-job schedule/lifecycle suite still running and retained unchanged on branch (revalidate latest before any PR merge).

## Mandatory REAL release gates retained
- New public bool function created in REVIEW-ONLY isolated SQL, **NOT deployed to live Supabase**.
- The optional browser module is **NOT included in HTML**, so currently **NO production website has open-page hide watcher**. ADS019 **NOT YET a real E2/E3**, and 15-second polling may need product approval for budget/availability; current status HOLD.
- The optional Owner idempotent RPC is **NOT deployed/wired to Admin UI**. ADS023 real hosted E2/E5/concurrent replay, delayed worker/cron failure, expiry audit and News isolation **NOT RUN**.
- A public SQL SECURITY DEFINER function must undergo separate API/permission/RLS/security advisor review and real anonymous negative testing before any paired production rollout. Exact return bool only; no private data by design but deployment risk must be assessed.
- Full PDF schedule ADS016..023 and first paid ad E2/E5/E3 remains DUE. **SOFT LAUNCH contact-only news never needs to turn on paid ad or this module.**
- Owner still must approve any production SQL/Vercel/domain cutover; never deploy on this CI PASS alone.

**NO REBUILD | NO PROD WRITES | NO NEW BILLED BRANCH | NO FAKE PASS**
