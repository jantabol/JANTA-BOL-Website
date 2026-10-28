# JANTA BOL — B0–B12 Integrated Coding Checkpoint I / 28 October 2026

**Exact Founder instruction:** First safely integrate all old B0–B11 and new B12 coding; only AFTER coding completion begin T076–T083 separately. Produce one final all-phases PDF only when exact code/evidence map is reconciled. ₹0 paid, no production changes without separate permission, no rebuild or fake PASS.

## What was ACTUALLY done (review-only)
1. Inspected independent Phase-4 source homes. B10 latest GREEN code branch `codex/b10-whole-platform-security-candidate-20261023` has **692 files** and preserves complete B0–B8 + B9 + B10 source, tests, PostgreSQL17 security cases, protected Phase3 CI. Its source HEAD `610b8f6d508` had **actual GitHub CI 40074742831 SUCCESS**, including protected Phase3 and real disposable PG17.
2. Created new isolated reconciliation branch `codex/b12-b0-b12-reconcile-20261028` from B10, not from old demo `main`. No Production deploy or merge.
3. Ported B12 T076–T083 review-only **code/config guard components**, not pretend-product APIs:
   - `vercel.json` retains existing Phase3C route and adds no-store and HTTP security headers;
   - `JANTA_BOL_PHASE_3C_WORKING/b12-safe-nav.js` strict Founder deep-link allowlist, now preserves original T063 legitimate B8/B9 Analytics/Grievance deep links; malicious external, traversal and unknown query denied;
   - **surgically edited** original B10 `admin-login.html` to reuse strict B12 safe redirect while preserving T063 `safeNextPage()` contract, Founder MFA/AAL2 and protected device unlock; did NOT replace whole file with older B12 version;
   - **surgically edited** original B10 `article.html` to validate immutable UUID, add published-only canonical PURL, hide raw DB error details, **preserve existing B9 article scripts**;
   - imported T071 source-reviewed public error/hidden breaking handling into original B10 `website-v3.js` (exact 3-line verified diff);
   - imported T071's approved **five-section** mock-news-removal treatment into B10 `index.html` (breaking/top/story/video/latest/trending) without overwriting original B9/B10 scripts or backend; prevents unverified allegations/fake views/stock media from appearing as real published news;
   - added B12 metadata-only JANTA BOL catalog SQL, fail-closed external-provider classifier, non-executing rollback plan, zero-paid 8-test release gate and truthful RUN-11 one-test-at-a-time register. **All T076–T083 still NOT_RUN**.
4. Ran real GitHub hosted **full old protected B0–B8/Phase3 + B9 + B10 PG17 isolated regressions** on new integration branch by copying B10's actual CI jobs and adding B12-specific E7 coding guard. First CI exposed a real regression to existing B10/T063 expected safe redirect support: we fixed production implementation to preserve old verified exact deep-link semantics rather than deleting/weakened T063 test.
5. **Run 40687030572** completed with all non-skipped jobs **SUCCESS**, including B10 static, B10 actual disposable PG17, B0–B8 old PG17 G0/G1, B10 whole-block coding gate, B12 E7 source and private/Auth/PURL/zero paid 8/8 coding checks. Two optional artifact export jobs (one skipped by original conditional) are not product release tests. A tiny non-behavioral CI source cleanup followed; latest HEAD must re-run independently.

## Important unresolved source reconciliation and genuine holds
- B11 real recovery and T072 Owner retry fixes are **not** integrated into this B10-based source. B11 latest schedule PR #58 code is a separately reviewed original Main-line branch containing 61 possible add-only B11 CI/workflow paths not in B10, plus overlapping scripts that require conflict audit. **Do not copy all files blindly** or merge to Main; reconcile required B11 code, CRI, PG17 and zero-paid guarantee separately.
- B12 standalone PR #60 was based on an older T071 line and lacks B9/B10 security source; **do not merge it directly over B10**. This reconciliation is strictly additive/surgical.
- **B10 official T063/E3 and final T068 are still not LOCK**, regardless of E7 CI GREEN. B11 full E8 hosted Auth/Edge/Vercel recovery and T072 hosted P2 continue HOLD.
- No T076–T083 real domain/Admin/Auth/Article/Android production test was executed on this candidate. The previous T076 public HTTPS 200 run tested an older Production Main, not this new code.
- Existing GitHub Main remains older static source; **no Git Main merge, Vercel Production deploy, Supabase DDL/RLS/function mutation, B2 write, new paid services, Auth secret access, Founder manual work or Cricket/Saarthi changes.**

## Exact next coding task before the requested tests and final single PDF
1. Safely reconcile B11 original protected backup workflows and latest live idempotency proposal **with** the B10 security branch's source and CI; no auth/provider/secret downgrade.
2. Reconcile current Source of Truth for B8/B9/B10/B11 versus B12 release truth; run original Phase3 CI and affected real PG17 negatives after every source change. Keep official tests T076–T083 NOT_RUN.
3. Final single B0–B12 coding PDF must list all actual retained/new code paths and tested CI proof by HEAD, plus all blocked Production dependencies; never label this current checkpoint 'full coding PASS'.

**Overall:** B10-preserving B12 source integration STARTED + first CI regression detected/fixed. **B0–B12 FULL INTEGRATION = IN PROGRESS**, **B12 TEST SERIES = NOT STARTED**, **SOFT LAUNCH RELEASE = HOLD**.
