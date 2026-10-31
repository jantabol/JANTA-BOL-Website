# JANTA BOL — P4-T083: Four Previous B11/B12 CI Failures Resolved (Scoped Source Authority)
**Review date:** 31 Oct 2026. **Release status:** B12 SOURCE/CURRENT RECONCILIATION PASS_SCOPED; **B12 FINAL PASS + LOCK = HOLD**.

## Exact source authority
- Original LIVE site Git SHA **`93df12aa8ffdfae38d9a4066b6a4556bb36969e5`**, READY deployment `dpl_6XpfdMa7gCF5SDXd7EKHZfbpLfeF` on `jantabol.in` (source baseline).
- Prior B11/T071 authored before actual current C1 published-only web bridge. Immutable original historical Git branches and PR #46 / PR #48 **NOT MODIFIED**.
- The draft review branch of PR #94 modifies only public homepage `index.html`, nonreceipting demo `script.js`, and Admin Published page `published.html`, plus deliberately scoped CI/assertion files. No current production Vercel alias, Main, DB, Auth, Edge, Ads, original Article or published news modified.

## Four failed ORIGINAL unchanged regression assertions reconciled, not skipped
1. **B11/T071 B9 canonical Article / Ads / root**: old historical B8 Article Git blob `d2d414bef645c21404bcc45baa5aebbf7f9ff43e` is no longer current. Pinned actual served C1 Article blob `98dca1e26f32846b6fba722731acd6d14f0aed41` plus asserted public C1 get, Owner private preview and canonical PURL. Public Ads blob `a450cc3158c4c72692e848d3044ee00e53582082` and root `e82e88aee6e953f0eb0f817361cb87c3a5194aae` remain exact.
2. **B11/T071 public-truth home/feed**: current original `website-v3.js` safely uses `JBPublicC1.list(30)` while old code check wrongly expected removed `JBBackend.listPublishedPublic(30)`. Rebound to real C1 RPC `jb_c1_public_articles`, strict `row.status === 'published'`, public allowlist mapping, actual homepage non-receipt & Founder-selected tagline. Negative broken-feed injection test now targets CURRENT C1 call.
3. **B11/T071 second Article/Ads hash check**: same actual C1 Article source SHA pinned, with private Owner and C1 public route assertion; original Ads exact unchanged. Does not revert the repaired article code to an obsolete B8 source.
4. **B12 P7 release-truth historic status**: 29-Oct immutable `b12-release-truth.json` Git blob `fa4452d741adf48a5281045f221d427157f8c07f` recorded **T076 and T077 IN_PROGRESS** with later T078–T083 NOT_RUN. Original test incorrectly required only T076 IN_PROGRESS. Corrected to exact frozen historical statuses; all eight historic candidate final-evidence arrays remain **empty**, original `production_merged=false`, `production_deployed=false`, `b11_full_recovery_locked=false`, `b11_t072_real_production_idempotency_closed=false`. Old frozen record is **NOT a claim** about current evidence on 31 Oct.

## Exact GitHub CI — independently verified
- Wider original selected 15-file B8–B12 test matrix initially RED on unchanged original LIVE code: **108 PASS, 8 FAIL / 116 tests**, run `41215479893`.
- Same original 15-file matrix on earlier strictly scoped PR #94 modifications: **116 PASS, 4 FAIL / 120 tests**, run `41221135289` (5 Android Published protection tests now execute correctly).
- **After these four test-source authority reconciliations:** **120/120 PASS, 0 FAIL, 0 unexpected; fail-hard zero-FAIL gate**, run **`41222111812`**, exact PR #94 review HEAD **`11ccc7e7b0e97e92c41486a055c1f8f00fe2761f`**, job `124598662013` SUCCESS. Same workflow also enforces 8/8 new homepage truth, 5/5 original Published Android watchdog, 11/11 B9 UI, 9/9 B10 source, 12/12 Founder Auth, prior T071 Search/Breaking/Founder tagline selected cases. No privileged secrets or current DB writes.
- Original B11 test files were updated **only inside the draft review** to bind actual current code and retained negative test expectations. Historic original branch/PR source is unmodified. Do **not** retroactively claim old GitHub run `41215479893` was GREEN.

## Still blocking official B12 lock / B13 final closure
- T080 PR #84 durable idempotent retry is still **draft not deployed**; real Android interrupted save/retry and no duplicate side effect remain NOT_RUN. Isolated PR84 preview intentionally disables Founder login and is **not** the place to log in.
- T081 real current-point coherent DB+Storage+Auth+Edge+Vercel recovery and actual safe cutover/rollback remain NOT_RUN, cannot be substituted by source ZIP or historical offline DB+5 media proof.
- T082 current Founder-only real Correction→Unpublish→Republish E4 in a safe approved context remains NOT_RUN; no fake QA story publication.
- T083 entire original Phase3/B0–B12 protected workflow matrix and signed final source+backup release, original authority E7, independent provider cases, verified registrar auto-renew and Founder production signoff remain OPEN/DUE.
- Official execution order in original `JANTA_BOL_PHASE_4_WORKING/TEST-REGISTER.md`: **T001–T083 → T092–T109 → T084–T091 Final Closure (B13)**. B13 early read-only governance preflight may be prepared without declaring prerequisites DONE.
- `B12_SCOPED_SOURCE_CI=PASS`, `FOUR_OLD_ASSERTION_FAILURES=0`, `B12_FINAL_LOCK=HOLD`, `B13_FINAL_CLOSURE_NOT_AUTHORIZED`. No live systems modified by this review.
