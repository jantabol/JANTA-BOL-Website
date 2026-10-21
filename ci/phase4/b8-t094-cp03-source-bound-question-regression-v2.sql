\set ON_ERROR_STOP on
-- T094 ACC013/015/016: disposable PG17 after G0-G9; no live DB writes; no official sends.
begin;
do $pre$
begin
 if to_regprocedure('public.jb_b8_g1_reporter_bind_question_evidence(uuid,uuid)') is null
 or has_function_privilege('anon','public.jb_b8_g1_reporter_bind_question_evidence(uuid,uuid)','EXECUTE')
 or has_table_privilege('authenticated','public.b8_question_evidence_links','SELECT')
 or has_table_privilege('authenticated','public.b8_question_evidence_links','INSERT')
 then raise exception 'T094_BROKEN_SOURCE_BINDING_PRIVATE_ACL';end if;
end $pre$;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_session','on',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g1_owner_create_case(
 'T094 harmless synthetic routine information request','Pichhore','R0') as t094_case \gset
select public.jb_b8_g1_owner_create_case(
 'T094 unrelated second case supporting source','Pichhore','R0') as t094_other_case \gset
select public.jb_b8_g1_owner_assign_reporter(:'t094_case'::uuid,
 '22222222-2222-2222-2222-222222222222',now()+interval '2 days');
select public.jb_b8_g1_owner_assign_reporter(:'t094_other_case'::uuid,
 '22222222-2222-2222-2222-222222222222',now()+interval '2 days');
reset role;
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
select set_config('b8.fixture_aal','aal1',false);
select set_config('b8.fixture_session_id','66666666-6666-4666-8666-666666666666',false);
set role authenticated;
select public.jb_b8_g1_reporter_create_draft(
 :'t094_case'::uuid,'Please confirm the published meeting date, with a copy of the public notice.',
 'District Public Information Desk') as t094_question \gset
reset role;
select set_config('b8.t094_question',:'t094_question',false);
do $bad$
declare blocked boolean:=false;
begin
 perform set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
 begin
  perform public.jb_b8_g3_reporter_prepare_manual_handoff(
   current_setting('b8.t094_question')::uuid,'EMAIL');
 exception when others then
  blocked:=sqlerrm='B8_T094_QUESTION_SOURCE_LINK_REQUIRED';
 end;
 if not blocked then raise exception 'T094_BUG_UNSOURCED_R0_HANDOFF_ALLOWED';end if;
end $bad$;
set role authenticated;
select public.jb_b8_g2_reporter_submit_evidence_claim(
 :'t094_case'::uuid,'PUBLIC_DOCUMENT',
 'Synthetic public notice, original not independently verified',
 repeat('a',64),current_date) as t094_claim \gset
select public.jb_b8_g2_reporter_submit_evidence_claim(
 :'t094_other_case'::uuid,'PUBLIC_DOCUMENT',
 'Different case synthetic original',repeat('b',64),current_date) as t094_other_claim \gset
reset role;
select set_config('b8.t094_claim',:'t094_claim',false);
select set_config('b8.t094_other_claim',:'t094_other_claim',false);
do $cross$
declare denied boolean:=false;
begin
 begin
  perform public.jb_b8_g1_reporter_bind_question_evidence(
   current_setting('b8.t094_question')::uuid,current_setting('b8.t094_other_claim')::uuid);
 exception when others then denied:=sqlerrm='B8_T094_SAME_CASE_OWN_EVIDENCE_CLAIM_REQUIRED';end;
 if not denied then raise exception 'T094_CROSS_CASE_SOURCE_ACCEPTED';end if;
end $cross$;
set role authenticated;
select public.jb_b8_g1_reporter_bind_question_evidence(
 :'t094_question'::uuid,:'t094_claim'::uuid) as t094_link_ok \gset
select public.jb_b8_g1_reporter_bind_question_evidence(
 :'t094_question'::uuid,:'t094_claim'::uuid) as t094_link_retry_ok \gset
select public.jb_b8_g3_reporter_prepare_manual_handoff(
 :'t094_question'::uuid,'EMAIL') as t094_intent \gset
reset role;
select set_config('b8.t094_intent',:'t094_intent',false);
do $valid$
declare v_link public.b8_question_evidence_links%rowtype;
 v_handoff public.b8_g3_handoff_intents%rowtype;
 blocked boolean:=false;
begin
 select * into v_link from public.b8_question_evidence_links where question_id=current_setting('b8.t094_question')::uuid;
 select * into v_handoff from public.b8_g3_handoff_intents where id=current_setting('b8.t094_intent')::uuid;
 if not found or v_link.claim_id<>current_setting('b8.t094_claim')::uuid
  or v_link.truth<>'CLAIM_UNVERIFIED_NO_BYTES' or v_handoff.state<>'PREPARED_NOT_SENT'
  or v_handoff.question_id<>v_link.question_id or
  (select count(*) from public.b8_question_evidence_links where question_id=v_link.question_id)<>1
 then raise exception 'T094_R0_EVIDENCE_TRUTH_OR_PREPARED_ONLY_FAIL';end if;
 begin
  update public.b8_question_evidence_links set truth='SENT' where question_id=v_link.question_id;
 exception when others then blocked:=sqlerrm='B8_T094_QUESTION_EVIDENCE_IMMUTABLE';end;
 if not blocked then raise exception 'T094_FROZEN_EVIDENCE_LINK_MUTATED';end if;
end $valid$;
do $immutable_rebind$
declare denied boolean:=false;
begin
 begin perform public.jb_b8_g1_reporter_bind_question_evidence(
 current_setting('b8.t094_question')::uuid,current_setting('b8.t094_other_claim')::uuid);
 exception when others then denied:=sqlerrm='B8_T094_SAME_CASE_OWN_EVIDENCE_CLAIM_REQUIRED';end;
 if not denied then raise exception 'T094_LATE_CROSS_CASE_REBIND';end if;
end $immutable_rebind$;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
do $owner$
declare denied boolean:=false;
begin
 begin perform public.jb_b8_g1_reporter_bind_question_evidence(
 current_setting('b8.t094_question')::uuid,current_setting('b8.t094_claim')::uuid);
 exception when others then denied:=sqlerrm='B8_T094_OWN_DRAFT_REQUIRED';end;
 if not denied then raise exception 'T094_OWNER_IMPERSONATED_REPORTER';end if;
end $owner$;
reset role;
rollback;
\echo 'T094 CP03 R0 source-bound handoff: unsupported questions DENIED, same-case reporter/immutable/anon/no-fake-SENT PASS'
