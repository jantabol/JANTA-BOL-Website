-- JANTA BOL / B7 / BE07 — SOURCE-ONLY / DISPOSABLE CI ONLY.
-- Independent gate layered on top of EXISTING original ad_campaigns table
-- and the preceding manual-payment trigger. NOT an authorized LIVE migration.
-- Preserve B5, B3, article URLs, original ad history and old emergency hide.
-- This interim policy permits only VERIFIED text creative LIVE; image/video
-- remain fail-closed until real first-party server receipts/Owner approval.
-- DO NOT CREATE lifecycle-capability sentinel until all B7 release gates hold.
begin;
do $preflight$
begin
 if to_regclass('public.ad_campaigns') is null
    or to_regclass('public.ad_creatives') is null
    or to_regclass('public.ad_payments') is null
    or to_regclass('public.advertisers') is null
    or to_regprocedure('private.b7_campaign_live_guard()') is null
    or to_regprocedure('private.p4_owner_allowed()') is null
 then raise exception 'B7_LIFECYCLE_PRECHECK_DEPENDENCIES_MISSING';end if;
 if to_regprocedure('public.jb_ad_transition_internal(uuid,text,text)') is not null then
  -- Existing LIVE owner RPC remains single home; guard every TABLE write.
  null;
 end if;
 if to_regprocedure('public.jb_ad_lifecycle_capability_internal()') is not null
 then raise exception 'LIFECYCLE_CAPABILITY_ALREADY_PRESENT_INDEPENDENT_REVIEW';end if;
end $preflight$;

create or replace function private.b7_verified_state_guard()
returns trigger language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $b7_state$
declare v public.ad_campaigns%rowtype;
begin
 if tg_op='INSERT' then
  if new.status in('approved','payment_pending','live')
  then raise exception 'B7_NO_DIRECT_POSITIVE_STATUS_INSERT';end if;
  return new;
 end if;
 if new.status is not distinct from old.status then return new;end if;
 -- Emergency Owner safety actions, and normal reject/expiry, remain intact.
 -- Existing Owner gateway and RLS still govern who may use those paths.
 if new.status not in ('approved','payment_pending','live')
 then return new;end if;
 if not private.p4_owner_allowed()
 then raise exception 'OWNER_AAL2_REQUIRED';end if;
 if not exists(select 1 from public.advertisers a
  where a.id=new.advertiser_id and a.verification_state='verified')
 then raise exception 'B7_ADVERTISER_NOT_VERIFIED';end if;
 if new.approved_by is null or new.approved_at is null
 then raise exception 'B7_EXPLICIT_OWNER_APPROVAL_MISSING';end if;
 if not exists(select 1 from public.ad_creatives cr
  where cr.campaign_id=new.id and cr.approved is true
    and (cr.creative_type='text' and length(btrim(coalesce(cr.text_body,'')))>=2))
 then raise exception 'B7_VERIFIED_TEXT_CREATIVE_REQUIRED';end if;
 if new.status='approved' then
  if old.status not in('requested','review')
  then raise exception 'B7_INVALID_APPROVAL_TRANSITION';end if;
  return new;
 end if;
 if new.status='payment_pending' then
  if old.status<>'approved' or coalesce(new.agreed_price_minor,0)<=0
     or new.agreed_terms_recorded_at is null
     or length(btrim(coalesce(new.agreed_terms_ref,'')))<8
  then raise exception 'B7_PAYMENT_PENDING_TERMS_REQUIRED';end if;
  return new;
 end if;
 -- LIVE/resume: exact settled real receipt, terms acceptance, schedule
 -- and Owner approval are independently rechecked on every transition.
 if old.status not in('paid','paused')
 then raise exception 'B7_LIVE_INVALID_SOURCE_STATE';end if;
 if new.paid_at is null or new.non_refund_accepted_at is null
    or new.starts_at is null or new.ends_at is null
    or not (new.starts_at<=now() and new.ends_at>now())
    or new.ends_at<=new.starts_at or new.hidden_at is not null
    or coalesce(new.agreed_price_minor,0)<=0
    or length(btrim(coalesce(new.agreed_terms_ref,'')))<8
    or new.agreed_terms_recorded_at is null
 then raise exception 'B7_LIVE_TERMS_OR_SCHEDULE_MISSING';end if;
 if not exists (
  select 1 from public.ad_payments p
  where p.campaign_id=new.id and p.status='confirmed'
   and p.currency='INR' and p.amount_minor=new.agreed_price_minor
   and p.terms_accepted_at=new.non_refund_accepted_at
   and p.method in('upi','bank','cash')
   and p.verified_by is not null and p.verified_at is not null
   and p.receipt_at is not null
   and p.terms_accepted_at<=p.receipt_at
   and length(btrim(coalesce(p.provider_ref,'')))>=8
   and length(btrim(coalesce(p.evidence_ref,'')))>=8
   and length(btrim(coalesce(p.acceptance_ref,'')))>=8
   and length(btrim(coalesce(p.verification_note,'')))>=10
 ) then raise exception 'B7_LIVE_VERIFIED_RECEIPT_MISSING';end if;
 return new;
end $b7_state$;

drop trigger if exists b7_verified_state_guard on public.ad_campaigns;
create trigger b7_verified_state_guard
before insert or update of status on public.ad_campaigns
for each row execute function private.b7_verified_state_guard();
revoke all on function private.b7_verified_state_guard()
 from public,anon,authenticated;
-- Deliberately NO public "readiness" sentinel, no new ad feed,
-- and NO privileges granted to anon/authenticated for the private guard.
commit;
