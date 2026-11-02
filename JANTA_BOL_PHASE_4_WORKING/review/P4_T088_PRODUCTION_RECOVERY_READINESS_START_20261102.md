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
