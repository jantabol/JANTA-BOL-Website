-- B7 ADS-011/015 video original / H264 MP4 / static PNG poster evidence.
-- REVIEW_ONLY: no Production SQL changes without Founder E5, E3 and worker proof.
-- The ORIGINAL ad_creatives + approval RPC is the single editorial/ads SOT.
-- This ledger proves PRIVATE hash/storage evidence only, not LIVE eligibility.
begin;
do $requirements$
begin
 if to_regclass('private.b7_ad_media_receipts') is null or
    to_regprocedure('private.b7_ad_media_audit_immutable()') is null or
    to_regprocedure('private.p4_owner_allowed()') is null
 then raise exception 'B7_EXISTING_MEDIA_AUDIT_AUTHORITY_REQUIRED';end if;
 if to_regclass('private.b7_ad_video_receipts') is not null
 then raise exception 'B7_VIDEO_LEDGER_ALREADY_EXISTS_REVIEW_DIVERGENCE';end if;
end $requirements$;

create table private.b7_ad_video_receipts(
 asset_id uuid primary key,
 campaign_id uuid not null references public.ad_campaigns(id) on delete restrict,
 creative_id uuid not null unique references public.ad_creatives(id) on delete restrict,
 creative_version integer not null check(creative_version>=1),
 owner_user_id uuid not null,
 original_bucket text not null default 'jb-ad-video-originals-private'
  check(original_bucket='jb-ad-video-originals-private'),
 original_path text not null unique,
 original_sha256 text not null check(original_sha256 ~ '^[0-9a-f]{64}$'),
 source_bytes integer not null check(source_bytes between 1024 and 8388608),
 video_bucket text not null default 'jb-ad-videos-private'
  check(video_bucket='jb-ad-videos-private'),
 video_path text not null unique,
 video_sha256 text not null check(video_sha256 ~ '^[0-9a-f]{64}$'),
 video_bytes integer not null check(video_bytes between 1024 and 8388608),
 poster_bucket text not null default 'jb-ad-video-posters-private'
  check(poster_bucket='jb-ad-video-posters-private'),
 poster_path text not null unique,
 poster_sha256 text not null check(poster_sha256 ~ '^[0-9a-f]{64}$'),
 poster_bytes integer not null check(poster_bytes between 32 and 2097152),
 width integer not null check(width between 2 and 1280),
 height integer not null check(height between 2 and 720),
 duration_seconds numeric(8,3) not null check(duration_seconds>0 and duration_seconds<=60),
 storage_readback_verified_at timestamptz not null,
 created_at timestamptz not null default now(),
 approval_state text not null default 'private_quarantined'
  check(approval_state='private_quarantined')
);
create table private.b7_ad_video_orphan_events(
 id bigint generated always as identity primary key,
 asset_id uuid not null,
 stored_paths jsonb not null check(
  jsonb_typeof(stored_paths)='array' and
  jsonb_array_length(stored_paths) between 1 and 3),
 failure_code text not null check(failure_code in(
  'PRIVATE_STORAGE_FAILED','RECEIPT_OR_OWNER_STATE_FAILED')),
 recorded_at timestamptz not null default now(),
 status text not null default 'requires_reconciliation'
  check(status='requires_reconciliation')
);
create index b7_video_orphan_asset on private.b7_ad_video_orphan_events(asset_id);

create function private.b7_video_receipt_guard()
returns trigger language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $guard$
declare v public.ad_creatives%rowtype;v_latest integer;
begin
 perform 1 from public.ad_campaigns where id=new.campaign_id for update;
 if not found then raise exception 'B7_VIDEO_CAMPAIGN_NOT_FOUND';end if;
 select * into v from public.ad_creatives where id=new.creative_id;
 if not found or v.campaign_id is distinct from new.campaign_id or
    v.creative_type<>'video' or v.approved is distinct from false or
    v.version<>new.creative_version
 then raise exception 'B7_VIDEO_CREATIVE_NOT_PENDING';end if;
 select max(version) into v_latest from public.ad_creatives
 where campaign_id=new.campaign_id;
 if new.creative_version is distinct from v_latest
 then raise exception 'B7_VIDEO_CREATIVE_VERSION_STALE';end if;
 if new.original_path is distinct from
  'staged/'||new.asset_id||'/'||new.original_sha256||'.mp4' or
    new.video_path is distinct from
  'staged/'||new.asset_id||'/'||new.video_sha256||'.mp4' or
    new.poster_path is distinct from
  'staged/'||new.asset_id||'/'||new.poster_sha256||'.png'
 then raise exception 'B7_VIDEO_PRIVATE_ASSET_PATH_INVALID';end if;
 if new.storage_readback_verified_at<now()-interval '1 day' or
    new.storage_readback_verified_at>now()+interval '60 seconds'
 then raise exception 'B7_VIDEO_RECEIPT_TIMESTAMP_INVALID';end if;
 return new;
end $guard$;
create trigger b7_video_guard before insert on private.b7_ad_video_receipts
 for each row execute function private.b7_video_receipt_guard();
create trigger b7_video_immutable before update or delete on private.b7_ad_video_receipts
 for each row execute function private.b7_ad_media_audit_immutable();
create trigger b7_video_orphan_immutable before update or delete on private.b7_ad_video_orphan_events
 for each row execute function private.b7_ad_media_audit_immutable();

alter table private.b7_ad_video_receipts enable row level security;
alter table private.b7_ad_video_orphan_events enable row level security;
revoke all on private.b7_ad_video_receipts from public,anon,authenticated;
revoke all on private.b7_ad_video_orphan_events from public,anon,authenticated;
revoke all on sequence private.b7_ad_video_orphan_events_id_seq from public,anon,authenticated;
grant select,insert on private.b7_ad_video_receipts to service_role;
grant select,insert on private.b7_ad_video_orphan_events to service_role;
grant usage,select on sequence private.b7_ad_video_orphan_events_id_seq to service_role;
create policy b7_video_service_read on private.b7_ad_video_receipts
 for select to service_role using(true);
create policy b7_video_service_write on private.b7_ad_video_receipts
 for insert to service_role with check(true);
create policy b7_video_orphans_service_read on private.b7_ad_video_orphan_events
 for select to service_role using(true);
create policy b7_video_orphans_service_write on private.b7_ad_video_orphan_events
 for insert to service_role with check(true);

-- Service-role ONLY wrapper. Public schema exposure is protected by
-- REVOKE PUBLIC and no anon/authenticated execute grants.
create function public.jb_ad_video_record_receipt_server(p jsonb)
returns uuid language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $record$
declare v record;
begin
 if p is null or jsonb_typeof(p)<>'object' or length(p::text)>6400
 then raise exception 'B7_VIDEO_EVIDENCE_REQUEST_INVALID';end if;
 select * into v from jsonb_to_record(p) as x(
  asset_id uuid,campaign_id uuid,creative_id uuid,creative_version integer,
  owner_user_id uuid,original_bucket text,original_path text,
  original_sha256 text,source_bytes integer,
  video_bucket text,video_path text,video_sha256 text,video_bytes integer,
  poster_bucket text,poster_path text,poster_sha256 text,poster_bytes integer,
  width integer,height integer,duration_seconds numeric,
  storage_readback_verified_at timestamptz);
 if v.asset_id is null or v.creative_id is null or v.campaign_id is null or
    v.owner_user_id is null or v.creative_version is null or
    v.original_path is null or v.video_path is null or v.poster_path is null or
    v.original_sha256 is null or v.video_sha256 is null or
    v.poster_sha256 is null or v.duration_seconds is null
 then raise exception 'B7_VIDEO_EVIDENCE_REQUIRED_FIELDS_MISSING';end if;
 insert into private.b7_ad_video_receipts(
  asset_id,campaign_id,creative_id,creative_version,owner_user_id,
  original_bucket,original_path,original_sha256,source_bytes,
  video_bucket,video_path,video_sha256,video_bytes,
  poster_bucket,poster_path,poster_sha256,poster_bytes,
  width,height,duration_seconds,storage_readback_verified_at)
 values(v.asset_id,v.campaign_id,v.creative_id,v.creative_version,v.owner_user_id,
  v.original_bucket,v.original_path,v.original_sha256,v.source_bytes,
  v.video_bucket,v.video_path,v.video_sha256,v.video_bytes,
  v.poster_bucket,v.poster_path,v.poster_sha256,v.poster_bytes,
  v.width,v.height,v.duration_seconds,v.storage_readback_verified_at);
 return v.asset_id;
end $record$;
create function public.jb_ad_video_read_receipt_server(p_asset uuid)
returns jsonb language sql stable security definer
set search_path to 'pg_catalog','public','private'
as $read$
 select to_jsonb(r) from private.b7_ad_video_receipts r where r.asset_id=p_asset
$read$;
create function public.jb_ad_video_log_orphan_server(p jsonb)
returns boolean language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $orphan$
declare v_id uuid;v_rows jsonb;v_reason text;v_count integer;
begin
 if p is null or jsonb_typeof(p)<>'object' or length(p::text)>2200
 then raise exception 'B7_VIDEO_ORPHAN_BAD_ENVELOPE';end if;
 v_id:=(p->>'assetId')::uuid;
 v_rows:=p->'objects';
 v_reason:=p->>'reason';
 if v_id is null or jsonb_typeof(v_rows) is distinct from 'array' or
    jsonb_array_length(v_rows) not between 1 and 3 or
    v_reason is null or v_reason not in(
     'PRIVATE_STORAGE_FAILED','RECEIPT_OR_OWNER_STATE_FAILED')
 then raise exception 'B7_VIDEO_ORPHAN_BAD_FIELDS';end if;
 select count(*) into v_count from jsonb_array_elements(v_rows) as e(item)
 where (item->>'bucket') is null or
  (item->>'bucket') not in(
   'jb-ad-video-originals-private','jb-ad-videos-private',
   'jb-ad-video-posters-private')
 or (item->>'path') is null or
  (item->>'path') !~ (
    '^staged/'||v_id::text||'/[a-f0-9]{64}[.](mp4|png)$')
 or (item->>'bucket'='jb-ad-video-posters-private' and
    right(item->>'path',4)<>'.png')
 or (item->>'bucket'<>'jb-ad-video-posters-private' and
    right(item->>'path',4)<>'.mp4');
 if v_count<>0 then raise exception 'B7_VIDEO_ORPHAN_BUCKET_OR_PATH_UNTRUSTED';end if;
 insert into private.b7_ad_video_orphan_events(asset_id,stored_paths,failure_code)
 values(v_id,v_rows,v_reason);
 return true;
end $orphan$;

revoke all on function public.jb_ad_video_record_receipt_server(jsonb)
 from public,anon,authenticated;
revoke all on function public.jb_ad_video_read_receipt_server(uuid)
 from public,anon,authenticated;
revoke all on function public.jb_ad_video_log_orphan_server(jsonb)
 from public,anon,authenticated;
grant execute on function public.jb_ad_video_record_receipt_server(jsonb) to service_role;
grant execute on function public.jb_ad_video_read_receipt_server(uuid) to service_role;
grant execute on function public.jb_ad_video_log_orphan_server(jsonb) to service_role;
revoke all on function private.b7_video_receipt_guard() from public,anon,authenticated;
commit;
