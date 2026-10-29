# JANTA BOL — Phase 3C M3.1 LOLS IRL Local Bridge — Implementation Evidence

Status: CODED + BACKEND DEPLOYED / REAL LOLS LIVE TEST STILL PENDING.

## Root cause fixed
Supabase hosted Edge Functions on the shared `*.supabase.co` domain rewrite GET `text/html` responses to `text/plain`. Therefore the first LOLS intermediate HTML page appeared as raw source even when the function set an HTML Content-Type.

## Fix
- Edge Function remains API-only.
- `jb-encoder-launch` returns JSON for connectors whose delivery mode is `LOCAL_CLIPBOARD_BRIDGE`.
- New static `encoder-setup.html` runs inside the JANTA BOL frontend origin, fetches the one-use handoff JSON, never displays the RTMPS credential, copies the short-lived Larix-format setup only after a user tap, then opens the selected encoder app.
- Reporter UI chooses the delivery path from registry-driven `connector_delivery_mode`; it does not hard-code LOLS behavior as the permanent architecture rule.
- Larix keeps `DIRECT_REDIRECT` and the already-proven flow is preserved.

## Security properties
- No raw stream key is written to JANTA BOL frontend files.
- Handoff remains one-use and short-lived.
- Config is returned only after server-side assignment/member/generation revalidation.
- Config is kept in page memory; it is not placed in the browser URL.
- Cache disabled and referrer suppressed.
- Public LIVE remains provider-confirmed only.
