# JANTA BOL — P4-T079 Backend Provider Preflight
**29 October 2026 IST** | Master Topic 11, Sections **686–691**, RUN-14 | Required **E2 + E6 + E7**.
**Official state:** **IN_PROGRESS** (Backend/source and live DB read-only verification completed; **REAL_PROVIDER_DUE**). **No final T079 PASS+LOCK** before independently verified real provider accounts, approved scopes and actual E6 positive/negative results.
**Change scope:** only isolated Draft review branch `codex/b12-t079-provider-backend-offline-20261029`, based on previous T078 reviewed candidate; no Vercel deploy, Supabase migration, live credential access, Main merge, payments, publishing, media upload, social post, notifications sent, messaging sent or paid resources. **NO_PRODUCTION_MUTATION**.

## What exactly T079 is meant to prove
Where a real provider is available, verify production Social, Ads Payment, Advertiser Messaging, and External Notifications; provider-specific behaviour must not override source-of-truth website publishing and existing Owner/AAL2 finance/security. Public APIs/secrets remain private. Where a provider is unavailable, classify accurately as DUE (not PASS).

## Real LIVE production read-only E2 audit (JANTA BOL Supabase only)
Authorized Supabase project `vrffsnkycvjithwtiylt`. No mutation/data export; sampled aggregate/ACL only:
| Domain | Existing live proof | Provider/real E2E |
| --- | --- | --- |
| **Social** | `social_distribution` **5** rows, `social_distribution_history` **9**, `social_settings` **1**, global switch **ON**. All three have RLS ON and anon SELECT/INSERT/UPDATE denied. Owner/staff RPCs `jb_social_set_global_internal`, `jb_social_record_attempt_internal`, `jb_social_save_preferences_internal`, `jb_social_history_internal` exist and anonymous EXECUTE denied. | **REAL_PROVIDER_DUE** — No Facebook/Instagram/WhatsApp/YouTube news-post API receipt independently tested; generic manual-share status is NOT proof of posting. Owner must establish actual accounts and approved scopes later. |
| **Ads payment** | `ad_campaigns` **7**; `ad_payments` **0**, LIVE ad campaigns **0**. Tables RLS ON, anon direct access denied; intended Owner manual-payment client refuses old 3-field confirmation. | **REAL_PROVIDER_DUE / no paid activation** — bank/payment integration not needed for news-only soft launch. No dummy payment/receipt or LIVE ad. |
| **Advertiser Messaging** | Existing `advertiser-portal.html` token-based portal and reviewed B7 change/renewal RPC source, no insecure `innerHTML` rendering, campaign/advertiser tables protected by RLS. These are internal portal capabilities, not proof of WhatsApp/SMS/email provider delivery. | **REAL_PROVIDER_DUE** for external delivery provider; existing internal contact/portal remains separate. |
| **Notifications** | Existing B3 `live_notifications` **160**, `notification_delivery_history` **11**, `notification_delivery_outbox` **0**, with RLS ON and anon direct access denied. Original outbox SQL default `PENDING`, service-role-only result operations, dedupe key and retry. | **REAL_PROVIDER_DUE** for external channel E2E. Internal in-app message is **NOT** external `SENT`. |

Actual production also has 100/100 public base tables RLS enabled, verified previously. This T079 audit **does not** claim total authorized-role E2E simply from anon grants.

## Backend source and code-gate E7 (account-independent)
1. Existing T079 classifier `t079-external-provider-failclosed.cjs` prevents an unconnected/unverified provider from yielding `PASS`: `NOT_AVAILABLE_DUE_CANDIDATE` or `PROVIDER_AVAILABLE_NOT_E2E_TESTED`. New **`socialAccountReadiness`** records the four channels, missing ownership/approved provider scopes/server-only credentials/canonical callback checks without accepting access tokens or claiming any successful post.
2. Existing B4 `social.html` prevents choosing `Posted` with missing API; manual share leaves `Manual Share`, not an external provider receipt. Manual browser/native share may be cancelled; it is **not** guaranteed delivery, so independent provider E6 must verify real publish status separately.
3. Existing B7 admin client blocks legacy 3-field payment confirmation and keeps Owner evidence-gated manual verification separate from an independent bank/provider receipt.
4. Existing advertiser portal token-based request/change/renewal remains separate from any external commercial message. No second public publish route or secret-bearing webhook was introduced.
5. Existing B3 external delivery outbox remains optional, `PENDING` before provider response, with service-role-only result handling. Do not count `live_notifications` as actual SMS/WhatsApp/email delivery.
6. Existing YouTube Edge provider is a LIVE integration, **not** evidence that normal news posts can automatically be uploaded to a YouTube channel. No hidden assumptions about Facebook/Instagram/WhatsApp/YouTube API availability or Meta app review.
7. Code-state smoke and fail-closed negative probes must PASS in dedicated GitHub CI; a green run proves **source contract only**, not remote provider E2/E6.

## Founder account phase — future, never silently create accounts
- **Facebook:** JANTA BOL brand Page, correct Founder access and current publishing permission. Account/Page creation or platform approval remains manual.
- **Instagram:** official JANTA BOL professional profile, correct connected Meta assets and necessary current API permissions if automated posting is selected.
- **WhatsApp:** manual native share is different from WhatsApp Business Platform API or Channel publishing. Decide channel vs authorized business messaging before claiming automation; do not infer API access from a personal login.
- **YouTube:** official channel + controlled Google/YouTube permissions. Previously deployed live-stream OAuth must not be reused as news-post authorization without independent approval and verification.
- Social remote E6 proofs: correct canonical Article UUID/URL, only published/Founder-approved news, an actual provider-generated post/reference or equivalent independently verifiable status, duplicate/retry/cancel/network failure, account revoke/expired token, logout/no leaked token, rate-limit/partial failure, no source Article mutation, and full audit. A test post must not be falsely labelled a real news report and no fake news should be published for QA.

**Social accounts will be created and connected only after this Backend-source preflight; no need to ask the Founder for credentials now.** Never paste passwords, secrets or OAuth access/refresh tokens into chat. Real provider app setup must follow each provider's current official onboarding and permissions and any required consent.

## Status / limitations (strict)
- **E2 backend read-only ACL/catalog:** PASS_SCOPED for all four internal domains. Real authenticated role, full hosted payment and external provider E2 is NOT RUN.
- **E7 source boundary & CI:** account-independent coding/test guard in isolated draft branch; verdict only after actual GitHub workflow green.
- **E6 external social/payment/messaging/notification:** **REAL_PROVIDER_DUE** (zero real remote provider success claims).
- **Official P4-T079:** **IN_PROGRESS**, with provider-specific DUE; **NOT** final PASS+LOCK.
- **T078:** prior evidence-gated final BLOCKED remains unchanged.
- **Soft Launch:** Core Article publishing independently operational; no optional paid/social provider allowed to block or alter canonical News. Full B12 release is not authorized by this report.

## Evidence
- Source `ci/phase4/b12/t079-external-provider-failclosed.cjs` and new `ci/phase4/b12/t079-provider-backend.test.cjs`.
- Actual read-only Supabase catalog/aggregate, 2026-10-29 (project locked above).
- Previous B3 and B4 source migrations / existing B7/Phase3 security and payment guards (untouched).
- Dedicated current GitHub CI run link to be verified against exact candidate SHA before marking E7 pass.
