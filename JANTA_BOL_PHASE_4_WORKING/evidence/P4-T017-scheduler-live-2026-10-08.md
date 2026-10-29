# P4-T017 — Automatic Compliance Scheduler LIVE implementation (2026-10-08)

## Actual deployment
Supabase project vrffsnkycvjithwtiylt, migration `p4_b6_private_compliance_deadline_scheduler`: success.
- Introduced `private.jb_compliance_deadline_tick_core(timestamptz,uuid)`, with shared transitions, compliance_history and in-app owner notifications.
- Preserved `public.jb_compliance_refresh_deadlines_internal(timestamptz)` staff authorization via `private.p4_staff_allowed()`; staff RPC delegates to shared core.
- Added `private.jb_compliance_cron_tick()` SECURITY INVOKER restricted to database role `postgres`, and revoked direct EXECUTE from PUBLIC, anon, authenticated and service_role.
- Scheduled `jb-compliance-deadline-hourly` as `0 * * * *`, cron jobid 5, active true.
- No service_role secrets or external HTTP credentials introduced.

## Actual verification
- LIVE cron.job: jobid=5, active=true, command `select private.jb_compliance_cron_tick();`.
- Direct `select private.jb_compliance_cron_tick()` under postgres returned 0 changes (no pending task with due_at).
- EXECUTE privileges: anon=false, authenticated=false, service_role=false for cron entrypoint.
- Rollback-only `SET LOCAL ROLE anon` attempted scheduler call; insufficient_privilege was caught; transaction rolled back.
- Staff RPC authenticated EXECUTE remains true, with internal staff gate.
- At inspection: cron.job_run_details for jobid 5 returned zero rows. First *scheduled* execution NOT YET VERIFIED.

## Remaining acceptance
- Confirm first real cron run in cron.job_run_details with success.
- Re-run four-state rollback fixture against new shared core (and both entrypoints), negative role tests, idempotency, history and in-app notification routing; no PASS until proof.
- Confirm Android in-app display. External channel delivery is separate and not established.

**Status: Scheduler CREATED and DIRECT EXECUTION VERIFIED; P4-T017 remains IN PROGRESS.**
