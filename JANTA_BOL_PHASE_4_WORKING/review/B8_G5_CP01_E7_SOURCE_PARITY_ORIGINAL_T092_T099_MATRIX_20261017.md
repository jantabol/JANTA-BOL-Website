# JANTA BOL B8 G5 CP01 — E7 source/CI/live parity and original evidence gate
**Date:** 2026-10-17. **Scope:** READ-ONLY audit + documentation only. **No LIVE write, migration, deployment, merge, payment, or new service.**
**Founder policy:** NO REBUILD; Founder-only News publish/correction; one permanent Article UUID/PURL; private by default; real evidence before FINAL PASS.

## 1. Exact observed authorities (17 October 2026)
- GitHub repository `jantabol/JANTA-BOL-Website`; branch `codex/b8-g0-g1-accountability-20261017`; inspected HEAD `d965fbfd2a9ff57c978477a7d34ddca36970e3c2`.
- Feature/source CI tested SHA `a185ead49a5fa842fabc77f4357608649caa4e83`; GitHub Actions run `39012787537` **2/2 SUCCESS**, jobs B8 isolated PG17 and protected original News/Auth/B7 guard. Comparison tested SHA→inspected HEAD: **2 commits ahead, 0 behind, only two new G4 review/test-register Markdown files**. Consequently latest source under CI was unchanged in that inspected interval; HEAD itself was not independently re-run.
- GitHub `main` HEAD `265856ca9cbfd6c7d51989d85435397b72f24c8d`; B8 branch versus main **diverged**: branch **1182 ahead**, **115 behind**, merge base `7490b504bd0dd4c7d7c3154890dea96db7cc651b`. GitHub compare API returned only first **300 changed files**; do not call it a full reviewed diff.
- Vercel project `shubham-pichhore-2028` production domain `shubham-pichhore-2028.vercel.app`: production **READY** deployment `dpl_77cFA5hkJbSZodB32vok79yQG71y` points to main SHA **`b59da2c674c7c9bb924419cf2e14dbd70d908992`**, **one commit behind current main** (documentation only in compare). **Not B8 branch.**
- Latest located B8 preview **READY** deployment `dpl_5Fteuo1nUhu1S2uCnEDLrxyzq1mC` points to **`f6a5b04be7ce82dcd5ab9c20f12c8435ce0ab054`**, **five commits behind inspected B8 branch HEAD**. A Vercel READY state is *not* an HTTP/backend/Android PASS. Vercel file-tree endpoint returned 404, and public HTTP fetch was not independently confirmed; physical E3 cannot be claimed.
- Supabase **JANTA BOL only** project `vrffsnkycvjithwtiylt` (Postgres 17.6.1.155 ACTIVE_HEALTHY) queried with a **read-only transaction**: **0 `public.b8_%` relations; 0 `public.*b8*` functions; 0 B8-named Storage policies**. Listed **159 migrations, none B8-named**; 12 deployed Edge functions, **no `jb-b8-private-evidence`**. No B8 release on this actual hosted backend.

**CP01 E7 verdict: VERIFIED SOURCE MISMATCH / RELEASE HOLD.** Engineering G0–G4 isolated success is genuine in its bounded class but **NOT** an E2/E3/E5/E7/E9 final user PASS.

## 2. Official original Topic 13 gate — direct 321-page Phase-4 Master, PDF pp.312–314
The original source calls these `RUN-12`, not new invented test IDs. Full FINAL PASS remains **0/8**. ACC-001..ACC-051 full original acceptance remains **0/51**.

| Original test | Original ACC ranges | Required E evidence | Exact G5 real execution gate | Status |
| --- | --- | --- | --- | --- |
| P4-T092 Evidence-first architecture/applicability | ACC-001..008 | E7 + E9 | No parallel Article/News engine; serious vs ordinary case; claim vs verified fact/official response | DUE |
| P4-T093 Purpose/cost/impact/alternatives | ACC-009..012 | E2 + E9 | Sanction/tender/revised/actual separate; authority attribution, independent field outcome and evidence-limited alternatives | DUE; source gap |
| P4-T094 Question/Right-to-Reply/no-reply/late reply | ACC-013..019 | E2 + E5 + E9 | Unauthorized fail; scoped R0, Editor R1, Founder-AAL2 R2; manual send honesty; late and partial replies, factual no-reply | DUE |
| P4-T095 Ground/deadline/responsibility | ACC-020..024 | E2 + E5 + E9 | Claimed vs field verified separate; original/revised clocks append-only; roles without guilt inference | DUE; source gap |
| P4-T096 Timeline/master case/outcome/reopen | ACC-025..028 | E2 + E4 + E5 + E9 | One case, multiple unchanged Article IDs/PURLs, reopen with time/reason/evidence; non-false closure | DUE; partial source |
| P4-T097 Neutrality/conflicts/evidence integrity | ACC-029..035 | E2 + E5 + E7 + E9 | Same standard across subjects incl Founder conflict; immutability, versions, large pack, private leak rejection | DUE; partial source |
| P4-T098 Correction/notifications/audit/retention/Android | ACC-036..044 | E1 + E2 + E3 + E4 + E5 + E9 | Same-story URL correction, new follow-up Article, old infrastructure reuse, module-failure isolation and real Android cycle | DUE |
| P4-T099 Full functional/neutrality/privacy/failure lock | ACC-045..051 | E1 + E2 + E5 + E7 + E9 | Full family + intentional FAIL→RCA→minimum safe fix→regression, public privacy and actual source parity | DUE |

**Never manufacture official `E9`**: opening a composer != SENT; manual dispatch claim != DELIVERY_VERIFIED; submitted purported reply != authentic official reply. For an actual genuinely unanswered case, preserve authentic send evidence and cutoff; record NO_REPLY_AS_OF_DATE without inventing a response.

## 3. G0–G4 dependency preflight and FIRST DIVERGENCES
Nine B8 SQL migration candidates are `REVIEW_ONLY`, in source dependency order:
1. `20261017_b8_g1_case_reporter_scope_REVIEW_ONLY.sql`
2. `20261017_b8_g1_cp02_editor_immutable_review_REVIEW_ONLY.sql`
3. `20261017_b8_g2_cp01_provenance_survival_REVIEW_ONLY.sql`
4. `20261017_b8_g2_cp02_article_hold_GUARD_REVIEW_ONLY.sql`
5. `20261017_b8_g2_cp03_private_upload_REVIEW_ONLY.sql`
6. `20261017_b8_g3_cp02_founder_proof_notifications_REVIEW_ONLY.sql`
7. `20261017_b8_g3_cp03_manual_handoff_truth_REVIEW_ONLY.sql`
8. `20261017_b8_g3_cp04_reply_claim_REVIEW_ONLY.sql`
9. `20261017_b8_g4_cp01_cp03_public_projection_REVIEW_ONLY.sql`

**Dependency checks:** Existing `private.current_session_active`, Founder recent AAL2, `public.user_roles` / `team_accounts`, B1 case-role scopes, authentic `public.articles`, existing `live_notifications` domain, private Storage service-gateway, and G2 legal-hold Article DELETE trigger must be verified against **live exact schemas in a disposable source-matched clone**, not transplanted blindly. RLS + table grants + RPC `EXECUTE` under `anon`/`authenticated`, definer `search_path`, IDOR/race, object byte readback/orphans and revoked account must pass. No direct Reporter access to old private editorial bucket; new Edge `jb-b8-private-evidence` not deployed.

**First confirmed architectural coverage gap:** The present nine B8 SQL files include scoped case/review/evidence/upload/manual-question/private-reply-claim/public-enum-timeline, but **no explicit original cost-stages/impact/alternatives ledger** (T093), **no independent ground/deadline/responsibility revision history** (T095), **no verified outcome/reopen ledger or Founder conflict-flag lifecycle** (T096/T097). Basic `b8_cases.case_state` currently enumerates `draft/investigating/monitoring/closed`; it does not include `reopened`. This is **implementation coverage still DUE**, not a prod bug proven by execution. Do not claim all official tests could pass merely by deploying G0–G4.
- G4 public status is deliberately a **fixed enum**; do not auto-expose unknown private allegations/source text.
- Public Article correction note visible on actual Article page **NOT** proven by synthetic Article version increment.
- B3 notification `IN_APP_READY` != real push/email delivered, and external official send gateway absent (manual workflow by policy).

## 4. Controlled plan — NO ACTION taken
**CP02 (source/audit, no LIVE writes):** reconcile full main-only 115-commit changes with B8 file dependency subset; derive fresh `main`-based integration candidate via narrow reviewed diffs only; trace current production served files/endpoints + deployment alias to actual build and production-main parity, without copying old branch wholesale. Run full original Phase3/B0–B7 source regressions plus B8 PG17 suite on exact integration SHA.

**CP03 (critical minimal source completion before hosted acceptance):** add *only* missing original T093/T095/T096/T097 append-only verified/claimed distinction, conflict and reopen guards with negative tests; stable case UUID/PURL boundaries; no premature AI/political scoring. New G5 source change → mandatory fresh CI; review for official requirements and security.

**CP04 (Founder authorization required before any LIVE mutation):** stage an existing-free-resource preview and explicitly approved paired migration set with safe backup/restore, verified live-schema compatibility, rollback/compensation for additive triggers/functions and fail-closed feature gate. Do **NOT** apply B8 SQL to production without explicit Founder permission. Isolated clone tests are insufficient for hosted E2.

**CP05 (real evidence gate after actual verified deployed URL):** E2 real hosted role/JWT/RLS/Storage + Founder E5 AAL2; E3 real Android Reporter→Editor→Founder single-step tests with trusted synthetic cases, old News still publishable; anonymous/incognito G4 timeline privacy/Hide; E4 same PURL/correction. Public testing only with Founder-approved safe fixture. No unsolicited official communications in preview. Genuine third-party E9 event or honestly documented no-reply as-of is separately required for official closure.

**Final:** official T092..T099 E-class evidence + ACC full original coverage + baseline Phase3/old B0–B7 regression + corrected production parity before PASS/LOCK. B7 first paid ad after NEWS soft launch, not a release prerequisite. ZIP after gates pass; no secrets.

## 5. CP01 result
- Source/head/CI G4 tested-SHA lineage: **VERIFIED (E1 source-only)**.
- GitHub `main` vs branch vs Vercel prod/preview: **VERIFIED MISMATCH; RELEASE BLOCKED**.
- Actual Supabase B8 deployed backend: **NOT PRESENT (READ-ONLY VERIFIED)**.
- Original test evidence matrix: **PREPARED FROM PRIMARY MASTER**; tests **0/8 FINAL PASS**.
- New coding / deployed URLs accepted for Android E3: **NONE**.
- Manual action from Founder now: **NONE**. Founder explicit permission required at CP04 before any production change. No paid service authorized.
