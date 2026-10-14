# JANTA BOL — P4-T034 ADS-009 Independent E2 / E1 checkpoint
Date: 14 October 2026 (UTC 12:21), read-only production catalog inspection plus isolated PostgreSQL 17 synthetic regression.
STATUS: **ADS-009 PARTIAL — SOURCE-PARITY SYNTHETIC ROLE MATRIX PASS, real-principal E2+E5 DUE. NOT FINAL PASS/LOCK.**
NO PRODUCTION WRITES. NO DATABASE PASSWORD USED. NO CRICKET ACCESS. NO LIVE ADS.

## Official test authority
B7 Final Test Blueprint, P4-T034 ADS-009 p5: "Anon, advertiser, reporter, owner without AAL2 attempt approval and verification"; required evidence E2 + E5; unauthorized attempts rejected **without state mutation or audit success**. Owner AAL2 positive is a separate control. Never substitute a forged JWT/role fixture for authenticated real-client evidence.

## Exact source + evidence
- GitHub base: protected main `30511a4bad016d1bdce1d7c9abf920606f52f00c`.
- Review branch: `review/t034-ads009-isolated-e2-20261014`; workflow source commit `49e858e066f43ef03ba90b8b6c4bc7d90d74afb5`.
- Source `ci/phase4/b7-t034-ads009-source-role-matrix.sql`: **9 source body MD5 pairs** obtained from JANTA BOL's LIVE pg_proc via SELECT, not fabricated manually. Reproduced exact `auth.jwt`, `auth.uid`, `private.current_session_id`, `private.current_session_active`, `private.current_app_role`, `private.current_owner_aal2`, `private.p4_owner_allowed`, `public.jb_ad_transition_internal`, `public.jb_ad_verify_advertiser_internal`. Positive original audit/history retained.
- GitHub Actions workflow `b7-t034-ads009-isolated-e2.yml`, **Run 38563162445**, Job **115849069819**, `completed/success`. Real job logs 12:21:42Z: 9/9 source bodies matched, five independent synthetic denied principals **ANON / REPORTER / ADVERTISER / OWNER_AAL1 / OWNER_REVOKED**, both privileged calls denied each (10 negative attempts), campaign+verification+audit/history unchanged; valid synthetic Owner/AAL2 approved and verified, both ad_history and audit_logs 2 each. `ROLLBACK` and disposable PG container cleanup confirmed. This is E1+isolated E2 only.
- LIVE Supabase read-only catalog: both privileged RPCs are SECURITY DEFINER, `anon EXECUTE=false`, `authenticated EXECUTE=true`. Function bodies call `private.p4_owner_allowed()`; `owner` authorization requires active session and JWT `aal2`. LIVE `advertisers` and `ad_campaigns`: RLS enabled and no `anon`/ `authenticated` INSERT/UPDATE table grants; READ policies only for staff. **Catalog is not equivalent to true real actor attempts.**
- LIVE read-only row snapshot after synthetic workflow: advertisers=7, campaigns=7, payments=0, ad_history=27, audit_logs=1538, LIVE=0, PAID=0, historical high-risk pending+payment_pending=1. It does not prove count change relative to a simultaneous before snapshot, but synthetic workflow had **no LIVE connection** by construction.
- These tests neither exercise real Supabase Auth JWT identity nor try privileged changes in production. No actual advertiser/reporter session tokens used; no synthetic authentication marked real.
## Remaining hard gates
1. ADS-009 real authenticated PostgREST/App negative matrix: reporter (active), advertiser login, Owner real AAL1, revoked Owner session; anonymous call denied. Use valid *real* principal with Owner-approved test identities, never forge or share secrets; capture actual HTTP response and before/after immutable E5 read-only audit/verification/state proof.
2. Preserve all previous ADS-001..007 evidence. ADS-008 remains HOLD due unverified GitHub DB password, no restorable offsite backup, no deployed high-risk payment verification guard. **Do not run manual backup/export workflow or deploy SQL.**
3. Record exact source/version and test completion before ADS-009 or T034 Final PASS, and run impacted regressions.
NO FAKE PASS.
