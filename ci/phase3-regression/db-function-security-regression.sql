\set ON_ERROR_STOP on
begin;

create temporary table ci_phase3_function_results(
  test_id text primary key,
  ok boolean not null,
  detail text not null
) on commit drop;

do $$
declare
  v_unexpected_internal bigint;
  v_anon_exposed bigint;
  v_unknown_authenticated bigint;
  v_bad_owner_guard bigint;
  v_bad_ad_guard bigint;
begin
  select count(*) into v_unexpected_internal
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and (
      p.proname like 'jb_live_%_internal'
      or p.proname like 'jb_youtube_%_internal'
      or p.proname like 'jb_phase3b_%'
    )
    and (
      has_function_privilege('anon',p.oid,'EXECUTE')
      or has_function_privilege('authenticated',p.oid,'EXECUTE')
    );

  insert into ci_phase3_function_results values(
    '3A-P3-T053',
    v_unexpected_internal=0,
    'Sensitive internal Live/YouTube database functions are not broadly executable by anon/authenticated client roles.'
  );

  select count(*) into v_anon_exposed
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname like 'jb_%'
    and has_function_privilege('anon',p.oid,'EXECUTE')
    and p.proname not in ('jb_ad_event','jb_ad_portal_campaign','jb_ad_portal_login','jb_ad_portal_submit_creative','jb_ad_public_packages','jb_ad_public_request','jb_ad_record_event');

  select count(*) into v_unknown_authenticated
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname like 'jb_%'
    and has_function_privilege('authenticated',p.oid,'EXECUTE')
    and p.proname not in (
      'jb_is_owner',
      'jb_social_history_internal',
      'jb_social_record_attempt_internal',
      'jb_social_save_preferences_internal',
      'jb_social_set_global_internal',
      'jb_owner_confirm_recovery_physical_check',
      'jb_owner_list_sessions',
      'jb_owner_permanent_delete_article',
      'jb_owner_recovery_physical_status',
      'jb_owner_revoke_session',
      'jb_set_owner_recovery_key',
      'jb_verify_owner_recovery_key'
    );

  select count(*) into v_bad_owner_guard
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname in (
      'jb_owner_confirm_recovery_physical_check',
      'jb_owner_list_sessions',
      'jb_owner_permanent_delete_article',
      'jb_owner_recovery_physical_status',
      'jb_owner_revoke_session',
      'jb_set_owner_recovery_key',
      'jb_verify_owner_recovery_key'
    )
    and (
      not p.prosecdef
      or not has_function_privilege('authenticated',p.oid,'EXECUTE')
      or has_function_privilege('anon',p.oid,'EXECUTE')
      or (
        pg_get_functiondef(p.oid) not ilike '%auth.uid()%'
        and pg_get_functiondef(p.oid) not ilike '%auth.uid();%'
      )
      or (
        pg_get_functiondef(p.oid) not ilike '%current_owner_aal2%'
        and pg_get_functiondef(p.oid) not ilike '%current_owner_recent_mfa%'
        and pg_get_functiondef(p.oid) not ilike '%OWNER_REQUIRED%'
      )
    );


  if exists(
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.proname in ('jb_social_history_internal','jb_social_record_attempt_internal','jb_social_save_preferences_internal')
      and (not p.prosecdef or has_function_privilege('anon',p.oid,'EXECUTE')
           or not has_function_privilege('authenticated',p.oid,'EXECUTE')
           or pg_get_functiondef(p.oid) not ilike '%jb_social_allowed%')
  ) then v_bad_owner_guard:=v_bad_owner_guard+1; end if;

  if exists(
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='jb_social_set_global_internal'
      and (not p.prosecdef or has_function_privilege('anon',p.oid,'EXECUTE')
           or not has_function_privilege('authenticated',p.oid,'EXECUTE')
           or pg_get_functiondef(p.oid) not ilike '%current_owner_aal2%')
  ) then v_bad_owner_guard:=v_bad_owner_guard+1; end if;

  insert into ci_phase3_function_results values(
    '3A-P3-T123',
    v_anon_exposed=0
    and v_unknown_authenticated=0
    and v_bad_owner_guard=0
    and v_bad_ad_guard=0,
    'Phase-3A database function caller roles are explicit: no jb_* anon execution, internal functions stay service-only, and only explicitly reviewed Owner/social/ad RPCs are client-executable; privileged ad internals retain SECURITY DEFINER, authenticated-only execution and p4_owner_allowed checks.'
  );
end $$;

select
  case when ok then 'PASS' else 'FAIL' end
  || ' [' || test_id || '] '
  || detail
from ci_phase3_function_results
order by test_id;

do $$
declare
  failed_ids text;
begin
  select string_agg(test_id, ', ' order by test_id)
  into failed_ids
  from ci_phase3_function_results
  where not ok;

  if failed_ids is not null then
    raise exception 'PHASE3_FUNCTION_SECURITY_FAILED: %', failed_ids;
  end if;
end $$;

rollback;