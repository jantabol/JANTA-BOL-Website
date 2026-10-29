# JANTA BOL B8 — T093 Android Impact Classification RCA / 17 Oct 2026

**Trigger:** Founder Android screenshots of B8 `Impact` → `Record classification`. Only `AUTHORITY_STATED` (“अधिकारी द्वारा बताया गया”) and `GROUND_REPORTED` (“जमीन से दर्ज”) appeared for IMPACT; `DOCUMENTED_PROPOSAL` existed only under ALTERNATIVE.

**First divergence:** MPPCB-hosted historic consultant NH-3 Shivpuri–Dewas feasibility PDF contains forecasts/potential tree/environment effects from the past; it is neither evidence of actual tree felling nor necessarily an independently verified official authority conclusion. Forcing it into official or field category would misstate provenance.

**Exact backend cause:** Original LIVE `public.b8_g5_fact_events` check `b8_g5_fact_events_check` limited IMPACT to `AUTHORITY_STATED, GROUND_REPORTED`; JS client `ownerRecordG5Fact` used matching two-code whitelist; Android HTML followed same two choices. Three-layer domain model gap, not a phone dropdown malfunction.

**Minimum safe solution** (no rebuild, no News/Ads changes):
- Third G5 IMPACT field `DOCUMENTED_PROJECTED`: **“ऐतिहासिक दस्तावेज में अनुमानित/संभावित प्रभाव (वास्तविक नुकसान नहीं)”**.
- **Authority** remains distinct: `AUTHORITY_STATED`; **actual reported field** remains `GROUND_REPORTED`; **alternative proposal** remains `ALTERNATIVE.DOCUMENTED_PROPOSAL`.
- Original G5 owner AAL2 / 500-char source attribution / no money or deadline in IMPACT / default `NOT_INDEPENDENTLY_VERIFIED` / immutable append-only trigger preserved.
- GitHub files: `JANTA_BOL_PHASE_4_WORKING/db/20261017_b8_g5_t093_document_projected_impact_REVIEW_ONLY.sql`, B8 HTML/client/UI, isolated PG17 + Android tests.
- Original current test case cost estimate INR 23864600000.00 (₹2,386.46 crore) remains separately recorded as **ESTIMATED_PROPOSED, unverified**.

**CI:** `97f7e383329ac1c5031da57ee7cc19f5f232c14a` — run 39043517582 **3/3 SUCCESS** after test-driven syntax/ACL corrections. PG17 negative tests for cross-kind alias, money/date mixing, AAL1/Reporter, immutable ledger; no simulated official verification.

**LIVE B8-only deployment:** Founder previously explicitly approved B8 backend rollout. Applied additive existing-table G5 validated constraint migration `b8_g5_t093_historical_document_projected_impact_20261017` in Supabase project `vrffsnkycvjithwtiylt`. Tool result `success=true`. Read-only aftercheck: projected enabled=true; **1 old G5 event unchanged** (same ₹23864600000.00 estimate), **0 new impact events**, immutable trigger present, **31 original news**, **7 advertising campaigns**, private upload OFF. This is a scoped schema test, not full record-level regression.

**STOP / Manual E3 pending:** Current old Vercel preview still shows only original two IMPACT classes. Founder MUST NOT pick either for this document or submit an inaccurately classified record. Previous attempted Git-connected preview deployment reported Vercel `402 api-deployments-free-per-day` limit (over 100/day, retryAfter 86400). New Hindi UI code is CI passed but **not yet confirmed deployed**. Wait for authorized Vercel quota release, deploy exact reviewed branch, verify ready + asset version; then Android Founder shows THIRD `DOCUMENTED_PROJECTED` option and can continue T093 E3/E2. NO fake PASS/LOCK for Impact UI until phone proof.

**User-facing safe pause:** close classification dropdown without selecting; no additional action until new preview proven.
