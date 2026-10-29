# JANTA BOL B8 — INDEPENDENT DEPLOYMENT READINESS / T092 FIRST DIVERGENCE
**17 October 2026 | Status: G0-G9 predeployment source candidate; LIVE deployment STILL BLOCKED.**

## Exact Source and Verified LIVE Baseline
- Repo `jantabol/JANTA-BOL-Website`, branch `codex/b8-g5-main-based-integration-20261017`, parent audited SHA `19136618f617017dfaeabfc2b90d7b6a096949f9`, protected original Main `265856ca9cbfd6c7d51989d85435397b72f24c8d`.
- Supabase project `JANTA BOL` (`vrffsnkycvjithwtiylt`) Postgres 17.6, ACTIVE_HEALTHY. Read-only pg_catalog audit: `public.b8_%` tables **0**, `jb_b8_%` RPCs **0**; `public.b8_cases` absent. **NO production B8 SQL applied**.
- Dependencies present in real LIVE schema: `private` schema, `private.current_owner_aal2()`, `private.current_session_active()`, `public.articles` (UUID, article_status enum), `public.user_roles`, `public.team_accounts`, `public.live_notifications`. B3 notification constraints (domain=system, delivery_state=IN_APP_READY, consequence=ATTENTION) support G3/G9's intended safe in-app events. Read-only metadata checks **do not prove all 14 migrations deploy safely**.
- The Founder authenticated OWNER state seen in SPCK after MIME fix was a **valid legacy login but NOT B8 backend readiness**, so the Case form could misleadingly appear before any `jb_b8_g1_owner_create_case` RPC existed.
- A live case creation before approval would fail; do not press it. Source ZIP was **not a deploy**.

## Source-to-Authority Mismatch and Minimum Safe Fix
- **First divergence:** frontend `boot()` checked `JBBackend.session/getUser/role/requireOwner` but never checked B8-specific SQL deployment. It rendered Case forms while B8 DB was absent.
- **Minimal fix in two original B8 files:** G1 adds read-only `SECURITY INVOKER` readiness RPC that requires G1/G2/G3/G4/G5/G6/G7/G8/G9 specific Postgres function sentinels. UI calls it **before any Founder/Reporter/Editor forms are unlocked**. Missing/partial B8 returns explicit `B8_DATABASE_NOT_DEPLOYED_OR_PARTIAL_G0_G9` and hides all actions. No client-side override, no auto upload, no new Case, no Article, no external SEND.
- Synthetic PG17 regression tests both FAIL-CLOSED at G1-only and READY after all 14 SQL slices. Static Android test protects first-divergence order + minimum RPC grants. **Only isolated CI until Founder deployment approval**.

## SQL Migration Order — MUST NOT ALTER OR AUTORUN ON LIVE
1. G1 `20261017_b8_g1_case_reporter_scope_REVIEW_ONLY.sql` (includes readiness RPC, FALSE while partial)
2. G1-Editor `20261017_b8_g1_cp02_editor_immutable_review_REVIEW_ONLY.sql`
3. G2-Identity `20261017_b8_g2_cp01_provenance_survival_REVIEW_ONLY.sql`
4. G2-Article-hold `20261017_b8_g2_cp02_article_hold_GUARD_REVIEW_ONLY.sql`
5. G2-Upload `20261017_b8_g2_cp03_private_upload_REVIEW_ONLY.sql`
6. G3-Proof `20261017_b8_g3_cp02_founder_proof_notifications_REVIEW_ONLY.sql`
7. G3-Handoff `20261017_b8_g3_cp03_manual_handoff_truth_REVIEW_ONLY.sql`
8. G3-Reply `20261017_b8_g3_cp04_reply_claim_REVIEW_ONLY.sql`
9. G4-Public `20261017_b8_g4_cp01_cp03_public_projection_REVIEW_ONLY.sql`
10. G5-Ledger `20261017_b8_g5_cp03_original_accountability_ledger_REVIEW_ONLY.sql`
11. G6-Upload switch `20261017_b8_g6_private_upload_release_gate_REVIEW_ONLY.sql` (**PRIVATE UPLOAD OFF**)
12. G7-Claims history `20261017_b8_g7_accountability_chronology_REVIEW_ONLY.sql`
13. G8-Offline proof `20261017_b8_g8_manual_delivery_public_status_REVIEW_ONLY.sql`
14. G9-Due notifications `20261017_b8_g9_due_followup_safe_notifications_REVIEW_ONLY.sql`

## Deployment STOP gates (must be satisfied BEFORE any LIVE SQL)
- Founder explicitly authorizes a production migration **after reviewing risks**. Current user request to **fix coding and report** does NOT approve LIVE DDL changes.
- **B7 / T034 Restore Safety must be real VERIFIED**. Earlier real restore tests failed; a CI snapshot or review-only script is not proof of real recoverability. Unverified restore means **NO-GO** for irreversible live schema changes.
- Actual SQL compatibility with the full LIVE schema must be independently tested against a RESTORABLE **isolated copy** of the relevant real schema/data (not merely synthetic CI fixtures). Secret-bearing prod data must not be copied into public artifacts.
- `G2 article hold` installs a `BEFORE DELETE` trigger on the original `public.articles`; this **changes original permanent-delete behavior for linked articles**. It is deliberate legal protection but conflicts with any unqualified "zero production Article trigger changes" assertion. Review/approve explicitly and run original Article deletion, published correction, PURL regression on a real-schema test environment.
- G3/G9 install notification triggers on new B8 objects but insert into **existing B3 notifications**; check quota, domain constraints, visible OWNER only, external send never claimed, and conflict.
- G6 private upload is OFF by default. Do not enable until real RLS/service-auth/Edge/storage/backup+restore is verified. E9 screenshots show *a historical consultant study served on an official site*, NOT independent present-day road construction or contractor liability.
- Stage owner/anon/reporter/editor auth negative tests with AAL2, case isolation and old News publishing independent.
- Run official T092 E7+E9 after actual Founder-approved deployment + required evidence. **No fake PASS/LOCK**.

## Status
- Code fix + read-only LIVE audit: performed.
- Disposable PG17 / CI: due when this change pushed, inspect run success.
- Production: NOT CHANGED.
- Founder's partially filled **SPCK local R0 Case form must NOT be submitted** before explicit deployment gate.
