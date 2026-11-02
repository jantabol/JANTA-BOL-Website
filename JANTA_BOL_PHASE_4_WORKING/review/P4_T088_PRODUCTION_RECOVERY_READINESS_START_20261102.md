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


## T088 additional E6 — actual hosted Edge JWT negative HTTP and E8 recoverability manifest, 2026-11-02 (read-only)

### Hosted Edge positive inventory / actual JWT-gateway denial (NOT a signed-user positive test)

Connected live Supabase project `vrffsnkycvjithwtiylt` lists **15/15 Edge Functions ACTIVE**, 10 configured with `verify_jwt=true`. Five are explicitly `verify_jwt=false`: `jb-live-worker`, `jb-youtube-oauth-callback`, `jb-encoder-handoff`, `jb-encoder-launch`, `jb-encoder-connector-lols`. This flag alone is NOT a vulnerability: some internal workers/webhooks depend on independent signed/secret validation; verify individual guard before ever invoking a no-JWT endpoint. No unguarded worker was called.

**Exact new CI [#41449878447](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/41449878447), candidate SHA `16c0fb575b708d4d255da51acef86125640a832d`: COMPLETED / SUCCESS, 6/6 required jobs SUCCESS**, including new **real production anonymous GET (no key, no bearer, no body)** to the existing `verify_jwt=true` Edge endpoints:
- `jb-live-api`: HTTP 401/403 → **DENIED**
- `jb-team-api`: HTTP 401/403 → **DENIED**
- `jb-records-api`: HTTP 401/403 → **DENIED**
- `jb-b11-t069-media-backup`: HTTP 401/403 → **DENIED**

Runner logs: `T088_LIVE_EDGE_JWT_GATEWAY_NEGATIVES=4/4`; **`T088_SIGNED_OWNER_REPORTER_POSITIVE_API=NOT_RUN`**, **`T088_EXTERNAL_ENCODER_STREAM_OR_YOUTUBE_DELIVERY=NOT_RUN`**, **`T088_EDGE_RESTORE_GO_TRUE_AND_VERCEL_RECOVERY=NOT_RUN`**. The earlier public published-only C1 PostgREST **2** items, **7/7 private table anonymous-denials**, unknown UUID empty and actual published Article permalink/UUID+slug same also remain green. Optional historical master ZIP job SKIPPED and not counted.

**Interpretation:** `E6_PUBLIC_PROD_HTTPS_POSTGREST_AND_EDGE_ANON_NEGATIVES=PASS_SCOPED`. Mere Edge function ACTIVE/JWT policy proves configuration/online gateway, NOT actual Live signal, YouTube delivery, valid Reporter/Owner signed request, external encoder or independent Edge code recovery.

### Current Vercel service identity, rollback candidates and configuration metadata (no secrets)

Connected Vercel account `shubham-pichhore-2028` Hobby / linked JANTA-BOL-Website: `jantabol.in` currently maps to production READY deployment **`dpl_6XpfdMa7gCF5SDXd7EKHZfbpLfeF`**, exact source SHA `93df12aa8ffdfae38d9a4066b6a4556bb36969e5`, branch `codex/t080-admin-ack-failclosed-review-20261031`. Read-only deployment history contains earlier `READY` production source SHA candidates `14a929180d99088e950475eeee609cae8e3f01c8`, `1ada480c51aea9fd10b0abdf0c705f990f9b1694`, `5285cacfe409a8f730b4ed1a38d6ce8186036ae3`. Historical READY does **not** prove safe rollback to these bytes, restored configuration, or authorized promotion.

Connected Vercel **non-decrypted** environment-key inventory: `JB_PUBLIC_SUPABASE_KEY` (production), `JB_PUBLIC_SUPABASE_URL` (preview+production), both encrypted metadata; **no secret values fetched**. This is an inventory observation only. No live Git alias, domain, environment variable, code, source, OAuth token, cron or protected secrets were edited.

### Strict E8 E3 release matrix after new Founder backup

- **E8 fresh real point-in-time offsite** 2026-11-02 T070 manual run `#41444146576`: PostgreSQL17 restored from AGE/B2, **34 articles** / **5 original storage bytes** + 26/16 deep security matches, all PASS. No second backup/recovery triggered.
- **E8 complete independent full-platform disaster reconstruction**: `NOT_RUN` for verified Auth GoTrue sessions/provider secrets, Edge runtime and network guards, Vercel environment/domain/SSL production identity, tenant separation, external providers, rollback cutover and Founder-independent lost-device restore. Original T070 asserts `T070_FINAL_INDEPENDENT_E8=NOT_RUN`, `T070_FINAL_LOCK=HOLD`.
- **E8 cadence/RPO/RTO**: isolated prior timings and backup point exist, but no approved measurable continuous schedule/retention/alert and demonstrated Founder-accepted complete-environment objectives; `DUE`.
- **E3 actual Phone+Tablet end-to-end authenticated cross-device publishing/Owner-Reporter handoff**: earlier Oct26 matched Draft v2 sync on two devices; Nov2 T086 article public/share/incognito and T087 Reporter account UI recheck. They are accepted as their exact historic *sub-evidence only*. **Current combined full T088 E3 = DUE**; never repeat these screenshots.
- **E6 private authenticated signed Owner-v-Reporter and actual external video/Live/YouTube**: **DUE**; public negative HTTP cannot assert valid authenticated positive or live provider playback.
- **Upstream T087**: scoped PASS+LOCK evidence preserved, original hosted signed cross-account/revoked bearer E2 + complete E5 still release-blocking.

**Official T088 final status: `IN_PROGRESS / FULL PASS+LOCK HOLD`.** No policy/News/Auth/Live/Ads/backup/production change or paid service. No Founder manual step for this read-only CI/manifest checkpoint; all unavailable real-world proofs must remain unclaimed until executed.


## T088 E6 current GoTrue + YouTube integration **configuration**, E3 historical real-device proof reconciliation

### Public GoTrue Auth actual HTTP health (not a signed-user test)
Protected GitHub Action run **[#41450647564](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/41450647564)** at source SHA `0a36cc3030efb9b96083eaa0b27493193b33d7a0`; *real* `https://vrffsnkycvjithwtiylt.supabase.co/auth/v1/health` authenticated only by public publishable key (no login, password, refresh, session or private data). Runner received **HTTP 200 JSON**, marker `T088_REAL_GOTRUE_PUBLIC_HEALTH_GET=PASS_SCOPED`. This verifies currently reachable GoTrue public health, **NOT a valid Owner/Reporter JWT, AAL2, revoked-bearer behavior or independent GoTrue recovery**. No user was logged in, sessions not modified.

### Real production YouTube connection metadata only — no credential extraction or stream
Connected Supabase SQL SELECT-only `public.youtube_integration` row, Nov 2: `provider=youtube`, `connection_state=CONNECTED`, `control_auth_state=OK`, `credential_incident_state=CLEAR`, `last_refresh_status=OK`; `last_verified_at=2026-10-29 15:26:57 UTC`, `connected_at=2026-10-29 14:05:41 UTC`. **Connected historical state as of last stored verification**, not present Google token validity or video playback proof. No OAuth refresh attempted, no provider secrets selected.
- `public.live_sessions`: 14 `ENDED/OFF`, one `READY/OFF`, one `WAITING_SIGNAL/OFF` — **16/16 public_status OFF**, and no successful real public Live broadcast evidenced by this check.
- `public.live_operations` history: 63 `SUCCEEDED`, 10 `CANCELLED_STALE`, 2 `FAILED_NEEDS_ATTENTION`; counts are historical queue operations only, not proof of real public stream.
- **`T088_E6_AUTH_HEALTH_AND_YOUTUBE_CONNECTION_METADATA=PASS_SCOPED_CONFIG_ONLY`**, `T088_E6_REAL_GOOGLE_ENCODER_STREAM_VIEWER_PLAYBACK=NOT_RUN`, `T088_E6_SIGNED_PRIVATE_OWNER_REPORTER_REQUESTS=NOT_RUN`.

### E3 prior actual Android checks — reuse without pointless repeated Founder actions
- `review/P4_T070_G17_ANDROID_PHONE_TABLET_SAMPLED_DRAFT_SYNC_20261026.md`: Founder Android Phone + Android Tablet independently displayed **same existing draft SYNCED Version 2**, visually no conflict or queued error. This is a **sample** and those screenshots used Preview-style UI; no second capture requested.
- `review/P4_T086_RUN15_EVIDENCE_GATE_20261102.md`: Nov2 Founder real Android Owner published article editor, public original PURL read, native Share sheet, and Incognito original read. Live DB versions/audit were separately matched, no new fake News publish performed.
- T087 PR #111: Nov2 Android Tablet Reporter workspace authenticated and rechecked ("सत्यापित उपयोगकर्ता: संवाददाता"). This is real Reporter **role UI positive control**, not two distinct signed HTTP/IDOR denial tests.
- **`T088_E3_PHONE_TABLET_HISTORY_SAMPLED=PASS_SCOPED_REUSED`**; **`T088_E3_NEW_CURRENT_COMPLETE_TWO_DEVICE_PUBLISHING_OWNER_REPORTER_AUDIT=NOT_RUN`**. A genuine planned/current real editorial article handoff is required to validate the full operational workflow, but should not be invented, or performed on public News without Founder editorial choice.

### No false finish / precise next safe action
At this checkpoint, there is **no missing Backend source preflight** that can legitimately replace a full independent GoTrue/Edge/Vercel environment recovery or a real Phone+Tablet publishing operation. No private JWT/session or OAuth credential will be pasted in a chat. Full T088 Final PASS+LOCK remains `HOLD` until original E3+E6+E8, with upstream T087 signed E2/complete E5 separately unresolved. Work remains safe and read-only to production; latest reported test evidence is linked to actual Actions run, no original locked product/testing source edits.


## E8 isolated actual Auth+Storage recovery investigation + Production source-of-truth blockers — 2026-11-02

### A. No-cost actual local GoTrue + signed RLS + Storage two-account recovery subtest

A new T088 branch-only guarded GitHub Actions step uses pinned official Supabase CLI **2.120.0** and loopback-bound disposable Docker network on a GitHub-hosted runner. It uses **ZERO connected production secrets, zero real private media, zero Founder credentials, zero paid hosted project** and cleans temporary local containers/keys.

**Exact candidate commit `311984ca229db1d061a20740fc8a632a0e5741aa`**, GitHub Actions **[#41454733260](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/41454733260) COMPLETED/SUCCESS**, **7/7 required jobs SUCCESS** including this new synthetic local Auth/Storage step, existing exact-head T088/B11/B12/B13 E1 security regression, G0, G1, real hosted public HTTPS/API, four JWT denial probes; optional old full B0–B8 ZIP selector **SKIPPED** and not counted.

Actual independent local log proof:
- `T088_LOCAL_REAL_FAKE_GOTRUE_SIGNIN=PASS_2_USERS`: **two newly created fake identities signed in via real local GoTrue**, returned signed local JWTs, never real account tokens.
- `T088_LOCAL_REAL_SIGNED_POSTGREST_RLS=PASS_OWNER_1_CROSS_0_ANON_0`: in actual local PostgREST one fake owner's record visible to itself, zero rows to other signed actor and anon. Not a simulated SQL `SET ROLE` substitute.
- `T088_LOCAL_REAL_STORAGE_ORIGINAL_BYTES=PASS_FAKE`, `T088_LOCAL_REAL_PRIVATE_MEDIA_USER_CROSS_DENIAL=PASS`: local private Storage uploaded FAKE bytes, owner read back exact original string; other logged-in actor and anon denied.
- `T088_LOCAL_ONLY_NO_PROD_KEYS_OR_B2=PASS`, `T088_ORIGINAL_FULL_PLATFORM_E8=HOLD`.

**Honest exclusion:** This reconstructs **an empty/fake Auth+PostgREST+Storage stack**, NOT the real November 2 production Auth users, active/revoked sessions, Founder AAL2, production encrypted media or restored GoTrue JWT secret. The earlier protected **manual main** T070 run #41444146576 **did** separately restore the genuine B2 AGE DB 34 articles and five original source media bytes; never conflate two distinct restore targets into one magically integrated production E8.

### B. The isolated fake Edge service was attempted and failed; no fake pass or endless loop

Original T088 experimental Edge boot test produced **HTTP 503** in actual CI runs **#41452614514**, **#41453356360**, and **#41453963665**, despite isolated source ordering correction. Third run's no-secret diagnostic `T088_EDGE_FAILURE_CLASS=UNCLASSIFIED`; **`T088_LOCAL_EDGE_BOOT=HOLD_503`**, not an Edge PASS. These real historical CI RED results remain visible, preserved. A **separately scoped Auth/Storage-only** gate ran GREEN at #41454733260 and explicitly prints `T088_LOCAL_EDGE_BOOT_503_FROM_3_HISTORIC_RUNS=HOLD_NOT_RETRIED`, `T088_EDGE_REAL_PRODUCTION_RESTORED=NO`. This is **not** a waiver of the original E8 requirement. No real Edge runtime or YouTube/Live function was redeployed or modified in production.

### C. Real source-of-truth disaster recovery drift found, SOURCE P1 HOLD

Connected Vercel actual `jantabol.in` READY deployment `dpl_6XpfdMa7gCF5SDXd7EKHZfbpLfeF` serves exact GitHub commit **`93df12aa8ffdfae38d9a4066b6a4556bb36969e5`** (`codex/t080-admin-ack-failclosed-review-20261031`). GitHub default `main` SHA **`f447231c0677644ca5a44cc19f12cf0314ff38ea`** lacks both `JANTA_BOL_PHASE_3C_WORKING/` and `vercel.json` (GET/tree verification); deployed commit **contains** both. Both have same root placeholder `index.html` blob; **main alone is not a complete reproducible source of the actual current production website**. Existing production is working; **do not auto-merge/promote/overwrite** to "fix" this. A protected, independently reviewed current-deployment source baseline/commit manifest and rollback proof is required before a full disaster-reconstruction pass.

Connected Supabase project currently has **15/15 deployed ACTIVE Edge functions**. Authorized read-only `list_edge_functions` + `get_edge_function` fetched all **15/15 deployed code packages, 18 nonempty source files**; code contents/secret values were **not copied to the public repo**. Canonical `CODEX_CURRENT_SUPABASE/functions` path on T088 branch includes directories for **10/15** of these live slugs, with **5/15 absent from that canonical directory** (`jb-recovery-delete-mfa`, `jb-grievance-assets`, `jb-b11-t069-media-backup`, `jb-youtube-oauth-health`, `jb-youtube-video-preflight`). This does not exclude files elsewhere, but the checked canonical folder by itself is **insufficient to restore the live set**. Live function source fetched from an existing account is **not an independently stored encrypted offsite source archive**. Need a secure versioned restore copy and private env/role mapping, never dump sensitive code/keys to public Actions log.

### D. Scope-accurate current Full Recovery (E8) verdict

| Component | Actual check | Evidence status |
| --- | --- | --- |
| Current real database, auth schema rows, original five Storage bytes | New 2026-11-02 Founder-approved real AGE+B2 offsite capture, decrypt, PG17+five-byte restore; 34 articles, 26+16 metrics | **PASS_SCOPED_REAL** |
| Founder primary AGE key separate from runner | Oct26 Founder Android owner-held key decrypted real archived B2 media ciphertext, SHA verified | **PASS_SCOPED_HISTORIC** |
| Standalone fake local GoTrue signed two-user login, owned/foreign/anon RLS, private media byte roundtrip | Current real container/HTTP in #41454733260 | **PASS_SCOPED_SYNTHETIC** |
| All 15 live deployed Edge source packages currently retrievable via connected account | 15 packages, 18 source files, versions and bundle digests | **PASS_SOURCE_INVENTORY_ONLY** |
| Isolated local fake Edge worker boot | HTTP 503 in three actual guarded tests | **HOLD_BOOT_503**, no false PASS |
| Complete production GoTrue/Edge/private env restore + verified signed real Owner AAL2/stale-role denial | Not independently reconstructed | **NOT_RUN** |
| Current served Vercel public site build from protected main and rollback/domains/secret env | main lacks deployed site subtree+vercel.json | **HOLD_SOURCE_BASELINE_P1** |
| Approved recurring full-service backup cadence, tested full-environment incident RPO/RTO | No real full cutover or independent recovery observed | **DUE** |

**Founder confirmed Multi-Device test already executed** — previous Phone+Tablet, T086 Founder publish/share/incognito and T087 Tablet Reporter screenshots are **reused**; do not repeat them.

**`P4_T088_E8_REAL_DB_MEDIA=PASS_SCOPED`; `P4_T088_E8_SYNTHETIC_AUTH_STORAGE_JWT=PASS_SCOPED`; `P4_T088_E8_PLATFORM_SOURCES=PARTIAL_WITH_P1_DRIFT`; `P4_T088_E8_LOCAL_EDGE=HOLD_503`; `P4_T088_ORIGINAL_FULL_PASS_LOCK=HOLD`.** No real private live data rehydrated into an extra hosted environment, no paid project, no News/Auth/Media/Live/Ads/DNS changes, no merge or production deployment. Next independent real full proof needs an **approved confidential isolated restoration** that includes current deployed site SHA/Edge code versioned recoverability and safe private env, not another repetitive Founder manual backup.


## T088 E8 current deployed Edge code provenance cross-check — 2026-11-02, connected source READ ONLY

**Real deployed Edge content, not repository grep only:** The connected **JANTA BOL** Supabase project `vrffsnkycvjithwtiylt` supplied its 15 ACTIVE deployed Edge Function metadata and (read-only) source via `get_edge_function`. Compared the **entire retrieved live `index.ts` text byte-for-byte** with the GitHub branch's matching canonical code file `CODEX_CURRENT_SUPABASE/functions/<slug>/index.ts` for the **10 live slugs with Git source**. All **10/10 returned exact equal source text** (not merely matching names or checking static comments). Pinned their immutable Git object SHA values in `review/P4_T088_EDGE_SOURCE_LINEAGE_MANIFEST_20261102.json`, with runtime version and JWT setting. Code and private source contents are **NOT** stored in this public manifest; no OAuth credentials or Edge env values were accessed.

The other **5/15 deployed ACTIVE slugs** (`jb-recovery-delete-mfa`, `jb-grievance-assets`, `jb-b11-t069-media-backup`, `jb-youtube-oauth-health`, `jb-youtube-video-preflight`) have **NO source path in the complete 1,039-item checked current Git tree**. The live management API can currently retrieve their code, but its returned files have **not** been independently placed in a safe encrypted/versioned offsite restore archive. One of the five, T069 backup, comprises four code files; the 15 live functions total **18** code files. An account can lose control of Management access during an outage: **retrievable now ≠ recoverable independently**.

**Fail-hard CI guard** `ci/phase4/b13-t088-edge-source-lineage-contract.test.mjs`: checks exact 15 slugs, 18 source-file inventory, 10 immutable blob SHAs, absent five throughout the repository tree, and no sensitive payloads in JSON. Workflow emits PASS only **after** Node tests succeed. This source identity proof prevents silent version drift in the T088 *candidate branch only*; it does **NOT** prove those ten match future Supabase production versions or backup the other five.

**Source recovery subtotal:** `T088_E8_LIVE_EDGE_GIT_SOURCE_CODE_IDENTITY_10_OF_10=PASS_SCOPED`; `T088_E8_FIVE_LIVE_FUNCTIONS_MISSING_INDEPENDENT_GIT_SOURCE=HOLD_P1`; `T088_E8_REAL_EDGE_RUNTIME_REBUILT_WITH_PRIVATE_ENV=NOT_RUN`. The existing local fake Edge 503 remains HOLD. No Production Edge function recreated, modified, redeployed, logged, or publicly copied. The previously completed real Founder Nov02 AGE+B2 PostgreSQL+5-media restoration and separate synthetic two-account GoTrue/Storage tests remain distinct evidence and do not create one full disaster scenario.

**Safe next E8 dependency:** an authorized *confidential* independently encrypted source bundle for all five missing live functions, private runtime configuration mapping and deployed Vercel source lineage; followed by truly isolated complete GoTrue/Edge/Vercel execution. Do not push private function code or credentials into this public Git repository, and do not rewrite the functioning production server to manufacture a PASS. `T088_ORIGINAL_FINAL_PASS_LOCK=HOLD`.


## Founder-directed T088 completed evidence SCOPED PASS + LOCK — 2026-11-02

**Founder instruction:** "continue kro or lock kro test ko". Lock all **actually executed** T088 proof, stop requesting previously completed phone/tablet proof or duplicating the real Founder backup; **do not turn missing full-system recovery into a fake PASS**. Source baseline at this checkpoint: `4fb5773a4137aaba6497755c2468a5f511be6c9f`, GitHub Actions [#41459233865](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/41459233865), **COMPLETED/SUCCESS with exactly 8/8 required jobs SUCCESS** and one optional full-history ZIP-selector **SKIPPED** (not tested). New exact-head CI after documentation-only lock will be independently checked.

### LOCKED as verified, distinct evidence only
- **E1:** Original Phase3/B11/B12/B13 News/Auth/Owner/Reporter/PG17/Backup gates all passed on recorded exact source baseline. Protected old source untouched.
- **E3:** Founder confirmed multiple-device work already done. Preserve earlier actual Phone+Tablet synced-draft v2, Founder Android publish/share/incognito and Reporter tablet role screenshots as **reused original samples**, not an invented new end-to-end T088 publication.
- **E6 limited:** Live `jantabol.in` HTTPS and published-news RPC returned 2 actual published Articles, 7/7 private relations denied or zero to anonymous, 4/4 real JWT-required Edge endpoints denied no-JWT GET, GoTrue public health HTTP 200; YouTube integration historical CONNECTED configuration. All are **public/negative/config proofs**; owner/reporter positive signed private API and live provider transmission remain unexecuted.
- **E8 production representative:** Founder-initiated protected main T070 run [#41444146576](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/41444146576) confirmed real new AGE/B2 encrypted PG17 restore of **34 Article records + five original media bytes**, 26/26 and 16/16 metrics exact, no new backup needed now. This is **real point-in-time joint DB/media restore** but not a whole-control-plane restore.
- **E8 isolated Auth/Storage:** Actual separate disposable local GoTrue signed two-FAKE-user JWT, signed PostgREST owner-v-other-v-anon RLS and exact private storage fake byte round-trip PASS. No real Auth users or secrets migrated. Standalone local synthetic Edge boot **HTTP 503 unresolved**; never falsely claim Edge recovered.
- **E8 public static-site source:** Actual deployed GitHub SHA `93df12aa8ffdfae38d9a4066b6a4556bb36969e5` reconstructed at localhost; **5/5 public HTML/JS files byte-identical to live** and headers/routing parity verified. No Vercel deployment/secret restore.
- **E8 Edge source:** 15 deployed ACTIVE Supabase Edge Functions, 18 live source files. **10/10 canonical checked Git source files match live byte-for-byte** (immutable blob SHAs in non-secret manifest), **5 live function code paths absent from full Git repo**. Management retrieval is not offsite encrypted recovery.

### Explicit unresolved original FINAL LOCK / launch blockers
1. **Full independent E8** restore for live production GoTrue/Edge/Vercel identity+private configuration+secrets, deployment/SSL/domain and verified RPO/RTO still **NOT_RUN**. `main` lacks the current served site subtree and vercel.json; five deployed Edge functions absent from current full Git tree; isolated fake Edge runtime HTTP503. Do not merge/redeploy/rekey/publish to claim recovery.
2. **E6 real signed** Owner-v-Reporter private API access and external encoder/YouTube/Live operational proof not certified by public API and historical integration metadata.
3. **T087 upstream:** Real hosted signed cross-account/revoked-session E2 and complete cross-module E5 still **DUE**, with T087 review-only stale-role RLS hardening **NOT APPLIED**.
4. **T088 multi-device**: No re-run for Founder; reuse documented historical proof. Any finer combined acceptance must be assessed against real existing records and original T088 mandatory evidence, not repeated screenshots.

**Fixed verdict:** `P4_T088_EXECUTED_E1_E3_REUSED_E6_PUBLIC_E8_DB_MEDIA_SYNTHETIC_AUTH_SITE_CODE=SCOPED_PASS_LOCK`; `P4_T088_ORIGINAL_FINAL_E1_E3_E6_E8_FULL_PASS_LOCK=HOLD`; `P4_T088_RELEASE_SAFE_TO_APPROVE=NO`. Completed partial evidence can now be treated as stable for next records audit; remaining E8/E6/T087 are **owned release blockers** and cannot disappear from the final register. PR #112 remains DRAFT/UNMERGED; no production mutation, paid tool, credential exposure or additional Founder action.
