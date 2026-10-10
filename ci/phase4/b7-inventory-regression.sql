\set ON_ERROR_STOP on
-- Isolated synthetic B7 G4 booking test; transaction rolled back.
-- Forecast numbers are FICTIONAL fixture capacity, not actual news traffic.
begin;

do $non_owner$
declare msg text;
begin
 begin
  perform public.jb_ad_create_inventory_window_internal(
   'article',now()+interval '1 hour',now()+interval '2 days',1000,'SYNTHETIC-FORECAST-REF');
  raise exception 'UNAUTHORIZED_INVENTORY_WINDOW_CREATED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'OWNER_AAL2_REQUIRED' then raise exception 'CAP_OWNER_DENIAL_WRONG: %',msg;end if;
 end;
 begin
  perform public.jb_ad_reserve_inventory_internal(
   '30000000-0000-0000-0000-000000000001',null,100,'SIGNED-QUOTE-0001');
  raise exception 'UNAUTHORIZED_INVENTORY_COMMITMENT';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'OWNER_AAL2_REQUIRED'
  then raise exception 'RESERVE_OWNER_DENIAL_WRONG: %',msg;end if;
 end;
 if exists(select 1 from public.ad_inventory_windows)
   or exists(select 1 from public.ad_inventory_reservations)
 then raise exception 'NONOWNER_RESERVED_INVENTORY';end if;
 raise notice 'PASS [ADS-032] AAL1/nonowner cannot create forecasts or capacity promises';
end $non_owner$;

select set_config('b7.test_owner','enabled',true);
select public.jb_ad_set_approved_quote_internal(
 '30000000-0000-0000-0000-000000000001',50000,'QUOTE-INVENTORY-A-001');
select public.jb_ad_set_approved_quote_internal(
 '30000000-0000-0000-0000-000000000003',50000,'QUOTE-INVENTORY-B-003');
select public.jb_ad_set_approved_quote_internal(
 '30000000-0000-0000-0000-000000000005',50000,'QUOTE-INVENTORY-C-005');
select public.jb_ad_set_approved_quote_internal(
 '30000000-0000-0000-0000-000000000002',28000,'QUOTE-HIGH-RISK-002');

create temp table b7_inventory_fixture(id uuid primary key,placement text);
insert into b7_inventory_fixture
select public.jb_ad_create_inventory_window_internal(
 'article',now()+interval '1 hour',now()+interval '2 days',
 1000,'FAKE-FORECAST-ARTICLE-001'),'article';

do $overlap$
declare msg text;
begin
 begin
  perform public.jb_ad_create_inventory_window_internal(
   'article',now()+interval '2 hours',now()+interval '3 days',
   1000,'FAKE-SECOND-FORECAST-OVERLAP');
  raise exception 'OVERLAPPING_CAPACITY_APPROVED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'OVERLAPPING_INVENTORY_WINDOW' then
   raise exception 'OVERLAP_GUARD_WRONG: %',msg;end if;
 end;
 begin
  perform public.jb_ad_create_inventory_window_internal(
   'article',now()-interval '3 days',now()-interval '2 days',
   100,'FAKE-PAST-FORECAST');
  raise exception 'PAST_CAPACITY_APPROVED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'INVALID_INVENTORY_FORECAST' then
   raise exception 'PAST_FORECAST_GUARD_WRONG: %',msg;end if;
 end;
 if (select count(*) from public.ad_inventory_windows)<>1
 then raise exception 'BAD_FORECAST_WROTE_WINDOW';end if;
 raise notice 'PASS [ADS-032] overlapping windows cannot double-sell one Article slot';
end $overlap$;

insert into b7_inventory_fixture
select public.jb_ad_create_inventory_window_internal(
 'article',now()+interval '2 days',now()+interval '3 days',
 250,'FAKE-NEXT-ADJACENT-WINDOW'),'article';

do $booking$
declare cap uuid;msg text;id uuid;
begin
 select w.id into cap from public.ad_inventory_windows w
 where w.max_guaranteed_impressions=1000;

 id:=public.jb_ad_reserve_inventory_internal(
  '30000000-0000-0000-0000-000000000001',
  cap,600,'QUOTE-INVENTORY-A-001');
 if id is null then raise exception 'FIRST_GUARANTEE_MISSING';end if;

 begin
  perform public.jb_ad_reserve_inventory_internal(
   '30000000-0000-0000-0000-000000000001',
   cap,10,'QUOTE-INVENTORY-A-001');
  raise exception 'DUPLICATE_CAMPAIGN_BOOKING_ACCEPTED';
 exception when unique_violation then null;
 end;
 begin
  perform public.jb_ad_reserve_inventory_internal(
   '30000000-0000-0000-0000-000000000003',
   cap,500,'QUOTE-INVENTORY-B-003');
  raise exception 'INVENTORY_OVERSELL_1100';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'CAPACITY_EXCEEDED' then raise exception 'CAP_GUARD_WRONG: %',msg;end if;
 end;
 perform public.jb_ad_reserve_inventory_internal(
  '30000000-0000-0000-0000-000000000003',
  cap,400,'QUOTE-INVENTORY-B-003');

 begin
  perform public.jb_ad_reserve_inventory_internal(
   '30000000-0000-0000-0000-000000000005',
   cap,1,'QUOTE-INVENTORY-C-005');
  raise exception 'THIRD_AD_DILUTED_EARLIER_GUARANTEE';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'CAPACITY_EXCEEDED' then raise exception 'NEW_AD_GUARD_WRONG: %',msg;end if;
 end;
 begin
  perform public.jb_ad_reserve_inventory_internal(
   '30000000-0000-0000-0000-000000000002',
   cap,1,'QUOTE-HIGH-RISK-002');
  raise exception 'UNVERIFIED_HIGH_RISK_RESERVED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'ADVERTISER_VERIFICATION_REQUIRED'
  then raise exception 'HIGH_RISK_INVENTORY_GUARD_WRONG: %',msg;end if;
 end;
 if (select count(*) from public.ad_inventory_reservations)<>2
    or (select sum(guaranteed_min_impressions)
         from public.ad_inventory_reservations where window_id=cap)<>1000
 then raise exception 'GUARANTEED_RESERVATION_BALANCE_WRONG';end if;
 raise notice 'PASS [ADS-032/033] 600+400=1000 sold, 1100/extra ad denied, prior contract preserved';
end $booking$;

do $terms_and_immutable$
declare cap uuid;rid uuid;msg text;
begin
 select id into cap from public.ad_inventory_windows
 where max_guaranteed_impressions=250;
 begin
  perform public.jb_ad_reserve_inventory_internal(
   '30000000-0000-0000-0000-000000000005',
   cap,30,'FORGED-CHANGED-TERMS');
  raise exception 'FORGED_BOOKING_TERMS_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'BOOKING_TERMS_NOT_APPROVED'
  then raise exception 'TERMS_GUARD_WRONG: %',msg;end if;
 end;
 select id into rid from public.ad_inventory_reservations limit 1;
 begin
  update public.ad_inventory_reservations
  set guaranteed_min_impressions=1 where id=rid;
  raise exception 'OWNER_REWROTE_COMMITMENT';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'IMMUTABLE_AD_INVENTORY_COMMITMENT'
  then raise exception 'RESERVATION_IMMUTABLE_FAILED: %',msg;end if;
 end;
 begin
  delete from public.ad_inventory_reservations where id=rid;
  raise exception 'OWNER_DELETED_COMMITMENT';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'IMMUTABLE_AD_INVENTORY_COMMITMENT'
  then raise exception 'RESERVATION_DELETE_GUARD_WRONG: %',msg;end if;
 end;
 begin
  update public.ad_inventory_windows
  set max_guaranteed_impressions=100 where id=cap;
  raise exception 'OWNER_REDUCED_CAPACITY';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'IMMUTABLE_AD_INVENTORY_COMMITMENT'
  then raise exception 'CAPACITY_IMMUTABLE_WRONG: %',msg;end if;
 end;
 raise notice 'PASS [ADS-033] no post-booking rewrite/delete of guarantee or forecast';
end $terms_and_immutable$;

do $direct_guard$
declare msg text;cap uuid;
begin
 select id into cap from public.ad_inventory_windows
 where max_guaranteed_impressions=250;
 perform set_config('b7.test_owner','',true);
 begin
  insert into public.ad_inventory_reservations(
    campaign_id,window_id,guaranteed_min_impressions,agreed_terms_ref,booked_by)
  values('30000000-0000-0000-0000-000000000005',cap,1,
   'QUOTE-INVENTORY-C-005',auth.uid());
  raise exception 'DIRECT_SERVICE_BOOKING_BYPASS';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'OWNER_AAL2_REQUIRED'
  then raise exception 'DIRECT_SERVICE_GUARD_WRONG: %',msg;end if;
 end;
 perform set_config('b7.test_owner','enabled',true);
 raise notice 'PASS [ADS-032] direct service-side SQL still requires Owner AAL2';
end $direct_guard$;

set local role anon;
do $anonymous$
declare msg text;
begin
 begin
  perform 1 from public.ad_inventory_windows;
  raise exception 'PUBLIC_CAPACITY_LEAK';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg not like '%permission denied%'
  then raise exception 'CAPACITY_TABLE_GRANT_WRONG: %',msg;end if;
 end;
 begin
  perform public.jb_ad_reserve_inventory_internal(
   '30000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001',
   1,'FORGED');
  raise exception 'ANON_CAPACITY_BOOKING';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg not like '%permission denied%'
  then raise exception 'ANON_RPC_GRANT_WRONG: %',msg;end if;
 end;
 raise notice 'PASS [ADS-032] anonymous callers cannot read capacity or reserve it';
end $anonymous$;
reset role;

do $audit$
begin
 if (select count(*) from public.audit_logs
   where action='ad_inventory_capacity_approved')<>2
 then raise exception 'OWNER_FORECAST_AUDIT_MISSING';end if;
 if (select count(*) from public.audit_logs
   where action='ad_inventory_booked')<>2
 then raise exception 'BOOKED_COMMITMENT_AUDIT_MISSING';end if;
 if (select count(*) from public.ad_history
   where event_type='inventory_guarantee_reserved')<>2
 then raise exception 'COMMERCIAL_BOOKING_HISTORY_MISSING';end if;
 if (select count(*) from public.ad_campaigns where status='live')<>0
 then raise exception 'INVENTORY_BOOKING_AUTO_ACTIVATED_AD';end if;
 raise notice 'PASS [ADS-032/033 E5-SYNTHETIC] common audit+history, NO auto-paid or LIVE';
end $audit$;
rollback;
