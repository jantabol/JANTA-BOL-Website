\set ON_ERROR_STOP on
-- ADS-035..040 simulation only: disposable GitHub Actions PostgreSQL 17.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin;
create schema private;
create schema auth;
create function auth.uid() returns uuid language sql stable
as $uid$ select '11111111-1111-1111-1111-111111111111'::uuid $uid$;
create function private.p4_owner_allowed() returns boolean language sql stable
as $owner$ select coalesce(current_setting('b7.test_owner',true),'')='enabled' $owner$;

create table public.advertisers(
 id uuid primary key default gen_random_uuid(),name text not null,
 contact text not null,risk_level text default 'normal',
 verification_state text default 'pending'
);
create table public.ad_packages(
 id uuid primary key default gen_random_uuid(),
 name text,price_minor bigint,currency text default 'INR',
 placement text,weight integer,duration_days integer
);
create table public.ad_campaigns(
 id uuid primary key default gen_random_uuid(),
 advertiser_id uuid not null references public.advertisers(id),
 package_id uuid references public.ad_packages(id),
 package_snapshot jsonb not null default '{}'::jsonb,
 status text not null default 'requested',placement text default 'article',
 scope text default 'global',
 starts_at timestamptz, ends_at timestamptz,
 approved_by uuid,approved_at timestamptz,paid_at timestamptz,
 non_refund_accepted_at timestamptz,hidden_at timestamptz,
 created_at timestamptz default now(),updated_at timestamptz default now()
);
create table public.ad_creatives(
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid references public.ad_campaigns(id),
 approved boolean default false,creative_type text default 'text',text_body text
);
create table public.ad_payments(
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references public.ad_campaigns(id),
 status text not null default 'pending',provider_ref text,
 amount_minor bigint not null default 0,currency text not null default 'INR',
 created_at timestamptz default now(),updated_at timestamptz default now()
);
create table public.ad_history(
 id bigint generated always as identity,campaign_id uuid,
 event_type text not null,note text not null default '',
 actor_user_id uuid,created_at timestamptz default now()
);
create table public.audit_logs(
 id bigint generated always as identity,actor_user_id uuid,
 action text,record_type text,record_id text,metadata jsonb default '{}'::jsonb,
 created_at timestamptz default now()
);
insert into public.advertisers(id,name,contact,verification_state,risk_level)
values
 ('00000000-0000-0000-0000-000000000001','Verified business','+919876543210','verified','normal'),
 ('00000000-0000-0000-0000-000000000002','Pending high-risk','+919876543211','pending','high'),
 ('00000000-0000-0000-0000-000000000003','Second verified','+919876543212','verified','normal');
insert into public.ad_packages(id,name,price_minor,currency,placement,weight,duration_days)
values ('20000000-0000-0000-0000-000000000001','Article plan',50000,'INR','article',2,7);
insert into public.ad_campaigns(id,advertiser_id,package_id,package_snapshot,status,approved_at,approved_by,starts_at,ends_at)
values
 ('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','{"price_minor":50000,"version":1}','approved',now()-interval '1 day','11111111-1111-1111-1111-111111111111',now()-interval '1 hour',now()+interval '7 days'),
 ('30000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002',null,'{}','approved',now()-interval '1 day','11111111-1111-1111-1111-111111111111',now()-interval '1 hour',now()+interval '7 days'),
 ('30000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000003',null,'{}','approved',now()-interval '1 day','11111111-1111-1111-1111-111111111111',now()-interval '1 hour',now()+interval '7 days'),
 ('30000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001',null,'{}','requested',null,null,null,null);
insert into public.ad_creatives(campaign_id,approved,creative_type,text_body)
values
 ('30000000-0000-0000-0000-000000000001',true,'text','Verified advertisement creative'),
 ('30000000-0000-0000-0000-000000000002',true,'text','Unverified risk campaign creative'),
 ('30000000-0000-0000-0000-000000000003',true,'text','Second verified creative');
