-- JANTA BOL / ADS-015 + ADS-054/056 — CRITICAL REVIEW ONLY
-- WARNING: LIVE Supabase read-only review (2026-10-10) found permissive
-- storage.objects policy "b5_private_gateway_only": ALL for anon/authenticated
-- with bucket_id <> 'grievance-private'. Combined with table CRUD grants,
-- this appears to allow OTHER private-editorial objects to be read/altered
-- regardless of the Owner-only permissive policies. OR-based RLS is not
-- a deny override. This patch has NOT been run against Production.
--
-- Minimum-safe-change: remove ONLY that mistaken broad policy, keep the
-- existing Owner AAL2 management policies intact, add SELECT-only public
-- visibility for explicitly public-media. Fail closed if live policies or
-- bucket topology changed; never invent a new Storage bucket.
begin;
do $verified_policy_snapshot$
declare broad record;owner_public record;owner_private record;
begin
 if to_regclass('storage.objects') is null
   or to_regclass('storage.buckets') is null then
  raise exception 'B7_STORAGE_OBJECTS_SCHEMA_NOT_FOUND';end if;
 if not exists(select 1 from storage.buckets
   where id='grievance-private' and public=false)
   or not exists(select 1 from storage.buckets
   where id='private-editorial' and public=false)
   or not exists(select 1 from storage.buckets
   where id='public-media' and public=true)
 then raise exception 'B7_STORAGE_BUCKET_TOPOLOGY_CHANGED';end if;
 -- A new unreviewed policy can introduce an OR bypass. Stop for independent
 -- RCA instead of claiming this migration solved a new different policy.
 if exists(select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname not in(
        'b5_private_gateway_only',
        'owner_manage_private_editorial',
        'owner_manage_public_media',
        'owner_read_private_editorial')
 ) then raise exception 'B7_STORAGE_UNKNOWN_POLICY_REVIEW_REQUIRED';end if;
 select * into broad from pg_policies
  where schemaname='storage' and tablename='objects'
    and policyname='b5_private_gateway_only';
 if not found
    or broad.cmd<>'ALL'
    or not (broad.roles @> ARRAY['anon'::name,'authenticated'::name])
    or broad.qual not like '%bucket_id <>%grievance-private%'
    or broad.with_check not like '%bucket_id <>%grievance-private%'
 then raise exception 'B7_STORAGE_BROAD_POLICY_NOT_EXACT_REVIEWED_SOURCE';end if;
 select * into owner_public from pg_policies
  where schemaname='storage' and tablename='objects'
    and policyname='owner_manage_public_media';
 select * into owner_private from pg_policies
  where schemaname='storage' and tablename='objects'
    and policyname='owner_manage_private_editorial';
 if owner_public.policyname is null or owner_private.policyname is null
    or owner_public.cmd<>'ALL' or owner_private.cmd<>'ALL'
    or owner_public.qual not like '%current_owner_aal2%'
    or owner_private.qual not like '%current_owner_aal2%'
    or owner_public.with_check not like '%current_owner_aal2%'
    or owner_private.with_check not like '%current_owner_aal2%'
 then raise exception 'B7_EXISTING_OWNER_MEDIA_POLICY_INTEGRITY_FAILED';end if;
end $verified_policy_snapshot$;

-- This broad permissive policy was not an explicit DENY for B5:
-- for any object outside the grievance bucket it GRANTED all actions.
drop policy b5_private_gateway_only on storage.objects;

-- Public-media is already a public-read bucket for news. Keep reading
-- exactly this one public bucket, not private-editorial or grievance.
-- Upload/update/delete continue under EXISTING Founder AAL2 policies.
create policy b7_public_media_readonly on storage.objects
 for select to anon,authenticated
 using(bucket_id='public-media');

-- Reviewer proof: no broadly permissive writes or other-bucket reads.
do $after$
begin
 if exists(select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='b5_private_gateway_only')
 then raise exception 'B7_UNSAFE_STORAGE_POLICY_STILL_INSTALLED';end if;
 if not exists(select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='b7_public_media_readonly'
      and cmd='SELECT'
      and qual like '%public-media%'
      and (with_check is null))
 then raise exception 'B7_PUBLIC_MEDIA_READ_ONLY_POLICY_NOT_PRESENT';end if;
end $after$;
commit;

-- RELEASE HOLD: re-check storage.objects GRANT+RLS, actual restricted user
-- profile/read/write on staging, old editor uploads, Grievance evidence,
-- signed URL revocation/window, hosted restore/rollback and Owner AAL2.
-- Do NOT mark incident resolved or deploy unapproved to Production.
