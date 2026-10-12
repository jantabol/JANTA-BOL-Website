\set ON_ERROR_STOP on
-- Real PostgreSQL 17, disposable DB only; OFFICIAL BE07 not final E7.
begin;
do $deny_owner$
declare msg text;
begin
 begin
  update public.ad_campaigns set status='live'
  where id='30000000-0000-0000-0000-000000000001';
  raise exception 'UNAUTHORIZED_DIRECT_LIVE';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'OWNER_AAL2_REQUIRED' then
   raise exception 'OWNER_BLOCK_FAILED: %',msg;end if;
 end;
end $deny_owner$;
select set_config('b7.test_owner','enabled',false);

-- Regression must NEVER disable/reorder original B7 payment LIVE guard.
do $triggers$
begin
 if not exists(select 1 from pg_trigger
  where tgrelid='public.ad_campaigns'::regclass
   and tgname='b7_guard_campaign_live' and not tgisinternal)
   or not exists(select 1 from pg_trigger
  where tgrelid='public.ad_campaigns'::regclass
   and tgname='b7_verified_state_guard' and not tgisinternal)
 then raise exception 'B7_BOTH_LIVE_DEFENSES_REQUIRED';end if;
end $triggers$;

-- Direct LIVE from approved must remain denied, regardless of paid flags.
-- PostgreSQL fires preexisting alphabetical b7_guard_campaign_live first:
-- its AD_NOT_ELIGIBLE_FOR_LIVE is correct older safety, not a bypass.
do $source_state$
declare msg text;
begin
 begin
  update public.ad_campaigns set status='live'
   where id='30000000-0000-0000-0000-000000000003';
  raise exception 'LIVE_FROM_APPROVED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg not in('B7_LIVE_INVALID_SOURCE_STATE','AD_NOT_ELIGIBLE_FOR_LIVE') then
   raise exception 'SOURCE_STATE_NOT_GATED: %',msg;end if;
 end;
end $source_state$;

-- High-risk advertiser pending verification cannot become approved.
do $risk$
declare msg text;
begin
 begin
  update public.ad_campaigns set status='approved'
  where id='30000000-0000-0000-0000-000000000002';
  -- Existing status already 'approved'; exercise status transition.
  update public.ad_campaigns set status='review'
  where id='30000000-0000-0000-0000-000000000002';
  update public.ad_campaigns set status='approved'
  where id='30000000-0000-0000-0000-000000000002';
  raise exception 'PENDING_VERIFICATION_APPROVED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_ADVERTISER_NOT_VERIFIED' then
   raise exception 'VERIFICATION_NOT_GATED: %',msg;end if;
 end;
end $risk$;

-- A requested campaign without a creative cannot be promoted by status only.
do $no_creative$
declare msg text;
begin
 begin
  update public.ad_campaigns
  set status='approved',approved_by=auth.uid(),approved_at=now()
  where id='30000000-0000-0000-0000-000000000004';
  raise exception 'MISSING_CREATIVE_APPROVED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_VERIFIED_TEXT_CREATIVE_REQUIRED' then
   raise exception 'CREATIVE_NOT_GATED: %',msg;end if;
 end;
end $no_creative$;

-- Positive fixture: existing verified campaign + approved text + REAL
-- structured synthetic receipt, Owner AAL2, configured quote and time.
select public.jb_ad_set_approved_quote_internal(
 '30000000-0000-0000-0000-000000000001',50000,'QUOTE-B7-REVIEW-001');
-- CI-only synthetic timeline: simulate quotation written earlier.
update public.ad_campaigns
set agreed_terms_recorded_at=now()-interval '30 minutes'
where id='30000000-0000-0000-0000-000000000001';
select public.jb_ad_confirm_manual_payment_internal(
 '30000000-0000-0000-0000-000000000001',
 'SANDBOX-UTR-20261012-01',50000,'upi',
 now()-interval '3 minutes','SANDBOX-RECEIPT-001',
 'SANDBOX-ACCEPT-001',now()-interval '10 minutes',
 'CI isolated validated receipt evidence only','CONFIRM');

-- Forged paid date alone cannot convert another campaign to LIVE.
do $fake_paid$
declare msg text;
begin
 begin
  update public.ad_campaigns
  set status='live',paid_at=now(),
      non_refund_accepted_at=now(),agreed_price_minor=50000,
      agreed_terms_ref='FORGED-AGREEMENT-123',
      agreed_terms_recorded_at=now()
  where id='30000000-0000-0000-0000-000000000003';
  raise exception 'FORGED_CAMPAIGN_PAID';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_LIVE_INVALID_SOURCE_STATE' then
   raise exception 'FORGED_STATE_NOT_DENIED: %',msg;end if;
 end;
end $fake_paid$;

do $verified_live$
declare v_before int;v_after int;
begin
 select count(*) into v_before from public.ad_history;
 update public.ad_campaigns set status='live'
  where id='30000000-0000-0000-0000-000000000001';
 if (select status from public.ad_campaigns
  where id='30000000-0000-0000-0000-000000000001')<>'live'
 then raise exception 'VALID_VERIFIED_TEXT_AD_NOT_LIVE';end if;
 -- Pause and resume must remain possible with the same real paid receipt.
 update public.ad_campaigns set status='paused'
  where id='30000000-0000-0000-0000-000000000001';
 update public.ad_campaigns set status='live'
  where id='30000000-0000-0000-0000-000000000001';
 update public.ad_campaigns set status='hidden'
  where id='30000000-0000-0000-0000-000000000001';
 if (select status from public.ad_campaigns
  where id='30000000-0000-0000-0000-000000000001')<>'hidden'
 then raise exception 'SAFETY_HIDE_BLOCKED';end if;
 raise notice 'PASS BE07 disposable PG: verified text receipt gates, pause and hide preserved';
end $verified_live$;

-- Future/expired schedule cannot become LIVE by manual timestamp edit.
do $expired$
declare msg text;
begin
 update public.ad_campaigns set status='paused'
 where id='30000000-0000-0000-0000-000000000001';
 begin
  update public.ad_campaigns set status='live',ends_at=now()-interval '1 second'
  where id='30000000-0000-0000-0000-000000000001';
  raise exception 'EXPIRED_AD_LIVE';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'AD_NOT_ELIGIBLE_FOR_LIVE' and
     msg<>'B7_LIVE_TERMS_OR_SCHEDULE_MISSING' then
   raise exception 'EXPIRED_GUARD_WRONG: %',msg;end if;
 end;
end $expired$;
rollback;
