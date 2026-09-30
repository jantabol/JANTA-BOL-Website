\set ON_ERROR_STOP on
begin;

create temporary table ci_p3_incident_results(
  test_id text primary key,
  ok boolean not null,
  detail text not null
) on commit drop;

create temporary table ci_p3_object_inventory(
  object_type text not null,
  schema_name text not null,
  object_name text not null,
  primary key(object_type,schema_name,object_name)
) on commit drop;

insert into ci_p3_object_inventory(object_type,schema_name,object_name)
select case c.relkind when 'r' then 'TABLE' when 'v' then 'VIEW' when 'm' then 'MATERIALIZED_VIEW' else c.relkind::text end,
       n.nspname,c.relname
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where c.relkind in('r','v','m')
and (
  (n.nspname='public' and (
    c.relname like 'live_%'
    or c.relname in ('encoder_handoffs','youtube_integration','public_live_feed')
  ))
  or
  (n.nspname='private' and c.relname like 'youtube_oauth%')
);

insert into ci_p3_object_inventory(object_type,schema_name,object_name)
select 'FUNCTION',n.nspname,p.proname
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname in('public','private')
and (
  p.proname like 'jb_live_%'
  or p.proname like 'jb_youtube_%'
);

do $$
declare
  v_suspend text;
  v_revoke text;
  v_missing integer;
  v_live_fn_count integer;
  v_bad_grants integer;
begin
  select pg_get_functiondef(p.oid) into v_suspend
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='jb_live_suspend_reporter_internal'
  limit 1;

  select pg_get_functiondef(p.oid) into v_revoke
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='jb_live_revoke_permission_internal'
  limit 1;

  insert into ci_p3_incident_results values(
    '3A-P3-T148',
    v_suspend ilike '%update public.reporters%set active=false%where user_id=p_reporter_user_id%'
      and v_suspend ilike '%from public.live_session_members%where user_id=p_reporter_user_id%'
      and v_suspend ilike '%perform public.jb_live_revoke_permission_internal%'
      and v_suspend ilike '%update public.encoder_handoffs%where reporter_id=p_reporter_user_id%'
      and v_suspend ilike '%delete from auth.sessions%where user_id=p_reporter_user_id%'
      and v_suspend ilike '%auth_sessions_revoked%'
      and v_revoke ilike '%credential_status=case when credential_status in (''RETIRED'',''COMPROMISED'') then credential_status else ''RETIRE_PENDING'' end%'
      and v_revoke ilike '%''RETIRE_STREAM''%'
      and v_revoke ilike '%''COMPLETE_LIVE''%',
    'Reporter-compromise containment disables the Reporter, revokes Live permission/handoffs/auth sessions and retires issued provider authority.'
  );

  insert into ci_p3_incident_results values(
    '3A-P3-T154',
    v_suspend ilike '%where user_id=p_reporter_user_id%'
      and v_suspend ilike '%where reporter_id=p_reporter_user_id%'
      and v_suspend ilike '%delete from auth.sessions%where user_id=p_reporter_user_id%'
      and v_suspend not ilike '%update public.reporters set active=false;%'
      and v_suspend not ilike '%delete from auth.sessions;%'
      and v_suspend not ilike '%update public.encoder_handoffs set revoked_at=coalesce(revoked_at,now());%',
    'Reporter compromise containment is target-user scoped; unrelated Reporters/sessions are not globally revoked.'
  );

  with required(object_type,schema_name,object_name) as (
    values
      ('TABLE','public','live_requests'),
      ('TABLE','public','live_sessions'),
      ('TABLE','public','live_session_members'),
      ('TABLE','public','live_provider_generations'),
      ('TABLE','public','live_operations'),
      ('TABLE','public','encoder_handoffs'),
      ('TABLE','public','live_notifications'),
      ('TABLE','public','youtube_integration'),
      ('TABLE','public','public_live_feed'),
      ('TABLE','private','youtube_oauth_secrets')
  )
  select count(*) into v_missing
  from required r
  where not exists(
    select 1 from ci_p3_object_inventory i
    where i.object_type=r.object_type
      and i.schema_name=r.schema_name
      and i.object_name=r.object_name
  );

  select count(*) into v_live_fn_count
  from ci_p3_object_inventory
  where object_type='FUNCTION'
    and schema_name='public'
    and (object_name like 'jb_live_%' or object_name like 'jb_youtube_%');

  insert into ci_p3_incident_results values(
    '3A-P3-T164',
    v_missing=0 and v_live_fn_count>0,
    'Phase-3A object inventory dynamically enumerates matching tables/views/functions and confirms all required core objects are present.'
  );

  with bad_table_grants as (
    select g.table_schema,g.table_name,g.grantee,g.privilege_type
    from information_schema.role_table_grants g
    where (
      (
        g.table_schema='public'
        and g.table_name in (
          'live_requests','live_session_members','live_provider_generations',
          'live_operations','encoder_handoffs','youtube_integration'
        )
        and g.grantee in ('anon','authenticated')
      )
      or (
        g.table_schema='public'
        and g.table_name in ('live_sessions','live_notifications')
        and g.grantee='anon'
      )
      or (
        g.table_schema='public'
        and g.table_name in ('live_sessions','live_notifications')
        and g.grantee='authenticated'
        and g.privilege_type<>'SELECT'
      )
      or (
        g.table_schema='public'
        and g.table_name='public_live_feed'
        and g.grantee in('anon','authenticated')
        and g.privilege_type<>'SELECT'
      )
      or (
        g.table_schema='private'
        and g.table_name like 'youtube_oauth%'
        and g.grantee in('anon','authenticated')
      )
    )
  ),
  bad_function_grants as (
    select specific_schema as table_schema,routine_name as table_name,grantee,privilege_type
    from information_schema.routine_privileges
    where specific_schema='public'
      and (routine_name like 'jb_live_%' or routine_name like 'jb_youtube_%')
      and grantee in('PUBLIC','anon','authenticated')
  )
  select
    (select count(*) from bad_table_grants)
    +(select count(*) from bad_function_grants)
  into v_bad_grants;

  insert into ci_p3_incident_results values(
    '3A-P3-T165',
    v_bad_grants=0,
    'Grant review enumerates core Phase-3A object privileges and finds no unexpected anon/authenticated/PUBLIC authority beyond intended read-only surfaces.'
  );
end $$;

select 'INVENTORY ['||object_type||'] '||schema_name||'.'||object_name
from ci_p3_object_inventory
order by object_type,schema_name,object_name;

select 'GRANT ['||table_schema||'.'||table_name||'] '||grantee||' -> '||privilege_type
from information_schema.role_table_grants
where (
  (table_schema='public' and table_name in(
    'live_requests','live_sessions','live_session_members','live_provider_generations',
    'live_operations','encoder_handoffs','live_notifications','youtube_integration','public_live_feed'
  ))
  or (table_schema='private' and table_name like 'youtube_oauth%')
)
order by table_schema,table_name,grantee,privilege_type;

select case when ok then 'PASS' else 'FAIL' end || ' [' || test_id || '] ' || detail
from ci_p3_incident_results
order by test_id;

do $$
declare failed_ids text;
begin
  select string_agg(test_id,', ' order by test_id) into failed_ids
  from ci_p3_incident_results
  where not ok;
  if failed_ids is not null then
    raise exception 'P3_INCIDENT_T20_FAILED: %',failed_ids;
  end if;
end $$;

rollback;
