\set ON_ERROR_STOP on
-- Disposable 17 fixture; dual private stage buckets and B5 must coexist.
begin;
insert into storage.objects(id,bucket_id,name)
 values(88,'jb-ad-originals-private','synthetic-private-source.png'),
       (89,'jb-ad-previews-private','synthetic-private-clean.png');
do $start$
begin
 if (select count(*) from storage.buckets where id in
  ('jb-ad-originals-private','jb-ad-previews-private') and public=false
   and file_size_limit=8388608)<>2
 then raise exception 'B7_PRIVATE_BUCKETS_NOT_PRIVATE';end if;
 if (select count(*) from pg_policies where schemaname='storage'
  and tablename='objects' and policyname in
  ('b5_private_gateway_only','b7_private_stage_server_only')
  and permissive='RESTRICTIVE')<>2
 then raise exception 'B5_OR_B7_RESTRICTIVE_NOT_PRESERVED';end if;
 raise notice 'PASS [ADS-015/056] two private B7 buckets and original B5 RESTRICTIVE preserved';
end $start$;
set local role anon;
do $anonymous$
declare n int;msg text;
begin
 select count(*) into n from storage.objects where bucket_id like 'jb-ad-%';
 if n<>0 then raise exception 'ANON_CAN_READ_PRIVATE_B7_STORAGE';end if;
 begin
  insert into storage.objects(id,bucket_id,name)
   values(90,'jb-ad-previews-private','anon-forged.png');
  raise exception 'ANON_INSERTED_B7_MEDIA';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg not like '%row-level security%' and msg not like '%permission denied%'
  then raise exception 'ANON_B7_WRITE_DENIAL_UNEXPECTED: %',msg;end if;
 end;
 raise notice 'PASS [ADS-015] anon cannot read/write B7 staged originals or clean previews';
end $anonymous$;
reset role;
select set_config('b7.test_owner','enabled',false);
set local role authenticated;
do $owner$
declare n int;msg text;
begin
 select count(*) into n from storage.objects where bucket_id in('private-editorial','public-media');
 if n<>2 then raise exception 'ORIGINAL_B5_OR_OWNER_MEDIA_READ_BROKEN';end if;
 select count(*) into n from storage.objects where bucket_id like 'jb-ad-%';
 if n<>0 then raise exception 'EVEN_OWNER_DIRECT_B7_BUCKET_READ_EXPOSED';end if;
 begin
  insert into storage.objects(id,bucket_id,name)
    values(91,'jb-ad-originals-private','owner-forged-source.png');
  raise exception 'OWNER_DIRECT_PRIVATE_BUCKET_INSERTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg not like '%row-level security%' and msg not like '%permission denied%'
  then raise exception 'OWNER_B7_WRITE_DENIAL_UNEXPECTED: %',msg;end if;
 end;
 raise notice 'PASS [ADS-015] authenticated Owner keeps existing editorial/public-media access but cannot directly manipulate B7 private';
end $owner$;
reset role;
-- COUNTERFACTUAL rollback-only threat: even a new faulty PERMISSIVE policy
-- must not circumvent B7 restrictive gate (and must not alter B5).
create policy b7_ci_accidental_broad_grant on storage.objects
 as permissive for all to authenticated using(true) with check(true);
set local role authenticated;
do $broad$
declare n int;
begin
 select count(*) into n from storage.objects where bucket_id like 'jb-ad-%';
 if n<>0 then raise exception 'BROAD_PERMISSIVE_BYPASSED_B7_RESTRICTIVE';end if;
 raise notice 'PASS [ADS-056] hypothetical future broad permissive policy still cannot read B7 private thanks to restrictive AND gate';
end $broad$;
reset role;
rollback;
