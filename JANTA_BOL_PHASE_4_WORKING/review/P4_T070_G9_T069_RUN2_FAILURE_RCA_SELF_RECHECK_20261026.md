# JANTA BOL — B11 / P4-T070 — G9 T069 Manual Recovery Failure #2 — Targeted Root Cause & Two-pass Self-Recheck
**Checkpoint:** 2026-10-26 10:31 IST; evidence: GitHub native actions run **40272013854**, job **121406656312**, protected-main SHA `bfd22fc7c2716fe32ffe517b556012089f5ea440`. This is a **failure diagnosis, not a successful original-media restore**.

## Unambiguous RCA: MISSING SECRET IN PROTECTED JOB CONTEXT
Native job **FAILED in Step 5**, `Read original 3 buckets and verify real B2 ciphertext offline restored file hashes`, with **exit status 1** before any source export or offsite upload.

Actual logged shell commands, in execution order, immediately before the failure:
```bash
set -euo pipefail
umask 077
test -n "$JB_B11_SERVICE_ROLE_KEY"
test -n "$JB_BACKUP_AGE_RECIPIENT"
test -n "$JB_BACKUP_B2_KEY_ID"
test -n "$JB_BACKUP_B2_APPLICATION_KEY"
test -n "$JB_BACKUP_REMOTE_PREFIX"
```
GitHub's environment block for the step showed:
```text
JB_B11_SERVICE_ROLE_KEY: [EMPTY]
JB_BACKUP_AGE_RECIPIENT: [REDACTED MASKED]
JB_BACKUP_B2_KEY_ID: [REDACTED MASKED]
JB_BACKUP_B2_APPLICATION_KEY: [REDACTED MASKED]
JB_BACKUP_REMOTE_PREFIX: [REDACTED MASKED]
```
**Failing command: the FIRST `test -n "$JB_B11_SERVICE_ROLE_KEY"`.** Exit 1 caused fail-closed job stop by `set -e`. Its YAML environment mapping is `JB_B11_SERVICE_ROLE_KEY: ${{ secrets.JB_B11_SERVICE_ROLE_KEY }}`. Therefore the corresponding GitHub Secret **was unavailable or empty in this protected job context**. Plausible upstream causes: secret missing/empty, wrong name, wrong GitHub repo/environment scope, or policy denying its exposure. **Cannot distinguish these possibilities from a masked execution log**, and cannot read secrets through this connector; do NOT claim to know which one is true. Never put the actual secret in logs/chat/repository.

No source Storage API request, temporary 5-file export, B2 upload or decrypted isolated restore was reached during this run. No grievance-private object bytes were processed by run #2.

## A/B comparison with previous failed run
| | Run #1 | Run #2 |
| --- | --- | --- |
| Run ID | `40270221667` | `40272013854` |
| Main SHA | `4ef0643520f664b0c23fee2cd70af27c02509b5f` | `bfd22fc7c2716fe32ffe517b556012089f5ea440` |
| Security/job gate | Founder + protected environment approved | Founder + protected environment approved |
| First error | Old **negative security test** inherited trusted runner env and incorrectly expected auth-denial; real script correctly rejected missing AGE public recipient in test process | Corrected negative security tests **5/5 PASS**, Storage exporter tests **7/7 PASS**. Next real data step stopped immediately at **missing GitHub service-role secret** |
| Encrypted backup produced | NO | NO |
| Storage bytes fetched | NO | NO |
| Release verdict | FAIL/HOLD | FAIL/HOLD |

The scoped test-only hotfix PR #41 merged successfully and solved exactly its targeted problem; **it did not install, configure, rename or verify** the separate storage export service-role secret. Assuming the second run would succeed solely because synthetic tests passed was a release-preflight **coverage gap**. Do not repeat that assumption.

## Independent self-check #1 — source-to-log trace
- `.github/workflows/b11-storage-media-MANUAL.yml` has `environment: janta-bol-production-backup`; the protected job gets environment/repo secrets only in the last data step.
- The first step of this last data step runs `test -n "$JB_B11_SERVICE_ROLE_KEY"`; logged masked env confirms it is **empty**; action stopped in **~31 sec** (including job setup/install) with exit **1**.
- The exporter `ci/phase4/b11/storage-media-manual-cli.mjs` actually passes `process.env.JB_B11_SERVICE_ROLE_KEY` into `exportStorageBytes`; that then guards token length and uses it for **authenticated private Storage read** from the pinned **JANTA BOL** Supabase project. The source really NEEDS a valid privileged, intended-scoped key, not merely a syntactically nonempty placeholder.
- Other four environmental values were masked/not empty in this log and were used successfully in earlier separate DB backup #11, but their functional use on this particular Media workflow **has not yet been demonstrated**.

## Independent self-check #2 — repository-wide config-name inspection
Inspected all 24 main-branch Actions workflow definitions for `secrets.<NAME>` references:
- Manual original Storage workflow is the **ONLY** GitHub workflow referencing `secrets.JB_B11_SERVICE_ROLE_KEY`.
- Successful B7/T034 historical DB backup used `SUPABASE_DB_PASSWORD` plus the 4 `JB_BACKUP_*` values. **It NEVER depended upon `JB_B11_SERVICE_ROLE_KEY`.**
- Therefore historical database success and the recent test-only PR success **could not validate** this credential availability. This explains the different failure in run #2.
- Repo metadata tooling does NOT expose GitHub Environment Secrets entries/values, so only the Founder can check presence/correct scope in GitHub Settings. No secret value fetched.

## Safe, exact next gate (requires Founder manual step)
**Do not dispatch run #3 yet.** On Android, navigate GitHub repository `jantabol/JANTA-BOL-Website` → **Settings → Environments → janta-bol-production-backup → Environment secrets**. Check exact secret name **`JB_B11_SERVICE_ROLE_KEY`** (case-sensitive). If it is absent, configure it using the EXISTING authorized JANTA BOL Supabase backend/service-role key (not an anon/public/publishable key, not B2 password, not Cricket key). If a similarly named secret exists in a different scope, reconcile the correct name/access scope rather than creating duplicated, unwatched secrets. Do not paste its value, screenshot it, put it in pull requests, print it in CI or share it with assistant. If key unavailable, HOLD; do not bypass private RLS by making grievance objects public. Review repository and environment permission of the privileged key and follow the established rotation protocol if it was ever exposed.

After Founder reports **only** a status such as `JB_B11_SERVICE_ROLE_KEY PRESENT IN ENVIRONMENT` (never the value), recheck MAIN SHA/controlled workflow with GH connector. A separate Founder release decision before the next sensitive run is appropriate, and then ONE reviewed main-only run. Presence alone does not prove key validity; next scoped runtime may still stop on API auth/other gates. Do not promise a PASS until real file-byte restoration logs exist.

## Security and preservation
This G9 analysis and report are additive, non-production, on existing **DRAFT T070 PR #40**. NO Supabase/B2/Vercel writes, no production DB changed, no raw grievance files or secrets read, no main merge, no new key, no Cricket activity. T070 current database-only restore and three-media Founder encrypted offsite readback remain previously verified; **5-object recovery and full T070 FINAL PASS+LOCK remain HOLD**.

**Engineering verdict: ROOT CAUSE CLASS CONFIRMED — UNAVAILABLE/EMPTY `JB_B11_SERVICE_ROLE_KEY` in approved Media workflow job. Exact administrative reason UNVERIFIED pending Founder environment-secret audit.**
