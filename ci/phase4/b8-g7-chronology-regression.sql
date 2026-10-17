\set ON_ERROR_STOP on
-- G7 synthetic REAL PG17: original accountability reply/no-reply/follow-up/version
-- No real official contact, no LIVE database. Human E9 always DUE.
select set_config('b8.g7_base_cases',(select count(*)::text from public.b8_cases),false);
begin;
do $b8$
begin
 if has_table_privilege('anon','public.b8_g7_history_events','SELECT')
 or has_table_privilege('authenticated','public.b8_g7_history_events','INSERT')
 or has_function_privilege('anon',
 'public.jb_b8_g7_owner_private_history(uuid)','EXECUTE')
 then raise exception 'B8_G7_PRIVATE_HISTORY_ACL_LEAK';end if;
end $b8$;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_aal','aal2',false);
select set_config('b8.fixture_session','on',false);
set role authenticated;
select public.jb_b8_g1_owner_create_case(
 'Synthetic G7 official right-to-reply timeline for roadway','Pichhore','R0') as case_id \gset
select public.jb_b8_g1_owner_assign_reporter(
 :'case_id'::uuid,'22222222-2222-2222-2222-222222222222',now()+interval '2 days');
select public.jb_b8_g1_owner_create_case(
 'Synthetic other case must remain private and unrelated','Shivpuri','R0') as other_case \gset
-- G6 simulated Founder enables private bytes ingress for disposable byte-fixture inserts only.
select public.jb_b8_g6_owner_set_private_upload(
 true,'Synthetic G7 isolated private byte receipts for version test');
reset role;
select set_config('b8.g7_case',:'case_id',false);
select set_config('b8.g7_other',:'other_case',false);
-- Synthetic receipt IDs are fixture-only. This does NOT prove uploaded external bytes.
insert into public.b8_private_upload_intents
(id,case_id,reporter_user_id,reporter_session_id,object_key,
 original_label,expected_mime,expected_bytes)
values
('88888888-8888-4888-8888-888888888891',:'case_id'::uuid,
 '22222222-2222-2222-2222-222222222222',
 '66666666-6666-4666-8666-666666666666','g7/case/one.bin',
 'Synthetic first attachment','application/pdf',200),
('88888888-8888-4888-8888-888888888892',:'case_id'::uuid,
 '22222222-2222-2222-2222-222222222222',
 '66666666-6666-4666-8666-666666666666','g7/case/two.bin',
 'Synthetic versioned attachment','application/pdf',220),
('88888888-8888-4888-8888-888888888893',:'other_case'::uuid,
 '22222222-2222-2222-2222-222222222222',
 '66666666-6666-4666-8666-666666666666','g7/case/other.bin',
 'Synthetic wrong-case attachment','application/pdf',200);
insert into public.b8_private_upload_receipts
(id,intent_id,case_id,server_sha256,byte_count,mime_type)
values
('77777777-7777-4777-8777-777777777791',
 '88888888-8888-4888-8888-888888888891',:'case_id'::uuid,repeat('a',64),200,'application/pdf'),
('77777777-7777-4777-8777-777777777792',
 '88888888-8888-4888-8888-888888888892',:'case_id'::uuid,repeat('b',64),220,'application/pdf'),
('77777777-7777-4777-8777-777777777793',
 '88888888-8888-4888-8888-888888888893',:'other_case'::uuid,repeat('c',64),200,'application/pdf');
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
set role authenticated;
select public.jb_b8_g6_owner_set_private_upload(
 false,'Synthetic G7 receipt fixture complete now close ingress again');
reset role;

-- Not every prepared manual handoff is proof of SEND. First deny no-reply.
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
select set_config('b8.fixture_aal','aal1',false);
set role authenticated;
select public.jb_b8_g1_reporter_create_draft(
 :'case_id'::uuid,
 'Please provide the written sanctioned amount and original project completion date.',
 'Public Works Office') as question \gset
select public.jb_b8_g3_reporter_prepare_manual_handoff(
 :'question'::uuid,'EMAIL') as intent \gset
reset role;
select set_config('b8.g7_question',:'question',false);
select set_config('b8.g7_intent',:'intent',false);
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
do $b8$
declare denied boolean:=false;
begin
 begin
 perform public.jb_b8_g7_owner_record_history(
 current_setting('b8.g7_case')::uuid,'NO_REPLY_AS_OF_CLAIM',
 'A prepared composer is NOT enough for a factual no-reply assertion.',
 current_setting('b8.g7_question')::uuid,null,null,current_date);
 exception when others then denied:=sqlerrm='B8_G7_NO_REPLY_REQUIRES_RECORDED_ATTEMPT';end;
 if not denied then raise exception 'B8_G7_NO_REPLY_WITHOUT_ATTEMPT';end if;
end $b8$;
reset role;
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
set role authenticated;
select public.jb_b8_g3_reporter_record_handoff_observation(
 :'intent'::uuid,'USER_REPORTED_ATTEMPT',null) as obs \gset
reset role;

-- Founder records only attributed/unverified private history. NO external E9 PASS.
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g7_owner_record_history(
 :'case_id'::uuid,'NO_REPLY_AS_OF_CLAIM',
 'Reporter says contact attempted; no verified official reply as of date',
 :'question'::uuid,null,null,current_date) as no_reply \gset
select public.jb_b8_g7_owner_record_history(
 :'case_id'::uuid,'PARTIAL_REPLY_CLAIM',
 'Partial official response is only a private unverified attributed claim',
 :'question'::uuid,'77777777-7777-4777-8777-777777777791'::uuid,null,null);
select public.jb_b8_g7_owner_record_history(
 :'case_id'::uuid,'LATE_REPLY_CLAIM',
 'Late reply attached later without deleting original no reply timeline entry',
 :'question'::uuid,'77777777-7777-4777-8777-777777777792'::uuid,null,null);
select public.jb_b8_g7_owner_record_history(
 :'case_id'::uuid,'SUMMARY_DRAFT',
 'Founder draft summary explicitly separate from official verified facts',
 null,null,null,null) as draft_summary \gset
select public.jb_b8_g7_owner_record_history(
 :'case_id'::uuid,'SUMMARY_CORRECTION',
 'Corrected draft wording appended without silently editing original record',
 null,null,:'draft_summary'::bigint,null);
select public.jb_b8_g7_owner_record_history(
 :'case_id'::uuid,'EVIDENCE_VERSION',
 'Original uploaded byte receipt stays unchanged and attributed',
 null,'77777777-7777-4777-8777-777777777791'::uuid,null,null) as first_version \gset
select public.jb_b8_g7_owner_record_history(
 :'case_id'::uuid,'EVIDENCE_VERSION',
 'A separate revised scan is linked but never overwrites original',
 null,'77777777-7777-4777-8777-777777777792'::uuid,
 :'first_version'::bigint,null);
select public.jb_b8_g5_owner_record_fact(
 :'case_id'::uuid,'DEADLINE','ORIGINAL',
 'Original project delivery date supplied as attributed source',
 null,current_date-interval '10 days',null);
select public.jb_b8_g7_owner_record_history(
 :'case_id'::uuid,'DEADLINE_FOLLOWUP',
 'Scheduled completion date passed; follow-up warranted without inventing intent',
 null,null,null,current_date);
reset role;

-- Cross-case version/receipt bypass and unjustified revision must FAIL.
set role authenticated;
do $b8$
declare bad_receipt boolean:=false;bad_prior boolean:=false;
begin
 begin
 perform public.jb_b8_g7_owner_record_history(
 current_setting('b8.g7_case')::uuid,'EVIDENCE_VERSION',
 'Evidence from unrelated source must be blocked by Case',
 null,'77777777-7777-4777-8777-777777777793'::uuid,null,null);
 exception when others then bad_receipt:=sqlerrm='B8_G7_RECEIPT_CROSS_CASE_DENIED';end;
 begin
 perform public.jb_b8_g7_owner_record_history(
 current_setting('b8.g7_case')::uuid,'SUMMARY_CORRECTION',
 'Wrong prior history event must not be allowed',
 null,null,1,null);
 exception when others then bad_prior:=sqlerrm='B8_G7_PRIOR_CROSS_CASE_DENIED';end;
 if not (bad_receipt and bad_prior) then
  raise exception 'B8_G7_PRIVACY_OR_CORRECTION_BYPASS';end if;
end $b8$;
reset role;
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
select set_config('b8.fixture_aal','aal1',false);
set role authenticated;
do $b8$
declare denied boolean:=false;
begin
 begin
 perform public.jb_b8_g7_owner_private_history(current_setting('b8.g7_case')::uuid);
 exception when others then denied:=sqlerrm='B8_OWNER_AAL2_REQUIRED';end;
 if not denied then raise exception 'B8_G7_REPORTER_READ_FOUNDER_HISTORY';end if;
end $b8$;
reset role;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
do $b8$
declare v jsonb;
begin
 v:=public.jb_b8_g7_owner_private_history(current_setting('b8.g7_case')::uuid);
 if jsonb_array_length(v)<>8
 or exists(select 1 from jsonb_array_elements(v) e
    where e->>'truth'<>'FOUNDER_ATTRIBUTED_UNVERIFIED')
 then raise exception 'B8_G7_CHRONOLOGY_TRUTH_CHANGED';end if;
end $b8$;
reset role;
rollback;
do $b8$
begin
 if exists(select 1 from public.b8_g7_history_events)
 or (select count(*) from public.b8_cases)<>current_setting('b8.g7_base_cases')::integer
 or (select enabled from public.b8_g6_release_controls
  where feature='PRIVATE_EVIDENCE_UPLOAD') is distinct from false
 then raise exception 'B8_G7_FIXTURE_ROLLBACK_FAILED';end if;
 raise notice 'B8 G7 real PG17 history and no fake official reply/late/no-reply SUCCESS ROLLBACK';
end $b8$;
