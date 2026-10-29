\set ON_ERROR_STOP on
-- Real disposable PG17 G3 CP03: R0 direct, R1 Editor, R2 Founder and honest handoff.
begin;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_session','on',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g1_owner_create_case(
 'Routine neutral local authority records question','Pichhore','R0') as c0 \gset
select public.jb_b8_g1_owner_create_case(
 'Serious public expenditure reporting question','Pichhore','R1') as c1 \gset
select public.jb_b8_g1_owner_create_case(
 'Restricted source safety request needs Founder','Pichhore','R2') as c2 \gset
select public.jb_b8_g1_owner_assign_reporter(
 :'c0'::uuid,'22222222-2222-2222-2222-222222222222',now()+interval '2 days');
select public.jb_b8_g1_owner_assign_reporter(
 :'c1'::uuid,'22222222-2222-2222-2222-222222222222',now()+interval '2 days');
select public.jb_b8_g1_owner_assign_reporter(
 :'c2'::uuid,'22222222-2222-2222-2222-222222222222',now()+interval '2 days');
select public.jb_b8_g1_owner_assign_editor(
 :'c1'::uuid,'44444444-4444-4444-4444-444444444444',now()+interval '2 days');
select public.jb_b8_g1_owner_assign_editor(
 :'c2'::uuid,'44444444-4444-4444-4444-444444444444',now()+interval '2 days');
reset role;
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
select set_config('b8.fixture_aal','aal1',false);
select set_config('b8.fixture_session_id','66666666-6666-4666-8666-666666666666',false);
set role authenticated;
select public.jb_b8_g1_reporter_create_draft(
 :'c0'::uuid,'Please disclose the routine inspection dates for the local project.',
 'Local Public Works Office') as q0 \gset
select public.jb_b8_g1_reporter_create_draft(
 :'c1'::uuid,'Please show the sanctioned and revised cost for these public works.',
 'District Finance Officer') as q1 \gset
select public.jb_b8_g1_reporter_create_draft(
 :'c2'::uuid,'Please provide only already-public policy text protecting private sources.',
 'Authority Records Desk') as q2 \gset
select public.jb_b8_g3_reporter_prepare_manual_handoff(
 :'q0'::uuid,'EMAIL') as h0 \gset
reset role;
select set_config('b8.fixture_q0',:'q0',false);
select set_config('b8.fixture_q1',:'q1',false);
select set_config('b8.fixture_q2',:'q2',false);
select set_config('b8.fixture_h0',:'h0',false);
set role authenticated;
do $unreviewed$
declare r1blocked boolean:=false;r2blocked boolean:=false;wrong_channel boolean:=false;
begin
 begin
  perform public.jb_b8_g3_reporter_prepare_manual_handoff(
    current_setting('b8.fixture_q1')::uuid,'EMAIL');
 exception when others then r1blocked:=sqlerrm='B8_G3_SERIOUS_EDITOR_REVIEW_REQUIRED';end;
 begin
  perform public.jb_b8_g3_reporter_prepare_manual_handoff(
    current_setting('b8.fixture_q2')::uuid,'EMAIL');
 exception when others then r2blocked:=sqlerrm='B8_G3_SERIOUS_EDITOR_REVIEW_REQUIRED';end;
 begin
  perform public.jb_b8_g3_reporter_prepare_manual_handoff(
    current_setting('b8.fixture_q0')::uuid,'AUTOMATIC_BULK_SEND');
 exception when others then wrong_channel:=sqlerrm='B8_G3_UNAPPROVED_CHANNEL';end;
 if not(r1blocked and r2blocked and wrong_channel) then
  raise exception 'B8_G3_UNREVIEWED_SERIOUS_OR_UNSAFE_CHANNEL_HANDED_OFF';end if;
end $unreviewed$;
-- R0 replay is SAME frozen question and SAME channel, not a new outbound attempt.
select public.jb_b8_g3_reporter_prepare_manual_handoff(:'q0'::uuid,'EMAIL') as replay0 \gset
reset role;
\if :{?replay0}
\else
 \quit 1
\endif
do $one$
begin
 if (select count(*) from public.b8_g3_handoff_intents)<>1 then
  raise exception 'B8_G3_R0_REPLAY_DUPLICATED';end if;
end $one$;
-- R1/2 review setup, same synthetic reporter, no real media storage.
set role authenticated;
select public.jb_b8_g1_reporter_request_review(:'q1'::uuid) as req1 \gset
select public.jb_b8_g1_reporter_request_review(:'q2'::uuid) as req2 \gset
select public.jb_b8_g2_reporter_prepare_private_upload(
 :'c1'::uuid,'First synthetic document','application/pdf',100) as u1 \gset
select public.jb_b8_g2_reporter_prepare_private_upload(
 :'c2'::uuid,'Second synthetic document','application/pdf',100) as u2 \gset
reset role;
set role service_role;
select public.jb_b8_g2_server_finalize_private_upload(
 :'u1'::uuid,repeat('a',64),100,'application/pdf') as e1 \gset
select public.jb_b8_g2_server_finalize_private_upload(
 :'u2'::uuid,repeat('b',64),100,'application/pdf') as e2 \gset
reset role;
set role authenticated;
select public.jb_b8_g3_reporter_link_verified_bytes(:'req1'::uuid,:'e1'::uuid);
select public.jb_b8_g3_reporter_link_verified_bytes(:'req2'::uuid,:'e2'::uuid);
reset role;
select set_config('b8.fixture_actor','44444444-4444-4444-4444-444444444444',false);
set role authenticated;
select public.jb_b8_g1_editor_review(
 :'req1'::uuid,'EVIDENCE_REVIEW_PENDING',
 'Private files are present; editor will check the neutral question.');
select public.jb_b8_g1_editor_review(
 :'req2'::uuid,'ESCALATE_TO_FOUNDER',
 'Confidential evidence requires protected Founder approval.');
select public.jb_b8_g3_editor_screen_r1(
 :'req1'::uuid,'The source bytes were attached; public expenditure query is neutral.');
reset role;
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
set role authenticated;
select public.jb_b8_g3_reporter_prepare_manual_handoff(:'q1'::uuid,'OFFICIAL_PORTAL') as h1 \gset
reset role;
-- Without Founder R2 approval, even Editor escalation cannot pass.
set role authenticated;
do $no_owner$
declare denied boolean:=false;
begin
 begin
  perform public.jb_b8_g3_reporter_prepare_manual_handoff(
   current_setting('b8.fixture_q2')::uuid,'EMAIL');
 exception when others then denied:=sqlerrm='B8_G3_R2_FOUNDER_APPROVAL_REQUIRED';end;
 if not denied then raise exception 'B8_G3_R2_HANDED_OFF_WITHOUT_FOUNDER_AAL2';end if;
end $no_owner$;
reset role;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g3_owner_authorize_r2(
 :'req2'::uuid,'Prior confidential source risk assessed with relevant private receipt.') as approval2 \gset
reset role;
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
select set_config('b8.fixture_aal','aal1',false);
set role authenticated;
select public.jb_b8_g3_reporter_prepare_manual_handoff(
 :'q2'::uuid,'HAND_DELIVERY') as h2 \gset
select public.jb_b8_g3_reporter_record_handoff_observation(
 :'h0'::uuid,'COMPOSER_OPENED',null) as obs0 \gset
select public.jb_b8_g3_reporter_record_handoff_observation(
 :'h1'::uuid,'USER_REPORTED_ATTEMPT',null) as obs1 \gset
select public.jb_b8_g3_reporter_record_handoff_observation(
 :'h2'::uuid,'UNVERIFIED_RECEIPT_ATTACHED',:'e2'::uuid) as obs2 \gset
reset role;
do $receipt$
begin
 if (select count(*) from public.b8_g3_handoff_intents)<>3
 or exists(select 1 from public.b8_g3_handoff_intents
    where state<>'PREPARED_NOT_SENT')
 or (select count(*) from public.b8_g3_handoff_observations)<>3
 then raise exception 'B8_G3_MANUAL_HANDOFF_CLAIMED_FALSE_SENT';end if;
end $receipt$;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g3_owner_handoff_truth(:'q2'::uuid) as truth \gset
reset role;
do $truth$
declare v jsonb;
begin
 select public.jb_b8_g3_owner_handoff_truth(current_setting('b8.fixture_q2')::uuid) into v;
 if v->>'official_delivery_verified'<>'false'
 or v->>'provider_acceptance_verified'<>'false'
 or v->>'reply_received_verified'<>'false'
 or v->>'external_delivery_status'<>'NOT_VERIFIED'
 or v->>'unverified_receipt_uploaded'<>'true'
 then raise exception 'B8_G3_FALSE_OFFICIAL_DELIVERY';end if;
 raise notice 'B8 G3 CP03 R0 Reporter handoff, R1 Editor screened, R2 Founder prior-AAL2, replay safe, no fake SEND or delivery';
end $truth$;
rollback;
do $after$
begin
 if (select count(*) from public.b8_g3_handoff_intents)<>0
 or (select count(*) from public.b8_g3_handoff_observations)<>0
 or (select count(*) from public.live_notifications)<>0
 or (select count(*) from public.articles)<>1
 then raise exception 'B8_G3_CP03_DISPOSABLE_ROLLBACK_LEAK';end if;
 raise notice 'B8 G3 CP03 ROLLBACK and old News preserved';
end $after$;
