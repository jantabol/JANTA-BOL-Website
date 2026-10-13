\set ON_ERROR_STOP on
-- DISPOSABLE PostgreSQL only. This is the exact original LIVE
-- 2026-10-12 Owner creative SAVE / APPROVE procedural source, copied from
-- read-only pg_get_functiondef. Deliberately retain the original bug to
-- prove first divergence, then replace by REVIEW_ONLY migration.
create or replace function public.jb_ad_save_creative_internal(
 p_campaign uuid,p_type text,p_media text,p_text text,
 p_cta_type text,p_cta_target text
) returns uuid language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $function$
declare v uuid;ver int; begin if not private.p4_owner_allowed() then raise exception 'OWNER_AAL2_REQUIRED'; end if; if p_type not in('image','video','text') then raise exception 'INVALID_CREATIVE_TYPE'; end if;
if p_cta_type is not null and p_cta_type not in('call','whatsapp','website','map') then raise exception 'INVALID_CTA'; end if;
if p_cta_type in('website','map') and coalesce(p_cta_target,'') !~ '^https://[^[:space:]]+$' then raise exception 'HTTPS_CTA_REQUIRED'; end if;
select coalesce(max(version),0)+1 into ver from public.ad_creatives where campaign_id=p_campaign;
update public.ad_creatives set approved=false where campaign_id=p_campaign;
insert into public.ad_creatives(campaign_id,creative_type,media_url,text_body,cta_type,cta_target,version,approved) values(p_campaign,p_type,nullif(left(coalesce(p_media,''),2000),''),nullif(left(coalesce(p_text,''),5000),''),p_cta_type,nullif(left(coalesce(p_cta_target,''),2000),''),ver,true) returning id into v;
insert into public.ad_history(campaign_id,event_type,note,actor_user_id) values(p_campaign,'creative_approved','version '||ver,auth.uid()); return v; end $function$;

create or replace function public.jb_ad_approve_creative_internal(p_creative uuid)
returns public.ad_creatives language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $function$
declare v public.ad_creatives;begin if not private.p4_owner_allowed() then raise exception 'OWNER_AAL2_REQUIRED';end if;select * into v from public.ad_creatives where id=p_creative for update;if not found then raise exception 'CREATIVE_NOT_FOUND';end if;update public.ad_creatives set approved=false where campaign_id=v.campaign_id;update public.ad_creatives set approved=true where id=p_creative returning * into v;insert into public.ad_history(campaign_id,event_type,note,actor_user_id) values(v.campaign_id,'creative_approved','Creative version '||v.version||' approved.',auth.uid());return v;end $function$;
