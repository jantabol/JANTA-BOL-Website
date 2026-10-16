# JANTA BOL — P4-T037 CP02 / Owner quote lock & no-forced-package enquiry
**Evidence date:** 16 Oct 2026 (IST). **State: scoped review code + isolated PG17 PASS; official ADS025–027 E2/E3/E5 DUE.**
**Master SOT:** Founder B7 Final Master Blueprint PDF pages 27–28. ADS-025 optional package info + simple no-package WhatsApp request, ADS-026 immutable approved custom quote, ADS-027 old bought terms unchanged after price edit. No past acceptance criteria changed.

## Actual first divergence and code
- Existing reviewed `20261010_b7_manual_payment_REVIEW_ONLY.sql` `jb_ad_set_approved_quote_internal` required Owner AAL2, positive amount, snapshot price consistency, and blocked *after confirmed payment*. But a campaign ALREADY in `approved` state with an initial agreed custom quote could still be **repriced and retermed before any payment**, silently changing the approved amount and adding another history/audit row. This violates ADS-026's approved snapshot immutability even before payment and does not require creating fake LIVE ad.
- Reproduced against exact existing function in actual disposable PostgreSQL17: **real RED Actions #38909113516** `QUOTE_GUARD_MISMATCH: APPROVED_QUOTE_CHANGED_BEFORE_PAYMENT`. Earlier first try #38908992198 failed solely because of an incorrectly declared `msg` variable in the *new test*, corrected independently before reproducing the real business mismatch. No production bug incorrectly attributed to a test typo.
- Minimum safe change **inside original reviewed SQL** only: when an `approved/payment_pending` campaign already has an agreed price or signed timestamp, another Owner quote attempt raises `APPROVED_QUOTE_IMMUTABLE` BEFORE any update/history/audit. Requested/review preliminary negotiations can still amend quote. An approved campaign with no preexisting quote may receive its **first** signed quote. Existing package snapshot price mismatch still takes precedence, preserving original regression semantics.
- No changes to existing production Supabase RPC, payment records, approved real assets, domain, Admin UI, public Article selection or ad LIVE system.

## Executable proof
- New `ci/phase4/b7-t037-cp02-quote-immutable-regression.sql` tests using unchanged `ci/phase4/b7-payment-fixture.sql` + reviewed original payment SQL:
  1. Nonowner quote refused without any history/audit.
  2. Owner's FIRST custom no-package quote 68,000 paise succeeds, freezes value, terms and timestamp.
  3. Owner's attempt to reprice that approved quote to 99,000 paise and overwrite signed terms fails before second history/audit.
  4. Package-bound existing 50,000 paise snapshot denies changed price AND changed terms at same price.
  5. Requested-state preliminary offers 30,000→32,000 can be negotiated; after approval 33,000 direct Owner quote rejected.
  6. All synthetic data in transaction `ROLLBACK`. **No bank receipt, actual multi-district LGD binding or real Owner identity**.
- New `.github/workflows/b7-t037-cp02-custom-quote-freeze.yml`: actual ephemeral PG17 + protected unchanged public contact/client tests. **GREEN [GitHub #38909268969](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38909268969) 2/2 jobs SUCCESS**, log confirms each of four custom-quote/Owner negatives and full ROLLBACK; JS 7/7 new source, 13/13 prior B7 intake, 76/76 legacy client and closure register correctly BLOCKED.
- Parent **CP01 complete regression** at same source SHA `5af40f6b2a7d1f82e1c447d3338415606d509e6d`: [#38909269842](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38909269842) **5/5 jobs SUCCESS** (weighted 3200 draws, inventory 600+400, single-feed/positive-price/frozen versions/source).

## Separate correct limits
- **ADS025 PUBLIC**: `advertise-request.html` remains optional, short WhatsApp+consent enquiry with no paid package selection or automatic payment required; existing pending-only RPC/source and its previous Android screenshots remain protected. However the present public page does **NOT** actually display standard package price info (even though deployed `jb_ad_public_packages()` exists). As LIVE has 0 packages, no fabricated package choice or visibility result; this element of ADS025 is DUE for first commercial release.
- **ADS026**: Passed an actual SQL Owner *mock authorization* in disposable PG17. The test fixture's label says `SIGNED-MULTIDISTRICT` but **no official 3-district area binding, no immutable externally accepted client signature and no real hosted AAL2 session** were provided. Do NOT claim fully tested multi-district quote. Other direct service-side updates outside the reviewed RPC have not been fully proven safe; release blocker.
- **ADS027**: Existing separate CP01 verified package-version UPDATE/DELETE immutable and historical snapshot mismatch in disposable PG17. No real older purchased campaign, real payment or post-purchase price edit happened. Official E2/E5 HOLD.

## Official status, merge and next
- CP02 scoped CODE+CI PASSED, old protected regressions preserved.
- Full **T037 ADS024..034 = 11/11 final DUE; P4-T037 PASS+LOCK HOLD** until actual accepted paid packages, official geography, true hosted E2/E3/E5 and real Founder approval.
- Dedicated `review/t037-packages-rotation-inventory-20261016` **DRAFT PR #32** based on DRAFT T036 branch. No PR merge/production SQL/Vercel deployment/paid branch or Cricket edits.
- Founder manual step NOW: **NONE**. CP03 next consolidate T037 remaining original 11 acceptance gates by first-paid-ad vs contact-only soft launch, then next Phase4 block without repeating paid synthetic tests.

**NO REBUILD • NO FAKE PASS • NEWS / CONTACT FIRST • FIRST REAL PAID AD HARD GATED**
