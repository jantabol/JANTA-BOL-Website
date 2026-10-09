\set ON_ERROR_STOP on
create role anon nologin;
create role authenticated nologin;
create role service_role nologin;
create schema private;
create table public.advertisers(id uuid primary key,risk_level text,verification_state text);
create table public.ad_campaigns(
 id uuid primary key,advertiser_id uuid references public.advertisers(id),
 status text,placement text,scope text,approved_at timestamptz,paid_at timestamptz,
 non_refund_accepted_at timestamptz,starts_at timestamptz,ends_at timestamptz
);
create table public.ad_creatives(
 id uuid primary key,campaign_id uuid references public.ad_campaigns(id),
 creative_type text,media_url text,text_body text,cta_type text,cta_target text,
 approved boolean default false,version int default 1,created_at timestamptz default now()
);
create table public.ad_payments(
 id uuid primary key,campaign_id uuid references public.ad_campaigns(id),
 status text,amount_minor bigint,provider_ref text
);
-- This fixture is deliberately isolated and NOT a full Supabase schema.
