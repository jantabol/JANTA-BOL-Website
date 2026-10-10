\set ON_ERROR_STOP on
-- Disposable PostgreSQL 17 fixture for P4-T039 text-change boundary.
-- This is NOT production Supabase role/AAL2 parity.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin;
create schema private;
create schema auth;
create schema extensions;
create extension if not exists pgcrypto with schema extensions;
create function auth.uid() returns uuid language sql stable
as $uid$ select '11111111-1111-1111-1111-111111111111'::uuid $uid$;
create function private.p4_owner_allowed() returns boolean language sql stable
as $owner$ select coalesce(current_setting('b7.test_owner',true),'')='enabled' $owner$;

create table public.ad_campaigns(
 id uuid primary key, status text not null,placement text not null,
 scope text not null, starts_at timestamptz,ends_at timestamptz
);
create table public.ad_creatives(
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references public.ad_campaigns(id),
 creative_type text not null,media_url text,text_body text,cta_type text,
 cta_target text,label text not null default 'विज्ञापन',
 version int not null default 1,approved boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.ad_portal_credentials(
 campaign_id uuid primary key references public.ad_campaigns(id),
 login_id text not null unique,secret_hash text,
 issued_at timestamptz not null default now(),
 revoked_at timestamptz
);
create table public.ad_portal_sessions(
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references public.ad_campaigns(id),
 token_hash text not null unique,
 expires_at timestamptz not null,
 revoked_at timestamptz,created_at timestamptz not null default now()
);
create table public.ad_renewal_requests(
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
 requested_by uuid not null,requested_end_at timestamptz not null,
 status text not null default 'pending' check(status in('pending','approved','rejected')),
 created_at timestamptz not null default now(),
 decided_at timestamptz
);
create table public.ad_history(
 id bigint generated always as identity,
 campaign_id uuid, event_type text not null,
 note text not null default '',actor_user_id uuid,
 created_at timestamptz not null default now()
);
create table public.audit_logs(
 id bigint generated always as identity,
 actor_user_id uuid,action text not null,record_type text not null,
 record_id text,metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
insert into public.ad_campaigns(id,status,placement,scope,starts_at,ends_at)
values
 ('aaaaaaaa-0000-0000-0000-000000000001','live','article','district:shivpuri',now()-interval '1 day',now()+interval '7 days'),
 ('bbbbbbbb-0000-0000-0000-000000000002','paid','article','district:guna',now()+interval '1 day',now()+interval '7 days'),
 ('cccccccc-0000-0000-0000-000000000003','cancelled','article','global',null,null);
insert into public.ad_creatives(id,campaign_id,creative_type,text_body,version,approved)
values
 ('aaaaaaaa-1000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','text','ACTIVE-A',1,true),
 ('aaaaaaaa-2000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000001','text','UNAPPROVED-A',2,false),
 ('bbbbbbbb-1000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002','text','ACTIVE-B',1,true);
insert into public.ad_portal_credentials(campaign_id,login_id,secret_hash)
values
 ('aaaaaaaa-0000-0000-0000-000000000001','JB-A',extensions.crypt('test-secret-A',extensions.gen_salt('bf',10))),
 ('bbbbbbbb-0000-0000-0000-000000000002','JB-B',extensions.crypt('test-secret-B',extensions.gen_salt('bf',10))),
 ('cccccccc-0000-0000-0000-000000000003','JB-C',extensions.crypt('test-secret-C',extensions.gen_salt('bf',10)));
insert into public.ad_portal_sessions(campaign_id,token_hash,expires_at,revoked_at)
values
 ('aaaaaaaa-0000-0000-0000-000000000001',encode(extensions.digest(repeat('a',48),'sha256'),'hex'),now()+interval '2 hours',null),
 ('bbbbbbbb-0000-0000-0000-000000000002',encode(extensions.digest(repeat('b',48),'sha256'),'hex'),now()+interval '2 hours',null),
 ('cccccccc-0000-0000-0000-000000000003',encode(extensions.digest(repeat('c',48),'sha256'),'hex'),now()-interval '1 hour',null);

-- Historical JWT-backed renewal must remain valid after adding portal support.
insert into public.ad_renewal_requests(
 campaign_id,requested_by,requested_end_at,status
) values(
 'bbbbbbbb-0000-0000-0000-000000000002',
 '11111111-1111-1111-1111-111111111111',
 now()+interval '10 days','approved'
);
