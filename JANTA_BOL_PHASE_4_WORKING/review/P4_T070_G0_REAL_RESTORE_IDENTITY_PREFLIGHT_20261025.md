# JANTA BOL Phase-4 B11 — P4-T070 START / G0 READ-ONLY RECONCILIATION
Date 2026-10-25 IST. Founder direction: STOP T069; start T070 only. No change to T069 status or workflow.
Original Blueprint T070: Real Restore Drill + Identity Preservation, RECOV-012..018, Sections 586-599, required E1 + E2 + E4 + E5 + E8. True PASS: isolated representative DB/files/auth/permission/config restoration, Article permanent ID/URL, Grievance ID, Live history, campaign/payment relationships, correct restore order, source last trusted checkpoint, full reconciliation, **actual** proof. Existing healthy source data alone is NOT restore proof.

## Verified 2026-10-25 READ ONLY production source preflight
- JANTA BOL Supabase project vrffsnkycvjithwtiylt ONLY; protected GitHub main commit 4ef0643520f664b0c23fee2cd70af27c02509b5f.
- public.articles=32, article_versions=878, grievances=6, grievance_history=57, grievance_evidence=2, live_sessions=16, live_updates=0, ad_campaigns=7, ad_payments=0, auth.users=5.
- Source orphan checks: article_versions=0, grievance_evidence=0, live_updates=0, ad_payments=0.
- Source duplicate slug=0; duplicate grievance public_id=0. articles.slug unique constraint present.
- Security check: 12 representative content/auth-related public tables all RLS enabled. This does NOT prove replica post-restore security.
- User data/Grievance identity names, original object paths, credentials and JWT never transmitted to GitHub branch/CI.

## Checkpoint G0
1. Source relationship and ID constraints inspected read-only: PASS for live source as-of query, not T070 restore test.
2. Standalone parity comparator with isolated synthetic fixtures, fail-closed for recreation, PURL, case ID, Live updates, payments, auth ids, policy fingerprint, original file hash and source-snapshot drift: CI gate, not real E8.
3. Evidence triage: historical 2026-10-21 T034 offsite PG17 DB restore (run 39602669748) can be reused as supporting historical evidence; it is neither a 2026-10-25 snapshot nor a whole T070 E8.
4. Real isolated restore of original DB/files/auth/permissions/config NOT EXECUTED in this checkpoint. No disposable production-safe restore infrastructure or matched restored data proven. Live updates and ad payments are currently ZERO so cannot satisfy positive representative relationship coverage from today's source alone; mark NOT_EXERCISED.
5. Baseline CI+Article/Live/Auth/Storage affected regression and Founder Android proof E4 not yet run for T070. T070 FINAL=NOT RUN/HOLD.

## Strict next checkpoint
Read isolated disposable restore runbook and original T034 repo scripts; identify trusted immutable backup and safe isolated PG17 runtime. Verify exact backup as-of baseline BEFORE comparing to restored identity. NEVER overwrite production, NEVER replay old records into production, NEVER use cricket repo or project, NEVER weaken RLS. Perform real restoration only with verified authorized environment evidence. Avoid asking Founder for unnecessary manual steps and avoid new keys.
