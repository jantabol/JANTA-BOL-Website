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
  v_bad_public_ad_guard bigint;
  v_bad_public_enquiry_guard bigint;
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
    and p.oid <> 'public.jb_ad_public_feed(text,text)'::regprocedure
    and p.proname not in ('jb_ad_event','jb_ad_portal_campaign','jb_ad_portal_login','jb_ad_portal_submit_creative','jb_ad_public_packages','jb_ad_public_request','jb_ad_public_enquiry','jb_ad_record_event','jb_compliance_public_months','jb_grievance_submit_internal','jb_grievance_submit_receipt','jb_public_active_ads');

  select count(*) into v_unknown_authenticated
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname like 'jb_%'
    and has_function_privilege('authenticated',p.oid,'EXECUTE')
    and p.oid <> 'public.jb_ad_public_feed(text,text)'::regprocedure
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
      'jb_verify_owner_recovery_key',
      'jb_ad_analytics_internal','jb_ad_approve_creative_internal','jb_ad_confirm_payment_internal','jb_ad_event',
      'jb_ad_issue_portal_internal','jb_ad_link_advertiser_user_internal','jb_ad_my_campaigns','jb_ad_portal_campaign',
      'jb_ad_portal_login','jb_ad_portal_submit_creative','jb_ad_public_packages','jb_ad_public_request','jb_ad_record_event',
      'jb_ad_record_payment_internal','jb_ad_request_internal','jb_ad_request_renewal','jb_ad_save_creative_internal',
      'jb_ad_save_package_internal','jb_ad_schedule_internal','jb_ad_transition_internal',
      'jb_compliance_approve_month_internal','jb_compliance_generate_month_internal','jb_compliance_refresh_deadlines_internal',
      'jb_compliance_transition_internal','jb_compliance_task_prepare_internal','jb_compliance_public_months','jb_compliance_set_escalation_ready_internal','jb_compliance_tasks_internal','jb_case_access_internal','jb_grievance_add_issue_internal',
      'jb_grievance_link_duplicate_internal','jb_grievance_reopen_internal','jb_grievance_reporter_clarify_internal',
      'jb_grievance_set_priority_internal','jb_grievance_submit_internal','jb_grievance_transition_internal','jb_grievance_asset_internal','jb_grievance_my_clarifications','jb_grievance_permanent_delete_internal','jb_grievance_reporter_choices','jb_grievance_retention_internal','jb_grievance_submit_receipt','jb_grievance_workflow_internal','jb_public_active_ads'
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

  select count(*) into v_bad_ad_guard
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname in ('jb_ad_approve_creative_internal','jb_ad_confirm_payment_internal','jb_ad_issue_portal_internal','jb_ad_link_advertiser_user_internal','jb_ad_record_payment_internal','jb_ad_save_creative_internal','jb_ad_save_package_internal','jb_ad_schedule_internal','jb_ad_transition_internal')
    and (not p.prosecdef or has_function_privilege('anon',p.oid,'EXECUTE') or not has_function_privilege('authenticated',p.oid,'EXECUTE') or pg_get_functiondef(p.oid) not ilike '%p4_owner_allowed%');


  -- This one public read signature is intentionally reviewed; no wildcard exemption.
  select count(*) into v_bad_public_ad_guard
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  join pg_language l on l.oid=p.prolang
  where n.nspname='public' and p.proname in('jb_ad_public_feed','jb_public_active_ads')
    and (not p.prosecdef or l.lanname<>'sql'
      or not has_function_privilege('anon',p.oid,'EXECUTE')
      or not has_function_privilege('authenticated',p.oid,'EXECUTE')
      or p.proconfig is distinct from array['search_path=pg_catalog']::text[]
      or p.prosrc ~* '\m(insert|update|delete|truncate|drop|alter|create|grant|revoke|execute)\M'
      or (p.proname='jb_ad_public_feed' and
         (p.prosrc not ilike '%public.ad_payments%' or p.prosrc not ilike '%public.advertisers%'
          or p.prosrc not ilike '%non_refund_accepted_at%' or p.prosrc not ilike '%verification_state%'
          or pg_get_function_result(p.oid) <> 'TABLE(campaign_id uuid, creative_id uuid, creative_type text, media_url text, text_body text, cta_type text, cta_target text, label text)'))
      or (p.proname='jb_public_active_ads' and p.prosrc not ilike '%public.jb_ad_public_feed%'));
  if (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname in('jb_ad_public_feed','jb_public_active_ads'))<>2
  then v_bad_public_ad_guard:=v_bad_public_ad_guard+1; end if;

  -- ADS-002: conditional until migration is deployed. Once present, this exact
  -- anon API is reviewed for explicit consent and no other legacy public intake.
  -- Keep prior T123 checks, never whitelist unknown jb_* signatures.
  select count(*) into v_bad_public_enquiry_guard
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  join pg_language l on l.oid=p.prolang
  where n.nspname='public' and p.proname='jb_ad_public_enquiry'
    and (
      p.oid <> to_regprocedure('public.jb_ad_public_enquiry(text,text,boolean,text,uuid,text)')
      or not p.prosecdef or l.lanname<>'plpgsql'
      or not has_function_privilege('anon',p.oid,'EXECUTE')
      or not has_function_privilege('authenticated',p.oid,'EXECUTE')
      or p.prosrc not ilike '%p_consent is distinct from true%'
      or p.prosrc not ilike '%ENQUIRY_COOLDOWN%'
      or p.prosrc not ilike '%INVALID_WHATSAPP_NUMBER%'
      or p.prosrc not ilike '%insert into public.ad_campaigns%'
      or p.prosrc not ilike '%status%requested%'
    );
  if to_regprocedure('public.jb_ad_public_enquiry(text,text,boolean,text,uuid,text)') is not null
     and exists(
       select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
       where n.nspname='public' and p.proname='jb_ad_public_request'
         and (has_function_privilege('anon',p.oid,'EXECUTE')
           or pg_get_functiondef(p.oid) not ilike '%p4_owner_allowed%')
     )
  then v_bad_public_enquiry_guard:=v_bad_public_enquiry_guard+1;end if;

  insert into ci_phase3_function_results values(
    '3A-P3-T123',
    v_anon_exposed=0
    and v_unknown_authenticated=0
    and v_bad_owner_guard=0
    and v_bad_ad_guard=0
    and v_bad_public_ad_guard=0
    and v_bad_public_enquiry_guard=0,
    'Phase-3A database function caller roles are explicit: only reviewed public API signatures permit anon execution, internal functions stay service-only, and only explicitly reviewed Owner/social/ad RPCs are client-executable; privileged ad internals retain SECURITY DEFINER, authenticated-only execution and p4_owner_allowed checks.'
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