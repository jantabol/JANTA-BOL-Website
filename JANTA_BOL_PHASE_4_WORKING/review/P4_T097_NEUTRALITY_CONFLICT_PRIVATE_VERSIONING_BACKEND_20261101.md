# JANTA BOL — P4-T097 / B8 / RUN-12 — Neutral Evidence, Conflict, Integrity and Versioning

**Audit date:** 2026-11-01. **Original authority:** Founder Phase 4 Master Execution Pack, Topic 13, **P4-T097, ACC029–ACC035, §§891–902**. Required **E2 + E5 + E7 + E9** and baseline **Security + Evidence Storage** regression. Original register still shows `NOT RUN`; formal Final PASS+LOCK NOT authorized. **No paid systems, no rebuild, no release, no credential work, no actual government SEND and no production write.**

## Original requirements and current acceptance boundaries
1. **Neutrality across different parties, including JANTA BOL/Founder:** same evidence classification and review authority; do not infer wrongdoing or apply special exemptions. Owner's power to publish ≠ power to modify sealed evidence. Original actual distinct-subject Founder/Reporter E5 evidence is still DUE.
2. **Conflict guard:** G5 `CONFLICT / FLAG_RAISED` retains a private unverified flag; an already published case must be HIDDEN before the conflict flag; G4 server trigger denies further PUBLISH/REVISE on unresolved conflict. This is a technical guard, **not guilt or an external adjudication**.
3. **Private/public separation:** original case claims, private bytes receipts, version rows, G5 facts, G7 chronology, and G4 Founder revisions have direct table grants denied to anon/authenticated and RLS ON. Public G4 fixed safe projection never displays raw private source text, hashes or personnel details. Real hosted anonymous HTTP privacy E5/E9 remains separately DUE.
4. **Large evidence pack:** G5/G7 Owner keyset readers use `id < before_id` with max **50 rows per UI page** and no fixed global event cap. Disposable PG17 original T097 fixture proves **120** G5 facts and **105** G7 chronology events accessible across three pages each, not 225 real evidence items. Existing raw receipt byte storage is NOT unlimited physical capacity; no claim of unmetered external storage.
5. **Original + Revised:** T097 Owner AAL2 RPC stores immutable `ORIGINAL` version 1, then `REVISED` with previous version ID equal to latest, distinct same-case real private receipt, provenance `PRIVATE_BYTES_ONLY_NOT_OFFICIAL_VERIFIED`. No fabricated source authenticity.
6. **Audit integrity:** G5, G7, G2 evidence claims, G4 public history, and T097 document version tables use active append-only triggers. Database superusers can disable triggers; NOT a mathematical tamper-proof guarantee. Older versions and chronological public revision history remain recoverable under declared access.

## Actual current LIVE Supabase inspection (SELECT ONLY; correct JANTA BOL project)
Target `vrffsnkycvjithwtiylt` PostgreSQL **17.6**; never the separate cricket project.
- All six audited private/public-history tables `b8_case_evidence_claims`, `b8_g4_public_revisions`, `b8_g5_fact_events`, `b8_g7_history_events`, `b8_private_upload_receipts`, `b8_t097_document_versions` exist with **RLS ON** and **zero direct table grants to anonymous/authenticated roles**.
- Founder AAL2 gate exists on actual SECURITY DEFINER RPCs `jb_b8_t097_owner_record_document_version`, `jb_b8_t097_owner_fact_page`, `jb_b8_t097_owner_history_page`, `jb_b8_g5_owner_record_fact`, `jb_b8_g4_owner_release_public_projection`; anonymous EXECUTE is **false**. Authenticated EXECUTE is conditionally gated by Owner AAL2 INSIDE each function; `authenticated` SQL grant alone is not sufficient.
- Original/revised/private receipt constraints on `b8_t097_document_versions` verified from PostgreSQL live `pg_constraint`: unique case/document/version, unique case/document/receipt, `ORIGINAL` version1 previous=NULL, `REVISED` version>1 previous!=NULL, and `provenance=PRIVATE_BYTES_ONLY_NOT_OFFICIAL_VERIFIED`. Live function body includes same-case receipt and latest-version conflict refusal.
- G5 `B8_G5_HIDE_PUBLIC_BEFORE_CONFLICT_FLAG` guard present on actual Owner RPC; `b8_g5_conflict_public_revision_gate` is enabled on live G4 public revisions. G2 claims, G4 public revisions, G5 private facts, G7 history and T097 document versions **all have enabled immutability triggers**.
- **PRIVATE_EVIDENCE_UPLOAD = FALSE** in `b8_g6_release_controls`; no private bytes are enabled/attested by this test. Do not toggle merely to get a green test.
- Genuine earlier Android TEST ONLY NH-3 case `0cf14822-6633-4bb5-a60f-6df2cf8cc19f`: **1 UNVERIFIED claim** to NHAI 2018 PDF, **0** private byte receipts, **0** T097 original/revised versions, **0** conflicts, **0** G4 public revisions; **6** G5 facts and **1** G7 summary draft from earlier actual Founder E5. **All-case document versions = 0**. No real uploaded source bytes or Founder conflict case acceptance proof.
- This is an actual **hosted E2 catalog/guard inventory**, not proof of a genuine cross-subject E5 test, live HTTP public retrieval privacy or third-party E9 response.

## Source-to-Android parity gap (honest findings)
- Existing Founder Android UI **does** offer private `CONFLICT` flag + `FLAG_RAISED`; Owner G5/G7 private chronology supports 50-item pages, next-cursor and 15-minute lock.
- Existing T097 **versioned-document Owner RPC exists in live SQL** but **there is no current `ownerRecordDocumentVersion` client wrapper or mobile form for `jb_b8_t097_owner_record_document_version`** in `JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.js`, `b8-accountability-ui.js` or `b8-accountability.html`. This is an **actual frontend E5 reachability gap**, not a backend schema failure. Do not tell Founder to paste SQL or claim physical Android document-versioning PASS.
- Baseline real case lacks verified same-case private upload receipt and private release remains OFF, so an original/revised version cannot be lawfully created in that case right now. Do **not** fabricate a receipt or turn on upload.
- True neutrality with an independent self-referential subject (JANTA BOL/Founder) and real public/private disclosure safeguards remains **E5/E9 DUE**. No extra accounts or public allegations to be created on user behalf.

## Verification and completion gate
- `T097_LIVE_E2_CATALOG_RLS_OWNER_AAL2=PASS_SCOPED_READ_ONLY`
- `T097_LIVE_IMMUTABILITY_CONFLICT_G4_G5=PASS_SCOPED_READ_ONLY`
- `T097_LIVE_PRIVATE_UPLOAD_DEFAULT_OFF=PASS_SCOPED_READ_ONLY`
- `T097_CURRENT_ORIGINAL_PG17_AND_SOURCE_REGRESSION=PASS_SCOPED_RUN_41318449473`
- `T097_REAL_FOUNDER_CROSS_SUBJECT_E5=NOT_RUN`
- `T097_REAL_MOBILE_VERSIONING_E5=BLOCKED_FRONTEND_MISSING`
- `T097_REAL_2026_INDEPENDENT_ORIGINAL_REVISED_BYTES_E9=NOT_RUN`
- `T097_REAL_PUBLIC_HTTP_PRIVACY_E5_E9=NOT_RUN`
- **`T097_OFFICIAL_FINAL_PASS_LOCK=HOLD`**

All existing product files stay byte-identical. No change to Published News/Ads/backup/DNS/role permission, Supabase schema, real Storage or external agencies. Future fix for mobile versioning must be **additive**, review-first, separately tested, feature OFF until genuine byte receipt exists. Soft Launch (public news) takes precedence over synthetic B8 closure.

## 2026-11-01 — Current executable CI results and failure correction

**First try did NOT pass**: GitHub Actions `#41318351632`, original candidate SHA `9aaa7d607ab22fc7fc2b585538da60d7925ca698`, **FAILED at source-only Node tests 15/17**; isolated PostgreSQL17 job correctly **SKIPPED** because needs guard failed. Root causes **in the newly added test code only**: expected source client error names with a non-existent `B8_` prefix instead of actual `T097_UNTRUSTED_PRIVATE_FACT_PAGE` and `T097_UNTRUSTED_PRIVATE_HISTORY_PAGE`, and incorrectly expected lowercase `public` at the start of a capitalized phrase `Public G4 fixed safe projection` in this report. They were **not application privacy/security bugs**, and no original code was changed.

**Targeted minimal test correction**: Commit `68246a16551daf3c5ef50f844a6fa2cc32fd2023`, only changed the new `ci/phase4/b8-t097-neutrality-conflict-versions-source.test.mjs`; product files still byte-identical. **Actual current executable GitHub Actions run**: `https://github.com/jantabol/JANTA-BOL-Website/actions/runs/41318449473`, **COMPLETED SUCCESS**, source/Android and both inherited original jobs green:
- **17/17** new original T097 source/security/negative contract cases PASS.
- **39/39** inherited bounded Android/client contract test executions PASS (5 T096/97 private cursor; 8 G5 Owner; 6 G6 private release; 5 G7 private history; 15 G4 public projection). Total targeted current source + guarded existing = **56/56 test executions, 0 FAIL**, not 56 physically completed tests.
- Original **disposable PG17 G0–G9** and old protected News/Auth/B7 source test jobs **SUCCESS**. Original `ci/phase4/b8-t097-neutral-integrity-paging-regression-v3.sql` executed with **120 synthetic G5 events and 105 G7 events across keyset pages**, immutable ORIGINAL then REVISED document chain, no cross-case receipt, anon access denied, duplicate/past version mutation denied, `ROLLBACK`. This is isolated runner verification, **NOT 225 real uploaded source items, not a production storage claim**.
- Master source ZIP packaging job `SKIPPED`; this is not a final release or completed archive.
- Live JANTA BOL Supabase project was **SELECT-only**; private upload switch remained **OFF**; no Article/PURL, Ads, Founder role, prod secrets, Supabase state, Edge, DNS or external agency changed.

**Formal classification**
`T097_BACKEND_SQL_SOURCE_PG17_E7=PASS_SCOPED`
`T097_HOSTED_CATALOG_PRIVACY_RLS=PASS_SCOPED_READ_ONLY`
`T097_DOCUMENT_VERSIONS_BACKEND=AVAILABLE_BUT_ZERO_GENUINE_RECEIPTS`
`T097_FOUNDER_ANDROID_DOCUMENT_VERSION_ENTRY=BLOCKED_FRONTEND_MISSING`
`T097_REAL_NEUTRAL_MULTI_SUBJECT_FOUNDER_E5=NOT_RUN`
`T097_EXTERNAL_SOURCE_AND_AUTHENTICITY_E9=NOT_RUN`
**`T097_OFFICIAL_FINAL_PASS_LOCK=HOLD`**

**Founder manual step now: NONE**. Before live Android versioning, add the missing bounded Owner-only UI/client wrapper in a separately scoped PR and test negative coverage, then gather authentic same-case PRIVATE upload receipt by an explicitly approved workflow. No screenshot of a fabricated receipt, never enable private storage merely to pass a test. Do not repeat completed T096 private summary/monitoring or unrelated published News articles. Public NEWS Soft Launch remains first priority.
