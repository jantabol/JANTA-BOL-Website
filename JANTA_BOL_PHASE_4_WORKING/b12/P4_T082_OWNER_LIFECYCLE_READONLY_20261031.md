# JANTA BOL — P4-T082 original backend lifecycle read-only verification (31 Oct 2026)

## Test authority & scope
P4-T082 tests same permanent Article UUID across real publish, correction, unpublish, republish, public privacy, version/audit and role failure isolation. The live article data and original founder controls must not be altered merely to force PASS. This isolated review uses a simulated in-memory Supabase client to execute the **literal unchanged production** `publish` and `unpublish` functions from `JANTA_BOL_PHASE_3C_WORKING/backend-client.js`; no production login, token, write, credential, publish, B2 or Vercel cutover.

## Original production snapshot + actual read-only catalog
- Git SHA tested for live product: `93df12aa8ffdfae38d9a4066b6a4556bb36969e5`, domain `jantabol.in`.
- Actual `public.articles` BEFORE tests (read-only SELECT) 3 sample UUIDs:
  - ISRO NVS03: `c49f00b6-0359-400c-a957-2082142ff8dd`, published version **12**, 11 previous snapshots, 23 article audit events, max historic snapshot v11.
  - ISRO SpaDeX: `f17f6507-02a3-4881-ad37-0b02cadf3d3f`, published version **15**, 14 previous snapshots, 30 article audit events, max historic snapshot v14.
  - T006 test: `fbc2a0c3-6a62-4d7a-ba9a-133c4ddc7e14`, **draft** version **5**, 4 previous snapshots, 5 article audit events, max historic snapshot v4.
- Read-only `pg_trigger`: `trg_enforce_article_lifecycle` BEFORE UPDATE invokes `private.enforce_article_lifecycle()`; `trg_capture_article_history` AFTER INSERT/UPDATE invokes `private.capture_article_history()`. SQL functions independently inspected: Article ID mutation rejected; updates increment version; published_at preserved/restored per transition; update audit records OLD→NEW statuses, snapshots OLD version. The synthetic runner models those effects, but does **not** execute the actual DB trigger in a transaction.
- Actual public RLS `public.articles` enabled; `anon` SELECT requires `status='published'`, and Founder UI demonstrated T006 body hidden in Incognito. Not every alternate API endpoint was exhaustively attacked.

## Original code synthetic regression cases
- Existing-draft Publish → Unpublish → Republish maintains the same Article ID, monotonic versions and expected state changes (mock only).
- Correction overwrites only with correct version-CAS; stale Correction and stale Unpublish fail closed, never clobber newer state.
- Unauthorized calls reject before any write.
- Lost publish ACK after synthetic DB commit cannot be blindly retried with old expected version.
- Static real-source checks: public Article only displays published status, private `preview=admin` requires Owner; Published UI supplies current version to `unpublish`, permalink built from fixed ID.
- Original T080 admin interrupted-network mock tests also run on unchanged source.

**Critical limitation:** Even a CI PASS verifies the original backend code under a synthetic DB, not real production AAL2 execution, PostgREST session owner auth, live correction/unpublish/republish, original source+audit transactional readback or direct API replay. Also manual Source writing happens after Article write; a failure in that second step can make ACK ambiguous — no fake PASS.

## GO / NO-GO
- No publish or unpublish of either genuine ISRO article.
- Never publicly publish T006/fake news to demonstrate a user-facing workflow on a real news platform.
- Owner-authorized live acceptance and E4 audit rollback proof will require a **separately agreed, controlled, non-public isolated test strategy**; if the product lacks a private published staging namespace, mark that E4 real test DUE rather than emit test news.
- `P4-T082 LIVE E4=NOT_RUN; FINAL PASS/LOCK=HOLD`.
- `P4-T081 full coherent Auth+Edge+Vercel+DB+Media restore and real rollback=HOLD`.


## 31 Oct — independent cross-check of ACTUAL historical DB events against CURRENT production source (T082 E4 scoped)
- Exact public-facing source baseline SHA: `93df12aa8ffdfae38d9a4066b6a4556bb36969e5` (no product code modified in this PR).
- Historical *test-only* article UUID `df97df06-a246-4e4e-ac5d-1f965fa6b381`: actual live-readback `draft`, Version **21**. Read-only SQL on `public.audit_logs`, `public.article_versions` confirmed exactly **20/20 sequential Article update events v1→v21** with **no version gaps and no adjacent status-chain breaks**.
- The real historical transitions were **5 into published**, **5 out of published**, **5 published→published corrections**. Subtypes: draft→published=4, published→draft=4, published→deleted=1 and deleted→published=1. Those are historical transitions; deleting/restoring through Trash is **not** being proposed as the new T082 test.
- Live evidence `article_versions` vs audited previous versions: **20/20 snapshots matched**; **0 missing snapshots, 0 status mismatch, 0 permanent Article UUID mismatch, 0 reason mismatch**. Latest historical update `2026-10-27 17:09:39.63771+00` was an exit from published into draft. This is historic recovery/cleanup data, not a new October-31 Founder action.
- Independently verified current original `publish` and `unpublish` functions retain `await requireOwner()`, stable `.eq('id',...)` and expected version-CAS. Their production HTML callers use same ID/permanent links. Live database `private.enforce_article_lifecycle()` trigger preserves Article UUID and increments `version`; `private.capture_article_history()` stores pre-update snapshots and update audit.
- Separate **fresh real Founder Draft Save** on T006 (not the historic test record): `fbc2a0c3-6a62-4d7a-ba9a-133c4ddc7e14`, draft **v5→v6**, new snapshot and `article_update` audit, internal QA note persisted while `Pending Verification` preserved. It did **not** publish fake news.
- Original GitHub Actions `41202699607`: **17/17** production-source synthetic Owner/CAS/network test pass. Historical evidence artifact adds `ci/phase4/b12/t082-lifecycle-historical-readonly.sql` (SELECT only) and a 6-case CI fixture that **never accesses the live DB**. Initial new CI run `41203981606` was RED due to test regex not accepting the original unpublish function's *multiline formatting*, not because the actual CAS implementation is missing. Corrected the test regex; CI `41204032526` **9+6+8=23/23 PASS**, exact original app source unchanged.
- This closes **HISTORICAL VERSION CHAIN + SOURCE RECONCILIATION PASS_SCOPED** only. It does not establish same-date current live Founder correction→unpublish→republish. Full `P4-T082 FINAL PASS/LOCK=HOLD`, `P4-T081 E8=HOLD`.
- Never issue live Production DML, fake public test Article, protected Main merge, or change founder-only lifecycle locks merely to mark E4 current PASS.
