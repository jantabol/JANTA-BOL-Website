\set ON_ERROR_STOP on
-- T093 actual disposable PG17: historical consultant forecast != authority statement or field result.
begin;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_session','on',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g1_owner_create_case('SYNTHETIC projected effects independent source integrity check','Shivpuri','R0') as impact_case \gset
select public.jb_b8_g5_owner_record_fact(
 :'impact_case'::uuid,'IMPACT','DOCUMENTED_PROJECTED',
 'Historical consultant source projects affected trees; no current felling confirmed.',
 null,null,null) as projected_event \gset
select public.jb_b8_g5_owner_record_fact(
 :'impact_case'::uuid,'COST','ESTIMATED_PROPOSED',
 'Historical estimate not actual expenditure.',23864600000.00,null,null) as estimate_event \gset
select public.jb_b8_g5_owner_private_ledger(:'impact_case'::uuid) as ledger \gset
select set_config('b8.t093_case',:'impact_case',false);
select set_config('b8.t093_event',:'projected_event',false);
do $b8$
declare v_case uuid=current_setting('b8.t093_case')::uuid;
 v_event bigint=current_setting('b8.t093_event')::bigint;
 v jsonb;denied boolean;
begin
 select public.jb_b8_g5_owner_private_ledger(v_case) into v;
 if jsonb_array_length(v)<>2 or
 (select count(*) from pg_catalog.jsonb_array_elements(v) as row_value
  where row_value->>'id'=v_event::text
    and row_value->>'kind'='IMPACT'
    and row_value->>'field'='DOCUMENTED_PROJECTED'
    and row_value->>'authenticity'='NOT_INDEPENDENTLY_VERIFIED'
    and row_value->>'cost_inr' is null
    and row_value->>'date' is null)<>1
 then raise exception 'B8_T093_PROJECTED_IMPACT_NOT_PRIVATELY_STORED';end if;
 denied:=false;
 begin perform public.jb_b8_g5_owner_record_fact(
   v_case,'IMPACT','DOCUMENTED_PROPOSAL','Wrong alternative class cannot pose as projected impact',null,null,null);
 exception when check_violation then denied:=true;end;
 if not denied then raise exception 'B8_T093_CROSS_KIND_ALIAS_ALLOW';end if;
 denied:=false;
 begin perform public.jb_b8_g5_owner_record_fact(
   v_case,'IMPACT','DOCUMENTED_PROJECTED','Cost must never be attached to an impact forecast',10,null,null);
 exception when check_violation then denied:=true;end;
 if not denied then raise exception 'B8_T093_IMPACT_COST_MIX';end if;
 denied:=false;
 begin perform public.jb_b8_g5_owner_record_fact(
   v_case,'IMPACT','DOCUMENTED_PROJECTED','Date not a deadline in source impact',null,'2027-01-01',null);
 exception when check_violation then denied:=true;end;
 if not denied then raise exception 'B8_T093_IMPACT_DATE_MIX';end if;
end $b8$;
reset role;
-- Even SQL owner cannot erase a recorded event after the migration.
do $b8$
declare denied boolean:=false;
begin
 begin
 update public.b8_g5_fact_events set field_code='GROUND_REPORTED'
 where id=current_setting('b8.t093_event')::bigint;
 exception when others then denied:=sqlerrm='B8_G5_IMMUTABLE_FACT_HISTORY';end;
 if not denied then raise exception 'B8_T093_ORIGINAL_HISTORY_MUTABLE';end if;
end $b8$;
select set_config('b8.fixture_aal','aal1',false);
set role authenticated;
do $b8$
declare denied boolean:=false;
begin
 begin
 perform public.jb_b8_g5_owner_record_fact(
 current_setting('b8.t093_case')::uuid,'IMPACT','DOCUMENTED_PROJECTED','AAL1 cannot record impact',null,null,null);
 exception when others then denied:=sqlerrm='B8_OWNER_AAL2_REQUIRED';end;
 if not denied then raise exception 'B8_T093_AAL1_ALLOWED_PROJECTED_IMPACT';end if;
end $b8$;
reset role;
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
do $b8$
declare denied boolean:=false;
begin
 begin
 perform public.jb_b8_g5_owner_record_fact(
 current_setting('b8.t093_case')::uuid,'IMPACT','DOCUMENTED_PROJECTED','Reporter cannot project impact as verified',null,null,null);
 exception when others then denied:=sqlerrm='B8_OWNER_AAL2_REQUIRED';end;
 if not denied then raise exception 'B8_T093_REPORTER_ALLOWED_PROJECTED_IMPACT';end if;
end $b8$;
reset role;
rollback;
\echo 'T093 DOCUMENTED_PROJECTED: REAL PG17 positive/negative + immutability PASS'
