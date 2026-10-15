# JANTA BOL / P4-T034 / CP-01 AUDIT CHECKPOINT — 15 OCT 2026
STATUS: CP-01 AUDIT COMPLETE (scope/read-only only). CP-02 coding NOT STARTED. P4-T034 HOLD. NO REAL TEST authorization.

## Sources and authority
- Requirements: Phase-4 Master Execution Pack §§242–339; B7 Final Test Blueprint ADS-001..ADS-009, E2+E3+E5, RUN-06. B11 recovery T069..T075 is independent full-disaster-recovery gate; ADS-008 affected-data recovery is mandatory before payment migration.
- Verified main e70473b8b56ea96f3f7d0e9897a97d766ff68356. Main tree is ONLY 28 entries, mostly backup/restore scripts and minimal public site. It is NOT complete current B7 app source.
- Application/current coding branches: phase4-execution-2026-10-01 (~180 entries) and codex/b7-t034-safe-guard-20261013 (~388 entries). The latter hosts REVIEW-ONLY ADS-008 guard and rollback SQL, synthetic payment fixture and regression. DO NOT assume migration is in main or deployed.
- ADS-009 matrix is separate DRAFT PR #8 with synthetic 5-role checks. Real principal authenticated negative E2/E5 is still due.
- Production authority: JANTA BOL Supabase project vrffsnkycvjithwtiylt (READ-ONLY catalogs only). Cricket project not accessed.

## Canonical ADS test status / remaining proof
ADS-001: 360px homepage/article CTA — earlier Android partial, exact viewport recheck DUE.
ADS-002: WhatsApp mandatory + consent/normalization — earlier scoped E2 PASS, current release recheck DUE.
ADS-003: no forged public creative/media/geo — isolated denial PASS, deployed API matrix DUE.
ADS-004: pending receipt/no publish — scoped deployed E2/E3/E5 recorded, release parity DUE.
ADS-005: duplicate/idempotent abuse — 2-client synthetic concurrent test, live/distributed HTTP behavior DUE.
ADS-006: Owner queue context/privacy — previous Android evidence, final E3 recheck DUE.
ADS-007: verified ordinary advertiser + audit, real Owner AAL2 — synthetic only, E2/E5 DUE.
ADS-008: old HIGH verification=pending campaign payment_pending unable to approve/confirm paid/live — REVIEW-ONLY additive trigger candidate, real DB guard NOT DEPLOYED. E2/E5 and restore G3 HOLD.
ADS-009: anon/advertiser/reporter/Owner without AAL2 denied, no state/audit success — synthetic source-parity only in PR #8; actual role JWT E2/E5 DUE.
NO 9/9 or P4-T034 PASS by blueprint existence, synthetic or mock evidence.

## LIVE read-only evidence on 2026-10-15
- Articles 31; advertisers 7; campaigns 7; payments 0; ad history 27; audit logs 1538; live ads 0.
- Historical high-risk advertiser STILL pending verification with payment_pending campaign: 1. No historical row changed.
- LIVE b7_t034_* guard triggers: ZERO. LIVE b7_t034_* private functions: ZERO.
- Existing p4_ad_guard_confirmed_payment trigger present. Old payment RPCs jb_ad_confirm_payment_internal and jb_ad_record_payment_internal enforce Owner/AAL2 but lack advertiser verification at early confirmed/paid boundary. Function MD5 unchanged: fed4e4f0c3c61091c9bfbeb59802f3a2 and 441749b81dbbc287b4ef752ac1a1e9f8.
- Transition RPC checks high risk for approved/payment_pending/live and confirmed payment before live; this does NOT cover old early payment entrypoints.
- Verification RPC requires Owner/AAL2; high risk verified requires enhanced evidence reference.
- ad_payments, ad_campaigns, advertisers, ad_history, audit_logs RLS enabled and owners postgres. Existing security definer old RPCs and private.p4_owner_allowed run under authenticated JWT/AAL2 authority.

## ADS-008 affected-system transitive graph
Auth JWT+AAL2 / private.p4_owner_allowed
=> advertiser verification and Owner approval/payment RPCs
=> public.advertisers risk_level/verification_state
=> public.ad_campaigns status/paid_at
=> public.ad_payments status/amount_minor
=> public.ad_history and public.audit_logs/immutable audit triggers.
Related public ad feed consumes confirmed/payment/live and creative eligibility, therefore regress public visibility and Article privacy.
Migration candidate adds ONLY private verification helpers and triggers on confirmed ad_payments and paid/paid_at ad_campaigns. It must not silently change existing RPC body, identity, payment/audit rows or other modules.
Existing rollback removes only new guards; alone it REOPENS original payment gap, so emergency rollback needs payment-stop containment. Review trigger order, guard collision, direct privileged live transitions, verification downgrade after paid/live, and concurrent verification-payment race in CP-02 synthetic tests before code release.
No migration writes Storage/Vault/Auth configuration, but affected-runtime dependency exception remains; do not waive recovery proof if touched.

## Astra 6 independent audit blockers confirmed in current main code
B1 database owner/ACL: clone creates postgres DB as supabase_admin, not source owner postgres; DB-level grants/settings not restored.
B2 image: current restore helper still uses 17.6.1.136 although production build 17.6.1.155; pg_net 0.20.4 mismatch risk; reported matching pinned image digest still needs independent fake runtime validation.
B3 source snapshot: raw pg_dump and expected_identity count query in separate sessions/times, no exported shared transaction snapshot, sequences need distinct rule.
B4 cron: no cron.launch_active_jobs=off asserted at first clone boot, possible local scheduled SQL; pg_net worker isolation also unproven.
B5 integrity: 26 comparisons omit owner/ACL/full-data contents/roles, actual policy predicates, triggers/constraints/sequence/extension version.
G5 Owner-held AGE private identity offline decrypt NOT VERIFIED. Runner key decrypt is not equivalent.
Branch main protected=false; environment review settings NOT VERIFIED.
Historical real backup 38583250674: offsite ciphertext PASS, restore not tested.
Real 38602777423: encrypted offsite/runner AGE decrypt PASS, clone pg_restore FAIL. Actual PostgreSQL first error suppressed. PR #12 fixed independently reproduced fake role/pg_cron defects, not real restore success. NO new real run permitted yet.

## CP-02 Minimum Safe Coding Order / EXIT
(1) Pin exact 17.6.1.155 image manifest digest and fake boot extension seven-version runtime verification.
(2) Prove clone cron disabled before boot and other worker/egress isolation, with active fake cron negative.
(3) Preserve database owner/ACL/role/default-privileges/config without modifying production.
(4) Shared-snapshot raw dump+source metadata, with concurrent fake write race regression and independent sequence checks.
(5) Compare canonical full affected data, owners, grants, RLS policy bodies, RPC definitions, triggers, constraints, sequence, extensions. Negative fault injection must fail closed.
(6) Run same-helper synthetic restoration + Phase-3/B7 old CI. Never claim synthetic equals real.
(7) Separate Founder gate: verify paper AGE identity offline; approve new real backup+isolated restore only after all gates green.
(8) Only after real restore: separately approve minimal ADS-008 production migration, containment+rollback test; then real ADS-009 actor matrix and remainder of ADS-001..009 E2/E3/E5.

## STRICT RESULT
CP-01 = COMPLETE AS REQUIREMENT/CODE/LIVE-SCOPE AUDIT ONLY.
G3 real restore FAILED; T034 HOLD; CP-02 coding NOT STARTED.
No DB writes, migrations, workflow dispatch, deployment or B2 changes; no Cricket access.
NO FAKE PASS.
