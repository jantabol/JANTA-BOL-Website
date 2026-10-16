# JANTA BOL — P4-T034 / E5 DISPOSABLE SIGNED-JWT HTTP REAL-RUN EVIDENCE
Date: 16 October 2026 (IST) | Test-only environment | FINAL T034: **HOLD**

## Founder-approved route A: free, isolated test service (no new hosted project)
Founder's A option authorized safe test environment and identities, trying a no-charge route first.
- Hosted Supabase **branch** quoted **$0.01344/hour**, **NOT CREATED**. Existing JANTA BOL organization plan: free. Supabase project quoted $0/month but no new project created / no organization choice assumed.
- Created on a **new review branch** and **public GitHub Actions disposable runner** (PostgreSQL 17.6 container + PostgREST 12.2.12 pinned Docker digest) instead. No managed project subscription; actual CI minutes may be subject to GitHub account quota/policy.
- Synthetic identities exist **only during CI job**, then Postgres container, JWT signing key and PostgREST are discarded. No credentials, tokens, OTP, or real personal contact data entered.
- **This is a REAL HTTP test with verified HS256 signatures** at `127.0.0.1:3099`. The issuer is a synthetic CI signing helper, **not GoTrue/Supabase Auth**. The PostgreSQL session roster mimics `auth.sessions` but is not a live Auth session. This is **NOT E5 final genuine Supabase Auth pass**.
- Source-aligned `private.current_session_id()`, `current_session_active()`, `current_app_role()`, `current_owner_aal2()`, `p4_owner_allowed()` and `p4_staff_allowed()` were inspected SELECT-only from the actual live project, with local stand-in tables/claims. Existing prior T034 legacy payment RPC fixture and exact additive SQL guard reused, NOT rebuilt; real production server migrations unchanged.

## GitHub evidence (original successful test-run source)
- Repo: `jantabol/JANTA-BOL-Website`
- Test source SHA: `f0e298e1226532cd877c847be6e362e8758ef6c4`
- Branch: `review/t034-e5-preflight-reconcile-20261016`, parent B7 `bd03084b0e42f8d1a65c53a4a047f6c8686a51a8`
- CI workflow `.github/workflows/b7-t034-e5-jwt-http-local.yml`
- Real CI push run [38885850408](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38885850408), job `116923275373`: all steps **SUCCESS**.
- Expected/actual test output:
  - `E5_LOCAL_DATABASE_ONLY=true; NO_PRODUCTION_CREDENTIALS`
  - `PASS T034 E5 LOCAL VERIFIED-JWT HTTP negative matrix cases=27`
  - `PASS E5: negative HTTP/JWT/AAL1/revoked/reporter/advertiser no state change`
  - `PASS T034 E5 LOCAL verified Owner AAL2 synthetic verify+paid HTTP positive cases=3`
  - `PASS E5: synthetic Owner AAL2 verification/audit/payment allowed, HIGH protected`
  - `E5_POSTGREST_SIGNED_JWT_LOCAL=PASS; REAL_SUPABASE_AUTH_E5=HOLD`

## Security evidence covered (ALL disposable local data only)
- No JWT anonymous direct table/approval+verification RPC requests denied.
- Reporter, Auth-linked advertiser fixture, Owner AAL1, Owner revoked-session fixture, and reporter JWT bearing forged `app_role:owner` could not read Owner private campaigns and could not call Owner payment/verification RPCs.
- Editor denied Owner payment/verification RPCs (but any original staff read policy is intentionally preserved).
- Tampered JWT signature and expired genuine-signed local JWT rejected by PostgREST.
- Reporter/AAL1/revoked attempts to PATCH paid-state table denied.
- Genuine locally signed Owner AAL2 JWT cannot pay an unverified HIGH-risk fixture even through old payment RPC.
- After **all 27 negative HTTP checks**, isolated database requery: **0 payments, 0 history, 0 audit writes, 0 paid campaigns**.
- Locally signed Owner AAL2 allowed synthetic NORMAL advertiser verification + audited history and subsequently verified confirmed-payment RPC; independent database asserts **one** confirmed payment, **one** paid synthetic campaign, verification audit/history, historical unverified HIGH-risk row still `payment_pending`. These are **NOT REAL payments or approval decisions**.

## Remaining E5 TRUE production-equivalent acceptance gates
1. GoTrue-issued, actual Auth JWT + `auth.sessions` lifecycle/refresh/revocation with genuine test users in a controlled separate environment; CI-issued JWT is not that evidence.
2. Actual production-equivalent schema/RLS/SECURITY DEFINER/RPC deployment parity, not a simplified fixture.
3. Full reporter, advertiser and revoked Owner; Owner AAL1 denied / Owner AAL2 allowed; source-linked state and audit before/after. No credentials/OTP or token contents in chat, and NEVER revoke the actual Founder.
4. Separate E3 Android evidence still needed only for those UI proof cells not previously passed. ADS001–009 final reconciliation and prior newsroom/security regressions remain due.
5. No consent for paid Supabase branch ($0.01344/hour quoted), production write, approval, verification, payment, or LIVE advertising. No new charge consent given.

**Current official status: E5 LOCAL SIGNED-JWT HTTP MATRIX PASS (27 negative + 3 positive), genuine Supabase Auth E5 HOLD; P4-T034 FINAL PASS + LOCK HOLD. Do not overwrite previous PASS or create a final ZIP.**
