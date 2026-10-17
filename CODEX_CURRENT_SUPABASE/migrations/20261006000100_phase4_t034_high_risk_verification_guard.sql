-- Phase 4 B5 / P4-T034 minimum-safe high-risk advertisement verification guard.
-- Applied to production as migration phase4_t034_high_risk_verification_guard on 2026-10-06.
-- Preserves existing Owner+AAL2 and confirmed-payment fail-closed guards.

create or replace function public.jb_ad_transition_internal(
  p_id uuid,
  p_status text,
  p_note text default ''::text
)
returns public.ad_campaigns
language plpgsql
security definer
set search_path to 'pg_catalog','public','private'
as $function$
declare
  v public.ad_campaigns;
begin
  if not private.p4_owner_allowed() then
    raise exception 'OWNER_AAL2_REQUIRED';
  end if;

  if p_status not in ('review','approved','payment_pending','live','paused','hidden','expired','rejected','cancelled') then
    raise exception 'INVALID_AD_STATUS';
  end if;

  if p_status in ('approved','payment_pending','live')
     and exists (
       select 1
       from public.ad_campaigns c
       join public.advertisers a on a.id = c.advertiser_id
       where c.id = p_id
         and a.risk_level = 'high'
         and a.verification_state <> 'verified'
     )
  then
    raise exception 'ENHANCED_VERIFICATION_REQUIRED';
  end if;

  if p_status='live'
     and not exists (
       select 1 from public.ad_payments
       where campaign_id=p_id and status='confirmed'
     )
  then
    raise exception 'PAYMENT_NOT_CONFIRMED';
  end if;

  update public.ad_campaigns
  set status=p_status,
      approved_by=case when p_status='approved' then auth.uid() else approved_by end,
      approved_at=case when p_status='approved' then now() else approved_at end,
      hidden_at=case when p_status='hidden' then now() else hidden_at end,
      updated_at=now()
  where id=p_id
  returning * into v;

  if not found then
    raise exception 'AD_CAMPAIGN_NOT_FOUND';
  end if;

  insert into public.ad_history(campaign_id,event_type,note,actor_user_id)
  values(p_id,p_status,left(coalesce(p_note,''),2000),auth.uid());

  insert into public.audit_logs(actor_user_id,action,record_type,record_id,metadata,created_at)
  values(auth.uid(),'ad_status','ad_campaign',p_id::text,jsonb_build_object('status',p_status),now());

  return v;
end
$function$;
