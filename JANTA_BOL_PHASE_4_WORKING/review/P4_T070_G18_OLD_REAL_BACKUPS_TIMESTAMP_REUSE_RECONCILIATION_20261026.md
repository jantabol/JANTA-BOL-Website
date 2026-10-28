# JANTA BOL P4-T070 — Existing Real T034+T069 Backup Reuse Feasibility (G18)
**Date:** Monday 26 October 2026 IST. **Decision:** REUSE-CANDIDATE FOR A PRIVATE COMBINED DRILL, not proof of combined restoration. **T070 FINAL = HOLD.**

## Historical authentic evidence, independently reconfirmed
GitHub manual protected workflows:
- T034 **40223103797** (2026-10-25 18:49:51 UTC start): encrypted B2 DB custom archive restored to disconnected PG17. GitHub runner log confirms 26 source-to-clone identity and 16 security metrics **EXACT MATCH**; `STORAGE_FILE_BYTES_RESTORED=false; PLATFORM_SETTINGS_RESTORED=false`.
- T069 **40274621191** (2026-10-26 05:30:50 UTC start): encrypted B2 original-five-object archive restored in another disconnected runner, 5/5 SHA256 checked incl. two grievance-private objects. Not DB or hosted platform restore.
- Time separating **workflow start times is approximately 10 hours 41 minutes**. The *exact* T034 exported SQL snapshot creation timestamp is later than its workflow start; using workflow start as a conservative source-update cutoff.

## Newly executed read-only source comparison
Ran `ci/phase4/b11/t070-g18-legacy-db-media-drift-readonly.sql` on actual JANTA BOL Supabase: one current MVCC SQL statement, aggregate counts/timestamp markers for **11 identity/source families**.
- Articles 32; versions 878; Grievances 6; grievance history 57; evidence 2; Live sessions 16; live updates 0; ad campaigns 7; ad payments 0; Auth users 5; original Storage object metadata 5.
- 10 of 11 families show **0 post-T034-run-start timestamp-indicated changes**. One `auth.users` record shows `updated_at` AFTER T034 run start, so we performed a second dedicated read-only aggregate.
- Crucial time-window clarification: **0 auth user updates, 0 user sign-ins and 0 new auth.sessions were observed between T034 workflow start and T069 workflow start.** One auth-user update/sign-in and one new session were observed **AFTER** the T069 media run started. This later login/session is normal potential session churn; it does not itself prove a permission change or invalidate the old identity UUIDs. We must not misclassify this as between-backup inconsistency.
- Current original Storage objects have source metadata `updated_at` no later than **2026-10-18 05:57:15 UTC**, predating both protected workflow runs. Still, timestamps may be unreliable for overwritten blobs, mutable state outside tracked columns, deletions, other tables, cron/backfills and external writers: **ZERO INDICATED changes ≠ immutability proof**.
- No source raw PII, private object filename, email, JWT, key or plaintext media recorded in public repository or report.

## Automated source compatibility adjudication
- Added `ci/phase4/b11/t070-g18-legacy-backup-drift-observed.json`, `t070-g18-legacy-backup-reuse-gate.mjs`, and 6 adversarial unit tests wired into existing candidate CI. Strictly matches **real** GitHub run IDs, confirms two distinct backup scopes, 11 families with two correctly empty categories, Auth sign-in occurred after media, and rejects forged source/changed data/failure/missing category.
- **GitHub Actions run 40316809149, preflight job 121551346761: SUCCESS, 101/101 tests PASS, 0 FAIL.** The final true marker remains `T070_REAL_RESTORE_E8=NOT_RUN`. Unit checks are real executed tests about provenance/metadata; they did not run an actual two-component recovery.
- `assessExistingBackupReuse` may recommend evaluating these ciphertexts as a *candidate pair*, but explicitly always returns `original_archives_combined_restore_proven:false`, `exact_single_trusted_recovery_point_proven:false`, `auth_session_equivalence_proven:false`, and `t070_final_lock:false`.

## What genuinely remains to fulfill Original Phase-4 MASTER P4-T070
Per original 321-page execution pack (Topic 10, RUN-10, RECOV-012 to RECOV-018, Sections 586–599), a **representative actual** restore must safely recreate and reconcile DB/original files/Auth/permissions/config and preserve article permanent URL IDs, grievance public IDs, LIVE histories, and Ads/payment referential state. E1+E2+E4+E5+E8 independent actual evidence is needed. Our separate T034/T069 jobs plus snapshots on existing devices do **not** satisfy that combined isolated restore.
A review-ready protected private recovery run must recover **both real encrypted B2 archives** in a trusted temporary isolated environment. The original GitHub ephemeral AGE recipient private key does **not** persist; the durable Founder AGE private key is on Android only and should NEVER be put into GitHub/ChatGPT, public CI or logs. Consequently the two OLD ciphertexts **cannot currently be decrypted in a new runner with the available secrets**; and a new protected combined dual-recipient capture would require a reviewed manual main workflow and appropriate safe read consistency/barrier. Do not bypass original Owner/source protections just to get a green job.
Auth/Edge/Vercel runnable reconstruction, security negative tests, native user Android session, independent auditor and final release also have no authenticated proof. Two empty production families (LIVE updates/Ad payments) must be synthetic clone tests only.

**Scope verdict:** actual per-component historical backups PASS; app/database Storage **timestamp compatibility preflight PASS (not full immutable integrity)**; actual one-run original DB+files+Auth/Platform combined restore **NOT_RUN**; complete E8 **NOT_RUN**; T070 **FINAL HOLD**, T071 **NOT STARTED**.

**Safety:** Main unmerged, GitHub PR #40 still draft, JANTA BOL live writes/cron unchanged, Backblaze ciphertext unmodified, no paid project, no new credentials, Cricket untouched.
