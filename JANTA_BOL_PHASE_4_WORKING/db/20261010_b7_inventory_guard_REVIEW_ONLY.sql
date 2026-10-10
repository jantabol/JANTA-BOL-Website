-- JANTA BOL B7-G4 / ADS-032, ADS-033 — REVIEW ONLY / NOT PROD.
-- Launch sale reservation is GLOBAL PER PLACEMENT/ENFORCED WINDOW.
-- Conservative shared capacity avoids district/tehsil promises consuming
-- the same single Article slot twice. Future exact geo forecasts require proof.
-- This is booked *guaranteed minimum* capacity, NOT qualified impression counts.
-- No cap rows exist until Owner reviews independent traffic evidence.
begin;

create table if not exists public.ad_inventory_windows(
 id uuid primary key default gen_random_uuid(),
 placement text not null check(placement in ('article','homepage')),
 starts_at timestamptz not null,
 ends_at timestamptz not null,
 max_guaranteed_impressions bigint not null check(
   max_guaranteed_impressions between 1 and 1000000000),
 forecast_evidence_ref text not null check(
   length(btrim(forecast_evidence_ref)) between 8 and 300),
 reviewed_by uuid not null,
 created_at timestamptz not null default now(),
 check(ends_at>starts_at)
);
create index if not exists b7_inventory_window_period_idx
 on public.ad_inventory_windows(placement,starts_at,ends_at);

create table if not exists public.ad_inventory_reservations(
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references public.ad_campaigns(id) on delete restrict,
 window_id uuid not null references public.ad_inventory_windows(id) on delete restrict,
 guaranteed_min_impressions bigint not null check(
   guaranteed_min_impressions between 1 and 1000000000),
 agreed_terms_ref text not null check(length(btrim(agreed_terms_ref))>=8),
 booked_by uuid not null,
 booked_at timestamptz not null default now(),
 unique(campaign_id,window_id)
);
create index if not exists b7_inventory_reserved_total_idx
 on public.ad_inventory_reservations(window_id);
alter table public.ad_inventory_windows enable row level security;
alter table public.ad_inventory_reservations enable row level security;
revoke all on public.ad_inventory_windows,public.ad_inventory_reservations
 from public,anon,authenticated;

-- No capacity can be sold twice by overlap. Advisory lock on placement is held
-- until commit, including during SQL sessions trying simultaneous new windows.
create or replace function private.b7_inventory_window_before_insert()
returns trigger language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $window_guard$
begin
 if not private.p4_owner_allowed() or new.reviewed_by is distinct from auth.uid()
 then raise exception 'OWNER_AAL2_REQUIRED';end if;
 perform pg_catalog.pg_advisory_xact_lock(
   pg_catalog.hashtextextended('b7_inventory_window:'||new.placement,0));
 if exists(select 1 from public.ad_inventory_windows w
     where w.placement=new.placement
       and tstzrange(w.starts_at,w.ends_at,'[)') &&
           tstzrange(new.starts_at,new.ends_at,'[)'))
 then raise exception 'OVERLAPPING_INVENTORY_WINDOW';end if;
 return new;
end $window_guard$;
drop trigger if exists b7_inventory_window_before_insert on public.ad_inventory_windows;
create trigger b7_inventory_window_before_insert
 before insert on public.ad_inventory_windows
 for each row execute function private.b7_inventory_window_before_insert();
revoke all on function private.b7_inventory_window_before_insert()
 from public,anon,authenticated;

create or replace function public.jb_ad_create_inventory_window_internal(
 p_placement text,p_start timestamptz,p_end timestamptz,
 p_max_guaranteed bigint,p_forecast_evidence_ref text
) returns uuid language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $window$
declare v_id uuid;v_ref text;
begin
 if not private.p4_owner_allowed() then raise exception 'OWNER_AAL2_REQUIRED';end if;
 v_ref:=btrim(coalesce(p_forecast_evidence_ref,''));
 if p_placement is null or p_placement not in ('article','homepage')
   or p_start is null or p_end is null or not isfinite(p_start) or not isfinite(p_end)
   or p_start<now()-interval '1 hour' or p_end<=p_start
   or p_max_guaranteed is null or p_max_guaranteed not between 1 and 1000000000
   or length(v_ref)<8 or length(v_ref)>300
 then raise exception 'INVALID_INVENTORY_FORECAST';end if;
 insert into public.ad_inventory_windows(
   placement,starts_at,ends_at,max_guaranteed_impressions,
   forecast_evidence_ref,reviewed_by
 ) values(p_placement,p_start,p_end,p_max_guaranteed,v_ref,auth.uid())
 returning id into v_id;
 insert into public.audit_logs(actor_user_id,action,record_type,record_id,metadata,created_at)
 values(auth.uid(),'ad_inventory_capacity_approved','ad_inventory_window',v_id::text,
   jsonb_build_object('placement',p_placement,'max_guaranteed',p_max_guaranteed,
    'start_utc',p_start,'end_utc',p_end,'source_provided',true),now());
 return v_id;
end $window$;
revoke all on function public.jb_ad_create_inventory_window_internal(
 text,timestamptz,timestamptz,bigint,text) from public,anon;
grant execute on function public.jb_ad_create_inventory_window_internal(
 text,timestamptz,timestamptz,bigint,text) to authenticated,service_role;

-- One DB-locked row per period/placement serializes all concurrent booking
-- attempts. Triggers protect even direct legacy service-side writes.
create or replace function private.b7_inventory_reservation_before_insert()
returns trigger language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $reserve$
declare v public.ad_inventory_windows;c public.ad_campaigns;
        a public.advertisers; already bigint;
begin
 if not private.p4_owner_allowed() or new.booked_by is distinct from auth.uid()
 then raise exception 'OWNER_AAL2_REQUIRED';end if;
 select * into v from public.ad_inventory_windows
 where id=new.window_id for update;
 if not found then raise exception 'INVENTORY_WINDOW_NOT_FOUND';end if;
 select * into c from public.ad_campaigns
 where id=new.campaign_id for update;
 if not found then raise exception 'CAMPAIGN_NOT_FOUND';end if;
 select * into a from public.advertisers where id=c.advertiser_id;
 if a.id is null or a.verification_state<>'verified'
 then raise exception 'ADVERTISER_VERIFICATION_REQUIRED';end if;
 if c.status not in ('approved','payment_pending')
   or c.paid_at is not null
   or exists(select 1 from public.ad_payments p
     where p.campaign_id=c.id and p.status='confirmed')
 then raise exception 'PAID_OR_INVALID_BOOKING_STATE';end if;
 if c.placement<>v.placement
   or c.starts_at is null or c.ends_at is null
   or c.starts_at>v.starts_at or c.ends_at<v.ends_at
 then raise exception 'CAMPAIGN_WINDOW_NOT_COVERED';end if;
 if c.agreed_price_minor is null or c.agreed_price_minor<=0
   or c.agreed_terms_recorded_at is null
   or c.agreed_terms_ref is distinct from new.agreed_terms_ref
 then raise exception 'BOOKING_TERMS_NOT_APPROVED';end if;
 select coalesce(sum(r.guaranteed_min_impressions),0) into already
 from public.ad_inventory_reservations r where r.window_id=new.window_id;
 if already+new.guaranteed_min_impressions>v.max_guaranteed_impressions
 then raise exception 'CAPACITY_EXCEEDED';end if;
 return new;
end $reserve$;
drop trigger if exists b7_inventory_reservation_before_insert on public.ad_inventory_reservations;
create trigger b7_inventory_reservation_before_insert
 before insert on public.ad_inventory_reservations
 for each row execute function private.b7_inventory_reservation_before_insert();
revoke all on function private.b7_inventory_reservation_before_insert()
 from public,anon,authenticated;

-- Preserve sold commitments. A negotiated change/refund/termination needs
-- a separately-reviewed compensating version, not silent UPDATE/DELETE.
create or replace function private.b7_inventory_immutable()
returns trigger language plpgsql security definer
set search_path to 'pg_catalog'
as $immutable$
begin
 raise exception 'IMMUTABLE_AD_INVENTORY_COMMITMENT';
end $immutable$;
drop trigger if exists b7_inventory_window_immutable on public.ad_inventory_windows;
create trigger b7_inventory_window_immutable
 before update or delete on public.ad_inventory_windows
 for each row execute function private.b7_inventory_immutable();
drop trigger if exists b7_inventory_reservation_immutable on public.ad_inventory_reservations;
create trigger b7_inventory_reservation_immutable
 before update or delete on public.ad_inventory_reservations
 for each row execute function private.b7_inventory_immutable();
revoke all on function private.b7_inventory_immutable()
 from public,anon,authenticated;

create or replace function public.jb_ad_reserve_inventory_internal(
 p_campaign uuid,p_window uuid,p_guaranteed_min bigint,p_terms_ref text
) returns uuid language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $reservation$
declare v_id uuid;v_ref text;
begin
 if not private.p4_owner_allowed() then raise exception 'OWNER_AAL2_REQUIRED';end if;
 v_ref:=btrim(coalesce(p_terms_ref,''));
 if p_guaranteed_min is null or p_guaranteed_min not between 1 and 1000000000
   or length(v_ref)<8 or length(v_ref)>300
 then raise exception 'INVALID_BOOKING_PROMISE';end if;
 insert into public.ad_inventory_reservations(
  campaign_id,window_id,guaranteed_min_impressions,agreed_terms_ref,booked_by
 ) values(p_campaign,p_window,p_guaranteed_min,v_ref,auth.uid())
 returning id into v_id;
 insert into public.ad_history(campaign_id,event_type,note,actor_user_id)
 values(p_campaign,'inventory_guarantee_reserved',
  'Owner-backed minimum qualified impressions reserved in reviewed window; booking '||v_id::text,
  auth.uid());
 insert into public.audit_logs(actor_user_id,action,record_type,record_id,metadata,created_at)
 values(auth.uid(),'ad_inventory_booked','ad_campaign',p_campaign::text,
  jsonb_build_object('window_id',p_window,'reservation_id',v_id,
   'minimum_views',p_guaranteed_min,'signed_terms_present',true),now());
 return v_id;
end $reservation$;
revoke all on function public.jb_ad_reserve_inventory_internal(uuid,uuid,bigint,text)
 from public,anon;
grant execute on function public.jb_ad_reserve_inventory_internal(uuid,uuid,bigint,text)
 to authenticated,service_role;
commit;
