# JANTA BOL — T034 CP-03 ADS-008 candidate security regression checkpoint
Date: 15 Oct 2026. Branch `review/t034-cp03-ads008-20261015`.
Exact tested candidate code commit `68294866fbf2805e64f6390614ae505a5c63d2cf`.
**NO PRODUCTION SQL executed. NO DEPLOYMENT. T034 HOLD.**

## Real fake-only CI
GitHub Actions run **38684890024**, **2/2 JOBS SUCCESS**:
- ADS-008 RED old payment acceptance on disposable Postgres, inside ROLLBACK (vulnerability reproduced; no actual payment).
- ADS-008 guard candidate applied inside explicit BEGIN/COMMIT (migration atomic).
- Late intentional division-by-zero after all proposed new objects, before COMMIT, correctly rolls back **all** new triggers/functions; original data/payment counts unchanged. This is a fake-only fault-injection proof.
- New guard blocks both old payment-confirmation RPCs for historical HIGH/pending and NORMAL/pending, direct confirmed payment DML, direct PAID-state DML.
- Added security: direct SQL high-risk APPROVED/LIVE state transitions are rejected; verified normal LIVE without a positive confirmed payment is rejected; historical payment_pending fixture remains unchanged.
- Owner/AAL2 fake-context negative, and verified normal/high original payment RPC positive paths pass without altered original RPC byte hashes.
- Reviewed rollback script removes only newly introduced objects, original RPC hashes and historical fixture preserved. Guard can be reapplied successfully.
- Existing ADS-002/003/004/005/007/009 enquiry + old overload synthetic tests pass (7 anon negative, 3 positive WhatsApp normalized, concurrent rate/cooldown, legacy 5/6/7 overloads).

## Source parity
- Original LIVE JANTA BOL read-only catalog independently verified original old payment RPC fingerprints earlier: `fed4e4f0c3c61091c9bfbeb59802f3a2` and `441749b81dbbc287b4ef752ac1a1e9f8`. Live original `jb_ad_transition_internal` checks Owner/AAL2, high-risk approval/LIVE and payment existence. Public feed checks live + approved creative + amount-positive payment + advertiser risk verification.
- Candidate UPDATE/INSERT status guard is additive, transactional; benign changes to unchanged historical `payment_pending` status are not auto-updated/deleted.
- Source code candidate is on isolated B7 review branch; backup/restore engine is separately on draft PR #14. Do not silently merge entire Phase-4 app tree onto minimal main.

## Limits and future gates
- Fake Owner test flag is NOT real JWT/AAL2/revoked-owner principal proof. Reporter/advertiser/Owner AAL1 negative E2/E5 still due. Genuine Android E3/viewports still due.
- No new schema guard is LIVE; existing production trigger `b7_t034_*` count previously verified ZERO. Historical high-risk pending item must remain untouched until reviewed.
- Migration emergency rollback itself re-opens old vulnerability, so a payment-stop containment gate is mandatory before production. Explicit Founder permission is necessary separately.
- Offline fake 26+16 restore + sequence/role tests are evidenced on PR #14 but **real archive restore remains NOT VERIFIED**; G5 Owner offline AGE identity proof DUE.
- High-risk verification revocation after a campaign was already LIVE: public feed dynamically hides unverified high-risk ads, but a complete operational state/notification lifecycle remains separate and should not be silently marked PASS.
- Any change in current LIVE hashes/ACL/DDL since source inspection requires fresh drift analysis before migration.

**Verdict: CP-03 ADS-008 affected fake security regression = PASS scoped to isolated code+CI; full CP-03 and T034 remain HOLD pending real gates. NO FAKE PASS.**
