-- JANTA BOL / B7 / P4-T038 / ADS-035..040 -- STAGING REVIEW ONLY.
-- Never execute on LIVE production without isolated schema-parity and Owner approval.
-- Existing campaign, payment, creative, history and audit homes preserved.
-- Manual payment only: trusted bank ledger / UPI receipt / cash ledger checked by Owner.
-- No payment provider automation is claimed. No confirmed payment without real evidence.
begin;

alter table public.ad_campaigns
 add column if not exists agreed_price_minor bigint,
 add column if not exists agreed_terms_ref text,
 add column if not exists agreed_terms_recorded_at timestamptz;

alter table public.ad_payments
 add column if not exists method text,
 add column if not exists receipt_at timestamptz,
 add column if not exists evidence_ref text,
 add column if not exists acceptance_ref text,
 add column if not exists terms_accepted_at timestamptz,
 add column if not exists verified_by uuid,
 add column if not exists verified_at timestamptz,
 add column if not exists verification_note text;

create unique index if not exists b7_confirmed_payment_reference_unique
 on public.ad_payments (lower(btrim(provider_ref))) where status='confirmed';
create unique index if not exists b7_one_confirmed_payment_per_campaign
 on public.ad_payments (campaign_id) where status='confirmed';

-- Only Owner can set the agreed quotation, and no already-paid contract can be
-- silently rewritten. Contract price can only be set after actual agreement.
create or replace function public.jb_ad_set_approved_quote_internal(
 p_campaign uuid,p_price_minor bigint,p_terms_ref text
) returns void language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $quote$
declare v public.ad_campaigns; v_ref text;
begin
 if not private.p4_owner_allowed() then raise exception 'OWNER_AAL2_REQUIRED';end if;
 v_ref:=btrim(coalesce(p_terms_ref,''));
 if coalesce(p_price_minor,0)<=0 or length(v_ref)<8 or length(v_ref)>300 then
   raise exception 'INVALID_QUOTE_TERMS';end if;
 select * into v from public.ad_campaigns where id=p_campaign for update;
 if not found or v.status not in('requested','review','approved','payment_pending')
 then raise exception 'QUOTE_STATE_NOT_EDITABLE';end if;
 if exists(select 1 from public.ad_payments
           where campaign_id=p_campaign and status='confirmed')
 then raise exception 'CONFIRMED_QUOTE_IMMUTABLE';end if;
 if v.package_id is not null and
    (v.package_snapshot->>'price_minor') is distinct from p_price_minor::text
 then raise exception 'PACKAGE_SNAPSHOT_PRICE_MISMATCH';end if;
 update public.ad_campaigns
 set agreed_price_minor=p_price_minor,agreed_terms_ref=v_ref,
     agreed_terms_recorded_at=now(),updated_at=now()
 where id=p_campaign;
 insert into public.ad_history(campaign_id,event_type,note,actor_user_id)
 values(p_campaign,'manual_quote_agreed',
        'Price in INR paise: '||p_price_minor::text||'; terms reference='||v_ref,auth.uid());
 insert into public.audit_logs(actor_user_id,action,record_type,record_id,metadata,created_at)
 values(auth.uid(),'ad_quote_agreed','ad_campaign',p_campaign::text,
        jsonb_build_object('amount_minor',p_price_minor,'has_terms_reference',true),now());
end $quote$;

-- All routes, including old Owner RPCs, converge on this BEFORE trigger.
-- A legacy "confirmed" insert without actual consent/receipt must fail closed.
create or replace function private.b7_payment_evidence_guard()
returns trigger language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $payment_guard$
declare c public.ad_campaigns; a public.advertisers;
begin
 if tg_op in('UPDATE','DELETE') then
   if old.status='confirmed' then
     raise exception 'CONFIRMED_PAYMENT_IMMUTABLE';end if;
 end if;
 if tg_op='DELETE' then return old;end if;
 if new.status<>'confirmed' then return new;end if;
 if not private.p4_owner_allowed() then raise exception 'OWNER_AAL2_REQUIRED';end if;
 if new.currency<>'INR' or coalesce(new.amount_minor,0)<=0
    or length(btrim(coalesce(new.provider_ref,'')))<8
    or length(btrim(coalesce(new.provider_ref,'')))>120
    or new.method is null or new.method not in ('upi','bank','cash')
    or length(btrim(coalesce(new.evidence_ref,'')))<8
    or length(btrim(coalesce(new.acceptance_ref,'')))<8
    or length(btrim(coalesce(new.verification_note,'')))<10
    or new.terms_accepted_at is null or new.receipt_at is null
    or new.terms_accepted_at>now() or new.receipt_at>now()
    or new.terms_accepted_at<now()-interval '365 days'
    or new.receipt_at<now()-interval '365 days'
    or new.verified_by is distinct from auth.uid()
    or new.verified_at is null or new.verified_at>now() then
   raise exception 'MANUAL_PAYMENT_EVIDENCE_REQUIRED';end if;
 select * into c from public.ad_campaigns where id=new.campaign_id for update;
 if not found or c.status not in('approved','payment_pending') or
    c.approved_by is null or c.approved_at is null then
   raise exception 'OWNER_APPROVAL_REQUIRED_BEFORE_PAYMENT';end if;
 select * into a from public.advertisers where id=c.advertiser_id;
 if a.id is null or a.verification_state<>'verified' then
   raise exception 'ADVERTISER_VERIFICATION_REQUIRED';end if;
 if c.agreed_price_minor is null or c.agreed_price_minor<>new.amount_minor
    or length(btrim(coalesce(c.agreed_terms_ref,'')))<8
    or c.agreed_terms_recorded_at is null then
   raise exception 'APPROVED_PRICE_TERMS_MISMATCH';end if;
 if c.package_id is not null and
    (c.package_snapshot->>'price_minor') is distinct from new.amount_minor::text
 then raise exception 'PACKAGE_SNAPSHOT_PRICE_MISMATCH';end if;
 if not exists(select 1 from public.ad_creatives cr
   where cr.campaign_id=c.id and cr.approved=true) then
   raise exception 'APPROVED_CREATIVE_REQUIRED';end if;
 -- Advertiser's acceptance must precede receipt. Owner cannot manufacture it
 -- from merely clicking CONFIRM; an independent acceptance reference is required.
 if new.terms_accepted_at>new.receipt_at or
    new.terms_accepted_at<c.agreed_terms_recorded_at or
    new.terms_accepted_at>c.agreed_terms_recorded_at + interval '365 days'
 then raise exception 'TERMS_ACCEPTANCE_CHRONOLOGY_INVALID';end if;
 return new;
end $payment_guard$;

drop trigger if exists b7_guard_manual_payment_evidence on public.ad_payments;
create trigger b7_guard_manual_payment_evidence
before insert or update or delete on public.ad_payments
for each row execute function private.b7_payment_evidence_guard();
revoke all on function private.b7_payment_evidence_guard() from public,anon,authenticated;

create or replace function public.jb_ad_confirm_manual_payment_internal(
 p_campaign uuid,p_reference text,p_amount_minor bigint,p_method text,
 p_receipt_at timestamptz,p_evidence_ref text,
 p_acceptance_ref text,p_terms_accepted_at timestamptz,
 p_verification_note text,p_confirm text
) returns uuid language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $confirm$
declare v uuid; v_campaign public.ad_campaigns;
begin
 if not private.p4_owner_allowed() then raise exception 'OWNER_AAL2_REQUIRED';end if;
 if p_confirm is distinct from 'CONFIRM' then raise exception 'EXPLICIT_CONFIRM_REQUIRED';end if;
 if p_amount_minor is null or p_amount_minor<=0 then
   raise exception 'INVALID_PAYMENT_AMOUNT';end if;
 select * into v_campaign from public.ad_campaigns
 where id=p_campaign for update;
 if not found then raise exception 'CAMPAIGN_NOT_FOUND';end if;
 -- The database trigger verifies receipt, Owner, agreement, creative, price,
 -- advertiser identity and all competing legacy insert paths atomically.
 insert into public.ad_payments(
  campaign_id,provider_ref,status,amount_minor,currency,
  method,receipt_at,evidence_ref,acceptance_ref,terms_accepted_at,
  verified_by,verified_at,verification_note
 ) values(
  p_campaign,btrim(p_reference),'confirmed',p_amount_minor,'INR',
  lower(btrim(p_method)),p_receipt_at,btrim(p_evidence_ref),
  btrim(p_acceptance_ref),p_terms_accepted_at,
  auth.uid(),now(),btrim(p_verification_note)
 ) returning id into v;
 update public.ad_campaigns
 set status='paid',paid_at=now(),
     non_refund_accepted_at=p_terms_accepted_at,updated_at=now()
 where id=p_campaign;
 insert into public.ad_history(campaign_id,event_type,note,actor_user_id)
 values(p_campaign,'manual_payment_confirmed',
        'Receipt verified ('||lower(btrim(p_method))||'); reference ID recorded in private payment ledger.',auth.uid());
 insert into public.audit_logs(actor_user_id,action,record_type,record_id,metadata,created_at)
 values(auth.uid(),'ad_payment_confirmed','ad_campaign',p_campaign::text,
        jsonb_build_object('amount_minor',p_amount_minor,'method',lower(btrim(p_method)),
                           'receipt_evidence_present',true,'consent_evidence_present',true),now());
 return v;
end $confirm$;
revoke all on function public.jb_ad_confirm_manual_payment_internal(
 uuid,text,bigint,text,timestamptz,text,text,timestamptz,text,text
) from public,anon;
grant execute on function public.jb_ad_confirm_manual_payment_internal(
 uuid,text,bigint,text,timestamptz,text,text,timestamptz,text,text
) to authenticated,service_role;

-- Last-mile emergency authority: even an old transition RPC cannot mark an
-- unapproved, future/expired, unpaid or invalid creative campaign LIVE.
create or replace function private.b7_campaign_live_guard()
returns trigger language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $live$
begin
 if new.status='live' and (tg_op='INSERT' or old.status is distinct from 'live') then
  if not private.p4_owner_allowed() then raise exception 'OWNER_AAL2_REQUIRED';end if;
  if new.approved_at is null or new.approved_by is null
     or new.paid_at is null or new.non_refund_accepted_at is null
     or new.starts_at is null or new.ends_at is null
     or new.starts_at>now() or new.ends_at<=now()
     or new.ends_at<=new.starts_at
     or new.hidden_at is not null
  then raise exception 'AD_NOT_ELIGIBLE_FOR_LIVE';end if;
  if not exists (
   select 1 from public.advertisers a where a.id=new.advertiser_id
     and a.verification_state='verified'
  ) or not exists (
   select 1 from public.ad_payments p
   where p.campaign_id=new.id and p.status='confirmed'
     and p.amount_minor=new.agreed_price_minor
     and p.terms_accepted_at=new.non_refund_accepted_at
  ) or not exists (
   select 1 from public.ad_creatives cr where cr.campaign_id=new.id and cr.approved=true
  ) then raise exception 'AD_NOT_ELIGIBLE_FOR_LIVE';end if;
 end if;
 return new;
end $live$;

drop trigger if exists b7_guard_campaign_live on public.ad_campaigns;
create trigger b7_guard_campaign_live
before insert or update of status on public.ad_campaigns
for each row execute function private.b7_campaign_live_guard();
revoke all on function private.b7_campaign_live_guard() from public,anon,authenticated;

commit;
