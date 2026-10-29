# JANTA BOL Phase 4 / B10 — P4-T061 Real Security Check
**Date:** 2026-10-23 IST | **Source:** Original Phase 4 Execution Pack, Topic 9, §§488–497, RUN-09, test **P4-T061**.
**Requirement:** Public / Private / Sensitive Data Boundary Matrix. **Required Evidence: E2 (real DB/API/ACL/RLS) + E5 (real audit/history).**
**TEST VERDICT: IN PROGRESS / HOLD — not PASS+LOCK** (one genuinely failing public-view authorization query). T060 and T062–T068 are NOT marked PASS here.

## Actual live read-only E2 results — JANTA BOL ONLY
JANTA BOL production Supabase project `vrffsnkycvjithwtiylt`, no Cricket data used. Every SQL statement wrapped in `BEGIN READ ONLY; ... ROLLBACK;`, with `SET LOCAL ROLE anon` or `authenticated` and without real-user credentials; no production writes, session revocations, storage writes, or permission changes.

| Boundary | Actual observation | Result |
|---|---|---|
| RLS completeness | All **100/100** public base tables have RLS enabled; no anon-readable RLS-disabled base table; anon has no `USAGE` on `private` schema | PASS scoped |
| Direct private tables | Anon direct SELECT denied by SQL grants for Article, private source, audit, raw Analytics, grievance identity, private compliance and staff records | PASS scoped |
| Real protected records | `article_sources` 31 records, `article_versions` 878, `audit_logs` 1560, `grievance_issues` 4, `b8_cases` 1 | Test not vacuous |
| Anonymous vs Published Articles | **16/16 published** original Article UUID search returns 1 public object each, **0/16 hidden** Article UUIDs returned in anonymous `jb_b9_search`; only public-safe fields projected | PASS scoped |
| Sensitive Article Search | Private-content marker query returns 0 anonymous hits; Owner B9 mutation RPC anon EXECUTE count 0 | PASS scoped |
| Anonymous Live base grants | 5 anon-SELECT base tables: `live_contribution_conflicts`, `live_deletion_ledger`, `live_session_correction_versions` (each `deny_client_all` RLS policy `USING(false)`), `public_live_feed`, `public_live_updates` | Policy review done |
| Anonymous sensitive Live table rows | In actual anonymous role, 0 visible rows from conflicts, deletion ledger and correction snapshots. `public_live_feed` returns **7** sanitized public rows | PASS scoped |
| Anonymous/guest private Storage | `grievance-private`: **2 real objects** owner-side, anon and authenticated-no-JWT visible **0**; `private-editorial`: **1 real object**, anon/guest visible **0**. All private buckets are `public=false`. | PASS scoped |
| Logged-out authenticated role | `auth.uid() IS NULL`; 0 Article sources, versions, audit, analytics, grievances, grievance issues and compliance history rows; private Storage 0. Tests no-user-JWT only, not a real Reporter/Editor signed-in session. | PASS scoped |
| Public B8/related/metrics projection | Anon B8 public case feed returns JSON array; no direct sensitive-key patterns found in output; Related News array, public metric controlled projection shape; these are not an exhaustive 21-definer security audit. | PASS sampled |

### **Open FAIL (LIVE, reproducible): public Live Updates RLS dependency**
With `BEGIN READ ONLY; SET LOCAL ROLE anon; SELECT count(*) FROM public.public_live_updates; ROLLBACK;`, the production database returns **SQLSTATE 42501 permission denied for table live_sessions**.
- `public_live_updates` has **12** rows (checked using privileged SELECT without emitting their contents).
- The anonymous `public_live_updates_read` RLS policy includes `EXISTS (SELECT ... FROM live_sessions s JOIN articles a ...)`.
- `anon` **lacks SELECT** on `public.live_sessions`, so reading an intended public-safe projection fails with a backend permission error. This is a fail-closed **availability / information about internal table name** exposure concern, **NOT** evidence of unauthorized private-record retrieval.
- **Do not GRANT anon SELECT on live_sessions**, bypass/remove RLS, or blanket-enable its data! That would weaken the old Live security boundary.
- Fix concept (NOT implemented): smallest narrowly scoped public-safe approval predicate backed by security-reviewed function or equivalent safe projection, with stricter public Article/live session visibility; test synthetic PG17 with positive/negative/expired/hidden/revoked states before separately approved LIVE rollout, then rerun the exact anonymous SQL and Public Live UI.
- Until protected old Phase3/Live regressions + exact real anon retest are GREEN, **T061 final LOCK on HOLD** to prevent an incomplete public display security claim.

## Actual LIVE E5 audit/history evidence
- `audit_logs`: 1560 real entries; 130 action kinds, 755 have an actor.
- Historical `grievance_private_verification`: **2** actual events (actor-bound, with metadata); `grievance_status`: **17**; `audit_exported`: **1**; `security_session_evidence_preserved`: **9**; `COMPLIANCE_MONTH_APPROVE`: **4**. Counts and presence only — no stored identities/evidence or raw metadata output.
- Article versions: **878**; Grievance history: **57**; Compliance history: **12**. Historical records support traceability; **this audit did not impersonate a real Founder AAL2 or create new access audit events**.
- Verified protected `audit_logs` anonymous SELECT denied, authenticated-no-JWT visible 0; audit read policy `private.current_owner_aal2()`, direct insert `private.current_owner_aal2()`.
- Positive protected-access audit historical events do not prove every possible authenticated-role path.

## Code regression E1 available but does not replace E2/E5
The B10 single-batch source and synthetic PG17 workflow succeeded at GitHub run `39954558664`, head `e6379f0e8109d2228f451ed34dac4f85901b8969`. B10 T061 isolated PG17 fixture checks B9 private ACL/search; it did **not** model original production `public_live_updates` policy, so CI success does not resolve the observed LIVE failure.

## T061 remaining ONE issue, no T062 yet
1. Reconcile old Phase3 Live public projection policy and guard in existing repo, prepare smallest safe review-only fix with negative tests.
2. After approved safe Live change: execute exact real anonymous `public_live_updates` call; public list must work without revealing private columns or any hidden Article/Session.
3. Verify protected old Phase3 CI, authorized E5 provenance, no privilege regression and no ID change.
4. Only then propose **P4-T061 PASS+LOCK**; do not falsely claim this already happened.

**Production changes:** ZERO; **Cricket touched:** NO; **official T061 status:** HOLD.
