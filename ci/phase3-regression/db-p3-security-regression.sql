\set ON_ERROR_STOP on
begin;

create temporary table ci_p3_security_results(
  test_id text primary key,
  ok boolean not null,
  detail text not null
) on commit drop;

do $$
declare
  v_gen_constraint text;
  v_create text;
  v_consume text;
  v_revoke text;
  v_regrant text;
  v_gen_cols text;
  v_handoff_cols text;
begin
  select string_agg(pg_get_constraintdef(oid),' ' order by conname)
  into v_gen_constraint
  from pg_constraint
  where conrelid='public.live_provider_generations'::regclass;

  select pg_get_functiondef(p.oid) into v_create
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='jb_live_create_handoff_internal' limit 1;

  select pg_get_functiondef(p.oid) into v_consume
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='jb_live_consume_handoff_internal' limit 1;

  select pg_get_functiondef(p.oid) into v_revoke
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='jb_live_revoke_permission_internal' limit 1;

  select pg_get_functiondef(p.oid) into v_regrant
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='jb_live_regrant_permission_internal' limit 1;

  select string_agg(column_name,',' order by ordinal_position) into v_gen_cols
  from information_schema.columns
  where table_schema='public' and table_name='live_provider_generations';

  select string_agg(column_name,',' order by ordinal_position) into v_handoff_cols
  from information_schema.columns
  where table_schema='public' and table_name='encoder_handoffs';

  insert into ci_p3_security_results values(
    '3A-P3-T007',
    position('provider_stream_id' in v_gen_cols)>0
      and position('stream_key' in v_gen_cols)=0
      and position('stream_name' in v_gen_cols)=0
      and position('rtmps' in v_gen_cols)=0,
    'Provider generation persists provider Stream ID but no raw stream key/name/RTMPS credential column.'
  );

  insert into ci_p3_security_results values(
    '3A-P3-T008',
    v_gen_constraint ilike '%SERVER_ONLY%'
      and v_gen_constraint ilike '%ISSUED%'
      and v_gen_constraint ilike '%ACTIVE%'
      and v_gen_constraint ilike '%RETIRE_PENDING%'
      and v_gen_constraint ilike '%RETIRED%'
      and v_gen_constraint ilike '%COMPROMISED%',
    'Provider credential lifecycle states are constrained from SERVER_ONLY through issue/active/retirement/compromise.'
  );

  insert into ci_p3_security_results values(
    '3A-P3-T009',
    v_create ilike '%provider_state not in (''READY'',''ACTIVE'')%'
      and v_create ilike '%credential_status in (''RETIRE_PENDING'',''RETIRED'',''COMPROMISED'')%'
      and v_consume ilike '%credential_status=case when credential_status=''SERVER_ONLY'' then ''ISSUED''%',
    'Credential remains server-side until an authorized camera handoff is consumed, when SERVER_ONLY advances to ISSUED.'
  );

  insert into ci_p3_security_results values(
    '3A-P3-T011',
    v_create ilike '%p_ttl_seconds integer default 90%'
      and v_create ilike '%greatest(30,least(coalesce(p_ttl_seconds,90),180))%'
      and v_revoke ilike '%RETIRE_STREAM%'
      and v_regrant ilike '%RETIRE_PENDING%',
    'Short-lived one-use handoff lifetime is separate from provider credential retirement/replacement lifecycle.'
  );

  insert into ci_p3_security_results values(
    '3A-P3-T012',
    position('token_hash' in v_handoff_cols)>0
      and position('session_id' in v_handoff_cols)>0
      and position('reporter_id' in v_handoff_cols)>0
      and position('generation_id' in v_handoff_cols)>0
      and position('grant_version' in v_handoff_cols)>0
      and position('expires_at' in v_handoff_cols)>0
      and position(',token,' in ','||v_handoff_cols||',')=0,
    'Handoff stores token hash plus reporter/session/generation/grant/expiry context, not the raw token.'
  );

  insert into ci_p3_security_results values(
    '3A-P3-T013',
    v_consume ilike '%if v_h.used_at is not null then raise exception ''HANDOFF_ALREADY_USED''%'
      and v_consume ilike '%update public.encoder_handoffs set used_at=v_used%'
      and v_create ilike '%set revoked_at=now()%'
      and v_create ilike '%used_at is null and revoked_at is null%',
    'Consumed handoff cannot be reused and creating a fresh handoff revokes prior unused handoffs for the same authority.'
  );

  insert into ci_p3_security_results values(
    '3A-P3-T016',
    v_revoke ilike '%provider_state=case when provider_state=''COMPROMISED'' then provider_state else ''RETIRE_PENDING'' end%'
      and v_regrant ilike '%set is_current=false%'
      and v_regrant ilike '%''PENDING'',''SERVER_ONLY'',true%'
      and v_regrant ilike '%''PROVISION_LIVE''%',
    'Pre-Live credential containment retires the old generation and re-grant creates a fresh current SERVER_ONLY generation for reprovisioning.'
  );

  insert into ci_p3_security_results values(
    '3A-P3-T017',
    v_revoke ilike '%session_status=''PROVIDER_INTERRUPTED''%'
      and v_revoke ilike '%public_status=''INTERRUPTED''%'
      and v_revoke ilike '%v_operation:=''COMPLETE_LIVE''%'
      and v_regrant ilike '%session_status=''PROVISIONING''%'
      and v_regrant ilike '%public_status=''OFF''%',
    'Mid-Live credential containment interrupts public truth, completes/retires old provider authority and requires controlled fresh reprovisioning.'
  );

  insert into ci_p3_security_results values(
    '3A-P3-T018',
    v_regrant ilike '%set is_current=false%'
      and v_regrant ilike '%select coalesce(max(generation_number),0)+1%'
      and v_regrant ilike '%insert into public.live_provider_generations%'
      and v_regrant ilike '%generation_number%',
    'Provider replacement preserves prior generation history and inserts a higher-numbered new current generation.'
  );

  insert into ci_p3_security_results values(
    '3A-P3-T019',
    v_create ilike '%credential_status in (''RETIRE_PENDING'',''RETIRED'',''COMPROMISED'')%'
      and v_consume ilike '%credential_status in (''RETIRE_PENDING'',''RETIRED'',''COMPROMISED'')%'
      and v_regrant ilike '%set is_current=false%',
    'Retired/compromised credentials are rejected by handoff paths and old generations are never silently reactivated.'
  );
end $$;

select case when ok then 'PASS' else 'FAIL' end || ' [' || test_id || '] ' || detail
from ci_p3_security_results
order by test_id;

do $$
declare failed_ids text;
begin
  select string_agg(test_id,', ' order by test_id) into failed_ids
  from ci_p3_security_results where not ok;
  if failed_ids is not null then
    raise exception 'P3_SECURITY_T20_FAILED: %',failed_ids;
  end if;
end $$;

rollback;
