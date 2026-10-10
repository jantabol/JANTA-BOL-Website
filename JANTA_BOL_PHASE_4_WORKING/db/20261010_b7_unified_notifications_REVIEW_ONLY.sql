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

-- Existing notification_delivery_outbox / history is the ONLY source of
-- externally delivered status. No automatic WhatsApp/Email action here.
commit;
