# B7 MEDIA SERVICE RECEIPT BRIDGE — 11 OCT 2026

B7 ADS-015 11 OCT 2026 — REVIEW ONLY. Source 8756d39e3353280baaefdc3598cc3a96370db320. Candidate CI 38120325295 SUCCESS 17/17. Protected run 38120325252 verify separately. Added canonical Creative latest-draft + Owner AAL2 recheck AFTER private WASM Storage SHA readback; restricted service_role-only receipt/orphan RPCs to existing private append-only ledger, no other Creative SOT. Verified negative synthetic session-revoke, stale draft, forgery and absent DB migration. New private evidence trigger locks canonical campaign FOR UPDATE to serialize against Creative SAVE/APPROVE. Real E3/E5, original/derivative LIVE buckets, real private worker, video/poster, E7 and Founder final approval DUE. P4-T034..042 0/9 FINAL PASS+LOCK. ZIP BLOCKED.

Status: DRAFT REVIEW ONLY / NO DEPLOYMENT / NO PRODUCTION SQL / PR #5 UNMERGED.

FIRST DIVERGENCE: separate verified private Storage helper existed but no canonical Creative-to-durable-receipt coordinator. Added repeated Owner/AAL2 authority check, pending latest Creative version read, service_role-only insert/read/orphan receipts, immutable quarantine, post-Storage Owner recheck and campaign row locking.

Actual RED: mock session revoked at call four instead of actual third call; corrected test without relaxing guards. PostgreSQL orphan-events id conflicted with PL/pgSQL variable; corrected. service_role fixture intentionally lacks direct public.ad_creatives SELECT; moved non-approval guard under fixture owner rather than expanding privileges. Null orphan path/bucket or reason fail closed.

Actual E2: Synthetic owner identities, Node server adapters + image staging/readback checks and PostgreSQL 17 disposable grants/trigger tests. They are NOT live Owner AAL2 E5 or Android E3. New RPCs on branch are not deployed and could require future function security audit before live. Neither storage objects nor media were uploaded to live environment.

Release gates: video, poster, real phone images/EXIF, private first-party buckets, actual isolated worker, public-only approved sanitized derivative and immutable attestations, LGD real Gov source, E7 deployed parity, final Owner signoff. FINAL 0/9 PASS+LOCK; B7 ZIP BLOCKED.