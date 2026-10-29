# JANTA BOL — Phase 4 / B10 G0 Security Precheck
Date: 23 October 2026 (IST). Audit phase only: **no B10 security implementation, live mutations, or official PASS+LOCK**.

## Original, source-bound RUN-09 B10 contract
Official **JANTA_BOL_PHASE_4_MASTER_EXECUTION_PACK**, Topic 9, §§481–566 (pp. 301–303), tests **P4-T060 through P4-T068** (9 tests).
- **T060** Existing Security Baseline + Backend Authority + Fail Closed — E1/E2/E7. Manipulated role/local state, stale tokens/claims, ambiguous authorization.
- **T061** Public/Private/Sensitive Data Boundary Matrix — E2/E5. Internal sources, identity, grievance, audit, raw analytics, public projections.
- **T062** Cross-Module Authority + Privilege Matrix — E1/E2/E5. Reporter/Team/Editor/Advertiser/Public vs Owner reserved powers across all modules.
- **T063** Authentication/MFA/Session/Lost Device/Emergency Recovery — E1/E2/**E3 real Android**/E5. Auth success/failure/brute-force, AAL2, session revocation, device/recovery negative.
- **T064** Secrets/Environment/RLS/Data Minimization/Private Files — E1/E2/E7. Repo/build/log keys, dev/stage/prod separation and export/media privacy.
- **T065** Direct IDOR/Tampering/Cross Account — E1/E2. User/account/Article/case/ad search scope and manipulation negatives.
- **T066** Revocation/Suspension/Super Admin Only/Advertiser Search Isolation — E1/E2/E5.
- **T067** Security incident → audit+notification → containment → RCA/minimum fix/retest — E1/E2/E5/E7.
- **T068** Cross-module evidence reconciliation + old Security CI → Final gated lock — E1/E2/E5/E7.
- Mandatory previous **Phase-3 Security/Auth CI** preservation for every security patch.

## Live JANTA BOL E2 READ-ONLY survey (G0 only)
Actual production project `vrffsnkycvjithwtiylt`, read-only queries only, and actual Supabase Security Advisor.
- Current `public` schema: **100 base tables**; **100/100 RLS enabled**. No `anon`-SELECT base table with RLS disabled. This is not sufficient to prove all table policies correct or all RPCs safe.
- Five base tables have `anon` SELECT grants (primarily Live/feed-related); all five still RLS enabled. All anon-readable views inspected have `security_invoker=true` or no anon grant.
- `anon` direct SELECT denied for canonical `articles`, `article_sources`, `audit_logs`, `grievance_private_identity`, `analytics_events`. Original retired-Article-ID guard active, Owner AAL2 backend function exists.
- There are **214** public-schema SECURITY DEFINER routines (not necessarily a vulnerability by count); **21** callable by `anon`. All 21 have an explicit fixed `search_path`, but the definition/caller legitimacy, param validation, data minimization and boundaries must be independently tested **one by one**. The Advisor flags these 21 as **WARN**; public-safe search/ad enquiry/feed endpoints may be intentionally callable by anon, so **do NOT revoke all 21 en masse**.
- Supabase Security Advisor snapshot:
  - `anon_security_definer_function_executable`: **21 WARN** (review actual intentional public RPC contract first).
  - `authenticated_security_definer_function_executable`: **116 WARN** (check owner/role/session/RLS authority, not automatic compromise).
  - `rls_enabled_no_policy`: **43 INFO** (often deliberate private table lockout; don't add blanket permissive policies).
  - `auth_leaked_password_protection`: **1 WARN**, needs Owner authentication configuration review; don't change global Auth settings silently.
- Advisor remediation references:
  - https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
  - https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
  - https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
  - https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## B9 cross-block predecessor status
- Current B9 public Search + Related News golden readability on Android/SPCK visually PASS, two scoped UI fixes on B9 GitHub branch protected CI green. But the B9 test register still marks **P4-T105 FINAL HOLD**: no genuine 2024–2025 Published LIVE Article for original old-archive end-to-end Android performance. Synthetic 5,000-row PG17 and 11 real Android current-archive steps are PASS, but not identical to the original required real 1–2-year archive.
- Official **B9 FINAL PASS+LOCK = HOLD**, and old B8 global source/evidence gate also remains open. Explicit source sequencing says B10 implementation cannot automatically bypass B9 final closure.
- This file is a **B10 G0 early-preparation/read-only audit** stored on the existing B9 review branch, **NOT** an authorized B10 coding branch or waiver of any predecessor lock.

## Proposed G1–G6 batches (NOT RUN)
G1: T060/T061 backend RLS/RPC/private boundary negatives and protected CI.
G2: T062 cross-module roles/RLS and real authenticated negative test evidence.
G3: T063 Founder device/MFA/lock/recovery safe controlled rehearsal (E3 required; never revoke real active Founder access as a 'test').
G4: T064/T065 secrets/env/media access + cross-account IDOR.
G5: T066/T067 revocation/cross-adversary/incident evidence with synthetic containment or authorized real fixture.
G6: T068 complete evidence reconciliation and all old security CI, restore B10 lock only after all required evidence.

## Current decision
**B10 G0 PRECHECK = PERFORMED (metadata + read-only security survey).**
**P4-T060..T068: no full test PASS, no RUN-09 lock.**
**No B10 coding. No role/secret changes, migrations, auth settings, live data writes or Cricket/Saarthi interactions.**
