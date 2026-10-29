# JANTA BOL — Phase 3C Production Status

## M1 — Reporter Live Delivery Adapter
- New Edge Function: `jb-encoder-launch`
- Production status at coding time: ACTIVE v1
- `verify_jwt`: false by design because access is controlled by the existing short-lived, one-use encoder handoff token and server-side consume RPC.
- Existing `jb-live-api`, `jb-live-worker`, `jb-youtube-provider`, `jb-encoder-handoff` were NOT overwritten.
- Existing canonical Live Session / Article / provider-confirmed LIVE truth unchanged.

## Important source-sync warning
The uploaded Phase 3B ZIP contains older local copies of several Edge Function sources than the currently deployed production versions. Do not redeploy those old local copies over production. Phase 3C M1 therefore uses a new isolated function and leaves existing production functions untouched.

## Test status
CODED / PRETEST. No Phase 3A or Phase 3B test is marked PASS from this implementation alone.

## M2 production update
- Migration `phase3c_sync_default_capabilities_on_live_approval`: APPLIED.
- Verification: approval RPC contains 2 default-capability sync calls (fresh + idempotent path).
- Purpose: prevent future approved sessions from missing Phase 3B/3C Reporter capabilities.
- No existing session/article/provider identity was migrated/recreated.

## M3 — Central Live Engine / Encoder Connector Layer
- Production migration `phase3c_m3_central_live_engine`: APPLIED.
- Production follow-up `phase3c_m3_encoder_state_reenable_fix`: APPLIED.
- `jb-live-api`: ACTIVE v25.
- `jb-encoder-launch`: ACTIVE v3.
- Active connector: Larix Broadcaster (`LIMITED`, verified real Live but free-mode branding/limit observed).
- Auto fallback framework: ON.
- Backup connector: not configured until a real alternate encoder is tested; no placeholder is counted as continuity.
- Founder frontend switch UI: CODED in this package; device/browser pretest still required.

M3 central live engine files added.
