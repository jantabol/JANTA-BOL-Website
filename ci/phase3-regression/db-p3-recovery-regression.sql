\set ON_ERROR_STOP on
begin;

create temporary table ci_p3_recovery_results(
  test_id text primary key,
  ok boolean not null,
  detail text not null
) on commit drop;

do $$
declare
  v_state_constraint text;
  v_claim text;
  v_ambiguous text;
  v_due_index text;
begin
  select pg_get_constraintdef(oid) into v_state_constraint
  from pg_constraint
  where conrelid='public.live_operations'::regclass
    and conname='live_operations_operation_state_check';

  select pg_get_functiondef(p.oid) into v_claim
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='jb_live_claim_operation_internal'
  limit 1;

  select pg_get_functiondef(p.oid) into v_ambiguous
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='jb_live_mark_operation_ambiguous_internal'
  limit 1;

  select indexdef into v_due_index
  from pg_indexes
  where schemaname='public'
    and tablename='live_operations'
    and indexname='live_operations_due_idx';

  insert into ci_p3_recovery_results values(
    '3A-P3-T067',
    v_state_constraint ilike '%AMBIGUOUS%'
      and v_ambiguous ilike '%operation_state=''AMBIGUOUS''%'
      and v_ambiguous ilike '%next_attempt_at%'
      and v_ambiguous ilike '%last_safe_error_code%'
      and v_due_index ilike '%AMBIGUOUS%',
    'Unknown provider results have an explicit durable AMBIGUOUS state with classified safe error and scheduled reconcile/retry eligibility.'
  );

  insert into ci_p3_recovery_results values(
    '3A-P3-T076',
    v_claim ilike '%for update skip locked%'
      and v_claim ilike '%operation_state=''PROCESSING'' and lease_until is not null and lease_until<now()%'
      and v_claim ilike '%attempt_count=attempt_count+1%'
      and v_claim ilike '%worker_id=left(btrim(p_worker_id),120)%'
      and v_claim ilike '%lease_until=now()+make_interval%'
      and v_claim ilike '%greatest(15,least(coalesce(p_lease_seconds,60),300))%',
    'Operation claim uses row locking plus bounded leases/attempt counts and permits safe takeover only after a PROCESSING lease expires.'
  );
end $$;

select case when ok then 'PASS' else 'FAIL' end || ' [' || test_id || '] ' || detail
from ci_p3_recovery_results
order by test_id;

do $$
declare failed_ids text;
begin
  select string_agg(test_id,', ' order by test_id) into failed_ids
  from ci_p3_recovery_results where not ok;
  if failed_ids is not null then
    raise exception 'P3_RECOVERY_T20_FAILED: %',failed_ids;
  end if;
end $$;

rollback;
