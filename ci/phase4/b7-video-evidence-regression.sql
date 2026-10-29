\set ON_ERROR_STOP on
-- Synthetic hashes do not prove real file bytes. Real FFmpeg + Storage
-- E2 is separate; PostgreSQL proves permission, immutability and SOT.
begin;
do $make$
declare v_id uuid;v jsonb;a uuid:='88888888-8888-4888-8888-888888888888';
begin
 perform set_config('b7.test_owner','enabled',true);
 v_id:=public.jb_ad_save_creative_internal(
   '30000000-0000-0000-0000-000000000003',
   'video','https://pending.example.test/review/ad.mp4',
   'Video private review',null,null);
 perform set_config('b7.test_owner','',true);
 v:=jsonb_build_object(
  'asset_id',a,'campaign_id','30000000-0000-0000-0000-000000000003',
  'creative_id',v_id,'creative_version',2,
  'owner_user_id','11111111-1111-4111-8111-111111111111',
  'original_bucket','jb-ad-video-originals-private',
  'original_path','staged/'||a||'/'||repeat('a',64)||'.mp4',
  'original_sha256',repeat('a',64),'source_bytes',3210,
  'video_bucket','jb-ad-videos-private',
  'video_path','staged/'||a||'/'||repeat('b',64)||'.mp4',
  'video_sha256',repeat('b',64),'video_bytes',2345,
  'poster_bucket','jb-ad-video-posters-private',
  'poster_path','staged/'||a||'/'||repeat('c',64)||'.png',
  'poster_sha256',repeat('c',64),'poster_bytes',1800,
  'width',480,'height',270,'duration_seconds',0.8,
  'storage_readback_verified_at',now());
 perform set_config('b7.video_fixture',v::text,true);
end $make$;
set local role anon;
do $anon$
begin
 if has_function_privilege('anon','public.jb_ad_video_record_receipt_server(jsonb)','EXECUTE')
    or has_function_privilege('anon','public.jb_ad_video_read_receipt_server(uuid)','EXECUTE')
    or has_function_privilege('anon','public.jb_ad_video_log_orphan_server(jsonb)','EXECUTE')
 then raise exception 'ANONYMOUS_VIDEO_RPC_LEAK';end if;
 begin
  perform count(*) from private.b7_ad_video_receipts;
  raise exception 'ANON_PRIVATE_VIDEO_LEDGER_READ';
 exception when insufficient_privilege then null;end;
 raise notice 'PASS [ADS-011] no anonymous video evidence or private ledger read';
end $anon$;
reset role;
set local role authenticated;
do $auth$
begin
 if has_function_privilege('authenticated','public.jb_ad_video_record_receipt_server(jsonb)','EXECUTE')
 then raise exception 'AUTHENTICATED_BROWSER_CAN_FAKE_VERIFIED_VIDEO';end if;
 raise notice 'PASS [ADS-015] Owner UI cannot insert fake service-only video evidence';
end $auth$;
reset role;
set local role service_role;
do $backend$
declare v jsonb; id uuid;readback jsonb;msg text;
begin
 v:=current_setting('b7.video_fixture')::jsonb;
 id:=public.jb_ad_video_record_receipt_server(v);
 readback:=public.jb_ad_video_read_receipt_server(id);
 if id<>'88888888-8888-4888-8888-888888888888'::uuid or
    readback->>'approval_state'<>'private_quarantined' or
    readback->>'poster_sha256'<>repeat('c',64)
 then raise exception 'VIDEO_LEDGER_READBACK_NOT_EXACT';end if;
 begin
  perform public.jb_ad_video_record_receipt_server(v);
  raise exception 'DUPLICATE_VIDEO_ASSET_ACCEPTED';
 exception when unique_violation then null;end;
 begin
  perform public.jb_ad_video_record_receipt_server(v||
    jsonb_build_object('asset_id','99999999-9999-4999-8999-999999999999',
      'original_path','staged/99999999-9999-4999-8999-999999999999/'||repeat('a',64)||'.mp4',
      'video_path','staged/99999999-9999-4999-8999-999999999999/'||repeat('b',64)||'.mp4',
      'poster_path','https://evil.example.test/remote.jpg'));
  raise exception 'HOTLINK_POSTER_BYPASSED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_VIDEO_PRIVATE_ASSET_PATH_INVALID' then
   raise exception 'VIDEO_PUBLIC_POSTER_WAS_NOT_DENIED: %',msg;end if;
 end;
 if not public.jb_ad_video_log_orphan_server(jsonb_build_object(
  'assetId',id,'reason','PRIVATE_STORAGE_FAILED','objects',
  jsonb_build_array(jsonb_build_object(
   'bucket','jb-ad-video-originals-private',
   'path','staged/'||id||'/'||repeat('a',64)||'.mp4'))))
 then raise exception 'VIDEO_ORPHAN_AUDIT_NOT_PERSISTED';end if;
 begin
  perform public.jb_ad_video_log_orphan_server(jsonb_build_object(
   'assetId',id,'reason','PRIVATE_STORAGE_FAILED','objects',
   jsonb_build_array(jsonb_build_object(
    'bucket','public-media','path','staged/'||id||'/'||repeat('a',64)||'.mp4'))));
  raise exception 'ORPHAN_TO_PUBLIC_MEDIA_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_VIDEO_ORPHAN_BUCKET_OR_PATH_UNTRUSTED' then
   raise exception 'ORPHAN_PUBLIC_BUCKET_UNBLOCKED: %',msg;end if;
 end;
 raise notice 'PASS [ADS-011/015] only service_role can write real three-object private video evidence; no public poster';
end $backend$;
reset role;
do $creator$
declare v jsonb;v_id uuid;msg text;
begin
 v:=current_setting('b7.video_fixture')::jsonb;
 v_id:=(v->>'creative_id')::uuid;
 if (select approved from public.ad_creatives where id=v_id) then
  raise exception 'VIDEO_RECEIPT_SILENTLY_APPROVED_CREATIVE';end if;
 perform set_config('b7.test_owner','enabled',true);
 begin
  perform public.jb_ad_approve_creative_internal(v_id);
  raise exception 'VIDEO_RECEIPT_BYPASSED_EXPLICIT_OWNER_MEDIA_HOLD';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_MEDIA_SERVER_VERIFICATION_NOT_READY'
  then raise exception 'OWNER_VIDEO_APPROVAL_HOLD_WEAKENED: %',msg;end if;
 end;
 raise notice 'PASS [ADS-011] verified private receipt never silently changes canonical ad approval';
end $creator$;
rollback;
