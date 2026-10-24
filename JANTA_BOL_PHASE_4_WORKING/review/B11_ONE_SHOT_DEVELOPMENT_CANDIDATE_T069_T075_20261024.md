# JANTA BOL / Phase-4 B11 — T069–T075 One-Shot Development Candidate
**Date:** 2026-10-24 IST. **Status:** SOURCE DEVELOPMENT CREATED, candidate CI evidence required; original T069–T075 real Final PASS+LOCK remain **NOT RUN**.

## Scope & consent
Founder approved B11 coding with strict 'no old file/test damage'. Therefore this change is **additive only**, confined to `ci/phase4/b11/**`, this new B11 candidate workflow, and this review report. Original B0–B10 web/admin/browser/SQL/MFA/backup/production sources and tests **NOT MODIFIED**. No new database migration, main merge, source API key, production export, B2 write, actual user/device recovery or paid service. Separate Cricket untouched.

## Real backup capability reused, NOT duplicated
Existing JANTA BOL B7/T034 real encrypted B2/AGE backup and networkless isolated PG17 full DB restore shell+parity remain the only authorized physical DB restore route. Historic 2026-10-15 workflow 38778388127 independently reported full DB clone and 26 baseline metrics as PASS, but `STORAGE_FILE_BYTES_RESTORED=false`, `PLATFORM_SETTINGS_RESTORED=false`. This B11 engine does **NOT** open SQL dumps or claim SQL restore; it covers missing **offline file-byte identity and recovery evidence** while preserving T034 backend.

## New code & original test mapping
- `ci/phase4/b11/recovery-engine.mjs` and `cli.mjs` — offline standard-library-only implementation, no network/provider API.
  * T069: SHA256 file inventory, exact JANTA BOL project binding (Cricket ID rejected), explicit age/RPO/RTO health flags fail closed, no invented RPO/RTO.
  * T070: disposable temp-only atomic restore-copy of source DB archive bytes, Article URL/versions identity evidence and all actual supplied storage/media byte files, hash parity.
  * T071: policy-based measured RPO/RTO positive only with explicit Owner approval + all coverage; module failure-isolation and independent source intent.
  * T072: atomic staged copy with fail injection, cleanup, safe retry/idempotence; existing dest never silently overwritten.
  * T073: path traversal, symlinks, wrong source project, credential references, corrupted bytes/manifest, account/device/security incident containment without automated risky actions.
  * T074: original storage bytes, metadata, stable IDs and source provenance required; real platform config and paper key still separate proof. Synthetic support cannot certify media B2 or live restore.
  * T075: no unauthorised live automated recovery; safe read-only health/result and documented incident decisions, irreversible operations Founder-gated.
- `ci/phase4/b11/recovery-engine.test.mjs`: defensive isolated negative/positive tests, no actual network/DB connection.
- `ci/phase4/b11/founder-recovery-policy.json`: **null** RPO/RTO until Founder approves actual targets, live auto-restore/tokens/delete prohibited.
- `.github/workflows/b11-full-development-candidate.yml`: source + self-contained T069–T075 test, existing B10 original test & T034 diagnostic preservation, scoped synthetic end-to-end, intentional 'development, not live lock'.
- Existing `.github/workflows/b11-g0-backup-recovery-preflight.yml` continues unchanged.

## Acceptance boundaries
This is **one complete scoped offline recovery subsystem coding batch**, not a claim that all platform/data/media/paid B11 systems are already developed or deployed. Material original test proof still required: real Founder-authorized DB+encrypted media snapshots, B2 independent file readback, actual storage-byte restore, config provenance, full PG17 DBA test, effective RPO/RTO and fail-closed restore, Owner phone/tablet loss. Previous original security B10 T060/T063/T064/T065/T066/T068 still not Final PASS+LOCK; B11 cannot approve B12 while unmet. Avoid unsafe 'no manual step ever' claims: production/device test evidence has real Founder checkpoints.

## Legacy preservation invariants
1. Existing permanent Article ID/URL stable, corrections same URL, Owner reserved powers and AAL2 unchanged.
2. Synthetic fault injection in isolated temp folder only, no real role/sessions/ads/news mutated.
3. Project_ref `vrffsnkycvjithwtiylt` strictly accepted; cricket `hriakdazkcvplsdwgfle` strictly rejected.
4. Sensitive backup dump is never uploaded to GitHub or shown in report; no user secrets or media uploaded.
5. Existing protected Backup release workflow remains manual Founder-gated. No new automatic destructive cron.

**Coding Verdict:** Pending actual GitHub CI. **Official original T069–T075 status remains NOT RUN / NOT LOCKED** until genuine E1/E2/E3/E5/E7/E8 as required by original execution pack.
