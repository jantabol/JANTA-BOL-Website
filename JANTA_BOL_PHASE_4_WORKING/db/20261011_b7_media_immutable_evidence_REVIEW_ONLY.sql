-- B7 ADS-015 / original-vs-derivative QUARANTINE evidence ledger.
-- REVIEW ONLY; DO NOT apply to JANTA BOL production without Founder,
-- real worker, bucket/RLS, Owner AAL2, deployment and Android proof.
-- Existing public.ad_creatives remains the ONLY creative/publish SOT.
-- Backend service-role bypasses RLS: restrictive privileges and APPEND-ONLY
-- triggers protect audit evidence from normal UPDATE/DELETE paths.
begin;
do $source$
begin
 if to_regclass('public.ad_creatives') is null or
    to_regclass('public.ad_campaigns') is null or
    to_regprocedure('private.p4_owner_allowed()') is null
 then raise exception 'B7_ORIGINAL_CANONICAL_SOURCE_MISSING';end if;
 if exists(select 1 from information_schema.tables
  where table_schema='private' and table_name='b7_ad_media_receipts')
 then raise exception 'B7_MEDIA_EVIDENCE_ALREADY_PRESENT_REVIEW_REQUIRED';end if;
end $source$;

create table private.b7_ad_media_receipts(
 asset_id uuid primary key,
 campaign_id uuid not null references public.ad_campaigns(id) on delete restrict,
 creative_id uuid not null unique references public.ad_creatives(id) on delete restrict,
 creative_version integer not null check(creative_version>=1),
 owner_user_id uuid not null,
 source_bucket text not null default 'jb-ad-originals-private'
  check(source_bucket='jb-ad-originals-private'),
 source_path text not null unique,
 source_sha256 text not null check(source_sha256 ~ '^[a-f0-9]{64}$'),
 source_mime text not null check(source_mime in('image/png','image/jpeg','image/webp')),
 source_bytes integer not null check(source_bytes between 16 and 8388608),
 derivative_bucket text not null default 'jb-ad-previews-private'
  check(derivative_bucket='jb-ad-previews-private'),
 derivative_path text not null unique,
 derivative_sha256 text not null check(derivative_sha256 ~ '^[a-f0-9]{64}$'),
 derivative_mime text not null default 'image/png'
  check(derivative_mime='image/png'),
 derivative_bytes integer not null check(derivative_bytes between 16 and 8388608),
 width integer not null check(width between 1 and 1200),
 height integer not null check(height between 1 and 1200),
 storage_readback_verified_at timestamptz not null,
 recorded_at timestamptz not null default now(),
 -- This table is NEVER a frontend authorization token nor approval flag.
 approval_state text not null default 'private_quarantined'
  check(approval_state='private_quarantined')
);

create table private.b7_ad_media_orphan_events(
 id bigint generated always as identity primary key,
 asset_id uuid not null,
 stored_paths jsonb not null
  check(jsonb_typeof(stored_paths)='array' and
        jsonb_array_length(stored_paths) between 1 and 2),
 failure_code text not null check(failure_code in
  ('CREATE_ONLY_FAILED','STORAGE_READBACK_FAILED','STORAGE_UNAVAILABLE',
   'HASH_MISMATCH','DURABLE_RECEIPT_FAILED')),
 logged_at timestamptz not null default now(),
 state text not null default 'requires_manual_reconciliation'
  check(state='requires_manual_reconciliation')
);
create index b7_media_orphan_asset_idx on private.b7_ad_media_orphan_events(asset_id);

create function private.b7_ad_media_receipt_insert_guard()
returns trigger language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $guard$
declare v public.ad_creatives%rowtype;v_latest integer;
begin
 select * into v from public.ad_creatives where id=new.creative_id;
 if not found or v.campaign_id is distinct from new.campaign_id
    or v.creative_type<>'image' or v.approved
    or v.version<>new.creative_version
 then raise exception 'B7_MEDIA_CREATIVE_MISMATCH_OR_ALREADY_APPROVED';end if;
 select max(version) into v_latest from public.ad_creatives
 where campaign_id=new.campaign_id;
 if v_latest is distinct from new.creative_version
 then raise exception 'B7_MEDIA_STALE_CREATIVE_VERSION';end if;
 if new.source_path not like 'staged/'||new.asset_id::text||'/'||new.source_sha256||'.%'
    or not (
     (new.source_mime='image/png' and new.source_path=
       'staged/'||new.asset_id::text||'/'||new.source_sha256||'.png')
     or (new.source_mime='image/webp' and new.source_path=
       'staged/'||new.asset_id::text||'/'||new.source_sha256||'.webp')
     or (new.source_mime='image/jpeg' and new.source_path in(
       'staged/'||new.asset_id::text||'/'||new.source_sha256||'.jpg',
       'staged/'||new.asset_id::text||'/'||new.source_sha256||'.jpeg'))
    ) or new.derivative_path is distinct from
      'staged/'||new.asset_id::text||'/'||new.derivative_sha256||'.png'
 then raise exception 'B7_MEDIA_ASSET_PATH_NOT_CANONICAL';end if;
 if new.storage_readback_verified_at>now()+interval '60 seconds'
    or new.storage_readback_verified_at<now()-interval '1 day'
 then raise exception 'B7_MEDIA_RECEIPT_TIMESTAMP_INVALID';end if;
 return new;
end $guard$;

create function private.b7_ad_media_audit_immutable()
returns trigger language plpgsql security definer
set search_path to 'pg_catalog','private'
as $locked$
begin
 raise exception 'B7_MEDIA_AUDIT_APPEND_ONLY';
end $locked$;

create trigger b7_media_receipt_guard before insert on private.b7_ad_media_receipts
 for each row execute function private.b7_ad_media_receipt_insert_guard();
create trigger b7_media_receipt_immutable before update or delete
 on private.b7_ad_media_receipts for each row
 execute function private.b7_ad_media_audit_immutable();
create trigger b7_media_orphan_immutable before update or delete
 on private.b7_ad_media_orphan_events for each row
 execute function private.b7_ad_media_audit_immutable();

alter table private.b7_ad_media_receipts enable row level security;
alter table private.b7_ad_media_orphan_events enable row level security;
revoke all on private.b7_ad_media_receipts from public,anon,authenticated;
revoke all on private.b7_ad_media_orphan_events from public,anon,authenticated;
revoke all on sequence private.b7_ad_media_orphan_events_id_seq from public,anon,authenticated;
grant usage on schema private to service_role;
grant select,insert on private.b7_ad_media_receipts to service_role;
grant select,insert on private.b7_ad_media_orphan_events to service_role;
grant usage,select on sequence private.b7_ad_media_orphan_events_id_seq to service_role;
create policy b7_media_evidence_service_insert on private.b7_ad_media_receipts
 as permissive for insert to service_role with check (true);
create policy b7_media_evidence_service_select on private.b7_ad_media_receipts
 as permissive for select to service_role using (true);
create policy b7_media_orphan_service_insert on private.b7_ad_media_orphan_events
 as permissive for insert to service_role with check (true);
create policy b7_media_orphan_service_select on private.b7_ad_media_orphan_events
 as permissive for select to service_role using (true);
revoke all on function private.b7_ad_media_receipt_insert_guard()
 from public,anon,authenticated;
revoke all on function private.b7_ad_media_audit_immutable()
 from public,anon,authenticated;
commit;
