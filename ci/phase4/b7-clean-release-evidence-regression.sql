\set ON_ERROR_STOP on
-- Disposable PostgreSQL 17: fake digests prove SQL authority & SOT only.
begin;
do $source$
declare v_image uuid;v_video uuid;v jsonb;vi jsonb;
 img_asset uuid:='66666666-6666-4666-8666-666666666666';
 vid_asset uuid:='77777777-7777-4777-8777-777777777777';
begin
 perform set_config('b7.test_owner','enabled',true);
 v_image:=public.jb_ad_save_creative_internal(
  '30000000-0000-0000-0000-000000000003','image',
  'https://pending.example.test/raw.png','pending image',null,null);
 v_video:=public.jb_ad_save_creative_internal(
  '30000000-0000-0000-0000-000000000001','video',
  'https://pending.example.test/raw.mp4','pending video',null,null);
 perform set_config('b7.test_owner','',true);
 insert into private.b7_ad_media_receipts(
 asset_id,campaign_id,creative_id,creative_version,owner_user_id,
 source_path,source_sha256,source_mime,source_bytes,
 derivative_path,derivative_sha256,derivative_bytes,width,height,storage_readback_verified_at)
 values(img_asset,'30000000-0000-0000-0000-000000000003',v_image,2,
 '11111111-1111-4111-8111-111111111111',
 'staged/'||img_asset||'/'||repeat('a',64)||'.png',
 repeat('a',64),'image/png',1000,
 'staged/'||img_asset||'/'||repeat('b',64)||'.png',
 repeat('b',64),720,320,200,now());
 insert into private.b7_ad_video_receipts(
 asset_id,campaign_id,creative_id,creative_version,owner_user_id,
 original_path,original_sha256,source_bytes,
 video_path,video_sha256,video_bytes,
 poster_path,poster_sha256,poster_bytes,
 width,height,duration_seconds,storage_readback_verified_at)
 values(vid_asset,'30000000-0000-0000-0000-000000000001',v_video,2,
 '11111111-1111-4111-8111-111111111111',
 'staged/'||vid_asset||'/'||repeat('c',64)||'.mp4',
 repeat('c',64),3600,
 'staged/'||vid_asset||'/'||repeat('d',64)||'.mp4',repeat('d',64),3200,
 'staged/'||vid_asset||'/'||repeat('e',64)||'.png',
 repeat('e',64),900,480,270,0.8,now());
 v:=jsonb_build_object(
 'asset_id',img_asset,'campaign_id','30000000-0000-0000-0000-000000000003',
 'creative_id',v_image,'creative_version',2,
 'owner_user_id','11111111-1111-4111-8111-111111111111',
 'media_type','image','clean_public_bucket','jb-ad-clean-public',
 'media_path','creative/'||v_image||'/'||img_asset||'/'||repeat('b',64)||'.png',
 'media_sha256',repeat('b',64),'verified_at',now(),
 'approval_state','awaiting_atomic_owner_approval');
 vi:=jsonb_build_object(
 'asset_id',vid_asset,'campaign_id','30000000-0000-0000-0000-000000000001',
 'creative_id',v_video,'creative_version',2,
 'owner_user_id','11111111-1111-4111-8111-111111111111',
 'media_type','video','clean_public_bucket','jb-ad-clean-public',
 'media_path','creative/'||v_video||'/'||vid_asset||'/'||repeat('d',64)||'.mp4',
 'media_sha256',repeat('d',64),
 'poster_path','creative/'||v_video||'/'||vid_asset||'/'||repeat('e',64)||'.png',
 'poster_sha256',repeat('e',64),'verified_at',now(),
 'approval_state','awaiting_atomic_owner_approval');
 perform set_config('b7.clean_image_fixture',v::text,true);
 perform set_config('b7.clean_video_fixture',vi::text,true);
end $source$;
set local role anon;
do $anon$
begin
 if has_function_privilege('anon','public.jb_ad_clean_record_release_server(jsonb)','EXECUTE')
  or has_function_privilege('anon','public.jb_ad_clean_read_release_server(uuid)','EXECUTE')
  or has_function_privilege('anon','public.jb_ad_clean_orphan_release_server(jsonb)','EXECUTE')
 then raise exception 'ANON_PUBLIC_RELEASE_FORENSICS_BYPASS';end if;
 begin
  perform count(*) from private.b7_ad_clean_release_receipts;
  raise exception 'ANON_READ_CLEAN_RELEASE_PRIVATE_LEDGER';
 exception when insufficient_privilege then null;end;
 raise notice 'PASS [ADS-010/011] anon cannot forge release or read private receipt';
end $anon$;
reset role;
set local role authenticated;
do $browser$
begin
 if has_function_privilege('authenticated',
  'public.jb_ad_clean_record_release_server(jsonb)','EXECUTE')
 then raise exception 'BROWSER_OWNER_JWT_CAN_FORGE_CLEAN_ASSET_ATTESTATION';end if;
 raise notice 'PASS [ADS-009] Owner browser cannot forge server-side clean-asset receipt';
end $browser$;
reset role;
set local role service_role;
do $service$
declare rec jsonb;v uuid;test_image jsonb;test_video jsonb;
 aid uuid:='66666666-6666-4666-8666-666666666666';msg text;
begin
 test_image:=current_setting('b7.clean_image_fixture')::jsonb;
 test_video:=current_setting('b7.clean_video_fixture')::jsonb;
 for rec in select unnest(array[test_image,test_video]) loop
  v:=public.jb_ad_clean_record_release_server(rec);
  if v<>(rec->>'asset_id')::uuid then raise exception 'RECEIPT_ID_MISMATCH';end if;
  if (public.jb_ad_clean_read_release_server(v)->>'media_sha256')
     is distinct from rec->>'media_sha256'
  then raise exception 'IMMUTABLE_RELEASE_READBACK_MISMATCH';end if;
 end loop;
 begin
  perform public.jb_ad_clean_record_release_server(test_video||
   jsonb_build_object('asset_id','99999999-9999-4999-8999-999999999999',
     'media_path','creative/'||(test_video->>'creative_id')||
       '/99999999-9999-4999-8999-999999999999/'||repeat('f',64)||'.mp4',
     'media_sha256',repeat('f',64),
     'poster_path','creative/'||(test_video->>'creative_id')||
       '/99999999-9999-4999-8999-999999999999/'||repeat('e',64)||'.png'));
  raise exception 'FORGED_PUBLIC_MEDIA_HASH_APPROVED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_RELEASE_UNVERIFIED_PRIVATE_VIDEO_POSTER'
  then raise exception 'PRIVATE_ATTESTATION_BYPASS: %',msg;end if;
 end;
 begin
  perform public.jb_ad_clean_record_release_server(test_image||
   jsonb_build_object('media_path','https://evil.example.test/image.png'));
  raise exception 'PUBLIC_REMOTE_ASSET_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_RELEASE_PUBLIC_PATH_NOT_CANONICAL'
  then raise exception 'PUBLIC_CANONICAL_PATH_GUARD_MISSING: %',msg;end if;
 end;
 if not public.jb_ad_clean_orphan_release_server(jsonb_build_object(
 'assetId',aid,'reason','RELEASE_OR_OWNER_STATE_FAILED',
 'objects',jsonb_build_array(jsonb_build_object(
  'bucket','jb-ad-clean-public',
  'path','creative/'||(test_image->>'creative_id')||'/'||aid||'/'||
  repeat('b',64)||'.png'))))
 then raise exception 'DURABLE_CLEAN_RELEASE_ORPHAN_MISSING';end if;
 begin
  perform public.jb_ad_clean_orphan_release_server(jsonb_build_object(
   'assetId',aid,'reason','RELEASE_OR_OWNER_STATE_FAILED',
   'objects',jsonb_build_array(jsonb_build_object(
    'bucket','public-media','path','raw-private-source.mp4'))));
  raise exception 'CLEAN_ORPHAN_REFERENCED_UNTRUSTED_BUCKET';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_RELEASE_ORPHAN_WRONG_PUBLIC_OBJECT'
  then raise exception 'ORPHAN_FORENSICS_SCOPE_LOST: %',msg;end if;
 end;
 raise notice 'PASS [ADS-010/011] image and video original Creative latest/private hash bound to immutable release, no public approval';
end $service$;
reset role;
do $canonical$
declare i uuid;v uuid;msg text;
begin
 i:=((current_setting('b7.clean_image_fixture')::jsonb)->>'creative_id')::uuid;
 v:=((current_setting('b7.clean_video_fixture')::jsonb)->>'creative_id')::uuid;
 if (select approved from public.ad_creatives where id=i) or
    (select approved from public.ad_creatives where id=v)
 then raise exception 'RELEASE_SYNTHETIC_ROW_SILENTLY_APPROVED_CREATIVE';end if;
 perform set_config('b7.test_owner','enabled',true);
 begin
  perform public.jb_ad_approve_creative_internal(i);
  raise exception 'RELEASE_BYPASSED_EXPLICIT_MEDIA_APPROVAL_HOLD';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_MEDIA_SERVER_VERIFICATION_NOT_READY'
  then raise exception 'MEDIA_APPROVE_GATE_UNEXPECTED: %',msg;end if;
 end;
 raise notice 'PASS [ADS-045] canonical Owner approval unchanged and still safely BLOCKED for media';
end $canonical$;
rollback;
