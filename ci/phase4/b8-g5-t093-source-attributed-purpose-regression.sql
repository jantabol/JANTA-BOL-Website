\set ON_ERROR_STOP on
-- T093 ACC-009: specific 2010 consultancy-stated PURPOSE, not verified authority policy.
-- Isolated disposable PostgreSQL17 fixture, rollback always.
begin;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_session','on',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g1_owner_create_case('T093 synthetic stated purpose', 'Shivpuri', 'R0') as purpose_case \gset
select set_config('b8.purpose_case',:'purpose_case',false);
select public.jb_b8_g5_owner_record_fact(
 :'purpose_case'::uuid,'PURPOSE','DOCUMENTED_STATED',
 '2010 consultant ES.2: upgrading existing two-lane corridor to 4/6 lanes; not proof of execution. Source: https://www.mppcb.mp.gov.in/pdf/Exe_Summ/Exe_Summ_NH3ShivDew_Eng.pdf',
 null,null,null) as new_purpose \gset
select set_config('b8.purpose_event',:'new_purpose',false);
do $b8$
declare v_case uuid=current_setting('b8.purpose_case')::uuid;
 event_id bigint=current_setting('b8.purpose_event')::bigint;
 v jsonb;blocked boolean;
begin
 select public.jb_b8_g5_owner_private_ledger(v_case) into v;
 if jsonb_array_length(v)<>1 or
   (select count(*) from pg_catalog.jsonb_array_elements(v) as x
      where x->>'id'=event_id::text and x->>'kind'='PURPOSE'
      and x->>'field'='DOCUMENTED_STATED'
      and x->>'authenticity'='NOT_INDEPENDENTLY_VERIFIED')<>1
 then raise exception 'T093_PURPOSE_LEDGER_UNTRUTHFUL';end if;
 blocked:=false;
 begin perform public.jb_b8_g5_owner_record_fact(
  v_case,'PURPOSE','DOCUMENTED_STATED','2010 source stated road improvement without cited link',null,null,null);
 exception when others then blocked:=sqlerrm='B8_T093_PURPOSE_SOURCE_REQUIRED';end;
 if not blocked then raise exception 'T093_UNSOURCED_PURPOSE_ACCEPTED';end if;
 blocked:=false;
 begin perform public.jb_b8_g5_owner_record_fact(
  v_case,'PURPOSE','DOCUMENTED_PROJECTED','https://example.test/ wrong kind impact as purpose',null,null,null);
 exception when others then blocked:=sqlstate='23514';end;
 if not blocked then raise exception 'T093_PURPOSE_IMPACT_MERGED';end if;
 blocked:=false;
 begin perform public.jb_b8_g5_owner_record_fact(
  v_case,'PURPOSE','DOCUMENTED_STATED','https://example.test/ purpose cannot be a cost',10,null,null);
 exception when others then blocked:=sqlstate='23514';end;
 if not blocked then raise exception 'T093_PURPOSE_COST_MIX';end if;
 blocked:=false;
 begin perform public.jb_b8_g5_owner_record_fact(
  v_case,'PURPOSE','DOCUMENTED_STATED',
  '2010 consultant ES.2: upgrading existing two-lane corridor to 4/6 lanes; not proof of execution. Source: https://www.mppcb.mp.gov.in/pdf/Exe_Summ/Exe_Summ_NH3ShivDew_Eng.pdf',
  null,null,null);
 exception when others then blocked:=sqlerrm='B8_G5_EXACT_DUPLICATE_NOT_APPENDED';end;
 if not blocked then raise exception 'T093_PURPOSE_DUPLICATE_APPENDED';end if;
end $b8$;
reset role;
select set_config('b8.fixture_aal','aal1',false);
set role authenticated;
do $b8$
declare blocked boolean:=false;
begin
 begin perform public.jb_b8_g5_owner_record_fact(
 current_setting('b8.purpose_case')::uuid,'PURPOSE','DOCUMENTED_STATED','https://example.test/ aal1 denied',null,null,null);
 exception when others then blocked:=sqlerrm='B8_OWNER_AAL2_REQUIRED';end;
 if not blocked then raise exception 'T093_AAL1_PURPOSE_WRITE';end if;
end $b8$;
reset role;
select set_config('b8.fixture_aal','aal2',false);
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
set role authenticated;
do $b8$
declare blocked boolean:=false;
begin
 begin perform public.jb_b8_g5_owner_record_fact(
 current_setting('b8.purpose_case')::uuid,'PURPOSE','DOCUMENTED_STATED','https://example.test/ reporter denied',null,null,null);
 exception when others then blocked:=sqlerrm='B8_OWNER_AAL2_REQUIRED';end;
 if not blocked then raise exception 'T093_REPORTER_PURPOSE_WRITE';end if;
end $b8$;
reset role;
-- Permanent original G5 events remain append-only after enum expansion.
do $b8$
declare blocked boolean:=false;
begin
 begin
  update public.b8_g5_fact_events set field_code='DOCUMENTED_PROJECTED'
   where id=current_setting('b8.purpose_event')::bigint;
 exception when others then blocked:=sqlerrm='B8_G5_IMMUTABLE_FACT_HISTORY';end;
 if not blocked then raise exception 'T093_PURPOSE_NOT_IMMUTABLE';end if;
end $b8$;
rollback;
\echo 'T093 ACC-009 PURPOSE source link and AAL2: positive + fail-closed negative + original immutable PASS'
