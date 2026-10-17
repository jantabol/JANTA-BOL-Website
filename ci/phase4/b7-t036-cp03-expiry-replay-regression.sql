\set ON_ERROR_STOP on
-- ADS017/ADS023 real disposable PG17. Synthetic rows/clock only.
-- A single enclosing transaction rolls back EVERYTHING including errors.
begin;
do $grants$
begin
 if has_function_privilege('anon',
 'private.b7_ad_expire_due_core(integer)','execute')
 or has_function_privilege('authenticated',
 'private.b7_ad_expire_due_core(integer)','execute')
 then raise exception 'PUBLIC_AD_EXPIRY_EXECUTE_LEAK';end if;
 if not has_function_privilege('service_role',
 'private.b7_ad_expire_due_core(integer)','execute')
 then raise exception 'SERVER_WORKER_EXECUTE_MISSING';end if;
 if (select prosecdef from pg_proc
  where oid='private.b7_ad_expire_due_core(integer)'::regprocedure)<>true
 then raise exception 'PRIVILEGED_WORKER_MUST_BE_DEFINER';end if;
 if strpos(pg_get_functiondef('private.b7_ad_expire_due_core(integer)'::regprocedure),
     'for update skip locked')=0
 then raise exception 'REPLAY_LOCK_MISSING';end if;
end $grants$;
do $bad_batch$
declare msg text;
begin
 foreach msg in array array['0','51','-1'] loop
  begin
   perform private.b7_ad_expire_due_core(msg::integer);
   raise exception 'INVALID_BATCH_ACCEPTED';
  exception when others then
   if sqlerrm <> 'B7_EXPIRY_BATCH_LIMIT_INVALID'
   then raise exception 'BATCH_GUARD_WRONG %',sqlerrm;end if;
  end;
 end loop;
 raise notice 'T036 CP03 PASS bad batch size 0,51,-1 denied';
end $bad_batch$;

-- Synthetic expired/live, expired/paused, old but hidden, old but review,
-- plus one future paid-looking row: no real advertiser/payment evidence.
update public.ad_campaigns set status='live',
 starts_at=now()-interval '20 days',ends_at=now()-interval '2 days',
 paid_at=now()-interval '19 days',non_refund_accepted_at=now()-interval '19 days'
 where id='30000000-0000-0000-0000-000000000001';
update public.ad_campaigns set status='paused',
 starts_at=now()-interval '20 days',ends_at=now()-interval '1 day'
 where id='30000000-0000-0000-0000-000000000003';
update public.ad_campaigns set status='review',
 starts_at=now()-interval '20 days',ends_at=now()-interval '3 days'
 where id='30000000-0000-0000-0000-000000000002';
update public.ad_campaigns set status='hidden',
 starts_at=now()-interval '20 days',ends_at=now()-interval '3 days',
 hidden_at=now()-interval '5 days'
 where id='30000000-0000-0000-0000-000000000004';
insert into public.ad_campaigns(
 id,advertiser_id,status,placement,starts_at,ends_at
) values(
 '30000000-0000-0000-0000-000000000005',
 '00000000-0000-0000-0000-000000000001',
 'live','article',now()-interval '1 day',now()+interval '7 days'
);
create temp table t036_original_immutable as
 select id, to_jsonb(c)-'status'-'updated_at' AS immutable
 from public.ad_campaigns c
 where id='30000000-0000-0000-0000-000000000001';
-- Prove actual DB ACL, not just pg_proc metadata.
set role service_role;
select private.b7_ad_expire_due_core(1) as first_batch;
reset role;
do $after_first$
begin
 if (select status from public.ad_campaigns
 where id='30000000-0000-0000-0000-000000000001')<>'expired'
 or (select status from public.ad_campaigns
 where id='30000000-0000-0000-0000-000000000003')<>'paused'
 then raise exception 'BATCH_LIMIT_OR_DETERMINISTIC_FIRST_EXPIRY_FAILED';end if;
 if (select count(*) from public.ad_history
 where campaign_id='30000000-0000-0000-0000-000000000001'
 and event_type='expired')<>1
 or (select count(*) from public.audit_logs
 where record_id='30000000-0000-0000-0000-000000000001'
 and action='ad_status' and metadata->>'cause'='schedule_end')<>1
 then raise exception 'FIRST_EXPIRY_NOT_EXACTLY_ONE_AUDIT_AND_HISTORY';end if;
 if (select to_jsonb(c)-'status'-'updated_at' from public.ad_campaigns c
 where c.id='30000000-0000-0000-0000-000000000001') is distinct from
 (select immutable from t036_original_immutable limit 1)
 then raise exception 'EXPIRY_MUTATED_PAID_FINANCE_APPROVAL_OR_SCHEDULE';end if;
 raise notice 'T036 CP03 PASS batch=1, audit=1, paid/terms/schedule unchanged';
end $after_first$;
select private.b7_ad_expire_due_core(50) as next_batch;
select private.b7_ad_expire_due_core(50) as idempotent_retry;
do $after_retry$
begin
 if (select status from public.ad_campaigns where
 id='30000000-0000-0000-0000-000000000003')<>'expired'
 or (select status from public.ad_campaigns where
 id='30000000-0000-0000-0000-000000000004')<>'hidden'
 or (select status from public.ad_campaigns where
 id='30000000-0000-0000-0000-000000000002')<>'review'
 or (select status from public.ad_campaigns where
 id='30000000-0000-0000-0000-000000000005')<>'live'
 then raise exception 'WRONG_STATUS_EXPIRED_OR_FUTURE_VISIBLE';end if;
 if (select count(*) from public.ad_history where event_type='expired')<>2
 or (select count(*) from public.audit_logs where action='ad_status'
 and metadata->>'cause'='schedule_end')<>2
 then raise exception 'REPLAY_DUPLICATED_OR_MISSED_EXPIRY_AUDIT';end if;
 raise notice 'T036 CP03 PASS live/paused expiry once; hidden/review/future untouched; same-state replay no new events';
end $after_retry$;

-- Synthetic failure injection into ORIGINAL ledger: prove the worker cannot
-- mark a campaign expired without durable ad_history+audit, and can retry.
create function pg_temp.fail_t036_history() returns trigger
language plpgsql as $f$
begin
 if new.event_type='expired'
 and current_setting('b7.test_fail_expiry',true)='enabled'
 then raise exception 'CI_SIMULATED_HISTORY_OUTAGE';end if;
 return new;
end $f$;
create trigger t036_test_fail_history
before insert on public.ad_history
for each row execute function pg_temp.fail_t036_history();
update public.ad_campaigns set ends_at=now()-interval '2 hours'
where id='30000000-0000-0000-0000-000000000005';
do $failure$
declare prior_history int; prior_audit int; msg text;
begin
 select count(*) into prior_history from public.ad_history where
 campaign_id='30000000-0000-0000-0000-000000000005';
 select count(*) into prior_audit from public.audit_logs where
 record_id='30000000-0000-0000-0000-000000000005';
 perform set_config('b7.test_fail_expiry','enabled',true);
 begin
  perform private.b7_ad_expire_due_core(50);
  raise exception 'INJECTED_LEDGER_OUTAGE_DID_NOT_FAIL';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'CI_SIMULATED_HISTORY_OUTAGE'
  then raise exception 'FAILURE_CAUSE_UNEXPECTED: %',msg;end if;
 end;
 if (select status from public.ad_campaigns where
 id='30000000-0000-0000-0000-000000000005')<>'live'
 or (select count(*) from public.ad_history where
 campaign_id='30000000-0000-0000-0000-000000000005')<>prior_history
 or (select count(*) from public.audit_logs where
 record_id='30000000-0000-0000-0000-000000000005')<>prior_audit
 then raise exception 'NONATOMIC_OUTAGE_CHANGED_STATE_OR_AUDIT';end if;
 perform set_config('b7.test_fail_expiry','disabled',true);
 if private.b7_ad_expire_due_core(50)<>1
 then raise exception 'RETRY_AFTER_RESTORED_LEDGER_NOT_RECOVERED';end if;
 if (select status from public.ad_campaigns where
 id='30000000-0000-0000-0000-000000000005')<>'expired'
 or (select count(*) from public.ad_history where
 campaign_id='30000000-0000-0000-0000-000000000005'
 and event_type='expired')<>1
 or (select count(*) from public.audit_logs where
 record_id='30000000-0000-0000-0000-000000000005'
 and metadata->>'cause'='schedule_end')<>1
 then raise exception 'RECOVERY_AFTER_OUTAGE_NOT_EXACTLY_ONCE';end if;
 if private.b7_ad_expire_due_core(50)<>0
 then raise exception 'THIRD_REPLAY_CREATED_DUPLICATE_EXPIRED_STATE';end if;
 raise notice 'T036 CP03 PASS injected ledger outage atomic rollback + next run recovery once; no duplicate history';
end $failure$;
rollback;
