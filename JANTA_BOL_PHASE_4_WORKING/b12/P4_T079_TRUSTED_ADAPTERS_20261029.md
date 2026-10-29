# JANTA BOL P4-T079 — Trusted Google Upload Worker Adapters (Isolated)
**29 October 2026 IST — NO LIVE PROVIDER UPLOAD**

This review-candidate follows Draft PR #78 YouTube PRIVATE upload orchestrator with no old-source edits. Aim: replace unsafe/missing integration boundaries with explicit Owner, canonical article, private storage, durable SQL RPC and AES-GCM port implementations **in isolated tests only**, not a production public Edge endpoint.

## Completed code
`CODEX_CURRENT_SUPABASE/functions/jb-youtube-video-worker/trusted-adapters.mjs` implements:
- `createOwnerAndIntentPorts`: validates JWT with actual `auth.getUser`, ties JWT subject/session and AAL2 to server-side `jb_live_actor_context_internal` active Owner. Verifies exact stored YouTube channel ID/Google refresh/scope, canonical published and undeleted article version, global/per-article YouTube/API switches. Calls a **required** independent server-only, Founder-signed/provenance approval registry; missing approval => HOLD, never trust a request Boolean.
- `readPrivateOriginal`: only exact private-editorial/youtube-news MP4 paths, downloaded via server-side Supabase Storage, max 50MiB, never grievance/reader/private unrelated files, arbitrary external URLs, or public-media. Worker independently SHA256-checks every received asset before sending anything to Google.
- `createLedgerPorts`: maps prior real PG17 review-only reserve/begin/transition RPC contract, requires real service-role-only readback; nonexisting DB procedure => fail closed, never return fabricated state. The REVIEW_ONLY SQL adds an isolated `jb_t079_video_get_internal` read RPC: SECURITY INVOKER, anon/authenticated EXECUTE revoked, service_role only.
- `createSealedSessionPorts`: AES-GCM 256-bit key, fresh 12-byte IV and AAD bound to exact job UUID; changing job, ciphertext or IV makes decrypt fail, no URL/token in app/browser.
- `getAccessToken` port uses a required server-only credential issuer, never a request token. Added review-only `credential-issuer.mjs`, which decrypts the existing active encrypted Google refresh secret in server memory, fetches a short-lived access token, verifies exact Google `channels.mine` and upload scope, and denies wrong environment/rotated refresh without pretending persistence; not deployed in production. Existing OAuth health and active refresh credentials are never modified by this candidate.

## Proof/limitations
- Current CI exercises real review-only PostgreSQL17 private ledger with unique durable intent and role ACL plus Node mock tests for Owner, AAL2, cross-session, rights registry, article switches, wrong bucket, AES seal/tamper, Google issuer and service-only ledger RPC; old Youtube/private-worker/phase3 security regressions run.
- A review-only credential issuer implementation now exists and is tested with synthetic Google responses, **not deployed**. An independent Founder-owned media/rights approval registry is **still required and cannot be invented**. Existing production JANTA BOL has no immutable video approvals or MP4 and no deployed upload ledger; without independent trusted records the adapter cannot issue an upload.
- No Edge entrypoint `index.ts` for uploader is added or deployed. The actual isolated `jb-youtube-video-preflight` remains read-only. No change to YouTube OAuth, public social articles, LIVE publishing, GoDaddy domain, Vercel, B10 security, B11, Cricket.
- No Google video API call has been made; no new production Supabase schema/secret created; B12 P4-T078 E8 rollback still HOLD. **P4-T079 real Google news-video upload E6 DUE, full T079 IN_PROGRESS**, although actual YouTube OAuth refresh+channel remains PASS+LOCK.

## Next nonfake release gate
Before a true Founder-triggered private video test: separately security review service-role RPCs, implement approval provenance, review and connect credential issuer from existing server-only Google OAuth with rotation and quotas, prove production release rollback/restore (T078 E8), then obtain Founder-controlled MP4 and legally valid rights attestation. Only then authorize actual private videos.insert; never automatically publish public or write fake Posted.
