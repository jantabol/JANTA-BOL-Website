# JANTA BOL — B11 P4-T072 bug-fix and P4-T073 continuation checkpoint
**Date:** 2026-10-28 (India). **Master:** Phase4 RECOV-027..040, T072/T073, pages 304–305. **No rebuild, no fake PASS, soft launch priority.**

## Executive decisions
**T072 reported P2 bug REPRODUCED on exact original backend:** `jb_b8_g1_owner_create_case(text,text,text)` has no durable request idempotency key; same request after lost acknowledgement generated 2 real different case rows in isolated PostgreSQL17. **Old original RPC remains live and unchanged**. The fix is a reviewed **ADDITIVE** SQL proposal, not a production deployment; original T072 final gate stays HOLD. Do not automatically merge or apply.

**T073 practical data-corruption recovery PROVEN in isolated source-backed PG17**, not full Production security/credentials/deployment rollback. T073 final E8 remains HOLD.

## T072 actual executed source fix and new concurrency evidence
- Original isolated P2 2-case repro: GitHub **40639793428 SUCCESS**.
- Fix proposal `JANTA_BOL_PHASE_4_WORKING/db/20261028_t072_b8_case_idempotency_PROPOSAL_REVIEW_ONLY.sql`: private ledger keyed Owner UID + unique request UUID and exact payload, new protected `jb_b8_g1_owner_create_case_idempotent` RPC. Original source unchanged. Fresh Owner/AAL2 verified on every replay before looking up old results; mismatched payload rejects; same transaction stores case+ledger; per-request PG advisory xact lock prevents concurrent duplicate; no public ledger read.
- Earlier real PG17 6-case fixed-component run **40640041648 SUCCESS**. NEW run **40642901985** (job **122664938883**) **SUCCESS**: all 6 proposed minimum-fix source/negative checks plus **two actual real PostgreSQL17 concurrency assertions PASS**, using **8 separate parallel sessions sharing the same Owner+UUID** that all returned **one exact ID and one case**, and a distinct valid Owner with same UUID that got a **different case**; replay of Owner A remained stable. No fake VM/stub.
- Original old test CI **40639713658 FAIL** was a **test harness temp-table SELECT permission under `SET ROLE authenticated`**, corrected by granting only test-local SELECT; corrected original run **40641234256 SUCCESS**. Original retry P2 is real and is NOT fixed by changing the harness.

### Live Supabase release status (READ-ONLY verified 2026-10-28)
On the *existing actual JANTA BOL Supabase* `vrffsnkycvjithwtiylt`, `public.b8_cases` exists, **old non-idempotent Owner RPC EXISTS**, **new protected idempotent RPC NOT deployed**, **new ledger table NOT deployed**. There are **31 draft and 1 published** existing article. This is a real optional **B8 case-create activation blocker** if Founder uses grievance/accountability case creation with uncertain retries. It does not imply ISRO publishing/public reading is broken; core Article code retained. No live SQL was modified.

**T072 Master result:** Partial-write, failure-recovery and protected private denial PASS isolated; proposal plus concurrent 8-way replay PASS isolated; **actual client durable request key across Android refresh/tab/timeout/device and hosted RPC migration NOT tested**, so **T072 FINAL PASS+LOCK=HOLD**. Manual Founder action for this work **NONE** unless later authorizing high-risk live migration and mobile integration.

## T073 NEW real original-source corruption and restore (not a simulated response)

**GitHub run `40643194778`, job `122665886470`, SUCCESS**. Workflow `.github/workflows/b11-t073-pg17-real-data-corruption-restore-preflight.yml`:
1. SHA-pinned *actual original B8 case Owner/AAL2 source* and actual C1 Preview web-source identity; no user credentials or production privileges.
2. Created genuine committed test case by protected original B8 Owner RPC, verified synthetic published Article and requested Ad identity.
3. Created **actual PostgreSQL17 `pg_dump -Fc` archive** and verified its contents; this is a disposable local backup, not an independent commercial offsite backup.
4. Committed a real *corrupt change* to the original case title after backup; independently verified record wrong in live disposable test DB.
5. Restored prior snapshot into separate PostgreSQL17 DB using actual **`pg_restore`** and verified **same permanent case UUID, original title, source Article ID/status, original Ad ID/status**, and **NO corrupted title** in restore.
6. Confirmed restored B8 case table **RLS ON**, `anon/authenticated` have no raw table SELECT, and restored original Owner RPC **denies writes without live current session/AAL2**.
7. Actual real Supabase, credentials, media, Vercel rollback and real offsite storage **NOT touched/tested**. Restore to a separate test DB is not an operational production recovery or proof of no acknowledged post-snapshot loss.

First T073 exploratory GitHub run **40643107770 failed YAML registration** due to heredoc indentation. Corrected and reran; final run SUCCESS. No destructive external tests, no hard Delete, no source rewrite.

**T073 Master result:** Real isolated data corruption/backup/identity/RLS restored **PASS SCOPED**; true accidental delete, LIVE provider credentials, real Auth/Storage migration, Vercel production rollback, independent offsite backup, security incident containment **DUE**. **T073 FINAL PASS+LOCK=HOLD**.

## Exact B11 remaining route
- T069/070 earlier proof remains partial for real full-system restore; no false final PASS.
- T071: C1 real News Founder-to-Incognito PASS, scoped 13/13 actual original source failures in ONE runner `40638596053`, independent C4/C5 logs `40638908792` SUCCESS, **real connected provider E8/HOSTED final HOLD**.
- T072: P2 found; additive fix + real concurrent 8-way server proof PASS scoped; **live endpoint/client migration pending, final HOLD**.
- T073: actual real isolated pg_dump/corrupt/restore + RLS PASS scoped; **real operational rollback and cred rotation HOLD**.
- **NEXT: T074** original post-restore functional/security/media/offsite/Founder device loss preflight. Only real permitted read/isolated tests; don't fake offsite independence.
- **T075** Topic10 Final Lock not accepted, and Topic11 Production/Soft Launch not yet deployed.
- No Git Main merge, no Vercel Production, no production Supabase writes, no Cricket/Saarthi changes. Preserve previously published ISRO Article unchanged.

## Original links
- Genuine T072 8-way race/fix: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40642901985
- Genuine T073 PG17 restore: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40643194778
- Original P2 repro: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40639793428
