# JANTA BOL — Phase-4 B11 / T075 E3 protected weekly encrypted joint-backup coding checkpoint
Date: 2026-10-28 IST. **EXECUTED CODE, CI + SECURITY REVIEW — NOT PRODUCTION ENABLED.**

## User directive
Founder: continue without waiting for Founder steps where none are necessary; preserve old code and zero-cost priority; one of three B11 blockers is E3 backup automation.

## Actual work completed in this turn
- Wrote a *new* weekly scheduled GitHub workflow `.github/workflows/b11-t075-scheduled-encrypted-joint-review.yml`. Planned schedule Sunday 03:15 IST (Saturday 21:45 UTC); selected to minimize runner/API usage, **not** a Founder-approved RPO.
- It is **disabled by default** even if deployed; needs independent GitHub repository variable `JB_T075_SCHEDULED_BACKUP_ENABLED=YES_FOUNDER_RELEASED`, protected existing `janta-bol-production-backup` environment review, and separate Founder approval of schedule/retention/cost.
- It uses the ORIGINAL DB+five original Storage byte encrypted B2 exporter, two-recipient AGE and B2 immutable upload/readback, disposable isolated PG17/Storage-byte restore. Does not recreate code or destroy existing T034/T069/T070 manual mode. No secrets are in source/logs.
- The existing original manual-script, original media exporter, media-receipt and PG17 networkless-restoration code were extended **only behind** exact explicit schedule flag `JB_T075_AUTO_JOINT_BACKUP=1` and exact GitHub workflow identity. The original manual path remains guarded by Founder actor, `workflow_dispatch`, Git Main, and run attempt 1; an unapproved PR, fork, different workflow or other branch is rejected.
- New bounded free-tier safeguards in **scheduled mode only**: remote encrypted B2 history readable **before** connecting to live production DB; refuse if existing ciphertext >2 GiB or unknown; encrypted single new archive must be <=512 MiB before B2 upload; immutable copy, no deletion, no pruning, original TTL / retention unchanged.
- New `ci/phase4/b11/t075-scheduled-backup-identity.mjs` with 10 independent source, auth/context, negative and quota regression tests.
- Actual review-only GitHub CI **Run 40653575191 / job 122699162978 SUCCESS: 44/44 PASS, 0 FAIL**. Branch-only test had no Supabase, B2 or Vercel Production secrets. Includes original T070 manual negative tests and media identity stability, after a minor test wording correction in first CI.

## Current exact gate
- **E3 SCHEDULED ENCRYPTED BACKUP CODING + ORIGINAL MANUAL REGRESSION = PASS_SCOPED (44/44)**.
- **E3 ACTUAL AUTOMATIC PRODUCTION BACKUP = HOLD**: no PR merge, no enabled production repo variable, no scheduled real run, no actual ciphertext verified from this new workflow. This is **not** the same as having automated backups operational.
- Actual currently enabled separate ChatGPT read-only `JANTA BOL Backup Watch` monitors historical original manual DB/media/joint GH run metadata daily; an immediate run was requested, NOT a real backup. Current record later can be independently checked.
- **T075 E8 WHOLE-PLATFORM RESTORE = HOLD** (GoTrue runtime/Auth/Edge/Vercel and independent device-loss untouched). **T072 original live case RPC duplicate P2 = OPEN**.

## Why Production cannot be truthfully marked complete
The protected main branch workflow currently has `manual only` release locks. Enabling a new scheduled *live* backup uses Supabase Production DB password, Storage service role and B2 offsite secrets, creates genuine encrypted ciphertext and consumes quota; it is a materially different authorization. Independent Founder approval for cadence/RPO, retention/cost and release gating is required by the existing program. Automatic Backups cannot be called PASS before observing a genuine scheduled execution and successful offsite readback/restore.

## Security
No Git Main merge, no Source LIVE guest UI, no Vercel redeployment, no Supabase Production SQL/write, no media upload/read from live, no original backup object deletions, no original protected GitHub work removed; Cricket/Saarthi explicitly untouched.

## Immediate safe release path
1. Independent review candidate PR; audit 44/44 and old T070 manual run plus real B2/AAL2 credentials existing protection, verify quota/expense, branch/release scope.
2. Founder signs weekly 03:15 IST cadence, retention, and activation (or approves a corrected alternative); protected GitHub repo variable and environment approval. Do not turn on silently.
3. After approved merge & activation, verify first original encrypted offsite production DB+five-media auto run, B2 immutable readback and PG17 restore; monitor freshness automatically; only then E3 auto backup functional PASS.
4. Complete remaining independent T072 real hosted AAL2 / Android and T075 E8 whole-hosted GoTrue/Edge/Vercel/Founder device-loss separately, no false final B11 LOCK.
