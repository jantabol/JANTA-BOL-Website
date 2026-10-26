# JANTA BOL • P4-T070 • G14 — Actual No-Cost Ephemeral Supabase Local Runtime Smoke
Date: 26 October 2026 IST. **G14 EMPTY LOCAL RUNTIME TEST = PASS; FULL T070 = HOLD.**

## Actual independent GitHub-hosted run
- Repo JANTA BOL ONLY, Draft PR #40 branch, SHA `4bea8a4969bc1a99f2110e8afc5b05d66c4a6550`.
- Workflow `.github/workflows/b11-t070-identity-preflight-CANDIDATE.yml`, run **40291268018**; G14 job **121466638578**; **SUCCESS** (t070_identity_preflight also success).
- Runner `ubuntu-latest`, standard GitHub-hosted for a **public** repository (GitHub docs state standard hosted public repo minutes are free; large runners are not used). No Supabase managed branch, cloud clone, paid hosting account or provisioned permanent compute was created.
- Actual terminal log proof:
```text
G14_NO_PRODUCTION_SECRETS=PASS
G14_EMPTY_PG17_AUTH_STORAGE_STACK_BOOT=PASS
G14_PRODUCTION_DATA_RESTORED=false
G14_PLATFORM_EDGE_VERCEL_RECONSTRUCTED=false
T070_REAL_JOINT_E8=NOT_RUN
```
- Steps pinned official `supabase/setup-cli` CLI **2.120.0**, created a completely **new empty** temporary local project; Docker network bound to loopback; `supabase start --network-id` returned successfully. Observed container names include local `db`, `auth`, `storage` services; successful local CLI stack health checks, no production DB, B2 objects, identities, Edge function source code or Vercel env passed in. CI step traps stop/remove local Docker containers/network/temp on job exit, GitHub cleans disposable runner.
- **Precision:** The marker says `PG17` but this run only checked the local `supabase_db_` container name; it did **not** query local Postgres server_version, so exact local major version remains **NOT VERIFIED**. It also did not perform live local JWT/RLS/Auth/Storage access negative tests. Do not interpret this as complete restored platform.
- Scope is a genuine on-runner runtime-capability test (more than synthetic tests), but it cannot certify recovered JANTA BOL production data or a real full system disaster recovery.

## Remaining essential barriers
1. Production database and original media have real separate successful backups (T034, T069) but no externally verified protected write quiescence or shared recovery-point receipt.
2. No real combined DB + five media + 13 deployed Edge versions + Auth + Storage policies + Vercel runtime config reinstated into this local stack.
3. No clone-side exact preserved stable IDs/URLs, private and anon denial, AAL2, live/ad relationships; two source relations currently empty and require isolated fixtures.
4. Owner key off-runner decrypt success is real but original objects were not unpacked/5 SHA-checked on Android in that test; T069 separately verified five originals in CI.
5. No full E1/E2/E4/E5/E8 and independent Android regression evidence for restored runtime.

**G14 SAFE NO-COST LOCAL RUNTIME SMOKE = PASS, VERIFIED ACTUAL GITHUB ACTION LOGS.**
**P4-T070 FINAL = HOLD (not an E8 PASS); T071 NOT STARTED.**
**Production Supabase, GitHub main, Backblaze originals, Cricket/Saarthi UNTOUCHED. No extra manual step at G14.**
