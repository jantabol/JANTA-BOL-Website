\set ON_ERROR_STOP on
-- ADS-056: EXACT reviewed RLS policy topology fixture (NOT live contents).
-- Use the original B7 payment fixture for anon/authenticated/service_role
-- and private.p4_owner_allowed, then reconstruct storage policy shape.
create schema storage;
create table storage.buckets(
 id text primary key,name text not null,public boolean not null
);
create table storage.objects(
 id integer primary key,bucket_id text references storage.buckets(id),
 name text not null,contents text not null default 'synthetic_only'
);
insert into storage.buckets(id,name,public) values
 ('public-media','public-media',true),
 ('private-editorial','private-editorial',false),
 ('grievance-private','grievance-private',false);
insert into storage.objects(id,bucket_id,name) values
 (11,'public-media','synthetic-news-cover.png'),
 (12,'private-editorial','synthetic-owner-only-evidence.pdf'),
 (13,'grievance-private','synthetic-grievance-proof.pdf');

create or replace function private.current_owner_aal2()
returns boolean language sql stable
as $owner$ select coalesce(current_setting('b7.test_owner',true),'')='enabled' $owner$;
grant usage on schema storage to anon,authenticated,service_role;
grant select,insert,update,delete on storage.objects
 to anon,authenticated,service_role;
alter table storage.objects enable row level security;

-- Reproduce exact LIVE policies read-only inspected on 2026-10-10.
create policy b5_private_gateway_only on storage.objects
 as permissive for all to anon,authenticated
 using(bucket_id <> 'grievance-private')
 with check(bucket_id <> 'grievance-private');
create policy owner_manage_private_editorial on storage.objects
 as permissive for all to authenticated
 using(bucket_id='private-editorial' and private.current_owner_aal2())
 with check(bucket_id='private-editorial' and private.current_owner_aal2());
create policy owner_manage_public_media on storage.objects
 as permissive for all to authenticated
 using(bucket_id='public-media' and private.current_owner_aal2())
 with check(bucket_id='public-media' and private.current_owner_aal2());
create policy owner_read_private_editorial on storage.objects
 as permissive for select to authenticated
 using(bucket_id='private-editorial' and private.current_owner_aal2());
