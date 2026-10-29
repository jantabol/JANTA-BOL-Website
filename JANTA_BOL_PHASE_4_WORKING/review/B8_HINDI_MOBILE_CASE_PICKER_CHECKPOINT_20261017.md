# JANTA BOL B8 — Hindi Android UX + Owner case-name selector checkpoint
Date 2026-10-17. NO NEWS/ADS/PRODUCTION WEBSITE REBUILD. B8-only additive changes.

## Implemented in GitHub
- Hindi-first action labels, warning text, categories, consent notices on Founder/Reporter/Editor B8 workspace.
- B8 G5 private fact ledger replaced raw JSON with Hindi safe-text cards. Exact decimal INR formatting uses STRING manipulation; no loss from IEEE float.
- Case names are now shown in a private Founder AAL2-only selector. Chosen server-returned UUID populates SAME-CASE fields only, with existing-case draft reset to avoid cross-case misfiling. No localStorage or cross-role case list; clear case list on 15-minute lock. Existing original forms/roles/RPC guards preserved.
- New additive SQL only: `20261017_b8_g1_owner_mobile_case_picker_REVIEW_ONLY.sql`, `public.jb_b8_g1_owner_case_choices()`. Fixed 50-row projection: id/title/area/risk_lane/state, with Founder AAL2 guard and direct table grants unchanged.
- Node + disposable PostgreSQL17 CI negative/positive tests cover anon, reporter, editor, AAL1, expired session, exact response projection, no client-side case cache, safe case switch.

## Verified evidence
- GitHub CI source head `5e221888e3513cc043d918de36478bbe16ef7444`, run 39041921258: all 3 jobs SUCCESS, isolated PostgreSQL17 tests included. THIS IS NOT LIVE Android E3.
- Founder-authorized existing JANTA BOL live Supabase project `vrffsnkycvjithwtiylt`: additive read-only selector migration `b8_g1_owner_private_case_picker_readonly_20261017` returned `{"success":true}`.
- Independent LIVE SQL catalog postcheck: installed=true, anon execute=false, authenticated execute=true (actual private function also checks Founder AAL2), authenticated direct SELECT `b8_cases`=false.
- Immediate LIVE counts: 1 B8 private case, 31 legacy articles, 7 ad campaigns, G6 private upload remains OFF. No case was created/edited/deleted by new migration.

## Deployment blocker — no fake Android PASS
- Vercel `POST /v13/deployments` for exact reviewed branch SHA returned **402 payment_required**, code `api-deployments-free-per-day`, exceeding 100 deploys; retryAfter=86400 seconds. Earlier explicit team-scoped request also returned 403 unauthorized scope. No more repeated Vercel retries or auth bypass.
- Most recent confirmed READY preview SHA: `078ca73b1c8e9bf590072894e1311f72fe4b1597`. This is older than final Hindi/case-picker commit; cannot claim latest mobile deployed.
- Android screenshot proofs of initial R0 case creation, G5 event #1 ESTIMATED_PROPOSED INR 23864600000.00, and readback exist in founder chat. New case-by-name selection requires a **new Android E3** after a separately authorized/successful Vercel deployment.
- Official T092–T099 remain IN PROGRESS / NOT PASS+LOCK; storage uploading/sending/verified government reply not established.

## Next action after Vercel quota resets
Deploy exact branch SHA via confirmed authorized preview project only, verify Vercel READY and JS content hash, then use ONE Android step at a time for Founder name chooser and Hindi ledger. DO NOT merge main, modify B0–B7, or claim automatic future work.
