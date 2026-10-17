# JANTA BOL — B7 P4-T041 AUDIT RELEASE HOLDS
Date: 10 October 2026 | Source branch: `codex/b7-blueprint-20261010` | **REVIEW ONLY**

## Existing authority: ONE home per concern
- Notifications: preexisting B3 `jb_notification_emit_internal`, `live_notifications`, outbox and delivery history. Current B7 staging routes only IN_APP, does not assert WhatsApp/email/push sent.
- Commercial history: preexisting `ad_history`, immutable `audit_logs`, B3 `record_retention_state`, `record_retention_history`, `ads_history_v1` (2555-day, automatic_disposition=false).
- Paid/billing/article analytics and canonical Article URLs are outside this T041 modification. Ad Viewability tokens remain separate T040 partial.

## Hardened source checkpoint (NOT LIVE)
1. Owner's immutable failed-notification record uses row lock `FOR UPDATE`, then B3 notification and append-only `ad_notification_retry_succeeded` receipt. Two session CI races a deliberate B3 one-second simulated delay and accepts only one success record. Existing historical failure untouched.
2. A newly imported/backdated ad_history event records its original created_at+policy days; due records remain inspectable and are NEVER physically auto-deleted. Legal HOLD persists. Existing history backfill unchanged.
3. Suspended Owner (existing team_accounts status contract) is denied notifications; ads/news continue and sanitized NOT_CONFIRMED failure is recorded. Restored test owner can retry safely.

## CI source of proof
- `ci/phase4/b7-notification-concurrency-setup.sql`
- `ci/phase4/b7-notification-concurrency-verify.sql`
- `ci/phase4/b7-notification-regression.sql`
- `ci/phase4/b7-retention-regression.sql`
- New work is inside the existing 13-job Candidate suite, while full protected Phase3+4 workflows remain unchanged except strengthened conditional T123. **Only GREEN on exact last SHA counts.**

## Do not deploy, merge or LOCK until
- Actual staging implementation of full B3 emitter and production-like RLS/Owner AAL2; concurrent multi-device/revoked-session negative results (E5).
- Real Android Owner failure screen, notification ack and safe retry (E3) and provider failure/WhatsApp proof only if actually sent.
- Verified official MP 55 districts + Tehsil IDs, approved quote/consent/payment and full paired backend/public feed/analytics deployment parity.
- Founder/legal retention/disposition review; no automatic physical purge.
- P4-T034…T042 9/9 REAL PASS (currently 0/9 final locked). NO FAKE PASS; B8 must wait.
