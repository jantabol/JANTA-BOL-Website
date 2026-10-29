\set ON_ERROR_STOP on
-- Independent RCA: verify actual RESTRICTIVE LIVE topology in disposable PG.
-- Distinguish a restrictive gate (AND) from a hypothetical permissive grant
-- (OR) without touching production. Never call the latter a LIVE exploit.
begin;
do $metadata$
begin
 if not exists(select 1 from pg_policies where
  schemaname='storage' and tablename='objects'
   and policyname='b5_private_gateway_only'
   and permissive='RESTRICTIVE' and cmd='ALL')
 then raise exception 'EXACT_LIVE_B5_RESTRICTIVE_FIXTURE_NOT_MATCHED';end if;
 raise notice 'PASS [ADS-056 RCA] B5 policy polpermissive=false is a restrictive guard, not a public grant';
end $metadata$;
set local role anon;
do $real_restrictive$
declare v_count integer;v_rows integer;msg text;
begin
 select count(*) into v_count from storage.objects;
 if v_count<>0 then
  raise exception 'RESTRICTIVE_LIVE_SHAPE_EXPOSES_ANON_STORAGE_OBJECTS: %',v_count;end if;
 update storage.objects set contents='UNAUTHORIZED' where bucket_id='private-editorial';
 get diagnostics v_rows=row_count;
 if v_rows<>0 then raise exception 'RESTRICTIVE_LIVE_SHAPE_ANON_UPDATE_BYPASS';end if;
 begin
  insert into storage.objects(id,bucket_id,name)
    values(14,'private-editorial','malicious-anon-object.pdf');
  raise exception 'RESTRICTIVE_LIVE_SHAPE_ANON_INSERT_BYPASS';
 exception when insufficient_privilege then null;end;
 raise notice 'PASS [ADS-056 RCA] exact RESTRICTIVE topology denies anonymous SELECT/UPDATE/INSERT of all objects; public CDN bucket HTTP is separate';
end $real_restrictive$;
reset role;
rollback;

-- Hypothetical independent counterfactual: the SAME predicate only grants
-- anonymous access if it is explicitly PERMISSIVE. This intentionally
-- installs a different policy *inside a transaction that is ROLLED BACK*.
begin;
drop policy b5_private_gateway_only on storage.objects;
create policy b5_private_gateway_only on storage.objects
 as permissive for all to anon,authenticated
 using(bucket_id <> 'grievance-private')
 with check(bucket_id <> 'grievance-private');
set local role anon;
do $hypothetical$
declare v_count integer;v_rows integer;
begin
 select count(*) into v_count from storage.objects
 where bucket_id='private-editorial';
 if v_count<>1 then raise exception 'COUNTERFACTUAL_PERMISSIVE_NOT_REPRODUCED';end if;
 update storage.objects set contents='counterfactual_only'
 where bucket_id='private-editorial';
 get diagnostics v_rows=row_count;
 if v_rows<>1 then raise exception 'COUNTERFACTUAL_WRITE_NOT_REPRODUCED';end if;
 raise notice 'PASS [ADS-056 RCA] ONLY hypothetical PERMISSIVE B5 creates broad anon OR access; original LIVE policy is RESTRICTIVE';
end $hypothetical$;
reset role;
rollback;
