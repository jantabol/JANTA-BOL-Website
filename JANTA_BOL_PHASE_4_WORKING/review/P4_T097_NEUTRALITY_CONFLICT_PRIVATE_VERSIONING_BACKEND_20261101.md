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
- `T097_CURRENT_ORIGINAL_PG17_AND_SOURCE_REGRESSION=CI_PENDING`
- `T097_REAL_FOUNDER_CROSS_SUBJECT_E5=NOT_RUN`
- `T097_REAL_MOBILE_VERSIONING_E5=BLOCKED_FRONTEND_MISSING`
- `T097_REAL_2026_INDEPENDENT_ORIGINAL_REVISED_BYTES_E9=NOT_RUN`
- `T097_REAL_PUBLIC_HTTP_PRIVACY_E5_E9=NOT_RUN`
- **`T097_OFFICIAL_FINAL_PASS_LOCK=HOLD`**

All existing product files stay byte-identical. No change to Published News/Ads/backup/DNS/role permission, Supabase schema, real Storage or external agencies. Future fix for mobile versioning must be **additive**, review-first, separately tested, feature OFF until genuine byte receipt exists. Soft Launch (public news) takes precedence over synthetic B8 closure.
