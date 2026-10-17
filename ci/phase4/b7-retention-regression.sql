\set ON_ERROR_STOP on
-- P4-T041 ADS-052/053 synthetic commercial retention negative test.
-- Never touches Supabase or actual advertiser evidence. One rollback.
begin;
do $before$
declare legacy_due timestamptz;held public.record_retention_state%rowtype;
begin
 if (select count(*) from public.record_retention_state)<>2
   or (select count(*) from public.ad_history)<>2
 then raise exception 'LEGACY_AD_HISTORY_BACKFILL_FAILED';end if;
 select r.retention_due_at into legacy_due
 from public.record_retention_state r
 join public.ad_history h on h.id::text=r.record_id
 where h.event_type='legacy_missing_registry';
 if legacy_due is null
  or legacy_due<now()+interval '2494 days'
  or legacy_due>now()+interval '2496 days'
 then raise exception 'BACKFILL_DID_NOT_PRESERVE_OLD_EVENT_ORIGINAL_DATE';end if;
 select r.* into held from public.record_retention_state r
 join public.ad_history h on h.id::text=r.record_id
 where h.event_type='legacy_held_record';
 if held.lifecycle_state<>'hold' or held.hold_active<>true
   or held.hold_reason<>'PREEXISTING_TEST_LEGAL_HOLD'
   or held.retention_due_at<now()+interval '99 days'
 then raise exception 'BACKFILL_OVERWROTE_PREEXISTING_LEGAL_HOLD';end if;
 if (select count(*) from public.record_retention_history
   where metadata->>'source'='b7_legacy_history_backfill')<>1
 then raise exception 'LEGACY_BACKFILL_HISTORY_NOT_PRECISELY_ONE';end if;
 raise notice 'PASS [ADS-053] legacy event backfilled by original date; existing HOLD unchanged; no parallel ledger';
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
 if (select count(*) from public.ad_history)<>3
   or (select count(*) from public.record_retention_state)<>3
 then raise exception 'FAILED_MUTATION_REMOVED_HISTORY_OR_RETENTION';end if;
 raise notice 'PASS [ADS-052] actor/time/evidence history immutable for direct privileged UPDATE/DELETE';
end $history_immutability$;

-- A correction never replaces the original; it is a fresh retained event.
select set_config('b7.test_actor_uid','11111111-1111-1111-1111-111111111111',true);
insert into public.ad_history(campaign_id,event_type,note,actor_user_id)
values('30000000-0000-0000-0000-000000000004','ad_request_clarified',
       'Additional safe context supplied',auth.uid());
select set_config('b7.test_actor_uid','',true);
do $append_only$
begin
 if (select count(*) from public.ad_history)<>4
   or (select count(*) from public.record_retention_state)<>4
   or (select count(*) from public.record_retention_history
       where action='retention_registered')<>3
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

-- ADS-046/052 First-divergence: the ACTUAL existing Owner SAVE and
-- APPROVE RPCs toggle approved flags when replacing a creative. The prior
-- blanket immutable trigger would reject legitimate version replacement.
-- Both flags can change ONLY under Owner/AAL2, but old media/text/CTA and
-- created_at/version NEVER change, including after revocation.
do $owner_version_replacement$
declare old_id uuid;v2 uuid;msg text;
begin
 select id into old_id from public.ad_creatives
 where campaign_id='30000000-0000-0000-0000-000000000001'
    and approved=true limit 1;
 if old_id is null then raise exception 'APPROVED_CREATIVE_FIXTURE_MISSING';end if;
 if not (select approved_once from public.ad_creatives where id=old_id)
 then raise exception 'CURRENT_APPROVED_NOT_MARKED_STICKY';end if;

 -- Owner=AAL1/anonymous cannot revoke even the approval flag.
 begin
  update public.ad_creatives set approved=false where id=old_id;
  raise exception 'AAL1_REVOKED_ORIGINAL_APPROVED_VERSION';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'OWNER_AAL2_REQUIRED' then
   raise exception 'CREATIVE_UNAUTHORIZED_REVOKE_WRONG: %',msg;end if;
 end;

 -- Existing Owner version-save code does UPDATE approved=false then
 -- INSERT new approved version; it MUST still work after migration.
 perform set_config('b7.test_owner','enabled',true);
 update public.ad_creatives set approved=false
 where campaign_id='30000000-0000-0000-0000-000000000001';
 if not exists(select 1 from public.ad_creatives
   where id=old_id and approved=false and approved_once=true
     and text_body='Verified advertisement creative' and version=1)
 then raise exception 'ORIGINAL_CREATIVE_VERSION_CHANGED_WHEN_REVOKED';end if;

 begin
  update public.ad_creatives set text_body='Backdoor edit after revocation'
  where id=old_id;
  raise exception 'REVOKED_OLD_CREATIVE_TEXT_EDITED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_APPROVED_CREATIVE_VERSION_IMMUTABLE' then
   raise exception 'PREVIOUSLY_APPROVED_NOT_IMMUTABLE: %',msg;end if;
 end;
 begin
  update public.ad_creatives set version=200,cta_target='https://evil.test'
  where id=old_id;
  raise exception 'REVOKED_OLD_CREATIVE_LINK_OR_VERSION_EDITED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_APPROVED_CREATIVE_VERSION_IMMUTABLE' then
   raise exception 'PREVIOUS_APPROVED_LINK_NOT_IMMUTABLE: %',msg;end if;
 end;
 begin
  update public.ad_creatives set approved_once=false where id=old_id;
  raise exception 'STICKY_EVIDENCE_RESET_BY_OWNER';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_APPROVED_CREATIVE_STICKY_FLAG_REQUIRED' then
   raise exception 'STICKY_STATE_NOT_PROTECTED: %',msg;end if;
 end;
 begin
  delete from public.ad_creatives where id=old_id;
  raise exception 'REVOKED_OLD_APPROVED_VERSION_DELETED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_APPROVED_CREATIVE_VERSION_IMMUTABLE' then
   raise exception 'OLD_CREATIVE_DELETE_NOT_BLOCKED: %',msg;end if;
 end;

 insert into public.ad_creatives(campaign_id,approved,creative_type,text_body,
                                  version,cta_type,cta_target)
 values('30000000-0000-0000-0000-000000000001',false,'text',
        'New Owner revised advertisement',2,'website',
        'https://advertiser.example.test/revised')
 returning id into v2;
 update public.ad_creatives set text_body='New approved version 2' where id=v2;
 update public.ad_creatives set approved=true where id=v2;
 if not exists(select 1 from public.ad_creatives
   where id=v2 and version=2 and approved=true and approved_once=true
     and cta_target='https://advertiser.example.test/revised')
 then raise exception 'NEW_CREATIVE_VERSION_NOT_APPROVED_BY_OWNER';end if;
 if (select count(*) from public.ad_creatives
   where campaign_id='30000000-0000-0000-0000-000000000001'
     and approved=true)<>1 then
  raise exception 'MULTIPLE_SIMULTANEOUS_APPROVED_CREATIVES';end if;
 perform set_config('b7.test_owner','',true);
 begin
  update public.ad_creatives set approved=false where id=v2;
  raise exception 'AAL1_REVOKED_NEW_APPROVED_VERSION';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'OWNER_AAL2_REQUIRED' then
   raise exception 'SECOND_VERSION_AAL1_BYPASS: %',msg;end if;
 end;
 raise notice 'PASS [ADS-046/052] Owner version replacement works; old + new approved versions remain immutable after revocation; AAL1 denied';
end $owner_version_replacement$;

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
 if (select count(*) from public.ad_history)<>4
 then raise exception 'AD_HISTORY_COUNT_WRONG';end if;
 raise notice 'PASS [ADS-052/053] original ads intact; NO paid/ad deletion or automatic legal disposition';
end $request_remains$;

-- A later IMPORT of old evidence must retain the ORIGINAL creation date,
-- rather than making it appear newly created and silently extending the
-- Founder/legal seven-year policy by the age of that imported record.
do $backdated_import$
declare v_old bigint;v_due bigint;v_old_state public.record_retention_state%rowtype;
        v_due_state public.record_retention_state%rowtype;
begin
 insert into public.ad_history(campaign_id,event_type,note,actor_user_id,created_at)
 values('30000000-0000-0000-0000-000000000004',
   'legacy_import_recent','Imported 60-day-old commercial evidence',null,
   clock_timestamp()-interval '60 days')
 returning id into v_old;
 select * into v_old_state from public.record_retention_state
 where domain='ads' and record_type='ad_history' and record_id=v_old::text;
 if v_old_state.lifecycle_state<>'active'
    or v_old_state.retention_due_at < now()+interval '2494 days'
    or v_old_state.retention_due_at > now()+interval '2496 days'
 then raise exception 'BACKDATED_IMPORTED_EVIDENCE_MISDATED';end if;

 insert into public.ad_history(campaign_id,event_type,note,actor_user_id,created_at)
 values('30000000-0000-0000-0000-000000000004',
   'legacy_import_overdue','Imported 2600-day-old archived evidence',null,
   clock_timestamp()-interval '2600 days')
 returning id into v_due;
 select * into v_due_state from public.record_retention_state
 where domain='ads' and record_type='ad_history' and record_id=v_due::text;
 if v_due_state.lifecycle_state<>'due'
    or v_due_state.retention_due_at>now()-interval '44 days'
    or v_due_state.retention_due_at<now()-interval '46 days'
 then raise exception 'OVERDUE_EVIDENCE_NOT_RETAINED_WITH_DUE_STATE';end if;
 if (select count(*) from public.ad_history)<>6
   or (select count(*) from public.record_retention_state)<>6
 then raise exception 'BACKDATED_AD_HISTORY_NOT_PRESERVED';end if;
 if not exists(select 1 from public.record_retention_state r
   join public.ad_history h on h.id::text=r.record_id
   where h.event_type='legacy_held_record'
     and r.hold_active and r.lifecycle_state='hold')
 then raise exception 'PREVIOUS_HOLD_RELEASED_DURING_NEW_IMPORT';end if;
 raise notice 'PASS [ADS-053] backdated new event uses original timestamp; expired record marked due, not deleted; HOLD preserved';
end $backdated_import$;
rollback;
