# P4-T079 — YouTube OAuth Health Environment Mismatch: Read-Only Root Cause
Date: 29 October 2026 IST
Project: JANTA BOL / Supabase vrffsnkycvjithwtiylt
Test: Token Refresh E6; **NOT PASS**, no real Google token refresh.
Founder visible safe code: `OAUTH_ENVIRONMENT_MISMATCH`; original health Function HTTP 503.

## Verified deployed source mismatch
Production ACTIVE existing `jb-youtube-oauth-start` v18 and `jb-youtube-oauth-callback` v16 accept the **same recognized** `JB_DEPLOYMENT_ENV` and `JB_GOOGLE_CREDENTIAL_ENV` label when the labels match and belong to `development,test,production`. These two deployed legacy functions performed genuine Founder-authorized Google OAuth reconnection at 2026-10-29 19:35 IST. The **new** isolated `jb-youtube-oauth-health` v1 requires *both* labels to be the exact string `production`; it rejects even paired `test/test` or `development/development` before authenticating Founder or contacting Google.

The exact current values of the two Supabase Edge Function secrets are **not available from the connected Supabase tools** and were NOT accessed here. Their actual deployment classification is not yet conclusively known; avoid guessing it is `test`. Mismatched labels, renamed names, or missing labels could also cause errors if underlying values were modified. Existing legacy OAuth success plus unchanged channel is evidence of a working prior environment binding, but is not a substitute for checking current configuration.

## Real production read-only invariants
- YouTube `connection_state=CONNECTED`; `control_auth_state=OK`, `credential_incident_state=CLEAR`.
- Expected and verified **JANTA BOL** channel IDs equal.
- One active encrypted OAuth refresh record, latest activation Oct 29 19:35 IST; no credential values queried.
- `last_refresh_status=NOT_YET_REFRESHED`. No `youtube_oauth_refresh_verified` success audit.
- Supabase logs: Founder POST `jb-youtube-oauth-health` failed HTTP 503, isolated OPTIONS was HTTP 200. Do **not** run repeated real Google requests while the configuration gate blocks them.

## Safe resolution decision — do not silently lower production trust
1. Authorized Founder inspects **only** current Edge Functions environment-label entries in Supabase Dashboard > Edge Functions > Secrets for this exact project: `JB_DEPLOYMENT_ENV` and `JB_GOOGLE_CREDENTIAL_ENV`. The values are low-privilege environment labels, but **NEVER show/copy Google client secrets, OAuth refresh credentials, service-role keys, tokens or passwords**. If UI masks values, confirm them in the owner account without pasting other secrets into ChatGPT.
2. Check whether the running JANTA BOL system is intentionally in a testing/soft-launch credential environment. Do **not** change either label or Google credential in production solely to make a QA button green; first assess OAuth client Publishing Status and real credential environment, existing LIVE provider isolation, and the original OAuth owner/issuer binding.
3. If original env values genuinely represent production, restore a correct **matching production/production** configuration using Founder-approved secret controls, **without** rotating credentials or weakening the guard. The new health checker keeps the hard stop until its production env is proven.
4. If original environment intentionally remains test/test for controlled soft launch, do NOT relabel it as production deceptively. Run the refresh proof in a properly isolated test credential context with exactly matching Google OAuth app/channel or revise the explicit environment acceptance contract through separate security review. Avoid cross-env credential reuse.
5. Rerun existing Source/ZIP/AAL2/Channel CI and one Founder-triggered refresh after correction, then independently verify Google refresh, returned channel ID, update timestamp and audit. Full T079 social video distribution E6 is still separately due.

**No live secrets changed, no source gate weakened, no repeated Google auth, no production data/YouTube LIVE/post modified by this report. No Fake PASS.**
