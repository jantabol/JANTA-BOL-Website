# JANTA BOL — Phase 3C M3 Affected Files

Purpose: centralize the mobile streaming-app layer under the existing canonical JANTA BOL Live engine without creating a second Live engine.

## New
- `phase3c-m3-central-live-engine.sql`
- `phase3c-live-engine-admin.js`
- `PHASE3C-M3-IMPLEMENTATION-EVIDENCE.md`
- `JB-LIVE-ENGINE-CONNECTOR-CONTRACT.md`

## Extended
- `phase3a-live-client.js` — Founder encoder-registry/switch API wrappers.
- `live.html` — Founder-visible active/backup streaming-app card and minimum-tap switch controls.
- `supabase/functions/jb-live-api/index.ts` — owner+AAL2 encoder overview/switch/state API; Reporter camera handoff now points directly to central launcher.
- `supabase/functions/jb-encoder-launch/index.ts` — central connector router; built-in Larix adapter + future Edge Hook adapter contract.
- `encoder_handoffs` — each one-use handoff snapshots the selected connector key.

## Preserved / Not Rebuilt
- Canonical `live_sessions`, Article ID, Permanent Master URL.
- YouTube provider adapter / provider generation model.
- Provider-confirmed LIVE truth and public projection.
- Durable worker / reconnect / end / revocation model.
- Phase 3B Ground/Drone source authority model.
