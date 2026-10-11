-- JANTA BOL B7 ADS-015/056: dedicated ORIGINAL+DERIVATIVE PRIVATE
-- buckets, no browser read/write, service-only worker. REVIEW ONLY.
-- Does NOT touch existing public-media/private-editorial/grievance-private
-- or original B5 RESTRICTIVE policy. No actual LIVE DDL without Founder.
begin;
do $preflight$
begin
 if to_regclass('storage.buckets') is null or
    to_regclass('storage.objects') is null
 then raise exception 'STORAGE_SCHEMA_NOT_AVAILABLE';end if;
 if not exists(select 1 from pg_policies where schemaname='storage'
   and tablename='objects' and policyname='b5_private_gateway_only'
   and permissive='RESTRICTIVE' and cmd='ALL')
 then raise exception 'ORIGINAL_B5_RESTRICTIVE_SOURCE_DRIFT';end if;
 if exists(select 1 from storage.buckets where id in
   ('jb-ad-originals-private','jb-ad-previews-private'))
 then raise exception 'B7_PRIVATE_BUCKET_ALREADY_EXISTS_INDEPENDENT_REVIEW_REQUIRED';end if;
 if exists(select 1 from pg_policies where schemaname='storage'
   and tablename='objects' and policyname='b7_private_stage_server_only')
 then raise exception 'B7_STORAGE_RESTRICTIVE_POLICY_ALREADY_EXISTS';end if;
 if not exists(select 1 from information_schema.columns
  where table_schema='storage' and table_name='buckets'
    and column_name='allowed_mime_types')
 then raise exception 'B7_STORAGE_BUCKET_COLUMN_DRIFT';end if;
end $preflight$;
insert into storage.buckets(
 id,name,public,file_size_limit,allowed_mime_types)
values
 ('jb-ad-originals-private','jb-ad-originals-private',false,8388608,
  array['image/jpeg','image/png','image/webp']::text[]),
 ('jb-ad-previews-private','jb-ad-previews-private',false,8388608,
  array['image/png']::text[]);
-- CRITICAL RESTRICTIVE/AND gate: even if future developers accidentally
-- create broad ALLOW policy for authenticated clients, it NEVER grants
-- direct GET/INSERT/UPDATE/DELETE on these two private B7 buckets.
create policy b7_private_stage_server_only on storage.objects
 as restrictive for all to anon,authenticated
 using(bucket_id not in('jb-ad-originals-private','jb-ad-previews-private'))
 with check(bucket_id not in('jb-ad-originals-private','jb-ad-previews-private'));
do $assert$
begin
 if (select count(*) from storage.buckets
  where id in('jb-ad-originals-private','jb-ad-previews-private')
   and public=false and file_size_limit=8388608)<>2
 then raise exception 'B7_QUARANTINE_BUCKET_PRIVACY_NOT_PROVED';end if;
 if not exists(select 1 from pg_policies
  where schemaname='storage' and tablename='objects'
    and policyname='b7_private_stage_server_only'
    and permissive='RESTRICTIVE' and cmd='ALL'
    and roles @> array['anon','authenticated'])
 then raise exception 'B7_STORAGE_DENY_POLICY_NOT_RESTRICTIVE';end if;
 if not exists(select 1 from pg_policies where schemaname='storage'
   and tablename='objects' and policyname='b5_private_gateway_only'
   and permissive='RESTRICTIVE')
 then raise exception 'B5_STORAGE_POLICY_CHANGED';end if;
end $assert$;
commit;
