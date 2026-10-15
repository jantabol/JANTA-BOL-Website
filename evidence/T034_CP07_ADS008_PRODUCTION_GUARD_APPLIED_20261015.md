# JANTA BOL — T034 CP07 / ADS-008 LIVE guard release evidence
**Date:** 2026-10-15 | **Environment:** JANTA BOL Supabase `vrffsnkycvjithwtiylt` (ap-south-1, PostgreSQL 17.6.1.155) | **Scope:** ADS-008 additive payment/paid-state DDL **ONLY**.
**Disposition:** **GUARD DEPLOYED + 12/12 SCHEMA/SECURITY POSTCHECK PASS; ADS-008 full E2/E5 acceptance and T034 FINAL PASS/LOCK remain HOLD**.

## Authorization / independent real recovery

Founder expressly selected Option A for: final safety + regression then apply only the minimum ADS-008 payment verification guard, with **NO changes to historical advertiser/campaign/payment/verification rows**. Approval does not authorize live payment fixtures, impersonating JWT/AAL2, bypassing RLS, or deploying the whole Phase-4 app tree.

Recent protected actual real B2 encrypted backup and isolated PG17 restore: [workflow #38778388127](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38778388127), protected source `da3efacfa09a2b4323fbb2d9d3230ca8a9b3c523`; restore command, 26/26 identity, 16/16 deep-security, anonymous database-role negatives, sequence and owner/ACL/locale exact match, actual encrypted round trip and workflow success. This is a **DB-only** restore; not Storage file bytes or platform configuration disaster recovery.

## Candidate reviewed / tested before production

Original reviewed SQL preserved on PR [#15](https://github.com/jantabol/JANTA-BOL-Website/pull/15), head `6227cb950b042576b1acea5b0e81b2a5175d2e14`, file:
`JANTA_BOL_PHASE_4_WORKING/db/20261013_b7_t034_payment_verification_GUARD_REVIEW_ONLY.sql`
exact Git blob SHA **`25d5cad608c13c9ecf02cf4856ee6711a7b3502b`**, 9,318 bytes. Despite filename/comment reflecting its **original review-only status**, that exact reviewed byte content was subsequently explicitly approved and successfully applied with the migration name below. No entire PR #15/B7 working tree was merged.

Isolated fake PG17 CI regression run [#38697287262](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38697287262) **2/2 jobs SUCCESS** (ADS008 red/green, old RPC AAL2 and unverified payment bypass closure; direct PAID/LIVE DML, immutable confirmed financial receipt, paid-campaign advertiser binding, historical pending preservation, valid verified owner positives, rollback/reapply, ADS002/003/004/005/007/009 fake regressions). Historic run [#38697172119](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38697172119) also 2/2 successful. Neither test replaces actual E5 JWT principals or device E3.

Exact 15-check **SELECT-only source drift preflight** from `ci/phase4/b7-t034-predeploy-live-readonly-drift.sql` on PR #15 returned:
`SOURCE_SCHEMA_PARITY_ONLY_GO_NO_DEPLOY_PERMISSION | 15/15 | blockers=NONE`.
File verifies original Owner-AAL2, both legacy payment RPC definition hashes, original payment trigger, RLS, schema columns, seven extensions, and candidate guard absence. Explicit Founder authorization was separate from this source-parity test.

## Production migration actual result

Executed via dedicated Supabase `apply_migration` (DDL migration API, not `execute_sql`):
- Project: **`vrffsnkycvjithwtiylt` ONLY**.
- Migration name: **`p4_t034_ads008_verified_payment_and_paid_state_guard_20261015`**.
- Supabase migration ledger version: **`20261015181131`**.
- Tool execution result: **`success:true`**.
- Reviewed SQL outer transaction `BEGIN; ... COMMIT;` and preflight deny if original authority/schema drift or new guard objects already present.
- Created exactly **3 private SECURITY DEFINER functions** and **2 BEFORE triggers**:
  - `private.b7_t034_assert_advertiser_verified(uuid)`
  - `private.b7_t034_confirmed_payment_guard()`
  - `private.b7_t034_paid_state_guard()`
  - `b7_t034_payment_verified_gate` on `public.ad_payments`
  - `b7_t034_paid_state_verified_gate` on `public.ad_campaigns`.
- Reviewed migration had **no INSERT, UPDATE, DELETE, CREATE TABLE, DROP TABLE, ALTER TABLE, TRUNCATE, CASCADE** on app data; did not touch historical row states, payment receipts, advertiser verifications or any Cricket resource.

## Independent real POST-deploy read-only assertions

Executed actual live `pg_catalog` SELECT-only checks **after** migration:
`ADS008_DEPLOY_SCHEMA_SECURITY_PASS | 12/12 | blockers=NONE`.

Confirmed: exact two triggers ENABLED on correct relations invoking correct new funcs; three private funcs SECURITY DEFINER; anon, authenticated and PUBLIC have **no EXECUTE** on new guards; original `p4_ad_guard_confirmed_payment` enabled; original Owner+AAL2 function, old two payment RPCs and old payment validator have **unchanged expected byte-definition MD5s**; `ad_campaigns` and `ad_payments` original RLS still enabled; no new guard trigger on other tables.

**Before-vs-after row data fingerprints (server-computed, private digest, not exported): EXACT MATCH for all four compared tables.** Row counts remained:
- `public.advertisers = 7`
- `public.ad_campaigns = 7`
- `public.ad_payments = 0`
- `public.ad_history = 27`.

Both existing `payment_pending` campaigns and the historical HIGH-risk/unverified campaign are **not auto-altered**. No synthetic financial transaction was performed against LIVE.

**This proves deployed SQL objects and preservation of existing rows/old function definitions, not that every conceivable concurrent payment route or auth/JWT case was exercised in production.** Current risk: an explicit rollback of these guards could reopen the original weakness; NEVER silently run the review-only rollback without a separately approved payment-stop/containment and live-drift review.

## Remaining T034 final-release HOLD gates

- ADS-008 **real owner JWT AAL2 + revoked/AAL1/advertiser/reporter/anonymous E5 role negatives** and controlled staging high-risk historic/verified positives remain required; no live financial writes to fabricate evidence.
- ADS-009 genuine principal permission matrix and unchanged-state/audit proof due (mock role CI is not genuine E5).
- ADS-001–006 require authoritative deployed app source binding and Android phone/tablet E3 with actual homepage+article CTA, pending receipt, custom queue and protected contact presentation. A Chromium 360px screenshot on an unmerged review branch is *supporting E1*, not real E3.
- ADS-007 normal verification requires actual owner/AAL2/audit proof in safe staging.
- Keep non-related JANTA BOL newsroom/editorial/Phase-3 regressions intact; no rebuilt app from scratch.
- Preserve recovery gate PASS, **no additional owner paper AGE key test or real production backup workflow rerun** solely for ad verification.

**Current verdict: ADS-008 LIVE guard installation and read-only preservation checks PASS (scoped). P4-T034 final PASS+LOCK = HOLD until nine mandatory ADS001…009 proof rows (E2/E3/E5) are evidenced. NO FAKE PASS.**
