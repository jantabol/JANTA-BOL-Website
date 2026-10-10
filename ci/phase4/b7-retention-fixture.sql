\set ON_ERROR_STOP on
-- Disposable PostgreSQL 17 only. Reuse b7-payment-fixture.sql first.
-- The source B3 tables/policy are simulated to test the B7 trigger's
-- compatibility; THIS IS NOT a proof against real LIVE B3 permissions.
-- Unlike the older payment fixture's fixed Owner identity, this separate
-- retention job needs to model anonymous requests with auth.uid() IS NULL.
create or replace function auth.uid() returns uuid language sql stable
as $uid$ select nullif(current_setting('b7.test_actor_uid',true),'')::uuid $uid$;

-- Owner version immutability is tested here only. The shared payment fixture
-- is left byte-for-byte unchanged so weighted/geo/portal/legacy jobs survive.
alter table public.ad_creatives
 add column version integer not null default 1,
 add column media_url text,
 add column cta_type text,
 add column cta_target text,
 add column created_at timestamptz not null default now();

create table public.record_retention_policies(
 policy_key text primary key,domain text not null,record_type text not null,
 default_retention_days integer,
 automatic_disposition boolean not null default false,
 active boolean not null default true
);
create table public.record_retention_state(
 domain text not null,record_type text not null,record_id text not null,
 policy_key text,
 lifecycle_state text not null default 'active',
 retention_due_at timestamptz,extension_until timestamptz,
 hold_active boolean not null default false,
 hold_reason text,hold_set_at timestamptz,hold_set_by uuid,
 archived_at timestamptz,disposed_at timestamptz,
 updated_by uuid,updated_at timestamptz not null default now(),
 primary key(domain,record_type,record_id)
);
create table public.record_retention_history(
 id bigint generated always as identity primary key,
 domain text not null,record_type text not null,record_id text not null,
 action text not null,old_state jsonb not null default '{}'::jsonb,
 new_state jsonb not null default '{}'::jsonb,reason text,
 actor_user_id uuid,metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
insert into public.record_retention_policies(
 policy_key,domain,record_type,default_retention_days,
 automatic_disposition,active
) values('ads_history_v1','ads','ad_history',2555,false,true);


-- Two history events predate B7 retention integration:
-- one requires backfill and one has a pre-existing Founder legal hold.
insert into public.ad_history(
 campaign_id,event_type,note,actor_user_id,created_at
) values
 ('30000000-0000-0000-0000-000000000004',
  'legacy_missing_registry','Old but still binding evidence',
  null,now()-interval '60 days'),
 ('30000000-0000-0000-0000-000000000004',
  'legacy_held_record','Historical legal hold evidence',
  null,now()-interval '30 days');

insert into public.record_retention_state(
 domain,record_type,record_id,policy_key,lifecycle_state,
 retention_due_at,hold_active,hold_reason,updated_at
)
select 'ads','ad_history',h.id::text,'ads_history_v1','hold',
       now()+interval '100 days',true,'PREEXISTING_TEST_LEGAL_HOLD',now()
from public.ad_history h where h.event_type='legacy_held_record';
