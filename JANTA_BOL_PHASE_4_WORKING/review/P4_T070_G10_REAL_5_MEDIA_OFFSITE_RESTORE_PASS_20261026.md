# JANTA BOL P4-T070 — G10 — Real All-5 Original Media Offsite Restore Evidence
**As of:** 2026-10-26 11:02 IST. **Scope:** Founder-authorized protected T069 original Storage export; audit of actual GitHub Actions run and job logs. **Full T070 E8 final lock remains HOLD.**

## Directly verified authoritative execution
- GitHub Actions `JANTA BOL T069 Original Storage Media AGE B2 (Founder manual only)` **RUN #3**, REST ID **40274621191**, head `bfd22fc7c2716fe32ffe517b556012089f5ea440` on GitHub main, run attempt 1, actor `jantabol`.
- Protected environment `janta-bol-production-backup` Founder approved. Runner/job **121414622988** and all steps **SUCCESS**; conclusion `success`.
- Real CI preflight before sensitive access: JANTA BOL Storage/exporter tests **7/7 PASS** and Founder-only manual guard tests **5/5 PASS**.
- The private secret `JB_B11_SERVICE_ROLE_KEY` and the four named AGE/B2 backup values were nonempty/masked in authorized actual recovery step; no secret values were printed in inspected logs.
- Actual B2 client setup: `PASS: ephemeral JANTA BOL B2 config created; no credentials displayed`.
- **Original encrypted B2 readback and offline restoration proven by real explicit job log markers:**
```text
B11_T069_ENCRYPTED_ORIGINAL_MEDIA_B2_READBACK=PASS
B11_T069_INDEPENDENT_OFFLINE_MEDIA_RESTORE=PASS
B11_T069_ORIGINAL_MEDIA_FILES_RESTORED=5
B11_T069_POSTGRES_OR_PLATFORM_CONFIG_RESTORED=false
T069_SOURCE_ONLY=YES; NO_LIVE_MODIFICATION_OR_GITHUB_MEDIA_ARTIFACT
```
- This manual workflow includes source authenticated GET bytes+sha256 of **all three actual original Storage buckets:** 2 grievance-private + 1 private-editorial + 2 public-media. Its offline restore hash verification compares original and recovered bytes; no private originals, object names or hashes needed in this document.
- Existing AGE encryption and remote B2 ciphertext immutable offsite copy implementation is in `ci/phase4/b11/storage-media-encrypted-b2-MANUAL.sh`. Successful log marker plus actual script checks support real encrypted archive, offsite readback, disposable decrypt, 5-object hash verification. GitHub Artifacts are absent for this workflow by design.
- Individual per-object byte evidence deliberately private and never pasted to ChatGPT, GitHub Code or public outputs; verified markers are evidence of executed tool, not public release of private raw bytes.
- Run #1 **40270221667** failed before source GET at incorrect negative preflight. Run #2 **40272013854** failed before source GET at absent service-role GitHub environment secret. The Founder installed authorized existing JANTA BOL legacy `service_role` key in the protected GitHub environment before run #3; successful run now establishes valid key in that execution context. The two failures are not overwritten or relabeled PASS.

## T070 E8 integrity boundary — DO NOT CROSS
- **5/5 Media Offsite Readback + Original-byte Isolated Restore: REAL PASS for Storage-only Recovery** ✅. Founder previously granted explicit informed permission for both private grievance images solely for this secured run.
- Previous T034 run `40223103797` achieved real isolated PG17 database restore/parity **DB-only PASS** ✅. It does not form the same coherent point-in-time snapshot as T069 run #3; source times are different.
- This T069 log explicitly says **`POSTGRES_OR_PLATFORM_CONFIG_RESTORED=false`**. No combined DB+Storage+Auth+Edge/Vercel platform separate-environment recovery or identity permission end-to-end has been performed. **Overall P4-T070 FINAL LOCK HOLD**, even though the all-media subset is now completed.
- Source had 0 LIVE updates and 0 Ad payments; these are **NOT_EXERCISED**, require non-production synthetic relationship recovery without making fake source records.
- The source code and data/config inventories in previous G6/G7/G8 reports remain the platform-related reference. No production website/database writes, no GitHub main merge via this G10 report, no Cricket/Saarthi touch, no new API keys or paid resources.
- Next gate: develop a scoped, expressly non-production joint-restore experiment and recovery-point binding; independently inspect Auth/RLS/Edge/Storage/Vercel config behavior. Don't automatically deploy to paid Supabase or disclose private evidence in chat. Founder approval and genuine E1/E2/E4/E5/E8 proofs before full LOCK and T071.

## Executive verdict
**G10 T069 ALL FIVE ORIGINAL STORAGE MEDIA BACKUP/RESTORE: PASS + EVIDENCE RECORDED.**  
**T070 DB and Media subtasks independently PASS, but cross-component REAL RESTORE: HOLD.**  
**T070 FINAL PASS+LOCK: HOLD. T071: NOT STARTED.**
