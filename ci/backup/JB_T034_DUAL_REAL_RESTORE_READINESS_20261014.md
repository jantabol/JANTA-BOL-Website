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


---

## Superseding engineering checkpoint — 14 October 2026, 16:02 UTC

This amendment supersedes the earlier *public-only* synthetic approach, WITHOUT
claiming any real JANTA BOL restore. The isolated restore candidate now uses the
official `supabase/postgres:17.6.1.136` PostgreSQL 17 image with **no network
and no open ports**; creates a brand-new empty database from `template0`, and
restores a complete custom PG archive, including public/private/auth/storage
schema and underlying rows. It compares 25 exact source/restore metrics:
article/advertiser/ad campaign/payments/history/audit count, auth users,
storage OBJECT METADATA count, tables/RLS/policies/functions and 4 original
advertisement authority RPC body MD5s, plus sample anon/auth ACL checks.
Archival owner/GRANT metadata is retained in the NEW dual-identity mode;
the previous manually verified ONE-key backup behavior is preserved.

Verified live source **read-only** immediately before review:
- public: 67 ordinary tables, 67 RLS; 72 RLS policies, 157 functions.
- private: 5 ordinary tables, 3 RLS; 3 RLS policies, 30 functions.
- auth: 27 ordinary tables, 5 user records.
- storage: 8 ordinary tables, **4 actual Storage object references**.
- 31 Articles, 7 ad campaigns, 7 advertisers, 0 ad payments.
- Live database table owner roles: postgres for public/private;
  supabase_auth_admin for auth; supabase_storage_admin for storage.
- Existing payment RPC body fingerprints independently matched the old
  pre-migration inventory. **No production SQL writes.**

**Final synthetic evidence (fake-only):**
- New full-PG17 2-AGE-recipient independent restore CI run
  `38594370934`, job `115957164666`, **SUCCESS** on
  `a245d4cfbb616cd5bced9f4e27ca566b78046597`.
- GitHub logs: fake offsite ciphertext download match; two unrelated FAKE
  AGE private keys decrypt; wrong key and tampering denied; isolated clone
  restored fake public/private/auth/storage; 25 out of 25 deterministic fake
  source-vs-restored metrics exact including RLS and sample grants and 4 RPC
  fingerprint checks. Existing older backup synthetic regression also SUCCESS
  on the same head. This is NOT independent proof for real production bytes.
- CI RCA: container's short-lived bootstrap postmaster can shut down after an
  early pg_isready; now requires consecutive SQL successful checks. A full PG
  custom dump may or may not contain explicit public namespace creation,
  so the probe checks actual custom archive TOC rather than blindly dropping.
  Earlier SQL dummy-function quoting issue fixed in FAKE fixture only.
- Candidate NEW manual workflow remains `workflow_dispatch` ONLY, exact
  Founder identity, protected `main`, first attempt, restricted secrets
  environment, typed confirmation. A merge does NOT run that workflow.

### Remaining real gates (strict)
1. **Not run:** second genuine JANTA BOL encrypted B2 export;
   downloaded-ciphertext decryption with ephemeral runner key;
   isolated exact DB restore; compare real counts/RLS/ACL/RPC MD5.
2. Even with successful DB restore, **B2 AGE Owner paper private-key
   decryption is still not independently tested**. Runner-only identity
   proves a new archive is decryptable, not that Founder can decrypt.
3. Supabase **Storage object's actual file bytes** (4 current object
   references), Provider/Auth operational settings, Edge Functions runtime
   and offsite media copies are NOT contained in SQL backup and are
   separate hard gates for complete platform disaster recovery.
4. Never deploy ADS-008 payment guard, claim ADS-009 genuine-role E5,
   or declare P4-T034 FINAL PASS until actual evidence plus owner approval.
   No Cricket DB touched, no new paid services, no public GitHub artifacts.

**Decision:** Source+CI coding ready for review, real DATA restore = HOLD.
One Founder approval checkpoint is still mandatory before any new REAL export.
