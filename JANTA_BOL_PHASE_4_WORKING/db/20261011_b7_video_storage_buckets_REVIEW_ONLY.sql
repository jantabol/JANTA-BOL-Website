-- B7 ADS-011 video private storage: 3 dedicated buckets + fail-closed AND.
-- REVIEW ONLY, disposable CI only. NO Production migration without Founder
-- authorization, isolated secrets, queue, E3/E5 and rollback evidence.
-- Preserve B5 grievance RESTRICTIVE and original image B7 private policies.
begin;
do $guard$
begin
 if not exists(select 1 from pg_policies where schemaname='storage' and
  tablename='objects' and policyname='b5_private_gateway_only' and
  permissive='RESTRICTIVE')
 then raise exception 'B5_STORAGE_AUTHORITY_SOURCE_CHANGED';end if;
 if not exists(select 1 from pg_policies where schemaname='storage' and
  tablename='objects' and policyname='b7_private_stage_server_only' and
  permissive='RESTRICTIVE')
 then raise exception 'B7_ORIGINAL_IMAGE_STORAGE_POLICY_MISSING';end if;
 if exists(select 1 from storage.buckets where id in(
 'jb-ad-video-originals-private','jb-ad-videos-private',
 'jb-ad-video-posters-private'))
 then raise exception 'B7_VIDEO_BUCKET_ALREADY_EXISTS_RECONCILE_FIRST';end if;
end $guard$;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values
 ('jb-ad-video-originals-private','jb-ad-video-originals-private',false,
  8388608,array['video/mp4']::text[]),
 ('jb-ad-videos-private','jb-ad-videos-private',false,
  8388608,array['video/mp4']::text[]),
 ('jb-ad-video-posters-private','jb-ad-video-posters-private',false,
  2097152,array['image/png']::text[]);
create policy b7_video_stage_server_only on storage.objects
 as restrictive for all to anon,authenticated
 using(bucket_id not in('jb-ad-video-originals-private','jb-ad-videos-private',
 'jb-ad-video-posters-private'))
 with check(bucket_id not in('jb-ad-video-originals-private','jb-ad-videos-private',
 'jb-ad-video-posters-private'));
do $proof$
begin
 if (select count(*) from storage.buckets
 where id in('jb-ad-video-originals-private','jb-ad-videos-private',
 'jb-ad-video-posters-private') and public=false)<>3
 then raise exception 'VIDEO_BUCKET_PRIVACY_NOT_PROVEN';end if;
 if not exists(select 1 from pg_policies where schemaname='storage'
  and tablename='objects' and policyname='b7_video_stage_server_only'
  and permissive='RESTRICTIVE' and cmd='ALL'
  and roles @> array['anon','authenticated']::name[])
 then raise exception 'VIDEO_BUCKET_RESTRICTIVE_DENIAL_NOT_INSTALLED';end if;
end $proof$;
commit;
