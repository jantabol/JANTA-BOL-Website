# JANTA BOL — Phase-4 / B8 G3 CP01–CP04 Final Engineering and Test Report
**17 October 2026 · Founder requested G3 complete and final report · NO REBUILD / NO FAKE PASS**
**Exactly CI-tested feature source:** `27cd9bc91997d8824da1836cd8e429d3e660c9ce` on `codex/b8-g0-g1-accountability-20261017`.
**Actual CI:** [GitHub #39009772024](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/39009772024) **2/2 SUCCESS**. G3 SOURCE/ISOLATED-ENGINEERING IMPLEMENTATION COMPLETE FOR CP01–CP04. **Not G3 FINAL LIVE PASS+LOCK, NOT B8 FINAL, NOT Production**.

## 1. G3 working slices
| CP | Exact implemented code | Real bounded proof | Never claim |
| --- | --- | --- | --- |
| **G3-CP01** | New Android-first B8 source page (separate from old News), role-scoped Reporter/Editor/Founder RPC client, 15-minute private screen lock, safe DOM rendering, guarded evidence upload | 14/14 browser role/NOT_SENT contract tests, Node syntax; earlier #39008663211 and latest #39009772024 | Physical Android E3 or accessible hosted page |
| **G3-CP02** | Case-matched/private receipt linking; independent R1 Editor screening, R2 **prior** Founder AAL2 authorization, immutable actor/reason records; founder private evidence packet; B3 `live_notifications` safe IN_APP_READY notices deduplicated per review | Actual disposable PostgreSQL17 tests: cross-case receipt blocked, R1 approved-with-byte-receipt, R2 Owner AAL1 denied, R2 only after Editor escalation, 2 safe in-app notifications, ledger rollback | Actual Founder device was alerted, delivery, independently verified accusation/source |
| **G3-CP03** | Reporter scope R0 manual handoff token, R1 only after Editor screening, R2 only after Founder authorizes; one frozen question intent (idempotent), manual composer attempt/receipt observation append-only, Founder genuine status card | PG17 R0/R1/R2 positive, R1/R2 before approval rejected, duplicate token no double send, false delivery blocked, original News unchanged and rollback | Actual official message sent, provider accepted or official received it; no external automated transport |
| **G3-CP04** | Append-only reporter claim of an official reply with PRIVATE byte-integrity receipt from the SAME CASE; Owner AAL2 claim summary, source independent verification explicitly FALSE | PG17 wrong reporter, replay, Owner AAL1 denied, never upgrades official authenticity, ROLLBACK | Authentic official reply, reply date independently attested, actual E9 |

### User-visible founder policy exactly preserved
**R0 normal:** assigned active Reporter can prepare private draft and manual handoff without per-question Founder approval. **R1 serious:** assigned Editor first screens; the Founder receives privacy-safe IN-APP event referencing private review packet (actual external delivery NOT claimed). **R2 restricted:** after Editor ESCALATE and PRIVATE bytes receipt, Founder AAL2 authorization before Reporter manual handoff. Real News publish, correction, deletion remains solely Founder and existing 1 NEWS=1 PERMANENT MASTER URL lifecycle is not modified.

## 2. Independent exact CI verification
Latest job #39009772024 source SHA `27cd9bc91997d8824da1836cd8e429d3e660c9ce`:
- **2/2 GitHub jobs SUCCESS**, no prod secrets used.
- G3 CP01 Android client contracts **14/14 PASS**, newer G3 CP02/03/04 role/truth client contracts **13/13 PASS**, G2 Server PRIVATE upload mock-byte SHA256/timeout regression **10/10 PASS** (**37 explicit new JS tests**, not the full CI test count).
- Actual disposable `postgres:17`: G1 Owner AAL2/scoped Reporter/Editor, G2 independent case evidence/legal hold/real two-session old Article DELETE vs link concurrency, G3 private B3 notification/Founder R1-R2, manual handoff idempotency/role scope, reporter answer claim and Owner truth negative tests, all GREEN with `ROLLBACK`. Old Article and Ad synthetic sentinel unchanged.
- Phase3 News/Auth/Security **STATIC** checks and existing B7 honest HOLD/secret CI checks GREEN; these are **not** the complete former original B0–B7 real Android/LIVE evidence.
- No other existing protected Source files changed from original G2 checkpoint: Git compare `b48e3b39e74e46ccd77a2e23d076ee4953e1c19d`→tested SHA lists 12 scoped files (the three existing B8 CP01 UI/client files, B8 workflow, new G3 SQL/fixture/tests). **No old News/Article/Auth/Ads/B6 or Cricket path edited.**

## 3. Security boundaries actually checked / outstanding
- **PRIVATE evidence only.** No image/file or private article source URL exposed to anonymous users. SHA256 readback is byte integrity, not documentary authenticity. Missing/offline/server-error cannot become uploaded or delivered.
- **Founder AAL2** authentic backend function protects restricted authorization and private proof details; per-Case active Editor/Reporter grants and expiries preserve previous B1 helper. R1 question is not a News publication. Editor cannot independently send R2.
- **B3 truthful notification:** LIVE source catalog checks confirm `live_notifications` valid domain `system` and `IN_APP_READY`. There is no trigger on LIVE `live_notifications` table (checked read-only). CP02 test synthetic B3 schema, not real notification to Founder.
- **G3 UNSENT truth:** Current G3 feature does NOT call external provider or give a "Send confirmed" button; an external manually sent letter/WhatsApp or official provider reply would require real, independently auditable evidence. CP03 intentionally uses `PREPARED_NOT_SENT` and `NOT_VERIFIED`; never fake provider acceptance or official reply E9.
- **15-minute inactive lock:** code + Node static check only, actual Android interaction and session revocation must be tested.
- **G2 uploads:** source-built private Deno Edge gateway and migrations remain REVIEW ONLY. UI `uploadBtn` intentionally DISABLED until paired safe release. The G3 evidence receipt flow is real in disposable PG17, not yet end-to-end on any actual staff phone.

## 4. Exact remaining FINAL G3 exit gates / critical vs noncritical
**Hard pre-release security gates (block ONLY deployment / real public soft-launch, not independent G4 coding):**
1. **H1 E2 Hosted:** reconcile old production `main` vs preview-reviewed source, Founder-approved paired G1/G2/G3 migrations + private Edge deployment on existing Free resources; real RLS JWT active/stale and actual private Storage byte readback, quota/cleanup/orphan and Owner access. Do not run review SQL against LIVE without explicit safe reviewed deploy approval.
2. **H2 E3 physical Android:** two real Founder-owned devices Reporter→Editor→Founder workflows on exact approved deployed HTTPS URL, role/IDOR/offline/relogin/15min lock, photo/PDF upload/Owner view; phone screenshots/recordings with test ID+source SHA. Reporter/Editor test accounts and device assignment must be authorized.
3. **H3 E5 Owner:** actual Founder AAL2 and scoped Reporter/Editor sessions, revoke/suspension and negative test; not an isolated synthetic fixture.
4. **H4 E9 official:** truly delivered Right-to-Reply question, genuine official response or traceable no-reply deadline via actual recipient/provider/physical receipt. Only after real evidence can any original official ACC receive E9 PASS. If no response exists, explicitly `NOT_RECEIVED_AS_OF`, no invented reply or no-reply penalty.
5. **H5 Production E7:** News Article permanent URL parity, B0–B6 old-lock regression, B7 first-shop ad paid HOLD, real E3 founder Incognito on final public domain, rollout rollback safety. No production cutover done.

**Noncritical remainder that should not halt progress to G4:** Android polish, bulk event listings/search, future automatic provider transport or paid storage. Core release must be genuinely safe but do not expand scope into a new paid service.

## 5. Important independent caveat
**G3 ENGINEERING FEATURE SLICES CP01–CP04 = CODED + SOURCE/CI TEST GREEN**, but this is NOT proof that a Reporter can yet send an official message from a LIVE phone. No physical Android/manual role, real private storage, external official communication or Founder E5 was performed. Thus **G3 FINAL PASS+LOCK = HOLD**, and neither the B8 G3 manual evidence gate nor P4-T092..T099 may be marked PASS.
**Official P4-T092..T099 0/8 FINAL PASS+LOCK; ACC001..051 0/51 original final evidence checks** (these are original requirements, not executed production test counts).

## 6. Next unblocker without useless research
Proceed to **G4 public-safe private→Founder-approved redacted Accountability projection, correction/Article lifecycle separation** while simultaneously preparing exact **Free hosted H1→physical Android H2/H3** release approvals. Notify Founder only when a genuine manual step becomes necessary. G3 test status must reconcile when real device and third-party E9 proof arrive, before B8 official lock and B0–B8 ZIP.
**B7 actual first paid shop Ad remains after News Soft Launch HOLD. No paid service, no LIVE SQL, no domain/main changes.**
