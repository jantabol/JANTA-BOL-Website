\set ON_ERROR_STOP on
-- BE10 authoritative Owner function and 3 additive private triggers.
-- Test data is synthetic and transaction ROLLBACK only. NEVER production.
begin;
do $preflight$
begin
 if to_regprocedure('public.jb_ad_verify_advertiser_internal(uuid,text,text,text)') is null
 then raise exception 'BE10_EXISTING_VERIFICATION_OWNER_RPC_LOST';end if;
 if (select count(*) from pg_trigger where not tgisinternal and tgname in
 ('b7_portal_credential_verification_guard',
  'b7_portal_session_verification_guard',
  'b7_verified_advertiser_downgrade_guard'))<>3
 then raise exception 'BE10_REQUIRED_THREE_TRIGGERS_MISSING';end if;
 if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='jb_ad_verification_override')
 then raise exception 'BE10_NEW_PARALLEL_AUTHORITY_NOT_ALLOWED';end if;
end $preflight$;

-- Pending high-risk cannot receive a portal secret, session or Owner-approval
-- without actual independent reference. No other tenant state changes.
do $high_risk$
declare msg text;
begin
 begin
  insert into public.ad_portal_credentials(campaign_id,login_id,secret_hash)
  values('c1000000-0000-0000-0000-000000000001','FORGED-C','FORGED-HASH');
  raise exception 'HIGH_RISK_PORTAL_ISSUED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_PORTAL_VERIFIED_ADVERTISER_REQUIRED'
  then raise exception 'HIGH_RISK_ISSUE_GUARD_WRONG: %',msg;end if;
 end;
 begin
  insert into public.ad_portal_sessions(campaign_id,token_hash,expires_at)
  values('c1000000-0000-0000-0000-000000000001',
   'fake-high-risk-session',now()+interval '1 day');
  raise exception 'HIGH_RISK_SESSION_ISSUED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_PORTAL_VERIFIED_CREDENTIAL_REQUIRED'
  then raise exception 'HIGH_RISK_SESSION_GUARD_WRONG: %',msg;end if;
 end;
 begin
  perform public.jb_ad_verify_advertiser_internal(
  'c0000000-0000-0000-0000-000000000003','verified','Attempt without evidence',null);
  raise exception 'OWNERLESS_VERIFICATION_SUCCEEDED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'OWNER_AAL2_REQUIRED'
  then raise exception 'OWNER_REQUIRED_WRONG: %',msg;end if;
 end;
end $high_risk$;
select set_config('b7.test_owner','enabled',false);

do $verified_only$
declare msg text;
begin
 begin
  perform public.jb_ad_verify_advertiser_internal(
    'c0000000-0000-0000-0000-000000000003','verified',
    'Enhanced identity evidence reviewed',null);
  raise exception 'HIGH_RISK_NO_EVIDENCE_ACCEPTED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'ENHANCED_VERIFICATION_EVIDENCE_REQUIRED'
  then raise exception 'EVIDENCE_PROOF_WRONG: %',msg;end if;
 end;
 perform public.jb_ad_verify_advertiser_internal(
  'c0000000-0000-0000-0000-000000000003','verified',
  'Enhanced identity independently reviewed','SYNTHETIC-EVIDENCE-REF-123');
 if (select verification_state from public.advertisers
     where id='c0000000-0000-0000-0000-000000000003')<>'verified'
 then raise exception 'OWNER_VERIFICATION_NOT_SAVED';end if;
 insert into public.ad_portal_credentials(campaign_id,login_id,secret_hash)
 values('c1000000-0000-0000-0000-000000000001','JB-C','synthetic-C');
 insert into public.ad_portal_sessions(campaign_id,token_hash,expires_at)
 values('c1000000-0000-0000-0000-000000000001','fake-C-token',
        now()+interval '2 hours');
end $verified_only$;

-- Unauthorized direct downgrade must fail and preserve even the existing
-- sessions. Only verified Owner can revoke, with atomic all-tenant cleanup.
do $unauth_revocation$
declare msg text;
begin
 perform set_config('b7.test_owner','',true);
 begin
  update public.advertisers set verification_state='pending'
  where id='a0000000-0000-0000-0000-000000000001';
  raise exception 'OWNERLESS_DOWNGRADE_SUCCEEDED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'OWNER_AAL2_REQUIRED'
  then raise exception 'DOWNGRADE_OWNER_GUARD_WRONG: %',msg;end if;
 end;
 if (select count(*) from public.ad_portal_sessions
  where revoked_at is null)<>4
 then raise exception 'DENIED_DOWNGRADE_REVOKED_VALID_SESSIONS';end if;
end $unauth_revocation$;
select set_config('b7.test_owner','enabled',false);

do $downgrade$
declare v_before int;v_audit int;v_b int;msg text;
begin
 select count(*) into v_before from public.audit_logs
  where action='ad_verification_downgrade' and record_id='a0000000-0000-0000-0000-000000000001';
 perform public.jb_ad_verify_advertiser_internal(
  'a0000000-0000-0000-0000-000000000001','pending',
  'Independent evidence expired pending recheck',null);
 if exists(select 1 from public.ad_portal_credentials k
 join public.ad_campaigns c on c.id=k.campaign_id
 where c.advertiser_id='a0000000-0000-0000-0000-000000000001' and k.revoked_at is null)
 then raise exception 'OLD_OWNER_CREDENTIAL_ACTIVE';end if;
 if exists(select 1 from public.ad_portal_sessions s
 join public.ad_campaigns c on c.id=s.campaign_id
 where c.advertiser_id='a0000000-0000-0000-0000-000000000001' and s.revoked_at is null)
 then raise exception 'OLD_PORTAL_SESSION_ACTIVE';end if;
 if (select count(*) from public.ad_campaigns
    where advertiser_id='a0000000-0000-0000-0000-000000000001'
      and status='hidden' and hidden_at is not null)<>2
 then raise exception 'ACTIVE_AD_SAFETY_HIDE_MISSING';end if;
 if (select count(*) from public.ad_portal_sessions
   where campaign_id='b1000000-0000-0000-0000-000000000001' and revoked_at is null)<>1
 then raise exception 'OTHER_TENANT_CREDENTIAL_CHANGED';end if;
 if (select count(*) from public.audit_logs
    where action='ad_verification_downgrade'
     and record_id='a0000000-0000-0000-0000-000000000001')<>v_before+1
 then raise exception 'DOWNGRADE_AUDIT_MISSING_OR_DUPLICATED';end if;
 -- NO activation of old secrets when verified again. Login requires reissue.
 perform public.jb_ad_verify_advertiser_internal(
  'a0000000-0000-0000-0000-000000000001','verified',
  'New evidence checked for restored verification',null);
 if (select count(*) from public.ad_portal_credentials k
 join public.ad_campaigns c on c.id=k.campaign_id
 where c.advertiser_id='a0000000-0000-0000-0000-000000000001'
  and k.revoked_at is null)<>0
 then raise exception 'REVERIFY_RESURRECTED_OLD_SECRET';end if;
 if (select count(*) from public.ad_campaigns
  where advertiser_id='a0000000-0000-0000-0000-000000000001'
    and status='live')<>0
 then raise exception 'REVERIFY_RESTARTED_OLD_AD';end if;
 begin
  insert into public.ad_portal_sessions(campaign_id,token_hash,expires_at)
  values('a1000000-0000-0000-0000-000000000001',
   'old-session-reuse',now()+interval '1 day');
  raise exception 'REVERIFY_SESSION_WITH_OLD_SECRET';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_PORTAL_VERIFIED_CREDENTIAL_REQUIRED'
  then raise exception 'REVERIFY_PROOF_WRONG: %',msg;end if;
 end;
 raise notice 'PASS BE10: Owner verified evidence; downgrade invalidated sessions, safety-hidden ads, no other tenant changes, no reactivation';
end $downgrade$;

rollback;
