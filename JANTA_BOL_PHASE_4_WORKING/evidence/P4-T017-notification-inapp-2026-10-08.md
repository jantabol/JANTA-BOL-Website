# B6 P4-T017 — In-app notification delivery implementation, 2026-10-08

## Verified LIVE backend
- `public.live_notifications` has four compliance notifications, all `IN_APP_READY`, recipient Owner.
- SELECT RLS on `live_notifications`: `recipient_user_id = auth.uid() AND private.current_session_active()`.
- `notification_delivery_outbox` previously had zero rows. No external delivery proof.
- Cron job 5 existed, but no scheduled execution receipt was yet available at inspection.

## GitHub implementation
Commit `3e5162d698a4b5f1933c245b7cbcec3448f17f4c` updates `JANTA_BOL_PHASE_3C_WORKING/compliance.html`:
- Adds an Android-friendly Compliance Notifications section and manual Refresh Notifications button.
- Reads the authenticated user with `auth.getUser()`; queries `live_notifications` restricted by recipient and domain, 20 most recent.
- Relies on backend RLS as authoritative access check; no elevated client secrets.
- Uses `textContent` and DOM creation for notification content; no untrusted HTML injection.
- Shows state and timestamp; no unsupported claim of external delivery.
- Only provides a fixed `compliance.html` action link, not arbitrary DB-provided URLs.

## Verified checks
GitHub read-back at blob `ff74b0655d0274d059ed129471793108f28ec9b4`: all seven static assertions passed (section, recipient filter, domain filter, safe DOM, refresh handler, boot, no direct notification update).

## Pending
- Real Android Owner+AAL2 screenshot of four notifications, refresh behavior, expired/revoked session denial and network failure.
- GitHub CI run and cross-module regressions not yet verified for this commit.
- External WhatsApp/SMS/email delivery remains NOT IMPLEMENTED/NOT VERIFIED; no provider selected and no delivery receipt.
- First automatic cron job execution and synthetic deadline transition under new shared core remain pending.

Status: **IN-APP UI CODED + STATIC CHECKS PASS; FULL P4-T017 IN PROGRESS.**
