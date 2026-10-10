\set ON_ERROR_STOP on
-- E2 synthetic ONLY. Roll back all fixture transitions. No production URL/DB.
begin;

-- Legacy creative submission may ONLY create a text request.
set local role anon;
do $negative$
declare msg text; t text:=repeat('a',48);
begin
 begin
  perform public.jb_ad_portal_submit_creative(t,'image','https://test.invalid/x.jpg',
    'Please replace the creative',null,null);
  raise exception 'DIRECT_MEDIA_UPLOAD_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'TEXT_CHANGE_REQUEST_ONLY' then raise exception 'IMAGE_GUARD_FAILED: %',msg;end if;
 end;
 begin
  perform public.jb_ad_portal_submit_creative(t,'video','https://test.invalid/a.mp4',
    'Please replace video poster',null,null);
  raise exception 'DIRECT_VIDEO_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'TEXT_CHANGE_REQUEST_ONLY' then raise exception 'VIDEO_GUARD_FAILED: %',msg;end if;
 end;
 begin
  perform public.jb_ad_portal_submit_creative(t,'text',null,
    'Please change the advert display location','website','https://test.invalid');
  raise exception 'DIRECT_CTA_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'TEXT_CHANGE_REQUEST_ONLY' then raise exception 'CTA_GUARD_FAILED: %',msg;end if;
 end;
 begin
  perform public.jb_ad_portal_submit_creative(t,'text',null,'x',null,null);
  raise exception 'TINY_NOTE_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'TEXT_CHANGE_REQUEST_ONLY' then raise exception 'TEXT_GUARD_FAILED: %',msg;end if;
 end;
 begin
  perform public.jb_ad_portal_submit_creative(repeat('x',48),'text',null,
    'Any meaningful text change request',null,null);
  raise exception 'FORGED_TOKEN_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'ADVERTISER_SESSION_REQUIRED' then raise exception 'TOKEN_GUARD_FAILED: %',msg;end if;
 end;
 begin
  perform public.jb_ad_portal_submit_creative(repeat('c',48),'text',null,
    'Expired client request is denied',null,null);
  raise exception 'EXPIRED_SESSION_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'ADVERTISER_SESSION_REQUIRED' then raise exception 'EXPIRED_GUARD_FAILED: %',msg;end if;
 end;
 raise notice 'PASS [ADS-041/045] old portal creative RPC blocks media, CTA, short text, fake/expired sessions';
end $negative$;

select public.jb_ad_portal_submit_creative(
 repeat('a',48),'text',null,'Please change my advertisement photo with Owner approval',null,null)
 as pending_request_A;

do $repeat$
declare msg text;
begin
 begin
  perform public.jb_ad_portal_submit_creative(
   repeat('a',48),'text',null,'Duplicate prompt should be throttled',null,null);
  raise exception 'DUPLICATE_REQUEST_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'CHANGE_REQUEST_COOLDOWN' then raise exception 'COOLDOWN_BROKEN: %',msg;end if;
 end;
 raise notice 'PASS [ADS-045] duplicate within window rejected by backend';
end $repeat$;

select public.jb_ad_portal_submit_creative(
 repeat('b',48),'text',null,'Business B requests alternative text only',null,null)
 as pending_request_B;

do $portal$
declare a record;b record;
begin
 select * into a from public.jb_ad_portal_campaign(repeat('a',48));
 select * into b from public.jb_ad_portal_campaign(repeat('b',48));
 if a.campaign_id is distinct from 'aaaaaaaa-0000-0000-0000-000000000001'::uuid
    or b.campaign_id is distinct from 'bbbbbbbb-0000-0000-0000-000000000002'::uuid
 then raise exception 'CROSS_ADVERTISER_CAMPAIGN_LEAK';end if;
 if a.creative->>'text_body'<>'ACTIVE-A' or b.creative->>'text_body'<>'ACTIVE-B'
 then raise exception 'PORTAL_SHOWN_UNAPPROVED_CREATIVE';end if;
 if (select count(*) from public.jb_ad_portal_campaign(repeat('c',48)))<>0
 then raise exception 'EXPIRED_PORTAL_DATA_LEAK';end if;
 raise notice 'PASS [ADS-042/044/046] A/B own campaign and only currently APPROVED creative shown';
end $portal$;

-- Role cannot bypass RLS by guessing the table or trigger, despite session token.
do $table_denied$
declare msg text;
begin
 begin
  perform 1 from public.ad_change_requests;
  raise exception 'ANON_DIRECT_TABLE_READ_ALLOWED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg not like '%permission denied%' then
   raise exception 'TABLE_GUARD_WRONG: %',msg;
  end if;
 end;
 raise notice 'PASS [ADS-043/045] anon has no direct change-request table privilege';
end $table_denied$;
reset role;

do $state$
begin
 if (select count(*) from public.ad_change_requests)<>2
   or (select count(*) from public.ad_change_requests where status='pending')<>2
 then raise exception 'REQUEST_STATE_BAD';end if;
 if (select count(*) from public.ad_creatives)<>3
    or (select count(*) from public.ad_creatives where approved)<>2
 then raise exception 'ADVERTISER_MUTATED_CREATIVE';end if;
 if (select count(*) from public.ad_history where event_type='creative_change_requested')<>2
 then raise exception 'REQUEST_HISTORY_MISSING';end if;
 raise notice 'PASS [ADS-045/046] two own text requests created, no creative or live campaign mutation';
end $state$;

-- Revoke credentials: old previously valid token must no longer access own data.
update public.ad_portal_credentials set revoked_at=now()
where campaign_id='bbbbbbbb-0000-0000-0000-000000000002';
set local role anon;
do $revoked$
declare msg text;
begin
 if (select count(*) from public.jb_ad_portal_campaign(repeat('b',48)))<>0
 then raise exception 'REVOKED_PORTAL_READ';end if;
 begin
  perform public.jb_ad_portal_submit_creative(repeat('b',48),'text',null,
   'Please update some advertisement details',null,null);
  raise exception 'REVOKED_CREDENTIAL_WRITE';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'ADVERTISER_SESSION_REQUIRED' then raise exception 'REVOKE_GUARD_FAILED: %',msg;end if;
 end;
 raise notice 'PASS [ADS-041] credential revocation invalidates old active session';
end $revoked$;
reset role;

-- Authenticated AAL1, not Owner AAL2, must fail even if account is logged in.
set local role authenticated;
do $owner_denied$
declare msg text;
begin
 begin
  perform public.jb_ad_owner_change_requests_internal();
  raise exception 'STAFF_CAN_VIEW_PRIVATE_REQUESTS';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'OWNER_AAL2_REQUIRED' then raise exception 'QUEUE_DENIAL_WRONG: %',msg;end if;
 end;
 begin
  perform public.jb_ad_decide_change_request_internal(
   (select id from public.ad_change_requests limit 1),
   'accepted_for_work','Forged advertiser decision');
  raise exception 'NONOWNER_DECISION_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg not like '%permission denied%' and msg<>'OWNER_AAL2_REQUIRED' then
    raise exception 'OWNER_DECISION_GUARD_WRONG: %',msg;
  end if;
 end;
 raise notice 'PASS [ADS-043] authenticated nonowner cannot review or decide';
end $owner_denied$;
reset role;

do $owner_test$
declare v uuid;msg text;
begin
 perform set_config('b7.test_owner','enabled',true);
 if jsonb_array_length(public.jb_ad_owner_change_requests_internal())<>2
 then raise exception 'OWNER_PENDING_QUEUE_MISSING';end if;
 select id into v from public.ad_change_requests
 where campaign_id='aaaaaaaa-0000-0000-0000-000000000001';
 perform public.jb_ad_decide_change_request_internal(
  v,'accepted_for_work','Owner accepts request for media studio review only');
 if (select status from public.ad_change_requests where id=v)<>'accepted_for_work'
 then raise exception 'OWNER_DECISION_NOT_RECORDED';end if;
 begin
  perform public.jb_ad_decide_change_request_internal(
   v,'accepted_for_work','Duplicate acceptance should fail');
  raise exception 'REPLAYED_DECISION';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'CHANGE_REQUEST_ALREADY_REVIEWED' then raise exception 'REPLAY_GUARD_WRONG: %',msg;end if;
 end;
 if (select count(*) from public.ad_creatives)<>3
   or (select count(*) from public.ad_creatives where approved)<>2
 then raise exception 'OWNER_REQUEST_REVIEW_AUTO_CHANGED_CREATIVE';end if;
 if (select count(*) from public.audit_logs where action='ad_change_decision')<>1
 then raise exception 'OWNER_AUDIT_MISSING';end if;
 if not exists(
  select 1 from public.ad_history where event_type='creative_change_accepted_for_work'
 ) then raise exception 'OWNER_HISTORY_MISSING';end if;
 raise notice 'PASS [ADS-045/046] Owner decision audited, approved creative unchanged until separate review';
end $owner_test$;

-- ADS-041: one-time password consumed atomically, returned token bounded.
set local role anon;
do $one_time$
declare t text;msg text;
begin
 t:=public.jb_ad_portal_login('JB-A','test-secret-A');
 if t !~ '^[0-9a-f]{48}$' then raise exception 'WEAK_SESSION_TOKEN';end if;
 if (select count(*) from public.jb_ad_portal_campaign(t))<>1
 then raise exception 'ONE_TIME_LOGIN_DID_NOT_CREATE_VALID_SESSION';end if;
 begin
  perform public.jb_ad_portal_login('JB-A','test-secret-A');
  raise exception 'TEMP_SECRET_REPLAY_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'INVALID_ADVERTISER_LOGIN' then raise exception 'SINGLE_USE_FAILED: %',msg;end if;
 end;
 begin
  perform public.jb_ad_portal_login('JB-B','incorrect-password');
  raise exception 'WRONG_SECRET_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'INVALID_ADVERTISER_LOGIN' then raise exception 'PASSWORD_GUARD_FAILED: %',msg;end if;
 end;
 raise notice 'PASS [ADS-041] one-use secret, no replay, wrong secret rejected, valid bounded session issued';
end $one_time$;
reset role;

-- Owner reissues through its EXISTING credential secret_hash update: trigger
-- clears consumed_at for new secret but explicit session revocations stay intact.
update public.ad_portal_credentials
set secret_hash=extensions.crypt('test-secret-A-new',extensions.gen_salt('bf',10)),
    issued_at=now(),revoked_at=null
where login_id='JB-A';
do $reissue$
begin
 if (select consumed_at from public.ad_portal_credentials where login_id='JB-A') is not null
 then raise exception 'REISSUE_NOT_RESET_CONSUMED';end if;
 raise notice 'PASS [ADS-041] credential reissue resets only the consumed marker';
end $reissue$;
set local role anon;
do $relogin$
declare t text;msg text;
begin
 t:=public.jb_ad_portal_login('JB-A','test-secret-A-new');
 if length(t)<>48 then raise exception 'REISSUED_LOGIN_FAILED';end if;
 begin
  perform public.jb_ad_portal_login('JB-A','test-secret-A');
  raise exception 'OLD_CREDENTIAL_REPLAYED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'INVALID_ADVERTISER_LOGIN' then raise exception 'OLD_SECRET_FAILED: %',msg;end if;
 end;
 raise notice 'PASS [ADS-041] reissued credential consumed once; older password permanently invalid';
end $relogin$;
reset role;

rollback;
