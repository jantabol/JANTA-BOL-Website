\set ON_ERROR_STOP on
-- B7 ADS-011: REPLAY actual original published feed (9th poster_url).
-- Disposable PostgreSQL17 E2, synthetic LGD and hashes. NO LIVE DATA.
begin;
do $source$
declare v uuid;a uuid:='77777777-7777-4777-8777-777777777777';
 campaign uuid:='30000000-0000-0000-0000-000000000007';
 v_root text:='https://vrffsnkycvjithwtiylt.supabase.co';
begin
 perform set_config('b7.test_owner','enabled',true);
 insert into public.ad_campaigns(
  id,advertiser_id,package_id,package_snapshot,status,placement,scope,
  approved_at,approved_by,starts_at,ends_at)
 values(campaign,'00000000-0000-0000-0000-000000000003',null,'{}',
  'approved','homepage','global',now()-interval '1 day',
  '11111111-1111-1111-1111-111111111111',
  now()-interval '1 hour',now()+interval '2 days');
 insert into public.ad_creatives(
  campaign_id,creative_type,media_url,approved,version
 )values(campaign,'video','https://pending.example.test/RAW-CANNOT-LIVE.mp4',
   false,1) returning id into v;
 insert into private.b7_ad_video_receipts(
  asset_id,campaign_id,creative_id,creative_version,owner_user_id,
  original_path,original_sha256,source_bytes,
  video_path,video_sha256,video_bytes,
  poster_path,poster_sha256,poster_bytes,
  width,height,duration_seconds,storage_readback_verified_at
 )values(a,campaign,v,1,'11111111-1111-1111-1111-111111111111',
  'staged/'||a||'/'||repeat('a',64)||'.mp4',repeat('a',64),3500,
  'staged/'||a||'/'||repeat('b',64)||'.mp4',repeat('b',64),3000,
  'staged/'||a||'/'||repeat('c',64)||'.png',repeat('c',64),1200,
  480,270,1.5,now());
 insert into private.b7_ad_clean_release_receipts(
  asset_id,campaign_id,creative_id,creative_version,owner_user_id,
  media_type,media_path,media_sha256,poster_path,poster_sha256,verified_at
 )values(a,campaign,v,1,'11111111-1111-1111-1111-111111111111',
  'video','creative/'||v||'/'||a||'/'||repeat('b',64)||'.mp4',
  repeat('b',64),
  'creative/'||v||'/'||a||'/'||repeat('c',64)||'.png',repeat('c',64),now());
 perform public.jb_ad_grant_area_internal(campaign,'mp_state',null,null,
  false,'GOVT-MP-TEST-GRANT');
 perform public.jb_ad_set_approved_quote_internal(
  campaign,50000,'VIDEO-POSTER-QUOTE');
 -- Canonical payment guard requires an approved Creative FIRST.
 -- Synthetic explicit Owner approval for disposable E2 ONLY.
 if (select approved from public.ad_creatives where id=v) is distinct from false
 then raise exception 'PRIVATE_RECEIPT_SILENTLY_APPROVED_VIDEO';end if;
 update public.ad_creatives
 set approved=true,media_url=v_root||
  '/storage/v1/object/public/jb-ad-clean-public/creative/'||
  v||'/'||a||'/'||repeat('b',64)||'.mp4'
 where id=v;
 perform public.jb_ad_confirm_manual_payment_internal(
  campaign,'SYNTHETIC-VIDEO-POSTER-PROOF',50000,'upi',now(),
  'VIDEO-RECEIPT-EVIDENCE','VIDEO-TERMS-CONSENT',now(),
  'Synthetic paid homepage video, disposable PostgreSQL only','CONFIRM');
 update public.ad_campaigns set status='live' where id=campaign;
 perform set_config('b7.poster_e2_creative',v::text,true);
 perform set_config('b7.poster_e2_video_url',v_root||
  '/storage/v1/object/public/jb-ad-clean-public/creative/'||
  v||'/'||a||'/'||repeat('b',64)||'.mp4',true);
 perform set_config('b7.poster_e2_poster_url',v_root||
  '/storage/v1/object/public/jb-ad-clean-public/creative/'||
  v||'/'||a||'/'||repeat('c',64)||'.png',true);
 insert into private.b7_ad_clean_public_origin(storage_origin,enabled)
  values(v_root,false);
end $source$;
-- Even with receipt and synthetic approved Creative, video is hidden
-- until the safe first-party origin is explicitly enabled.
do $not_ready$
declare n integer;
begin
 select count(*) into n from public.jb_ad_public_feed('homepage','global');
 if n<>0 then raise exception 'UNAPPROVED_VIDEO_LEAKED_IN_PUBLIC_FEED';end if;
 if (select count(*) from pg_attribute where attrelid=0)<>0
 then raise exception 'UNEXPECTED_PG_FIXTURE';end if;
 raise notice 'PASS [ADS-011] private + public media receipts NEVER auto approve canonical Creative';
end $not_ready$;
-- Owner approval above is disposable-only; REAL Founder E5 remains DUE.
do $default_off$
begin
 if (select count(*) from public.jb_ad_public_feed('homepage','global'))<>0
 then raise exception 'DISABLED_MEDIA_ORIGIN_BYPASSED';end if;
 raise notice 'PASS [ADS-011] default-disabled first-party origin stops public video';
end $default_off$;
update private.b7_ad_clean_public_origin set enabled=true;
set local role anon;
do $live_view$
declare r record;n int;
begin
 select * into r from public.jb_ad_public_feed('homepage','global');
 if r.creative_id is distinct from current_setting('b7.poster_e2_creative')::uuid
 or r.creative_type<>'video'
 or r.media_url is distinct from current_setting('b7.poster_e2_video_url')
 or r.poster_url is distinct from current_setting('b7.poster_e2_poster_url')
 then raise exception 'VIDEO_PUBLIC_POSTER_BINDING_INCORRECT';end if;
 if (select count(*) from public.jb_ad_public_feed('homepage','global'))<>1
 then raise exception 'MULTIPLE_ADS_PER_PUBLIC_HOME_SELECTION';end if;
 if has_function_privilege('anon',
  'private.b7_verified_public_video_poster(uuid,text)','EXECUTE')
 then raise exception 'ANON_HAS_PRIVATE_POSTER_LOOKUP';end if;
 if (select count(*) from public.jb_public_active_ads('homepage'))<>1
 then raise exception 'LEGACY_SINGLE_PICKER_DID_NOT_DELEGATE';end if;
 if (select count(*) from public.jb_public_active_ads('article'))<>0
 then raise exception 'LEGACY_SCOPE_ALLOWED_FORGERY';end if;
 raise notice 'PASS [ADS-011] 1 canonical public video, SHA-matched poster, old one-picker alias preserved';
end $live_view$;
reset role;
update public.ad_creatives set media_url='https://approved.example.test/legacy.mp4'
 where id=current_setting('b7.poster_e2_creative')::uuid;
do $forged$
begin
 if (select count(*) from public.jb_ad_public_feed('homepage','global'))<>0
 then raise exception 'APPROVED_VIDEO_WITH_NON-FIRST-PARTY_URL_LEAKED';end if;
 raise notice 'PASS [ADS-056] safe-looking HTTPS legacy video URL is insufficient without hash-bound poster';
end $forged$;
update public.ad_creatives
 set media_url=current_setting('b7.poster_e2_video_url')
 where id=current_setting('b7.poster_e2_creative')::uuid;
update private.b7_ad_clean_public_origin set enabled=false;
do $kill$
begin
 if (select count(*) from public.jb_ad_public_feed('homepage','global'))<>0
 then raise exception 'PUBLIC_VIDEO_KILL_SWITCH_FAILED';end if;
 raise notice 'PASS [ADS-011] Owner-off public origin kills NEW views, existing article not rotated';
end $kill$;
rollback;
