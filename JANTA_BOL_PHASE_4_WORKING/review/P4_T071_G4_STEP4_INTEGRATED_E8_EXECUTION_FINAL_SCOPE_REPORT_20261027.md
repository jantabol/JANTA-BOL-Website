# JANTA BOL — Phase 4 / P4-T071 — STEP 4 Integrated E8 Execution, Single-Shot Report
**Date:** 27 October 2026 IST. **Rule:** Original Master page 304, `P4-T071`, `RECOV-019–026`, `Sections 600–616`: controlled cross-module faults + pragmatic recovery objectives + E1/E2/E5/E8 + original core News/LIVE regressions. Master **does NOT explicitly require paid hosted testing**.

## Executive verdict
**REAL BACKEND COMPONENT INTEGRATION: 1 scoped PG17 module fault + recovery PASSED.**  
**INDEPENDENT E8 FULL SYSTEM: HOLD — NOT COMPLETE, NOT LOCKED.**  
Cannot call source-VM simulated failures, local synthetic PG17, or a single-module SQL integration the independent integrated 13-domain E8 acceptance.

## Original connected source and independent GitHub evidence actually executed
- Repository: `jantabol/JANTA-BOL-Website`, PR **#45**, branch `codex/b11-t071-failure-isolation-preflight-20261027`; unmerged.
- **NEW verified real backend integration**: CI GitHub Actions **run `40504645684`**, job **`122190733649`**, exact test-code HEAD **`47a0073828974c30b2131e8605f4ed61bac7b5db`**, **SUCCESS**. Exact B8 source was checked out separately at SHA **`658f474d6ee0f24efac60f069979e8adee1e9221`**; 15 authentic existing B8 G1–G4 migrations/fixture slices applied into a disposable **PostgreSQL 17** Github service DB only. No JS stub used for the actual backend RPC under test.
- **Actual failure and recovery:** Created synthetic Founder AAL2 approved Accountability Case with preserved published original Article; verified real `jb_b8_g4_public_feed(12)` as `anon`. Within a rollback-only transaction, revoked `anon` EXECUTE **only for the public Accountability feed function**, verified the *actual SQL permission denied* error. The separately callable `jb_b8_g4_public_case(uuid)` returned correct real-case data while feed was broken; original published Article sentinel and Ad-request sentinel unchanged. Restored scoped EXECUTE, verified feed returns the same approved case and independent case lookup still works; **ROLLBACK**.
- Original log lines independently read:
  ```
  T071_G4_B8_ACTUAL_SCOPED_MIGRATIONS_APPLIED=15
  T071_REAL_PG17_B8_ACCOUNTABILITY_FEED_MODULE_FAULT=PASS
  T071_REAL_PG17_CASE_RPC_SURVIVED_FEED_OUTAGE=PASS
  T071_REAL_PG17_ORIGINAL_ARTICLE_AD_ROWS_UNCHANGED=PASS
  T071_REAL_PG17_ACCOUNTABILITY_FEED_RPC_RESTORED=PASS
  T071_REAL_PG17_SOURCE_TRANSACTION_ROLLBACK=PASS
  T071_FULL_INTEGRATED_ALL_13_DOMAINS=NOT_PROVEN
  T071_FULL_E8_FINAL_LOCK=HOLD
  ```
- Reviewed SQL script: `ci/phase4/b11/t071-e8-b8-real-db-module-isolation.sql` (explicitly refuses non-synthetic database). CI workflow: `.github/workflows/b11-t071-e8-real-pg17-b8-component-failure.yml`. All original source migrations from a separate pin; direct PG17 SQL backend, not application/browser E2E; database is disposable and no real data left after runner completion.

### Previous independently verified tests (do not double count)
1. `40498177713`, job `122168854308`: **80/80** selected Node tests PASS (13 actual source adapters with **FAKE failing dependency responses**; not actual backend integration).
2. `40501228346`, job `122179118305`: isolated PG17 **real database crash/restore** PASS, scope-only RPO point age **0.422s**, scope-only RTO **1.261s**, **one synthetic acknowledged post-checkpoint Article lost**. Not a Production RPO/RTO.
3. `40502445962`, job `122183220235`: independent E1/E2/E5 evidence reconciliation, **21/21 PASS**, with source pin/digest/timepoint and false-E8 assertions rejected; explicitly `E8_FULL=HOLD`.

## T071 13-domain contract evidence ledger
These lines distinguish (1) actual JS adapter with isolated fake failure from (2) **real backend** in disposable SQL from (3) **complete integrated E8**:

| Failure family | Simulated failure exercised against exact JS source | Real disposable PG17 backend | Full independent integrated E8 |
|---|---|---|---|
| Social | PASS | NOT PROVEN | HOLD |
| Analytics | PASS | NOT PROVEN | HOLD |
| Notifications | PASS | NOT PROVEN | HOLD |
| Grievance | PASS | NOT PROVEN | HOLD |
| Compliance | PASS | NOT PROVEN | HOLD |
| Advertising | PASS | Core synthetic Ad row parity only | HOLD |
| Search | PASS | Existing live `anon` B9 RPC read-only success (not failure) | HOLD |
| Accountability | PASS | **REAL PG17 feed RPC fault, peer case RPC alive, recovery verified** | HOLD — full website/private/public lifecycle and audit |
| LIVE | PASS | NOT PROVEN | HOLD |
| Provider | PASS | NOT PROVEN | HOLD |
| Payments | PASS | Synthetic Ad sentinel parity only | HOLD |
| Messaging | PASS | NOT PROVEN | HOLD |
| Database | PASS | Local PG17 real crash/restore; no real JANTA BOL Auth/Edge | HOLD |

**Conclusions:** 13/13 scoped source VM failure probes PASS; **1/13 actual source-function-backed, disposable PG17 scoped domain-isolation faults PASS**; 0/13 domain families have **complete full-system integrated E8 accepted**. These are deliberately distinct measures.

## External read-only independent source and app regression
- GitHub protected `main`: `f447231c0677644ca5a44cc19f12cf0314ff38ea`; Vercel prod deployment `dpl_nFSo2MXg3ASBPgUfXRYDzv2ybP8C`, same SHA and READY **unchanged**.
- Production GET still returned public static `🔴 LIVE` + unverified allegation/closure snippets. A pending reviewed public-truth/branding/Search branch remains **unmerged**, so this is a **real separate Soft Launch editorial blocker**; not a conclusion about the truth of any allegation.
- Connected Supabase read-only: 100/100 public base tables had RLS; raw `anon SELECT public.articles` denied, raw `anon SELECT public.grievance_evidence` denied; `anon jb_b9_search('T032')` returns one public RPC record. Existing public homepage `listPublishedPublic` uses direct `from('articles')`: possible true-logged-out public-feed gap requiring separate end-to-end check, not license to open tables.
- Production Supabase writes/migrations **none**. Vercel production deployment/alias **none**. Main merges **none**; user photo/manually provided screenshots not treated as independent authenticated backend test.

## Exactly why T071 Final E8 cannot be LOCKED from available evidence
1. We have **no isolated, authentic, cross-connected runtime** that exercises ALL mandatory failure families at actual server/persistence boundaries: Social/Analytics/Notification, Grievance/Compliance, Ad/Payment, Search/Accountability, LIVE/provider/messaging and Database *together with Core Publishing and LIVE regressions*. Full restored current-system Auth/Edge/messaging/provider wiring and DB/Storage same-point clone have **not been verified available**. We did not sabotage production as a shortcut.
2. Real-world RPO/RTO eligibility and a practical acceptance threshold for JANTA BOL not yet established. G3's 0.422/1.261 seconds are local fixture numbers, not project targets.
3. Founder and independent release evidence across the authentic deployed code revision, actual failure negatives, persistence readback, log identity and recovery remain absent. Master expects E8 proof; it does not require any particular paid host.
4. Existing Soft Launch production is serving static unreviewed content; public access needs verified logged-out experience. This is separate risk and cannot be hidden inside a T071 technical green badge.

## Honest final decision and safe next action
- **STEP 4 newly achieved:** one real, server-backed optional-module failure/recovery of authentic B8 SQL, with original Article and Ad-record noninterference, is **PASS for scoped PostgreSQL 17 evidence**.
- **Complete 13-domain independent E8:** **HOLD**. **T071 FINAL PASS+LOCK = HOLD.** **T070 FULL E8 = HOLD.**
- **Founder manual step today:** none for this isolated SQL execution; however no further full-system E8 approval can be substantiated without authoritatively available isolated integrated source/restore, practical recovery limits, and genuine end-to-end logs. Do not pay, create new projects, expose secrets, broaden privileges, delete Articles, or merge main merely to force a PASS.
- **Soft Launch remains higher priority:** correct public truth and verify logged-out read flow; preserve Article PURLs, Ads, Founder controls.
