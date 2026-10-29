-- JANTA BOL / P4-T037 -- REVIEW-ONLY CANDIDATE (10 Oct 2026)
-- NEVER auto-apply to Production. No live SQL mutation has been authorized.
-- Preserves canonical one-slot public feed and historical package-version weight.
-- Not sufficient alone for T037 PASS: capacity / inventory pressure / purchased
-- delivery and real E2+E3+E5 regression must still be implemented/verified.
--
-- Read-only proof before drafting:
-- Production feed definition md5: 9b731f429f5a12d6c5a07adc70ae73fa
-- EXPLAIN for candidate selection planned successfully on real schema (no writes).
-- Query uses latest approved creative PER campaign, rather than newest globally.
-- Weighted per-request selection is probabilistic, NOT an impression guarantee.
begin;
do $baseline_guard$
begin
 if md5(pg_get_functiondef('public.jb_ad_public_feed(text,text)'::regprocedure))
    <> '9b731f429f5a12d6c5a07adc70ae73fa' then
  raise exception 'B7_BASELINE_CHANGED_REAUDIT_REQUIRED';
 end if;
end $baseline_guard$;
create or replace function public.jb_ad_public_feed(
 p_placement text,
 p_scope text default 'global'::text
)
returns table(
 campaign_id uuid,creative_id uuid,creative_type text,media_url text,
 text_body text,cta_type text,cta_target text,label text
)
language sql
security definer
set search_path to 'pg_catalog'
as $function$
 with eligible as (
  select
   c.id as campaign_id,cr.id as creative_id,
   cr.creative_type,cr.media_url,cr.text_body,cr.cta_type,cr.cta_target,
   coalesce(v.weight,1)::bigint as weight,
   row_number() over(partition by c.id
       order by cr.version desc,cr.created_at desc,cr.id desc) as creative_rank
  from public.ad_campaigns c
  join public.ad_creatives cr on cr.campaign_id=c.id and cr.approved=true
  left join public.ad_package_versions v
   on v.package_id=c.package_id
   and v.version::text=c.package_snapshot->>'version'
  where p_placement in ('homepage','article')
   and length(p_scope) between 1 and 100
   and c.status='live'
   and c.placement=p_placement
   and (c.scope='global' or c.scope=p_scope)
   and c.approved_at is not null
   and c.paid_at is not null
   and c.non_refund_accepted_at is not null
   and c.starts_at is not null
   and c.ends_at is not null
   and c.starts_at<=now() and c.ends_at>now()
   -- A paid versioned package may NOT silently fall back to a new price/weight.
   and (c.package_id is null or v.package_id is not null)
   and exists (
    select 1 from public.ad_payments pay
    where pay.campaign_id=c.id and pay.status='confirmed'
      and pay.amount_minor>0
   )
   and (
     (cr.creative_type='text'
       and nullif(btrim(coalesce(cr.text_body,'')),'') is not null)
      or (cr.creative_type in ('image','video')
       and cr.media_url ~* '^https://[^[:space:]]+$')
   )
   and not exists (
    select 1 from public.advertisers a where a.id=c.advertiser_id
       and a.risk_level='high' and a.verification_state<>'verified'
   )
 ), latest as (
  select * from eligible where creative_rank=1
 ), ticketed as (
  select latest.*,
         sum(weight) over(order by campaign_id) as cumulative
  from latest
 ), ticket as (
  select floor(random()*max(cumulative))::bigint as chosen
  from ticketed
 )
 select t.campaign_id,t.creative_id,t.creative_type,t.media_url,
        t.text_body,t.cta_type,t.cta_target,'विज्ञापन'::text as label
 from ticketed t cross join ticket k
 where k.chosen>=t.cumulative-t.weight and k.chosen<t.cumulative
 order by t.campaign_id
 limit 1
$function$;
commit;
