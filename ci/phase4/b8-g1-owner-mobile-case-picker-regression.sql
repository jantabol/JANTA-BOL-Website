\set ON_ERROR_STOP on
-- REAL isolated PostgreSQL17 G1 case picker negative/positive privileges.
begin;
do $b8$
begin
 if has_function_privilege('anon','public.jb_b8_g1_owner_case_choices()','EXECUTE')
 or not has_function_privilege('authenticated','public.jb_b8_g1_owner_case_choices()','EXECUTE')
 or has_table_privilege('authenticated','public.b8_cases','SELECT')
 then raise exception 'B8_CASE_CHOICES_PRIVATE_ACL_FAIL';end if;
end $b8$;
set role anon;
do $b8$ declare denied boolean:=false;
begin
 begin perform public.jb_b8_g1_owner_case_choices();
 exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'B8_ANON_READ_OWNER_CASE_TITLES';end if;
end $b8$;
reset role;
select set_config('b8.fixture_session','on',false);
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
select set_config('b8.fixture_aal','aal1',false);
set role authenticated;
do $b8$ declare denied boolean:=false;
begin
 begin perform public.jb_b8_g1_owner_case_choices();
 exception when others then denied:=sqlerrm='B8_OWNER_AAL2_REQUIRED';end;
 if not denied then raise exception 'B8_REPORTER_CASE_LIST_LEAK';end if;
end $b8$;
reset role;
select set_config('b8.fixture_actor','44444444-4444-4444-4444-444444444444',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
do $b8$ declare denied boolean:=false;
begin
 begin perform public.jb_b8_g1_owner_case_choices();
 exception when others then denied:=sqlerrm='B8_OWNER_AAL2_REQUIRED';end;
 if not denied then raise exception 'B8_EDITOR_CASE_LIST_LEAK';end if;
end $b8$;
reset role;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_aal','aal1',false);
set role authenticated;
do $b8$ declare denied boolean:=false;
begin
 begin perform public.jb_b8_g1_owner_case_choices();
 exception when others then denied:=sqlerrm='B8_OWNER_AAL2_REQUIRED';end;
 if not denied then raise exception 'B8_OWNER_AAL1_READ_CASES';end if;
end $b8$;
reset role;
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g1_owner_create_case('TEST ONLY mobile case pick verify','Shivpuri','R0') as picker_case_id \gset
do $b8$
declare v jsonb; r jsonb;
begin
 v:=public.jb_b8_g1_owner_case_choices();
 if pg_catalog.jsonb_typeof(v)<>'array' or pg_catalog.jsonb_array_length(v)<>1 then
   raise exception 'B8_OWNER_CASE_LIST_WRONG_CARDINALITY'; end if;
 r:=v->0;
 if r->>'title'<>'TEST ONLY mobile case pick verify'
 or r->>'risk_lane'<>'R0' or r->>'state'<>'draft'
 or r ? 'question_text' or r ? 'created_by' or r ? 'recipient_label'
 or (select count(*) from pg_catalog.jsonb_object_keys(r))<>5 then
   raise exception 'B8_OWNER_CASE_LIST_PROJECTED_UNSAFE_FIELDS %',r;end if;
end $b8$;
reset role;
select set_config('b8.fixture_session','off',false);
set role authenticated;
do $b8$ declare denied boolean:=false;
begin
 begin perform public.jb_b8_g1_owner_case_choices();
 exception when others then denied:=sqlerrm='B8_OWNER_AAL2_REQUIRED';end;
 if not denied then raise exception 'B8_EXPIRED_SESSION_READ_OWNER_CASES';end if;
end $b8$;
reset role;
rollback;
\echo 'B8 OWNER CASE PICKER 7 TEST GATES PASS — no LIVE writes'
