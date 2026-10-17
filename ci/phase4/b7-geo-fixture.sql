\set ON_ERROR_STOP on
-- Synthetic B7 Geo fixture in isolated PostgreSQL only.
-- Codes 101/102/103/104 and 201/202/203 are TEST identifiers, NOT LGD data.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin;
create schema private;
create schema auth;
create function auth.uid() returns uuid language sql stable
 as $uid$select '99999999-9999-9999-9999-999999999999'::uuid$uid$;
create function private.p4_owner_allowed() returns boolean language sql stable
 as $owner$select coalesce(current_setting('b7.test_owner',true),'')='enabled'$owner$;
create table public.articles(
 id uuid primary key,status text not null,
 district text,geography_level text,location text,
 title text,slug text
);
create table public.ad_campaigns(
 id uuid primary key,status text not null,
 paid_at timestamptz,scope text not null default 'global',
 package_snapshot jsonb not null default '{}'::jsonb
);
create table public.ad_payments(
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references public.ad_campaigns(id),
 status text not null
);
create table public.ad_history(
 id bigint generated always as identity,
 campaign_id uuid,event_type text,note text not null default '',
 actor_user_id uuid,created_at timestamptz default now()
);
create table public.audit_logs(
 id bigint generated always as identity,
 actor_user_id uuid,action text,record_type text,record_id text,
 metadata jsonb default '{}'::jsonb,
 created_at timestamptz default now()
);
insert into public.articles(id,status,district,geography_level,location,title,slug)
values
 ('10000000-0000-0000-0000-000000000001','published','Shivpuri','Local-Pichhore','Pichhore','Pichhore TEST article','a1'),
 ('10000000-0000-0000-0000-000000000002','published','Shivpuri','MP','Shivpuri','District-only TEST article','a2'),
 ('10000000-0000-0000-0000-000000000003','published','Gwalior','MP','Gwalior','Gwalior TEST article','a3'),
 ('10000000-0000-0000-0000-000000000004','published',null,'MP',null,'MP State TEST article','a4'),
 ('10000000-0000-0000-0000-000000000005','published',null,'India',null,'National TEST article','a5'),
 ('10000000-0000-0000-0000-000000000006','published',null,null,null,'Unknown TEST article','a6'),
 ('10000000-0000-0000-0000-000000000007','draft','Shivpuri','MP',null,'Unpublished TEST','a7'),
 ('10000000-0000-0000-0000-000000000008','published','Gwalior','MP',null,'Contradiction TEST','a8');
insert into public.ad_campaigns(id,status,paid_at)
values
 ('20000000-0000-0000-0000-000000000001','approved',null), -- Pichhore tehsil
 ('20000000-0000-0000-0000-000000000002','approved',null), -- Shivpuri district
 ('20000000-0000-0000-0000-000000000003','approved',null), -- Gwalior district
 ('20000000-0000-0000-0000-000000000004','approved',null), -- MP state
 ('20000000-0000-0000-0000-000000000005','approved',null), -- National, explicit unknown
 ('20000000-0000-0000-0000-000000000006','approved',null), -- Multiple districts
 ('20000000-0000-0000-0000-000000000007','paid',now()),    -- Paid, no change
 ('20000000-0000-0000-0000-000000000008','approved',null), -- National, no unknown
 ('20000000-0000-0000-0000-000000000009','requested',null); -- Unverified scope negative
