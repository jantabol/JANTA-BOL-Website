# JANTA BOL — B7 Android E3 Manual Issue Register
Date: 12 October 2026
Source before register: fbf1bbf09d3e4fc9cd4cd56660b313ede50cdd7d
Testing environment: Android, SPCK local preview (localhost:7700), authenticated Founder session where noted.
Mode: RECORD ALL FINDINGS NOW; BATCH REPAIR LATER. No production changes in this note.
NOTE: Chat screenshots/Founder observations support only the narrow UI/device outcomes described here. Backend/final evidence remains separate.

## Confirmed observed UI and functional gaps (do not mark final PASS)
| ID | Finding | Status | Planned later action |
| --- | --- | --- | --- |
| B7-E3-001 | Public homepage "विज्ञापन के लिए संपर्क करें" CTA rendered tiny (~13px, 36px click area) on Android. | **SOURCE FIXED** in fbf1bbf; 17–20px and 48px target; 20/20 candidate and 2/2 protected CI. **Android retest of new build DUE**. | Batch review typography, spacing, accessibility against phone. Do not introduce extra ad slots. |
| B7-E3-002 | Owner Ad Studio package/request/quotation/payment input fields are crowded and very narrow on Android. | **UI BUG NOT FIXED**. | Mobile-first wrap/labels/input widths; leave form semantics and privileges intact, run responsive/regression checks. |
| B7-E3-003 | Renewal request list shows "Renewal queue unavailable" because required owner RPC is not deployed. | **BACKEND DUE** (source-only review candidate may exist). | Reconcile latest review-only migration, B3/B5 rights, deploy only with authorized rollout, then real E2/E3/E5. |
| B7-E3-004 | Change-request list shows "Change-request queue unavailable" because owner RPC is not deployed. | **BACKEND DUE**. | Same minimum-safe integration/audit; no advertiser direct live creative update. |
| B7-E3-005 | "Qualified analytics unavailable until secure backend deployment" when Owner tapped. | **BACKEND DUE**. | Secure Owner qualified analytics RPC and honest estimates, no unverified impression count. |
| B7-E3-006 | Notification issues list shows "Notification issue queue unavailable until safe backend rollout". | **BACKEND DUE**. | Existing B3 in-app notification/audit integration, no fake external WhatsApp/PUSH delivery. |
| B7-E3-007 | Admin Android gallery image/video preview is LOCAL ONLY; actual authenticated private upload, separated queue worker, receipt/Owner approval remain unconnected. | **CORE INTEGRATION DUE**. | Integrate existing workers to canonical private receipts with proper owner AAL2/revoke, real staging + deployment proof; do not bypass deliberate draft block. |
| B7-E3-008 | Advertiser portal link target=_blank initially navigated to localhost and Chrome showed ERR_CONNECTION_REFUSED. Direct SPCK preview of advertiser-portal.html succeeded. | **ENVIRONMENT/NAVIGATION AMBIGUOUS**. | Reproduce against SPCK origin/tab lifecycle; no claim of app security failure. Confirm real deployed behavior. |
| B7-E3-009 | Official MP district/tehsil dataset/provenance and canonical Article ad/analytics live integration unverified. | **E2/E7 GATE DUE**. | Verified LGD source and controlled adapter cutover after audit, no guessed geography. |

## Observed Android local test evidence (not production PASS)
- Owner reports email/password/TOTP 2FA successfully navigated to admin dashboard. Not proof of server role RLS/AAL2 enforcement, which needs E5.
- Existing campaign records displayed on Owner Ad Studio.
- Gallery photo selection, portrait contain preview and LOCAL_NO_UPLOAD UI observed.
- Save Pending DRAFT with selected local photo returned LOCAL_MEDIA_NOT_UPLOADED; read-only Supabase snapshot showed referenced test campaign requested, creative_count=0, approved_creative_count=0.
- 159MB MP4 rejected as outside 50MiB local policy: **EXPECTED SAFETY RULE**, not a bug.
- Smaller 15sec MP4 selected, local video controls and portrait preview displayed. Founder reports full 15sec playback succeeded.
- Save Pending DRAFT with selected MP4 returned LOCAL_MEDIA_NOT_UPLOADED, backend read-only campaign unchanged: **expected fail-closed**.
- Manual payment form displayed; no payment or approval action attempted.
- Invalid advertiser login refused in UI; empty required form blocked by browser. Neither is proof of full backend auth/anti-bruteforce.
- Direct SPCK advertiser-portal page displayed login only; public homepage return navigation worked.
- Public homepage CTA displayed but too small (B7-E3-001).

## Truth gates
- Final canonical P4-T034..P4-T042: **0/9 FINAL PASS/LOCK**, pending complete authoritative proof E1/E2/E3/E5/E7; E6 provider separate external DUE.
- Isolated CI green != actually deployed integration.
- Do not mutate existing advertisers/campaigns, send WhatsApp, create new accounts, confirm payments, merge PR or apply production migrations merely for UI testing.
- Next manual test: tap homepage "विज्ञापन के लिए संपर्क करें" on current SPCK site; inspect request form, do not submit until specific authorized safe test plan.
- Repair strategy after gathering remaining visual evidence: one consolidated, root-cause-led, minimum-safe batch across all listed issues, followed by regression and new SPCK ZIP; no rebuild and no fake completion.


## Android E3 → canonical ADS coverage map (12 Oct)
This is an **evidence-routing register**, NOT an independent test authority, not completion of the complete checkpoints. E2 means actual backend/RLS/RPC evidence; E5 means durable audit/lifecycle proof; E7 deployed implementation. Browser form validity != backend validation.

| Official checkpoint | Observed manual evidence from Founder Android SPCK | Open gates |
| --- | --- | --- |
| ADS-001 | Homepage & article link visual and opened the same simple public enquiry. Article navigation preserved. | Confirm latest 17–20px CSS on real phone; E2/E5 of parent official T034; record E3 proof. |
| ADS-002 | Empty name, empty WhatsApp and unchecked consent each rejected by required browser fields. | All server-side invalid/valid normalize/rate-limit E2 still DUE. Do not submit directly to Production just for this. |
| ADS-003 | Public form only name, WhatsApp, optional note and consent; no public media/area/placement form controls. | Forged RPC args denial E2 still DUE. |
| ADS-004..009 | Existing older test campaign rows visible and T034 verification owner UI visible, but **no new approved staging enquiry**, no high-risk authorization negatives tested. | Entire isolated staging + privileged E2/E5 gates DUE. |
| ADS-010 | Portrait photo selected and fully contained in LOCAL preview. | Other size ratios, real sanitization/upload and full E2/E3 DUE. |
| ADS-011 | 15-second portrait MP4 LOCAL preview player and completed playback per Founder; oversized 159MB file denied by 50MiB local preview guard. | Approved/public video, poster, unsupported codec, real private worker E2/E3 DUE. |
| ADS-015 | Both selected local image/video blocked at Save Pending DRAFT with LOCAL_MEDIA_NOT_UPLOADED, no approved Creative; live read-only related test campaign creative_count=0. | Real authenticated upload, adversarial MIME/storage/RLS, immutable receipt and private worker E2/Due. |
| ADS-041..047 | Advertiser portal opened by direct SPCK preview; blank ID rejected by browser; known-fake ID rejected with no dashboard shown. | One-time session actual backend E2/E5, own-only/cross-tenant/renewal/change flows DUE. |
| ADS-048..050 | Analytics Owner button shows correct fail-closed unavailable message. | Secure qualified analytics RPC E1/E2/E3 DUE. |
| ADS-051..056 | Notification issue section loaded fail-closed unavailable message. | Backend B3 integration, immutable failure audit and retry E2/E5 DUE. |
| ADS-057..060 | Android local basic forms/preview/nav observed, cramped Owner controls captured. | Full mobile+founder time E3 and regression/deployment E7 DUE. |

Latest physical public CTA CSS fix in commit `fbf1bbf09d3e4fc9cd4cd56660b313ede50cdd7d`, candidate 20/20 and protected 2/2. Device screenshots above were from the prior SPCK build; new CSS physical retest remains DUE.

**Next nonmutating high-value Android manual run**: ADS-010, use a normal landscape (16:9) JPG (no sensitive data), open Owner Advertising → Creative tools → Image → Choose file → LOCAL File Preview — NO UPLOAD. Check entire image visible/no crop/no horizontal scroll; screenshot. NEVER Save/Approve/Schedule/Payment. A local preview is not complete ADS-010 PASS because actual image processing and storage E2 are absent.


## ADS-010 Android local aspect-ratio checks — 12 Oct 2026
- 16:9 landscape: user Gallery detail reported 3264 × 1840 JPG (approx 16:9), 1.43 MB; Android SPCK Chrome preview screenshot (image 5988.jpg) shows full landscape image centered with no obvious crop/stretch. **LOCAL E3 VISUAL PASS only.**
- 1:1 square: Gallery detail 2448 × 2448 JPG, 1.23 MB; Android preview screenshot (image 5992.jpg) shows whole square photo with side gutters, no obvious crop/stretch. **LOCAL E3 VISUAL PASS only.**
- 9:16 portrait: Android preview screenshot (image 5994.jpg) showing selected 5993.jpg centered, full tall image visible with neutral side gutters, no obvious cropping/stretch; no upload, approval, or payment. **LOCAL E3 VISUAL PASS only.** No verified native pixel dimensions were supplied for this sample.
- Earlier independent portrait photo preview and 15-second portrait MP4 local preview/playback documented above.
- ADS-010 remains **PARTIAL**: 4:5, ultra-wide, EXIF-rotated image and actual secure backend image processing/asset storage E2 remain DUE; client-only visuals do not establish production creative E2/E3.
- Next user-assisted test: 4:5 photo via Camera ratio selector or Gallery crop to 4:5, then LOCAL File Preview with screenshot. Do not Save, Approve, or Pay.


## ADS-012 Android text creative UI — 12 Oct 2026
- Owner Android SPCK Chrome screenshot 6023.jpg: changing selected creative type Image → Text leaves previously rendered LOCAL image preview visible even though file control states “No file chosen”. **UI STALE_PREVIEW BUG**, not an uploaded/approved image. Type switch must dispose object URL, invalidate pending decode, clear thumbnail and file state atomically; never silently reuse media for text creative.
- Owner Android SPCK Chrome screenshot 6025.jpg: refresh removes local photo preview; Text option selected, empty file selector and Text field visible; **CLIENT UI CONDITION OBSERVED**, no server creative write.
- Owner Android SPCK Chrome screenshot 6026.jpg: Text field shows literal “JANTA BOL B7 TEXT AD TEST”, CTA remains “No CTA”, no selected file. **ADS-012 TEXT ENTRY UI OBSERVED**, not full ADS-012 PASS (requires canonical server draft/version, public approved text ad with “विज्ञापन” marker, permissions and audit E2/E3/E5).
- **Mobile UX**: Image/Video-only Media URL, Choose file and Local File Preview controls remain shown when creative type is Text. These should hide/be disabled in Text mode, keeping server authority, and be reenabled for Image/Video without changing saved state.
- **Missing standalone remove control**: Wrong local photo can only be replaced or removed by page refresh; add one accessible “Remove selected local media” button, revoking URL and invalidating stale async reads while preserving other unsaved fields.
- Android picker sometimes returned screenshots of Gallery UI rather than underlying cropped original JPG; this is **input selection ambiguity**, not established browser cropping bug. Extra-wide actual-original 2.39:1 remains PENDING; do not credit screenshot-containing photo as test of intrinsic aspect ratio. SPCK local port 7700 occasionally refused connection while preview server stopped; recovered on relaunch, not yet evidence of B7 application failure.
- Next non-mutating E3 visual test: tap CTA select currently “No CTA” and inspect available choices, WITHOUT creating a draft/approving/contacting others.


## ADS-048/050 CTA stale value on No CTA switch — 12 Oct 2026
- Founder Android Chrome SPCK screenshot 6027.jpg: CTA dropdown exposes No CTA, Call, WhatsApp, Website, Map; UI menu options OBSERVED, not end-to-end verified.
- Screenshot 6028.jpg: Website selected; CTA target field remains visible with generic placeholder “HTTPS URL / phone with country code”. Placeholder should depend on selected CTA; visual UX improvement.
- Screenshot 6029.jpg: Website CTA target filled with `https://example.com`; CLIENT ENTRY OBSERVED only. No Save, Approve, or Public Click.
- Screenshot 6030.jpg: After switching CTA Website → No CTA, **the CTA target field still visibly contains `https://example.com`**. **UI STALE_CTA_TARGET BUG — REPRODUCED E3**. No network mutation in manual flow. A hidden/irrelevant value must not leak into a saved No CTA creative or be reattached on later type switch. Underlying `ads.html` `creative()` submits `ctaType` and `ctaTarget` independently; possible backend canonicalization unverified. Verify actual canonical RPC rejects or safely clears target for No CTA, persists no action, and enforces permitted schemes for Website before claiming a security issue or PASS. Do not change production data.
- Recommended batch-safe frontend patch: on CTA change, clear/reset incompatible target, disable/hide target if No CTA, show CTA-specific label/input and validation; backend independently validates pair and forbids URL on No CTA. **Not yet coded or tested.**
- Next non-mutating Android visual check: change CTA to Call, check target-field UI without entering a real number or saving; compare CTA-specific UI behavior, then return to No CTA. 
