\set ON_ERROR_STOP on
-- Local contract SHIM for EXISTING B3 unified notification engine.
-- Applied only to disposable PostgreSQL after b7-payment-fixture.sql.
-- No second engine is created in production; final LIVE B3 parity still DUE.
create type public.app_role as enum('owner','admin','editor','reporter');
create table public.user_roles(
 user_id uuid primary key,role public.app_role not null
);
insert into public.user_roles(user_id,role) values
 ('11111111-1111-1111-1111-111111111111','owner'),
 ('22222222-2222-2222-2222-222222222222','reporter');

create table public.live_notifications(
 id bigint generated always as identity primary key,
 recipient_user_id uuid not null,
 domain text not null,notification_type text not null,
 priority text not null,title text not null,safe_message text not null,
 record_type text not null,record_id text not null,
 action_required boolean not null,
 action_path text,dedupe_key text,metadata jsonb not null default '{}'::jsonb,
 delivery_state text not null default 'IN_APP_READY',
 created_at timestamptz not null default now(),
 unique(recipient_user_id,dedupe_key)
);

-- Signature-accurate B3 emitter stub: checks role, fail injection, dedupe,
-- metadata and returns original in-app receipt; never uses external API.
create or replace function public.jb_notification_emit_internal(
 p_recipient_user_id uuid,p_domain text,p_notification_type text,
 p_priority text,p_title text,p_safe_message text default '',
 p_record_type text default null,p_record_id text default null,
 p_action_required boolean default false,p_action_path text default null,
 p_dedupe_key text default null,p_metadata jsonb default '{}'::jsonb
) returns bigint language plpgsql security definer
set search_path to 'pg_catalog','public'
as $b3_shim$
declare v bigint;
begin
 if coalesce(current_setting('b7.test_notify_down',true),'')='yes'
 then raise exception 'SIMULATED_B3_NOTIFICATION_DOWN';end if;
 -- Deterministic concurrency fixture only. Delay happens AFTER the Owner
 -- retry has checked for a prior success, exposing any FOR SHARE race.
 if coalesce(current_setting('b7.test_notify_delay',true),'')='yes'
 then perform pg_catalog.pg_sleep(1.0);end if;
 if p_domain<>'ads' or p_priority not in('NORMAL','HIGH','CRITICAL')
 then raise exception 'B3_DOMAIN_OR_PRIORITY_NOT_ALLOWED';end if;
 if not exists(select 1 from public.user_roles
   where user_id=p_recipient_user_id and role='owner'::public.app_role)
 then raise exception 'B3_REVOKED_OR_NONOWNER_RECIPIENT';end if;
 insert into public.live_notifications(
   recipient_user_id,domain,notification_type,priority,title,
   safe_message,record_type,record_id,action_required,action_path,
   dedupe_key,metadata
 ) values(p_recipient_user_id,p_domain,p_notification_type,p_priority,
  p_title,p_safe_message,coalesce(p_record_type,p_domain),p_record_id,
  p_action_required,p_action_path,p_dedupe_key,coalesce(p_metadata,'{}'::jsonb))
 on conflict(recipient_user_id,dedupe_key) do update
 set title=excluded.title,priority=excluded.priority
 returning id into v;
 return v;
end $b3_shim$;

-- Exact EXISTING B7 Portal homes (synthetic columns only). No duplicate
-- ad campaign/creative/payment source-of-truth is created by migration.
create table public.ad_renewal_requests(
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references public.ad_campaigns(id),
 status text not null default 'pending',
 created_at timestamptz not null default now()
);
create table public.ad_change_requests(
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references public.ad_campaigns(id),
 status text not null default 'pending',
 request_text text not null default '',
 created_at timestamptz not null default now()
);
