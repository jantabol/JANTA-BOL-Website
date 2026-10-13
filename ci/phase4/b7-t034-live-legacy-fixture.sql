\set ON_ERROR_STOP on
-- P4-T034: exact pre-fix legacy RPC signatures and current LIVE PL/pgSQL body logic.
-- Source authority: read-only pg_proc inspection 2026-10-13, JANTA BOL ONLY.
-- SYNTHETIC DISPOSABLE POSTGRES ONLY. Never apply this fixture to Supabase.
create or replace function public.jb_ad_public_request(
 p_name text,p_contact text,p_placement text default 'homepage',
 p_scope text default 'global',p_risk text default 'normal'
) returns uuid language plpgsql security definer as $live5$
declare a uuid;c uuid; begin
 if length(trim(coalesce(p_name,'')))<2 or length(trim(coalesce(p_contact,'')))<5 then
  raise exception 'REQUEST_FIELDS_REQUIRED'; end if;
 if p_placement not in('homepage','article') then raise exception 'INVALID_PLACEMENT'; end if;
 if p_scope not in('global','local') then raise exception 'INVALID_SCOPE'; end if;
 insert into public.advertisers(name,contact,risk_level)
 values(left(trim(p_name),200),left(trim(p_contact),300),case when p_risk='high' then 'high' else 'normal' end) returning id into a;
 insert into public.ad_campaigns(advertiser_id,placement,scope,status)
 values(a,p_placement,p_scope,'requested') returning id into c;
 insert into public.ad_history(campaign_id,event_type,note)
 values(c,'requested','public_request'); return c;
end $live5$;

create or replace function public.jb_ad_public_request(
 p_name text,p_contact text,p_package uuid,p_placement text,p_scope text,
 p_risk text default 'normal'
) returns uuid language plpgsql security definer as $live6$
declare a uuid;c uuid; pkg public.ad_packages;
begin
 if length(trim(coalesce(p_name,'')))<2 or length(trim(coalesce(p_contact,'')))<3 then
  raise exception 'AD_REQUEST_REQUIRED_FIELDS'; end if;
 if p_package is not null then
  select * into pkg from public.ad_packages where id=p_package and active=true;
  if not found then raise exception 'AD_PACKAGE_NOT_FOUND'; end if;
 end if;
 insert into public.advertisers(name,contact,risk_level,verification_state)
 values(left(trim(p_name),200),left(trim(p_contact),300),
        case when p_risk='high' then 'high' else 'normal' end,'pending') returning id into a;
 insert into public.ad_campaigns(advertiser_id,package_id,placement,scope,status)
 values(a,p_package,left(coalesce(pkg.placement,p_placement,'homepage'),100),
        left(coalesce(p_scope,'global'),100),'requested') returning id into c;
 insert into public.ad_history(campaign_id,event_type,note)
 values(c,'requested','Public advertising request received; not LIVE.');
 return c;
end $live6$;

create or replace function public.jb_ad_public_request(
 p_name text,p_contact text,p_package uuid,p_placement text,p_scope text,
 p_risk text default 'normal',p_kind text default 'standard'
) returns uuid language plpgsql security definer as $live7$
declare a uuid;c uuid;pkg public.ad_packages;
begin
 if length(trim(coalesce(p_name,'')))<2 or length(trim(coalesce(p_contact,'')))<5 then
  raise exception 'INVALID_REQUEST'; end if;
 if p_kind not in('standard','custom') or p_risk not in('normal','high') then
  raise exception 'INVALID_REQUEST'; end if;
 if exists(select 1 from public.advertisers where contact=left(trim(p_contact),300)
    and created_at>now()-interval '5 minutes') then
  raise exception 'REQUEST_COOLDOWN'; end if;
 if p_package is not null then
  select * into pkg from public.ad_packages where id=p_package and active=true;
  if not found then raise exception 'PACKAGE_NOT_AVAILABLE'; end if;
 end if;
 insert into public.advertisers(name,contact,risk_level)
 values(left(trim(p_name),200),left(trim(p_contact),300),p_risk) returning id into a;
 insert into public.ad_campaigns(advertiser_id,package_id,status,placement,scope,request_kind,package_snapshot)
 values(a,p_package,'requested',left(coalesce(nullif(trim(p_placement),''),coalesce(pkg.placement,'homepage')),100),
        left(coalesce(nullif(trim(p_scope),''),'global'),100),p_kind,
        case when p_package is null then '{}'::jsonb else
         jsonb_build_object('package_id',pkg.id,'name',pkg.name,'price_minor',pkg.price_minor,
          'currency',pkg.currency,'duration_days',pkg.duration_days,'version',pkg.version) end) returning id into c;
 insert into public.ad_history(campaign_id,event_type,note)
 values(c,'public_request','Request received; not approved or LIVE.');
 return c;
end $live7$;

-- Deliberate historical default PUBLIC/anon EXECUTE: only in disposable fixture.
grant execute on function public.jb_ad_public_request(text,text,text,text,text) to public,anon,authenticated,service_role;
grant execute on function public.jb_ad_public_request(text,text,uuid,text,text,text) to public,anon,authenticated,service_role;
grant execute on function public.jb_ad_public_request(text,text,uuid,text,text,text,text) to public,anon,authenticated,service_role;

do $red$
begin
 if not has_function_privilege('anon','public.jb_ad_public_request(text,text,text,text,text)','EXECUTE')
 or not has_function_privilege('anon','public.jb_ad_public_request(text,text,uuid,text,text,text)','EXECUTE')
 or not has_function_privilege('anon','public.jb_ad_public_request(text,text,uuid,text,text,text,text)','EXECUTE')
 then raise exception 'HISTORICAL_ANON_BYPASS_FIXTURE_NOT_REPRODUCED';end if;
 raise notice 'RED reproduced in disposable fixture: all 3 live legacy overloads anonymous executable';
end $red$;
