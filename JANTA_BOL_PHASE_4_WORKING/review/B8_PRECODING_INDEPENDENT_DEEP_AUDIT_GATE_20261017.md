# JANTA BOL — B8 ACCOUNTABILITY / Independent PRE-CODING Audit & Gate
**Date:** 17 Oct 2026 | **NO CODE, NO DB MIGRATION, NO DEPLOY, NO PAID SERVICE** | Formal B8 T092–T099 = **8/8 NOT RUN**
**Source:** Founder-uploaded 321-page `JANTA_BOL_PHASE_4_MASTER_EXECUTION_PACK.pdf`: scanned original master **Sections 825–923 / PDF pp231–253**, Final Tests **P4-T092–T099 / PDF pp312–314**, B0–B13 execution + governance pp2–18. Founder confirms B0–B6 LOCKED, B7 first real shop ad/payment on separate HOLD after News soft launch; **B8–B13 must be completed fully, not half-built.**

## Real audit (not implementation)
- Read original Topic13 source section-by-section, official 8 test procedures and evidence requirements; mapped **99 source sections / 51 ACC checkpoints / 8 tests / RUN-12**. Each case-level proposed expectation must be compared with any additional original ACC detailed register before coding; mapping is a **design proposal, not test PASS**.
- GitHub READ ONLY candidate `181bbf7decef4b1ec78f2ae789607acdf55453b3`, main `265856ca9cbfd6c7d51989d85435397b72f24c8d`; current candidate source `article.html`, `add-news.html`, `backend-client.js`, `phase2-client.js`, `phase4-domain-client.js`, `CODE-MAP.md`, `TEST-REGISTER.md` used. Current official T092..T099 **NOT RUN** in TEST-REGISTER. Zero B8 code present in surveyed review frontend/CI/db homes.
- LIVE Supabase `vrffsnkycvjithwtiylt` READ-ONLY: inspected 24 named relations; 16 existing Article/sources/verification/version/audit/grievance/B3-notification/retention/auth foundation relations PRESENT with RLS ON, eight illustrative accountability_* names ABSENT. Pattern scan for accountability/question/reply/follow-up tables found no dedicated B8 relations. This is an implementation gap, **not** evidence against Founder B0–B6 prior locks. Catalog policy existence is **NOT verified RLS security for the new domain**. Private source `article_sources.internal_note`, `verification_evidence`, `confidential` and JSONB `article_versions.snapshot` require explicit nonpublic boundary.
- Vercel/Source note: previously verified old-main PRODUCTION vs Founder-tested News Preview is still a **separate public News release-source E7 gate**, unrelated to a requirement to buy hosting or complete first paid ad. No main merge, migration, production change or paid provider work authorized or made.

## Eight official gates — original Blueprint evidence, all DUE/NOT RUN until REAL proof
| Test | ACC range | Master sections | Mandatory original E-class |
|---|---|---|---|
| P4-T092 Architecture/Evidence First | 001–008 | 825–834 | E7+E9 |
| P4-T093 Cost/Reason/Impact | 009–012 | 835–844 | E2+E9 |
| P4-T094 Questions/Right To Reply/Later | 013–019 | 845–863 | E2+E5+E9 |
| P4-T095 Ground/Deadline/Responsibility | 020–024 | 864–874 | E2+E5+E9 |
| P4-T096 Master Case/Outcome/Reopen | 025–028 | 875–890 | E2+E4+E5+E9 |
| P4-T097 Neutrality/Evidence/Version | 029–035 | 891–902 | E2+E5+E7+E9 |
| P4-T098 Correction/Security/Android | 036–044 | 903–916 | E1+E2+E3+E4+E5+E9 |
| P4-T099 Full Closure/Neutrality/Failure | 045–051 | 917–923 | E1+E2+E5+E7+E9 |

## Principal design locks found in original sections
1. **No parallel editorial system:** one permanent Article UUID/PURL; a **separate structured Master Accountability Record links many independent published Article IDs**; a new follow-up article is a distinct story, while same-story correction stays same PURL. No second publishing authority.
2. **Evidence-first and neutral:** separate allegation/official-stated/ground independently verified/judicial finding; **no judicial guilty/innocent pronouncement**, no political scoring/ranking/endorsement. Same evidentiary bar for government, opposition, advertiser and JANTA BOL Founder, with conflict flag.
3. **Structured factual stages:** sanctioned/tender/revised/actual expenditure never silently treated as same; sourced purposes, stated vs actual impact, optional sourced alternatives. Do not convert unknown to zero or invent a motive.
4. **Questions and Right to Reply:** Reporter/AI only DRAFT; final authorized SEND has genuine dispatch evidence; no reply is a factual status, not proof of evasion; urgent reason documented; late reply and complete original response preserved; summaries clearly labeled and corrected visibly if wrong.
5. **Case chronology:** original/revised deadlines, promised vs ground status, responsibility roles **not blame**, individual unanswered questions, internal vs opt-in public timeline, open/partial/monitoring and Founder-only reopen with original outcome unchanged.
6. **Evidence privacy/history:** original/revised document versions, no arbitrary count limit for pack (physical quotas still must be designed), preserve != publish, restricted sources never public; shared existing notification/audit/retention/security RLS engines reused. B8 outage must not stop ordinary News.
7. **Android:** full Evidence→Verify→Questions→Response→Follow-up→Outcome real device E3 and founder effort bounded; all 51 checkpoints to measured proof.

## Critical pre-coding FIRST-DIVERGENCE/security decisions
**CRITICAL**: source/Article and private evidence data could leak via public joined API; avoid generic `select *`, use backend-approved projection plus storage access tests. **CRITICAL**: RLS/Owner-AAL2/role proof for genuine send, approve, publication, restricted evidence and reopen, not client-only checks. **CRITICAL**: original evidence immutability even if Founder subject/publisher; no silent overwrite. **HIGH**: fake SENT without channel proof, partial reply false closure, deadline overwritten, second Article ID for correction, new tables duplicating audit/B3 notification, privacy leaks in case timeline/search, case failure breaking independent News. **HIGH**: actual production News source parity remains to reconcile before any public integration.

## Design-first checkpoints (no implementation yet)
- **P0 DONE:** original 99 numbered sections / 8 tests / 51 proposed ACC cases reviewed, threat matrix drafted.
- **P1 PARTIAL:** validate exact source/production Git and existing database FK/trigger/grants/Storage authority; keep B0–B6 original Pass; Founder B7 exception limited to real first paid Ad.
- **P2 TO DO:** case↔article contract, case states, actor/AAL2 matrix, public/private evidence projection, no duplicate source/audit, legal restriction, conflict and response send receipts.
- **P3 TO DO:** build exact synthetic/real documentary fixtures F0 normal news; F1 sourced cost/impact; F2 question sent/late response; F3 revised deadline/ground check; F4 separate article/reopen; F5 Founder conflict neutral; F6 attack/privacy; F7 News failure isolation.
- **P4 TO DO:** freeze one execution/evidence card per ACC001..051 and official E1/E2/E3/E4/E5/E7/E9, role negatives, Android script. Ask Founder only unresolved high-level decisions in one grouped checkpoint.
- **CODING LAST:** after approved P1–P4 and protected integrated-source gate, create separate B8 implementation branch; bounded minimum additions, protected old Phase3 CI every code push, original tests T092→T099; **8/8 FINAL PASS+LOCK only with actual proof**.

**Status: B8 independent requirements+live-catalog audit COMPLETE WITH OPEN DESIGN GATES. Source and schema testing only. NOT CODED. NO fake PASS. No paid project or production touches.**

**Full companion artifact delivered directly in chat:** `JANTA_BOL_B8_PRE_CODING_INDEPENDENT_DEEP_AUDIT_2026-10-17.pdf` (~12 pages), plus `*.md` structured long report containing full **proposed 51-item trace matrix**. Original PDF remains higher authority; this report does not override it.


## Second-pass REAL FK / Storage catalogue checks (17 October)
- **EXACT LIVE FK metadata READ ONLY:** `article_sources.article_id → articles.id` **ON DELETE CASCADE**; `article_versions.article_id → articles.id` **CASCADE**; `verification_history.article_id → articles.id` **CASCADE**; `grievance_history.grievance_id` **CASCADE**; `grievances.article_id` **SET NULL**. Existing `articles` lifecycle/history/retired-identity triggers and `audit_logs` prepare+immutable guard triggers **enabled**. No real destructive test, so no deletion exploit/protection PASS claim. For B8 a lawful exceptional Article delete can potentially remove existing linked Article source/version/verification rows, so protected independent case chronology/evidence refs + legal-hold-aware controlled disposition must not depend only on those cascading FKs; NO existing B0-B6 schema changes authorized.
- **REAL Storage metadata read-only:** `private-editorial` existing **PRIVATE 50 MiB/file**, `grievance-private` PRIVATE **20 MiB/file**, `public-media` PUBLIC **50 MiB/file**. `storage.objects` RLS ON; owner policy for private-editorial checks **Owner AAL2**. Existing B5 gateway-only policy is **RESTRICTIVE**, not a broad permissive anonymous allow (confirmed `pg_policies.permissive='RESTRICTIVE'`). No storage READ/write requests or JWT attack executed here. Never place private B8 evidence in public-media. Plan no new paid storage; review existing private bucket and prove cross-role API RLS before new sensitive evidence.
- **Additional RED-first negative specs DUE:** attempted authorized Article delete under B8 legal hold must not silently erase protected case archive; anon/reporters/revoked/Owner AAL1 denied private case objects; guessed UUID and cross-case IDOR rejected; document original/revised immutable; public feed/search/notifications must not reveal confidential source/version snapshots. These are *design checks*, **NOT PASS**. Full consolidated PDF report updated section 14. No feature coding.
