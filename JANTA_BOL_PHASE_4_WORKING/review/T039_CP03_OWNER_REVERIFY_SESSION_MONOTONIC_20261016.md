# JANTA BOL — P4-T039 / CP03 Owner verification downgrade → credential reissue → old session never resurrects
**Date:** 16 October 2026 IST. **Founder original blueprint:** P4-T039 ADS041–047, E2+E3+E5. **Canonical FINAL all 7 DUE.**
**Status:** Exact source RCA, targeted ADDITIVE REVIEW-ONLY fix, actual disposable PostgreSQL17 regression PASS. Real JANTA BOL Supabase, Owner Auth and Android: NOT TESTED this checkpoint.

## FIRST DIVERGENCE / security threat model
- Existing BE10 review-only `private.b7_verified_advertiser_downgrade_guard()` correctly revokes old sessions and credentials, safety-hides active campaigns when Owner downgrades an advertiser. Re-verification does not itself restart paid ads. Fresh unrelated Owner secret reissue allowed (original tests PASS).
- BUT `private.b7_portal_session_verification_guard()` originally allowed `UPDATE public.ad_portal_sessions SET revoked_at=NULL` of an **already revoked old bearer session**, after Owner reverified and refreshed the credential hash, because it checked only the current advertiser/credential verified state. A sufficiently privileged writer/bug could thus resurrect the stale 12h token. **No proof this privileged table UPDATE was accessible to a normal advertiser**; this is a defense-in-depth DB boundary.
- Actual RED [GitHub #38917611788](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38917611788): original BE10 control PASS, **new real PostgreSQL17 attack FAILED** with `CP03_REVOCATION_MONOTONICITY_FAILED: CP03_OLD_TOKEN_REACTIVATED_AFTER_REVERIFY`. The prior 76/76 client, official source and billing closures were untouched.

## Minimum safe reviewed FIX
- Edited **existing** `JANTA_BOL_PHASE_4_WORKING/db/20261012_b7_verification_portal_revocation_REVIEW_ONLY.sql` only, no new parallel verification function/table or rebuild: when `tg_op='UPDATE'`, if `old.revoked_at IS NOT NULL AND new.revoked_at IS NULL`, `RAISE 'B7_PORTAL_SESSION_REVOKED_FOREVER' SQLSTATE 42501`. This is monotonic permanent denial for that token hash only, **fresh NEW session insert remains permitted** when verified account and fresh Owner-issued credential exist. Owner's previous audit, other tenant sessions and existing schema unaffected.
- New test `ci/phase4/b7-t039-cp03-revocation-monotonic-regression.sql` executes Owner A verified → pending downgrade → revoked old A; Owner reverify A → freshly rotated credential; attempted direct privileged OLD session reset must be denied; new distinct session inserted; unrelated advertiser B remains active and A campaigns stay hidden. Entire test `ROLLBACK`; dummy credentials/UUIDs only.
- New workflow `.github/workflows/b7-t039-cp03-verified-reissue.yml` keeps original unchanged BE10 tests, source tests, browser logout tests and News regressions separate.

## Reproducible actual GitHub proof
[**GREEN #38917748717 — 2/2 jobs SUCCESS**](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38917748717), tested review-only source SHA `232d3feba4258355c8e4886f1003b0055ed292f1` before evidence append.
1. Real PostgreSQL17: untouched BE10 downgrade/revoke test PASS, ROLLBACK; **new CP03** revoked old session remains dead after reverify+fresh secret, B unaffected, fresh token allowed, no LIVE ad resurrection PASS, ROLLBACK.
2. New previous CP02 real browser handler 5/5, prior CP01 source 7/7, preserved Client/News 76/76 PASS, B7 9/60 closure **still BLOCKED** until genuine E2/E3/E5.
Existing separate CP01/CP02 regression workflows triggered on fix commit; independently recheck before a future merge.

## ALL REAL RELEASE GATES RETAINED
- This SQL **NOT DEPLOYED** to JANTA BOL production or Vercel. Production legacy portal one-use/media/renewal gaps remain as found CP01. CP02 server-side logout SQL is **also NOT DEPLOYED**.
- No real Founder AAL2, actual advertiser account, paid advertisement, client media, login secret, real Android E3, bank receipt, extra Supabase project or GitHub merge; no production credentials in CI.
- Real E2+E3+E5 A/B actors, Owner reissue, newly verified advertiser and downgrade/revoke, android open session and replay denial still DUE before first paid portal launch. P4-T039 **FINAL HOLD, 0/7 canonical PASS+LOCK**.
- Contact-only NEWS soft launch remains separate and does not require activating advertiser portal.
**NO REBUILD • NO PRODUCTION CHANGES • NO FAKE PASS**
