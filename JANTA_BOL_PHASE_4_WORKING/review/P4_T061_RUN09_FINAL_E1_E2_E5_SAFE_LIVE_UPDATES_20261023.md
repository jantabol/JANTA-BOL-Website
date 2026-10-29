# JANTA BOL — Phase-4 B10 P4-T061 FINAL PASS + LOCK
**23 October 2026, IST | RUN-09 | Original Topic 9 T061 Public/Private/Sensitive Data Boundary Matrix**
**Source-bound evidence: E1 (real CI), E2 (LIVE DB/read-only privilege probes), E5 (historical audit/history and change provenance).**
**Decision: T061 PASS + LOCK only.** T060 and T062–T068 are separate tests and are NOT automatically passed. Prior B8 final and B9-T105 E3 remain separate independent HOLD gates.

## Original P4-T061 failure / exact RCA
The original RLS SELECT policy on `public.public_live_updates` evaluated `EXISTS (SELECT ... FROM public.live_sessions s JOIN public.articles a ...)` as `anon`. The private `live_sessions` table intentionally had no anonymous SELECT privileges. Thus an actual anonymous `SELECT count(*)` on this intended public-safe 12-row projection raised **SQLSTATE 42501 permission denied for table live_sessions**, even though all 12 rows passed the public visibility conditions. Original security policy and granted privileges were faithfully captured before repair.

## Scope of the minimum production fix (Founder-approved)
Only **one public projection SELECT policy predicate** altered, and **one explicitly-scoped, boolean-only authorization function** created:
- `public.jb_b10_live_update_public_eligible(session_id uuid, article_id uuid)` — STABLE SECURITY DEFINER, fixed `search_path=''`, returns only Boolean. Checks exact `s.id=session_id` AND `s.article_id=article_id`, Article status published, `a.deleted_at IS NULL`, `s.live_updates_public_visible IS TRUE`, and prior Live/Interrupted/Ended eligibility. Only intentional anonymous authenticated `EXECUTE` granted on this boolean function.
- Existing `public_live_updates_read` SELECT policy name and role scope preserved; it now calls the helper with the row's `session_id`, `article_id`. **No direct SELECT on live_sessions or raw live_contributions**, no private schema USAGE, no other policy/table privileges, no Article ID/PURL changes, no source/media/owner auth edits.
- Migration source: `JANTA_BOL_PHASE_4_WORKING/db/20261023_b10_t061_public_live_updates_privilege_SAFE_FIX.sql`.
- Exact original-policy emergency rollback available separately, **REVIEW ONLY**, not automatically executed: `JANTA_BOL_PHASE_4_WORKING/db/20261023_b10_t061_REVERT_REVIEW_ONLY.sql`.
- Production-only RLS modification is a scoped database permission fix. No Vercel deployment, GitHub merge into main, reporter/session revocation, user mutation, or Cricket changes.

## E1: real separate isolated PG17 plus full existing CI
- Source branch `codex/b10-whole-platform-security-candidate-20261023` contains all four tests/plan:
  - `ci/phase4/b10-t061-public-live-update-fixture.sql` reproduces the exact **42501** before repair on disposable PG17.
  - `ci/phase4/b10-t061-public-live-update-regression.sql` validates **3 approved synthetic public records** and rejects 5 hidden/invalid records (private draft, unpublished, visibility false, invalid state, cross-Article/session mismatch); checks nonexistent session, soft-deleted Article, actual Owner visibility revocation, strict old Live private direct ACL and RLS.
  - existing B9 5,000-story benchmark, B9 UI/backend, Phase3 Security/Auth/Recovery/Incident, B8 G0/G1 protected PG17 remain required.
  - GitHub run `39962519186` showed **PG17 T060..068 plus T061 new replica PASS; source PASS; B0–B8 G0/G1 PASS; coding/ZIP gate PASS**. Existing legacy B8-only ZIP job deliberately SKIPPED, not a PASS. No production credentials in CI.

## E2: genuine LIVE preflight and after COMMIT
- Exact fix was **first executed in a LIVE database transaction with all in-transaction guards and anonymous SELECT, then ROLLED BACK**. Preflight PASS with anonymous current `public_live_updates` count **12** and direct private `live_sessions` SELECT **false**.
- After full approved and protected CI GREEN, exact same scoped fix executed in **single guarded atomic LIVE COMMIT**, within-transaction anonymous canary **12/12**.
- Post-commit, a NEW independent LIVE read-only query confirmed:
  - Helper exists, `SECURITY DEFINER`, `STABLE`, fixed empty search_path, returns ONLY Boolean. Policy `public_live_updates_read` now uses `jb_b10_live_update_public_eligible(session_id, article_id)`.
  - Actual rows unchanged **12**, approved-public rows **12**; anonymous sees **12** (was 42501 before). Already-safe public_live_feed remains **7**.
  - Anonymous cannot SELECT `live_sessions` or `live_contributions`, cannot use private schema; anonymous visible conflicts/deletion ledger/correction versions are **0** each.
  - Private Storage: grievance-private and private-editorial **0** anonymous/guest rows; independent authorized administrator had verified 2 and 1 real objects respectively before fix.
  - Anonymous Article source and audit direct SELECT are **denied**. Anonymous non-session helpers return false for known hidden Article, false for nonexistent session, true for eligible real published session. Signed-in database role with **no user JWT** can see 12 public updates but **0** sources/audit/grievance issues, expected public-only behavior.
  - Original 100/100 public-schema table RLS remains active; 16/16 Published Search Article UUIDs visible and 16/16 hidden IDs denied in independent earlier read-only matrix.
- Authentication, identity proof, local session and live Article records were neither changed nor read with caller sensitive metadata.

## E5: historical independent audit and integrity
- 1,560 existing protected `public.audit_logs` entries survived deployment unchanged; protected `article_versions` 878 and `article_sources` 31 remain in place.
- 57 Grievance history / 12 Compliance history records observed prior; historical `grievance_private_verification` 2, `security_session_evidence_preserved` 9, `grievance_status` 17, `COMPLIANCE_MONTH_APPROVE` 4 have owner-bound original audits. No new synthetic production data generated.
- Live B10 branch commits + real protected CI workflow + exact rollback SQL preserve change approval/history. We do **not claim** a new production Founder live-session event or UI Android screenshot in this T061: the original requires E2+E5, not E3.

## Security Advisor caveat
- Original anonymous-callable SECURITY DEFINER count **21**; this deliberately restricted boolean-only helper raises that count to **22**. Supabase Security Advisor accordingly continues to list **22 WARN**, and authenticated callable **117 WARN**, which will be reviewed function-by-function in T064/T068. This is an intentionally documented, bounded tradeoff; do not mass revoke legitimate public RPCs. Auth Leaked Password Protection WARN separately remains B10 T063/T064 topic. This limited function returns Boolean only, has no privileged state-changing side effect, and no raw Live tables exposed.

## Final scope
**P4-T061 = PASS + LOCK (E1 + E2 + E5)** after real production original 42501 repair and negative testing.
**T062 not started.** B10 entire block remains NOT FINAL LOCK. Older source ZIP B10 Candidate predates fix; rebuild from final CI and refresh Android workspace before future release evidence. B9-T105 remains original final HOLD. JANTA BOL's separate Cricket app resources **NOT touched**.
