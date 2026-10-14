# JANTA BOL — B7 ADS-008 encrypted backup release gates (14 Oct 2026)

Scope: `jantabol/JANTA-BOL-Website` only. Never access or modify Cricket B2 bucket.
This branch is isolated from main. Do **not** assume the production payment guard is deployed.

## Evidenced preparation (NOT real backup)
- Owner GitHub UI showed environment `janta-bol-production-backup` with **secret names**
  `JB_BACKUP_AGE_RECIPIENT`, `JB_BACKUP_REMOTE_PREFIX`,
  `JB_BACKUP_B2_KEY_ID` and `JB_BACKUP_B2_APPLICATION_KEY`.
  GitHub environment secret values are write-only; screenshot cannot verify values.
- Owner Backblaze UI showed PRIVATE, empty bucket `jantabol-backup-euc-2026`.
  Its dedicated app key `jantabol-backup-2026` is distinct from the Cricket key.
- Owner reports a paper-custodied AGE private identity, not uploaded to GitHub.
  PRIVATE key matching and true offline recovery **not independently tested**.
- Synthetic PG17 isolated encrypt/decrypt/restore and tests for temporary B2
  config run in CI with fake data, fake credentials and no live database.

## Release plan — all gates fail closed
1. **Security review / isolated PR**: PR should contain only 6 new backup-only files,
   never previous Phase-4 app changes or secrets. Check runner `contents: read`,
   no public artifact upload, pinned actions, environment name and exact `main` gate.
   Reviewers must verify app-key scope and GitHub environment bypass settings.
2. **G2: REAL B2 connection — read-only, no DB**:
   After approved PR is merged to `main`, GitHub Actions workflow
   `JANTA BOL B2 connection PRE-FLIGHT (manual, read-only)`; branch main;
   exact confirmation input `JANTA_BOL_B2_READ_ONLY`.
   It reads GitHub environment secret values inside an ephemeral GitHub runner,
   tests `rclone lsf` for the dedicated JANTA BOL bucket and creates a
   **synthetic local age ciphertext**, without any B2 upload or DB connection.
   Check logs for PASS. If HOLD/FAIL, stop.
3. **G3: Database password**: Owner must provide `SUPABASE_DB_PASSWORD`
   to the same GitHub environment (not this chat); verify that it belongs to
   the JANTA BOL project, never Cricket. Do not send any password/key in screenshots.
   Backup script's DB URI is fixed to `vrffsnkycvjithwtiylt`; a failed
   connection does not prove anything about encrypted backup.
4. **G4: Manual REAL encrypted export**: After G2 and explicit Founder approval,
   execute `JANTA BOL FREE encrypted offsite DB backup (manual only)` from
   reviewed `main`, confirmation `JANTA_BOL_BACKUP_ONLY`.
   Check object upload, ciphertext SHA256 and re-download byte-for-byte equality,
   record timestamp/object path, confirm no plaintext/ciphertext GitHub artifact.
   Success here is **BACKUP WRITTEN**, not restoration.
5. **G5: Independent restore to disposable isolated environment**:
   Under Owner custody, use a trusted official `age` CLI and Owner's paper
   identity **OFF-GITHUB** to decrypt the retrieved ciphertext and inspect
   archive. Restore into disposable PostgreSQL 17/Supabase-compatible sandbox;
   check schema/table/row counts, security definitions, policies, editorial/audit
   invariants, role/extension caveats, and representative query results.
   Identify any auth/storage metadata or PITR limitations. Compare against
   read-only source fingerprints without exposing source data to logs.
   Destroy temporary plaintext after verification. **Do not import into live.**
6. **G6: ADS-008 production change**: ONLY after independently proven restore,
   current-source drift analysis and Founder deployment approval, apply
   already-isolated minimum-safe high-risk payment guard migration;
   conduct genuine negative principal, old-RPC and payment regression checks;
   keep tested rollback ready. **NOT part of this backup PR.**

## Honest current state
No real B2 connection test passed; no real production DB dump was uploaded;
no Owner private-key restore was verified; ADS-008 remains HOLD and
high-risk legacy confirmed-payment write paths remain unpatched in production.
CI synthetic PASS is valuable engineering evidence but not production PASS.
