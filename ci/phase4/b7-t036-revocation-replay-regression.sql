\set ON_ERROR_STOP on
-- T036 CP02 real DISPOSABLE PostgreSQL17 negative & positive transitions.
-- E1/isolated E2, NOT real Auth E5, hosting, actual payment or LIVE ad.
begin;
do $acl$
begin
 if has_function_privilege('anon',
   'public.jb_ad_safety_transition_idempotent_internal(uuid,text,text)','execute')
 then raise exception 'ANON_SAFETY_WRITE_PERMISSION_LEAK';end if;
 if not has_function_privilege('authenticated',
   'public.jb_ad_safety_transition_idempotent_internal(uuid,text,text)','execute')
 then raise exception 'OWNER_RPC_NOT_ACCESSIBLE_TO_SIGNED_IN_CALLER';end if;
 if not has_function_privilege('anon',
   'public.jb_ad_visibility_alive_public(uuid,uuid)','execute')
 then raise exception 'PUBLIC_VISIBILITY_PROBE_NOT_ACCESSIBLE';end if;
 if (select prosecdef from pg_proc where
  oid='public.jb_ad_visibility_alive_public(uuid,uuid)'::regprocedure) is distinct from true
 then raise exception 'PROBE_RLS_BYPASS_POLICY_NOT_REVIEWED';end if;
end $acl$;
-- Need exact IDs from disposable fixture, no real advertiser identity used.
do $setup$
declare cid uuid:='30000000-0000-0000-0000-000000000001';
 vcreative uuid;
begin
 select id into vcreative from public.ad_creatives
  where campaign_id=cid and approved=true;
 if vcreative is null then raise exception 'CI_CREATIVE_MISSING';end if;
 perform set_config('b7.test_owner','enabled',true);
 -- Not yet paid, even if future/active schedule and creative approved.
 if public.jb_ad_visibility_alive_public(cid,vcreative)
 then raise exception 'UNPAID_VISIBLE';end if;
 if public.jb_ad_visibility_alive_public(cid,
   'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee')
 then raise exception 'FORGED_CREATIVE_VISIBLE';end if;
 if public.jb_ad_visibility_alive_public(
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',vcreative)
 then raise exception 'UNKNOWN_CAMPAIGN_VISIBLE';end if;
 -- Synthetic fake paid record may ONLY exist in this rollback transaction.
 insert into public.ad_payments(campaign_id,status,provider_ref,amount_minor)
 values(cid,'confirmed','CI-NO-REAL-UTR',50000);
 update public.ad_campaigns set status='live',
 paid_at=now(),non_refund_accepted_at=now(),
 starts_at=now()-interval '1 minute',ends_at=now()+interval '1 hour'
 where id=cid;
 if not public.jb_ad_visibility_alive_public(cid,vcreative)
 then raise exception 'SYNTHETIC_VALID_UNREVOKED_AD_MISSING';end if;
 -- Time source on server independently denies future or expired banners.
 update public.ad_campaigns set starts_at=now()+interval '10 minutes'
 where id=cid;
 if public.jb_ad_visibility_alive_public(cid,vcreative)
 then raise exception 'FUTURE_AD_VISIBLE';end if;
 update public.ad_campaigns set starts_at=now()-interval '2 hours',
  ends_at=now()-interval '1 minute' where id=cid;
 if public.jb_ad_visibility_alive_public(cid,vcreative)
 then raise exception 'EXPIRED_AD_VISIBLE';end if;
 update public.ad_campaigns set ends_at=now()+interval '1 hour',
 status='paused' where id=cid;
 if public.jb_ad_visibility_alive_public(cid,vcreative)
 then raise exception 'PAUSED_AD_VISIBLE';end if;
 update public.ad_campaigns set status='live' where id=cid;
 if not public.jb_ad_visibility_alive_public(cid,vcreative)
 then raise exception 'RESUMED_AD_VISIBLE';end if;
 -- A different creative unapproved is NOT the existing pinned card.
 update public.ad_creatives set approved=false where id=vcreative;
 if public.jb_ad_visibility_alive_public(cid,vcreative)
 then raise exception 'REVOKED_APPROVAL_NOT_REFLECTED';end if;
 update public.ad_creatives set approved=true where id=vcreative;
 raise notice 'CP02 PASS: public probe exact campaign+creative, paid, future/expired, pause, creative revoked';
end $setup$;

-- Replay of identical safety state MUST be a true no-op for both history
-- and audit; actual single transition is handled by ORIGINAL Owner function.
do $replay$
declare cid uuid:='30000000-0000-0000-0000-000000000001';
 before_history integer;before_audit integer; id uuid;
begin
 select count(*) into before_history from public.ad_history where campaign_id=cid;
 select count(*) into before_audit from public.audit_logs
 where record_id=cid::text and action='ad_status';
 select (public.jb_ad_safety_transition_idempotent_internal(cid,'hidden','CI hide')).id into id;
 if id is distinct from cid then raise exception 'HIDE_WRONG_CAMPAIGN';end if;
 if (select count(*) from public.ad_history where campaign_id=cid)<>before_history+1
 then raise exception 'HIDE_DID_NOT_APPEND_EXACTLY_ONE_HISTORY';end if;
 if (select count(*) from public.audit_logs where record_id=cid::text and action='ad_status')<>before_audit+1
 then raise exception 'HIDE_DID_NOT_APPEND_EXACTLY_ONE_AUDIT';end if;
 select (public.jb_ad_safety_transition_idempotent_internal(cid,'hidden','CI replay')).id into id;
 if (select count(*) from public.ad_history where campaign_id=cid)<>before_history+1
 or (select count(*) from public.audit_logs where record_id=cid::text and action='ad_status')<>before_audit+1
 then raise exception 'SAME_HIDDEN_STATUS_DUPLICATED_AUDIT';end if;
 if (select hidden_at from public.ad_campaigns where id=cid) is null
 then raise exception 'HIDE_DID_NOT_SET_REVOCATION_TIMESTAMP';end if;
 if public.jb_ad_visibility_alive_public(cid,(
   select id from public.ad_creatives where campaign_id=cid limit 1
 )) then raise exception 'HIDDEN_AD_STILL_ELIGIBLE';end if;
 raise notice 'CP02 PASS: Owner single HIDE, second exact replay no new history/audit, public probe revoked';
end $replay$;

do $negative$
declare cid uuid:='30000000-0000-0000-0000-000000000001';
 before_history integer;msg text;
begin
 select count(*) into before_history from public.ad_history;
 perform set_config('b7.test_owner','disabled',true);
 begin
  perform public.jb_ad_safety_transition_idempotent_internal(cid,'paused','forged');
  raise exception 'NON_OWNER_SAFETY_SUCCEEDED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg <> 'OWNER_AAL2_REQUIRED' then raise exception 'NON_OWNER_NOT_DENIED: %',msg;end if;
 end;
 perform set_config('b7.test_owner','enabled',true);
 begin
  perform public.jb_ad_safety_transition_idempotent_internal(cid,'live','unsafe');
  raise exception 'SAFETY_RPC_WAS_POSITIVE_LIVE_BYPASS';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg <> 'T036_CP02_SAFETY_ONLY' then raise exception 'POSITIVE_NOT_DENIED: %',msg;end if;
 end;
 if (select count(*) from public.ad_history)<>before_history
 then raise exception 'NEGATIVE_ATTEMPTS_MUTATED_HISTORY';end if;
 raise notice 'CP02 PASS: non-owner and LIVE promotion denied, no side effects';
end $negative$;
rollback;
