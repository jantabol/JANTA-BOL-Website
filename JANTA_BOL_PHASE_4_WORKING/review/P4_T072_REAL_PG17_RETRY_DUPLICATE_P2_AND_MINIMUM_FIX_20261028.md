# JANTA BOL B11 / P4-T072 — Real Partial Write and Retry Audit, Minimum Fix

**Date:** 28 October 2026 IST. **Source of truth:** Phase4 Master P4-T072 p.304–305, RECOV-027..032 / Sections 617–622, E1 + E2 + E5. **Original T071 full integrated E8 remains HOLD.** This report is T072 safe review PRE-FLIGHT, not full test close. JANTABOL.in soft launch remains priority.

## Verified original source P2 defect, genuinely reproduced

**Original exact B8 code** `JANTA_BOL_PHASE_4_WORKING/db/20261017_b8_g1_case_reporter_scope_REVIEW_ONLY.sql`, checkout SHA `89849ba47f443f423d8bfe4f966bb2d38087201f` (the original B8 SQL blob is byte-identical to previously tested `658f474d6ee0f24efac60f069979e8adee1e9221`; candidate deployed C1 web source matches SHA `659bcdc2ec4e270ea066863b4b456aeb65cb7c73`).

**Actual GitHub Actions run `40639793428` job `122655014465` SUCCESS**, with real disposable PostgreSQL17, not JS/mocked SQL:

- Original `jb_b8_g1_owner_create_case(title,area,lane)` committed an actual first row. The very same request parameters were retried, representing a response ACK becoming ambiguous. **Two distinct case IDs and two case rows resulted**, no caller-supplied request key or record-finding contract exists. **P2 FINDING T072-R01 OPEN**: retry of one uncertain critical business action can create two case records. This is *not* a false DB commit — it is an **idempotency gap**. Title duplication alone is not a safe dedup strategy, because two separate genuinely intended cases may share a title.
- Original B8 business-data test then forced **genuine PG17 CHECK(false) insert failure**; no success UUID/partial row, existing synthetic published News and Ads intact, correct Owner session failure denied by `B8_OWNER_AAL2_REQUIRED`. Scoped negative PASS.
- Original `jb_b8_g1_owner_assign_reporter` retried an identical grant and maintained one row via existing `ON CONFLICT` with composite PK. Scoped **idempotent grant PASS**. DO NOT change this protected old function.
- Everything ran solely in ephemeral `jb_t072_retry`. **No real Founder action, credential, Supabase production write, Live provider or payment**.

## Minimum additive secure fix PROPOSED and independently executed, NOT deployed

Review-only migration: `JANTA_BOL_PHASE_4_WORKING/db/20261028_t072_b8_case_idempotency_PROPOSAL_REVIEW_ONLY.sql`.

Add a private idempotency ledger `b8_owner_case_idempotency` keyed by authenticated Owner UID + original client-generated UUID; stores exact request fields and permanent case ID. Only the new additive `jb_b8_g1_owner_create_case_idempotent(uuid,text,text,text)` RPC may use ledger. It checks **fresh** original Owner/AAL2 before ANY old ID lookup, rejects wrong/missing key or reused key with changed payload, serializes same-user/key transactions with PG17 transaction-scoped advisory lock, wraps the original protected create RPC and ledger insertion in **one atomic transaction**, denies anon direct table/RPC access, preserves valid new operations with a new distinct UUID. Original B8 function/signature and all preexisting SQL untouched. Future browser client must use one persistent key across uncertain retries (separate release gate; not implemented/deployed here).

**Actual GitHub Actions run `40640041648`, job `122655813819`: SUCCESS** (disposable PostgreSQL17 named `jb_t072_idempotent`), authentic unchanged original B8 SQL plus review-only additive candidate:

1. First commit + simulated lost ACK + same-key replay => **one original case ID, one row**.
2. Same key with different payload => **rejected**, no override.
3. Fresh key with same title => **distinct valid case**, not mistaken for replay.
4. Genuine backend insert failure => **zero case + ledger partial writes**, old synthetic News/Ad unchanged.
5. Restore database write, retry same request after failed transaction => **one case, stable ID**.
6. Old Owner session OFF => **AAL2 protected read/write denied**, anonymous ledger permissions and RPC blocked.

**Proposed fix: PG17 component checks PASS; integration NOT deployed, original P2 in existing old RPC still OPEN until approved client transition.** This is not proof of Chrome Android local stable key storage across Tab close, lost phone, refresh, timeout, or race across multiple actual devices. Do not pretend full end-to-end idempotency is solved. Do not silently switch or delete existing case rows.

## Frozen Master T072 requirement-status

| Requirement | Evidence | Verdict |
|---|---|---|
| Partial write rollback no false acknowledgement | Original real PG17 forced transaction failure with unchanged Article/Ad and protected old case; successful clean retry after repair | PASS scoped |
| Protected destructive or create action denies without security dependency | Original session OFF test | PASS scoped |
| Allowed public Article reads continue during fault | T071 actual hosted healthy public Article read and optional local failures; a **true hosted DB/protection dependency outage not exercised** | HOLD full integration |
| Ambiguous provider result must not be false success | Original protected HTTP clients under T071 rejected local 503; actual external provider ambiguous status not exercised here | HOLD full |
| Same critical create request retry must not duplicate | **Original B8 creates 2 cases**; genuine source bug T072-R01 **P2 OPEN**. Additive fix proven only on disposable PG17. | FAIL original / FIX PROPOSAL scoped PASS |
| Failure/recovery audit journal records appropriate request lineage | Review ledger records key, owner, exact payload, result; hosted audit/rollback/journal integration not tested | HOLD |
| Original phase3/data-integrity/Live regression | Previously T071 32/32 same source; this workflow binds unchanged original B8/preview source SHA | PASS scoped, full T072 old CI DUE |
| **T072 Final PASS+LOCK** | Full deployed original release, Android client-key persistence, E1/E2/E5, independent signoff missing | **HOLD** |
| **T071 Final/Topic10 T075 Final PASS+LOCK** | Hosted integrated E8 and T073/T074 remaining | **HOLD** |

## Minimal safe next decision and order for soft launch

**Do not touch Prod or current real ISRO news.** Audit whether B8 case-create actually forms part of the Soft Launch core; if optional RELEASE-OFF, its unproven idempotency remains an explicit activation-blocker, not a false full B11 PASS. If B8 is active, approve narrow protected client request-key persistence and additive reviewed database RPC only after independent security & current-user rollback audit, then repeat Android and PG17 E2/E5. Original P4-T073 (corruption/rollback), T074 (post-restore/device loss), T075 (final gate) remain separate tests; use original T070 evidence without inventing a replacement E8. Do not re-run finished C1–C2 local probes absent a regression.

### Source logs
- Real original behavior (P2 proof): https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40639793428
- Isolated additive minimum fix 6-case test: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40640041648
- Previously consolidated actual original 13-family single runner: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40638596053
- Prior independent E5/E8 scoped review: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/40638908792
