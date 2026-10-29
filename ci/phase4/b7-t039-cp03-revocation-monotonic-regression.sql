\set ON_ERROR_STOP on
-- P4-T039 CP03: synthetic REAL PostgreSQL17 Owner verification/reissue edge.
-- On Owner downgrade, old sessions revoked. Re-verification and a fresh
-- temporary password MUST NOT reactivate those revoked bearer tokens.
-- No real account, token, AAL2 or LIVE data. Entire test ROLLBACK.
begin;
do $monotonic$
declare a uuid:='a0000000-0000-0000-0000-000000000001';
 c uuid:='a1000000-0000-0000-0000-000000000001';
 b uuid:='b1000000-0000-0000-0000-000000000001';
 msg text;
begin
 perform set_config('b7.test_owner','enabled',true);
 if (select count(*) from public.ad_portal_sessions where campaign_id=c and revoked_at is null)<>1
 then raise exception 'CP03_EXPECTED_A_ACTIVE_SESSION_MISSING';end if;
 if (select count(*) from public.ad_portal_sessions where campaign_id=b and revoked_at is null)<>1
 then raise exception 'CP03_EXPECTED_B_ACTIVE_SESSION_MISSING';end if;
 perform public.jb_ad_verify_advertiser_internal(
  a,'pending','Owner verified identity evidence withdrawn',null);
 if (select count(*) from public.ad_portal_sessions where campaign_id=c and revoked_at is not null)<>1
 then raise exception 'CP03_OWNER_DOWNGRADE_DID_NOT_REVOKE_A';end if;
 perform public.jb_ad_verify_advertiser_internal(
  a,'verified','Owner reviewed fresh customer identity evidence',null);
 update public.ad_portal_credentials
 set secret_hash='SYNTHETIC-NEW-UNRELATED-HASH',
     revoked_at=null,issued_at=clock_timestamp()
 where campaign_id=c;
 if (select revoked_at from public.ad_portal_credentials where campaign_id=c) is not null
 then raise exception 'CP03_VERIFIED_OWNER_FRESH_REISSUE_NOT_ALLOWED';end if;
 -- FIRST DIVERGENCE: AFTER a valid NEW secret, an old revoked session must
 -- remain permanently revoked even if any privileged UPDATE tries to clear it.
 begin
  update public.ad_portal_sessions
  set revoked_at=null where campaign_id=c;
  raise exception 'CP03_OLD_TOKEN_REACTIVATED_AFTER_REVERIFY';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_PORTAL_SESSION_REVOKED_FOREVER'
  then raise exception 'CP03_REVOCATION_MONOTONICITY_FAILED: %',msg;end if;
 end;
 if (select count(*) from public.ad_portal_sessions
    where campaign_id=c and revoked_at is not null)<>1
 then raise exception 'CP03_FAILED_RESURRECTION_CHANGED_OLD_TOKEN';end if;
 if (select count(*) from public.ad_portal_sessions
    where campaign_id=b and revoked_at is null)<>1
 then raise exception 'CP03_OTHER_TENANT_SESSION_HARMED';end if;
 -- Fresh issued session is allowed only with a NEW hash and verified account;
 -- never update the old token to create it.
 insert into public.ad_portal_sessions(campaign_id,token_hash,expires_at)
 values(c,'SYNTHETIC-NEW-DISTINCT-TOKEN-HASH',now()+interval '30 minutes');
 if (select count(*) from public.ad_portal_sessions
    where campaign_id=c and revoked_at is null)<>1
 then raise exception 'CP03_NEW_SESSION_FRESH_TOKEN_NOT_ISSUED';end if;
 if (select count(*) from public.ad_campaigns
    where advertiser_id=a and status='live')<>0
 then raise exception 'CP03_REVERIFY_AUTO_LIVE_AD_ACTIVATION';end if;
 raise notice 'T039 CP03 PASS: downgraded/reverified A old revoked bearer is permanently dead, new token allowed, B untouched, no LIVE resurrection';
end $monotonic$;
rollback;
