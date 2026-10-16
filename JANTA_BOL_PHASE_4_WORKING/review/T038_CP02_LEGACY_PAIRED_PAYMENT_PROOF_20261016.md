# JANTA BOL — P4-T038 / CP02 EXACT OLD OWNER PAYMENT ROUTE RECONCILIATION
**Evidence:** 16 October 2026 (IST) · **Founder priority:** NEWS+contact-only soft launch, real commercial payment later strictly BEFORE first paid advertisement LIVE. Founder manual step: **NONE**.
**FINAL CP02 scope verdict:** REAL isolated PostgreSQL17 paired legacy/receipt trigger and protected regressions **PASS**; real hosted E2/Owner E5 and external E6 **DUE**; official P4-T038 ADS035–040 canonical **0/6 Final PASS+LOCK**, no launch-scope approval.

## Authority and source provenance
- Repo `jantabol/JANTA-BOL-Website`, separate review branch `review/t038-manual-payment-authority-20261016`, child of unmerged T037 PR #32, new DRAFT PR #33; original B7 baseline unchanged.
- Exact LIVE Supabase SELECT-only `pg_get_functiondef` original:
  1. `public.jb_ad_confirm_payment_internal(uuid,text,bigint)` — Owner-only old RPC, lacks independent receipt/buyer acceptance; auto-populates non-refund acceptance time from Owner click.
  2. `public.jb_ad_record_payment_internal(uuid,text,text,bigint,text,boolean)` — Owner-only old status/payment RPC, accepts a boolean assertion of nonrefund and no independent receipt/acceptance evidence.
- Existing T034 production payment/paid-state verified advertiser & immutable financial identity triggers **ENABLED** and original paid approval protection not removed. They do not, on their own, implement the full T038 original ADS036/037 receipt data contract.
- Independent review SQL `db/20261010_b7_manual_payment_REVIEW_ONLY.sql` has explicit quote, authentic receipt fields, buyer acceptance timestamp, `CONFIRM`, immutable reference and tested BEFORE payment guard, but is **NOT installed on production**.
- Current Owner frontend `phase4-domain-client.js` deliberately DISABLES old 3-field payment helper and requires reviewed 10-field manual RPC, currently **not live**; do not enable fallback to old functions.
- LIVE READ ONLY before and after test: **7 campaigns, 29 ad_history, 0 payments, 0 confirmed, 0 LIVE**. No SQL writes, projects, account/auth changes, payments, ad approval, paid deployment or Cricket changes.

## Exact T038 CP02 actual test execution
- New *isolated only* source replica `ci/phase4/b7-t038-cp02-original-live-legacy-fixture.sql` copies the two original LIVE Owner RPC bodies and original public/anon denial grants into disposable PostgreSQL 17. Does not replace production functions.
- Apply **unchanged existing** `20261013_b7_t034_payment_verification_GUARD_REVIEW_ONLY.sql` + **unchanged existing** `20261010_b7_manual_payment_REVIEW_ONLY.sql` to that disposable DB (synthetic fixture), then execute new `ci/phase4/b7-t038-cp02-legacy-rpc-paired-guard-regression.sql` with `ROLLBACK`.
- Both old Owner-approved payment RPCs reject confirmed receipt insertion with `MANUAL_PAYMENT_EVIDENCE_REQUIRED`. Anon cannot execute. NonOwner/AAL1-equivalent mock fails Owner gate. Direct `confirmed` SQL insertion and direct `paid` DML blocked. HIGH-risk pending verification tested with structurally complete dummy receipt rejected; no false paid/high-risk LIVE.
- Reviewed new manual RPC accepts **synthetic, invented** complete test fields only inside ROLLBACK; then old paths remain denied, confirmed ledger update/delete denied, no duplicate audit/history. No claim that synthetic receipt proves a bank settlement or external consent.
- Separate original protected T034 ADS008 actual PG17 suite **PASS**: historical high-risk and normal pending blocked on BOTH old functions; Owner gated; valid verified old-positive test remains PASS **only when the new evidence guard is absent in this separate earlier baseline**, as expected. It is NOT permission to use old RPC for real payment in a paired rollout.
- Protected source 7 new CP01 + legacy disable 3 + old client 76, plus B7 9 official/60 ADS closure checker PASS but release correctly BLOCKED.

## Independent RCA after two failed targeted CI fixes
- RED [#38912459752](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38912459752): wrong expectation of T034 error; PostgreSQL alphabetical BEFORE trigger ordering makes receipt `b7_guard_manual_payment_evidence` reject missing fields before T034, while isolated T034 separate regression remains protected. Refined high-risk positive-structure synthetic test without relaxing original guard.
- RED [#38912622616](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38912622616): `FAILED_LEGACY_RECEIPT_ATTEMPTS_CHANGED_DATA`. Exact first divergence: test created **one allowed Owner quote** to exercise verified high-risk receipt gate; source quote intentionally writes `manual_quote_agreed` history, but test compared all ledger count against before-quote count. After two failed targeted fixes, STOPPED and recorded full independent source-to-trigger-to-audit RCA **BEFORE third fix** at `review/T038_CP02_INDEPENDENT_RED_RCA_20261016.md`.
- Third **test-only minimum safe correction**: assert payment-event history stays unchanged and independently assert one legitimate quote+audit; never suppress permitted quote or weaken denied payment. No change to original production/payment guard source.
- GREEN [#38912958779](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38912958779): **3/3 jobs SUCCESS** on review head `46a60a7064128907f5fafea164f15f0b29b1ef2a`:
  - Paired actual PG17 old 3/6-input Owner RPC negative, unauthorized, high-risk complete-field denial, original T034 paid direct DML guard, manual synthetic complete positive, immutable payment history, NO duplicate audit, `ROLLBACK`.
  - Original T034 verified advertiser ADS008 suite **PASS** unchanged.
  - New 7/7 source + 3/3 old frontend disable + 76/76 prior Client and B7 closure audit **PASS**, no fake release.
- Parent CP01 preserved [#38912958850](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38912958850) **3/3 jobs SUCCESS** same exact code SHA before this evidence-only note.

## Genuine required remaining work
- Official PDF T038 ADS035–040 still **DUE** for real hosted Owner E5 + backend E2, real independent bank receipt, explicit nonrefund agreement, verified advertiser, immutable legitimate UTR, signed scheduled LIVE.
- External payment provider E6 is **explicitly DUE** for post-launch provider integration; a separately authorized manual launch-scope signoff never counts as canonical 6/6 full T038 PASS.
- Prior T034/T035/T036/T037 verified Article geo, secure sanitized creative media, schedule/expiry/hide, inventory, and genuine ad eligibility must also pass **BEFORE first paid ad LIVE**. No real payment or paid preview necessary for contact-only newsroom first soft launch.
- The deliberate unpaired “Owner manual payment” form should fail closed until real review SQL/hosted E2 authorization and Founder step; do not reconnect to old weak RPC.
- DRAFT PR #33 and all ancestor PRs remain UNMERGED. No Production migration/SQL job/Backend reload or Vercel cutover. **Founder manual step now NONE.**

**CP02 ISOLATED E1+REAL DISPOSABLE PG17 = PASS; T038 FINAL E2/E5/E6 = HOLD · NO FAKE PASS**
