# JANTA BOL — B8 G0→G1 CP01: actual first coding & isolated real PostgreSQL17 regression
**Date 17 October 2026 | First B8 feature implementation checkpoint | SOURCE: SHA `92cb2409ee8373b664b6d03e718d7375a7955df2`**
**Founder authorized "Thek h bhai start kro" after approved R3 / CP14.** No more unapproved design block. Keep existing B0–B6 Founder-locked base, held B7 first actual paid shop ad, free resources, original News/Article independent.

## Current source and safe isolation
- Origin `review/b8-precode-design-tests-20261017` at `e7f8b2a936f4ab5be39c54b280e74ceb59c4a4e3`. New implementation branch `codex/b8-g0-g1-accountability-20261017`.
- Git compare base→tested HEAD **+5 commits/0 behind**, **exactly four ADDED files**. ZERO existing frontend, Article, Ads, B6 SQL, auth functions, Team, Supabase migration files, LIVE data, production deployment, secrets or any Cricket source changed.
- New `JANTA_BOL_PHASE_4_WORKING/db/20261017_b8_g1_case_reporter_scope_REVIEW_ONLY.sql` is a **review-only migration**, never installed in LIVE. Adds private default/deny-by-default `b8_cases`, `b8_case_reporter_grants`, `b8_question_drafts` and bounded Owner-AAL2 create/assign/revoke and active assigned Reporter `draft`/limited case-card RPCs. Not the full Accountability product.
- **Critical source difference respected:** existing `private.p4_staff_allowed()` omits reporter and is not changed; isolated `private.b8_g1_reporter_case_allowed(case_uuid)` with real active-role Team, current session, case grant, expiry, revoke, closed-case checks is created. No global staff escalation; anon and authenticated direct table access denied; no public source/evidence projection or question SEND RPC exists in G1.
- **Scope:** owner creates private Case and grants active Reporter exact-case temporary access; Reporter can only create an unsent DRAFT and see minimal assigned case card. R1 Editor review and Founder evidence pack, R2 Founder approval, question dispatch/delivery, case immutable event ledger, Article-linked original evidence/retention, Reporter secure media upload, Android E3 **NOT IMPLEMENTED YET**. This deliberate small first slice needs additional coding and tests; **G1 is NOT full PASS+LOCK**.

## REAL CI evidence
- [GitHub Action **#39005124701**](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/39005124701), source SHA `92cb2409ee8373b664b6d03e718d7375a7955df2`, **2/2 jobs SUCCESS**:
  1. Real disposable `postgres:17` synthetic B1 role/session/Owner-AAL2 fixture, applied exact candidate review SQL, actual ACL and RPC calls under `anon`/`authenticated`; positive Founder create/assign, Reporter draft/card; negatives anon, Owner AAL1, Reporter tries Owner assign, wrong Reporter, Editor cannot impersonate Reporter, lost session, suspended Team, expired grant, revoked grant, untrusted client; exact News Article + B7 campaign unchanged. Explicit `ROLLBACK`, no persisted Case/draft. Raw job log confirms NOTICEs and true ROLLBACK.
  2. Original protected Phase3 STATIC News/Auth/Security/coverage, existing B7 closure manifest/negative regressions/secret scan all GREEN. **STATIC, not entire LIVE Phase3 E2**.
- This proves the **disposable G1 E2 candidate** and protected STATIC at source SHA, not real Founder Android role E3, Owner AAL2 E5, production security audit or full P4-T092 E7/E9. No synthetic office reply, receipt, external WhatsApp/mail or real campaign payment was attempted.
- Same-branch Git compare `e7f8b2a...→92cb2409...`: files: `.github/workflows/b8-g0-g1-disposable-pg17-and-protected-static.yml`, `JANTA_BOL_PHASE_4_WORKING/db/20261017_b8_g1_case_reporter_scope_REVIEW_ONLY.sql`, `ci/phase4/b8-g1-disposable-fixture.sql`, `ci/phase4/b8-g1-real-postgres-regression.sql`. All NEW. Existing files unchanged.

## Next minimal-code gate
1. G1-CP02: independent security/RCA review of release candidate and role permission race; build B8 case event audit ledger and scoped Editor serious-review authority without altering B1 helper. Exact source → reproduction → first divergence → minimal safe fix → negative CI. Do not call question SENT from a DRAFT.
2. G2: secure case evidentiary source provenance, Article linked-case survival across old FK CASCADE, private Reporter case upload gated by server/ACL and actual storage tests; Founder R2 always separate.
3. G3/G4: genuine Android Reporter→Editor→Founder proof-pack + dispatch receipts, B3 notifications, Founder-approved public case projection, correction PURL and offline failure isolation.
4. G5: original eight T092–T099, ACC001–051, 30 SEC+12 RPT cases, required genuine E2/E3/E4/E5/E7/E9; B0–B6 protected regression and exact Android on approved target.
5. G6: full safe source and random 178-ID B0–B8 ZIP, per-file hashes/exclusions, NO claim that test ZIP auto-installs production.
**Official B8 Test-Register remains T092–T099 = 0/8 FINAL PASS, ACC 0/51 RUN; G0 source/CI baseline PASS as bounded, G1 CP01 candidate E1/E2 green but incomplete.** Only critical unsafe bugs stop affected work; B7 real payment remains held. No new paid service.

**NO REBUILD · NO FAKE PASS · NO PRODUCTION CHANGES · B8 REAL CODING STARTED · PHASE-4 SOFT LAUNCH MAIN TARGET**
