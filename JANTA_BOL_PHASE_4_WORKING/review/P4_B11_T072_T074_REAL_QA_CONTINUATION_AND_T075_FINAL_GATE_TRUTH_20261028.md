# JANTA BOL — B11 Topic10 / T072–T074 Real Execution Continuation, T075 Release-Readiness Truth

**Date:** 28 October 2026 India. **Founder direction:** avoid cycling C1/C2; prioritize completion of Topic10 B11 and safe JANTABOL.in soft launch, preserve old work, no fake PASS. **Master:** Phase4 p.304–305, original P4-T069–075 / RECOV-002–052. This document is an exact execution checkpoint, **NOT** a T075 Final PASS/LOCK or Production release.

## 1. Today's real T072 source-backend tests
Real original B8 SQL, immutable checkout 89849ba47f443f423d8bfe4f966bb2d38087201f and actual full deployed web candidate source 659bcdc2ec4e270ea066863b4b456aeb65cb7c73.

1. Original source retry test **GitHub Actions 40641234256 / job 122659625732 SUCCESS** on **disposable actual PostgreSQL17**; records first original Owner/AAL2 protected case create, ambiguous acknowledgement retry of same inputs, **two distinct case rows => TRUE P2 OPEN**. Do **NOT** call the old case-create RPC idempotent. Original failed write forced actual PostgreSQL CHECK violation -> no false acknowledged write, previously committed synthetic Article and Ad unaffected; stale Owner session denied; original reporter-grant repeat used existing ON CONFLICT and stayed one row. Original T072 source action is NOT safely idempotent on retry. The initial diagnostic workflow run 40639713658 FAILED on a *test-temp-table privilege* bug, corrected in 40639793428 and independently reconfirmed in 40641234256.
2. Exact additive **REVIEW_ONLY**, **UNDEPLOYED** Owner request-UUID idempotency ledger/RPC proposal: GitHub Actions **40640041648 / job 122655813819 SUCCESS** genuine disposable PG17. Same owner+key+same inputs return one ID, changed payload denied, new key same title permitted, missing backend write rolls back case+ledger, post-repair retry stable, current Owner/AAL2 read remains protected and direct anon ledger denied. **The original B8 old create RPC remains unchanged and duplicate-prone; no real Android request-key persistence or hosted E2/E5**. The safe fix is only a proven component proposal. No live Supabase migration authorized/deployed.

**T072 scoped:** partial-write, fail-closed, reporter-grant retry PASS; original critical case create idempotency **FAIL/P2 OPEN**; proposed additive component PASS but not activated. **T072 FINAL HOLD**.

## 2. Today's real T073 negative security/rollback drills
GitHub Actions **40641468000 / job 122660356938 SUCCESS**, original B8 source, real isolated PG17 `jb_t073_security`, source SHA pinned:
- Invalid case risk lane update => real CHECK violation, original risk lane intact.
- Original linked case DELETE => real FK RESTRICT violation, reporter/grievance case relationship persists. **This is not proof of soft-delete.**
- Original protected Owner RPC EXECUTE REVOKE to authenticated => real PostgreSQL permission denied, then local restore.
- Additive proposed T072 DDL loaded inside actual PostgreSQL transaction then `ROLLBACK` => new table/function absent after, old Article, Ad and case/grant identities intact.
- Original Owner/AAL2 function after local repair => new authorized synthetic case, old data preserved.

**T073 scoped:** original source-negative data/role guards and local SQL transaction rollback PASS. **Full T073 HOLD**: actual credential compromise/key rotation, real failed deployment recovery, production config and whole-integrated post-incident security E8 **NOT PERFORMED**; no Production secret or user session touched. Evidence file `P4_T073_REAL_PG17_SECURITY_CORRUPTION_ROLLBACK_VERIFIED_20261028.md`.

## 3. Today's real T074 independent authentic restore evidence replay
GitHub Actions **40641729197 / job 122661179404 SUCCESS; 5/5 independent read-only Node evidence tests PASS**:
- Independently fetched exact real protected **T034** GitHub job **40223103797 / 121258741884**, actual encrypted offsite JANTA BOL DB backup restored to disposable PG17: source→clone **26 data metrics**, **16 deep security metrics** exact; actual DB restored TRUE, **storage bytes false / platform config false**.
- Independently fetched exact Founder-approved protected **T069** original private/public 5 Storage media readback/restore **40274621191 / 121414622988**, original 5/5 actual bytes passed, offsite media restored TRUE, **PostgreSQL/platform config false**.
- These are **two different backup runs/capture points**, separated substantially in time, **NOT a coherent one-run DB+original-five-media+Auth+Edge+Vercel restore**. Old actual T070 G17 phone/tablet **SYNCED • Version2** same draft is a **two-device sample only**, not proof device is lost/recovered or all offline drafts safe.
- **T074 FINAL HOLD** pending actual original same-point combined recoverable service, independent private offsite access, Auth/AAL2/Edge and Founder device-loss test. No additional secrets requested here.

## 4. Original Topic10 B11 status and safe release priority

| Original Test | Actual evidence | Original full lock |
|---|---|---|
| T069 | Actual independent encrypted DB/media backup components and health inventory; GitHub source/ZIP separate from DB | check prior original T069 final authority, do not automatically conflate component proofs |
| T070 | Real offline DB and five original media restore **separately**, synthetic joint restore; genuine same-point original DB+Storage+Auth+Edge recovery not proved | **HOLD** |
| T071 | C1 real Founder publish + Incognito guest; C2 all 13 source families in same isolated runner 40638596053; C3 local failure/recovery and conservative Founder policy; C4 E5 independent GH 13 timestamps; C5 scoped independent audit | **FULL E8 HOLD** |
| T072 | Actual original retry duplicate case **P2 OPEN**, additive minimal fix only in disposable PG17 | **HOLD** |
| T073 | Actual original source DB corruption/delete/permission/rollback negatives PASS scoped | **HOLD** (credential, live deployment rollback not tested) |
| T074 | Actual independent real protected prior DB & Media restore log proof 5/5; no same-point Auth/Edge restored, no real device loss | **HOLD** |
| T075 | Required automated backup/health/runbook, prior Phase3A Live recovery, coverage E1/E3/E7/E8 and final independent full gate | **NOT FULLY EXECUTED, NO FINAL LOCK** |

### Next executable items without wasting time on C1/C2
- Preserve B11 T071 original 13-family scope results once; **do not rerun C1/C2 local failure suites** without an actual source/regression change.
- T072: perform minimum-fix client request-key persistence and actual protected backend migration only after narrow explicit Founder approval/independent release security, or prove this B8 module is actually release-OFF and document no activation; cannot call original idempotency PASS.
- T070/T074: actual coherent original encrypted DB+Storage+Auth/Edge restore requires a secure isolated recovery environment, verified safe write-point and Founder secret custody. **Never** put AGE keys, private media, service_role, JWT or person-identifying records in public GH/ChatGPT logs. The earlier independent protected real backup jobs are valuable but do not remove this blocker.
- T073: realistic failed deploy/rollback and credential compromise **in isolated permitted environment**, do not rotate real Production passwords just for a badge.
- T075: final RUN-10 independent evidence gate and Founder final authority remains due. Moving to JANTABOL.in Soft Launch/Topic11 requires explicitly scoped release risk acceptance, public truth/branding/API/domain route and real Production release proof; **existing Git main/Vercel Production is still older SHA** while safe ISRO article is in a candidate Preview. No fake launched domain claim.

### Boundaries preserved
No JANTA BOL production SQL/RLS/Article or payment data changed, no Git main merge or Vercel Production promotion, no external service outage, no private video/media/object download to public CI, no paid deployment, no Cricket/Saarthi change. All new source is **tests, proposed add-only review SQL, CI and evidence** on review branches.

**Current defensible verdict: T072 P2 FOUND + proposed component fix PASS; T073 scoped PASS; T074 independent historic original backup authenticity PASS; B11 T075 FINAL HOLD.**
