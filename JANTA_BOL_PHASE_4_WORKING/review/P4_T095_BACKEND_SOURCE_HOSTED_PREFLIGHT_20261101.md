# JANTA BOL / Phase 4 / B8 — P4-T095 Backend Read-only Verification

**Date:** 2026-11-01. **Authority:** original 321-page Phase 4 Master Execution Pack, Topic 13, RUN-12, P4-T095, ACC-020–ACC-024, Sections 864–874. **Canonical TEST-REGISTER:** `P4-T095 | ... | NOT RUN`. **Original E classes:** E2 + E5 + E9. **Production data edits: NONE.**

## User-authorized scope and strict boundary
Backend first: check exact existing G5 typed private fact ledger, deadlines, ground-vs-office distinction, responsibility role map, immutable history, G9 overdue Founder-only follow-up; run current GitHub source/mobile and isolated PG17 tests only on a disposable runner. Do **not** fabricate on-site field visits, final contract payments, official confirmation of completion, reasons for delay, or blame. Do **not** use service-role SQL to impersonate Founder or change any live Article/Case, grants, Auth, DNS, private upload or released B8 controls.

## Original acceptance / truthful mapping
- ACC020: Authority claim `GROUND/AUTHORITY_COMPLETION_CLAIM` is not proof of independent on-site observation `GROUND/FIELD_OBSERVATION_REPORTED`. Both `NOT_INDEPENDENTLY_VERIFIED` until substantiated.
- ACC021: `DEADLINE/ORIGINAL` must be preserved, `DEADLINE/REVISED` a new appended event; REVISED without ORIGINAL and second ORIGINAL are rejected.
- ACC022: deadline missed `jb_b8_g9_owner_due_followups()` returns `DUE_FOR_HUMAN_REVIEW_NOT_OFFICIAL_GUILT`, later `DEADLINE_FOLLOWUP` may create an **in-app private** Founder alert, never government SEND.
- ACC023: `RESPONSIBILITY/ROLE_MAP` may identify agency/office/role, but cannot convict, infer motive or blame.
- ACC024: original source, revised record, follow-up and responsibility need date/actor/private immutable provenance; source-only role/ACL tests are not proof of the described field facts.

## Independently checked live hosted JANTA BOL Supabase (SELECT only; 2026-11-01)
- Project `vrffsnkycvjithwtiylt`, separate from cricket project.
- `public.b8_g5_fact_events`: RLS **ON**, public/anon/authenticated **no direct table grants**, authenticated only via SECURITY DEFINER Owner AAL2 guarded RPC `jb_b8_g5_owner_record_fact`, `jb_b8_g5_owner_private_ledger`, `jb_b8_g5_owner_record_outcome`, `jb_b8_g5_owner_reopen_case`; anon EXECUTE **DENY**. Definer functions set empty search_path. Real `B8_G5_EXACT_DUPLICATE_NOT_APPENDED`, original-deadline ordering and same-case receipt enforcement present. `b8_g5_fact_events_immutable` trigger enabled and UPDATE/DELETE denied.
- Actual validated constraints recognize `GROUND/AUTHORITY_COMPLETION_CLAIM`, `GROUND/FIELD_OBSERVATION_REPORTED`, `DEADLINE/ORIGINAL`, `DEADLINE/REVISED`, `RESPONSIBILITY/ROLE_MAP`; `authenticity='NOT_INDEPENDENTLY_VERIFIED'` enforced.
- Existing test-only private NH-3 case `0cf14822-6633-4bb5-a60f-6df2cf8cc19f`: **5** G5 fact rows total: 1 `ALTERNATIVE/DOCUMENTED_PROPOSAL`, 1 `COST/ESTIMATED_PROPOSED`, 2 `IMPACT/DOCUMENTED_PROJECTED`, 1 `PURPOSE/DOCUMENTED_STATED`. All marked `NOT_INDEPENDENTLY_VERIFIED`; **0** `GROUND`, **0** `DEADLINE`, **0** `RESPONSIBILITY`. No on-site first-hand verification or real current owner-authenticated write for those T095 subjects observed.
- Live `b8_g4_public_revisions` still has immutable and conflict-public-approval-block triggers enabled.
- Documentary source: attached genuine-looking NHAI 210th MIS Report dated **2018-06-18**; Section A Table 6 page 19 rows 87–89 displays 2018 **original scheduled and estimated** completion and 2018 actual physical progress/contractor/PIU. That historical dated report is **not** independent ground condition at 2026-11-01; do not overwrite history or call it government response today.

## Previous isolated engineering proof (historical, not new runtime)
G5 original disposable PostgreSQL17 authority/field/deadline/immaturity/history tests and Android mock contracts were previously verified green at exact former commit `d9c5f07ac844ef2cfe213fa57fda4f213dfb01b6`, GitHub Actions run `39016372617`, 2/2 SUCCESS, as recorded by original `B8_G5_CP04_ENGINEERING_CI_PASS_LIVE_E7_E9_HOLD_20261017.md`. These are prior source/isolated tests only; NOT a replacement for full present real E5/E9.

## Current check decisions and follow-up
- `T095_E2_HOSTED_CATALOG_RLS_TYPE_GUARDS=PASS_SCOPED_READ_ONLY`
- `T095_G5_G9_CURRENT_SOURCE_MOBILE=CHECK_IN_GITHUB_CI`
- `T095_CURRENT_ISOLATED_PG17=CHECK_IN_GITHUB_CI`
- `T095_FOUNDER_E5_LIVE_FACT_APPEND_AND_REVISED_HISTORY=NOT_RUN`
- `T095_REAL_2026_INDEPENDENT_GROUND_VERIFICATION_E9=NOT_RUN`
- `T095_REAL_DELAY_REASON_EXTERNAL_ANSWER_E9=NOT_RUN`
- `T095_FORMAL_FINAL_PASS_LOCK=HOLD`
- `T095_MANUAL_STEP_NOW=NONE_FOR_BACKEND_ONLY_AUDIT`

Do not adjust official original register or claim final PASS; no media uploads, staff impersonation, current public Article publication, DB UPDATE/INSERT, real government messages, synthetic external proof or secret handling.
