\set ON_ERROR_STOP on
-- P4-T039 CP02: real disposable PostgreSQL17; no Owner/customer credentials.
begin;
do $acl$
begin
 if not has_function_privilege('anon','public.jb_ad_portal_logout(text)','execute')
 or not has_function_privilege('authenticated','public.jb_ad_portal_logout(text)','execute')
 then raise exception 'T039_LOGOUT_PUBLIC_BEARER_REVOKE_UNAVAILABLE';end if;
 if has_table_privilege('anon','public.ad_portal_sessions','SELECT')
 or has_table_privilege('anon','public.ad_portal_sessions','UPDATE')
 or has_table_privilege('anon','public.ad_history','INSERT')
 then raise exception 'T039_LOGOUT_DIRECT_SECRET_OR_HISTORY_ACCESS';end if;
end $acl$;
set local role anon;
do $isolation$
declare a text:=repeat('a',48);b text:=repeat('b',48);
 old_hist integer; ok boolean; msg text;
begin
 if (select count(*) from public.jb_ad_portal_campaign(a))<>1 or
    (select count(*) from public.jb_ad_portal_campaign(b))<>1
 then raise exception 'T039_PORTAL_FIXTURE_NEEDS_TWO_INDEPENDENT_ACTIVE_TENANTS';end if;
 if public.jb_ad_portal_logout(repeat('z',48))
 or public.jb_ad_portal_logout('invalid')
 or public.jb_ad_portal_logout(repeat('c',48))
 then raise exception 'T039_INVALID_OR_EXPIRED_SESSION_REPORTED_REVOKED';end if;
 select count(*) into old_hist from public.ad_history where event_type='portal_session_logout';
 ok:=public.jb_ad_portal_logout(a);
 if ok is distinct from true then raise exception 'T039_LOGOUT_DID_NOT_REVOKE_LIVE_TOKEN';end if;
 if (select count(*) from public.jb_ad_portal_campaign(a))<>0
 then raise exception 'T039_LOGOUT_OLD_TOKEN_STILL_READS_OWN_CAMPAIGN';end if;
 if (select count(*) from public.jb_ad_portal_campaign(b))<>1
 then raise exception 'T039_LOGOUT_REVOKED_UNRELATED_ADVERTISER_B';end if;
 if public.jb_ad_portal_logout(a)
 then raise exception 'T039_LOGOUT_REPLAY_REPORTED_SECOND_REVOCATION';end if;
 if (select count(*) from public.ad_history where event_type='portal_session_logout')<>old_hist+1
 then raise exception 'T039_LOGOUT_REPLAY_DUPLICATED_AUDIT';end if;
 begin
  perform public.jb_ad_portal_submit_creative(
     a,'text',null,'Please change the advertisement text after logout',null,null);
  raise exception 'T039_REVOKED_TOKEN_CREATED_CHANGE_REQUEST';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'ADVERTISER_SESSION_REQUIRED'
  then raise exception 'T039_LOGOUT_TEXT_REQUEST_DENIAL_WRONG %',msg;end if;
 end;
 begin
  perform public.jb_ad_portal_request_renewal(a,now()+interval '30 days');
  raise exception 'T039_REVOKED_TOKEN_CREATED_RENEWAL';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'ADVERTISER_SESSION_REQUIRED'
  then raise exception 'T039_LOGOUT_RENEWAL_DENIAL_WRONG %',msg;end if;
 end;
 raise notice 'T039 CP02 PASS own server session revoked immediately; second token B, original ad/creative, audit stable; replay fails';
end $isolation$;
reset role;
do $no_state_mutation$
begin
 if (select count(*) from public.ad_creatives)<>3
 or (select count(*) from public.ad_change_requests)<>0
 or (select count(*) from public.ad_renewal_requests)<>1
 or (select count(*) from public.ad_campaigns
     where status in ('live','paid'))<>2
 or (select count(*) from public.ad_history
     where event_type='portal_session_logout')<>1
 then raise exception 'T039_LOGOUT_MUTATED_CAMPAIGN_MEDIA_OR_REQUESTS';end if;
 if not exists(select 1 from public.ad_portal_sessions
 where campaign_id='aaaaaaaa-0000-0000-0000-000000000001' and revoked_at is not null)
 or not exists(select 1 from public.ad_portal_sessions
 where campaign_id='bbbbbbbb-0000-0000-0000-000000000002' and revoked_at is null)
 then raise exception 'T039_A_B_SESSION_REVOCATION_INTEGRITY_FAILED';end if;
 raise notice 'T039 CP02 PASS no news/media/approval/renewal mutation; A alone revoked, B untouched';
end $no_state_mutation$;
rollback;
