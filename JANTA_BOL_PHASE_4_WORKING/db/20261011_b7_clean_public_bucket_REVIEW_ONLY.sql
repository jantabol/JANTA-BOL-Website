-- B7 ADS-010/011 CLEAN FIRST-PARTY approved-asset bucket candidate.
-- REVIEW ONLY. Never apply LIVE without deliberate Founder Owner approval,
-- explicit signoff, genuine worker, safe public feed and E3/E5/E7 proof.
-- Public bucket means files may be publicly readable by guessed URL once
-- uploaded. ONLY server-controlled sanitized derivatives are allowed.
-- No originals/Editorial/B5 evidence may ever be copied here.
begin;
do $pre$
begin
 if to_regclass('storage.buckets') is null or
    to_regclass('storage.objects') is null
 then raise exception 'STORAGE_SOURCE_REQUIRED';end if;
 if not exists(select 1 from pg_policies where schemaname='storage'
   and tablename='objects' and policyname='b5_private_gateway_only'
   and permissive='RESTRICTIVE')
  or not exists(select 1 from pg_policies where schemaname='storage'
   and tablename='objects' and policyname='b7_private_stage_server_only'
   and permissive='RESTRICTIVE')
  or not exists(select 1 from pg_policies where schemaname='storage'
   and tablename='objects' and policyname='b7_video_stage_server_only'
   and permissive='RESTRICTIVE')
 then raise exception 'B7_PREVIOUS_MEDIA_OR_B5_RLS_SOURCE_DRIFT';end if;
 if exists(select 1 from storage.buckets where id='jb-ad-clean-public')
 then raise exception 'B7_FIRST_PARTY_BUCKET_ALREADY_EXISTS_RECONCILE';end if;
end $pre$;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('jb-ad-clean-public','jb-ad-clean-public',true,8388608,
 array['image/png','video/mp4']::text[]);
-- Browser JWTs must NEVER INSERT/UPDATE/DELETE even if future broad
-- permissive policies accidentally allow writes to all public media.
-- We deliberately do not gate SELECT: public download of approved
-- material is a separate Storage service behavior, not a direct SQL grant.
create policy b7_clean_public_no_client_insert on storage.objects
 as restrictive for insert to anon,authenticated
 with check(bucket_id<>'jb-ad-clean-public');
create policy b7_clean_public_no_client_update on storage.objects
 as restrictive for update to anon,authenticated
 using(bucket_id<>'jb-ad-clean-public')
 with check(bucket_id<>'jb-ad-clean-public');
create policy b7_clean_public_no_client_delete on storage.objects
 as restrictive for delete to anon,authenticated
 using(bucket_id<>'jb-ad-clean-public');
do $assert$
begin
 if (select count(*) from storage.buckets
  where id='jb-ad-clean-public' and public=true
    and file_size_limit=8388608
    and allowed_mime_types @> array['image/png','video/mp4']::text[])<>1
 then raise exception 'B7_CLEAN_BUCKET_DEFINITION_DRIFT';end if;
 if (select count(*) from pg_policies
  where schemaname='storage' and tablename='objects'
   and permissive='RESTRICTIVE' and policyname in(
    'b7_clean_public_no_client_insert',
    'b7_clean_public_no_client_update',
    'b7_clean_public_no_client_delete'))<>3
 then raise exception 'B7_CLEAN_BUCKET_CLIENT_WRITES_NOT_RESTRICTED';end if;
 if not exists(select 1 from pg_policies where schemaname='storage'
   and tablename='objects' and policyname='b5_private_gateway_only'
   and permissive='RESTRICTIVE')
 then raise exception 'B5_PROTECTED_POLICY_CHANGED';end if;
end $assert$;
commit;
