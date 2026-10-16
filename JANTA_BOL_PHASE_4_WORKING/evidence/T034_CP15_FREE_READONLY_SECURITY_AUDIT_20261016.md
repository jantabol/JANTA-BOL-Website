# JANTA BOL P4-T034 — CP15 Free-Only Security Audit
Date: 16 October 2026 (IST)

## Founder Decision B
Founder selected **B** following CP14 account-wide free-project-limit rejection.
**Allowed:** existing GitHub Actions disposable LOCAL Supabase/Auth, source-to-live READ-ONLY catalog verification, no hosted new charge.
**Not allowed:** paid Supabase branch, project upgrade, project pause/deletion, test-user creation on production, live finance approvals/changes, or any Cricket project change.

## Current checked evidence (READ-ONLY; NOT real hosted JWT principal PASS)
- Canonical B7 branch SHA `bd03084b0e42f8d1a65c53a4a047f6c8686a51a8` unchanged.
- Review branch before this evidence update SHA `d7a9ec6be82213488974f42678d5946834339df0`; this report is new only.
- Existing unaltered genuine LOCAL Supabase GoTrue + TOTP/Auth Actions **#38890535434 SUCCESS**, scoped LOCAL only.
- Existing CP12 real LIVE anonymous REST GET #38890535537 **SUCCESS**, no Auth JWT, 5/5 private tables denied.
- Existing CP13 LIVE fake/JWT invalid signature GET #38890535357 **SUCCESS**, 4/4 denied.
- Existing E5 synthetic signed-JWT #38890535501 **SUCCESS**; ADS002 fake-browser #38890540228 **SUCCESS**; E7 Owner review fake UI #38890540175 **SUCCESS**; these are not Android E3 proof.

## LIVE critical Owner surface source-parity drift audit
The following sensitive functions were inspected READ-ONLY from live `pg_proc` and compared against prior known function fingerprints, with no source or ACL changes:

| Exact function signature | Live pg_get_functiondef MD5 | Anon execute | Authenticated execute | Owner helper in source |
| --- | --- | --- | --- | --- |
| jb_ad_approve_creative_internal(uuid) | 0899abb6d55a9dbcb39ac6f6b011be37 | DENIED | GRANTED | YES |
| jb_ad_confirm_payment_internal(uuid,text,bigint) | fed4e4f0c3c61091c9bfbeb59802f3a2 | DENIED | GRANTED | YES |
| jb_ad_record_payment_internal(uuid,text,text,bigint,text,boolean) | 441749b81dbbc287b4ef752ac1a1e9f8 | DENIED | GRANTED | YES |
| jb_ad_transition_internal(uuid,text,text) | 6327cf8cdfeb0d677783e3f396408416 | DENIED | GRANTED | YES |
| jb_ad_verify_advertiser_internal(uuid,text,text,text) | f82dcb0244b99f3d51e84e50f372e681 | DENIED | GRANTED | YES |

All 5 are `SECURITY DEFINER` functions. **Authenticated EXECUTE grants do not prove actual privilege: genuine JWT session, AAL2 and account permission checks remain necessary.** Hashes match the previous CP13 observed live baseline: no observed source drift in these five functions.

Existing T034 payment guards independently found **enabled** (`tgenabled='O'`):
- `ad_campaigns.b7_t034_paid_state_verified_gate`
- `ad_payments.b7_t034_payment_verified_gate`
- `ad_payments.p4_ad_guard_confirmed_payment`

**LIVE before/after COUNT checks (read-only):** advertisers 7; campaigns 7; history 29; payments 0; LIVE campaigns 0. Production data was not written by CP15.

## Evidence limitations and remaining free path
- CP15 is a **read-only security catalog/CI health audit**. It is not a new real hosted Auth session test and must NOT be counted as T034 E5 hosted PASS.
- The existing local GoTrue script covers JWT login, AAL1/AAL2, reporter/advertiser, confirmation, high-risk verification gate and stale JWT after logout. Additional second-legacy-payment-RPC real-GoTrue expansion was analyzed but **not executed or registered as PASS** in this checkpoint; an attempted code tool operation did not complete. Keep candidate source unchanged rather than implying a patch landed.
- Other test coverage that can remain free: add isolated CI-only Auth JWT cases against both original legacy payment methods, direct paid-state RLS negatives and versioned local-only fixture parity; reconcile ADS001–ADS009 with already real E3 proofs. No production writes.
- **Hosted real reporter/advertiser/Owner/revoked JWT E5 is still HOLD** because separate free Supabase test project creation was rejected at the member-wide 2-active-free-project limit. Must not fabricate a hosted PASS from localhost Auth or read-only catalogs.

**Status: CP15 FREE SECURITY READ-ONLY CATALOG/CI HEALTH AUDIT COMPLETE, limited PASS. P4-T034 FINAL PASS + LOCK HOLD. No new project or billing.**
