\set ON_ERROR_STOP on
-- JANTA BOL B8 G5 original T093/T095/T096/T097 — actual disposable PostgreSQL17 test.
-- Only authority/SOURCE checks; NOT live E2, Android E3, Founder E5 or external official E9.
-- Earlier G4 CP04 explicitly commits an isolated HIDE case. Preserve that baseline; do not assert zero pre-existing cases.
select set_config('b8.g5_baseline_cases',(select count(*)::text from public.b8_cases),false);
begin;
do $b8$
begin
 if has_table_privilege('anon','public.b8_g5_fact_events','SELECT')
 or has_table_privilege('authenticated','public.b8_g5_fact_events','SELECT')
 or has_function_privilege('anon','public.jb_b8_g5_owner_private_ledger(uuid)','EXECUTE')
 or has_function_privilege('anon','public.jb_b8_g5_owner_record_fact(uuid,text,text,text,numeric,date,uuid)','EXECUTE')
 then raise exception 'B8_G5_PRIVATE_ACL_EXPOSED';end if;
end $b8$;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_session','on',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g1_owner_create_case(
 'SYNTHETIC Ground impact and cost fact attribution','Pichhore','R1') as g5_case \gset
select public.jb_b8_g1_owner_create_case(
 'SYNTHETIC Separate cross-case receipt and conflict','Shivpuri','R0') as g5_other \gset
reset role;
select set_config('b8.g5_case',:'g5_case',false);
select set_config('b8.g5_other',:'g5_other',false);

-- The physical BYTE receipt is a synthetic fixture only. It is NOT evidence a real official said anything.
insert into public.b8_private_upload_intents (
 id,case_id,reporter_user_id,reporter_session_id,object_key,
 original_label,expected_mime,expected_bytes)
values (
 '88888888-8888-4888-8888-888888888881',:'g5_case'::uuid,
 '22222222-2222-2222-2222-222222222222',
 '99999999-9999-4999-8999-999999999991','g5/isolated/receipt-one',
 'Synthetic case-specific PDF','application/pdf',100),
 (
 '88888888-8888-4888-8888-888888888882',:'g5_other'::uuid,
 '22222222-2222-2222-2222-222222222222',
 '99999999-9999-4999-8999-999999999992','g5/isolated/receipt-other',
 'Synthetic separate-case PDF','application/pdf',100);
insert into public.b8_private_upload_receipts (
 id,intent_id,case_id,server_sha256,byte_count,mime_type)
values (
 '77777777-7777-4777-8777-777777777771',
 '88888888-8888-4888-8888-888888888881',:'g5_case'::uuid,
 repeat('a',64),100,'application/pdf'),
 (
 '77777777-7777-4777-8777-777777777772',
 '88888888-8888-4888-8888-888888888882',:'g5_other'::uuid,
 repeat('b',64),100,'application/pdf');

-- Distinct, same-case private receipt *not consumed* in closure, for genuinely
-- newly considered material after closure (no false "new evidence" reusing close receipt).
insert into public.b8_private_upload_intents
(id,case_id,reporter_user_id,reporter_session_id,object_key,original_label,expected_mime,expected_bytes)
values ('88888888-8888-4888-8888-888888888883',:'g5_case'::uuid,
 '22222222-2222-2222-2222-222222222222',
 '99999999-9999-4999-8999-999999999993','g5/isolated/receipt-new',
 'Synthetic newly considered source','application/pdf',100);
insert into public.b8_private_upload_receipts
(id,intent_id,case_id,server_sha256,byte_count,mime_type)
values ('77777777-7777-4777-8777-777777777773',
 '88888888-8888-4888-8888-888888888883',:'g5_case'::uuid,
 repeat('c',64),100,'application/pdf');


-- Anonymous can't read or write ledger via exposed RPC.
set role anon;
do $b8$
declare denied boolean:=false;
begin
 begin
  perform public.jb_b8_g5_owner_private_ledger(current_setting('b8.g5_case')::uuid);
 exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'B8_G5_ANON_PRIVATE_LEDGER_READ';end if;
end $b8$;
reset role;
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
select set_config('b8.fixture_aal','aal1',false);
set role authenticated;
do $b8$
declare denied boolean:=false;
begin
 begin
 perform public.jb_b8_g5_owner_record_fact(
  current_setting('b8.g5_case')::uuid,'COST','ACTUAL',
  'Unverified staff input must never be written by a reporter',200,null,null);
 exception when others then denied:=sqlerrm='B8_OWNER_AAL2_REQUIRED';end;
 if not denied then raise exception 'B8_G5_REPORTER_ESCALATED';end if;
end $b8$;
reset role;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
set role authenticated;
do $b8$
declare denied boolean:=false;
begin
 begin
 perform public.jb_b8_g5_owner_record_fact(
  current_setting('b8.g5_case')::uuid,'COST','ACTUAL',
  'Owner with AAL1 is not allowed to record a cost',300,null,null);
 exception when others then denied:=sqlerrm='B8_OWNER_AAL2_REQUIRED';end;
 if not denied then raise exception 'B8_G5_OWNER_AAL1_BYPASS';end if;
end $b8$;
reset role;
select set_config('b8.fixture_aal','aal2',false);

-- Original deadline cannot silently be inserted twice or backfilled AFTER revision.
set role authenticated;
do $b8$
declare denied boolean:=false;
begin
 begin
 perform public.jb_b8_g5_owner_record_fact(
  current_setting('b8.g5_case')::uuid,'DEADLINE','REVISED',
  'New completion date attributed to an unverified authority claim',
  null,'2027-02-01',null);
 exception when others then denied:=sqlerrm='B8_G5_ORIGINAL_DEADLINE_REQUIRED';end;
 if not denied then raise exception 'B8_G5_REVISED_WITH_NO_ORIGINAL';end if;
end $b8$;
select public.jb_b8_g5_owner_record_fact(
 :'g5_case'::uuid,'DEADLINE','ORIGINAL',
 'Original scheduled completion reported in a public record',null,'2027-01-01',
 '77777777-7777-4777-8777-777777777771'::uuid);
select public.jb_b8_g5_owner_record_fact(
 :'g5_case'::uuid,'DEADLINE','REVISED',
 'Later stated completion; original remains unchanged',null,'2027-04-01',null);
do $b8$
declare denied boolean:=false;
begin
 begin
 perform public.jb_b8_g5_owner_record_fact(
  current_setting('b8.g5_case')::uuid,'DEADLINE','ORIGINAL',
  'Attempt to overwrite the original target date',null,'2027-04-02',null);
 exception when others then denied:=sqlerrm='B8_G5_ORIGINAL_DEADLINE_ALREADY_SEALED';end;
 if not denied then raise exception 'B8_G5_ORIGINAL_DEADLINE_DUPLICATED';end if;
end $b8$;

-- Costs are five distinct attributed stages, including estimated/proposed. NO source estimate becomes sanctioned or actual.
select public.jb_b8_g5_owner_record_fact(
 :'g5_case'::uuid,'COST','ESTIMATED_PROPOSED','Historical consultant estimate only; approval or actual expenditure NOT proved',23864600000,null,null);
select public.jb_b8_g5_owner_record_fact(
 :'g5_case'::uuid,'COST','SANCTIONED','Sanctioned amount is a reported official figure',120000,null,null);
select public.jb_b8_g5_owner_record_fact(
 :'g5_case'::uuid,'COST','TENDER','Tender amount attributed to a cited record',118000,null,null);
select public.jb_b8_g5_owner_record_fact(
 :'g5_case'::uuid,'COST','REVISED','Revised amount separately represented for audit',145000,null,null);
select public.jb_b8_g5_owner_record_fact(
 :'g5_case'::uuid,'COST','ACTUAL','Reported expenditure not equated to estimates',98000,null,null);
select public.jb_b8_g5_owner_record_fact(
 :'g5_case'::uuid,'GROUND','AUTHORITY_COMPLETION_CLAIM',
 'Office claims completion; not a verified field observation',null,null,null);
select public.jb_b8_g5_owner_record_fact(
 :'g5_case'::uuid,'GROUND','FIELD_OBSERVATION_REPORTED',
 'Field visit note recorded separately without authenticating it',null,null,null);
select public.jb_b8_g5_owner_record_fact(
 :'g5_case'::uuid,'IMPACT','AUTHORITY_STATED',
 'Official forecast of impact only, not actual benefit',null,null,null);
select public.jb_b8_g5_owner_record_fact(
 :'g5_case'::uuid,'IMPACT','GROUND_REPORTED',
 'Ground effect is reported and subject to verification',null,null,null);
select public.jb_b8_g5_owner_record_fact(
 :'g5_case'::uuid,'ALTERNATIVE','UNVERIFIED_PROPOSAL',
 'Potential alternate construction method has no cited proof',null,null,null);
select public.jb_b8_g5_owner_record_fact(
 :'g5_case'::uuid,'RESPONSIBILITY','ROLE_MAP',
 'Responsible public office is recorded as a role, not as blame',null,null,null);
reset role;

-- Guard cross-case private receipt and invalid labels; lack of a citation never becomes "verified".
set role authenticated;
do $b8$
declare cross_denied boolean:=false;wrong_kind boolean:=false;
begin
 begin
 perform public.jb_b8_g5_owner_record_fact(
  current_setting('b8.g5_case')::uuid,'GROUND','FIELD_OBSERVATION_REPORTED',
  'Evidence receipt belongs to a different private case',null,null,
  '77777777-7777-4777-8777-777777777772'::uuid);
 exception when others then cross_denied:=sqlerrm='B8_G5_CROSS_CASE_RECEIPT_DENIED';end;
 begin
 perform public.jb_b8_g5_owner_record_fact(
  current_setting('b8.g5_case')::uuid,'IMPACT','ACTUAL',
  'Invalid type mixing source and numeric budget fields',null,null,null);
 exception when check_violation then wrong_kind:=true;end;
 if not(cross_denied and wrong_kind) then
  raise exception 'B8_G5_CROSS_CASE_OR_TYPE_BYPASS';end if;
end $b8$;
reset role;

-- G4 cannot publish conflict-flagged case; already published must HIDE before flag.
set role authenticated;
select public.jb_b8_g5_owner_record_fact(
 :'g5_other'::uuid,'CONFLICT','FLAG_RAISED',
 'Founder or newsroom conflict of interest flagged for review',null,null,null);
do $b8$
declare denied boolean:=false;
begin
 begin
 perform public.jb_b8_g4_owner_release_public_projection(
 current_setting('b8.g5_other')::uuid,'PUBLISH','PUBLIC_WORKS',
 'SHIVPURI','UNDER_REVIEW',true);
 exception when others then denied:=sqlerrm='B8_G5_UNRESOLVED_CONFLICT_PUBLIC_DENIED';end;
 if not denied then raise exception 'B8_G5_CONFLICT_PUBLISHED';end if;
end $b8$;
select public.jb_b8_g4_owner_release_public_projection(
 :'g5_case'::uuid,'PUBLISH','PUBLIC_WORKS','PICHHORE','UNDER_REVIEW',true);
do $b8$
declare denied boolean:=false;
begin
 begin
 perform public.jb_b8_g5_owner_record_fact(
 current_setting('b8.g5_case')::uuid,'CONFLICT','FLAG_RAISED',
 'Late safety conflict must hide before it can be recorded',null,null,null);
 exception when others then denied:=sqlerrm='B8_G5_HIDE_PUBLIC_BEFORE_CONFLICT_FLAG';end;
 if not denied then raise exception 'B8_G5_PUBLIC_CONFLICT_RACE';end if;
end $b8$;
select public.jb_b8_g4_owner_release_public_projection(
 :'g5_case'::uuid,'HIDE',null,null,null,false);
select public.jb_b8_g5_owner_record_fact(
 :'g5_case'::uuid,'CONFLICT','FLAG_RAISED',
 'Private safety issue logged after public projection was hidden',null,null,null);
reset role;

-- Close/reopen must have a SAME-CASE private byte receipt; no automatic approval or verified outcome.
set role authenticated;
do $b8$
declare denied boolean:=false;
begin
 begin
 perform public.jb_b8_g5_owner_record_outcome(
 current_setting('b8.g5_case')::uuid,'closed',
 'No private evidence must never be presented as case closure',null);
 exception when others then denied:=sqlerrm='B8_G5_CLOSE_REQUIRES_PRIVATE_BYTES_RECEIPT';end;
 if not denied then raise exception 'B8_G5_CLOSED_WITHOUT_PRIVATE_RECEIPT';end if;
end $b8$;
select public.jb_b8_g5_owner_record_outcome(
 :'g5_case'::uuid,'monitoring',
 'Unanswered project completion report remains under monitoring',null);
select public.jb_b8_g5_owner_record_outcome(
 :'g5_case'::uuid,'closed',
 'Editorially closed with recorded reason, NOT judicial guilt or official outcome',
 '77777777-7777-4777-8777-777777777771'::uuid);
do $b8$
declare denied boolean:=false;
begin
 begin
 perform public.jb_b8_g5_owner_reopen_case(
 current_setting('b8.g5_case')::uuid,
 '77777777-7777-4777-8777-777777777772'::uuid,
 'Cross-case uploaded document must not reopen this case');
 exception when others then denied:=sqlerrm='B8_G5_REOPEN_REQUIRES_SAME_CASE_BYTES';end;
 if not denied then raise exception 'B8_G5_REOPEN_CROSS_CASE';end if;
end $b8$;
-- Negative: reopening with the evidence receipt already used to CLOSE must fail.
do $b8$
declare denied boolean:=false;
begin
 begin
 perform public.jb_b8_g5_owner_reopen_case(
  current_setting('b8.g5_case')::uuid,
  '77777777-7777-4777-8777-777777777771'::uuid,
  'Do not reuse closing receipt pretending the material is newly considered');
 exception when others then denied:=sqlerrm='B8_G5_REOPEN_RECEIPT_ALREADY_USED';end;
 if not denied then raise exception 'B8_G5_FAKE_NEW_MATERIAL_REOPEN_ACCEPTED';end if;
end $b8$;
select public.jb_b8_g5_owner_reopen_case(
 :'g5_case'::uuid,'77777777-7777-4777-8777-777777777773'::uuid,
 'Separate material receipt newly considered on reopening; authenticity still unverified');
reset role;

-- Sealed history and proof statuses cannot be rewritten by application OR migration fixture.
do $b8$
declare blocked boolean:=false;v_cnt integer;v_json jsonb;
begin
 begin
 update public.b8_g5_fact_events
 set authenticity='NOT_INDEPENDENTLY_VERIFIED' where case_id=current_setting('b8.g5_case')::uuid;
 exception when others then blocked:=sqlerrm='B8_G5_IMMUTABLE_FACT_HISTORY';end;
 if not blocked then raise exception 'B8_G5_APPEND_ONLY_HISTORY_MUTABLE';end if;
 select count(*) into v_cnt from public.b8_g5_fact_events
 where case_id=current_setting('b8.g5_case')::uuid;
 if v_cnt<>17 then raise exception 'B8_G5_UNEXPECTED_EVENT_COUNT: %',v_cnt;end if;
 if (select case_state from public.b8_cases where id=current_setting('b8.g5_case')::uuid)<>'investigating'
 or (select count(*) from public.b8_g5_fact_events
 where case_id=current_setting('b8.g5_case')::uuid and kind='DEADLINE')<>2
 or (select count(*) from public.b8_g5_fact_events
 where case_id=current_setting('b8.g5_case')::uuid and kind='COST')<>5
 or exists(select 1 from public.b8_g5_fact_events
 where authenticity<>'NOT_INDEPENDENTLY_VERIFIED')
 then raise exception 'B8_G5_HISTORY_OR_REAL_TRUTH_LABEL_DRIFT';end if;
 if (select count(*) from public.articles where id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')<>1
 or (select count(*) from public.ad_campaigns where id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')<>1
 then raise exception 'B8_G5_OLD_NEWS_B7_MODIFIED';end if;
 raise notice 'B8 G5 real disposable PG17: cost5 with isolated estimated proposal, deadline original/revised, ground/impact split, conflicting public RLS, Owner MFA, cross-case bytes, closure/reopen, immutable and original News/Ad sentinels PASS';
end $b8$;
set role authenticated;
do $b8$
declare v jsonb;
begin
 v:=public.jb_b8_g5_owner_private_ledger(current_setting('b8.g5_case')::uuid);
 if jsonb_array_length(v)<>17
 or not exists(select 1 from jsonb_array_elements(v) e
   where e->>'kind'='COST' and e->>'field'='ESTIMATED_PROPOSED'
      and e->>'authenticity'='NOT_INDEPENDENTLY_VERIFIED')
 or exists(select 1 from jsonb_array_elements(v) e where e->>'authenticity'<>'NOT_INDEPENDENTLY_VERIFIED')
 then raise exception 'B8_G5_PRIVATE_LEDGER_TRUTH';end if;
end $b8$;
reset role;
rollback;
do $b8$
begin
 if exists(select 1 from public.b8_g5_fact_events)
 or (select count(*) from public.b8_cases) <> current_setting('b8.g5_baseline_cases')::integer then
 raise exception 'B8_G5_DISPOSABLE_FIXTURE_ROLLBACK_FAILED';end if;
 raise notice 'B8 G5 ROLLBACK complete; no LIVE data; T092–099 still NOT FINAL PASS';
end $b8$;
