# JANTA BOL — PHASE 3C BASELINE AUDIT

## Scope
Reporter + Drone Live Delivery Model ko Phase 3A/3B canonical Live foundation par extend karna. Zero rebuild nahi.

## Verified preservation locks
- JANTA BOL Live Session + Article ID + Permanent Master URL remain canonical.
- Reporter Start intent != public LIVE.
- Public LIVE only after provider/backend confirmation.
- Session permission/revocation/Grant Version/security checks remain authoritative.
- Provider secrets stay server-side until a short-lived one-use handoff is consumed.
- Normal article publishing remains independent of Live/provider failures.

## Ground finding from real test
Existing flow:
Reporter -> OPEN LIVE CAMERA -> `jb-live-api` -> one-use handoff -> `jb-encoder-handoff` -> HTTP 302 -> `larix://...`

On Android/SPCK/Chrome test path, the 302 ended in `ERR_UNKNOWN_URL_SCHEME` even after Larix was installed. This means the security handoff succeeded but the final browser-to-app launch transport was unreliable.

## Production-source safety finding
The uploaded Phase 3B ZIP contains older local copies of deployed Edge Function sources. Production `jb-live-api` is v24 and contains Phase 3B actions, while the ZIP copy does not contain the full deployed Phase 3B API implementation. Therefore Phase 3C must NOT overwrite/deploy those stale local Edge Function copies.

## Phase 3C M1 decision
Do not rebuild Live/provider/session logic. Add a narrow Encoder Launch Adapter:
- Existing `jb-live-api` still creates the one-use handoff.
- New `jb-encoder-launch` consumes the same handoff using the existing authoritative RPC.
- It fetches ingest credentials server-side from the existing YouTube provider adapter.
- It shows a simple user-initiated Android launch button using an explicit Larix Android Intent, with `larix://` fallback.
- Raw RTMP/RTMPS/stream key is never printed to the Reporter.
- Existing `jb-encoder-handoff` remains untouched as rollback/fallback.

## Encoder choice for M1
Primary: Larix Broadcaster because the current 3A architecture already uses Larix Grove and Larix officially supports Android deep-link/QR import of connection + encoder settings. Phase 3C isolates this behind an adapter so a future encoder can replace Larix without changing the canonical Live engine.

## Drone boundary
Phase 3B already has Drone capability + feed-source state. Phase 3C will not fake a secure Ground<->Drone media switch by sharing one permanent stream credential. Real source switching must preserve stale-credential revocation and provider-confirmed source truth before T097-T108 can PASS.
