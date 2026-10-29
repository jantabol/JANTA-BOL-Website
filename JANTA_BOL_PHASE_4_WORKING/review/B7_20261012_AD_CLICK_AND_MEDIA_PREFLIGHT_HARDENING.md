# JANTA BOL — B7 Staged Security Delta: CTA integrity and local media signature

**Engineering date:** 12 October 2026 (Founder-specified checkpoint)
**Branch:** `codex/b7-blueprint-20261010` | PR #5 DRAFT
**Status:** SOURCE/REGRESSION CANDIDATE ONLY. NOT Production PASS/LOCK.

## Reconciled LIVE state (READ ONLY)

- GitHub branch originally at `3e748e452f4b866081129e9ccbe9d2a8e41754b5`.
- Candidate CI `38110100224` completed SUCCESS (16/16 jobs) on that SHA.
- Protected CI `38110100227` completed SUCCESS (2/2 jobs) on that SHA.
- Direct read-only Supabase catalog check: Storage `storage.objects.b5_private_gateway_only` is **RESTRICTIVE**, **not PERMISSIVE**. Existing Owner private-editorial and public-media policies are PERMISSIVE with Owner AAL2 authority. No Storage policy DROP/GRANT was attempted. Prior permissive-incident claim is superseded by `B7_STORAGE_POLICY_INDEPENDENT_RCA_CORRECTION_20261012.md`.
- Direct read-only Supabase function check: `jb_ad_creative_workflow_capability_internal`, `jb_ad_issue_view_ticket`, `jb_ad_qualify_view_ticket`, `jb_ad_record_ticket_click`, and private B7 helper functions are **not installed** in LIVE. Existing `jb_ad_public_feed` and legacy `jb_ad_save_creative_internal` remain. Thus this frontend code is not real paid production analytics/media validation.

## Safe minimum-change frontend security delta

1. `ad-analytics-client.js` now binds each issued Article ticket to the *actual original CTA DOM anchor and its exact href*. If the link is moved outside the displayed ad or altered after binding, a click cannot be recorded as an approved CTA; ordinary navigation is never blocked.
2. `ci/phase4/b7-analytics-client-regression.cjs` adds synthetic trusted-click scenarios for relocated and changed-target links, preserving exact once-only reporting for a genuine unchanged CTA.
3. `ad-media-preview.js` now checks MP4's ISO-BMFF `ftyp` **major brand**, not only the generic `ftyp` box. A renamed HEIC/AVIF local file with `video/mp4` metadata is rejected rather than mislabeled as video.
4. `ci/phase4/b7-media-preview-regression.cjs` adds negative HEIC/AVIF/MIF1 tests. Genuine existing `isom` MP4 and all other JPEG/PNG/WebP cases remain in the original regression.
5. Existing view-ticket backend, Owner-approved creative authority, protected Phase3 security checker, existing B3/B5 policies, canonical article URL, one pinned Article slot and all earlier evidence are **unchanged**.

## Boundaries — no false claims

- Browser `isTrusted`, `ftyp` and `IntersectionObserver` do **not** prove a human advertiser click, genuine video codec, sanitized image, AV-safe file, or verified server media derivative.
- The candidate remains staged until new exact-HEAD protected and candidate CI receipts are GREEN. Those receipts are E1/E2 **only**, never E3/E5.
- Production SQL still requires safe staging parity/Founder approval before application. No LIVE ad, payment, public feed cutover, media upload or backend policy mutation here.
- Official MP 55-district/tehsil LGD verification, secure server-side image/video pipeline, real Android E3, Owner AAL2 E5, genuine external E6 (if required), E7 deployed provenance and final 60 ADS / 9 canonical tests remain DUE.
- **P4-T034..T042 Final PASS + LOCK: 0/9. B7_ADVERTISEMENT.zip: BLOCKED. B8: NOT STARTED.**

NO FAKE PASS · NO B5 STORAGE POLICY DROP · NO UNSAFE LIVE AUTOAPPROVE
