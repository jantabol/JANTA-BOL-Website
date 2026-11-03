# P4-T090 E5 Live RLS/Role-Grant Metadata Preflight — 2026-11-03

**Authority:** read-only Supabase PostgreSQL catalog inspection, project `vrffsnkycvjithwtiylt`. This is production metadata evidence, **NOT** a live signed Owner/Reporter cross-account negative. Scoped documentary security preflight only. Preserve all existing T087/T088/T089/T090 original HOLD gates; no T091 start.

## Exact real privilege facts (no user rows, passwords, secrets, or JWT retrieved)

- `public.grievances` RLS enabled. Anonymous role has **no direct UPDATE grant** and **no EXECUTE grant** on `public.jb_grievance_transition_internal(uuid,text,text)`.
- `authenticated` has generic SQL UPDATE grant to `public.grievances`, **but this is not free row authorization**: only `owner_all` RLS permits UPDATE, with both USING and WITH CHECK `private.current_owner_aal2()`. `grievances_staff_read` is SELECT-only using `private.p4_staff_allowed()`. Public INSERT has a distinct received-status/empty-decision-note guard. **No signed RLS execution was performed.**
- `public.user_roles` has RLS policies `users_can_read_own_role` (SELECT), `owner_admin_can_read_roles` (SELECT), `owner_can_manage_roles` (ALL, USING and WITH CHECK `private.current_owner_recent_mfa(600)`). The fact that `authenticated` has generic table UPDATE grant **does not override this policy**. Anonymous SELECT grant on this table is absent.
- `private.p4_staff_allowed()` requires Owner current AAL2 or active editor/admin team plus current session. `private.p4_owner_allowed()` checks Owner role plus AAL2. `private.current_owner_aal2()` checks backend role, JWT `aal2` and an actual matching active `auth.sessions` session; `private.current_owner_recent_mfa(600)` additionally checks a recent TOTP/phone timestamp in AMR and fails closed on exception.
- `anon` does **not** have USAGE on the `private` schema. It may inherit `EXECUTE` on private helpers, but schema USAGE is a separate gate. `authenticated` can use private schema; the SQL bodies still require the specified role/session/AAL2 checks.

**What this does *not* prove:** hostile signed Reporter cross-account access denial, revocation immediacy under real bearer JWTs, role-switching attacks, special privileges of a currently logged-in Owner, or actual RLS query execution in a disposable authenticated session. T087/T090 signed E5 **HOLD**; do not upgrade based only on metadata.

## E7 adjacent public Advertising integrity risk (not a discovered exploit)

Real PostgreSQL definitions and grants confirm two distinct `SECURITY DEFINER` public RPCs `jb_ad_event(uuid,text)` and `jb_ad_record_event(uuid,text)`. Both are executable as `anon` and each independently inserts `impression` or `click` into `public.ad_events` if a campaign is live; their bodies contain no visible per-view ticket or replay/rate-limit guard. Anonymous direct INSERT/SELECT on `public.ad_events` is denied. This is a **P2 potential ad-metric inflation/duplicate-authority defect only when a live campaign is usable**, not proof of abuse or payment impact.

At this read-only check: **7 campaigns, 0 currently live, 0 `ad_events` rows**. That is a dated observation, not a future guarantee. Do not enable paid ad impression/click billing from these legacy routines or infer this remains true after campaign activation. Existing ticket-based analytics clients in source are staging only. Isolate remediation and regression before live billing; **do not bulk REVOKE or patch production without call-site mapping**.

## Safety and decision

All steps were **read-only catalog SQL and aggregate COUNT**. **No user record retrieved**, no JWT/session extracted, no live RPC invocation, no database write, migration, deployment, password change, policy edit, or payment.

Verdict:
- `T090_E5_RLS_ROLE_GRANT_AND_OWNER_AAL2_METADATA=EVIDENCE_CAPTURED_SCOPED` (not full E5 PASS).
- `T090_E7_LEGACY_AD_EVENT_DUPLICATE_AUTHORITY=P2_REVIEW_REQUIRED` (0 live campaigns at observation).
- `T090_E5_REAL_SIGNED_OWNER_REPORTER_NEGATIVES=HOLD`.
- `T090_E8_FULL_REAL_PLATFORM_RESTORE_RPO_RTO=HOLD`.
- `P4_T090_ORIGINAL_FINAL_PASS_LOCK=HOLD`.

Source: independent Supabase `execute_sql` metadata/aggregates in current audit session, 2026-11-03. This note is an evidence snapshot and must not be represented as an automated production test or rebuilt platform recovery.
