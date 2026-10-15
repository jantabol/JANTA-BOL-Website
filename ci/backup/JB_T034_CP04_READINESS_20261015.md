# JANTA BOL — P4-T034 CP-04 READINESS (15 Oct 2026)

## Verdict: CP04 configuration/static evidence PROVEN; NEXT REAL RESTORE STOP
This is a scoped code/UI/read-only evidence checkpoint, not permission to
dispatch a secret-backed workflow, restore a real archive, or modify LIVE SQL.
Cricket Project was not accessed; historical immutable B2 objects untouched.

### Verified GitHub branch / environment gates
- `main` exact SHA `e70473b8b56ea96f3f7d0e9897a97d766ff68356`.
- Public GitHub API: `main protected=true`, ruleset `25139594` ACTIVE,
  ref `refs/heads/main` only, PR required, branch deletion/force-push denied,
  zero bypass actors. **No mandatory CI status required yet**.
- Founder GitHub UI screenshot evidence: `janta-bol-production-backup`
  environment, 5 secret *names* (values not inspected), 2 protection rules,
  only `main` allowed. Required reviewer `@jantabol`, self-review allowed,
  administrator bypass OFF; settings saved/update banner visible.
- **Not proved**: actual GitHub wait-for-approval behavior during a secret-backed
  workflow. Founder can approve his own run: two deliberate steps, NOT independent
  two-person control.
- `main` manual workflow is STILL the old pre-CP02 implementation until reviewed
  PR #14 merges. Do not dispatch it as a production-ready restore.

### CP04 source hardening
- Backup/restore candidate **DRAFT PR #14** branch
  `review/t034-cp02-fix-20261015`.
- Updated reviewed manual workflow `.github/workflows/b7-t034-dual-recipient-real-MANUAL.yml`
  adds REQUIRED `reviewed_sha` input (40-hex exact `github.sha`),
  the original strict Founder/branch/repo/typed-confirmation/first-attempt check,
  environment `janta-bol-production-backup`, and **step-only** delivery of five
  environment secrets exclusively to final real export step.
  Preflight, checkout, apt and Supabase setup steps have no secrets.
- New reviewed `ci/backup/jb-t034-manual-release-static-gate.py` checks
  authorization contract and rejects eight purposefully corrupted fake
  variants (wrong actor, run attempt, SHA, main ref, env, automatic trigger,
  leaked secret and incorrect preflight SHA).
- GitHub Actions **run 38689860608 SUCCESS**:
  `CP04 STATIC=PASS`; `CP04 FAKE NEGATIVE=8/8 REJECTED`.
  Exact first successful source SHA
  `4031e08de0dd5d14ca6184f6636b918898cf078a`.
  No live DB, B2, private AGE key, or workflow_dispatch involved.
- Existing CP02 synthetic restore/extension/cron and backup regressions on
  `41a25781d717423b6f4c7275f9718d854eb7a355` remain SUCCESS.
  Recheck complete SHA-specific CI after every code change.

### LIVE read-only source safety observations
- Only JANTA BOL Supabase project `vrffsnkycvjithwtiylt` inspected.
  PostgreSQL 17.6, database `postgres`, owner `postgres`,
  UTF8, ICU `en-US`, collation version 153.121.
- All 7 required installed extensions verified, including
  `pg_net 0.20.4`, `pg_cron 1.6.4`, `supabase_vault 0.3.1`.
- Effective DB owner/ACL grants to PUBLIC/dashboard_user/postgres and
  supabase_etl_admin/supabase_storage_admin scoped as previously audited.
- Old payment RPC hashes unchanged
  `fed4e4f0c3c61091c9bfbeb59802f3a2` and
  `441749b81dbbc287b4ef752ac1a1e9f8`.
- Historical high-risk verification-pending/payment-pending case **1**,
  payments **0**, LIVE new b7_t034 guard triggers **0**.
- No data, schema, payment, cron, policy, B2 or secrets were changed.

### Outstanding STOP gates
1. Synthetic success != real full restore. Earlier authorized REAL run
   `38583250674` had encrypted B2 upload/readback PASS but restore untested;
   authorized REAL `38602777423` had B2+runner AGE decrypt PASS but
   full isolated PG restore **FAILED** (first real DB error unknown).
2. PR #14 remains DRAFT/UNMERGED; production-compatible full clone helper is
   NOT on `main`. PR #15 additive ADS008 payment guard remains DRAFT/UNMERGED
   on separate existing B7 app branch and is NOT LIVE.
3. Exact new reviewed SHA + affected regression and no source drift required.
   Branch protection currently doesn't REQUIRE CI; manual approvals must not
   substitute actual passing checks.
4. LIVE source pooler exported snapshot ability, live collation parity and
   actual restored role/security validity still NOT VERIFIED.
5. G5 Founder PAPER AGE private key must decrypt an existing immutable
   encrypted archive in trusted **OFF-GITHUB** environment. Runner AGE key
   proof does not satisfy it. Owner never sends key to chat, GitHub or agents.
6. GitHub branch/environment guards must be retained; B2 Object Lock and scoped
   key administration not independently inspected.
7. **New real B2/restore workflow** needs separate, explicit Founder permission
   for exact SHA and run; **ADS008 production migration** needs another distinct
   permission only after genuine recoverability/rollback is proven.
8. Final ADS001..009 true E2/E3/E5, real role/AAL2 negatives and Android
   tests remain. Complete B11 platform recovery is distinct.

**NO FAKE PASS: CP04 STATIC+UI CONFIG REVIEW = scoped PASS, real release NO-GO.**
