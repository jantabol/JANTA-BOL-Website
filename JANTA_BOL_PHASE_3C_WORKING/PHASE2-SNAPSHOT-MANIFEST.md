# JANTA BOL — PHASE 2 SNAPSHOT

Snapshot date: 2026-09-19

## Contents
- 45/45 source files preserved in this snapshot folder.
- Source archive SHA-256: 5994a05f21e9bc92cd78570ebaa317b6a35a443a79b169340447485e09f1d326
- Combined PDF SHA-256: f372ac305994f9aaa180b44276d372746794636d31bf4ee100c7d3288ca9a9f8

## Phase-2 test status note
- Total tests: 129
- 125 PASS / completed
- 4 DUE / deferred: #017, #018, #099, #100
- #099/#100 remain platform-limited in SPCK Preview/WebView and require supported-device credential testing.
- No test should be marked PASS without real evidence.

## Security note
- No Recovery Key, TOTP seed/QR, service-role key, password, or other private production secret is intentionally stored in this snapshot.
- `supabase-config.js` contains only the client-side publishable key used by the application.

## Preservation rule
This branch is a Phase-2 snapshot. Do not rewrite or delete the earlier working `main` history merely to match this snapshot.
