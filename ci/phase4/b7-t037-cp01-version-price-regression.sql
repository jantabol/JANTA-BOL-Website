\set ON_ERROR_STOP on
-- P4-T037 ADS024/027; real disposable PG17 only, never staging/prod.
begin;
do $same_contract$
begin
 if not exists(select 1 from pg_trigger where tgrelid=
 'public.ad_package_versions'::regclass
 and tgname='b7_package_version_append_only_guard'
 and tgenabled='O')
 then raise exception 'VERSION_IMMUTABILITY_TRIGGER_MISSING';end if;
 if has_table_privilege('anon','public.ad_package_versions','UPDATE')
 or has_table_privilege('authenticated','public.ad_package_versions','UPDATE')
 then raise exception 'PACKAGE_VERSION_DIRECT_PERMISSION_LEAK_IN_FIXTURE';end if;
end $same_contract$;
do $reject_zero$
declare msg text; old_count bigint;
begin
 select count(*) into old_count from public.ad_packages;
 begin
  insert into public.ad_packages(name,price_minor,placement,weight,duration_days)
  values('Zero price forbidden',0,'article',1,10);
  raise exception 'ZERO_PACKAGE_ACCEPTED';
 exception when check_violation then null;
 end;
 if (select count(*) from public.ad_packages)<>old_count
 then raise exception 'ZERO_ATTEMPT_CREATED_PACKAGE';end if;
 begin
  update public.ad_packages set price_minor=0 where
  id='20000000-0000-0000-0000-000000000002';
  raise exception 'OLD_PACKAGE_PRICE_ZERO_ACCEPTED';
 exception when check_violation then null;
 end;
 begin
  insert into public.ad_package_versions(package_id,version,name,
   placement,price_minor,duration_days,weight)
  values('20000000-0000-0000-0000-000000000002',3,
    'Bad zero version','article',0,10,1);
  raise exception 'VERSION_ZERO_ACCEPTED';
 exception when check_violation then null;
 end;
 raise notice 'T037 CP01 PASS zero package and version price denied at database';
end $reject_zero$;
do $immutable_old$
declare pkg uuid:='20000000-0000-0000-0000-000000000002';
 msg text;old_amount bigint;old_version_count integer;
begin
 select price_minor into old_amount from public.ad_package_versions
 where package_id=pkg and version=1;
 select count(*) into old_version_count from public.ad_package_versions
 where package_id=pkg;
 update public.ad_packages set price_minor=70000 where id=pkg;
 insert into public.ad_package_versions(
 package_id,version,name,placement,price_minor,duration_days,weight
 ) values(pkg,2,'New version','article',70000,7,1);
 if (select price_minor from public.ad_package_versions where
  package_id=pkg and version=1)<>old_amount
 or (select price_minor from public.ad_package_versions where
  package_id=pkg and version=2)<>70000
 then raise exception 'NEW_PRICE_OVERWROTE_FROZEN_OLD_VERSION';end if;
 begin
  update public.ad_package_versions set price_minor=1 where
  package_id=pkg and version=1;
  raise exception 'OLD_PACKAGE_VERSION_OVERWRITTEN';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_PACKAGE_VERSION_IMMUTABLE' then raise exception 'UPDATE_WRONG_DENIAL %',msg;end if;
 end;
 begin
  delete from public.ad_package_versions where package_id=pkg and version=1;
  raise exception 'OLD_PACKAGE_VERSION_DELETED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_PACKAGE_VERSION_IMMUTABLE' then raise exception 'DELETE_WRONG_DENIAL %',msg;end if;
 end;
 if (select count(*) from public.ad_package_versions where package_id=pkg)
 <>old_version_count+1 then raise exception 'FAILED_WRITE_MODIFIED_VERSIONS';end if;
 raise notice 'T037 CP01 PASS old version immutable after newer price, no delete/edit';
end $immutable_old$;
rollback;
