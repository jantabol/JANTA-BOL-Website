# JANTA BOL — B8 ACCOUNTABILITY SYSTEM
## CP02–CP04: DETAILED DESIGN + TEST EXECUTION BLUEPRINT
**17 October 2026 | PRE-CODING • DISCUSSION DRAFT R1 • NOT A RELEASE**

> **NO REBUILD · CODING LAST · NO FAKE PASS · B0–B6 FOUNDER LOCKS PRESERVED · B7 FIRST REAL PAID AD HOLD IN ITS OWN LANE**

**Purpose.** This is the next planning checkpoint after the earlier independent audit. It turns the original 321-page Phase-4 Master Execution Pack (Topic 13, Sections 825–923; Test Blueprint PDF pp312–314) into a **reviewable logical architecture, authority model, threat-first test script and 51 pre-execution evidence cards**. Each detailed field/state/protocol is a **PROPOSAL**, not a previously approved Founder lock and not proof of an implemented feature.

**Implementation/Testing reality.** Candidate source authority reviewed: GitHub `jantabol/JANTA-BOL-Website` B7 review branch `181bbf7decef4b1ec78f2ae789607acdf55453b3`; LIVE Supabase catalog (read-only) shows Article/Source/Version/Audit/Grievance/B3 Notification/Retention/Auth foundation. New dedicated B8 case workflow **not implemented** in those inspected sources. `P4-T092...P4-T099` = **0/8 FINAL PASS/LOCK**, `ACC-001...ACC-051` = **51/51 NOT RUN**. This document **does not run or mark tests PASS**.

**Evidence hierarchy.** (1) original Founder-approved Topic-13 requirements + later explicit Founder decisions, (2) original eight mandatory Test Blueprint evidence classes, (3) this proposed design/test script, (4) actual current Git/SQL/code after source reconciliation, (5) measured real test evidence. A fresh test failure overrides an optimistic draft. B8 never alters a B7 advertiser or payment state.

---

## CP02. Exact existing foundations and proposed architectural boundary

### 1) VERIFIED CURRENT (read-only) vs DESIGN PROPOSAL

| Authority | Verified/current observation | B8 design boundary — proposed, NOT LIVE |
| --- | --- | --- |
| Article publication | `public.articles` UUID/status + existing Publisher; `article_versions` capture; existing public Article URL | **Never create a second news Article, publication RPC or master URL.** B8 Case links independent Article UUIDs and may request correction in existing publication flow. |
| Internal source | `article_sources` holds private notes, verification references, confidential flag; `verification_history` present | Case evidence never copies private values into public Case projection or search; access by reviewed server roles only. |
| Immutable/general audit | `audit_logs` with enabled immutable-prep/guard triggers; Article lifecycle/retired-identity triggers enabled | Reuse common audit authority; separate case-event append-only chronological facts without creating another platform-wide audit engine. |
| B3 Notifications | `live_notifications`, delivery history and internal notifier exist; anonymous emitter EXECUTE denied | Call B3 domain integration via established interface; send failure != delivery receipt and must not break News. |
| B5 Grievance | Grievance tables/history/evidence exist, RLS on | Complaint is a distinct intake; case references it when appropriate; no shadow complaint system or private complainant disclosure. |
| B6 Compliance | B6 existing infrastructure, Founder reports it LOCKED | No dependency on special B6 workflows, but preserve shared notifications/retention/news features in regression. |
| Storage | `private-editorial` private (50 MiB/file), `grievance-private` private (20 MiB/file), `public-media` public. Owner AAL2 policy on private-editorial observed | First review existing private-editorial policy/namespace; prove role and guessed-object negatives; never silently place restricted evidence into public-media. |
| Retention | `record_retention_state` and hold flag; RLS on; shared retention engine | B8 case history must be legal-hold-aware, not auto-expired. Deletion should respect existing lawful disposition without silent history loss. |
| Branch/Deployment | Working News Article exists in B7 review branch; earlier real Vercel production was old main | Before *public* B8 implementation, resolve exact integrated source + canonical URL and rollback gate separately. Not a reason to buy hosting or test paid ads. |

**Source-verified preservation hazard (not an existing confirmed exploit).** Current live Article-source, Article-version and verification-history FKs have `ON DELETE CASCADE`, while grievance's Article FK uses `SET NULL`. If a *separately authorized* Article permanent deletion occurs, B8 history must not rely only on rows that may cascade. Design a durable, restricted case audit/evidence-reference record with lawful exception and legal-hold controls; **do not rewrite B0–B6 FK policy in a B8 planning document**.

### 2) Logical ownership — exactly one source of truth per domain

```text
[Original NEWS Article + UUID + Publisher + Correction] (EXISTING)
                     |  explicit Article link
                     v
         [B8 MASTER ACCOUNTABILITY CASE] (NEW LOGICAL HOME, proposed)
             |          |           |           |
         CLAIMS      EVIDENCE    QUESTIONS   DEADLINES / RESPONSIBILITY
             |          |           |           |
         VERIFICATION / REPLY / GROUND / OUTCOME / CASE EVENTS
                |         |           |
        [B3 Notifications] [Shared audit] [Shared retention + Auth]
               ALL EXISTING authority interfaces are reused
       Public case view = APPROVED, SANITIZED PROJECTION ONLY
```

**Invariants:** 1 case can relate to many separately published Article IDs; each Article retains one and only one canonical URL. Case updates are **not** an Article edit. Public case pages, if approved, never auto-publish private case internals. Routine news never requires creating a case.

### 3) Minimum logical objects and ownership (NOT a table-number commitment)

| Logical object | Required data / invariant | Authority boundary |
| --- | --- | --- |
| `Case` | Stable case UUID, neutral title, applicability reason, category, owner, lifecycle, visibility, created/updated time | Owner final case-exception approval, bounded draft staff permissions; no automatic public status. |
| `CaseArticleLink` | Case UUID, original Article UUID, relation (`initial`, `follow_up`, `correction_ref`), actor+time | Server validates Article and publication status before public link; no Article ID changes. |
| `CaseClaim` | Claim text, **claim type** (alleged / authority-stated / independently verified / judicial-record), source reference, verification state, event time | No conversion to finding without E9 and reviewer sign-off. |
| `CaseEvidence` + versions | Type, collection method, provenance, received vs source effective time, restricted/public flag, original bytes hash, size, MIME, Storage reference, revision/supersedes link | Append-only version; no silent replacement, explicit redaction, no exposed object key in public. |
| `CaseQuestion` + dispatch ledger | Specific evidence-based question, recipient jurisdiction, prepared_by, final_authorized_by, attempts, actual dispatch proof and **per-question** reply status | Reporter draft allowed; only Founder/explicitly authorized backend actor SEND; failure cannot mark sent. |
| `CaseReply` | Original full response file/text + verification, received time, summary (separate approved revision), exact questions covered | Partial / late response allowed; original immutable; no-response label factual as-of. |
| `CaseDeadline/Check` | Original and revised promised dates, declared vs independently observed completion, visit/evidence source, follow-up action | No old deadline mutation; independent verification proof. |
| `CaseResponsibility` | Entity/jurisdiction, official role period and cited source; not a guilt marker | Evidence-corroborated record; no motive inference. |
| `CaseEvent/Outcome` | Append-only actor/time/reason/diff; open / monitoring / partial / outcome / reopened; notification/audit pointers | Reopen retains previous outcome, not overwrite. |
| `PublicProjection` | Explicit published subset: neutral language, safely attributed sources, privacy scrub, approved timeline and Article links | Founder-approved only; server-side projections, never direct view into source versions. |

**NOT permitted by default:** new editor, shadow `articles`, copy of `audit_logs`, second notification queue, political score, automated guilt verdict, auto-posted AI questions, public unprotected evidence bucket, duplicate source of publication truth.

### 4) Draft case lifecycle, with server-guarded transitions (Founder approval at freeze)

```text
CASE_DRAFT → EVIDENCE_COLLECTING → VERIFICATION_REVIEW → QUESTIONS_DRAFT
                                    ↓                       ↓
                               FOLLOW_UP ← REPLY_WINDOW ← SEND_VERIFIED
                                    ↓
                           MONITORING / PARTIAL_OUTCOME
                                    ↓
                              OUTCOME_RECORDED
                                    ↓  (NEW material evidence + authorized action)
                                  REOPENED ──→ VERIFICATION_REVIEW
```

All states above are **conceptual**; no DB enums or column names are frozen. Case paths are nonblocking: a legitimate urgent/low-importance case may skip unnecessary case stages if Founder documents reason; **ordinary News never waits** for this lifecycle.

**Guards:** (i) one immutable case ID, (ii) transitions are backend-authorized, (iii) no state assumes legal guilt or project completion, (iv) no public projection until separate approval, (v) reopen/event append only, (vi) B8 unavailable = independent News unaffected, (vii) a failed evidence upload does not create a fake stored evidence item.

### 5) Question + reply lifecycle — stronger than case-level status

```text
QUESTION_DRAFT → READY_FOR_AUTHORIZED_REVIEW → SEND_ATTEMPT_RECORDED
                                        ├─ FAILURE: NOT_SENT (retry log)
                                        └─ VERIFIED_SENT (genuine channel proof)
                                              ├─ NO_REPLY_AS_OF(t) [not permanent]
                                              ├─ PARTIAL_REPLY [unanswered questions stay open]
                                              └─ REPLIED + LATER_REPLY (all original versions retained)
```

Only real proof allows `VERIFIED_SENT`. Client click, local clipboard action, generated WhatsApp link or an unsuccessful API call does **not** prove delivery; record exact method and verified observation honestly. A WhatsApp double-check or third-party delivery receipt should not be promised unless verified. If a response summary is wrong, create a separately visible corrected summary and preserve original full response. No automatic fixed 24h/48h reply window is imposed without Founder/case-level decision.

### 6) Evidence provenance, validation and legal hold

**Minimum provenance:** immutable `case_id`, `evidence_item_id`, original version/hash, capture source and method, claimed/received/verified timestamps **distinct**, evidence type/MIME/size, classification (`CONFIDENTIAL`, `INTERNAL`, `PUBLIC_APPROVED`), source citation/record reference, who accessed/reviewed, approval and supersedes/redaction rationale. Actual personal identifiers stored privately, not embedded into public audit messages.

**Binary trust:** input payload format/size validation; only allowlisted MIME; verify server-side actual content; prevent path traversal/IDOR; virus/media safety where available; audit upload incompletion/timeout; media and document viewing must be private-access guarded. No unlimited physical file size even though the original Blueprint disallows arbitrary limit on **number** of evidence items.

**Deletion:** default retain append-only history per policy; legal/retention exceptions must use existing controlled disposition, write protected audit and a visible safe tombstone (never a hidden missing link). HOLD denies unauthorized purge; keep the original legal restriction if compelled redaction is necessary. The package does NOT decree an irreversible retention term; final timeline requires verified policy.

### 7) Founder/Roles/Authority matrix — PROPOSED least-privilege, NOT existing policy

| Action | Public / Advertiser | Reporter | Editor/Admin | Owner + AAL2 | System Worker |
| --- | --- | --- | --- | --- | --- |
| Read approved PUBLIC summary | Yes (sanitized only) | Yes | Yes | Yes | Read projection only |
| Read PRIVATE evidence / confidential source | **Deny** | Deny unless specifically authorized | Deny by default; per-case explicit grant only after governance review | Approved sensitive access (still auditable) | No user-facing access |
| Propose Case/Draft questions | Deny | Draft inside assigned work | Draft + review within assigned cases | Yes | No editorial decisions |
| Record provenance / upload safe private evidence | Deny | Pending access design; assign narrowly | Assigned only under reviewed policy | Yes with proper audit | Only scoped validated upload processing |
| Mark claim verified / approve external statement | Deny | Propose, NOT final | Review draft, NOT final until Founder confirms authority | Yes, evidence + role guard | No |
| Actually SEND right-to-reply | Deny | Deny | Deny at launch unless explicitly delegated | Owner AAL2, with real dispatch evidence | No auto-send unless separately approved |
| Publish Article/correct SAME master URL | Deny | Deny | Deny under original Founder lock | **Owner only; existing Article engine** | No |
| Approve PUBLIC Case milestone / REOPEN / exceptional delete | Deny | Deny | Deny at launch | **Owner AAL2 only** | No |
| Edit/delete original evidence, old response or prior outcome silently | **Deny** | **Deny** | **Deny** | **Deny** | **Deny** |

**Conflict of interest:** if Founder is the subject, flag and record why source review/publish was handled as it was; separate access to immutable evidence from editorial approval; optional independent reviewer process is a **Founder choice**—do not weaken the existing Founder-only publishing rule without explicit approval.

### 8) Protected public projection and privacy boundary

Public B8 preview, if explicitly enabled, may show: neutral case title; verified/stated source-attributed facts; publicly approved question / factual reply status, selected approved milestones; links to separately published Articles. It must **never** show: private source identity/notes, internal verification evidence, confidential witness contact, raw submitted grievance, preliminary accusations presented as fact, draft questions, internal audit metadata, unrestricted original binary storage URL, hidden response identifiers, or account/session tokens.

Public search, OpenGraph previews, share text, push/in-app notifications, browser logs, analytics and exported data are **separate leak surfaces** that need independent negative tests. A direct `select *` join from existing Article Source/Version should be forbidden in B8 public access. Server-side RLS/projection must control access, not a hidden HTML element.

### 9) Dependency block and safety-first rollout design

**Not blocking planning or safe isolated code later:** no real paid B7 ad, payment gateway, Cloudflare switch, new paid storage. **Blocking public/production B8:** confirmed exact integrated Git source, Article permanent URL, private Storage policies and platform Auth roles, Founder-approved case-publication authority, live migration/rollback plan and original protected CI. **Blocking B8 FINAL LOCK:** physical Android E3, real backend E2/Role negative, original E9 credible documentary proof, E4 same Article URL, history/audit E5 and full original tests.

**Important nuance:** a CI mock “sent” is not an external dispatch. Real E9 for a public-interest claim must be a genuine independent source; safe synthetic documents remain valid only for low-risk isolated feature/RLS tests, not for evidence-based editorial accuracy claims.

---

## CP03. Threat-first security and failure-model freeze (DRAFT)

| Risk ID | Real attack/mistake to reproduce before LIVE | Impact / exact PASS-STOP criterion | Existing authority to reuse | Priority |
| --- | --- | --- | --- | --- |
| TH01 | Anon guesses Case/Evidence UUID and invokes table/RPC/Storage reads | **No disclosure, no valid signed URL, no metadata leak** | RLS, scoped Storage policies | CRITICAL |
| TH02 | Public case feed joins `article_sources`/`article_versions.snapshot` | Confidential source or unpublished draft never exposed | Existing Article source RLS and safe projection | CRITICAL |
| TH03 | Reporter/Editor marks external question SENT without Owner dispatch | No SENT, no false audit/notification | Owner AAL2 and append-only audit | HIGH |
| TH04 | Old Founder conflict case evidence edited/removed | Prior original hash/content retained, even after exception | Append-only evidence versions + audit | CRITICAL |
| TH05 | Article deleted and cascaded version/source rows used as sole case evidence | Protected master Case history remains or operation safely denied under hold | Retention state, audit, specific case snapshots | CRITICAL |
| TH06 | Unpublished Article linked publicly by case | Public projection omits link until independently published | Existing Article status RLS | HIGH |
| TH07 | Public no-response label persists after genuine late reply | Chronology updates; original no-reply as-of history retained | B3 notification / case events | HIGH |
| TH08 | Fake “actual spend” from revised/tender document | Claimed/stated/actual categories never silently conflated | Evidence-verified claim fields | HIGH |
| TH09 | Owner AAL1/revoked token invokes publication/reopen/private export | Deny backend; no mutation/leak | Original Owner AAL2/session invalidation | CRITICAL |
| TH10 | B8 notification send fails and blocks normal Article publish | News independent; safe failed-notification record, no fake sent | B3 notification engine | CRITICAL |
| TH11 | Public share/SEO/logs expose private source or reply | Preview contains only approved and redacted projection | Article public renderer, notification projection | HIGH |
| TH12 | Case ends when some questions remain unanswered | Partial/monitoring statuses retain open items | Case per-question status + history | HIGH |
| TH13 | Old PDF changed/replaced silently; manipulated revision time | Original hash remains and signed/authorized version timeline intact | Case version metadata + private Storage | CRITICAL |
| TH14 | B8 module outages break existing Auth/Grievance/Live/News | Existing protected Phase3/Phase4 regression GREEN | Old CI, existing namespaces | CRITICAL |
| TH15 | Same standard fails when subject is JANTA BOL itself | Same validated states, conflict flag and no ranking | Founder governance + case test fixtures | HIGH |
| TH16 | Server-side SSRF/unsafe URL/evidence MIME exploit | Safe allowlist, no arbitrary shell/egress, protect uploads | Existing Storage gateway / strict validation | HIGH |

**Regression rule:** Before claiming any `TH*` PASS, run actual negative against an isolated real Postgres (when implemented), with authorized actor + anonymous/foreign role, then after integration against approved deployed source/Android when required. A mock browser blocked screen is NOT RLS proof.

---

## CP04. B8 test pack — ORIGINAL 8 Tests / 51 PROPOSED ACC case cards

### 10) Test evidence abbreviations (original Final Test Blueprint)

| Evidence | Required real artifact (no substitution) |
| --- | --- |
| E1 | Exact-commit GitHub CI URL, relevant executed checks and regression logs. |
| E2 | Measured backend/API/real PG transaction, RLS/role controls, state before-after and negative. |
| E3 | Founder-owned physical Android phone/tablet screenshot/video for required workflow, no identities shown. |
| E4 | Same permanent Article UUID and master URL before-after correction, separate new development URL when appropriate. |
| E5 | Immutable audit/history/notification record with actor/time/reason/event and negative. |
| E7 | Original source and migration/deploy/rollback config digest, one SOT, current code map. |
| E9 | Genuine independent document / source evidence / full response and dispatch acknowledgement, attributed and privacy protected. |

Status domain for **every 51 card** at pre-coding: `NOT RUN`. Any failure is `FAIL / RCA DUE`. `DUE` requires a genuine identified external prerequisite and Founder-approved reopen, **not** a convenient label for bugs, incomplete coding, RLS failure or missing Android. No `PASS+LOCK` appears in this planning document.

### 11) 51-case design table — actual steps/negative/expected proof
| ACC | Official | Source | Fixture | Action / RED candidate | Expected observed outcome (proposed) | Proof class / collection | Status |
|---|---|---|---|---|---|---|---|
| **ACC-001** | P4-T092 | 825-826 | F0, F1 | Try forcing ordinary News into a mandatory case; compare a documented serious case | **Ordinary News saves/publishes independently; serious case is opted into a separate structured record** | E7+E9; E7 source map + E9 representative case | NOT RUN |
| **ACC-002** | P4-T092 | 827 | F1 | Enter allegation, official statement and verified fact into identical slots | **No unqualified category conversion; each keeps attribution and verification level** | E7+E9; Category state + E9 provenance | NOT RUN |
| **ACC-003** | P4-T092 | 828 | F1 | Leave supporting evidence empty then request VERIFIED/PUBLISHABLE finding | **No verified finding without traceable evidence/reviewer** | E7+E9; Before/after authorized DB + E9 | NOT RUN |
| **ACC-004** | P4-T092 | 829 | F0, F1 | Try B8 public publish using non-Owner or direct case update | **Original Article publisher only; case cannot publish Article** | E7+E9; RLS negative + existing Article PURL | NOT RUN |
| **ACC-005** | P4-T092 | 830 | F1 | Draft serious chronology; leave routine case unchecked | **No automatic political accusation, judicial guilt or routine-news burden** | E7+E9; Editorial screenshots / source docs | NOT RUN |
| **ACC-006** | P4-T092 | 831 | F1 | Classify ground inspection as judicial conclusion | **Claim/finding/judicial categories isolated and provenance-backed** | E7+E9; Backend reject + textual output | NOT RUN |
| **ACC-007** | P4-T092 | 832-833 | F1 | Hide evidence/attempt unqualified public allegation | **Evidence-first and approved safe projection; missing proof is visible internally** | E7+E9; Evidence linkage + public output | NOT RUN |
| **ACC-008** | P4-T092 | 834 | F0, F1 | Simulate B8 module missing while saving ordinary News | **News path independent; no competing news publishing engine** | E7+E9; Original baseline CI, source and Article ID | NOT RUN |
| **ACC-009** | P4-T093 | 835 | F1 | Capture stated purpose without source then ask to label official reason | **Unsupported official statement cannot become attributed verified fact** | E2+E9; Source document + reason record | NOT RUN |
| **ACC-010** | P4-T093 | 836-838 | F1 | Confuse sanctioned/tender/revised/actual cost and null values | **Four distinct optional provenance-backed stages; unknown never displayed as zero** | E2+E9; E9 cost documents + state diffs | NOT RUN |
| **ACC-011** | P4-T093 | 839-842 | F1 | Mark an official promised benefit as independently achieved | **Stated outcome remains distinct from field independently verified evidence** | E2+E9; Cited impact + E2 record | NOT RUN |
| **ACC-012** | P4-T093 | 843-844 | F1 | Generate plausible but uncited alternative solution | **Alternative must be source-supported or explicitly not established** | E2+E9; E9 evidence + public text | NOT RUN |
| **ACC-013** | P4-T094 | 845 | F2 | Draft sharp questions with no linked claim/evidence | **Questions remain draft and evidence-linked before approval** | E2+E5+E9; Question record + source refs | NOT RUN |
| **ACC-014** | P4-T094 | 846 | F2 | Have AI suggestion directly dispatch or turn question into factual claim | **AI cannot SEND, approve or create verified finding** | E2+E5+E9; Authority negative + event trace | NOT RUN |
| **ACC-015** | P4-T094 | 847-848 | F2 | Reporter attempts final dispatch | **DENIED with no sent record; authorized Founder path separately testable** | E2+E5+E9; Auth/role negative + audit | NOT RUN |
| **ACC-016** | P4-T094 | 849 | F2 | Mark SENT without actual dispatch proof; simulate failed attempt | **Only verifiable dispatch proof becomes SENT; failed attempt recorded honestly** | E2+E5+E9; Genuine receipt E9 + state/history | NOT RUN |
| **ACC-017** | P4-T094 | 850-852 | F2 | After deadline, label no reply as evasion; urgent exception without reason | **Factual as-of no-reply text only; urgent documented exception** | E2+E5+E9; Timestamp + E9 contact attempt | NOT RUN |
| **ACC-018** | P4-T094 | 853-859 | F2 | Receive partial then late original reply; overwrite old reply/summary | **Full original preserved, partial/unanswered linked, corrected summary append-only** | E2+E5+E9; Original responses + correction history | NOT RUN |
| **ACC-019** | P4-T094 | 860-863 | F2 | Claim all questions answered after one partial reply | **Each question keeps own answered/unanswered status** | E2+E5+E9; E2 per-question query + chronology | NOT RUN |
| **ACC-020** | P4-T095 | 864-865 | F3 | Mark authority completion claim as independent site verification | **Authority claim not ground verification until distinct source/evidence** | E2+E5+E9; E9 field proof + comparison | NOT RUN |
| **ACC-021** | P4-T095 | 866 | F3 | Change original deadline date in place | **Append revised promise preserving original source/date/actor** | E2+E5+E9; E2 audit history + E9 | NOT RUN |
| **ACC-022** | P4-T095 | 867-868 | F3 | Pass revised deadline; suppress overdue follow-up | **Missed/updated deadlines remain and reminders fail safely** | E2+E5+E9; Clock-controlled history + notification E5 | NOT RUN |
| **ACC-023** | P4-T095 | 869-871 | F3 | Infer deliberate motive from delay alone | **No inferred motive; source-supported questions allowed** | E2+E5+E9; Public text / evidence trace | NOT RUN |
| **ACC-024** | P4-T095 | 872-874 | F3 | Write guilt into responsibility map instead of documented role | **Only verified jurisdiction, role, period; revisions append** | E2+E5+E9; E9 role proof + history | NOT RUN |
| **ACC-025** | P4-T096 | 875-879 | F4 | Create second master case for same case identity accidentally | **One accountable case ID; duplicate warning/reconciliation not silent merge** | E2+E4+E5+E9; DB keys + before/after E2 | NOT RUN |
| **ACC-026** | P4-T096 | 880-882 | F4 | Use one Article ID for a genuinely later new story | **Separate story obtains own Article ID/PURL; case link only** | E2+E4+E5+E9; E4 both Articles and case link | NOT RUN |
| **ACC-027** | P4-T096 | 875-877 | F4 | Place confidential internal timeline event in public projection | **Only explicitly approved/privacy-reviewed milestones go public** | E2+E4+E5+E9; Anon API/output and admin comparison | NOT RUN |
| **ACC-028** | P4-T096 | 883-890 | F4 | Close case while open questions; later reopen rewriting old outcome | **Monitoring/partial state honest; Founder reopen appends reason, time and evidence** | E2+E4+E5+E9; Event history + role E5 | NOT RUN |
| **ACC-029** | P4-T097 | 891 | F5 | Run same evidence fixtures for opposing parties / own organization | **Same state machine/proof threshold and no political ranking** | E2+E5+E7+E9; Paired deterministic outcomes + E9 | NOT RUN |
| **ACC-030** | P4-T097 | 892-895 | F5 | Case involves Founder; attempt to remove conflict flag/edit evidence | **Conflict disclosed internally; Founder publish authority not evidence tamper right** | E2+E5+E7+E9; RLS/append-only negative + audit | NOT RUN |
| **ACC-031** | P4-T097 | 894-895 | F5 | Replace original stored document with revised bytes | **Original immutable hash/version; new revision separate** | E2+E5+E7+E9; Hash before/after + private storage probe | NOT RUN |
| **ACC-032** | P4-T097 | 896 | F5 | Add > normal sample-count of small valid files and an over-size file | **No arbitrary count cap; per-file size/quota rules explicit, fail-closed** | E2+E5+E7+E9; Upload receipts/denials, no paid storage | NOT RUN |
| **ACC-033** | P4-T097 | 897-899 | F5 | Publish a preserved private document directly via Case UI | **Preserved != public; separate editorial approval and sanitized output** | E2+E5+E7+E9; Anon/public projection negative | NOT RUN |
| **ACC-034** | P4-T097 | 900-901 | F5 | Upload original then amended official document and tamper timestamps | **Both bytes/source/received-times/versions retained** | E2+E5+E7+E9; E9 originals/revision and hashes | NOT RUN |
| **ACC-035** | P4-T097 | 902 | F5 | Infer corrupt intent solely from document changed amount | **Motive remains UNESTABLISHED without evidence** | E2+E5+E7+E9; Output and evidence coverage | NOT RUN |
| **ACC-036** | P4-T098 | 903-905 | F4, F7 | Edit existing Article with wrong fact, check sharing/new ID | **Same original UUID/PURL with visible dated correction note** | E1+E2+E3+E4+E5+E9; E4 real Article before/after, E3 | NOT RUN |
| **ACC-037** | P4-T098 | 905 | F4, F7 | Publish genuinely new development as silent correction to old Article | **Distinct Article ID/PURL; linked master case; old Article intact** | E1+E2+E3+E4+E5+E9; E4 two master URLs | NOT RUN |
| **ACC-038** | P4-T098 | 906 | F7 | Break B3 notification transport during case reply/deadline event | **Domain truth succeeds/fails honestly; no fake delivered receipt** | E1+E2+E3+E4+E5+E9; B3 outbox/error history + isolation | NOT RUN |
| **ACC-039** | P4-T098 | 907-912 | F5, F7 | Attempt case deletion while legal HOLD active and original Article deleted | **No silent case/evidence purge; authorized exceptional disposal auditable** | E1+E2+E3+E4+E5+E9; Retention E2 + snapshots E5 | NOT RUN |
| **ACC-040** | P4-T098 | 913 | F6 | Anon, revoked, reporter and foreign-case users guess private evidence path | **No private data or signed URLs leaked across authority boundaries** | E1+E2+E3+E4+E5+E9; Server RLS and storage API negatives | NOT RUN |
| **ACC-041** | P4-T098 | 914 | F7 | Disable B8 function; concurrently read/publish an ordinary Article | **News/Live/Grievance available; errors isolated** | E1+E2+E3+E4+E5+E9; Real protected CI + Article E4 | NOT RUN |
| **ACC-042** | P4-T098 | 915 | F7 | Run complete workflow with physical Android phone/tablet | **Legible, reachable steps, no excessive Founder actions; audit each transition** | E1+E2+E3+E4+E5+E9; Real Android E3 screenshots/video, private sanitized | NOT RUN |
| **ACC-043** | P4-T098 | 877,897,913 | F6 | Search public timeline and notifications for internal source or draft fields | **No hidden note, private snapshot, full contact or unreleased proof appears** | E1+E2+E3+E4+E5+E9; Anon API/HTML/search/notification privacy sweep | NOT RUN |
| **ACC-044** | P4-T098 | 910,915-916 | F7 | Try Editor/Reporter final exceptional reopen/public send/publication | **Backend denies nonauthorized actors; Founder queue records meaningful action** | E1+E2+E3+E4+E5+E9; Role/audit E2/E5 + tap trace | NOT RUN |
| **ACC-045** | P4-T099 | 917-918 | F0–F7 | Trace all new interfaces against existing authoritative modules | **Only minimum additions; source contract and no duplicate engine** | E1+E2+E5+E7+E9; Git diff/current source E7 | NOT RUN |
| **ACC-046** | P4-T099 | 919 | F0–F7 | Deliberately omit an ACC card from closure registry | **Gate refuses PASS unless 51 evidence cards map correctly** | E1+E2+E5+E7+E9; Coverage machine-readable source audit E1 | NOT RUN |
| **ACC-047** | P4-T099 | 917,920 | F5 | Try to generate a political scorecard or ranking from case subjects | **No score, favoritism, endorsement, or auto-guilt route** | E1+E2+E5+E7+E9; UI/API scan + same-process fixtures | NOT RUN |
| **ACC-048** | P4-T099 | 921 | F6 | Probe public export, browser bundle, RPC, logs and notifications for PII | **Private fields never leak; escaped safe public projection** | E1+E2+E5+E7+E9; PII scan + negative API records | NOT RUN |
| **ACC-049** | P4-T099 | 922 | F6, F7 | Force seeded B8 failure; apply first wrong fix, confirm RED then patch | **Repro→authority→first divergence→minimum fix→same retest→affected CI** | E1+E2+E5+E7+E9; RUN IDs and RCA, real reproducible data | NOT RUN |
| **ACC-050** | P4-T099 | 919,923 | F0–F7 | Run protected Phase3/Phase4 CI on exact B8 source SHA | **All affected original gates GREEN; no bypass/skip** | E1+E2+E5+E7+E9; Original CI URL/SHA and red-case audit | NOT RUN |
| **ACC-051** | P4-T099 | 923 | F0–F7 | Attempt Final LOCK with missing E9/E3 or production mismatch | **Formal lock fails; real evidence and Founder signoff required** | E1+E2+E5+E7+E9; 51-card manifest and E1/E2/E3/E4/E5/E7/E9 | NOT RUN |

### 12) Fixture/library design: one shared reproducible pack, NO fabricated public facts

| Fixture | Contents to prepare BEFORE implementation; safe test source authority | Exact failure branches to include |
| --- | --- | --- |
| **F0 Ordinary News** | Existing safe unpublished/published demo Article, no accountability trigger | B8-disabled; no case creation; Article publication independent |
| **F1 Public-money Case** | **Real, attributable** budget/order/project materials for future E9; **synthetic** cost state for early E2 | Unknown actual spend, revision vs original, official-vs-ground, alternatives with no source |
| **F2 Questions/Reply** | Legitimate public authority question template; dispatch attempts, failed channel, partial and late response proof when actually available | Actor AAL1/Reporter negative; NOT_SENT; no-reply after date; late authentic reply, full original preserved |
| **F3 Ground/Deadline** | Original/revised official completion statements and independent dated field checks | Forgotten original date, inferred motive, false completion, fake reminder delivery |
| **F4 Case/Articles** | One original Article A, later Article B, Article A correction, Case C | Forced duplicate URL, public link before publish, reopen erasing prior outcome, lawful delete under HOLD |
| **F5 Neutrality/Conflicts** | Structurally equivalent case records about government, opposition, advertiser and JANTA BOL | Asymmetric evidence threshold, founder-as-subject edited proof, manipulated document version |
| **F6 Privacy/Abuse** | ONLY invented identities/test content in CI; distinct Anon/Reporter/Editor/Owner-AAL1/Owner-AAL2/revoked/subject roles | Cross-case IDOR, private bucket path guessing, HTML/URL injection, public notification leak |
| **F7 Outage/Android** | Controlled isolated B8 evidence/notification down scenario + actual Android workflows (later) | Stuck loader, unsent marked SENT, News down, inaccessible owner queue; slow network, offline/resume |

**Real E9 gating:** A synthetic “government reply” can test formatting/storage only. It cannot establish that a real authority replied or that a public claim is true. For official E9, record authentic attribution, provenance/time and safe privacy handling. When no real response exists, prove **NO_REPLY_AS_OF** truthfully rather than inventing one.

### 13) Actor×Action negative matrix — prepare before coding

| Actor context | PRIVATE case evidence read | Draft question | Send attempt/SENT authority | Publish Article / public milestone | Reopen | Cross-case export |
|---|---|---|---|---|---|---|
| Anonymous / public | DENY | DENY | DENY | DENY | DENY | DENY |
| Advertiser | DENY | DENY | DENY | DENY | DENY | DENY |
| Reporter (assigned) | Proposed **DENY until scoped policy approved** | ALLOW draft only | DENY | DENY | DENY | DENY |
| Editor/Admin | DENY by default; per-case exception not assumed | Limited assigned draft/review | DENY until explicit Founder delegation | DENY original Founder publish-only lock | DENY | DENY |
| Founder AAL1 | DENY sensitive | Permit limited nonprivileged draft if same session authorized | DENY | DENY | DENY | DENY |
| Founder AAL2 active | Approved scoped read | ALLOW | ALLOW **only with genuine send evidence** | Original Article system / explicit safe case projection | ALLOW with material evidence+audit | DENY unrelated protected record |
| Revoked/expired session | DENY | DENY | DENY | DENY | DENY | DENY |
| Worker/service | Only minimal scoped processing with audit | DENY editorial authorship | Not autonomous SENT by default | DENY Article publishing | DENY | DENY |

**Note:** Actors/authorization here are PROPOSED minimum safe rules, not proof they are enforced in current Supabase. Per-case staff access, exact Founder SEND privilege and public-summary approval are genuine final Founder sign-off questions.

### 14) Physical Android E3 test route, to execute AFTER safe implementation

**Phone (narrow portrait), Tablet (portrait + landscape):** sign in authorized Owner account, open 1 serious case (NOT forced for routine News); add provenance-safe document; review source and citation, distinguish claim/ground/judicial status; draft 2 questions, attempt unauthorized send in separate actor (backend denied); authorized genuine send proof; partial reply and later supplemental reply state; revised deadline; published Article A same UUID correction; new Article B follow-up; reopen with reason; public safe Case view and private evidence denial; inspect Founder pending queue and routine tap effort. For critical actions, verify actual Owner AAL2 and current source SHA. Capture sanitized screenshots + backend state before/after + E5.

**No safety shortcut:** Do not record any third party phone numbers, private individuals' identity papers or confidential source in shared screen captures. Do not invent external dispatch or send unsolicited messages as a test. Testing E3 is not requested from Founder at this planning checkpoint.

### 15) Negative/failure campaigns — external provider not needed

- **Isolation:** simulate B8 evidence database RPC unavailable/permission denied/timeout, B3 notification failure, unavailable private file object and unauthorized actor. Ordinary Article reading, existing Publisher, Grievance and Auth work unchanged; no fake queued reply.
- **Integrity:** lost upload/two concurrent revisions/case reopened same time/Owner idle timeout; server serializes or rejects without duplicate/overwrite; case event remains true.
- **Privacy:** search, pagination, public feed, article links, OpenGraph, browser storage, logs, email/notification, Storage APIs and guessed URL paths. All secret fields withheld server-side.
- **Evidence quality:** unknown cost, projected cost mislabel, unverified allegation, non-attributed reply, only summary without original, manipulated ‘late response’, question unlinked to evidence. Each fails **at the authority layer**, not only UI.
- **Neutrality:** comparable fixtures from different subject categories must get comparable procedural checks; outputs must not be ranking/endorsement.
- **Release:** if original protected Phase3/B0–B6 regression is RED or main/production source differs, STOP and do not lock B8 even when isolated CI passes.

### 16) Exact evidence record for every test (BLANK TEMPLATE, no fake fields)

```text
ACC ID / Official P4-T ID: __________
Master section/page: __________
Original document/Case source (E9): __________
Current Git SHA, target branch, protected baseline SHA: __________
Migration/config deployed? YES/NO; evidence + rollback SHA: __________
Environment LIVE/STAGING/DISPOSABLE; actor, AAL, device: __________
Case UUID / Article UUID / linked IDs (nonsecret): __________
Pre-state (fields, counts, permissions): __________
Action/negative/clock/network condition: __________
Expected exact authority state: __________
Observed backend state/response + trace ID: __________
E1 CI run; E2 real SQL/API; E3 Android; E4 PURL; E5 history; E7 source; E9 original: __________
Security/log/export privacy scan: __________
RCA if RED + minimum safe change + same-case rerun: __________
Outcome: NOT RUN / IN PROGRESS / FAIL / PASS / DUE (only justified)
Reviewer, evidence location, timestamp, Founder decision if required: __________
```

### 17) STOP/GO checkpoints — coding remains LAST

| Pre-coding Gate | Current planning outcome | Remaining before 'DESIGN FINAL PASS + LOCK' |
|---|---|---|
| **P1 — Exact Source/Auth/Storage Reconciliation** | PRELIMINARY checked via read-only Git/PG catalog | Verified current release source, live rights full role matrix, exact private bucket ownership/access API, expected file/API contracts, no B0–B6 regressions |
| **P2 — Architecture/Transitions** | DRAFT R1 written here | Review no-duplicate model, field classification, legal hold+delete, error/reopen states, Actor/AAL2 matrix; Founder approvals |
| **P3 — Threat/Custody/Founder Defaults** | DRAFT R1 written here | Legal/editorial applicability and storage review, exact Founder decisions, evidence custody and practical quotas |
| **P4 — 51 Tests & Android Evidence** | **51/51 DESIGN CARDS DRAFTED; NONE EXECUTED** | Check fixture E9 availability, expected negative server outcome, actual deployed source plan, source mapping peer review; no invented pass |
| **P5 — Independent Self-critic & Freeze** | OPEN | External independent reading of R1 + Founder grouped answer, versioned approved blueprint and test register, then coding authorization |
| **B8 Feature Coding** | **NOT STARTED** | Only after P1–P5 fully signed off; one safe block, each step CI, real E2/E5/E3/E9. |

### 18) Self-Critic: eight deliberate challenges to this proposal

1. **Too many tables?** Logical objects are NOT a licence to create 10 new tables: choose only missing, normalized homes after inspecting exact current source and measured security.
2. **Founder-as-subject conflict:** A conflict flag without enforceable untamperable audit may be cosmetic; define what reviewer sees/records but do not give anybody new publish authority without Founder approval.
3. **False provider sent:** manual 'sent' click is not delivery proof. Must distinguish *attempted*, *externally accepted*, *delivered*, *replied*, and *unknown* based on channel evidence—not pretend every channel has a delivery API.
4. **Article deletion cascade:** Article linked sources/version/histories currently use CASCADE: pure case link is not strong enough; legal hold aware history integrity needs a design which does not secretly force all old Article deletions to be banned.
5. **Data minimization:** attaching every original grievance or internal Article note to case could expose more than needed. Link by ID and check role rather than making duplicates.
6. **Provenance vs truth:** Full-source copy and hash prove bytes were recorded, not that the allegation or document contents are true. Ground verification and editorial judgment remain independent.
7. **Date and deadlines:** event `occurred_at`, `observed_at`, `received_at`, `recorded_at`, timezone and backdated correction must be distinct; user-supplied time cannot replace backend audit timestamp.
8. **E9 starvation:** some representative events have no authentic late reply or government documents available; don't fabricate or call a synthetic demo a final E9 PASS. Real case sample selection must preserve privacy and practicality.

### 19) Founder checkpoint — one grouped decision set, NOT asked individually now

| Founder decision pending | Conservative proposal to approve/reject later | Why essential |
|---|---|---|
| **FD01 Serious-case trigger** | Manual Founder case creation from evidence; Reporter/Editor may recommend but may not auto-accuse | Prevent blanket burden on routine news. |
| **FD02 Final SEND authority** | Owner+AAL2 alone at launch; no delegation or AI auto-send; genuine receipt mandatory | SEND has legal/editorial stakes. |
| **FD03 Public case timeline** | Private by default; manually approve only source-safe public milestones, later corrections on original Article URL | Privacy and no factual mislabeling. |
| **FD04 Reply deadline** | Set per case from real context/urgency and recorded dispatch; no universal invented statutory SLA | Avoid false no-reply claims. |
| **FD05 Founder conflict case** | Mandatory conflict flag + protected original evidence + reviewer statement; publication stays Founder-only | Source/authority neutrality without unapproved privilege transfer. |
| **FD06 Storage & quotas** | First validate private-editorial existing; no new paid storage by default; per-file rules, no fixed total count limit | Privacy and free-tier cost/limits. |
| **FD07 Exceptional record removal** | Legal hold-aware restricted disposition + append-only trace; never silent purge; case-specific legal review | Protect required history and lawful restrictions. |

### 20) Current verdict, independent no-code checkpoint

**Deliverable complete:** CP02 logical design draft + role/state/data/publicity boundary; CP03 threat and negative scenarios; CP04 detailed **51 proposed cases** + eight original gate mapping + evidence scripts; safe founder decision register.

**NOT complete:** all real B8 E2/E3/E4/E5/E7/E9 execution; integrated exact B0–B6 and production source/Git source parity; final Founder-approved Design Freeze; legal review for actual published cases; LIVE deployment; coding. **P4-T092–T099 still 0/8 PASS+LOCK.**

**Next step:** Independent cross-check of the 51 source maps/roles and a single Founder decision checkpoint; then explicit 'Design FINAL PASS+LOCK' gate. Only then begin separate B8 coding.

**SOURCE BASIS:** original `JANTA_BOL_PHASE_4_MASTER_EXECUTION_PACK.pdf` sections 825–923 pp231–253 and P4-T092–T099 pp312–314, previous B8 audit 17 Oct, read-only Supabase schema/roles/Storage/FK and current GitHub source. **Proposed contracts above must not override the original source's stricter wording.**