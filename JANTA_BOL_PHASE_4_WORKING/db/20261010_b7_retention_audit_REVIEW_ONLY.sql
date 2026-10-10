-- JANTA BOL B7 / P4-T041 / ADS-052+053 — REVIEW ONLY / NOT LIVE.
-- Append-only paid commercial evidence and canonical B3 retention integration.
-- Uses EXISTING public.ad_history, audit_logs, record_retention_state,
-- record_retention_history, record_retention_policies. NO parallel ledger.
-- NO physical disposition/purge authorized by this migration.
begin;

-- The pre-existing B3 retention policy must be independently present.
-- Fail closed rather than inventing a new retention date/authority.
do $policy$
begin
 if not exists(select 1 from public.record_retention_policies
   where policy_key='ads_history_v1' and domain='ads'
     and record_type='ad_history' and active=true
     and automatic_disposition=false
     and default_retention_days>=2555)
 then raise exception 'B7_RETENTION_POLICY_NOT_READY';end if;
end $policy$;

-- Register each commercial event in the EXISTING B3 retained-record home.
-- A public advertiser request can have actor=NULL; do NOT impersonate
-- the Founder/Owner or grant anyone a new capability. The system origin
-- is explicitly recorded in the existing retention history.
create or replace function private.b7_register_ad_history_retention()
returns trigger language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $register$
declare v_days integer;v_due timestamptz;v_record public.record_retention_state%rowtype;
begin
 select default_retention_days into v_days
 from public.record_retention_policies
 where policy_key='ads_history_v1' and active=true
   and domain='ads' and record_type='ad_history'
   and automatic_disposition=false;
 if v_days is null or v_days<2555 then
   raise exception 'B7_RETENTION_POLICY_NOT_READY';end if;

 v_due:=clock_timestamp()+make_interval(days=>v_days);
 insert into public.record_retention_state(
  domain,record_type,record_id,policy_key,lifecycle_state,
  retention_due_at,updated_by,updated_at
 ) values('ads','ad_history',new.id::text,'ads_history_v1',
          'active',v_due,auth.uid(),clock_timestamp())
 on conflict(domain,record_type,record_id) do nothing
 returning * into v_record;
 if found then
  insert into public.record_retention_history(
   domain,record_type,record_id,action,old_state,new_state,
   actor_user_id,metadata,created_at
  ) values('ads','ad_history',new.id::text,'retention_registered',
           '{}'::jsonb,to_jsonb(v_record),auth.uid(),
           jsonb_build_object('source','system_ad_history_insert',
             'source_event_type',left(new.event_type,80)),
           clock_timestamp());
 end if;
 return new;
end $register$;
drop trigger if exists b7_register_ad_history_retention on public.ad_history;
create trigger b7_register_ad_history_retention
 after insert on public.ad_history
 for each row execute function private.b7_register_ad_history_retention();
revoke all on function private.b7_register_ad_history_retention()
 from public,anon,authenticated;

-- B7 legacy history backfill: the existing B7 project had historical
-- commercial events BEFORE this migration. They need B3 policy records too.
-- Preserve any pre-existing HOLD/EXTEND/archive states (ON CONFLICT NOTHING).
-- Due date derives from ORIGINAL event creation time, not time of migration.
-- No automatic purge even when already due; this is registration ONLY.
with retention_policy as (
 select default_retention_days days
 from public.record_retention_policies
 where policy_key='ads_history_v1' and domain='ads'
   and record_type='ad_history' and active=true
   and automatic_disposition=false
), inserted as (
 insert into public.record_retention_state(
  domain,record_type,record_id,policy_key,lifecycle_state,retention_due_at,
  updated_by,updated_at
 )
 select 'ads','ad_history',h.id::text,'ads_history_v1',
        case when h.created_at+make_interval(days=>p.days)<=clock_timestamp()
          then 'due' else 'active' end,
        h.created_at+make_interval(days=>p.days),null,clock_timestamp()
 from public.ad_history h cross join retention_policy p
 on conflict(domain,record_type,record_id) do nothing
 returning *
)
insert into public.record_retention_history(
 domain,record_type,record_id,action,old_state,new_state,
 actor_user_id,metadata,created_at
)
select s.domain,s.record_type,s.record_id,'retention_registered',
       '{}'::jsonb,to_jsonb(s),null,
       jsonb_build_object('source','b7_legacy_history_backfill',
                          'automatic_disposition',false),
       clock_timestamp()
from inserted s;

-- Physical changes to the commercial history are NEVER "corrections".
-- Editorial/owner changes append a NEW ad_history event; the historic
-- origin and retention record remain inspectable.
create or replace function private.b7_commercial_history_immutable()
returns trigger language plpgsql security definer
set search_path to 'pg_catalog'
as $immutable$
begin
 raise exception 'B7_COMMERCIAL_HISTORY_APPEND_ONLY';
end $immutable$;
drop trigger if exists b7_ad_history_immutable on public.ad_history;
create trigger b7_ad_history_immutable
 before update or delete on public.ad_history
 for each row execute function private.b7_commercial_history_immutable();
revoke all on function private.b7_commercial_history_immutable()
 from public,anon,authenticated;

-- Existing ad_history FK may be ON DELETE CASCADE. Deny a physical
-- campaign deletion when there is any commercial record/evidence,
-- regardless of who issues the delete (including service_role).
-- Hide/expire/reject/soft-archive operations remain available.
create or replace function private.b7_ad_campaign_delete_retention_guard()
returns trigger language plpgsql security definer
set search_path to 'pg_catalog','public'
as $campaign_delete$
begin
 if exists(select 1 from public.ad_history h where h.campaign_id=old.id)
   or exists(select 1 from public.ad_payments p where p.campaign_id=old.id)
   or old.paid_at is not null then
   raise exception 'B7_COMMERCIAL_DELETE_REQUIRES_SEPARATE_RETENTION_DISPOSITION';
 end if;
 return old;
end $campaign_delete$;
drop trigger if exists b7_ad_campaign_delete_retention_guard
 on public.ad_campaigns;
create trigger b7_ad_campaign_delete_retention_guard
 before delete on public.ad_campaigns
 for each row execute function private.b7_ad_campaign_delete_retention_guard();
revoke all on function private.b7_ad_campaign_delete_retention_guard()
 from public,anon,authenticated;

-- An approved creative is an immutable signed commercial version, not an
-- editable photo/link/CTA. New media must be approved as a NEW version.
-- Fail closed for historical review; do not silently invalidate an old
-- published creative after it has already been served.
create or replace function private.b7_approved_creative_immutable()
returns trigger language plpgsql security definer
set search_path to 'pg_catalog'
as $creative$
begin
 if old.approved=true then
  raise exception 'B7_APPROVED_CREATIVE_VERSION_IMMUTABLE';
 end if;
 return coalesce(new,old);
end $creative$;
drop trigger if exists b7_approved_creative_immutable on public.ad_creatives;
create trigger b7_approved_creative_immutable
 before update or delete on public.ad_creatives
 for each row when (old.approved=true)
 execute function private.b7_approved_creative_immutable();
revoke all on function private.b7_approved_creative_immutable()
 from public,anon,authenticated;

-- Existing global audit_logs append-only guards (B0) stay authoritative;
-- do NOT reimplement, alter, drop or bypass them here.
commit;
