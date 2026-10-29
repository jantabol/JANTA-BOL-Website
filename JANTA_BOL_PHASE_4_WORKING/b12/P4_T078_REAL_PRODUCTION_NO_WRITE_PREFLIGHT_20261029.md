# JANTA BOL — P4-B12 / T078 real production preflight (no-write)
Date: 29 October 2026, IST | RUN-11 | Master Sections 677–685
Scope: **Production DB Migration + Secret Protection** | Required E1 + E2 + E7 + E8

## Decision
**T078 = IN_PROGRESS; read-only production preflight performed; FINAL PASS+LOCK = HOLD.**
This document is a bounded factual checkpoint, not authorization to run a production migration, revoke a key, disable a cron job, deploy anything, or perform a destructive restoration.
No T077 work is included. No DB/Storage/Edge/DNS/secret/production action was undertaken for this checkpoint. Only project `vrffsnkycvjithwtiylt` was examined, never Cricket.

## E1 — actual production database migration/lineage inventory, scoped PASS
Read-only Supabase connector calls on the LIVE JANTA BOL Postgres 17 database:
- **188** migration history records; latest **20261027171751** `t071_c1_scoped_public_published_articles_read_20261027`.
- Exact existing source `ci/phase4/b12/t078-production-catalog-readonly.sql` executed against LIVE: **100/100** public base tables have RLS enabled; **0** RLS-off public base tables; **219** public functions; **74** public policies; all 7 checked module tables present.
- Existing proposed `public.jb_b8_g1_owner_create_case_idempotent(uuid,text,text,text)`: **NOT DEPLOYED** (B11/T072 production duplicate-risk P2 remains OPEN).
- Production article snapshot (read-only): 34 articles, 919 protected article versions, 1,629 audit logs, 18 verification records, 7 ads campaigns, 6 grievances, 16 live sessions; source data neither modified nor claimed restored. These are point-in-time counts, not an externally certified backup.
- No new T078 DDL or controlled migration was justified, approved, or run. An empty source-to-database delta has NOT been proved for every historical migration; do not infer whole-schema parity merely from 188 version names.

## E2 — production security visibility, scoped PASS with warnings retained
- Actual `BEGIN TRANSACTION READ ONLY; SET LOCAL ROLE anon` on Storage proved **0** rows visible from `grievance-private` and `private-editorial` buckets, while authoritative inventory still contains 2 grievance-private + 1 private-editorial objects (and 2 public-media objects). No object bytes, tokens or private user data inspected.
- Read-only SQL catalog checked 11 selected sensitive objects. Anon direct SELECT privileges were **false** on private Articles, Article Versions, Audit, Owner, Grievance, LIVE Operations, B8 Cases, Ads Payments, B9 internal taxonomy. **No** anon-readable public views were found in the sampled catalog query.
- Supabase Security Advisor remains NOT ALL CLEAR: **43** RLS enabled / no policy INFO (can be deliberate deny-all); **23** anon-executable SECURITY DEFINER WARN; **118** authenticated-executable SECURITY DEFINER WARN; **1** leaked-password-protection WARN. These findings must be assessed individually; do not blanket revoke public RPCs or weaken previous protected contracts.
- Actual public projection RPC and protected Source/Auth workflows belong to prior T077/B10; this checkpoint does NOT claim all callable SECURITY DEFINER routines independently abuse-tested.

## E7 — protected source and secret handling, scoped PASS / hosted incomplete
- Source baseline: integrated draft PR #67 head **1f42c78a8af4215177a5158d6cf75af958229bbd**. GitHub Actions **40869372490** completed SUCCESS on that exact source and included pre-existing protected B0–B10 and Phase3 PG17/static regressions, the T064 tracked runtime/Edge/workflow secret test, and ZIP inventory test. Skipped optional work must not be counted as run.
- Vercel project `shubham-pichhore-2028` env metadata: `JB_PUBLIC_SUPABASE_KEY` targets production only; `JB_PUBLIC_SUPABASE_URL` targets preview + production. **NO ENV VALUES were read.** A public URL shared by preview does NOT establish an independently isolated preview backend.
- Remote repository path inventory at the T077 production source (SHA `c1a5f106...`) had no tracked `.env`, private key PEM/P12/PFX, or PGPASS filename paths; this is only a bounded path check. The production publishable key is public config, not a service-role secret.
- This T078 PR contains only test/register/report/workflow files; protected website runtime, database migrations, original backup scripts, Main, GoDaddy, production Vercel and original Founder-only contracts remain unchanged.

## E8 — actual representative restore proof, but final recovery gate remains HOLD
- Independent read-only GitHub jobs check: Founder original T070 same-run restore workflow **40452402698**, job **122017925138**, concluded **SUCCESS** on 27 Oct; independently retrieved actual job log contains `T070_REAL_JOINT_OFFLINE_PG17_DB_AND_FIVE_ORIGINAL_STORAGE_BYTES` proof marker and explicit `T070_FINAL_INDEPENDENT_E8` / `T070_FINAL_LOCK` markers.
- This is significant **representative original DB + five original media file isolated restore evidence**, not merely synthetic fixture. Separate original DB **40223103797** and media **40274621191** also completed SUCCESS, but have different source capture times.
- Full Auth GoTrue + Edge secrets/functions/cron + Vercel config/runtime as one trusted recoverable point; tested rollback without overwriting newer live records; independent end-to-end final E8; verified current automatic encrypted offsite backup with approved age/retention: **NOT PROVED**.
- T070/T075 FULL E8/HOSTED recovery remain HOLD. Thus T078's mandatory E8 is **PARTIAL**, not PASS.

## Safe release stop
1. **NO automatic production migration:** B11 E8/full rollback, existing writer/cron quiescence, protected Founder approval, exact migration file/hash/dependencies, forward + rollback on independent clone, and post-migration data+RLS compare must all be evidenced before any future DDL.
2. **NO blanket secret rotation, grants, policy edits or cloud billing** from an advisory warning. Review each intended public RPC and the preview shared-backend risk separately; do not disturb current Founder logins.
3. **T078 FINAL LOCK = HOLD**. E1/E2 read-only snapshot PASS_SCOPED, E7 existing protected source checks PASS_SCOPED, E8 representative restore PASS_SCOPED / full production recovery HOLD. A green no-write CI run proves controls and the stop gate, not that a migration or full restore occurred.

## Evidence sources
- Master execution pack: P4-T078, Sections 677–685, E1+E2+E7+E8.
- Source `ci/phase4/b12/t078-production-catalog-readonly.sql` and `b12-release-truth.json` on isolated PR #67.
- GitHub original real T070 recovery run: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40452402698
- Integrated protected source CI: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40869372490
- Existing cross-checked report `JANTA_BOL_PHASE_4_WORKING/review/P4_B11_T070_REAL_JOINT_RESTORE_RECONCILIATION_AND_T075_E3_ACTUAL_BACKUP_HISTORY_20261028.md`.


## 29 October, 17:56 IST — independent no-manual E8 dependency closure audit
Real connected JANTA BOL production catalog and cloud metadata were rechecked read-only (not inferred from original documentation):

- PostgreSQL `cron.job` has **three ACTIVE jobs**, ID 3 every **5 seconds**, ID 4 every minute, ID 5 hourly. These must be treated as real concurrent writers or potential side-effect paths until independently proven otherwise. Disabling them or claiming an atomic snapshot without a reversible, audited write fence would be unsafe.
- All **13 JANTA BOL Supabase Edge Functions** are currently marked ACTIVE. Identity/name/version metadata were inventoried but Edge env secrets, runtime GoTrue sessions, scheduler replay, Auth MFA and Vercel deployment configuration were **NOT restored together into a detached working site**.
- LIVE JANTA BOL Supabase migration ledger still **188** records, last `20261027171751`. Repeated read-only counts are unchanged within this observation: **34** Articles, **919** Article Versions, **1629** Audit Logs, **6** Grievances and **16** Live Sessions. This is **not a checksum of full record contents**.
- Current canonical Vercel project production deployment `dpl_HkNqrQGGPsuRXSNk2BahwYnUj9Ms` is READY, with custom domains attached and SSO for preview/other deployment URLs. Observing an existing healthy runtime is **not proof it can be rebuilt or rolled back after total loss**.
- There is no verified cost-free independently isolated full-stack target with a restored original GoTrue/Auth session state, 13 Edge functions and their operational secrets, cron behavior and Vercel configuration at the SAME trusted recoverable point. Existing protected Founder manual original T070 backup/restore did not assert these.
- No touch to remote live DB, active cron, production deploy/aliases, key rotation, B2 object retention, GoDaddy, or original release workflows. No Android manual step was needed for this **read-only assessment**.

### Exact final-lock decision (not a generic CI hold)
A production-impacting T078 migration/restore cannot be honestly completed **only by repeating no-write tests**. Mandatory E8 requires safe, detached full-platform recovery and observed rollback that preserves newer records. Any future full-stack test must first establish: (1) exact same-trusted-point backup identity and proof; (2) isolated recovery host/database without an unapproved paid plan; (3) recoverable Auth/Edge/cron/Vercel configuration under protected secret policy; (4) safe write-quiescence/rollback for active 5-second cron and users; (5) independently witnessed target-side data, RLS, app and Founder AAL2 smoke; (6) independent verification before release. **No automatic migration, backup, cron disable, key/export, or deploy is authorized by an offline CI success.**

**Scope closed today:** every accessible, safe, no-manual preflight and protected code gate. **Official P4-T078 final remains HOLD**, because (3)–(5) have not been performed. The Founder has not been asked for an Android step, and no one may silently mark missing evidence PASS.
