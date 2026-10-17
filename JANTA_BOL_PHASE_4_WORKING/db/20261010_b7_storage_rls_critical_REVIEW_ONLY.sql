-- JANTA BOL / P4-T041 / ADS-054/056 — POLICY AUTHORITY CORRECTION
-- REVIEW-ONLY SECURITY AUDIT, NOT A DEPLOYABLE MIGRATION. NEVER drop B5.
--
-- INDEPENDENT RCA (2026-10-12): original 2026-10-10 investigation mistakenly
-- classified b5_private_gateway_only as PERMISSIVE by looking only at
-- pg_policies.qual, roles and ALL command, while missing
-- pg_policies.permissive and pg_policy.polpermissive.
--
-- Exact current LIVE read-only check: polpermissive=false, i.e. RESTRICTIVE.
-- A restrictive policy is ANDed with the applicable PERMISSIVE policy.
-- It DOES NOT itself authorize anonymous CRUD. Other actual permissive
-- policies grant media access only to existing Owner/AAL2. For anonymous
-- storage.objects there is NO applicable permissive policy at all.
--
-- IMPORTANT: The former candidate that DROPPED this restrictive policy
-- was NOT deployed; deploying it would remove a B5 grievance guard. This
-- replacement purposefully performs ZERO DDL/DML and uses ROLLBACK.
-- Public-media HTTP bucket serving must be assessed separately from the
-- anon role's direct SQL SELECT under storage.objects RLS.
begin;
do $exact_storage_policy_authority$
declare p record;
begin
 if to_regclass('storage.objects') is null
   or to_regclass('storage.buckets') is null
 then raise exception 'B7_STORAGE_TOPOLOGY_UNKNOWN';end if;
 if not exists(select 1 from storage.buckets
    where id='grievance-private' and public=false)
    or not exists(select 1 from storage.buckets
    where id='private-editorial' and public=false)
    or not exists(select 1 from storage.buckets
    where id='public-media' and public=true)
 then raise exception 'B7_STORAGE_BUCKETS_CHANGED_STOP_FOR_RCA';end if;

 select permissive,cmd,roles,qual,with_check into p
 from pg_policies
 where schemaname='storage' and tablename='objects'
   and policyname='b5_private_gateway_only';
 if not found or p.permissive<>'RESTRICTIVE' or p.cmd<>'ALL'
   or not (p.roles @> ARRAY['anon'::name,'authenticated'::name])
   or p.qual not like '%bucket_id <>%grievance-private%'
   or p.with_check not like '%bucket_id <>%grievance-private%'
 then raise exception 'B7_B5_RESTRICTIVE_GUARD_CHANGED_STOP_FOR_RCA';end if;

 if not exists(select 1 from pg_policies
  where schemaname='storage' and tablename='objects'
    and policyname='owner_manage_private_editorial'
    and permissive='PERMISSIVE' and cmd='ALL'
    and qual like '%current_owner_aal2%'
    and with_check like '%current_owner_aal2%')
   or not exists(select 1 from pg_policies
  where schemaname='storage' and tablename='objects'
    and policyname='owner_manage_public_media'
    and permissive='PERMISSIVE' and cmd='ALL'
    and qual like '%current_owner_aal2%'
    and with_check like '%current_owner_aal2%')
 then raise exception 'B7_OWNER_MEDIA_AUTHORITY_CHANGED_STOP_FOR_RCA';end if;

 if exists(select 1 from pg_policies
  where schemaname='storage' and tablename='objects'
    and policyname not in (
      'b5_private_gateway_only','owner_manage_private_editorial',
      'owner_manage_public_media','owner_read_private_editorial'))
 then raise exception 'B7_NEW_STORAGE_POLICY_REQUIRES_INDEPENDENT_RCA';end if;

 raise notice 'B7 ADS-054/056: b5_private_gateway_only IS RESTRICTIVE — preserve it; no migration, no verified anon private-editorial exposure';
end $exact_storage_policy_authority$;
rollback;
-- Review evidence only, not an authorized production incident resolution.
-- Any independent confirmed access fault requires its OWN evidence, scoped
-- policy RCA, staged proof and Founder production approval.
