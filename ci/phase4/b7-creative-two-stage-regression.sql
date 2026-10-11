\set ON_ERROR_STOP on
-- ADS-045/046 real PostgreSQL E2 contract tests, disposable rollback.
-- Existing B3 history/retention triggers remain intact.
begin;
do $start$
begin
 if not exists(select 1 from public.ad_creatives
  where campaign_id='30000000-0000-0000-0000-000000000001'
   and approved=true and approved_once=true and version=1)
 then raise exception 'EXISTING_APPROVED_CREATIVE_MISSING';end if;
 if to_regprocedure('public.jb_ad_creative_workflow_capability_internal()') is null
 then raise exception 'NEW_CREATIVE_BACKEND_CAPABILITY_MISSING';end if;
 raise notice 'PASS [ADS-045] original approved creative preserved, new RPC signature intact';
end $start$;

-- Owner without AAL2 cannot read capability, create draft, or approve.
do $unauth$
declare msg text;
begin
 begin
  perform public.jb_ad_creative_workflow_capability_internal();
  raise exception 'UNAUTHORIZED_CLIENT_CAPABILITY';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'OWNER_AAL2_REQUIRED' then
   raise exception 'OWNER_CAPABILITY_GUARD_WEAKENED: %',msg;end if;
 end;
 begin
  perform public.jb_ad_save_creative_internal(
   '30000000-0000-0000-0000-000000000001','text',null,
   'Forbidden edit',null,null);
  raise exception 'UNAUTHORIZED_CREATIVE_SAVED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'OWNER_AAL2_REQUIRED' then
   raise exception 'CREATIVE_SAVE_GUARD_WEAKENED: %',msg;end if;
 end;
 raise notice 'PASS [ADS-045/046] AAL1 denied before any creative SAVE, no approved state changed';
end $unauth$;

select set_config('b7.test_owner','enabled',true);
do $two_stage$
declare v_old uuid;v2 uuid;v3 uuid;msg text;v_creative public.ad_creatives;
        v_old_count integer;v_new_count integer;
begin
 if public.jb_ad_creative_workflow_capability_internal()<>'B7_DRAFT_THEN_EXPLICIT_APPROVE_V1'
 then raise exception 'CREATIVE_DRAFT_CAPABILITY_NOT_EXACT';end if;
 select id into v_old from public.ad_creatives
 where campaign_id='30000000-0000-0000-0000-000000000001'
   and approved=true limit 1;
 select count(*) into v_old_count from public.ad_history
 where campaign_id='30000000-0000-0000-0000-000000000001';

 v2:=public.jb_ad_save_creative_internal(
  '30000000-0000-0000-0000-000000000001','text',null,
  'Unapproved preview version 2','website','https://advertiser.example.test/first');
 if not exists(select 1 from public.ad_creatives
  where id=v2 and approved=false and approved_once=false and version=2)
 then raise exception 'NEW_DRAFT_AUTO_APPROVED';end if;
 if not exists(select 1 from public.ad_creatives
  where id=v_old and approved=true and approved_once=true)
 then raise exception 'SAVE_REVOKED_STILL_LIVE_OLD_MEDIA';end if;
 select count(*) into v_new_count from public.ad_history
 where campaign_id='30000000-0000-0000-0000-000000000001';
 if v_new_count<>v_old_count+1 or not exists(select 1 from public.ad_history
  where campaign_id='30000000-0000-0000-0000-000000000001'
    and event_type='creative_draft_saved')
 then raise exception 'DRAFT_MISSING_APPEND_ONLY_HISTORY';end if;
 raise notice 'PASS [ADS-046] Owner SAVE creates true pending draft version 2; originally LIVE version stays approved';

 -- Concurrent Owner editing cannot approve an older stale version.
 v3:=public.jb_ad_save_creative_internal(
  '30000000-0000-0000-0000-000000000001','text',null,
  'Newest preview version 3','website','https://advertiser.example.test/latest');
 begin
  perform public.jb_ad_approve_creative_internal(v2);
  raise exception 'OLDER_STALE_DRAFT_APPROVED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'STALE_CREATIVE_VERSION_NOT_APPROVABLE'
  then raise exception 'STALE_DRAFT_GUARD_WRONG: %',msg;end if;
 end;
 if not exists(select 1 from public.ad_creatives
   where id=v_old and approved=true)
 then raise exception 'STALE_APPROVAL_REPLACED_OLD_LIVE';end if;

 perform set_config('b7.test_owner','',true);
 begin
  perform public.jb_ad_approve_creative_internal(v3);
  raise exception 'AAL1_APPROVAL_SUCCEEDED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'OWNER_AAL2_REQUIRED'
  then raise exception 'AAL1_APPROVAL_NOT_DENIED: %',msg;end if;
 end;
 perform set_config('b7.test_owner','enabled',true);

 v_creative:=public.jb_ad_approve_creative_internal(v3);
 if v_creative.id<>v3 or v_creative.approved<>true or v_creative.approved_once<>true
 then raise exception 'OWNER_EXPLICIT_APPROVAL_FAILED';end if;
 if (select count(*) from public.ad_creatives
   where campaign_id='30000000-0000-0000-0000-000000000001'
    and approved=true)<>1 then
   raise exception 'MULTIPLE_ACTIVE_APPROVED_CREATIVES';end if;
 if not exists(select 1 from public.ad_creatives
  where id=v_old and approved=false and approved_once=true
    and text_body='Verified advertisement creative')
 then raise exception 'OLD_APPROVED_EVIDENCE_NOT_PRESERVED';end if;
 select count(*) into v_new_count from public.ad_history
 where campaign_id='30000000-0000-0000-0000-000000000001'
  and event_type='creative_approved';
 if v_new_count<>1 then raise exception 'EXPLICIT_APPROVAL_HISTORY_WRONG';end if;

 -- No second duplicate approval/history record from a repeated Owner tap.
 v_creative:=public.jb_ad_approve_creative_internal(v3);
 if (select count(*) from public.ad_history
  where campaign_id='30000000-0000-0000-0000-000000000001'
    and event_type='creative_approved')<>1
 then raise exception 'DUPLICATE_APPROVAL_AUDIT';end if;
 raise notice 'PASS [ADS-045/046] latest explicit Owner approval only, old version immutable, idempotent approval';
end $two_stage$;

-- A VERIFIED new media URL can be saved for private review but CANNOT
-- auto-approve before server-side MIME+bytes+dimension/codec checks exist.
do $media_hold$
declare v_media uuid;msg text;v_prior uuid;
begin
 select id into v_prior from public.ad_creatives
 where campaign_id='30000000-0000-0000-0000-000000000003'
  and approved=true limit 1;
 v_media:=public.jb_ad_save_creative_internal(
  '30000000-0000-0000-0000-000000000003','image',
  'https://approved-assets.example.test/ads/pending.webp',
  'Pending media scan',null,null);
 if not exists(select 1 from public.ad_creatives
  where id=v_media and approved=false)
 then raise exception 'RAW_MEDIA_AUTO_APPROVED';end if;
 begin
  perform public.jb_ad_approve_creative_internal(v_media);
  raise exception 'MEDIA_APPROVED_WITHOUT_SERVER_VERIFICATION';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_MEDIA_SERVER_VERIFICATION_NOT_READY'
  then raise exception 'MEDIA_NOT_BLOCKED_UNTIL_WORKER: %',msg;end if;
 end;
 if not exists(select 1 from public.ad_creatives
  where id=v_prior and approved=true)
 then raise exception 'OLD_MEDIA_DISAPPEARED_AFTER_PENDING_ASSET';end if;
 raise notice 'PASS [ADS-015] unsafe raw image cannot become approved without independent server media scan; old approved preserved';
end $media_hold$;

do $input_guards$
declare msg text;v_before int;
begin
 select count(*) into v_before from public.ad_creatives;
 begin
  perform public.jb_ad_save_creative_internal(
   '30000000-0000-0000-0000-000000000003','image',
   'javascript:alert(1)','Bad media',null,null);
  raise exception 'UNSAFE_MEDIA_DRAFT_SAVED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'INVALID_UNTRUSTED_AD_MEDIA' then
   raise exception 'BAD_MEDIA_DENIAL_CODE: %',msg;end if;
 end;
 begin
  perform public.jb_ad_save_creative_internal(
   '30000000-0000-0000-0000-000000000003','text',null,
   'Bad CTA','website','file:///etc/passwd');
  raise exception 'UNSAFE_CTA_DRAFT_SAVED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'HTTPS_CTA_REQUIRED' then
   raise exception 'BAD_CTA_DENIAL_CODE: %',msg;end if;
 end;
 begin
  perform public.jb_ad_save_creative_internal(
   '30000000-0000-0000-0000-000000000003',null,null,
   'null type',null,null);
  raise exception 'NULL_CREATIVE_TYPE_SAVED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'INVALID_CREATIVE_TYPE' then
   raise exception 'NULL_TYPE_NOT_DENIED: %',msg;end if;
 end;
 begin
  perform public.jb_ad_save_creative_internal(
   '30000000-0000-0000-0000-000000000003','image',
   'https://127.0.0.1/private/secret.png','IP local',null,null);
  raise exception 'PRIVATE_IP_DRAFT_SAVED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'INVALID_UNTRUSTED_AD_MEDIA' then
   raise exception 'PRIVATE_IP_MEDIA_NOT_DENIED: %',msg;end if;
 end;
 begin
  perform public.jb_ad_save_creative_internal(
   '30000000-0000-0000-0000-000000000003','image',
   'https://media.internal/photo.jpg','Intranet',null,null);
  raise exception 'PRIVATE_INTRANET_DRAFT_SAVED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'INVALID_UNTRUSTED_AD_MEDIA' then
   raise exception 'INTRANET_MEDIA_NOT_DENIED: %',msg;end if;
 end;
 begin
  perform public.jb_ad_save_creative_internal(
   '30000000-0000-0000-0000-000000000003','text',null,
   'Private CTA','website','https://localhost/owner');
  raise exception 'LOCAL_HOST_CTA_DRAFT_SAVED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'HTTPS_CTA_REQUIRED' then
   raise exception 'LOCAL_CTA_NOT_DENIED: %',msg;end if;
 end;
 if (select count(*) from public.ad_creatives)<>v_before
 then raise exception 'INVALID_CREATIVE_MUTATED_SOURCE';end if;
 raise notice 'PASS [ADS-015/048] malicious media/CTA rejected without any creative write';
end $input_guards$;

do $high_risk$
declare v_bad uuid;msg text;
begin
 v_bad:=public.jb_ad_save_creative_internal(
  '30000000-0000-0000-0000-000000000002','text',null,
  'Unverified sensitive advertisement',null,null);
 begin
  perform public.jb_ad_approve_creative_internal(v_bad);
  raise exception 'UNVERIFIED_HIGH_RISK_APPROVED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'ADVERTISER_NOT_VERIFIED' then
   raise exception 'UNVERIFIED_HIGH_RISK_DENIAL_WRONG: %',msg;end if;
 end;
 if not exists(select 1 from public.ad_creatives
   where id=v_bad and approved=false)
 then raise exception 'FAILED_VERIFICATION_LEFT_APPROVED_AD';end if;
 raise notice 'PASS [ADS-008] pending high-risk advertiser cannot approve pending draft';
end $high_risk$;
rollback;
