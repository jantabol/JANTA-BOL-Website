# JANTA BOL — B13 / P4-T088 — Production, Backup/Recovery, Android & Operational Readiness

**Start:** 2026-11-02 IST. **Original master**: Phase-4 Final Test Blueprint, Topic 12 RUN-15, sections **784–792**. Class: **MANUAL / PRODUCTION + RECOVERY**. **Required original evidence: E1 + E3 + E6 + E8**; Phase-3 protection: **baseline CI + original core functional/security regression**.

## Founder checkpoint
Founder has asked to **LOCK completed T087 work and START next test immediately**. T087's executed source/PG17/connected DB/Reporter UI evidence is already **SCOPED PASS+LOCK** in PR #111; it **does not meet original full T087 E2 hosted-signed HTTP + complete E5**, which remains outstanding and must **block final release**. Do not repeatedly demand T087 login/Share/Article/Incognito proof. No blanket original T087 final PASS claim.

**T088 status**: IN PROGRESS — read-only preflight / E1 initially NOT RUN. Absolutely **not** T088 Final PASS, not B13 Final, not Production change authorization. This branch is stacked on T087 candidate SHA `48260e31e8e69dc12d6905c5765b0341f3538192`, NOT main. PR #111 was DRAFT and unmerged when starting.

## Original T088 acceptance
> Verify backup health, real restore **where executable**, failure isolation, production domain/HTTPS/Auth/API/DB, real multi-device publishing lifecycle, Android newsroom workflow and Founder-time. Backup must actually be usable; unavailable restore/provider **cannot be fake PASS**. Production works end-to-end; Android-first; routine mechanical work automated while Founder reserves authority/exception work.

### Evidence matrix — do not substitute one class for another

| Gate | Required original evidence | Available baseline | Genuine DUE / stop |
| --- | --- | --- | --- |
| T088-E1 | Protected old Phase3/Core/Security + B11 fault/recovery + B12 production source CI | T087 prior exact SHA CI `41439426740` SUCCESS, historical baseline only; new T088 CI must run on **exact T088 HEAD** | New exact-head CI NOT RUN at start |
| T088-E3 | Real Android Phone + Tablet publishing workflow, Founder authority preserved | Earlier T080/T083 and T086 separate real-screen evidence reported; Reporter B8 UI login/recheck observed; **do not call this new T088 multi-device test** | Real T088 dual-device lifecycle/role isolation evidence needed if not already independently linked |
| T088-E6 | Production HTTPS, real API/DB and genuinely connected external provider/integration | Domain `jantabol.in` previously reported open, B12/T076 protected check exists | Actual current HTTPS non-mutating smoke, authenticated production API and external provider readiness; real Live/encoder DUE if unconfigured |
| T088-E8 | **Real usable DB + private media restore**, full reconciliation, independent recipient/access, RPO/RTO/failure isolation | Existing B11 T069/T070 manual/read-only workflows and isolated PG17 tests; previous B11 real joint restore **NOT_RUN** | Real restore cannot be marked PASS from a workflow file, artifact list or isolated synthetic DB |

### No fake release guard / hold transfer
- T087 signed hosted Owner/Reporter/revoked-bearer E2 **DUE**; complete 13-family lifecycle E5 **DUE** — keep them visible in T088 readiness as **upstream release blockers**, not reclassification or transfer of T087 test ownership.
- T087 review-only `b13_t087_user_roles_revoked_session_REVIEW_ONLY.sql` has disposable RED/GREEN PASS; **production policies NOT modified**. Require separately reviewed approved rollout+real hosted proof before any full-security approval.
- No real provider streaming, external notification delivery, paid system, private backup restore, release merge or domain DNS change is authorized by this preflight.
- Production Article, Admin, Ads, Founder MFA, Public view, permanent URL, audit/retention, backups, and Cricket isolate unchanged.
- Founder Android step: NONE at **source/CI preflight**. When a true T088 E3 step is necessary, request a **single distinct action/device/expected/proof**, not previous tests.

## Work started here
1. Add **fail-hard T088 source/contract gate** matching original 784–792 E1/E3/E6/E8 and ensuring upstream T087 real gaps remain documented.
2. Run historical protected functional/security B11/T070–T071, B12/T080–T083, B13/T086 and T087 modules without modifying original sources.
3. Read-only public Production HTTPS smoke on `jantabol.in`, **not** authenticated real API/restore claim.
4. Report exact-head successful/failed CI + actual remaining manual E3/E8+external E6. Do not PASS+LOCK until required evidence is present.

**Original T088 Final PASS+LOCK = HOLD until E1 + E3 + E6 + E8 are genuinely supported.**
