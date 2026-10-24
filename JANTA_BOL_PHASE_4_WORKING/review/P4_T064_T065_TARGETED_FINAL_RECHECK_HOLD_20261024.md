# JANTA BOL — B10 RUN-09 — T064/T065 Targeted final recheck, 24 OCT 2026

Founder scope: **ONLY P4-T064 AND P4-T065**. Prior T061/T062 LOCK preserved, T063 pre-existing HOLD. T066–T068 NOT STARTED. No Cricket / Session Saarthi use; no Production Vercel release.

## What we have proved
**T064 E1/E2 scoped pass**: no exposed production secrets in tracked source/ZIP and analyzed logs, production Supabase RLS/private storage/export protected, founder captured ALL 12 Vercel Preview build log lines (Build Completed, Deployment Completed), Preview READY and correct GitHub SHA. Connector Events API remains Team **403**, but direct portal log screenshot is sufficient for scoped build log evidence.

**T065 E1/E2 substantial pass**: 16/16 private story UUID negative, direct ID/tampering/query/cursor/advertiser/unknown public case negative, four real account role simulations, two distinct real Reporter backend sessions tested in read-only SQL role context, false Owner role+MFA claims denied. Discovered real stale Editor article write policy allowing old token in legacy RLS even with invalid session; cured production via three session-bound Article INSERT/UPDATE policies ONLY, migration `20261023175040`. PG17 RED reproduces, GREEN proves fix and all legitimate Editor/Reporter/Owner positive paths. Real PROD post-check row counts unchanged: Articles 32, hidden 16, role assignments 4, campaigns 7, grievance cases 6. GH CI `39998097324` SUCCESS and latest `40061349678` SUCCESS including 12/12 real public HTTP Preview + anon Supabase RLS negative checks.

## Hard blockers: why **neither can truthfully FINAL PASS+LOCK**
**T064** still lacks isolated hosted dev/test/prod backend: Vercel Preview JS points to EXACT same Supabase project as Production, Vercel environment variables zero, JANTA BOL Supabase preview branches zero. This is E7 FAIL and NOT a daily free quota error. Supabase org verified free. A new isolated JANTA BOL-only stage resource must be explicitly provisioned within available plan and approved cost / project choice, with safe disposable non-production accounts. We must not quietly use the Cricket backend or invent an isolation proof.
**T065** the authenticated two-user *signed HTTP* cross-account attack evidence has NOT been generated: two genuine Reporter backend sessions were checked via ephemeral SQL claim emulation, not actual signed HTTP JWT from two test logins. We now have 12/12 anonymous HTTP checks, so the Vercel API 403 is NOT an excuse for absent public wire proof. The remaining proof should run against truly independent QA actors on isolated staging, without touching real user credentials.

## Final official verdict
`P4-T064 = HOLD (E7 dev/test/prod environment separation FAIL)`.
`P4-T065 = HOLD (signed authenticated cross-account HTTP negative proof remains missing)`.
`B10 = NOT LOCKED`. Stop: no T066 onward without explicit Founder direction; do not issue a deceptive "PASS + LOCK" or whole-B10 official ZIP. GitHub code/CI and data regression support prior locks.

## 24 OCT 2026 — ₹0 disposable signed-JWT real HTTP closing most of gap

- Created TWO NEW disposable CI-only test files: `ci/phase4/b10-t065-disposable-signed-http-fixture.sql` and `ci/phase4/b10-t065-disposable-signed-http.test.mjs`.
- GitHub Actions `b10_pg17` spins up **fresh PostgreSQL 17 fixture AND PostgREST Docker HTTP API** on disposable GitHub runner, independent of production Supabase. It uses dummy Reporter A + dummy Reporter B + Editor + anonymous, with independently **HS256 signed JWTs**, distinct synthetic session IDs, and PostgREST's actual JWT validation.
- **19/19 newly added real HTTP authenticated/anonymous tests PASS:** anon drafts blocked/public published positive; Reporter A own draft posit

Full granular report: `JANTA_BOL_PHASE_4_WORKING/review/P4_T064_T065_ZERO_COST_SIGNED_WIRE_19_OF_19_20261024.md`. Neither Official FINAL LOCK can be claimed for hosted product, but 19/19 wire tests PASS and old regression all GREEN.
