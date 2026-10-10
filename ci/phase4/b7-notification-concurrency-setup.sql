\set ON_ERROR_STOP on
-- Disposable PG17 only. Original B3 stub + pending B7 review migration.
-- Create ONE immutable failure audit, no real external notification.
insert into public.audit_logs(
 actor_user_id,action,record_type,record_id,metadata,created_at
) values(
 '11111111-1111-1111-1111-111111111111',
 'ad_notification_failed','ad_campaign',
 '30000000-0000-0000-0000-000000000001',
 '{"event":"ad_hidden","delivery":"NOT_CONFIRMED","retry":"OWNER_REVIEW_REQUIRED","sqlstate":"P0001"}'::jsonb,
 clock_timestamp()
);
do $ready$
begin
 if (select count(*) from public.audit_logs
      where action='ad_notification_failed')<>1
 then raise exception 'CONCURRENCY_FAILURE_FIXTURE_NOT_UNIQUE';end if;
 if (select count(*) from public.live_notifications where domain='ads')<>0
 then raise exception 'CONCURRENCY_B3_INBOX_NOT_EMPTY';end if;
 raise notice 'PASS [ADS-055] one genuine immutable audit failure prepared for simultaneous Owner retries';
end $ready$;
