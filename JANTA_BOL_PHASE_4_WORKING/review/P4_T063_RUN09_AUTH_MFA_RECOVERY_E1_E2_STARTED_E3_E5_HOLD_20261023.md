# JANTA BOL — B10 P4-T063 RUN-09: Real Device Auth/MFA/Session/Recovery Test Checkpoint
23 October 2026 IST. **Status: TEST STARTED; E1 code/CI preflight PASS, E2 sampled server guards PASS, E3 real Android and comprehensive E5 pending; FINAL PASS + LOCK = HOLD.** No T064 work authorized/started by this checkpoint. No interim Master ZIP for user.

## Official Original Contract
Original Phase-4 Final Execution Pack, Topic 9 Sections 517–533, P4-T063, **MANUAL / REAL-DEVICE**:
- Correct/wrong login, repeated failures, new device MFA/AAL2 and factors
- Owner sessions, safe lost-device revoke, 15-minute inactivity lock/unlock
- Emergency Recovery in deliberately limited mode, new verified TOTP and recovery key replacement
- Sensitive-action fresh reauth, old-session invalidation, brute-force protection, preserved normal work
**Required E1 CI; E2 Backend; E3 real Android; E5 audit/history.** Phase-3 Security/Auth/Session/MFA tests must remain protected.

## Backend/Supabase E2, READ ONLY — JANTA BOL ONLY
- LIVE project vrffsnkycvjithwtiylt. Found exactly **1 Founder Owner**, **2 VERIFIED owner TOTP factors**, **0 unverified owner TOTP**, **52 auth.sessions historical database rows** (do not interpret as 52 active current devices), **1 Owner session created within previous 24h**.
- Owner Auth guard source checks current_app_role = owner, valid JWT AAL2, AND match to an actual auth.sessions row. Recent MFA guard separately checks matching TOTP/phone AMR timestamps within max 600 seconds.
- Owner session-list, session-revoke and recovery-key set RPCs are **NOT anon-executable**. Read-only forged owner role + AAL2 on nonexistent session: backend current_session_active false, Owner AAL2 false, fresh MFA false, source/history/audit reads 0. No real JWT token, passwords, recovery keys, sessions, factor secrets or user emails returned or modified.
- Protected historical audit: security_logout_all_devices 8; security_logout_other_devices 16; security_mfa_factor_add_requested 10; security_mfa_factor_remove_requested 7; security_password_change_requested 14; security_session_revoked 9; security_session_evidence_preserved 9; owner_recovery_key_set 6. These historical events substantiate existence/provenance, NOT proof of present Android scenario or rate-limiting behavior.
- Current Supabase Security Advisor still flags auth_leaked_password_protection **WARN** (1), requiring scoped owner dashboard verification. Do not disable security or attempt password spraying. Existing 22 anon Security Definers and 117 authenticated as previously recorded for T064 separately.

## Source E1 and scoped fix (NO production Vercel deployment)
1. Original login Admin HTML, backend client, Security Center, limited Emergency Recovery and recovery-key setup reviewed.
2. Found attacker-controlled `?next=` used without validation by both successful Owner MFA login and local device unlock, potentially redirecting verified Founder to arbitrary external domain. Patched ONLY `JANTA_BOL_PHASE_3C_WORKING/admin-login.html` to use `safeNextPage()`, accepting only local same-directory HTML basenames (optional query), rejecting schemes, `//`, path traversal, login/recovery redirect loops, CR/LF and fragments; both success paths use safe destination. **Do not claim this is already deployed to Vercel or present in old SPCK import.**
3. New `ci/phase4/b10-t063-auth-manual-preflight.test.mjs`: 5 Source regression tests on redirect input cases and both navigation paths, Founder role + AAL2 verification, inactivity fail-closed/backend session, logout scopes and live-revocation RPCs, limited recovery confirmation/key-handling/new MFA guards. Does not imitate fake Android biometric proof.
4. CI workflow `.github/workflows/b10-whole-platform-security-candidate.yml` runs this suite alongside B10 PG17, B9, protected B0–B8 Phase-3 Auth/Recovery/Incident, no production secrets. **Run 39972604263 SUCCESS**, HEAD `17813b725d0333bcdf84f7afcafb722049189866`. Optional older B8-only ZIP CI job is intentionally SKIPPED, not counted as PASS.

## Safeguarded E3 Android Test Sequence (not performed in tool)
- **E3-01:** On known trusted Android phone Chrome HTTPS, verify actual JANTA BOL Admin Login page & domain. Screenshot must exclude passwords, email, MFA codes, QR seeds, recovery keys and JWTs. Do NOT execute login until test target/version confirmed.
- E3-02: Real owner correct password then MFA AAL2 / factor selection, current device secure access, and wrong 6-digit input controlled single attempt (no repeated spraying on production).
- E3-03: Admin inactivity >15min: protected view locked and local-unlock requires verified secure platform method with still-valid server session; biometric unsupported = fail-closed.
- E3-04: On secondary trusted Android tablet with explicit test-only account and backup MFA available, confirm new device session, recent MFA sensitive action requires TOTP, observe Owner Security Center session enumeration without copying IDs outside app.
- E3-05: Lost-device revocation and Emergency Recovery require a **separate Founder decision** after confirming two fully verified MFA factors and offline physical backup key; never remove factors, revoke all current sessions, reset password or destroy active login just to generate test evidence. If safe isolated test identity unavailable, keep partial HOLD.
- E3-06: After a genuine controlled revoke, old session must be rejected by backend; E5 event/history must match observed behavior. Re-login/new TOTP recovery only in approved controlled scenario.
- E3-07: final normal operations Auth/News/Live/Ads no regression and exact new source deployment parity check; pre-existing deployed Vercel HTML may lack T063 redirect fix until scoped release.

## Critical definitions
A verified Auth factor count is NOT a proof of safe 2FA on phone/tablet. The 52 historical sessions are NOT current active devices. Neither a PDF nor all-green CI substitutes for E3. The original T063 PASS condition includes normal/wrong login, lock/recovery, brute-force protection and fail-closed old-session invalidation, so **T063 NOT LOCKED yet**. B8 and B9-T105 older independent HOLD gates remain. All Cricket/Saarthi projects/resources untouched.

## Next safe Founder step
Open actual JANTA BOL `admin-login.html` with Chrome on trusted HTTPS site OR open SPCK preview for visual-only UI check, and share **page screenshot showing address bar and login header ONLY, no passwords, OTP, QR or personal email**. Confirm production-version differences before performing sign-in. Avoid Logout All, MFA Factor Remove, Recovery Verify, or password reset until explicit isolated plan.
