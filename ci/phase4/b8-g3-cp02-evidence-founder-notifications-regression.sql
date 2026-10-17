\set ON_ERROR_STOP on
-- G3 CP02 real disposable PG17 R1/R2 permissions+integrity+B3 notices. NEVER LIVE.
begin;
do $acl$
begin
 if has_table_privilege('authenticated','public.b8_g3_request_evidence_links','SELECT')
 or has_table_privilege('anon','public.live_notifications','SELECT')
 or has_function_privilege('anon','public.jb_b8_g3_owner_evidence_packet(uuid)','EXECUTE')
 then raise exception 'B8_G3_CP02_PRIVATE_EXPOSURE';end if;
end $acl$;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_session','on',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g1_owner_create_case(
 'Road expenditure requires editor checked documents','Pichhore','R1') as case1 \gset
select public.jb_b8_g1_owner_create_case(
 'Sensitive confidential document needs prior Founder review','Pichhore','R2') as case2 \gset
select public.jb_b8_g1_owner_assign_reporter(
 :'case1'::uuid,'22222222-2222-2222-2222-222222222222',now()+interval '2 days');
select public.jb_b8_g1_owner_assign_reporter(
 :'case2'::uuid,'22222222-2222-2222-2222-222222222222',now()+interval '2 days');
select public.jb_b8_g1_owner_assign_editor(
 :'case1'::uuid,'44444444-4444-4444-4444-444444444444',now()+interval '2 days');
select public.jb_b8_g1_owner_assign_editor(
 :'case2'::uuid,'44444444-4444-4444-4444-444444444444',now()+interval '2 days');
reset role;
select set_config('b8.fixture_case1',:'case1',false);
select set_config('b8.fixture_case2',:'case2',false);
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
select set_config('b8.fixture_aal','aal1',false);
select set_config('b8.fixture_session_id','66666666-6666-4666-8666-666666666666',false);
set role authenticated;
select public.jb_b8_g1_reporter_create_draft(
 :'case1'::uuid,'Kindly provide sanctioned and paid cost with public procurement evidence.',
 'Public Works District Office') as draft1 \gset
select public.jb_b8_g1_reporter_create_draft(
 :'case2'::uuid,'Kindly provide public policy records without confidential source identities.',
 'Public Authority Desk') as draft2 \gset
select public.jb_b8_g1_reporter_request_review(:'draft1'::uuid) as req1 \gset
select public.jb_b8_g1_reporter_request_review(:'draft2'::uuid) as req2 \gset
select public.jb_b8_g2_reporter_prepare_private_upload(
 :'case1'::uuid,'Synthetic scan for R1 evidence','application/pdf',128) as intent1 \gset
select public.jb_b8_g2_reporter_prepare_private_upload(
 :'case2'::uuid,'Synthetic scan for restricted review','image/png',128) as intent2 \gset
reset role;
select set_config('b8.fixture_req1',:'req1',false);
select set_config('b8.fixture_req2',:'req2',false);
select set_config('b8.fixture_intent2',:'intent2',false);
set role service_role;
select public.jb_b8_g2_server_finalize_private_upload(
 :'intent1'::uuid,repeat('a',64),128,'application/pdf') as receipt1 \gset
select public.jb_b8_g2_server_finalize_private_upload(
 :'intent2'::uuid,repeat('b',64),128,'image/png') as receipt2 \gset
reset role;
select set_config('b8.fixture_receipt1',:'receipt1',false);
select set_config('b8.fixture_receipt2',:'receipt2',false);
-- Incorrect case receipt must be refused.
set role authenticated;
do $wrong$
declare rejected boolean:=false;
begin
 begin
  perform public.jb_b8_g3_reporter_link_verified_bytes(
   current_setting('b8.fixture_req1')::uuid,
   current_setting('b8.fixture_receipt2')::uuid);
 exception when others then rejected:=sqlerrm='B8_G3_SAME_CASE_OWN_PRIVATE_RECEIPT_REQUIRED';end;
 if not rejected then raise exception 'B8_G3_CROSS_CASE_PRIVATE_BYTES_ACCEPTED';end if;
end $wrong$;
select public.jb_b8_g3_reporter_link_verified_bytes(
 :'req1'::uuid,:'receipt1'::uuid);
select public.jb_b8_g3_reporter_link_verified_bytes(
 :'req2'::uuid,:'receipt2'::uuid);
reset role;
-- No Editor role, no review self-approval.
select set_config('b8.fixture_actor','44444444-4444-4444-4444-444444444444',false);
set role authenticated;
select public.jb_b8_g1_editor_review(
 :'req1'::uuid,'EVIDENCE_REVIEW_PENDING',
 'Original private scanned pages must be context-screened before handoff.');
select public.jb_b8_g1_editor_review(
 :'req2'::uuid,'ESCALATE_TO_FOUNDER',
 'Restricted privacy risk needs protected Owner approval before handoff.');
select public.jb_b8_g3_editor_screen_r1(
 :'req1'::uuid,'Original scan is attached and questioned neutrally; context should be checked.') as screened1 \gset
reset role;
do $notifications$
begin
 if (select count(*) from public.live_notifications
   where recipient_user_id='11111111-1111-1111-1111-111111111111')<>2
 or exists(select 1 from public.live_notifications
   where delivery_state<>'IN_APP_READY' or domain<>'system' or
    safe_message like '%sanctioned%' or safe_message like '%confidential source identities%')
 then raise exception 'B8_G3_FOUNDER_INBOX_LEAK_OR_FALSE_EXTERNAL_DELIVERY';end if;
 raise notice 'B8 G3 CP02 2 private Founder in-app-safe review notifications, NOT external delivered';
end $notifications$;
-- Editor review replay disallowed, and R2 cannot be cleared like R1.
set role authenticated;
do $editorneg$
declare r2rejected boolean:=false;repeat_rejected boolean:=false;
begin
 begin
  perform public.jb_b8_g3_editor_screen_r1(
   current_setting('b8.fixture_req2')::uuid,
   'Editor attempted R2 shortcut without Founder approval.');
 exception when others then r2rejected:=sqlerrm='B8_G3_R1_REVIEW_REQUIRED';end;
 begin
  perform public.jb_b8_g3_editor_screen_r1(
   current_setting('b8.fixture_req1')::uuid,
   'Editor attempted a second authoritative immutable screen.');
 exception when unique_violation then repeat_rejected:=true;end;
 if not (r2rejected and repeat_rejected) then
  raise exception 'B8_G3_SCREENING_REPLAY_OR_R2_BYPASS';end if;
end $editorneg$;
reset role;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_aal','aal1',false);
set role authenticated;
do $aal$
declare blocked boolean:=false;
begin
 begin
  perform public.jb_b8_g3_owner_authorize_r2(
   current_setting('b8.fixture_req2')::uuid,
   'Confidentiality release must remain under Founder AAL2 only.');
 exception when others then blocked:=sqlerrm='B8_OWNER_AAL2_REQUIRED';end;
 if not blocked then raise exception 'B8_G3_OWNER_AAL1_AUTHORIZED_R2';end if;
end $aal$;
reset role;
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g3_owner_authorize_r2(
 :'req2'::uuid,'Restricted question uses a private evidence link and neutral wording.') as grant_r2 \gset
select public.jb_b8_g3_owner_evidence_packet(:'req2'::uuid) as pkt \gset
reset role;
do $packet$
declare v jsonb;
begin
 select public.jb_b8_g3_owner_evidence_packet(current_setting('b8.fixture_req2')::uuid) into v;
 if (v->>'full_proof_pack_verified')<>'false'
 or (v->>'original_official_source_authenticity_verified')<>'false'
 or v->>'external_delivery_status'<>'NOT_SENT'
 or v->>'r2_founder_authorized'<>'true'
 or jsonb_array_length(v->'private_integrity_receipts')<>1
 then raise exception 'B8_G3_FOUNDER_PACKET_FALSE_DOCUMENTARY_PROOF';end if;
 raise notice 'B8 G3 CP02 R1 Editor screened, R2 Owner AAL2 authorized, genuine hash receipt linked, official authenticity STILL UNVERIFIED';
end $packet$;
rollback;
do $after$
begin
 if (select count(*) from public.b8_g3_request_evidence_links)<>0
 or (select count(*) from public.live_notifications)<>0
 or (select count(*) from public.b8_g3_editor_screenings)<>0
 or (select count(*) from public.b8_cases)<>0 then
  raise exception 'B8_G3_CP02_ROLLBACK_LEAK';end if;
 raise notice 'B8 G3 CP02 disposable PG17 rollback; NO real B3 notification sent';
end $after$;
