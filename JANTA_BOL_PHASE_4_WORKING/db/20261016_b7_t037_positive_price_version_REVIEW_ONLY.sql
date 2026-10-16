-- JANTA BOL P4-T037 ADS024/027 REVIEW ONLY, not production.
-- Additive protected price and historical snapshot check, never overwrite
-- old package prices, old versions, LIVE status or campaign agreements.
-- Verify exact current prod function/constraints and existing legacy rows
-- independently before any authorized production application.
begin;
do $gate$
begin
 if to_regclass('public.ad_packages') is null
 or to_regclass('public.ad_package_versions') is null
 or to_regprocedure('private.p4_owner_allowed()') is null
 then raise exception 'T037_PACKAGE_PRICE_LIVE_SCHEMA_NOT_RECONCILED';end if;
 if exists(select 1 from public.ad_packages where price_minor is null or price_minor<=0)
 or exists(select 1 from public.ad_package_versions where price_minor is null or price_minor<=0)
 then raise exception 'T037_EXISTING_ZERO_PRICE_NEEDS_OWNER_DISPOSITION';end if;
 if exists(select 1 from pg_constraint where conrelid='public.ad_packages'::regclass
 and conname='b7_package_positive_price')
 then raise exception 'T037_PRICE_GUARD_ALREADY_PRESENT_REVIEW_DIFF';end if;
end $gate$;

-- Original "price_minor >= 0" is looser than Founder ADS024 contract.
-- Secondary positive check guards even service-side direct INSERT/UPDATE.
alter table public.ad_packages
 add constraint b7_package_positive_price
 check (price_minor > 0);
alter table public.ad_package_versions
 add constraint b7_package_version_positive_price
 check (price_minor > 0);

create function private.b7_package_version_append_only_guard()
returns trigger language plpgsql security definer
set search_path to 'pg_catalog'
as $append$
begin
 raise exception 'B7_PACKAGE_VERSION_IMMUTABLE' using errcode='42501';
end $append$;
revoke all on function private.b7_package_version_append_only_guard()
 from public,anon,authenticated;
create trigger b7_package_version_append_only_guard
before update or delete on public.ad_package_versions
for each row execute function private.b7_package_version_append_only_guard();
commit;
