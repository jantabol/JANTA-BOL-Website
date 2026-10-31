# JANTA BOL — P4-T081 / RUN-11 / READ-ONLY CURRENT RELEASE PREFLIGHT
**Date:** 31 October 2026 | **Status:** E1/E6/E7 PASS_SCOPED, E8 HOLD, FINAL LOCK HOLD.

## Authority and absolute safety
P4-T081 means production backup + repeatable deployment + safe rollback/cutover, with **E1 E6 E7 E8**. This review does **not** authorize or perform production backup writes, DB/Storage/Auth/Edge/Vercel restores, DNS/alias reassignment, Git main merge, payments, or Founder bypass. It changes no product file. Soft Launch priority; preserve existing Article IDs, PURLs, audit and newer production records. Fee limit ₹0.

## Live production verified through connected systems (read-only)
- **Vercel project:** `prj_xNb9G3xjW35qSXEyF7o2qiCqG4HI`.
- **Current jantabol.in alias deployment:** `dpl_6XpfdMa7gCF5SDXd7EKHZfbpLfeF`, READY, exact Git SHA `93df12aa8ffdfae38d9a4066b6a4556bb36969e5`, from review branch `codex/t080-admin-ack-failclosed-review-20261031`. `www.jantabol.in` has a 308 redirect to the root domain.
- **Stable predecessor:** `dpl_EZRh8gzLQ1voeRKA2u5tF7DD3Byx`, READY, SHA `14a929180d99088e950475eeee609cae8e3f01c8`. Exact Github compare 3 files changed: T080 workflow, Admin add-news.html, isolated T080 test. **Zero DB migration scripts in this exact release difference**.
- Former deployment READY and identifiable is **not** evidence that rollback/cutover was safely executed.
- Current Supabase project `vrffsnkycvjithwtiylt` active: 34 articles (2 published, 31 drafts, 1 deleted), 919 article_versions, 1633 audit_logs, 16 live_sessions; 100/100 public tables RLS-enabled, 188 recorded migrations.
- 3 active pg_cron jobs are LIVE worker, LIVE session expiry and compliance deadline. **No database backup cron observed.** This does not establish whether an external backup scheduler ran.
- No production row, storage, billing, secrets, or keys were read beyond read-only system catalog, counts, Git workflows and public deployment metadata.

## Actual historical original recovery proof — limited scope
Original Founder T070 GitHub Actions `40452402698`, job `122017925138` completed SUCCESS on 27 October:
- `T070_REAL_JOINT_OFFLINE_PG17_DB_AND_FIVE_ORIGINAL_STORAGE_BYTES=PASS`
- `T034_FULL_PG17_DATABASE_RESTORED=true`
- `T070_DB_STORAGE_UNIVERSAL_ATOMIC_FREEZE_PROVEN=false`
- `T070_ACTUAL_GO_TRUE_EDGE_VERCEL_CONFIG_RUNTIME=NOT_RESTORED`
- `T070_FINAL_LOCK=HOLD`
These were read from **actual original job logs**, not a simulated new restore. Historical PG17 + five-media restore is PASS_SCOPED only, **not** current-point complete E8.

## Fail-closed rollback control
Exact original production source `ci/phase4/b12/t081-rollout-rollback-guard.cjs` returns HOLD for missing E8 / Owner AAL2 / write fence / article identities / newer-record parity. Even synthetic all-positive inputs return `operation_permitted=false`, `db_restore=false`; explicit separate authority is mandatory. Original T034/T070 and T075 Founder/manual and zero-paid gates must stay unmodified. This review runs tests on unchanged original control code; no live attempt is allowed.

## Hard remaining requirements before FINAL PASS/LOCK
1. **Real, identified current-point** DB + original private/public Media + Auth + Edge + Vercel configuration restore and recorded identity/security verification, with coherent recovery RTO/RPO (E8).
2. **Actual production backup schedule, health, readback and zero-cost budget** evidence, not theoretical policies, with Original Founder review environment and Backblaze B2 spending safeguards.
3. **Controlled deployment+cutover+rollback rehearsal**, signed exact SHA and old CI before/after, avoid any newer article/payment/grievance/audit overwrites (E1/E6/E7/E8).
4. Review protected Main vs active B12/T080 review branch integration; do not merge arbitrarily or pretend a build-level READY is a real data-safe rollback.

**Verdict:** `T081=IN_PROGRESS; BACKEND NO-WRITE PRECHECK PASS_SCOPED; E8 DUE; FINAL LOCK HOLD`. No Founder manual action in this review. A real protected Founder approved recovery workflow is a separate later manual gate with live data and possible B2 cost implications. Never loosen old security guards merely to get a green CI.
