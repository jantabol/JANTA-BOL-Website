# JANTA BOL — P4-T034 CP13 — LIVE Hosted JWT Authenticity & Principal Preflight

**Date:** 16 Oct 2026 (IST)  
**Official verdict:** CP13 **forged/invalid JWT negative 4/4 PASS (LIVE)**; genuine hosted reporter/advertiser/Owner AAL1/AAL2/revoked session **HOLD**; T034 Final PASS+LOCK **HOLD**.

## Strict execution scope
No hosted staging environment created; no real user or Founder credentials, account creation, OTP, Auth tokens or session modifications; no payment/advertisement submission or real data writes. Public frontend publishable key only. Test code and report added to review-only branch, not B7/main.

### Exact provenance
- Repository: `jantabol/JANTA-BOL-Website`.
- Canonical B7 source SHA: `bd03084b0e42f8d1a65c53a4a047f6c8686a51a8` (unchanged during this CP13).
- Test path: `ci/phase4/b7-t034-cp13-hosted-jwt-negative.cjs`.
- Workflow: `.github/workflows/b7-t034-cp13-hosted-jwt-negative.yml`.
- Successful test-source SHA: `9e53e6206b48429b86ad7f07c8074682a9c2a340`.
- GitHub Actions **[LIVE HTTP CI run #38889860985](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38889860985)**, job **116936444794**, **SUCCESS**.

### Actual LIVE HTTP GET observations
Locally HMAC-signed synthetic tokens with claimed owner AAL2/verified-looking `sub`, fake `app_metadata`, and expired `exp` were submitted via HTTPS to actual production APIs. These are **deliberately invalid signatures**, not Supabase-generated user tokens. Server responses recorded without response bodies, raw JWT, private data, or credential disclosure:

| Check (none creates or changes any row) | Target | HTTP | Result |
| --- | --- | --- | --- |
| Forged Owner AAL2 | PostgREST `GET /rest/v1/ad_campaigns?select=id&limit=1` | **401** | Denied PASS |
| Forged app_metadata Owner | PostgREST `GET /rest/v1/advertisers?select=id&limit=1` | **401** | Denied PASS |
| Forged expired Owner | PostgREST `GET /rest/v1/ad_campaigns?select=id&limit=1` | **401** | Denied PASS |
| Forged Owner AAL2 | GoTrue `GET /auth/v1/user` | **403** | Invalid JWT denied PASS |

These prove production JWT signature validation does **not** accept self-signed Owner claims. They do **NOT** prove authorization of genuine reporter, advertiser, revoked real session, or real Owner AAL2 JWTs.

### Exact initial CI failure and RCA
1. Initial run **[#38889758359](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38889758359) FAIL** because test asserted HTTP **401 only** for both PostgREST and GoTrue; actual GoTrue invalid signature responded HTTP **403** (denial, not access). All 3 PostgREST cases had already returned 401.
2. Independent RCA against actual logs and Supabase Auth errors: **GoTrue uses 403 `bad_jwt` for some invalid JWTs**, while PostgREST uses 401. The minimum test-only fix permits 403 **only for GoTrue when an explicit invalid-JWT error classification matches**; PostgREST still requires 401. No production code, schema, auth settings, or access grants changed.
3. Successful final run **#38889860985** yielded `PASS CP13 HOSTED JWTS SIGNATURE NEGATIVES=4/4`; `ALL_METHODS_GET_ONLY; NO_REAL_JWT; NO_USER_LOGIN; NO_LIVE_WRITES`.

### Independent LIVE catalog and data consistency
READ-ONLY actual Supabase catalog confirmed:
- Auth-sensitive Owner RPCs `jb_ad_approve_creative_internal`, `jb_ad_confirm_payment_internal`, `jb_ad_record_payment_internal`, `jb_ad_transition_internal`, `jb_ad_verify_advertiser_internal` are SECURITY DEFINER, **anon EXECUTE=false**, authenticated EXECUTE=true, and bodies each check `private.p4_owner_allowed()`. **Source check only**, not positive live E5.
- Live `public.advertisers`, `ad_campaigns`, `ad_creatives`, `ad_history` have authenticated SELECT policies gated by `private.p4_staff_allowed()`. `ad_payments` has RLS enabled with no public policy; all five tables already denied anon HTTP reads 5/5 in CP12.
- `private.current_owner_aal2()` checks `auth.jwt()->>'aal'='aal2'` and `private.current_session_active()`; role is derived from `public.user_roles`, not client editable user_metadata.
- Production principal inventory **counts only**: Owner=1, Reporter=2, Editor=1, `advertiser_users` linked Auth rows=**0**. Existing account rows are NOT proof of accessible usable JWT/OTP. Real advertiser principal must be provisioned in isolated staging; never link a real production advertiser without permission.
- Before/after LIVE database: advertisers **7→7**, campaigns **7→7**, ad_history **29→29**, payments **0→0**, live **0→0**.

### Read-only Security Advisor findings (not auto-classified as defects)
- `rls_enabled_no_policy`: 10 **INFO** total; protected ad tables such as `ad_payments`, portal sessions/credentials are among them. An RLS table with no policies is deny-by-default to normal roles, not necessarily a vulnerability.
- `anon_security_definer_function_executable`: 13 **WARN** total, of which 8 `jb_ad_*` public endpoints. Some are intentionally anonymous (public enquiries, public feed, credential-based advertiser portal); each requires separate exact intent and input/abuse review before deciding to change `EXECUTE` permissions. **Do not blanket revoke** because this would break previously PASS public functionality.
- `authenticated_security_definer_function_executable`: 61 **WARN** total; includes multiple intended Owner guard RPCs. Authenticate alone does not imply authorization; existing Owner helper code is a partial source safeguard.
- `auth_leaked_password_protection`: 1 **WARN**. Security config warning is **not fixed** under T034.
- Source: Supabase Advisor READ ONLY on 2026-10-16. `anon_security_definer_function_executable` advisory reference: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable

## New hosted test environment gate — Founder decision required
- Supabase quote for a NEW project in JANTA BOL organization `pnkatuwzdkyyjfbivkua`: **$0/month** (subject to free-tier quotas; no billing or project-availability guarantee); an isolated branch of existing project quoted **$0.01344/hour** (NOT authorized).
- Existing Supabase list returned **one accessible project** in this connection: the live JANTA BOL production project. No test project or branch created.
- Developer tool requirement: **ask Founder to choose organization** before creating even a free project. Suggest **JANTA BOL organization (NOT Cricket project)** with Founder approval. Then isolated disposable hosted test principal creation, MFA and RPC validation; no production/Cricket data.
- Must map actual migrations/source, preserve original roles, config, privileges and gates. Positive tests only on isolated fixtures; never actual business payments.

**Evidence-backed official status:** CP11 genuine LOCAL GoTrue PASS, CP12 LIVE no-JWT private GET 5/5 PASS, CP13 LIVE forged-JWT GET 4/4 PASS, genuine HOSTED Role/AAL2/Revoked E5 still **HOLD**; all ADS001–009 final and T034 PASS/LOCK **HOLD**. No fake pass or unapproved production changes.
