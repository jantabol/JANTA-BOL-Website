# JANTA BOL — B7 12 OCT 2026 — Owner creative draft safety / Media Preview

**Status:** REVIEW-ONLY SOURCE; NOT DEPLOYED; NO FINAL PASS/LOCK.

## Exact checkpoint and authority

Start at commit `e54ea777762ddcc74a06bccf2c4bdfbb97da2d32`, Draft PR #5, branch `codex/b7-blueprint-20261010`. Baseline P4-T035 candidate **38071647503** (15/15 GREEN), protected Phase3A+3B **38071647508** GREEN. Master B7 blueprint pages 6–8, 25 and P4-T035 ADS-010..015/P4-T039 ADS-045..047: Founder Media Studio must **save/preview a draft and explicitly approve**, never silently replace the currently LIVE/approved creative on Save.

### First divergence: actual LIVE source — read-only inspected
Current Supabase `public.jb_ad_save_creative_internal(uuid,text,text,text,text,text)` sets `approved=false` on ALL prior campaign creatives then inserts the newly submitted creative with `approved=true` in that same SAVE request. Merely opening Owner SAVE on a new image/text therefore bypasses the separate preview+approval state and replaces a running creative. Existing Owner AAL2 does NOT substitute for explicit review; the previous B7 retention sticky version guard preserved bytes but did not fix silent approval. Original `public.jb_ad_approve_creative_internal(uuid)` exists separately.

An **exact read-only-copied source fixture** `ci/phase4/b7-creative-legacy-source-fixture.sql` and a rollback-only `b7-creative-legacy-divergence.sql` reproduce that old SAVE auto-approves and deactivates the old creative in disposable PostgreSQL. No LIVE campaign was mutated or viewed privately.

## Minimum safe staged fix and authority
- `db/20261012_b7_creative_draft_approval_REVIEW_ONLY.sql` updates only the SAME two Owner RPC signatures, preserves return types and `public.ad_creatives + ad_history`. It **requires** the previous sticky `approved_once` retention migration and aborts if the exact old original source has changed unexpectedly.
- SAVE: Owner/AAL2, canonical campaign row lock (serialize version numbers), strict typed input validation including no local/intranet/unsafe CTA/media, INSERT new `approved=false` / `approved_once=false`, append `creative_draft_saved`, **never touch previously approved creative**.
- APPROVE: separate Owner/AAL2 action locks same campaign, accepts only the **latest version**, verifies advertiser, denies unsafe high risk without enhanced verification, atomically retires former approved creative, activates new safe text draft, records a fresh immutable `creative_approved` event. Repeat approval is idempotent; old sticky media retains historical evidence.
- Image/video draft may be proposed for private review, but **approval is deliberately BLOCKED** until genuine server-side bytes/MIME/dimension/codec/EXIF/GPS stripping and approved immutable derivative/thumbnail/MP4 poster pipeline exists. No false `ADS-015 PASS` from client preflight.

## Paired frontend fail closed
- Review-only `public.jb_ad_creative_workflow_capability_internal()` requires Owner AAL2 and returns exact marker `B7_DRAFT_THEN_EXPLICIT_APPROVE_V1`. Changed `JBPhase4.adCreative()` and new `adApproveCreative()` refuse to call the OLD LIVE autoapproval RPC if capability is absent/incorrect. A mismatched frontend-only deploy therefore cannot silently replace an existing LIVE creative.
- `ads.html` changes explicit labels `Save Pending DRAFT` and `Review latest draft → Explicit APPROVE`. Owner sees campaign, version, type, text, media and CTA in a confirmation before approval; previous approved version stays on-screen until after backend confirmation.
- `ad-media-preview.js` and Owner local gallery: validates JPEG/PNG/WebP/MP4 magic bytes against extension/MIME, checks the inspected 50MiB bucket cap, shows responsive contain portrait/landscape image and silent click-to-play MP4; no upload, no external network, no approved status, no EXIF removal claim. Object URLs revoked on replacement/navigation, no secret/contact logging.

## Evidence / regression
- `ci/phase4/b7-creative-two-stage-regression.sql`: Owner save as draft preserves old approved, AAL1 denied, stale version can't be approved, pending high-risk rejected, image/video not approved without server check, blocked local/private URLs and source history append-only.
- `ci/phase4/b7-client-regression.cjs`: old RPC capability absence denies unsafe SAVE, Owner explicit preview + separate Approve, invalid IDs and AAL1 fail closed.
- `ci/phase4/b7-media-preview-regression.cjs`: magic-byte spoofed SVG/HTML/renamed JPEG, no autoplay/stretched image, object URL cleanup and oversized file rejection.
- Two additive candidate steps + disposable `b7-creative-two-stage-postgres` job; protected Phase3-T123 newly **conditional** on reviewed capability to preserve exact Owner/authenticated signatures, no autoapprove-on-SAVE, media still blocked.

## RCA, not fake completion
Temporary candidate RED at **38108254920** / **38108269142** from a tool-generated JS `String.replace` replacement pattern containing the SQL regex suffix `$'`: it expanded SQL beyond the intended expression and corrupted migration, unrelated to the established functionality. Independent RCA fetched intact **`e377ddefc033b462f7d11bcdbdb806e5cf29a79b`** full original file, reconstructed using callback replacements, asserted exactly one BEGIN/COMMIT/SAVE/APPROVE/CAPABILITY and reduced source from 91,261 corrupted bytes to 9,460 intact bytes; fix commit **`3e7b91a7c17f63c682b81908830af11332c5175b`**. Never weaken or delete a test to bypass this bug. Latest commits require exact-HEAD rerun to count.

## Critical unresolved Production storage incident
**READ-ONLY recheck 12 Oct:** `storage.objects` still has permissive `b5_private_gateway_only` ALL for anon/authenticated with `bucket_id <> 'grievance-private'`. Existing Owner policies may be bypassed by OR in private-editorial bucket. This is **NOT DEPLOYED FIXED**. Staged review SQL `20261010_b7_storage_rls_critical_REVIEW_ONLY.sql` plus isolated 15-job CI available from 10 Oct; do not apply to Production without Founder decision, controlled staging/rollback and REAL RLS negative proof. No exploitation is proven; no content accessed.

## Still DUE before B7 ZIP
Real server-backed approved media derivatives, verified LGD 55 MP districts+tehsil data, hosted production/staging Owner AAL2 & Media RLS, Android E3, provider E6 where needed, end-to-end P4-T034..T042 E5/E7, final Founder review. **B7 Canonical: 0/9 FINAL PASS+LOCK.** Final `B7_ADVERTISEMENT.zip` **BLOCKED**.
