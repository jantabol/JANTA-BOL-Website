# P4-T079 — YouTube Video Upload Worker, Isolated QA Handoff
**Date:** 29 Oct 2026 | **JANTA BOL soft-launch priority**
**Status:** Offline REVIEW-CANDIDATE worker+SQL connector contract tests. **NO production YouTube writer, no real upload, no Production schema migration.**

## Why this scope
Founder confirmed existing YouTube Channel OAuth, fresh Google token refresh and channel identity PASS+LOCK; requested backend completion without Android steps until strictly necessary. T079 full provider E6 must prove a genuine Founder-approved JANTA BOL video in a Google-owned PRIVATE channel receipt. Current actual production contains 2 published articles, 0 published video URLs, 0 MP4 media files and 0 YouTube-selected articles. **The main thing missing for a real Google upload is an actual approved video and a production-safe transactional ledger release gated by B12/T078 E8.** Do not make or upload an unrelated fabricated "news" video to trick E6.

## Finished here (review branch only)
`CODEX_CURRENT_SUPABASE/functions/jb-youtube-video-worker/worker.mjs` is a NEW, **nondeployed/no index.ts** server-only orchestrator that connects the existing PR76 PRIVATE resumable Google transport and PR77 isolated PG17 idempotent ledger via injected trusted service adapters. No real Supabase/Google/YouTube secret, connector, session or file was accessed. No production deploy or migration.

### Start flow — no blind second video
1. Verify actual Founder session+Owner+AAL2 using a server-attested `ports.authorize`, never caller-supplied role or JWT claims. Caller may supply *article ID only*; `ports.loadApprovedIntent` must retrieve rights, approvals, exact immutable article version, global and per-article YouTube/API mode, already verified correct JANTA BOL OAuth refresh and channel from trusted backend.
2. Require published/nondeleted article and matched expected YouTube Channel ID, real Google refresh OK, correct explicit video and rights approvals.
3. Read original **only** `private-editorial/youtube-news/<articleId>/<file>.mp4` through trusted storage service-role adapter. Reject other buckets (notably grievance-private), arbitrary external URLs, wrong size and SHA256 mismatch. Verify whole file before provider request; existing adapter contract is intentionally not yet live.
4. Derive immutable server-side idempotency key from article UUID + exact article revision + Channel ID + video SHA256. Atomic PG17 ledger reserve; existing or UNKNOWN job = HOLD, never another Google `videos.insert`.
5. Exclusive `BEGIN`/one attempt persistent lease before any Google provider request. Initiate exactly one PRIVATE resumable Google video session, using official Google API. Seal the returned upload-session URL server-side; persist ciphertext+IV in ledger **before** sending bytes.
6. On ambiguous network failure or no durable session proof, quarantine; no retry, no implicit credential reset, no fake posted status.

### Resume flow — one bounded chunk per explicit server invocation
7. Verify Owner+AAL2, article revision, rights, exact ledger immutable metadata, existing lease and current Google credential on each invocation. Open only sealed stored Google session; no new initiate operation.
8. Query Google same-session `308 Range` first. If original source byte hash changed, stop. Send up to 4MiB aligned chunk (except exact last smaller chunk) and persist acknowledgments. Timeout/5xx -> UNKNOWN quarantine. Retried UNKNOWN may only inspect existing same Google session; **never** send bytes or create new session until separate trusted human reconciliation.
9. When Google returns an actual 11-character video ID, durably store `RECEIPT_PENDING`, then independent `videos.list` verifies exact existing Channel ID and privacy **private**. Even on success, ledger `PRIVATE_VERIFIED` is **NOT** a public/news `Posted` status. A separate deliberate Founder publication approval is required.
10. Failure-mode tests include missing Founder AAL2, wrong channel, absent rights, wrong article, fake/public video, corrupted private original, absent reservation, duplicate and UNKNOWN, provider 503/network, wrong byte range and lost lease. No public client receives tokens or upload session.

### Actual source checks (to be run in CI)
- Node synthetic provider API and storage/ledger fixtures test PRIVATE upload from start to receipt; duplicate request and UNKNOWN cannot reinitialize; 4MiB+short final chunk; no forbidden channel or public/Posted.
- Existing PR77 **real PG17** isolated DB test ensures durable unique lease, anon/auth deny, UNKNOWN quarantine and private receipt state; no production database or secrets in GitHub CI.
- Existing Phase3, B10, OAuth and T079 read-only preflight suites stay required.

## Deferred integration (not false PASS)
- The actual service adapters (Supabase auth Owner/AAL2, private object file read, server encryption/key, actual production ledger RPC and Google credential) are defined contracts, **not yet deployed** to a public endpoint; this means the new worker CANNOT yet upload real content in production.
- SQL is still review-only, deliberately **not** an applied migration until T078 E8/rollback gate and independent security review. No Vercel/Google Secret changes, no GoDaddy changes.
- Production usable video asset doesn't exist. Founder manual input will ONLY be requested when safe separate release and owned video are ready.
- Current JANTA BOL existing original YouTube provider controls, OAuth, Founder LIVE, Article masters, social website, Cricket/Saarthi all remain untouched.
- **Full P4-T079 remains IN_PROGRESS, external upload E6 real proof DUE.** T078 E8 HOLD unaffected. NO FAKE PASS.

## Next controlled engineering gate
Integrate real private-only storage adaptor, approved-intent RLS+Founder gateway, sealed resumable-session encrypted durable SQL transaction and provider receipt auditing **in a separate isolated environment** with the original PG17 suite; then independent Main/production code+rollback review and actual Founder-owned PRIVATE video test. Until then preserve fail-closed manual share.
