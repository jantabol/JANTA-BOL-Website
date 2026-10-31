# JANTA BOL — T081 / T075 Guarded Production Backup Source Reconciliation
**2026-10-31. REVIEW-ONLY. Soft Launch first. ₹0 paid allowance. No live backup, rollback, B2 upload or DB changes.**

## Exact base chain and conflict resolution
- Actual Vercel production SHA: `93df12aa8ffdfae38d9a4066b6a4556bb36969e5`, deployment `dpl_6XpfdMa7gCF5SDXd7EKHZfbpLfeF`, alias `jantabol.in`; PR83 review branch, NOT Main.
- T081 diagnostic PR86 was stacked on live SHA, real scoped T081+original T070+budget tests passed, but **original T075 code integration gate was RED 3/12** because newly hardened Backblaze budget/weekly conditions existed in PR58 but not the live source.
- PR58 reviewed source `86aa409ce2fde1c68d7b5082ab3443cb4277d873` diverged from live production by hundreds of commits. **Never blanket merge or rebase PR58 blindly.**
- This new integration branch is stacked on T081 review PR86 and ports only the protected T075 differences into exactly three files. Original unrelated backup, LIVE, Founder, audit, editorial and Cricket paths unchanged.

## Source transplant with narrow review
1. `ci/backup/jb-free-offsite-backup.sh`: port PR58's scheduled mode guarded by exact environment+main+workflow identity; verifies dedicated JANTA BOL bucket-wide B2 usage with old B2 object versions before any DB export and again immediately before immutable encrypted upload. Refuses unknown metadata, over-budget old/new archive or wrong authority. Existing T034/T070 manual path retains the original Founder/manual identity requirement and no automatic delete or cleanup.
2. `ci/backup/jb-t034-offline-full-pg-restore.sh`: **only** add scheduled T075 exact-authorized restore path at the original T070 media identity stage; preserve the original manual branch condition exactly and deliberately **do not** import PR58's extra fake-source review branch permissions. Original simulated CI allowances not broadened.
3. `.github/workflows/b11-t075-scheduled-encrypted-joint-review.yml`: replace old dummy candidate script references with exact guarded reviewed production source paths. Scheduled job remains **default OFF** behind TWO Founder release variables and protected manual reviewer environment `janta-bol-production-backup`. No branch pushes/PRs trigger real backup.
4. Original T070/T075 tests are **not changed**; strict T075 12/12 negative and source checks must pass without lowering standards. All other source changes fail CI exact-diff guard.

## Scope of proof (not yet full E8)
This is a candidate for code-level review only. Even a full GREEN scoped CI does not establish that B2 account-wide billing cannot arise, that full Auth/Edge/Vercel runtime has been restored, that current Production backup is coherent, or that an actual domain cutover/rollback was executed.
- No B2 fee, key change, subscription, cron activation, manual environment approval or paid upgrade was performed.
- Do not merge Main or promote production without complete independent protected Phase3/B0–B11 regression, B11 T072 reconciliation, an exact production release/go-no-go and separate Founder review.
- The previous T070 original real PG17 + five-media restore only scoped-PASS and explicitly logged `T070_ACTUAL_GO_TRUE_EDGE_VERCEL_CONFIG_RUNTIME=NOT_RESTORED` and `T070_FINAL_LOCK=HOLD`.

**Checkpoint:** T081 integration source candidate submitted for real CI, but E8 full coherent original backend+media+Auth+Edge+Vercel restore NOT_RUN. Actual traffic cutover/rollback NOT_RUN. **P4-T081 FINAL PASS/LOCK HOLD.**
