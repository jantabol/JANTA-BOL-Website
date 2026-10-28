# JANTA BOL B11 P4-T073 — Real PG17 Security/Corruption/Transactional Rollback

**Date:** 28 October 2026. **Master:** Phase4 Topic10 p.305, P4-T073 (RECOV-033..040, Sections623..630; E1+E5+E7+E8). **Status: scoped original PostgreSQL17 component PASS; FULL T073 HOLD.**

## Executed original source (new proof)
- GitHub Actions **40641468000**, job **122660356938**, conclusion **SUCCESS**. Ephemeral GitHub PG17 database `jb_t073_security`, pinned original JANTA BOL B8 source at `89849ba47f443f423d8bfe4f966bb2d38087201f`, whose web app tree is unchanged against actual C1 Vercel SHA `659bcdc2ec4e270ea066863b4b456aeb65cb7c73`. B8 original SQL fixture+migration hash parity with original `658f474d6ee0f24efac60f069979e8adee1e9221` independently checked.
- Actual original Owner/AAL2 synthetic case created, active original B8 reporter grant created via genuine original RPC and FK persisted.
- Attempting to corrupt the case's risk lane to an invalid value raised **actual PostgreSQL CHECK constraint violation**. Original R1 lane and reporter link remained intact.
- Attempting hard DELETE of original case with a reporter-grant FK raised **actual PostgreSQL foreign key violation**. Original case, reporter grant, published Article and Ad sentinel remained intact.
- Actual `REVOKE EXECUTE` on original Owner-create RPC denied authenticated caller with **insufficient_privilege**; re-grant restored access only in disposable PG17.
- Actual new proposed `20261028_t072_b8_case_idempotency_PROPOSAL_REVIEW_ONLY.sql` loaded inside an explicit PG17 transaction then `ROLLBACK`; afterwards neither added table nor proposed function remained. Original B8 data and links survived.
- A genuine fresh post-incident original Owner/AAL2 create RPC committed again. Original synthetic published Article/Ads remained unchanged.

**Passed log markers:** `T073_REAL_PG17_INVALID_AUTHORITATIVE_CASE_CORRUPTION_DENIED=PASS`, `T073_REAL_PG17_LINKED_CASE_ACCIDENTAL_DELETE_RESTRICTED=PASS`, `T073_REAL_PG17_PROTECTED_HIGH_AUTH_FUNCTION_REVOKE_DENIED_AND_RECOVERED=PASS`, `T073_REAL_PG17_ADDITIVE_PROPOSAL_SQL_TRANSACTION_ROLLBACK_OLD_RECORDS_SURVIVE=PASS`, `T073_REAL_PG17_OWNER_RPC_RECOVERS_WITH_OLD_NEWS_AD_PRESERVED=PASS`.

## Honest remaining original T073 gates
- **Real stolen credential recovery, Owner/SSO reauth, service key rotation:** NOT TESTED. No rotation or user session access performed or authorized. Existing 2FA/live user protected.
- **Vercel failed deployment and true Production config rollback:** NOT TESTED. CI-only test of SQL transaction rollback is **not** platform deployment rollback.
- **Case soft-delete vs disaster restore, original article delete-recovery and full incident/evidence journal:** NOT TESTED; FK denial must not be passed off as soft-delete workflow.
- **Original T070 one-point true full DB+Media+Auth+Edge/Platform restored system:** HOLD; separate real T034 PostgreSQL and T069 offsite 5 actual media hash checks are different capture times.
- **T073 E8 independent whole-platform final acceptance: HOLD.** No Production call, paid tool, secrets, personal data, real Live stream, actual Supabase mutation or JANTA BOL Main merge. Cricket/Saarthi untouched.

**Result:** 5 scoped real PostgreSQL17 source negative and rollback protections **PASS**, T073 Final PASS+LOCK **HOLD**. P4-T071 full E8 still HOLD; T072 P2 duplicate retry stays OPEN in unchanged original case RPC; proposed key-based fix tested offline, NOT deployed. B11 T075 Final gate HOLD.

Sources: [real PG17 CI](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40641468000), [original T072 duplicate proof](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40641234256), [isolated T072 proposal proof](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40640041648).
