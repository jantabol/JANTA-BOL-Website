# JANTA BOL — P4-T034 ADS-008 additive safe fix + backend test checkpoint
Date: 13 October 2026. **NOT PRODUCTION DEPLOYED / NOT T034 FINAL PASS.**
Founder authorized careful ADS-008 fix and remaining partial backend gates with strict preservation of old JANTA BOL files and data.

## Immutable source and isolation
- Safe dedicated branch: `codex/b7-t034-safe-guard-20261013`, starting base `8d6c7824641c04a59f1b45f68fc6111232736d74`.
- Patch test SHA: `f007badf26541c4afe8c1a66351c8f08ae429c5c`.
- Git compare base→SHA: only **new** SQL guard / synthetic fixture / regression / concurrent-intake script / new isolated workflow. **NO existing source, HTML, CSS, JS, RLS policy, B3/B5, articles, or Cricket files modified.**
- No SQL DML/DDL to LIVE Supabase; no real payment, verification decision, record deletion, AAL2 impersonation, production deployment, PR merge or advertisement LIVE.
- LIVE read-only after tests: advertisers 7; campaigns 7; history 26; exactly one historical high-risk pending verification/payment_pending; new triggers deployed 0. Existing records unmodified by this session.

## Confirmed first divergence
LIVE schema/source: `jb_ad_confirm_payment_internal(uuid,text,bigint)` and `jb_ad_record_payment_internal(uuid,text,text,bigint,text,boolean)` both have Owner/AAL2 checks but **neither checks advertiser.verification_state** before inserting confirmed payment and moving campaign to PAID. Existing `ad_payments` trigger verifies amount/reference only. Live `jb_ad_transition_internal` and `jb_ad_public_feed` contain additional high-risk guards; these do NOT repair the early payment-confirmation boundary.

## Minimum safe candidate
`db/20261013_b7_t034_payment_verification_GUARD_REVIEW_ONLY.sql` **additive** internal helper and:
1. BEFORE INSERT/UPDATE verified-advertiser check on `ad_payments` when `status='confirmed'`; both old Owner RPCs converge here. Requires Owner AAL2 and verified advertiser of any risk level.
2. BEFORE INSERT/UPDATE of paid status or paid_at on `ad_campaigns`: Owner AAL2 + verified advertiser + a confirmed non-zero payment ledger row. Prevent direct paid-state bypass.
3. Schema/source presence preflight and same-name collision fail-closed, private function execute grants revoked, no new public function, no history/data backfill or mutation.
4. REVIEW ONLY. Do not deploy without verified point-in-time restore/rollback and explicit scope authorization. Existing draft payment-evidence and lifecycle triggers must be reconciled before production rollout; do not silently override them.

## REAL GitHub Actions disposable PostgreSQL evidence
Run `38383005538`, exact SHA `f007badf26541c4afe8c1a66351c8f08ae429c5c`, **2/2 jobs SUCCESS**:
- **ADS-008 RED**: recreated both exact OLD LIVE payment RPCs with synthetic historical HIGH/pending/payment_pending record and demonstrated old premature PAID accepted inside rollback.
- **ADS-008 GREEN**: new additive trigger guarded BOTH old Owner payment RPCs; rejects historical HIGH+pending and NORMAL+pending; no payment, campaign status or audit side-effect. Direct confirmed-payment INSERT and direct PAID-state UPDATE rejected. Verified normal and high-risk Owner positive payments still work; Owner without AAL2 denied. Private guard no anon/authenticated grants; old RPC execute grants retained.
- **ADS-002/003/004/005/007/009** pre-existing enquiry rollback tests and 3 legacy overload role/owner tests all pass.
- **ADS-003/005** NEW live simultaneous two-client Postgres calls with same normalized phone: one PENDING receipt, one ENQUIRY_COOLDOWN, exactly one advertiser/campaign/history entry; forged `p_scope` argument and 501-character description rejected with unchanged database.
- First trial CI run `38382619999` failed at Docker container creation due an invalid `--retries` flag in **new workflow only**, fixed to `--health-retries`; later source run `38382741638` both jobs green and final concurrent run `38383005538` both jobs green. Do not misrepresent first infrastructure failure as ADS-008 behavior.

## Official gate standing — not final PASS
- ADS-001 **PARTIAL**: real Android homepage/article CTA proven, but specified 360px E3 measurement not separately captured.
- ADS-002 **PASS scoped**: real deployed intake and isolated/server negative consent/WhatsApp checks.
- ADS-003 **PARTIAL**: synthetic forged arguments E2 passed, full deployed PostgREST negative scope/creative matrix not independently proven.
- ADS-004 **PASS scoped**: durable Vercel Preview article pending receipt E2/E3/E5.
- ADS-005 **PASS scoped isolated E2**: two-client concurrency + oversized note + cooldown, but broader distributed/HTTP abuse rate guard still release DUE.
- ADS-006 **PASS scoped**: real Android local Owner queue exact receipt/context E2/E3.
- ADS-007 **PARTIAL**: isolated synthetic Owner verified positive test; real Founder AAL2 actual verified normal contact and audit E5 not completed.
- ADS-008 **SOURCE-FIX+ISOLATED E2 PASS; LIVE FAIL/HOLD** until guard deployed and independently proved after backup; do not call T034 PASS.
- ADS-009 **PARTIAL**: anon/nonowner simulated and earlier LIVE limited negatives passed; real reporter, advertiser, revoked Owner, AAL1 matrix still DUE.

**Hard gates before Production:** DB backup with tested restore point and rollback procedure; exact-live-schema parity review incl. prior manual-payment/lifecycle REVIEW_ONLY branches; migration collision and trigger/order checks; Owner-approved maintenance window; one restricted PROD DDL migration only; read-only verification; no confirmation/payment/advertiser state changes or LIVE ads merely for proof; impacted old CI + per-role E2/E5 negative and Android E3. Production Vercel release requires exact SHA/source mapping and target, not `READY target:null`.

**Status:** P4-T034 **HOLD**, B7 **0/9 FINAL PASS/LOCK**. No B7 final ZIP. Old files and LIVE data preserved.
