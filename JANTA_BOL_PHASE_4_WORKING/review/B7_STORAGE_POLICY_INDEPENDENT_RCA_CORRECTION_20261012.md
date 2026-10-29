# JANTA BOL B7 — Storage RLS Independent RCA Correction

**Date:** 12 October 2026 · **Status:** source-analysis correction confirmed, security evidence remains under staged review · **Production mutation:** NONE

## 1. The original incident theory was incorrect

On 10 October an assessment of `storage.objects` described `b5_private_gateway_only` as a **PERMISSIVE** policy allowing `anon,authenticated` all CRUD outside `grievance-private`. That conclusion examined the `cmd/roles/qual` predicate **without independently inspecting** its policy **permissiveness**.

Independent **read-only Supabase** SQL now confirms:
- `pg_policy.polpermissive = false` for exact `storage.objects.b5_private_gateway_only`, matching `pg_policies.permissive = 'RESTRICTIVE'`.
- Existing `owner_manage_public_media` and `owner_manage_private_editorial` are **PERMISSIVE** policies with an explicit `private.current_owner_aal2()` gate.
- Existing `storage.objects` has RLS enabled and contains no public permissive `anon` SQL SELECT/INSERT/UPDATE/DELETE policies in the reviewed snapshot.
- Policy predicate `bucket_id <> 'grievance-private'` is a **restrictive AND gate**, not an anonymous GRANT. Restrictive policies can only reduce access granted by other permissive policies, not open it.

**Correction:** The previous statement that this specific LIVE policy granted anonymous private-editorial CRUD was **not supported and is withdrawn**. The earlier synthetic test configured `b5_private_gateway_only AS PERMISSIVE`, unlike LIVE. It proved a *hypothetical* fault, not the deployed state. We cannot infer from this correction whether other historical incidents occurred or all API endpoints are secure.

## 2. Critical minimum-safe-change to the unshipped candidate

The prior **review-only** `db/20261010_b7_storage_rls_critical_REVIEW_ONLY.sql` would have **dropped a currently RESTRICTIVE B5 policy** and added an anonymous SELECT rule. It was never deployed. This is now **neutralized**: the same path is a **zero-DDL, read-only authority check with ROLLBACK**. It explicitly requires `permissive='RESTRICTIVE'`, expected bucket types, the existing Owner AAL2 policies, and rejects unreviewed additional policies. It DOES NOT drop B5, grant anonymous access, or change production.

**Do not deploy the old policy-drop SQL from previous commits.** Do not describe this correction as a live deployed fix.

## 3. Independent actual-vs-counterfactual negative test

The isolated `ci/phase4/b7-storage-rls-fixture.sql` now models B5 **AS RESTRICTIVE**, matching inspected LIVE `polpermissive=false`.

`ci/phase4/b7-storage-rls-before-regression.sql`:
1. Requires `pg_policies.permissive='RESTRICTIVE'` and validates anon **ZERO SQL rows** and denial of INSERT/UPDATE.
2. Creates a *counterfactual* PERMISSIVE policy inside a separately **ROLLED BACK** transaction and demonstrates why the original synthetic test reported a false-positive relative to production.
3. Does not claim the Storage CDN public-bucket HTTP route equals direct `storage.objects` SQL SELECT.

`ci/phase4/b7-storage-rls-after-regression.sql`:
- Confirms the original B5 **RESTRICTIVE** policy remains active; no new broad or public-anon SQL policy.
- Anonymous and AAL1 non-owner roles are denied editorial read/media writes.
- Simulated Owner/AAL2 still reads original private-editorial and performs public-media News upload/update/delete.
- Owner cannot bypass the restrictive B5 grievance bucket through these policies.

All tests run in disposable PostgreSQL 17. No LIVE objects, ACLs or policies are mutated.

## 4. Remaining genuinely due evidence

Host-like anonymous and authenticated-client Storage API checks, public-media browser/CDN read, actual Owner AAL2 Android uploads, Grievance B5 gateway integration, signed URL lifecycle, permission revocations, and independent security review require separate proof. A SQL policy statement alone does not prove the full Storage API/CDN path. Production sensitive DDL remains prohibited without Founder approval.

**P4-T041 IN PROGRESS; P4-T042 IN PROGRESS; B7 final PASS+LOCK 0/9; Final ZIP BLOCKED.**

**NO FAKE SECURITY INCIDENT · NO FAKE PASS · NEVER WEAKEN THE EXISTING B5 GUARD.**
