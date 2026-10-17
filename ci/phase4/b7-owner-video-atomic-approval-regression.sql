\set ON_ERROR_STOP on
-- B7 ADS-011 canonical Owner approval AFTER original one-feed poster
-- projection; disposable PostgreSQL 17 only. No real E3/E5/Storage proof.
begin;
do $create$
declare v uuid;asset uuid:='99999999-9999-4999-8999-999999999999';
 campaign uuid:='30000000-0000-0000-0000-000000000003';
 old_text uuid;
begin
 perform set_config('b7.test_owner','enabled',true);
 select id into old_text from public.ad_creatives
 where campaign_id=campaign and approved=true order by version desc limit 1;
 if old_text is null then raise exception 'PREVIOUS_APPROVED_CREATIVE_REQUIRED';end if;
 v:=public.jb_ad_save_creative_internal(
  campaign,'video','https://pending.example.test/RAW-NEVER-APPROVE.mp4',
  null,null,null);
 perform set_config('b7.video_e2_new_id',v::text,true);
 perform set_config('b7.video_e2_prior_id',old_text::text,true);
 if (select approved from public.ad_creatives where id=v) is distinct from false
  or (select approved from public.ad_creatives where id=old_text) is distinct from true
 then raise exception 'SAVING_UNAPPROVED_VIDEO_OVERWROTE_APPROVED_TEXT';end if;
 begin
  perform public.jb_ad_approve_creative_internal(v);
  raise exception 'VIDEO_APPROVED_WITHOUT_REAL_PRIVATE_CLEAN_RECEIPTS';
 exception when others then
  if sqlerrm<>'B7_VIDEO_VERIFIED_FIRST_PARTY_RELEASE_REQUIRED'
  then raise exception 'MISSING_VERIFIED_VIDEO_GUARD_CHANGED: %',sqlerrm;end if;
 end;
 insert into private.b7_ad_video_receipts(
  asset_id,campaign_id,creative_id,creative_version,owner_user_id,
  original_path,original_sha256,source_bytes,
  video_path,video_sha256,video_bytes,
  poster_path,poster_sha256,poster_bytes,
  width,height,duration_seconds,storage_readback_verified_at
 ) values(asset,campaign,v,2,'11111111-1111-1111-1111-111111111111',
  'staged/'||asset||'/'||repeat('a',64)||'.mp4',
  repeat('a',64),4096,
  'staged/'||asset||'/'||repeat('b',64)||'.mp4',
  repeat('b',64),3072,
  'staged/'||asset||'/'||repeat('c',64)||'.png',
  repeat('c',64),1200,480,270,1.4,now());
 insert into private.b7_ad_clean_release_receipts(
  asset_id,campaign_id,creative_id,creative_version,owner_user_id,
  media_type,media_path,media_sha256,poster_path,poster_sha256,verified_at
 ) values(asset,campaign,v,2,'11111111-1111-1111-1111-111111111111',
  'video','creative/'||v||'/'||asset||'/'||repeat('b',64)||'.mp4',
  repeat('b',64),
  'creative/'||v||'/'||asset||'/'||repeat('c',64)||'.png',
  repeat('c',64),now());
 begin
  perform public.jb_ad_approve_creative_internal(v);
  raise exception 'VIDEO_APPROVED_WITHOUT_DISABLED_BY_DEFAULT_ORIGIN';
 exception when others then
  if sqlerrm<>'B7_VIDEO_PUBLIC_RELEASE_DISABLED'
  then raise exception 'DISABLED_ORIGIN_GATE_CHANGED: %',sqlerrm;end if;
 end;
 insert into private.b7_ad_clean_public_origin(storage_origin)
 values('https://vrffsnkycvjithwtiylt.supabase.co');
 begin
  perform public.jb_ad_approve_creative_internal(v);
  raise exception 'VIDEO_APPROVED_WITH_DISABLED_ORIGIN_ROW';
 exception when others then
  if sqlerrm<>'B7_VIDEO_PUBLIC_RELEASE_DISABLED'
  then raise exception 'DEFAULT_DISABLED_ORIGIN_ROW_BYPASSED: %',sqlerrm;end if;
 end;
 raise notice 'PASS [ADS-011] video draft private receipts still cannot approve without explicit Owner & enabled clean first-party origin';
end $create$;
set local role anon;
do $public_denial$
begin
 if has_function_privilege('anon',
    'public.jb_ad_approve_creative_internal(uuid)','EXECUTE')
 then raise exception 'ANON_CAN_APPROVE_VIDEO';end if;
 raise notice 'PASS [ADS-009] anonymous cannot approve media even with a verifiable public URL';
end $public_denial$;
reset role;
-- E2 synthetic DBA switches origin ON temporarily ONLY inside rollback.
update private.b7_ad_clean_public_origin set enabled=true where singleton=true;
do $verify_owner$
declare v uuid;v_old uuid;approved_row public.ad_creatives%rowtype;
 poster text;verified_mp4 text;count_before int;count_after int;
begin
 perform set_config('b7.test_owner','enabled',true);
 v:=current_setting('b7.video_e2_new_id')::uuid;
 v_old:=current_setting('b7.video_e2_prior_id')::uuid;
 select count(*) into count_before from public.ad_history
  where campaign_id='30000000-0000-0000-0000-000000000003'
   and event_type='creative_approved';
 approved_row:=public.jb_ad_approve_creative_internal(v);
 verified_mp4:='https://vrffsnkycvjithwtiylt.supabase.co'||
  '/storage/v1/object/public/jb-ad-clean-public/creative/'||
  v||'/99999999-9999-4999-8999-999999999999/'||repeat('b',64)||'.mp4';
 poster:='https://vrffsnkycvjithwtiylt.supabase.co'||
  '/storage/v1/object/public/jb-ad-clean-public/creative/'||
  v||'/99999999-9999-4999-8999-999999999999/'||repeat('c',64)||'.png';
 if approved_row.approved is distinct from true
  or approved_row.approved_once is distinct from true
  or approved_row.media_url is distinct from verified_mp4
  or private.b7_verified_public_video_poster(v,approved_row.media_url)
       is distinct from poster
 then raise exception 'OWNER_VIDEO_ATOMIC_POSTER_APPROVAL_INCORRECT';end if;
 if (select approved from public.ad_creatives where id=v_old)
    is distinct from false
 then raise exception 'PREVIOUS_APPROVED_CREATIVE_NOT_ATOMICALLY_UNAPPROVED';end if;
 select count(*) into count_after from public.ad_history
 where campaign_id='30000000-0000-0000-0000-000000000003'
  and event_type='creative_approved';
 if count_after<>count_before+1
 then raise exception 'OWNER_VIDEO_APPROVAL_AUDIT_NOT_APPEND_ONLY';end if;
 perform public.jb_ad_approve_creative_internal(v);
 if (select count(*) from public.ad_history
 where campaign_id='30000000-0000-0000-0000-000000000003'
  and event_type='creative_approved')<>count_after
 then raise exception 'OWNER_VIDEO_DOUBLE_TAP_NOT_IDEMPOTENT';end if;
 raise notice 'PASS [ADS-011/045] same canonical Owner approval swaps old Creative atomically, MP4 and POSTER SHA bound, duplicate tap idempotent';
end $verify_owner$;
-- A NEW pending draft must NEVER unpublish the current approved video.
do $no_auto_replace$
declare newer uuid;v uuid;
begin
 v:=current_setting('b7.video_e2_new_id')::uuid;
 newer:=public.jb_ad_save_creative_internal(
  '30000000-0000-0000-0000-000000000003','video',
  'https://pending.example.test/next-unreviewed.mp4',null,null,null);
 if (select approved from public.ad_creatives where id=v) is distinct from true
 then raise exception 'NEW_DRAFT_PREMATURELY_UNPUBLISHED_APPROVED_VIDEO';end if;
 begin
  perform public.jb_ad_approve_creative_internal(newer);
  raise exception 'UNVERIFIED_NEWER_VIDEO_APPROVED';
 exception when others then
  if sqlerrm<>'B7_VIDEO_VERIFIED_FIRST_PARTY_RELEASE_REQUIRED'
  then raise exception 'NEWER_UNVERIFIED_MEDIA_GUARD_CHANGED: %',sqlerrm;end if;
 end;
 raise notice 'PASS [ADS-011] newer proposal does not interrupt approved existing video';
end $no_auto_replace$;
rollback;
