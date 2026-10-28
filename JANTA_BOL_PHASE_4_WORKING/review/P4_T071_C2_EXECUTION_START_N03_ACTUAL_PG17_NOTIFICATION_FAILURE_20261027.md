# JANTA BOL — P4-T071 / C2: Execution Started, Genuine N03 Isolated Failure

**Date:** 27 October 2026 IST  
**Founder decision:** Start **C2** immediately while **C1** remains **HOLD pending Vercel exact-SHA Preview and authorized hosted public/Founder checks**. Do not pretend that C1 closed; resume it when account permits safe Preview.  
**Binding authority:** Original Phase4 Master p.304 T071 RECOV-019–026, C2 Gate in T071 Closure Route V1.0. Custom domain **JANTABOL.in** is **DUE outside T071**. Do not confuse website DNS with the thirteen module failure domains.

## Executed real new C2 result (NOT a mock backend)

**GitHub Actions run `40528474982`, job `122274421572` — SUCCESS**, branch `codex/b11-t071-failure-isolation-preflight-20261027`, exact execution SHA `dc2d42db3f9b2d9dc950b4ce877bc8526accce38`.

- CI ran **genuine PostgreSQL 17** as a disposable GitHub Actions service, database `jb_t071_c2`, only local loopback connection.
- Independently checked out **unchanged actual existing B8 source SHA `658f474d6ee0f24efac60f069979e8adee1e9221`** and applied **15** project-authored G1–G4 SQL fixtures/migrations. No mock DB; authentication AAL2 in this fixture remains **synthetic**, not Founder login.
- **Baseline:** Inserted real synthetic B3 `public.live_notifications` record, confirmed persisted.
- **Injected actual backend failure:** A disposable PostgreSQL `CHECK (false) NOT VALID` constraint made *new notification writes* reject with actual `check_violation` while leaving existing notification records unchanged. This is a controlled **notification-store failure**, not an external email/WhatsApp outage.
- **Core continuity proof:** While the real notification store was rejecting writes, invoked genuine original B8 `jb_b8_g1_owner_create_case(...)` under synthetic authenticated Owner/AAL2 fixture, committed a new synthetic case. Independently re-read that committed Case UUID and original published Article and requested Ad sentinel records. Old notification persisted, rejected new notification did **not** appear falsely delivered.
- **Recovery:** Removed only the disposable fault constraint and inserted a fresh notification; independently checked notification and committed Case both remained present.
- **Actual GitHub log assertions:**
  ```
  C2_AUTHENTIC_B8_G1_TO_G4_APPLIED_LOCAL_ONLY=15
  T071_C2_REAL_NOTIFICATION_STORAGE_WRITE_FAILURE=OBSERVED
  T071_C2_REAL_B8_CORE_CASE_COMMITTED_DURING_NOTIFICATION_OUTAGE=PASS
  T071_C2_ORIGINAL_NEWS_AD_AND_OLD_NOTIFICATION_STABLE=PASS
  T071_C2_REAL_NOTIFICATION_RECOVERED_AND_COMMITTED_CASE_PRESERVED=PASS
  T071_C2_NOTIFICATIONS_REAL_PG17_COMPONENT_SCOPE=PASS
  T071_C2_EXTERNAL_MESSAGING_PROVIDER_FAILURE=NOT_TESTED
  T071_C2_FULL_INTEGRATED_NOTIFICATIONS_E8=HOLD
  T071_FINAL_PASS_LOCK=false
  ```
- New test script `ci/phase4/b11/t071-c2-notification-storage-real-pg17.sql`; new guarded workflow `.github/workflows/b11-t071-c2-notification-real-pg17-failure.yml`. Strict repo + exact source SHA + PGHOST/PGDATABASE + missing prod credentials guards. **No production Supabase SQL, Vercel deployment, GitHub Main merge, Ads payment or LIVE stream modification.**

## C2 13-family real proof matrix — scope-aware, no inflated PASS

| # | Module | Existing source/VM simulated failure | Additional genuine backend proof | Full connected C2/E8 status |
|---:|---|---|---|---|
| 01 | Social | PASS scoped | None | HOLD |
| 02 | Analytics | PASS scoped | None | HOLD |
| 03 | **Notifications** | PASS scoped | **NEW: actual disposable PG17 source-backed storage insert outage, committed B8 case + published Article/Ad unaffected, module recovered** | **HOLD** — real full product delivery/audit not tested |
| 04 | Grievance | PASS scoped | None | HOLD |
| 05 | Compliance | PASS scoped | None | HOLD |
| 06 | Advertising | PASS scoped | Core old Ad sentinel survived N03 outage | HOLD |
| 07 | Search | PASS scoped | Read-only B9 anon search in earlier C1 audit, but not real failure | HOLD |
| 08 | **Accountability** | PASS scoped | **PREVIOUS: real disposable PG17 public-feed RPC outage/peer-case RPC survives, `40504645684`** | **HOLD** — complete integrated E8 not tested |
| 09 | LIVE | PASS scoped | Current Supabase read-only status OFF only, not fault injection | HOLD |
| 10 | Provider | PASS scoped | None | HOLD |
| 11 | Payments | PASS scoped | Ad requested sentinel stable while N03 failed; no payment proof | HOLD |
| 12 | Messaging | PASS scoped | **External messaging failure not tested**; N03 local notification store does not imply provider handoff success | HOLD |
| 13 | Database | PASS scoped | PREVIOUS real disposable PG17 crash/restore `40501228346`, **one synthetic acknowledged post-checkpoint row lost** | HOLD |

**Numerical discipline:** **13/13 source-VM test probes**, **two distinct module families (Notifications, Accountability) now have a narrow real PG17 module-fault observation**, plus real local DB crash/restore. **Zero family is certified for final integrated full-stack E8.** The data-layer recovery proof is not a third fully accepted module.

## C1 deferred, C2 active, C3–C5 unchanged
- **C1:** HOLD — exact-source hosted preview and real logged-out Article/Owner publishing remain needed; C1 secure public Article RPC fix already tested in **draft PR #47**, not deployed. Vercel Hobby free API cap previously returned 402. No more C1 restarts purely to generate previews during the cap.
- **C2:** **IN PROGRESS**. The N03 partial backend proof is accepted for its exact scope. All 13 original families remain tracked; only original Gate C2, not a new C2 subgate.
- **C3:** PARTIAL practical local RPO/RTO, Founder recovery risk review as per existing route.
- **C4:** PARTIAL original E1/E5 integrated logs/regressions.
- **C5:** HOLD independent E8/Founder final.
- **T071 FINAL PASS+LOCK:** HOLD. **T072 not started.**
- **JANTABOL.in:** Website domain remains DUE separately; paid hosting or DNS is **not** a requirement for C2 local backend testing.

**Next C2 backend-only candidates:** actual Grievance and Compliance private-scope failure isolation, then B7 Advertisement/payment fail-closed, Search and LIVE/provider/messaging as available. Do not enable undeployed B7 review-only RPCs or perform live payment/messaging/provider faults merely for a test. Android manual proof only if unavoidable after isolated tests.
