-- B7 ADS-015: service-only bridge to EXISTING append-only quarantine ledger.
-- REVIEW ONLY. Never Production without Founder E5/Storage/CI approvals.
-- No new public business/Owner authority and NO media publish action.
begin;
do $pre$
begin
 if to_regclass('private.b7_ad_media_receipts') is null or
    to_regclass('private.b7_ad_media_orphan_events') is null or
    to_regprocedure('private.b7_ad_media_receipt_insert_guard()') is null
 then raise exception 'B7_PRIVATE_EVIDENCE_BASELINE_MISSING';end if;
 if to_regprocedure('public.jb_ad_media_record_receipt_server(jsonb)') is not null
 then raise exception 'B7_PRIVATE_BRIDGE_SIGNATURE_DRIFT_REVIEW_REQUIRED';end if;
end $pre$;

create function public.jb_ad_media_record_receipt_server(p jsonb)
returns uuid language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $rpc$
declare v record;v_id uuid;
begin
 if p is null or jsonb_typeof(p)<>'object' or length(p::text)>6000
 then raise exception 'B7_INVALID_PRIVATE_EVIDENCE_REQUEST';end if;
 select * into v from jsonb_to_record(p) as x(
  asset_id uuid,campaign_id uuid,creative_id uuid,creative_version integer,
  owner_user_id uuid,
  source_bucket text,source_path text,source_sha256 text,source_mime text,
  source_bytes integer,derivative_bucket text,derivative_path text,
  derivative_sha256 text,derivative_mime text,derivative_bytes integer,
  width integer,height integer,storage_readback_verified_at timestamptz);
 if v.asset_id is null or v.campaign_id is null or v.creative_id is null or
    v.creative_version is null or v.owner_user_id is null or
    v.source_path is null or v.derivative_path is null or
    v.source_sha256 is null or v.derivative_sha256 is null or
    v.source_mime is null or v.derivative_mime is null or
    v.storage_readback_verified_at is null
 then raise exception 'B7_INCOMPLETE_VERIFIED_RECEIPT';end if;
 insert into private.b7_ad_media_receipts(
  asset_id,campaign_id,creative_id,creative_version,owner_user_id,
  source_bucket,source_path,source_sha256,source_mime,source_bytes,
  derivative_bucket,derivative_path,derivative_sha256,derivative_mime,
  derivative_bytes,width,height,storage_readback_verified_at)
 values(v.asset_id,v.campaign_id,v.creative_id,v.creative_version,
  v.owner_user_id,v.source_bucket,v.source_path,v.source_sha256,
  v.source_mime,v.source_bytes,v.derivative_bucket,v.derivative_path,
  v.derivative_sha256,v.derivative_mime,v.derivative_bytes,
  v.width,v.height,v.storage_readback_verified_at)
 returning asset_id into v_id;
 return v_id;
end $rpc$;

create function public.jb_ad_media_read_receipt_server(p_asset uuid)
returns jsonb language plpgsql stable security definer
set search_path to 'pg_catalog','public','private'
as $rpc$
declare v jsonb;
begin
 if p_asset is null then raise exception 'B7_ASSET_ID_REQUIRED';end if;
 select to_jsonb(r) into v from private.b7_ad_media_receipts r
 where r.asset_id=p_asset;
 return v;
end $rpc$;

create function public.jb_ad_media_log_orphan_server(p_event jsonb)
returns boolean language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $rpc$
declare v_asset uuid;v_objects jsonb;v_reason text;
begin
 if p_event is null or jsonb_typeof(p_event)<>'object' or
    length(p_event::text)>1400
 then raise exception 'B7_BAD_ORPHAN_AUDIT_ENVELOPE';end if;
 v_asset:=(p_event->>'assetId')::uuid;
 v_objects:=p_event->'objects';
 v_reason:=p_event->>'reason';
 if v_asset is null or jsonb_typeof(v_objects)<>'array' or
    jsonb_array_length(v_objects) not between 1 and 2 or
    (v_reason is null or v_reason not in('PRIVATE_STORAGE_FAILED','RECEIPT_OR_OWNER_STATE_FAILED'))
 then raise exception 'B7_INVALID_ORPHAN_AUDIT';end if;
 if exists(select 1 from jsonb_array_elements(v_objects) as object(x)
  where x->>'bucket' is null
    or x->>'bucket' not in
     ('jb-ad-originals-private','jb-ad-previews-private')
    or x->>'path' is null
    or x->>'path' !~ ('^staged/'||v_asset::text||'/[a-f0-9]{64}\.(png|jpg|jpeg|webp)$'))
 then raise exception 'B7_ORPHAN_OBJECT_PATH_DENIED';end if;
 insert into private.b7_ad_media_orphan_events(
  asset_id,stored_paths,failure_code)
 values(v_asset,v_objects,case v_reason
  when 'PRIVATE_STORAGE_FAILED' then 'STORAGE_UNAVAILABLE'
  else 'DURABLE_RECEIPT_FAILED' end);
 return true;
end $rpc$;

revoke all on function public.jb_ad_media_record_receipt_server(jsonb)
 from public,anon,authenticated;
revoke all on function public.jb_ad_media_read_receipt_server(uuid)
 from public,anon,authenticated;
revoke all on function public.jb_ad_media_log_orphan_server(jsonb)
 from public,anon,authenticated;
grant execute on function public.jb_ad_media_record_receipt_server(jsonb)
 to service_role;
grant execute on function public.jb_ad_media_read_receipt_server(uuid)
 to service_role;
grant execute on function public.jb_ad_media_log_orphan_server(jsonb)
 to service_role;
commit;
