# JANTA BOL / PHASE-4 / B7 — PRIVATE MEDIA QUARANTINE + EVIDENCE (REVIEW ONLY)
11 Oct 2026. Exact independently verified CODE checkpoint 26e783b2434cdee1e4171bb9fd33be7aaca9e0b0.
Candidate 38118203598: SUCCESS 17/17 jobs. Protected 38118203562: SUCCESS 2/2 jobs.

## Existing canonical system traced before changes
Original LIVE has 5 campaign rows, 0 LIVE, 11 creatives, buckets public-media, private-editorial, grievance-private. Original B5 policy b5_private_gateway_only is RESTRICTIVE on storage.objects, not PERMISSIVE. It is NOT dropped or altered. Neither proposed B7 private bucket nor proposed media evidence ledger currently exists in LIVE. PR #5 OPEN DRAFT UNMERGED.

## Minimum safe source extensions
1. Private-only storage adapter requires two NEW bucket IDs jb-ad-originals-private and jb-ad-previews-private. Refuses shared editorial/public/grievance buckets. Must find both bucket public=false with 8MiB limit. Uses createOnly upsert=false with one SHA-addressed immutable path per original and processed image, checks actual server readback hashes. All results remain private quarantine, not approval or public URL.
2. Existing real ImageMagick WASM sandbox (0.0.30 pinned) produces stripped/orientation-normalized PNG; source+derivative are both hashed from actual bytes; mismatched claims refuse storage. Mandatory onOrphan callback must durably log partial failures before future production enablement; current unit tests use injected FAKE sink. No ACTUAL Storage object or media ever uploaded in this session.
3. Review-only private.b7_ad_media_receipts keeps the canonical ad_creatives table as the sole creative/publication authority; receipt evidence records IDs, exact creative version, hashes, original and derived private storage paths, dimensions and unapproved-only state. Service-role INSERT/SELECT, no direct client rights, immutable triggers. Review-only orphan_events append-only. Never treat manually supplied hash strings as proof of bytes; ONLY private worker actual readback can attest.
4. Review-only Storage migration defines two dedicated private buckets and RESTRICTIVE anonymous/authenticated denial policy, independent of original B5 RESTRICTIVE safeguard. No client direct private access even if hypothetically a new broad permissive Storage policy appears.

## Real disposable CI regression and actual RED history
All 17 Candidate jobs GREEN run 38118203598 and both original protected jobs GREEN run 38118203562 on exact 26e783b2434cdee1e4171bb9fd33be7aaca9e0b0. Targeted synthetic Node + real Deno WASM checks, plus disposable PostgreSQL using original B7 creative, storage and retention fixtures. Temporary widened service-role UPDATE/DELETE grants and RLS policies exist ONLY inside ROLLBACK for trigger stress test.
Documented real failures: initially UPDATE denied by missing privilege before trigger (test corrected to assert privilege AND trigger under temporary rollback grants); orphan table id conflicted with PL/pgSQL variable (renamed v_asset_id); pg_policies.roles is name[] not text[] (explicit cast); set_config needs is_local boolean. All old tests kept.

## Strict release hold
NO LIVE SQL/Storage changes. Media Studio user-facing create/upload/approval not ready. Still missing actual durable Server Worker -> private evidence ledger transaction, durable orphan sink/reconciliation, real Android user media upload and Owner AAL2 E5, server malware/polyglot risk review, real photo EXIF/renditions, MP4 H.264/AAC codec+poster and stored public sanitized derivative, official MP LGD import, Vercel E7 deployed SHA parity, Founder signoff. News canonical Article URLs and B5 remain intact. E6 online gateway postlaunch DUE where approved.
Canonical P4-T034..T042 FINAL: 0/9 PASS+LOCK. B7_ADVERTISEMENT.zip: BLOCKED. NO FAKE PASS.