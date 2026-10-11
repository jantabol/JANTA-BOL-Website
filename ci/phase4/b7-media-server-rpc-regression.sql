\set ON_ERROR_STOP on
-- Real PostgreSQL 17 disposable E2, NO live Supabase changes.
begin;
do $set$
declare creative uuid; v jsonb; asset uuid:='88888888-8888-4888-8888-888888888888';
begin
 perform set_config('b7.test_owner','enabled',true);
 creative:=public.jb_ad_save_creative_internal(
 '30000000-0000-0000-0000-000000000003','image',
 'https://media.example.test/unapproved-source.png','Review only',null,null);
 perform set_config('b7.test_owner','',true);
 v:=jsonb_build_object(
 'asset_id',asset,'campaign_id','30000000-0000-0000-0000-000000000003',
 'creative_id',creative,'creative_version',2,
 'owner_user_id','11111111-1111-4111-8111-111111111111',
 'source_bucket','jb-ad-originals-private',
 'source_path','staged/'||asset::text||'/'||repeat('a',64)||'.png',
 'source_sha256',repeat('a',64),'source_mime','image/png','source_bytes',1050,
 'derivative_bucket','jb-ad-previews-private',
 'derivative_path','staged/'||asset::text||'/'||repeat('b',64)||'.png',
 'derivative_sha256',repeat('b',64),'derivative_mime','image/png',
 'derivative_bytes',930,'width',400,'height',200,
 'storage_readback_verified_at',now());
 perform set_config('b7.ci_media_fixture',v::text,true);
end $set$;
set local role anon;
do $no_anon$
declare msg text;
begin
 begin
  perform public.jb_ad_media_record_receipt_server(
    current_setting('b7.ci_media_fixture')::jsonb);
  raise exception 'ANON_INSERTED_PRIVATE_MEDIA_RECEIPT';
 exception when insufficient_privilege then null;end;
 begin
  perform public.jb_ad_media_read_receipt_server(
    '88888888-8888-4888-8888-888888888888');
  raise exception 'ANON_READ_PRIVATE_MEDIA_RECEIPT';
 exception when insufficient_privilege then null;end;
 begin
  perform public.jb_ad_media_log_orphan_server('{}'::jsonb);
  raise exception 'ANON_APPENDED_FORENSIC_LOG';
 exception when insufficient_privilege then null;end;
 raise notice 'PASS [ADS-015] anonymous denied all service-only RPC bridges';
end $no_anon$;
reset role;
set local role authenticated;
do $no_auth$
begin
 begin
  perform public.jb_ad_media_record_receipt_server(
    current_setting('b7.ci_media_fixture')::jsonb);
  raise exception 'AUTH_CLIENT_WROTE_SERVER_ATTESTATION';
 exception when insufficient_privilege then null;end;
 raise notice 'PASS [ADS-009/015] authenticated user denied service-only private media write';
end $no_auth$;
reset role;
set local role service_role;
do $service$
declare v jsonb;id uuid;d jsonb;msg text;
begin
 v:=current_setting('b7.ci_media_fixture')::jsonb;
 id:=public.jb_ad_media_record_receipt_server(v);
 if id<> '88888888-8888-4888-8888-888888888888'::uuid
 then raise exception 'PRIVATE_RECEIPT_INSERT_RETURN_MISMATCH';end if;
 d:=public.jb_ad_media_read_receipt_server(id);
 if d->>'approval_state'<>'private_quarantined' or
    d->>'source_sha256'<>repeat('a',64) or
    d->>'derivative_sha256'<>repeat('b',64)
 then raise exception 'DURABLE_BACKEND_RECEIPT_READBACK_INCORRECT';end if;
 if not public.jb_ad_media_log_orphan_server(jsonb_build_object(
  'assetId',id,'reason','RECEIPT_OR_OWNER_STATE_FAILED',
  'objects',jsonb_build_array(jsonb_build_object(
    'bucket','jb-ad-originals-private',
    'path','staged/'||id::text||'/'||repeat('a',64)||'.png'))))
 then raise exception 'ORPHAN_EVENT_NOT_APPEND_ONLY';end if;
 if (select count(*) from private.b7_ad_media_orphan_events
  where asset_id=id and failure_code='DURABLE_RECEIPT_FAILED')<>1
 then raise exception 'FORENSIC_ORPHAN_MISSING';end if;
 begin
  perform public.jb_ad_media_record_receipt_server(v);
  raise exception 'DUPLICATE_RECEIPT_ACCEPTED';
 exception when unique_violation then null;end;
 begin
  perform public.jb_ad_media_record_receipt_server(v||jsonb_build_object(
    'creative_version',1,'asset_id','99999999-9999-4999-8999-999999999999',
    'source_path','staged/99999999-9999-4999-8999-999999999999/'||repeat('a',64)||'.png',
    'derivative_path','staged/99999999-9999-4999-8999-999999999999/'||repeat('b',64)||'.png'));
  raise exception 'STALE_CREATIVE_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_MEDIA_CREATIVE_MISMATCH_OR_ALREADY_APPROVED' and
     msg<>'B7_MEDIA_STALE_CREATIVE_VERSION'
  then raise exception 'STALE_GUARD_CHANGED: %',msg;end if;
 end;
 begin
  perform public.jb_ad_media_log_orphan_server(jsonb_build_object(
    'assetId',id,'reason','PRIVATE_STORAGE_FAILED',
    'objects',jsonb_build_array(jsonb_build_object(
      'bucket','public-media','path','staged/'||id::text||'/'||repeat('a',64)||'.png'))));
  raise exception 'PUBLIC_BUCKET_ORPHAN_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_ORPHAN_OBJECT_PATH_DENIED'
  then raise exception 'ORPHAN_BUCKET_GUARD_WEAKENED: %',msg;end if;
 end;
 if exists(select 1 from public.ad_creatives c
  where c.creative_type='image' and c.approved)
 then raise exception 'SERVER_MEDIA_LEDGER_SILENTLY_APPROVED_CREATIVE';end if;
 raise notice 'PASS [ADS-015] exact service_role receipts and orphan readback, stale version/dup/public path blocked, no media approval';
end $service$;
reset role;
rollback;
