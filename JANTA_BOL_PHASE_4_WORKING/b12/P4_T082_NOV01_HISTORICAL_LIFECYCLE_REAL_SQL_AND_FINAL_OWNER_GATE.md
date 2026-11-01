# JANTA BOL — T082 original Article lifecycle: real historical SQL proof / current Founder gate
Date: 2026-11-01. Evidence = live provider SELECT read-only; NOT source-only synthetic simulation. **T082 HISTORIC LIFECYCLE=PASS_SCOPED; CURRENT FULL E4=NOT_RUN; FINAL LOCK=HOLD.**

## Read-only real SQL (never extracted article text, private user IDs or credentials)
JANTA BOL production Supabase project `vrffsnkycvjithwtiylt` only (Cricket account untouched).
- `public.articles` total 34: **2 published, 31 draft, 1 deleted**.
- Legitimate two public ISRO Article UUIDs `c49f00b6-0359-400c-a957-2082142ff8dd` **published v12** and `f17f6507-02a3-4881-ad37-0b02cadf3d3f` **published v15**, unchanged.
- Private QA-only T006 `fbc2a0c3-6a62-4d7a-ba9a-133c4ddc7e14` **draft v6**, no published_at. Do NOT publish for QA.
- Historical QA Article `df97df06-a246-4e4e-ac5d-1f965fa6b381` **draft v21**, no new UPDATE, DELETE, PUBLISH or Founder session action conducted.
- `article_versions` holds **20 actual saved snapshots** for this historical record (v1–v20), whose `snapshot->>'status'` transitions (SQL window `LAG`) were independently counted:
  - **4 draft → published**
  - **3 published → draft**
  - **1 published → deleted**
  - **1 deleted → published**
  - Remaining 10 adjacent pairs retained their old status, including published→published corrections. (20 snapshots = 19 adjacent transitions; total status changes = 9; 10 same-status.)
- `audit_logs` has **21 events** for that historical QA record: **1 article_create + 20 article_update**. This is a live aggregation, **not** a cryptographic proof of who was in control of each operation.
- Live total `article_versions` **920**, `audit_logs` **1635** at readback. No private Article body, actor ID, contact, MFA or media bytes accessed.

## What this proves / what it cannot prove
Historical server rows demonstrate real stored lifecycle transitions existed and original Article versioning/audit is exercised. Some transitions include unpublish/republish-style status changes; this proves the historical data persisted, not that every current Production UI/E4 workflow with Founder authorization, permanent URL, cross-account denial and correct contemporary code still works.

**T082 current comprehensive Founder E4 remains NOT_RUN:** no controlled verified current Correction→Unpublish→Republish performed after the currently served Vercel SHA was deployed, and cannot be performed by a read-only assistant through privileged SQL without violating Founder-only editorial/security control. Earlier **anonymous draft/preview fail-closed 2/2 real Chrome** and user Android screenshot support only scoped E5, not all cross-account attacks.

## Safe completion boundary (not a work request to bypass the Founder)
- **Do NOT** publish T006 fake QA draft, alter legitimate ISRO facts, change an actual public article without real editorial justification, or force test transitions by SQL.
- A future genuine factual correction on an actual real Article via Founder-only live Admin, with immutable PURL/share, audit records and reversible unpublish/re-publish, can supply missing current E4 **when a legitimate editorial event occurs**. It needs Founder authorization and direct Android proof; do not fabricate the event.
- Without that genuine current E4, current-point E8 full DB+Storage+Auth+Edge+Vercel restore/rollback, T080 real interrupted ACK replay acceptance and original protected release signoff, **B12 Final PASS+LOCK=HOLD**, B13 Formal Final Closure HOLD. Retain historical signed individual passes and record actual DUE/NOT_RUN honestly.
- This is **no-cost non-destructive progress**: no production writes, new infrastructure, manual user login, B2 consumption or Vercel cutover. **No optional Founder action at this exact history-read-only checkpoint; formal E4 closure inevitably requires Founder editorial participation**.
