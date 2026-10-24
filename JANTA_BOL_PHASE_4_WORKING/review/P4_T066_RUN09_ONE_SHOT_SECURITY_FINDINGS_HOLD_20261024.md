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

## FINAL SUPERSEDING ADDENDUM — LIVE FIX AUTHORIZED, APPLIED & RECHECKED — 24 OCT 2026
This section supersedes older pre-authorization statements above that the fix had not been deployed.

**Founder approval:** explicit full permission after prior isolated pass. **Target:** only Supabase project `vrffsnkycvjithwtiylt` (JANTA BOL), NEVER Cricket.

**Source-to-CI chain:**
- Exact production migration: `JANTA_BOL_PHASE_4_WORKING/db/20261024_b10_t066_advertiser_active_session_PRODUCTION_APPROVED.sql`.
- Preflight verified correct original function owner postgres, SECURITY DEFINER, STABLE, 7-column return, original SQL body, previously allowed `authenticated`/`service_role` and denied `anon`, and both Ad base tables RLS enabled. No unrelated policy changes.
- `40072121020` head `e2a4644025568cd69f1a3341ced56501a8ff6bd1` **CI SUCCESS**. Same production SQL bytes ran against disposable PG17: **original signed JWT RED successfully reproduced**, **GREEN 12/12 signed JWT HTTP tests**, original T065 25/25 HTTP tests, protected B0–B9, B10 source tests GREEN.
- LIVE `apply_migration` returned `success:true`; Supabase migration history confirms `20261024065659 b10_t066_advertiser_campaign_revocation_active_session_guard_20261024`.
- LIVE immediate postflight verifies `jb_ad_my_campaigns()` includes server-side `private.current_session_active()`; signature/owner/provolatile/SECURITY DEFINER/EXECUTE ACL/search_path unchanged; `anon` cannot execute; `authenticated` and `service_role` can execute.
- Production before/after invariants: **Advertiser mappings 0, Articles 32, Ads 7, Grievances 6, assigned roles 4, audit rows 1560, Auth sessions 72**. No account/session data writes, deployment of frontend/Vercel, or paid resources.
- LIVE audit E5 read-only: 9 historical `security_session_revoked` entries carried target session IDs; **9/9 referenced sessions now absent** from `auth.sessions`; 1 `team_suspended` and 1 `reporter_account_suspended` entry. Demonstrates historical evidence consistency, not a fresh hosted signed revoked-JWT attack.
- Supabase Advisor postflight warnings remain separate: 43 RLS-no-policy INFO, 22 anonymous SECURITY DEFINER WARN, 117 authenticated SECURITY DEFINER WARN, leaked-password protection WARN. No blanket GRANT/REVOKE; unrelated alerts not falsely marked fixed.

**T066 verdict:** `SCOPED LIVE FIX IMPLEMENTATION VERIFIED PASS`; **ORIGINAL P4-T066 FINAL PASS+LOCK remains HOLD**, because two genuine, distinct Hosted QA JWT principals and a real revoked/suspended HTTP session attack with complete E2/E5 identity-bounded evidence were not exercised. There were no linked real advertiser users (0); do not invent a positive hosted Advertiser login. T064 remains DUE; T065 complete hosted proof HOLD; T063 prior HOLD. T061/T062 remain locked. Explicit Founder approval did **not** waive test evidence or permit real user/device session tampering.

**Next production action:** None without reviewed QA actor/release design. Do not automatically create accounts, suspend live users or roll back security hardening.
