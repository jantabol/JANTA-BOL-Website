-- JANTA BOL B7 / BE10 — ADVERTISER VERIFICATION & PORTAL REVOKE
-- REVIEW ONLY. Never run in production without Owner decision, schema parity,
-- B5/Phase3 regression and production rollback plan.
-- Existing Owner verification RPC, advertiser, campaign, history and audit stay
-- authoritative; this is an additive fail-closed DB defense.
begin;
do $v_guard$
declare v_source text;
begin
 if to_regclass('public.advertisers') is null or
    to_regclass('public.ad_campaigns') is null or
    to_regclass('public.ad_portal_credentials') is null or
    to_regclass('public.ad_portal_sessions') is null or
    to_regclass('public.ad_history') is null or
    to_regclass('public.audit_logs') is null or
    to_regprocedure('private.p4_owner_allowed()') is null or
    to_regprocedure('public.jb_ad_verify_advertiser_internal(uuid,text,text,text)') is null
 then raise exception 'BE10_EXISTING_AUTHORITY_OR_PORTAL_TABLE_MISSING';end if;
 if not exists(select 1 from information_schema.columns
  where table_schema='public' and table_name='ad_campaigns'
    and column_name='hidden_at')
    or not exists(select 1 from information_schema.columns
  where table_schema='public' and table_name='ad_campaigns'
    and column_name='updated_at')
 then raise exception 'BE10_EXISTING_CAMPAIGN_SCHEMA_DRIFT';end if;
 select prosrc into v_source from pg_proc where
  oid='public.jb_ad_verify_advertiser_internal(uuid,text,text,text)'::regprocedure;
 if v_source not ilike '%private.p4_owner_allowed%'
    or v_source not ilike '%enhanced_verification_evidence_required%'
    or v_source not ilike '%update public.advertisers%'
    or v_source not ilike '%insert into public.audit_logs%'
 then raise exception 'BE10_OWNER_VERIFICATION_SOURCE_DRIFT';end if;
end $v_guard$;

-- Force credential issuance and new session entry to verify latest advertiser
-- state on server, even if an older Owner portal-issuance RPC omitted this.
create or replace function private.b7_portal_credential_verification_guard()
returns trigger language plpgsql security definer
set search_path to 'pg_catalog','public'
as $cred$
begin
 -- A later Owner re-verification must NOT make an old password valid again.
 -- The preexisting Owner issue RPC intentionally rotates secret_hash on
 -- ON CONFLICT reissue; require a NEW secret for revoked credential release.
 if tg_op='UPDATE' and old.revoked_at is not null
    and new.revoked_at is null
    and new.secret_hash is not distinct from old.secret_hash
 then raise exception 'B7_PORTAL_REISSUE_FRESH_SECRET_REQUIRED';end if;
 if new.revoked_at is null and not exists(
  select 1 from public.ad_campaigns c
  join public.advertisers a on a.id=c.advertiser_id
  where c.id=new.campaign_id and a.verification_state='verified'
 ) then raise exception 'B7_PORTAL_VERIFIED_ADVERTISER_REQUIRED';end if;
 return new;
end $cred$;
drop trigger if exists b7_portal_credential_verification_guard on public.ad_portal_credentials;
create trigger b7_portal_credential_verification_guard
before insert or update on public.ad_portal_credentials
for each row execute function private.b7_portal_credential_verification_guard();
revoke all on function private.b7_portal_credential_verification_guard()
 from public,anon,authenticated;

create or replace function private.b7_portal_session_verification_guard()
returns trigger language plpgsql security definer
set search_path to 'pg_catalog','public'
as $session$
begin
 -- T039 ADS041/042: session revocation is irrevocable for the SAME token.
 -- An Owner re-verification/fresh login secret may create a NEW session,
 -- but UPDATE must never resurrect a previously revoked 12-hour bearer.
 if tg_op='UPDATE' then
  if old.revoked_at is not null and new.revoked_at is null then
   raise exception 'B7_PORTAL_SESSION_REVOKED_FOREVER'
     using errcode='42501';
  end if;
 end if;
 if new.revoked_at is null and not exists(
  select 1 from public.ad_campaigns c
  join public.advertisers a on a.id=c.advertiser_id
  join public.ad_portal_credentials k on k.campaign_id=c.id
  where c.id=new.campaign_id and a.verification_state='verified'
    and k.revoked_at is null
 ) then raise exception 'B7_PORTAL_VERIFIED_CREDENTIAL_REQUIRED';end if;
 return new;
end $session$;
drop trigger if exists b7_portal_session_verification_guard on public.ad_portal_sessions;
create trigger b7_portal_session_verification_guard
before insert or update on public.ad_portal_sessions
for each row execute function private.b7_portal_session_verification_guard();
revoke all on function private.b7_portal_session_verification_guard()
 from public,anon,authenticated;

-- Downgrade must instantly invalidate previously active login and API token,
-- and hide any already-running/paused ad without rewriting payment, contract,
-- Creative version or canonical Article. No automatic reactivation on upgrade.
create or replace function private.b7_verified_advertiser_downgrade_guard()
returns trigger language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $downgrade$
declare v_now timestamptz:=clock_timestamp();
        v_cred int:=0;v_sessions int:=0;v_hidden int:=0;
begin
 if new.verification_state is not distinct from old.verification_state then
  return null;end if;
 -- A direct table UPDATE may never bypass the original Owner/AAL2 RPC,
 -- including the pending->verified direction.
 if not private.p4_owner_allowed()
 then raise exception 'OWNER_AAL2_REQUIRED';end if;
 if old.verification_state<>'verified' or
    new.verification_state='verified'
 then return null;end if;
 update public.ad_portal_credentials k
  set revoked_at=v_now
  from public.ad_campaigns c
  where k.campaign_id=c.id and c.advertiser_id=new.id
    and k.revoked_at is null;
 get diagnostics v_cred=row_count;
 update public.ad_portal_sessions s
  set revoked_at=v_now
  from public.ad_campaigns c
  where s.campaign_id=c.id and c.advertiser_id=new.id
    and s.revoked_at is null;
 get diagnostics v_sessions=row_count;
 update public.ad_campaigns c
  set status='hidden',hidden_at=v_now,updated_at=v_now
  where c.advertiser_id=new.id and c.status in('live','paused');
 get diagnostics v_hidden=row_count;
 insert into public.ad_history(campaign_id,event_type,note,actor_user_id)
  select c.id,'advertiser_verification_revoked',
   'Portal access revoked; active advertisement safety-hide requested; latest status='
       ||new.verification_state,auth.uid()
  from public.ad_campaigns c where c.advertiser_id=new.id;
 insert into public.audit_logs(
  actor_user_id,action,record_type,record_id,metadata,created_at
 ) values(
  auth.uid(),'ad_verification_downgrade','advertiser',new.id::text,
  jsonb_build_object('old','verified','new',new.verification_state,
   'portal_credentials_revoked',v_cred,'portal_sessions_revoked',v_sessions,
   'campaigns_safety_hidden',v_hidden),v_now
 );
 return null;
end $downgrade$;
drop trigger if exists b7_verified_advertiser_downgrade_guard on public.advertisers;
create trigger b7_verified_advertiser_downgrade_guard
after update of verification_state on public.advertisers
for each row execute function private.b7_verified_advertiser_downgrade_guard();
revoke all on function private.b7_verified_advertiser_downgrade_guard()
 from public,anon,authenticated;

-- No public RPC, no credential read grants, no new parallel verification home.
commit;
