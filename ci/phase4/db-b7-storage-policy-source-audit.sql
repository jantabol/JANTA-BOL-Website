\set ON_ERROR_STOP on
-- JANTA BOL B7 ADS-054/056: actual hosted Supabase read-only policy
-- classification. No Storage objects are opened. No DDL/DML/GRANT/UPDATE.
-- This is NOT an HTTP signed-URL/Owner Android E3 or E5 test.
begin transaction read only;
do $actual_policy$
declare b5 record; media record; editorial record;
begin
 if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='storage' and c.relname='objects'
      and c.relrowsecurity=true)
 then raise exception 'B7_STORAGE_RLS_DISABLED_OR_UNKNOWN';end if;
 if not exists(select 1 from storage.buckets
    where id='grievance-private' and public=false)
   or not exists(select 1 from storage.buckets
    where id='private-editorial' and public=false)
   or not exists(select 1 from storage.buckets
    where id='public-media' and public=true)
 then raise exception 'B7_STORAGE_BUCKET_TOPOLOGY_CHANGED';end if;

 select * into b5 from pg_policies where schemaname='storage'
   and tablename='objects' and policyname='b5_private_gateway_only';
 if not found or b5.permissive<>'RESTRICTIVE' or b5.cmd<>'ALL'
  or not (b5.roles @> ARRAY['anon'::name,'authenticated'::name])
  or b5.qual not like '%bucket_id <>%grievance-private%'
  or b5.with_check not like '%bucket_id <>%grievance-private%'
 then raise exception 'B7_B5_GUARD_CLASSIFICATION_CHANGED_REVIEW_REQUIRED';end if;

 select * into media from pg_policies where schemaname='storage'
   and tablename='objects' and policyname='owner_manage_public_media';
 select * into editorial from pg_policies where schemaname='storage'
   and tablename='objects' and policyname='owner_manage_private_editorial';
 if media.policyname is null or editorial.policyname is null
   or media.permissive<>'PERMISSIVE' or editorial.permissive<>'PERMISSIVE'
   or media.qual not like '%current_owner_aal2%'
   or editorial.qual not like '%current_owner_aal2%'
   or media.with_check not like '%current_owner_aal2%'
   or editorial.with_check not like '%current_owner_aal2%'
 then raise exception 'B7_EXISTING_OWNER_MEDIA_AUTHORITY_CHANGED';end if;
 if exists(select 1 from pg_policies
   where schemaname='storage' and tablename='objects'
     and policyname not in(
      'b5_private_gateway_only',
      'owner_manage_public_media',
      'owner_manage_private_editorial',
      'owner_read_private_editorial'))
 then raise exception 'B7_UNREVIEWED_STORAGE_POLICY_DETECTED';end if;

 if exists(select 1 from pg_policies
   where schemaname='storage' and tablename='objects'
     and permissive='PERMISSIVE' and roles @> ARRAY['anon'::name]
     and cmd in('ALL','INSERT','UPDATE','DELETE'))
 then raise exception 'B7_POTENTIAL_ANONYMOUS_STORAGE_WRITE_GRANT';end if;

 raise notice 'PASS [B7 ADS-054/056 HOSTED SOURCE] B5 is RESTRICTIVE (not anonymous grant), Owner AAL2 grants intact, no anon permissive storage writes; no Production changes';
end $actual_policy$;

-- REAL hosted database negative access with no object name/content retrieval.
-- Counts only; Storage HTTP public buckets and signed URL access are outside
-- SQL role checks. These commands run under READ ONLY transaction.
set local role anon;
do $anonymous_role_negative$
declare v_count bigint;
begin
 select count(*) into v_count from storage.objects;
 if v_count<>0 then
  raise exception 'B7_HOSTED_ANON_STORAGE_SQL_OBJECTS_VISIBLE';end if;
 raise notice 'PASS [B7 ADS-054 LIVE ROLE] anonymous SQL count=0 under real restrictive/permissive policy combination';
end $anonymous_role_negative$;
reset role;

set local role authenticated;
do $aal1_role_negative$
declare v_count bigint;
begin
 -- This connection has no user JWT/AAL2 claim. Requiring authentication
 -- role alone must NOT unlock editorial or advertiser media.
 select count(*) into v_count from storage.objects
  where bucket_id='private-editorial';
 if v_count<>0 then
  raise exception 'B7_HOSTED_AAL1_PRIVATE_EDITORIAL_SQL_VISIBLE';end if;
 raise notice 'PASS [B7 ADS-054 LIVE ROLE] authenticated without Owner AAL2 cannot see editorial Storage rows';
end $aal1_role_negative$;
reset role;
rollback;
