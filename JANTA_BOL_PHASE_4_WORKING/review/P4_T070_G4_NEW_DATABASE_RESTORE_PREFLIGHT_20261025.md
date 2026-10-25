# JANTA BOL • Phase-4 B11 / P4-T070 • G4 New Database Restore Preflight

**Checkpoint:** 2026-10-25 India. **Status:** READ-ONLY G4 PREFLIGHT COMPLETE / NEW DATABASE RESTORE NOT YET RUN / FINAL T070 HOLD.

## Authority and isolation
Founder directed G4 work to start on 2026-10-25. Scope of this checkpoint: read-only production metadata reconciliation, existing main-branch restore workflow inspection, and controlled release prerequisites. No new database backup, networkless clone, media upload, production mutation, secrets read or CI run has occurred. Do not touch Cricket, Supabase Cricket, Vercel Cricket, main, protected DB or historical B2 objects. Current T070 draft PR is **unmerged**.

## G4-P1: Explain 93 → 100 public table drift (CLOSED as explained; not current restore parity)
Historical successful T034 GitHub Actions job **119230861685**, workflow run **39602669748** on 2026-10-21: PostgreSQL17 isolated clone restored old DB; **93** public ordinary tables, **79** app/storage policies, 32 articles, 7 campaigns, 5 Auth users, 5 storage metadata records; 26 source-to-clone metrics and 16 deep security metrics exact. The log explicitly states `STORAGE_FILE_BYTES_RESTORED=false; PLATFORM_SETTINGS_RESTORED=false`.

Read-only Supabase source audit 2026-10-25 (same catalog counting contract, `pg_class.relkind='r'`): **100** public tables, **100/100 RLS enabled**, 5 private tables, 27 auth tables, 8 storage tables, **81** app/storage policies. The current 7 additions were found in *migration history entries timestamped AFTER historical October21 snapshot* and the actual 7 present public tables were each verified RLS enabled:

| Migration timestamp (UTC) | Migration | New public table | Current source count |
| --- | --- | --- | ---: |
| 2026-10-21 13:08:04 | b8_t094_cp03_question_evidence_binding_20261021 | b8_question_evidence_links | 0 |
| 2026-10-21 13:08:56 | b8_t096_master_outcome_reopen_guard_20261021 | b8_t096_question_disposition_events | 0 |
| 2026-10-21 13:09:23 | b8_t097_integrity_versioned_paging_20261021 | b8_t097_document_versions | 0 |
| 2026-10-23 05:06:16 | phase4_b9_search_analytics_additive_20261023 | b9_article_share_settings | 1 |
| 2026-10-23 05:06:16 | same | b9_article_terms | 1 |
| 2026-10-23 05:06:16 | same | b9_metric_global_settings | 1 |
| 2026-10-23 05:06:16 | same | b9_taxonomy_terms | 1 |

The current 2 added policies derive from migration 2026-10-23 14:26:19, `b10_t062_reporter_own_draft_least_privilege_security_20261023`: `b10_authenticated_read_published_articles` and `b10_reporter_read_own_articles`. Both were independently observed as SELECT / authenticated policies on `public.articles`. **The exact count difference of 7 tables and 2 policies is explained by authorized migration history; it is NOT a production failure, and it does NOT establish the recovered old snapshot matches the current source.**

## G4-P2: Live-source references and storage metadata
Read-only 14-check source integrity query: **12/12 nonempty relations consistent**; LIVE updates **0** and Ads payments **0**, respectively **NOT_EXERCISED**, not PASS. 3 existing Storage buckets, 5 objects; 2 grievance-private byte recovery and original hash checks are excluded under Founder instructions. The Founder personally demonstrated the 3 OTHER media objects' phone-side SHA match, AES-256-GCM local encryption/decryption and private B2 ciphertext upload+readback+decrypt+3 hash verify. Scope of this evidence: **three-media user-observed offsite readback**, not an independent complete storage/platform restore.

## G4-P3: Manual production database snapshot + disposable clone workflow safety review
Read `.github/workflows/b7-t034-dual-recipient-real-MANUAL.yml` and `ci/backup/jb-free-offsite-backup.sh` from **main**, not draft branch:
- Live main SHA checked: `4ef0643520f664b0c23fee2cd70af27c02509b5f` at this inspection; must reverify at actual dispatch.
- Existing workflow has `workflow_dispatch` only, Founder actor `jantabol`, main-only, first attempt only; `reviewed_sha` required to be the actual 40-character `github.sha`, and confirmation string required to be `JANTA_BOL_DUAL_RESTORE_ONLY`.
- Runner uses environment `janta-bol-production-backup`, fail-closed gate, `JB_T034_DUAL_RESTORE_PROBE=1`, creates new AGE ciphertext backup exclusively for JANTA BOL private B2 bucket and disposable, network-isolated PG17 restore. Existing script uses **rclone --immutable** and verifies offsite ciphertext roundtrip; no deletion/sync of existing database backups. Existing GitHub env secrets are used; Founder offline private AGE key never leaves their custody.
- This workflow is **an existing T034 database-only verification**, NOT an atomic DB + all 5 Storage bytes and platform configuration restore and NOT an automatic T070 PASS. Scope extension needs separate review before sign-off.
- Workflow has not been dispatched in this G4 checkpoint, since **the workflow itself requires a separate explicit Founder release decision AFTER current synthetic CI safety verification**; user permission to begin preflight is not silently treated as approval to access/live-export DB.
- No new B2/API keys requested. No paid Supabase clone created. Usage charges on GitHub/B2 depend on actual account allowances, so do not guarantee zero cost.

## Release prerequisites and HOLD gates
1. Reverify main SHA, existing manual workflow security locks, current synthetic guards/current branch CI and existing key naming/permissions without reading secret values. Requires actual Founder decision for the new production backup run.
2. Founder-only manual dispatch must use the intended existing workflow's required confirmation + exact reviewed SHA; never type secret values into workflow inputs.
3. Independently examine the new job's GitHub actual logs for fresh current-date snapshot, B2 immutable upload, network-isolated real database clone and schema/RLS/identity parity including all seven new tables and two policies. Failure leaves T070 HOLD.
4. New database archive and 2026-10-25 separate media archive are **NOT ATOMIC ONE-SNAPSHOT** without independent consistency proof. Media user-readback does not fill all storage E8: grievance bytes absent and platform configuration restore absent. Do not imply full T070 completion.
5. Report residual gaps, independent security regression, separate Founder Final PASS+LOCK only on actual evidence. T071 cannot start before that.

**G4-P1 (drift attribution): PASS**. **G4-P3 (workflow preflight): REVIEWED with manual release gate pending**. **New actual current DB restore: NOT RUN**. **T070 FINAL PASS+LOCK: HOLD**.

No private content, personal identifiers, backup passphrases, credentials, media hashes or secret paths are included.
