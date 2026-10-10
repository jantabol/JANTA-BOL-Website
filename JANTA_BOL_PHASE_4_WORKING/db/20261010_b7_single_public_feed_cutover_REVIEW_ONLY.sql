-- B7-G3/G4, ADS-014/028/029/030: CUTOVER CANDIDATE / REVIEW ONLY.
-- IMPORTANT: DO NOT APPLY TO PRODUCTION. Existing deployed article client sends
-- free-text 'local' or 'district:x', NOT the required 'article:<uuid>' scope.
-- A paired frontend deployment, official verified MP LGD catalog, AAL2 evidence,
-- independent payment+inventory and impression gates must finish BEFORE cutover.
--
-- One and ONLY one existing public ad selection authority is retained:
--   jb_ad_public_feed(text,text) -- existing signature, no new public feed.
-- 'article:<uuid>' is ONLY a published Article IDENTIFIER, never caller-chosen
-- district/tehsil. All geographic matching occurs in the server's private helper.
-- Homepage scope is constant 'global', limited to explicitly reviewed
-- MP-state/National bookings. The legacy jb_public_active_ads() delegates here.
-- This migration deliberately cannot approve/activate or change any campaign.
begin;

create or replace function public.jb_ad_public_feed(
 p_placement text,p_scope text default 'global'
) returns table(
 campaign_id uuid,creative_id uuid,creative_type text,media_url text,
 text_body text,cta_type text,cta_target text,label text
)
language sql volatile security definer
set search_path to 'pg_catalog'
as $canonical$
with requested as materialized (
 select case
  when p_placement='article'
   and p_scope ~* '^article:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  then substring(p_scope from 9)::uuid
  else null::uuid
 end as article_id
), article_pick as materialized (
 select f.campaign_id,f.creative_id,f.creative_type,f.media_url,
   f.text_body,f.cta_type,f.cta_target,f.label
 from requested req
 cross join lateral private.b7_weighted_article_candidate(req.article_id) f
 where p_placement='article' and req.article_id is not null
), homepage_eligible as materialized (
 select c.id campaign_id,cr.id creative_id,
   cr.creative_type,cr.media_url,cr.text_body,cr.cta_type,cr.cta_target,
   case when c.package_id is null then 1 else pv.weight end as weight
 from public.ad_campaigns c
 join public.advertisers a on a.id=c.advertiser_id
 join lateral (
   select x.* from public.ad_creatives x
   where x.campaign_id=c.id and x.approved=true
   order by x.version desc,x.created_at desc,x.id desc limit 1
 ) cr on true
 left join public.ad_package_versions pv
   on pv.package_id=c.package_id
   and pv.version::text=c.package_snapshot->>'version'
 where p_placement='homepage' and p_scope='global'
   and c.placement='homepage'
   and c.status='live' and c.hidden_at is null
   and c.approved_at is not null and c.approved_by is not null
   and c.paid_at is not null and c.non_refund_accepted_at is not null
   and c.starts_at is not null and c.ends_at is not null
   and c.starts_at<=now() and c.ends_at>now() and c.ends_at>c.starts_at
   and a.verification_state='verified'
   and exists(
     select 1 from public.ad_campaign_area_grants g
     where g.campaign_id=c.id and g.area_level in('national','mp_state')
   )
   and c.agreed_price_minor>0
   and c.agreed_terms_recorded_at is not null
   and length(btrim(coalesce(c.agreed_terms_ref,'')))>=8
   and (
     c.package_id is null
     or (pv.id is not null and pv.weight between 1 and 100
       and pv.placement='homepage' and pv.price_minor=c.agreed_price_minor
       and pv.price_minor::text=c.package_snapshot->>'price_minor')
   )
   and exists(
     select 1 from public.ad_payments pay
     where pay.campaign_id=c.id and pay.status='confirmed'
       and pay.amount_minor=c.agreed_price_minor and pay.currency='INR'
       and pay.terms_accepted_at=c.non_refund_accepted_at
       and pay.verified_by is not null and pay.verified_at is not null
       and pay.receipt_at is not null
       and length(btrim(coalesce(pay.provider_ref,'')))>=8
       and length(btrim(coalesce(pay.evidence_ref,'')))>=8
       and length(btrim(coalesce(pay.acceptance_ref,'')))>=8
   )
   and (
     (cr.creative_type='text' and length(btrim(coalesce(cr.text_body,'')))>0)
     or (cr.creative_type in ('image','video')
         and cr.media_url ~* '^https://[a-z0-9.-]+(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
         and cr.media_url !~ '[<>"''\\]')
   )
   and (
     cr.cta_type is null
     or (cr.cta_type in('website','map')
         and cr.cta_target ~* '^https://[a-z0-9.-]+(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
         and cr.cta_target !~ '[<>"''\\]')
     or (cr.cta_type in('call','whatsapp')
         and cr.cta_target ~ '^\+?[0-9][0-9 ()-]{5,19}$')
   )
), homepage_ordered as materialized (
 select e.*,sum(e.weight) over(order by e.campaign_id) cumulative
 from homepage_eligible e
), homepage_ticket as materialized (
 select floor(random()*max(cumulative))::bigint ticket
 from homepage_ordered
)
select x.campaign_id,x.creative_id,x.creative_type,x.media_url,
  x.text_body,x.cta_type,x.cta_target,x.label
from article_pick x
union all
select e.campaign_id,e.creative_id,e.creative_type,e.media_url,
  e.text_body,e.cta_type,e.cta_target,'विज्ञापन'::text label
from homepage_ordered e cross join homepage_ticket t
where p_placement='homepage'
  and t.ticket>=e.cumulative-e.weight and t.ticket<e.cumulative
$canonical$;

revoke all on function public.jb_ad_public_feed(text,text)
 from public,anon,authenticated;
grant execute on function public.jb_ad_public_feed(text,text)
 to anon,authenticated,service_role;

-- Existing legacy public alias has NO second selection logic. It must keep
-- delegating to this exact canonical function, including empty legacy Article
-- requests (cannot forge district by supplying 'global').
create or replace function public.jb_public_active_ads(
 p_placement text default 'homepage'
) returns table(
 campaign_id uuid,creative_type text,media_url text,
 text_body text,cta_type text,cta_target text,label text
)
language sql volatile security definer
set search_path to 'pg_catalog'
as $legacy$
 select f.campaign_id,f.creative_type,f.media_url,
   f.text_body,f.cta_type,f.cta_target,f.label
 from public.jb_ad_public_feed(p_placement,'global') f
$legacy$;
revoke all on function public.jb_public_active_ads(text)
 from public,anon,authenticated;
grant execute on function public.jb_public_active_ads(text)
 to anon,authenticated,service_role;
commit;
