# JANTA BOL — PHASE 2 SECURITY RUNBOOK

STATUS: PRE-TEST SUPPORT RECORD — NOT FINAL PASS/LOCK
SOURCE: Phase-2 Master Blueprint security tests #105–#113 and #124–#126.

## #105 — Phone unavailable, Tab available
Expected drill:
1. JANTA BOL Tab must already have its own verified independent MFA factor/trusted session.
2. Founder verifies Tab is known-clean and AAL2.
3. Lost/unavailable Phone session is identified in Founder Security Center and revoked.
4. Affected Phone MFA factor is revoked when risk requires it.
5. Replacement Phone is set up with a fresh independent MFA factor.
6. New factor/session is tested before normal work resumes.

Status: 📱 MANUAL PHONE + TAB VERIFICATION REQUIRED.

## #106 — Tab unavailable, Phone available
Mirror of #105:
1. Main Phone remains known-clean + AAL2.
2. Tab session revoke.
3. Affected Tab factor revoke when required.
4. Replacement/recovered Tab gets fresh independent factor.
5. Test before normal use.

Status: 📱 MANUAL PHONE + TAB VERIFICATION REQUIRED.

## #107 — Temporary device/network conditions
Examples from Blueprint: battery dead, SIM/network fail, Wi-Fi available, existing trusted session alive.
Expected: a valid trusted AAL2 session must not demand unnecessary fresh 2FA merely because the other device/SIM/network is temporarily unavailable.

Status: 📱 MANUAL DEVICE/NETWORK VERIFICATION REQUIRED.

## #108 — SMS temporary bridge
Blueprint allows SMS only as a temporary bridge where implemented safely; it is NOT primary security.
Current Phase-2 working code has no approved SMS MFA provider/bridge implementation.

Status: ⚠ FOUNDER DECISION + EXTERNAL PROVIDER/CONFIGURATION REQUIRED before this test can be implemented/finally tested.

## #109 — Repair flow
SHORT + SUPERVISED repair:
- Normal Logout is sufficient unless risk changes.

LONG / UNSUPERVISED / physical control lost:
- Revoke affected session.
- Revoke affected factor according to risk.
- Do not create fresh secrets on a device that may be compromised.

Status: 📱 MANUAL PROCESS DRILL REQUIRED.

## #110 — Planned replacement
Required sequence:
New Device → Fresh Factor → Test → Trusted Device Confirm → Old Device Revoke → Only then Reset/Sell/Retire.

Status: 📱 MANUAL PROCESS DRILL REQUIRED.

## #111 — Password-only compromise
If 2FA + Emergency Key are safe and there is no unknown session:
- Rotate Password.
- Do NOT rotate 2FA/Emergency Key without reason.
- Check sessions/security activity.

Status: 📱 MANUAL SECURITY DRILL REQUIRED.

## #112 — 2FA-only compromise
- Revoke/rotate affected factor.
- If Password + Emergency Key remain safe, do not rotate them unnecessarily.
- Use another trusted device/factor for recovery where available.

Status: 📱 MANUAL SECURITY DRILL REQUIRED.

## #113 — Password + 2FA compromise
- Treat as Full Login Security Reset.
- Contain sessions.
- Rotate password + affected factors.
- Rebuild trusted access from a known-clean device.
- Verify Emergency Recovery state according to actual compromise evidence.

Status: 📱 MANUAL SECURITY DRILL REQUIRED.

## #124 — Unknown Active Session incident
Mandatory sequence:
CONTAIN → Unknown Session Revoke → Evidence Preserve → Sensitive Operations Stop.
- Before/while revoking, Security Center attempts to preserve target session label/browser/IP/AAL/login/last-active metadata in Owner AAL2 Security Activity.
- Evidence-save failure must not delay containment; Founder records the visible details manually if the UI warns that evidence save failed.
- Known Phone/Tab sessions should be labeled in advance so an unexpected session is easier to identify.
Do not close incident merely because a password was changed.

Status: 📱 MANUAL INCIDENT DRILL REQUIRED.

## #125 — Root-cause investigation after unknown session
Investigate at least the applicable Blueprint classes:
Password / TOTP / session or browser-token theft / malware / malicious extension / XSS / AAL2 bypass / Recovery weakness / Backend-API / RLS / infrastructure / future unknown mechanism.

Closure requires reasonable root-cause narrowing + weakness fix + security retest.

Status: 📱 MANUAL INCIDENT + INVESTIGATION DRILL REQUIRED.

## #126 — Known-clean device rule
Potentially infected/compromised device par fresh secrets setup nahi karne.
First: Clean/Reinstall/Replace.
Then: known-clean device se Security Rebuild.
Security Center fresh MFA QR generate karne se pehle known-clean/trusted-device acknowledgement mangta hai.

Status: 📱 MANUAL PROCESS DRILL REQUIRED.

## Permanent runbook rule
This runbook is not evidence of PASS. Founder must execute the relevant real/manual drill and confirm actual result before FINAL PASS + LOCK.

## FINAL MFA FACTOR PRIVACY — #121 / SU-T29
1. PRE-TEST/testing MFA factor ko FINAL PRODUCTION factor assume nahi karna.
2. Final Phone aur Tab factors ko trusted devices par fresh, independently enroll karna.
3. Final enrollment QR/seed/secret ko screenshot, screen recording, chat, gallery, cloud note, clipboard history ya test evidence me save/share nahi karna.
4. Verification ke baad QR screen close/clear karna; code UI bhi QR DOM destroy karta hai.
5. Agar kisi factor ka QR/seed testing/screenshot/chat me expose ho jaye, us factor ko FINAL PRODUCTION use nahi karna; fresh private factor enroll karke exposed factor revoke karna.
6. Fresh Phone + Tab factors dono verified hone aur login/session test successful hone ke baad PRE-TEST/test factor revoke karna.
7. Founder manual verification ke bina #121 FINAL PASS/LOCK nahi hoga.



## #114–#118 — Emergency recovery execution sequence
Technical integration now supports this manual sequence:
1. Founder uses Password + Emergency Recovery Key only in genuine recovery.
2. Recovery Key verification opens LIMITED RECOVERY MODE; normal Admin authority remains blocked by the app and AAL2 backend policies.
3. Page lists verified TOTP factors by friendly label/status without displaying factor IDs.
4. Founder selects only the affected/lost factor and confirms revoke.
5. Existing JWT-protected `jb-recovery-delete-mfa` server function verifies the Recovery Key and deletes that verified factor. Supabase admin factor deletion invalidates all active sessions for the user.
6. Recovery Key is not persisted by the page; successful cleanup clears the in-memory copy and Limited Recovery flag.
7. From a known-clean personal device, Founder signs in, creates fresh private MFA factor(s), verifies access, then REPLACES the Emergency Recovery Key. The pre-recovery key must not remain the final recovery credential.
8. Old/lost sessions and old factor must be absent before incident closure.

IMPORTANT: Step 5 is destructive and must be Founder-observed. The PRE-TEST build does not auto-delete the current real factor just to manufacture a PASS.