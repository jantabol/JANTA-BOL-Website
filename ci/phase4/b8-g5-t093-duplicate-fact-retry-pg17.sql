\set ON_ERROR_STOP on
-- Disposable PG17, no live writes: founder can append NEW fact but cannot repeat exact G5 fact.
begin;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_session','on',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g1_owner_create_case(
 'SYNTHETIC exact duplicate private fact protection',
 'Shivpuri','R0') as de_dupe_case \gset
select set_config('b8.duplicate_case',:'de_dupe_case',false);
select public.jb_b8_g5_owner_record_fact(
 :'de_dupe_case'::uuid,'IMPACT','DOCUMENTED_PROJECTED',
 'Historic source shows 68,588 trees potentially affected, actual felling not verified.',
 null,null,null) as first_impact_event \gset
select set_config('b8.first_impact',:'first_impact_event',false);
do $b8$
declare v_case uuid=current_setting('b8.duplicate_case')::uuid;
 v jsonb; denied boolean:=false; v_first bigint:=current_setting('b8.first_impact')::bigint;
begin
 begin
 perform public.jb_b8_g5_owner_record_fact(
  v_case,'IMPACT','DOCUMENTED_PROJECTED',
  'Historic source shows 68,588 trees potentially affected, actual felling not verified.',
  null,null,null);
 exception when others then denied:=sqlerrm='B8_G5_EXACT_DUPLICATE_NOT_APPENDED';end;
 if not denied then raise exception 'B8_G5_SAME_FACT_RETRY_APPENDED';end if;
 select public.jb_b8_g5_owner_private_ledger(v_case) into v;
 if jsonb_array_length(v)<>1 or v->0->>'id'<>v_first::text
 then raise exception 'B8_G5_RETRY_DID_NOT_PRESERVE_ORIGINAL';end if;
end $b8$;
-- DIFFERENT source observation is a new immutable fact, not accidentally suppressed.
select public.jb_b8_g5_owner_record_fact(
 :'de_dupe_case'::uuid,'IMPACT','DOCUMENTED_PROJECTED',
 'Later independent document supplies NEW context; still not independently verified.',
 null,null,null) as second_impact_event \gset
-- Separate Cost is also protected from accidental re-submit.
select public.jb_b8_g5_owner_record_fact(
 :'de_dupe_case'::uuid,'COST','ESTIMATED_PROPOSED',
 'Historical estimated construction cost, not government sanction or actual spend.',
 23864600000.00,null,null) as first_cost_event \gset
do $b8$
declare v_case uuid=current_setting('b8.duplicate_case')::uuid;
 denied boolean:=false; v jsonb;
begin
 begin
 perform public.jb_b8_g5_owner_record_fact(
  v_case,'COST','ESTIMATED_PROPOSED',
  'Historical estimated construction cost, not government sanction or actual spend.',
  23864600000.00,null,null);
 exception when others then denied:=sqlerrm='B8_G5_EXACT_DUPLICATE_NOT_APPENDED';end;
 if not denied then raise exception 'B8_G5_SAME_COST_RETRY_APPENDED';end if;
 select public.jb_b8_g5_owner_private_ledger(v_case) into v;
 if jsonb_array_length(v)<>3
 or (select count(*) from pg_catalog.jsonb_array_elements(v) as entry
   where entry->>'field'='DOCUMENTED_PROJECTED')<>2
 or (select count(*) from pg_catalog.jsonb_array_elements(v) as entry
   where entry->>'field'='ESTIMATED_PROPOSED')<>1
 then raise exception 'B8_G5_FACTS_WRONG_AFTER_DUPLICATE_GUARD';end if;
end $b8$;
reset role;
-- The original append-only guarantee remains active even after function replacement.
do $b8$
declare v_id bigint= current_setting('b8.first_impact')::bigint;
 denied boolean:=false;
begin
 begin update public.b8_g5_fact_events set field_code='GROUND_REPORTED' where id=v_id;
 exception when others then denied:=sqlerrm='B8_G5_IMMUTABLE_FACT_HISTORY';end;
 if not denied then raise exception 'B8_G5_DUPLICATE_FIX_BROKE_IMMUTABILITY';end if;
end $b8$;
rollback;
\echo 'B8 G5 EXACT RE-SUBMIT BLOCKED; distinct facts append; original history immutable — PASS'
