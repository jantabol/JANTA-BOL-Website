-- JANTA BOL / B7-G3 / ADS-014, 028 and F04-F05-F13
-- STAGING / DISPOSABLE POSTGRES REVIEW ONLY, NOT LIVE MIGRATION.
-- Physical official MP-55 + tehsil import MUST be separately verified.
-- No GPS, ?district string, viewer profile or article-body keyword is trusted.
-- Existing Article ID, URL, classification and newsroom permissions unchanged.
begin;

create table if not exists public.ad_geo_mp_districts(
 lgd_code text primary key check(lgd_code ~ '^[0-9]{1,9}$'),
 name_en text not null check(length(btrim(name_en)) between 2 and 120),
 source_uri text not null check(source_uri ~ '^https://'),
 source_version text not null check(length(source_version)>=8),
 source_sha256 text not null check(source_sha256 ~ '^[a-f0-9]{64}$'),
 verified boolean not null default false,
 verified_at timestamptz,
 check(not verified or verified_at is not null)
);
create table if not exists public.ad_geo_mp_tehsils(
 lgd_code text primary key check(lgd_code ~ '^[0-9]{1,9}$'),
 district_lgd_code text not null references public.ad_geo_mp_districts(lgd_code),
 name_en text not null check(length(btrim(name_en)) between 2 and 120),
 source_uri text not null check(source_uri ~ '^https://'),
 source_version text not null check(length(source_version)>=8),
 source_sha256 text not null check(source_sha256 ~ '^[a-f0-9]{64}$'),
 verified boolean not null default false,
 verified_at timestamptz,
 check(not verified or verified_at is not null)
);
create index if not exists b7_tehsil_verified_parent_idx
 on public.ad_geo_mp_tehsils(district_lgd_code,verified);

alter table public.articles
 add column if not exists ad_geo_level text,
 add column if not exists ad_geo_district_lgd_code text,
 add column if not exists ad_geo_tehsil_lgd_code text,
 add column if not exists ad_geo_verified_at timestamptz,
 add column if not exists ad_geo_verified_by uuid,
 add column if not exists ad_geo_evidence_ref text;

do $article_constraint$
begin
 if not exists(select 1 from pg_constraint
   where conrelid='public.articles'::regclass
      and conname='b7_article_ad_geo_shape') then
  alter table public.articles add constraint b7_article_ad_geo_shape check(
    ad_geo_level is null or
    (ad_geo_level in ('national','mp_state','district','tehsil')
     and ad_geo_verified_at is not null and ad_geo_verified_by is not null
     and length(btrim(coalesce(ad_geo_evidence_ref,'')))>=8
     and (
       (ad_geo_level in ('national','mp_state')
          and ad_geo_district_lgd_code is null and ad_geo_tehsil_lgd_code is null)
       or (ad_geo_level='district'
          and ad_geo_district_lgd_code is not null and ad_geo_tehsil_lgd_code is null)
       or (ad_geo_level='tehsil'
          and ad_geo_district_lgd_code is not null and ad_geo_tehsil_lgd_code is not null)
     ))
  );
 end if;
end $article_constraint$;

create table if not exists public.ad_campaign_area_grants(
 id bigint generated always as identity primary key,
 campaign_id uuid not null references public.ad_campaigns(id) on delete restrict,
 area_level text not null check(area_level in ('national','mp_state','district','tehsil')),
 district_lgd_code text references public.ad_geo_mp_districts(lgd_code),
 tehsil_lgd_code text references public.ad_geo_mp_tehsils(lgd_code),
 allow_unknown_geo boolean not null default false,
 reviewed_terms_ref text not null check(length(btrim(reviewed_terms_ref)) between 8 and 300),
 reviewed_by uuid not null,
 created_at timestamptz not null default now(),
 check(
   (area_level='national' and district_lgd_code is null and tehsil_lgd_code is null)
   or (area_level='mp_state' and district_lgd_code is null and tehsil_lgd_code is null)
   or (area_level='district' and district_lgd_code is not null and tehsil_lgd_code is null)
   or (area_level='tehsil' and district_lgd_code is not null and tehsil_lgd_code is not null)
 ),
 check(not allow_unknown_geo or area_level='national')
);
create unique index if not exists b7_area_grants_exact_unique
 on public.ad_campaign_area_grants(
  campaign_id,area_level,coalesce(district_lgd_code,''),
  coalesce(tehsil_lgd_code,''),allow_unknown_geo
 );
create index if not exists b7_area_grants_campaign_idx
 on public.ad_campaign_area_grants(campaign_id,area_level);

alter table public.ad_geo_mp_districts enable row level security;
alter table public.ad_geo_mp_tehsils enable row level security;
alter table public.ad_campaign_area_grants enable row level security;
revoke all on public.ad_geo_mp_districts,public.ad_geo_mp_tehsils,
  public.ad_campaign_area_grants from public,anon,authenticated;

-- The existing Article row is the only Article geo authority. Lower privilege
-- cannot forge verified ad geo fields during a normal article edit.
create or replace function private.b7_article_ad_geo_owner_guard()
returns trigger language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $article_guard$
begin
 if not private.p4_owner_allowed() then raise exception 'OWNER_AAL2_REQUIRED';end if;
 return new;
end $article_guard$;
drop trigger if exists b7_article_ad_geo_owner_guard on public.articles;
create trigger b7_article_ad_geo_owner_guard
before update of ad_geo_level,ad_geo_district_lgd_code,
 ad_geo_tehsil_lgd_code,ad_geo_verified_at,ad_geo_verified_by,
 ad_geo_evidence_ref on public.articles
for each row execute function private.b7_article_ad_geo_owner_guard();
revoke all on function private.b7_article_ad_geo_owner_guard()
 from public,anon,authenticated;

-- Owner publishes verified location proof on the canonical Article itself.
-- No user-provided "location" from a frontend public query can set these.
create or replace function public.jb_ad_set_article_geo_internal(
 p_article uuid,p_level text,p_district_lgd text,
 p_tehsil_lgd text,p_evidence_ref text
) returns void language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $set_geo$
declare a public.articles;d public.ad_geo_mp_districts;
        t public.ad_geo_mp_tehsils;v_ref text;
begin
 if not private.p4_owner_allowed() then raise exception 'OWNER_AAL2_REQUIRED';end if;
 v_ref:=btrim(coalesce(p_evidence_ref,''));
 if p_level is null or p_level not in ('national','mp_state','district','tehsil')
    or length(v_ref)<8 or length(v_ref)>300
 then raise exception 'UNVERIFIED_ARTICLE_GEO';end if;
 select * into a from public.articles where id=p_article for update;
 if not found or a.status::text<>'published' then
  raise exception 'PUBLISHED_ARTICLE_REQUIRED';end if;
 if p_level in ('national','mp_state') then
  if p_district_lgd is not null or p_tehsil_lgd is not null
  then raise exception 'ARTICLE_GEO_SHAPE_MISMATCH';end if;
 elsif p_level in ('district','tehsil') then
  select * into d from public.ad_geo_mp_districts
   where lgd_code=p_district_lgd and verified=true;
  if not found then raise exception 'UNVERIFIED_DISTRICT_CODE';end if;
  -- Existing explicit newsroom district label cannot be silently contradicted.
  if nullif(btrim(coalesce(a.district,'')),'') is not null
     and lower(btrim(a.district))<>lower(btrim(d.name_en)) then
   raise exception 'NEWSROOM_DISTRICT_CONFLICT';end if;
  if p_level='district' and p_tehsil_lgd is not null then
   raise exception 'ARTICLE_GEO_SHAPE_MISMATCH';end if;
  if p_level='tehsil' then
   select * into t from public.ad_geo_mp_tehsils
   where lgd_code=p_tehsil_lgd and district_lgd_code=d.lgd_code
     and verified=true;
   if not found then raise exception 'UNVERIFIED_TEHSIL_PARENT';end if;
  end if;
 end if;
 update public.articles set
   ad_geo_level=p_level,ad_geo_district_lgd_code=p_district_lgd,
   ad_geo_tehsil_lgd_code=p_tehsil_lgd,
   ad_geo_verified_at=now(),ad_geo_verified_by=auth.uid(),
   ad_geo_evidence_ref=v_ref
 where id=p_article;
 insert into public.audit_logs(actor_user_id,action,record_type,record_id,metadata,created_at)
 values(auth.uid(),'ad_article_geo_verified','article',p_article::text,
   jsonb_build_object('area_level',p_level,'district_code',p_district_lgd,
     'tehsil_code',p_tehsil_lgd,'evidence_reference_supplied',true),now());
end $set_geo$;
revoke all on function public.jb_ad_set_article_geo_internal(uuid,text,text,text,text)
 from public,anon;
grant execute on function public.jb_ad_set_article_geo_internal(uuid,text,text,text,text)
 to authenticated,service_role;

-- Even an accidentally privileged SQL insert cannot forge a paid/expanded
-- geography without an Owner AAL2 decision and verified parent links.
create or replace function private.b7_area_grant_insert_guard()
returns trigger language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $grant_guard$
declare v public.ad_campaigns;d public.ad_geo_mp_districts;
        t public.ad_geo_mp_tehsils;
begin
 if not private.p4_owner_allowed() or new.reviewed_by is distinct from auth.uid()
 then raise exception 'OWNER_AAL2_REQUIRED';end if;
 select * into v from public.ad_campaigns where id=new.campaign_id for update;
 if not found or v.status not in('requested','review','approved','payment_pending')
   or v.paid_at is not null
   or exists(select 1 from public.ad_payments p
     where p.campaign_id=v.id and p.status='confirmed')
 then raise exception 'PAID_OR_INVALID_AREA_CHANGE_BLOCKED';end if;
 if new.area_level in ('district','tehsil') then
  select * into d from public.ad_geo_mp_districts
    where lgd_code=new.district_lgd_code and verified=true;
  if not found then raise exception 'UNVERIFIED_DISTRICT_CODE';end if;
  if new.area_level='tehsil' then
   select * into t from public.ad_geo_mp_tehsils
    where lgd_code=new.tehsil_lgd_code
      and district_lgd_code=d.lgd_code and verified=true;
   if not found then raise exception 'UNVERIFIED_TEHSIL_PARENT';end if;
  end if;
 end if;
 return new;
end $grant_guard$;
drop trigger if exists b7_area_grant_insert_guard
 on public.ad_campaign_area_grants;
create trigger b7_area_grant_insert_guard
before insert on public.ad_campaign_area_grants
for each row execute function private.b7_area_grant_insert_guard();
revoke all on function private.b7_area_grant_insert_guard()
 from public,anon,authenticated;

-- Existing campaign remains the booking SOT. Exact area grants are append-only
-- commercial terms, not a rewrite of the legacy free-text scope.
create or replace function public.jb_ad_grant_area_internal(
 p_campaign uuid,p_level text,p_district_lgd text,
 p_tehsil_lgd text,p_allow_unknown boolean,p_terms_ref text
) returns bigint language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $grant_geo$
declare c public.ad_campaigns;d public.ad_geo_mp_districts;
        t public.ad_geo_mp_tehsils;v_ref text;v_id bigint;
begin
 if not private.p4_owner_allowed() then raise exception 'OWNER_AAL2_REQUIRED';end if;
 v_ref:=btrim(coalesce(p_terms_ref,''));
 if p_level is null or p_level not in ('national','mp_state','district','tehsil')
   or length(v_ref)<8 or length(v_ref)>300
   or p_allow_unknown is null
 then raise exception 'INVALID_AREA_TERMS';end if;
 select * into c from public.ad_campaigns where id=p_campaign for update;
 if not found or c.status not in ('requested','review','approved','payment_pending')
   or c.paid_at is not null
   or exists(select 1 from public.ad_payments pay
      where pay.campaign_id=c.id and pay.status='confirmed')
 then raise exception 'PAID_OR_INVALID_AREA_CHANGE_BLOCKED';end if;
 if (p_level in ('national','mp_state') and
   (p_district_lgd is not null or p_tehsil_lgd is not null))
 or (p_level<>'national' and p_allow_unknown)
 then raise exception 'INVALID_AREA_SHAPE';end if;
 if p_level in ('district','tehsil') then
  select * into d from public.ad_geo_mp_districts
    where lgd_code=p_district_lgd and verified=true;
  if not found then raise exception 'UNVERIFIED_DISTRICT_CODE';end if;
  if p_level='district' and p_tehsil_lgd is not null then
    raise exception 'INVALID_AREA_SHAPE';end if;
  if p_level='tehsil' then
   select * into t from public.ad_geo_mp_tehsils
    where lgd_code=p_tehsil_lgd and district_lgd_code=d.lgd_code
      and verified=true;
   if not found then raise exception 'UNVERIFIED_TEHSIL_PARENT';end if;
  end if;
 end if;
 insert into public.ad_campaign_area_grants(
  campaign_id,area_level,district_lgd_code,tehsil_lgd_code,
  allow_unknown_geo,reviewed_terms_ref,reviewed_by
 ) values(p_campaign,p_level,p_district_lgd,p_tehsil_lgd,
  p_allow_unknown,v_ref,auth.uid())
 returning id into v_id;
 insert into public.ad_history(campaign_id,event_type,note,actor_user_id)
 values(p_campaign,'ad_area_granted',
   'Grant '||v_id||': '||p_level||'; verified LGD codes reviewed against terms reference.',
   auth.uid());
 insert into public.audit_logs(actor_user_id,action,record_type,record_id,metadata,created_at)
 values(auth.uid(),'ad_area_granted','ad_campaign',p_campaign::text,
    jsonb_build_object('grant_id',v_id,'level',p_level,'district',p_district_lgd,
      'tehsil',p_tehsil_lgd,'allow_unknown',p_allow_unknown),now());
 return v_id;
end $grant_geo$;
revoke all on function public.jb_ad_grant_area_internal(uuid,text,text,text,boolean,text)
 from public,anon;
grant execute on function public.jb_ad_grant_area_internal(uuid,text,text,text,boolean,text)
 to authenticated,service_role;

-- Never permit ordinary client writes to approval terms/geo grants.
create or replace function private.b7_campaign_geo_immutability()
returns trigger language plpgsql security definer
set search_path to 'pg_catalog'
as $immutable$
begin
 raise exception 'IMMUTABLE_AD_AREA_GRANT_USE_NEW_REVIEWED_TERMS';
end $immutable$;
drop trigger if exists b7_area_grant_immutable on public.ad_campaign_area_grants;
create trigger b7_area_grant_immutable
before update or delete on public.ad_campaign_area_grants
for each row execute function private.b7_campaign_geo_immutability();
revoke all on function private.b7_campaign_geo_immutability() from public,anon,authenticated;

-- This is a private eligibility PART, NOT a public feed and NOT proof that
-- production Geo/Rotation has been integrated. Matching reads persisted
-- canonical Article metadata and exact Owner-reviewed campaign grants only.
create or replace function private.b7_geo_matches_article(
 p_article uuid,p_campaign uuid
) returns boolean language sql stable security definer
set search_path to 'pg_catalog'
as $match$
select exists(
 select 1 from public.articles a
 join public.ad_campaign_area_grants g on g.campaign_id=p_campaign
 left join public.ad_geo_mp_districts d
  on d.lgd_code=a.ad_geo_district_lgd_code and d.verified=true
 left join public.ad_geo_mp_tehsils t
  on t.lgd_code=a.ad_geo_tehsil_lgd_code and t.verified=true
   and t.district_lgd_code=a.ad_geo_district_lgd_code
 where a.id=p_article and a.status::text='published'
   and (
    (a.ad_geo_verified_at is null or a.ad_geo_evidence_ref is null)
     and g.area_level='national' and g.allow_unknown_geo=true
    or
    (a.ad_geo_verified_at is not null and
     length(btrim(coalesce(a.ad_geo_evidence_ref,'')))>=8 and
     (
      (g.area_level='national')
      or (g.area_level='mp_state' and a.ad_geo_level in ('mp_state','district','tehsil')
        and (a.ad_geo_level='mp_state' or d.lgd_code is not null)
        and (a.ad_geo_level<>'tehsil' or t.lgd_code is not null))
      or (g.area_level='district' and
        a.ad_geo_level in ('district','tehsil')
        and d.lgd_code is not null and
        (a.ad_geo_level<>'tehsil' or t.lgd_code is not null)
        and g.district_lgd_code=d.lgd_code)
      or (g.area_level='tehsil' and a.ad_geo_level='tehsil'
        and d.lgd_code is not null and t.lgd_code is not null
        and g.district_lgd_code=d.lgd_code
        and g.tehsil_lgd_code=t.lgd_code)
     )
    )
   )
)
$match$;
revoke all on function private.b7_geo_matches_article(uuid,uuid)
 from public,anon,authenticated;

commit;
