# JANTA BOL | B11 T075 RUN-10 — recovery operations runbook and review-only acceptance gate
Version: REVIEW-ONLY 2026-10-28. Owner: Founder. **Not a production incident authorization.**
Source of truth: Phase 4 master P4-T075 (RECOV-001, RECOV-044…052; implementation/test coverage & Final Lock).

## What is actually available, and what is not
- Original manually protected encrypted private offsite database backup exists (T034 historical separate-run PG17 restored; 26 data + 16 security comparators).
- Original manually protected private/public Storage backup exists (T069 5/5 historical bytes restored), but not from the same time-point as original DB.
- Protected real joint manual DB+original Media backup workflow exists in GitHub Main; cannot claim successful latest whole-stack capture or restore just because YAML is present. Original T070 partial and source-candidate tests are not a full hosted platform restore.
- Original T069 GitHub backup-run **health probe** is **manual only** and only evaluates trusted GitHub run metadata. Recency requires Founder-approved max age; no approved cadence means HOLD, not healthy.
- Current JANTA BOL Supabase PG cron **three active jobs** observed read-only 28 Oct: `jb-live-worker-every-5s`, `jb-live-expected-end-minute`, `jb-compliance-deadline-hourly`. **None is an automatic database backup**. Do not alter these or confuse them with backups.
- Phase-3A LIVE must retain existing fail-closed recovery; a SQL/Source test or an `ACTIVE` Edge Function listing is not proof that the Live provider was restored.
- T072 active old Owner case-create RPC is **not safely idempotent** on timeout replay. Review-only additive alternative exists but is not deployed; do not mark repaired.

## Non-destructive incident procedure
1. **Identify scope and severity**: which service failed (Article/Guest, Founder AAL2, live/provider, grievance, ads, Search, database, media, credentials, or device). Capture UTC and IST incident start, affected published URLs and exact prior production SHA. No claims of provider outages without real observation.
2. **Protect identity & evidence**: halt *affected* dangerous writes through only pre-approved controls; do not change LIVE/broadcast, revoke genuine Founder sessions, delete rows or disable whole production by guessing. Keep same permanent Article/Ad/Case IDs and append-only audit/correction history. Existing founder emergency command WAIT/fail-closed policies apply.
3. **Baseline before restore**: compare current Git Main/Vercel SHA, Supabase project ref `vrffsnkycvjithwtiylt`, RLS/grants, backup manifest, encrypted offsite file names, captured timestamps, original media hashes, existing Auth/Edge function version inventory and policy. Read-only check; never print secret values. If old/partial or untrusted, classify HOLD.
4. **Choose the correct path**:
   - Editorial mistake: correct same permanent published URL through approved Founder correction/version workflow; NOT a whole DB restore.
   - Soft delete: restore via authorized application lifecycle; NOT physical backup restoration.
   - Provider/Live outage: use existing Phase3A recovery/fail-closed state; external provider cannot be simulated into PASS.
   - Database/Storage/accidental destructive incident: select **authorized isolated target** and point-in-time correlated snapshot; never restore over Production or merge unapproved migration.
   - Credential compromise: document exposure and required secret rotation/revocation/rollback plan in approved private console; no live key rotation just for test badge.
   - Founder phone/tablet lost: use isolated synthetic account/test draft and distinct device. Never wipe real founder device or reveal private recovery materials in chat/CI.
5. **Restore offline only after explicit Founder authorization**: verify exact encrypted archive hash and private offsite readback before decrypt; use ephemeral recipient/private identity held ONLY on locked ephemeral runner, restore separate DB/media sandbox, compare original IDs/relationships and source timestamps; never upload dump or identifiers to public Actions artifact. If DB/media not a single permitted recovery point, record mismatch and HOLD.
6. **Security regression after restoration**: Owner current AAL2/session; revoked/stale session deny; anon raw private tables deny; cross-account reporter and grievance deny; B9/News public guest article displays correct body; Ads not paid-live without real proof; LIVE not falsely broadcasting; media hashes exact; correction/audit append-only; provenance identifiers unchanged; dependent RPC and Edge functions same versions.
7. **Rollback and post-incident checks**: verify old published URL remains valid; review Vercel deployment rollback candidate and current Main SHA; assess Auth/Edge/cron/Storage and payment/ad invariants. Record actual lost acknowledged writes, measured RPO/RTO, source identity and responsible reviewer. If one family unverified, final HOLD.
8. **Recover normal operations** only on approved narrow change, with Founder signed production release and independent E8. Never label START/RESTART or GREEN CI as full disaster recovery.

## Routine operation candidate (not implemented / NOT scheduled)
A low-maintenance backup would need separately reviewed automatic encrypted offsite DB+original Storage cadence, allowed concurrency and quota, immutable retention + verified decryption, schedule health alerts, independently recoverable restore, Founder-approved age/RPO/RTO and device-loss process. A GitHub Actions health probe can be safely scheduled **only after Founder chooses recency/cadence and release review**; checking a green manual job is not automated backups. The 3 actual current pg_cron jobs are unrelated; do not edit them.

## Release gate — no auto PASS
`E1` actual original backup/restore run+job+timestamp markers and live read-only inventories;
`E3` implemented low-maintenance automatic backup and health reporting, current runbook plus observed real freshness;
`E7` preserved Phase3A Live and full affected old CI regression; 
`E8` independently verified **coherent original DB+Storage+Auth+Edge+Vercel** restore and security/function behavior, with all dependencies and Founder device loss clearly classified.

Source logs reviewed in GitHub RUN-10 CI are **component evidence only**, not complete E8.
If any required condition unavailable, `T075 = HOLD`. No Main merge, payment activation, Production promotion, app code modification, or Cricket/Saarthi impact from this runbook.
