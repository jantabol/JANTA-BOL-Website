# JANTA BOL - B8 ACCOUNTABILITY
## R3 PRE-CODING FINAL TECHNICAL DESIGN & TEST-LOCK CANDIDATE
**17 October 2026 | CP10-CP12 design reconciliation | NO FEATURE CODING | NO PRODUCTION CHANGES**

> **Two separate verdicts:** The technical design below has been reconciled against the supplied Master Execution Pack, previous R1/R2, physical test plan, GitHub branch and past LIVE read-only catalog. It is **ready for one grouped Founder sign-off**. Only **FD-B8-02 (Reporter/Editor/Founder proof-pack)** is already Founder-approved. Five remaining governance defaults and precise high-risk boundaries are proposals; **FINAL FOUNDER LOCK must not be claimed without confirmation.** Official B8 T092-T099 = **0/8 RUN**; ACC001-051 = **0/51 RUN**. First real B7 payment remains on separate HOLD.

### Hindi summary - ab system kaisa chalega

- **Reporter** assigned case me aam, neutral, proof-linked sawal khud adhikari ko bhej sakega. Har baar Founder ke OTP/sign-off ka wait nahi karega.
- **Gambhir sawal** pehle Editor check karega. Founder ko **Case ID + proof + Editor decision + asli dispatch status** wala private packet milega. Founder notice padhe bina bhi Editor-approved normal serious request time par ja sakti hai, jab tak neeche restricted exception na ho.
- **Ati samvedansheel case** me confidential source, minors/personal privacy, credible physical threat, JANTA BOL/Founder conflict ya illegal/misleading disclosure ka risk ho, to restricted action se pehle Founder ke decision ki gate hogi. Neutral public-records inquiry ek alag narrow approved path ho sakti hai; poori private file auto-send kabhi nahi.
- **Founder** published News ke publish/unpublish/correction aur approved public case-summary ka final authority rahega. Koi bhi Founder/Reporter/Editor immutable source ko chupchap badal nahi sakta.
- **Original Article UUID/PURL**, B0-B6 locked system, B7 payment HOLD, same existing B3 notifications, B2 audit and existing private evidence policies ka reuse; no rebuild, no parallel publishing.

## 1. Authority and original Source-of-Truth (non-negotiable)

1. Original **321-page JANTA BOL Phase4 Master Execution Pack**, Topic13 Source sections **825-923** and official B8 pages **312-314**. Nine evidence classes E1-E9 as original defined, not synthetic substitutes. 
2. B8 original **P4-T092..T099**, ACC **001..051**, RUN-12 and original coverage. Original 8 classes: `T092 E7+E9`, `T093 E2+E9`, `T094 E2+E5+E9`, `T095 E2+E5+E9`, `T096 E2+E4+E5+E9`, `T097 E2+E5+E7+E9`, `T098 E1+E2+E3+E4+E5+E9`, `T099 E1+E2+E5+E7+E9`. 
3. Founder-approved 17 October CP08/CP09: **Option A (Editor review) PLUS Founder real evidence packet**. Earlier R1/R2 blanket "Reporter cannot send" and "every question requires Founder AAL2" is **SUPERSEDED**, not an alternative.
4. Latest review source 2`review/b8-precode-design-tests-20261017` (CP09 checked HEAD `eb2dadd0ac0f6e270e82ec920ee812d15ecc7b71`) preserves old News source; `main` production still an independent release mismatch as last audited. An approved design is not installed Backend.
5. Current LIVE metadata past read-only: canonical Article, source/version/verification/audit/grievance/B3 notification/Topic8 retention exist; `article_sources`, `article_versions`, `verification_history` Article FK `ON DELETE CASCADE`; protected private editorial bucket exists but staff-scoped upload is **not proven**. No B8 dedicated production relation found in prior inspected catalog. No real LIVE mutation/attack test performed by this document.

## 2. FINAL PROPOSED workflows - 3 risk lanes

| Lane | Objective classification (proposed technical rules, still Founder sign-off) | Reporter | Editor | Founder | Exact required evidence |
|---|---|---|---|---|---|
| **R0 routine** | Neutral factual request: work progress, sanctioned/tender amounts, public document, service deadline, scheme status; no personal accusation/private document | ACTIVE assigned Reporter can draft and submit via verified official contact | Can monitor/reassign, not each-time bottleneck | Quiet digest/status available, not mandatory send approval | Case+scope, reasonable question, recipient provenance, transport evidence status |
| **R1 serious** | Material public harm, documented discrepancies, significant cost gap, corruption *allegation* without declaring guilt, official completion vs ground conflict | Draft + evidence+send intent only until approval | Review evidence, contradiction, neutral language, documented APPROVE/RETURN; may authorize send | **ALSO receives protected proof pack** with Editor result before/after dispatch as applicable; reading notice not mandatory to send | Real sources or clearly marked gaps, Editor actor/reason/time; later actual send proof |
| **R2 restricted** | Risk of disclosing confidential source, identifying protected minor/victim, imminent credible danger, sensitive PII, named person's potentially defamatory high-risk allegation, severe legal exposure, Founder/JANTA BOL direct conflict, public release/correction | Draft + urgent alert, may prepare narrow nonaccusatory public-records inquiry separately | Contain/restrict, escalate; cannot unilaterally approve restricted disclosure | **Prior specific Founder approval** for protected action and public-release reserved rights | Safe private proof pack + risk note, exact authorized content/recipient, Founder session recent AAL2 where required |

**Server, not AI/client, makes final allow/deny:** classification may be suggested by AI but at the time of send the backend checks active team membership, assigned geography/beat, case UUID, role grant, grant expiry, risk tier, recipient verification, frozen question revision, non-exhausted attempt key, reviewer approval and audit. Reporter ordinary dispatch uses active newsroom auth/assignment, *not* Owner AAL2. Owner AAL2 is required for the existing privileged Owner controls and restricted approvals; no downgrading B1/B0 security. Stored disposition/reason required for risk downgrades; R2 risk flag cannot be silently waived by Editor.

### 2.1 Fail closed without blocking reporting

- Urgent R1: Editor's priority queue + B3 critical restricted notification; when Editor absent, **no fabricated approval**; neutral records-request without accusation can use R0 route only if independently safe and scoped; time-critical facts can be preserved as DRAFT while Owner is alerted.
- R2: Founder unreachable? Keep restricted dispatch **PENDING**, do not time-out to automatic permission. For real immediate safety concerns use appropriate official emergency channels outside B8; log only safe receipt, do not expose confidential source.
- Initial assignment/delegation is auditable, revokeable, case/beat/territory-limited and expiry-bounded. **No automatic blanket grant to all Reporters merely because Reporter role exists.** Editor can assign cases only if existing B1 grants permit; Owner retains original staff activation/role escalation.
- Case routine status never forces case-building on regular News: B8 outage or a disabled feature flag must leave ordinary News independent.

## 3. No fake SEND - precise evidence status model

**Separate axes; do not squeeze into one `status`:**

- **Editorial:** `DRAFT`, `REVIEW_REQUIRED`, `RETURNED`, `APPROVED_FOR_DISPATCH`, `RESTRICTED_FOUNDER_APPROVAL_REQUIRED`, `RESTRICTED_APPROVED`.
- **Transport:** `NOT_ATTEMPTED`, `COMPOSER_OPENED_NOT_SENT`, `ATTEMPTED`, `MANUAL_DISPATCH_REPORTED`, `CHANNEL_ACCEPTED`, `DELIVERY_VERIFIED`, `FAILED`, `UNKNOWN`.
- **Reply:** `NOT_YET_DUE`, `WAITING`, `PARTIAL_REPLY`, `FULL_REPLY`, `NO_REPLY_AS_OF_DATE`, `LATE_REPLY`, `SUMMARY_CORRECTED`.
- **Case:** `DRAFT`, `INVESTIGATING`, `MONITORING`, `PARTIAL_OUTCOME`, `CLOSED_WITH_REASONS`, `REOPENED`; case state independent of unanswered questions.

**Proof precision:** App opening email/WhatsApp composer **never means SENT**. Actual manual user action with a trustworthy receipt can yield a recorded `MANUAL_DISPATCH_REPORTED` with evidence, subject to verification. A provider's accepted API response proves `CHANNEL_ACCEPTED` only, not necessarily recipient delivery. `DELIVERY_VERIFIED` requires suitable channel/delivery acknowledgement. Screenshots alone are claims/proofs of interface state, not verified receipt at official desk. Never falsify court/government acknowledgement; if none exists retain factual `NO_REPLY_AS_OF_DATE` only after documented reasonable opportunity. Original outgoing question version and entire reply remain immutable; revised official/response summary = additional event, never overwrite.

**Send concurrency:** atomic question version+case version+grant/risk check, idempotency key and server event receipt; prevent 2 taps racing into 2 sends. For external nontransactional send, distinguish `ATTEMPTED`/UNKNOWN from confirmed status, avoid unsafe blind auto-retry; explicit manual reconciliation. Freeze exact text/recipient/evidence refs once authorized; edits require new approved revision.

## 4. Founder PROOF PACK (CP09 approved) and notification reliability

Each serious/restricted packet is a **private linked set** (not raw payload in push or email): case UUID, related existing Article UUID/PURLs, dates and geography, what is alleged vs sourced vs official vs independently ground-verified vs unknown, **source provenance and verification classification**, signed/hash verified receipts *when truly verified*, material conflicting evidence, safety/conflict flags, exact frozen question+recipient/channel, Editor decision/reasons/time/actor, reply deadline basis, attempt/receipt state, outstanding evidence gaps, late/partial updates. **No missing field filled with fake evidence.**

- **Notice vs access:** B3 in-app low-noise alert/digest contains only case ID, brief safe label, risk, Editor decision and action link; private pack read fetches through real Owner authorization, never public or sensitive notification data. An actual Owner access receipt is different from a notification queued/sent.
- **Durability:** packet and Editor decision commit to case ledger; B3 enqueue errors are auditable with retry/reconciliation; Owner queue page retains pending alerts even if notification fails. **Founder receives visibility without becoming normal Reporter bottleneck**, but no unverified claim that an external notification was delivered.
- **Verification authenticity:** sha256 of actually stored bytes, source date vs receipt date, sender/contact proof, note on conflicting data, original vs revised documents, document quarantine until validated. Encryption and RLS do not themselves prove factual truth.

## 5. Data and privacy contract (coding later)

**No second Article publisher**: one Master Case UUID; links 1..n existing independent Articles with their original immutable ID/PURL. Same-story correction uses the exact master Article and visible correction history; genuine new follow-up creates another Article ID linked to same case. Owner-only News publish/unpublish/published correction. B8 public timeline ONLY explicit Founder-approved **server-side allowlisted projection**; never `select *`, client-side hidden private columns or raw `article_versions.snapshot`. Restricted source, allegations, minor, phone, personal contact, raw evidence object paths and internal notes never public by default.

**Logical new home minimally scoped:** Case master/applicability; case↔Article references; immutable evidence metadata/verified-object receipts/revisions; event ledger for cost/deadlines/ground/status/outcome; questions/dispatch/replies. Reuse original `audit_logs`, B3 notifications, Topic8 retention, B1 permissions and existing Article writer. This is a **contract, not final physical table list**, to avoid unnecessary rebuild. Existing Article FK cascades mean protected Case evidence MUST survive lawful Article removal under correct hold/tombstone rules, without modifying locked old FKs blindly. Retention must support lawful holds, authorized documented redaction and case-specific rules, no unsupported blanket forever/delete.

**Reporter evidence upload:** Current private editorial bucket is Owner-AAL2 managed, so **granting all reporters direct bucket wide permissions is REJECTED**. Proposed narrow authenticated upload route: scoped case ID, short-lived upload authorization, preflight MIME+size+magic+hash+virus safety, verified server-side receipt, object namespace opaque and private, no public signed URL; Owner/Editor grant derives from existing B1. The route does not exist yet; require actual JWT/RLS cross-case and stale-upload proof before final adoption. No new paid bucket/provider needed until free quotas proven insufficient, and any paid addition needs new Founder approval.

**Retention and deletes:** append-only audit+original proof never silently modified by Founder as subject; updates create revisions; legal hold prevents accidental cleanup. Exceptional lawful requests may redact public material but keep access-controlled auditable original as law permits. If legal obligation requires deletion, record exception with precise decision and safe tombstone, do not claim original bytes remain. Existing Article permanent delete permission is a separate existing Founder-only path; B8 case must not introduce a deletion bypass.

## 6. Real Android Reporter -> Editor -> Founder practical proof (updates old R1 A06/A07)

| Device stage | Exact actual action after implementation | PASS evidence, NOT simulated |
|---|---|---|
| A01-03 | Verify genuine user role, Owner MFA where relevant; public Article still normal; assigned serious Case created with private status | actual device+source SHA, case ID, no public leak |
| A04-05 | Reporter adds authentic referenced docs via scoped secure upload; notes contradictions/verified status | real stored receipt and safe sensitive media access proof; not local preview |
| **A06-R0** | Active assigned Reporter sends neutral normal official records question without Founder approval | real authorized RPC decision + honest transport state + immutable audit; no Owner OTP |
| **A06-R1** | Reporter prepares serious evidence pack; Editor accepts or returns | exact reviewed question revision/recipient + Editor action + reason; no Reporter unapproved direct send |
| **A07-FOUNDER** | Founder opens serious case from private B3 queue and sees supporting original sources and gaps | actual authorized secure read + case-specific proof, notification failures honest; Founder view does NOT create editor approval |
| **A07-R2** | Restricted sensitive original cannot send before Founder fresh AAL2; test AAL1+revoked and safe records-only route | denied cross-role/unsafe disclosure; no bypass; genuine approval if actually granted |
| A08-09 | Actual reply or no-reply-as-of cutoff, separate official/ground update and revised deadline | original reply+older deadline immutable; no fabricated office reply |
| A10-12 | Founder approves safe public projection, same-story correction keeps UUID/PURL; later follow-up new Article ID | actual Android Incognito privacy, correct history/2 Article links |
| A13-15 | Partial/monitor/reopen, credential revoke, offline double tap and controlled B8 outage with News | unchanged original audit, E3 fail screenshot only where safe, old News independently works |

15 original Android stages remain; A06/A07 add **R0/R1/R2 subflows**, not extra official T numbers. Tests need actual enrolled Reporter, Editor, Founder on authorized devices/accounts and approved dedicated safe case, no real unsolicited officer messages in pre-production test.

## 7. Risk matrix and mandatory no-pass negatives

| Risk | Negative test (disposable backend + actual role/Android when required) | Necessary outcome |
|---|---|---|
| Role bypass | anonymous, advertiser, suspended/revoked, unassigned/other case Reporter attempts `send` / uploaded file | denied server+Storage, no fake audit or signed URL |
| Scope/grant expiry | Reporter loses role or territory while draft offline, reconnect submits | exact server reject, preserve draft as unsent |
| Reviewer race | Editor approves revision1 while Reporter edits to revision2; duplicate Editor actions | only frozen approved revision1 can send; revision2 demands new review, auditable conflict |
| Risk tier downgrade | Client sends 2routine2 claim while stored risk R2, or Editor tries downgrade | recompute/restrict; cannot bypass Founder required action |
| Proof fabrication | purported sent screenshot not authenticated/recorded; API accepted vs recipient received | pending/manual reported not `DELIVERY_VERIFIED` |
| Packet leakage | anon/API/public timeline/notification/guess URL accesses private evidence | no private object/source/PII returned and safe errors |
| Missing evidence | serious draft has contradictory/unverified source, Editor rubber-stamps with no reason | `EVIDENCE_GAP`/return; neutral fact question allowed separately only within assigned R0 scope |
| Double-send/provider down | two backend requests/transport times out and retries | no duplicate transmission claimed; outcome `UNKNOWN` or confirmed by evidence |
| Case version/delete race | Article cascade delete, case reopen, hold, concurrent evidence rewrite | original event/hold preserved, fail closed or authorized tombstone; no silent evidence deletion |
| Foundation regression | corrupt or unavailable B8 service while normal News/Grievance/Live/Auth used | old B0–B6 unaffected, protected Phase3 test suite GREEN |
| Self-investigation | JANTA BOL/Founder being subject, original source conflicts with conclusion | flag, independent review where feasible; impossible for Founder to alter original evidence silently |
| Retention and security | public/private source projection, signed URL expiry, quotas, Storage forged MIME/hash | reject/quarantine, audited retention and safe private read |

Retain the earlier **30 SEC01..SEC30 tests** (Appendix B) with rewritten authority gates; add specific **RPT01..RPT12** scoped Reporter/Editor/Founder workflow tests in Appendix C. Existing 51 ACC case definitions updated below in Appendix A. No test number removed; still exactly 8 official B8 tests.

## 8. CP10-CP12 Design Freeze: five pending Founder approvals only

The **FD-B8-02 Reporter/Editor/Founder PROOF PACK** business rule is **ALREADY APPROVED**. The remaining matters are safe recommended defaults, NOT silently approved merely because Founder asked for deep audit:

| Decision | Recommended option A for one combined approval | Why approval required |
|---|---|---|
| **FD-B8-01** | Case/evidence/timeline PRIVATE until Founder approves explicit sanitized public projection | Privacy/editorial exposure control |
| **FD-B8-03** | Right-to-Reply opportunity case-specific with recorded basis; urgent exception reason; no invented universal 24/48h statutory rule | Legal/editorial judgment |
| **FD-B8-04** | Original/version receipts append-only; lawful hold, correction and rare controlled deletion/redaction with immutable decision trail where legally permitted | Retention/legal process |
| **FD-B8-05** | Same evidence rules even Founder-as-subject, conflict flag and independent Editor review where possible; Founder cannot tamper immutable original | Governance independence |
| **FD-B8-06** | Reuse existing FREE 2private-editorial2 storage, but only through new scoped case-upload gateway after real security proof; fallback metadata-only if bucket/quota unsafe | Reporter usability vs private RLS |
| **CP10 risk taxonomy** | R0 Reporter direct; R1 Editor approval + Founder evidence pack (Founder read not mandatory for send); R2 Founder prior AAL2 restricted-action approval, safe neutral records inquiry possible | Consequences of serious escalation and timeout |

**Recommended sign-off text after review:** 2A - remaining five defaults plus R0/R1/R2 taxonomy approved; B8 R3 design/test freeze, CODING STILL NOT AUTHORIZED UNTIL I SAY START.2 Or 2B - I want changes to FD... 2. Do not infer this explicit signoff from prior selection A, which applied ONLY to Reporter serious-case route.

## 9. Architecture choices deliberately NOT falsely locked

- Table names, SQL signatures, private file gateway endpoint and sanitized notification fields will be coded from R3 invariants **only after a disposable PG17 feasibility prototype and real source baseline compare**. Prototype/testing work requires later coding approval; design must not pretend an endpoint currently exists.
- External official delivery provider and response receipt capabilities remain manual-assisted first; do not buy a provider or auto-send outside verified authorization. E9 may need a legitimate real official inquiry with a normal course record, not invented for a test. If missing, specific proof stays DUE.
- Exact legal response duration, retention period and conflict reviewer independence are **case-law/context-specific**, not established legal obligations by this blueprint. A future legal review may be required for particular sensitive case, not an excuse to silently weaken current privacy gates.
- Current GitHub review source and production deployment mismatch exists as distinct News/B12/E7 gate. B8 source ZIP after coding is not proof of Vercel production activation. Need exact production domain and Android later, with user authorization.
- Frozen **requirements/test acceptance** possible after one grouped signoff; cannot promise zero implementation bugs in advance. Enforcement is red-first negative tests and protected regression, not absolute claim.

## 10. B8 complete PASS and B0-B8 master ZIP delivery gates

- T092..T099 must each have original required E-class: E9 **authentic documentary source** where required, real Owner/reporter E5 and real Android E3 for T098. 51 ACC acceptance cases fully trace, plus 30 security+12 Reporter negatives. Keep `NOT RUN` until executed; no synthetic real office reply.
- All affected B0-B6 and Phase3 original protected test evidence GREEN on **exact release HEAD**; Founder B0-B6 lock respected; current older TEST-REGISTER mismatches kept as reconciliation task, not overwritten silently.
- B7 first actual payment/real shop Ad held until after News soft launch; **do not conflate B7 official 9/60 final ledger with B8 PASS**.
- Future complete master ZIP includes each safe file of canonical pinned git tree (prior source 454 tracked files, count grows), full backend source and SQL, all CI/workflows/test records, manifest per-file SHA256, 178-ID B0-B8 test index (67 official +60 ADS +51 ACC), Android SPCK ready derived zip, and explicit safe no-secret exclusions. Offline SPCK cannot run DB/RLS/Auth tests; runtime selector must show required environment, **never implicit live DB mutation/payment**.
- Final 2PASS+LOCK2 only after actual real evidence, proper Founder release approval, CRC/extraction/hash verification and tested Android path; otherwise label handoff NOT FINAL.

## 11. Design-time checks *actually* performed (not product passes)

- Original existing R1 detailed matrix parsed **51 unique ACC IDs** and original security matrix **30 unique SEC IDs**. R3 normalizes exactly conflicting R1 authorization rows and includes **12 new Reporter route probes** without weakening official E classes.
- Reviewed prior GitHub CP09 Founder approved decision and CP07 pending list on live review branch. Previous design contains known stale 2Founder authorizes every send2 assumptions; these are superseded in R3, NOT left as parallel valid requirements.
- Past read-only real Supabase authority and previous Git source audits summarized; no new SQL/DML, site deploy, phone test, E2/E3/E9 response, paid provider or official final status created.
- **Audit verdict:** Design and negative-test reconciliation **R3 technically consistent** on reviewed source, with six-item bundled Founder signoff (five FD + risk taxonomy) still required before FINAL DESIGN LOCK. CODING NOT STARTED.

---

# APPENDIX A/B - COMPLETE 51 ACC + 30 ORIGINAL NEGATIVE CARDS

**R3 normative note:** Detailed original R1 card list below is **carried forward with the role/dispatch wording updated** for CP09. Any lingering general phrase about Founder reserved *published Article* authority stays valid. Contradictions should be flagged before coding, not used to claim old R1 per-question approval governs.



**Status for every row: DESIGN TEST ONLY — NOT RUN**. **R3 amendment overrides old R1 per-question Founder-send assumption:** Reporter ordinary send permitted only on active assigned case; serious Editor review + Founder real proof packet; restricted Founder prior consent. Original required E-classes remain unchanged. `Expected` is grounded in original group pass contract and prior audit derivation; `Adversarial negative` is our planned test, NOT an asserted existing defect. Full per-case original sections need final Founder/spec reconciliation at CP05.

| ID / Official | Expected positive after real action | Adversarial / failure attempt (must be denied or safely recorded) | Fixture / actor / required evidence |
|---|---|---|---|
| ACC-001 / P4-T092 (§825-826) | Reuse only existing Article/evidence/audit homes; one case domain, no second editor | Attempt to create a second Article editor/publication authority; refuse architecture sign-off. | F0 / F1; editorial reviewer / Founder; E7+E9 |
| ACC-002 / P4-T092 (§827) | Existing Evidence→Verify→Question→Response→Follow-up→Outcome preserved | Attempt to skip verification and jump directly from evidence intake to published findings. | F0 / F1; editorial reviewer / Founder; E7+E9 |
| ACC-003 / P4-T092 (§828) | Case starts from real cited evidence, not predetermined finding | Submit unsupported allegation with no source; no final finding created. | F0 / F1; editorial reviewer / Founder; E7+E9 |
| ACC-004 / P4-T092 (§829) | Same neutral source criteria regardless of government/Founder/advertiser | Apply different source threshold to Founder vs government; case reviewed as method failure. | F0 / F1; editorial reviewer / Founder; E7+E9 |
| ACC-005 / P4-T092 (§830) | No judicial guilty/innocent declaration | Try recording a criminal/judicial verdict using editorial fields; refuse wording. | F0 / F1; editorial reviewer / Founder; E7+E9 |
| ACC-006 / P4-T092 (§831) | Allegation/official/ground/judicial/unresolved fields remain distinct | Merge allegation, official claim and verified ground fact into a single unlabeled finding. | F0 / F1; editorial reviewer / Founder; E7+E9 |
| ACC-007 / P4-T092 (§832-833) | Serious public impact triggers case; routine news stays simple | Open ordinary routine News; B8 case form must NOT be required or auto-started. | F0 / F1; editorial reviewer / Founder; E7+E9 |
| ACC-008 / P4-T092 (§834) | Applicability is documented human editorial decision | Let AI silently classify and publish high-impact case without human decision. | F0 / F1; editorial reviewer / Founder; E7+E9 |
| ACC-009 / P4-T093 (§835) | Document stated project/policy reason with source | Record policy reason without original official reference; draft-only, no attribution claim. | F1; editorial reviewer / Founder; E2+E9 |
| ACC-010 / P4-T093 (§836-838) | Cost stages sanctioned/tender/revised/actual remain separate with verified source | Enter estimate as Actual / blank as zero; reject stage confusion and invented expenditure. | F1; editorial reviewer / Founder; E2+E9 |
| ACC-011 / P4-T093 (§839-842) | Official promised impact vs ground verified impact tracked independently | Mark official impact promise as independently ground-verified; deny promotion. | F1; editorial reviewer / Founder; E2+E9 |
| ACC-012 / P4-T093 (§843-844) | Optional alternatives only when sourced; reject invented option | AI-invented alternative with no source must not appear as verified recommendation. | F1; editorial reviewer / Founder; E2+E9 |
| ACC-013 / P4-T094 (§845) | Evidence-based specific questions drafted and linked | Insert unrelated inflammatory question absent supporting evidence; require edited draft. | F2; scoped Reporter normal dispatch / serious Editor review + Founder proof; E2+E5+E9 |
| ACC-014 / P4-T094 (§846) | AI suggested question cannot send or become finding | AI suggestion attempts SEND via service credential; DENY and no dispatch. | F2; scoped Reporter normal dispatch / serious Editor review + Founder proof; E2+E5+E9 |
| ACC-015 / P4-T094 (§847-848) | Reporter ordinary send under active assignment; serious send requires Editor approval | Valid scoped Reporter ordinary send permitted; unassigned/revoked Reporter direct send and unreviewed serious send DENIED with no false dispatch. | F2; scoped Reporter normal dispatch / serious Editor review + Founder proof; E2+E5+E9 |
| ACC-016 / P4-T094 (§849) | Right-to-reply opportunity and genuine send/delivery proof | Click SENT with no delivery/channel proof; remain UNKNOWN/NOT_CONFIRMED. | F2; scoped Reporter normal dispatch / serious Editor review + Founder proof; E2+E5+E9 |
| ACC-017 / P4-T094 (§850-852) | No reply factual + urgent documented exception; not indefinite silence block | Premature claim “refused reply” before documented opportunity; reject wording. | F2; scoped Reporter normal dispatch / serious Editor review + Founder proof; E2+E5+E9 |
| ACC-018 / P4-T094 (§853-859) | Later and long original reply, labeled summary and correction preservation | Replace original long reply with truncated or mistaken summary; original must remain. | F2; scoped Reporter normal dispatch / serious Editor review + Founder proof; E2+E5+E9 |
| ACC-019 / P4-T094 (§860-863) | Unanswered statuses per question, public display approved, late answer retained | Mark all questions answered after only one partial reply; unanswered set persists. | F2; scoped Reporter normal dispatch / serious Editor review + Founder proof; E2+E5+E9 |
| ACC-020 / P4-T095 (§864-865) | Official completion claim not verified ground completion | Authority claims complete, ground finding says pending; no auto-verified completion. | F3; case staff draft, Founder protected decision; E2+E5+E9 |
| ACC-021 / P4-T095 (§866) | Original promise/deadline timestamp and cited source retained | Change original promised date in place; preserve timestamp and original source. | F3; case staff draft, Founder protected decision; E2+E5+E9 |
| ACC-022 / P4-T095 (§867-868) | Missed deadline and all original/revised milestones preserved | Overwrite earlier deadline on extension and erase lateness; append new event. | F3; case staff draft, Founder protected decision; E2+E5+E9 |
| ACC-023 / P4-T095 (§869-871) | No inferred motive; evidence-supported follow-up questions | Ascribe personal motive without documentary proof; neutral status remains. | F3; case staff draft, Founder protected decision; E2+E5+E9 |
| ACC-024 / P4-T095 (§872-874) | Responsibility Map lists documented role not guilt; revisions append | Name a person as guilty from their office role; map role only. | F3; case staff draft, Founder protected decision; E2+E5+E9 |
| ACC-025 / P4-T096 (§875-879) | A serious case has one Master Accountability UUID | Create duplicate master Case UUID for same linked set without documented split. | F4; case staff draft, Founder protected decision; E2+E4+E5+E9 |
| ACC-026 / P4-T096 (§880-882) | Multiple later Article IDs linked without rewriting original Article/PURL | Correct original story by changing its Article UUID or old permalink; DENY. | F4; case staff draft, Founder protected decision; E2+E4+E5+E9 |
| ACC-027 / P4-T096 (§875-877) | Internal/public milestone projections separate and chronologically correct | Expose internal timeline rows/source identities in public timeline view. | F4; case staff draft, Founder protected decision; E2+E4+E5+E9 |
| ACC-028 / P4-T096 (§883-890) | Final, partial, monitoring and Founder-reopen preserve old outcome | Close a case while unresolved questions remain without explicit recorded disposition. | F4; case staff draft, Founder protected decision; E2+E4+E5+E9 |
| ACC-029 / P4-T097 (§891) | Same fact standards across government/opposition/advertiser/self | Lower evidence standard for advertiser or own Founder; flag inconsistency. | F5 / F6; Owner/AAL2 protected evidence; anon negative; E2+E5+E7+E9 |
| ACC-030 / P4-T097 (§892-895) | Founder-as-subject conflict flag and publish vs evidence power split | Founder-as-subject hides conflict flag / silently edits evidence; guard immutability. | F5 / F6; Owner/AAL2 protected evidence; anon negative; E2+E5+E7+E9 |
| ACC-031 / P4-T097 (§894-895) | Original evidence immutability/versioned digest and no hidden rewrite | Mutate original evidence digest/metadata after receipt; DENY; version is new. | F5 / F6; Owner/AAL2 protected evidence; anon negative; E2+E5+E7+E9 |
| ACC-032 / P4-T097 (§896) | Large evidence pack without arbitrary record-count limit and quotas protected | Hard-coded arbitrary 20-evidence-item ceiling; use paged quota-safe handling. | F5 / F6; Owner/AAL2 protected evidence; anon negative; E2+E5+E7+E9 |
| ACC-033 / P4-T097 (§897-899) | Preserve internal evidence != automatically publish it | Mark stored-private document publicly downloadable by toggling case public flag. | F5 / F6; Owner/AAL2 protected evidence; anon negative; E2+E5+E7+E9 |
| ACC-034 / P4-T097 (§900-901) | Original/revised external document sequence and references preserved | Overwrite initial official document with revised one; preserve both digests. | F5 / F6; Owner/AAL2 protected evidence; anon negative; E2+E5+E7+E9 |
| ACC-035 / P4-T097 (§902) | Changed documents cannot produce unsupported motive claim | Call revision a corrupt motive without sourced finding; remain neutral. | F5 / F6; Owner/AAL2 protected evidence; anon negative; E2+E5+E7+E9 |
| ACC-036 / P4-T098 (§903-905) | Same-story correction uses original Article ID/PURL and visible note | “Correction” mistakenly creates a new Article master ID/URL; FAIL. | F4 / F7; Owner publish; staff draft; anon/revoked negative; E1+E2+E3+E4+E5+E9 |
| ACC-037 / P4-T098 (§905) | Genuine new development gets separate Article ID linked to same case | Genuine new development edited into old Article while masking new date; new ID required. | F4 / F7; Owner publish; staff draft; anon/revoked negative; E1+E2+E3+E4+E5+E9 |
| ACC-038 / P4-T098 (§906) | B3 shared safe notification on deadline/response/failure event | Notification failure blocks News publish or says WhatsApp sent; FAIL closed for notice. | F4 / F7; Owner publish; staff draft; anon/revoked negative; E1+E2+E3+E4+E5+E9 |
| ACC-039 / P4-T098 (§907-912) | Shared audit/Topic 8 retention and legal hold, no silent delete | Legal hold is bypassed by archive/delete/cascade; preserve event and evidence. | F4 / F7; Owner publish; staff draft; anon/revoked negative; E1+E2+E3+E4+E5+E9 |
| ACC-040 / P4-T098 (§913) | Anonymous/other roles denied private evidence RLS/storage | Anon/reporter/Owner AAL1/revoked guesses private case document path; DENY. | F4 / F7; Owner publish; staff draft; anon/revoked negative; E1+E2+E3+E4+E5+E9 |
| ACC-041 / P4-T098 (§914) | B8 failure independently isolated from News/Live/grievance | B8 subsystem outage prevents ordinary News reading/publishing; FAIL. | F4 / F7; Owner publish; staff draft; anon/revoked negative; E1+E2+E3+E4+E5+E9 |
| ACC-042 / P4-T098 (§915) | Physical Android Evidence→Verify→Question→Reply→Follow-up→Outcome | Actual Android loses unsent changes or Reporter bypasses assigned scope / Editor serious review / Founder extreme-risk gate. | F4 / F7; Owner publish; staff draft; anon/revoked negative; E1+E2+E3+E4+E5+E9 |
| ACC-043 / P4-T098 (§877,897,913) | Public timeline/response is privacy-projected and separate from internal notes | Public search/reply view leaks internal source URL/evidence note/phone. | F4 / F7; Owner publish; staff draft; anon/revoked negative; E1+E2+E3+E4+E5+E9 |
| ACC-044 / P4-T098 (§910,915-916) | Founder-only exceptional decisions and low routine tap count preserved | Routine status update demands Founder AAL2 unnecessarily; only meaningful gate. | F4 / F7; Owner publish; staff draft; anon/revoked negative; E1+E2+E3+E4+E5+E9 |
| ACC-045 / P4-T099 (§917-918) | Actual source-to-requirement implementation delta and no duplicate authority | Second audit/publish/notification engine introduced despite existing authority. | F0-F7; CI reviewer / Founder release sign-off; E1+E2+E5+E7+E9 |
| ACC-046 / P4-T099 (§919) | All ACC-001..051 represented by executable test/evidence cards | Any of ACC001..051 missing a measurable expected/actual/evidence row; BLOCK lock. | F0-F7; CI reviewer / Founder release sign-off; E1+E2+E5+E7+E9 |
| ACC-047 / P4-T099 (§917,920) | No political score/rank/endorsement; neutral same-process fixtures | Political ranking/leaderboard or asymmetric outcome thresholds; BLOCK. | F0-F7; CI reviewer / Founder release sign-off; E1+E2+E5+E7+E9 |
| ACC-048 / P4-T099 (§921) | Public output/privacy scan covers leaked identities/notes/evidence | Fabricated secret markers visible in public API/HTML/email snippet; FAIL. | F0-F7; CI reviewer / Founder release sign-off; E1+E2+E5+E7+E9 |
| ACC-049 / P4-T099 (§922) | Demonstrated RED→RCA→minimum fix→same-case retest before PASS | After reproducible RED, speculative fix without first divergence or retest; NO PASS. | F0-F7; CI reviewer / Founder release sign-off; E1+E2+E5+E7+E9 |
| ACC-050 / P4-T099 (§919,923) | Full impacted old Phase3/Phase4 CI GREEN on exact checked HEAD | Protected Phase3 CI red on same B8 SHA or missing DB gate; STOP. | F0-F7; CI reviewer / Founder release sign-off; E1+E2+E5+E7+E9 |
| ACC-051 / P4-T099 (§923) | Lock requires outcome, links, role, evidence, history, neutral, DUE honesty | Try release with partial evidence/unknown real dispatch/unfinished Android; block final lock. | F0-F7; CI reviewer / Founder release sign-off; E1+E2+E5+E7+E9 |


## 4. Formal negative/attack test matrix (beyond the 51 case descriptions)

| Ref | Injection/setup (only approved isolated environments) | Exact fail-safe proof / expected result | Maps |
|---|---|---|---|
| SEC01 | anonymous case UUID and evidence UUID enumeration | no private row/key/source metadata or different leak-bearing errors | 092/097/098/099 |
| SEC02 | Reporter opens unassigned case / guesses another case's stored document | 403/empty within role contract; no signed URL or audit bypass | 097/098 |
| SEC03 | Owner AAL1 attempts restricted reopen/private evidence approval; unassigned/revoked Reporter tries normal send | server denies each restricted action; no false dispatch or audit success | 094/096/097 |
| SEC04 | revoked Owner session reuses prior approved token | denied on server session check; no report access | 097/098 |
| SEC05 | attacker inserts unsafe HTML/JavaScript/SQL-like payload in reply/evidence label | escaped text, DB parameterized commands, no DOM execution | 094/097/098 |
| SEC06 | public case page obtains internal source, full reply PII, storage object key | explicit allowlist returns none; safe approved redaction only | 097/098/099 |
| SEC07 | source origin revised with changed SHA/content but same version ID | immutability guard blocks, new evidence revision accepted separately | 097 |
| SEC08 | two concurrent actors approve/revise same evidence | one serial valid outcome; second conflict, no silent replacement | 097/099 |
| SEC09 | question SEND attempted twice with retry and replay | one genuine send receipt only; failures UNKNOWN; no duplicate claim | 094 |
| SEC10 | outbound transport rejects message | no SENT or delivered state, retry audit; News and Case remain | 094/098 |
| SEC11 | provider manual response edited or truncated | original preserved under restricted retention; corrected summary appends | 094/098 |
| SEC12 | late reply after prior no-response cutoff | append late receipt; public status can update with time, old record retained | 094/096 |
| SEC13 | one of three questions answered | two unanswered remain, case not falsely fully resolved | 094/099 |
| SEC14 | published correction vs new follow-up | correction same ID/PURL, new story new ID, links preserved | 096/098 |
| SEC15 | exceptional Article deletion with B8 legal hold | no silent loss of case event/provenance; authorized legal route trace | 096/097/098 |
| SEC16 | evidence corrupted/oversize/wrong MIME/EXIF/unsupported format | quarantine/reject before trusted receipt; no public URL | 097/098 |
| SEC17 | private-editorial and public-media cross-bucket probes | private path denies anon/reporters; no private copy into public bucket | 097/098 |
| SEC18 | notification inbox unavailable/owner suspended | evidence/case state consistent; no false delivery; News unaffected | 098/099 |
| SEC19 | public search or embedding indexes private case | never indexed/returned until explicit approved safe projection | 097/099 |
| SEC20 | claimed ground completion conflicts with a sourced on-site report | displayed as different attributed statuses; no auto-verified label | 093/095 |
| SEC21 | cost data with unknown figure + percent formula | never interpret unknown as 0; avoid invented spend / accuracy percentages | 093 |
| SEC22 | case contains Founder as subject | flag conflict; strict same evidentiary policy; Founder cannot edit original evidence | 092/097/099 |
| SEC23 | missed deadline recurring/reminder burst | no spam/unbounded worker; event history and important Owner queue only | 095/098 |
| SEC24 | B8 API/worker disabled while News publishing, grievances, LIVE accessed | News and locked B0–B6 paths remain operational; no sharing wrong DB transaction | 092/098/099 |
| SEC25 | post-merge canonical source SHA differs from deployed SHA | release stops; no preview-only evidence used as production lock | 099 |
| SEC26 | old Phase3 baseline CI fails on exact B8 release candidate | stop regression; RCA, fix same case, rerun all affected old tests | 098/099 |
| SEC27 | private E9 artifact appears in CI log/screenshot | redact before storing proof; evidence reference/hash retained privately | 097/098/099 |
| SEC28 | requested escalation to paid storage or provider | require actual necessity, alternate design, explicit Founder approval; no forced purchase for MVP | all |
| SEC29 | timeline event omitted or altered during reorder/pagination | stable server ordering plus event IDs, original chronology retained | 095/096 |
| SEC30 | access check only implemented in Android UI | server role/row/storage tests reject unauthorized calls directly | 094/097/098 |

**Attack labels are test definitions, not confirmed vulnerabilities.** Never run destructive injections, brute-force or real external-message sends against LIVE production without explicit authorisation, safeguards, staging, and rollback.




# APPENDIX C - NEW RPT01..RPT12 (DESIGN-ONLY)

| ID | Setup | Expected (not yet measured) | Official home |
|---|---|---|---|
| RPT01 | Active assigned Reporter valid R0 question, Editor offline | reporter may authorize direct routine send; exact immutable attempt history | T094/T098 |
| RPT02 | Reporter role active but unassigned wrong district/beat | server denies send/read; no evidence leakage | T094/T097 |
| RPT03 | Reporter grant expired/revoked while Android offline then sync | unsent draft remains; queued attempt cannot bypass revocation | T094/T098 |
| RPT04 | Reporter manually flags serious R1 after collecting partial but genuine sources | Editor review required, evidence gaps reported, not auto-SENT | T094/T097 |
| RPT05 | Editor approves R1 question+recipient+revision1; Reporter changes text to revision2 | changed question cannot use prior approval | T094/T099 |
| RPT06 | Editor returns R1 for corrections; Reporter double-taps send | no dispatch; no false Editor approval or notification success | T094 |
| RPT07 | Serious R1 Editor approval and independent private Founder proof queue, B3 adapter down | durable packet preserved and retryable; Editor-authorized safe send not falsely blocked; no false delivered notification | T094/T098 |
| RPT08 | Genuine R2 restricted evidence, Editor overrides risk label in UI | server requires Founder specific authorization; no exposure | T094/T097 |
| RPT09 | Founder AAL1/revoked token attempts R2 approval; Owner AAL2 then proper approval | reject AAL1/revoked, accepted controlled AAL2 only if current server session valid | T094/T098 |
| RPT10 | WhatsApp composer opens then browser closes, no receipt | transport COMPOSER_OPENED_NOT_SENT/UNKNOWN, never DELIVERY_VERIFIED | T094/T095 |
| RPT11 | Provider times out, duplicate retry and late reply | one intent, honest UNKNOWN and new later reply event; no response fabricated | T094/T095 |
| RPT12 | Physical Android Owner/Editor/Reporter and anonymized public timeline attack | correct role navigation and restricted packet only for permitted role; private case not exposed in public | T097/T098/T099 |

**No additional official test numbers invented.** These are internal coverage extensions only.