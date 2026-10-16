# P4-T034 — E5 Permission Evidence Reconciliation / STOP Gate
Date: 2026-10-16 IST | Source: `jantabol/JANTA-BOL-Website`
Base B7 branch: `codex/b7-t034-safe-guard-20261013`
Exact audited head: `bd03084b0e42f8d1a65c53a4a047f6c8686a51a8`
**Verdict: T034 FINAL PASS + LOCK = HOLD.** This document is READ-ONLY audit evidence, NOT an E5 JWT role-test PASS.

## What was independently checked today
1. GitHub PR #28 is MERGED to B7. Its WhatsApp HTML validation + fake tests do not modify owner authority or backend schema. B7 branch head resolves to the exact SHA above.
2. At that SHA, push Actions #38882128656 (ADS001 Chromium 360), #38882128648 (B7 isolated security), #38882128727 (synthetic encrypted backup/restore) each conclude SUCCESS. **Chromium 360 is not Android E3.** Synthetic backup CI must not replace prior real database restore.
3. Vercel deployment `dpl_EKBDAhyAt6cWm6FHuSQ2v9C5LJPS` is `READY`, target `null` (preview), GitHub ref matches exact B7 SHA. URL: `https://shubham-pichhore-2028-17iojou6h-shubhamshrivastava295-9848.vercel.app`. Source/deploy metadata binding proven; public route availability and real Android behavior at this new preview **not independently tested**.
4. Actual JANTA BOL Supabase project `vrffsnkycvjithwtiylt`, READ-ONLY Postgres catalogs:
   - Migration `20261015181131` present (`p4_t034_ads008_verified_payment_and_paid_state_guard_20261015`).
   - Both T034 guard triggers **enabled**: `b7_t034_payment_verified_gate` on `ad_payments` and `b7_t034_paid_state_verified_gate` on `ad_campaigns`; old `p4_ad_guard_confirmed_payment` remains enabled.
   - Three private `b7_t034_*` security-definer functions: EXECUTE denied to `anon`, `authenticated` and `PUBLIC` (catalog permission precheck).
   - All five ad private tables `advertisers`, `ad_campaigns`, `ad_history`, `ad_creatives`, `ad_payments`: RLS enabled; `anon` lacks direct SELECT/INSERT/UPDATE. `authenticated` has SELECT grants on four except payments, but `ad_staff_*` policies further filter using `private.p4_staff_allowed()`. **Grant alone is not row access or JWT proof.**
   - Protected Owner public RPCs are SECURITY DEFINER, with `authenticated` EXECUTE and no `anon` EXECUTE; live definitions inspect `private.p4_owner_allowed()`. **Live runtime with actual JWT still DUE.**
   - Aggregate only: advertisers 7, campaigns 7, ad history 29, payments 0, LIVE campaigns 0. No campaign/payment/write action performed by this audit.
   - Principal inventory **counts only**: 1 Owner, 1 Editor, 2 Reporters (active), **0 `advertiser_users` linked to Auth users**. Reporter account records existing does NOT establish a currently usable JWT. No genuine advertiser JWT principal currently represented by a linked record. Revoked Owner test identity/status not established.
5. Prior **real** Founder evidence preserved (not repeated): ADS001 published Article CTA and origin+ID URL; ADS002 invalid-number/no-consent Android blocks; ADS006/E7 Owner review queue and backend history; ADS009 logged-out Incognito login screen. Earlier real encrypted B2 → isolated PG17 full DB restore #38778388127 (26/26 + 16/16) scoped PASS. ADS008 production postdeploy 12/12 catalog checks are preserved; today's checks reconfirm presence/permissions but do **not** replace them.

## ADS001–ADS009 reconciliation (do not inflate status)
| Gate | Already evidenced (do not rerun) | Actual remaining proof |
| --- | --- | --- |
| ADS001 | Android published Article CTA/origin/ID; Chromium 360 CI | Deployed exact-head Android 360px homepage + article behavior and live backend receipt-link consistency where required |
| ADS002 | Android 5-digit/invalid-prefix/no-consent negatives; SQL 7 negative/3 positive fixture; merged B7 UI | Genuine deployed backend negative and accepted positive receipt/normalization under controlled test, no new production dummy contact |
| ADS003 | Disposable forged geo/media args reject | Actual deployed public RPC negative + no unauthorized controls and immutable state proof |
| ADS004 | Existing Android pending/request+Owner review evidence | Reconcile one exact valid receipt to pending row and history; real permission boundary |
| ADS005 | Isolated two-client concurrency, cooldown, oversized input | Controlled real HTTP/rate-limit abuse proof, without duplicate production requests |
| ADS006 | E7 Android queue, review state and matching history | Exact current preview version/filter visual validation only, unless it is separately required by T034 |
| ADS007 | Synthetic Owner verification, real E7 review (not verification) | **Genuine Owner AAL2 normal verification JWT/action/audit** in safe staging |
| ADS008 | Prod migration and 12/12 postcheck; isolated guard matrix | Genuine JWT negatives on both old RPCs and direct paid-state routes; staged safe-positive only |
| ADS009 | Logged-out Android login gate; current real ACL/RLS precheck | Actual anonymous REST denial + reporter, advertiser, revoked principal, Owner AAL1 denied and Owner AAL2 permitted **with real auth sessions/JWT**; audit before/after |

## Next E5 execution gates — no fabricated identities
1. **Run genuine anonymous GET/HEAD REST API negative (NO mutation)** with public client and no user JWT on reviewed deployment, record endpoint/method/HTTP status/body shape (no contacts/tokens), counts before/after; logged-out UI test was already done and is not repeated.
2. Real reporter principal exists in team records but must be a **genuinely authenticated reporter session**. Use isolated safe test client, prove private ad rows/Owner RPC denied and state+audit unchanged. No credentials/token/screenshots in chat.
3. An advertiser Auth-linked account is **not present**. Do not fabricate JWT or silently link a production advertiser: Founder-approved isolated staging identity/fixture is required to test that persona.
4. Genuine revoked-before/after token and Owner AAL1→AAL2 matrices require controlled non-production accounts, actual Auth session revocation and safe fixture. **Never revoke real Founder to get a PASS.** Avoid production payment/verification positive writes merely for testing.
5. After E5 proof, finish only outstanding Android E3/HTTP E2 rows and run affected Phase3/B7 regression. Record actual endpoint/principal class, negative and positive result, source SHA, before/after state+audit, CI/run, reviewer. Until then all nine FINAL closure gates remain **HOLD**, and no ZIP/LOCK is authorized.

## Mutation/accountability
This checkpoint used GitHub/Vercel metadata and Supabase **SELECT-only** queries. No production DDL/DML, no live JWT use, no owner session revocation, no article modification, no re-backup, no key handling, no Cricket access. This is a separate evidence-only review branch based on exact B7 SHA; B7 remains untouched until independently approved merge.
