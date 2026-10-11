-- JANTA BOL B7 / ADS-010..015, ADS-045..047
-- 12 OCT 2026. REVIEW ONLY: NEVER apply to LIVE without explicit Founder
-- authorization, Owner/AAL2 real tests, media worker and atomic UI cutover.
--
-- First divergence (LIVE read-only source): jb_ad_save_creative_internal
-- currently revokes every existing approved creative and inserts the new
-- unreviewed media/text version with approved=true. This breaks the B7
-- "SAVE DRAFT -> PREVIEW -> EXPLICIT OWNER APPROVE" golden rule and
-- silently replaces a LIVE ad. The existing RLS/Owner check alone does not
-- establish that a submitted media file was audited or approved.
-- This review migration modifies ONLY these same two existing RPC
-- signatures, preserves their return types, and retains the existing
-- ad_creatives + ad_history sources of truth.
begin;

do $b7_creative_source_guard$
declare v_save text;v_approve text;
begin
 if not exists(select 1 from information_schema.columns
  where table_schema='public' and table_name='ad_creatives'
    and column_name='approved_once') then
   raise exception 'B7_STICKY_CREATIVE_RETENTION_MIGRATION_REQUIRED';end if;
 if to_regprocedure('public.jb_ad_save_creative_internal(uuid,text,text,text,text,text)') is null
    or to_regprocedure('public.jb_ad_approve_creative_internal(uuid)') is null
 then raise exception 'B7_EXISTING_CREATIVE_RPC_SIGNATURE_DRIFT';end if;
 select p.prosrc into v_save from pg_proc p where
   p.oid='public.jb_ad_save_creative_internal(uuid,text,text,text,text,text)'::regprocedure;
 select p.prosrc into v_approve from pg_proc p where
   p.oid='public.jb_ad_approve_creative_internal(uuid)'::regprocedure;
 -- Preflight compares actual LIVE first divergence. A different source
 -- needs independent reconciliation, NOT blind CREATE OR REPLACE.
 if v_save not ilike '%update public.ad_creatives set approved=false%'
    or v_save not ilike '%insert into public.ad_creatives%'
    or v_save not ilike '%true)%'
    or v_approve not ilike '%update public.ad_creatives set approved=false%'
 then raise exception 'B7_CREATIVE_RPC_LIVE_SOURCE_CHANGED_INDEPENDENT_RCA_REQUIRED';end if;
end $b7_creative_source_guard$;

create or replace function public.jb_ad_save_creative_internal(
 p_campaign uuid,p_type text,p_media text,p_text text,
 p_cta_type text,p_cta_target text
) returns uuid language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $save$
declare v uuid;ver integer;v_c public.ad_campaigns%rowtype;
        v_media text;v_text text;v_target text;
begin
 if not private.p4_owner_allowed() then raise exception 'OWNER_AAL2_REQUIRED';end if;
 if p_campaign is null or p_type is null or p_type not in('image','video','text')
 then raise exception 'INVALID_CREATIVE_TYPE';end if;
 if p_cta_type is not null and p_cta_type not in('call','whatsapp','website','map')
 then raise exception 'INVALID_CTA';end if;
 v_media:=nullif(btrim(coalesce(p_media,'')),'');
 v_text:=nullif(btrim(coalesce(p_text,'')),'');
 v_target:=nullif(btrim(coalesce(p_cta_target,'')),'');
 if length(coalesce(v_media,''))>2000 or length(coalesce(v_text,''))>5000
    or length(coalesce(v_target,''))>2000 then
   raise exception 'CREATIVE_INPUT_TOO_LONG';end if;
 if p_type='text' and (v_text is null or length(v_text)<2 or v_media is not null)
 then raise exception 'INVALID_TEXT_AD_DRAFT';end if;
 if p_type in('image','video') then
   -- A raw external link may be saved as a PRIVATE proposal only.
   -- It may NEVER be approved without the distinct server-verified
   -- first-party Media Studio pipeline (not yet implemented).
   if v_media is null or
      v_media !~* '^https://[a-z0-9-]+([.][a-z0-9-]+)+(/[a-z0-9_./%?=&-]*)?$'
      or split_part(v_media,'/',3) ~ '^[0-9.]+$'
      or split_part(v_media,'/',3) ~* '(^|[.])(localhost|local|internal)$'
      or v_media ~* '(javascript:|data:|file:)' then
     raise exception 'INVALID_UNTRUSTED_AD_MEDIA';end if;
 end if;
 if p_cta_type in('website','map') and
    (v_target is null or
      v_target !~* '^https://[a-z0-9-]+([.][a-z0-9-]+)+(/[a-z0-9_./%?=&-]*)?$'
      or split_part(v_target,'/',3) ~ '^[0-9.]+$'
      or split_part(v_target,'/',3) ~* '(^|[.])(localhost|local|internal)$')
 then raise exception 'HTTPS_CTA_REQUIRED';end if;
 if p_cta_type in('call','whatsapp') and
    (v_target is null or v_target !~ '^\+?[0-9][0-9 ()-]{5,19}$')
 then raise exception 'INVALID_PHONE_CTA';end if;
 if p_cta_type is null and v_target is not null
 then raise exception 'CTA_TARGET_WITHOUT_TYPE';end if;

 -- Serialize each campaign's edits to avoid duplicate version numbers.
 select * into v_c from public.ad_campaigns where id=p_campaign for update;
 if not found then raise exception 'CAMPAIGN_NOT_FOUND';end if;
 if v_c.status in('rejected','cancelled')
 then raise exception 'CREATIVE_CAMPAIGN_NOT_EDITABLE';end if;
 select coalesce(max(version),0)+1 into ver
 from public.ad_creatives where campaign_id=p_campaign;
 -- CRITICAL: NO UPDATE to existing approved creative on SAVE.
 insert into public.ad_creatives(
   campaign_id,creative_type,media_url,text_body,
   cta_type,cta_target,version,approved,approved_once
 ) values(
   p_campaign,p_type,v_media,v_text,p_cta_type,v_target,
   ver,false,false
 ) returning id into v;
 insert into public.ad_history(campaign_id,event_type,note,actor_user_id)
 values(p_campaign,'creative_draft_saved','version '||ver,auth.uid());
 return v;
end $save$;

create or replace function public.jb_ad_approve_creative_internal(
 p_creative uuid
) returns public.ad_creatives language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $approve$
declare v public.ad_creatives;v_c public.ad_campaigns%rowtype;
        v_campaign uuid;v_version integer;v_risk text;v_verification text;
begin
 if not private.p4_owner_allowed() then raise exception 'OWNER_AAL2_REQUIRED';end if;
 if p_creative is null then raise exception 'CREATIVE_NOT_FOUND';end if;
 -- Lookup campaign first, lock it before any competing SAVE/APPROVE.
 select campaign_id into v_campaign from public.ad_creatives
 where id=p_creative;
 if not found then raise exception 'CREATIVE_NOT_FOUND';end if;
 select * into v_c from public.ad_campaigns where id=v_campaign for update;
 if not found then raise exception 'CAMPAIGN_NOT_FOUND';end if;
 select * into v from public.ad_creatives where id=p_creative for update;
 if not found then raise exception 'CREATIVE_NOT_FOUND';end if;
 if v.campaign_id is distinct from v_c.id then
  raise exception 'CREATIVE_CAMPAIGN_MISMATCH';end if;
 if v_c.status in('rejected','cancelled') then
  raise exception 'CREATIVE_CAMPAIGN_NOT_EDITABLE';end if;
 select max(version) into v_version from public.ad_creatives
 where campaign_id=v.campaign_id;
 if v_version is distinct from v.version then
  raise exception 'STALE_CREATIVE_VERSION_NOT_APPROVABLE';end if;
 select a.risk_level,a.verification_state into v_risk,v_verification
 from public.advertisers a where a.id=v_c.advertiser_id;
 if not found or v_verification<>'verified' then
  raise exception 'ADVERTISER_NOT_VERIFIED';end if;
 if v_risk<>'normal' then
  -- High-risk enhanced evidence requires separate canonical verified
  -- outcome; never reinterpret ordinary "verified" as enhanced approval.
  raise exception 'HIGH_RISK_ENHANCED_VERIFICATION_REQUIRED';end if;

 if v.creative_type='text' then
  if length(btrim(coalesce(v.text_body,'')))<2
  then raise exception 'INVALID_TEXT_AD_DRAFT';end if;
 elsif v.creative_type in('image','video') then
  -- Genuine file signature, dimension/codec, EXIF and safe derivative
  -- verification must be server-side. No fake approval from hotlinks.
  raise exception 'B7_MEDIA_SERVER_VERIFICATION_NOT_READY';
 else raise exception 'INVALID_CREATIVE_TYPE';end if;
 if v.approved then return v;end if;

 -- NOW and ONLY NOW: replace the active approved creative atomically.
 update public.ad_creatives set approved=false
 where campaign_id=v.campaign_id and approved=true;
 update public.ad_creatives set approved=true where id=p_creative
 returning * into v;
 insert into public.ad_history(campaign_id,event_type,note,actor_user_id)
 values(v.campaign_id,'creative_approved',
        'Creative version '||v.version||' approved.',auth.uid());
 return v;
end $approve$;

-- Atomic UI/backend release capability: the NEW Admin UI MUST call this
-- RPC before SAVE or APPROVE. Old Production lacks it, so an accidental
-- frontend-only deployment CANNOT call the unsafe legacy auto-LIVE SAVE.
create or replace function public.jb_ad_creative_workflow_capability_internal()
returns text language plpgsql stable security definer
set search_path to 'pg_catalog','public','private'
as $capability$
begin
 if not private.p4_owner_allowed() then raise exception 'OWNER_AAL2_REQUIRED';end if;
 return 'B7_DRAFT_THEN_EXPLICIT_APPROVE_V1';
end $capability$;
revoke all on function public.jb_ad_creative_workflow_capability_internal()
 from public,anon;
grant execute on function public.jb_ad_creative_workflow_capability_internal()
 to authenticated,service_role;

revoke all on function public.jb_ad_save_creative_internal(
 uuid,text,text,text,text,text) from public,anon;
revoke all on function public.jb_ad_approve_creative_internal(uuid)
 from public,anon;
grant execute on function public.jb_ad_save_creative_internal(
 uuid,text,text,text,text,text) to authenticated,service_role;
grant execute on function public.jb_ad_approve_creative_internal(uuid)
 to authenticated,service_role;

commit;
