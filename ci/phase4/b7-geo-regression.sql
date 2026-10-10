\set ON_ERROR_STOP on
-- B7-G3 synthetic contract / rollback. No official LGD import or Production writes.
begin;
insert into public.ad_geo_mp_districts(
 lgd_code,name_en,source_uri,source_version,source_sha256,verified,verified_at
) values
 ('101','Shivpuri','https://fixture.invalid/lgd','SYNTHETIC-20261010',repeat('a',64),true,now()),
 ('102','Gwalior','https://fixture.invalid/lgd','SYNTHETIC-20261010',repeat('b',64),true,now()),
 ('103','Guna','https://fixture.invalid/lgd','SYNTHETIC-20261010',repeat('c',64),true,now()),
 ('104','Ashoknagar','https://fixture.invalid/lgd','SYNTHETIC-20261010',repeat('d',64),false,null);
insert into public.ad_geo_mp_tehsils(
 lgd_code,district_lgd_code,name_en,source_uri,source_version,source_sha256,verified,verified_at
) values
 ('201','101','Pichhore','https://fixture.invalid/lgd','SYNTHETIC-20261010',repeat('e',64),true,now()),
 ('202','102','Gwalior Rural','https://fixture.invalid/lgd','SYNTHETIC-20261010',repeat('f',64),true,now()),
 ('203','101','Unverified fixture','https://fixture.invalid/lgd','SYNTHETIC-20261010',repeat('0',64),false,null);

do $nonowner$
declare msg text;
begin
 begin
  perform public.jb_ad_set_article_geo_internal(
   '10000000-0000-0000-0000-000000000001','tehsil','101','201','SOURCE-ARTICLE-001');
  raise exception 'NONOWNER_VERIFIED_ARTICLE';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'OWNER_AAL2_REQUIRED' then raise exception 'ARTICLE_OWNER_GUARD_FAILED: %',msg;end if;
 end;
 begin
  perform public.jb_ad_grant_area_internal(
   '20000000-0000-0000-0000-000000000001','tehsil','101','201',false,'SIGNED-TERMS-001');
  raise exception 'NONOWNER_GRANTED_AREA';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'OWNER_AAL2_REQUIRED' then raise exception 'GRANT_OWNER_GUARD_FAILED: %',msg;end if;
 end;
 if exists(select 1 from public.ad_campaign_area_grants) then
  raise exception 'UNAUTHORIZED_GRANT_WRITTEN';end if;
 raise notice 'PASS [G3/ADS-028] nonowner cannot verify Article location or change campaign area';
end $nonowner$;

select set_config('b7.test_owner','enabled',true);
select public.jb_ad_set_article_geo_internal(
 '10000000-0000-0000-0000-000000000001','tehsil','101','201','OWNER-ARTICLE-SOURCE-001');
select public.jb_ad_set_article_geo_internal(
 '10000000-0000-0000-0000-000000000002','district','101',null,'OWNER-ARTICLE-SOURCE-002');
select public.jb_ad_set_article_geo_internal(
 '10000000-0000-0000-0000-000000000003','district','102',null,'OWNER-ARTICLE-SOURCE-003');
select public.jb_ad_set_article_geo_internal(
 '10000000-0000-0000-0000-000000000004','mp_state',null,null,'OWNER-ARTICLE-SOURCE-004');
select public.jb_ad_set_article_geo_internal(
 '10000000-0000-0000-0000-000000000005','national',null,null,'OWNER-ARTICLE-SOURCE-005');

do $invalid_article$
declare msg text;
begin
 begin
  perform public.jb_ad_set_article_geo_internal(
   '10000000-0000-0000-0000-000000000007','district','101',null,'ARTICLE-DRAFT-CANNOT-VERIFY');
  raise exception 'DRAFT_ARTICLE_GEO_VERIFIED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'PUBLISHED_ARTICLE_REQUIRED'
  then raise exception 'DRAFT_REJECTION_WRONG: %',msg;end if;
 end;
 begin
  perform public.jb_ad_set_article_geo_internal(
   '10000000-0000-0000-0000-000000000008','district','101',null,'ARTICLE-DISTRICT-CONFLICT');
  raise exception 'ART_DISTRICT_SILENTLY_CHANGED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'NEWSROOM_DISTRICT_CONFLICT'
  then raise exception 'NEWS_DISTRICT_GUARD_WRONG: %',msg;end if;
 end;
 begin
  perform public.jb_ad_set_article_geo_internal(
   '10000000-0000-0000-0000-000000000003','tehsil','102','201','MISMATCHED-TEHSIL-ARTICLE');
  raise exception 'TEHSIL_PARENT_MISMATCH_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'UNVERIFIED_TEHSIL_PARENT'
  then raise exception 'TEHSIL_PARENT_GUARD_WRONG: %',msg;end if;
 end;
 begin
  perform public.jb_ad_set_article_geo_internal(
   '10000000-0000-0000-0000-000000000003','tehsil','102','203','UNVERIFIED-TEHSIL-ARTICLE');
  raise exception 'UNVERIFIED_TEHSIL_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'UNVERIFIED_TEHSIL_PARENT'
  then raise exception 'UNVERIFIED_TEHSIL_WRONG: %',msg;end if;
 end;
 begin
  perform public.jb_ad_set_article_geo_internal(
   '10000000-0000-0000-0000-000000000003','district','104',null,'UNVERIFIED-DISTRICT-ARTICLE');
  raise exception 'UNVERIFIED_DISTRICT_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'UNVERIFIED_DISTRICT_CODE'
  then raise exception 'UNVERIFIED_DISTRICT_WRONG: %',msg;end if;
 end;
 if (select ad_geo_district_lgd_code from public.articles
  where id='10000000-0000-0000-0000-000000000003')<>'102' then
  raise exception 'BAD_GEO_ATTEMPT_MUTATED_ARTICLE';end if;
 raise notice 'PASS [G3/ADS-014/028] unpublished, wrong-parent/unverified geo and newsroom conflicts denied';
end $invalid_article$;

select public.jb_ad_grant_area_internal(
 '20000000-0000-0000-0000-000000000001','tehsil','101','201',false,'OWNER-TERMS-PICHHORE');
select public.jb_ad_grant_area_internal(
 '20000000-0000-0000-0000-000000000002','district','101',null,false,'OWNER-TERMS-SHIVPURI');
select public.jb_ad_grant_area_internal(
 '20000000-0000-0000-0000-000000000003','district','102',null,false,'OWNER-TERMS-GWALIOR');
select public.jb_ad_grant_area_internal(
 '20000000-0000-0000-0000-000000000004','mp_state',null,null,false,'OWNER-TERMS-MPSTATE');
select public.jb_ad_grant_area_internal(
 '20000000-0000-0000-0000-000000000005','national',null,null,true,'OWNER-TERMS-NATIONAL-UNKNOWN');
select public.jb_ad_grant_area_internal(
 '20000000-0000-0000-0000-000000000006','district','101',null,false,'OWNER-TERMS-MULTI-1');
select public.jb_ad_grant_area_internal(
 '20000000-0000-0000-0000-000000000006','district','102',null,false,'OWNER-TERMS-MULTI-2');
select public.jb_ad_grant_area_internal(
 '20000000-0000-0000-0000-000000000008','national',null,null,false,'OWNER-TERMS-NAT-NO-UNKNOWN');

do $invalid_grants$
declare msg text;
begin
 begin
  perform public.jb_ad_grant_area_internal(
   '20000000-0000-0000-0000-000000000001','tehsil','102','201',false,'TERMS-INVALID-PARENT');
  raise exception 'BAD_PARENT_AREA_GRANTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'UNVERIFIED_TEHSIL_PARENT' then raise exception 'GRANT_PARENT_WRONG: %',msg;end if;
 end;
 begin
  perform public.jb_ad_grant_area_internal(
   '20000000-0000-0000-0000-000000000007','district','101',null,false,'TERMS-PAID-CHANGE');
  raise exception 'PAID_AREA_SILENT_CHANGE';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'PAID_OR_INVALID_AREA_CHANGE_BLOCKED' then raise exception 'PAID_GUARD_WRONG: %',msg;end if;
 end;
 begin
  perform public.jb_ad_grant_area_internal(
   '20000000-0000-0000-0000-000000000009','district','104',null,false,'TERMS-UNVERIFIED');
  raise exception 'PENDING_DISTRICT_GRANTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'UNVERIFIED_DISTRICT_CODE' then raise exception 'UNVERIFIED_GRANT_GUARD_WRONG: %',msg;end if;
 end;
 begin
  perform public.jb_ad_grant_area_internal(
   '20000000-0000-0000-0000-000000000004','mp_state',null,null,true,'TERMS-SILENT-EXPAND');
  raise exception 'STATE_UNKNOWN_BROADENED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'INVALID_AREA_SHAPE' then raise exception 'STATE_SCOPE_GUARD_WRONG: %',msg;end if;
 end;
 begin
  perform public.jb_ad_grant_area_internal(
   '20000000-0000-0000-0000-000000000002','district','101',null,false,'OWNER-TERMS-DUPLICATE');
  raise exception 'DUPLICATE_AREA_GRANTED';
 exception when unique_violation then null;
 end;
 begin
  update public.ad_campaign_area_grants
  set district_lgd_code='102'
  where campaign_id='20000000-0000-0000-0000-000000000002';
  raise exception 'SILENT_GRANT_REWRITE';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'IMMUTABLE_AD_AREA_GRANT_USE_NEW_REVIEWED_TERMS'
  then raise exception 'IMMUTABLE_AREA_FAILED: %',msg;end if;
 end;
 if (select count(*) from public.ad_campaign_area_grants)<>8 then
   raise exception 'NEGATIVE_GRANT_MUTATED_ROWS';end if;
 raise notice 'PASS [G3/ADS-028] no paid/grant rewrite, unverified or wrong-parent targeting and no duplicate';
end $invalid_grants$;

create temp table b7_geo_expect(
 article uuid,campaign uuid,eligible boolean,note text);
insert into b7_geo_expect(article,campaign,eligible,note) values
 ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',true,'Pichhore matches tehsil'),
 ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002',true,'Pichhore matches Shivpuri district ancestor'),
 ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000003',false,'Pichhore excludes Gwalior'),
 ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000004',true,'Pichhore matches MP state'),
 ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000005',true,'Pichhore matches national'),
 ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000006',true,'multi includes Shivpuri'),
 ('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001',false,'Shivpuri district-only excludes Pichhore tehsil'),
 ('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002',true,'Shivpuri district matches district'),
 ('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000003',false,'Shivpuri excludes Gwalior'),
 ('10000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001',false,'Gwalior excludes Pichhore'),
 ('10000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000002',false,'Gwalior excludes Shivpuri'),
 ('10000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000003',true,'Gwalior matches Gwalior'),
 ('10000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000004',true,'Gwalior matches MP state'),
 ('10000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000006',true,'multi includes Gwalior'),
 ('10000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000001',false,'MP state excludes local tehsil'),
 ('10000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000002',false,'MP state excludes arbitrary district'),
 ('10000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000004',true,'MP state matches MP'),
 ('10000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000005',true,'MP state matches national'),
 ('10000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000004',false,'National news excludes MP-only'),
 ('10000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000005',true,'National news matches national'),
 ('10000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000001',false,'Unknown excludes local'),
 ('10000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000004',false,'Unknown excludes MP'),
 ('10000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000005',true,'Unknown explicit national fallback'),
 ('10000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000008',false,'Unknown denies ordinary national without Owner fallback'),
 ('10000000-0000-0000-0000-000000000007','20000000-0000-0000-0000-000000000005',false,'Unpublished even national fallback denied');

do $geo_matrix$
declare rec record;actual boolean;count_test int:=0;
begin
 for rec in select * from b7_geo_expect loop
   actual:=private.b7_geo_matches_article(rec.article,rec.campaign);
   if actual is distinct from rec.eligible then
    raise exception 'ARTICLE_GEO_ELIGIBILITY_FAIL: % expected %, got %',
       rec.note,rec.eligible,actual;
   end if;
   count_test:=count_test+1;
 end loop;
 if count_test<25 then raise exception 'NEGATIVE_MATRIX_TOO_SMALL';end if;
 raise notice 'PASS [G3/ADS-014/028] % synthetic positive/negative Article-identity geo matches',count_test;
end $geo_matrix$;

-- Untrusted callers must not be permitted to invoke/alter private matcher
-- or read commercial grant sources directly.
select set_config('b7.test_owner','',true);
set local role anon;
do $anon$
declare msg text;
begin
 begin
  perform 1 from public.ad_campaign_area_grants;
  raise exception 'PUBLIC_AD_GRANTS_EXPOSED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg not like '%permission denied%' then
   raise exception 'PUBLIC_GRANTS_NOT_PRIVATE: %',msg;end if;
 end;
 begin
  perform private.b7_geo_matches_article(
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001');
  raise exception 'PUBLIC_PRIVATE_MATCHER_EXPOSED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg not like '%permission denied%' then
   raise exception 'PUBLIC_MATCHER_NOT_PRIVATE: %',msg;end if;
 end;
 raise notice 'PASS [G3] no anonymous grant-directory disclosure or private geo matcher execution';
end $anon$;
reset role;

do $intact$
begin
 if (select count(*) from public.audit_logs
     where action in ('ad_article_geo_verified','ad_area_granted'))<>13
 then raise exception 'AUDIT_WRITES_NOT_COMPLETE';end if;
 if (select count(*) from public.ad_history where event_type='ad_area_granted')<>8
 then raise exception 'GRANT_HISTORY_NOT_COMPLETE';end if;
 if (select count(*) from public.articles where ad_geo_verified_at is not null)<>5
 then raise exception 'ARTICLE_VERIFICATION_TOTAL_BAD';end if;
 raise notice 'PASS [G3] versioned source codes, audit, existing news and campaign identifiers intact';
end $intact$;
rollback;
