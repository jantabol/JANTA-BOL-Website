\set ON_ERROR_STOP on
-- G8 actual disposable PG17, never external provider SEND.
select set_config('b8.g8_cases_before',(select count(*)::text from public.b8_cases),false);
begin;
do $b8$
begin
 if has_table_privilege('anon','public.b8_g8_manual_delivery_attestations','SELECT')
 or has_table_privilege('authenticated','public.b8_g8_manual_delivery_attestations','INSERT')
 or has_function_privilege('anon','public.jb_b8_g8_owner_attest_manual_delivery(uuid,uuid,text)','EXECUTE')
 then raise exception 'B8_G8_MANUAL_PROOF_RAW_PRIVILEGE_LEAK';end if;
end $b8$;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_aal','aal2',false);
select set_config('b8.fixture_session','on',false);
set role authenticated;
select public.jb_b8_g1_owner_create_case(
 'Synthetic manual contacted Pichhore public service case','Pichhore','R0') as case_id \gset
select public.jb_b8_g1_owner_create_case(
 'Synthetic unrelated officer must stay private case','Shivpuri','R0') as other_case \gset
select public.jb_b8_g1_owner_assign_reporter(
 :'case_id'::uuid,'22222222-2222-2222-2222-222222222222',now()+interval '2 days');
select public.jb_b8_g6_owner_set_private_upload(
 true,'Synthetic isolated G8 proof data and no actual provider external contact');
reset role;
select set_config('b8.g8_case',:'case_id',false);
select set_config('b8.g8_other',:'other_case',false);
insert into public.b8_private_upload_intents
(id,case_id,reporter_user_id,reporter_session_id,object_key,
 original_label,expected_mime,expected_bytes)
values(
 '88888888-8888-4888-8888-888888888881',:'case_id'::uuid,
 '22222222-2222-2222-2222-222222222222',
 '66666666-6666-4666-8666-666666666666','g8/test/receipt-one.bin',
 'Simulated office submission record','application/pdf',100),
 (
 '88888888-8888-4888-8888-888888888882',:'other_case'::uuid,
 '22222222-2222-2222-2222-222222222222',
 '66666666-6666-4666-8666-666666666666','g8/test/receipt-other.bin',
 'Simulated other-office record','application/pdf',100);
insert into public.b8_private_upload_receipts
(id,intent_id,case_id,server_sha256,byte_count,mime_type)
values (
 '77777777-7777-4777-8777-777777777781',
 '88888888-8888-4888-8888-888888888881',:'case_id'::uuid,repeat('a',64),100,'application/pdf'),
 (
 '77777777-7777-4777-8777-777777777782',
 '88888888-8888-4888-8888-888888888882',:'other_case'::uuid,repeat('b',64),100,'application/pdf');
set role authenticated;
select public.jb_b8_g6_owner_set_private_upload(
 false,'Finished isolated synthetic G8 byte receipts now emergency upload disabled');
reset role;
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
select set_config('b8.fixture_aal','aal1',false);
set role authenticated;
select public.jb_b8_g1_reporter_create_draft(
 :'case_id'::uuid,
 'Please provide original sanctioned allocation and dated expenditure proof.',
 'Pichhore Public Works Office') as question \gset
select public.jb_b8_g3_reporter_prepare_manual_handoff(
 :'question'::uuid,'OFFICIAL_PORTAL') as handoff \gset
reset role;
select set_config('b8.g8_handoff',:'handoff',false);
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
do $b8$
declare denied boolean:=false;
begin
 begin
 perform public.jb_b8_g4_owner_release_public_projection(
  current_setting('b8.g8_case')::uuid,'PUBLISH',
  'PUBLIC_WORKS','PICHHORE','RECORDS_REQUESTED',true);
 exception when others then denied:=sqlerrm='B8_G4_NO_REAL_OFFICIAL_DISPATCH_PROOF';end;
 if not denied then raise exception 'B8_G8_PUBLIC_REQUESTED_BEFORE_E9_REVIEW';end if;
end $b8$;
reset role;
-- Attach reporter's claimed external record. STILL not actual proof yet.
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
select set_config('b8.fixture_aal','aal1',false);
set role authenticated;
select public.jb_b8_g3_reporter_record_handoff_observation(
 :'handoff'::uuid,'UNVERIFIED_RECEIPT_ATTACHED',
 '77777777-7777-4777-8777-777777777781'::uuid) as obs \gset
do $b8$
declare denied boolean:=false;
begin
 begin
 perform public.jb_b8_g8_owner_attest_manual_delivery(
  current_setting('b8.g8_handoff')::uuid,
  '77777777-7777-4777-8777-777777777781'::uuid,
  'Reporter cannot attest authentic official portal acceptance');
 exception when others then denied:=sqlerrm='B8_OWNER_AAL2_REQUIRED';end;
 if not denied then raise exception 'B8_G8_REPORTER_ATTESTED_PROVIDER';end if;
end $b8$;
reset role;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
do $b8$
declare wrong boolean:=false;missing boolean:=false;
begin
 begin
 perform public.jb_b8_g8_owner_attest_manual_delivery(
  current_setting('b8.g8_handoff')::uuid,
  '77777777-7777-4777-8777-777777777782'::uuid,
  'Wrong-case receipt cannot be used as government acceptance');
 exception when others then wrong:=sqlerrm='B8_G8_CROSS_CASE_RECEIPT_DENIED';end;
 if not wrong then raise exception 'B8_G8_OTHER_PRIVATE_CASE_ACCEPTED';end if;
 begin
 perform public.jb_b8_g8_owner_attest_manual_delivery(
  current_setting('b8.g8_handoff')::uuid,
  null,'No actual receipt must fail instead of inventing official acceptance');
 exception when others then missing:=sqlerrm='B8_G8_CROSS_CASE_RECEIPT_DENIED';end;
 if not missing then raise exception 'B8_G8_OWNER_MISSING_PROOF_ACCEPTED';end if;
end $b8$;
select public.jb_b8_g8_owner_attest_manual_delivery(
 :'handoff'::uuid,'77777777-7777-4777-8777-777777777781'::uuid,
 'Founder visually checked this synthetic portal acknowledgment in isolated fixture') as attestation \gset
select public.jb_b8_g4_owner_release_public_projection(
 :'case_id'::uuid,'PUBLISH','PUBLIC_WORKS','PICHHORE','RECORDS_REQUESTED',true) as approved \gset
select public.jb_b8_g4_owner_release_public_projection(
 :'case_id'::uuid,'REVISE','PUBLIC_WORKS','PICHHORE','AWAITING_RESPONSE',true) as revised \gset
reset role;
set role anon;
do $b8$
declare v jsonb;
begin
 v:=public.jb_b8_g4_public_case(current_setting('b8.g8_case')::uuid);
 if v->>'public_status'<>'AWAITING_RESPONSE'
 or v->>'official_reply_independently_verified'<>'false'
 or v::text like '%77777777-7777-4777-8777-777777777781%'
 or v::text like '%synthetic portal acknowledgment%'
 or v::text like '%receipt_id%' then
  raise exception 'B8_G8_PUBLIC_FAKE_REPLY_OR_PRIVATE_EVIDENCE_LEAK';end if;
end $b8$;
reset role;
do $b8$
declare denied boolean:=false;
begin
 begin
 update public.b8_g8_manual_delivery_attestations
 set verification_basis='Edited after original immutable event';
 exception when others then denied:=sqlerrm='B8_G8_DELIVERY_AUDIT_IMMUTABLE';end;
 if not denied then raise exception 'B8_G8_AUDIT_MUTABLE';end if;
 if (select count(*) from public.b8_g8_manual_delivery_attestations)<>1
 or exists(select 1 from public.b8_g8_manual_delivery_attestations
  where claimed_independent_provider_authenticity)
 then raise exception 'B8_G8_PROOF_TRUTH_OR_COUNT_DRIFT';end if;
 raise notice 'B8 G8 disposable PG17 Founder AAL2 manual evidence, anon only enum, prior deny, cross-case deny, append only PASS';
end $b8$;
rollback;
do $b8$
begin
 if exists(select 1 from public.b8_g8_manual_delivery_attestations)
 or (select count(*) from public.b8_cases)<>current_setting('b8.g8_cases_before')::integer
 then raise exception 'B8_G8_CASE_FIXTURE_ROLLBACK_FAILED';end if;
 raise notice 'B8 G8 rollback PASS; no external send, human E9 still DUE';
end $b8$;
