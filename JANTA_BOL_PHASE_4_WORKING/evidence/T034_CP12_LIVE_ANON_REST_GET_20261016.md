# JANTA BOL — P4-T034 CP12: LIVE DEPLOYED ANONYMOUS REST (GET-ONLY) EVIDENCE

Date: **2026-10-16 (IST)**  
Scope: **ADS009 only, LIVE Supabase anonymous Data API direct-table denial**.  
Official status: **ADS009 CP12 anonymous live REST 5/5 PASS (scoped). T034 FINAL PASS + LOCK HOLD.**

## Live source, test, and exact proof
- Project: `vrffsnkycvjithwtiylt` (JANTA BOL ONLY). Runtime endpoint `https://vrffsnkycvjithwtiylt.supabase.co`.
- Base source: `codex/b7-t034-safe-guard-20261013` at `bd03084b0e42f8d1a65c53a4a047f6c8686a51a8`.
- Execution branch: `review/t034-e5-preflight-reconcile-20261016`; source SHA `02cfd167f3c11634e6dd93ae638e52d6fbe05af6` (test source/scripts only).
- GitHub Actions workflow: `.github/workflows/b7-t034-cp12-live-anon-readonly.yml`.
- Node HTTP test: `ci/phase4/b7-t034-cp12-live-anon-readonly.cjs`.
- **ACTUAL LIVE HTTP GET run [38889066839](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38889066839)**, job **116933860323**, conclusion **SUCCESS**, independent GitHub job logs verified.
- Supabase `get_publishable_keys` read-only confirms the public publishable key already in reviewed B7 `supabase-config.js` is ACTIVE. Test reads it from public frontend code at runtime: **no Owner password, OTP, service key, real JWT, cookies, or privileged credentials**.
- All requests HTTPS; `GET` only; the request includes `apikey` publishable key and **NO `Authorization` or Auth user JWT**; exact project fixed in code. No RPC/POST/PATCH/DELETE. Response content was never logged, only HTTP status and SQLSTATE, so no contacts/PII were printed.

## Five independent LIVE HTTP observations
| Direct private Data API read | HTTP | Postgres SQLSTATE | Result |
| --- | ---: | --- | --- |
| GET `/rest/v1/advertisers?select=id&limit=1` | **401** | **42501** | Permission denied PASS |
| GET `/rest/v1/ad_campaigns?select=id&limit=1` | **401** | **42501** | Permission denied PASS |
| GET `/rest/v1/ad_history?select=id&limit=1` | **401** | **42501** | Permission denied PASS |
| GET `/rest/v1/ad_creatives?select=id&limit=1` | **401** | **42501** | Permission denied PASS |
| GET `/rest/v1/ad_payments?select=id&limit=1` | **401** | **42501** | Permission denied PASS |

These are **real external network calls to LIVE JANTA BOL's REST Data API**, not browser screenshot, not local Postgres fixture, not mocked or guessed, and not just missing API key. Every response is a real Postgres role permission denial; no private rows were returned or printed.

## Independent LIVE Supabase catalog and data before/after
- Immediately before HTTP: advertisers `7`, campaigns `7`, history `29`, payments `0`, live campaigns `0`.
- Immediately after HTTP: advertisers `7`, campaigns `7`, history `29`, payments `0`, live campaigns `0`.
- Real live catalog: each of five tables has `RLS enabled`; `anon` direct SELECT/INSERT/UPDATE privilege all `FALSE`.
- Actual live Owner-sensitive RPCs inspected without calls: `jb_ad_approve_creative_internal(uuid)`, `jb_ad_confirm_payment_internal(uuid,text,bigint)`, `jb_ad_record_payment_internal(uuid,text,text,bigint,text,boolean)`, `jb_ad_transition_internal(uuid,text,text)`, `jb_ad_verify_advertiser_internal(uuid,text,text,text)` are all `SECURITY DEFINER`, with `anon EXECUTE=false`, `authenticated EXECUTE=true` and text contains `private.p4_owner_allowed()`. **Catalog/source findings are NOT genuine JWT-runtime tests.**
- Production security triggers untouched. No new Supabase project/branch, no signups or role changes, no payment or ad submission, no Founder session touched.
- Historical ADS009 Android fresh-incognito Owner login screen PASS preserved without repeating it. Previous local genuine GoTrue MFA/revoke CP11 PASS preserved.

## Pending acceptance — do not conflate scopes
1. **Real hosted authenticated E5:** reporter, advertiser, revoked, Owner AAL1 and Owner AAL2 HTTP requests and audit in safe **controlled staging**, or equivalent dedicated test identities. Need real hosted sessions and no production privilege/payment mutation. The local GoTrue suite was correctly scoped to local service.
2. **Real public request/receipt E2** ADS001–ADS005 controlled backend positives and abuse negatives still need reconciliation. Never post dummy production contact/payload without Founder consent.
3. **E3** new exact-preview `Manage campaigns by status` dropdown Android verification and other genuine outstanding UI cells. Already proven article CTA/origin, invalid number, consent, Owner review and fresh-incognito login should not repeat.
4. **ADS001–ADS009** checklist + affected Phase3/B7 regression before final PASS/LOCK. No final ZIP until then.

**CP12 live anonymous private-table data isolation: 5/5 PASS; deployed authenticated principals & final P4-T034 PASS: HOLD. NO FAKE PASS; NO REBUILD.**
