# JANTA BOL Phase-4 B8 — LIVE Backend G1–G9 Deployment Evidence
**Date:** 17 October 2026 | **Project:** JANTA BOL Supabase `vrffsnkycvjithwtiylt` (PostgreSQL 17.6)
**Founder authorization:** Explicit user message: "Backend deployment kro or ui ko mobile phone k hisab se setup kro" followed by "start kro backend ka kaam or phir test start krte h."
**Source authority:** `jantabol/JANTA-BOL-Website`, branch `codex/b8-g5-main-based-integration-20261017`, exact reviewed SQL source SHA `3c22fc3597f0eb6b67e052bc5adf1e90395e8158`.
**Result:** B8 G1→G9 DATABASE DEPLOYMENT = **LIVE APPLIED**, independent read-only postchecks below. Official tests T092–T099 **NOT YET PASS**.

## Production migration ledger (actual Supabase success=true, executed separately in order)
| # | Ledger version | Migration |
|---|---|---|
|1|20261017133052|b8_g1_case_drafts_readiness_20261017|
|2|20261017133136|b8_g1_editor_private_review_20261017|
|3|20261017133145|b8_g2_provenance_private_evidence_20261017|
|4|20261017133202|b8_g2_linked_article_delete_guard_20261017|
|5|20261017133216|b8_g2_private_upload_foundation_20261017|
|6|20261017133246|b8_g3_evidence_review_notifications_20261017|
|7|20261017133256|b8_g3_manual_handoff_claim_truth_20261017|
|8|20261017133304|b8_g3_official_reply_claims_20261017|
|9|20261017133326|b8_g4_safe_public_projection_20261017|
|10|20261017133332|b8_g5_private_fact_ledger_20261017|
|11|20261017133337|b8_g6_upload_off_by_default_20261017|
|12|20261017133353|b8_g7_immutable_claim_chronology_20261017|
|13|20261017133358|b8_g8_official_manual_receipt_review_20261017|
|14|20261017133404|b8_g9_owner_due_followups_20261017|

## Verified live SELECT-only checks after all 14 migrations
- **B8 runtime:** `public.jb_b8_g1_runtime_readiness()` reports `{"component":"JANTA_BOL_B8","contract":"G0_G9_20261017","db_ready":true,"official_send_by_app":false,"edge_storage_verified":false,"e9_external_authenticity_verified":false}`. This is B8 SQL contract readiness **not** proof of successful browser authorization or evidence upload.
- **Objects:** 26 B8 tables + 44 `jb_b8_%` RPCs installed. All 26 B8 tables RLS-enabled; 0 grant direct SELECT/DML to anon/authenticated. Only two anonymous callable B8 RPCs: `jb_b8_g4_public_case` and `jb_b8_g4_public_feed`, both intentionally safe fixed-field public projection.
- **Source preservation check:** `public.articles=31`, `public.ad_campaigns=7`, `public.ad_history=29`, `public.live_notifications=160`; same observed counts in the immediate before-and-after release window. **Counts alone do not prove every row byte-for-byte unchanged**.
- **Article lifetime:** `b8_guard_linked_article_hard_delete` enabled on original `public.articles`, blocking hard-delete **only** when a B8 case/article link exists. Initially `b8_case_article_links=0`. Original existing articles not relinked.
- **Private upload:** `public.b8_g6_release_controls` has `feature=PRIVATE_EVIDENCE_UPLOAD,enabled=false`; Founder explicitly review before ever enabling. No Storage/Edge approval, no external government SEND.
- **No fabricated test data:** B8 cases=0, B8 fact events=0, B8 handoffs=0, B8 public revisions=0 immediately after deployment. Real first Case requires Android Owner-AAL2 after authorized login.
- **Supabase Security Advisor:** intentional warnings for RLS/no policy because B8 direct table privileges revoked and RPC only; two intended anonymous public projection SECURITY DEFINER functions still warrant real anonymous leak test. Wider pre-existing platform warnings are not certified clean.
- **GitHub CI:** [B8 Android + PG17 + Old News regression 3/3 SUCCESS](https://github.com/jantabol/JANTA-BOL-Website/actions/runs/39035767208) on commit `3c22fc3597f0eb6b67e052bc5adf1e90395e8158`.
- **Vercel preview:** deployment `dpl_7vALncFQ43t3UKRoFyNk7SiUhErf` = READY, nonproduction preview branch SHA matches. New focused phone UI must be tested on an actual Android device. No claim of screenshot proof from Vercel deployment metadata.

## STOP / Remaining gates
1. **Real Android Founder AAL2 login & UI:** Use new **branch-scoped Vercel preview**, not SPCK's stale imported ZIP; request one manual action at a time. No passwords, MFA code, keys or tokens shared with agent. Verify real `JBBackend` boot and `B8` read-only readiness.
2. **Real scoped Case test:** Founder creates a clearly named TEST ONLY private R0 case from Android after reading action; inspect actual returned UUID/server stored case before logging real T092 E2.
3. **Rights:** Real anonymous, reporter/editor, revoked, Owner AAL1 vs AAL2 negative matrix with unchanged ledger; never impersonate production JWT with SQL fixture or claim E5 from synthetic CI.
4. **Source context:** MPPCB-hosted historical consultant highway PDF is E9 source artifact presence only, not verified present-day ground/contractor guilt, actual spend, recipient reply or delivery.
5. **Article delete/legal hold:** Guard intentionally changes Founder permanent-delete for a **linked** Article; review future lawful disposition and do not perform hard-delete tests on genuine news.
6. **Storage & Media:** G6 remains OFF until upload worker, release/retention, storage byte backup+restore and authenticated safe negative tests completed. No automatic external messages.
7. **Release separation:** Preview branch is NOT automatically verified production website release. Do not merge over protected main or call T092–T099 FINAL PASS without the official ACC001..051 evidence.

**Status:** B8 LIVE SQL INSTALLED/READINESS SCOPED PASS. Android REAL testing awaits Founder phone screenshot. Official T092 remains IN PROGRESS.
