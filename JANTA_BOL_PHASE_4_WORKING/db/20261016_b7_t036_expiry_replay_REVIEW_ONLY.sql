-- JANTA BOL / P4-T036 CP03 — ADS017 ADS023 expiration + replay.
-- REVIEW ONLY, isolated PostgreSQL 17 CI. DO NOT DEPLOY to Supabase.
-- NOT scheduled in pg_cron: separate Founder first-PAID-LIVE release gate.
-- Existing Owner schedule/lifecycle/payment guards stay in place.
begin;
do $preflight$
begin
 if to_regclass('public.ad_campaigns') is null
 or to_regclass('public.ad_history') is null
 or to_regclass('public.audit_logs') is null
 or to_regprocedure('private.p4_owner_allowed()') is null
 then raise exception 'T036_CP03_REQUIRED_ORIGINAL_SCHEMA_MISSING';end if;
 if to_regprocedure('private.b7_ad_expire_due_core(integer)') is not null
 then raise exception 'T036_CP03_ALREADY_EXISTS_REQUIRE_INDEPENDENT_DIFF';end if;
 if not exists(select 1 from pg_roles where rolname='service_role')
 then raise exception 'T036_CP03_SERVICE_ROLE_MISSING';end if;
end $preflight$;

-- A DB-owned worker, not a public HTTP/Owner endpoint.
-- Runs a bounded batch; locks per candidate so concurrent retries cannot
-- expire the same campaign or append duplicate history/audit.
-- History and state are in ONE atomic statement transaction: if audit insert
-- fails, this whole function call fails and rolls back all its state changes.
-- Caller cannot inject dates or user IDs. Server clock is sole authority.
create function private.b7_ad_expire_due_core(p_limit integer default 50)
returns integer language plpgsql security definer
set search_path to 'pg_catalog'
as $core$
declare r record;
 v_changed integer:=0;
begin
 if p_limit is null or p_limit<1 or p_limit>50
 then raise exception 'B7_EXPIRY_BATCH_LIMIT_INVALID' using errcode='22023';end if;
 for r in
  select id from public.ad_campaigns
  where status in('live','paused') and ends_at is not null
    and ends_at<=clock_timestamp()
  order by ends_at,id
  limit p_limit for update skip locked
 loop
  -- Revalidate after holding the row lock, and DO NOT change financial or
  -- original approval/history fields. Never convert HIDDEN to EXPIRED.
  update public.ad_campaigns
  set status='expired',updated_at=clock_timestamp()
  where id=r.id and status in('live','paused')
   and ends_at is not null and ends_at<=clock_timestamp();
  if not found then continue;end if;
  insert into public.ad_history(campaign_id,event_type,note,actor_user_id)
  values (r.id,'expired','T036_EXPIRY_SYSTEM_CLOCK',null);
  insert into public.audit_logs(actor_user_id,action,record_type,record_id,metadata,created_at)
  values(null,'ad_status','ad_campaign',r.id::text,
    jsonb_build_object('status','expired','cause','schedule_end',
      'authority','private.b7_ad_expire_due_core'),clock_timestamp());
  v_changed:=v_changed+1;
 end loop;
 return v_changed;
end $core$;
revoke all on function private.b7_ad_expire_due_core(integer)
 from public,anon,authenticated;
grant usage on schema private to service_role;
grant execute on function private.b7_ad_expire_due_core(integer) to service_role;
commit;
