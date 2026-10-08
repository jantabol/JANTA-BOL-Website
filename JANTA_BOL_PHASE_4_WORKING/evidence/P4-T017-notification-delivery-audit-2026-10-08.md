# P4-T017 — LIVE notification delivery and scheduler audit (2026-10-08)

Status: IN PROGRESS. Read-only evidence; no new PASS.

## Verified LIVE database facts
- public.jb_compliance_refresh_deadlines_internal(p_now timestamptz DEFAULT now()) is SECURITY DEFINER and calls private.p4_staff_allowed(). This permits active admin/editor sessions and Owner AAL2; it does not provide an authenticated cron service identity.
- Four-state lifecycle SQL in ci/phase4/db-b6-deadline-lifecycle.sql uses a rollback-only owner/AAL2 synthetic session, checks compliance_history and live_notifications and repeats each transition for dedupe.
- public.jb_notification_emit_domain_internal and public.jb_notification_emit_internal have no direct EXECUTE privilege for anon or authenticated; both are SECURITY DEFINER.
- public.jb_notification_delivery_attempt_internal has no direct EXECUTE privilege for anon or authenticated. It updates live_notifications and inserts notification_delivery_history, but source inspection alone is NOT proof of actual external delivery.
- LIVE public.live_notifications has 160 rows, 4 in compliance domain; all 4 compliance rows are IN_APP_READY. No EXTERNAL_SENT receipts were observed.
- public.notification_delivery_outbox has 0 rows; public.notification_delivery_history has 11 IN_APP/EMITTED rows.
- LIVE compliance_tasks has 0 pending tasks with a nonnull due_at at inspection time.
- cron.job contains only jb-live-expected-end-minute and jb-live-worker-every-5s. No compliance job.

## FIRST DIVERGENCE / RCA
Deadline refresh is an authenticated staff RPC. pg_cron executes in a database job context without the staff session JWT. Scheduling the existing RPC as-is would fail private.p4_staff_allowed(). Adding an unsafe privileged cron bypass or opening RPC EXECUTE to anon is prohibited.

## Safe closure gates
1. Introduce a dedicated, least-privilege, private scheduler entrypoint with a proven authorization boundary and idempotent shared deadline-transition core. Never grant public/anon/authenticated EXECUTE to that scheduler entrypoint.
2. Test scheduler execution as its real database role, not a forged browser JWT. Preserve Owner/Staff RPC gate.
3. Test rollback-only fixture: 4 states, one history/notification each, repeats, completed exclusion, role-denied access, and safe retry/failure.
4. Confirm actual cron registration and job execution in cron.job_run_details, plus Android in-app display where manual device evidence is necessary.
5. Do not conflate IN_APP_READY with external delivery; no external channel is proven or required without an approved channel/provider.

## Security / scope
No LIVE production rows changed during this audit. No PASS or LOCK assigned. Keep B6 T017 IN PROGRESS.

## 2026-10-08 LIVE execution of read-only authorization assertions
A DO-block executed through the Supabase SQL connector without exception: verified refresh function contains p4_staff_allowed gate; delivery attempt function exists and is not directly executable by anon/authenticated; confirmed compliance cron remains absent. This is targeted security evidence only, not notification-delivery proof or complete T017 PASS. Repository SQL artifact: ci/phase4/db-b6-notification-delivery-audit.sql (commit 7716a6e88e7ed9ba151f0d60feca31ee2e428720). The repository SQL file has NOT been independently run in GitHub Actions yet.
