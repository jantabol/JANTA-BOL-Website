\set ON_ERROR_STOP on
-- Companion to existing B7 payment fixture, disposable PostgreSQL 17 ONLY.
-- No official LGD codes: '101' district is a synthetic code, not MP official.
alter table public.ad_creatives
 add column media_url text,add column cta_type text,add column cta_target text,
 add column version integer not null default 1,
 add column created_at timestamptz not null default now();
create table public.articles(
 id uuid primary key,status text not null,district text,geography_level text);
create table public.ad_package_versions(
 id bigint generated always as identity primary key,
 package_id uuid not null references public.ad_packages(id),
 version integer not null,
 name text not null,placement text not null,
 price_minor bigint not null,currency text not null default 'INR',
 duration_days integer not null,weight integer not null,
 created_at timestamptz not null default now(),
 unique(package_id,version)
);

-- Three eligible plans: 1:2:3 weights. Fourth high-risk campaign remains blocked
-- by inherited verification fixture. All amounts and receipts are SYNTHETIC.
insert into public.ad_packages(
 id,name,price_minor,currency,placement,weight,duration_days
) values
 ('20000000-0000-0000-0000-000000000002','Weight 1 TEST',50000,'INR','article',1,7),
 ('20000000-0000-0000-0000-000000000003','Weight 3 TEST',50000,'INR','article',3,7);
insert into public.ad_package_versions(
 package_id,version,name,placement,price_minor,currency,duration_days,weight
)
select id,1,name,placement,price_minor,currency,duration_days,weight
from public.ad_packages;
insert into public.articles(id,status,district,geography_level) values
 ('10000000-0000-0000-0000-000000000001','published','Shivpuri','MP'),
 ('10000000-0000-0000-0000-000000000002','published','Gwalior','MP'),
 ('10000000-0000-0000-0000-000000000003','published',null,null),
 ('10000000-0000-0000-0000-000000000004','draft','Shivpuri','MP');
insert into public.ad_campaigns(
 id,advertiser_id,package_id,package_snapshot,status,
 placement,scope,approved_at,approved_by,starts_at,ends_at
) values
 ('30000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000002',
  '{"version":1,"price_minor":50000}'::jsonb,'approved',
  'article','global',now()-interval '1 day',
  '11111111-1111-1111-1111-111111111111',
  now()-interval '1 hour',now()+interval '7 days'),
 ('30000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000003',
  '{"version":1,"price_minor":50000}'::jsonb,'approved',
  'article','global',now()-interval '1 day',
  '11111111-1111-1111-1111-111111111111',
  now()-interval '1 hour',now()+interval '7 days');
insert into public.ad_creatives(
 id,campaign_id,creative_type,text_body,approved,version
) values
 ('40000000-0000-0000-0000-000000000005',
  '30000000-0000-0000-0000-000000000005',
  'text','Weight 1 approved business ad',true,1),
 ('40000000-0000-0000-0000-000000000006',
  '30000000-0000-0000-0000-000000000006',
  'text','Weight 3 approved business ad',true,1);

