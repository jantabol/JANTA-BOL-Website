# JANTA BOL / B12 / P4-T079 — YouTube News Video Distribution Backend
**Date:** 29 October 2026 IST | **Priority:** Existing verified JANTA BOL YouTube first; no additional social accounts until Youtube evidence milestone.
**Root security rule:** Website is the news master. YouTube is optional. No auto-posting, no blank/fake receipts, no modification to Founder Live/OAuth/security controls.
**Verdict:** READ-ONLY BACKEND PREFLIGHT SOURCE AND TESTS IMPLEMENTED; official YouTube news-video **REAL_UPLOAD_E6_DUE**; overall T079 **IN_PROGRESS**.

## Backend independent LIVE facts — JANTA BOL Supabase ONLY
- Real JANTA BOL YouTube OAuth has already **PASS+LOCK** for Founder consent, server-only Google refresh-token exercise and same Channel ID: **CONNECTED**, `last_refresh_status=OK`, current real `youtube_oauth_refresh_verified` audit, Edge v2 HTTP 200 at 29 Oct 20:56:57 IST. Do not ask Founder to reconnect.
- Two **published** JANTA BOL articles at inspection, **zero** with `video_url` and **zero** with MP4 in `additional_media_urls`.
- Existing `social_distribution`: **zero YouTube-selected** Article rows, zero global-enabled AND per-article YouTube selected, zero selected API mode. Founder must explicitly select a published article later; selection of a video workflow alone does not grant automatic API posting.
- Actual Storage: 2 grievance-private files, 1 private-editorial, 2 public-media; **No MP4** in any bucket. Original private grievance bucket is prohibited from being used for YouTube, even if it contains a video in future. Public media URLs are not an independent proof of rights/consent.
- There is no current production table holding a strong durable YouTube upload ledger with provider video ID, article version/asset hash, verified server-side source/provenance, and ambiguity quarantine. Existing `social_distribution_history` is a *manual/social status* history, not a safe resumable upload idempotency ledger.
- Original B4 social UI explicitly rejects fake `Posted` and offers Manual Share fallback. No new actual YouTube API post has been performed, and none is permitted by this preflight.

## Implemented scoped backend readiness function (additive, isolated)
New `CODEX_CURRENT_SUPABASE/functions/jb-youtube-video-preflight/index.ts`:
- POST `{"action":"article_preflight","article_id":"<uuid>"}`, valid only for authorized Founder with Supabase authenticated session, AAL2 and server-verified Owner+active session.
- Exact production website origins and matched existing Google credential/deployment environment; no secret values in browser.
- READ ONLY: checks YouTube connected/healthy, server pinned expected channel matching verified channel, real last Google refresh OK and correct granted scope; also checks `social_settings.global_enabled`, Article `published`+not deleted, Per-News `enabled=true`, `youtube=true`, `provider_mode='API'`, and presence of a video reference.
- Fails closed on any missing switch, wrong channel, missing article, no video or failed database read. No public article correction, media, credential, Live or social mutation.
- Even if an article references a video, marks `VIDEO_MEDIA_PROVENANCE_UNVERIFIED` until Founder-approved original-owned video and source privacy checks exist. **Never fetch arbitrary article media URL** (SSRF/rights). **Never** count arbitrary text/link as uploaded video.
- Unconditional fail-closed `DURABLE_UPLOAD_LEDGER_NOT_APPROVED` and `REAL_PROVIDER_UPLOAD_E6_NOT_RUN` prevent premature social POSTED/YouTube PASS. Always returns `NOT_READY_DUE`, `uploaded:false`, `posted:false`, `public_video_created:false`.
- No Google video API call, no LIVE-stream creation, no update/insert/delete, no outbound arbitrary fetch. No new backend secrets or paid services.

## Original YouTube video upload adapter — what remains before external E6
**DUPLICATE publishing guard is mandatory:** one durable, idempotent reservation per immutable article+video+channel; an UNKNOWN Google outcome must never be retried as a second upload.
An actual Google `videos.insert` upload is a side effect that cannot honestly be tested without a real Founder-owned video (video exists nowhere in current backend). This is **not** the same as YouTube channel OAuth being connected.

Before enabling any media upload worker, independently prove:
1. Founder-selected *published* article, correct permanent URL; explicit right-to-use proof, media content and dimensions/MIME/provenance, video content uploaded to an approved dedicated private source (NOT grievance/reader file and not external URL).
2. A protected upload ledger (e.g. idempotency key = article UUID + immutable article version + media SHA256 + YouTube Channel ID, unique DB constraint) with reservation before the first Google `videos.insert` request, lease/attempt ownership, one in-flight per key, durable resumable session pointer in secure server-only storage, safe UNKNOWN reconciliation. **Never retry a potentially completed upload by automatically creating a second session.**
3. Upload via official Google resumable video API with short-lived server-only access token. Initiate `uploadType=resumable`; on uncertain 5xx / timeout/308 query the same upload session status instead of blindly repeating or making a second `videos.insert`. Fail CLOSED on expired session until Founder-reviewed reconciliation. No Google token returned to Android/browser.
4. Initial privacy **PRIVATE**, no hidden public release or youtube `Posted` status before YouTube returns a video ID and a later `videos.list`/channel ownership observation verifies the actual saved resource. Separate deliberate Founder publish-to-public approval if needed.
5. Original B4 `social_distribution` API-mode and history updated only through approved Owner/server audited workflow; exact error codes safe, retries bounded, duplicate negative tests, connected/detached/revoked credential tests.
6. YouTube video uploads subject to Google Data API quota/permissions. Official references:
   - https://developers.google.com/youtube/data/reference/rest/v3/videos/insert
   - https://developers.google.com/youtube/data/guides/using_resumable_upload_protocol
   - https://developers.google.com/youtube/data/determine_quota_cost
7. A whole release rollback and source isolation review (T078 full E8/HOLD remains) before any production schema mutation. No new DB table or API writer is authorized by this report. **NO PRODUCTION VIDEO WRITE**.

## Status
**OAuth/refresh/channel match: PASS+LOCK.** New scoped news-video Backend preflight: Source/CI, with safe live function deploy only after reviewing CI. **YouTube news-video API upload: NO ACTUAL UPLOAD; REAL_UPLOAD_E6_DUE.** Full T079: IN_PROGRESS, other providers similarly DUE. Do NOT announce production auto-posting.
This prep incurs no new paid provider, doesn't change original T078, original B4 UI, social tables, original YouTube credential, Domain/Founder security, LIVE, or JANTA BOL public news.

Next actual Founder action **only after** a separate protected Video Media/Upload pipeline is ready: provide a real legally owned video and approve a private test upload. Until then, no manual step is requested. No automatic generation of a fake news video for QA.

## Review-only transport source — PRIVATE upload protocol assembled OFFLINE
A second additive artifact `CODEX_CURRENT_SUPABASE/functions/jb-youtube-video-transport/protocol.mjs` now contains the **isolated Google resumable upload transport**. It has NO autonomous caller, Cloud Worker deployment, database mutation, API key, Browser token exposure or execution on any real video.
- `mediaDescriptor`: only Founder-approved and rights-verified original MP4, SHA-256, <=50 MiB, `private-editorial/youtube-news/<articleUUID>/<asset>.mp4`; grievance-private source prohibited.
- `reserveGate`: rejects absent/leased/unknown/previously-resulted persistent idempotency evidence. A real durable transaction/ledger has NOT yet been deployed; the caller cannot bypass the guard with a public article status.
- `metadata`: ONLY explicit Founder-approved `privacy=private`, title, description, made-for-kids selection.
- `initiate`: official Google `videos.insert` resumable create-session POST; unknown 5xx/network => `UNKNOWN_RECONCILE_ONLY` and never creates a second session by itself.
- `querySession`: Google same-session status check, `308` exact byte resume offset, expired session HOLD, no duplicate hidden repeat.
- `uploadChunk`: max 4 MiB chunk, 256KiB alignment unless last chunk, no automatic retries on 5xx/timeout.
- `verifyPrivateVideo`: official `videos.list` resource ID, channel ID and `privacyStatus=private` independent confirmation; returns `posted:false`, never claims live public social distribution.
- A Node synthetic test matrix exercises both positive simulated responses and negative failures/duplicate/SSRF/forged channel/wrong privacy/expired-session handling. No network or real uploads are involved in these tests.
- Still required before runtime worker: transactional server-only durable upload ledger, media-provenance/rights policy, Founder-approve private video E6, current-point recovery and rollback release gate. This candidate protocol is code-reviewed in the Draft PR, **not deployed** and cannot create YouTube content.

## Actual source, CI, and isolated production preflight verification
- GitHub protected candidate source test **40906954984 SUCCESS** at source HEAD `772d80fc27e38b28832d712f90abb305cc977b5c`; protected old Phase3/B7/T079/Secret scans retained and no old source file changed. Follow-up final documentation-only CI source SHA must be verified independently.
- Isolated new Supabase Edge Function `jb-youtube-video-preflight` **ACTIVE v1**, `verify_jwt=true`, launched on original JANTA BOL project without modifying any of the existing 13+ protected Edge functions, old YouTube OAuth, LIVE or publishing. Independently fetched active source back; no `fetch(`, `insert(`, `update(`, or `delete(` anywhere in its handler. Zero social or news writes.
- Real Supabase independent AFTER-deploy read-only: `youtube_integration.connection_state=CONNECTED`, `last_refresh_status=OK`, exact channel IDs match, control OK, incident CLEAR.
- Real published news still **2**, with **0 video URLs**; real `social_distribution` YouTube selected **0**, selected API mode **0**. No output possible from preflight can claim `Posted`.
- New server-only Google resumable transport candidate `CODEX_CURRENT_SUPABASE/functions/jb-youtube-video-transport/protocol.mjs` has positive and failure-mode **synthetic** tests (start, 308 query, bounded chunks, unknown outcome, private video receipt, channel mismatch). It is **NOT deployed** as a writer. A Google video resource was NOT created.
- Release gate: full real YouTube video POST still due because no licensed/video media exists, no Founder-selected YouTube Article, no independently reconciled upload ledger or full T078/E8 rollback gate. **No real upload, no fake pass.**
