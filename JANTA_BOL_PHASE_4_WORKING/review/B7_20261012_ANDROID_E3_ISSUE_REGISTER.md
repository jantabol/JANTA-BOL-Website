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


## CTA Website → No CTA → Call retains invalid target — Android E3 12 Oct
- Screenshot 6031.jpg of local SPCK Chrome ads.html at localhost:7700: Selected CTA **Call**, target input still contains prior Website `https://example.com`. Previous E3 screenshot 6030 showed target also persisted after switch to **No CTA**. **UI stale cross-type CTA target REPRODUCED for both transitions**, not just a generic placeholder problem. Does not prove server persisted any invalid CTA; **no Save, Approve, Payment or Public Click was performed**.
- Batch-fix obligation: CTA-specific validation/clearing or well-defined per-type cache, only active compatible target submitted; Call requires a validated call-capable target, no URL; No CTA must save no target. Do not trust client validation: independently prove canonical backend RPC blocks mismatched (Call, Website URL) payload and strips/rejects (No CTA, nonempty target). Test normal valid pair and negative cases in isolated nonproduction backend; **E2 and Final PASS remain DUE**.


## Map CTA dropdown Android visual evidence — 12 Oct
- Founder screenshot 6033.jpg, Chrome SPCK local ads.html: existing T034 requested campaign creative tools, CTA dropdown selected Map. Target field remains visible with generic 'HTTPS URL / phone with country code' placeholder, empty. Media mode Image, no local file selected. This verifies Map selection UI only, not map link validation, real location, backend persistence or CTA click. No Save, Approve, Payment, or user contact took place.
- UX issue: CTA-specific target guidance needed for Map; generic URL/phone placeholder does not specify acceptable maps link/coordinates. Examine actual backend contract before defining accepted formats. Screenshot shows no old Website URL in this state but does not establish previous cross-type bug fixed (form may have reset).
- CTA options local visual checks now done (No CTA, Call, WhatsApp, Website, Map). Avoid repetitive selection screenshots; prioritize meaningful negative flows and E2 security validation. Official checkpoint remains PARTIAL/DUE.


## Empty local file preview denial — Android E3 12 Oct
- Screenshot 6034.jpg, Chrome Android SPCK localhost:7700/ads.html for T034 requested campaign, creative type Image with 'No file chosen', clicked 'Local File Preview — NO UPLOAD'; in-page message `Local preview blocked: SELECT_LOCAL_MEDIA_FILE_FIRST`. This confirms **client empty-file preview DENY / expected negative UI outcome**; it does NOT establish server ingestion or ADS-015 full PASS. No file uploaded, no draft saved, no approval, no payment.
- Remaining ADS-015 real E2/E3: authenticated server upload/verification + immutable receipt and independent fail-closed save gate, proper media error handling and negative cases. Do not misreport empty-picker guard as backend safety PASS.


## Selected but unuploaded file save denied — Android E3 12 Oct
- Screenshot 6035.jpg, Android Chrome SPCK localhost:7700/ads.html, existing T034 requested campaign: creative mode Image, selected local JPG `5990.jpg`, no server upload. Prior empty-preview status line persists after new picker selection; cosmetic stale status pending fix.
- Screenshot 6036.jpg: Founder tapped 'Save Pending DRAFT (Owner)' once with selected local JPG. Browser showed `LOCAL_MEDIA_NOT_UPLOADED: File sirf phone preview hai. Isse server par upload/approve nahi kiya gaya. Abhi Save DRAFT me ye file nahi ja sakti.` Expected **client fail-closed save DENY — Android E3 observed**. Do not imply server RPC denial, actual server traffic inspection, DB no-write evidence, or fully passing ADS-015. Actual media upload/receipt remains DUE. No approval or payment initiated.
- Next E3 safe action: dismiss alert with OK, stop clicking Save for existing requested campaign; continue independent negative tests after verifying backend contract. Record as client guard partial evidence, NOT final P4-T035 or ADS-015 PASS/LOCK.


## Selected 5990.jpg preview recovery — Android E3 12 Oct
- Screenshot 6038.jpg, Founder Android Chrome SPCK localhost:7700/ads.html: after selected-but-unuploaded Save DRAFT was blocked and alert dismissed, tapped Local File Preview — NO UPLOAD for the currently selected `5990.jpg`. Client displays the actual cooler photograph within preview box without obvious crop/stretch; prior `SELECT_LOCAL_MEDIA_FILE_FIRST` message is replaced by preview. Media remains **local-only**, no upload, server verification, draft persistence or approval proven.
- **E3 local preview recovery observed PASS**, distinct from ADS-015 full approval/media lifecycle test which remains DUE pending independent E2/backend integration and DB evidence. Screenshot is not proof of byte-level content safety, EXIF/GPS removal or approved public ad.
- Additional nonmutating E3 check proposed: with current local Image selected, switch creative type to Video without reselecting file; verify preview is hidden and stale Image cannot be mistaken for Video (do not Save or Approve).


## Image → Video type switch stale JPG preview — Android E3 12 Oct
- Founder screenshot 6039.jpg, Android Chrome SPCK local ads.html after image `5990.jpg` preview: changed creative type Image → Video **without changing file**. Video is selected in type dropdown but `5990.jpg` remains shown in file picker and full **cooler JPG preview persists**. This is **reproduced stale cross-type media UI**, and potentially misleading media association; video selection must not visually present prior image as the active video proposal. Browser local preview only, not uploaded. No Save or Approve performed.
- Recommended batched safe fix: on creative type transition, invalidate/revoke preview blob URL and any async decoder, clear incompatible picker value and file state, reset preview/status, and disable image-only behavior for Video. Revalidate correct media type from file signature/codec on authenticated backend ingestion regardless of browser accept attribute; never infer server approval from local preview. Check switch-back and stale-media race as regressions. Official ADS media E2/E3/E5 remains DUE; this screenshot is BUG evidence, not PASS.
- Next safe Android negative test: with Video selected and JPG selected, tap `Local File Preview — NO UPLOAD` to see whether mismatch is rejected; **do not Save DRAFT or APPROVE**. Capture inline code/message. This is optional client-negative evidence, not substitute for server API test.


## Video mode explicitly previews selected JPG — Android E3 12 Oct
- Founder screenshot 6040.jpg: in Video creative mode, `5990.jpg` remains selected and a still cooler photo remains rendered after tapping `Local File Preview — NO UPLOAD`. No mismatch error/status appears. Local **wrong-type preview acceptance reproduced**. Neither upload nor publication occurred. This builds on 6039.jpg which showed Video mode retaining the image preview on type transition.
- Exact source trace at branch HEAD 73ad4a9: JANTA_BOL_PHASE_3C_WORKING/ads.html lines 47-64 `previewLocalMedia` retrieves selected file and calls `JBAdMediaPreview.stage(box,file)` but **does not inspect `ct-${id}` selection**; ad-media-preview.js lines 28-39 validates file's own bytes/MIME/extension and lines 65-86 creates img or video element based on intrinsic kind, not chosen creative mode. So JPG is valid *image file*, but inappropriate in requested *Video creative mode*; source-level first divergence is absent selected-creative-vs-file-kind matching and cleanup on mode change. Source comment: file chooser accept allows both image and video simultaneously in all types. This is local preview UX/validation defect; `creative()` lines 234-249 also blocks any selected local file before existing canonical save RPC, so no evidence of backend exploit. Server type enforcement independent tests remain DUE.
- Batch fix: bind selected creative mode to file signature-detected `info.kind` before stage, ensure mismatch raises distinct `LOCAL_MEDIA_TYPE_MISMATCH`, clears old image object URL/preview and stale file input; on switch to new type invalidate previews atomically; in Text mode hide/disable picker/preview. Preserve full local unuploaded guard, fail-closed Owner media pipeline and audit. Build regression for Image→Video and Text switching, stale async race, wrong-type pick and proper image/video local previews; **NO PASS** until actual proof.


## Schedule start datetime picker Android UI — 12 Oct
- Screenshot 6041.jpg, Founder Android Chrome/SPCK local ads.html: tapped **शुरू** (schedule start) input for existing T034 campaign. Android browser native 'Set date and time' picker opens with day/month/year plus hour/minute/AM-PM selector and buttons Clear, Cancel, Set. Screenshot shows currently selected 12 Oct 2026 at 6:52 pm, but **no time submitted, start/end dates persisted, or Schedule triggered**. E3 UI picker-open evidence only; scheduling backend owner authority, timezone, minimum-range, inventory and lifecycle tests remain DUE.
- Safe next Android step: choose a future start date/time, press picker Set (sets only browser form field); inspect displayed time without pressing the actual Schedule button. Then separately set end after start; backend test requires independent E2 verification and explicit safe authorization before mutating production.


## Start scheduled time selected in Android form — 13 Oct 2026 19:00
- Founder Android Chrome/SPCK screenshot 6044.jpg: in existing T034 requested campaign, after setting native datetime picker, **शुरू** field displays `13/10/2026, 19:00` (device-local, UI says Asia/Calcutta); **समाप्त** remains blank. The actual `Schedule` action was **not pressed**, no backend scheduling or persistence verified. This is a **nonmutating E3 date/time form-entry observation**, not schedule PASS/LOCK.
- Next safe check: set **समाप्त** to `14/10/2026, 19:00` using picker Set, then inspect both populated fields, without pressing Schedule. Backend/permission/timezone verification remains due.


## Android unsubmitted start/end 24-hour duration — 12 Oct 2026
- Screenshot 6045.jpg, Android Chrome/SPCK localhost:7700/ads.html: existing T034 campaign **शुरू** `13/10/2026, 19:00`, **समाप्त** `14/10/2026, 19:00`, interface device timezone `Asia/Calcutta`; interval **24 hours**, based on displayed fields only. Actual **Schedule** button remains unpressed. This is **E3 UI form entry OBSERVED**, not proof of server conversion, authorization, persistence or ad activation.
- Important: scheduling is a backend mutation of the existing campaign; do not ask Founder to press actual Schedule on an existing advert merely to prove UI. Schedule transactional E2 testing must use isolated test fixtures/staging and approved credentials. The existing selected JPG preview in incompatible Video mode remains a known E3 UI defect and does not satisfy media approval requirements.
- Next safe Android checks can move to entirely nonmutating payment/quotation UI exploration, but no fake receipt, payment confirmation, advertiser verification, or live state transition is authorized. Full scheduling tests DUE.


## Owner manual payment accordion Android UI — 12 Oct 2026
- Founder screenshot 6046.jpg, Android Chrome/SPCK localhost:7700/ads.html, existing T034 requested campaign: `Owner manual payment — verified receipt and written consent required` accordion successfully expanded. Shows agreed price (paise), quotation reference + Save quotation, unique UTR/receipt number, actual received paise, UPI payment method selector, received timestamp, verified receipt evidence reference, advertiser acceptance evidence reference, acceptance timestamp, Owner verification note, `Type CONFIRM`, and `Record verified manual payment` action. Explicit warning says no confirmed payment without actual receipt, terms acceptance, Owner AAL2; payment alone does not activate ads.
- Result strictly **E3 local payment-section UI render observed**, NOT a completed payment, independently verified receipt, permission test, database state or E6 provider integration. Fields empty; no payment confirmation, quotation, or related write performed by this test. Official payment T038 and security evidence remain DUE.
- Next safe UI-only check: tap UPI payment-method dropdown and capture options; DO NOT supply fake UTR, fake paid amount, fictitious evidence, CONFIRM, Save quotation or Record verified manual payment. Confirm allowable methods against blueprint and canonical backend before any persisted payment tests.


## Owner manual payment method choices Android E3 — 12 Oct 2026
- Screenshot 6047.jpg Android Chrome/SPCK local `ads.html`: in existing T034 manual payment section, method selector opened and shows three options **UPI**, **Bank transfer**, **Cash**. Existing selected value UPI. Other fields including actual received amount, UTR/receipt, acceptance and independent verified receipt evidence remain empty, and no `Save quotation`, `Record verified manual payment`, `Schedule`, `Approve` or provider operation was performed. **E3 dropdown options visual check observed only**, not proof of payment validation, actual receipt, Owner AAL2 or E6 gateway integration. P4-T038 remains DUE.
- Do not ask Founder to fabricate receipt/UTR/confirmation or execute payment backend writes for a UI test. Next nonmutating manual option is read-only verification-decision dropdown inspection; sensitive verification state must not be applied without legitimate evidence.


## T034 advertiser verification decision dropdown — Android E3 12 Oct
- Founder screenshot 6048.jpg of localhost:7700/ads.html for existing `T034 Test Advertiser` (requested, verification pending) shows expanded Owner/AAL2 `Verification decision` select with `Verification decision`, `Verified`, `Rejected`, and `Pending / recheck`. This establishes only visual option availability on Android SPCK/Chrome. No verification decision selected or `Record verification (Owner/AAL2)` action executed; no independent advertiser evidence or backend permission/result verified. **E3 dropdown UI observed, not Advertiser Verification E2/E5 PASS or overall B7 test PASS.**
- Existing media state also remains Video + `5990.jpg` JPEG local cooler preview, previously recorded wrong-type stale preview UI defect, not proof of upload or acceptance.
- Next safe founder guidance: dismiss dropdown without choosing Verified/Rejected; never mark fake T034 advertiser Verified without evidence. Prioritize real negative backend Owner/AAL2 validation and safe isolated fixtures over further redundant dropdown UI tours.
