# JANTA BOL P4-T070 — G17 Real Disposable PostgreSQL Write Fence and Crash Rollback Proof
**Date:** 2026-10-26 IST
**Status:** G17 **synthetic isolated DB writer-fence subgate PASS** (actual Docker/Postgres concurrent requests), source production unmodified. **Actual G17 full production write barrier is NOT PROVEN. T070 FINAL HOLD.**

## Actual independent execution
GitHub Actions: **run 40313450658**; successful Jobs `t070_g15_local_joint_synthetic` **121540053968** and `t070_identity_preflight` **121540053451**. Exact candidate SHA `fa0b4d59450f23c06c9f7a60f6639aad9a37b4c3`. Commit-message opt in `[G17-local-fence]` only; ephemeral GitHub-hosted runner, local `supabase start` stack, no secrets or real JANTA BOL data. Full actual log inspected.

**Real runtime markers in job logs:**
```
G17_LOCAL_PG_FENCE_READ_CONTINUES=PASS
G17_LOCAL_PG_BLOCKED_WRITE_TIMEOUT=PASS
G17_LOCAL_PG_EXPLICIT_ROLLBACK_REOPENS=PASS
G17_LOCAL_PG_FORCED_CONNECTION_LOSS_AUTO_ROLLBACK=PASS
G17_LOCAL_PG_CRASH_RECOVERY_WRITES_REOPEN=PASS
G17_STORAGE_WRITE_FENCE_VERIFIED=false
G17_SOURCE_CRON_5_SECOND_JOB_PAUSED=false
G17_REAL_PRODUCTION_MAINTENANCE_PERFORMED=false
G17_REAL_JOINT_DB_MEDIA_RESTORE=NOT_RUN
T070_REAL_JOINT_E8=NOT_RUN
```

### Precisely what was actually exercised
- Started a new PostgreSQL transaction on **fabricated article table**; locked that table `IN SHARE MODE` on a distinct persistent session.
- Concurrent independent `SELECT` was allowed while that table lock was held. Another independent `INSERT` failed with a 400ms bounded `lock_timeout` and left no row. This proves **only synthetic local Postgres table writer fencing**.
- Sent **explicit ROLLBACK** and verified an actual new insert/delete succeeded afterward (write permission/behavior back to original state).
- Created a second lock; forcibly terminated the held-lock backend with `pg_terminate_backend` **on the disconnected throwaway PostgreSQL only**; verified a fresh insert/delete succeeded, proving automatic transaction/lock rollback on connection failure.
- Independently verified prior G15 fake PostgreSQL dump/restore, five fabricated media file SHA/tamper detection, anon RLS denial, and local Auth health. Contract suite **95/95** PASS, plus G15 static safety **5/5** and G17 safety **5/5** PASS. These are separate from the actual runtime markers.
- The first run **40313049720 FAILED safely** due to overly strict local temporary Docker container-name validation (dot in temp project name); no live resource was modified. Corrected only the local allowlisted name regex; official rerun **40313450658 SUCCESS** with original branch/project/secret guards preserved. No concealment of failed candidate.

### What it does NOT prove
This experiment neither fences live Supabase SQL/Edge/cron (one cron runs every 5 seconds), real direct JWT-less routes, RPC DEFINER handlers, auth service or original Storage write bytes, nor coordinates a timestamped production database snapshot with its actual 5 original Storage objects and 13 Edge Functions/Vercel secret configs. `SHARE` locks are not an appropriate universal maintenance strategy: production locks could stall live writes, cause outages, and do not cover external object byte writes. **Do not transplant this synthetic SQL to Production** or run it on 100 tables. Production write-quiescence must be independently reviewed and reversible with bounded timeout, lost-update protection and offline mobile shadow safety.

## Accurate gates
- G17 candidate fail-safe writer-lock crash rollback (**Postgres local fixture only**): **REAL RUNTIME TEST PASS**.
- G17 production complete multi-service safe pause/resume: **NOT RUN**; requires independent writer-path coverage and rollback.
- G18 actual representative DB+original Storage+Auth/permissions/13 deployed Edge/Vercel restore: **NOT RUN**. Real T034 database-only and T069 media-only restores happened at different capture points.
- G19 independent real E1/E2/E4/E5/E8 + Founder Android true restored runtime: **NOT RUN**.
- Recent user phone and tablet screenshot show same Draft version 2 with green SYNCED **in Preview UI**; one draft cross-device sample only, not all hidden offline queues nor a restored-production site.
- **P4-T070 FINAL PASS + LOCK: HOLD. P4-T071 NOT STARTED.**
- PR #40 still draft, GitHub main and Cricket project untouched, no secret/value leaked, no paid cloud resource or source production change.
