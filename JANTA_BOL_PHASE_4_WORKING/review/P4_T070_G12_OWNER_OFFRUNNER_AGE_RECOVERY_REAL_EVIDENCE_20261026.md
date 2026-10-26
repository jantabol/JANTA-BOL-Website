# JANTA BOL P4-T070 — G12 / Founder Independent AGE Recovery & Immutable Ciphertext Evidence
**Date:** 2026-10-26 IST. **Scope:** JANTA BOL only; off-runner Android/Termux read-only Owner recovery of existing B2 media ciphertext. **Overall T070 E8 remains HOLD.**

## Independently corroborated context and observed Founder-local execution
- Actual protected GitHub run 40274621191, job 121414622988, produced an immutable B2 original-media ciphertext object (3 Storage buckets / five objects; two private grievance objects). Actual runner log states `B11_T069_ENCRYPTED_ORIGINAL_MEDIA_B2_READBACK=PASS`, `B11_T069_INDEPENDENT_OFFLINE_MEDIA_RESTORE=PASS`, `B11_T069_ORIGINAL_MEDIA_FILES_RESTORED=5`, `B11_T069_B2_CIPHERTEXT_SHA256=8b46443493245e06db6859de464ba4a2e3882a33b832ef3ae46add650528de21`, and `B11_T069_POSTGRES_OR_PLATFORM_CONFIG_RESTORED=false`.
- Founder downloaded the **existing encrypted B2 ciphertext** to Android, imported a copy into Termux's private app directory through the system picker (not by widening system permissions). Termux confirmed `G12_FILE_READY` and 4,781,378 bytes.
- After correcting preliminary CLI errors, independent AGE engine local test achieved `G12_AGE_ENGINE_PASS`. Earlier test FAIL statuses were caused by unsupported `age-inspect`, invalid `age-keygen` CLI syntax and/or incorrectly pasted shell commands; those failures were investigated and **are not proof of compromised ciphertext or incorrect owner key**.
- On Founder-local Android/Termux: `G12_BACKUP_INTEGRITY_PASS`, with `sha256sum` equality against **exact real runner-logged ciphertext digest** above (not a fabricated manifest SHA).
- On Founder-local Android/Termux, using **Founder-held primary AGE secret entered locally at a hidden prompt**, `G12_OWNER_RECOVERY_PASS` was observed. The decryption command authenticated the complete AGE ciphertext and streamed decrypted bytes to `/dev/null`. The key was not transmitted to ChatGPT, GitHub, the repository or Android screenshots. The test did not write a decoded archive to shared storage.
- These observations demonstrate **surviving primary-owner key access and authenticated off-runner ciphertext decryption**, not individual recovered plaintext objects/manifest or five-file per-object SHA verification on the Founder phone.

## Bounded actual PASS / outstanding E8 gates
1. **PASS — B2 original-media ciphertext identity**: GitHub ciphertext SHA = separate Founder Android copy SHA; file size = 4,781,378 bytes. Remote B2 ciphertext origin corroborated by manual workflow logs and Founder interface download.
2. **PASS — primary AGE key can decrypt the archive after ephemeral GitHub runner cleanup**, as evidenced by an AGE authentication-success exit on the separately held Android key; **no AGE private identity value, plaintext, file path, grievance source or JWT published**.
3. **PASS — actual T069 media-only five-byte-object isolated replay on GitHub runner**, prior G10 documented real source-vs-restore hash verification.
4. **NOT YET PROVEN — Founder-local replay of decrypted archive members and all five original plaintext object digests**. Streaming to `/dev/null` establishes AGE ciphertext authenticity only, not the semantic archive contents; the independently executed T069 five-file proof is a distinct run environment.
5. **NOT YET PROVEN — one trusted write-quiescent point binding database+Storage; disposable joint PG17/Auth/Storage/Edge/Vercel runtime restoration; original identities and effective negative RLS/ACL/AAL2; synthetic exercise for zero LIVE-update/payment rows; independent E1/E2/E4/E5/E8 Android verification.**
6. **Current live source read-only recheck 26 Oct 2026**: 12/12 nonempty editorial/grievance/live/ads/Auth identity checks consistent; two empty-relation FK checks NOT_EXERCISED (0 LIVE updates, 0 Ad payments). JANTA BOL project `vrffsnkycvjithwtiylt` ACTIVE_HEALTHY; PostgreSQL 17. This is live SOURCE validation, not recovered target data.

## Safety and release decision
- No production Supabase DB/Auth/Storage/Edge writes, B2 backup deletion, Github main merge, billing, new key generation or Cricket/Saarthi operation during G12 evidence reconciliation.
- **G12 Founder owner-key/off-runner B2 ciphertext authentication = REAL PASS.**
- **P4-T070 FULL-SYSTEM FINAL PASS + LOCK = HOLD; T071 NOT STARTED.** Never substitute separate DB-only and media-only successful jobs for a full single trusted-point recovery. Do not mark E8 PASS without an actually constructed and independently verified isolated environment.
