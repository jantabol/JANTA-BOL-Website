# JANTA BOL B8 / T093 — Actual LIVE duplicate-fact protection checkpoint
Date: 2026-10-21. Founder-requested continuation. **No fake PASS.**

## Root cause independently verified
Android G5 private history showed 3 facts, including two projected-impact entries. Real Supabase project `vrffsnkycvjithwtiylt`, on the JANTA BOL linked account, was queried read-only. Facts #2 and #3 are **exact duplicates**, not merely similar: same case_id, kind=IMPACT, field_code=DOCUMENTED_PROJECTED, exact detail_text, and null money/date/receipt. The earlier G5 RPC had case-row FOR UPDATE but no duplicate predicate. Browser lost-visible-result/repeated submit could therefore append twice.

## Source / evidence
- GitHub source branch before deployment: `9d4426136f0a96af5095195e9459c11ce6ee914d`.
- CI 39547236769: 3/3 SUCCESS including PG17 exact re-submit negatives and original B0–B7 regression.
- Applied scoped migration via JANTA BOL Supabase account, not Cricket Supabase: `b8_g5_t093_prevent_identical_fact_retry_20261021` (version `20261021050752`), response success=true.
- SQL path: `JANTA_BOL_PHASE_4_WORKING/db/20261021_b8_g5_no_exact_duplicate_fact_REVIEW_ONLY.sql`.
- Existing case-row FOR UPDATE lock retained; exact duplicates now raise `B8_G5_EXACT_DUPLICATE_NOT_APPENDED`; different new attributed facts remain allowed; all existing facts append-only.
- Live independent post-audit: function text contains guard; case row lock present; immutable trigger enabled; G5 check valid; total G5 events=3 (unchanged); 2 projected impacts + 1 historic estimated cost; RLS/table direct access remains denied; anon EXECUTE denied; Founder auth RPC unchanged; private evidence upload OFF. News count at checkpoint 32 (had risen from an earlier unrelated 31 before this migration), ad campaigns=7. Neither was modified by B8 migration.
- Existing impact #2 and #3 untouched and remain NOT_INDEPENDENTLY_VERIFIED. Never delete or relabel old append-only evidence silently.

## Scope and tests still NOT RUN
Live negative duplicate-submit test through authenticated Android UI NOT RUN: do not intentionally re-submit the same evidence because the frontend may still show raw server codes if its latest UI asset is not deployed. PG17 negative CI and LIVE read-only function/ACL proof are available; **T093 full PASS + LOCK remains HOLD**. Next: Impact Reason and Alternatives actual E3/E2 end-to-end; check status/output on Android only on verified deployed preview, one step per time. No public news publish, no official SEND.
