# JANTA BOL — B8 G1 CP02: Editor Review + Immutable History — REAL CI
**17 October 2026 | source as CI run: `b13a891999b5b57ef091b4121ff4b6881caefd31` | DISPOSABLE PG17 | NO LIVE DEPLOY**

## Founder rules preserved
- Reporter may draft and later dispatch scoped ordinary (R0) official questions without Founder per-send approval; R1 serious must go to Editor and Founder must receive a REAL evidence-linked packet, R2 cannot bypass Founder prior restricted approval.
- CP02 is **only** immutable review request/Editor decision/early Founder evidence-GAP preview. **No actual question dispatch, no confidential source evidence upload, no delivery verification, no public news mutation, no notification provider.** The returned preliminary pack labels `EVIDENCE_GAP`, `NOT_SENT`, `complete_proof_pack=false`; it is NOT a complete proof packet.
- Original B0–B6 Founder locks and B7 first actual paid shop Ad HOLD unchanged. Existing `private.p4_staff_allowed()` still does not give Reporters broad Editor privileges; Owner AAL2 preserved.

## Exact source and changed files
Pre-CP02 implementation branch was `ed971ceffdefb0854ae76305c26a2cb0b57ddfe1`. The **FOUR changed files only** to tested SHA:
1. **NEW** `JANTA_BOL_PHASE_4_WORKING/db/20261017_b8_g1_cp02_editor_immutable_review_REVIEW_ONLY.sql`: case-specific Editor grant/revoke; immutable question review request, decision and review event ledger, scoped Editor R1/R2 review; private Founder preliminary packet; deny-by-default RLS and no direct authenticated data grant.
2. **NEW** `ci/phase4/b8-g1-cp02-editor-review-regression.sql`: genuine PostgreSQL17 authenticated-role positive/negative/rollback tests.
3. **UPDATED synthetic fixture only** `ci/phase4/b8-g1-disposable-fixture.sql`: second Editor identity for cross-editor IDOR test; NOT real staff data.
4. **UPDATED isolated workflow only** `.github/workflows/b8-g0-g1-disposable-pg17-and-protected-static.yml`: runs CP01 and CP02 PostgreSQL migrations + real SQL regressions sequentially; protected Phase3 News/Arch STATIC + B7 old canonical HOLD checks.
**ZERO old News/Article/Auth/B0–B7 APP source files changed.**

## Real RED → RCA → minimum test repair → GREEN
- **Actual initial RED:** [CI #39005548798](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/39005548798), CP02 job `117317167319` failed at CP02 regression line 97 on aggregate `B8_CP02_REPORTER_EDITOR_PRIVILEGE_OR_DUPLICATE_BYPASS`; G0 protected News job was GREEN. Real CP01 migration and test then CP02 migration applied in disposable DB.
- **First divergence in examined exact test source:** the test script set `role authenticated` and then tried to locate its own draft UUID via a **direct SELECT on private `public.b8_question_drafts`**, which the feature correctly forbids to authenticated callers. This invalid fixture access occurred before the RPC negative expectations and was caught by the test's broad error handler. Not evidence of a production access bypass; initial test fixture was incorrectly bypassing its own API boundary.
- **Minimum safe fix:** use draft UUID returned legitimately from `jb_b8_g1_reporter_create_draft()` and stored as a psql test variable; **never GRANT table SELECT** to solve a fixture error. No feature authorization relaxed.
- **First GREEN:** [CI #39005614336](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/39005614336), two jobs SUCCESS. No Code RFC modifications to old protected modules.
- **Independent follow-up negative strengthening:** add invalid `APPROVE_FOR_SEND`, empty Editor reason, Editor lost session, Founder packet explicitly `EVIDENCE_GAP` / `NOT_SENT` / `complete_proof_pack=false` assertions, to prevent fake SEND or fake documentary evidence.
- **Latest tested GREEN:** [CI #39005697666](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/39005697666), source `b13a891999b5b57ef091b4121ff4b6881caefd31`, **2/2 SUCCESS**. PG17 log prints CP01 and CP02 ACL/RLS/role/Editor/Founder/append-only notices plus two transaction `ROLLBACK` and empty test-fixture confirmation; neither job used production Supabase secrets. Original Phase3 protected STATIC and B7 closure checks GREEN (not full hosted Phase3 E2).

## Exact tested security coverage (bounded)
- Owner AAL2 create/assign/revoke separate Editor per-case grant; Owner AAL1 denied.
- Reporter can submit its OWN assigned immutable draft for Editor review only when case R1/R2; R0 no automatic Editor queue, duplicate request refused, Reporter cannot approve its own question.
- Active specific Editor can see one scoped review card and record **RETURN_FOR_EVIDENCE**, **EVIDENCE_REVIEW_PENDING** (R1 only) or **ESCALATE_TO_FOUNDER**. **No decision can authorize external sending** and R2 cannot use R1 pending path.
- Another authenticated Editor cannot read an unassigned Case. Editor grant revocation blocks access, lost session blocks access. Authenticated users cannot directly read/change raw protected tables; anonymous cannot call approved RPCs.
- Replay decisions refused; immutable trigger rejects direct historical requests/decisions/events overwrites/deletes within ordinary database permissions. An actual privileged database administrator can still exercise DB administration; no false claim of absolute anti-superuser tamper proof.
- Owner case packet is explicitly **PRELIMINARY**, tagged EVIDENCE_GAP, NOT_SENT and complete=false. Genuine independently verified source, actual staff Owner E5, real Android E3, B3 notification delivery and outside-official E9 **NOT RUN**.
- News Article and B7 campaign synthetic sentinels unchanged; rollback leaves no synthetic Case, Question or Review. Protected STATIC is not a full real production regression run.

## Gate status
**CP02 disposable E1/E2 engineering candidate GREEN, TEST FIX RCA CLOSED, no unsafe blocker detected in this isolated slice.**
**B8 G1 WHOLE BLOCK ≠ FINAL PASS+LOCK**: Editor case routing in Android, actual evidence uploads and verification, Founder complete proof pack, immutable source receipt, legally correct formal SEND flow, Owner protected E5, real Android E3 and full Phase3/Phase4 LIVE integration remain open.
**Official B8 P4-T092..T099 = 0/8 FINAL PASS; ACC001..051 0/51 actually executed to official proof standard.** No B7 first payment was triggered. No extra cost/new hosted resource.

**Next minimal checkpoint:** G2 case evidence provenance + storage/immutable deletion survival (old Article ON DELETE CASCADE) / private Reporter case upload with verification; expand tests and preserve all older real baselines. Stop only for real critical data-loss/leak/role bypass. Phase-4 News Soft Launch remains main target.
