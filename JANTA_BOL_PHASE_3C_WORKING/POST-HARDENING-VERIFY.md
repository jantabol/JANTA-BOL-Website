# JANTA BOL — PHASE 2 POST-HARDENING VERIFICATION RECORD

Date: 2026-09-06
Status: TECHNICAL PRE-CHECK EVIDENCE — NOT FINAL PASS/LOCK

## Founder approval boundary
Founder explicitly approved applying the reviewed `PRETEST-HARDENING-PENDING.sql` production candidate, followed by immediate Security Advisor + RLS + public/private regression checks.

## Applied production migrations
1. `20260906151124 phase2_pretest_security_hardening_20260906`
2. `20260906151203 phase2_recent_mfa_regex_exact_candidate_fix_20260906`

Reviewed source SHA-256:
`0d2c24f77ccfb2612d802d0ebf0d05d38f93cdf4ae7893a6c5e8114c3ad3208a`

The second migration is not a new feature. Immediate live-definition comparison found one dropped trailing `$` in the migration payload regex; it restored the exact reviewed `^[0-9]+$` definition only.

## Security Advisor after production hardening
Resolved from earlier checkpoint:
- `public.article_stats` Security Definer ERROR: RESOLVED (`security_invoker=true`, anon access revoked)
- anon-executable `public.jb_is_owner()`: RESOLVED (Security Invoker + PUBLIC/anon EXECUTE revoked)

Remaining recorded findings:
- INFO: `owner_recovery_physical_checks` has RLS but no direct policy. This is intentional in the current design because direct table privileges are revoked from both anon and authenticated; checked Owner-AAL2 RPCs are the access path.
- WARN: authenticated Security Definer RPCs. Guard review confirms privileged purpose: Owner AAL2 or recent-MFA gates on session/physical/permanent-delete/recovery-set paths. Emergency recovery verify remains authenticated Owner-only and cooldown-protected by design.
- WARN: Supabase leaked-password protection is disabled. This remains an open platform/Auth configuration item and was not silently changed outside Founder-approved SQL scope.

## Post-migration access regression
- public schema RLS-off tables: 0
- public article published-row RLS preserved
- anon public article columns: allowed
- anon private `articles.source_name`: denied
- anon `article_stats`: denied
- anon admin/private Phase-2 CRUD grants: removed
- anon grievance INSERT: allowed; SELECT denied
- anon analytics INSERT: allowed; SELECT denied
- rollback public grievance + analytics intake: PASS
- anon published articles visible: 2
- anon private-editorial storage rows visible: 0

## Owner authority regression (rollback-only synthetic context)
PASS:
- AAL1 Owner authority blocked
- active-session AAL2 authority allowed
- fresh TOTP AMR accepted for recent-MFA
- >10 minute stale MFA rejected
- nonexistent session_id invalidates AAL2 authority
- Owner session list RPC works under AAL2
- synthetic selected OTHER session revoked
- current session preserved
- #129 physical-status RPC accessible under Owner AAL2

## No-residue confirmation
After rollback tests:
- Owner sessions: 3
- Owner session-label rows: 0
- Recovery physical-check rows: 0
- Active recovery failed attempts: 0
- Active recovery cooldown: inactive

## Final rule
This record proves technical production pre-check evidence only. Founder manual/device/physical/incident verification remains required wherever mapped. No remaining test is automatically FINAL PASS + LOCK.


## Final consolidated recheck — 2026-09-06
Latest live read-only checks after the final localized frontend recovery integration:
- public schema RLS-off tables: 0
- anon sensitive/admin table grants in checked hardening scope: none
- anon `articles.source_name` and `source_url`: denied
- anon public `title` / `public_attribution`: allowed as intended
- anon grievances: INSERT allowed, SELECT denied
- anon analytics: INSERT allowed, SELECT denied
- `article_stats`: `security_invoker=true`
- anon `jb_is_owner()` EXECUTE: denied
- `owner_recovery_physical_checks`: direct anon/auth SELECT denied
- `private-editorial` bucket: `public=false`; anon-visible rows: 0
- published rows remain visible to anon: 2
- recovery Edge Function: ACTIVE, JWT verification enabled
- recovery DB stores bcrypt hash, not plaintext key

Security Advisor still reports the documented intentional/remaining items: guarded authenticated Security-Definer RPC warnings, RPC-only physical-check table INFO, and leaked-password protection disabled. Official leaked-password remediation: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

No new production migration was required or applied for the final recovery UI wiring.