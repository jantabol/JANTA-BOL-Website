\set ON_ERROR_STOP on
-- P4-T041: REAL EXISTING B3 SQL migrations (not the separate shim).
-- Disposable PostgreSQL 17, all changes rolled back, no provider send.
begin;
do $source$
begin
 if not exists (
  select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='jb_notification_emit_internal'
    and p.prosrc like '%RECIPIENT_REVOKED%'
    and p.prosrc like '%notification_delivery_history%'
    and p.prosrc like '%record_retention_state%'
    and p.prosrc like '%UNSAFE_NOTIFICATION_CONTENT%'
 ) then raise exception 'NOT_RUNNING_ACTUAL_B3_EMITTER_SOURCE';end if;
 if not exists(select 1 from public.record_retention_policies
  where policy_key='notification_history_v1'
    and domain='notifications' and record_type='notification_history'
    and active and automatic_disposition=false)
 then raise exception 'B3_NOTIFICATION_HISTORY_POLICY_MISSING';end if;
 if has_function_privilege('anon',
   'public.jb_notification_emit_internal(uuid,text,text,text,text,text,text,text,boolean,text,text,jsonb)',
   'EXECUTE') then raise exception 'B3_INTERNAL_EMITTER_EXPOSED_TO_ANON';end if;
 raise notice 'PASS [B7-B3 REAL SQL] repo migration 005 emitter with B3 historical policy, not stub';
end $source$;

insert into public.ad_campaigns(id,advertiser_id,status,placement,scope)
values('30000000-0000-0000-0000-000000000005',
       '00000000-0000-0000-0000-000000000001',
       'requested','article','global');

do $full_b3$
declare v_id bigint;
begin
 select id into v_id from public.live_notifications
 where domain='ads' and record_id='30000000-0000-0000-0000-000000000005'
   and notification_type='ad_requested';
 if v_id is null then raise exception 'B7_REQUEST_MISSING_IN_REAL_B3';end if;
 if not exists(select 1 from public.live_notifications
    where id=v_id and recipient_user_id='11111111-1111-1111-1111-111111111111'
     and priority='HIGH' and consequence='ATTENTION'
     and lifecycle_state='ACTION_REQUIRED' and action_required=true
     and delivery_state='IN_APP_READY' and action_path='ads.html'
     and metadata->>'delivery'='IN_APP_ONLY')
 then raise exception 'REAL_B3_LIFECYCLE_OR_PRIORITY_CONTRACT_BROKEN';end if;
 if (select count(*) from public.notification_delivery_history
    where notification_id=v_id and event='EMITTED'
      and channel='IN_APP' and delivery_state='IN_APP_READY')<>1
 then raise exception 'REAL_B3_DELIVERY_HISTORY_NOT_WRITTEN';end if;
 if (select count(*) from public.record_retention_state
    where domain='notifications' and record_type='notification_history'
     and record_id=v_id::text and policy_key='notification_history_v1'
     and lifecycle_state='active')<>1
 then raise exception 'REAL_B3_NOTIFICATION_RETENTION_NOT_REGISTERED';end if;
 raise notice 'PASS [ADS-051/053] original B3 emitter wrote inbox + IN_APP history + retention state';
end $full_b3$;

-- Same status/transaction must never leak duplicate EMITTED deliveries.
update public.ad_campaigns set updated_at=clock_timestamp()
where id='30000000-0000-0000-0000-000000000005';
do $no_spam$
begin
 if (select count(*) from public.live_notifications
    where domain='ads' and record_id='30000000-0000-0000-0000-000000000005')<>1
   or (select count(*) from public.notification_delivery_history
       where channel='IN_APP' and event='EMITTED')<>1
 then raise exception 'REAL_B3_DUPLICATED_UNCHANGED_AD_STATUS';end if;
 raise notice 'PASS [ADS-051] unchanged campaign cannot spam real B3 in-app/history';
end $no_spam$;

-- Suspended team account: original B3 raises RECIPIENT_REVOKED, B7
-- captures NOT_CONFIRMED and never blocks the public advertisement enquiry.
update public.team_accounts set status='suspended'
where user_id='11111111-1111-1111-1111-111111111111';
insert into public.ad_campaigns(id,advertiser_id,status,placement,scope)
values('30000000-0000-0000-0000-000000000006',
       '00000000-0000-0000-0000-000000000001',
       'requested','article','global');
do $suspended$
declare v_failure_id bigint;
begin
 select id into v_failure_id from public.audit_logs
 where action='ad_notification_failed'
  and record_id='30000000-0000-0000-0000-000000000006'
  and metadata->>'delivery'='NOT_CONFIRMED';
 if v_failure_id is null then
  raise exception 'REAL_B3_SUSPENDED_RECIPIENT_NOT_AUDITED';end if;
 if exists(select 1 from public.live_notifications
    where record_id='30000000-0000-0000-0000-000000000006')
 then raise exception 'REAL_B3_SENT_TO_REVOKED_RECIPIENT';end if;
 if not exists(select 1 from public.ad_campaigns
    where id='30000000-0000-0000-0000-000000000006' and status='requested')
 then raise exception 'REAL_B3_REVOKE_CANCELLED_NEWS_OR_ENQUIRY';end if;
 raise notice 'PASS [ADS-054/055] live-equivalent B3 revoked recipient denied, enquiry unchanged, failure audited';
end $suspended$;

-- An Owner AAL2 retry after test reactivation must produce B3's true
-- separate notification_delivery_history and retention receipt, and no
-- alleged external delivery.
update public.team_accounts set status='active'
where user_id='11111111-1111-1111-1111-111111111111';
select set_config('b7.test_owner','enabled',true);
do $retry$
declare v_failure_id bigint;v_id bigint;
begin
 select id into v_failure_id from public.audit_logs
 where action='ad_notification_failed'
  and record_id='30000000-0000-0000-0000-000000000006';
 if not public.jb_ad_notification_retry_internal(v_failure_id)
 then raise exception 'REAL_B3_OWNER_RETRY_UNCONFIRMED';end if;
 if not public.jb_ad_notification_retry_internal(v_failure_id)
 then raise exception 'REAL_B3_OWNER_RETRY_NOT_IDEMPOTENT';end if;
 select id into v_id from public.live_notifications
 where domain='ads' and record_id='30000000-0000-0000-0000-000000000006';
 if v_id is null then raise exception 'REAL_B3_RECOVERED_INBOX_MISSING';end if;
 if (select count(*) from public.notification_delivery_history
    where notification_id=v_id and event='EMITTED' and channel='IN_APP')<>1
 then raise exception 'REAL_B3_RECOVERY_DUPLICATE_DELIVERY_HISTORY';end if;
 if (select count(*) from public.record_retention_state
    where domain='notifications' and record_type='notification_history'
      and record_id=v_id::text and policy_key='notification_history_v1')<>1
 then raise exception 'REAL_B3_RECOVERY_RETENTION_MISSING';end if;
 if (select count(*) from public.audit_logs
    where action='ad_notification_retry_succeeded'
      and metadata->>'original_failure_id'=v_failure_id::text)<>1
 then raise exception 'REAL_B3_RECOVERY_AUDIT_DUPLICATED';end if;
 if exists(select 1 from public.live_notifications
    where delivery_state<>'IN_APP_READY'
       or metadata->>'delivery'<>'IN_APP_ONLY')
 then raise exception 'REAL_B3_FALSE_EXTERNAL_SENT';end if;
 raise notice 'PASS [ADS-054/055] real B3 Owner retry emits once; history+retention+success audit each one, no external SENT';
end $retry$;

-- Production B3 source blocks secrets at its own layer, even if B7
-- mistakenly tried to route unsafe text. No attempt may be recorded.
do $secret_guard$
declare msg text;v_pre integer;
begin
 select count(*) into v_pre from public.live_notifications;
 begin
  perform public.jb_notification_emit_internal(
   '11111111-1111-1111-1111-111111111111',
   'ads','ad_requested','HIGH','Advertiser password: abc',
   'Token sent','ad_campaign',
   '30000000-0000-0000-0000-000000000005',
   true,'ads.html','b7-test-unsafe',
   '{"source":"b7_ad_domain"}'::jsonb);
  raise exception 'B3_ACCEPTED_SECRET_NOTIFICATION';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'UNSAFE_NOTIFICATION_CONTENT' then
   raise exception 'B3_SECRET_GUARD_INCOMPATIBLE: %',msg;end if;
 end;
 if (select count(*) from public.live_notifications)<>v_pre
 then raise exception 'B3_SECRET_NOTIFICATION_LEFT_A_RECEIPT';end if;
 raise notice 'PASS [ADS-054] real B3 emitter denies token/password leakage, no phantom receipt';
end $secret_guard$;


-- Owner should not see yesterday's failed "LIVE" as a fresh LIVE
-- notification after the campaign has already been HIDDEN. Normal
-- News/Ad state is still authoritative; audit must retain original.
update public.team_accounts set status='suspended'
 where user_id='11111111-1111-1111-1111-111111111111';
update public.ad_campaigns set status='live',updated_at=clock_timestamp()
 where id='30000000-0000-0000-0000-000000000005';
update public.ad_campaigns set status='hidden',updated_at=clock_timestamp()
 where id='30000000-0000-0000-0000-000000000005';
update public.team_accounts set status='active'
 where user_id='11111111-1111-1111-1111-111111111111';
do $stale_replay$
declare v_failed bigint;v_id bigint;v_out jsonb;
begin
 select l.id into v_failed from public.audit_logs l
 where l.action='ad_notification_failed'
   and l.record_id='30000000-0000-0000-0000-000000000005'
   and l.metadata->>'event'='ad_live'
 order by l.id desc limit 1;
 if v_failed is null then raise exception 'MISSING_OLD_FAILED_AD_LIVE';end if;
 if not public.jb_ad_notification_retry_internal(v_failed)
 then raise exception 'STALE_AD_LIVE_RETRY_FAILED_SAFE_REVIEW';end if;
 if exists(select 1 from public.live_notifications
  where record_id='30000000-0000-0000-0000-000000000005'
    and notification_type='ad_live')
 then raise exception 'STALE_LIVE_WRONGFULLY_DELIVERED_AFTER_HIDE';end if;
 select id into v_id from public.live_notifications
 where record_id='30000000-0000-0000-0000-000000000005'
   and notification_type='ad_workflow_updated';
 if v_id is null or not exists(select 1 from public.live_notifications
  where id=v_id and title='Advertisement workflow updated'
    and lifecycle_state='ACTION_REQUIRED' and priority='HIGH')
 then raise exception 'STALE_LIVE_NOT_CONVERTED_TO_GENERIC_OWNER_REVIEW';end if;
 select l.metadata into v_out from public.audit_logs l
 where l.action='ad_notification_retry_succeeded'
   and l.metadata->>'original_failure_id'=v_failed::text;
 if v_out->>'source_event'<>'ad_live'
   or v_out->>'delivered_event'<>'ad_workflow_updated'
   or v_out->>'stale_state_sanitized'<>'true'
 then raise exception 'STALE_RETRY_AUDIT_LIED: %',v_out;end if;
 if (select count(*) from public.audit_logs
    where id=v_failed and metadata->>'event'='ad_live')<>1
 then raise exception 'IMMUTABLE_ORIGINAL_FAILURE_CHANGED';end if;
 if not exists(select 1 from public.notification_delivery_history
    where notification_id=v_id and channel='IN_APP' and event='EMITTED')
 then raise exception 'STALE_OWNER_REVIEW_NOT_IN_REAL_B3_HISTORY';end if;
 raise notice 'PASS [ADS-055] stale LIVE failure after HIDE sends generic Owner review, never false LIVE; original audit preserved';
end $stale_replay$;

-- Malformed audit references must never turn into a record lookup or
-- cause a privileged retry using a fake/corrupt campaign UUID.
insert into public.audit_logs(
 actor_user_id,action,record_type,record_id,metadata,created_at
) values(
 null,'ad_notification_failed','ad_campaign',
 '------------------------------------',
 '{"event":"ad_live","delivery":"NOT_CONFIRMED"}',clock_timestamp());
do $malformed$
declare v_failure bigint;v_text text;
begin
 select id into v_failure from public.audit_logs
 where record_id='------------------------------------' and action='ad_notification_failed';
 begin
  perform public.jb_ad_notification_retry_internal(v_failure);
  raise exception 'MALFORMED_RECORD_ID_RETRIED';
 exception when others then
  get stacked diagnostics v_text=message_text;
  if v_text<>'INVALID_NOTIFICATION_FAILURE_REFERENCE'
  then raise exception 'MALFORMED_AUDIT_CONTRACT_NOT_REJECTED: %',v_text;end if;
 end;
 raise notice 'PASS [ADS-054] corrupt audit record UUID denied before any B3 Owner notification';
end $malformed$;

rollback;
