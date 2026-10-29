# JANTA BOL — Phase-4 B8 G4 CP04 FINAL ENGINEERING CHECKPOINT
**DATE:** 17 October 2026. **Founder mandate:** "continue kro or complete hone pe report kro". **Goal:** Phase-4 News Soft Launch; no-rebuild / no-fake-PASS; no paid service.  
**Tested source SHA:** `a185ead49a5fa842fabc77f4357608649caa4e83`. **Branch:** `codex/b8-g0-g1-accountability-20261017`.  
**Real GitHub CI:** [#39012787537](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/39012787537) — **2/2 SUCCESS**.  
**Conclusion:** **G4 CP01–CP04 ENGINEERING SOURCE/ISOLATED CI COMPLETE (candidate GREEN), NOT real Hosted/Android FINAL PASS+LOCK. G5 original E-class testing remains DUE.**

## 1. Source of truth and exact prior checkpoint
Original B8 accountability Topic13 §§825–923, ACC001–051, P4-T092..099 and Founder FD-B8-01..06 are business requirement authorities. Reviewed G4 CP01–03 source SHA `2e19947dc540cd42097066da765abdb3cd6029d4` and CI [#39011472365](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/39011472365) already proved bounded PostgreSQL17 private-by-default server projection, Owner-AAL2 PUBLISH/REVISE/HIDE, no R2-public projection, server-controlled timeline codes, original published Article UUID canonical link, 15/15 public Node tests. A prior flaky G4 old-Article link order was fixed using an append-only stable `linked_order` identity; original core News publisher was not changed.

## 2. CP04 exact work completed — new proof rather than repeated design
**(a) PUBLIC mobile/client privacy bug fix:** `JANTA_BOL_PHASE_3C_WORKING/b8-public-case-ui.mjs` previously awaited a server-approved Case and could draw that OLD response after a newer request had already returned no Case because Founder HIDE occurred. Implemented monotonically increasing `requestEpoch` so **only the newest request can update the DOM**. HIDE/unapproved/no longer public clears the current card. Android return / back-forward cache triggers a fresh public RPC instead of trusting a stale displayed card; no periodic background polling or new paid calls.
**(b) Real PostgreSQL17 two-session deletion-vs-revision race:** `ci/phase4/b8-g4-cp04-owner-hide-race-pg17.sh` runs only if `PGDATABASE=jb_b8_g1`. Creates a SYNTHETIC approved R1 Case. Session A records a Founder-AAL2 HIDE while locking the Case row and pauses before transaction rollback. Session B's simultaneous Owner REVISE attempt **times out on row lock**, proving HIDE/REVISE cannot cross each other unnoticed. Session A rolls back (old approved snapshot remains), then an actual HIDE **commits** in a separate session. A fresh independent `anon` PostgreSQL role query sees **NULL** and the public feed sees **[]**. NO LIVE data involved; DB thrown away after CI.
**(c) Browser-controller behavior regression:** `ci/phase4/b8-g4-cp04-public-browser-lifecycle.test.mjs` imports the actual public controller with synthetic DOM. Forces old allowed RPC to return **after** a newer HIDE response; confirms the previous approved case does **not** reappear. Also tests mobile visibility return re-checks the server. **1/1 Node test PASS**.
**(d) Integrated protected CI:** Existing B8-only workflow `.github/workflows/b8-g0-g1-disposable-pg17-and-protected-static.yml` now executes both additional G4 CP04 tests while preserving all G1/G2/G3 actual synthetic PG17, previously frozen G4 CP01–03 regression, Phase3 News/Auth original STATIC and B7 first-paid HOLD checks.
**No** change to existing `articles`, `article_sources`, Phase2/Phase3 publishing, Article HTML, Legacy B0–B7 code, production Supabase, Vercel or Cricket.

## 3. Actual real test evidence and regression
**GitHub #39012787537; source SHA `a185ead49a5fa842fabc77f4357608649caa4e83`; all 2 CI jobs SUCCESS.**
- PostgreSQL17 log: `B8 G4 CP04 PASS: real two-session Owner HIDE/REVISE lock serialization, rollback, separate-session committed anon NULL and feed []`.
- Previous G4: `B8 G4 FULL disposable PG17 privacy/founder/revision/timeline/article/correction/hide/republish ROLLBACK PASS`.
- New actual UI controller **1/1 PASS**; prior G4 PUBLIC Node tests **15/15 PASS**, G3 role tests **14/14** and **13/13**, G2 mock private byte-gateway **10/10**. B7 original truth checks and protected Phase3 STATIC checks GREEN. **Total explicit bounded JS suites listed: 1+15+14+13+10=53 tests**, but different test categories: mocks/static are not physical device E3.
- Normal expected PostgreSQL lock-timeout lines are emitted inside NEGATIVE race tests as proof of lock rejection; final G4 job CONCLUSION **SUCCESS** and all probes pass. No fake fail suppression; fail on unexpected lock result.

## 4. Real hosted / release source verification — CRITICAL
A strict **read-only** live Supabase catalog check found `public.b8_g4_public_revisions` and `public.b8_g4_public_milestones` **ABSENT** (both null) and G4 public RPCs **0**, so this engineering source is NOT in hosted production. No G1–G4 change applied to the user’s LIVE database.
GitHub's actual `main` versus working branch comparison returns **DIVERGED**, current review branch approximately **1180 ahead / 115 behind main** at this snapshot. This is a real **E7 source-parity RELEASE BLOCKER**. DO NOT blind-merge/rebase a 1000+ commit review branch or deploy its static page without a tested cherry-pick/migration/order plan and legacy News/B0–B7 strict regression. GitHub `main` is NOT proof of actual deployed production SHA; Vercel domain source must also be verified before release.
The original Article correction NOTE visible on the true public Article page is NOT proven by the synthetic Article version increment. Actual Owner AAL2/Reporter/Editor sessions and private files are NOT exercised through a real Android phone. Without actual authorities/providers, one cannot assert officer email/WhatsApp received or a genuine reply.

## 5. G4 completion definition
| Milestone | Status |
| --- | --- |
| CP01 strict server dictionary Public projection | CODED / PG17 isolated PASS |
| CP02 privacy-safe public timeline with immutable Founder approval/HIDE | CODED / PG17 isolated PASS |
| CP03 original Article UUID and separate follow-up links | CODED / PG17 isolated PASS, visible correction still E3/E4 DUE |
| CP04 concurrency, stale Android response, tab resume | CODED / real PG17 2-session and 1/1 controller PASS |
| Original protected Phase3 static / B7 truthful HOLD | CI PASS (static/bounded, NOT original full E3) |
| LIVE Backend/Vercel, Owner AAL2 / physical Android E3/E5 | NOT RUN — real release evidence gate |
| Original 8 Official B8 tests P4-T092–T099 | **0/8 FINAL PASS/LOCK** |
| Original ACC001–051 evidence matrix | **0/51 FULL E-CLASS ACCEPTANCE** |
| **G4 engineering checkpoints CP01–CP04** | **COMPLETE+GREEN, engineering-only** |
| **G4 whole FINAL PASS+LOCK** | **HOLD** until E2 hosted, E3 Android, E5, E7 source parity and applicable E9 |

## 6. Exact next step, without delaying independent work
**G5 = bounded REAL E1/E2/E3/E4/E5/E7/E9 original Accountability tests.**
1. **E7 parity/transport preflight:** pick exact reviewed release baseline, inspect entire current `main` divergence and actual Vercel Preview/Production source SHA; produce dependency-ordered G1→G4 create-only migrations, backup/recovery plan and isolate. No destructive SQL on LIVE.
2. **Only after explicit Founder release approval:** make a safe verified hosted environment on existing Free resources, smoke Supabase RLS/active roles/MFA/private Storage readback/error/revoke, authenticated Reporter→Editor→Founder and anon incognito public timeline (E2/E3/E5).
3. Verify real permanent Article link, corrections on same PURL, private source leak rejection, original B0–B7 regression, honest OFFICIAL E9 response evidence. If actual reply not offered or received, record NOT_RECEIVED/NOT_VERIFIED, **not PASS**.
4. Keep B7 first real paid Ad **HOLD until after NEWS Soft Launch** and distinguish that deferral from non-negotiable B8 safety requirements.

**No Founder manual input needed for G4 source/isolated CI. A Founder approval is required before any production deployment/source switch. No LIVE mutation done.** 
