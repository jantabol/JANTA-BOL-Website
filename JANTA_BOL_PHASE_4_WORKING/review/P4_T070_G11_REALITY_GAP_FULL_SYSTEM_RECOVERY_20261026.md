# JANTA BOL P4-T070 — G11 Joint Recovery Reality and E8 Readiness Audit
Date: 26 Oct 2026. Founder authorized continuing recovery, but not changing production or purchasing an isolated environment.
**VERDICT: G11 READ-ONLY AUDIT + DEVELOPMENT CI PASS. Actual whole-system combined restore NOT RUN. P4-T070 FINAL HOLD; T071 NOT STARTED.**

## Real successful component restores — individually verified, not combined
- T034 Founder GitHub Action run 40223103797: real private Backblaze encrypted DB backup/readback and isolated PG17 database restore, 26 DB metrics plus 16 security checks matched. DATABASE_ONLY PASS.
- T069 Founder GitHub Action run 40274621191 / job 121414622988: encrypted offsite original Storage bytes roundtrip and separate disposable in-run media restore (2 grievance-private + 1 editorial + 2 public), actual log markers B11_T069_ENCRYPTED_ORIGINAL_MEDIA_B2_READBACK=PASS, B11_T069_INDEPENDENT_OFFLINE_MEDIA_RESTORE=PASS, B11_T069_ORIGINAL_MEDIA_FILES_RESTORED=5. ALL_FIVE_MEDIA_ONLY PASS.
- Different times and different capture operations mean T034 and T069 cannot be called a trusted single recovery point. Metadata timestamps do not prove no app writes.
- T069 source workflow explicitly logs B11_T069_POSTGRES_OR_PLATFORM_CONFIG_RESTORED=false.

## LIVE READ-ONLY JANTA BOL evidence (2026-10-26 05:38 UTC)
- Correct JANTA BOL project vrffsnkycvjithwtiylt ACTIVE_HEALTHY, PostgreSQL 17; no disposable Supabase branch currently present.
- RLS enabled on 100/100 public tables. Source app policies reconciled: 74 public + 4 storage + 3 private = 81, with 2 unrelated cron policies. RLS flags do not prove effective endpoint authorization.
- Auth users 5, Auth sessions 72 (source inventory only; no Auth runtime restore). Supabase Edge Functions: 13 ACTIVE, source versions indexed; zero deployed to disposable target.
- Articles 32; versions 878; grievances 6; grievance history 57; grievance evidence 2; live sessions 16; live updates 0; ad campaigns 7; ad payments 0.
- Source Storage objects: grievance-private 2 (853304 bytes), private-editorial 1 (2285707 bytes), public-media 2 (1866224 bytes). Storage metadata SHA attribute absent; independently executed T069 original byte checks support 5/5, not metadata alone.
- Original read-only 14-rule live-source integrity SQL executed: 12 LIVE_SOURCE_CONSISTENT, 2 NOT_EXERCISED (zero Live updates and zero payments), 0 failures. Article slugs and grievance public IDs unique, protected FK associations not orphaned.
- Vercel JANTA BOL project metadata inspected read-only. No environment variables returned by undecrypted list call; this does NOT establish whether all platform runtime configuration has been restored. No Vercel changes.

## G11 crucial unproven gates
1. ONE_TRUSTED_RECOVERY_POINT: no independently proven protected write-quiescence barrier, immutable correlated database transaction/Storage capture manifest, and no same-point joint restored clone.
2. DURABLE_OWNER_AGE_KEY_DECRYPT: T069 verified B2 readback with a newly generated EPHEMERAL private recipient on its same CI runner; this key is destroyed on runner cleanup. No proof the Founder can independently decrypt the preserved archive later using the long-term primary private recipient key outside CI. Do not share private keys with ChatGPT or GitHub artifacts.
3. ACTUAL_AUTH_PLATFORM_RUNTIME: no isolated reconstruction or negative-access live testing of Supabase Auth sessions/AAL2, Storage private RLS, 13 deployed Edge Functions, Vercel application/runtime settings. Isolated PG17 alone is insufficient.
4. IDENTITY AND EMPTY ROWS: actual recovered Article permanent IDs/master URLs, Grievance IDs/history, Live and Ads relationships plus Auth ownership not jointly exercised; Live updates and Ad payments each have 0 source rows, so synthetic tests belong in a disposable clone only.
5. FINAL E1/E2/E4/E5/E8 independent security verification, Android E8 proof and separate Founder LOCK missing. T071 remains blocked.

## Executed G11 code/CI checkpoint
- Candidate Draft PR #40 only: ci/phase4/b11/t070-g11-cross-component-gate.mjs and 9 synthetic tests; sanitized t070-g11-observed-recovery-scope.json and 6 observed-evidence regression tests; added two steps to existing synthetic-only CI.
- Official GitHub Actions run 40275950132 / job 121418611367 SUCCESS, 64/64 TAP PASS, 0 FAIL: comparator 18; source SQL contract 4; media byte fixtures 8; Storage SQL contract 4; E8 fail-closed 10; existing T069 workflow 5; G11 fail-closed 9; G11 observed facts 6.
- Actual end-of-job marker: T070_SYNTHETIC_COMPARATOR_ONLY=PASS; T070_REAL_RESTORE_E8=NOT_RUN. No invented real E8 success.

## Exact next execution gates
A) Founder privately verifies primary AGE recovery key accessible away from GitHub. Any proposed off-runner decrypt must remain private, leak no originals or key material, and require separate scoped approval.
B) Before a new DB+Media production capture, plan a protected consistent-point protocol with change-blocking/rollback that preserves offline edits and doesn't alter production without Founder approval.
C) Set up authorized, isolated runtime for DB+Media+Auth+Storage+Edge+Vercel and independently test real IDs/negative RLS; no paid Supabase branch/project without verified zero cost or advance explicit Founder consent.
D) Prove actual merged recovery, then independent security and Android testing before separately authorizing FINAL LOCK. Do not fake zero-row relations.

**G11 DONE as code + source audit, not as real combined recovery.** No source writes, no change to production DB/Auth/Storage/Vercel, GitHub main, existing B2 backup, or Cricket/Saarthi. No secret accessed or sent to chat.
