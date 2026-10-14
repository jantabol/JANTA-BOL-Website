# JANTA BOL — P4-T034 / ADS-008: ACTUAL Encrypted B2 Database Backup Evidence
Date (UTC): 2026-10-14. Status: **BACKUP+OFFSITE CIPHERTEXT VERIFIED; ACTUAL DECRYPT/RESTORE NOT VERIFIED. T034 HOLD.**

## Precise execution
- Production source: **JANTA BOL** Supabase project `vrffsnkycvjithwtiylt`. Cricket project is unrelated and untouched.
- Protected main release/source: `c80b5c23141480837a13bf0cb67b93964904db63` (PR #9 merged).
- GitHub workflow: `.github/workflows/b7-production-free-encrypted-backup-MANUAL.yml`.
- Founder actor `jantabol` manually dispatched run **38583250674**, attempt 1.
- GitHub API at final read: **completed / success**, job **115918399566** **success**, all workflow steps success; zero GitHub Actions artifacts.
- Workflow exported *roles.sql, schema.sql, data.sql* using pinned Supabase CLI, plus *raw_full.dump* and *raw_inventory.txt* using PG17, checked files nonempty, created AGE encrypted compressed archive and uploaded with immutable rclone B2 copy. It then **downloaded the encrypted object** and passed local-vs-remote ciphertext `cmp -s` byte-for-byte. These are shell-script commands whose job step was observed to succeed.
- Evidence printed by final step (public metadata only, never plaintext):
  - `OFFSITE_ENCRYPTED_BACKUP_UPLOADED=true`
  - `OBJECT_SUFFIX=production/database/20261014T145029Z-run38583250674.tar.zst.age`
  - `SHA256_CIPHERTEXT=62f1584acf423f8bce3f60675f0e21bb70070ca73d0ab2fbb9615fd1fe156ae1`
  - `BYTES=10020038`
  - `RESTORE_VERIFIED=false` explicitly printed by backup job.
- Destination under pre-approved private JANTA BOL B2 bucket `jantabol-backup-euc-2026`. This metadata is not a public download URL; DO NOT add signed URLs or B2 private keys to repo/chat.
- Post-job independent JANTA BOL Supabase **SELECT counts only**: 31 articles, 7 campaigns, 7 advertisers, 0 ad payments, 0 LIVE campaigns, 0 PAID campaigns. Consistent with recent read-only baseline. Read-only counters do not prove that every legacy object/media file is backed up; Supabase storage objects are not included in database dumps.
- The GitHub UI warning about Node.js 20 runner deprecation and Ubuntu runner-image migration was non-blocking on this run; review workflow/action pins on upcoming maintenance cycle. Not a backup integrity failure.

## Strictly unproven and held
- Real AGE decryption using Founder's privately retained `AGE-SECRET-KEY-1...` identity: **not tested**. User reports matching keys; do not turn that declaration into independently verified cryptographic decryption.
- Restore actual JANTA BOL SQL/roles/schema/data and compare authoritative schema/RLS/grants/legacy RPC hashes in an **isolated disposable environment**: **not tested**.
- Supabase managed service internals, auth/storage metadata role/extension reconciliation, and **actual Storage objects/media backup**: **not proven**. The raw archive's existence is not itself a restorable full hosted Supabase deployment.
- ADS-008 payment guard production migration and actual ADS-009 actor denial matrix: **NOT authorized/NOT DONE**.
- The current archive was encrypted to **one Owner public AGE recipient only**, without a temporary second recipient available to restore on an isolated CI runner. Do not ask Founder to paste AGE Private Key into GitHub, any chat, website or Supabase; no direct cloud restore of this archive without trusted private-key handling.

## Next proposed gate (review first, NO automatic writes)
1. Preserve current immutable B2 encrypted archive and its SHA metadata (never overwrite).
2. Design local/offline private-key AGE decryption proof (without disclosing secret or private data) OR a separately Founder-approved new **two-recipient** backup run that encrypts to Owner's public key **and** a disposable per-run restore recipient, then decrypts downloaded ciphertext and attempts an isolated clone restore; the latter does NOT cryptographically validate the Owner's private identity and cannot substitute for the Owner's offline key check.
3. Define strict full-Supabase restore scope, fallback and reconciliation of internal schemas/roles/extensions; enforce `--exit-on-error`, exact source/target isolation, and **no data in GitHub Artifacts/logs**. Record what cannot be restored.
4. Do not run another real backup, open private archive, or perform production migration without explicit Founder approval and a reviewed detailed restore plan.
5. Perform live actor-specific E2/E5 negatives for ADS-009 separately; keep P4-T034 HOLD until actual evidence.

**NO FAKE PASS.** G2: offsite encrypted ciphertext+byte-level readback PASS. G3: real decrypt + isolated restore HOLD.
