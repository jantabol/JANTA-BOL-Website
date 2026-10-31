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
