# JANTA BOL — P4-T035 / CP05 CONSOLIDATED REAL ANDROID E3 + LIVE BACKEND E2 GATE

**Date:** 16 October 2026 (IST)
**Founder instruction:** Minimum process → maximum output; soft launch NEWS + contact-only ads first. First paid-ad onboarding/payment and protected media activation happen **later, before first actual paid ad LIVE**. Previous E3 screenshots and reports must not be repeated without necessity.
**Official verdict:** **CONTACT-ONLY SOFT-LAUNCH AD-MEDIA UI SCOPED PASS**; P4-T035 ADS-010..015 **CANONICAL FINAL PASS+LOCK HOLD** (genuine approved paid media/geo real E2 and E3 DUE).

## Exact source/proof provenance
- Existing branch: `review/t035-cp02-media-safe-20261016`; baseline `codex/b7-t034-safe-guard-20261013` at `bd03084b0e42f8d1a65c53a4a047f6c8686a51a8` unchanged. PR #30 remains DRAFT; no production merge.
- Founder used Android Chrome **real Vercel Preview Ad Studio**, previously verified Vercel deployment `dpl_5XdZMutNujbnaU5U1gUbskSgSHBg`, deployment SHA `a1f6135cc72e94dca1a2da9a610cfcdf2bd9f38d`, nested app `/JANTA_BOL_PHASE_3C_WORKING/ads.html`. This is a PREVIEW, not production official domain.
- Manual real Android screens supplied in the conversation between 17:36 and 17:51 IST: Owner queue + creative tools (visibility only); JPEG portrait; remove-selected-file; Video mode with MP4 preview; Text mode after Video; Hindi+English typed text. Screens contain optional private business/contact/photo details: **do not copy private phone numbers, faces or whole screenshots into the public repo**.
- CP02 media CI exact production-source candidate [#38897808960](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38897808960) SUCCESS. CP03 Chromium (synthetic Article) and isolated PostgreSQL LGD tests [#38897809134](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38897809134) SUCCESS, but not real Android/public paid ad E3 or actual Gov LGD E2. CP04 deployed HTTPS 4/4 [#38897808995](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38897808995) SUCCESS.
- P4-T035 source of truth: user-provided 37-page B7 FINAL MASTER BLUEPRINT WITH TESTS, ADS-010..015. Changes to the canonical criteria are **not** authorized.

## Founder manual E3 observations — exact narrow verdicts
| Subtest | Actual observable / Founder attestation | Status |
| --- | --- | --- |
| ADS-010 Portrait image local preview | Android `6540.jpg` chosen, 2448 × 3264 pixel, ratio 0.750 (3:4), full subject visible with `object-fit:contain` presentation; no noticeable crop or stretch | **REAL ANDROID LOCAL PREVIEW PASS (3:4 ONLY)** |
| ADS-010 4:5 | Camera UI offers 1:1 / 3:4 / 9:16 / Full; user could not select exact 4:5. No 4:5 source/EXIF orientation proof | **DUE** |
| ADS-015 Remove local file | Android shows `No file chosen`, previous image gone, explicit `Local file cleared — nothing uploaded.` | **REAL ANDROID UI PASS** (not proof of server deletion or server-side security) |
| ADS-011 Local MP4 preview | Android `5956.mp4`, player shows portrait 1080 × 1920 (9:16), duration **15.6 seconds**, play controls displayed; Founder explicitly stated complete playback worked without problem | **REAL ANDROID LOCAL PLAYBACK PASS** (self-reported playback; static screenshot alone proves player/control display) |
| ADS-011 15 sec duration enforcement | Local video **15.6s exceeds locked 15.0s**, UI warns server must verify limit. No approved server-upload/media post process performed | **SERVER 15S HARD GATE DUE**; never claim this file acceptable for paid ad |
| ADS-015 Video→Text mode | UI changed to Text and previous video preview/chooser disappeared; actual internal stale-selection clearing previously isolated CI passed | **REAL ANDROID VISIBLE SWITCH PASS**, internal state checked separately in CI, not by screenshot alone |
| ADS-012 Text editor | Hindi + English text typed, `No CTA` shown, pending draft/explicit approval separate, and no Save clicked | **REAL ANDROID LOCAL EDITOR PASS**; real public ad text/card with visible label **NOT RUN** |
| ADS-013 Paragraph / one-ad slot | Real Chromium E1 fixture tested 0/1/2/3/10 with unmodified Article ID; no paid ad enabled or present | **SOURCE+CHROMIUM E1 PASS**; real paid-ad E2/E3 **DUE** |
| ADS-014 verified geography | Disposable Postgres 25 synthetic geo matching cases pass. Actual frontend Gwalior Article scope is still `global` because legacy `scopeForArticle` lacks authoritative pairing | **SYNTHETIC PG PASS; REAL VERIFIED LGD/ARTICLE ID E2/E3 DUE** |

**E3 photos are only visual evidence.** Claim only visible UI/progress and the Founder's explicitly reported end-to-end 15.6 sec playback. Do not infer origin metadata/GPS stripping, server upload, video-approval success, browser-network privacy, or actual paid-ad pixel rendering from local preview.

## NEW Independent LIVE Supabase READ-ONLY E2 readiness audit
Project: JANTA BOL ONLY `vrffsnkycvjithwtiylt`, no disposable Supabase project or charge.
Used connected Supabase read-only `SELECT` on pg_catalog, ad aggregates, storage bucket metadata (names only, no objects), function definitions and current triggers. No user rows/identities/phone numbers/media URLs returned to report.

### Live counts before/after
- `public.ad_creatives`: **8 unapproved image**, **1 approved image**, **1 unapproved text**, **1 unapproved video**, total **11** creative rows.
- `public.ad_campaigns`: **7 total / 0 LIVE**.
- `public.ad_payments`: **0**.
- `public.ad_history`: **29**.
- `public.advertisers`: **7**.
- **None of the approved image assets are evidence of approved sanitized uploaded derivatives.** The single approved image has no active paid campaign.
- `storage.buckets` query by `id LIKE 'jb-ad-%'`: **0 matching buckets**. This does not exclude use of external storage; it only describes this project's Supabase Storage buckets.
- LIVE catalog: **no `ad_geo_mp_districts`, `ad_geo_mp_tehsils`, `ad_campaign_area_grants` tables** in `public` or `private`; `public.articles` has existing district/geography fields but **no trusted `ad_geo_*` column** currently.
- LIVE media/geo RPC discovery: only existing `jb_ad_public_feed(text,text)`, `jb_ad_save_creative_internal`, `jb_ad_approve_creative_internal`, etc. No deployed `jb_ad_set_article_geo_internal` / approved derivative receipt API found by inspected name pattern.
- Real `jb_ad_public_feed` source requires campaign LIVE+approved+paid+confirmed payment/nonrefund+valid schedule and selects only approved creative, **but trusts `p_scope` argument** and accepts `media_url` by HTTPS syntax. Therefore no article-verified authoritative local geo cutover and **no server-byte-verified sanitized asset release** is established from this deployed function.
- Real `private.p4_validate_ad_creative_media()` trigger **enabled** on `ad_creatives` and checks HTTPS URL syntax + nonempty content + CTA formatting. It **DOES NOT parse or sanitize original bytes, enforce duration, perform EXIF/GPS scrubbing or verify a service-generated derivative receipt**.
- Real `jb_ad_approve_creative_internal(uuid)` requires `private.p4_owner_allowed()` and flips approved creative status with audit; current body does not independently require proof of server-side media-byte validation or a verified immutable media-receipt reference. This is a **first paid-ad hard gate**, not a reason to silently disable contact-only launch.
- Independent financial guard triggers still **enabled**: `ad_campaigns.b7_t034_paid_state_verified_gate`, `ad_payments.b7_t034_payment_verified_gate`, `ad_payments.p4_ad_guard_confirmed_payment`. Existing media trigger also enabled.
- No SQL writes, migration, account change, approved asset, schedule change, live campaign or payment were made in this checkpoint.

## HARD safety split — do not dilute original Blueprint
**CONTACT-ONLY NEWS SOFT LAUNCH:** from these T035 checks, the UI can offer public enquiry and admin LOCAL file/text preview without serving paid creative; currently 0 paid LIVE campaigns. Final domain/website launch/security checks are separate. No media is uploaded or activated by preview alone. `P4-T035 contact-only scoped UI proof` may be accepted **only at this narrow scope**.

**BEFORE FIRST GENUINE PAID AD LIVE (not after):**
1. Official complete source-versioned MP 55 districts and verified tehsil LGD parent/codes/hash, server-owned Article UUID ad lookup; Gwalior vs Pichhore mismatch, no viewer GPS/caller geography; fix first divergence.
2. Privileged immutable media upload + byte/MIME, codec/container+duration (<=15.0 sec for video), dimensions/EXIF+GPS, sanitization, poster-generation and SHA/derivative receipt; deny forged URLs, malicious GIF/SVG/HTML, unauthorized users or stale approved versions.
3. Owner AAL2 approval and media receipts must be inseparable; an **HTTPS URL alone is NOT a trust token**. Protect existing approved image (no retrospective fake E2 claim).
4. Real visible public `विज्ञापन` label, one ad per Article pinned on stable URL, photo ratios including exact 4:5, real MP4 poster+playback and text/CTA E2/E3; then real user payment/verification/contract/security T034/T038 gates and explicit Founder first-LIVE approval.
5. No production SQL/Storage/domain mutation without separate authorized, source-audited rollout plan; no fabricated original uploaded media security proof.

## Closing status
- CP05 **READ-ONLY LIVE BACKEND STATE AUDIT COMPLETE** + previously supplied REAL ANDROID E3 local UI/preview checkpoint **SCOPED PASS**.
- **T035 ADS-010/011/012/013/014/015 canonical final = DUE**, not 6/6 final PASS; no Full T035 PASS+LOCK.
- CP05 required **no new manual Android work**, preserving minimum-process maximum-output.
- Founder next engineering priority: **P4-T036 / next Phase4 block** under soft-launch-first, with protected first-ad paid media E2/E3 backlog explicitly retained. Old PASS not repeated.

**NO REBUILD • NO PAID BRANCH • NO PRODUCTION WRITES • NO FAKE PASS**
