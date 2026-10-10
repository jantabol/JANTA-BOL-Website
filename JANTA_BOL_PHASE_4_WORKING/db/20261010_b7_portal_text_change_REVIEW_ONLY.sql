-- JANTA BOL / B7 / P4-T039 / ADS-041..046 - REVIEW-ONLY MIGRATION.
-- Never run against LIVE project until full schema/role/parity approval.
-- Preserve canonical campaigns/creatives and historical portal credentials.
-- At launch advertisers can ONLY request text changes. No direct media/geo edit.
begin;

create table if not exists public.ad_change_requests(
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references public.ad_campaigns(id) on delete restrict,
 request_text text not null check (length(btrim(request_text)) between 10 and 1000),
 status text not null default 'pending'
   check (status in ('pending','accepted_for_work','rejected')),
 created_at timestamptz not null default now(),
 decided_at timestamptz,
 decided_by uuid,
 decision_note text
);
create index if not exists ad_change_requests_campaign_created_idx
 on public.ad_change_requests(campaign_id,created_at desc);
alter table public.ad_change_requests enable row level security;
-- No advertiser or public direct SELECT/INSERT/UPDATE/DELETE privileges;
-- only the exact guarded portal RPC and Owner RPC use SECURITY DEFINER.
revoke all on public.ad_change_requests from public,anon,authenticated;

-- Compatible legacy function signature intentionally retained for old clients.
-- It now creates a text-only REQUEST record, NEVER a creative/media version.
create or replace function public.jb_ad_portal_submit_creative(
 p_token text,p_type text,p_media text,p_text text,
 p_cta_type text,p_cta_target text
) returns uuid
language plpgsql security definer
set search_path to 'pg_catalog','public','extensions'
as $portal$
declare v_cid uuid; v_id uuid; v_note text;
begin
 if p_token is null or p_token !~ '^[0-9a-f]{48}$'
 then raise exception 'ADVERTISER_SESSION_REQUIRED';end if;
 v_note:=btrim(coalesce(p_text,''));
 if p_type is distinct from 'text'
    or btrim(coalesce(p_media,'')) <> ''
    or btrim(coalesce(p_cta_type,'')) <> ''
    or btrim(coalesce(p_cta_target,'')) <> ''
    or length(v_note)<10 or length(v_note)>1000
 then raise exception 'TEXT_CHANGE_REQUEST_ONLY';end if;

 select s.campaign_id into v_cid
 from public.ad_portal_sessions s
 join public.ad_campaigns c on c.id=s.campaign_id
 join public.ad_portal_credentials k on k.campaign_id=s.campaign_id
 where s.token_hash=encode(extensions.digest(p_token,'sha256'),'hex')
   and s.revoked_at is null and s.expires_at>now()
   and k.revoked_at is null
   and c.status in ('approved','payment_pending','paid','live','paused','hidden','expired')
 limit 1;
 if v_cid is null then raise exception 'ADVERTISER_SESSION_REQUIRED';end if;

 -- 2-minute per-campaign limit is enforced after an advisory transaction lock
 -- so two simultaneous replay requests cannot both pass.
 perform pg_catalog.pg_advisory_xact_lock(
   pg_catalog.hashtextextended('b7_change:'||v_cid::text,0));
 if exists (select 1 from public.ad_change_requests
   where campaign_id=v_cid and status='pending'
     and created_at>now()-interval '2 minutes')
 then raise exception 'CHANGE_REQUEST_COOLDOWN';end if;

 insert into public.ad_change_requests(campaign_id,request_text)
 values(v_cid,v_note) returning id into v_id;
 insert into public.ad_history(campaign_id,event_type,note)
 values(v_cid,'creative_change_requested',
        'Advertiser text-only change request '||v_id::text||' queued for Owner; no creative mutated.');
 return v_id;
end $portal$;

revoke all on function public.jb_ad_portal_submit_creative(
 text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.jb_ad_portal_submit_creative(
 text,text,text,text,text,text) to anon,authenticated,service_role;

-- Project only ACTIVE APPROVED creative, not an unapproved upload or
-- pending change request, without altering the old portal return contract.
create or replace function public.jb_ad_portal_campaign(p_token text)
returns table(
 campaign_id uuid,status text,placement text,scope text,
 starts_at timestamptz,ends_at timestamptz,creative jsonb
)
language sql stable security definer
set search_path to 'pg_catalog'
as $own$
 select c.id,c.status,c.placement,c.scope,c.starts_at,c.ends_at,
   (select to_jsonb(x) from (
     select cr.id,cr.creative_type,cr.media_url,cr.text_body,
            cr.cta_type,cr.cta_target,cr.label,cr.version,cr.approved
     from public.ad_creatives cr
     where cr.campaign_id=c.id and cr.approved=true
     order by cr.version desc,cr.created_at desc,cr.id desc limit 1
   ) x) as creative
 from public.ad_portal_sessions s
 join public.ad_campaigns c on c.id=s.campaign_id
 join public.ad_portal_credentials k on k.campaign_id=s.campaign_id
 where p_token ~ '^[0-9a-f]{48}$'
   and s.token_hash=encode(extensions.digest(p_token,'sha256'),'hex')
   and s.revoked_at is null and s.expires_at>now()
   and k.revoked_at is null
 limit 1
$own$;
revoke all on function public.jb_ad_portal_campaign(text) from public,anon,authenticated;
grant execute on function public.jb_ad_portal_campaign(text)
 to anon,authenticated,service_role;

-- Owner queue shares existing audit/history; the pending request table is
-- not a second creative/media source-of-truth.
create or replace function public.jb_ad_owner_change_requests_internal()
returns jsonb language plpgsql stable security definer
set search_path to 'pg_catalog','public','private'
as $owner_queue$
declare v jsonb;
begin
 if not private.p4_owner_allowed() then raise exception 'OWNER_AAL2_REQUIRED';end if;
 select coalesce(jsonb_agg(
   jsonb_build_object('id',r.id,'campaign_id',r.campaign_id,
    'status',r.status,'note',r.request_text,'created_at',r.created_at,
    'decided_at',r.decided_at,'decision_note',r.decision_note)
   order by r.created_at desc,r.id desc),'[]'::jsonb)
 into v from public.ad_change_requests r;
 return v;
end $owner_queue$;
revoke all on function public.jb_ad_owner_change_requests_internal()
 from public,anon,authenticated;
grant execute on function public.jb_ad_owner_change_requests_internal()
 to authenticated,service_role;

-- Owner acceptance = permission to prepare a NEW moderated asset; never
-- silently flip approved creatives. Actual media selection stays Owner-only.
create or replace function public.jb_ad_decide_change_request_internal(
 p_request uuid,p_decision text,p_note text
) returns void language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $owner_decision$
declare v public.ad_change_requests;v_note text;
begin
 if not private.p4_owner_allowed() then raise exception 'OWNER_AAL2_REQUIRED';end if;
 v_note:=btrim(coalesce(p_note,''));
 if p_decision is null or p_decision not in ('accepted_for_work','rejected')
    or length(v_note)<8 or length(v_note)>1000
 then raise exception 'INVALID_CHANGE_DECISION';end if;
 select * into v from public.ad_change_requests
 where id=p_request for update;
 if not found then raise exception 'CHANGE_REQUEST_NOT_FOUND';end if;
 if v.status<>'pending' then raise exception 'CHANGE_REQUEST_ALREADY_REVIEWED';end if;
 update public.ad_change_requests
 set status=p_decision,decided_at=now(),decided_by=auth.uid(),decision_note=v_note
 where id=p_request;
 insert into public.ad_history(campaign_id,event_type,note,actor_user_id)
 values(v.campaign_id,'creative_change_'||p_decision,
        'Request '||v.id::text||' reviewed. Existing approved creative unchanged. '||v_note,
        auth.uid());
 insert into public.audit_logs(actor_user_id,action,record_type,record_id,metadata,created_at)
 values(auth.uid(),'ad_change_decision','ad_change_request',p_request::text,
        jsonb_build_object('campaign_id',v.campaign_id,'decision',p_decision,
                           'approved_creative_unchanged',true),now());
end $owner_decision$;
revoke all on function public.jb_ad_decide_change_request_internal(uuid,text,text)
 from public,anon,authenticated;
grant execute on function public.jb_ad_decide_change_request_internal(uuid,text,text)
 to authenticated,service_role;


-- ADS-041: Existing Owner issuance keeps the same authority; add one-use
-- behavior to the issued TEMPORARY secret, without invalidating the valid
-- short-lived token created by the first successful login.
alter table public.ad_portal_credentials
 add column if not exists consumed_at timestamptz;

create or replace function private.b7_portal_reissue_reset()
returns trigger language plpgsql security definer
set search_path to 'pg_catalog','public'
as $reset$
begin
 if new.secret_hash is distinct from old.secret_hash then
   new.consumed_at:=null;
 end if;
 return new;
end $reset$;
drop trigger if exists b7_portal_reissue_resets_consumption on public.ad_portal_credentials;
create trigger b7_portal_reissue_resets_consumption
before update of secret_hash on public.ad_portal_credentials
for each row execute function private.b7_portal_reissue_reset();
revoke all on function private.b7_portal_reissue_reset() from public,anon,authenticated;

create or replace function public.jb_ad_portal_login(p_login text,p_secret text)
returns text language plpgsql security definer
set search_path to 'pg_catalog','public','extensions'
as $login$
declare v public.ad_portal_credentials;t text;
begin
 if length(btrim(coalesce(p_login,'')))<3
    or length(btrim(coalesce(p_login,'')))>100
    or length(coalesce(p_secret,''))<8 then
   raise exception 'INVALID_ADVERTISER_LOGIN';end if;

 select * into v
 from public.ad_portal_credentials
 where login_id=upper(btrim(p_login))
   and revoked_at is null and consumed_at is null
 for update;
 if not found or v.secret_hash is null or
    v.secret_hash is distinct from extensions.crypt(p_secret,v.secret_hash)
 then raise exception 'INVALID_ADVERTISER_LOGIN';end if;

 if not exists(select 1 from public.ad_campaigns c
  where c.id=v.campaign_id
    and c.status in ('approved','payment_pending','paid','live','paused','hidden','expired'))
 then raise exception 'ADVERTISER_SESSION_REQUIRED';end if;

 update public.ad_portal_credentials
 set consumed_at=now() where campaign_id=v.campaign_id;
 t:=encode(extensions.gen_random_bytes(24),'hex');
 insert into public.ad_portal_sessions(campaign_id,token_hash,expires_at)
 values(v.campaign_id,encode(extensions.digest(t,'sha256'),'hex'),now()+interval '12 hours');
 insert into public.ad_history(campaign_id,event_type,note)
 values(v.campaign_id,'portal_first_login',
        'One-time credential consumed; server issued short-lived opaque session.');
 return t;
end $login$;
revoke all on function public.jb_ad_portal_login(text,text) from public,anon,authenticated;
grant execute on function public.jb_ad_portal_login(text,text) to anon,authenticated,service_role;


commit;
