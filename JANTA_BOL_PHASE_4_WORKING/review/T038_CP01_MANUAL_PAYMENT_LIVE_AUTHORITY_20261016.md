# JANTA BOL — P4-T038 CP01 Owner manual payment authority / real source vs isolated proof
**Date:** 16 October 2026 · **Status:** Source reconciliation + disposable PostgreSQL17 security regression **PASS at isolated scope**; REAL HOSTED E2/E5 and external E6 still **DUE**; **no real payment attempt**.

## Master PDF and Founder commercial boundary (exact authority)
Founder-supplied `JANTA_BOL_B7_FINAL_MASTER_BLUEPRINT_WITH_TESTS.pdf` pp.28–29: `P4-T038 — Approval → Manual Payment CONFIRM → LIVE / Non-Refund`; six scenarios `ADS-035..040`:
- ADS035 Owner approval must precede confirmed payment.
- ADS036 explicit nonrefund acceptance + immutable link to exact campaign/payment.
- ADS037 Owner AAL2 `CONFIRM` with real independently verified reference/amount/method/time.
- ADS038 unverified high risk denied via *all legacy and new routes*, no historic bypass.
- ADS039 UTR duplicate/false/zero/uncertain receipt denied.
- ADS040 server start time only; external gateway/provider `E6` specifically DUE, not simulated PASS.
`E2 + E5 + E6`, manual RUN-06 and external RUN-14. The blueprint explicitly allows a **separate launch-scope signoff** after genuine manual evidence, **but canonical T038 remains PARTIAL/DUE until E6**, never 6/6 full PASS by deferral. Founder currently wants contact-only NEWS soft launch; **real manual payment evidence also occurs only before first actual paid ad LIVE**, not now.

## Exact current sources, read-only authority, FIRST DIVERGENCE
- Repo `jantabol/JANTA-BOL-Website`; new child `review/t038-manual-payment-authority-20261016` from exact DRAFT T037 PR#32 SHA `7e6096b825e65407e633c9e7f9f4785b3fdf67c9`; parent/prior baseline branches untouched.
- LIVE JANTA BOL Supabase ref `vrffsnkycvjithwtiylt`, SELECT-only, queried before/after: **7 campaigns, 0 payments, 0 confirmed receipts, 0 LIVE, 29 history**. No production DDL/DML, financial records, user identities or personal messages read/written.
- Production live `jb_ad_confirm_payment_internal(uuid,text,bigint)` and `jb_ad_record_payment_internal(uuid,text,text,bigint,text,boolean)` still exist, require Owner `private.p4_owner_allowed()` (AAL2), but **their source does not require independent receipt evidence reference, external acceptance reference, and accepted-at chronology.** Old 3-input path sets `non_refund_accepted_at=coalesce(...,now())` on Owner confirmation. These facts show that original manual receipt evidence is **NOT FULLY IMPLEMENTED IN THE LIVE Owner RPC CONTRACT**. Existing T034 enabled triggers enforce independent advertiser verification, financial immutable identity/confirmed existence before paid, and explicit Owner authority, but **do not supply the missing receipt/consumer-acceptance data contract**; don't downgrade those old PASS.
- Current backend schema's `public.ad_payments` lacks `terms_accepted_at`, `acceptance_ref`, `evidence_ref`, `verified_at`, `verified_by` and Campaign lacks `agreed_price_minor/terms_ref/terms_recorded_at`. The real owner manual `jb_ad_confirm_manual_payment_internal(...10 fields...)` is **NOT live** in inspected `pg_proc`.
- Admin public source `phase4-domain-client.js` deliberately **disables weak legacy adConfirmPayment** and uses `adConfirmManualPayment` `CONFIRM` only; `ads.html` requests real UTR, amount, method, received time, independent evidence and consent reference+time, and Owner note. The private review SQL `20261010_b7_manual_payment_REVIEW_ONLY.sql` implements those missing protections and the old Owner-quote approved-freeze CP02 fix. **This is a paired-review release candidate, not deployed.**
- **Do not bridge old frontend manual button to weak old production RPC** to make launch tests pass. A disabled/unsupported manual payment form that refuses to confirm is safer than a false `Paid` or auto-LIVE. No silent real financial change or forced payment before soft launch.

## Real CI RED → first divergence → test-only repair → GREEN
Dedicated `.github/workflows/b7-t038-cp01-real-disposable-owner-payment.yml`: strictly temporary CI database, no service credentials:
1. **RED [#38911105949](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38911105949)**: all receipt-negative tests PASS; synthetic positive tuple rejected because its consent timestamp was **before the signed quote**. FIRST DIVERGENCE precisely the fixture's chronology error, **NOT a faulty backend security gate**. Minimum test-only change moves synthetic accepted_at to after/equal signed quote; guard not weakened. Prior run #38911074715 had malformed Docker health flags, changed CI syntax only before this business divergence.
2. **GREEN [#38911216566](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38911216566)**, exact tested candidate SHA `e6b4e6ef3403826433702fcf0abf798933d4aa73` **3/3 jobs SUCCESS**:
   - **Source/Owner client:** 7/7 new T038 cases, 3/3 protected BE09 old-payment-disable, 76/76 News/Article Client regression and 9 canonical/60 ADS coverage audit PASS with commercial release correctly BLOCKED.
   - **Real disposable PostgreSQL17 NEW negative:** requested-not-approved, approved but no quotation, absent consent, zero payment, unrecognized method, consent after receipt, high-risk unverified → all refused, payment state unchanged. Synthetic approved quote+explicit CONFIRM+dummy acceptance/reference yielded one test receipt inside disposable transaction, case-changed duplicate UTR on another campaign refused, no new history or second paid state; final `ROLLBACK`.
   - **Real disposable PostgreSQL17 ORIGINAL manual review regression:** unchanged original tests for Owner denial, direct legacy missing-evidence insert, high-risk verification, quote mismatch, receipt immutability, UTR replay, future-start LIVE rejection and synthetic valid scheduled LIVE positive, all PASS, `ROLLBACK`.
- **Synthetic refs/consent strings are invented CI fixtures**. They are never a proof of bank transfer, real verified receipt, buyer acceptance, host Owner Auth E5 or external processor E6. Verified real money remains 0.

## Canonical 6-test dispositions (before first paid LIVE)
| ADS | Narrow engineering evidence | Original real proof needed |
| --- | --- | --- |
| ADS-035 | PostgreSQL17 preapproval rejected, 0 confirmed/payments | hosted Owner AAL2 E2/E5 on actual safe test campaign |
| ADS-036 | SQL unsigned/late consent/terms ref rejected, chronology passes synthetic pair | actual independently timestamped buyer acceptance, nonrefund disclosure and genuine receipt E2/E5 |
| ADS-037 | Owner mock-only CONFIRM, amount, method, UTR checks and immutable synthetic receipt | Owner E5, real receipt authenticated independent bank evidence and source attribution E2 |
| ADS-038 | new manual quote high-risk rejected in PG, LIVE T034 existing RLS/trigger read-only | all existing legacy/new RPC and direct DML with real hosted principal E2/E5 |
| ADS-039 | zero, bad method, duplicate case-insensitive UTR synthetic blocked | actual disputed/nonreceipt/fraud handling E2/E5 and immutable real ledger |
| ADS-040 | new public feed time gate and original isolated DB future LIVE denied | real scheduled paid start E2/E5 + external provider E6 **genuinely DUE RUN-14** |

## Release/safety decision
- **CP01 SRC+REAL isolated PG17 and protected CI PASS**; `P4-T038` manual hosted E2/E5 DUE, gateway E6 **EXTERNAL DUE**. **P4-T038 FINAL PASS+LOCK HOLD**. No launch-scope signoff inferred.
- No real money, no payment provider, no user session revocation, no ad LIVE, no new paid project/Supabase branch, production writes or Vercel/public domain changes.
- Existing T034/T035/T036/T037 real first-ad media, geo, schedule, ad-label and Owner evidence still HARD GATES BEFORE first paid LIVE.
- Contact-only newsroom soft launch prioritization may proceed under independent Phase4/domain/corrections/security review; does not require fake manual payment tests. Manual Founder action CP01: **NONE**.

**NO REBUILD · NO OLD PASS REPEAT · NO FAKE PASS · PROTECT NEWS FIRST**
