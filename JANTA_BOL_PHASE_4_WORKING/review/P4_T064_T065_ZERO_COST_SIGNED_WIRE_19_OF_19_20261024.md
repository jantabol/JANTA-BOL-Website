# JANTA BOL — T064/T065 ZERO-COST B10 ISOLATED REAL HTTP RECHECK — 24 OCT 2026

## Founder conditions
**₹0 new infrastructure, no production data mutation, no Cricket use, no previous PASS+LOCK regression, ONLY T064/T065; T066 onwards NOT STARTED.** Founder explicitly permitted proceeding without requiring every unavailable production isolation criterion to be declared a success.

## Verified completed work
- Created TWO NEW disposable CI-only test files: `ci/phase4/b10-t065-disposable-signed-http-fixture.sql` and `ci/phase4/b10-t065-disposable-signed-http.test.mjs`.
- GitHub Actions `b10_pg17` spins up **fresh PostgreSQL 17 fixture AND PostgREST Docker HTTP API** on disposable GitHub runner, independent of production Supabase. It uses dummy Reporter A + dummy Reporter B + Editor + anonymous, with independently **HS256 signed JWTs**, distinct synthetic session IDs, and PostgREST's actual JWT validation.
- **19/19 newly added real HTTP authenticated/anonymous tests PASS:** anon drafts blocked/public published positive; Reporter A own draft positive/B denied; Reporter B own draft positive/A denied; both Owner unpublished negative; stale JWT negative; other-user session mismatch negative; forged owner user/app metadata negative; private Article versions denied to both; incorrect JWT signature rejected; anon PATCH denied; revoked Editor PATCH returns zero rows; valid Editor PATCH succeeds **only against the disposable CI database**.
- Existing **12/12 HTTPS requests** against actual JANTA BOL Vercel Preview + LIVE Supabase **anonymous/read-only only** PASS (source `ci/phase4/b10-t065-public-http-actual-preview.test.mjs`). No real user JWT collected or used.
- Latest fully verified GitHub Actions run `40063192405`, source HEAD `7dd909169028d00fc40caac1ba901cfca587ad42`: all B10 source, PG17 negative matrix, original B0–B8 G0/G1, candidate ZIP job **SUCCESS**.
- Previous LIVE T065-SEC01 session-guard mitigation preserved (three existing Article INSERT/UPDATE RLS policies); no new LIVE mutation in this checkpoint.
- Fresh LIVE JANTA BOL `BEGIN READ ONLY; ... ROLLBACK` counts: **Articles 32, non-published 16, roles 4, ad campaigns 7, grievances 6**. No count change from earlier evidence.
- **Cost:** $0 new Supabase project. Supabase earlier refused a third free project because same account owner already administers two free active projects (JANTA BOL and separate Cricket); we did NOT create, delete, pause, move, upgrade or mutate either project.

## Accurate separation and IDOR conclusions
- **T064**: Disposable GitHub-runner PostgreSQL + PostgREST IS real temporary isolated test infrastructure. It does **not** give existing Vercel Preview a separate hosted Supabase project. Preview and Production still use SAME LIVE Supabase. Thus T064 E7 hosted environment separation remains **FAIL / FINAL HOLD** even though CI isolation and E1/E2 pass.
- **T065**: 19/19 genuine cryptographically signed **dummy** user HTTP tests demonstrate the DB policy behavior over an actual wire endpoint on isolated PG17 and substantially close the untested-HTTP gap. They do **not** prove the full live Supabase GoTrue/hosted JWT / two authorized REAL app QA accounts E2 flow. Remaining end-to-end hosted identity binding remains **HOLD**, do not report live two-user test as PASS. Existing production anonymous wire 12/12 pass.
- **T064 and T065 remain PARTIAL PASS / FINAL HOLD**, never official FINAL PASS+LOCK. Earlier T061/T062 unchanged PASS+LOCK, T063 original HOLD; no T066 initiated.
- No Founder Android manual steps or screenshots needed for the completed portion.

## Evidence paths
- `.github/workflows/b10-whole-platform-security-candidate.yml`
- `ci/phase4/b10-t065-disposable-signed-http-fixture.sql`
- `ci/phase4/b10-t065-disposable-signed-http.test.mjs`
- `ci/phase4/b10-t065-public-http-actual-preview.test.mjs`
- `JANTA_BOL_PHASE_4_WORKING/db/20261023_b10_t065_stale_article_write_session_guard_REVIEW_ONLY.sql`
- Actions `40063192405`: actual run-level GREEN. The disposable DB and Docker container self-destruct after runner completion.
