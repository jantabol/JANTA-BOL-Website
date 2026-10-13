-- JANTA BOL / B7 / P4-T040 / ADS-049,050
-- REVIEW ONLY: never apply to LIVE before official geography + paired
-- public selection/renderer + AAL2 staging parity + abuse/rate-control proof.
-- This is client-reported viewability, NOT a verified human impression.
-- Qualified count is intentionally separate from News 1-second preview.
-- Reuses canonical public.ad_events as the only advertisement-event ledger.
begin;

alter table public.ad_events
 add column if not exists view_ticket_hash text,
 add column if not exists qualified boolean not null default false,
 add column if not exists qualification_source text;
create unique index if not exists b7_ad_event_one_ticket
 on public.ad_events(view_ticket_hash)
 where view_ticket_hash is not null;
alter table public.ad_events enable row level security;
revoke all on public.ad_events from public,anon,authenticated;

-- Anonymous untrusted legacy methods cannot add fake impressions/clicks.
-- Keep the original RPC signatures for privileged compatibility;
-- do NOT drop existing receipts, histories, or their audit trail.
revoke all on function public.jb_ad_event(uuid,text)
 from public,anon,authenticated;
revoke all on function public.jb_ad_record_event(uuid,text)
 from public,anon,authenticated;

create table if not exists public.ad_view_tickets(
 token_hash text primary key check(token_hash ~ '^[0-9a-f]{64}$'),
 campaign_id uuid not null references public.ad_campaigns(id) on delete restrict,
 creative_id uuid not null references public.ad_creatives(id) on delete restrict,
 article_id uuid not null references public.articles(id) on delete restrict,
 nonce_hash text not null check(nonce_hash ~ '^[0-9a-f]{64}$'),
 issued_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null,
 impression_at timestamptz,
 constraint b7_view_ticket_finite check(
   isfinite(issued_at) and isfinite(expires_at)
   and expires_at>issued_at and expires_at<=issued_at+interval '5 minutes'),
 unique(article_id,nonce_hash)
);
create index if not exists b7_view_tickets_expiry
 on public.ad_view_tickets(expires_at);
alter table public.ad_view_tickets enable row level security;
revoke all on public.ad_view_tickets from public,anon,authenticated;

-- Internal ticket creation: exact eligible campaign/creative pair from ONE
-- existing private geo+payment+approved-creative authority. No viewer GPS,
-- identity, browser fingerprint, IP, or asserted district is stored.
create or replace function public.jb_ad_issue_view_ticket(
 p_article uuid,p_campaign uuid,p_creative uuid,p_open_nonce text
) returns text language plpgsql security definer
set search_path to 'pg_catalog','public','private','extensions'
as $issue$
declare v_token text;v_hash text;v_nonce_hash text;v_now timestamptz;
begin
 if p_article is null or p_campaign is null or p_creative is null
   or p_open_nonce is null or p_open_nonce !~ '^[0-9a-f]{32}$'
 then raise exception 'INVALID_AD_VIEW_TICKET_REQUEST';end if;
 -- The public actor cannot invent a paid, wrong-geo, expired or different
 -- creative selection. A click or a view does not approve a campaign.
 if not exists(select 1 from private.b7_eligible_article_creatives(p_article) e
    where e.campaign_id=p_campaign and e.creative_id=p_creative)
 then raise exception 'AD_VIEW_NOT_ELIGIBLE';end if;
 v_nonce_hash:=encode(extensions.digest(p_open_nonce,'sha256'),'hex');
 v_token:=encode(extensions.gen_random_bytes(24),'hex');
 v_hash:=encode(extensions.digest(v_token,'sha256'),'hex');
 v_now:=clock_timestamp();
 -- Unique(article_id,nonce_hash) is durable anti-replay per opening; a
 -- forged fresh nonce is NOT proof of a human. Abuse controls still DUE.
 insert into public.ad_view_tickets(
  token_hash,campaign_id,creative_id,article_id,nonce_hash,issued_at,expires_at
 ) values(v_hash,p_campaign,p_creative,p_article,v_nonce_hash,
          v_now,v_now+interval '3 minutes');
 return v_token;
exception when unique_violation then
 raise exception 'ARTICLE_VIEW_ALREADY_TICKETED';
end $issue$;
revoke all on function public.jb_ad_issue_view_ticket(uuid,uuid,uuid,text)
 from public,anon,authenticated;
grant execute on function public.jb_ad_issue_view_ticket(uuid,uuid,uuid,text)
 to anon,authenticated,service_role;

-- The browser MAY submit after its local IntersectionObserver proved
-- >=50% viewport coverage for a continuous >=1000ms in a visible tab.
-- The server independently enforces >=1s between issuance and report,
-- expiry, uniqueness and atomic consume. It CANNOT attest geometry or
-- humanness: analytics must label these as CLIENT-REPORTED estimates.
create or replace function public.jb_ad_qualify_view_ticket(p_token text)
returns boolean language plpgsql security definer
set search_path to 'pg_catalog','public','extensions'
as $qualify$
declare v public.ad_view_tickets;v_now timestamptz;
begin
 if p_token is null or p_token !~ '^[0-9a-f]{48}$'
 then return false;end if;
 select * into v from public.ad_view_tickets
 where token_hash=encode(extensions.digest(p_token,'sha256'),'hex')
 for update;
 if not found then return false;end if;
 v_now:=clock_timestamp();
 if v.impression_at is not null
   or v_now<v.issued_at+interval '1 second'
   or v_now>=v.expires_at then
  return false;
 end if;
 -- Intentionally do not reselect an already-open/previously-approved ad:
 -- emergency Hide must stop NEW openings, not alter a previously pinned
 -- rendered card or delete its legitimate qualified local observation.
 update public.ad_view_tickets set impression_at=v_now
 where token_hash=v.token_hash;
 insert into public.ad_events(
  campaign_id,event_type,created_at,
  view_ticket_hash,qualified,qualification_source
 ) values(
  v.campaign_id,'impression',v_now,
  v.token_hash,true,'client_reported_50pct_1000ms'
 );
 return true;
end $qualify$;
revoke all on function public.jb_ad_qualify_view_ticket(text)
 from public,anon,authenticated;
grant execute on function public.jb_ad_qualify_view_ticket(text)
 to anon,authenticated,service_role;

-- Separate Owner-only report of QUALIFIED CLAIMS vs historical raw events.
-- Existing article analytics and existing ad_events records are preserved.
-- Zero-click proof until a separate verified click-token design passes T040.
create or replace function public.jb_ad_qualified_analytics_internal(p_campaign uuid)
returns jsonb language plpgsql stable security definer
set search_path to 'pg_catalog','public','private'
as $stats$
declare v jsonb;
begin
 if not private.p4_owner_allowed() then raise exception 'OWNER_AAL2_REQUIRED';end if;
 select jsonb_build_object(
   'today',count(*) filter(where event_type='impression' and qualified=true
     and created_at>=date_trunc('day',now())),
   'd7',count(*) filter(where event_type='impression' and qualified=true
     and created_at>=now()-interval '7 days'),
   'd30',count(*) filter(where event_type='impression' and qualified=true
     and created_at>=now()-interval '30 days'),
   'total',count(*) filter(where event_type='impression' and qualified=true),
   'unverified_legacy',count(*) filter(where qualified=false),
   'clicks_verified',0,
   'reach_type','client_reported_estimate_not_unique_people',
   'anti_bot_verified',false
 ) into v from public.ad_events e where e.campaign_id=p_campaign;
 return v;
end $stats$;
revoke all on function public.jb_ad_qualified_analytics_internal(uuid)
 from public,anon,authenticated;
grant execute on function public.jb_ad_qualified_analytics_internal(uuid)
 to authenticated,service_role;

commit;
