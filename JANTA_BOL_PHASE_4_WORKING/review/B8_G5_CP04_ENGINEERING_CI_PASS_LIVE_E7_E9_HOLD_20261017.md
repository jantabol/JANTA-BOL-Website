# JANTA BOL — G5 CP04 Engineering Closure / Honest Official Hold
**Date:** 17 October 2026. **Product priority:** Phase-4 NEWS soft launch, no unnecessary paid service.
**CODE-TESTED SHA:** `d9c5f07ac844ef2cfe213fa57fda4f213dfb01b6` on `codex/b8-g0-g1-accountability-20261017`.
**GITHUB CI:** https://github.com/jantabol/JANTA-BOL-Website/actions/runs/39016372617 — **2/2 SUCCESS**. Production changes: **NONE**.

## 1. Engineering work actually performed
- Original Phase-4 Master PDF 321 pages, Topic13 pp.312–314, RUN-12 P4-T092–T099 and ACC001–ACC051 used as testing authority (see CP01 matrix).
- Added *one* review-only additive, private migration `JANTA_BOL_PHASE_4_WORKING/db/20261017_b8_g5_cp03_original_accountability_ledger_REVIEW_ONLY.sql` **after** nine G1–G4 review-only SQL sources. Does not modify original News Article/PURL, existing News publisher, B3 notification, B7/paid Ads or Auth code.
- Private typed append-only ledger handles separate **SANCTIONED/TENDER/REVISED/ACTUAL** amounts, **ORIGINAL/REVISED** deadlines, authority vs field claims, impact, unverified alternative, responsible *roles* not guilt, Founder/JANTA BOL **conflict flag**, editorial monitoring/closed-with-reasons, case **REOPEN with same-case private byte receipt**.
- All Source statuses remain `NOT_INDEPENDENTLY_VERIFIED`; a database private byte receipt ≠ independent authentication of office reply, public fact or verified expenditure. No fake provider SEND/DELIVERED/E9. Existing case UUID and original News Article identity unchanged.
- Scoped Founder AAL2-only RPC/ACL; private ledger has **no anonymous or authenticated direct-table rights**, immutable history, receipt case-match, authorisation/refusal tests. B8 G4 server-owned public safe projection refuses conflict-flagged approval; already public case must HIDE before conflict flag, with same case-lock serialization. Do not call a flag a legal finding.
- Added four Android-first Founder forms under existing gated `b8-accountability.html`: factual entry, outcome, reopen and private ledger. G5 client validates paired fields, exact decimal strings, receipt IDs; existing role check, `auth.getUser`, online gate, 15-minute private screen lock; screen lock explicitly clears new private ledger. All external sending and private upload still held behind existing hosted gate.

## 2. Verified tests and actual RCA
Latest CI **#39016372617** for exact code SHA: **2/2 SUCCESS**, G0 Phase3 News/Auth/B7 original bounded static checks and G1–G5 networkless disposable PostgreSQL17 flow GREEN.
- G5 PG17 PASS: four separate cost amounts, original/revised deadline order, no duplicate original, attributed office/field/impact/alternative, conflict public exclusion (including HIDE-first), Owner AAL1 denied, Reporter/anon denied, wrong-case private receipt denied, private closure/new material reopen, immutable history, 16 append-only test events, transaction ROLLBACK; old Article + B7 synthetic sentinels unchanged.
- G5 Owner module **7/7 Node tests PASS**; other executed bounded suites: G2 private gateway 10/10, G3 frontend 14/14 and 13/13, G4 public 15/15 + CP04 lifecycle 1/1. Other Phase3/B7 guards also GREEN, NOT a substitute for true original Android/E3.
- Initial CI **#39016059877 FAILED** only at the new G5 test's final assertion: incorrectly assumed all cases count must be 0 after its ROLLBACK; preceding G4 CP04 intentionally committed an isolated prior HIDE fixture. **FIRST DIVERGENCE was the new G5 baseline assertion, not application ledger logic**. Minimum fix: capture prior case count before BEGIN and assert no *delta* after ROLLBACK. Re-run **#39016114174 2/2 PASS**, after G5 Android integration final **#39016372617 2/2 PASS**. No fake PASS of failed attempt.

## 3. Real deployment authority findings
- Supabase actual JANTA BOL `vrffsnkycvjithwtiylt`, PG17.6.1.155 read-only: all nine existing required Article/User Roles/Team Accounts/B3 Notification/Auth Session/Storage/Owner-AAL2 helper catalog dependencies verified PRESENT. However B8 relations/functions/storage policies remain absent, and Edge `jb-b8-private-evidence` absent. No LIVE SQL or DML applied.
- Branch vs main diverged **1182 ahead / 115 behind** at CP01. GitHub `main` tree contains **60** entries and **no `JANTA_BOL_PHASE_3C_WORKING` subtree**; B8 branch has **544** tree entries at code-tested SHA including nested site/UI. Both root `index.html` blobs are identical old static shell (`e82e88a...`), not the nested Phase3C site. Copying entire B8 source to root or blindly merging would create a potentially catastrophic source-target/production mismatch. Deliberate reviewed root routing/handoff and independent CI essential.
- Vercel production alias `shubham-pichhore-2028.vercel.app` was pointing to ready **main SHA `b59da2c6`**, NOT B8; found older B8 preview at `f6a5b04b` (as of CP01). Later preview listing only showed B8 `2206e1ea` READY, **not latest final G5 frontend+CI SHA**. DO NOT perform Android E3 on stale URL or treat Vercel READY as hosted backend E2.
- No automatic production Vercel deployment, GitHub main merge, Supabase migration, Edge deployment, Source Article changes, ad payment, staff invite or real official communication was done.

## 4. Official G5 acceptance (RUN-12) — NOT automatically closed
| Test | Required original evidence | Engineering coverage | Final |
|---|---|---|---|
| P4-T092 ACC001–008 | E7+E9 | Original Article isolated / no parallel publisher | **DUE** |
| P4-T093 ACC009–012 | E2+E9 | New 4-stage cost, stated/ground impact and alternatives privately recorded | **DUE real source** |
| P4-T094 ACC013–019 | E2+E5+E9 | Prior G3 R0/R1/R2 manual handoff no-fake-SEND and reply claim | **DUE actual communications** |
| P4-T095 ACC020–024 | E2+E5+E9 | New deadline history, ground vs official, responsibility role | **DUE real** |
| P4-T096 ACC025–028 | E2+E4+E5+E9 | Case+linked Article IDs, monitoring/closure/reopen append-only | **DUE real Article/history** |
| P4-T097 ACC029–035 | E2+E5+E7+E9 | Owner conflict-flag public blocking, private evidence and immutability | **DUE actual multi-subject** |
| P4-T098 ACC036–044 | E1+E2+E3+E4+E5+E9 | G4 public controller and G5 Android Owner source checks | **DUE physical Android and provider** |
| P4-T099 ACC045–051 | E1+E2+E5+E7+E9 | G0–G5 bounded integration GREEN, observed/repaired intentional failure | **DUE full E-class** |

**Official P4-T092–T099 FINAL PASS 0/8; full original ACC001–051 0/51.** Any E9 needing an actual officer communication/reply remains not verified; record factual no-reply-as-of only with real delivery/date proof. No public/private wrong-leak or official original case E9 can be simulated into PASS.

## 5. Safe next gates (do not auto-release)
1. **E7 source candidate**: compare full main-only work including B7 restore/ads and B8 nested app, review exact root-site deployment source and release path; build an explicit main-derived *separate* integration candidate using only source-reviewed dependencies; CI old original regressions on exact candidate SHA, not only present bounded static tests.
2. **Safety preflight / Founder explicit permission**: actual migration baseline diff, ordered 10 B8 additive SQL candidates + Edge gateway, no migration directly to LIVE without backup/recovery proven, tested rollback / compensating plan for function/trigger additions, local safe fixture, test accounts, Owner AAL2 and RLS negative matrix. **Founder approval required before any production backend/front-end change.**
3. **E2/E5/E3/E4 on reviewed URL**: actual real hosted RLS/Storage byte readback and revoke, Owner/Reporter/Editor role sessions, physical Android single-step manual, private public incognito, same Article UUID/PURL correction, offline/double tap/15m lock, B8 failure shouldn't block News.
4. **External E9 with truth**: genuine provider/office evidence with permitted synthetic/public-interest inquiry, no unsolicited real office messages in preview, late/partial/no-reply and updated summary as separately evidenced events. Locked records only from actual evidence.
5. Only after real official gates and old B0–B7 protection: **B8 FINAL PASS+LOCK, B0–B8 Master ZIP/SPCK safe source + tests + backend instructions WITHOUT secrets, NEWS SOFT LAUNCH**. First real paid B7 advertisement remains after NEWS soft launch.

**Founder manual action right now: NONE.** Next critical Founder decision is explicit authorized release/migration on exact reviewed candidate, and later real Android steps. Do not request password or key in chat.
