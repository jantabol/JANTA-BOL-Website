# JANTA BOL — Phase-4 B11 — T069 safer access (no NEW service_role in GitHub) security investigation
**October 24, 2026 IST.** Founder request: verify whether the new `JB_B11_SERVICE_ROLE_KEY` is actually necessary before adding it, keeping old systems/RLS and free-tier unchanged.

## Independent read-only live discovery
Project `vrffsnkycvjithwtiylt` only. Exact four existing `storage.objects` policies (source: connected Supabase `pg_policies`):
- `b5_private_gateway_only` is **RESTRICTIVE / ALL / anon+authenticated** and has `bucket_id <> 'grievance-private'`. All ordinary anon/authenticated user-token direct Storage calls, including `storage.object.list` and `storage.object.get_authenticated`, are deliberately BLOCKED for grievance-private regardless of any new permissive SELECT grant. **DO NOT disable, weaken, or override this hard lock**.
- `owner_manage_private_editorial` and `owner_read_private_editorial` only permit `private-editorial` with `private.current_owner_aal2()`; `owner_manage_public_media` likewise AAL2-bound. Session must be verified and short-lived; a user JWT is not a substitute for service_role when existing deny applies.
- Bucket metadata at observation: `grievance-private` PRIVATE **2 objects**, both `owner_id NULL`; `private-editorial` PRIVATE **1 object**, owner_id NULL; `public-media` PUBLIC **2 objects**. All five objects ≈5 MB *metadata sizes*, not bytes restored.

## Official Supabase docs checked
- Storage private objects are read through an authenticated user's token and controlled by RLS. `storage.allow_any_operation(['object.list','storage.object.get_authenticated'])` can scope SELECT *if* allowed by other restrictions; it cannot override a RESTRICTIVE deny.
- Supabase S3 access keys Bypass RLS and allow full bucket operations, so S3 service access keys are **not** a safer read-only alternative.
- Supabase S3 Session Token uses the User JWT and **respects RLS**, so it will similarly fail on the locked grievance-private policy.
- Custom JWT roles require signing credentials and changing policies, so not a risk-free solution.
References: https://supabase.com/docs/guides/storage/schema/helper-functions ; https://supabase.com/docs/guides/storage/security/access-control ; https://supabase.com/docs/guides/storage/s3/authentication .

## Pre-existing protected gateway check
Currently deployed `jb-grievance-assets` Edge Function version 3, `verify_jwt=true`, has `view`, `download`, `export` for individual `grievance_id` + `evidence_id` passed through original RPC authorization. Its existing server-side service key is used internally behind Founder/claim checks and is NOT exposed to caller. The existing function **does not** provide a bulk all-buckets backup API and MUST NOT be treated as one. Existing B5 locked private gateway must not be modified without separate review.

## Answer: is a NEW JB_B11_SERVICE_ROLE_KEY necessary?
- **For the exact current GH workflow `b11-storage-media-MANUAL.yml`: YES** it requests `secrets.JB_B11_SERVICE_ROLE_KEY` to perform Service Role Storage list/download across all 3 buckets; current GH screenshot has only five existing backup secrets and does not have this sixth secret, so manual run will FAIL CLOSED before any export. A NEW Supabase service_role *credential* is not technically mandatory if reusing an existing secret, but *copying* broad RLS-bypassing authority into GitHub increases exposure.
- **For the engineering goal (encrypted media backup): NOT necessarily**. Preferred future design is a **narrow Founder AAL2-authorized server-side gateway** with existing runtime service-role retained in Supabase only, returns a minimal one-time enumerated/media export for the 3 exact buckets and only on separate single-use approval. This requires new dedicated code, real Founder/device authorisation and security negative tests, can be designed on isolated branch without modifying locked B5 path. It is **NOT IMPLEMENTED or production-approved** as of this audit.
- A pure direct-storage user's JWT solution **cannot** export all original grievance objects under current locked RLS; do not weaken `b5_private_gateway_only`. Manual export via existing per-file grievance gateway might be possible using Founder verified AAL2 and original evidence IDs but is not automatic and not yet tested as a full 5-object backup.

## Recommendations & statuses
1. **DO NOT ADD** `JB_B11_SERVICE_ROLE_KEY` now, nor manually run the media workflow. Keep old five secrets and both environment restrictions unchanged.
2. Favor dedicated least-privilege *verified Founder-authenticated gateway* as a separately scoped design/test, with B2 credentials held in protected server-side runtime or one-use capability. Must pass full privacy, replay, JWT substitution, missing-object, content hash, output limit and exact bucket negative tests before any main merge or Edge deploy.
3. Reuse Oct21 real encrypted DB B2-to-PG17 restore proof. Backup-monitor synthetic checks already GREEN but a real source health policy/recurring checks require Founder timing decision.
4. Original T069 **FINAL PASS+LOCK = HOLD**. No real all-five media backup or independent original-byte recovery has been verified; code/CI pass is not equivalent.
5. No production DB, Auth, Storage, Edge Function, B2, RLS or Github Secret changed in this audit. Cricket/Saarthi strictly untouched.
