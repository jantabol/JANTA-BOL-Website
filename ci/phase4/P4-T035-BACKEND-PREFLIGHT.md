# P4-T035 — Live backend read-only preflight (2026-10-09)

**Status:** PENDING backend integration; not PASS. This is not a migration receipt.

## Confirmed sources

- GitHub candidate branch `codex/p4-t035-reviewed-fixes-20261009`, PR #4, latest reviewed static commit `8cfe5d45b728e4ad72a64b8816c24205c905fa1d`.
- Candidate static GitHub Actions run `37916800570` completed **SUCCESS**, including 23 P4-T035 contract checks. This verifies source assertions, not database behavior.
- Supabase project `vrffsnkycvjithwtiylt` is ACTIVE_HEALTHY. Branch listing: `[]` (no staging branch).
- Read-only Supabase catalog and counts (2026-10-09): 5 campaigns, 0 live campaigns, 0 confirmed payments; `p4_validate_ad_creative_media` trigger exists and is enabled.
- Public `jb_ad_public_feed(text,text)` and `jb_public_active_ads(text)` both currently allow anon EXECUTE, use SECURITY DEFINER. Catalog shows the former references payment and verification filters; the latter references neither. The candidate explicitly delegates legacy to canonical, but this is **not yet deployed**.
- Owner `jb_ad_approve_creative_internal(uuid)` and `jb_ad_transition_internal(uuid,text,text)` deny anon EXECUTE and allow authenticated EXECUTE.
- Candidate SQL is a review artifact; it must not be described as applied.

## Gates before release

1. An isolated schema-aligned PostgreSQL environment with no production writes; test candidate SQL transactionally and verify ROLLBACK.
2. Execute security-negative cases for anon/Owner/AAL2, unpaid campaigns, high-risk unverified advertisers, missing creative, unsafe CTA, scope, and schedule; retain evidence.
3. Re-run protected Phase-3/Phase-4 database regressions without relaxing security tests.
4. Real deployed anonymous HTTP and browser test; actual Android E3 evidence.
5. Only after gates, approve an atomic production migration with rollback plan and verify production CI.

**Do not merge PR #4 as completed T035, do not apply candidate SQL to production, and do not claim T035 PASS/LOCK.**

Note: an attempt to execute public feed RPC queries through the connected SQL tool was blocked by tool safety screening; no RPC test result is claimed.
