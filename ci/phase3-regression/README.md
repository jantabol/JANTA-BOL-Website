# JANTA BOL — Phase 3 CI / Regression Baseline

## Scope

This CI baseline covers the two current Phase-3 registers:

- Phase 3A: 581 tests
- Phase 3B: 124 tests
- Total source tests audited: 705

Source authority remains:

Blueprint -> Implementation -> Test -> Evidence -> Lock.

The Phase 3A 581-test PDF is a consolidated pretest archive reconstructed from the locked Phase 3A Blueprint where exact prior-chat wording was unavailable. If wording conflicts, the locked Blueprint remains final authority. Phase 3B uses the current T001-T124 register.

## Automation classification

Every source test ID is classified in `ci/phase3-regression/classification.csv`.

| Classification | Phase 3A | Phase 3B | Total |
|---|---:|---:|---:|
| CI fully automated | 47 | 1 | 48 |
| Backend / API / Supabase automated | 213 | 38 | 251 |
| Integration automated | 303 | 63 | 366 |
| Real-device / manual only | 18 | 22 | 40 |
| **Total** | **581** | **124** | **705** |

Classification means automation feasibility, not PASS. A test is PASS only when an implemented checker executes the exact requirement and produces evidence.

## Real-device / manual-only set

Phase 3A physical/device set:

`3A-P1-T001, 3A-P1-T002, 3A-P1-T038, 3A-P1-T040, 3A-P1-T078, 3A-P2-T008, 3A-P2-T124, 3A-P3-T010, 3A-P3-T140, 3A-P4-T014, 3A-P4-T048, 3A-P4-T050, 3A-P4-T051, 3A-P4-T052, 3A-P4-T060, 3A-P4-T096, 3A-P4-T097, 3A-P4-T114`.

Phase 3B controlled Live-platform/device set:

`T008, T024, T035, T040, T043, T090, T096, T099, T100, T101, T102, T103, T104, T105, T107, T108, T109, T110, T112, T121, T122, T124`.

These are not force-passed by backend simulation. They remain manual/deferred until the exact camera/encoder/provider/network/replay/end-to-end requirement has real evidence.

## Implemented regression suites

### Static / repository regression

`static-regression.cjs` covers parse/syntax integrity, governance files, secret leakage, publishable-vs-privileged key separation, authenticated actor identity, request ownership/idempotency patterns, owner/AAL2 boundaries, Phase-3B reuse of the canonical Live client, and selected UI authority boundaries.

### Transactional Supabase suites

Every DB suite runs inside a transaction and ends with `ROLLBACK`; CI fixtures do not persist.

- `db-regression.sql` — Priority, Expected End, End/Force Stop, replacement, revoke.
- `db-schema-regression.sql` — canonical tables, identities, uniqueness, provider separation, handoff/operation structure, public projection, RLS deny-by-default.
- `db-flow-regression.sql` — Request approval/rejection, idempotency and state transitions.
- `db-access-regression.sql` — authenticated/anonymous negative access, cross-access denial, direct mutation denial, audit immutability, public projection read-only.
- `db-function-security-regression.sql` — function execute allowlist and internal-function caller boundaries.
- `db-editorial-regression.sql` — multi-Reporter, corrections, conflict resolution, public-name privacy, delete/hide, Final Report and permanent identity.
- `db-retention-regression.sql` — seven-month routine cleanup and protected accountability/replay/final-report records.

Each assertion emits the original register test ID and fails CI if its evidence does not match the requirement.

## No-fake-pass rule

- Classification != PASS.
- Existing historical PASS != automatic CI PASS.
- A checker failure reopens that exact test.
- FAIL -> root cause -> minimum safe fix -> exact retest -> affected regression -> evidence -> PASS/LOCK.
- Harness/fixture defects are fixed as harness defects; they are not misreported as product defects.
- Final gates such as 3B-T123/T124 are not automatically declared PASS merely because CI exists.

## GitHub display

Open:

**Repository -> Actions -> Phase 3A + 3B Regression**

The run shows separate Static and Supabase jobs. Failed assertions include the exact source test ID, for example `FAIL [3B-T027]`.

## Required GitHub secret

The database job fails closed unless the repository Actions secret `SUPABASE_DB_PASSWORD` exists.

Only the password is stored as an encrypted GitHub Actions secret. The pooler host, database name, port and project-scoped Postgres username are non-secret workflow configuration. Never commit the database password or a password-bearing connection URI into source.
