# JANTA BOL B8 — PRE-CODING DESIGN + TEST EXECUTION R1
**17 October 2026 | DOCUMENTS-ONLY CHECKPOINT | NO APPLICATION CODE / SQL / PRODUCTION DEPLOYMENT**
**Branch:** `review/b8-precode-design-tests-20261017` forked from exact previous review SHA `8f3d92dc8d90f3b0252a66d5cf1fbf9328beb26d`.
**Primary requirements:** Founder-supplied `JANTA_BOL_PHASE_4_MASTER_EXECUTION_PACK.pdf`, original Accountability Sections **825–923** (99), Final P4-T092..T099 (8 tests) and ACC-001..ACC-051 (51 grouped checkpoints), original RUN-12. Requirement source supersedes engineering suggestions.

## What was materially designed and checked
1. **CP02 CURRENT-AUTHORITY MAP:** Original Article UUID/PURL, Article source/verification/version records, `audit_logs`, B3 notification `live_notifications`, Topic8 retention, B5 grievance and Founder Auth/AAL2 are preserved; B8 is a *linked Case*, not a second Article-publisher. Current real LIVE Supabase catalog checks were READ ONLY: protected Article and source/history/grievance/notification/retention tables found; no inspected `accountability_*` relations; legacy Article-source/version/verification FKs are **ON DELETE CASCADE** and Article/audit triggers exist. Private-editorial bucket is PRIVATE 50MiB/file with Owner AAL2 policies; Storage JWT API attacks **NOT RUN**. These observations do not revoke Founder B0-B6 PASS/LOCK.
2. **CP03 LOGICAL DESIGN:** Single Master Case UUID with serious-vs-routine applicability; one-to-many links to existing separate immutable Article UUIDs/PURLs; append-only evidence receipts+source/version hashes; event timeline for cost/ground/deadlines/status/reopen; independently traceable questions/real manual dispatch receipts/partial+late replies; public-safe projection by explicit Founder approval; shared existing audit/notifications/retention. Draft Owner-AAL2/Reporter/Edit/Admin/Public/Revoked authorization matrix and orthogonal status axes; no fixed physical DDL selected and **no B8 migration implemented**.
3. **CP04 TEST REGISTER:** Full **51/51** proposed ACC expected-positive + adversarial negative cases, accurately grouped **T092 8, T093 4, T094 7, T095 5, T096 4, T097 7, T098 9, T099 7**. Prepared **30** supplemental security/failure/race/PII probes, **8** source-safe fixture families F0–F7, physical Android E3 RUN-12 **15 steps**, E1/E2/E3/E4/E5/E7/E9 evidence card and “NO EVIDENCE NO PASS” gates. These are designed tests ONLY: **0/51 RUN, 0/8 official FINAL PASS**.
4. **R1 self-critic / CP05 preparation:** Leading hard stop risks: original evidence destruction through Article CASCADE, public confidential-source/snapshot leak, AI/Reporter fake authorized send, bogus SENT on provider failure, Founder-as-subject conflict/tamper, private storage object IDOR, phantom uploads, ordinary news blocked by B8 outage, Preview-production release source mismatch. Founder approval required for final visibility, final send delegation, right-to-reply opportunity policy, controlled legal retention, conflict review and no-paid evidence storage usage.
5. **Correct HOLD separation:** Founder says B0–B6 previously locked; B7 true first paid-shop ad after News soft launch holds B7 genuine payment evidence, but B8 own real security/device/source evidence is **never waived**. B8–B13 must not be half-finished. Core News old code untouched, no paid service, no Vercel/Cloudflare changes.

## Canonical official B8 checkpoints (not executed)
| ID | ACC | Mandatory original evidence |
|---|---|---|
| P4-T092 | 001–008 | E7+E9 |
| P4-T093 | 009–012 | E2+E9 |
| P4-T094 | 013–019 | E2+E5+E9 |
| P4-T095 | 020–024 | E2+E5+E9 |
| P4-T096 | 025–028 | E2+E4+E5+E9 |
| P4-T097 | 029–035 | E2+E5+E7+E9 |
| P4-T098 | 036–044 | E1+E2+E3+E4+E5+E9 |
| P4-T099 | 045–051 | E1+E2+E5+E7+E9 |

## Artifact / delivery
Full independently generated **14-page** `JANTA_BOL_B8_DESIGN_AND_TEST_EXECUTION_MASTER_R1_2026-10-17.pdf` and its **50,634-character Markdown** companion are delivered to Founder in the ChatGPT conversation as sandbox artifacts. This GitHub file records the immutable planning checkpoint and **does not impersonate** an uploaded complete R1 document; the complete files stay as attached conversation artifacts until Founder instructs an archive upload. Exact E9 and detailed 51-row test matrix live in the companion.

## STOP before coding
**Next CP05:** independent threat and test cross-check, source-parity/B6 locked-regression plan, Founder grouped FD-B8-01..06 decision, freeze only with approval. After CP05, separate authorization is required to begin B8 feature coding. Do not label synthetic E2 proof as actual owner/Android/documentary E3/E9; do not claim B8 PASS.
**Verdict:** B8 Design/Test R1 ready for CP05 review; **B8 code NOT STARTED, 8/8 OFFICIAL TESTS NOT RUN.**
