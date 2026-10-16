-- T036 CP02 REVIEW-ONLY / DISPOSABLE Postgres17. DO NOT APPLY PRODUCTION.
-- Pair this SQL with viewer bridge only AFTER release authorization, verified
-- secure media/geo backend, real Owner E5 and Android emergency-hide E3.
begin;
do $preflight$
begin
 if to_regclass('public.ad_campaigns') is null
    or to_regclass('public.ad_creatives') is null
    or to_regclass('public.ad_payments') is null
    or to_regprocedure('public.jb_ad_transition_internal(uuid,text,text)') is null
    or to_regprocedure('private.p4_owner_allowed()') is null
 then raise exception 'T036_CP02_LEGACY_SOURCE_DEPENDENCY_MISSING';end if;
 if to_regprocedure('public.jb_ad_visibility_alive_public(uuid,uuid)') is not null
    or to_regprocedure('public.jb_ad_safety_transition_idempotent_internal(uuid,text,text)') is not null
 then raise exception 'T036_CP02_ALREADY_DEPLOYED_OR_NAME_CONFLICT_STOP';end if;
end $preflight$;

-- ADS-019: anonymous response ONLY says whether exactly the already-shown
-- pair is still eligible. Never send payment/advertiser data; never select a
-- replacement creative. The same server state, clock and receipt needed for
-- the main public feed are independently checked; no caller geo assertion.
create function public.jb_ad_visibility_alive_public(
 p_campaign uuid,p_creative uuid
) returns boolean language sql stable security definer
set search_path = 'pg_catalog' as $visibility$
 select exists (
  select 1 from public.ad_campaigns c
  join public.ad_creatives cr on cr.campaign_id=c.id
   and cr.id=p_creative and cr.approved is true
  where c.id=p_campaign and c.status='live'
    and c.hidden_at is null
    and c.approved_at is not null
    and c.paid_at is not null
    and c.non_refund_accepted_at is not null
    and c.starts_at<=now() and c.ends_at>now()
    and exists (
     select 1 from public.ad_payments pay
     where pay.campaign_id=c.id and pay.status='confirmed'
       and pay.amount_minor>0
    )
    and not exists (
     select 1 from public.advertisers a
     where a.id=c.advertiser_id and a.risk_level='high'
      and a.verification_state<>'verified'
    )
 )
$visibility$;
revoke all on function public.jb_ad_visibility_alive_public(uuid,uuid)
 from public,anon,authenticated;
grant execute on function public.jb_ad_visibility_alive_public(uuid,uuid)
 to anon,authenticated;

-- ADS-023: Owner-only safety transitions have the exact LEGACY transition as
-- single state/audit writer, but an existing same-state is a no-op under a
-- row-level lock. Positive LIVE/APPROVED/PAYMENT states NEVER handled here.
-- Keep existing emergency HIDE RPC operational until paired rollout; do not
-- change it or silently replace any LIVE audit.
create function public.jb_ad_safety_transition_idempotent_internal(
 p_id uuid,p_status text,p_note text default ''
) returns public.ad_campaigns language plpgsql security definer
set search_path = 'pg_catalog' as $safety$
declare v public.ad_campaigns%rowtype;
begin
 if not private.p4_owner_allowed()
 then raise exception 'OWNER_AAL2_REQUIRED' using errcode='42501';end if;
 if p_status not in ('paused','hidden','expired','rejected','cancelled')
 then raise exception 'T036_CP02_SAFETY_ONLY' using errcode='22023';end if;
 select * into v from public.ad_campaigns where id=p_id for update;
 if not found then raise exception 'AD_CAMPAIGN_NOT_FOUND' using errcode='P0002';end if;
 if v.status=p_status then return v;end if;
 -- This is intentional: original guard, existing audit and ad_history remain
 -- the only authority for an actual state change.
 select * into v from public.jb_ad_transition_internal(p_id,p_status,p_note);
 return v;
end $safety$;
revoke all on function public.jb_ad_safety_transition_idempotent_internal(uuid,text,text)
 from public,anon,authenticated;
grant execute on function public.jb_ad_safety_transition_idempotent_internal(uuid,text,text)
 to authenticated;
commit;
