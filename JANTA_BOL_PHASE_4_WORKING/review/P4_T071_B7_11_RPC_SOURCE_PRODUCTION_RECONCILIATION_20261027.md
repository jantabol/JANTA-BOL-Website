# JANTA BOL — P4-T071 / B7 — Eleven-RPC Source-to-Production Reconciliation

**Date:** 27 October 2026 IST. **Founder direction:** Start reconciliation of 11 missing RPCs, no rebuild, no fake PASS, do not damage prior working code, Soft Launch first. **Custom hostname `jantaboli.in`: DUE, not connected or tested.**

## Decision

**SOURCE/REVIEWED-MIGRATION/LIVE-FUNCTION-NAME RECONCILIATION — PASS (DOCUMENTARY ONLY).**

**Real production deployment and complete T071 E8 fault-isolation acceptance — HOLD, NOT LOCKED.**

This is **NOT an order to apply 11 functions**. The 11 missing names are explained by the separation between a newer candidate B7 client and **review-only/disposable** migration material that the old live project has not been authorized to run.

### Verifiable executed evidence

1. **Connected JANTA BOL Supabase project `vrffsnkycvjithwtiylt`, read-only catalog:** 27 distinct RPC names referenced by pinned `JANTA_BOL_PHASE_3C_WORKING/phase4-domain-client.js`; **16 names present**, **11 absent** under `public.pg_proc`. This checks presence by exact function **name**, not successful invocation or deployed signature-semantic parity. Query was `BEGIN TRANSACTION READ ONLY` ... `ROLLBACK`. Secondary read-only enumeration recovered actual signatures and `anon`/`authenticated` EXECUTE ACLs for 16 existing names. No payment, ad activation, notifications, source edits, private records or production RPC commands.
2. **Pinned actual candidate B8 source** `658f474d6ee0f24efac60f069979e8adee1e9221`: independent GitHub Actions runner rechecked all **27** `rpc('jb_...')` exact names, precisely **11** absences and **16** present-name entries, plus source safety gates.
3. **Official GitHub Actions run `40511005431`, job `122212589053`, source HEAD `13e122cceb2e5a1fc3dfd2e5af49114e1e794249`: SUCCESS, 20/20 tests PASS, 0 FAIL.** This includes a positive 11-name exact source/SQL audit, 18 adversarial negative checks (forged presence, bad path, fake production clearance, fabricated Founder approval, wrong project, wrong sentinel, and catalog count drift), and final fail-closed release confirmation.
4. Script `ci/phase4/b11/t071-rpc-reconciliation.mjs`; tests `ci/phase4/b11/t071-rpc-reconciliation.test.mjs`; machine-readable register `ci/phase4/b11/t071-rpc-reconciliation-manifest-20261027.json`; read-only workflow `.github/workflows/b11-t071-rpc-11-abi-reconciliation.yml`. The runner has **no** production Supabase access, no token, no SQL execution, no production deployment ability.

## Exact eleven-name source mapping

| # | Absent RPC in currently connected LIVE `public.pg_proc` | Source of intended function/guard | Exact reconciliation finding |
|---:|---|---|---|
| 1 | `jb_ad_confirm_manual_payment_internal` | `db/20261010_b7_manual_payment_REVIEW_ONLY.sql` | Actual function **defined in review-only candidate SQL**; missing in LIVE. Bank-ledger evidence/consent cannot be assumed operational. |
| 2 | `jb_ad_creative_workflow_capability_internal` | `db/20261012_b7_creative_draft_approval_REVIEW_ONLY.sql` | Defined only in review candidate. Its absence prevents accidentally calling legacy creative save/auto-approval. |
| 3 | `jb_ad_decide_change_request_internal` | `db/20261010_b7_portal_text_change_REVIEW_ONLY.sql` | Review-only moderation function, not proven live. |
| 4 | `jb_ad_lifecycle_capability_internal` | `db/20261012_b7_lifecycle_state_guard_REVIEW_ONLY.sql` | **Intentionally NOT defined by this migration.** Header explicitly states “DO NOT CREATE lifecycle-capability sentinel until all B7 release gates hold.” New client blocks positive `approved/payment_pending/live` promotion without the sentinel. |
| 5 | `jb_ad_notification_failures_internal` | `db/20261010_b7_unified_notifications_REVIEW_ONLY.sql` | Defined in review candidate; missing LIVE. Do not interpret RPC failure as empty notifications. |
| 6 | `jb_ad_notification_retry_internal` | Same notification review migration | Defined in review candidate; missing LIVE. No unverified real delivery/retry confirmation. |
| 7 | `jb_ad_owner_change_requests_internal` | `db/20261010_b7_portal_text_change_REVIEW_ONLY.sql` | Review queue and portal-readiness sentinel; absence prevents unsafe legacy portal path from being treated as ready. |
| 8 | `jb_ad_owner_renewals_internal` | Same portal review migration | Review queue not live. Do not invent zero pending renewals. |
| 9 | `jb_ad_qualified_analytics_internal` | `db/20261010_b7_qualified_impressions_REVIEW_ONLY.sql` | Review-only analytics; even candidate metrics are *client-reported estimate*, NOT independently verified people or clicks. |
| 10 | `jb_ad_safety_transition_idempotent_internal` | `db/20261016_b7_t036_revocation_replay_REVIEW_ONLY.sql` | New optional safety bridge defined in disposable candidate; missing LIVE. Must preserve existing Founder emergency HIDE/PAUSE path, not bypass it. |
| 11 | `jb_ad_set_approved_quote_internal` | `db/20261010_b7_manual_payment_REVIEW_ONLY.sql` | Reviewed quote/terms locking only; absent live. No fabricated approved price or paid state. |

**Classification:** **10/11 exact candidate function definitions exist in reviewed SQL; 1/11 is an intentionally omitted, explicit safety sentinel.** This is not "11 broken runtime calls": they are undeployed reviewed capabilities. Their status must be considered at the **specific deployed release revision**, not inferred from PR candidate UI.

## Specific safety findings

- Real existing RPCs such as `jb_ad_transition_internal`, `jb_ad_save_creative_internal`, `jb_ad_schedule_internal`, `jb_ad_public_packages`, and 3 variants of `jb_ad_public_request` still exist, **but presence alone is NOT semantic equivalence** to the stronger B7 review-only functions.
- Newer candidate JS includes `B7_SAFE_LIFECYCLE_BACKEND_NOT_DEPLOYED`, `B7_TWO_STAGE_CREATIVE_BACKEND_NOT_DEPLOYED`, `B7_LEGACY_PAYMENT_CONFIRMATION_DISABLED_USE_MANUAL_EVIDENCE`, `B7_SAFE_PORTAL_BACKEND_REQUIRED`, `QUALIFIED_ANALYTICS_NOT_AVAILABLE`. The audited source guards intentionally avoid falsely treating absent upgraded backend as paid/LIVE-ready.
- **Additional read-only concern (separate soft-launch intake test):** Existing LIVE `jb_ad_public_request` overloads were present but all had `anon_can_exec=false`; this only proves direct anonymous privilege restrictions, not full public advertiser intake failure. The Founder should avoid claiming anonymous paid Ad booking operational without an actual browser/authorized verification. Contact-only soft launch may be used **only if its independent public-safe flow is verified**, not as a privilege bypass.
- Never expose service-role keys, widen `anon` grants, create the sentinel, copy old payment RPCs, switch Paid Ads ON, rewrite old Article URLs, or apply migration files labelled `REVIEW_ONLY` without **separate Founder-approved release gates, safe isolated migration/order/rollback, AAL2/Owner and Android evidence**.
- **No user manual action required for this reconciliation**. DNS `jantaboli.in` is independent and remains DUE. No custom domain should be connected just to satisfy the RPC audit.

## Final status ledger

| Area | Status |
|---|---|
| 27 candidate-client function-name inventory versus live `pg_proc` | **VERIFIED — 16 present / 11 absent** |
| Exact SQL source assignment for all 11 | **PASS — 11/11** |
| 10 source definitions existing in review-only SQL | **PASS — verified** |
| Intentional missing lifecycle capability sentinel | **PASS — explained and safe to leave absent until authorized** |
| Source safety regression and 18 forgery/negative checks | **PASS — 20/20 total CI** |
| Current LIVE database/new candidate atomic backend release parity | **HOLD / NOT DEPLOYED** |
| Remaining 12 modules full real integrated failures/recovery | **HOLD** |
| RPO/RTO LIVE acceptable targets and same-system proof | **NOT ESTABLISHED** |
| Domain `jantaboli.in` | **FOUNDER DUE** |
| **P4-T071 FULL E8 and FINAL PASS+LOCK** | **HOLD — MUST NOT CLAIM LOCKED** |
| **Soft Launch** | **Separate editorial/public-read readiness still required** |

### Execution note

Initial verifier drafts flagged legitimate alternate SQL disclaimers (`SOURCE-ONLY`, `NOT PRODUCTION`) as red despite review-only/no-LIVE policies. The assertion was improved to recognize each **explicit** stop banner while retaining source pin, review-path and NO-LIVE release checks. Only the **final successful** Actions run is accepted above; the earlier RED runs are not hidden or counted.

**Founder priority:** retain safe normal editorial News Publishing/Reading independent of optional paid B7 Ads, without new hosting cost or abandoned prior code. Full 13-domain E8 is a distinct later test and no false PASS is given here.
