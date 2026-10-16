# JANTA BOL — P4-T034 / E7 Android owner review + ADS-009 anon source audit
**Date:** 16 October 2026 (IST)  
**Project:** JANTA BOL ONLY, Supabase `vrffsnkycvjithwtiylt`  
**Scope:** Advertising Owner E7; ADS-006/007 supporting evidence; ADS-009 **read-only privilege PRECHECK**, not E5 acceptance.  
**Disposition:** E7 owner review trace **PASS**; anon schema permission precheck **PASS (limited)**; T034 final **HOLD**.

## E7 Android + persistent data (real evidence)
Founder on Android tablet (Incognito with Owner sign-in) used the actual B7 Advertising Owner Queue to:
1. Select `Pending / recheck`; save the non-sensitive test note and verification history.
2. Apply transition `requested -> review` with an audit note to existing, explicitly test-labeled campaign `B7 T034 ARTICLE E7 TEST`.
3. Observe new-request `Pending` badge from **5 to 4**.
4. Reopen **the exact reviewed campaign** using Chrome Find in page (`B7 T034`, **1/1 match**), showing status **review**, verification **pending**, and Owner management controls.

**Independent Supabase SELECT-only confirmation after Android actions:**
- Exactly one campaign status = `review`; `requested` = 4; `payment_pending` = 2.
- Test campaign ID `9b479d9f-2561-4aa5-879a-2f8dd4a68db3`: `status=review`, `verification_state=pending`, one `ad_history.event_type=review` record.
- Earlier `ad_history.event_type=verification_pending` persisted, the entered note matched the test; no financial approval/live claimed.

**Actual root-cause correction:** The previous claim that `review` campaigns disappeared was **incorrect**. Deployed historical Owner UI lists ALL campaigns and sorts requested first, so reviewed cards are farther down. Backend owner `adRows()` queries all `ad_campaigns` without `status=requested` filter. The badge intentionally counts only new `requested`. No backend loss / no SQL fix.

## Optional E7 usability enhancement (separate from old workflow correctness)
[PR #27](https://github.com/jantabol/JANTA-BOL-Website/pull/27) **merged** to existing B7 working branch `codex/b7-t034-safe-guard-20261013`, commit `d41e9eddbe10d2aade0d4936192129a719ff3dc0`. Add *read-only UI filter* `Manage campaigns by status` with `Under review`, preserving old `Pending` count and underlying Owner/RLS authority. [FAKE CI run 38866541524](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38866541524) PASS; PR-triggered CI 38866610345 PASS. Vercel scoped preview `shubham-pichhore-2028-ka8mo5e4a-shubhamshrivastava295-9848.vercel.app` is READY and bound to that exact commit. **New filter real Android visual confirmation still DUE**: Founder's later screenshots were on an older `8wayuvfg0` preview and did not show the new dropdown. Do NOT call filtered UI E3 PASS based solely on FAKE CI or old URL.

## ADS-009 public privilege READ-ONLY audit (16 Oct)
Actual live catalog (no dummy identities, no JWT/session impersonation, no database mutation):
- On `public.ad_campaigns`, `advertisers`, `ad_history`, `ad_payments`, `ad_creatives`: RLS enabled, **anon SELECT/UPDATE/INSERT all false**, no direct `anon` policies.
- `public.jb_ad_approve_creative_internal`, `jb_ad_verify_advertiser_internal`, `jb_ad_confirm_payment_internal`: `anon EXECUTE = false`, `authenticated EXECUTE = true`. All three `SECURITY DEFINER`; authenticated permission alone is **NOT** sufficient authority proof — underlying Owner/AAL2 guards need genuine JWT-principal negative tests.
- `ad_campaigns` has authenticated read policy `private.p4_staff_allowed()` (no unqualified public Owner data exposure implied).

**Meaning:** Expected anonymous direct table/RPC denial is **schema-permission precheck PASS**, not a real unauthenticated browser/JWT test, nor reporter/advertiser/AAL1/revoked principal E5. Those remain **HOLD** until actual identities/session checks show denied backend calls with unchanged state/audit.

## Next minimum-real gate
- **ADS-009 E5 unauthenticated browser negative:** open the *exact reviewed B7 ads.html URL* in a genuinely logged-out browser session. Expect redirect/access denial or no protected queue details and no private contacts. Never confuse a NEW tab with a fresh anonymous session (Incognito tabs share login).
- Capture the HTTP/UI observation without entering any credentials in chat.
- Then genuine reporter/advertiser/Owner AAL1/revoked test in controlled safe environment, keeping live rows unchanged and Owner AAL2 positive separately.
- Independently reconcile ADS-001…009 E2/E3/E5 before **P4-T034 PASS+LOCK**. Preserve previously passed real DB backup/isolated restore G3 and deployed ADS008 guard (main evidence CP06/CP07). Do not rerun owner paper AGE key or real production restore only for E7.

**No fake PASS; no old B7 rebuild; no production SQL writes in this evidence checkpoint.**
