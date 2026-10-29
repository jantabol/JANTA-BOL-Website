-- REVIEW CANDIDATE: isolated tests only; not a production migration receipt.
-- Reuse the canonical campaign/creative/payment records and both existing RPC signatures.
create or replace function public.jb_ad_public_feed(p_placement text,p_scope text default 'global')
returns table(campaign_id uuid,creative_id uuid,creative_type text,media_url text,text_body text,cta_type text,cta_target text,label text)
language sql stable security definer set search_path=pg_catalog as $function$
 select c.id,cr.id,cr.creative_type,cr.media_url,cr.text_body,cr.cta_type,cr.cta_target,'विज्ञापन'::text
 from public.ad_campaigns c
 join public.advertisers a on a.id=c.advertiser_id
 join lateral (
   select x.* from public.ad_creatives x where x.campaign_id=c.id and x.approved=true
   order by x.version desc,x.created_at desc,x.id limit 1
 ) cr on true
 where p_placement in('homepage','article') and length(p_scope) between 1 and 100
   and c.status='live' and c.placement=p_placement and (c.scope='global' or c.scope=p_scope)
   and c.approved_at is not null and c.paid_at is not null and c.non_refund_accepted_at is not null
   and c.starts_at is not null and c.ends_at is not null and c.starts_at<=now() and c.ends_at>now()
   and exists(select 1 from public.ad_payments pay where pay.campaign_id=c.id and pay.status='confirmed' and pay.amount_minor>0 and nullif(btrim(pay.provider_ref),'') is not null)
   and (a.risk_level='normal' or (a.risk_level='high' and a.verification_state='verified'))
   and ((cr.creative_type='text' and nullif(btrim(cr.text_body),'') is not null)
     or (cr.creative_type in('image','video') and cr.media_url ~* '^https://[^[:space:]]+$'))
 -- Preserve the one-slot contract. Purchased-weight rotation is a separate T037 gate;
 -- this ordering is explicitly NOT evidence that fair/weighted delivery is implemented.
 order by cr.version desc,c.id limit 1;
$function$;
revoke all on function public.jb_ad_public_feed(text,text) from public,anon,authenticated;
grant execute on function public.jb_ad_public_feed(text,text) to anon,authenticated,service_role;

-- Close the existing weaker public route without dropping its callable signature.
create or replace function public.jb_public_active_ads(p_placement text default 'homepage')
returns table(campaign_id uuid,creative_type text,media_url text,text_body text,cta_type text,cta_target text,label text)
language sql stable security definer set search_path=pg_catalog as $function$
 select f.campaign_id,f.creative_type,f.media_url,f.text_body,f.cta_type,f.cta_target,f.label
 from public.jb_ad_public_feed(p_placement,'global') f;
$function$;
revoke all on function public.jb_public_active_ads(text) from public,anon,authenticated;
grant execute on function public.jb_public_active_ads(text) to anon,authenticated,service_role;

-- Validate approval at the canonical row boundary, including portal approval paths.
create or replace function private.p4_validate_ad_creative_media()
returns trigger language plpgsql set search_path=pg_catalog as $function$
begin
 if tg_op='UPDATE' and new.approved=false and
    row(new.creative_type,new.media_url,new.text_body,new.cta_type,new.cta_target)
    is not distinct from row(old.creative_type,old.media_url,old.text_body,old.cta_type,old.cta_target)
 then return new; end if;
 if new.creative_type in('image','video') and nullif(btrim(new.media_url),'') is not null then
  if length(new.media_url)>2000 or new.media_url !~* '^https://[a-z0-9.-]+(:[0-9]{1,5})?([/?#][^[:space:]]*)?$'
     or new.media_url ~ '[<>"''\\]' then raise exception 'INVALID_MEDIA_URL' using errcode='22023'; end if;
 end if;
 if new.approved and ((new.creative_type in('image','video') and nullif(btrim(new.media_url),'') is null)
     or (new.creative_type='text' and nullif(btrim(new.text_body),'') is null))
 then raise exception 'CREATIVE_CONTENT_REQUIRED' using errcode='22023'; end if;
 if new.cta_type in('website','map') and
    (coalesce(new.cta_target,'') !~* '^https://[a-z0-9.-]+(:[0-9]{1,5})?([/?#][^[:space:]]*)?$' or new.cta_target ~ '[<>"''\\]')
 then raise exception 'HTTPS_CTA_REQUIRED' using errcode='22023'; end if;
 if new.cta_type in('call','whatsapp') and coalesce(new.cta_target,'') !~ '^\+?[0-9][0-9 ()-]{5,19}$'
 then raise exception 'PHONE_CTA_REQUIRED' using errcode='22023'; end if;
 return new;
end $function$;
revoke all on function private.p4_validate_ad_creative_media() from public,anon,authenticated;
drop trigger if exists p4_validate_ad_creative_media on public.ad_creatives;
create trigger p4_validate_ad_creative_media
before insert or update of creative_type,media_url,text_body,cta_type,cta_target,approved on public.ad_creatives
for each row execute function private.p4_validate_ad_creative_media();
