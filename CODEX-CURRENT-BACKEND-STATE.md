# JANTA BOL — CODEX CURRENT BACKEND STATE
Date: 2026-09-29

This file is sanitized. No raw stream key, RTMPS credential, service-role key, OAuth secret, password, access token, refresh token, or Authorization header is included.

## Current deployed Edge Functions
Authoritative deployed source copies are stored under:
`CODEX_CURRENT_SUPABASE/functions/<slug>/index.ts`

- jb-live-api — ACTIVE v26 — verify_jwt=true
- jb-live-worker — ACTIVE v19 — verify_jwt=false
- jb-youtube-provider — ACTIVE v24 — verify_jwt=true
- jb-encoder-handoff — ACTIVE v9 — verify_jwt=false
- jb-encoder-launch — ACTIVE v6 — verify_jwt=false
- jb-encoder-connector-lols — ACTIVE v1 — verify_jwt=false

## Current encoder engine state
- active connector: lols_irl_android
- fallback connector: larix_android
- auto fallback: enabled
- config version: 3

Important: this means an older package/status note that says Larix is active, no backup is configured, jb-live-api is v25, or jb-encoder-launch is v3 is stale.

## Source precedence for Codex investigation
1. Current deployed copies under `CODEX_CURRENT_SUPABASE/` for the six Edge Functions listed above.
2. Current Phase 3C frontend/migration/source package supplied separately.
3. Locked Phase 3A/3B architecture/test requirements.
4. Old Phase-2 snapshot is reference only and must not be modified.

## Known package caveat
The Phase 3C M3.1 ZIP is valid and internally consistent for M3.1, but it contains older local copies of some pre-existing core Edge Functions. Do not redeploy those stale copies over production and do not use them as the authoritative current implementation when a matching file exists under `CODEX_CURRENT_SUPABASE/`.

## Investigation only
Before any coding:
ROOT CAUSE ANALYSIS -> CURRENT ARCHITECTURE MAP -> AFFECTED FILES -> MINIMUM SAFE FIX PLAN -> RISKS -> TEST PLAN.

NO EVIDENCE = NO PASS.
NO PASS = NO LOCK.
