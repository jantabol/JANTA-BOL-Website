# JANTA BOL — Phase 4 / B11 / P4-T070
## G19 independently cross-checked backend recovery checkpoint — 27 October 2026 (IST)

**Source of truth:** original Phase-4 Master Execution Pack, Topic 10 / RUN-10 / RECOV-012–018, requiring *real restore, preserved identities, representative Article/Grievance/LIVE/Ads/Auth/permissions/config, and E1+E2+E4+E5+E8 proof*. This report is an independent *bounded* backend audit; it is **not** the E8 completion certificate.

**GitHub immutable run:** https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40452402698 — Run #3 / job 122017925138, actor `jantabol`, first `workflow_dispatch` attempt on protected main SHA `f447231c0677644ca5a44cc19f12cf0314ff38ea`, environment approved by Founder; GitHub outcome `success`, end 2026-10-27 05:09:29 UTC, 13m58s total. All six primary execution steps concluded SUCCESS. Audit independently read actual Actions logs rather than taking the green icon as final acceptance.

### 1. VERIFIED REAL DRILL — bounded data-plane restore = PASS

| Evidence in actual Run #3 job logs | Result |
|---|---|
| Founder-only protected manual workflow + exact main SHA | PASS |
| T070_SAFETY_PREFLIGHT | PASS |
| Same exported PG MVCC point for raw dump, Storage ID snapshot and representative identities | CONFIRMED for database snapshot scope |
| T070_FRESH_PG_POST_MEDIA_25_IDENTITY_FAMILIES | STABLE within bounded source check |
| T070_REAL_SOURCE_DB_SNAPSHOT_FIVE_ORIGINAL_STORAGE_METADATA_BOUND | PASS |
| T070_FRESH_READ_ONLY_PG_POST_MEDIA_ID_TIMESTAMP_PARITY | PASS |
| T070_STORAGE_API_SUBMILLISECOND_LOSS_WITH_FRESH_PG_GUARD | true (3-digit Storage API timestamp reconciled ONLY with independently stable, exact 6-digit PG metadata) |
| Offsite encrypted JANTA BOL B2 ciphertext upload/readback and private ephemeral-recipient AGE decrypt | PASS |
| T034_FULL_PG17_DATABASE_RESTORED | true, disposable offline PG17 |
| T034_SOURCE_TO_CLONE_26_METRICS | EXACT_MATCH |
| T034_SOURCE_TO_CLONE_16_DEEP_SECURITY_METRICS | EXACT_MATCH |
| T070_RESTORED_PG17_AND_ORIGINAL_FIVE_FILE_UUIDS_METADATA | EXACT_MATCH |
| T070_REPRESENTATIVE_ARTICLE_PURL_GRIEVANCE_LIVE_ADS_AUTH_IDENTITIES | EXACT_MATCH |
| T070_REAL_JOINT_OFFLINE_PG17_DB_AND_FIVE_ORIGINAL_STORAGE_BYTES | **PASS** |

The isolated PG17 database + five genuine private/public Storage bytes were recovered from one actual encrypted B2 bundle in one run. All five includes **two grievance-private**, **one private editorial** and **two public media** originals. The legacy DB-only nested restore substep prints `STORAGE_FILE_BYTES_RESTORED=false`; that refers to the nested DB-only step, not the later successful T070 combined file verification.

Important limits: database Auth *rows/UUIDs* restored, **not** operational GoTrue login, session revocation, MFA or JWT runtime. The five original bytes were validated in an isolated filesystem, **not** a newly running Storage API service or policies endpoint. One same-run validated manifest does not prove a universal atomic write freeze.

### 2. INDEPENDENT READ-ONLY LIVE SOURCE POST-RUN AUDIT — PASS within metadata scope

Re-executed the exact 25-family `ci/phase4/b11/t070-representative-identity.sql` through the connected JANTA BOL Supabase project `vrffsnkycvjithwtiylt`, inside a `REPEATABLE READ, READ ONLY` transaction. Result **25/25 metrics present; seven relation-orphan checks all 0**. Compared *aggregate counts only* below; private row digests/IDs/paths and personal data are NOT published.

| Latest live-source relation | Aggregate |
|---|---:|
| Articles / versions / sources | 32 / 878 / 31 |
| Grievances / history / evidence | 6 / 57 / 2 |
| LIVE sessions / operations / generations | 16 / 75 / 21 |
| LIVE final reports / deletion ledger | 2 / 1 |
| Ad campaigns / payments / ad history | 7 / **0** / 29 |
| Auth users / user-role records | 5 / 4 |
| Original Storage metadata objects | 5 |
| All 7 cross-table orphan-link checks | **0** |

Additional independent metadata read: **100/100** public ordinary tables have RLS enabled; **81** public/private/Storage app policies; 3/3 expected Storage bucket definitions present; **auth.sessions=73**, **auth.mfa_factors=2**, **3 active pg_cron jobs**. This is *source inventory* only, never a functioning restored Auth/runtime check, nor proof of no transient changes between snapshots. Source still has 0 LIVE updates and 0 ad payments: no fabricated positive sample or positive production payment recovery PASS.

### 3. AUTH / EDGE / VERCEL READ-ONLY INVENTORY — OBSERVED, NOT RESTORED

- Project identity reconfirmed: **JANTA BOL**, `ACTIVE_HEALTHY`, region `ap-south-1`, PostgreSQL 17.6.1.155.
- Supabase deployed Edge inventory: **13/13 ACTIVE**, all 13 current slug/version/verify_jwt fields matched the existing G18 inventory file `ci/phase4/b11/t070-g18-live-edge-version-inventory.json`. Current flags: 8 `verify_jwt=true`, 5 `verify_jwt=false`. A false flag alone does NOT prove insecure: custom auth may apply; neither does inventory prove that authorization was independently exercised or functions restored into a disposable project.
- Previously documented associated Vercel project `prj_xNb9G3xjW35qSXEyF7o2qiCqG4HI` (`shubham-pichhore-2028`): metadata reports latest Production deployment READY (ID `dpl_nFSo2MXg3ASBPgUfXRYDzv2ybP8C`), Node 24.x. `filter_project_envs(decrypt=false)` returned 0 visible entries, hiddenProductionEnvCount=0. These are metadata results **not source-vs-recreated runtime configuration parity**, and do not establish absence of external secrets or settings.
- Supabase security advisor metadata (unchanged, not automatically edited): 43 `rls_enabled_no_policy` INFO, 22 `anon_security_definer_function_executable` WARN, 117 `authenticated_security_definer_function_executable` WARN, 1 leaked-password protection WARN. Findings are NOT confirmed exploits; no policies/RPCs modified merely to turn warnings green.

### 4. E8 FINAL ACCEPTANCE — STILL HOLD (NO FAKE PASS)

Exact honest terminal markers from the real workflow:
```text
T070_DB_STORAGE_UNIVERSAL_ATOMIC_FREEZE_PROVEN=false
T070_AUTH_EDGE_VERCEL_RUNTIME_REBUILT=false
T070_ACTUAL_GO_TRUE_EDGE_VERCEL_CONFIG_RUNTIME=NOT_RESTORED
T070_RESTORED_REAL_AD_PAYMENT_SAMPLE_PRESENT=false
T070_FINAL_INDEPENDENT_E8=NOT_RUN
T070_FINAL_LOCK=HOLD
```

| G19 requirement | Independently evidenced conclusion |
|---|---|
| Actual combined genuine DB + 5 original files + source/clone identities | **PASS (data-plane scope only)** |
| Database row and permission/ACL parity in disconnected PG17 clone | **PASS limited scope** |
| Universal bounded-write quiescence / all 20 writer families / offline queues | **NOT VERIFIED** (3 cron jobs active at current read) |
| Real isolated GoTrue/Auth/MFA/session rotation/revocation/negative-access runtime | **NOT RUN** |
| Real isolated Storage private HTTP access/RLS and all 13 Edge Functions | **NOT RUN** |
| Actual Vercel/Edge/GoTrue/config/secret *parity* after independent reconstruction | **NOT RUN** |
| Real positive production Ad payment / LIVE update record recovered | **NOT EXERCISABLE** (source counts zero; synthetic fixture distinction required) |
| B2 ciphertext independent owner-durable AGE private-key recovery of this exact bundle | **NOT VERIFIED**; ephemeral workflow recipient proven only |
| Independent complete E1/E2/E4/E5/E8, real Android restored-runtime proof, Founder final approval | **NOT RUN** |

**Security conclusion:** No production schema write, policy weakening, paid Supabase/Vercel resource creation, B2 overwrite, private key transfer, or Cricket/Saarthi access was performed in this *post-run review*. No new production restore or re-run of already successful Run #3. Security advisors are recorded, not auto-remediated.

**Decision:** G17 **REAL COMBINED OFFLINE RECOVERY = PASS/LOCK (bounded component proof)**. G18 **SOURCE PLATFORM INVENTORY = VERIFIED**. G19 **INDEPENDENT BACKEND AUDIT COMPLETE, FULL E8 NOT SATISFIED**. Whole **P4-T070 FINAL PASS + LOCK = HOLD**; **P4-T071 NOT STARTED**.

**Only remaining substantive route to Final Lock:** a security-reviewed disposable GoTrue/Storage/Edge/Vercel runtime with real negative-access tests, a provably coherent production write-barrier and recovery-point scope, independent E1/E2/E4/E5/E8 evidence plus Founder final approval. Current tools only confirm existing production metadata and the genuine offline data-plane restore; metadata cannot substitute for isolated runtime or unattended Founder security approval. Repeating Run #3 without a specific defect is unnecessary.


## 5. Independent writer-barrier source recheck (27 October 2026; *read-only*, NO production fence)

A new single `READ ONLY REPEATABLE READ` source query and SQL privileges/policy-metadata inventory verified:

| Real writer signal | Current observation | Security consequence |
|---|---:|---|
| Active production pg_cron | **3** (one executes every **5 seconds**) | No demonstrated time-bounded cron shutdown |
| Enabled non-internal public triggers | **48** | Public write routes may trigger indirect writes |
| Security-definer routines in public | **215** | Authorization needs targeted review, not automatic revocation |
| Direct table write grants for anon | **5** | All five affected tables have RLS enabled and at least one anon/public policy; table grants alone do not prove actual unauthorized access or isolation |
| Direct table write grants for authenticated | **16** | Historical 26 October preflight observed 15; difference needs non-destructive review, not an assumed breach |
| Public tables with RLS enabled | **100/100** | Protective baseline only; not a guaranteed write barrier |
| One-instant active DB writers | **0** (excluding the querying backend) | One instantaneous observation is NOT proof no scheduled or queued writes |
| Edge deployed functions | **13** (5 verify_jwt=false) | Source inventory only; custom-auth and all callback paths need runtime negative checks |

The aggregate was recorded **without table rows/PII/secrets** in `ci/phase4/b11/t070-g19-20261027-live-writer-source-observation.json`. The new G19 fail-closed security regression checks both existing 20-point G16 and 18-point G17 safety gates **still HOLD**, notwithstanding successful real Run #3. No production jobs paused, roles revoked, policies edited, backend deploys or costs incurred.

### Technical impossibility of claiming G19 complete from these tools/permissions today

The existing real Run #3 restored *data-plane* PG17 and 5 Storage file bytes in a disposable runner. This **cannot** separately reconstruct or attest operational GoTrue/MFA/refresh-session/revocation, the Storage HTTP/RLS service, 13 Edge Functions, Vercel environment configuration or signing secrets. Current project APIs offer production metadata, not a sealed copy of each managed service's confidential deployment-state and secrets, and a disposable fully reconstructed runtime plus Founder-bound access would be required for genuine negative-access behavior and E8.

There is no independently witnessed freeze of all 20 writer surfaces (including unsynced Android/reporters and the 5-second cron), and silently pausing production or modifying active grants would break strict **no old work damage** rules. Future runtime restoration, a planned reversible maintenance window and owner-durable private AGE recovery require explicit secure authorization, not automation of a production mutation from a test.

**Final adjudication unchanged:** verified G17 real DB+5-original-media PASS, G19 source writer inventory PASS LIMITED, **full G19 E8/HOSTED_AUTH_RUNTIME/HARDENED_WRITE_FENCE HOLD**, **P4-T070 FINAL PASS+LOCK HOLD**, **T071 NOT STARTED**. Never re-label no-cost static tests as full recovery.

## 6. Founder authorized **preparation stage** — real source SQL negative-access audit (read-only)

Following Founder permission to START T070's remaining security checks, **only reversible/non-mutating evidence collection** was initiated. No actual production maintenance/freeze, live authentication mutation, paid project or new isolated service was authorized by the bare START message.

Six bounded read-only SQL role checks executed on connected JANTA BOL PostgreSQL using `BEGIN TRANSACTION READ ONLY; SET LOCAL ROLE …; SELECT COUNT(*) …; ROLLBACK;` without retrieving IDs or private table rows:

| Real source DB access check | Actual observed |
|---|---|
| Anonymous `SELECT` from `public.grievances` | `SQLSTATE 42501` permission denied |
| Anonymous `SELECT` from `public.grievance_evidence` | `SQLSTATE 42501` permission denied |
| Anonymous SELECT from private `storage.objects` metadata | 0 visible rows |
| Authenticated DB role *without a signed JWT* SELECT from grievances | 0 visible rows |
| Authenticated DB role *without a signed JWT* SELECT from `user_roles` | 0 visible rows |
| Anonymous SELECT on public articles | 16 publicly visible rows |

**Results: source SQL role/privilege+RLS negative evidence = PASS for these six probes**, not the same as recovery runtime. A no-JWT `SET LOCAL ROLE authenticated` DB session is **not** an actual Supabase GoTrue user or AAL2 login. These checks do not prove restored HTTP/private Storage API controls, session invalidation, auth refresh or Edge Functions, and do not provide a global write barrier. Distinct 42501 (denied privilege) and 0 visible via RLS are deliberately not conflated.

Sanitized counts and results recorded in `ci/phase4/b11/t070-g19-live-source-role-negative-readonly-20261027.json`. Corresponding fail-closed PR-only tests assert no escalation of metadata/source SQL into E8 restored-runtime claims.

**Go/No-Go:** `T070_SOURCE_SQL_NEGATIVE_ACCESS_LIMITED=PASS` / `T070_RESTORED_AUTH_MFA_HTTP_ACCESS=NOT_RUN` / `T070_PRODUCTION_MAINTENANCE=NOT_APPLIED` / `T070_FULL_E8=HOLD` / `T071=NOT_STARTED`.

## 7. New genuine disposable Supabase GoTrue + Storage HTTP exercise (LOCAL SYNTHETIC ONLY)

**GitHub Actions CI Run:** `40466162996` (source HEAD `93afe5e8a5ea554c1d03e13376800d3373ec89c4`). This was an *actual ephemeral local Supabase stack*, not a paper oracle, yet all users/objects/keys were **fabricated local test data**, not a restored production identity/service. CI job succeeded with these real HTTP probes:

- `T070_LOCAL_SYNTHETIC_GOTRUE_HEALTH=PASS`: local GoTrue Auth responded to a health request.
- `T070_LOCAL_SYNTHETIC_AUTH_NO_USER_DENIAL=PASS`: unauthenticated user request was denied.
- `T070_LOCAL_SYNTHETIC_STORAGE_OWNER_OBJECT_BYTES=PASS`: a fabricated original byte string uploaded to a *local private bucket* was downloadable by the *local ephemeral service-role*, and bytes matched exactly.
- `T070_LOCAL_SYNTHETIC_PRIVATE_STORAGE_ANON_NEGATIVE=PASS`: local anonymous actor could not read that known-existing private object.
- `T070_LOCAL_SYNTHETIC_PRIVATE_BUCKET_PUBLIC_ENDPOINT_NEGATIVE=PASS`: public object URL did not expose its contents.

The workflow explicitly loaded **no production secrets**, contacted localhost only, pinned the prior CLI `v2.120.0`, bound Docker networking to loopback, cleaned containers/temp credentials, and uploaded no artifacts/media. New scripts: `ci/phase4/b11/t070-g19-synthetic-auth-storage-runtime.mjs` and `.github/workflows/b11-t070-g19-disposable-auth-storage-SYNTHETIC.yml`.

**Precisely what this proves:** a runnable isolated *synthetic* Auth/Storage test environment and successful real network/HTTP authorization checks under fake roles/data. **Precisely what it does not:** recovery of JANTA BOL's 5 Auth users, session rotation/revocation, AAL2/MFA, historical grievance private bytes into a running Storage API, 13 deployed Edge Functions, Vercel runtime, configuration/secrets, all-writer maintenance freeze, or E8 final acceptance. Do not transform this successful local fake rehearsal into a **real restored-production-runtime PASS**.

**Current status after this new improvement:** `T070_G19_LOCAL_SYNTHETIC_AUTH_STORAGE_HTTP=PASS` / `T070_REAL_DB_PLUS_FIVE_MEDIA_OFFLINE=PASS` (independent Run #3) / `T070_REAL_RECONSTRUCTED_FULL_PLATFORM=NOT_RUN` / `T070_FINAL_LOCK=HOLD` / `T071_NOT_STARTED`.
