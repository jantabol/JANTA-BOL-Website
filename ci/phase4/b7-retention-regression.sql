\set ON_ERROR_STOP on
-- P4-T041 ADS-052/053 synthetic commercial retention negative test.
-- Never touches Supabase or actual advertiser evidence. One rollback.
begin;
do $before$
begin
 if (select count(*) from public.record_retention_state)<>0
   or (select count(*) from public.ad_history)<>0
 then raise exception 'FIXTURE_EXPECTS_NO_PREEXISTING_COMMERCIAL_HISTORY';end if;
 raise notice 'PASS [ADS-053 setup] all existing B3 retention homes present; no parallel ledger';
end $before$;

-- Advertiser/public-origin event: no privilege escalation/Owner impersonation.
select set_config('b7.test_owner','',true);
insert into public.ad_history(campaign_id,event_type,note,actor_user_id)
values('30000000-0000-0000-0000-000000000004','ad_requested',
       'Safe test request submitted',null);

do $registered$
declare h bigint;state public.record_retention_state%rowtype;
begin
 select id into h from public.ad_history where event_type='ad_requested';
 select * into state from public.record_retention_state
 where domain='ads' and record_type='ad_history' and record_id=h::text;
 if state.policy_key<>'ads_history_v1' or state.lifecycle_state<>'active'
    or state.hold_active or state.updated_by is not null
    or state.retention_due_at<now()+interval '2554 days'
    or state.retention_due_at>now()+interval '2556 days'
 then raise exception 'EXISTING_B3_POLICY_NOT_REGISTERED_FOR_AD_REQUEST';end if;
 if not exists(select 1 from public.record_retention_history
   where domain='ads' and record_type='ad_history' and record_id=h::text
     and action='retention_registered' and actor_user_id is null
     and metadata->>'source'='system_ad_history_insert')
 then raise exception 'B3_RETENTION_APPEND_ONLY_REGISTRATION_PROOF_MISSING';end if;
 raise notice 'PASS [ADS-053] anonymous-origin ad request retained under B3 seven-year policy, actor is NULL not forged Owner';
end $registered$;

do $history_immutability$
declare id_old bigint;msg text;
begin
 select id into id_old from public.ad_history limit 1;
 begin
  update public.ad_history set note='altered payment evidence' where id=id_old;
  raise exception 'COMMERCIAL_HISTORY_MUTATED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_COMMERCIAL_HISTORY_APPEND_ONLY' then
   raise exception 'HISTORY_UPDATE_GUARD_WRONG: %',msg;end if;
 end;
 begin
  delete from public.ad_history where id=id_old;
  raise exception 'COMMERCIAL_HISTORY_ERASED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_COMMERCIAL_HISTORY_APPEND_ONLY' then
   raise exception 'HISTORY_DELETE_GUARD_WRONG: %',msg;end if;
 end;
 if (select count(*) from public.ad_history)<>1
   or (select count(*) from public.record_retention_state)<>1
 then raise exception 'FAILED_MUTATION_REMOVED_HISTORY_OR_RETENTION';end if;
 raise notice 'PASS [ADS-052] actor/time/evidence history immutable for direct privileged UPDATE/DELETE';
end $history_immutability$;

-- A correction never replaces the original; it is a fresh retained event.
insert into public.ad_history(campaign_id,event_type,note,actor_user_id)
values('30000000-0000-0000-0000-000000000004','ad_request_clarified',
       'Additional safe context supplied',auth.uid());
do $append_only$
begin
 if (select count(*) from public.ad_history)<>2
   or (select count(*) from public.record_retention_state)<>2
   or (select count(*) from public.record_retention_history
       where action='retention_registered')<>2
 then raise exception 'AD_CORRECTION_REPLACED_EVIDENCE';end if;
 raise notice 'PASS [ADS-052] new owner clarification gets new record+retention, old evidence remains';
end $append_only$;

do $purge_hold$
declare msg text;rid bigint;
begin
 select min(id) into rid from public.ad_history;
 update public.record_retention_state
  set hold_active=true,hold_reason='SYNTHETIC LEGAL HOLD',
      lifecycle_state='hold'
 where domain='ads' and record_type='ad_history' and record_id=rid::text;
 begin
  delete from public.ad_campaigns
    where id='30000000-0000-0000-0000-000000000004';
  raise exception 'LEGAL_HOLD_CAMPAIGN_PHYSICALLY_DELETED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_COMMERCIAL_DELETE_REQUIRES_SEPARATE_RETENTION_DISPOSITION'
  then raise exception 'LEGAL_HOLD_PROTECTION_WRONG: %',msg;end if;
 end;
 -- Even if a due date passes, physical purge is NOT automatically granted.
 update public.record_retention_state set retention_due_at=now()-interval '1 day'
 where domain='ads' and record_type='ad_history' and record_id=rid::text;
 begin
  delete from public.ad_campaigns
   where id='30000000-0000-0000-0000-000000000004';
  raise exception 'EXPIRED_RETENTION_IMPLIED_PHYSICAL_PURGE';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_COMMERCIAL_DELETE_REQUIRES_SEPARATE_RETENTION_DISPOSITION'
  then raise exception 'EXPIRED_POLICY_PURGE_GUARD_WRONG: %',msg;end if;
 end;
 if not exists(select 1 from public.record_retention_state
  where domain='ads' and record_type='ad_history'
   and record_id=rid::text and hold_active)
 then raise exception 'LEGAL_HOLD_SILENTLY_RELEASED';end if;
 raise notice 'PASS [ADS-053] legal HOLD and even expired retention cannot authorize automatic physical campaign purge';
end $purge_hold$;

do $approved_creative$
declare v_id uuid;draft_id uuid;msg text;
begin
 select id into v_id from public.ad_creatives
 where campaign_id='30000000-0000-0000-0000-000000000001' limit 1;
 begin
  update public.ad_creatives set text_body='Malicious replacement' where id=v_id;
  raise exception 'APPROVED_MEDIA_OVERWRITTEN';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_APPROVED_CREATIVE_VERSION_IMMUTABLE'
  then raise exception 'APPROVED_MEDIA_UPDATE_GUARD_WRONG: %',msg;end if;
 end;
 begin
  delete from public.ad_creatives where id=v_id;
  raise exception 'APPROVED_MEDIA_DELETED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_APPROVED_CREATIVE_VERSION_IMMUTABLE'
  then raise exception 'APPROVED_MEDIA_DELETE_GUARD_WRONG: %',msg;end if;
 end;
 insert into public.ad_creatives(campaign_id,approved,creative_type,text_body)
 values('30000000-0000-0000-0000-000000000001',false,'text',
        'New still-unapproved media version') returning id into draft_id;
 update public.ad_creatives set text_body='Second draft edit' where id=draft_id;
 delete from public.ad_creatives where id=draft_id;
 if (select text_body from public.ad_creatives where id=v_id)
      is distinct from 'Verified advertisement creative'
 then raise exception 'APPROVED_CREATIVE_NOT_PRESERVED';end if;
 raise notice 'PASS [ADS-046/052] original approved creative immutable; unapproved draft remains editable';
end $approved_creative$;

do $missing_policy$
declare msg text;total_before bigint;
begin
 select count(*) into total_before from public.ad_history;
 update public.record_retention_policies set active=false
  where policy_key='ads_history_v1';
 begin
  insert into public.ad_history(campaign_id,event_type,note)
  values('30000000-0000-0000-0000-000000000004','unsupported_retention',
         'Must abort when policy is disabled');
  raise exception 'MISSING_POLICY_WROTE_UNRETAINED_AD_HISTORY';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_RETENTION_POLICY_NOT_READY'
  then raise exception 'RETENTION_POLICY_FAIL_CLOSED_WRONG: %',msg;end if;
 end;
 if (select count(*) from public.ad_history)<>total_before
 then raise exception 'UNRETAINED_AD_HISTORY_WAS_WRITTEN';end if;
 update public.record_retention_policies set active=true
 where policy_key='ads_history_v1';
 raise notice 'PASS [ADS-053] disabled B3 retention policy denies unretained evidence write';
end $missing_policy$;

do $request_remains$
begin
 if (select count(*) from public.ad_campaigns
   where id='30000000-0000-0000-0000-000000000004')<>1
 then raise exception 'NEWS_OR_AD_REQUEST_CORRUPTED';end if;
 if (select count(*) from public.ad_history)<>2
 then raise exception 'AD_HISTORY_COUNT_WRONG';end if;
 raise notice 'PASS [ADS-052/053] original ads intact; NO paid/ad deletion or automatic legal disposition';
end $request_remains$;
rollback;
