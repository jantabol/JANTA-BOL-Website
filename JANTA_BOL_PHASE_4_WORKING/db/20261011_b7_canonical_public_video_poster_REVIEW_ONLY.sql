-- B7 ADS-011 verified video poster projected through ORIGINAL single public feed.
-- REVIEW ONLY. Requires atomic E3/E5/E7 Founder-approved paired rollout.
-- Adds the ninth return field poster_url; original legacy alias stays 7 fields.
-- Explicit transactional DROP RESTRICT (NO CASCADE) aborts on hidden deps.
begin;
do $pre$ begin
 if to_regprocedure('public.jb_ad_public_feed(text,text)') is null
  or to_regprocedure('public.jb_public_active_ads(text)') is null
  or to_regclass('private.b7_ad_video_receipts') is null
  or to_regclass('private.b7_ad_clean_release_receipts') is null
  or to_regclass('private.b7_ad_clean_public_origin') is null
 then raise exception 'B7_ORIGINAL_FEED_OR_CLEAN_MEDIA_BASELINE_MISSING';end if;
 if (select pg_get_function_result('public.jb_ad_public_feed(text,text)'::regprocedure))
 not like '%label text%' then raise exception 'ORIGINAL_FEED_RETURN_DRIFT';end if;
end $pre$;
create or replace function private.b7_verified_public_video_poster(
 p_creative uuid,p_media_url text
) returns text language plpgsql stable security definer
set search_path to 'pg_catalog','public','private'
as $poster$
declare v text;
begin
 select cfg.storage_origin||
  '/storage/v1/object/public/jb-ad-clean-public/'||rel.poster_path
 into v
 from public.ad_creatives cr
 join private.b7_ad_clean_release_receipts rel
  on rel.creative_id=cr.id and rel.media_type='video'
 join private.b7_ad_video_receipts vid
  on vid.asset_id=rel.asset_id and vid.creative_id=cr.id
 join private.b7_ad_clean_public_origin cfg on cfg.singleton and cfg.enabled
 where cr.id=p_creative and cr.creative_type='video'
  and cr.approved=true and cr.media_url=p_media_url
  and rel.creative_version=cr.version and rel.campaign_id=cr.campaign_id
  and vid.creative_version=cr.version and vid.campaign_id=cr.campaign_id
  and vid.owner_user_id=rel.owner_user_id
  and vid.approval_state='private_quarantined'
  and rel.approval_state='awaiting_atomic_owner_approval'
  and rel.clean_public_bucket='jb-ad-clean-public'
  and rel.media_sha256=vid.video_sha256
  and rel.poster_sha256=vid.poster_sha256
  and rel.media_path='creative/'||cr.id||'/'||rel.asset_id||'/'||
   rel.media_sha256||'.mp4'
  and rel.poster_path='creative/'||cr.id||'/'||rel.asset_id||'/'||
   rel.poster_sha256||'.png'
  and p_media_url=cfg.storage_origin||
   '/storage/v1/object/public/jb-ad-clean-public/'||rel.media_path;
 return v;
end $poster$;
revoke all on function private.b7_verified_public_video_poster(uuid,text)
 from public,anon,authenticated;
drop function public.jb_public_active_ads(text) restrict;
drop function public.jb_ad_public_feed(text,text) restrict;
create or replace function public.jb_ad_public_feed(
 p_placement text,p_scope text default 'global'
) returns table(
 campaign_id uuid,creative_id uuid,creative_type text,media_url text,
 text_body text,cta_type text,cta_target text,label text,poster_url text
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
         and private.b7_safe_public_ad_https(cr.media_url))
   )
   and (
     cr.cta_type is null
     or (cr.cta_type in('website','map')
         and private.b7_safe_public_ad_https(cr.cta_target))
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
  x.text_body,x.cta_type,x.cta_target,x.label,
  private.b7_verified_public_video_poster(x.creative_id,x.media_url) poster_url
from article_pick x
where x.creative_type<>'video' or
 private.b7_verified_public_video_poster(x.creative_id,x.media_url) is not null
union all
select e.campaign_id,e.creative_id,e.creative_type,e.media_url,
  e.text_body,e.cta_type,e.cta_target,'विज्ञापन'::text label,
  private.b7_verified_public_video_poster(e.creative_id,e.media_url) poster_url
from homepage_ordered e cross join homepage_ticket t
where p_placement='homepage'
  and t.ticket>=e.cumulative-e.weight and t.ticket<e.cumulative
  and (e.creative_type<>'video' or
       private.b7_verified_public_video_poster(e.creative_id,e.media_url) is not null)
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
