-- B7-G4 / ADS-029, ADS-030, ADS-034 — PRIVATE weighted candidate only.
-- DISPOSABLE/STAGING REVIEW SQL. DO NOT apply to Production or expose as
-- additional public advertisement endpoint. Old canonical public feed remains
-- unchanged until G3 verified directory, package/inventory and impression
-- authorization have all passed their final integration/Android gates.
--
-- Supersedes (does not apply) review/b7_t037_weighted_feed_REVIEW_ONLY.sql,
-- whose free-text caller p_scope cannot be authoritative Article geography.
begin;
-- Eligible creative pool: one private authority for weighted selection and
-- protected qualified-view tickets; never duplicate the payment/geo rules.
create or replace function private.b7_eligible_article_creatives(
 p_article uuid
) returns table(
 campaign_id uuid,creative_id uuid,creative_type text,media_url text,
 text_body text,cta_type text,cta_target text,weight integer
)
language sql stable security definer
set search_path to 'pg_catalog'
as $eligible$
  select c.id campaign_id,cr.id creative_id,
         cr.creative_type,cr.media_url,cr.text_body,cr.cta_type,cr.cta_target,
         case when c.package_id is null then 1 else v.weight end as weight
  from public.ad_campaigns c
  join public.advertisers a on a.id=c.advertiser_id
  join lateral (
    select x.* from public.ad_creatives x
    where x.campaign_id=c.id and x.approved=true
    order by x.version desc,x.created_at desc,x.id desc limit 1
  ) cr on true
  left join public.ad_package_versions v on v.package_id=c.package_id
    and v.version::text=c.package_snapshot->>'version'
  where p_article is not null
    and private.b7_geo_matches_article(p_article,c.id)
    and c.placement='article'
    and c.status='live'
    and c.hidden_at is null
    and c.approved_at is not null and c.approved_by is not null
    and c.paid_at is not null and c.non_refund_accepted_at is not null
    and c.starts_at is not null and c.ends_at is not null
    and c.starts_at<=now() and c.ends_at>now() and c.ends_at>c.starts_at
    and a.verification_state='verified'
    and (c.package_id is null or
        (v.id is not null and v.weight between 1 and 100
          and v.price_minor=c.agreed_price_minor
          and v.price_minor::text=c.package_snapshot->>'price_minor'
          and v.placement='article'))
    and c.agreed_price_minor>0
    and c.agreed_terms_recorded_at is not null
    and length(btrim(coalesce(c.agreed_terms_ref,'')))>=8
    and exists(
      select 1 from public.ad_payments p
      where p.campaign_id=c.id and p.status='confirmed'
        and p.amount_minor=c.agreed_price_minor and p.currency='INR'
        and p.terms_accepted_at=c.non_refund_accepted_at
        and p.verified_by is not null and p.verified_at is not null
        and p.receipt_at is not null
        and length(btrim(coalesce(p.provider_ref,'')))>=8
        and length(btrim(coalesce(p.evidence_ref,'')))>=8
        and length(btrim(coalesce(p.acceptance_ref,'')))>=8
    )
    and (
      (cr.creative_type='text' and
        length(btrim(coalesce(cr.text_body,'')))>0)
      or (cr.creative_type in ('image','video') and
        cr.media_url ~* '^https://[a-z0-9.-]+(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
        and cr.media_url !~ '[<>"''\\]')
    )
    and (
      cr.cta_type is null
      or (cr.cta_type in('website','map') and
          cr.cta_target ~* '^https://[a-z0-9.-]+(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
          and cr.cta_target !~ '[<>"''\\]')
      or (cr.cta_type in('call','whatsapp') and
          cr.cta_target ~ '^\+?[0-9][0-9 ()-]{5,19}$')
    )
$eligible$;
revoke all on function private.b7_eligible_article_creatives(uuid)
 from public,anon,authenticated;

create or replace function private.b7_weighted_article_candidate(
 p_article uuid
) returns table(
 campaign_id uuid,creative_id uuid,creative_type text,media_url text,
 text_body text,cta_type text,cta_target text,label text,selection_weight integer
)
language sql volatile security definer
set search_path to 'pg_catalog'
as $pick$
 with eligible as materialized (
  select * from private.b7_eligible_article_creatives(p_article)
 ), ticketed as (
   select e.*,
       sum(e.weight) over(order by e.campaign_id) as cumulative
   from eligible e
 ), pick as materialized (
   select floor(random()*max(cumulative))::bigint as ticket
   from ticketed
 )
 select e.campaign_id,e.creative_id,e.creative_type,e.media_url,
        e.text_body,e.cta_type,e.cta_target,'विज्ञापन'::text as label,
        e.weight::integer as selection_weight
 from ticketed e cross join pick p
 where p.ticket>=e.cumulative-e.weight and p.ticket<e.cumulative
 order by e.campaign_id
 limit 1
$pick$;
revoke all on function private.b7_weighted_article_candidate(uuid)
 from public,anon,authenticated;
commit;
