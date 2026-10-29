\set ON_ERROR_STOP on
-- ADS-015/054/056: the reviewed migration is now a read-only authority
-- audit. Existing restrictive B5 policy and Owner AAL2 access must remain.
-- This is disposable SQL RLS, NOT a real hosted REST/Storage client test.
begin;
do $preservation$
begin
 if not exists(select 1 from pg_policies
   where schemaname='storage' and tablename='objects'
     and policyname='b5_private_gateway_only'
     and permissive='RESTRICTIVE' and cmd='ALL')
 then raise exception 'B5_RESTRICTIVE_GRIEVANCE_GUARD_REMOVED_OR_WEAKENED';end if;
 if exists(select 1 from pg_policies
   where schemaname='storage' and tablename='objects'
     and policyname='b7_public_media_readonly')
 then raise exception 'UNAUTHORIZED_ANON_PUBLIC_MEDIA_SQL_READ_ADDED';end if;
 if not exists(select 1 from pg_policies
   where schemaname='storage' and tablename='objects'
     and policyname='owner_manage_public_media'
     and permissive='PERMISSIVE')
    or not exists(select 1 from pg_policies
   where schemaname='storage' and tablename='objects'
     and policyname='owner_manage_private_editorial'
     and permissive='PERMISSIVE')
 then raise exception 'EXISTING_OWNER_MEDIA_GRANTS_DAMAGED';end if;
 raise notice 'PASS [ADS-054/056] B5 restrictive grievance barrier untouched; no new public CRUD policy';
end $preservation$;
set local role anon;
do $anon$
declare v_count integer;v_rows integer;
begin
 select count(*) into v_count from storage.objects;
 if v_count<>0 then raise exception 'ANON_SQL_OBJECT_READ_EXPOSURE';end if;
 update storage.objects set contents='malicious' where bucket_id='private-editorial';
 get diagnostics v_rows=row_count;
 if v_rows<>0 then raise exception 'ANON_PRIVATE_EDITORIAL_MODIFY_EXPOSURE';end if;
 delete from storage.objects where bucket_id='public-media';
 get diagnostics v_rows=row_count;
 if v_rows<>0 then raise exception 'ANON_NEWS_MEDIA_DELETE_EXPOSURE';end if;
 begin
  insert into storage.objects(id,bucket_id,name)
    values(40,'private-editorial','malicious-upload');
  raise exception 'ANON_PRIVATE_UPLOAD_ALLOWED';
 exception when insufficient_privilege then null;end;
 begin
  insert into storage.objects(id,bucket_id,name)
    values(41,'public-media','malicious-public-upload');
  raise exception 'ANON_PUBLIC_UPLOAD_ALLOWED';
 exception when insufficient_privilege then null;end;
 raise notice 'PASS [ADS-056] anonymous SQL role cannot read/edit private, delete News media, or upload assets';
end $anon$;
reset role;

select set_config('b7.test_owner','',true);
set local role authenticated;
do $non_owner$
declare v_count integer;v_rows integer;
begin
 select count(*) into v_count from storage.objects where bucket_id='private-editorial';
 if v_count<>0 then raise exception 'AAL1_PRIVATE_EDITORIAL_READ_ALLOWED';end if;
 update storage.objects set contents='unauthorized' where bucket_id='public-media';
 get diagnostics v_rows=row_count;
 if v_rows<>0 then raise exception 'AAL1_PUBLIC_NEWS_MEDIA_UPDATE_ALLOWED';end if;
 raise notice 'PASS [ADS-054] authenticated without AAL2 cannot read editorial or mutate News assets';
end $non_owner$;
reset role;

select set_config('b7.test_owner','enabled',true);
set local role authenticated;
do $owner$
declare v_count integer;v_rows integer;
begin
 select count(*) into v_count from storage.objects where bucket_id='private-editorial';
 if v_count<>1 then raise exception 'OWNER_PRIVATE_EDITORIAL_READ_BROKEN';end if;
 select count(*) into v_count from storage.objects where bucket_id='public-media';
 if v_count<>1 then raise exception 'OWNER_NEWS_COVER_READ_BROKEN';end if;
 select count(*) into v_count from storage.objects where bucket_id='grievance-private';
 if v_count<>0 then raise exception 'OWNER_BYPASSED_B5_GRIEVANCE_GATE';end if;
 insert into storage.objects(id,bucket_id,name)
 values(42,'public-media','founder-news-image-fixture.png');
 update storage.objects set contents='founder-approved' where id=42;
 get diagnostics v_rows=row_count;
 if v_rows<>1 then raise exception 'OWNER_NEWS_MEDIA_UPDATE_BROKEN';end if;
 delete from storage.objects where id=42;
 get diagnostics v_rows=row_count;
 if v_rows<>1 then raise exception 'OWNER_NEWS_MEDIA_DELETE_BROKEN';end if;
 raise notice 'PASS [ADS-015/054] Owner/AAL2 original News/media workflows remain intact and grievance guarded';
end $owner$;
reset role;
rollback;
