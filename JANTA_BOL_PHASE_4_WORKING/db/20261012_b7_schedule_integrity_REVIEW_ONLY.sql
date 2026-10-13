-- JANTA BOL Phase4 B7 / BE08 / schedule and sold-window integrity.
-- REVIEW_ONLY: test on disposable PostgreSQL first. NOT FOR LIVE MIGRATION.
-- Layer new triggers on EXISTING ad_campaigns + existing Owner schedule RPC.
-- Do not recreate article URLs, credentials, B5 policy, or campaign records.
begin;
do $b7_schedule_preflight$
declare v_source text;
begin
 if to_regclass('public.ad_campaigns') is null or
    to_regclass('public.ad_history') is null or
    to_regclass('public.audit_logs') is null or
    to_regprocedure('private.p4_owner_allowed()') is null or
    to_regprocedure('public.jb_ad_schedule_internal(uuid,timestamptz,timestamptz)') is null
 then raise exception 'BE08_CANONICAL_SCHEDULE_DEPENDENCY_MISSING';end if;
 select prosrc into v_source from pg_proc where
  oid='public.jb_ad_schedule_internal(uuid,timestamptz,timestamptz)'::regprocedure;
 if v_source not ilike '%update public.ad_campaigns set starts_at=p_starts_at%'
    or v_source not ilike '%ends_at=p_ends_at%'
    or v_source not ilike '%private.p4_owner_allowed%'
 then raise exception 'BE08_SCHEDULE_LIVE_SOURCE_DRIFT_INDEPENDENT_RCA_REQUIRED';end if;
end $b7_schedule_preflight$;

create or replace function private.b7_schedule_window_guard()
returns trigger language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $schedule_guard$
begin
 if tg_op='INSERT' then
  -- Public enquiry/create is unscheduled; only later explicit Owner review
  -- can set a start/end pair through the canonical Owner scheduling RPC.
  if new.starts_at is not null or new.ends_at is not null
   then raise exception 'B7_UNREVIEWED_SCHEDULE_ON_INSERT';end if;
  return new;
 end if;
 -- Unrelated owner safety changes and repeated identical schedules pass.
 if new.starts_at is not distinct from old.starts_at and
    new.ends_at is not distinct from old.ends_at then return new;end if;
 if not private.p4_owner_allowed()
 then raise exception 'OWNER_AAL2_REQUIRED';end if;
 if new.status is distinct from old.status or
    old.status not in('requested','review','approved','payment_pending') or
    new.status not in('requested','review','approved','payment_pending')
 then raise exception 'B7_SCHEDULE_STATUS_LOCKED';end if;
 if old.paid_at is not null or old.non_refund_accepted_at is not null or
    exists(select 1 from public.ad_payments p
       where p.campaign_id=old.id and p.status='confirmed')
 then raise exception 'B7_SOLD_WINDOW_IMMUTABLE';end if;
 if new.starts_at is null or new.ends_at is null or
    new.ends_at<=new.starts_at
 then raise exception 'B7_SCHEDULE_INVALID';end if;
 -- Use current wall clock, not the beginning of a long Owner transaction.
 if new.starts_at<=clock_timestamp()
 then raise exception 'B7_SCHEDULE_START_MUST_BE_FUTURE';end if;
 return new;
end $schedule_guard$;

drop trigger if exists b7_schedule_window_guard on public.ad_campaigns;
create trigger b7_schedule_window_guard
before insert or update of starts_at,ends_at on public.ad_campaigns
for each row execute function private.b7_schedule_window_guard();
revoke all on function private.b7_schedule_window_guard()
 from public,anon,authenticated;

-- Historical original jb_ad_schedule_internal still writes ad_history.
-- Complement it with one atomic audit event for any *actual* window change
-- (including a privileged direct UPDATE): no parallel scheduling authority.
create or replace function private.b7_schedule_change_audit()
returns trigger language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $schedule_audit$
begin
 if new.starts_at is not distinct from old.starts_at and
    new.ends_at is not distinct from old.ends_at then return null;end if;
 insert into public.audit_logs(
  actor_user_id,action,record_type,record_id,metadata,created_at
 ) values(
  auth.uid(),'ad_schedule_changed','ad_campaign',new.id::text,
  jsonb_build_object('old_start',old.starts_at,'old_end',old.ends_at,
                     'new_start',new.starts_at,'new_end',new.ends_at),
  now()
 );
 return null;
end $schedule_audit$;
drop trigger if exists b7_schedule_change_audit on public.ad_campaigns;
create trigger b7_schedule_change_audit
after update of starts_at,ends_at on public.ad_campaigns
for each row execute function private.b7_schedule_change_audit();
revoke all on function private.b7_schedule_change_audit()
 from public,anon,authenticated;
commit;
