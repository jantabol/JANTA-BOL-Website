\set ON_ERROR_STOP on
-- P4-T041 / ADS-051/055 — Synthetic unified B3 in-app wiring.
-- Uses disposable PostgreSQL, never messages real WhatsApp/email/push.
begin;

do $authority$
declare x text;
begin
 if has_function_privilege(
   'anon','private.b7_ad_emit_inapp_owner(text,text,text,text,boolean,text)'::regprocedure,'EXECUTE')
 then raise exception 'ANONYMOUS_NOTIFICATION_ADAPTER_EXPOSED';end if;
 if (select count(*) from public.live_notifications)<>0
 then raise exception 'FIXTURE_NOTIFICATION_BASELINE_NOT_EMPTY';end if;
 raise notice 'PASS [ADS-051] no parallel notification store and anon cannot execute private adapter';
end $authority$;

-- Founder notification for an ordinary public/anonymous ad enquiry.
insert into public.ad_campaigns(
 id,advertiser_id,status,placement,scope
) values('30000000-0000-0000-0000-000000000005',
 '00000000-0000-0000-0000-000000000001',
 'requested','article','global');

do $request$
begin
 if (select count(*) from public.live_notifications
    where domain='ads' and notification_type='ad_requested'
      and priority='HIGH' and action_required=true
      and record_id='30000000-0000-0000-0000-000000000005')<>1
 then raise exception 'NEW_AD_ENQUIRY_NOT_IN_B3_OWNER_QUEUE';end if;
 if exists(select 1 from public.live_notifications
    where recipient_user_id='22222222-2222-2222-2222-222222222222'
       or delivery_state<>'IN_APP_READY')
 then raise exception 'REVIEWER_OR_EXTERNAL_DELIVERY_FALSE_POSITIVE';end if;
 raise notice 'PASS [ADS-051] new request routes once to EXISTING Owner-only B3 in-app queue, not WhatsApp';
end $request$;

update public.ad_campaigns set status='review',
 updated_at=clock_timestamp()
where id='30000000-0000-0000-0000-000000000005';
update public.ad_campaigns set status='review',
 updated_at=clock_timestamp()
where id='30000000-0000-0000-0000-000000000005';

do $idempotent$
begin
 if (select count(*) from public.live_notifications
 where domain='ads' and notification_type='ad_review')<>1
 then raise exception 'REPEATED_UNCHANGED_STATUS_CREATED_DUPLICATE';end if;
 raise notice 'PASS [ADS-051] unchanged status does not spam Owner';
end $idempotent$;

update public.advertisers set verification_state='verified'
where id='00000000-0000-0000-0000-000000000002';
insert into public.ad_creatives(campaign_id,approved,creative_type,text_body)
values('30000000-0000-0000-0000-000000000005',true,'text',
 'Owner-approved fixture creative');

-- Reuse real B7 Owner manual quote/payment RPCs, no direct LIVE by fiat.
select set_config('b7.test_owner','enabled',true);
select public.jb_ad_set_approved_quote_internal(
 '30000000-0000-0000-0000-000000000001',
 50000,'SIGNED-NOTIFICATION-QUOTE-001');
select public.jb_ad_confirm_manual_payment_internal(
 '30000000-0000-0000-0000-000000000001',
 'SYNTHETIC-NOTIFY-UTR-001',50000,'upi',now(),
 'SYNTHETIC-BANK-SETTLEMENT-001',
 'SYNTHETIC-NONREFUND-ACCEPT-001',now(),
 'Owner checked fixture-only settlement, not real money','CONFIRM');
update public.ad_campaigns set status='live',updated_at=clock_timestamp()
where id='30000000-0000-0000-0000-000000000001';
update public.ad_campaigns set status='hidden',hidden_at=now(),updated_at=clock_timestamp()
where id='30000000-0000-0000-0000-000000000001';

insert into public.ad_renewal_requests(campaign_id,status)
values('30000000-0000-0000-0000-000000000001','pending');
update public.ad_renewal_requests set status='approved'
where campaign_id='30000000-0000-0000-0000-000000000001';
insert into public.ad_change_requests(campaign_id,status,request_text)
values('30000000-0000-0000-0000-000000000001','pending',
       'Request approval of new photo; no direct upload');
update public.ad_change_requests set status='accepted_for_work'
where campaign_id='30000000-0000-0000-0000-000000000001';

do $routing$
declare n int;
begin
 select count(*) into n from public.live_notifications where domain='ads';
 if n<>12 then raise exception 'AD_EVENTS_UNIFIED_NOTIFICATION_COUNT_BAD: %',n;end if;
 if not exists(select 1 from public.live_notifications
   where notification_type='ad_payment_confirmed'
     and domain='ads' and record_type='ad_payment') then
  raise exception 'MANUAL_PAYMENT_NOTICE_MISSING';end if;
 if not exists(select 1 from public.live_notifications
   where notification_type='ad_live' and priority='NORMAL') then
  raise exception 'LIVE_NOTICE_MISSING';end if;
 if not exists(select 1 from public.live_notifications
   where notification_type='ad_hidden'
     and priority='HIGH' and action_required) then
  raise exception 'OWNER_EMERGENCY_HIDE_NOTICE_MISSING';end if;
 if not exists(select 1 from public.live_notifications
   where notification_type='ad_renewal_requested'
     and priority='HIGH' and action_required) then
  raise exception 'PENDING_RENEWAL_QUEUE_MISSING';end if;
 if not exists(select 1 from public.live_notifications
   where notification_type='ad_change_requested'
     and priority='HIGH' and action_required) then
  raise exception 'CHANGE_REQUEST_QUEUE_MISSING';end if;
 if not exists(select 1 from public.live_notifications
   where notification_type='ad_verified' and priority='HIGH') then
  raise exception 'ADVERTISER_VERIFY_NOTICE_MISSING';end if;
 if exists(select 1 from public.live_notifications
    where safe_message ~* 'phone|UTR|password|payment_ref|token|whatsapp.*sent'
      or metadata ? 'contact' or metadata ? 'secret'
      or action_path<>'ads.html'
      or recipient_user_id<>'11111111-1111-1111-1111-111111111111')
 then raise exception 'OWNER_NOTIFICATION_PRIVACY_OR_EXTERNAL_SENT_CLAIM';end if;
 raise notice 'PASS [ADS-051] twelve routed existing-B3 events: request, review, verification, creative, paid, live, hidden, change/renewal';
end $routing$;

-- Notification outage cannot deny a new ad request (or News);
-- and no receipt/external delivery may be falsely claimed.
select set_config('b7.test_notify_down','yes',true);
insert into public.ad_campaigns(
 id,advertiser_id,status,placement,scope
) values('30000000-0000-0000-0000-000000000006',
 '00000000-0000-0000-0000-000000000001',
 'requested','article','global');
do $failure$
begin
 if (select count(*) from public.ad_campaigns
   where id='30000000-0000-0000-0000-000000000006')<>1
 then raise exception 'NOTIFICATION_OUTAGE_BLOCKED_AD_REQUEST';end if;
 if (select count(*) from public.live_notifications where domain='ads')<>12
 then raise exception 'FAKE_NOTIFICATION_ON_PROVIDER_DOWN';end if;
 if not exists(select 1 from public.audit_logs
   where action='ad_notification_failed'
     and record_type='ad_campaign'
     and record_id='30000000-0000-0000-0000-000000000006'
     and metadata->>'delivery'='NOT_CONFIRMED'
     and metadata->>'retry'='OWNER_REVIEW_REQUIRED'
     and length(metadata->>'sqlstate')=5)
 then raise exception 'NOTIFICATION_FAILURE_AUDIT_MISSING';end if;
 raise notice 'PASS [ADS-055] B3 notification outage leaves ad request intact; audited NOT_CONFIRMED, no fake WhatsApp receipt';
end $failure$;
select set_config('b7.test_notify_down','',true);


-- ADS-055: Founder can recover the failed in-app notification using its
-- existing immutable audit ID, without inventing a WhatsApp SENT receipt.
do $retry$
declare id bigint;rows jsonb;msg text;n int;
begin
 select a.id into id from public.audit_logs a
 where a.action='ad_notification_failed'
   and a.record_id='30000000-0000-0000-0000-000000000006';
 if id is null then raise exception 'MISSING_NOTIFICATION_FAILURE_TO_RETRY';end if;

 -- First prove the still-broken B3 service cannot be falsely acknowledged.
 perform set_config('b7.test_notify_down','yes',true);
 begin
  perform public.jb_ad_notification_retry_internal(id);
  raise exception 'FAILED_DELIVERY_RETRY_WAS_ACKNOWLEDGED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'SIMULATED_B3_NOTIFICATION_DOWN' then
    raise exception 'RETRY_OUTAGE_FAIL_CLOSED_WRONG: %',msg;end if;
 end;
 if exists(select 1 from public.audit_logs
  where action='ad_notification_retry_succeeded'
    and metadata->>'original_failure_id'=id::text)
 then raise exception 'FALSE_IN_APP_DELIVERY_RECEIPT';end if;
 perform set_config('b7.test_notify_down','',true);

 rows:=public.jb_ad_notification_failures_internal();
 if jsonb_array_length(rows)<>1 or (rows->0->>'audit_id')::bigint<>id
 then raise exception 'OWNER_FAILED_NOTIFICATION_QUEUE_WRONG: %',rows;end if;
 if not public.jb_ad_notification_retry_internal(id) then
   raise exception 'OWNER_RETRY_FAILED';end if;
 if not public.jb_ad_notification_retry_internal(id) then
   raise exception 'IDEMPOTENT_SECOND_RETRY_FAILED';end if;
 select count(*) into n from public.live_notifications where domain='ads';
 if n<>13 then raise exception 'OWNER_RETRY_CREATED_DUPLICATE_OR_MISSING_NOTICE: %',n;end if;
 if (select count(*) from public.audit_logs
     where action='ad_notification_retry_succeeded'
       and metadata->>'original_failure_id'=id::text)<>1
 then raise exception 'RETRY_AUDIT_MISSING_OR_DUPLICATE';end if;
 if jsonb_array_length(public.jb_ad_notification_failures_internal())<>0
 then raise exception 'RECOVERED_FAILURE_STILL_IN_QUEUE';end if;
 if not exists(select 1 from public.live_notifications
   where record_id='30000000-0000-0000-0000-000000000006'
     and notification_type='ad_requested'
     and delivery_state='IN_APP_READY') then
  raise exception 'RECOVERED_INAPP_AD_REQUEST_NOT_DELIVERED';end if;
 raise notice 'PASS [ADS-055] Owner audited retry eventually creates 1 B3 in-app notice; no WhatsApp SENT, 2nd retry idempotent';

 perform set_config('b7.test_owner','',true);
 begin
  perform public.jb_ad_notification_failures_internal();
  raise exception 'AAL1_CAN_SEE_AD_NOTIFICATION_FAILURES';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'OWNER_AAL2_REQUIRED' then
    raise exception 'NONOWNER_FAILURE_LIST_NOT_DENIED: %',msg;end if;
 end;
 begin
  perform public.jb_ad_notification_retry_internal(id);
  raise exception 'AAL1_CAN_RETRY_AD_NOTIFICATION';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'OWNER_AAL2_REQUIRED' then
    raise exception 'NONOWNER_RETRY_NOT_DENIED: %',msg;end if;
 end;
 raise notice 'PASS [ADS-054/055] only Owner with AAL2 can inspect and retry failed ad notifications';
 perform set_config('b7.test_owner','enabled',true);
end $retry$;

do $preservation$
begin
 if (select count(*) from public.ad_payments where status='confirmed')<>1
    or (select count(*) from public.ad_campaigns
          where id='30000000-0000-0000-0000-000000000001'
            and status='hidden')<>1
 then raise exception 'NOTIFICATION_TRIGGER_CHANGED_PAYMENT_OR_OWNER_HIDE';end if;
 if exists(select 1 from public.live_notifications where delivery_state<>'IN_APP_READY')
 then raise exception 'AUTO_EXTERNAL_NOTIFICATION_DELIVERY_CLAIM';end if;
 raise notice 'PASS [ADS-055] payment, campaign status, prior News/P3 source and in-app-only labels preserved';
end $preservation$;

rollback;
