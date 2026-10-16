\set ON_ERROR_STOP on
-- P4-T037 ADS026/027 CP02: REAL disposable PostgreSQL 17 Owner quote
-- approval freeze, independent of any real commercial/credit receipts.
-- Uses original b7-payment-fixture + original manual-payment REVIEW SQL.
-- This test initially RED against the old reviewed function, then GREEN
-- after minimum-safe quote guard. NEVER runs against production.
begin;
do $nonowner$
declare cid uuid:='30000000-0000-0000-0000-000000000003',msg text;
begin
 begin
  perform public.jb_ad_set_approved_quote_internal(cid,68000,'SIGNED-MULTIDISTRICT-QUOTE-1');
  raise exception 'NONOWNER_CUSTOM_QUOTE_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg <> 'OWNER_AAL2_REQUIRED' then raise exception 'BAD_OWNER_QUOTE_DENIAL %',msg;end if;
 end;
 if exists(select 1 from public.ad_history where campaign_id=cid and event_type='manual_quote_agreed')
 then raise exception 'NONOWNER_CREATED_QUOTE_HISTORY';end if;
 raise notice 'T037 CP02 PASS nonowner custom quote denied without history';
end $nonowner$;
select set_config('b7.test_owner','enabled',true);
do $approved_custom$
declare cid uuid:='30000000-0000-0000-0000-000000000003';
 amt bigint;term text;stamp timestamptz;hc int;ac int;msg text;
begin
 if (select package_id from public.ad_campaigns where id=cid) is not null
 then raise exception 'CUSTOM_QUOTE_FIXTURE_IS_PACKAGE_BOUND';end if;
 perform public.jb_ad_set_approved_quote_internal(
 cid,68000,'SIGNED-MULTIDISTRICT-QUOTE-1');
 select agreed_price_minor,agreed_terms_ref,agreed_terms_recorded_at
 into amt,term,stamp from public.ad_campaigns where id=cid;
 if amt<>68000 or term<>'SIGNED-MULTIDISTRICT-QUOTE-1' or stamp is null
 then raise exception 'FIRST_APPROVED_CUSTOM_QUOTE_NOT_PERSISTED';end if;
 select count(*) into hc from public.ad_history
 where campaign_id=cid and event_type='manual_quote_agreed';
 select count(*) into ac from public.audit_logs
 where record_id=cid::text and action='ad_quote_agreed';
 begin
  perform public.jb_ad_set_approved_quote_internal(
  cid,99000,'FORGED-DIFFERENT-TERMS-2');
  raise exception 'APPROVED_QUOTE_CHANGED_BEFORE_PAYMENT';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg <> 'APPROVED_QUOTE_IMMUTABLE'
  then raise exception 'QUOTE_GUARD_MISMATCH: %',msg;end if;
 end;
 if (select row(agreed_price_minor,agreed_terms_ref,agreed_terms_recorded_at)
 from public.ad_campaigns where id=cid)
 is distinct from row(amt,term,stamp)
 then raise exception 'APPROVED_QUOTE_TERMS_OR_TIME_CHANGED';end if;
 if (select count(*) from public.ad_history
 where campaign_id=cid and event_type='manual_quote_agreed')<>hc
 or (select count(*) from public.audit_logs
 where record_id=cid::text and action='ad_quote_agreed')<>ac
 then raise exception 'REQUOTE_DUPLICATE_HISTORY_AUDIT';end if;
 raise notice 'T037 CP02 PASS initial custom quote approved and reprice/reterms blocked with immutable terms/history';
end $approved_custom$;
do $packaged$
declare cid uuid:='30000000-0000-0000-0000-000000000001';msg text;amt bigint;
begin
 perform public.jb_ad_set_approved_quote_internal(cid,50000,'SIGNED-PACKAGE-QUOTE-1');
 select agreed_price_minor into amt from public.ad_campaigns where id=cid;
 begin
  perform public.jb_ad_set_approved_quote_internal(cid,65000,'CHANGE-PACKAGE-PRICE-2');
  raise exception 'PACKAGE_PRICE_SNAPSHOT_REPLACED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg <> 'PACKAGE_SNAPSHOT_PRICE_MISMATCH'
  then raise exception 'PACKAGE_SNAPSHOT_DENIAL_CHANGED: %',msg;end if;
 end;
 begin
  perform public.jb_ad_set_approved_quote_internal(cid,50000,'CHANGE-PACKAGE-TERMS-2');
  raise exception 'PACKAGE_TERMS_CHANGED_WITH_SAME_PRICE';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg <> 'APPROVED_QUOTE_IMMUTABLE'
  then raise exception 'PACKAGE_TERMS_DENIAL_WRONG: %',msg;end if;
 end;
 if (select agreed_price_minor from public.ad_campaigns where id=cid)<>amt
 then raise exception 'OLD_PACKAGE_QUOTE_REWRITTEN';end if;
 raise notice 'T037 CP02 PASS original package price snapshot and old signed terms frozen';
end $packaged$;
do $draft_review$
declare cid uuid:='30000000-0000-0000-0000-000000000004';amt bigint;
begin
 -- Requested/proposal can still be negotiated before Owner approval.
 perform public.jb_ad_set_approved_quote_internal(cid,30000,'NEGOTIATION-TERMS-0001');
 perform public.jb_ad_set_approved_quote_internal(cid,32000,'NEGOTIATION-TERMS-0002');
 select agreed_price_minor into amt from public.ad_campaigns where id=cid;
 if amt<>32000 then raise exception 'PRE_APPROVAL_NEGOTIATION_BROKEN';end if;
 update public.ad_campaigns set status='approved' where id=cid;
 begin
  perform public.jb_ad_set_approved_quote_internal(cid,33000,'POST-APPROVAL-CHANGE');
  raise exception 'APPROVED_NEGOTIATION_WAS_MUTATED';
 exception when others then
  if sqlerrm <> 'APPROVED_QUOTE_IMMUTABLE'
  then raise exception 'POST_APPROVAL_NEGATIVE_MISMATCH: %',sqlerrm;end if;
 end;
 if (select agreed_price_minor from public.ad_campaigns where id=cid)<>32000
 then raise exception 'PENDING_TERMS_CHANGED_AFTER_APPROVAL';end if;
 raise notice 'T037 CP02 PASS negotiation reprice before approval, no silent repricing after';
end $draft_review$;
rollback;
