# JANTA BOL — P4-T071 / C3 — ONE-SHOT FOUR ORIGINAL BEHAVIORS + PRACTICAL RECOVERY REVIEW
**Founder instruction:** "C3 start kro or single shot m complete kro or report kro"  
**Date:** 27 October 2026 IST. **Source of Truth:** Master Phase4 p.304; P4-T071 / RUN-10 / RECOV-019–026; Frozen T071 closure route V1.0, gate **C3**.  
**Evidentiary result:** **C3 source-bound four-behavior evidence/recovery review COMPLETE and independently CI verified.** **C3 Final PASS+LOCK = HOLD** because whole integrated optional/core read/publish and Founder recovery-risk approval are unproven. We have **not** substituted old 13 mocked probes for an E8 pass. **No new sixth gate.**

## Executive result — one actual new independent verifier, not repetitive fault tests
- **New GitHub Actions run `40538508391`, job `122310189203`, SUCCESS** (second parallel event `40538499929`, job `122310160478`, SUCCESS). Exact tested source SHA `b3204fecf87d528903ec4223f36f1db8a893c710`. **24/24 Node tests PASS, 0 FAIL.**
- Runner used an ephemeral **READ-ONLY GitHub Actions token (`actions:read` / `contents:read` only)** to independently inspect **the actual original historic run identities, job success state and real job logs**, not just repeat the text of earlier reports. Verified original source SHA for each real past run and checked hard-coded emitted failure/commit/recovery markers from actual logged successful executions. Also cryptographically rechecked the original isolated PG17 recovery JSON **SHA-256 `b5edd1774be77b52ecc2cb47e59a6797a20dfee354461dbd98095220808d2220`** and full microsecond timestamp chronology.
- **21 deliberate anti-forgery negative cases**, including invented fifth invariant, false production RPO/SLA, deletion of 1 lost acknowledged row, false Founder approval, premature T071/T072 lock, wrong Cricket repo and wrong domain; all rejected. Total: one positive contract case, 21 intentional-negative checks, and two independent historical GitHub run/log crypto checks = **24/24**.
- CI code `ci/phase4/b11/t071-c3-four-safety-and-recovery-evidence.test.mjs`; machine evidence `ci/phase4/b11/t071-c3-four-invariants-recovery-review-evidence-v1.json`; workflow `.github/workflows/b11-t071-c3-independent-four-invariants-rpo-rto.yml`.

## C3 / EXACT FOUR MASTER safety invariants — scoped outcomes and original actual CI logs

| # | Original Master behavior | Independently validated historical actual logs | Result inside verified scope | Why whole integrated evidence is NOT yet accepted |
|---:|---|---|---|---|
| 1 | Optional-module failure must NOT crash whole site | `40534396564` / `122295571136`: actual local HTTP 503 on original Social and B9 Search adapters; original full News, Article, LIVE **static HTML** responded HTTP 200 | **PARTIAL: local transport/static continuity PASS** | Production-connected Article content, real Founder publish and full website uptime during a genuine hosted optional backend failure remain untested. HTTP 200 static is not DB body read or a successful publish. |
| 2 | Ambiguous payment must NEVER accidentally make paid Ad LIVE | `40530048228` / `122280044810`: genuine disposable PG17 original reviewed B7 payment-table forced insert violation, original paid-Ad LIVE triggers reject manual bypass; readbacks confirmed 0 confirmed payments and 0 paid/live campaigns, missing receipt still rejected after recovery | **PASS — real PG17 original B7 SQL, isolated scope** | These B7 migrations are `REVIEW_ONLY`; actual Production gateway/legacy RPC/candidate release integration not enabled/tested. No real payment attempted. |
| 3 | Messaging failure must NOT undo a committed business action | `40534396564` / `122295571136`: actual original B8 SQL Owner-case record was committed to disposable PG17 **before** local HTTP 503 messaging acknowledgement; original case + news + Ad read back still present **after**. `40528474982` actual notification storage insert outage independently showed B8 business case still committed | **PASS — real isolated PG17 + synthetic local HTTP outage** | External WhatsApp/email/Edge delivery and unified hosted transaction/notification outbox are untested. `IN_APP_READY` alone is not delivered. |
| 4 | Database failure must NOT claim falsely successful commit | `40531488909` / `122285201848`: actual original B8 case RPC on disposable PostgreSQL17 rejected write by `check_violation`; no successful UUID/partial row, old Article/Ad preserved; original function committed one new case after repair; disabled synthetic Owner/AAL2 denied unauthorized write | **PASS — genuine local SQL failed-write/fail-closed and recovery** | Full hosted response proxy/RPC/Edge transaction ambiguity and cross-service data status still untested; separate snapshot recovery exposes one acknowledged post-checkpoint loss. |

**C3 local original invariants:** 3/4 have specific genuine PG17 pass at scoped business-data boundary, 1/4 only HTTP/static continuity; **0/4 can honestly be declared full integrated same-source E8 pass**. The original C1 full-candidate hosting/evidence remains HOLD pending safe Vercel preview. Original C2 13-family failure matrix **13/13 scoped-only, full E8 HOLD**. C3 is not silently unlocked by those missing proofs.

## C3 practical RPO / RTO review — actual measured chronology, not Production SLA

The independent checker fetched and cryptographically compared genuine original isolated PG17 restore run **`40501228346`, job `122179118305`, source SHA `8b6fcab5327cb7aed5eaf328772c1a970d3bfca8`**. PostgreSQL17 was actually SIGKILLed inside a disconnected disposable Docker container. A **previously verified/restorable PG dump** recreated the **same disposable database endpoint**; fresh PostgreSQL query verified actual foreign keys, RLS/privacy and five synthetic media checksums.

| Incident event | Original UTC timestamp |
|---|---|
| Last VERIFIED restorable snapshot checkpoint | **2026-10-27 12:07:02.908542Z** |
| Actual isolated PG17 database service crash | **2026-10-27 12:07:03.330412Z** |
| Independent restored endpoint verified | **2026-10-27 12:07:04.590969Z** |

- **Observed local RPO checkpoint age: 0.422 seconds** (interval between last verified snapshot and simulated fault). This is **not** evidence of a Production 0.422-second RPO commitment.
- **Observed local RTO: 1.261 seconds** (real synthetic failure to independent local endpoint verification). **NOT** a live website/Supabase/Auth/Storage/Vercel/provider recovery time.
- **Actual synthetic restored-data loss: 1 ACKNOWLEDGED COMMITTED Article row written after the snapshot**, intentionally absent after restore; it was independently detected and disclosed. Thus **NO ZERO-LOSS CLAIM, despite valid checksum/FK/RLS restored DB.**
- Exact previously emitted evidence SHA `b5edd1774be77b52ecc2cb47e59a6797a20dfee354461dbd98095220808d2220` was validated by new CI from **actual prior log's canonical JSON**, not typed as an unverified artifact.
- No restore of real Supabase project, real identities, real News, personal grievances, licensed media, public site, payment or third-party LIVE encoder.

## Practical recovery objectives, safe risk disposition and Founder decision
**Current state:** Founder-approved Production numeric **RPO = NOT APPROVED**; **RTO = NOT APPROVED**. Founder-accepted recovery-risk policy **NOT RECORDED**. The Master gives no arbitrary target seconds, so **do not invent one**.

**Conservative proposed risk policy (for Founder review, NOT accepted by inference):**
1. **Never silently accept loss of a previously acknowledged authoritative published-News, grievance, case, payment or audit write.** Any restore has a recorded last verified recovery checkpoint, a visible post-checkpoint gap ledger, and each missing acknowledged event must be reconciled/audited or explicitly marked irrecoverable before saying complete. Preserve permanent URLs and append-only version/correction records; do not auto delete/re-publish reconstructed articles.
2. **RPO practical commitment is truthful recovery-gap disclosure and complete review**, NOT “zero seconds of data loss.” If the operator cannot prove every acknowledged post-checkpoint action recovered, stop affected Founder publishing/paid Ad/LIVE activation, keep payment ambiguous or OFF, and require explicit Founder disposition.
3. **RTO practical completion means independently tested safe operation**, not the first process healthcheck: verified post-restore DB/business record readback, RLS and Owner/AAL2, News article actual public read, LIVE truthful OFF/WAIT, payment/ad guards, optional failures visible and no lost-message false ACK. No seconds-based full-platform guarantee approved.
4. **No additional paid hosting or domain required just to review C3**. Correct domain `JANTABOL.in` remains separate DUE for Soft Launch.

**Founder choice still required inside existing C3:** explicitly approve this conservative no-unreconciled-loss policy as the **provisional recovery risk disposition** *or* request a different explicit risk/target; recorded decision cannot be invented. Even if approved, full C3 PASS depends on later actual same-candidate C1/C2 core behavior checks—not a new gate.

## C3 final audit / next step — no gate creep
| C3 requirement already frozen | State |
|---|---|
| Four original behaviors mapped to actual source/real logs, not generic claims | **COMPLETE — independent CI verified** |
| Actual disposable PG17 checkpoint, incident, restore timestamps + data-loss review | **COMPLETE — independent digest and chronology verified** |
| Practical risk policy/recovery expectations drafted with limitations | **COMPLETE FOR REVIEW; FOUNDER APPROVAL NOT RECORDED** |
| All four behaviors on exact single hosted release candidate | **HOLD — C1/C2 real integrated E8 pending** |
| **C3 FINAL PASS+LOCK** | **HOLD**, cannot claim Full Production PASS |
| C1 | HOLD on exact verified hosted candidate/Founder production role proof |
| C2 | 13/13 scoped source/transport tests complete; full product matrix E8 HOLD |
| C4 | PARTIAL independent baseline/negative log review; backend-first work can proceed |
| C5 | HOLD; independent E8 and Founder final T071 authority |
| T071 Final | HOLD; **T072 NOT STARTED** |

**Safety:** CI only checked GitHub historic job metadata/logs under read-only actions token; did NOT rerun destructive backup drills, crash Production, read private content, change Supabase/RLS/ads, make a bank payment, call messaging providers or modify LIVE. Main, Vercel Production, existing PR46/47 and Cricket/Saarthi untouched. Review PR #45 only, unmerged.

**C3 single-shot truth:** audit and practical risk review **DONE**. Final gate still **HOLD** on Founder policy choice + existing missing integrated original C1/C2 proof; no more local RPO/RTO iterations needed without new evidence. Resume **C4 backend-negative logs** meanwhile to advance Soft Launch without repeating C3.
