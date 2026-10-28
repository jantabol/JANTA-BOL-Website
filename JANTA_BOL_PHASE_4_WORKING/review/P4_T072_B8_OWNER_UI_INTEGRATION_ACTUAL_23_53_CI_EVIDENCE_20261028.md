# JANTA BOL — P4-T072 original B8 Owner Android CREATE CASE idempotency UI integration candidate
**Timestamp:** 2026-10-28, IST. **Source:** unchanged full original B8 source branch SHA `89849ba47f443f423d8bfe4f966bb2d38087201f`. **Authority:** REVIEW ONLY, no Production or original Git Main modification.

## Actual execution
- Protected CI **GitHub Actions run 40650136247 / job 122688040902 SUCCESS**, tested changed source SHA `0fe43468895c2d71531a4b8ec0eeb654545d8b0b`.
- **23/23 new integration + original durable-key candidate tests PASS**: includes 16 original unknown-ack/retry, shared-durable UUID, cross-tab lock, actor/expired token/storage failure negatives; plus 7 source-integrated tests including new 4-arg RPC opt-in and zero fallback when the protected RPC is absent.
- **53/53 old original B8 Android/News/public-private UI regressions PASS**: original G1 mobile case selector, G3 workflows and contract, B8 mobile navigation, G4 public projection and lifecycle tests. None were simply reported as previously green; all reran on the new original integrated candidate source.
- The *first* proposed integration CI **40650093227 FAILED** specifically due to a newly introduced misnamed `p_area` variable in the new opt-in code. **Fixed to `p_area_label`** in SHA `0fe434...` and the complete new CI then passed. No old code changed to hide the failure.

## Additional same-runner original Backend + integrated UI proof (executed)
- GitHub Actions run **40650341918**, job **122688699561**: **SUCCESS**, source SHA `14908d28d0a7c012c136f1334f7e0aa19df2148b`.
- Immutable proposed protected SQL source `38ca825d8c32bdc33ddd8122aa871cafd645aba4` checked out independently; real disposable PostgreSQL17 on localhost; original B8 G1 fixture and protected add-only review SQL applied only in disposable test DB.
- In same runner, verified real DB: same request key -> one case; payload tampering denied; legitimate second key permitted; forced partial write rolls back case and ledger; repaired retry creates only one; revoked session/Owner AAL2 denied; anon private ledger denied; old News and Ads preserved.
- The same runner executed **76/76 original B8 integrated Android/client and old functional security tests PASS; zero fail**.
- This is original code and real local PG17 component E2, **not a hosted HTTP Supabase Auth E5 or real Android device test**. Test auth/session/AAL2 suppliers in the original PG17 fixture are simulated; no fake full PASS.
- Independent production read-only check: old RPC present, proposed safe RPC and private ledger still **absent**. Git Main and Vercel Production still at `f447231c0677644ca5a44cc19f12cf0314ff38ea`.
- **T072 Production P2 OPEN; Final HOLD. T075 full E8 HOLD.** No production writes/merge/redeployment.
## Narrow integration
1. The original `b8-accountability-client.js` takes optional `ownerCaseIdempotency` injection. When explicitly supplied, the old `jb_b8_g1_owner_create_case(text,text,text)` RPC is **not used or fallback-invoked**, even when safe backend RPC is absent. Old unrelated callers retain original interface and original tests; deployment must not retain their unsafe create callsite.
2. New `b8-owner-idempotency-client.js` uses previously independently tested persisted per-Owner UUID, payload digest (not original private title), Web Locks, current Supabase Auth `getUser`, and only **protected proposed** `jb_b8_g1_owner_create_case_idempotent(uuid,text,text,text)`. UNKNOWN and offline timeouts preserve PENDING and the same request ID.
3. Original `b8-accountability-ui.js` now explicitly wires **Founder-only** protected request-key adapter; Reporter/Editor unaffected. It checks 15-minute lock again on async response before displaying private Case ID. If the protected Backend RPC is missing, the action **fails closed**; nothing creates a permanent Case via old RPC.
4. Original `b8-accountability.html` adds a safe Android-specific retry explanation and explicit separate **Create Another Case** action. This intentionally cannot discard PENDING/unknown outcomes, only already-CONFIRMED requests. Re-entry after reload requires the exact same private fields; no private case title is stored by the helper.
5. All changes exist **only in draft candidate review branch**. No Supabase migration, no Git Main merge, no live B8/News/Ads/Live/Grievance changes. No forced override of 15-minute lock.

## Exact unsatisfied gates
- Real production Supabase still has original Owner case create method; proposed RLS ledger and four-argument idempotent RPC not yet deployed. This branch is a candidate, **NOT an active production P2 fix**.
- Need review/approval of SQL, actual hosted Server AAL2 and replay negatives, real Android browser local durable Storage/Web Locks verification, and protected release approval before using production.
- B11 T075 whole-platform Backup/Media/Auth/Edge/Vercel independent same-point restoration + automatic backup/health monitor remain unsatisfied.
- `T072_CLIENT_UI_PROPOSAL_INTEGRATION=PASS_SCOPED_CI`; `T072_PRODUCTION_P2_FIX=OPEN`; `T072_FINAL_PASS_LOCK=HOLD`; `T075_FINAL_PASS_LOCK=HOLD`.

**No Founder manual steps were necessary for this code-only isolated CI.** Any later Android manual check should be requested as explicit short steps without touching production private data, secrets, or wiping devices.
