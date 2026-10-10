-- JANTA BOL / B7 / P4-T041 / ADS-051+055
-- REVIEW ONLY, NOT PRODUCTION. This is a small *adapter* into the existing
-- B3 live_notifications / jb_notification_emit_internal engine. NOT a second
-- notification store, NOT evidence of external WhatsApp/PUSH/EMAIL sent.
-- Existing News/Public submission must survive notification-provider outage.
begin;

-- Fail before installing an adapter into the wrong/obsolete deployment.
do $b3$
begin
 if to_regclass('public.live_notifications') is null
    or to_regclass('public.user_roles') is null
    or to_regprocedure('public.jb_notification_emit_internal(uuid,text,text,text,text,text,text,text,boolean,text,text,jsonb)') is null
 then raise exception 'B7_UNIFIED_NOTIFICATION_ENGINE_NOT_READY';end if;
end $b3$;

create or replace function private.b7_ad_emit_inapp_owner(
 p_type text,p_id text,p_event text,p_priority text,
 p_action_required boolean,p_dedupe text
) returns integer language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $emit$
declare v_owner uuid;v_n integer:=0;v_id bigint;v_title text;
begin
 if p_type not in('ad_campaign','advertiser','ad_renewal','ad_change','ad_creative','ad_payment')
   or p_event !~ '^ad_[a-z_]{2,48}$'
   or p_id is null or p_id !~ '^[0-9a-f-]{36}$'
   or p_priority not in('NORMAL','HIGH','CRITICAL')
   or p_dedupe is null or length(p_dedupe)>220 then
   raise exception 'B7_NOTIFICATION_CONTRACT_INVALID';end if;
 v_title:=case
  when p_event='ad_requested' then 'New advertisement enquiry'
  when p_event='ad_verified' then 'Advertiser verified'
  when p_event='ad_payment_confirmed' then 'Advertisement payment verified'
  when p_event='ad_live' then 'Advertisement LIVE'
  when p_event='ad_hidden' then 'Advertisement hidden'
  when p_event='ad_expired' then 'Advertisement expired'
  when p_event='ad_renewal_requested' then 'Advertisement renewal requested'
  when p_event='ad_change_requested' then 'Advertisement change requested'
  when p_event='ad_creative_approved' then 'Advertisement creative approved'
  else 'Advertisement workflow updated'
 end;
 for v_owner in
  select u.user_id from public.user_roles u
  where u.role='owner'::public.app_role order by u.user_id
 loop
  -- Only the existing B3 in-app engine may insert notices, dedupe, run
  -- recipient/revocation safety checks or manage delivery history.
  v_id:=public.jb_notification_emit_internal(
   v_owner,'ads',p_event,p_priority,v_title,
   'Review the advertisement workflow in the Owner dashboard. In-app only.',
   p_type,p_id,p_action_required,'ads.html',
   p_dedupe||':'||v_owner::text,
   jsonb_build_object('source','b7_ad_domain','delivery','IN_APP_ONLY')
  );
  if v_id is null then raise exception 'B7_NOTIFICATION_NO_RECEIPT';end if;
  v_n:=v_n+1;
 end loop;
 if v_n=0 then raise exception 'B7_NOTIFICATION_NO_ACTIVE_OWNER';end if;
 return v_n;
end $emit$;
revoke all on function private.b7_ad_emit_inapp_owner(
 text,text,text,text,boolean,text) from public,anon,authenticated;

-- All ad workflow event taps route through one protected B3 adapter.
-- Subscriber failure only affects the notification; NEVER the News Article,
-- advertiser enquiry, payment evidence or LIVE state. The failure is
-- explicitly audited with a safe SQLSTATE (no contact, UTR, token, secret).
create or replace function private.b7_ad_domain_notification_trigger()
returns trigger language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $tap$
declare v_type text;v_id text;v_event text;v_priority text:='NORMAL';
        v_required boolean:=false;v_key text;v_campaign uuid;
begin
 if tg_table_name='ad_campaigns' then
   if tg_op='UPDATE' and old.status is not distinct from new.status then
     return new;end if;
   v_type:='ad_campaign';v_id:=new.id::text;
   v_event:='ad_'||new.status;
   if new.status in('requested','payment_pending','hidden','expired') then
     v_priority:='HIGH';v_required:=true;end if;
   v_key:='ads:campaign:'||v_id||':'||new.status||':'||pg_catalog.txid_current()::text;
 elsif tg_table_name='advertisers' then
   if tg_op='UPDATE' and old.verification_state is not distinct from new.verification_state then
     return new;end if;
   if new.verification_state<>'verified' then return new;end if;
   v_type:='advertiser';v_id:=new.id::text;v_event:='ad_verified';
   v_priority:='HIGH';
   v_key:='ads:verified:'||v_id||':'||pg_catalog.txid_current()::text;
 elsif tg_table_name='ad_payments' then
   if new.status<>'confirmed' then return new;end if;
   if tg_op='UPDATE' and old.status='confirmed' then return new;end if;
   v_type:='ad_payment';v_id:=new.id::text;
   v_event:='ad_payment_confirmed';
   v_key:='ads:paid:'||v_id;
 elsif tg_table_name='ad_creatives' then
   if new.approved is distinct from true then return new;end if;
   if tg_op='UPDATE' and old.approved=true then return new;end if;
   v_type:='ad_creative';v_id:=new.id::text;v_event:='ad_creative_approved';
   v_key:='ads:creative:'||v_id;
 elsif tg_table_name='ad_renewal_requests' then
   if tg_op='UPDATE' and old.status is not distinct from new.status then return new;end if;
   v_type:='ad_renewal';v_id:=new.id::text;
   v_event:=case when new.status='pending' then 'ad_renewal_requested'
                 else 'ad_renewal_reviewed' end;
   v_required:=(new.status='pending');
   if v_required then v_priority:='HIGH';end if;
   v_key:='ads:renewal:'||v_id||':'||new.status;
 elsif tg_table_name='ad_change_requests' then
   if tg_op='UPDATE' and old.status is not distinct from new.status then return new;end if;
   v_type:='ad_change';v_id:=new.id::text;
   v_event:=case when new.status='pending' then 'ad_change_requested'
                 else 'ad_change_reviewed' end;
   v_required:=(new.status='pending');
   if v_required then v_priority:='HIGH';end if;
   v_key:='ads:change:'||v_id||':'||new.status;
 else return new;
 end if;

 begin
  perform private.b7_ad_emit_inapp_owner(
   v_type,v_id,v_event,v_priority,v_required,v_key);
 exception when others then
  begin
   -- Do NOT say WhatsApp sent or create an EXTERNAL_SENT state. Use the
   -- already-immutable global audit ledger as manual retry evidence.
   insert into public.audit_logs(
     actor_user_id,action,record_type,record_id,metadata,created_at
   ) values(
     auth.uid(),'ad_notification_failed',v_type,v_id,
     jsonb_build_object('event',v_event,'sqlstate',SQLSTATE,
       'delivery','NOT_CONFIRMED','retry','OWNER_REVIEW_REQUIRED'),
     clock_timestamp()
   );
  exception when others then
   -- If independent audit subsystem is offline as well, the original
   -- advertisement/news business transaction must still not be blocked.
   null;
  end;
 end;
 return new;
end $tap$;
revoke all on function private.b7_ad_domain_notification_trigger()
 from public,anon,authenticated;

drop trigger if exists b7_notify_ad_campaign on public.ad_campaigns;
create trigger b7_notify_ad_campaign
 after insert or update of status on public.ad_campaigns
 for each row execute function private.b7_ad_domain_notification_trigger();

drop trigger if exists b7_notify_ad_verification on public.advertisers;
create trigger b7_notify_ad_verification
 after update of verification_state on public.advertisers
 for each row execute function private.b7_ad_domain_notification_trigger();

drop trigger if exists b7_notify_ad_payment on public.ad_payments;
create trigger b7_notify_ad_payment
 after insert or update of status on public.ad_payments
 for each row execute function private.b7_ad_domain_notification_trigger();

drop trigger if exists b7_notify_ad_creative on public.ad_creatives;
create trigger b7_notify_ad_creative
 after insert or update of approved on public.ad_creatives
 for each row execute function private.b7_ad_domain_notification_trigger();

-- Portal/renewal schemas are on a separate still-unapplied review migration.
-- Install the same adapter after those exact homes are present; otherwise
-- deny phantom notifications rather than creating duplicate request tables.
do $portal$
begin
 if to_regclass('public.ad_renewal_requests') is not null then
   execute 'drop trigger if exists b7_notify_ad_renewal on public.ad_renewal_requests';
   execute 'create trigger b7_notify_ad_renewal after insert or update of status on public.ad_renewal_requests for each row execute function private.b7_ad_domain_notification_trigger()';
 end if;
 if to_regclass('public.ad_change_requests') is not null then
   execute 'drop trigger if exists b7_notify_ad_change on public.ad_change_requests';
   execute 'create trigger b7_notify_ad_change after insert or update of status on public.ad_change_requests for each row execute function private.b7_ad_domain_notification_trigger()';
 end if;
end $portal$;

-- Owner-only recovery reads the IMMUTABLE audit failure record and retries
-- the SAME existing B3 in-app engine. It never changes the original failure,
-- never enqueues WhatsApp, never marks external provider "sent".
create or replace function public.jb_ad_notification_retry_internal(
 p_failure_audit_id bigint
) returns boolean language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $retry$
declare v public.audit_logs;v_event text;v_priority text;v_required boolean;
        v_count integer;v_current_status text;v_stale boolean:=false;
begin
 if not private.p4_owner_allowed() then raise exception 'OWNER_AAL2_REQUIRED';end if;
 if p_failure_audit_id is null or p_failure_audit_id<=0
 then raise exception 'INVALID_NOTIFICATION_FAILURE_REFERENCE';end if;
 -- Serialize concurrent Owner retries of ONE immutable failure record.
 -- FOR SHARE permits two sessions to read "no success" simultaneously
 -- and each append success audit evidence. FOR UPDATE is only a row lock:
 -- the immutable audit row itself is never updated or deleted.
 select * into v from public.audit_logs
 where id=p_failure_audit_id and action='ad_notification_failed'
   and metadata->>'delivery'='NOT_CONFIRMED'
 for update;
 if not found then raise exception 'AD_NOTIFICATION_FAILURE_NOT_FOUND';end if;
 if exists(select 1 from public.audit_logs l
    where l.action='ad_notification_retry_succeeded'
      and l.metadata->>'original_failure_id'=v.id::text)
 then return true;end if;
 v_event:=v.metadata->>'event';
 if v.record_type not in('ad_campaign','advertiser','ad_payment',
   'ad_creative','ad_renewal','ad_change')
   or v_event is null or v_event !~ '^ad_[a-z_]{2,48}$'
   or v.record_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 then raise exception 'INVALID_NOTIFICATION_FAILURE_REFERENCE';end if;
 v_required:=v_event in('ad_requested','ad_payment_pending','ad_hidden',
                      'ad_expired','ad_renewal_requested','ad_change_requested');
 v_priority:=case when v_required or v_event='ad_verified' then 'HIGH'
                  else 'NORMAL' end;

 -- A delayed failed LIVE/HIDE/request event can become stale after another
 -- canonical campaign transition. Send a generic Owner ACTION_REQUIRED
 -- workflow reminder instead of a misleading "Advertisement LIVE" claim.
 -- Never alter the immutable source failure audit.
 if v.record_type='ad_campaign' then
  select status into v_current_status from public.ad_campaigns
   where id=v.record_id::uuid;
  if v_current_status is distinct from substr(v_event,4) then
   v_stale:=true;v_event:='ad_workflow_updated';
   v_priority:='HIGH';v_required:=true;
  end if;
 elsif v.record_type='advertiser' and v_event='ad_verified' then
  select verification_state into v_current_status from public.advertisers
   where id=v.record_id::uuid;
  if v_current_status is distinct from 'verified' then
   v_stale:=true;v_event:='ad_workflow_updated';
   v_priority:='HIGH';v_required:=true;
  end if;
 elsif v.record_type='ad_payment' and v_event='ad_payment_confirmed' then
  select status into v_current_status from public.ad_payments
   where id=v.record_id::uuid;
  if v_current_status is distinct from 'confirmed' then
   v_stale:=true;v_event:='ad_workflow_updated';
   v_priority:='HIGH';v_required:=true;
  end if;
 end if;

 v_count:=private.b7_ad_emit_inapp_owner(
  v.record_type,v.record_id,v_event,v_priority,v_required,
  'ads:retry:'||v.id::text);
 if v_count<1 then raise exception 'AD_NOTIFICATION_NO_RETRY_RECEIPT';end if;
 insert into public.audit_logs(actor_user_id,action,record_type,record_id,
                               metadata,created_at)
 values(auth.uid(),'ad_notification_retry_succeeded',v.record_type,v.record_id,
        jsonb_build_object('original_failure_id',v.id::text,
                           'delivery','IN_APP_READY_ONLY',
                           'external_provider_sent',false,
                           'source_event',v.metadata->>'event',
                           'delivered_event',v_event,
                           'stale_state_sanitized',v_stale),clock_timestamp());
 return true;
end $retry$;
revoke all on function public.jb_ad_notification_retry_internal(bigint)
 from public,anon;
grant execute on function public.jb_ad_notification_retry_internal(bigint)
 to authenticated,service_role;

create or replace function public.jb_ad_notification_failures_internal()
returns jsonb language plpgsql stable security definer
set search_path to 'pg_catalog','public','private'
as $failed$
declare v jsonb;
begin
 if not private.p4_owner_allowed() then raise exception 'OWNER_AAL2_REQUIRED';end if;
 select coalesce(jsonb_agg(jsonb_build_object(
  'audit_id',x.id,'record_type',x.record_type,'record_id',x.record_id,
  'event',x.metadata->>'event','created_at',x.created_at)
  order by x.created_at desc,x.id desc),'[]'::jsonb)
 into v from (
  select l.id,l.record_type,l.record_id,l.metadata,l.created_at
  from public.audit_logs l where l.action='ad_notification_failed'
    and l.metadata->>'delivery'='NOT_CONFIRMED'
    and l.record_type in('ad_campaign','advertiser','ad_payment',
       'ad_creative','ad_renewal','ad_change')
    and not exists(select 1 from public.audit_logs s
      where s.action='ad_notification_retry_succeeded'
        and s.metadata->>'original_failure_id'=l.id::text)
  order by l.created_at desc,l.id desc limit 100
 ) x;
 return v;
end $failed$;
revoke all on function public.jb_ad_notification_failures_internal()
 from public,anon;
grant execute on function public.jb_ad_notification_failures_internal()
 to authenticated,service_role;

-- Existing notification_delivery_outbox / history is the ONLY source of
-- externally delivered status. No automatic WhatsApp/Email action here.
commit;
