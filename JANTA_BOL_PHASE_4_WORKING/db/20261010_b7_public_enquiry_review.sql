-- B7 ADS-001..009 / STAGING REVIEW. Do not silently apply to production.
-- Source: B7 Final Master Blueprint, 10 Oct 2026. Canonical enquiry reuses
-- advertisers/ad_campaigns/ad_history; never sets paid/approved/LIVE.
-- LEGACY signatures stay available to Owner/AAL2, but are no longer public intake.
begin;

alter table public.ad_campaigns
 add column if not exists enquiry_origin text,
 add column if not exists enquiry_article_id uuid,
 add column if not exists enquiry_note text,
 add column if not exists whatsapp_consent_at timestamptz;

create or replace function public.jb_ad_public_enquiry(
 p_name text,
 p_whatsapp text,
 p_consent boolean,
 p_origin text default 'homepage',
 p_article uuid default null,
 p_note text default null
) returns uuid
language plpgsql security definer
set search_path to 'pg_catalog', 'public'
as $enquiry$
declare v_name text; v_raw text; v_phone text; v_note text;
        v_advertiser uuid; v_campaign uuid;
begin
 -- Fail before any insert. Do not accept forged placement/geo/media fields.
 v_name:=btrim(coalesce(p_name,''));
 v_raw:=btrim(coalesce(p_whatsapp,''));
 v_note:=btrim(coalesce(p_note,''));
 if length(v_name)<2 or length(v_name)>160 or length(v_raw)<10 or length(v_raw)>40
    or length(v_note)>500 or p_consent is distinct from true
 then raise exception 'INVALID_ENQUIRY_OR_CONSENT'; end if;
 if p_origin is null or p_origin not in ('homepage','article') then
   raise exception 'INVALID_ENQUIRY_ORIGIN'; end if;
 if p_origin='homepage' and p_article is not null then
   raise exception 'INVALID_ARTICLE_CONTEXT'; end if;
 if p_origin='article' and (
   p_article is null or not exists (
     select 1 from public.articles a
     where a.id=p_article and a.status::text='published'
   )
 ) then raise exception 'INVALID_ARTICLE_CONTEXT'; end if;

 -- Only internationally recognizable formats; no alphabetic/contact fragments.
 if v_raw !~ '^[+0-9[:space:]()-]+$' then
   raise exception 'INVALID_WHATSAPP_NUMBER'; end if;
 v_raw:=regexp_replace(v_raw,'[[:space:]()-]','','g');
 if v_raw ~ '^[6-9][0-9]{9}$' then
   v_phone:='+91'||v_raw;
 elsif v_raw ~ '^91[6-9][0-9]{9}$' then
   v_phone:='+'||v_raw;
 elsif v_raw ~ '^\+[1-9][0-9]{7,14}$' then
   v_phone:=v_raw;
 else raise exception 'INVALID_WHATSAPP_NUMBER'; end if;

 -- One request per normalized phone in 10 minutes, including simultaneous
 -- submissions on this connection. No exposure of existing private details.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_phone,0));
 if exists (
   select 1 from public.advertisers a
   where a.contact=v_phone and a.created_at>now()-interval '10 minutes'
 ) then raise exception 'ENQUIRY_COOLDOWN'; end if;

 insert into public.advertisers(name,contact,verification_state,risk_level)
 values(v_name,v_phone,'pending','normal')
 returning id into v_advertiser;

 insert into public.ad_campaigns(
   advertiser_id,status,placement,scope,request_kind,
   enquiry_origin,enquiry_article_id,enquiry_note,whatsapp_consent_at
 ) values(
   v_advertiser,'requested','homepage','global','standard',
   p_origin,p_article,nullif(v_note,''),now()
 ) returning id into v_campaign;

 insert into public.ad_history(campaign_id,event_type,note)
 values(v_campaign,'public_enquiry',
        'source='||p_origin||case when p_article is null then '' else '; article='||p_article::text end||'; whatsapp_consent=yes');

 return v_campaign;
end
$enquiry$;

revoke all on function public.jb_ad_public_enquiry(text,text,boolean,text,uuid,text) from public,anon,authenticated;
grant execute on function public.jb_ad_public_enquiry(text,text,boolean,text,uuid,text) to anon,authenticated,service_role;

-- Retire permissive historical PUBLIC overloads without deleting Owner tools.
-- Their original signatures stay stable. Owner role and AAL2 checked server-side.
create or replace function public.jb_ad_public_request(
 p_name text,p_contact text,p_placement text default 'homepage',
 p_scope text default 'global',p_risk text default 'normal'
) returns uuid language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $legacy5$
begin
 if not private.p4_owner_allowed() then raise exception 'OWNER_AAL2_REQUIRED'; end if;
 return public.jb_ad_public_request(p_name,p_contact,null::uuid,p_placement,p_scope,p_risk,'standard');
end $legacy5$;

create or replace function public.jb_ad_public_request(
 p_name text,p_contact text,p_package uuid,p_placement text,p_scope text,
 p_risk text default 'normal'
) returns uuid language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $legacy6$
begin
 if not private.p4_owner_allowed() then raise exception 'OWNER_AAL2_REQUIRED'; end if;
 return public.jb_ad_public_request(p_name,p_contact,p_package,p_placement,p_scope,p_risk,'standard');
end $legacy6$;

create or replace function public.jb_ad_public_request(
 p_name text,p_contact text,p_package uuid,p_placement text,p_scope text,
 p_risk text default 'normal',p_kind text default 'standard'
) returns uuid language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $legacy7$
declare a uuid;c uuid;pkg public.ad_packages;
begin
 if not private.p4_owner_allowed() then raise exception 'OWNER_AAL2_REQUIRED'; end if;
 if length(btrim(coalesce(p_name,'')))<2
    or length(btrim(coalesce(p_contact,'')))<5
    or p_kind not in('standard','custom')
    or p_risk not in('normal','high') then
    raise exception 'INVALID_REQUEST'; end if;
 if exists(select 1 from public.advertisers
    where contact=left(btrim(p_contact),300)
      and created_at>now()-interval '5 minutes') then
   raise exception 'REQUEST_COOLDOWN'; end if;
 if p_package is not null then
   select * into pkg from public.ad_packages where id=p_package and active=true;
   if not found then raise exception 'PACKAGE_NOT_AVAILABLE'; end if;
 end if;
 insert into public.advertisers(name,contact,risk_level)
 values(left(btrim(p_name),200),left(btrim(p_contact),300),p_risk)
 returning id into a;
 insert into public.ad_campaigns(
    advertiser_id,package_id,status,placement,scope,request_kind,package_snapshot
 ) values(
    a,p_package,'requested',
    left(coalesce(nullif(btrim(p_placement),''),coalesce(pkg.placement,'homepage')),100),
    left(coalesce(nullif(btrim(p_scope),''),'global'),100),
    p_kind,
    case when p_package is null then '{}'::jsonb
    else jsonb_build_object('package_id',pkg.id,'name',pkg.name,
       'price_minor',pkg.price_minor,'currency',pkg.currency,
       'duration_days',pkg.duration_days,'version',pkg.version) end
 ) returning id into c;
 insert into public.ad_history(campaign_id,event_type,note)
 values(c,'owner_request','Owner manual advertising request; NOT LIVE.');
 return c;
end $legacy7$;

revoke all on function public.jb_ad_public_request(text,text,text,text,text) from public,anon;
revoke all on function public.jb_ad_public_request(text,text,uuid,text,text,text) from public,anon;
revoke all on function public.jb_ad_public_request(text,text,uuid,text,text,text,text) from public,anon;
grant execute on function public.jb_ad_public_request(text,text,text,text,text) to authenticated,service_role;
grant execute on function public.jb_ad_public_request(text,text,uuid,text,text,text) to authenticated,service_role;
grant execute on function public.jb_ad_public_request(text,text,uuid,text,text,text,text) to authenticated,service_role;

-- G1/ADS-007/008: authoritative Founder verification, not a public self-claim.
-- High risk requires explicit evidence reference. Shared ad_history and audit_logs
-- are reused rather than adding a parallel audit system.
create or replace function public.jb_ad_verify_advertiser_internal(
 p_advertiser uuid,p_state text,p_note text,p_evidence_ref text default null
) returns void
language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $verify$
declare v public.advertisers;v_note text;v_ref text;
begin
 if not private.p4_owner_allowed() then
   raise exception 'OWNER_AAL2_REQUIRED';end if;
 v_note:=btrim(coalesce(p_note,''));
 v_ref:=btrim(coalesce(p_evidence_ref,''));
 if p_state not in ('verified','rejected','pending') or length(v_note)<8 or length(v_note)>1000
 then raise exception 'INVALID_VERIFICATION_DECISION';end if;
 if length(v_ref)>300 then raise exception 'INVALID_EVIDENCE_REFERENCE';end if;
 select * into v from public.advertisers where id=p_advertiser for update;
 if not found then raise exception 'ADVERTISER_NOT_FOUND';end if;
 if v.risk_level='high' and p_state='verified' and length(v_ref)<8 then
   raise exception 'ENHANCED_VERIFICATION_EVIDENCE_REQUIRED';end if;
 update public.advertisers set verification_state=p_state,updated_at=now()
 where id=p_advertiser;
 insert into public.ad_history(campaign_id,event_type,note,actor_user_id)
 select c.id,'verification_'||p_state,left(v_note||case when v_ref='' then '' else '; evidence reference='||v_ref end,1500),auth.uid()
 from public.ad_campaigns c where c.advertiser_id=p_advertiser;
 insert into public.audit_logs(actor_user_id,action,record_type,record_id,metadata,created_at)
 values(auth.uid(),'ad_verification','advertiser',p_advertiser::text,
        jsonb_build_object('state',p_state,'high_risk',v.risk_level='high',
                           'evidence_provided',v_ref<>''),now());
end $verify$;
revoke all on function public.jb_ad_verify_advertiser_internal(uuid,text,text,text)
 from public,anon;
grant execute on function public.jb_ad_verify_advertiser_internal(uuid,text,text,text)
 to authenticated,service_role;

commit;
