# JANTA BOL / P4-T034 — Real-restore readiness: REVIEW GATE
14 Oct 2026. **Coding + synthetic CI only. NO SECOND REAL BACKUP EXECUTED.**
Working branch: `review/t034-dual-recipient-real-restore-20261014`, base `c80b5c23141480837a13bf0cb67b93964904db63`.

## What this candidate does (opt-in only)
1. Preserves the current production single-recipient manual backup path as the default (no change unless `JB_T034_DUAL_RESTORE_PROBE=1`).
2. Adds a distinct **manual-only** `b7-t034-dual-recipient-real-MANUAL.yml` with fixed JANTA BOL repository, Founder actor, `main` branch, exact typed confirmation and `run_attempt==1`. Uses existing protected backup Environment. It is NEVER invoked by push, PR, scheduled runs or this document.
3. An explicitly approved future manual run would produce a new JANTA BOL SQL bundle and encrypted B2 object, addressed to BOTH (a) existing Founder's public AGE recipient and (b) a fresh temporary runner-generated public AGE recipient. The latter secret identity never goes to GitHub repository/artifacts, B2, chat or any other service; temporary files are deleted at the runner end.
4. Read the actual ciphertext back from B2, compare local and remote ciphertext byte-for-byte, decrypt from downloaded ciphertext with the single-run private identity, compare restored SQL files byte-for-byte with originals, and attempt a **networkless, disposable PG17 public-schema-only clone**. The offline helper never connects to production, Cricket, or external networks.
5. If anything fails, report HOLD/FAIL without touching the production database. The encrypted B2 file, if successfully uploaded, remains immutable even when a later clone check fails.
6. The clone verifies positive public articles, public campaigns existence, public tables with RLS enabled and at least one policy. It deliberately will NOT say that auth users, roles, storage objects, extensions, security-function dependencies, edge functions, or entire Supabase project were fully restored.

## Synthetic execution and RCA (NO production secrets)
- CI source `.github/workflows/b7-t034-dual-age-isolated-synthetic-ci.yml` uses disposable PG17 FAKE `public.articles` and `public.ad_campaigns`, dummy RLS, two fake AGE identity pairs, simulated immutable offsite object, independent readback/decrypt, a wrong-key negative and tamper negative, then calls the EXACT same offline clone helper used by the manual candidate.
- First-run failure (run `38587179557`): Ubuntu default host pg_dump was older than fake PG17 server. Exact first divergence independently found in the job logs; changed schema/data exports to official `postgres:17` Docker client (run `38587346612`).
- Second-run failure: after removing the target's default `public` schema, `pg_restore --schema=public` did not recreate it (schema filter excludes namespace creation). Failure message precisely `ERROR: schema "public" does not exist`. Corrected isolated-target-only initialization to retain empty default `public` namespace, not changing actual app data (run `38587631495`, then fixed).
- **Final successful synthetic job**: run `38587830317` job `115934441878` **SUCCESS** on commit `847ac753bf0966be0c30b295116e78995358b3ab`. It proved distinct fake key decryptions, wrong key/tamper rejection, no B2 write, PG17 public schema restored from fake data with RLS/policy checks. Do not relabel this as LIVE restore evidence.
- Normal old backup workflow remains Founder-only, unchanged GitHub Actions input/trigger. Normal backup path's one recipient AGE address and existing B2 upload/download procedure are preserved.

## Security/Risk gates before manual launch
- Founder must explicitly approve ONE second live JANTA BOL encrypted DB backup and the ephemeral-runner decryption/clone; the prior decision **A** authorized only **coding and synthetic CI**, not executing a live test.
- **Owner private AGE identity is NOT independently verified by this method.** The test's separate temporary identity only proves the newly created archive is decryptable by the one-time runner key. Founder needs offline Owner identity check on the existing archive without sharing key material.
- **Complete hosted Supabase restore is NOT proven** by a public-only PG17 clone. Live JANTA BOL has public/private/auth/storage schemas and Supabase-specific extensions and roles. A true complete disaster recovery verification needs an isolated compatible Supabase instance and storage objects restore; log these gaps as HOLD if unsupported.
- The public-only clone may fail against genuine production schema due to missing `auth`, extension or role dependencies. In that case: upload may already have succeeded, clone remains HOLD, and there must be NO fake PASS, no production migration, no automatic retry.
- ADS-008 guard deployment, ADS-009 genuine role-negative sessions, and P4-T034 FINAL PASS remain blocked and out of scope.

**DO NOT enable autorun, upload any plaintext/ciphertext as GitHub Actions artifact, reveal Owner AGE private key, or change Cricket project.**
