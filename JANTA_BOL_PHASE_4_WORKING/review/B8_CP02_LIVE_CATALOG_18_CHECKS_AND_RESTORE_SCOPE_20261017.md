# JANTA BOL — B8 G0-G9 CP02: REAL CATALOG PREFLIGHT + DEPLOYMENT HOLD
**2026-10-17 | branch:** `codex/b8-g5-main-based-integration-20261017`. **No production writes.**

## What was independently established
1. Supabase JANTA BOL `vrffsnkycvjithwtiylt` was queried **READ-ONLY** through `pg_catalog`. Repeatable 18-condition exact preflight returned **18 PASS / 0 FAIL**: required B1 AAL2/current-session functions, private schema, user/role/table availability, public Article RLS + three existing editorial triggers, live notification constraints+dedupe, and B8 **still entirely absent**. This is **schema read-only PARITY**, not actual migration execution or real E2/E5 proof.
2. **Discovered coverage weakness and repaired isolated CI:** Production enum `public.article_status` has **five** live labels `draft,published,review,unpublished,deleted`; prior B8 G4 synthetic PG17 fixture had only **three** `draft,published,unpublished`. Fixture now matches five; new negative test proves the `review` and `deleted` original canonical Article states NEVER surface through public B8 Article links.
3. Production `public.live_notifications` mandatory columns, check constraints, unique dedupe index and role/status enums were inspected. Existing B8 G3/G9 limited safe IN_APP_READY notice contract appears catalog-compatible. DB tests with *real authenticated principals* are still required; don't call the static check production E5.
4. **Important corrected backup status:** Verified repository `main` evidence plus actual protected GitHub Actions run [#38778388127](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/38778388127) **SUCCESS** on 2026-10-15: real encrypted offsite database backup, actual isolated offline PG17 restore, source↔clone 26 identity + 16 security parity metrics **SCOPED DB RESTORE PASS**. Earlier restore failures were ultimately resolved; do not repeat outdated 'restore always failed' claim.
5. The successful restore was **DB-only**: it did not prove Supabase Storage file bytes, platform configuration, current post-15-Oct Ads-008 guard snapshot recoverability, or T034 ADS001–009 final tests. T034 remains FINAL HOLD; don't equate restore proof with full application release.

## Source-to-production risks not solved by mere 18/18
- B8 has **14 interdependent REVIEW_ONLY migrations**, zero applied on LIVE. This prep work does not deploy them, so Owner Case CREATE is **BLOCKED** even when UI displays the form in an old local SPCK build.
- `G2 CP02` adds a `BEFORE DELETE` guard on **existing** `public.articles`, intentionally protecting linked historical source records but changing the Founder permanent-delete path. Must run genuine real-schema linked/unlinked article delete/republish/correction regression in an isolated *restorable clone*, obtain explicit approval before LIVE DDL.
- `G3/G9` hook B3 notifications. There are existing security-advisor warnings affecting other older systems; do not change them as part of B8, but independently audit their exposure before claiming global security clean.
- `G6` private evidence release switch defaults **OFF** and requires Edge/storage/backup verification before ON. Historical MPPCB Highway PDF screenshots verify a document is displayed at a government domain, **not** an independent present-day project's claims or actual official dispatch. No live government contact/send will occur without separate Founder authorization.
- As of this report Supabase has **no development branch** for this project. **Do not create paid staging branch/project** without explicit cost authorization. Synthetic disposable GitHub PG17 is already cost-free, but never equivalently represents real production data/config.
- If no safe complete restore plan for the **current** production state is available, do not deploy 14 B8 migrations purely to pass a UI test.

## Controlled next release decision
A. **Already completed:** 18/18 read-only live catalog check + strengthened five-status simulated PG17 test + existing B8 G0-G9 CI. Protected News/B7 source byte-identical; no live production SQL touched.
B. **Remaining independent predeployment gate:** reproduce 14 SQL migrations on a restorable isolated copy with exact current baseline, then negative actual-role ACL/AAL2 matrix, G2 delete-hold behavior, B3 notification lifecycle, G6 OFF.
C. **Founder decision checkpoint:** approve specifically reviewed 14 B8 migrations, known G2 linked Article delete hold, and acceptable recent recovery evidence/rollback plan. No approval has yet been given to perform LIVE DDL on `vrffsnkycvjithwtiylt`.
D. **Only after B:** separate Founder-approved live migration + read-only postchecks + E2/E3/E5/E7/E9; begin T092 test. Final T092/ACC/Phase4 B8 PASS remains **NOT YET**.

Current latest code SHA: populated by Git commit. Do not claim T092 PASS or production LIVE. Avoid ZIP downloads for source-only test scripts.
