\set ON_ERROR_STOP on
-- BE10 additive disposable PostgreSQL fixtures: require existing B7 enquiry
-- Owner verification RPC, DO NOT alter existing shared fixture or old tests.
alter table public.ad_campaigns
 add column if not exists hidden_at timestamptz,
 add column if not exists updated_at timestamptz default now();
create table public.ad_portal_credentials(
 campaign_id uuid primary key references public.ad_campaigns(id),
 login_id text not null,secret_hash text,
 issued_at timestamptz not null default now(),
 revoked_at timestamptz
);
create table public.ad_portal_sessions(
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references public.ad_campaigns(id),
 token_hash text unique not null,
 expires_at timestamptz not null,
 revoked_at timestamptz,
 created_at timestamptz not null default now()
);
insert into public.advertisers(
 id,name,contact,risk_level,verification_state
) values
 ('a0000000-0000-0000-0000-000000000001','Shop A','+919876543211','normal','verified'),
 ('b0000000-0000-0000-0000-000000000002','Shop B','+919876543212','normal','verified'),
 ('c0000000-0000-0000-0000-000000000003','High risk C','+919876543213','high','pending');
insert into public.ad_campaigns(id,advertiser_id,status,placement,scope)
values
 ('a1000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','live','article','global'),
 ('a2000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001','paused','article','global'),
 ('b1000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002','live','article','global'),
 ('c1000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000003','approved','article','global');
insert into public.ad_portal_credentials(campaign_id,login_id,secret_hash)
values
 ('a1000000-0000-0000-0000-000000000001','JB-A1','synthetic-hash-A1'),
 ('a2000000-0000-0000-0000-000000000002','JB-A2','synthetic-hash-A2'),
 ('b1000000-0000-0000-0000-000000000001','JB-B1','synthetic-hash-B1');
insert into public.ad_portal_sessions(campaign_id,token_hash,expires_at)
values
 ('a1000000-0000-0000-0000-000000000001','fake-token-sha256-A1',now()+interval '2 hours'),
 ('a2000000-0000-0000-0000-000000000002','fake-token-sha256-A2',now()+interval '2 hours'),
 ('b1000000-0000-0000-0000-000000000001','fake-token-sha256-B1',now()+interval '2 hours');
