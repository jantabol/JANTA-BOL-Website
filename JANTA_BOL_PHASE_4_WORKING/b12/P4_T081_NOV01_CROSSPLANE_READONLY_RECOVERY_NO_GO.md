# JANTA BOL — P4-T081 current recovery cross-plane preflight (1 November 2026)

**Scope:** Founder ₹0, SELECT/GET-only runtime evidence + immutable git ancestry. **Verdict:** `CROSSPLANE_SOURCE_INVENTORY=PASS_SCOPED`; `LIVE_FULL_RESTORE_E8=NOT_RUN`; `B12_FINAL_LOCK=HOLD`. No upload, live restore, new paid backend, deploy, DNS, alias, Account/Auth, Edge update, news edit or backup triggering.

## Actual 1 Nov 2026 independently read-back (not a restore)
- **Supabase JANTA BOL project** `vrffsnkycvjithwtiylt`, PostgreSQL 17 in `ap-south-1`, ACTIVE_HEALTHY from provider. (The separate Cricket project was NOT used.)
- SQL SELECT-only `public.articles`: **34** rows = **2 published, 31 draft, 1 deleted**. Genuine published IDs `c49f00b6-0359-400c-a957-2082142ff8dd` **v12**, `f17f6507-02a3-4881-ad37-0b02cadf3d3f` **v15**; QA-only `fbc2a0c3-6a62-4d7a-ba9a-133c4ddc7e14` **draft v6** and no published_at. Do not publish/modify an existing article for QA.
- `public.article_versions` **920** rows; `public.audit_logs` **1635** rows. Compared to older historical figures 919/1633 these are aggregate changes only; identities and event contents were not inspected and no cause is asserted.
- `auth.users` **5**; `auth.identities` **5** aggregates. This is **NOT** a GoTrue Auth export, sessions or identity-restore proof.
- `storage.objects` **5 objects**, across exactly **3** buckets: **2 `grievance-private`**, **1 `private-editorial`**, **2 `public-media`**. No filenames, sensitive paths, download bytes, object hashes or private identities collected. Counts are **NOT** a media restore/backup proof.
- Provider-listed Supabase Edge Functions **15 total / 15 ACTIVE**. This verifies presence/status *only*, **NOT** active Edge deployed source parity, env/secrets, runtime triggers, webhook configuration or recovery. In particular some internal/worker callbacks deliberately use `verify_jwt=false` and may have independent validation guards; do not alter those guards under T081 merely for a green count.
- **Vercel** production deployment `dpl_6XpfdMa7gCF5SDXd7EKHZfbpLfeF`: **READY**, exact served Git SHA `93df12aa8ffdfae38d9a4066b6a4556bb36969e5`, project `prj_xNb9G3xjW35qSXEyF7o2qiCqG4HI`. Both `jantabol.in` and `www.jantabol.in` domain records verified on project; `www` redirects to apex with 308. **No alias reassign/rollback attempted.**

## GitHub source/schedule boundary: concrete newly verified problem
- Protected default `main` SHA at check `f447231c0677644ca5a44cc19f12cf0314ff38ea`. Production Vercel is served from a DIFFERENT branch/source, approx 434 commits ahead (historically verified), **never deploy main blindly**.
- Immutable LIVE source `93df12a...` **contains** `.github/workflows/b11-t075-scheduled-encrypted-joint-review.yml` (blob `0c3a8821ea74b78625b13ffed6696443550aba5b`) with weekly schedule `45 21 * * 6` and a strict protection condition: only repository's `refs/heads/main` **and** two Founder release variables `JB_T075_SCHEDULED_BACKUP_ENABLED=YES_FOUNDER_RELEASED`, `JB_T075_B2_ZERO_SPEND_CAPS_CONFIRMED=YES_FOUNDER_VERIFIED_ZERO`; protected backup environment also required.
- **The protected original main at SHA `f447231c...` DOES NOT contain this scheduled workflow file** (GitHub contents lookup returned 404). GitHub scheduled Actions normally run from the default branch. Therefore **the current LIVE-branch-only scheduled source cannot be counted as a running protected Main automatic backup.** We did NOT turn it on, merge any workflow into Main or assert ₹0 B2 capacity.
- Original `.github/workflows/b11-t070-real-joint-restore-MANUAL.yml` exists on both LIVE and Main, exact blob `aaff8b254cd3355be17d29e9e360ea8a874221df`; it is **workflow_dispatch / Founder-only**, requires confirmation, exact reviewed protected Main SHA and protected backup environment. This is not a proof it recently ran for the current snapshot or a full current-point Auth/Edge/Vercel restore.
- Original production `ci/backup/jb-free-offsite-backup.sh` exists on both references, same blob `d9000654ff7d6fe9ba8484259e307f26cab97311`; the missing staged double-B2 cap from Draft PR #87 and unsigned budget release cannot be treated as deployed. PR #87 independently proved **67/67 candidate source-only recovery guards** and fixed 3 old deficits, but is still review only.
- Original older T070 actual offline run `40452402698` succeeded for **DB + five original media objects** in an ephemeral, non-production runner; its own workflow explicitly denies claim of full GoTrue Auth, Edge, Vercel runtime restore. The old run is NOT a new Nov 1 current-point E8 proof.

## Explicit final E8 evidence that still requires execution
1. Isolated, cost-approved **current-point** DB/Storage snapshot with protected encrypted recipients and an actual restore target; exact original Article UUID/version/audit and original 5 media bytes validated from the **same selected snapshot point**.
2. Safe GoTrue Auth identities/MFA/revocation/sessions recovery validation and Edge Functions **source plus runtime configuration** and signed binding, without exposing secrets.
3. Current Vercel production project/deployment manifest (Git SHA/routes/env names, not values), truly rehearsed alias/cutover rollback with independent public GET and Founder authorization; **no live routing changes** before tested recovery plan.
4. Full original Phase3/B0–B12 protected regression, budget/cap safety, audit retention, Founder E3/E4/E8 signoff.

**No safe ₹0, genuinely separated full-stack DB+Auth+Edge+Storage+Vercel target has been independently demonstrated, and current default Main is NOT the served release source. Do not attempt live restore or turn scheduled B2 writes on as a shortcut.**

**Final T081:** `READONLY_CROSSPLANE=PASS_SCOPED`; `CURRENT_POINT_E8_FULL_RESTORE=NOT_RUN`; `ROLLBACK_DRILL=NOT_RUN`; `T081_FINAL_PASS_LOCK=HOLD`. **T082 E4 and B12 final/B13 final remain HOLD.** No Founder manual step for this read-only checkpoint.
