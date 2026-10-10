\set ON_ERROR_STOP on
begin;
do $test$
declare msg text;c uuid:='30000000-0000-0000-0000-000000000001'::uuid;
begin
 begin
  perform public.jb_ad_set_approved_quote_internal(c,50000,'QUOTE-AGREED-001');
  raise exception 'NON_OWNER_QUOTE_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'OWNER_AAL2_REQUIRED' then raise exception 'OWNER_QUOTE_GUARD_FAILED: %',msg;end if;
 end;
 if (select agreed_price_minor from public.ad_campaigns where id=c) is not null
 then raise exception 'NON_OWNER_WRITE_OCCURRED';end if;
 begin
  perform public.jb_ad_confirm_manual_payment_internal(
   c,'UTR-00000001',50000,'upi',now(),'BANK-REF-001',
   'WHATSAPP-ACCEPTED-001',now(),'Checked independent bank settlement','CONFIRM');
  raise exception 'NON_OWNER_PAYMENT_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'OWNER_AAL2_REQUIRED' then raise exception 'OWNER_PAYMENT_GUARD_FAILED: %',msg;end if;
 end;
 raise notice 'PASS [ADS-035] no quote/payment without Owner recent AAL2';
end $test$;

select set_config('b7.test_owner','enabled',true);
select public.jb_ad_set_approved_quote_internal(
 '30000000-0000-0000-0000-000000000001'::uuid,50000,'QUOTE-AGREED-001');
select public.jb_ad_set_approved_quote_internal(
 '30000000-0000-0000-0000-000000000002'::uuid,28000,'QUOTE-HIGH-002');
select public.jb_ad_set_approved_quote_internal(
 '30000000-0000-0000-0000-000000000003'::uuid,50000,'QUOTE-SECOND-003');

do $test$
declare msg text;c uuid:='30000000-0000-0000-0000-000000000001'::uuid;
begin
 begin
  perform public.jb_ad_set_approved_quote_internal(c,40000,'QUOTE-CHANGE-999');
  raise exception 'PACKAGE_PRICE_CHANGED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'PACKAGE_SNAPSHOT_PRICE_MISMATCH' then raise exception 'WRONG_PACKAGE_GUARD: %',msg;end if;
 end;
 begin
  perform public.jb_ad_confirm_manual_payment_internal(
   c,'UTR-00000001',50000,'upi',now(),'BANK-REF-001',
   'WHATSAPP-ACCEPTED-001',now(),'Checked independent bank settlement','confirm');
  raise exception 'MISSING_CONFIRM_TEXT_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'EXPLICIT_CONFIRM_REQUIRED' then raise exception 'CONFIRM_GUARD_WRONG: %',msg;end if;
 end;
 begin
  insert into public.ad_payments(campaign_id,provider_ref,status,amount_minor,currency)
  values(c,'LEGACY-UTR-000001','confirmed',50000,'INR');
  raise exception 'LEGACY_DIRECT_CONFIRMED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'MANUAL_PAYMENT_EVIDENCE_REQUIRED' then raise exception 'LEGACY_GUARD_WRONG: %',msg;end if;
 end;
 begin
  insert into public.ad_payments(
   campaign_id,provider_ref,status,amount_minor,currency,
   method,receipt_at,evidence_ref,acceptance_ref,terms_accepted_at,
   verified_by,verified_at,verification_note
  ) values(
   c,'NULL-METHOD-00001','confirmed',50000,'INR',
   null,now(),'BANK-REF-001','WHATSAPP-ACCEPTED-001',now(),
   auth.uid(),now(),'Checked independent bank settlement'
  );
  raise exception 'NULL_METHOD_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'MANUAL_PAYMENT_EVIDENCE_REQUIRED' then raise exception 'NULL_METHOD_GUARD_FAILED: %',msg;end if;
 end;
 begin
  perform public.jb_ad_confirm_manual_payment_internal(
   c,'UTR-OLD-ACCEPT',50000,'upi',now(),'BANK-REF-001',
   'EARLY-ACCEPT-001',now()-interval '1 day','Checked independent bank settlement','CONFIRM');
  raise exception 'PRE_QUOTE_ACCEPTANCE_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'TERMS_ACCEPTANCE_CHRONOLOGY_INVALID' then raise exception 'CONSENT_CHRONOLOGY_GUARD_FAILED: %',msg;end if;
 end;
 begin
  perform public.jb_ad_confirm_manual_payment_internal(
   c,'UTR-00000001',50000,'upi',now(),'BANK-REF-001',
   '',now(),'Checked independent bank settlement','CONFIRM');
  raise exception 'MISSING_ACCEPTANCE_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'MANUAL_PAYMENT_EVIDENCE_REQUIRED' then raise exception 'ACCEPTANCE_GUARD_WRONG: %',msg;end if;
 end;
 begin
  perform public.jb_ad_confirm_manual_payment_internal(
   c,'UTR-00000001',55000,'upi',now(),'BANK-REF-001',
   'WHATSAPP-ACCEPTED-001',now(),'Checked independent bank settlement','CONFIRM');
  raise exception 'PRICE_MISMATCH_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'APPROVED_PRICE_TERMS_MISMATCH' then raise exception 'PRICE_GUARD_WRONG: %',msg;end if;
 end;
 begin
  perform public.jb_ad_confirm_manual_payment_internal(
   '30000000-0000-0000-0000-000000000002','HIGH-UTR-0001',28000,'bank',now(),'BANK-REF-HIGH',
   'WHATSAPP-ACCEPTED-HIGH',now(),'High-risk pending real identity check','CONFIRM');
  raise exception 'HIGH_RISK_UNVERIFIED_PAID';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'ADVERTISER_VERIFICATION_REQUIRED' then raise exception 'HIGH_RISK_GUARD_WRONG: %',msg;end if;
 end;
 begin
  update public.ad_campaigns set status='live' where id=c;
  raise exception 'UNPAID_GOES_LIVE';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'AD_NOT_ELIGIBLE_FOR_LIVE' then raise exception 'LIVE_GUARD_WRONG: %',msg;end if;
 end;
 if (select count(*) from public.ad_payments)<>0 or
    (select count(*) from public.ad_campaigns where status='live')<>0
 then raise exception 'NEGATIVE_CASE_LEFT_PAYMENTS_OR_LIVE';end if;
 raise notice 'PASS [ADS-035/036/038/039] no evidence, no explicit CONFIRM, price mismatch, high-risk or unpaid LIVE';
end $test$;

select public.jb_ad_confirm_manual_payment_internal(
 '30000000-0000-0000-0000-000000000001',
 'UTR-00000001',50000,'upi',now(),'BANK-REF-001',
 'WHATSAPP-ACCEPTED-001',now(),'Owner checked independent bank ledger receipt','CONFIRM');

do $test$
declare c uuid:='30000000-0000-0000-0000-000000000001'::uuid;msg text;
begin
 if not exists(select 1 from public.ad_campaigns a
    join public.ad_payments p on p.campaign_id=a.id
    where a.id=c and a.status='paid' and a.paid_at is not null
      and p.status='confirmed' and p.amount_minor=50000
      and p.method='upi' and p.evidence_ref='BANK-REF-001'
      and p.acceptance_ref='WHATSAPP-ACCEPTED-001'
      and a.non_refund_accepted_at=p.terms_accepted_at
 ) then raise exception 'MANUAL_PAYMENT_RECEIPT_BROKEN';end if;
 begin
  update public.ad_payments set status='failed' where campaign_id=c;
  raise exception 'CONFIRMED_DEMOTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'CONFIRMED_PAYMENT_IMMUTABLE' then raise exception 'IMMUTABLE_FAILED: %',msg;end if;
 end;
 begin
  delete from public.ad_payments where campaign_id=c;
  raise exception 'CONFIRMED_DELETED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'CONFIRMED_PAYMENT_IMMUTABLE' then raise exception 'DELETE_GUARD_FAILED: %',msg;end if;
 end;
 begin
  perform public.jb_ad_confirm_manual_payment_internal(
   '30000000-0000-0000-0000-000000000003','UTR-00000001',50000,'upi',now(),
   'BANK-REF-OTHER','WHATSAPP-ACCEPTED-OTHER',now(),'Independent bank ledger checked again','CONFIRM');
  raise exception 'DUPLICATE_UTR_REPLAYED';
 exception when unique_violation then
  null;  -- exact duplicate UTR unique index, no silent overwrite.
 end;
 if (select count(*) from public.ad_payments where status='confirmed')<>1
 then raise exception 'DUPLICATE_INSERTED';end if;
 if (select count(*) from public.audit_logs where action='ad_payment_confirmed')<>1
 then raise exception 'PAYMENT_AUDIT_MISSING';end if;
 raise notice 'PASS [ADS-037/039] Owner confirmed one evidence-linked immutable receipt, duplicate blocked';
end $test$;

-- Valid paid content never shows before its purchased start timestamp.
update public.ad_campaigns
set starts_at=now()+interval '1 hour'
where id='30000000-0000-0000-0000-000000000001';
do $test$
declare msg text;
begin
 begin
  update public.ad_campaigns set status='live'
   where id='30000000-0000-0000-0000-000000000001';
  raise exception 'FUTURE_START_EXPOSED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'AD_NOT_ELIGIBLE_FOR_LIVE'
  then raise exception 'START_GUARD_WRONG: %',msg;end if;
 end;
 if (select status from public.ad_campaigns
    where id='30000000-0000-0000-0000-000000000001')<>'paid'
 then raise exception 'EARLY_LIVE_MUTATION';end if;
 raise notice 'PASS [ADS-040] future schedule cannot show paid campaign';
end $test$;

update public.ad_campaigns set starts_at=now()-interval '1 minute'
 where id='30000000-0000-0000-0000-000000000001';
update public.ad_campaigns set status='live'
 where id='30000000-0000-0000-0000-000000000001';
do $test$
begin
 if (select status from public.ad_campaigns
   where id='30000000-0000-0000-0000-000000000001')<>'live'
 then raise exception 'VALID_LIVE_FAILED';end if;
 if (select count(*) from public.audit_logs where action='ad_quote_agreed')<>3
 then raise exception 'QUOTE_AUDIT_MISSING';end if;
 raise notice 'PASS [ADS-040] valid Owner-approved paid scheduled campaign reaches LIVE only at server-valid time (synthetic)';
end $test$;

-- RPC cannot be directly executed by anonymous browser.
set local role anon;
do $anon$
declare msg text;
begin
 begin
  perform public.jb_ad_confirm_manual_payment_internal(
   '30000000-0000-0000-0000-000000000001','FORGED-UTR',50000,'upi',now(),
   'FORGED-EVIDENCE','FORGED-ACCEPT',now(),'Unauthorised actor tried payment','CONFIRM');
  raise exception 'ANONYMOUS_PAY_BYPASS';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg not like '%permission denied%' then
   raise exception 'ANON_PAYMENT_GUARD_WRONG: %',msg;end if;
 end;
end $anon$;
reset role;

rollback;
