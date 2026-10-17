# JANTA BOL — B8 CP14 Final Pre-Coding Technical Verification / Soft Launch Priority
**17 October 2026 · Founder priority: B8 completion → Phase-4 soft launch; delay ONLY for critical safety/source blockers.**
**READ-ONLY E1 authority and design proof; NOT an E2/E3 product-test PASS. NO CODE, LIVE DML, SQL migration, deployment, fee, ad payment or hosting change.**

## 0. Exact authority and trace
- GitHub B8 review preaudit SHA **`4b8d175f19444cbed64bdcc84d2470db3f09dd06`**, `main` **`265856ca9cbfd6c7d51989d85435397b72f24c8d`**; branch contains R3 final pre-coding master and CP13 explicit Founder Option A six-decision signoff. Original Topic-13 Sections 825–923, T092–T099, 51 ACC; R3 30 SEC +12 RPT negative proposals; B0–B8 178 index design. None of those are implementation PASS.
- LIVE Supabase project `vrffsnkycvjithwtiylt` PostgreSQL: queried **catalog metadata and function definitions using `BEGIN READ ONLY; ... ROLLBACK;`**. No private rows, contacts, documents, JWTs, secrets, paid/ad records, or user identities were retrieved.
- Founder B0–B6 prior locks are preserved as Founder-declared status, not re-adjudicated by this audit. Historic TEST-REGISTER has some old NOT RUN entries; reconcile with authentic evidence for final ZIP, no automatic status rewrites. B7 first real shop advertisement/payment is held after News soft launch by Founder, never used to weaken B8.

## 1. Live source validation: concrete findings
**Verified GREEN foundations:**
1. Existing `public.team_accounts`, `public.user_roles`, `private.current_app_role`, `private.current_owner_aal2`, `private.current_session_active`, existing `audit_logs`, `live_notifications`, outbox, `article_sources`, `article_versions`, `verification_history`, retention exist. Existing Article/Audit lifecycle triggers already enabled in prior audit. Role enum exactly owner/admin/editor/reporter. `private.current_app_role()` checks active team account for non-Owner; Owner AAL2 helper additionally checks active session. These are reuse points, **not proof that B8 is implemented**.
2. Anonymized active staff inventory: **2 active Reporter rows and 1 active Editor row** in `team_accounts`, no identities read. Actual authenticated E3/E5 staff-device and revoked-session tests **NOT RUN**.
3. Existing `private-editorial` bucket is PRIVATE, per-file 50 MiB; its direct Storage object permissions require **Owner AAL2**; existing B5 gateway policy is RESTRICTIVE (earlier separate read-only confirmed). Can REUSE but reporter cannot directly upload under the current policy. This is intentional current restriction, **not a discovered present leak**.
4. R3 core business architecture is consistent with approval: Routine R0 scoped Reporter direct; R1 Editor approves, Founder receives authentic private proof pack; R2 restricted action requires Owner prior approval/AAL2; Founder-only Article publish/correction retained; offline composer-open != SENT; original Article UUID/PURL preserved.
5. Dedicated B8 `accountability_*` / `jb_case_*` **tables: ZERO** in public/private current catalog. A pre-existing **`public.jb_case_access_internal()` SECURITY DEFINER RPC EXISTS (anon EXECUTE denied)**, but is a pre-existing staff helper, **not implemented B8 Case CRUD**. Do NOT create a duplicate function of the same name or claim no case-related function exists.

**First divergence — CRITICAL to handle at B8 first coding checkpoint, NOT a reason to delay planning or block with B7 payment:**
- `private.p4_staff_allowed()` currently grants Owner(AAL2) or ACTIVE **Admin/Editor** with active session, **NOT Reporter**. Existing `public.jb_case_access_internal()` calls exactly that helper and raises `CASE_STAFF_REQUIRED` if false.
- Therefore a proposed B8 Reporter-send RPC **MUST NOT re-use `jb_case_access_internal()` or `p4_staff_allowed()` as-is**; it would reject legitimate assigned Reporters. Conversely **MUST NOT weaken global p4_staff_allowed()** to include all Reporters, which could dangerously enlarge unrelated old staff permissions.
- **Minimum safe planned design:** isolate `private.b8_reporter_case_scope_allowed(case_uuid, actor, permission)` with active existing Team status + real active session + correct assigned-role identity + case/beat/territory, fresh expiry, frozen question revision, transport idempotency, risk lane R0/R1/R2+grants. New B8 backend RPC enforces it, no client-only trust, negative Reporter/unassigned/suspended/revoked/wrong-case/Editor-self-approve/Owner AAL1 tests before exposed access. Actual endpoint names/signatures are proposals, not deployed SQL.

**Second divergence — HIGH, solved only while implementing case-evidence path:**
- Existing private Storage allows Owner AAL2, not normal Reporter; proposed Reporter evidence upload is **NOT currently ready**. Use a narrowly scoped server-authorized case upload with short-lived proof, content-type+magic/size/hash checks, object-ownership confirmation, quarantined unpublished state and server RLS/IDOR/revocation tests. No broad reporter Storage policy, no new paid bucket. If truly infeasible under Free limit, preserve a safe metadata-only evidence record and continue B8 while separately gating real upload E2/E3 (never call that check PASS).

**Third divergence — HIGH, preserve real case evidence across lawful Article deletion:**
- Current `article_sources.article_id`, `article_versions.article_id`, `verification_history.article_id` all reference `articles.id` with **ON DELETE CASCADE**. B8 immutable source receipts cannot rely **only** on these linked rows. New case ledger must store independently retained provenance/hash/version/rights-hold and validate Founder-controlled Article delete/tombstone + case-history survival in isolated PostgreSQL before any production deployment. Do not edit existing locked FKs or copy sensitive bytes into public projection.
- No real deletion occurred; no present data loss observed. This is a **prospective integration risk**, not an incident claim.

## 2. Do these delay B8?
**NO blanket STOP to B8 implementation**. Three concerns above have concrete **bounded B8-specific safe fixes** and red-first test gates, without rebuilding B0–B6 or needing payment/extra hosting. Founder six governance decisions already approved; no new Founder business decision currently needed.
**YES STOP only at the affected action if evidence proves unsafe**: (i) public/private leak, (ii) reporter escalation bypass or role mismatch not remedied, (iii) unsafely destructive Article/case evidence delete, (iv) unverified official dispatch status or duplicate send. Fail closed in B8 and preserve unaffected ordinary News. If a test RED occurs, exact source→reproduce→first divergence→RCA→minimum fix→full regression before PASS.

## 3. Distinct Phase-4 SOFT LAUNCH gate (critical before release, not B8 coding blocker)
Prior deployment read-only audits (CP03/CP06) found Vercel actual **production alias on old GitHub `main`**, while the Android-tested `099 test` Article was on a **PREVIEW** nested `JANTA_BOL_PHASE_3C_WORKING/article.html?id=<UUID>` URL. This remains **P0 release source/URL parity hard gate**:
- Before calling **soft launch LIVE**, reconcile old main-only work and preview-reviewed branch with a safe merge/diff/no-old-PASS-regression plan.
- Deploy only an approved exact source SHA with rollback, HTTPS, permanent Article URL and Founder actual Incognito Android E3 on **the final public domain**.
- Preview PASS is NOT production PASS. This need not interrupt isolated B8 design/coding or force purchase of a paid hosting service. No production cutover was made during CP14.

## 4. Coding/testing priority designed to maximize speed without shortcuts
| Step | Must execute / prove | Allowed result |
| --- | --- | --- |
| G0 exact baseline | Freeze SHA of current review, verify B0–B6 protected paths, B7 paid HOLD, register source + branch collision | approval to code only on separate B8 branch; no global rebase |
| G1 Role/Case | Disposable PG17 B8 Case/Question R0-R2 schema+auth+RLS, **explicit reporter guard** rather than global staff helper | RED→GREEN E2, old auth regression |
| G2 Evidence | Independent append-only case/evidence ledger, document receipts, legal HOLD delete/tombstone, restrictive secure case upload | real isolated negative proofs; no broad Storage grants |
| G3 Workflow | Android-aware Reporter compose/Editor review/Founder proof pack/private B3 queue with actual proof vs SENT axes, revisions, reply | E1/E2, then real Reporter/Editor/Owner E3/E5 |
| G4 Public | Founder safe redacted public projection; same-Article correction UUID/PURL, linked new story, B8 failure isolation | safe anon/IDOR/privacy and old News regression |
| G5 Original full tests | Execute T092–T099 (ACC001–051 + SEC01–30/RPT01–12), real original E1/E2/E3/E4/E5/E7/E9 as required; honest held external E9 | only actual evidence-backed PASS+LOCK |
| G6 Archive/release | Original Phase3 and B0–B7 protected regression, full 178-ID test locator and safe exact-file ZIP with hash/exclusions; production source parity and Android on real public domain | soft launch after Founder release approval |

**Evidence priority:** generated only from real actions. No fake official reply or editor send, no automatic or unsolicited third-party outbound message, no production-test shortcut. Use lawful authentic published documentary evidence and genuine voluntary official response where available; if an externally contingent item is unavailable, mark its **exact scope DUE** without labelling whole B8 fake PASS. Do not automatically postpone non-external B8 tests.

## 5. Verdicts / protected constraints
- **CP14 READ-ONLY SOURCE / ROLE / STORAGE / DELETE PRE-CODING VERIFICATION = DONE.**
- **Design-FD decisions R0/R1/R2+FD-B8-01..06 = Founder APPROVED.**
- **Three technical implementation risks IDENTIFIED with minimum safe planned solutions. They are mandatory FIRST-CODE gates, not additional founder waits.**
- **B8 feature code NOT STARTED; T092–T099 0/8 RUN; ACC001–051 0/51 RUN; RPT/SEC not executed.**
- **SOFT LAUNCH: not yet verified ready** due to exact production-vs-preview mismatch and pending B8 implementation, CI/device/release proof.
- **B7 actual first paid/shop ad remains held, NO PAID plan/new provider required for this gate.**
- This CP14 report and predecessor design decisions are **the only repo content changed**, and no app/migration/CI/prod/Cricket code was changed. Next action after a separate Founder approval to begin feature coding is bounded G0→G1, not another general research loop.

**NO REBUILD · NO FAKE PASS · CRITICAL ONLY DELAY · NEWS + B8 → PHASE4 SOFT LAUNCH.**
