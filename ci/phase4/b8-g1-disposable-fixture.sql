\set ON_ERROR_STOP on
-- B8 G1 isolated PostgreSQL17 ONLY. NEVER against JANTA BOL / Cricket production.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin;
create schema auth;
create schema private;
create type public.app_role as enum ('owner','admin','editor','reporter');
create table public.user_roles (
 user_id uuid primary key,role public.app_role not null
);
create table public.team_accounts(
 user_id uuid primary key,assigned_role public.app_role not null,
 status text not null
);
-- The only simulated part: Supabase auth.uid(), AAL and active-session supplier.
-- Real app uses existing private.current_session_active and current_owner_aal2.
create function auth.uid() returns uuid language sql stable
as $$ select nullif(current_setting('b8.fixture_actor',true),'')::uuid $$;
create function private.current_session_active() returns boolean language sql stable
as $$ select coalesce(current_setting('b8.fixture_session',true),'')='on' $$;
create function private.current_owner_aal2() returns boolean language sql stable
as $$
 select private.current_session_active()
 and coalesce(current_setting('b8.fixture_aal',true),'')='aal2'
 and exists (select 1 from public.user_roles u where u.user_id=auth.uid()
             and u.role='owner'::public.app_role)
$$;
create function private.p4_staff_allowed() returns boolean language sql stable
as $$
 select private.current_session_active()
 and exists (
 select 1 from public.user_roles u join public.team_accounts t on t.user_id=u.user_id
 where u.user_id=auth.uid() and t.status='active'
 and u.role in('editor'::public.app_role,'admin'::public.app_role))
$$;
grant usage on schema auth,private,public to authenticated;
grant execute on function auth.uid() to authenticated;
grant execute on function private.current_session_active() to authenticated;
grant execute on function private.current_owner_aal2() to authenticated;
grant execute on function private.p4_staff_allowed() to authenticated;

insert into public.user_roles(user_id,role) values
('11111111-1111-1111-1111-111111111111','owner'),
('22222222-2222-2222-2222-222222222222','reporter'),
('33333333-3333-3333-3333-333333333333','reporter'),
('44444444-4444-4444-4444-444444444444','editor');
insert into public.team_accounts(user_id,assigned_role,status) values
('22222222-2222-2222-2222-222222222222','reporter','active'),
('33333333-3333-3333-3333-333333333333','reporter','active'),
('44444444-4444-4444-4444-444444444444','editor','active');

-- B8 must not modify originals even by importing candidate DDL.
create table public.articles (
 id uuid primary key,status text not null,headline text not null
);
insert into public.articles(id,status,headline)
 values('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','published','Existing News Article');
create table public.ad_campaigns (
 id uuid primary key,status text not null
);
insert into public.ad_campaigns(id,status) values
 ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','requested');
