\set ON_ERROR_STOP on
begin;
insert into storage.objects(id,bucket_id,name) values
 (101,'jb-ad-video-originals-private','staged/raw.mp4'),
 (102,'jb-ad-videos-private','staged/clean.mp4'),
 (103,'jb-ad-video-posters-private','staged/poster.png');
do $pre$
begin
 if (select count(*) from pg_policies where schemaname='storage'
  and tablename='objects' and permissive='RESTRICTIVE' and policyname in(
  'b5_private_gateway_only','b7_private_stage_server_only',
  'b7_video_stage_server_only'))<>3
 then raise exception 'B5_OR_IMAGE_OR_VIDEO_RESTRICTIVE_POLICY_MISSING';end if;
 if exists(select 1 from storage.buckets where id in(
  'jb-ad-video-originals-private','jb-ad-videos-private',
  'jb-ad-video-posters-private') and public)
 then raise exception 'PRIVATE_VIDEO_BUCKET_PUBLIC';end if;
 raise notice 'PASS [ADS-015/056] B5 and both image/video RLS restrictive gates preserved';
end $pre$;
set local role anon;
do $deny$
declare n integer;
begin
 select count(*) into n from storage.objects where bucket_id like 'jb-ad-%';
 if n<>0 then raise exception 'ANON_CAN_READ_PRIVATE_AD_MEDIA';end if;
 raise notice 'PASS [ADS-011] public cannot read any of the three private video objects';
end $deny$;
reset role;
select set_config('b7.test_owner','enabled',false);
set local role authenticated;
do $owner$
declare n integer;msg text;
begin
 select count(*) into n from storage.objects where bucket_id in(
  'private-editorial','public-media');
 if n<>2 then raise exception 'ORIGINAL_EDITORIAL_POLICY_REGRESSION';end if;
 select count(*) into n from storage.objects where bucket_id like 'jb-ad-%';
 if n<>0 then raise exception 'OWNER_BROWSER_PRIVATE_VIDEO_READ_ALLOWED';end if;
 begin
  insert into storage.objects(id,bucket_id,name)
   values(104,'jb-ad-videos-private','forged.mp4');
  raise exception 'OWNER_DIRECT_VIDEO_WRITE_ALLOWED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg not like '%row-level security%' and
     msg not like '%permission denied%'
  then raise exception 'OWNER_VIDEO_WRITE_DENIAL_UNEXPECTED: %',msg;end if;
 end;
 raise notice 'PASS [ADS-056] Owner direct video upload denied; prior editorial access retained';
end $owner$;
reset role;
-- Deliberately grant an over-broad PERMISSIVE policy for this disposable
-- transaction only. A RESTRICTIVE policy MUST still deny the video.
create policy b7_ci_broad_video_grant on storage.objects
 as permissive for all to authenticated using(true) with check(true);
set local role authenticated;
do $broad$
declare n integer;
begin
 select count(*) into n from storage.objects
 where bucket_id in('jb-ad-video-originals-private',
 'jb-ad-videos-private','jb-ad-video-posters-private');
 if n<>0 then raise exception 'BROAD_POLICY_BYPASSED_VIDEO_QUARANTINE';end if;
 raise notice 'PASS [ADS-056] permissive OR does not bypass 3 video bucket RESTRICTIVE AND gates';
end $broad$;
reset role;
rollback;
