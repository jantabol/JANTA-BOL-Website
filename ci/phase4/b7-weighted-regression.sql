\set ON_ERROR_STOP on
-- P4-T037 synthetic weighted fairness and exclusions (E1/E2 only).
-- Requires payment fixture + weighted fixture + manual, G3 and G4 reviews.
-- NO PRODUCTION DB/real bank/provider, NO T037 PASS.
begin;

insert into public.ad_geo_mp_districts(
 lgd_code,name_en,source_uri,source_version,source_sha256,verified,verified_at
) values
 ('101','Shivpuri','https://fixture.invalid/lgd','SYNTHETIC-20261010',repeat('a',64),true,now()),
 ('102','Gwalior','https://fixture.invalid/lgd','SYNTHETIC-20261010',repeat('b',64),true,now());
select set_config('b7.test_owner','enabled',true);
select public.jb_ad_set_article_geo_internal(
 '10000000-0000-0000-0000-000000000001','district','101',null,'FIXTURE-ARTICLE-SHIVPURI');
select public.jb_ad_set_article_geo_internal(
 '10000000-0000-0000-0000-000000000002','district','102',null,'FIXTURE-ARTICLE-GWALIOR');

select public.jb_ad_grant_area_internal(
 '30000000-0000-0000-0000-000000000001','district','101',null,false,'FIXTURE-TERMS-WEIGHT2');
select public.jb_ad_grant_area_internal(
 '30000000-0000-0000-0000-000000000005','district','101',null,false,'FIXTURE-TERMS-WEIGHT1');
select public.jb_ad_grant_area_internal(
 '30000000-0000-0000-0000-000000000006','district','101',null,false,'FIXTURE-TERMS-WEIGHT3');

select public.jb_ad_set_approved_quote_internal(
 '30000000-0000-0000-0000-000000000001',50000,'SIGNED-QUOTE-WEIGHT2');
select public.jb_ad_set_approved_quote_internal(
 '30000000-0000-0000-0000-000000000005',50000,'SIGNED-QUOTE-WEIGHT1');
select public.jb_ad_set_approved_quote_internal(
 '30000000-0000-0000-0000-000000000006',50000,'SIGNED-QUOTE-WEIGHT3');

-- Synthetic manual receipts with transaction-now verified consent chronology.
select public.jb_ad_confirm_manual_payment_internal(
 '30000000-0000-0000-0000-000000000001','SYNTHETIC-UTR-W2',
 50000,'upi',now(),'FIXTURE-BANK-EVIDENCE-W2',
 'FIXTURE-NONREFUND-ACCEPT-W2',now(),
 'Owner verified the synthetic bank ledger for test only','CONFIRM');
select public.jb_ad_confirm_manual_payment_internal(
 '30000000-0000-0000-0000-000000000005','SYNTHETIC-UTR-W1',
 50000,'bank',now(),'FIXTURE-BANK-EVIDENCE-W1',
 'FIXTURE-NONREFUND-ACCEPT-W1',now(),
 'Owner verified the synthetic bank ledger for test only','CONFIRM');
select public.jb_ad_confirm_manual_payment_internal(
 '30000000-0000-0000-0000-000000000006','SYNTHETIC-UTR-W3',
 50000,'cash',now(),'FIXTURE-CASH-RECEIPT-W3',
 'FIXTURE-NONREFUND-ACCEPT-W3',now(),
 'Owner verified synthetic cash receipt and terms for test','CONFIRM');

update public.ad_campaigns set status='live'
where id in (
 '30000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000005',
 '30000000-0000-0000-0000-000000000006'
);
create temp table b7_weight_counts(
 campaign uuid primary key,
 expected_weight integer not null,
 sample_count integer not null default 0
);
insert into b7_weight_counts(campaign,expected_weight) values
 ('30000000-0000-0000-0000-000000000005',1),
 ('30000000-0000-0000-0000-000000000001',2),
 ('30000000-0000-0000-0000-000000000006',3);
do $distribution$
declare chosen uuid;i integer;missing int;rec record;draws int:=3200;
begin
 for i in 1..draws loop
   select campaign_id into chosen
   from private.b7_weighted_article_candidate(
    '10000000-0000-0000-0000-000000000001'::uuid);
   if chosen is null then raise exception 'ELIGIBLE_WEIGHTED_SELECTION_EMPTY';end if;
   update b7_weight_counts set sample_count=sample_count+1 where campaign=chosen;
   if not found then raise exception 'UNEXPECTED_CAMPAIGN_IN_WEIGHTED_POOL: %',chosen;end if;
 end loop;
 for rec in select * from b7_weight_counts loop
   -- 20% relative tolerance around expected 1:2:3. This is an
   -- engineering distribution smoke test, NOT an impression guarantee.
   if abs(rec.sample_count::numeric - draws*rec.expected_weight/6.0)
        > 0.20*(draws*rec.expected_weight/6.0) then
     raise exception 'WEIGHTED_FAIRNESS_OUTSIDE_TOLERANCE expected-weight=%, observed=%',
       rec.expected_weight,rec.sample_count;
   end if;
   raise notice 'G4 weighted 1:2:3 proof: weight %, selected % / %',
      rec.expected_weight,rec.sample_count,draws;
 end loop;
 if (select sum(sample_count) from b7_weight_counts)<>draws
 then raise exception 'STATISTICAL_SAMPLE_LOST_DRAW';end if;
 raise notice 'PASS [ADS-030 E2-SYNTHETIC] 3,200 real server candidate calls within stated fairness tolerance';
end $distribution$;

do $cross_scope$
declare n int;
begin
 select count(*) into n from private.b7_weighted_article_candidate(
  '10000000-0000-0000-0000-000000000002');
 if n<>0 then raise exception 'GWALIOR_ARTICLE_GOT_SHIVPURI_AD';end if;
 select count(*) into n from private.b7_weighted_article_candidate(
  '10000000-0000-0000-0000-000000000003');
 if n<>0 then raise exception 'UNKNOWN_ARTICLE_GOT_LOCAL_AD';end if;
 select count(*) into n from private.b7_weighted_article_candidate(
  '10000000-0000-0000-0000-000000000004');
 if n<>0 then raise exception 'DRAFT_ARTICLE_GOT_AD';end if;
 select count(*) into n from private.b7_weighted_article_candidate(null);
 if n<>0 then raise exception 'NULL_ARTICLE_GOT_AD';end if;
 raise notice 'PASS [ADS-028/034] private server Article geo denies forged local, unknown, unpublished and null';
end $cross_scope$;

-- No in-page rotation is implemented by this server-only candidate.
-- One call returns at most ONE sanitized creative, never phone/receipt.
do $one_slot$
declare rec record;n int;
begin
 select count(*) into n from private.b7_weighted_article_candidate(
  '10000000-0000-0000-0000-000000000001');
 if n<>1 then raise exception 'MORE_THAN_ONE_PAID_ARTICLE_AD';end if;
 select * into rec from private.b7_weighted_article_candidate(
  '10000000-0000-0000-0000-000000000001');
 if rec.label<>'विज्ञापन' or rec.selection_weight not in (1,2,3)
 then raise exception 'BAD_AD_LABEL_OR_WEIGHT';end if;
 raise notice 'PASS [ADS-031] at most one sanitized approved candidate with विज्ञापन label';
end $one_slot$;

-- Exclusions must hold even if current campaign status column lags an expiry,
-- or new package editing accidentally changes old frozen snapshots.
update public.ad_campaigns set status='paused'
where id in (
 '30000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000006'
);
do $sole_campaign$
declare c uuid; k int;
begin
 for k in 1..40 loop
  select campaign_id into c from private.b7_weighted_article_candidate(
   '10000000-0000-0000-0000-000000000001');
  if c is distinct from '30000000-0000-0000-0000-000000000005'::uuid
  then raise exception 'INELIGIBLE_PAUSED_CAMPAIGN_SELECTED: %',c;end if;
 end loop;
 raise notice 'PASS [ADS-034] one eligible campaign wins, paused packages excluded';
end $sole_campaign$;

-- Invalid approved higher-version creative must not fall back to older asset.
insert into public.ad_creatives(
 id,campaign_id,creative_type,media_url,approved,version
) values(
 '40000000-0000-0000-0000-000000000009',
 '30000000-0000-0000-0000-000000000005',
 'image','http://unsafe.invalid/approved.png',true,99
);
do $bad_creative$
declare n int;
begin
 select count(*) into n from private.b7_weighted_article_candidate(
  '10000000-0000-0000-0000-000000000001');
 if n<>0 then raise exception 'INVALID_TOP_APPROVED_ASSET_FELL_BACK_OR_SERVED';end if;
 raise notice 'PASS [ADS-034] invalid newest approved creative blocks campaign; no unsafe fallback';
end $bad_creative$;
delete from public.ad_creatives
where id='40000000-0000-0000-0000-000000000009';

-- A changed package snapshot MUST exclude this frozen paid booking.
update public.ad_campaigns set package_snapshot='{"version":1,"price_minor":1}'::jsonb
where id='30000000-0000-0000-0000-000000000005';
do $snapshot$
declare n int;
begin
 select count(*) into n from private.b7_weighted_article_candidate(
  '10000000-0000-0000-0000-000000000001');
 if n<>0 then raise exception 'FORGED_PACKAGE_SNAPSHOT_SELECTED';end if;
 raise notice 'PASS [ADS-027/034] changed historical package snapshot is not silently accepted';
end $snapshot$;
update public.ad_campaigns set package_snapshot='{"version":1,"price_minor":50000}'::jsonb
where id='30000000-0000-0000-0000-000000000005';

-- No server-time exposure beyond end even if scheduler forgot to change status.
update public.ad_campaigns set ends_at=now()-interval '1 minute'
where id='30000000-0000-0000-0000-000000000005';
do $end_time$
declare n int;
begin
 select count(*) into n from private.b7_weighted_article_candidate(
  '10000000-0000-0000-0000-000000000001');
 if n<>0 then raise exception 'EXPIRED_CAMPAIGN_SERVED';end if;
 raise notice 'PASS [ADS-016/017/034] server-time expiry excludes even status LIVE';
end $end_time$;
update public.ad_campaigns set ends_at=now()+interval '7 days',hidden_at=now()
where id='30000000-0000-0000-0000-000000000005';
do $hidden$
declare n int;
begin
 select count(*) into n from private.b7_weighted_article_candidate(
  '10000000-0000-0000-0000-000000000001');
 if n<>0 then raise exception 'HIDDEN_CAMPAIGN_SERVED';end if;
 raise notice 'PASS [ADS-019/034] emergency HIDE suppresses a campaign on new selection';
end $hidden$;

set local role anon;
do $public_denial$
declare msg text;
begin
 begin
  perform private.b7_weighted_article_candidate(
   '10000000-0000-0000-0000-000000000001');
  raise exception 'ANON_UNREVIEWED_SECOND_AD_FEED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg not like '%permission denied%' then
   raise exception 'WEIGHTED_PICKER_NOT_PRIVATE: %',msg;end if;
 end;
 raise notice 'PASS [G4] no parallel anonymous public advertisement RPC';
end $public_denial$;
reset role;

rollback;
