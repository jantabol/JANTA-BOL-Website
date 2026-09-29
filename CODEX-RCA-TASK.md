# JANTA BOL — CODEX FIRST TASK — ANALYSIS ONLY

## MODE
INVESTIGATION / RCA ONLY.

DO NOT:
- modify files
- create commits
- create a pull request
- deploy Supabase functions
- run destructive SQL
- rotate/revoke credentials
- change `main`
- change `phase2-snapshot-2026-09-19`

Explain findings in simple Hinglish for a non-coder Founder. Technical names may remain in English.

## SOURCE PRECEDENCE
When sources conflict, use this order:

1. `CODEX_CURRENT_SUPABASE/` — current deployed backend source/state.
2. Current files under `JANTA_BOL_PHASE_3C_WORKING/`.
3. `CODEX-CURRENT-BACKEND-STATE.md`.
4. Phase 3A/3B locked architecture/test requirements described below.
5. Older status/evidence files only as historical context.

IMPORTANT:
Some older package documents/function copies contain stale production version numbers. Do not propose redeploying a stale copy over current production.

## CURRENT DEPLOYED BACKEND
Current verified function versions:
- jb-live-api v26
- jb-live-worker v19
- jb-youtube-provider v24
- jb-encoder-handoff v9
- jb-encoder-launch v6
- jb-encoder-connector-lols v1

Current encoder engine:
- active = lols_irl_android
- fallback = larix_android
- auto fallback = ON
- config version = 3

## LOCKED CORE ARCHITECTURE — MUST PRESERVE
JANTA BOL remains authority for:
- Article ID
- Live Session ID
- Permanent Master URL
- Reporter authentication/session authority
- Live membership + Grant Version
- Provider Generation
- reconnect/revoke/end behavior
- provider-confirmed public LIVE truth
- audit history

Encoder app is only an external contribution/camera connector. It must not become the canonical Live identity or public-LIVE authority.

Security locks:
- one-use short-lived encoder handoff
- consumed handoff cannot be reused
- stale grant/provider generation rejected
- no raw stream key in normal DB tables/logs/prompts
- no full RTMPS credential in normal logs/prompts
- no OAuth secret/access/refresh token in logs/prompts
- public LIVE remains OFF until backend/provider confirms actual signal and provider Live lifecycle

## BUSINESS/UX GOAL
Reporter should have a simple flow:
JANTA BOL login
-> Live Request
-> Admin approval
-> LIVE SHURU KAREIN / Open Live Camera
-> approved encoder app opens
-> Reporter starts camera
-> backend/provider confirms signal
-> public JANTA BOL Live becomes LIVE.

Today the approved encoder may be Larix; tomorrow LOLS IRL or another approved Android encoder. Adding/switching an encoder must not require rebuilding the canonical Live engine.

Founder should be able to select ACTIVE/BACKUP registered connectors with minimal safe changes.

## FIELD EVIDENCE ALREADY OBSERVED

### Larix
Larix completed a real end-to-end JANTA BOL test:
request -> approval -> provider ready -> handoff -> actual encoder signal -> provider-confirmed LIVE -> public playback -> Reporter END -> backend ENDED/Public OFF.

But Larix free mode showed visible TEST STREAM / POWERED BY LARIX limitations and subscription friction.

### LOLS IRL
LOLS IRL is installed and its camera works on the test Android device.
Observed settings support:
Settings -> Backup -> Import from IRL Pro / Larix
and accepts a Larix-format setup URI.

Current LOLS connector:
- key lols_irl_android
- EDGE_HOOK
- Android package gg.lols.irl
- state LIMITED/PILOT
- RTMPS supported
- manual import currently required

### Raw HTML problem — fixed direction
An earlier Supabase Edge Function HTML bridge rendered HTML source as text.
The architecture was changed so Edge Functions stay API-only and static `encoder-setup.html` runs on the frontend origin.

### Current unresolved practical failure
From SPCK Preview on Android:
Reporter -> LIVE SHURU KAREIN -> local `encoder-setup.html`
-> user taps “Setup copy karke LOLS IRL kholo”
-> browser/WebView tries Android `intent://...`
-> `net::ERR_UNKNOWN_URL_SCHEME`

Manual open + LOLS import/paste is possible, but the intended simple camera-launch path is not yet settled/proven.

Do not assume that a Chrome-installed/deployed site behaves exactly like SPCK Preview WebView. Determine what the code guarantees and what must be proven on-device.

## CURRENT CODE AREAS TO TRACE
At minimum inspect:
- `JANTA_BOL_PHASE_3C_WORKING/reporter-live.html`
- `JANTA_BOL_PHASE_3C_WORKING/encoder-setup.html`
- `JANTA_BOL_PHASE_3C_WORKING/phase3c-live-delivery.js`
- `JANTA_BOL_PHASE_3C_WORKING/live.html`
- `JANTA_BOL_PHASE_3C_WORKING/phase3a-live-client.js`
- `JANTA_BOL_PHASE_3C_WORKING/phase3c-live-engine-admin.js`
- `JANTA_BOL_PHASE_3C_WORKING/JB-LIVE-ENGINE-CONNECTOR-CONTRACT.md`
- current deployed `CODEX_CURRENT_SUPABASE/functions/jb-live-api/index.ts`
- current deployed `CODEX_CURRENT_SUPABASE/functions/jb-encoder-launch/index.ts`
- current deployed `CODEX_CURRENT_SUPABASE/functions/jb-encoder-connector-lols/index.ts`
- current deployed worker/provider/handoff functions as needed
- `CODEX_CURRENT_SUPABASE/CURRENT-LIVE-DB-FUNCTIONS.md`
- relevant Phase 3C migration/architecture files

Trace the complete route:
Reporter click
-> reporter_prepare_camera
-> handoff creation
-> selected connector/delivery mode
-> frontend bridge
-> handoff consumption
-> ingest/config generation
-> Android app launch/import
-> provider signal
-> verified LIVE transition.

## RELEVANT LOCKED TEST INTENT
Preserve at least these requirements:
- Phase 3A P1 T044–T050: approval-to-camera taps, Start != public LIVE, no-signal behavior, READY != LIVE, provider confirmation -> public LIVE.
- Phase 3A P3 T010–T013: authorized encoder handoff, handoff vs credential lifetime, token-hash storage, no handoff reuse.
- Phase 3A P4 T046–T053: wrong Reporter blocked, one-use/expired/reopen handoff, no raw key storage/logging, signal-active, provider transition, public viewer truth.
- Phase 3B T001–T008 baseline preservation, especially T005: button/start intent must never become public LIVE until backend/provider confirmation.

Do not mark any test PASS from static code inspection alone if real-device/provider evidence is required.

## QUESTIONS TO ANSWER

Return exactly these sections:

### 1. ROOT CAUSE
Separate:
- confirmed code-level cause(s)
- environment-specific cause(s), especially SPCK Preview/WebView vs real Chrome
- assumptions that still need evidence

### 2. CURRENT ARCHITECTURE MAP
Give a concise end-to-end map with exact files/functions responsible at each step.
Clearly identify:
- canonical core
- connector-specific layer
- frontend/browser-to-app launch layer

### 3. AFFECTED FILES
For each file/function that would need a fix, say WHY.
Also explicitly list important core files/functions that should NOT be changed.

### 4. MINIMUM SAFE FIX PLAN
Prefer the smallest connector/delivery-layer fix.
Do not redesign the Live engine unless evidence proves the core is the cause.
Explain whether the correct solution should be:
- Chrome/deployed-site testing only,
- a safer Android launch fallback,
- a two-button Copy Setup + Open App flow,
- package/deep-link handling,
- or another minimal approach supported by the code.

Do not implement it yet.

### 5. RISKS
Cover:
- credential exposure
- one-use handoff consumed too early
- browser clipboard restrictions
- intent/deep-link compatibility
- accidental duplicate Live engine/state
- stale backend source overwrite
- regression to Larix
- false public LIVE

### 6. TEST PLAN
Give ordered tests from cheapest/safest to real-device/provider test.
Include expected evidence for each.
Must include:
- SPCK Preview behavior
- Android Chrome behavior
- LOLS installed/not-installed behavior
- clipboard/import path
- one-use expiry/retry
- Larix regression
- WAITING_SIGNAL/Public OFF before actual signal
- real LOLS signal -> provider-confirmed LIVE
- public playback
- END Live cleanup
- no secret leakage in logs/UI

### 7. RECOMMENDATION TO FOUNDER
In simple Hinglish:
- what is actually broken
- what is not broken
- smallest next move
- what evidence is still missing

End with this exact line:
`ANALYSIS COMPLETE — NO CODE CHANGES MADE`

## GOLDEN RULE
NO EVIDENCE = NO PASS
NO PASS = NO LOCK
