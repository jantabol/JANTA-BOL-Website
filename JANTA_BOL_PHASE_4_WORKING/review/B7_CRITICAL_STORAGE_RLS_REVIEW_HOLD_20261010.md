# JANTA BOL B7 — CRITICAL STORAGE POLICY RELEASE HOLD
Date: 10 October 2026
Status: **OPEN / PRODUCTION PRIVACY RISK / NOT REMEDIATED**
Policy: Security → Data Integrity → Editorial → Availability → Convenience

## Live source facts — read-only Supabase database inspection
1. `storage.objects`: RLS **enabled**; both `anon` and `authenticated` possess underlying SELECT / INSERT / UPDATE / DELETE grants.
2. Existing **permissive** `b5_private_gateway_only` policy is `ALL` for `anon,authenticated` and has `USING (bucket_id <> 'grievance-private')` plus matching WITH CHECK. Its name implies a gateway denial, but the positive `<>` condition grants broad access to every other bucket, including a **private-editorial** bucket. Other permissive Owner AAL2 policies are combined by logical OR, not used as a deny override.
3. Bucket topology: `grievance-private` private, `private-editorial` private, `public-media` public. Aggregate object counts on inspection: 2, 1, and 1 respectively. **No private object names/content inspected or included in this report.**
4. Existing legitimate permissions: `owner_manage_private_editorial` and `owner_manage_public_media` require `private.current_owner_aal2()`; `owner_read_private_editorial` also requires Owner AAL2. The accidental broad B5 policy appears to bypass these intended Owner-only boundaries.
5. Existing `JBBackend.uploadPublic()` is Owner-only and uploads to canonical `public-media`, so broad anonymous write access is NOT required for that flow. Read-only investigation did not establish whether any previous unauthorized access actually occurred. **Potential exploit surface confirmed by policy/grant configuration; actual production exploitation NOT established.**

## Independent synthetic first-divergence reproduction
- `ci/phase4/b7-storage-rls-fixture.sql` models exact policy names/role grants and three synthetic buckets in disposable PostgreSQL 17.
- `ci/phase4/b7-storage-rls-before-regression.sql`: anonymous role successfully SELECT/UPDATE/INSERT/DELETEs a **synthetic** private-editorial object under broad B5 policy. This proves the policy’s permissive OR effect, not that a real human accessed Production.
- `db/20261010_b7_storage_rls_critical_REVIEW_ONLY.sql`: fail-closed checks exact live-reviewed existing bucket topology and Owner policies; removes only `b5_private_gateway_only`; restores explicit SELECT-only `public-media` policy; preserves Owner/AAL2 media management and grievance-private denial; aborts if any unexpected policy or bucket appears.
- `ci/phase4/b7-storage-rls-after-regression.sql`: anon can still view public-media but cannot write it or see/change private-editorial/grievance; authenticated AAL1 cannot read editorial or write public-media; Owner/AAL2 can still upload/update/delete public-media and view private-editorial. No parallel media database, API, or public advertising permissions introduced.
- CI run **38071480029**, source SHA `1a3ab7e67063d3609a2bf2b1adaa334a8d325392`: new storage negative/positive job **SUCCESS** and Candidate **15/15 GREEN**; protected Phase3+4 run 38071479910 was still processing during initial source inspection. Later commits require exact new receipts.

## Required Founder/incident decision and release gates
- This is an **important Founder-level security incident decision**. DO NOT silently apply review SQL to actual Production; request explicit authorization and controlled staging/backup/rollback authorization first.
- Do a **real production read-only anonymous and AAL1 negative proof** limited to aggregate counts/denials (no private object contents); independently verify current policy snapshot immediately before deployment.
- Confirm existing Owner/AAL2 uploads, editorial privacy, B5 grievances, existing image public URLs and service-role gateway behavior; apply exactly the reviewed minimal change only after staging parity.
- Inspect signed URL lifecycle and historical storage access logs if available; RLS change does not revoke already issued signed URLs. Record whether unauthorized activity can or cannot be established; **do not claim "no leak"** without proof.
- Re-run protected CI and new storage security CI on exact deployed SHA, Android Owner upload/read and viewer media E3, archive signed E5/E7 evidence. If unexpected behavior, fail closed and restore safe Owner workflow; do NOT restore the overbroad anonymous policy as a routine rollback.
- Until actually resolved and verified: **ADS-015/054/056 BLOCKED for full proof, P4-T041 IN PROGRESS; B7 final ZIP / 9/9 PASS+LOCK blocked. No B8.**
