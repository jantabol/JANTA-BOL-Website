# JANTA BOL / P4-T066 — ONE-SHOT BACKEND REVOCATION RECHECK
24 October 2026. **T066 full Production PASS+LOCK is NOT asserted by isolated CI.**

## Context and read-only production verification
- GitHub B10 baseline b992365540b87f5441bee3f4b76ff932b7732410; run 40064491171 successful.
- LIVE JANTA BOL Supabase ONLY: vrffsnkycvjithwtiylt. Production public tables 100/100 RLS.
- Production `private.current_app_role()` uses team_accounts active status, and `private.current_session_active()` compares JWT session_id with actual auth.sessions.
- Production `jb_owner_revoke_session` requires recent Owner MFA and deletes selected Owner session with audit.
- Zero disabled-Reporter/active-Team overlap; zero inactive-Team retained role; zero disabled reporter with active matching team sessions (read-only aggregate probes).
- Advertiser mappings and portal sessions both currently 0. Dormant risk is therefore **not** proven to have exposed customer data.
- **T066-SEC01:** existing production `jb_ad_my_campaigns()` is SECURITY DEFINER and checks JWT auth.uid advertiser mapping, but **does not check current_session_active()**. A signed not-yet-expired JWT for removed auth.sessions could theoretically continue to return the mapped advertiser's campaigns. Reproduce only with dummy signed accounts in isolated PG17, never real data.
- **T066-SEC02:** UI bridge `b7-ad-revocation-bridge.js` has safe fail-closed client logic but is deliberately not wired to live site; referenced `jb_ad_visibility_alive_public` is absent on hosted database. This remains a separate B7 advertisement release gate and is **not** represented as a deployed security control.

## Proposed guarded fix, isolated only
- Added `db/20261024_b10_t066_advertiser_session_guard_REVIEW_ONLY.sql`; it preserves original function signature/privileges and adds server-side active session constraint to the existing advertiser self-campaign query. **Explicit fail on any DB other than `jb_b10_disposable`**.
- New fixture `ci/phase4/b10-t066-disposable-revocation-fixture.sql` reproduces the original query, self/cross advertiser mappings, dummy backend auth sessions, Founder AAL2 and suspended Reporter status. Test harness uses actual HS256 signed synthetic PostgREST HTTP JWT.
- New `ci/phase4/b10-t066-disposable-signed-revocation.test.mjs` runs expected RED first, applies scoped guard in same disposable PG17, then GREEN positive/negative including no JWT/session ownership swap, no Owner escalation, suspended Reporter, public Search unchanged, bad signature and anon denied.
- Old B0-B9, previous B10 T061/T062 and T065 tests remain mandatory CI dependencies.
- No production DB mutation, Auth session revoke, login, Vercel deploy, environment change, paid resource, or Cricket touch. No Founder Android steps.

## Official lock discipline
- `P4-T066 E1`: only mark verified when updated GitHub CI runs and passes.
- `P4-T066 E2`: read-only LIVE policy/function inventory performed; no real signed hosted two-account revocation attack exercised.
- `P4-T066 E5`: historical production audit records can be inventoried read-only, but full real suspended/revoked staged QA actor audit proof not yet performed.
- **T066 FINAL: HOLD** until a safe hosted E2+E5 real QA identity proof and approved release/verification of the fix. Source/isolated PASS is not full live closure.
- `T063 HOLD`, `T064 DUE`, `T065 hosted HOLD`; don't re-label any. `T061` and `T062` stay PASS+LOCK.

## Actual green run and final evidence (verified)
- GitHub Actions `40067901851`, commit `ded4e908ae1287d4fddd5672cc7d1b9cbfb3d2f6`, **SUCCESS**: T066 RED 3/3 (expected vulnerability recreation), T066 GREEN 12/12, prior T065 signed HTTP 25/25, B10 original nine Source contracts, B9 and B0–B8 protected suites all succeeded. Green signals isolated CI, not LIVE security certification.
- Production read-only T066 audit: 9 rows with session revocation actions; 2 suspension-action rows; 1 role-change event; total 1560 audit rows. Live data invariants: 32 Articles, 7 Advertisement Campaigns, 6 Grievances, 4 Role assignments, 72 Auth session rows. No production DDL, mutation, session revoke or global Founder settings changed.
- `jb-team-api` is deployed with verify_jwt=true. Server authorizes live `auth.getUser(token)`, backend user+session context, actual Owner role, AAL2 and *recent MFA* for mutations; service-role API is called only after server-side validation. This is source evidence, not a live revoked-admin negative trial.
- A read-only low-role transaction found no public Search private-ID exposure for random UUID. Does not replace a full signed Production E5 proof.
