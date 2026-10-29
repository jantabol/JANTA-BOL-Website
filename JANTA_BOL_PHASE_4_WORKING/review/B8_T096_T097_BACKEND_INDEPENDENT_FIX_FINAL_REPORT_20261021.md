# JANTA BOL B8 — P4-T096 + P4-T097 Independent Backend Bug Fix — Final Engineering Report
Date: 21 Oct 2026 | Source branch: codex/b8-g5-main-based-integration-20261017

## Verdict
**TEST-ISOLATED ENGINEERING FIX = PASS (PG17 + protected CI), LIVE DEPLOYMENT = NOT DONE.**
**Official P4-T096/P4-T097 FINAL PASS+LOCK = HOLD** pending E4/E5/E7/E9, Android E3 where relevant, and authorised production roll-out.
DO NOT reinterpret 3/3 CI as official real-case E9 evidence, actual external delivery, production PASS or B8 full LOCK.

## Authority
Master Phase-4 Execution Pack 321-page (2026-10-16), RUN-12:
P4-T096 = ACC-025...028 §§875–890; Required E2 + E4 + E5 + E9, original Article ID/PURL baseline regression.
P4-T097 = ACC-029...035 §§891–902; Required E2 + E5 + E7 + E9, security/evidence-storage regression.
Additional R3 final precoding design (2026-10-17) mandates one master per linked set, explicit disposition before closure, no cap to cumulative evidence, version originals/revisions, anti-motive attribution, private default.

## Reproduced FIRST DIVERGENCES (original source)
1. `public.b8_case_article_links` only had `UNIQUE(case_id,article_id)`; the same original article could be linked into a second Master Case, duplicating accountability identity. Unlike News 1 Article=1 PURL, a case had no cross-case link exclusion.
2. `public.jb_b8_g5_owner_record_outcome` accepted a private receipt and a reason to CLOSE without checking whether every existing question was explicitly disposed. False editorial closure possible.
3. `public.jb_b8_g5_owner_reopen_case` appended REOPEN and restored investigating, but a previously Founder-approved public `CLOSED` projection could remain publicly visible as CLOSED after reopen. Truth drift.
4. `jb_b8_g5_owner_private_ledger` and `jb_b8_g7_owner_private_history` only returned 100 records with no continuation mechanism. >100 remained stored but were invisible through those single-call readers; contrary to ACC-032 completeness.
5. G7 `EVIDENCE_VERSION` was an append-only event with receipt ID but did not expose a dedicated independently constrained `document_key + exact original→revised` chain for multiple official versions. Version association and cross-document lineage could not be reliably proved.

## Minimum scoped fixes — review-only, no LIVE mutation
- `JANTA_BOL_PHASE_4_WORKING/db/20261021_b8_t096_master_outcome_reopen_guard_REVIEW_ONLY.sql`:
  - Unique index on existing `b8_case_article_links(article_id)` (migration refuses to run if pre-existing cross-case duplicates).
  - Immutable, private `b8_t096_question_disposition_events`; Founder/AAL2 method `jb_b8_t096_owner_record_question_disposition` with case/receipt checks; dispositions are attributed unverified claims, not a certified official answer.
  - Existing G5 CLOSE RPC requires a disposition for every draft question, in addition to existing genuine-byte and reason guards.
  - Existing Founder/AAL2 REOPEN RPC atomically appends G4 HIDE when the prior public revision remains PUBLISH/REVISE; neither old closure nor prior public revisions are deleted.
- `JANTA_BOL_PHASE_4_WORKING/db/20261021_b8_t097_integrity_versioned_paging_REVIEW_ONLY.sql`:
  - Append-only `b8_t097_document_versions`, `document_key` + `version_no`, parent link, same-case verified-byte *integrity* receipt, immutable snapshots, Owner/AAL2, no claim of official document truth.
  - `jb_b8_t097_owner_record_document_version` refuses cross-case media and revised-without-current-predecessor forks.
  - `jb_b8_t097_owner_fact_page` and `jb_b8_t097_owner_history_page` support keyset pagination of an arbitrarily large total with per-page 1–100 limit, preserving legacy read endpoints and exact `cost_inr` decimal value. No public grants and no per-case total item cap.
- Source protection: No original Article/News/Ads/Auth/B7 code touched. Private upload remains OFF in LIVE and publication is Founder controlled.

## Independent regression proof
GitHub Actions run: https://github.com/jantabol/JANTA-BOL-Website/actions/runs/39593857725
Source SHA: `58ebf72941d92a1fd99451401e3a3c4d3e03802e`.
**3/3 completed SUCCESS independently checked**:
1. PG17 G1–G9 + T094 original + T096 + T097 migrations and actual SQL negative regression success.
2. Protected original Phase-3 News/Auth + B7 regression success.
3. B0–B8 source ZIP/manifest job success.

Explicit new regression files:
- `ci/phase4/b8-t096-master-outcome-reopen-regression-v3.sql`: cross-Master article duplicate DENY; closed-with-unanswered question DENY; explicit unanswered disposition and private receipt; reopen hides stale CLOSED public projection; old article title/version unchanged. Synthetic rollback, no provider send.
- `ci/phase4/b8-t097-neutral-integrity-paging-regression-v3.sql`: same-case receipt and immutable original/revised chain; cross-case refusal; 119 projected ground observations plus 1 synthetic estimated cost; exact `12345.67` cost readback; 120 private fact records in three cursor pages; 105 history events in three cursor pages; impossible per-page size 101 rejected; no bogus official verification. Synthetic rollback.
- Earlier v1/v2 tests may fail from typo or upload OFF fixture; retain for trace, ONLY these explicitly wired v3 scripts were passed.
- Old Phase-3/4 CI successfully protects News/Auth/B7 and SQL rollback. No actual journalist send or official contact.

## Live preservation independently rechecked after CI
Supabase **JANTA BOL** project `vrffsnkycvjithwtiylt`, read-only SELECT:
- News = **32**; Advertisement campaigns = **7**.
- B8 master case = 1; NH-3 T093 private fact events = **5** (untouched).
- B8 T094 question drafts = 0; original G7 history = 0.
- New T096/T097 migration tables and paged RPCs **NOT deployed LIVE**. No real private receipt/facts created by this engineering test.

## Per-requirement classification (engineering vs official)
T096:
- ACC-025: duplicate existing Article across two Master Cases denied in PG17; future genuinely split case policy and LIVE E4 remain due.
- ACC-026: old Article UUID/title/version retained in PG17; multiple genuinely new published Article/PURL E4 not run.
- ACC-027: baseline G4 public/private isolation plus reopen forced HIDE; real public E4 browser and complete chronology not run.
- ACC-028: negative closure denial, append-only disposition, reopen preserves old outcome + public hide PG17 tested. Real E9 closure/reopen not run.
T097:
- ACC-029: common Owner/role/receipt guard code, BUT comparative real government/opposition/advertiser/Founder case E9 not run.
- ACC-030: baseline conflict-flag no-public guard and private immutability; true Founder-as-subject E9 review and manual conflict workflow due.
- ACC-031: immutable old document version tested in PG17; original source bytes must be independently authenticated.
- ACC-032: 120 fact + 105 history rows and exact cost page PASS in isolated PG17. Android pagination consumer not yet integrated.
- ACC-033: baseline anon/private-deny + no new public read grants; Android public/download negative proof due.
- ACC-034: original→revised same-case immutable sequence PG17 tested; real agency revised document original bytes E9 due.
- ACC-035: new version status is byte-integrity-only; motive is neither captured nor inferred. Real E9 source-based narrative check due.

## GATE
CP coding fixes and isolated E2 security proof are complete. **Do not mark whole T096/T097 official PASS+LOCK and do not start B9 on the assertion that all B8 is locked.**
Next gate: independent LIVE migration review, any existing-data/index conflict proof, Founder explicit deployment authorisation, targeted LIVE E2, Android E3/E4 and real original E9. Existing News, Ads and five T093 facts must remain unchanged. No rebuild, no invented E9, no automatic official send.
