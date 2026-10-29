\set ON_ERROR_STOP on
-- B10 RUN-09 / T060–T068. Run AFTER synthetic B9 fixture and REVIEW-ONLY migration.
-- Every operation is a disposable PostgreSQL17 fixture. NEVER run on LIVE JANTA BOL.
begin;
set local statement_timeout='30s';
do $b10_initial$
declare v int;
begin
 -- T060: backend governs authority; ensure live product guards cannot be replaced by client state.
 if (select count(*) from pg_proc p where p.pronamespace='public'::regnamespace
   and p.proname in('jb_b9_owner_analytics','jb_b9_owner_metric_settings','jb_b9_owner_assign_term')
   and p.prosecdef and coalesce(array_to_string(p.proconfig,','),'') like '%search_path=%')<>3
 then raise exception 'T060_OWNER_AUTHORITY_GUARDS_ABSENT'; end if;
 if (select count(*) from pg_class where relnamespace='public'::regnamespace
   and relname in('articles','analytics_events','b9_taxonomy_terms','b9_article_terms','b9_metric_global_settings','b9_article_share_settings')
   and relrowsecurity)<>6 then raise exception 'T061_RLS_DISABLED';end if;
 if (select count(*) from pg_proc p where p.pronamespace='public'::regnamespace
    and p.proname like 'jb_b9_owner_%' and has_function_privilege('anon',p.oid,'EXECUTE'))<>0
 then raise exception 'T062_OWNER_RPC_PUBLIC_EXEC';end if;
 if has_table_privilege('anon','public.analytics_events','SELECT') or
  has_table_privilege('anon','public.b9_taxonomy_terms','SELECT') or
  has_table_privilege('anon','public.b9_metric_global_settings','SELECT')
 then raise exception 'T061_PRIVATE_TABLE_ACL_EXPOSED';end if;
 if exists(select 1 from pg_class c where c.relnamespace='public'::regnamespace and c.relkind='v'
  and has_table_privilege('anon',c.oid,'SELECT')
  and not ('security_invoker=true'=any(coalesce(c.reloptions,array[]::text[]))))
 then raise exception 'T064_PUBLIC_VIEW_BYPASSES_RLS';end if;
end;
$b10_initial$;

-- T061/T065/T066: actual low-privilege anonymous function invocation, NOT postgres pretending to be anon.
set local role anon;
do $b10_anon$
declare r jsonb;
begin
 r:=public.jb_b9_search(p_limit=>50);
 if jsonb_array_length(r->'items')<>3 then raise exception 'T060_ANON_POSITIVE_SEARCH_BROKEN';end if;
 if jsonb_array_length(public.jb_b9_search(p_id=>'dddddddd-dddd-4ddd-8ddd-dddddddddddd')->'items')<>0 or
    jsonb_array_length(public.jb_b9_search(p_id=>'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')->'items')<>0 or
    jsonb_array_length(public.jb_b9_search(p_id=>'ffffffff-ffff-4fff-8fff-ffffffffffff')->'items')<>0
 then raise exception 'T065_PRIVATE_ID_GUESSING_LEAK';end if;
 if jsonb_array_length(public.jb_b9_search(p_query=>'PRIVATE_ID_NUMBER_12345')->'items')<>0 then
   raise exception 'T061_PRIVATE_SOURCE_SEARCH_LEAK';end if;
 if public.jb_b9_public_metrics('dddddddd-dddd-4ddd-8ddd-dddddddddddd'::uuid) is not null
 then raise exception 'T065_PRIVATE_METRIC_DISCLOSURE';end if;
 if public.jb_b9_public_article_author('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'::uuid) is not null
 then raise exception 'T066_PRIVATE_AUTHOR_DISCLOSURE';end if;
 if has_table_privilege('anon','public.audit_logs','SELECT') then
   raise exception 'T061_AUDIT_LOG_DIRECT_READ';end if;
end;
$b10_anon$;

reset role;
-- T062/T063/T066: explicit reporter/editor and stale AAL1 denial; no actual Supabase session involved.
do $b10_roles$
declare blocked boolean;
begin
 perform set_config('b9.test_uid','22222222-2222-2222-2222-222222222222',true);
 perform set_config('b9.test_aal','aal2',true);
 blocked:=false;
 begin perform public.jb_b9_owner_analytics('2026-10-01'::timestamptz,'2026-10-31'::timestamptz);
 exception when others then blocked:=SQLERRM='B9_OWNER_AAL2_REQUIRED';end;
 if not blocked then raise exception 'T062_REPORTER_AAL2_OWNER_PRIVILEGE';end if;

 perform set_config('b9.test_uid','33333333-3333-3333-3333-333333333333',true);
 blocked:=false;
 begin perform public.jb_b9_owner_metric_settings(true,null,true,true,null);
 exception when others then blocked:=SQLERRM='B9_OWNER_AAL2_REQUIRED';end;
 if not blocked then raise exception 'T062_EDITOR_AAL2_OWNER_PRIVILEGE';end if;

 perform set_config('b9.test_uid','11111111-1111-1111-1111-111111111111',true);
 perform set_config('b9.test_aal','aal1',true);
 blocked:=false;
 begin perform public.jb_b9_owner_assign_term('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','tag','test-b10','Test B10','add');
 exception when others then blocked:=SQLERRM='B9_OWNER_AAL2_REQUIRED';end;
 if not blocked then raise exception 'T063_OWNER_STALE_AAL1_REAUTHORIZED';end if;

 perform set_config('b9.test_aal','aal2',true);
 if public.jb_b9_owner_analytics('2026-10-01'::timestamptz,'2026-10-31'::timestamptz)->'summary' is null
 then raise exception 'T060_REAL_OWNER_AAL2_POSITIVE_BROKEN';end if;
end;
$b10_roles$;

-- T067: audit is append-only from actual existing privileged mutation; prove no fabricated actor ID.
do $b10_audit$
declare before_events bigint;after_events bigint;
begin
 select count(*) into before_events from public.audit_logs where action='b9_metric_display_control';
 perform public.jb_b9_owner_metric_settings(true,null,false,false,null);
 select count(*) into after_events from public.audit_logs where action='b9_metric_display_control';
 if after_events<>before_events+1 then raise exception 'T067_SECURITY_AUDIT_EVENT_MISSING';end if;
 if not exists(select 1 from public.audit_logs where action='b9_metric_display_control'
    and actor_user_id='11111111-1111-1111-1111-111111111111'::uuid
    and metadata ? 'before' and metadata ? 'after')
 then raise exception 'T067_AUDIT_ACTOR_OR_BEFORE_AFTER_MISSING';end if;
 -- T068: public events not rewritten by this Owner display toggle.
 if (select count(*) from public.analytics_events)<>4 then
  raise exception 'T068_RAW_ANALYTICS_REWRITTEN';end if;
end;
$b10_audit$;
rollback;
\echo 'B10 T060-T068 synthetic source/RPC security regression completed, no LIVE E3/E5 asserted.'
