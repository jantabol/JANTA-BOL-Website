# JANTA BOL | B12 Main ↔ V3 No-Loss Reconciliation | 29 October 2026

**Scope:** READ ONLY. No GitHub Main merge, domain cutover, SQL writes, real backup/restore or production deployment.
**Review PR:** #66 (Draft). **V3 Candidate PR:** #65 (Draft, based on B12 source branch PR #61).

## Frozen verified inputs
- Main HEAD: `f447231c0677644ca5a44cc19f12cf0314ff38ea`.
- V3 candidate ancestor: `04d280c8c6ead365482ecd13cb1d9f8c2ff4d2ee`.
- Common merge base: `265856ca9cbfd6c7d51989d85435397b72f24c8d`.
- Actual GitHub Actions merge-tree gate #40816530651: **HOLD**. As expected, an unmodified Git merge cannot automatically resolve 4 add/add conflicts.
- Main has 80 changed paths since merge-base, V3 branch contains 881+ changed paths; 78 initially overlap (as observed in #40816530651).

## Exact four conflicts and scoped review proposal
| Path | Keep from | Reason |
| --- | --- | --- |
| `.github/workflows/b11-t070-real-joint-restore-MANUAL.yml` | **MAIN** | Preserve the existing, protected real T070 manual DB and original media joint-restore workflow/paths, including its established launch and consent fences. |
| `ci/phase4/b11/storage-media-manual-cli.mjs` | **V3 CANDIDATE** | Includes the manual workflow behavior and adds distinct guarded T075 scheduled support; preserve the conditional new behavior without replacing Main's manual workflow. |
| `ci/phase4/b11/storage-readonly-export.mjs` | **V3 CANDIDATE** | Includes existing original-media export and a separately guarded T075 scheduled usage gate. |
| `ci/phase4/b11/t070-joint-storage-snapshot-identity.mjs` | **V3 CANDIDATE** | Includes existing manual receipt type plus guarded scheduled receipt type; no arbitrary receipt expansion approved. |

These are **proposed conflict choices**, not a Main merge and not approval to run manual backups or enable scheduled write jobs.

## Actual isolated tree proof
- Actions #40816876111: **SUCCESS** (synthetic source proof).
- Four listed conflicts explicitly resolved in an isolated temporary Git index/tree on the CI runner, never pushed or merged.
- Main-only paths preserved by identical Git blob identity: **2/2**.
- V3-only paths preserved by identical Git blob identity: **805/805**.
- Essential Founder Auth/Admin, V3 Article/Public News and original Main backup script blob checks passed.
- Six relevant source-only test suites on this **exact temporary computed tree**: **56 tests, 56 PASS, 0 FAIL**.
- No hosted UI, real cross-account owner, real restore or fresh Main release E2E was executed by the synthetic test.
- Actual GitHub Main merge remains **HOLD**; the unmodified merge-tree workflow intentionally reports **FAIL/HOLD** until a genuine integration branch applies reviewed conflict resolutions.

## Remaining explicit release gates
1. Materialize the reviewed four-conflict resolution as an isolated, **non-production** merged Git commit/branch; compare its Main/V3 file identities and full binary/asset preservation.
2. Run **whole-platform** B0–B12 CI and historical protected T034/T069/T070/T071 tests, not merely this 56-test source subset; any failure HOLD.
3. Hosted anonymous article/ISRO and Founder MFA/AAL2/admin URL regression on exact merged release candidate. Founder previously confirmed 15-minute lock; no redundant repeat required without a relevant code change.
4. Keep Main production unchanged until scope reviewed; avoid direct merge of V2 PR #63 as substitute for V3.
5. GoDaddy `jantabol.in` is attached/verified at Vercel but DNS is not yet configured to Vercel. No DNS changes until release go/no-go and rollback evidence.

**Status: STAGED RECONCILIATION PROPOSAL — SYNTHETIC SOURCE PASS — RELEASE HOLD.**

No fake PASS, no rebuild, no paid dependency. Soft launch remains the priority.
