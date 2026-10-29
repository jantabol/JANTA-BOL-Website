-- B7 ADS-011 paired Owner video approval + verified FIRST-PARTY POSTER.
-- REVIEW ONLY. Requires Founder explicit production gate and real E3/E5/E7.
-- SAME public.jb_ad_approve_creative_internal(uuid), NOT a second authority.
-- PostgreSQL approval must be atomic with original Creative and public helper.
begin;
do $pre$
declare v text;
begin
 if to_regclass('private.b7_ad_clean_release_receipts') is null
   or to_regclass('private.b7_ad_video_receipts') is null
   or to_regprocedure('private.b7_verified_public_video_poster(uuid,text)') is null
   or to_regclass('private.b7_ad_clean_public_origin') is null
 then raise exception 'B7_VIDEO_SINGLE_HOME_DEPENDENCIES_MISSING';end if;
 if pg_get_function_result('public.jb_ad_public_feed(text,text)'::regprocedure)
     not like '%poster_url text%'
 then raise exception 'B7_VIDEO_POSTER_FEED_NOT_DEPLOYED';end if;
 select prosrc into v from pg_proc where oid=
   'public.jb_ad_approve_creative_internal(uuid)'::regprocedure;
 if v not like '%B7_VIDEO_PUBLIC_POSTER_FEED_NOT_READY%'
  or v not like '%B7_IMAGE_VERIFIED_FIRST_PARTY_RELEASE_REQUIRED%'
  or v not like '%OWNER_AAL2_REQUIRED%'
 then raise exception 'B7_OWNER_APPROVAL_MIGRATION_SOURCE_DRIFT';end if;
end $pre$;
create or replace function public.jb_ad_approve_creative_internal(
 p_creative uuid
) returns public.ad_creatives language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $approve$
declare v public.ad_creatives;v_c public.ad_campaigns%rowtype;
        v_campaign uuid;v_version integer;v_risk text;v_verification text;
        v_release private.b7_ad_clean_release_receipts%rowtype;
        v_origin text;v_first_party_url text;
        v_verified_poster text;
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
 elsif v.creative_type='image' then
  -- A server-only immutable clean public copy must match the EXACT
  -- private sanitizer SHA, version, Owner and current pending Creative.
  select * into v_release from private.b7_ad_clean_release_receipts
  where creative_id=v.id and media_type='image';
  if not found or v_release.campaign_id is distinct from v.campaign_id
      or v_release.creative_version is distinct from v.version
      or v_release.owner_user_id is distinct from auth.uid()
      or v_release.approval_state is distinct from
         'awaiting_atomic_owner_approval'
      or v_release.clean_public_bucket is distinct from 'jb-ad-clean-public'
      or v_release.media_path is distinct from
         'creative/'||v.id||'/'||v_release.asset_id||'/'||
         v_release.media_sha256||'.png'
  then raise exception 'B7_IMAGE_VERIFIED_FIRST_PARTY_RELEASE_REQUIRED';end if;
  select storage_origin into v_origin from private.b7_ad_clean_public_origin
  where singleton=true and enabled=true;
  if not found then raise exception 'B7_IMAGE_PUBLIC_RELEASE_DISABLED';end if;
  v_first_party_url:=v_origin||
   '/storage/v1/object/public/jb-ad-clean-public/'||v_release.media_path;
 elsif v.creative_type='video' then
  -- SAME canonical Owner/Creative approval. No extra media authority:
  -- private video + first-party clean MP4 AND PNG poster must be linked
  -- by the original service-only immutable ledgers to this exact version.
  select * into v_release from private.b7_ad_clean_release_receipts
   where creative_id=v.id and media_type='video';
  if not found or v_release.campaign_id is distinct from v.campaign_id
      or v_release.creative_version is distinct from v.version
      or v_release.owner_user_id is distinct from auth.uid()
      or v_release.approval_state is distinct from
          'awaiting_atomic_owner_approval'
      or v_release.clean_public_bucket is distinct from 'jb-ad-clean-public'
      or v_release.media_path is distinct from
          'creative/'||v.id||'/'||v_release.asset_id||'/'||
          v_release.media_sha256||'.mp4'
      or v_release.poster_path is distinct from
          'creative/'||v.id||'/'||v_release.asset_id||'/'||
          v_release.poster_sha256||'.png'
  then raise exception 'B7_VIDEO_VERIFIED_FIRST_PARTY_RELEASE_REQUIRED';end if;
  if not exists(
    select 1 from private.b7_ad_video_receipts vid
    where vid.asset_id=v_release.asset_id
      and vid.creative_id=v.id and vid.campaign_id=v.campaign_id
      and vid.creative_version=v.version
      and vid.owner_user_id=v_release.owner_user_id
      and vid.video_sha256=v_release.media_sha256
      and vid.poster_sha256=v_release.poster_sha256
      and vid.approval_state='private_quarantined'
  ) then raise exception 'B7_VIDEO_PRIVATE_HASH_OR_POSTER_MISMATCH';end if;
  select storage_origin into v_origin
    from private.b7_ad_clean_public_origin
    where singleton=true and enabled=true;
  if not found then raise exception 'B7_VIDEO_PUBLIC_RELEASE_DISABLED';end if;
  v_first_party_url:=v_origin||
   '/storage/v1/object/public/jb-ad-clean-public/'||v_release.media_path;
 else raise exception 'INVALID_CREATIVE_TYPE';end if;
 if v.approved then return v;end if;

 -- NOW and ONLY NOW: replace the active approved creative atomically.
 update public.ad_creatives set approved=false
 where campaign_id=v.campaign_id and approved=true;
 update public.ad_creatives
 set approved=true,approved_once=true,
     media_url=case when creative_type in('image','video')
                    then v_first_party_url else media_url end
 where id=p_creative
 returning * into v;
 -- Atomic and rollback-safe: the SAME authenticated public-feed poster
 -- helper must resolve this exact approved MP4 and genuine PNG. If it
 -- cannot, the entire Owner transaction (including previous approved
 -- creative and history) rolls back. No half-approved video state.
 if v.creative_type='video' then
  select private.b7_verified_public_video_poster(v.id,v.media_url)
   into v_verified_poster;
  if v_verified_poster is distinct from
      v_origin||'/storage/v1/object/public/jb-ad-clean-public/'||
      v_release.poster_path
  then raise exception 'B7_VIDEO_PUBLIC_POSTER_FEED_NOT_VERIFIED';end if;
 end if;
 insert into public.ad_history(campaign_id,event_type,note,actor_user_id)
 values(v.campaign_id,'creative_approved',
        'Creative version '||v.version||' approved.',auth.uid());
 return v;
end $approve$;
revoke all on function public.jb_ad_approve_creative_internal(uuid)
 from public,anon;
grant execute on function public.jb_ad_approve_creative_internal(uuid)
 to authenticated,service_role;
commit;
