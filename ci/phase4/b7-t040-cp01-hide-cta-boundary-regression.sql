\set ON_ERROR_STOP on
-- P4-T040 CP01 ADS048/050, truly disposable PostgreSQL17.
-- First divergence: existing issued token is still accepted for a CTA after
-- its original campaign becomes HIDDEN, even though T036 revocation removes
-- the pinned card. Never turn a removed CTA into a billed/reported click.
-- All data is synthetic. No real commerce, human or Android E3.
begin;
insert into public.ad_geo_mp_districts(
 lgd_code,name_en,source_uri,source_version,source_sha256,verified,verified_at
) values('101','Shivpuri','https://fixture.invalid/lgd','T040-FAKE-ONLY',
 repeat('a',64),true,now());
select set_config('b7.test_owner','enabled',true);
select public.jb_ad_set_article_geo_internal(
 '10000000-0000-0000-0000-000000000001','district','101',null,
 'T040-SYNTHETIC-EDITORIAL-GEO');
select public.jb_ad_grant_area_internal(
 '30000000-0000-0000-0000-000000000005',
 'district','101',null,false,'T040-SYNTHETIC-AREA-AGREEMENT');
select public.jb_ad_set_approved_quote_internal(
 '30000000-0000-0000-0000-000000000005',50000,
 'T040-SYNTHETIC-SIGNED-TERMS-NO-REAL-MONEY');
select public.jb_ad_confirm_manual_payment_internal(
 '30000000-0000-0000-0000-000000000005','T040-NO-REAL-UTR-0005',50000,
 'upi',now(),'T040-NO-REAL-BANK-RECEIPT',
 'T040-NO-REAL-BUYER-CONSENT',now(),
 'Synthetic PG17 only - no bank or buyer contacted','CONFIRM');
update public.ad_campaigns
 set status='live'
 where id='30000000-0000-0000-0000-000000000005';
update public.ad_creatives
 set cta_type='website',cta_target='https://advertiser.example.test/promo'
 where id='40000000-0000-0000-0000-000000000005';

-- First issue a valid one-time CTA token while ad is actually LIVE.
set local role anon;
select set_config('b7.t040.valid_token',public.jb_ad_issue_view_ticket(
 '10000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000005',
 '40000000-0000-0000-0000-000000000005',repeat('a',32)),true);
reset role;
update public.ad_campaigns set status='hidden',hidden_at=now()
 where id='30000000-0000-0000-0000-000000000005';

set local role anon;
do $hidden$
begin
 if public.jb_ad_record_ticket_click(current_setting('b7.t040.valid_token',true))
 then raise exception 'T040_HIDDEN_AD_OLD_CLICK_TOKEN_ACCEPTED';end if;
 raise notice 'T040 ADS048/050 PASS: hidden campaign cannot count a CTA click even with prior ticket';
end $hidden$;
reset role;
do $unchanged$
declare h text;
begin
 h:=encode(extensions.digest(current_setting('b7.t040.valid_token',true),'sha256'),'hex');
 if exists(select 1 from public.ad_view_tickets where token_hash=h and click_at is not null)
 or exists(select 1 from public.ad_events where view_ticket_hash=h and event_type='click')
 then raise exception 'T040_HIDDEN_CLICK_TICKET_CONSUMED_OR_LEDGER_WRITTEN';end if;
 if (select status from public.ad_campaigns where id=
 '30000000-0000-0000-0000-000000000005')<>'hidden'
 then raise exception 'T040_CLICK_TOUCHES_HIDDEN_AD';end if;
 raise notice 'T040 ADS050 PASS: HIDE remains unchanged; no analytics state for hidden click';
end $unchanged$;

-- Previously displayed but still actually eligible Article can be read
-- 20+ minutes and clicked ONCE. Preserve original T029 behavior.
update public.ad_campaigns
 set status='live',hidden_at=null
 where id='30000000-0000-0000-0000-000000000005';
set local role anon;
select set_config('b7.t040.long_read_token',public.jb_ad_issue_view_ticket(
 '10000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000005',
 '40000000-0000-0000-0000-000000000005',repeat('b',32)),true);
reset role;
update public.ad_view_tickets
set issued_at=clock_timestamp()-interval '21 minutes',
    expires_at=clock_timestamp()-interval '18 minutes'
where token_hash=encode(extensions.digest(
 current_setting('b7.t040.long_read_token',true),'sha256'),'hex');
set local role anon;
do $long_read$
declare token text;
begin
 token:=current_setting('b7.t040.long_read_token',true);
 if not public.jb_ad_record_ticket_click(token)
 then raise exception 'T040_LEGITIMATE_21MIN_PINNED_CTA_BLOCKED';end if;
 if public.jb_ad_record_ticket_click(token)
 then raise exception 'T040_REPLAYED_PINNED_CTA_COUNTED_TWICE';end if;
 raise notice 'T040 ADS048 PASS: 21-minute still LIVE pinned CTA counts once and no rotation';
end $long_read$;
reset role;
do $privacy$
begin
 if (select count(*) from public.ad_events
  where event_type='click' and qualified=true)<>1
 then raise exception 'T040_QUALIFIED_CLICK_COUNT_NOT_EXACTLY_ONE';end if;
 if exists(select 1 from information_schema.columns
   where table_schema='public' and table_name='ad_view_tickets'
    and column_name ~* '(ip|phone|email|viewer|user_agent|device)')
 then raise exception 'T040_TICKET_COLLECTS_VIEWER_PII';end if;
 raise notice 'T040 ADS049/050 PASS: only qualified LIVE click in same ad-event ledger, no raw viewer identity';
end $privacy$;
rollback;
