\set ON_ERROR_STOP on
-- Disposable PostgreSQL 17 only. Synthetic hashes/IDs DO NOT prove file bytes.
begin;
do $verify_same_home_lock$
declare src text;
begin
 select pg_get_functiondef('private.b7_ad_media_receipt_insert_guard()'::regprocedure)
 into src;
 if position('from public.ad_campaigns where id=new.campaign_id for update'
  in lower(src))=0
 then raise exception 'B7_MEDIA_LATEST_CHECK_MISSING_CAMPAIGN_SERIALIZATION';end if;
 raise notice 'PASS [ADS-015] new media receipt uses canonical campaign FOR UPDATE, same as Creative save/approve';
end $verify_same_home_lock$;
do $create$
declare v uuid;asset uuid:='66666666-6666-4666-8666-666666666666';
        r public.ad_creatives%rowtype;msg text;
begin
 perform set_config('b7.test_owner','enabled',true);
 v:=public.jb_ad_save_creative_internal(
  '30000000-0000-0000-0000-000000000003','image',
  'https://approved-assets.example.test/review/only.png',
  'Pending untrusted proposal',null,null);
 select * into r from public.ad_creatives where id=v;
 if r.approved then raise exception 'CREATIVE_WAS_PREAPPROVED';end if;
 insert into private.b7_ad_media_receipts(
 asset_id,campaign_id,creative_id,creative_version,owner_user_id,
 source_path,source_sha256,source_mime,source_bytes,
 derivative_path,derivative_sha256,derivative_bytes,width,height,storage_readback_verified_at)
 values(asset,r.campaign_id,v,r.version,
 '11111111-1111-4111-8111-111111111111',
 'staged/'||asset||'/'||repeat('a',64)||'.png',
 repeat('a',64),'image/png',1024,
 'staged/'||asset||'/'||repeat('b',64)||'.png',
 repeat('b',64),900,500,300,now());
 if not exists(select 1 from private.b7_ad_media_receipts where asset_id=asset
  and approval_state='private_quarantined')
 then raise exception 'QUARANTINE_RECEIPT_MISSING';end if;
 -- This record must NEVER override the existing explicit-Owner rule.
 begin
  perform public.jb_ad_approve_creative_internal(v);
  raise exception 'RECEIPT_ESCALATED_TO_APPROVAL';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_MEDIA_SERVER_VERIFICATION_NOT_READY' then
   raise exception 'MEDIA_APPROVAL_HOLD_WEAKENED: %',msg;end if;
 end;
 begin
  insert into private.b7_ad_media_receipts(
    asset_id,campaign_id,creative_id,creative_version,owner_user_id,
    source_path,source_sha256,source_mime,source_bytes,
    derivative_path,derivative_sha256,derivative_bytes,width,height,
    storage_readback_verified_at)
  values('77777777-7777-4777-8777-777777777777',r.campaign_id,v,r.version,
   '11111111-1111-4111-8111-111111111111',
   'staged/77777777-7777-4777-8777-777777777777/'||repeat('a',64)||'.png',
   repeat('a',64),'image/png',1024,
   'staged/77777777-7777-4777-8777-777777777777/'||repeat('b',64)||'.png',
   repeat('b',64),900,500,300,now());
  raise exception 'DUPLICATE_CREATIVE_ASSET_ACCEPTED';
 exception when unique_violation then null;end;
 raise notice 'PASS [ADS-015] exact creative/v linked to immutable evidence, remains unapproved, duplicate asset denied';
end $create$;
set local role anon;
do $anon$
declare msg text;
begin
 begin
  perform count(*) from private.b7_ad_media_receipts;
  raise exception 'ANON_READ_PRIVATE_MEDIA_RECEIPTS';
 exception when insufficient_privilege then null;end;
 begin
  insert into private.b7_ad_media_orphan_events(asset_id,stored_paths,failure_code)
  values(gen_random_uuid(),'[{"bucket":"jb-ad-originals-private","path":"source"}]',
         'STORAGE_UNAVAILABLE');
  raise exception 'ANON_WROTE_PRIVATE_ORPHAN_LOG';
 exception when insufficient_privilege then null;end;
 raise notice 'PASS [ADS-015/056] anonymous cannot read, write or alter media audit';
end $anon$;
reset role;
set local role authenticated;
do $auth$
begin
 begin
  perform count(*) from private.b7_ad_media_receipts;
  raise exception 'AUTHENTICATED_CLIENT_CAN_READ_PRIVATE_MEDIA_AUDIT';
 exception when insufficient_privilege then null;end;
 raise notice 'PASS [ADS-056] even authenticated browser cannot read private media paths';
end $auth$;
reset role;
set local role service_role;
do $service$
declare msg text;v_asset_id uuid:='66666666-6666-4666-8666-666666666666';
begin
 if (select count(*) from private.b7_ad_media_receipts where asset_id=v_asset_id)<>1
 then raise exception 'SERVICE_CANNOT_READ_EVIDENCE';end if;
 begin
  update private.b7_ad_media_receipts
   set approval_state='private_quarantined' where asset_id=v_asset_id;
  raise exception 'SERVICE_ROLE_MUTATED_MEDIA_RECEIPT';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'permission denied for table b7_ad_media_receipts'
  then raise exception 'SERVICE_ROLE_UPDATE_PERMISSION_WEAKENED: %',msg;end if;
 end;
 begin
  delete from private.b7_ad_media_receipts where asset_id=v_asset_id;
  raise exception 'SERVICE_ROLE_DELETED_MEDIA_RECEIPT';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'permission denied for table b7_ad_media_receipts'
  then raise exception 'SERVICE_ROLE_DELETE_PERMISSION_WEAKENED: %',msg;end if;
 end;
 insert into private.b7_ad_media_orphan_events(asset_id,stored_paths,failure_code)
 values(v_asset_id,'[{"bucket":"jb-ad-originals-private","path":"pending"}]'::jsonb,
 'STORAGE_READBACK_FAILED');
 begin
  delete from private.b7_ad_media_orphan_events where asset_id=v_asset_id;
  raise exception 'SERVICE_ROLE_DELETED_ORPHAN_AUDIT';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'permission denied for table b7_ad_media_orphan_events'
  then raise exception 'ORPHAN_DELETE_PERMISSION_WEAKENED: %',msg;end if;
 end;
 raise notice 'PASS [ADS-015] backend service_role may insert-only and read; cannot UPDATE/DELETE evidence or orphan audit';
end $service$;
reset role;
-- IN THIS ROLLED-BACK E2 TRANSACTION ONLY: deliberately widen grants
-- and RLS temporarily to prove APPEND-ONLY triggers remain effective
-- even if future DBA migration erroneously grants extra DML.
grant update,delete on private.b7_ad_media_receipts to service_role;
grant update,delete on private.b7_ad_media_orphan_events to service_role;
create policy b7_ci_only_update on private.b7_ad_media_receipts
 for update to service_role using(true) with check(true);
create policy b7_ci_only_delete on private.b7_ad_media_receipts
 for delete to service_role using(true);
create policy b7_ci_only_delete_orphans on private.b7_ad_media_orphan_events
 for delete to service_role using(true);
set local role service_role;
do $trigger_probe$
declare msg text;aid uuid:='66666666-6666-4666-8666-666666666666';
begin
 begin
  update private.b7_ad_media_receipts
   set approval_state='private_quarantined' where asset_id=aid;
  raise exception 'TRIGGER_ALLOWED_RECEIPT_UPDATE';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_MEDIA_AUDIT_APPEND_ONLY'
  then raise exception 'DANGEROUS_UPDATE_TRIGGER_BYPASS: %',msg;end if;
 end;
 begin
  delete from private.b7_ad_media_receipts where asset_id=aid;
  raise exception 'TRIGGER_ALLOWED_RECEIPT_DELETE';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_MEDIA_AUDIT_APPEND_ONLY'
  then raise exception 'DANGEROUS_DELETE_TRIGGER_BYPASS: %',msg;end if;
 end;
 begin
  delete from private.b7_ad_media_orphan_events where asset_id=aid;
  raise exception 'TRIGGER_ALLOWED_ORPHAN_ERASURE';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'B7_MEDIA_AUDIT_APPEND_ONLY'
  then raise exception 'DANGEROUS_ORPHAN_TRIGGER_BYPASS: %',msg;end if;
 end;
 raise notice 'PASS [ADS-015] even hypothetical widened service_role DML/RLS cannot erase audit (transaction rollback)';
end $trigger_probe$;
reset role;
do $final$
begin
 if (select count(*) from private.b7_ad_media_receipts)<>1
 then raise exception 'LEDGER_CANONICAL_ROW_LOST';end if;
 if exists(select 1 from public.ad_creatives where creative_type='image' and approved)
 then raise exception 'PENDING_IMAGE_PREAPPROVED';end if;
 raise notice 'PASS [ADS-015] original Creative SOT unchanged and review-only media ledger append-only, no B5 alteration';
end $final$;
rollback;
