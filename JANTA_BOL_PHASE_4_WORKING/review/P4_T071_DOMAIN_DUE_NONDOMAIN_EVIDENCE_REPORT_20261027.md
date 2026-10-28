# JANTA BOL — P4-T071 / Domain Deferred, Non-Domain Work Reconciled
**Date:** 27 Oct 2026 IST  
**Founder direction:** "Domain ka kaam due rakko — nya jantaboli.in add karenge. Baki kaam finish karo."  
**Explicit state:** **`jantaboli.in` custom-domain connection/DNS/SSL/routing = DUE, NOT STARTED, NOT ASSUMED OWNED OR ACTIVE.** The remaining unaccepted multi-module cross-domain failure tests are also tracked **DUE (Founder deferred)**. Domain registration/hostname is distinct from the *13 failure domains*; connecting `jantaboli.in` will not, by itself, prove all backend failures.

## What was genuinely completed without a custom domain
- **NEW official GitHub Actions `40506133975`**, job **`122195790701`**, head **`bc21412f03a99cd91cfd80e66284bd0d168f47db`**: **SUCCESS**.
- Two separately pinned **actual JANTA BOL source revisions** were checked out and executed in the runner, in a completely non-production/no-DNS workflow:
  1. Existing B8 source SHA `658f474d6ee0f24efac60f069979e8adee1e9221`: **31/31 selected source-level regression tests PASS**. Tested original B8 LIVE public-status/source enum guard, B7 public Ad analytics outage preserving original news, real renderer with mock dependency, B7 public-safe release worker, B8 Accountability stale-HIDE browser controller, and public projection allowlist contract. **JS stubs/source proof — NOT genuine LIVE encoder/server E2E or an actual production customer impression.**
  2. B9 Search, public-truth and **Founder-final sole tagline "जहाँ सच बोलता है"** SHA `b509c60fceb053a51686f67e587d4922a40fa6f4`: **19/19 source and VM negative tests PASS**. Exact Article+Ad+old protected root source safeguards in those tests; genuine B9 search RPC integration remains separately read-only verified, not full browser E2E.
- **Total newly executed selected no-domain regression cases: 50/50 PASS, 0 FAIL**. The tests are already-existing checks consolidated in this one freshly executed source checkout; **no new count inflation or release acceptance**.
- Earlier G2 evidence `40498177713` 80/80 PASS with fake dependency failures; actual PG17 isolated crash/restore `40501228346` PASS, local-only RPO point age 0.422s / RTO 1.261s, one post-checkpoint synthetic committed row lost; independent log review `40502445962` 21/21 PASS. Separate genuine B8 SQL accountability public-feed negative/peer recovery `40504645684` SUCCESS (one of 13 functional domains on throwaway PG17).
- Connected real Supabase, strictly READ ONLY, on 27 Oct: 15 nondeleted drafts and 16 nondeleted published Articles; `public_live_feed` has 7 rows with `OFF/STABLE`, **not evidence of LIVE streaming success**; role `anon` B9 `jb_b9_search('T032')` returned one public item; 100/100 public tables RLS enabled. This did not touch private user data, LIVE state, payment, writer or RLS grants.
- GitHub protected `main` commit remains `f447231c0677644ca5a44cc19f12cf0314ff38ea`; Vercel production READY `dpl_nFSo2MXg3ASBPgUfXRYDzv2ybP8C` linked to exactly same old SHA. No branch merge, production deployment, extra hosting, domain config change, login, Supabase write, backup key or device step.

## RPO/RTO targets and explicit no-fake-approval policy
- **Actual local disposable PostgreSQL17 drill measured:** checkpoint point-age 0.422 seconds, recovery to the same *disposable local DB endpoint* 1.261 seconds; one acknowledged synthetic post-backup Article intentionally and correctly detected lost.
- **Neither value is production RPO/RTO**, nor a practical guarantee for remote Supabase/Vercel/Auth/LIVE/B2/Edge.
- **Founder-approved maximum acceptable data-loss window (RPO target) = DUE**; **Founder-approved acceptable recovery time (RTO target) = DUE**. Setting them silently would violate Founder-only acceptance. They must be feasible under Free-tier backup/job frequency; do not infer achievable service levels from a local two-second test.
- Targets are recorded as **not established** rather than guessed, with Owner/Founder decision requested later in the domain/resumption window. Both target approval and measured real integrated acceptance stay due. No arbitrary quantitative budget is locked.

## Final evidence ledger & what is deferred vs unblocked
| Gate | Status | Why |
|---|---|---|
| Founder final branding in source and Article Search contracts | **PASS (source-only)** | 19/19 real reviewed candidate tests; final HEAD not yet released |
| News + simulated analytics/Ad fault + LIVE public-status regressions | **PASS (selected source-only)** | 31/31 actual existing tests |
| Real isolated B8 SQL Accountability Feed fault/peer unaffected | **PASS (scoped backend)** | `40504645684` source SQL evidence |
| G3 disposable PG17 crash & local metric integrity | **PASS (local-only)** | No live recovery guarantee |
| G4 independent G2/G3 scoped evidence reconciliation | **PASS (scoped)** | 21/21; full product not checked |
| New web hostname `jantaboli.in`, DNS, SSL, cross-host cookies/CORS/redirect/PURL | **DUE — FOUNDER-DEFERRED** | Do not configure, purchase or assume it is pointed at current Vercel |
| Remaining **12** domain families' *real integrated fault persistence/recovery E8* | **DUE — FOUNDER-DEFERRED** | Unrelated to hostname technically; not magically PASS on purchase |
| True user logged-out Article read + publishing E2E, active LIVE/encoder and Admin/Provider integration | **HOLD — no acceptable real end-to-end evidence** | Read-only public data confirms API pieces, not full lifecycle |
| Production RPO/RTO targets + real operational restoration proof | **DUE — Founder decision and evidence needed** | Local metric cannot stand in for production |
| **P4-T071 FINAL PASS + LOCK** | **HOLD — not approved or locked** | Master E8 and practical targets unresolved |
| **T070 full E8** | **HOLD** | Never upgraded by T071 |
| **Soft Launch** | **NO GO pending editorial safety and accurate public read** | 16 published Articles still include QA records, old static LIVE content remains on production |

## Safe next milestone (when Founder resumes domain + integrated E8)
1. At the time Founder actually provides/attaches `jantaboli.in`, independently confirm DNS ownership/control, certificate HTTPS, expected Vercel project binding, old Article permanent URLs, link routing, no mixed-content, session/cookie origin restrictions, Ads and LIVE links; **do not change automatically**.
2. Use the already-existing isolated SQL/source fixture (not production) for remaining real integrated module faults. Collect before/after SQL state, auth denial/audit, committed-message/payment ambiguity and genuine core Publishing+LIVE continuity evidence.
3. Agree *practical, measurable* maximum RPO and RTO with the Founder; use real eligible recovery runs on matching isolated integration rather than local 0.422/1.261 seconds.
4. Independent E8 reviews complete records. Only then consider T071 FULL PASS+LOCK; production editorial safety and public News readiness remain separate.

**Product constraint honored:** No rebuild, no fake PASS, no paid-domain connection, and do not damage old work. Technical no-domain tests completed **now**, but domain-related and full E8 acceptance legitimately DUE/HOLD.
