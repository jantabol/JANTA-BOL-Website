# JANTA BOL — T097 Founder Android Original/Revised Versioning — Scoped Additive Candidate

**Date:** 2026-11-01. **Source authority:** Original P4-T097 / RUN-12 / ACC-029–035, §891–902. Related G6 private upload and pre-existing T097 immutable backend RPC only. **Release state:** DRAFT PR, not deployed, NOT FINAL LOCK. **No new News/Ads/Article/PURL/SQL/Service role/Auth/DNS/Storage change.**

## Precisely repaired gap, not a rebuild
Original T097 backend `jb_b8_t097_owner_record_document_version(uuid,text,text,uuid,bigint)` already runs in hosted JANTA BOL Supabase behind Owner AAL2; original Founder B8 mobile page had no form to call it. This candidate adds only:
1. `JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.js`: `ownerRecordT097DocumentVersion(caseId,documentKey,stage,receiptId,previousVersionId)` with owner-only client preflight. Strict 3–80 [a-z0-9_-] case-insensitive? **No: lowercase only**, `ORIGINAL` previous must be empty, `REVISED` needs positive bounded PostgreSQL int8 server record ID. UUIDs must be well-formed, no auto-generated receipts, no retry, no lenient `verified` stage. Calls the **existing single RPC once**; server remains same-case and latest-version authority. Returns only immutable event ID, typed stage, `PRIVATE_BYTES_ONLY_NOT_OFFICIAL_VERIFIED`. No upload or independent government verification.
2. `JANTA_BOL_PHASE_3C_WORKING/b8-accountability.html`: additional Founder-only `t097Version` form inside existing G5 private panel with explicit case/key/ORIGINAL or REVISED/real server receipt/prior ID, a required confirmation checkbox, no upload controls, and warning that a ChatGPT-attached PDF and claim hash are not private server bytes.
3. `JANTA_BOL_PHASE_3C_WORKING/b8-accountability-ui.js`: adds `t097VersionCase` to the existing case-selector propagation, one new Founder phone task, checks consent, invokes existing wrapper with fresh Auth check and existing 15-minute lock, scrubs entered receipt inputs on success and lock. Error results refuse to claim success; never auto-publishes anything.

## Consent and delivery truth
No valid real same-case private byte receipt exists in the NH3 `TEST ONLY` case; connected read-only SQL verified `b8_private_upload_receipts=0` and `b8_t097_document_versions=0`. G6 private upload switch remains **OFF**. Therefore current UI code availability does NOT authorize an arbitrary manual T097 submission or enable uploads. No Founder step now unless real source/receipt and explicit security-gated staging are separately established. No real government email sent.

## Historical constraints maintained
- Original Article ID/PURL, existing published stories, G2–G7 SQL migrations, all Phase3/B7/Auth and other protected modules untouched.
- The existing private version RPC is the only mutation endpoint. It **requires** Owner AAL2 and same-case receipt, ORIGINAL first, REVISED latest only, append-only immutable history. Its design maintains `PRIVATE_BYTES_ONLY_NOT_OFFICIAL_VERIFIED`, even if byte integrity checks pass.
- New Node tests include malicious/wrong-role/cross-case-shaped IDs, invalid stage/key, missing/stale previous ID shape, bogus ACK, returned integer boundary, receipt confirmation and mobile navigation/lock wiring. Original disposable PG17 regression (120 synthetic facts/105 chronology pages, immutable version chain and no public leaks) must run on a separate ephemeral runner only.
- A merged review/draft or source CI green cannot replace real Founder Android E5 with verified receipt, actual neutral other-subject/Founder conflict scenario or genuinely sourced E9.

## Evidence and verdict
`T097_ANDROID_VERSIONING_CODE=PASS_SCOPED_SOURCE_AND_ISOLATED` — **pending final current-head CI recheck; do not use before current-head success**.
`T097_REAL_FOUNDER_ANDROID_E5=NOT_RUN`.
`T097_REAL_SAME_CASE_BYTE_RECEIPT_E9=NOT_RUN`.
`T097_REAL_MULTI_SUBJECT_NEUTRALITY_E5=NOT_RUN`.
`T097_REAL_PUBLIC_HTTP_PRIVACY=NOT_RUN`.
`T097_OFFICIAL_FINAL_PASS_LOCK=HOLD`.

No promise of installation into live `jantabol.in` until release gates verify the precise SHA. Draft PR may be reviewed, but not merged/approved as full T097 acceptance. Founder manual action **none** in this coding-only task.
