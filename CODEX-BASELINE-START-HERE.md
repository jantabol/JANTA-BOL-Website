# JANTA BOL — CODEX PHASE 3C BASELINE

Purpose: safe Codex investigation workspace for the current Live encoder switching problem.

## Branch safety
- This branch: `phase3c-codex-baseline-2026-09-29`
- Base branch `main` must not be modified during investigation.
- `phase2-snapshot-2026-09-19` is an old safe snapshot/reference and must not be modified.

## Current investigation target
Investigate the replaceable encoder/app integration layer for JANTA BOL Live Reporting.

Existing locked behavior to preserve:
- canonical JANTA BOL Live Session identity
- Article ID / permanent master URL
- Reporter authentication and session-scoped permission
- one-use short-lived encoder handoff
- provider generation / credential lifecycle
- reconnect/revoke/end behavior
- public LIVE only after backend/provider confirmation
- no raw stream key / full RTMPS credential in normal logs or prompts

Known field observations:
- Larix Broadcaster completed end-to-end Live successfully, but free mode has subscription/test-stream limitations.
- LOLS IRL is the current free candidate and accepts Larix-format configuration import.
- Current unresolved area is reliable Android/browser/app handoff and minimum-tap encoder switching without rewriting the core Live system.
- SPCK Preview has shown `ERR_UNKNOWN_URL_SCHEME` for Android `intent://` launch.
- A previous Supabase-hosted HTML bridge rendered as raw text, so the bridge was moved toward local/frontend delivery.

## Investigation rule
FIRST:
1. Root cause analysis
2. Current architecture map
3. Affected files
4. Minimum safe fix plan
5. Risks
6. Test plan

DO NOT make code changes until Founder explicitly approves implementation.

Golden rule:
NO EVIDENCE = NO PASS
NO PASS = NO LOCK

## Security
Never request or expose:
- raw stream key
- full RTMPS credential URL
- Supabase service-role key
- passwords
- OAuth client secret
- access/refresh tokens
- authorization headers

The current Phase 3C working source package will be supplied separately on this branch before analysis starts.
