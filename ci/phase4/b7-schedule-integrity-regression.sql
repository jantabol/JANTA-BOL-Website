\set ON_ERROR_STOP on
-- BE08 *disposable* PostgreSQL Owner scheduling / no old data modification.
-- Negative proofs plus Owner positive and rollback; never use real campaigns.
begin;
do $guard_registered$
begin
 if not exists(select 1 from pg_trigger
   where tgrelid='public.ad_campaigns'::regclass
    and tgname='b7_schedule_window_guard' and not tgisinternal)
 or not exists(select 1 from pg_trigger
   where tgrelid='public.ad_campaigns'::regclass
    and tgname='b7_schedule_change_audit' and not tgisinternal)
 or not exists(select 1 from pg_trigger
   where tgrelid='public.ad_campaigns'::regclass
    and tgname='b7_guard_campaign_live' and not tgisinternal)
 or not exists(select 1 from pg_trigger
   where tgrelid='public.ad_campaigns'::regclass
    and tgname='b7_verified_state_guard' and not tgisinternal)
 then raise exception 'BE08_OLD_OR_NEW_GUARD_MISSING';end if;
 if to_regprocedure('public.jb_ad_lifecycle_capability_internal()') is not null
 then raise exception 'BE08_FALSE_LIVE_READINESS_SENTINEL';end if;
end $guard_registered$;

do $anonymous_schedule$
declare msg text;before_start timestamptz;
begin
 select starts_at into before_start from public.ad_campaigns
  where id='30000000-0000-0000-0000-000000000004';
 begin
  update public.ad_campaigns set starts_at=now()+interval '2 days',
   ends_at=now()+interval '3 days'
   where id='30000000-0000-0000-0000-000000000004';
  raise exception 'BE08_UNAUTHORIZED_DIRECT_SCHEDULE_SUCCEEDED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'OWNER_AAL2_REQUIRED'
  then raise exception 'BE08_OWNER_DENIAL_FAILED: %',msg;end if;
 end;
 if (select starts_at from public.ad_campaigns
     where id='30000000-0000-0000-0000-000000000004')
     is distinct from before_start
 then raise exception 'BE08_DENIED_SCHEDULE_MODIFIED_ROW';end if;
end $anonymous_schedule$;

select set_config('b7.test_owner','enabled',false);
do $denials$
declare msg text;
begin
 -- A newly created public request cannot preload ad schedule through DML.
 begin
  insert into public.ad_campaigns(advertiser_id,status,starts_at,ends_at)
  values('00000000-0000-0000-0000-000000000001',
         'requested',now()+interval '1 day',now()+interval '2 days');
  raise exception 'BE08_FORGED_INITIAL_SCHEDULE_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_UNREVIEWED_SCHEDULE_ON_INSERT'
  then raise exception 'BE08_INSERT_GUARD_FAILED: %',msg;end if;
 end;
 begin
  perform public.jb_ad_schedule_internal(
   '30000000-0000-0000-0000-000000000004',
    now()-interval '1 minute',now()+interval '1 day');
  raise exception 'BE08_PAST_START_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_SCHEDULE_START_MUST_BE_FUTURE'
  then raise exception 'BE08_PAST_GUARD_FAILED: %',msg;end if;
 end;
 begin
  perform public.jb_ad_schedule_internal(
   '30000000-0000-0000-0000-000000000004',
    now()+interval '3 days',now()+interval '2 days');
  raise exception 'BE08_BACKWARDS_WINDOW_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'INVALID_SCHEDULE'
  then raise exception 'BE08_WINDOW_GUARD_FAILED: %',msg;end if;
 end;
 begin
  update public.ad_campaigns
   set starts_at=now()+interval '2 days',ends_at=null
   where id='30000000-0000-0000-0000-000000000004';
  raise exception 'BE08_HALF_WINDOW_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_SCHEDULE_INVALID'
  then raise exception 'BE08_HALF_WINDOW_GUARD_FAILED: %',msg;end if;
 end;
end $denials$;

do $owner_schedule$
declare v_id uuid:='30000000-0000-0000-0000-000000000004';
 old_count bigint;old_history bigint;v_start timestamptz;v_end timestamptz;
begin
 select count(*) into old_count from public.audit_logs
 where action='ad_schedule_changed' and record_id=v_id::text;
 select count(*) into old_history from public.ad_history
 where campaign_id=v_id and event_type='scheduled';
 v_start:=now()+interval '2 days';v_end:=now()+interval '3 days';
 if public.jb_ad_schedule_internal(v_id,v_start,v_end)<>true
 then raise exception 'BE08_CANONICAL_SCHEDULE_RPC_FAILED';end if;
 if (select starts_at from public.ad_campaigns where id=v_id)<>v_start
    or (select ends_at from public.ad_campaigns where id=v_id)<>v_end
 then raise exception 'BE08_VALID_WINDOW_NOT_SAVED';end if;
 if (select count(*) from public.audit_logs where action='ad_schedule_changed'
   and record_id=v_id::text)<>old_count+1
 then raise exception 'BE08_NEW_APPEND_ONLY_AUDIT_MISSING';end if;
 if (select count(*) from public.ad_history where campaign_id=v_id
   and event_type='scheduled')<>old_history+1
 then raise exception 'BE08_ORIGINAL_AD_HISTORY_MISSING';end if;
 -- A repeat identical canonical RPC must not add another window-change audit.
 perform public.jb_ad_schedule_internal(v_id,v_start,v_end);
 if (select count(*) from public.audit_logs where action='ad_schedule_changed'
   and record_id=v_id::text)<>old_count+1
 then raise exception 'BE08_DUPLICATE_SCHEDULE_AUDIT';end if;
 raise notice 'PASS BE08 positive synthetic Owner schedule, old history intact and new audit atomic';
end $owner_schedule$;

do $paid_and_hidden$
declare msg text;
begin
 -- Positive test only on a disposable fixture, no actual paid advertiser.
 update public.ad_campaigns set paid_at=now()
 where id='30000000-0000-0000-0000-000000000004';
 begin
  perform public.jb_ad_schedule_internal(
    '30000000-0000-0000-0000-000000000004',
    now()+interval '4 days',now()+interval '5 days');
  raise exception 'BE08_PAID_WINDOW_RESCHEDULED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_SOLD_WINDOW_IMMUTABLE'
  then raise exception 'BE08_PAID_WINDOW_GUARD_FAILED: %',msg;end if;
 end;
 -- Paid/visible commitment must never be altered just by selecting PAUSED.
 update public.ad_campaigns set status='hidden'
 where id='30000000-0000-0000-0000-000000000004';
 begin
  perform public.jb_ad_schedule_internal(
    '30000000-0000-0000-0000-000000000004',
    now()+interval '4 days',now()+interval '5 days');
  raise exception 'BE08_HIDDEN_WINDOW_CHANGED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_SCHEDULE_STATUS_LOCKED'
  then raise exception 'BE08_HIDDEN_GUARD_FAILED: %',msg;end if;
 end;
end $paid_and_hidden$;

do $no_audit_on_reject$
declare v_id uuid:='30000000-0000-0000-0000-000000000004';
 qty bigint;v_start timestamptz;
begin
 select count(*) into qty from public.audit_logs
  where action='ad_schedule_changed' and record_id=v_id::text;
 select starts_at into v_start from public.ad_campaigns where id=v_id;
 if qty<>1 or v_start is null then
  raise exception 'BE08_BAD_FINAL_FIXTURE_STATE';end if;
 raise notice 'PASS BE08 denied reschedules neither change original window nor append audit';
end $no_audit_on_reject$;
rollback;
