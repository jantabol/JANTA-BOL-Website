\set ON_ERROR_STOP on
-- Verify after TWO independent psql processes raced a one-second-delayed
-- B3 emission using the SAME immutable audit ID.
do $verify$
declare v_failure_id bigint;v_ok_count int;v_notices int;v_failed_count int;
begin
 select id into v_failure_id from public.audit_logs
 where action='ad_notification_failed';
 select count(*) into v_failed_count from public.audit_logs
 where id=v_failure_id and action='ad_notification_failed'
   and metadata->>'delivery'='NOT_CONFIRMED';
 select count(*) into v_ok_count from public.audit_logs
 where action='ad_notification_retry_succeeded'
   and metadata->>'original_failure_id'=v_failure_id::text;
 select count(*) into v_notices from public.live_notifications
 where domain='ads' and notification_type='ad_approved'
   and record_id='30000000-0000-0000-0000-000000000001'
   and delivery_state='IN_APP_READY';
 if v_failed_count<>1 or v_ok_count<>1 or v_notices<>1 then
  raise exception 'CONCURRENT_OWNER_RETRY_RACE: original_failure=%, success_audits=%, inapp_receipts=%',
     v_failed_count,v_ok_count,v_notices;
 end if;
 if exists(select 1 from public.live_notifications
    where domain='ads' and (recipient_user_id <>
      '11111111-1111-1111-1111-111111111111'
      or delivery_state<>'IN_APP_READY'
      or metadata->>'delivery'<>'IN_APP_ONLY')) then
   raise exception 'CONCURRENT_RETRY_EXPOSED_RECIPIENT_OR_FALSE_EXTERNAL_SENT';end if;
 raise notice 'PASS [ADS-055/054] two parallel Owner retries -> ONE in-app notification, ONE success audit; original failure still immutable';
end $verify$;
