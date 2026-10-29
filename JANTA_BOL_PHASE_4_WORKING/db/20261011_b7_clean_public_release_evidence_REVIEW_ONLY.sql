-- B7 ADS-010/011: prepare CLEAN first-party public release receipt.
-- REVIEW ONLY: worker + Owner deliberate consent required. This is NOT
-- creative approval, publication, live booking or a new ad selection SOT.
-- Immutable evidence is append-only and references the ORIGINAL canonical
-- ad_creatives AND private image/video evidence for SAME creative/version.
begin;
do $preflight$
begin
 if to_regclass('private.b7_ad_media_receipts') is null
  or to_regclass('private.b7_ad_video_receipts') is null
  or to_regprocedure('private.b7_ad_media_audit_immutable()') is null
  or to_regprocedure('public.jb_ad_approve_creative_internal(uuid)') is null
 then raise exception 'B7_MEDIA_OR_CANONICAL_APPROVAL_BASELINE_REQUIRED';end if;
 if to_regclass('private.b7_ad_clean_release_receipts') is not null
 then raise exception 'B7_RELEASE_RECEIPT_ALREADY_INSTALLED_RECONCILE';end if;
end $preflight$;

create table private.b7_ad_clean_release_receipts(
 asset_id uuid primary key,
 campaign_id uuid not null references public.ad_campaigns(id) on delete restrict,
 creative_id uuid not null unique references public.ad_creatives(id) on delete restrict,
 creative_version integer not null check(creative_version>=1),
 owner_user_id uuid not null,
 media_type text not null check(media_type in('image','video')),
 clean_public_bucket text not null default 'jb-ad-clean-public'
  check(clean_public_bucket='jb-ad-clean-public'),
 media_path text not null unique,
 media_sha256 text not null check(media_sha256 ~ '^[a-f0-9]{64}$'),
 poster_path text unique,
 poster_sha256 text check(poster_sha256 is null or poster_sha256 ~ '^[a-f0-9]{64}$'),
 verified_at timestamptz not null,
 recorded_at timestamptz not null default now(),
 approval_state text not null default 'awaiting_atomic_owner_approval'
  check(approval_state='awaiting_atomic_owner_approval'),
 constraint b7_release_poster_pair
  check((poster_path is null)=(poster_sha256 is null)),
 constraint b7_release_type_poster
  check((media_type='video' and poster_path is not null) or
        (media_type='image' and poster_path is null))
);
create table private.b7_ad_clean_release_orphans(
 id bigint generated always as identity primary key,
 asset_id uuid not null,
 object_paths jsonb not null
  check(jsonb_typeof(object_paths)='array' and
        jsonb_array_length(object_paths) between 1 and 2),
 reason text not null check(reason='RELEASE_OR_OWNER_STATE_FAILED'),
 created_at timestamptz not null default now()
);
create index b7_clean_release_orphan_asset on private.b7_ad_clean_release_orphans(asset_id);
create function private.b7_clean_release_guard()
returns trigger language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $guard$
declare c public.ad_creatives%rowtype;last_version integer;img record;vid record;
 v_media_suffix text;
begin
 -- Lock order same as the ONLY existing Creative save/approve authority.
 perform 1 from public.ad_campaigns where id=new.campaign_id for update;
 if not found then raise exception 'B7_RELEASE_CAMPAIGN_MISSING';end if;
 select * into c from public.ad_creatives where id=new.creative_id;
 if not found or c.campaign_id is distinct from new.campaign_id or
  c.creative_type is distinct from new.media_type or
  c.approved is distinct from false or
  c.version is distinct from new.creative_version
 then raise exception 'B7_RELEASE_CREATIVE_NOT_PENDING';end if;
 select max(version) into last_version from public.ad_creatives
 where campaign_id=new.campaign_id;
 if last_version is distinct from new.creative_version
 then raise exception 'B7_RELEASE_STALE_CREATIVE';end if;
 v_media_suffix:=case when new.media_type='image' then '.png' else '.mp4' end;
 if new.media_path is distinct from
    ('creative/'||new.creative_id||'/'||new.asset_id||'/'||
     new.media_sha256||v_media_suffix) or
    (new.media_type='video' and new.poster_path is distinct from
     ('creative/'||new.creative_id||'/'||new.asset_id||'/'||
      new.poster_sha256||'.png'))
 then raise exception 'B7_RELEASE_PUBLIC_PATH_NOT_CANONICAL';end if;
 if new.verified_at<now()-interval '1 day' or
    new.verified_at>now()+interval '60 seconds'
 then raise exception 'B7_RELEASE_TIMESTAMP_OUT_OF_BOUNDS';end if;
 if new.media_type='image' then
  select * into img from private.b7_ad_media_receipts
  where asset_id=new.asset_id;
  if not found or img.creative_id is distinct from new.creative_id or
     img.campaign_id is distinct from new.campaign_id or
     img.creative_version is distinct from new.creative_version or
     img.owner_user_id is distinct from new.owner_user_id or
     img.derivative_sha256 is distinct from new.media_sha256 or
     img.approval_state is distinct from 'private_quarantined'
  then raise exception 'B7_RELEASE_UNVERIFIED_PRIVATE_IMAGE';end if;
 else
  select * into vid from private.b7_ad_video_receipts
  where asset_id=new.asset_id;
  if not found or vid.creative_id is distinct from new.creative_id or
     vid.campaign_id is distinct from new.campaign_id or
     vid.creative_version is distinct from new.creative_version or
     vid.owner_user_id is distinct from new.owner_user_id or
     vid.video_sha256 is distinct from new.media_sha256 or
     vid.poster_sha256 is distinct from new.poster_sha256 or
     vid.approval_state is distinct from 'private_quarantined'
  then raise exception 'B7_RELEASE_UNVERIFIED_PRIVATE_VIDEO_POSTER';end if;
 end if;
 return new;
end $guard$;
create trigger b7_release_guard before insert on private.b7_ad_clean_release_receipts
 for each row execute function private.b7_clean_release_guard();
create trigger b7_release_immutable before update or delete
 on private.b7_ad_clean_release_receipts for each row
 execute function private.b7_ad_media_audit_immutable();
create trigger b7_release_orphan_immutable before update or delete
 on private.b7_ad_clean_release_orphans for each row
 execute function private.b7_ad_media_audit_immutable();
alter table private.b7_ad_clean_release_receipts enable row level security;
alter table private.b7_ad_clean_release_orphans enable row level security;
revoke all on private.b7_ad_clean_release_receipts from public,anon,authenticated;
revoke all on private.b7_ad_clean_release_orphans from public,anon,authenticated;
revoke all on sequence private.b7_ad_clean_release_orphans_id_seq
 from public,anon,authenticated;
grant select,insert on private.b7_ad_clean_release_receipts to service_role;
grant select,insert on private.b7_ad_clean_release_orphans to service_role;
grant usage,select on sequence private.b7_ad_clean_release_orphans_id_seq to service_role;
create policy b7_release_service_read on private.b7_ad_clean_release_receipts
 for select to service_role using(true);
create policy b7_release_service_write on private.b7_ad_clean_release_receipts
 for insert to service_role with check(true);
create policy b7_release_orphan_service_read on private.b7_ad_clean_release_orphans
 for select to service_role using(true);
create policy b7_release_orphan_service_write on private.b7_ad_clean_release_orphans
 for insert to service_role with check(true);

create function public.jb_ad_clean_record_release_server(p jsonb)
returns uuid language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $record$
declare v record;
begin
 if p is null or jsonb_typeof(p)<>'object' or length(p::text)>5500
 then raise exception 'B7_RELEASE_INVALID_ENVELOPE';end if;
 select * into v from jsonb_to_record(p) as x(
  asset_id uuid,campaign_id uuid,creative_id uuid,creative_version integer,
  owner_user_id uuid,media_type text,clean_public_bucket text,
  media_path text,media_sha256 text,poster_path text,poster_sha256 text,
  verified_at timestamptz,approval_state text);
 if v.asset_id is null or v.creative_id is null or v.campaign_id is null or
    v.owner_user_id is null or v.creative_version is null or
    v.media_type is null or v.media_sha256 is null or v.media_path is null or
    v.verified_at is null or
    v.approval_state is distinct from 'awaiting_atomic_owner_approval'
 then raise exception 'B7_RELEASE_REQUIRED_EVIDENCE_MISSING';end if;
 insert into private.b7_ad_clean_release_receipts(
  asset_id,campaign_id,creative_id,creative_version,owner_user_id,
  media_type,clean_public_bucket,media_path,media_sha256,
  poster_path,poster_sha256,verified_at,approval_state)
 values(v.asset_id,v.campaign_id,v.creative_id,v.creative_version,
  v.owner_user_id,v.media_type,v.clean_public_bucket,v.media_path,
  v.media_sha256,v.poster_path,v.poster_sha256,v.verified_at,v.approval_state);
 return v.asset_id;
end $record$;
create function public.jb_ad_clean_read_release_server(p_asset uuid)
returns jsonb language sql stable security definer
set search_path to 'pg_catalog','public','private'
as $read$
 select to_jsonb(r) from private.b7_ad_clean_release_receipts r
 where r.asset_id=p_asset
$read$;
create function public.jb_ad_clean_orphan_release_server(p jsonb)
returns boolean language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $orphan$
declare v_asset uuid;v_objects jsonb;v_reason text;v_n integer;
begin
 if p is null or jsonb_typeof(p)<>'object' or length(p::text)>1900
 then raise exception 'B7_RELEASE_ORPHAN_INVALID_ENVELOPE';end if;
 v_asset:=(p->>'assetId')::uuid;
 v_objects:=p->'objects';v_reason:=p->>'reason';
 if v_asset is null or jsonb_typeof(v_objects) is distinct from 'array' or
    jsonb_array_length(v_objects) not between 1 and 2 or
    v_reason is distinct from 'RELEASE_OR_OWNER_STATE_FAILED'
 then raise exception 'B7_RELEASE_ORPHAN_BAD_FIELDS';end if;
 select count(*) into v_n from jsonb_array_elements(v_objects) as obj(item)
 where item->>'bucket' is distinct from 'jb-ad-clean-public' or
  item->>'path' is null or
  item->>'path' !~ ('^creative/[a-f0-9-]{36}/'||
    v_asset::text||'/[a-f0-9]{64}[.](mp4|png)$');
 if v_n>0 then raise exception 'B7_RELEASE_ORPHAN_WRONG_PUBLIC_OBJECT';end if;
 insert into private.b7_ad_clean_release_orphans(asset_id,object_paths,reason)
 values(v_asset,v_objects,v_reason);
 return true;
end $orphan$;
revoke all on function public.jb_ad_clean_record_release_server(jsonb)
 from public,anon,authenticated;
revoke all on function public.jb_ad_clean_read_release_server(uuid)
 from public,anon,authenticated;
revoke all on function public.jb_ad_clean_orphan_release_server(jsonb)
 from public,anon,authenticated;
grant execute on function public.jb_ad_clean_record_release_server(jsonb) to service_role;
grant execute on function public.jb_ad_clean_read_release_server(uuid) to service_role;
grant execute on function public.jb_ad_clean_orphan_release_server(jsonb) to service_role;
revoke all on function private.b7_clean_release_guard()
 from public,anon,authenticated;
commit;
