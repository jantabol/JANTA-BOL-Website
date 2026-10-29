\set ON_ERROR_STOP on
-- T094 CP03 POST migration: prove existing R1 Editor and R2 Founder authority preserved.
-- Entirely synthetic ROLLBACK fixture on disposable PG17; NO official SEND.
begin;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_session','on',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g1_owner_create_case(
 'T094 synthetic serious public expense source-linked inquiry','Pichhore','R1') as t094_r1 \gset
select public.jb_b8_g1_owner_create_case(
 'T094 synthetic confidential restricted source-linked inquiry','Shivpuri','R2') as t094_r2 \gset
select public.jb_b8_g1_owner_assign_reporter(
 :'t094_r1'::uuid,'22222222-2222-2222-2222-222222222222',now()+interval '2 days');
select public.jb_b8_g1_owner_assign_reporter(
 :'t094_r2'::uuid,'22222222-2222-2222-2222-222222222222',now()+interval '2 days');
select public.jb_b8_g1_owner_assign_editor(
 :'t094_r1'::uuid,'44444444-4444-4444-4444-444444444444',now()+interval '2 days');
select public.jb_b8_g1_owner_assign_editor(
 :'t094_r2'::uuid,'44444444-4444-4444-4444-444444444444',now()+interval '2 days');
reset role;
-- Isolated fictional integrity-only receipt IDs; not genuine source/authenticity evidence.
insert into public.b8_private_upload_intents(
 id,case_id,reporter_user_id,reporter_session_id,object_key,original_label,expected_mime,expected_bytes)
values(
 '81111111-1111-4111-8111-111111111111',:'t094_r1'::uuid,
 '22222222-2222-2222-2222-222222222222','66666666-6666-4666-8666-666666666666',
 't094/mock-r1.bin','Synthetic R1 document','application/pdf',100),
 (
 '82222222-2222-4222-8222-222222222222',:'t094_r2'::uuid,
 '22222222-2222-2222-2222-222222222222','66666666-6666-4666-8666-666666666666',
 't094/mock-r2.bin','Synthetic R2 document','application/pdf',100);
insert into public.b8_private_upload_receipts(
 id,intent_id,case_id,server_sha256,byte_count,mime_type)
values(
 '71111111-1111-4111-8111-111111111111','81111111-1111-4111-8111-111111111111',
 :'t094_r1'::uuid,repeat('a',64),100,'application/pdf'),
 (
 '72222222-2222-4222-8222-222222222222','82222222-2222-4222-8222-222222222222',
 :'t094_r2'::uuid,repeat('b',64),100,'application/pdf');
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
select set_config('b8.fixture_aal','aal1',false);
select set_config('b8.fixture_session_id','66666666-6666-4666-8666-666666666666',false);
set role authenticated;
select public.jb_b8_g1_reporter_create_draft(
 :'t094_r1'::uuid,'Please provide the dated historical cost approval record for this project.',
 'District Finance Office') as t094_q1 \gset
select public.jb_b8_g1_reporter_create_draft(
 :'t094_r2'::uuid,'Please share only already-public procurement records, without private sources.',
 'District Records Desk') as t094_q2 \gset
select public.jb_b8_g2_reporter_submit_evidence_claim(
 :'t094_r1'::uuid,'PUBLIC_DOCUMENT','Synthetic R1 supporting public estimate',repeat('a',64),current_date) as t094_c1 \gset
select public.jb_b8_g2_reporter_submit_evidence_claim(
 :'t094_r2'::uuid,'PUBLIC_DOCUMENT','Synthetic R2 supporting public schedule',repeat('b',64),current_date) as t094_c2 \gset
select public.jb_b8_g1_reporter_bind_question_evidence(:'t094_q1'::uuid,:'t094_c1'::uuid);
select public.jb_b8_g1_reporter_bind_question_evidence(:'t094_q2'::uuid,:'t094_c2'::uuid);
select public.jb_b8_g1_reporter_request_review(:'t094_q1'::uuid) as t094_req1 \gset
select public.jb_b8_g1_reporter_request_review(:'t094_q2'::uuid) as t094_req2 \gset
select public.jb_b8_g3_reporter_link_verified_bytes(
 :'t094_req1'::uuid,'71111111-1111-4111-8111-111111111111'::uuid);
select public.jb_b8_g3_reporter_link_verified_bytes(
 :'t094_req2'::uuid,'72222222-2222-4222-8222-222222222222'::uuid);
reset role;
select set_config('b8.t094_q1',:'t094_q1',false);
select set_config('b8.t094_q2',:'t094_q2',false);
select set_config('b8.t094_req1',:'t094_req1',false);
select set_config('b8.t094_req2',:'t094_req2',false);
set role authenticated;
do $before$
declare denied1 boolean:=false;denied2 boolean:=false;
begin
 begin perform public.jb_b8_g3_reporter_prepare_manual_handoff(
 current_setting('b8.t094_q1')::uuid,'EMAIL');
 exception when others then denied1:=sqlerrm='B8_G3_R1_SCREENING_REQUIRED';end;
 begin perform public.jb_b8_g3_reporter_prepare_manual_handoff(
 current_setting('b8.t094_q2')::uuid,'OFFICIAL_PORTAL');
 exception when others then denied2:=sqlerrm='B8_G3_R2_FOUNDER_APPROVAL_REQUIRED';end;
 if not (denied1 and denied2) then
  raise exception 'T094_SERIOUS_HANDED_OFF_WITHOUT_EDITOR_OR_FOUNDER';end if;
end $before$;
reset role;
select set_config('b8.fixture_actor','44444444-4444-4444-4444-444444444444',false);
set role authenticated;
select public.jb_b8_g1_editor_review(
 :'t094_req1'::uuid,'EVIDENCE_REVIEW_PENDING',
 'Evidence integrity-only fixture reviewed, not a genuine official source.');
select public.jb_b8_g1_editor_review(
 :'t094_req2'::uuid,'ESCALATE_TO_FOUNDER',
 'Confidential question requires independent Founder approval with bounded access.');
select public.jb_b8_g3_editor_screen_r1(
 :'t094_req1'::uuid,'The scoped question and linked synthetic receipt are ready for manual preparation.');
reset role;
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
set role authenticated;
select public.jb_b8_g3_reporter_prepare_manual_handoff(:'t094_q1'::uuid,'EMAIL') as t094_h1 \gset
do $noR2$
declare denied boolean:=false;
begin
 begin perform public.jb_b8_g3_reporter_prepare_manual_handoff(
 current_setting('b8.t094_q2')::uuid,'OFFICIAL_PORTAL');
 exception when others then denied:=sqlerrm='B8_G3_R2_FOUNDER_APPROVAL_REQUIRED';end;
 if not denied then raise exception 'T094_R2_HANDED_OFF_WITHOUT_FOUNDER';end if;
end $noR2$;
reset role;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g3_owner_authorize_r2(
 :'t094_req2'::uuid,'Restricted evidence scenario approved only for manual preparation; not official delivery.');
reset role;
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
select set_config('b8.fixture_aal','aal1',false);
set role authenticated;
select public.jb_b8_g3_reporter_prepare_manual_handoff(:'t094_q2'::uuid,'OFFICIAL_PORTAL') as t094_h2 \gset
reset role;
do $truth$
begin
 if (select count(*) from public.b8_g3_handoff_intents where id in(
 :'t094_h1'::uuid,:'t094_h2'::uuid))<>2
 or exists(select 1 from public.b8_g3_handoff_intents where id in(
 :'t094_h1'::uuid,:'t094_h2'::uuid) and state<>'PREPARED_NOT_SENT')
 or (select count(*) from public.b8_question_evidence_links where question_id in(
 :'t094_q1'::uuid,:'t094_q2'::uuid))<>2
 then raise exception 'T094_R1_R2_PREPARED_ONLY_BROKEN';end if;
end $truth$;
rollback;
\echo 'T094 CP03 R1/R2 source linked, Editor R1 and Founder R2 approvals, no SEND/real receipt PASS'
