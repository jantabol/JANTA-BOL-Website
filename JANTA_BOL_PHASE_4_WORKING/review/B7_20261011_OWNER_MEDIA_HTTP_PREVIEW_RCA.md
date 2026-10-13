# JANTA BOL B7 Owner Private Media HTTP Preview — RCA & Verified Evidence
Date: 11 October 2026. REVIEW-ONLY, NOT DEPLOYED. No live writes.
Exact coding SHA 2cc2e04dd21e232ceda53c998b49512f3ae47246. GitHub Candidate run 38114596493 SUCCESS 17/17; protected 38114596457 SUCCESS 2/2.

FIRST DIVERGENCE: Original Media Studio existed only as LOCAL browser preview and separately testable real server WASM sanitizer. There was no authenticated Owner HTTP bridge. Created minimal bounded POST handler calling canonical Auth /auth/v1/user and the already defined staged Owner/AAL2 RPC jb_ad_creative_workflow_capability_internal. It uses only client anon key, no service_role and NO new parallel Owner authority. Missing staged capability denies. Never deploy without E5.

REAL CI RED RCA: 38114348621 failed eight Deno strict TS7006/TS7031 untyped HTTP arguments; fixed via Request, PreviewDependencies and SanitizedPreview types. No CI skip. Potential Content-Length/body mismatch found; fixed with actual byte length equality after bounded stream. Synthetic negatives include forged smaller/larger header, overflow, malformed/multiple files, revoked/AAL1 simulated Owner, wrong RPC response, invalid origin, and forged sanitizer approval.

POSITIVE SYNTHETIC E2: actual generated PNG enters request multipart and reaches genuine pinned ImageMagick WASM decoder. Output is a private clean PNG with real dimensions, no ancillary metadata and no storage, approval, published URL or public ad feed. Owner authorization is simulated in these tests; never claim human/AAL2 session passed.

Actual LIVE READ ONLY independent authority: p4_owner_allowed checks user_roles owner + current_owner_aal2; current_owner_aal2 checks AAL2 and current_session_active; current_session_active confirms auth.sessions. No Production write or migration. 5 campaigns, 0 live, 11 creatives, staged capability RPC not deployed and existing B5 RESTRICTIVE policy preserved.

BLOCKED: Real Owner AAL2 E5 and Android E3, original private bucket, immutable media ledger and verified public processed derivative, real phone image/EXIF and video H.264/AAC poster work, verified official MP district/tehsil LGD, actual deployed E7 and Founder signoff. B7 canonical P4-T034..T042 = 0/9 FINAL PASS+LOCK; B7_ADVERTISEMENT.zip blocked.