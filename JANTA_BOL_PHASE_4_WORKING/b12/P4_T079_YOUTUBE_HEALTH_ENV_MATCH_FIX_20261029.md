# P4-T079 — YouTube health checker matched-pair environment correction
**Date:** 2026-10-29 IST | **Status:** Source fix ready for CI; Google refresh independently DUE.
**Project:** JANTA BOL Supabase `vrffsnkycvjithwtiylt` only. No Cricket/Saarthi resources.

## Actual new Founder evidence
Founder provided screenshot from the actual Supabase `Edge Function Secrets` dashboard showing the names and truncated SHA-256 digests of **both** `JB_DEPLOYMENT_ENV` and `JB_GOOGLE_CREDENTIAL_ENV`; their digests were identical. The digest prefix matches the public known-word SHA-256 of **`development`**. This is a known, noncredential deployment label, not a Google API secret or refresh token. No sensitive secret values or raw private bytes were fetched. The dashboard masks values and cannot prove any Google client publishing status.

The old active production-project Edge functions `jb-youtube-oauth-start` v18 and `jb-youtube-oauth-callback` v16 accept 3 matching, explicit labels `development`, `test`, `production`. Genuine Founder reauthorization at 19:35 IST succeeded on the original JANTA BOL channel. Newly added `jb-youtube-oauth-health` v1 initially hard-coded only the literal `production/production`; this resulted in a real isolated HTTP 503 `OAUTH_ENVIRONMENT_MISMATCH` on 29 Oct despite the correctly paired current `development/development` credentials.

## Narrow repair
In the NEW isolated `jb-youtube-oauth-health` source only, use the **same allowlisted matched-environment rule** as the old functioning OAuth Start/Callback:
- Both env labels must exist and equal one of `development`, `test`, `production`.
- Cross-environment / missing / unknown values still fail closed as `OAUTH_ENVIRONMENT_MISMATCH`.
- Do **not** modify either Supabase Secret or pretend an intentionally development-based integration is production Google app verification.
- Preserve Founder user token getUser + AAL2 + active Owner session, server-only ciphertext, Google client/refresh token, strict expected+verified Channel ID matching, expected YouTube permission, limited CORS, no code that creates a LIVE stream or publishes media.
- The specific health probe is still **one explicit authenticated Founder click**, never called automatically.

## Security scope
This changes ONLY the isolated OAuth **health verifier** and its unit tests. No OAuth Start/Callback, LIVE provider, LIVE Engine, admin login, web domain, article, migration or social API posting modification. No production database write by assistant or key relabeling. Credentials still server-only. Existing verified YouTube `connection_state=CONNECTED`, ID match, `last_refresh_status=NOT_YET_REFRESHED` remain the honest starting point.

## Evidentiary gates
- Offline GitHub CI: strict 4-file change guard, negative cross-env policy, Owner/MFA/AAL2 + no-token leakage + no LIVE side-effects and protected preexisting regression tests.
- After CI, deploy isolated Edge Function as updated version (same slug) with `verify_jwt=true`, no other functions.
- Independently read current metadata before and after, leave status DUE until Founder clicks health check and actual Google refresh/channel check is proven.
- The health verifier in `development` mode can verify currently authorized **development-labelled** credentials used by existing real Founder channel, but must **not** be represented as separately approved YouTube production API publishing.
- If Google denies refresh for another cause, record its safe error, don't auto-reconnect, don't rotate/unset secrets.
- **P4-T079 Final** remains `IN_PROGRESS` until real YouTube news/video API post evidence (E6), and separate other provider proof, are complete.
