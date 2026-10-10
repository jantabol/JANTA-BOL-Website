\set ON_ERROR_STOP on
-- ADS-015/054/056 — minimum safe fix negative role matrix in disposable PG.
begin;
set local role anon;
do $after_anon$
declare v_count integer;v_rows integer;msg text;
begin
 select count(*) into v_count from storage.objects where bucket_id='public-media';
 if v_count<>1 then raise exception 'PUBLIC_NEWS_MEDIA_NOT_READABLE';end if;
 select count(*) into v_count from storage.objects where bucket_id='private-editorial';
 if v_count<>0 then raise exception 'ANON_PRIVATE_EDITORIAL_READ_STILL_OPEN';end if;
 select count(*) into v_count from storage.objects where bucket_id='grievance-private';
 if v_count<>0 then raise exception 'ANON_GRIEVANCE_READ_STILL_OPEN';end if;
 update storage.objects set contents='UNAUTHORIZED' where bucket_id='private-editorial';
 get diagnostics v_rows=row_count;
 if v_rows<>0 then raise exception 'ANON_PRIVATE_EDITORIAL_UPDATE_STILL_ALLOWED';end if;
 delete from storage.objects where bucket_id='private-editorial';
 get diagnostics v_rows=row_count;
 if v_rows<>0 then raise exception 'ANON_PRIVATE_EDITORIAL_DELETE_STILL_ALLOWED';end if;
 begin
  insert into storage.objects(id,bucket_id,name)
  values(22,'private-editorial','malicious-anonymous-write.pdf');
  raise exception 'ANON_PRIVATE_EDITORIAL_INSERT_ALLOWED';
 exception when insufficient_privilege then null;end;
 begin
  insert into storage.objects(id,bucket_id,name)
  values(23,'public-media','malicious-anonymous-public-upload.png');
  raise exception 'ANON_PUBLIC_MEDIA_UPLOAD_ALLOWED';
 exception when insufficient_privilege then null;end;
 raise notice 'PASS [ADS-056] anon can read existing public-media only; private+grievance read/write and public upload all denied';
end $after_anon$;
reset role;

select set_config('b7.test_owner','',true);
set local role authenticated;
do $after_aal1$
declare v_count integer;v_rows integer;
begin
 select count(*) into v_count from storage.objects where bucket_id='private-editorial';
 if v_count<>0 then raise exception 'AAL1_PRIVATE_EDITORIAL_READ_ALLOWED';end if;
 update storage.objects set contents='AAL1_UNAUTHORIZED' where bucket_id='public-media';
 get diagnostics v_rows=row_count;
 if v_rows<>0 then raise exception 'AAL1_PUBLIC_MEDIA_WRITE_ALLOWED';end if;
 raise notice 'PASS [ADS-054/056] AAL1 authenticated cannot read owner evidence or change newsroom media';
end $after_aal1$;
reset role;

select set_config('b7.test_owner','enabled',true);
set local role authenticated;
do $after_owner$
declare v_count integer;v_rows integer;
begin
 select count(*) into v_count from storage.objects where bucket_id='private-editorial';
 if v_count<>1 then raise exception 'OWNER_PRIVATE_EDITORIAL_ACCESS_BROKEN';end if;
 insert into storage.objects(id,bucket_id,name)
 values(24,'public-media','synthetic-approved-owner-upload.png');
 update storage.objects set contents='owner_safe_update'
 where id=24 and bucket_id='public-media';
 get diagnostics v_rows=row_count;
 if v_rows<>1 then raise exception 'OWNER_PUBLIC_UPLOAD_OR_EDIT_BROKEN';end if;
 delete from storage.objects where id=24 and bucket_id='public-media';
 get diagnostics v_rows=row_count;
 if v_rows<>1 then raise exception 'OWNER_PUBLIC_CLEANUP_BROKEN';end if;
 raise notice 'PASS [ADS-015] Owner/AAL2 existing public-media upload and private-editorial review preserved';
end $after_owner$;
reset role;

do $no_other_policy$
begin
 if exists(select 1 from pg_policies p
  where p.schemaname='storage' and p.tablename='objects'
   and p.policyname='b5_private_gateway_only')
 then raise exception 'BROAD_POLICY_REINTRODUCED';end if;
 if (select count(*) from pg_policies p
  where p.schemaname='storage' and p.tablename='objects'
   and p.policyname='b7_public_media_readonly')<>1
 then raise exception 'MISSING_EXACT_PUBLIC_READ_POLICY';end if;
 raise notice 'PASS [ADS-054/056] narrow public READ only; existing Owner policies preserved, no broad OR bypass';
end $no_other_policy$;
rollback;
