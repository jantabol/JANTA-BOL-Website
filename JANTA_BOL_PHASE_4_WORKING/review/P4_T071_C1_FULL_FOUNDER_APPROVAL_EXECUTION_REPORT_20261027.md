# JANTA BOL — T071 / C1 — Founder Full Approval Execution Report
**Date:** 27 October 2026 IST. **Instruction:** Founder grants authority to finish C1 with no rebuild, no fake PASS, no breaking old work.
**Final factual status:** **C1 narrowly-scoped backend and public frontend fix IMPLEMENTED + CI VERIFIED on PR #47 (DRAFT). C1 FINAL PASS+LOCK = HOLD pending actual same-SHA served candidate/public browser/real Founder publish.** No production release/merge.

## Work genuinely finished in this session

1. Created isolated review branch `codex/t071-c1-public-read-secure-20261027` **from existing locked PR46 source commit `b509c60fceb053a51686f67e587d4922a40fa6f4`**, so **no rebuild and no old PR46 modifications**. Opened **draft PR #47**, based on existing PR46 branch, to review only the specific C1 delta. Main and Production left untouched.
2. Implemented **`jb_c1_public_articles(uuid,integer)`** only as **`JANTA_BOL_PHASE_4_WORKING/db/20261027_t071_c1_scoped_published_article_rpc_REVIEW_ONLY.sql`**:
   - Actual SQL `SECURITY DEFINER`, fully qualified `public.articles`, restricted search path, explicit per-column projection.
   - `status='published'`, `deleted_at IS NULL`, nonnull `published_at`; no private source, created_by, deleted_at, draft/archived/soft-deleted story leakage; result bounded 1..30.
   - No direct `anon SELECT` expansion, only the RPC would be executable by anon/authenticated **after future authorized deployment**. Not deployed today.
3. Minimal `backend-client.js` delta: public `getArticle` and `listPublishedPublic` call the same public, fail-closed RPC. No unapproved fallback to raw Articles. Existing admin `?preview=admin` still requires Owner/AAL2 before reading through existing private authenticated code. No changes to News publication, Ads, B9 immutable HTML/CSS, LIVE, or Owner dashboard.
4. Actual disposable **PostgreSQL17** GH Actions `40524742080`, job `122261106277`, **SUCCESS**: used four synthetic Article rows (eligible published, draft, soft-deleted, missing timestamp), real `anon` and `authenticated` roles, actual RPC definition and direct-table ACL. Verified published full body through RPC, private fields excluded, unpublished/draft/deleted denied, no direct anon table SELECT, unknown UUID denied, independent transaction no state mutation. **11/11 actual frontend source JS VM negative cases PASS** including preserved `?preview=admin` Owner rejection.
5. Exact same modified source baseline GH Actions `40524742420`, job `122261106838`, **SUCCESS**: **19/19** unchanged B9 branding/Search/public-truth tests; **2/2** LIVE source parity guards; old Owner/AAL2 Publish with simulated Compliance outage and idempotency PASS; **11/11** new C1 frontend RPC/fail-closed/Owner-preview tests. Total **32 numbered Node tests PASS plus standalone Founder-publishing simulation**. These are not a live Founder AAL2 action.
6. Earlier identical original candidate (before this minimal C1 patch) also passed **6/6 real isolated loopback HTTP** file routes for Home/Article/LIVE/Search/JS, GitHub `40521614075` — isolated file availability, NOT real backend browser.
7. Confirmed real Supabase read-only live condition: 16 published, 15 draft, 16 LIVE sessions OFF / 7 public LIVE-feed OFF; **0 active/INTERRUPTED LIVE**; anon LIVE feed SELECT true, anon direct Articles SELECT false, anon B9 Search returns public metadata/excerpt but **no body**. A true production published-body endpoint has not been authorized/executed. Older production root static LIVE badge remains present.
8. **Existing Vercel preview deployment of latest PR46/PR47 SHA could not be created**: corrected explicit preview-target call, then provider returned **HTTP 402 `api-deployments-free-per-day`, daily free quota (>100), retryAfter 86400**. No paid purchase, no extra Vercel project, no bypass. Current full PR46 hosted preview uses an **older SHA**, and old Production only has static root/404 Article, LIVE and B9 pages. We cannot honestly label it a matching new PR47 hosted candidate.

## Frozen C1 V1 route final score

| Existing, not newly invented, C1 requirement | Actual evidence | Verdict |
|---|---|---|
| E1 source identity / Git Main and protected Production parity | old Prod SHA `f447231c0677644ca5a44cc19f12cf0314ff38ea` matched, new isolated review branch pinned and PR47 created | **PASS (scope/identity)** |
| Guest/public published Article complete-body access | real anonymous PG17 function and JS client tests show full body, protected draft/deleted denied; production RPC not deployed | **PASS isolated / HOLD live** |
| Current full News/LIVE/Article candidate same-SHA real hosted/browser fetch | exact candidate source/CI verified; Vercel exact HEAD preview 402 | **HOLD** |
| Truthful LIVE/OFF and no old static false banner in actual candidate | frontend code conditionally displays LIVE from filtered public feed, Supabase read-only currently 0 live, source tests PASS; no exact new hosted end-to-end browser | **PASS source/DB / HOLD browser** |
| Actual authenticated Founder/AAL2 Publishing while keeping old Phase3 locks | original Publish/Owner AAL2 regression mock PASS, not actual authenticated Founder session | **HOLD actual E2E** |

**C1 final PASS+LOCK: HOLD. T071 FINAL PASS+LOCK: HOLD. T072: NOT STARTED.** Route C1–C5 did **not** gain a sixth gate.

## Why not simply force a "production PASS" despite Founder general approval
- Production database currently has **16 marked-published records**, including known QA/test news; turning all their bodies immediately public through a new anonymous RPC without editorial cleanup and a matching honest release website is an irreversible public-facing expansion. Founder grant to work on C1 is **not** permission to publish potentially unverified allegations or bypass owner-only review and corrections.
- Existing new SQL and JS were demonstrated against a **disposable real PG17** and as a **PR draft**; this is not an authorization to run review-only migrations in the live Supabase schema without a matching published release and separate evidence gates.
- Vercel hard quota 402 and lack of a real Founder/AAL2 interactive authenticated publishing session cannot be overcome by a green source test or a fabricated credential.

## Exact next safe completion step, once deployable with current FREE Vercel limits
1. Ensure Founder has reviewed the 16 currently marked-published Articles and unpublished QA/unverified material via existing Founder-only lifecycle **without permanent deletes or source/history rewrites**. This is a separate soft-launch editorial gate but directly relevant to safely enabling guest full body visibility.
2. Reconcile/approve the minimal reviewed, tested published-only Article RPC against actual Postgres owner/RLS/signature. Deploy **only the approved function**, no broad direct `anon` table GRANT. Bind the **exact PR47 tree** and deploy a **preview only** on the already-existing Vercel project when provider accepts deployment. Run real guest Article -> body & LIVE OFF UI tests with log evidence.
3. Use actual Founder authenticated AAL2 session for the smallest test of Owner publishing rights/visibility (or an authorized equivalent isolated E2E Auth environment); do not spoof another user's credential or publish QA accusation. Re-run affected original Phase3 regression; record exact SHA/E8 evidence.
4. Then independent reviewer accepts **C1 PASS + LOCK** and move to **C2**, without requiring `jantaboli.in`. No new requirements may be appended outside the original fixed C1 route.

**Production Main, Supabase/Storage/Edge Auth, published articles and Vercel aliases unchanged. Cricket/Saarthi untouched.**
