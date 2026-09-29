# JANTA BOL — Central Live Engine — Streaming App Connector Contract

## Locked purpose
Reporter ko streaming app technology samajhni nahi hai. Reporter action remains:
`JANTA BOL Login -> approved Live -> LIVE SHURU KAREIN -> camera app -> provider signal -> verified public LIVE`.

Founder ko Live core files edit karke app change nahi karna. Founder Live Control me active app dekhega aur already registered READY/LIMITED connector ko minimum taps me ACTIVE / BACKUP bana sakta hai.

## Central engine boundary
Streaming app is only the mobile encoder connector. It is NOT the JANTA BOL Live identity and it is NOT public truth authority.

JANTA BOL remains master for:
- Article ID
- Live Session ID
- Permanent Master URL
- Reporter/session authority
- provider generation mapping
- verified LIVE / reconnect / end
- audit / revocation

## Connector registry
`live_encoder_connectors` stores safe connector metadata only. No stream key / full RTMPS ingest credential is stored there.

`live_encoder_engine_settings` stores:
- active connector
- backup connector
- auto-fallback flag
- config version

`encoder_handoffs.connector_key` snapshots the selected connector for each short-lived one-use camera handoff.

## Built-in and future hooks
### BUILTIN_LARIX_GROVE
Current compatibility adapter for Larix Grove / Android Intent.

### EDGE_HOOK
Future app can use a dedicated Edge Function named:
`jb-encoder-connector-<app>`

Central launcher calls it server-to-server with short-lived current ingest data and expects:
`{ ok: true, launch_url: "..." }`

A fundamentally different future app can therefore add one isolated connector module without rewriting Reporter UI, Live Session engine, provider truth, worker, Article identity, or Founder switch UI.

## Security locks
- Connector registry/settings/history deny anon/authenticated direct DB access.
- Founder switch API requires Owner + AAL2.
- Reporter still receives only a short-lived one-use handoff URL.
- Provider ingest credential is fetched server-side only at launch time.
- Raw ingest credential is not written to audit logs or connector registry.
- Disabled/retired connector cannot consume a fresh handoff.
- Existing provider-confirmed LIVE rule remains unchanged.

## Failover rule
If ACTIVE connector is unavailable and a valid BACKUP connector is configured, central selection can choose BACKUP when auto fallback is enabled.

Important: continuity is only production-ready after at least one second connector is independently tested and marked switchable. A placeholder connector is not treated as a backup.


## M3.1 DELIVERY MODE LOCK
Connector registry carries `launch_delivery_mode`. `DIRECT_REDIRECT` is for verified deep-link/intent connectors such as Larix. `LOCAL_CLIPBOARD_BRIDGE` is for apps such as LOLS IRL that document paste-based Larix import. Reporter files do not need app-specific rewrites when a future connector fits an existing delivery mode. Supabase Edge Functions stay API-only; frontend HTML is served by the JANTA BOL site/app origin.
