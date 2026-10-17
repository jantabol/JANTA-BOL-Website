-- B7 SINGLE HOME for first-party clean Storage origin: image Owner approval
-- and video poster feed reuse the SAME configuration. REVIEW ONLY.
-- NO Production writes, no Owner enable without E3/E5/E7 and deployment parity.
begin;
do $pre$ begin
 if to_regclass('private.b7_ad_clean_public_origin') is not null
 then raise exception 'B7_CLEAN_ORIGIN_ALREADY_DEFINED_INDEPENDENT_REVIEW_REQUIRED';end if;
end $pre$;
-- Deployment origin is a secure DBA-controlled setting, NOT a user
-- parameter, JWT claim or advertiser-submitted URL. Disabled by DEFAULT.
create table private.b7_ad_clean_public_origin(
 singleton boolean primary key default true check(singleton),
 storage_origin text not null check(
  storage_origin ~ '^https://[a-z0-9-]+[.]supabase[.]co$'),
 enabled boolean not null default false,
 created_at timestamptz not null default now()
);
alter table private.b7_ad_clean_public_origin enable row level security;
revoke all on private.b7_ad_clean_public_origin
 from public,anon,authenticated,service_role;
-- No client can read, enable or change approved clean origin.
commit;
