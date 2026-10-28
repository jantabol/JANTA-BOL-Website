# JANTA BOL • Phase 4 B11 • P4-T070 • G5 — Fresh Production Database Backup & Isolated PG17 Restore Evidence
**Founder checkpoint:** 2026-10-26 00:37 IST, verified independently via GitHub connector; GitHub event/logs 2026-10-25 UTC. **T070 DB recovery subset PASS; T070 overall HOLD.**

## Evidence authority
- Repository: `jantabol/JANTA-BOL-Website` **ONLY**.
- Founder manual GitHub Actions workflow `b7-t034-dual-recipient-real-MANUAL.yml`, **run #11 / run ID 40223103797**, job **121258741884**.
- GitHub workflow run `completed`, `conclusion=success`; job `dual-recipient-restore` `completed/success`; all actual job steps `success`. 16m59s duration as Founder Android screenshot.
- Triggered as `workflow_dispatch` under approved protected GitHub environment `janta-bol-production-backup`; `main` commit `4ef0643520f664b0c23fee2cd70af27c02509b5f` matched intended reviewed SHA.
- Source of assertions: **real job logs** (NOT green status alone). Logged archive work at UTC 2026-10-25 18:58–19:06.

## Real logs — verified outcomes
| Audit item | Log evidence | Verdict |
| --- | --- | --- |
| Snapshot consistency | `T034_SOURCE_RAW_DUMP_AND_MANIFEST_SHARED_SNAPSHOT=CONFIRMED` | PASS, same DATABASE dump/manifest snapshot only |
| Encrypted B2 backup | `OFFSITE_ENCRYPTED_BACKUP_UPLOADED=true` | PASS |
| Roundtrip AGE decryption | `T034_ACTUAL_REMOTE_AGE_DECRYPT=PASS; OWNER_PRIVATE_KEY_NOT_USED=true` | PASS |
| Isolated fresh PG17 restore | `T034_FULL_PG17_DATABASE_RESTORED=true` | PASS |
| 16 deep security metrics | `T034_SOURCE_TO_CLONE_16_DEEP_SECURITY_METRICS=EXACT_MATCH` | PASS |
| 26 complete DB parity metrics | `T034_SOURCE_TO_CLONE_26_METRICS=EXACT_MATCH` | PASS |
| Anon role / payment denial | `T034_ANON_REAL_ROLE_ARTICLE_READ_AND_PAYMENT_DENIAL=PASS` | PASS |
| No-login realtime owner / function grants | `T034_DISPOSABLE_NOLOGIN_REALTIME_OWNER=PASS`, `T034_DISPOSABLE_FUNCTIONS_ACL_GRANTEE=PASS` | PASS |
| History sequence / owner ACL locale | `T034_AFFECTED_HISTORY_AUDIT_SEQUENCE_NEXTVALUE=PASS`, `T034_DATABASE_OWNER_ACL_LOCALE=EXACT_MATCH` | PASS |
| Superset of current DB schema | `TABLES_PUBLIC=100 TABLES_PRIVATE=5 TABLES_AUTH=27 TABLES_STORAGE=8` | PASS within DB parity |
| RLS / policies | `RLS_PUBLIC=100 RLS_PRIVATE=3 POLICIES_APP_STORAGE=81` | PASS within DB parity |
| Key data aggregates | `ROWS_ARTICLES=32 ROWS_AD_CAMPAIGNS=7 ROWS_AUTH_USERS=5 ROWS_STORAGE_METADATA=5` | PASS within DB parity |
| Binary Storage object bytes | **`STORAGE_FILE_BYTES_RESTORED=false`** | NOT PROVEN |
| Platform configuration | **`PLATFORM_SETTINGS_RESTORED=false`** | NOT PROVEN |

**Critical:** The old Oct21 historical backup had 93 public tables and 79 policies; today's freshly restored database has 100 and 81, so **G3-P1 current-schema drift is resolved by actual fresh DB clone evidence.** This does NOT mean the 2026-10-21 old backup contained new schema or that historical and new backups should be mixed.

## Warnings investigated
- Docker pull hit transient `toomanyrequests: Data limit exceeded` on multiple pulls before the full workflow proceeded to complete fresh, matching PG17 clone.
- Supabase filtered `pg_dump` reported circular foreign-key constraints. The separate full custom `raw_full.dump` underwent real restore with measured matching security/schema; no indication in the final job evidence that the circular FK warning invalidated the successful full custom-format recovery. Do not ignore this warning for future *filtered data-only* dump restores.
- One GitHub warning states Node.js 20 is deprecated and `actions/checkout` targeted Node 20 but was forced onto Node 24. **Nonblocking for this completed run**, tracked as future toolchain maintenance; this is not proof of ongoing compatibility.
- No `BACKUP_FAIL_CLOSED` marker present in this job.

## Scope, gap, next gates
1. **This is a real up-to-date database-only restore from a GitHub runner to an isolated disposable PG17 clone**, with real schema/data/Auth metadata/ACL/RLS identity-parity metrics, B2 encrypted offsite roundtrip. This is strong evidence for T070's **DATABASE subsection**.
2. Founder separately demonstrated **3/3 non-grievance media files** AES-256 encrypted private B2 offsite readback + Android local decrypt/hash. This was independent, not automatically bundled with fresh DB snapshot/isolated storage restore. **Do not state five media objects recovered**.
3. Two grievance-private files were explicitly excluded from byte-hash matching/backups by Founder. Their byte recovery = NOT TESTED/NOT PROVEN.
4. Platform settings/Auth service secret provision/configuration were not restored (`PLATFORM_SETTINGS_RESTORED=false`). Database auth metadata/role parity is NOT equivalent to full platform Auth recovery.
5. New DB dump snapshot and manually captured media are from different capture times. No atomic all-component snapshot, isolated DB + restored original Storage bytes + actual platform runtime demonstration. T070 overall E8 **HOLD**; T071 must not start.
6. Next: independent target current DB source/clone identity review from evidence; plan any isolated full-media/platform recovery **without altering production**; respect grievance privacy restrictions. DO NOT run another live production backup, request secrets, merge or add paid services just to close test.

## Security / preservation
No user secret, source object bytes, private file path, identifying row data, backup archive, GitHub Action environment values, private AGE key or SHA-256 receipt appears in this doc. GitHub main and production are unchanged by this reporting. Written on **Draft PR #40 branch only**. Do not assert standalone T070 Final PASS/LOCK from success icon alone.

**G5 Verdict: Fresh encrypted B2 database-only restore — PASS (from independent GitHub logs). Full T070 — HOLD.**
