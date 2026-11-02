# JANTA BOL — B13 / P4-T088 — Production, Backup/Recovery, Android & Operational Readiness

**Start:** 2026-11-02 IST. **Original master**: Phase-4 Final Test Blueprint, Topic 12 RUN-15, sections **784–792**. Class: **MANUAL / PRODUCTION + RECOVERY**. **Required original evidence: E1 + E3 + E6 + E8**; Phase-3 protection: **baseline CI + original core functional/security regression**.

## Founder checkpoint
Founder has asked to **LOCK completed T087 work and START next test immediately**. T087's executed source/PG17/connected DB/Reporter UI evidence is already **SCOPED PASS+LOCK** in PR #111; it **does not meet original full T087 E2 hosted-signed HTTP + complete E5**, which remains outstanding and must **block final release**. Do not repeatedly demand T087 login/Share/Article/Incognito proof. No blanket original T087 final PASS claim.

**T088 status**: IN PROGRESS — read-only preflight / E1 initially NOT RUN. Absolutely **not** T088 Final PASS, not B13 Final, not Production change authorization. This branch is stacked on T087 candidate SHA `48260e31e8e69dc12d6905c5765b0341f3538192`, NOT main. PR #111 was DRAFT and unmerged when starting.

## Original T088 acceptance
> Verify backup health, real restore **where executable**, failure isolation, production domain/HTTPS/Auth/API/DB, real multi-device publishing lifecycle, Android newsroom workflow and Founder-time. Backup must actually be usable; unavailable restore/provider **cannot be fake PASS**. Production works end-to-end; Android-first; routine mechanical work automated while Founder reserves authority/exception work.

### Evidence matrix — do not substitute one class for another

| Gate | Required original evidence | Available baseline | Genuine DUE / stop |
| --- | --- | --- | --- |
| T088-E1 | Protected old Phase3/Core/Security + B11 fault/recovery + B12 production source CI | T087 prior exact SHA CI `41439426740` SUCCESS, historical baseline only; new T088 CI must run on **exact T088 HEAD** | New exact-head CI NOT RUN at start |
| T088-E3 | Real Android Phone + Tablet publishing workflow, Founder authority preserved | Earlier T080/T083 and T086 separate real-screen evidence reported; Reporter B8 UI login/recheck observed; **do not call this new T088 multi-device test** | Real T088 dual-device lifecycle/role isolation evidence needed if not already independently linked |
| T088-E6 | Production HTTPS, real API/DB and genuinely connected external provider/integration | Domain `jantabol.in` previously reported open, B12/T076 protected check exists | Actual current HTTPS non-mutating smoke, authenticated production API and external provider readiness; real Live/encoder DUE if unconfigured |
| T088-E8 | **Real usable DB + private media restore**, full reconciliation, independent recipient/access, RPO/RTO/failure isolation | Existing B11 T069/T070 manual/read-only workflows and isolated PG17 tests; previous B11 real joint restore **NOT_RUN** | Real restore cannot be marked PASS from a workflow file, artifact list or isolated synthetic DB |

### No fake release guard / hold transfer
- T087 signed hosted Owner/Reporter/revoked-bearer E2 **DUE**; complete 13-family lifecycle E5 **DUE** — keep them visible in T088 readiness as **upstream release blockers**, not reclassification or transfer of T087 test ownership.
- T087 review-only `b13_t087_user_roles_revoked_session_REVIEW_ONLY.sql` has disposable RED/GREEN PASS; **production policies NOT modified**. Require separately reviewed approved rollout+real hosted proof before any full-security approval.
- No real provider streaming, external notification delivery, paid system, private backup restore, release merge or domain DNS change is authorized by this preflight.
- Production Article, Admin, Ads, Founder MFA, Public view, permanent URL, audit/retention, backups, and Cricket isolate unchanged.
- Founder Android step: NONE at **source/CI preflight**. When a true T088 E3 step is necessary, request a **single distinct action/device/expected/proof**, not previous tests.

## Work started here
1. Add **fail-hard T088 source/contract gate** matching original 784–792 E1/E3/E6/E8 and ensuring upstream T087 real gaps remain documented.
2. Run historical protected functional/security B11/T070–T071, B12/T080–T083, B13/T086 and T087 modules without modifying original sources.
3. Read-only public Production HTTPS smoke on `jantabol.in`, **not** authenticated real API/restore claim.
4. Report exact-head successful/failed CI + actual remaining manual E3/E8+external E6. Do not PASS+LOCK until required evidence is present.

**Original T088 Final PASS+LOCK = HOLD until E1 + E3 + E6 + E8 are genuinely supported.**


## Actual T088 E8 + E6 production evidence reconciliation — 2026-11-02 read-only

### Historical real MANUAL backup and restore history — **actual job logs**, not just workflow syntax

1. **T034** GitHub Actions manual run [`40223103797`](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40223103797), **2026-10-25**, completed SUCCESS. Read its original `dual-recipient-restore` job log (job `121258741884`): AGE encrypted B2 upload=true, real offline PostgreSQL17 restore=true, 26 source→clone metrics exact match, 16 security metrics exact match. At that checkpoint **Article rows=32**, Auth users=5, Storage metadata=5. Explicit log `STORAGE_FILE_BYTES_RESTORED=false; PLATFORM_SETTINGS_RESTORED=false`: **DB-only T034 did not restore original private media or all platform settings.**
2. **T069** manual run [`40274621191`](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40274621191), **2026-10-26**, SUCCESS. Real `original_media_only` job `121414622988` log: B2 encrypted original-media ciphertext readback PASS; **5 original private/public media bytes independently offline restored**. DB/Platform restore explicitly FALSE. This demonstrates media bytes in a standalone recovery, not synchronized DB+media.
3. **T070** manual run [`40452402698`](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40452402698), **2026-10-27**, **GitHub job `founder_only_joint_restore` truly SUCCESS** (job `122017925138`, not SKIPPED). Its logs explicitly show `T070_REAL_JOINT_OFFLINE_PG17_DB_AND_FIVE_ORIGINAL_STORAGE_BYTES=PASS`, source DB shared MVCC snapshot + five original Storage UUIDs and metadata `EXACT_MATCH`; `T034_SOURCE_TO_CLONE_26_METRICS=EXACT_MATCH`; `T034_SOURCE_TO_CLONE_16_DEEP_SECURITY_METRICS=EXACT_MATCH`; real PG17 restore=true. Representative Article PURL, grievance, Live, Ads and Auth identity matching PASS. Logs also explicitly state `T070_DB_STORAGE_UNIVERSAL_ATOMIC_FREEZE_PROVEN=false`, `T070_AUTH_EDGE_VERCEL_RUNTIME_REBUILT=false`, `T070_FINAL_INDEPENDENT_E8=NOT_RUN`, `T070_FINAL_LOCK=HOLD`. A **real joint representative offline restore did happen**, but **the independently signed-off full recoverability / E8 gate was NOT completed**. Do not describe T070 as "not run" wholesale; that would discard real successful evidence, and do not mislabel final E8 PASS.
4. The latest actual Founder/manual T070 main run found by GitHub main/run-history search is **2026-10-27**. No newer original T070/T069/T034 Founder/manual main-run in the queried 21 workflow-dispatch histories through 2026-11-02. Fresh current backup + independent final E8 and documented RPO/RTO remain DUE; **successful older runs cannot establish current restore freshness**.

### Read-only Production DB now differs from October restore

Connected JANTA BOL Supabase production `vrffsnkycvjithwtiylt` queried on **2026-11-02 12:00:54 UTC** (**SELECT only, no DDL/DML**):
- Current `public.articles=34` (of which published=2), `article_versions=920`, `audit_logs=1635`, `grievances=6`, `live_sessions=16`, `auth.users=5`, `storage.objects=5`, `ad_campaigns=7`. Last Article change and snapshot: **2026-10-31**.
- October 27 T070 job log showed Article rows=32, Auth users=5, Storage metadata=5 at its snapshot. Comparing the two **confirms the old T070 backup is point-in-time and does NOT include at least the two subsequently created article records**. This does **not** mean the historic backup is corrupt or unusable; it means T088 **current recoverability/RPO freshness is not established** without a newer verified backup/restore. Do not infer any Article bytes were lost in production.
- No private Article text, keys, secrets or PII were extracted for this check.

### Authenticated Vercel production identity — **actual live domain alias lookup**

Connected Vercel linked **JANTA-BOL-Website** project `shubham-pichhore-2028`, **Hobby plan** (no paid upgrades). The current verified `jantabol.in` alias resolves to Vercel deployment **`dpl_6XpfdMa7gCF5SDXd7EKHZfbpLfeF`**, `READY` and `target=production` with GitHub SHA **`93df12aa8ffdfae38d9a4066b6a4556bb36969e5`**, from branch `codex/t080-admin-ack-failclosed-review-20261031` (created Oct 31). `www.jantabol.in` is verified with 308 redirect to apex. Latest T088 GitHub candidate (PR #112) and T087 Draft (#111) are **not this deployed SHA**. No unintended claim that their security fix is live, or that production has been rebuilt from latest GitHub branch.
- Actual external no-auth public `https://jantabol.in/` GET/TLS/brand smoke passed in T088 GitHub Action **#41440663696** (all 4 required E1/source+PG17/public HTTPS jobs SUCCESS at SHA `5807f1f8bdd0a5f65064882dab723855e39051c4`). The optional ZIP-selector skipped. This proves only **public site domain/HTTPS E6 subset**, **NOT private API/provider/Auth E6**.

### Genuine T088 gate (no fake pass)

`T088_E1_CI=PASS_SCOPED`; `T088_E6_PUBLIC_DOMAIN_TLS_AND_PROD_ALIAS=PASS_SCOPED`; `T088_E8_HISTORICAL_PG17_AND_FIVE_ORIGINAL_MEDIA_OFFLINE_JOINT_RESTORE=PASS_SCOPED_AT_2026_10_27`; `T088_E8_CURRENT_FRESHNESS_AND_INDEPENDENT_FINAL=HOLD`; `T088_E3_REAL_CURRENT_DUAL_DEVICE_LIFECYCLE=DUE`; `T088_E6_AUTHENTICATED_API_AND_EXTERNAL_PROVIDER=DUE`; `T088_ORIGINAL_FINAL_PASS_LOCK=HOLD`.

**No fresh backup automatically triggered, no production policy/source/DNS/deployment changed, no session/token accessed, no CRM/Ads/news content mutation.** This is a factual read-only reconciliation; Founder manual step NONE at this backend checkpoint.


### Real hosted Supabase anonymous published-only REST GET — source-protected E6 subset, 2026-11-02

- **Exact candidate GitHub CI `#41441825127`, source SHA `391afb1d936768723197368eaa6562e62c19d112`, COMPLETED/SUCCESS** with **five** required jobs SUCCESS: original T088 E1/legacy, live `jantabol.in` HTTP GET/TLS, genuine hosted Supabase anonymous C1 RPC GET, protected Phase3/Auth G0, isolated PG17 G1. Optional full Master ZIP selector SKIPPED, not represented as tested.
- New source `ci/phase4/b13-t088-prod-anon-rpc-readonly.mjs` runs via Actions with **only public client publishable key already shipped in canonical frontend** (not password, service_role or authenticated JWT). Validates canonical configured `https://vrffsnkycvjithwtiylt.supabase.co`, **actual HTTPS GET** of stable `public.jb_c1_public_articles(p_limit=5)` over Supabase PostgREST; requires HTTP 200, JSON, strict `status=published`, UUID/slug shape; outputs counts only. Logged **`T088_REAL_HOSTED_ANON_PUBLIC_NEWS_RPC_GET_TLS=PASS_SCOPED`**, **`T088_PRODUCTION_PUBLIC_PUBLISHED_ROWS_SAMPLED=2`**, **`T088_PRODUCTION_NEWS_OR_DB_MUTATION=NONE`**. This is genuine hosted anonymous Public API+DB connectivity, not just static code.
- **Not** a real authenticated Owner/Reporter signed HTTP private/IDOR, provider streaming, E6 payment/messaging verification, or E8 restore. The public RPC is STABLE and is read-only by database definition; no Auth state or Article was written.
- **`T088_E6_PUBLIC_HTTPS_AND_PUBLIC_ANON_RPC=PASS_SCOPED`**; `T088_E6_AUTHENTICATED_API_PROVIDER=DUE`, `T088_E8_FRESH_INDEPENDENT_FULL_RECOVERY=DUE`, `T088_E3_CURRENT_DUAL_DEVICE_FULL_COMMISSIONING=DUE`. Original final lock remains HOLD.


## T088 E8 — NEW Founder real joint recovery proof, 2026-11-02 17:52–18:01 IST — verified from current exact main-run logs

**Source:** Founder-supplied Android GitHub Actions screenshot at ~18:01 IST and independently decoded GitHub run/job log, NOT an inferred PR status. Actual manual main **run [#41444146576](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/41444146576)**, named `JANTA BOL P4 T070 Real Representative Joint DB and Original Media (Founder manual only)`, `workflow_dispatch`, `main` HEAD **`f447231c0677644ca5a44cc19f12cf0314ff38ea`**, created **12:22:20 UTC (17:52:20 IST)**; completed SUCCESS **12:31:04 UTC (18:01:04 IST)**. Job `founder_only_joint_restore` ID **125272978687**, total run 8m44s and single job SUCCESS. Environment `janta-bol-production-backup` approval is shown in screenshot. Screenshot green does NOT prove original E8 alone; true log markers below do.

### Verified successful **real fresh** components
- Original protected manual authorization and safety preflight = **PASS**. Protected B2/AGE credentials were consumed inside a GitHub secret-backed runner, **NOT read or printed here**.
- Same-run live **source DB MVCC snapshot + five original private/public Storage object IDs / metadata** bound, `T070_REAL_SOURCE_DB_SNAPSHOT_FIVE_ORIGINAL_STORAGE_METADATA_BOUND=PASS`.
- `T070_FRESH_PG_POST_MEDIA_25_IDENTITY_FAMILIES=STABLE` and `T070_FRESH_READ_ONLY_PG_POST_MEDIA_ID_TIMESTAMP_PARITY=PASS`.
- `OFFSITE_ENCRYPTED_BACKUP_UPLOADED=true` to original B2 offsite, `T034_ACTUAL_REMOTE_AGE_DECRYPT=PASS` in authorized runner (**Owner private AGE key NOT used**), proven ciphertext SHA256 prefix `887779dbd45d279c` (full recorded in original GitHub log; don't reproduce hidden keys, paths or sensitive values).
- Disposable PG17 **real fresh DB restore** `T034_FULL_PG17_DATABASE_RESTORED=true`, `T034_SOURCE_TO_CLONE_26_METRICS=EXACT_MATCH`, `T034_SOURCE_TO_CLONE_16_DEEP_SECURITY_METRICS=EXACT_MATCH`, ACL/owner/locale and anonymous-role/payment-denial source/clone checks PASS.
- **`T070_REAL_JOINT_OFFLINE_PG17_DB_AND_FIVE_ORIGINAL_STORAGE_BYTES=PASS`** with `T070_RESTORED_PG17_AND_ORIGINAL_FIVE_FILE_UUIDS_METADATA=EXACT_MATCH` and Article PURL/Grievance/Live/Ads/Auth representative identity checks EXACT_MATCH.
- The **new restored snapshot contains 34 Articles** (plus 7 Ad campaigns, 5 Auth users, 5 Storage metadata rows), rather than historical Oct27 32. Direct **connected LIVE production read-only SQL at 2026-11-02 12:32:29 UTC** confirms **34 Articles**, **920 Article versions**, **1635 Audit logs**, **5 Storage objects**, 5 Auth users, 6 Grievances, 16 Live sessions, 7 Ad campaigns. This **closes the earlier specific Oct27-vs-Nov2 article-count freshness gap as of this new captured checkpoint**. It does **not guarantee a recurring schedule, RPO <= any Founder-approved threshold, or future changes after snapshot**.

### Mandatory limitations printed by SAME successful run (do not conceal)
- `T070_DB_STORAGE_UNIVERSAL_ATOMIC_FREEZE_PROVEN=false`; Postgres MVCC + five-media joint proof is representative, **not universal atomic freeze across every independent subsystem**.
- `T070_ACTUAL_GO_TRUE_EDGE_VERCEL_CONFIG_RUNTIME=NOT_RESTORED` and `T070_AUTH_EDGE_VERCEL_RUNTIME_REBUILT=false`; not a complete live service rebuild.
- `T070_RESTORED_REAL_AD_PAYMENT_SAMPLE_PRESENT=false` — no real payment historical specimen tested.
- `T070_FINAL_INDEPENDENT_E8=NOT_RUN`; `T070_FINAL_LOCK=HOLD` — original workflow explicitly says **final independent complete full-platform E8 remains due**, despite successful real joint components.
- The earlier `STORAGE_FILE_BYTES_RESTORED=false` line belongs to the standalone **T034 DB-only stage**; the later T070 joint final line confirms **actual five media bytes restored**, not contradiction.

### New T088 gate change
`T088_E8_NEW_20261102_PRODUCTION_CURRENT_OFFSITE_ENCRYPTED_JOINT_DB_PLUS_5_ORIGINAL_MEDIA_RESTORE=PASS_SCOPED_REAL`; `T088_E8_OLD_ARTICLE_COUNT_FRESHNESS_DELTA=CLOSED_AT_NEW_CHECKPOINT`. **Still** `T088_E8_INDEPENDENT_FULL_GO_TRUE_EDGE_VERCEL_RESTORE=NOT_RUN`; `T088_E8_RECURRING_RPO_RTO_PROOF=DUE`, `T088_E3_CURRENT_TWO_DEVICE_FULL_LIFECYCLE=DUE`, `T088_E6_SIGNED_AUTH_AND_PROVIDER=DUE`, `T088_ORIGINAL_FINAL_PASS_LOCK=HOLD`. T087 old full signed-hosted E2/lifecycle E5 remain tracked separately.

**No second manual backup required in the current turn. No new data written to live news/auth/ads/DB by this assistant**; the Founder explicitly executed the reviewed `main` manual backup job. It did write its intended encrypted offsite snapshot to original B2. No paid upgrade, new domain deployment, policy migration, destructive restore or new editor content. Preserve the previous genuine restore results and all previously locked tests.
