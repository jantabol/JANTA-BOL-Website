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
