\set ON_ERROR_STOP on
-- P4-T040 CP06 ADS049/050; true disposable PG17 negative.
-- A pre-issued token must not create a NEW impression after Owner emergency
-- HIDE removed the public ad card. No buyer/real views/payments here.
-- Must return RED on the old reviewed qualify function, then GREEN only
-- after a targeted server-authority fix; 21min existing CTA remains safe.
begin;
insert into public.ad_geo_mp_districts(
 lgd_code,name_en,source_uri,source_version,source_sha256,verified,verified_at
) values('101','Shivpuri','https://fixture.invalid/lgd',
 'CP06-SYNTHETIC-ONLY',repeat('a',64),true,now());
select set_config('b7.test_owner','enabled',true);
select public.jb_ad_set_article_geo_internal(
 '10000000-0000-0000-0000-000000000001','district','101',null,
 'CP06-SYNTHETIC-EDITORIAL-GEO');
select public.jb_ad_grant_area_internal(
 '30000000-0000-0000-0000-000000000005',
 'district','101',null,false,'CP06-SYNTHETIC-AREA-TERMS');
select public.jb_ad_set_approved_quote_internal(
 '30000000-0000-0000-0000-000000000005',50000,
 'CP06-SYNTHETIC-SIGNED-TERMS');
select public.jb_ad_confirm_manual_payment_internal(
 '30000000-0000-0000-0000-000000000005',
 'CP06-NOT-A-REAL-UTR-0005',50000,'upi',now(),
 'CP06-NOT-A-REAL-BANK-RECEIPT','CP06-NOT-A-REAL-CONSENT',
 now(),'Disposable fixture only; no real money','CONFIRM');
update public.ad_campaigns set status='live'
 where id='30000000-0000-0000-0000-000000000005';
update public.ad_creatives
 set cta_type='website',cta_target='https://advertiser.example.test/promo'
 where id='40000000-0000-0000-0000-000000000005';

-- Anonymous browser obtained legitimate short ticket before emergency HIDE.
set local role anon;
select set_config('b7.t040.cp06.hidden_view_token',
 public.jb_ad_issue_view_ticket(
 '10000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000005',
 '40000000-0000-0000-0000-000000000005',
 repeat('c',32)),true);
reset role;
-- Advance only fixture ticket clock; no sleeps and no production mutation.
update public.ad_view_tickets
 set issued_at=clock_timestamp()-interval '2 seconds',
     expires_at=clock_timestamp()+interval '2 minutes'
 where token_hash=encode(extensions.digest(
 current_setting('b7.t040.cp06.hidden_view_token',true),'sha256'),'hex');
update public.ad_campaigns set status='hidden',hidden_at=clock_timestamp()
 where id='30000000-0000-0000-0000-000000000005';

set local role anon;
do $must_reject$
begin
 if public.jb_ad_qualify_view_ticket(
     current_setting('b7.t040.cp06.hidden_view_token',true))
 then raise exception 'T040_CP06_HIDDEN_AD_OLD_VIEW_TOKEN_ACCEPTED';end if;
 raise notice 'PASS CP06: hidden campaign pre-issued ticket cannot generate post-HIDE impression';
end $must_reject$;
reset role;
do $no_side_effect$
declare h text;
begin
 h:=encode(extensions.digest(
  current_setting('b7.t040.cp06.hidden_view_token',true),'sha256'),'hex');
 if exists(select 1 from public.ad_view_tickets
           where token_hash=h and impression_at is not null)
    or exists(select 1 from public.ad_events
           where view_ticket_hash=h and event_type='impression')
 then raise exception 'T040_CP06_HIDDEN_IMPRESSION_LEDGER_MUTATED';end if;
 if (select status from public.ad_campaigns
    where id='30000000-0000-0000-0000-000000000005')<>'hidden'
 then raise exception 'T040_CP06_HIDDEN_CAMPAIGN_STATE_TOUCHED';end if;
 raise notice 'PASS CP06: hidden token left unconsumed and ledger unchanged';
end $no_side_effect$;

-- Previously hidden campaign made eligible again: NEW verified opening
-- must still report exactly ONCE after server delay, no long-reader regression.
update public.ad_campaigns set status='live',hidden_at=null
 where id='30000000-0000-0000-0000-000000000005';
set local role anon;
select set_config('b7.t040.cp06.live_view_token',
 public.jb_ad_issue_view_ticket(
 '10000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000005',
 '40000000-0000-0000-0000-000000000005',
 repeat('d',32)),true);
reset role;
update public.ad_view_tickets
 set issued_at=clock_timestamp()-interval '2 seconds',
     expires_at=clock_timestamp()+interval '2 minutes'
 where token_hash=encode(extensions.digest(
 current_setting('b7.t040.cp06.live_view_token',true),'sha256'),'hex');
set local role anon;
do $still_live$
declare t text;
begin
 t:=current_setting('b7.t040.cp06.live_view_token',true);
 if not public.jb_ad_qualify_view_ticket(t)
 then raise exception 'T040_CP06_STILL_LIVE_VIEW_REJECTED';end if;
 if public.jb_ad_qualify_view_ticket(t)
 then raise exception 'T040_CP06_VALID_VIEW_REPLAY_ACCEPTED';end if;
 raise notice 'PASS CP06: eligible campaign records only one reported impression';
end $still_live$;
reset role;
do $exactly_one$
begin
 if (select count(*) from public.ad_events
   where qualified=true and event_type='impression')<>1
 then raise exception 'T040_CP06_QUALIFIED_VIEW_COUNT_NOT_EXACTLY_ONE';end if;
 raise notice 'PASS CP06: only one valid impression in original ledger';
end $exactly_one$;
rollback;
