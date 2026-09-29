# JANTA BOL — Phase 3 CI / Regression Baseline

## Scope

This CI baseline covers the two current Phase-3 registers:

- Phase 3A: 581 tests
- Phase 3B: 124 tests
- Total source tests audited: 705

Source authority remains: Blueprint -> Implementation -> Test -> Evidence -> Lock.

The Phase 3A 581-test PDF is a consolidated pretest archive reconstructed from the locked Phase 3A Blueprint where exact prior-chat wording was unavailable. If wording conflicts, the locked Blueprint remains final authority. Phase 3B uses the current T001-T124 register.

## Automation classification

Every source test ID is classified in `ci/phase3-regression/classification.csv`.

| Classification | Phase 3A | Phase 3B | Total |
|---|---:|---:|---:|
| CI fully automated | 79 | 6 | 85 |
| Backend / API / Supabase automated | 140 | 59 | 199 |
| Integration automated | 344 | 59 | 403 |
| Real-device / manual only | 18 | 0 | 18 |
| **Total** | **581** | **124** | **705** |

Classification means automation feasibility, not PASS. A test is not PASS until an implemented checker executes and produces evidence.

## Real-device/manual-only set

These remain outside pure CI because the exact requirement needs physical camera/encoder/device evidence:

- 3A-P1-T001
- 3A-P1-T002
- 3A-P1-T038
- 3A-P1-T040
- 3A-P1-T078
- 3A-P2-T008
- 3A-P2-T124
- 3A-P3-T010
- 3A-P3-T140
- 3A-P4-T014
- 3A-P4-T048
- 3A-P4-T050
- 3A-P4-T051
- 3A-P4-T052
- 3A-P4-T060
- 3A-P4-T096
- 3A-P4-T097
- 3A-P4-T114

A future test can move out of this list only when CI/integration evidence proves the same requirement without weakening it.

## First implemented CI layer

### Static / repository regression

`static-regression.cjs` currently checks:

- JavaScript parse/syntax integrity across the current working code.
- Required Phase-3 governance/evidence artifacts.
- High-risk frontend/repository secret leakage.
- publishable-key vs privileged-key separation.
- server-side authenticated Live API pattern.
- owner + AAL2 enforcement pattern for privileged Phase-3B actions.
- Phase-3B reuse of the canonical JBLive client rather than a parallel frontend engine.
- Force Stop reason validation.
- Reporter/Admin UI authority boundaries for selected controls.

Every official assertion prints its original test ID.

### Transactional Supabase regression

`db-regression.sql` runs inside a single database transaction and ends with ROLLBACK. Its fixtures therefore do not persist.

Initial mapped coverage includes:

- Priority ownership / removal / audit
- Expected End Reporter/Admin authority
- Reporter End request
- Admin Force Stop + mandatory reason + broadcast revocation
- Reporter replacement identity/revoke/no-return/audit
- Public-name control bypass rejection
- Phase-3A Live permission revoke grant invalidation

The SQL emits exact PASS/FAIL test IDs and fails the CI job if any mapped assertion fails.

## No-fake-pass rule

- Classification != PASS.
- Existing historical PASS != automatic CI PASS.
- A checker failure reopens that exact test.
- Fix flow: FAIL -> root cause -> minimum safe fix -> exact retest -> affected regression -> evidence -> PASS/LOCK.
- Final gates such as 3B-T123/T124 are never automatically declared PASS merely because CI infrastructure exists.

## GitHub display

Open:

**Repository -> Actions -> Phase 3A + 3B Regression**

The run shows separate Static and Supabase jobs. A failed assertion appears with its exact source test ID, e.g. `FAIL [3B-T027]`.

## Required GitHub secret for live Supabase regression

The database job intentionally fails closed unless repository secret `SUPABASE_DB_URL` exists.

Do not commit the database connection string into source. Store it only in GitHub Actions Secrets.

