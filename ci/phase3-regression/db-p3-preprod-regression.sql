\set ON_ERROR_STOP on
begin;

create temporary table ci_p3_preprod_results(
  test_id text primary key,
  ok boolean not null,
  detail text not null
) on commit drop;

create temporary table ci_p3_preprod_fixture(
  owner_id uuid,
  article_id uuid,
  session_id uuid
) on commit drop;

grant select on ci_p3_preprod_fixture to anon, authenticated;
grant select,insert,update,delete on ci_p3_preprod_results to anon, authenticated;

do $$
declare
  v_bad_rls integer;
  v_relevant_tables integer;
  v_view_count integer;
  v_bad_views integer;
  v_function_count integer;
  v_bad_functions integer;
begin
  select count(*) into v_relevant_tables
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind='r'
    and (c.relname like 'live_%' or c.relname in('encoder_handoffs','youtube_integration','public_live_feed'));

  select count(*) into v_bad_rls
  from pg_class c
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind='r'
    and (c.relname like 'live_%' or c.relname in('encoder_handoffs','youtube_integration','public_live_feed'))
    and (
      c.relrowsecurity=false
      or not exists(
        select 1 from pg_policies p
        where p.schemaname='public' and p.tablename=c.relname
      )
    );

  insert into ci_p3_preprod_results values(
    '3A-P3-T166',
    v_relevant_tables>0 and v_bad_rls=0,
    'Every exposed/relevant Phase-3A Live/YouTube/encoder table has RLS enabled and at least one explicitly reviewed policy.'
  );

  select count(*) into v_view_count
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind in('v','m')
    and (c.relname like 'live_%' or c.relname='public_live_feed');

  select count(*) into v_bad_views
  from pg_class c
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind in('v','m')
    and (c.relname like 'live_%' or c.relname='public_live_feed')
    and (
      c.relkind='v'
      and not (
        coalesce(c.reloptions,'{}'::text[]) @> array['security_invoker=true']
        or not has_table_privilege('anon',format('%I.%I',n.nspname,c.relname),'SELECT')
      )
    );

  insert into ci_p3_preprod_results values(
    '3A-P3-T167',
    v_bad_views=0,
    case when v_view_count=0
      then 'No exposed Phase-3A Live view exists; sanitized public_live_feed is an RLS-protected table, so no unreviewed view bypass is present.'
      else 'All exposed Phase-3A views/materialized views satisfy the explicit security review rule.'
    end
  );

  select count(*) into v_function_count
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and (p.proname like 'jb_live_%' or p.proname like 'jb_youtube_%');

  select count(*) into v_bad_functions
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and (p.proname like 'jb_live_%' or p.proname like 'jb_youtube_%')
    and (
      p.proconfig is null
      or not exists(select 1 from unnest(p.proconfig) cfg where cfg like 'search_path=%')
      or exists(
        select 1
        from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) acl
        where acl.grantee=0 and acl.privilege_type='EXECUTE'
      )
      or has_function_privilege('anon',p.oid,'EXECUTE')
      or has_function_privilege('authenticated',p.oid,'EXECUTE')
    );

  insert into ci_p3_preprod_results values(
    '3A-P3-T168',
    v_function_count>0 and v_bad_functions=0,
    'Every Phase-3A Live/YouTube DB function is inventoried for SECURITY INVOKER/DEFINER, explicit search_path and EXECUTE roles; no PUBLIC/anon/authenticated direct EXECUTE remains.'
  );
end $$;

do $$
declare
  v_owner uuid;
  v_article uuid;
  v_session uuid;
begin
  select user_id into v_owner
  from public.user_roles where role='owner'::public.app_role limit 1;
  if v_owner is null then raise exception 'CI_PREPROD_OWNER_MISSING'; end if;

  insert into public.articles(
    slug,title,body,status,created_by,updated_by,published_at
  ) values(
    'ci-preprod-'||replace(gen_random_uuid()::text,'-',''),
    'CI Preprod Public','fixture','published',v_owner,v_owner,now()
  ) returning id into v_article;

  insert into public.live_sessions(
    article_id,assigned_reporter_id,headline,active,session_status,public_status,approved_at
  ) values(
    v_article,null,'CI Preprod Session',false,'ENDED','OFF',now()
  ) returning id into v_session;

  insert into public.public_live_feed(
    article_id,permanent_url,headline,public_status,final_report_published
  ) values(
    v_article,'article.html?id='||v_article::text,'CI Preprod Public','OFF',true
  );

  insert into ci_p3_preprod_fixture values(v_owner,v_article,v_session);
end $$;

set local role anon;

do $$
declare
  f ci_p3_preprod_fixture%rowtype;
  v_public integer:=0;
  v_internal integer:=0;
  v_public_ok boolean:=false;
  v_internal_ok boolean:=false;
begin
  select * into f from ci_p3_preprod_fixture limit 1;

  begin
    select count(*) into v_public from public.public_live_feed where article_id=f.article_id;
    v_public_ok := (v_public=1);
  exception when insufficient_privilege then
    v_public_ok := false;
  end;

  begin
    select count(*) into v_internal from public.live_sessions where id=f.session_id;
    v_internal_ok := (v_internal=0);
  exception when insufficient_privilege then
    v_internal_ok := true;
  end;

  insert into ci_p3_preprod_results values(
    '3A-P3-T173',
    v_public_ok and v_internal_ok,
    'Anonymous user can read the dedicated safe public Live feed but cannot read internal Live Session state.'
  );
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',gen_random_uuid()::text,'role','authenticated','aal','aal1')::text,true);

do $$
declare
  v_bad_exec integer;
  v_internal integer:=0;
  v_write_ok boolean:=false;
begin
  select count(*) into v_bad_exec
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and (p.proname like 'jb_live_%' or p.proname like 'jb_youtube_%')
    and has_function_privilege('authenticated',p.oid,'EXECUTE');

  begin
    select count(*) into v_internal from public.live_sessions;
  exception when insufficient_privilege then
    v_internal:=0;
  end;

  begin
    insert into public.live_session_members(
      session_id,user_id,permission,status,grant_version,member_role,is_current_primary
    )
    select session_id,gen_random_uuid(),'BROADCAST','ACTIVE',999,'REPORTER',false
    from ci_p3_preprod_fixture limit 1;
    v_write_ok:=false;
  exception when others then
    v_write_ok := sqlstate='42501'
      or position('row-level security' in lower(sqlerrm))>0
      or position('permission denied' in lower(sqlerrm))>0;
  end;

  insert into ci_p3_preprod_results values(
    '3A-P3-T180',
    v_bad_exec=0 and v_internal=0 and v_write_ok,
    'Direct REST/RPC-style authenticated bypass remains constrained by grants/RLS: internal functions are not directly executable and internal Live authority cannot be self-written.'
  );
end $$;

reset role;

select 'RLS ['||c.relname||'] enabled='||c.relrowsecurity::text||
       ' policies='||count(p.policyname)::text
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
left join pg_policies p on p.schemaname=n.nspname and p.tablename=c.relname
where n.nspname='public' and c.relkind='r'
  and (c.relname like 'live_%' or c.relname in('encoder_handoffs','youtube_integration','public_live_feed'))
group by c.relname,c.relrowsecurity
order by c.relname;

select 'FUNCTION ['||p.proname||'] definer='||p.prosecdef::text||
       ' config='||coalesce(array_to_string(p.proconfig,','),'')
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and (p.proname like 'jb_live_%' or p.proname like 'jb_youtube_%')
order by p.proname;

select case when ok then 'PASS' else 'FAIL' end || ' [' || test_id || '] ' || detail
from ci_p3_preprod_results
order by test_id;

do $$
declare failed_ids text;
begin
  select string_agg(test_id,', ' order by test_id) into failed_ids
  from ci_p3_preprod_results where not ok;
  if failed_ids is not null then
    raise exception 'P3_PREPROD_T20_FAILED: %',failed_ids;
  end if;
end $$;

rollback;
