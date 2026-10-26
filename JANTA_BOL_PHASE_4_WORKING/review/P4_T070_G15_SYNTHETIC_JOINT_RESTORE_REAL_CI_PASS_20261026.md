# JANTA BOL P4-T070 — G15 Real Isolated Synthetic Joint-Recovery Exercise
Date: 2026-10-26 IST. **G15 REAL LOCAL SYNTHETIC REHEARSAL: PASS.** This is explicitly NOT a production snapshot restore; T070 FINAL E8 remains HOLD and T071 has NOT begun.

## First: what has actually been exercised
Official GitHub Actions **RUN 40292914139**, branch `codex/b11-t070-real-restore-identity-preflight-20261025`, source HEAD `4e5ba3412e5a3a278a71a73e82dcf333e0de160b`:
- `t070_g15_local_joint_synthetic` **job 121471972676 SUCCESS** (actual GitHub logs inspected).
- `t070_identity_preflight` **job 121471972313 SUCCESS**. Nine previously established code/contract suites 18+4+8+4+10+5+9+6+9 = **73/73 PASS**, 0 FAIL.
- G15 new static safety tests **5/5 PASS**, 0 FAIL. **78/78 software tests PASS across both jobs**, plus the following separately observed actual runtime checks.

**Actual G15 protected-by-scope local runtime run markers:**
```text
G15_REAL_SYNTHETIC_DB_DUMP_RESTORE=PASS
G15_REAL_SYNTHETIC_ID_FK_ZERO_SOURCE_RELATIONS=PASS
G15_REAL_SYNTHETIC_ANON_RLS_NEGATIVE=PASS
G15_REAL_SYNTHETIC_FIVE_MEDIA_SHA_RESTORE=PASS
G15_REAL_SYNTHETIC_TAMPER_DETECTION=PASS
G15_LOCAL_AUTH_RUNTIME_HEALTH=PASS
G15_JANTA_BOL_PRODUCTION_DB_OR_MEDIA_RESTORED=false
G15_SINGLE_REAL_PRODUCTION_CHECKPOINT=false
G15_EDGE_VERCEL_RUNTIME_RECONSTRUCTED=false
T070_REAL_JOINT_E8=NOT_RUN
```

### Mechanics genuinely executed (all synthetic and disposable)
1. Fresh isolated **Supabase local CLI stack** booted inside a GitHub-hosted Ubuntu runner; Docker network bound to 127.0.0.1. No production secrets, Supabase project linked, or real confidential files. Cleanup `supabase stop --no-backup`, Docker network removal and temporary-file deletion at exit.
2. Created a completely **fictional 6-table PostgreSQL schema** with synthetic permanent Article ID+slug, Grievance ID/history linkage, LIVE session/update, Advertising campaign/payment IDs and enforced FKs. Positive LIVE update/payment relationships exist **in disposable fixture only**; their production tables remain **empty**.
3. Used real `pg_dump -Fc` and `pg_restore` to a **second distinct local database** on the ephemeral local PostgreSQL container. Verified source vs target permanent synthetic slug/public grievance ID and positive LIVE/payment counts and zero orphaned FK links.
4. Activated RLS and explicitly denied anon access on fixture article table. Issued a **real local `SET ROLE anon; SELECT count`** against the restored clone and observed zero rows, while administrator-parity observed the one source row. This proves a *local synthetic policy*, **not** the actual production 100-table policyset and AAL2/Auth recovery.
5. Created five **fabricated non-sensitive byte files** shaped as two private grievance, one private editorial and two public media entries. Captured tar to temporary local archive; extracted into distinct target directory; verified all five original SHA256; deliberately mutated a recovered object and confirmed checksum rejection.
6. Confirmed local Auth endpoint `/auth/v1/health` HTTP 200. **No user login, session revocation, MFA/AAL2, 13 deployed Edge Function runtime or Vercel configuration restored/tested.** This is health only.
7. Secure cleanup; no live Supabase/Backblaze read or write, no GitHub artifacts or encrypted backup created. No Cricket/Saarthi interactions. No new paid services.

## Additional source-only production preflight (2026-10-26 08:32 UTC, read-only SQL)
- JANTA BOL Supabase `vrffsnkycvjithwtiylt` active healthy.
- `pg_stat_activity`: 2 active connections, 0 idle in transaction, 0 waiting locks **at that instant only**. This is not a durable write pause.
- Supabase database has **3 active pg_cron jobs**, **48 enabled non-internal user triggers in public**, and **0 active replication slots** at observation time. These are **writer/control risks to be accounted for** before declaring a protected combined snapshot point. No cron job was disabled and no trigger altered.
- 100/100 public source tables RLS enabled; Storage objects **5** in three intended buckets (2 grievance-private, 1 private-editorial, 2 public-media).
- Original 14-rule source relationship check from earlier G11/G12: 12 nonempty consistent, two no-row unexercised. No new production rows inserted.

## G15 narrow verdict and blockers to full T070
- **G15 code + actual no-credentials runtime rehearsal: PASS.** Supabase local stack is feasible using GitHub ephemeral compute without a paid second Supabase project, and synthetic DB, 5 media, RLS and Auth health checks execute successfully.
- **T070 FULL REAL E8: HOLD.** The actual T034 database backup and actual T069 five-original-file B2 backup use **different capture points**. Their individual PASSes, plus this fake-data G15 rehearsal, do NOT establish real combined point-in-time restoration.
- A real coherent snapshot requires a **founder-reviewed, safely reversible write-quiescence mechanism** covering backend endpoints, storage object writes, 3 active cron jobs, async workers, admin/reporter sessions, offline queued edits and untrusted external actions. Uncoordinated data changes cannot simply be assumed absent from low activity counts. A new test that merely rechecks counts cannot authorize an atomic restore claim. **Do not freeze, revoke sessions or disable jobs without a scoped Founder permission and verified rollback.**
- A complete clone must restore the *real* Auth/Storage service behavior, all 13 deployed Edge versions/secret dependencies, Vercel runtime settings, original IDs, private-file access denial and original Owner/AAL2. Current repo main had no `supabase/functions/` source tree, so deployable Edge source/code inventory must be validated before full DR. No sensitive code or environment configuration should be committed blindly to public repo.
- The separate Founder real owner AGE key decrypt of original media ciphertext (G12) succeeded, but per-object local unpack SHA was not separately evidenced; the T069 job did its own genuine 5-object integrity proof.

## Preservation and next release gate
New candidate branch **only**: `ci/phase4/b11/t070-g15-local-synthetic-joint-rehearsal.sh`, `ci/phase4/b11/t070-g15-local-synthetic-joint-rehearsal.test.mjs`, plus bounded Github CI job behind `[G15-local-synthetic]` commit marker. All first-party/local tools pinned or derived from isolated official stack. No production write, Main merge, cost, B2 operations, new cloud keys or Cricket change.

**G15 = PASS in isolated synthetic scope. T070 FINAL PASS + LOCK = HOLD. T071 NOT STARTED.**
