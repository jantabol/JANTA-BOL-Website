\set ON_ERROR_STOP on
-- ADS-002/003/004/005 isolated transaction; no production connection.
begin;
do $test$
declare
 c jsonb; msg text; before_count int;
begin
 select count(*) into before_count from public.ad_campaigns;
 for c in select value from jsonb_array_elements(
  jsonb_build_array(
   jsonb_build_object('n','a','w','9876543210','consent',true,'origin','homepage','error','INVALID_ENQUIRY_OR_CONSENT'),
   jsonb_build_object('n','Test Shop','w','','consent',true,'origin','homepage','error','INVALID_ENQUIRY_OR_CONSENT'),
   jsonb_build_object('n','Test Shop','w','abc@gmail.com','consent',true,'origin','homepage','error','INVALID_WHATSAPP_NUMBER'),
   jsonb_build_object('n','Test Shop','w','9876543210','consent',false,'origin','homepage','error','INVALID_ENQUIRY_OR_CONSENT'),
   jsonb_build_object('n','Test Shop','w','9876543210','consent',true,'origin','district:guna','error','INVALID_ENQUIRY_ORIGIN'),
   jsonb_build_object('n','Test Shop','w','9876543210','consent',true,'origin',null,'error','INVALID_ENQUIRY_ORIGIN'),
   jsonb_build_object('n','Test Shop','w','9876543210','consent',true,'origin','article','error','INVALID_ARTICLE_CONTEXT')
  )
 ) loop
  begin
   perform public.jb_ad_public_enquiry(
    c->>'n',c->>'w',(c->>'consent')::boolean,c->>'origin',null,null);
   raise exception 'NEGATIVE_NOT_REJECTED';
  exception when others then
   get stacked diagnostics msg=message_text;
   if msg<>(c->>'error') then
    raise exception 'UNEXPECTED_REJECTION expected %, got %',c->>'error',msg;
   end if;
  end;
 end loop;
 if (select count(*) from public.ad_campaigns)<>before_count
 then raise exception 'REJECTED_INPUT_CREATED_CAMPAIGN';end if;
 raise notice 'PASS [ADS-002] invalid WhatsApp, missing consent, bad origins denied without writes';
end $test$;

-- Verify actual anonymously-executable endpoint (not an Owner-only shortcut).
set local role anon;
select public.jb_ad_public_enquiry(
 'Shivpuri Shop','9876543210',true,'homepage',null,'स्थानीय दुकान') as pending_receipt;
select public.jb_ad_public_enquiry(
 'District Service','+447700900123',true,'article',
 '10000000-0000-0000-0000-000000000001'::uuid,'News enquiry') as article_receipt;
do $legacy$
declare msg text;
begin
 begin
  perform public.jb_ad_public_request('Business','9876543210','homepage','global','normal');
  raise exception 'LEGACY_ANON_BYPASS';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg not like '%permission denied%' then
   raise exception 'UNSAFE_LEGACY_PUBLIC_PATH: %',msg;
  end if;
 end;
end $legacy$;
reset role;

do $test$
declare msg text;
begin
 if (select count(*) from public.ad_campaigns)<>2 then raise exception 'WRONG_ENQUIRY_COUNT';end if;
 if not exists (
  select 1 from public.ad_campaigns c join public.advertisers a on a.id=c.advertiser_id
  where a.contact='+919876543210' and c.status='requested'
   and c.placement='homepage' and c.scope='global'
   and c.enquiry_origin='homepage' and c.whatsapp_consent_at is not null
   and c.approved_at is null and c.paid_at is null
 ) then raise exception 'NOT_PENDING_OR_UNNORMALIZED'; end if;
 if not exists (
  select 1 from public.ad_campaigns c join public.advertisers a on a.id=c.advertiser_id
  where a.contact='+447700900123' and c.enquiry_origin='article'
   and c.enquiry_article_id='10000000-0000-0000-0000-000000000001'
 ) then raise exception 'ARTICLE_CONTEXT_NOT_RECORDED'; end if;
 if (select count(*) from public.ad_history where event_type='public_enquiry')<>2
 then raise exception 'HISTORY_MISSING';end if;
 begin
  perform public.jb_ad_public_enquiry('Repeat Shop','+919876543210',true,'homepage',null,null);
  raise exception 'DUPLICATE_NOT_REJECTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'ENQUIRY_COOLDOWN' then raise exception 'COOLDOWN_FAILED: %',msg;end if;
 end;
 if (select count(*) from public.ad_campaigns)<>2 then raise exception 'DUPLICATE_INSERT';end if;
 begin
  perform public.jb_ad_public_enquiry('Draft Article','9876543211',true,'article',
   '10000000-0000-0000-0000-000000000002'::uuid,null);
  raise exception 'UNPUBLISHED_ARTICLE_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'INVALID_ARTICLE_CONTEXT' then raise exception 'ARTICLE_VALIDATION_FAILED: %',msg;end if;
 end;
 raise notice 'PASS [ADS-003/004/005] anon writes pending only; article context, consent, cooldown and legacy denial';
end $test$;

do $verify_test$
declare v_normal uuid;v_high uuid;msg text;
begin
 select a.id into v_normal from public.advertisers a where a.contact='+919876543210';
 if v_normal is null then raise exception 'NORMAL_FIXTURE_MISSING';end if;
 -- No fake Owner privilege: the default fixture mode denies changes.
 begin
  perform public.jb_ad_verify_advertiser_internal(v_normal,'verified','Contact verified normally',null);
  raise exception 'NONOWNER_BYPASS';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'OWNER_AAL2_REQUIRED' then raise exception 'OWNER_DENIAL_FAILED: %',msg;end if;
 end;
 if (select verification_state from public.advertisers where id=v_normal)<>'pending'
 then raise exception 'UNAUTHORIZED_VERIFICATION_MUTATION';end if;
 -- Controlled isolated Owner-AAL2 fixture, NOT real Supabase authentication.
 perform set_config('b7.test_owner','enabled',true);
 perform public.jb_ad_verify_advertiser_internal(
  v_normal,'verified','Owner completed normal business contact verification',null);
 if (select verification_state from public.advertisers where id=v_normal)<>'verified'
 then raise exception 'VERIFICATION_WRITE_FAILED';end if;
 insert into public.advertisers(name,contact,risk_level,verification_state)
 values('High Risk Test','+919876543219','high','pending') returning id into v_high;
 begin
  perform public.jb_ad_verify_advertiser_internal(
   v_high,'verified','Enhanced business verification reviewed',null);
  raise exception 'HIGH_RISK_MISSING_EVIDENCE_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'ENHANCED_VERIFICATION_EVIDENCE_REQUIRED'
  then raise exception 'HIGH_RISK_GUARD_FAILED: %',msg;end if;
 end;
 if (select verification_state from public.advertisers where id=v_high)<>'pending'
 then raise exception 'HIGH_RISK_BAD_STATE';end if;
 perform public.jb_ad_verify_advertiser_internal(
  v_high,'verified','Independently reviewed enhanced checks','OFFLINE-TEST-REFERENCE-001');
 if (select verification_state from public.advertisers where id=v_high)<>'verified'
 then raise exception 'HIGH_RISK_VERIFICATION_WRITE_FAILED';end if;
 if (select count(*) from public.audit_logs where action='ad_verification')<>2
 then raise exception 'SHARED_AUDIT_MISSING';end if;
 if not exists (
  select 1 from public.ad_history h join public.ad_campaigns c on h.campaign_id=c.id
  where c.advertiser_id=v_normal and h.event_type='verification_verified'
 ) then raise exception 'CAMPAIGN_VERIFICATION_HISTORY_MISSING';end if;
 perform set_config('b7.test_owner','',true);
 raise notice 'PASS [ADS-007/008/009] Owner-only verification, high-risk evidence, unchanged rejected state and shared audit';
end $verify_test$;

set local role anon;
do $verify_anon$
declare msg text;
begin
 begin
  perform public.jb_ad_verify_advertiser_internal(
   '00000000-0000-0000-0000-000000000001','verified','forged caller',null);
  raise exception 'PUBLIC_VERIFICATION_BYPASS';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg not like '%permission denied%' then
   raise exception 'PUBLIC_VERIFICATION_GUARD_FAILED: %',msg;
  end if;
 end;
end $verify_anon$;
reset role;

rollback;
