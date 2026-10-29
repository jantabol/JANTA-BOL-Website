\set ON_ERROR_STOP on
-- Disposable GitHub Actions database ONLY, not a production copy.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin;
create schema private;
create schema auth;
create extension if not exists pgcrypto;
create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;
create function private.p4_owner_allowed()
returns boolean language sql stable as $$select coalesce(current_setting('b7.test_owner',true),'')='enabled'$$;
create table public.articles(id uuid primary key,status text not null);
create table public.ad_packages(
 id uuid primary key,name text,placement text,active boolean default true,
 price_minor bigint,currency text default 'INR',duration_days int,version int default 1
);
create table public.advertisers(
 id uuid primary key default gen_random_uuid(), name text not null,
 contact text not null,verification_state text default 'pending',
 risk_level text default 'normal',created_at timestamptz default now(),
 updated_at timestamptz default now()
);
create table public.ad_campaigns(
 id uuid primary key default gen_random_uuid(),
 advertiser_id uuid references public.advertisers(id) not null,
 package_id uuid,status text default 'requested',placement text default 'homepage',
 scope text default 'global',request_kind text default 'standard',
 approved_at timestamptz, paid_at timestamptz,
 package_snapshot jsonb default '{}'::jsonb,
 created_at timestamptz default now()
);
create table public.ad_history(
 id bigint generated always as identity,campaign_id uuid,
 event_type text not null,note text not null default '',
 actor_user_id uuid,
 created_at timestamptz default now()
);
create table public.audit_logs(
 id bigint generated always as identity,actor_user_id uuid,action text,
 record_type text,record_id text,metadata jsonb default '{}'::jsonb,
 created_at timestamptz default now()
);
insert into public.articles(id,status) values
('10000000-0000-0000-0000-000000000001','published'),
('10000000-0000-0000-0000-000000000002','draft');
