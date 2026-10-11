\set ON_ERROR_STOP on
-- Disposable PostgreSQL 17 E2 only. Synthetic digests and mock object
-- paths do NOT establish a real uploaded file or Founder session.
begin;
do $setup$
declare v uuid;asset uuid:='99999999-9999-4999-8999-999999999999';
 v_old uuid;
begin
 perform set_config('b7.test_owner','enabled',true);
 select id into v_old from public.ad_creatives
 where campaign_id='30000000-0000-0000-0000-000000000003'
 and approved=true limit 1;
 v:=public.jb_ad_save_creative_internal(
  '30000000-0000-0000-0000-000000000003','image',
  'https://pending.example.test/RAW-NEVER-APPROVE.png',
  'Photo candidate',null,null);
 perform set_config('b7.ci_release_creative_id',v::text,true);
 perform set_config('b7.ci_old_approved',v_old::text,true);
 if (select approved from public.ad_creatives where id=v) is distinct from false
 then raise exception 'NEW_IMAGE_SILENTLY_APPROVED';end if;
 if (select approved from public.ad_creatives where id=v_old) is distinct from true
 then raise exception 'PENDING_IMAGE_REPLACED_OLD_APPROVED';end if;
 begin
  perform public.jb_ad_approve_creative_internal(v);
  raise exception 'IMAGE_WITHOUT_SAFETY_LEDGER_APPROVED';
 exception when others then
  if sqlerrm<>'B7_IMAGE_VERIFIED_FIRST_PARTY_RELEASE_REQUIRED'
  then raise exception 'IMAGE_APPROVAL_FIRST_GATE_WRONG: %',sqlerrm;end if;
 end;
 insert into private.b7_ad_media_receipts(
 asset_id,campaign_id,creative_id,creative_version,owner_user_id,
 source_path,source_sha256,source_mime,source_bytes,
 derivative_path,derivative_sha256,derivative_bytes,width,height,
 storage_readback_verified_at)
 values(asset,'30000000-0000-0000-0000-000000000003',v,2,
 '11111111-1111-1111-1111-111111111111',
 'staged/'||asset||'/'||repeat('a',64)||'.png',
 repeat('a',64),'image/png',1000,
 'staged/'||asset||'/'||repeat('b',64)||'.png',
 repeat('b',64),900,500,350,now());
 insert into private.b7_ad_clean_release_receipts(
 asset_id,campaign_id,creative_id,creative_version,owner_user_id,
 media_type,media_path,media_sha256,verified_at)
 values(asset,'30000000-0000-0000-0000-000000000003',v,2,
 '11111111-1111-1111-1111-111111111111',
 'image','creative/'||v||'/'||asset||'/'||repeat('b',64)||'.png',
 repeat('b',64),now());
 begin
  perform public.jb_ad_approve_creative_internal(v);
  raise exception 'IMAGE_APPROVED_WITHOUT_DISABLED_SAFE_ORIGIN';
 exception when others then
  if sqlerrm<>'B7_IMAGE_PUBLIC_RELEASE_DISABLED'
  then raise exception 'DISABLED_BY_DEFAULT_MEDIA_APPROVAL_BYPASSED: %',sqlerrm;end if;
 end;
 insert into private.b7_ad_clean_public_origin(storage_origin)
 values('https://vrffsnkycvjithwtiylt.supabase.co');
 begin
  perform public.jb_ad_approve_creative_internal(v);
  raise exception 'IMAGE_APPROVED_WITH_DISABLED_ORIGIN_ROW';
 exception when others then
  if sqlerrm<>'B7_IMAGE_PUBLIC_RELEASE_DISABLED'
  then raise exception 'MEDIA_ORIGIN_DEFAULT_FALSE_BYPASSED: %',sqlerrm;end if;
 end;
 raise notice 'PASS [ADS-010/015] false by default; pending copy and approved old preserved until explicit configured authority';
end $setup$;
set local role authenticated;
do $other$
declare v uuid;msg text;
begin
 v:=current_setting('b7.ci_release_creative_id')::uuid;
 begin
  update private.b7_ad_clean_public_origin set enabled=true;
  raise exception 'BROWSER_ENABLED_PUBLIC_MEDIA_RELEASE';
 exception when insufficient_privilege then null;end;
 perform set_config('b7.test_owner','',true);
 begin
  perform public.jb_ad_approve_creative_internal(v);
  raise exception 'AAL1_APPROVED_MEDIA';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'OWNER_AAL2_REQUIRED'
  then raise exception 'AAL1_MEDIA_APPROVAL_NOT_DENIED: %',msg;end if;
 end;
 raise notice 'PASS [ADS-009] authenticated client cannot switch release mode; AAL1 rejected';
end $other$;
reset role;
-- TEST FIXTURE ONLY. This is not a Production Founder decision!
update private.b7_ad_clean_public_origin set enabled=true where singleton=true;
select set_config('b7.test_owner','enabled',true);
do $owner$
declare v uuid;v_old uuid;approved_creative public.ad_creatives%rowtype;
  old_count int;new_count int;
begin
 v:=current_setting('b7.ci_release_creative_id')::uuid;
 v_old:=current_setting('b7.ci_old_approved')::uuid;
 select count(*) into old_count from public.ad_history
  where campaign_id='30000000-0000-0000-0000-000000000003'
   and event_type='creative_approved';
 approved_creative:=public.jb_ad_approve_creative_internal(v);
 if approved_creative.id is distinct from v or
    approved_creative.approved is distinct from true or
    approved_creative.approved_once is distinct from true or
    approved_creative.media_url is distinct from
     ('https://vrffsnkycvjithwtiylt.supabase.co'||
     '/storage/v1/object/public/jb-ad-clean-public/creative/'||v||
     '/99999999-9999-4999-8999-999999999999/'||repeat('b',64)||'.png')
 then raise exception 'OWNER_IMAGE_APPROVAL_URL_NOT_CANONICAL';end if;
 if (select approved from public.ad_creatives where id=v_old) is distinct from false
 then raise exception 'OLD_APPROVED_NOT_ATOMICALLY_REPLACED';end if;
 select count(*) into new_count from public.ad_history
  where campaign_id='30000000-0000-0000-0000-000000000003'
   and event_type='creative_approved';
 if new_count<>old_count+1 then raise exception 'APPROVAL_AUDIT_NOT_APPEND_ONLY';end if;
 perform public.jb_ad_approve_creative_internal(v);
 if (select count(*) from public.ad_history
  where campaign_id='30000000-0000-0000-0000-000000000003'
   and event_type='creative_approved')<>new_count
 then raise exception 'DUPLICATE_OWNER_MEDIA_APPROVAL_EVENT';end if;
 raise notice 'PASS [ADS-010/045] explicit Owner approves ONLY media-matched first-party PNG, old approved archived, duplicate tap idempotent';
end $owner$;
do $video$
declare v uuid;msg text;
begin
 v:=public.jb_ad_save_creative_internal(
  '30000000-0000-0000-0000-000000000001','video',
  'https://pending.example.test/remote-unreviewed.mp4',
  'Video still held',null,null);
 begin
  perform public.jb_ad_approve_creative_internal(v);
  raise exception 'VIDEO_APPROVED_WITHOUT_PUBLIC_POSTER_FEED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_VIDEO_PUBLIC_POSTER_FEED_NOT_READY'
  then raise exception 'VIDEO_APPROVAL_FAIL_CLOSED_REGRESSION: %',msg;end if;
 end;
 raise notice 'PASS [ADS-011] image approval review-only safe; VIDEO approval stays blocked pending paired poster feed';
end $video$;
rollback;
