\set ON_ERROR_STOP on
-- B7 G3/G4 candidate cutover: synthetic PostgreSQL E2, NEVER production.
-- Earlier protected T035 and legacy signatures MUST keep passing unchanged.
begin;
insert into public.ad_geo_mp_districts(
 lgd_code,name_en,source_uri,source_version,source_sha256,verified,verified_at
) values
 ('101','Shivpuri','https://fixture.invalid/lgd','SYNTHETIC-20261010',repeat('a',64),true,now()),
 ('102','Gwalior','https://fixture.invalid/lgd','SYNTHETIC-20261010',repeat('b',64),true,now());

select set_config('b7.test_owner','enabled',true);
select public.jb_ad_set_article_geo_internal(
 '10000000-0000-0000-0000-000000000001',
 'district','101',null,'EDITORIAL-ARTICLE-SOURCE-001');
select public.jb_ad_set_article_geo_internal(
 '10000000-0000-0000-0000-000000000002',
 'district','102',null,'EDITORIAL-ARTICLE-SOURCE-002');

-- Package 2 (weight 2), package 1 (weight 1) and package 3 (weight 3).
select public.jb_ad_grant_area_internal(
 '30000000-0000-0000-0000-000000000001',
 'district','101',null,false,'TERMS-SHIVPURI-W2');
select public.jb_ad_grant_area_internal(
 '30000000-0000-0000-0000-000000000005',
 'district','101',null,false,'TERMS-SHIVPURI-W1');
select public.jb_ad_grant_area_internal(
 '30000000-0000-0000-0000-000000000006',
 'district','101',null,false,'TERMS-SHIVPURI-W3');
select public.jb_ad_set_approved_quote_internal(
 '30000000-0000-0000-0000-000000000001',50000,'QUOTE-CANONICAL-W2');
select public.jb_ad_set_approved_quote_internal(
 '30000000-0000-0000-0000-000000000005',50000,'QUOTE-CANONICAL-W1');
select public.jb_ad_set_approved_quote_internal(
 '30000000-0000-0000-0000-000000000006',50000,'QUOTE-CANONICAL-W3');
select public.jb_ad_confirm_manual_payment_internal(
 '30000000-0000-0000-0000-000000000001',
 'SYNTHETIC-PUBLIC-W2',50000,'upi',now(),
 'PUBLIC-FEED-RECEIPT-W2','PUBLIC-CONSENT-W2',now(),
 'Owner confirmed only fixture proof in disposable database','CONFIRM');
select public.jb_ad_confirm_manual_payment_internal(
 '30000000-0000-0000-0000-000000000005',
 'SYNTHETIC-PUBLIC-W1',50000,'bank',now(),
 'PUBLIC-FEED-RECEIPT-W1','PUBLIC-CONSENT-W1',now(),
 'Owner confirmed only fixture proof in disposable database','CONFIRM');
select public.jb_ad_confirm_manual_payment_internal(
 '30000000-0000-0000-0000-000000000006',
 'SYNTHETIC-PUBLIC-W3',50000,'cash',now(),
 'PUBLIC-FEED-RECEIPT-W3','PUBLIC-CONSENT-W3',now(),
 'Owner confirmed only fixture proof in disposable database','CONFIRM');
update public.ad_campaigns set status='live' where id in(
 '30000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000005',
 '30000000-0000-0000-0000-000000000006');

-- Homepage is MP-state/National by purchased GRANT, not a district inferred
-- from reader GPS or a client-selected 'district:shivpuri' string.
insert into public.ad_campaigns(
 id,advertiser_id,package_id,package_snapshot,status,placement,scope,
 approved_at,approved_by,starts_at,ends_at
) values(
 '30000000-0000-0000-0000-000000000007',
 '00000000-0000-0000-0000-000000000003',null,'{}'::jsonb,
 'approved','homepage','global',now()-interval '1 day',
 '11111111-1111-1111-1111-111111111111',
 now()-interval '1 hour',now()+interval '7 days');
insert into public.ad_creatives(
 campaign_id,creative_type,text_body,approved,version
) values(
 '30000000-0000-0000-0000-000000000007',
 'text','Verified MP state homepage advertisement',true,1);
select public.jb_ad_grant_area_internal(
 '30000000-0000-0000-0000-000000000007',
 'mp_state',null,null,false,'TERMS-HOMEPAGE-MPSTATE');
select public.jb_ad_set_approved_quote_internal(
 '30000000-0000-0000-0000-000000000007',50000,'QUOTE-HOMEPAGE-MPSTATE');
select public.jb_ad_confirm_manual_payment_internal(
 '30000000-0000-0000-0000-000000000007',
 'SYNTHETIC-PUBLIC-HOME',50000,'upi',now(),
 'PUBLIC-FEED-RECEIPT-HOME','PUBLIC-CONSENT-HOME',now(),
 'Owner confirmed only fixture proof in disposable database','CONFIRM');
update public.ad_campaigns set status='live'
where id='30000000-0000-0000-0000-000000000007';

set local role anon;
do $cutover$
declare r record;n int;arg text;ticket int:=0;
begin
 -- Verified published Article ID is public; its GEO never comes from client.
 for n in 1..80 loop
  select * into r from public.jb_ad_public_feed(
   'article','article:10000000-0000-0000-0000-000000000001');
  if r.campaign_id not in (
   '30000000-0000-0000-0000-000000000001'::uuid,
   '30000000-0000-0000-0000-000000000005'::uuid,
   '30000000-0000-0000-0000-000000000006'::uuid)
  then raise exception 'PUBLIC_ARTICLE_PICK_UNEXPECTED: %',r.campaign_id;end if;
  if r.label is distinct from 'विज्ञापन' or r.creative_type<>'text'
  then raise exception 'PUBLIC_AD_UNSAFE_PROJECTION';end if;
  select count(*) into ticket from public.jb_ad_public_feed(
   'article','article:10000000-0000-0000-0000-000000000001');
  if ticket<>1 then raise exception 'SECOND_ARTICLE_AD_RETURNED';end if;
 end loop;
 for arg in select unnest(array[
   'local','district:shivpuri','district:guna','global',
   'article:001','article:not-a-uuid','article:10000000-0000-0000-0000-000000000004',
   'article:10000000-0000-0000-0000-000000000002',
   'article:10000000-0000-0000-0000-000000000003',
   'article:00000000-0000-0000-0000-000000000000',
   'article:10000000-0000-0000-0000-000000000001 OR TRUE'
 ]) loop
  select count(*) into n from public.jb_ad_public_feed('article',arg);
  if n<>0 then raise exception 'UNTRUSTED_ARTICLE_SCOPE_SERVES_AD: %',arg;end if;
 end loop;
 if (select count(*) from public.jb_public_active_ads('article'))<>0
 then raise exception 'LEGACY_PUBLIC_ALIAS_BYPASSED_ARTICLE_GEO';end if;
 raise notice 'PASS [B7-ARTICLE-BOUNDARY E2] 80 public Article calls; 11 forged/mismatched/draft scopes fail closed; no legacy article fallback';
end $cutover$;
do $home$
declare n int;id uuid;
begin
 select count(*),max(campaign_id::text)::uuid into n,id
 from public.jb_ad_public_feed('homepage','global');
 if n<>1 or id<>'30000000-0000-0000-0000-000000000007'::uuid
 then raise exception 'HOMEPAGE_MP_AD_NOT_SELECTED';end if;
 if (select count(*) from public.jb_ad_public_feed('homepage','district:guna'))<>0
 then raise exception 'VIEWER_CHOSE_HOMEPAGE_TARGET';end if;
 if (select count(*) from public.jb_ad_public_feed('homepage','article:10000000-0000-0000-0000-000000000001'))<>0
 then raise exception 'ARTICLE_SCOPE_USED_FOR_HOME';end if;
 if (select count(*) from public.jb_public_active_ads('homepage'))<>1
 then raise exception 'LEGACY_HOME_ALIAS_BREAK';end if;
 if (select count(*) from public.jb_public_active_ads('not-a-placement'))<>0
 then raise exception 'INVALID_LEGACY_PLACEMENT_ACTIVE';end if;
 raise notice 'PASS [B7-HOMEPAGE E2] MP-owned homepage and legacy alias only, caller area denied';
end $home$;
do $privileges$
declare msg text;
begin
 if not has_function_privilege('anon','public.jb_ad_public_feed(text,text)','EXECUTE')
 or has_function_privilege('anon','private.b7_weighted_article_candidate(uuid)','EXECUTE')
 then raise exception 'PUBLIC_OR_PRIVATE_FUNC_GRANT_BROKEN';end if;
 begin
  perform 1 from public.ad_campaign_area_grants;
  raise exception 'PUBLIC_CAN_READ_PURCHASED_AREA_GRANTS';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg not like '%permission denied%' then
   raise exception 'AREA_PRIVACY_GUARD_WRONG: %',msg;end if;
 end;
 raise notice 'PASS [B7-SECURITY E2] public readable sanitized feed only, private geo and purchased terms withheld';
end $privileges$;
reset role;

-- A disabled creative or expired campaign must disappear on the next Article
-- opening without changing the Article URL. (Already-open client pins selection.)
update public.ad_campaigns set status='hidden',hidden_at=now() where
 id in('30000000-0000-0000-0000-000000000001',
       '30000000-0000-0000-0000-000000000006');
do $hide$
declare id uuid;
begin
 select campaign_id into id from public.jb_ad_public_feed(
  'article','article:10000000-0000-0000-0000-000000000001');
 if id is distinct from '30000000-0000-0000-0000-000000000005'::uuid
 then raise exception 'HIDDEN_CAMPAIGNS_NOT_EXCLUDED_FROM_NEW_VIEW';end if;
 raise notice 'PASS [B7-HIDE E2] existing hidden campaigns removed from subsequent Article opens';
end $hide$;

rollback;
