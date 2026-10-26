# JANTA BOL P4-T070 — G17 Founder-A Approved Conditional Maintenance: REAL Readiness Decision
Date: 26 October 2026 IST. **Founder chose A: controlled maintenance AFTER independently validated rollback and safe write barrier.**
**G17 read-only audit + safe gate DEVELOPMENT CI = PASS. G17 LIVE MAINTENANCE = NOT AUTHORIZED TO EXECUTE YET BY THE PRECONDITIONS. P4-T070 REAL FINAL E8 = HOLD.**

## Exact production-scoped facts independently checked via connected Supabase (READ ONLY)
- Authorized project ONLY `vrffsnkycvjithwtiylt` JANTA BOL, PostgreSQL 17, `ACTIVE_HEALTHY`; no Crystal/Cricket project operations.
- Three live `pg_cron` jobs enabled, on three distinct schedules; 48 enabled non-internal public table triggers; zero idle-in-transaction/waiting locks at observation instant (not writer protection).
- 100 public tables; **5** have some direct `anon` INSERT/UPDATE/DELETE SQL grants and **15** some direct `authenticated` grants. This is GRANT metadata, NOT proof any policy is bypassable or every write succeeds.
- **218 public SQL functions**, of which **215 SECURITY DEFINER**. **22** functions executable by `anon`, **120** by `authenticated`; among security-definer functions **22** are executable by `anon`, **117** by `authenticated`, and **215** by `service_role` (metadata only). They require individual classification as read-only vs mutations before blanket rollback/fence claims. Never disable them indiscriminately.
- 13 current ACTIVE Supabase Edge Functions; **5** `verify_jwt=false`. Some may enforce their own application authentication; `verify_jwt=false` by itself does NOT mean a vulnerability. But they are potential maintenance write entrypoints that must be instrumented/fenced.
- Independently retrieved 13/13 deployed function source text transiently through authorized Supabase connector. Per-function static pattern counts (method verbs, `insert`, `rpc`, storage, fetch) were recorded **without any deployed source code, private evidence, secret or path** in `ci/phase4/b11/t070-g17-edge-writer-risk-observation.json`. Regex matches are only triage hints; comments/read RPCs can be counted and dynamic writes missed.
- Actual original Storage inventory remains five files in three buckets: 2 private-grievance, 1 private-editorial, 2 public-media. G12 Founder-owned AGE decrypt and T069 original media readback are previous true component proofs, NOT new G17 joint restore.

## Conditional permission exactly interpreted
Founder chose option A — build a safe reversible write-block and then controlled maintenance. Founder did NOT approve blindly disabling cron, access grants, RLS, Auth, SQL functions or deleting/purging data. The condition **verified rollback first** remains in force. With the live writer surface above still unguarded, invoking maintenance now would not provide a trusted same-point capture and might break the published site or unsynced Android edits.
No direct production mutation, write freeze, revoked session, cron toggle, Auth/Storage/Edge change, Vercel deployment, B2 upload or paid cloud clone was performed.

## Concrete code and actual independent CI
- Added `ci/phase4/b11/t070-g17-production-maintenance-preflight.json` with source aggregate observations and explicit `production_paused=false`, `rollback_proven=false`.
- Added `ci/phase4/b11/t070-g17-edge-writer-risk-observation.json`: metadata + synthetic static count indicators for 13/13 deployed functions, zero code/secret contents.
- Added `ci/phase4/b11/t070-g17-maintenance-go-no-go.mjs` with 18 separately necessary control/evidence fields covering public, direct grants, definer-RPC, service-role, cron, Edge, upload, webhook, mobile offline, LIVE/Grievance/Ads, inflight queries, same-point DB+media manifest, private platform config, rollback, restore security, and founder-specific release.
- Added **7 fail-closed regression tests** and wired them to the existing candidate-branch **no-production-secrets** GitHub Action. Even all caller-asserted `true` values mean only `INDEPENDENT_REVIEW_REQUIRED`, never auto-maintenance or final PASS.
- Actual GitHub Actions **run 40307974249**, job **121521722052**, SUCCESS; **91/91 TAP code/negative tests PASS, 0 FAIL** across 12 suites. True logger line: `T070_SYNTHETIC_COMPARATOR_ONLY=PASS; T070_REAL_RESTORE_E8=NOT_RUN`.
- Existing G14 real clean isolated runtime and G15 real synthetic PG restore + five fake files + RLS deny remained covered by prior real executed runs. No new official end-to-end original-source restore was run here.

## Next REAL gates before T070 can honestly pass
A. Before touching live users, classify and review each production writing entrypoint, including 3 cron jobs, SQL direct grants+mutating DEFINER RPCs, 5 non-JWT Edge endpoints, service_role calls, upload URLs, and offline queued mobile actions. Implement a reversible fenced state enforced at the actual backend write sinks, not only via a Vercel front-end banner.
B. In synthetic/disconnected test exercise the exact pause/resume **and rollback on failure**, with proofs that private grievances remain confidential, no offline edit lost, no silent pending queue replay, no timeout or unsafe session mutation.
C. Under separately reviewed exact protected Founder/main commit and a timeboxed maintenance window, observe all writer drains and double-scan Storage changes. Capture a same-point protected raw Postgres snapshot + all original five media bytes + independently versioned Auth/Edge/Vercel platform configuration. Encrypt combined receipt and immutable archive to the existing JANTA BOL private B2 (do not regenerate keys or overwrite old backups).
D. Restore the real bound archive into confidential isolated disposable runtime. Verify original identity hashes/URLs, five original-file SHA, Auth/AAL2/RLS negative security, all 13 Edge versions, relevant Vercel config, and isolated test fixtures for zero-live/payments source categories.
E. Independent E1/E2/E4/E5/E8 and Founder Android proof, verify every writer resumed safely, then explicitly decide T070 Final PASS+LOCK. T071 remains blocked.

**GO/NO-GO:** `G17_DESIGN_AND_SOURCE_AUDIT=PASS`; `G17_PRODUCTION_MAINTENANCE_NOW=NO_GO` because rollback and all writers are not yet fenced; `G17_REAL_JOINT_RESTORE=NOT_RUN`; `G19_E8=NOT_RUN`; `T070_FINAL_LOCK=HOLD`.

Safety preserved: GitHub MAIN unchanged; PR #40 remains Draft; production DB, storage, keys, B2, deployment and Cricket untouched; no additional paid services.
