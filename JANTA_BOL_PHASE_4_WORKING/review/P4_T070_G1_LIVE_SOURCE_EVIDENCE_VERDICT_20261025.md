# JANTA BOL — P4-T070 G1: real source relationship audit + historical isolated-restore triage
**Checkpoint: 25 October 2026 | Founder explicitly STOPPED T069. This work is T070 only.**
## Original authority
`JANTA_BOL_PHASE_4_MASTER_EXECUTION_PACK`, P4-T070 RECOV-012..018, Sections 586–599.
**E1+E2+E4+E5+E8** requires actual isolated DB/files/auth/permissions/config restore with article/PURL, Grievance ID, Live history and campaign/payment identity preservation, trusted-source timing and reconciliation.

## What was ACTUALLY executed, with live JANTA BOL only
- Supabase read-only SQL `t070-live-source-integrity.sql` run 2026-10-25 by authenticated project connector; 14 relationships/uniqueness checks.
- **12/12 checks with nonempty source rows consistent; 2/2 checks (Live updates and ad payments) NOT_EXERCISED because each has 0 rows.** No personal rows or raw IDs retrieved.
- Counts (as read): articles 32, article versions 878, grievances 6, grievance history 57, grievance evidence 2, Live sessions 16, Live updates 0, advertisement campaigns 7, advertisement payments 0, Auth users 5.
- Article slug uniqueness and version uniqueness: both correct; grievance public IDs unique; positive linked rows have no tested FK orphans.
- Historic independent 2026-10-21 GitHub Founder-only workflow run **39602669748** logs independently verified: actual AGE B2 encrypted database backup readback, PG17 networkless clone restore, **26/26 exact DB metrics** plus **16 deep security metrics exact**, ACL/DB owner/locale and Auth/anon-privilege protected checks. **Logs explicitly contain `STORAGE_FILE_BYTES_RESTORED=false; PLATFORM_SETTINGS_RESTORED=false`.** It is older than 2026-10-25 source and cannot supply a matching contemporaneous source-vs-clone snapshot for T070.
- GitHub candidate `7b7cd6523ec507a3053861fce41b474e7bbce0d6`, Actions run **40191105670 GREEN 16/16 synthetic comparator tests** after fixing numeric vs UUID primary-key type validation. New static SQL contract tests attached in this G1 checkpoint. Main not changed; no new keys; no backup run; no production writes; Cricket isolated.

## HARD PASS GATES NOT SATISFIED
1. No restored snapshot with *matching current source* Article IDs/PURLs, Grievance public IDs, Live history and ad/payment entities captured/compared within the same trusted snapshot.
2. No original 5 storage-media file bytes restored/hash-verified from B2. Founder STOPPED T069; this status is respected. T070 separate real media proof remains unresolved and must NOT be quietly waived.
3. No restored Auth application session, RLS, ACL, private gateway and platform configuration acceptance E4/E5/E8.
4. Live updates and payments currently 0 rows; positive identity preservation for these relationships cannot be proven using those live tables alone.
5. Existing T034 real restore is historical *supporting evidence*, not T070 end-to-end identity recovery completion.
6. No copy of Founder private AGE key requested; no GitHub secret values exposed. All temporary DB restoration must be disconnected, never the production or Cricket database.

## Founder-facing verdict
`T070_G0_SYNTHETIC=PASS 16/16`; `T070_G1_LIVE_SOURCE=12 CONSISTENT, 2 NOT_EXERCISED`.
`T070_REAL_RESTORE_E8=NOT_RUN`; `T070_FINAL_PASS_LOCK=HOLD`.
This is a firm, **completed G1 evidence investigation**, not a final T070 lock. No additional source changes or key creation are justified before a safe externally approved isolated restore and file/config preservation plan.
