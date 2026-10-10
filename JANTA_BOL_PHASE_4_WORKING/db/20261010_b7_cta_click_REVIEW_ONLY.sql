-- JANTA BOL B7 / P4-T040 / ADS-048,049,050
-- REVIEW ONLY. Must run in disposable/staging AFTER qualified_impressions
-- REVIEW migration, NEVER on LIVE without paired source + security sign-off.
-- This reuses the canonical ad_events ledger and the ORIGINAL ad_view_tickets;
-- it is NOT a second click store, beacon, public redirect or analytics engine.
begin;

alter table public.ad_view_tickets
 add column if not exists click_at timestamptz;

-- The same one-use ticket may legitimately produce ONE visible impression
-- AND ONE user-initiated CTA click. Keep both event types individually
-- unique; do not allow either to duplicate even if a client retries.
drop index if exists public.b7_ad_event_one_ticket;
create unique index if not exists b7_ad_event_one_ticket_event
 on public.ad_events(view_ticket_hash,event_type)
 where view_ticket_hash is not null;

create or replace function public.jb_ad_record_ticket_click(p_token text)
returns boolean language plpgsql security definer
set search_path to 'pg_catalog','public','extensions'
as $cta_click$
declare v public.ad_view_tickets;v_now timestamptz;
begin
 if p_token is null or p_token !~ '^[0-9a-f]{48}$'
 then return false;end if;

 select * into v from public.ad_view_tickets
 where token_hash=encode(extensions.digest(p_token,'sha256'),'hex')
 for update;
 if not found then return false;end if;
 v_now:=clock_timestamp();
 -- ADS-029: the Article stays pinned for a 20-minute reading session.
 -- Viewability reporting remains short (3 min) but a real user may
 -- open the approved CTA later. Permit a bounded 30-minute click window
 -- without extending the view/impression ticket or auto-refreshing the ad.
 if v.click_at is not null or v_now>=v.issued_at+interval '30 minutes' then
   return false;
 end if;

 -- Only an ALREADY-approved CTA from the precise ticket-bound creative.
 -- Browser cannot assert a URL, scheme, campaign, district or destination.
 if not exists(
  select 1 from public.ad_creatives cr
  where cr.id=v.creative_id and cr.campaign_id=v.campaign_id
    and cr.approved=true
    and (
      (cr.cta_type in('website','map') and
        cr.cta_target ~* '^https://[a-z0-9.-]+(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
        and cr.cta_target !~ '[<>"''\\]'
        -- Backend must not count clicks to IP literal/localhost/intranet
        -- links the safe public renderer intentionally never displays.
        and split_part(split_part(cr.cta_target,'/',3),':',1)
          ~ '^[a-z0-9-]+([.][a-z0-9-]+)+$'
        and split_part(split_part(cr.cta_target,'/',3),':',1)
          !~* '(^|[.])(localhost|local|internal)$'
        and split_part(split_part(cr.cta_target,'/',3),':',1)
          !~ '^([0-9]{1,3}[.]){3}[0-9]{1,3}$')
      or (cr.cta_type in('call','whatsapp') and
        cr.cta_target ~ '^\+?[0-9][0-9 ()-]{5,19}$')
    )
 ) then return false;end if;

 update public.ad_view_tickets set click_at=v_now
 where token_hash=v.token_hash;
 insert into public.ad_events(
   campaign_id,event_type,created_at,view_ticket_hash,
   qualified,qualification_source
 ) values(
   v.campaign_id,'click',v_now,v.token_hash,
   true,'client_reported_cta_click'
 );
 return true;
end $cta_click$;
revoke all on function public.jb_ad_record_ticket_click(text)
 from public,anon,authenticated;
grant execute on function public.jb_ad_record_ticket_click(text)
 to anon,authenticated,service_role;

-- Keep Owner's old JSON keys compatible. An anonymous click is a
-- CLIENT-REPORTED CTA interaction, NOT verified-human reach.
-- Historical raw events stay in the same existing ledger, unsanitized
-- receipt IDs and viewer identity are not projected to public users.
create or replace function public.jb_ad_qualified_analytics_internal(p_campaign uuid)
returns jsonb language plpgsql stable security definer
set search_path to 'pg_catalog','public','private'
as $stats$
declare v jsonb;
begin
 if not private.p4_owner_allowed() then raise exception 'OWNER_AAL2_REQUIRED';end if;
 select jsonb_build_object(
   'today',count(*) filter(where event_type='impression' and qualified=true
     and created_at>=date_trunc('day',now())),
   'd7',count(*) filter(where event_type='impression' and qualified=true
     and created_at>=now()-interval '7 days'),
   'd30',count(*) filter(where event_type='impression' and qualified=true
     and created_at>=now()-interval '30 days'),
   'total',count(*) filter(where event_type='impression' and qualified=true),
   'unverified_legacy',count(*) filter(where qualified=false),
   'clicks_reported',count(*) filter(where event_type='click' and qualified=true
     and qualification_source='client_reported_cta_click'),
   'clicks_verified',0,
   'reach_type','client_reported_estimate_not_unique_people',
   'click_type','client_reported_user_interaction_not_verified_human',
   'anti_bot_verified',false
 ) into v from public.ad_events e where e.campaign_id=p_campaign;
 return v;
end $stats$;
revoke all on function public.jb_ad_qualified_analytics_internal(uuid)
 from public,anon,authenticated;
grant execute on function public.jb_ad_qualified_analytics_internal(uuid)
 to authenticated,service_role;

commit;
