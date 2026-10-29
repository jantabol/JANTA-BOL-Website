\set ON_ERROR_STOP on
begin;
insert into storage.objects(id,bucket_id,name)
values(201,'jb-ad-clean-public',
 'creative/22222222-2222-4222-8222-222222222222/'||
 '44444444-4444-4444-8444-444444444444/'||repeat('a',64)||'.png');
do $initial$
begin
 if (select count(*) from pg_policies where schemaname='storage'
  and tablename='objects' and policyname in(
  'b5_private_gateway_only','b7_private_stage_server_only',
  'b7_video_stage_server_only') and permissive='RESTRICTIVE')<>3
 then raise exception 'B5_OR_B7_OLD_RESTRICTIVE_GRANTS_CHANGED';end if;
 raise notice 'PASS [ADS-011] old private B5, photo/video quarantine preserved';
end $initial$;
set local role anon;
do $anonymous$
declare msg text;
begin
 begin
  insert into storage.objects(id,bucket_id,name)
  values(202,'jb-ad-clean-public','creative/forged.png');
  raise exception 'ANON_WRITES_PUBLIC_CLEAN_BUCKET';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg not like '%row-level security%' and msg not like '%permission denied%'
  then raise exception 'PUBLIC_CLEAN_ANON_WRITE_PROTECTION_FAILED: %',msg;end if;
 end;
 raise notice 'PASS [ADS-011] anon cannot forge clean media regardless of PUBLIC bucket';
end $anonymous$;
reset role;
select set_config('b7.test_owner','enabled',false);
set local role authenticated;
do $owner$
declare n integer;msg text;
begin
 select count(*) into n from storage.objects where bucket_id in(
  'private-editorial','public-media');
 if n<>2 then raise exception 'B5_EDITORIAL_STICKY_ACCESS_BROKEN';end if;
 begin
  insert into storage.objects(id,bucket_id,name)
  values(203,'jb-ad-clean-public','creative/owner-forged.mp4');
  raise exception 'OWNER_DIRECT_CLEAN_UPLOAD_ALLOWED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg not like '%row-level security%' and msg not like '%permission denied%'
  then raise exception 'OWNER_BROWSER_WROTE_CLEAN_PUBLIC: %',msg;end if;
 end;
 raise notice 'PASS [ADS-009] Owner JWT cannot directly publish unscanned media to clean public bucket';
end $owner$;
reset role;
-- Test hypothetical accidental future ALLOW-ALL policy in disposable
-- transaction only; RESTRICTIVE always denies direct client writes.
create policy b7_ci_clean_accidental_allow on storage.objects
 as permissive for all to authenticated using(true) with check(true);
set local role authenticated;
do $hardened$
declare msg text;
begin
 begin
  insert into storage.objects(id,bucket_id,name)
  values(204,'jb-ad-clean-public','creative/danger.mp4');
  raise exception 'RESTRICTIVE_WAS_BYPASSED_BY_PERMISSIVE';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg not like '%row-level security%' and msg not like '%permission denied%'
  then raise exception 'RESTRICTIVE_PUBLIC_INSERT_DENIAL_UNEXPECTED: %',msg;end if;
 end;
 begin
  update storage.objects set name='tampered.mp4'
   where id=201;
  if found then raise exception 'OWNER_PUBLIC_MEDIA_REPLACED';end if;
 end;
 begin
  delete from storage.objects where id=201;
  if found then raise exception 'OWNER_DELETED_CLEAN_PUBLIC';end if;
 end;
 raise notice 'PASS [ADS-056] hypothetical broad PERMISSIVE cannot alter immutable clean public files';
end $hardened$;
reset role;
rollback;
