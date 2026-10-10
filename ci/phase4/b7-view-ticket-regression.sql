\set ON_ERROR_STOP on
-- P4-T040 ADS-049/050 synthetic ticket tests, no real views and no billing.
-- New backend requires existing verified source+paid+geo candidate migrations.
begin;

insert into public.ad_geo_mp_districts(
 lgd_code,name_en,source_uri,source_version,source_sha256,verified,verified_at
) values
 ('101','Shivpuri','https://fixture.invalid/lgd','SYNTHETIC-20261010',repeat('a',64),true,now()),
 ('102','Gwalior','https://fixture.invalid/lgd','SYNTHETIC-20261010',repeat('b',64),true,now());

select set_config('b7.test_owner','enabled',true);
select public.jb_ad_set_article_geo_internal(
 '10000000-0000-0000-0000-000000000001','district','101',null,'EDITORIAL-GEO-FIXTURE-001');
select public.jb_ad_set_article_geo_internal(
 '10000000-0000-0000-0000-000000000002','district','102',null,'EDITORIAL-GEO-FIXTURE-002');
select public.jb_ad_grant_area_internal(
 '30000000-0000-0000-0000-000000000005','district','101',null,false,'OWNER-AREA-TERMS-VIEW-005');
select public.jb_ad_set_approved_quote_internal(
 '30000000-0000-0000-0000-000000000005',50000,'OWNER-QUOTE-VIEW-005');
select public.jb_ad_confirm_manual_payment_internal(
 '30000000-0000-0000-0000-000000000005','SYNTHETIC-VIEW-UTR-005',
 50000,'upi',now(),'SYNTHETIC-VIEW-BANK-005',
 'SYNTHETIC-VIEW-CONSENT-005',now(),
 'Owner checked fixture-only bank proof, not a real payment','CONFIRM');
update public.ad_campaigns set status='live'
where id='30000000-0000-0000-0000-000000000005';

-- Owner-approved CTA fixture: browser renders only a validated safe destination.
update public.ad_creatives
set cta_type='website',cta_target='https://advertiser.example.test/promo'
where id='40000000-0000-0000-0000-000000000005';

-- Preserve historic raw telemetry physically but never confuse it with a
-- client-reported qualified impression or user count.
insert into public.ad_events(campaign_id,event_type)
values('30000000-0000-0000-0000-000000000005','impression');

set local role anon;
do $deny_raw$
declare msg text;
begin
 if has_function_privilege('anon','public.jb_ad_event(uuid,text)','EXECUTE')
   or has_function_privilege('anon','public.jb_ad_record_event(uuid,text)','EXECUTE')
 then raise exception 'LEGACY_ANONYMOUS_RAW_EVENTS_STILL_WRITABLE';end if;
 begin
  perform 1 from public.ad_events;
  raise exception 'AD_EVENTS_DIRECTLY_EXPOSED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg not like '%permission denied%'
  then raise exception 'AD_EVENT_RLS_GRANT_FAILED: %',msg;end if;
 end;
 begin
  perform 1 from public.ad_view_tickets;
  raise exception 'VIEW_TOKEN_HASHES_EXPOSED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg not like '%permission denied%'
  then raise exception 'TICKET_RLS_GRANT_FAILED: %',msg;end if;
 end;
 raise notice 'PASS [ADS-050] anonymous raw event writers closed; no ticket or ad-event direct access';
end $deny_raw$;

do $issue_wrong$
declare msg text;
begin
 begin
  perform public.jb_ad_issue_view_ticket(
   '10000000-0000-0000-0000-000000000002',
   '30000000-0000-0000-0000-000000000005',
   '40000000-0000-0000-0000-000000000005',repeat('b',32));
  raise exception 'GWALIOR_GOT_SHIVPURI_VIEW_TOKEN';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'AD_VIEW_NOT_ELIGIBLE' then raise exception 'WRONG_GEO_ISSUE: %',msg;end if;
 end;
 begin
  perform public.jb_ad_issue_view_ticket(
   '10000000-0000-0000-0000-000000000004',
   '30000000-0000-0000-0000-000000000005',
   '40000000-0000-0000-0000-000000000005',repeat('c',32));
  raise exception 'DRAFT_ARTICLE_GOT_VIEW_TOKEN';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'AD_VIEW_NOT_ELIGIBLE' then raise exception 'DRAFT_ISSUE: %',msg;end if;
 end;
 begin
  perform public.jb_ad_issue_view_ticket(
   '10000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000005',
   '40000000-0000-0000-0000-000000000006',repeat('d',32));
  raise exception 'OTHER_ADVERTISER_CREATIVE_TICKET';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'AD_VIEW_NOT_ELIGIBLE' then raise exception 'CROSS_CREATIVE_ISSUE: %',msg;end if;
 end;
 begin
  perform public.jb_ad_issue_view_ticket(
   '10000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000005',
   '40000000-0000-0000-0000-000000000005','not-a-nonce');
  raise exception 'BAD_NONCE_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'INVALID_AD_VIEW_TICKET_REQUEST'
   then raise exception 'NONCE_SHAPE_GUARD: %',msg;end if;
 end;
 if public.jb_ad_qualify_view_ticket('invalid-token') then
  raise exception 'FORGED_VIEW_TOKEN_QUALIFIED';end if;
 raise notice 'PASS [ADS-049/050] forged/wrong-district/draft/cross-creative/non-random-looking shape denied';
end $issue_wrong$;

do $one_open$
declare t text;msg text;
begin
 t:=public.jb_ad_issue_view_ticket(
  '10000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000005',
  '40000000-0000-0000-0000-000000000005',repeat('a',32));
 if t !~ '^[0-9a-f]{48}$' then raise exception 'WEAK_VIEW_TOKEN';end if;
 perform set_config('b7.fixture_view_token',t,true);
 if public.jb_ad_qualify_view_ticket(t) then
   raise exception 'VIEW_QUALIFIED_BEFORE_ONE_SECOND';end if;
 begin
  perform public.jb_ad_issue_view_ticket(
   '10000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000005',
   '40000000-0000-0000-0000-000000000005',repeat('a',32));
  raise exception 'SECOND_TICKET_FOR_SAME_OPEN';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'ARTICLE_VIEW_ALREADY_TICKETED'
  then raise exception 'ARTICLE_NONCE_REPLAY_WRONG: %',msg;end if;
 end;
 raise notice 'PASS [ADS-050] same Article opening cannot mint second ticket; server rejects <1s';
end $one_open$;
reset role;

-- Disposable test only: use real DB clock rather than fake validation of
-- signed time; no worker or production traffic needed.
select pg_sleep(1.15);
set local role anon;
do $qualify$
declare t text;
begin
 t:=current_setting('b7.fixture_view_token',true);
 if t is null or not public.jb_ad_qualify_view_ticket(t)
 then raise exception 'VALID_1S_VIEW_NOT_RECORDED';end if;
 if public.jb_ad_qualify_view_ticket(t)
 then raise exception 'IMPRESSION_TICKET_REPLAY_ACCEPTED';end if;
 if public.jb_ad_qualify_view_ticket(repeat('f',48))
 then raise exception 'FORGED_TICKET_ACCEPTED';end if;
 raise notice 'PASS [ADS-049/050] >=1s + one-use token yields one event, replay and forgery rejected';
end $qualify$;
reset role;

-- ADS-048: the same ticket can yield ONE impression and ONE
-- client-reported user CTA click (two event types, one token).
set local role anon;
do $click_once$
declare t text;
begin
 t:=current_setting('b7.fixture_view_token',true);
 if t is null or not public.jb_ad_record_ticket_click(t)
 then raise exception 'APPROVED_CTA_CLICK_NOT_RECORDED';end if;
 if public.jb_ad_record_ticket_click(t)
 then raise exception 'DUPLICATE_CTA_CLICK_ACCEPTED';end if;
 if public.jb_ad_record_ticket_click(repeat('f',48))
 then raise exception 'FORGED_CLICK_TOKEN_ACCEPTED';end if;
 raise notice 'PASS [ADS-048] approved CTA click tracked once, replay/forgery rejected, original impression retained';
end $click_once$;
reset role;

-- Issue a second genuine eligible open, then corrupt its stored CTA
-- as an adversarial fixture. Never trust a browser-supplied URL/scheme.
set local role anon;
do $fresh_click$
declare t text;
begin
 t:=public.jb_ad_issue_view_ticket(
  '10000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000005',
  '40000000-0000-0000-0000-000000000005',repeat('d',32));
 perform set_config('b7.fixture_unsafe_cta_token',t,true);
end $fresh_click$;
reset role;
update public.ad_creatives
set cta_target='javascript:alert(1)'
where id='40000000-0000-0000-0000-000000000005';
set local role anon;
do $unsafe_cta$
begin
 if public.jb_ad_record_ticket_click(
   current_setting('b7.fixture_unsafe_cta_token',true))
 then raise exception 'JAVASCRIPT_CTA_COUNTED';end if;
 raise notice 'PASS [ADS-048/050] forged javascript CTA target never qualifies as paid click';
end $unsafe_cta$;
reset role;
update public.ad_creatives
set cta_target='https://advertiser.example.test/promo'
where id='40000000-0000-0000-0000-000000000005';


-- ADS-029: a reader can keep the Article and its single paid ad open for
-- twenty minutes. The short 3-min impression report has expired, but a
-- real user may still click the original safe CTA without rotating the ad.
update public.ad_view_tickets
set issued_at=clock_timestamp()-interval '21 minutes',
    expires_at=clock_timestamp()-interval '18 minutes'
where token_hash=encode(extensions.digest(
 current_setting('b7.fixture_unsafe_cta_token',true),'sha256'),'hex');

set local role anon;
do $click_after_reading$
declare t text;
begin
 t:=current_setting('b7.fixture_unsafe_cta_token',true);
 if not public.jb_ad_record_ticket_click(t)
 then raise exception 'PINNED_AD_CTA_CLICK_LOST_AFTER_20_MINUTES';end if;
 if public.jb_ad_record_ticket_click(t)
 then raise exception 'LATE_AD_CTA_CLICK_REPLAY_ALLOWED';end if;
 if public.jb_ad_qualify_view_ticket(t)
 then raise exception 'EXPIRED_IMPRESSION_INFLATED_BY_LATE_CLICK';end if;
 raise notice 'PASS [ADS-029/048] 21-minute pinned reading retains exactly one genuine CTA click, not a late impression';
end $click_after_reading$;
reset role;

set local role anon;
do $issue_older$
declare t text;
begin
 t:=public.jb_ad_issue_view_ticket(
  '10000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000005',
  '40000000-0000-0000-0000-000000000005',repeat('1',32));
 perform set_config('b7.fixture_overlong_cta_token',t,true);
end $issue_older$;
reset role;
update public.ad_view_tickets
set issued_at=clock_timestamp()-interval '31 minutes',
    expires_at=clock_timestamp()-interval '28 minutes'
where token_hash=encode(extensions.digest(
 current_setting('b7.fixture_overlong_cta_token',true),'sha256'),'hex');
set local role anon;
do $overlong_click$
begin
 if public.jb_ad_record_ticket_click(
   current_setting('b7.fixture_overlong_cta_token',true))
 then raise exception 'STALE_CLICK_TOKEN_STILL_ACCEPTED';end if;
 raise notice 'PASS [ADS-050] over-30-minute stale click ticket rejected';
end $overlong_click$;
reset role;

do $ledger$
declare report jsonb; t text;cnt int;
begin
 t:=current_setting('b7.fixture_view_token',true);
 select count(*) into cnt from public.ad_events
 where event_type='impression' and qualified=true
   and campaign_id='30000000-0000-0000-0000-000000000005';
 if cnt<>1 then raise exception 'QUALIFIED_EVENT_NOT_SINGLE: %',cnt;end if;
 if exists(select 1 from public.ad_view_tickets
   where token_hash=t or nonce_hash=repeat('a',32))
 then raise exception 'RAW_VIEW_TOKEN_OR_NONCE_LEAKED';end if;
 report:=public.jb_ad_qualified_analytics_internal(
  '30000000-0000-0000-0000-000000000005');
 if (report->>'total')::int<>1 or (report->>'unverified_legacy')::int<>1
   or (report->>'today')::int<>1 or (report->>'clicks_verified')::int<>0
   or (report->>'clicks_reported')::int<>2
   or report->>'anti_bot_verified'<>'false'
 then raise exception 'OWNER_STATS_MIXED_RAW_WITH_QUALIFIED: %',report;end if;
 if exists(select 1 from information_schema.columns
   where table_schema='public' and table_name='ad_view_tickets'
    and column_name ~* 'ip|phone|email|viewer|user_agent|device') then
   raise exception 'VIEW_TICKET_COLLECTS_IDENTITY';end if;
 raise notice 'PASS [ADS-049/050] qualified event separated from legacy raw, no viewer identity, reach explicitly estimated';
end $ledger$;

set local role authenticated;
do $owner_only$
declare msg text;
begin
 perform set_config('b7.test_owner','',true);
 begin
  perform public.jb_ad_qualified_analytics_internal(
   '30000000-0000-0000-0000-000000000005');
  raise exception 'NONOWNER_CAN_READ_COMMERCIAL_STATS';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'OWNER_AAL2_REQUIRED' then
   raise exception 'OWNER_STATS_AUTHORITY_FAILED: %',msg;end if;
 end;
 raise notice 'PASS [ADS-050] commercial qualified analytics require Owner AAL2';
end $owner_only$;
reset role;

-- Existing pinned Article can still finish its legitimate view even if Owner
-- hid the campaign *after* its short-lived ticket was issued. New issuance
-- must be blocked for future openings by live eligibility.
select set_config('b7.test_owner','enabled',true);
set local role anon;
do $pin$
declare t text;
begin
 t:=public.jb_ad_issue_view_ticket(
  '10000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000005',
  '40000000-0000-0000-0000-000000000005',repeat('e',32));
 perform set_config('b7.fixture_hidden_token',t,true);
end $pin$;
reset role;
update public.ad_campaigns
set status='hidden',hidden_at=now()
where id='30000000-0000-0000-0000-000000000005';
set local role anon;
do $hide$
declare msg text;
begin
 begin
  perform public.jb_ad_issue_view_ticket(
   '10000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000005',
   '40000000-0000-0000-0000-000000000005',repeat('f',32));
  raise exception 'HIDDEN_AD_ISSUES_NEW_VIEW_TICKET';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'AD_VIEW_NOT_ELIGIBLE' then raise exception 'HIDE_GUARD_WRONG: %',msg;end if;
 end;
 raise notice 'PASS [ADS-019/049] hidden campaign cannot issue new tickets';
end $hide$;
reset role;

-- Expiry: direct fixture maintenance simulates previously expired token.
update public.ad_view_tickets
set issued_at=clock_timestamp()-interval '4 minutes',
    expires_at=clock_timestamp()-interval '1 minute'
where token_hash=encode(extensions.digest(
 current_setting('b7.fixture_hidden_token',true),'sha256'),'hex');
set local role anon;
do $expire$
begin
 if public.jb_ad_qualify_view_ticket(current_setting('b7.fixture_hidden_token',true))
 then raise exception 'EXPIRED_VIEW_TICKET_QUALIFIED';end if;
 raise notice 'PASS [ADS-050] expired ticket never counted, even when previously eligible';
end $expire$;
reset role;

do $final$
begin
 if (select count(*) from public.ad_view_tickets)<>4
 then raise exception 'TICKET_ISSUE_COUNT_WRONG';end if;
 if (select count(*) from public.ad_events where qualified=true)<>3
   or (select count(*) from public.ad_events where event_type='click' and qualified=true)<>2
 then raise exception 'QUALIFIED_COUNT_DUPLICATED';end if;
 if (select count(*) from public.articles where id='10000000-0000-0000-0000-000000000001')<>1
 then raise exception 'CANONICAL_ARTICLE_ID_CHANGED';end if;
 raise notice 'PASS [ADS-049/050] canonical Article/payment/event ledger preserved, no fake PASS and rollback';
end $final$;
rollback;
