\set ON_ERROR_STOP on
-- Companion to existing b7-payment-fixture.sql in disposable PostgreSQL.
-- Explicitly SYNTHETIC inventory/purchase data, no traffic forecasts asserted.
insert into public.ad_campaigns(
 id,advertiser_id,package_id,package_snapshot,status,placement,scope,
 approved_at,approved_by,starts_at,ends_at
) values(
 '30000000-0000-0000-0000-000000000005',
 '00000000-0000-0000-0000-000000000003',
 null,'{}','approved','article','global',
 now()-interval '1 day','11111111-1111-1111-1111-111111111111',
 now()-interval '1 hour',now()+interval '7 days'
);
