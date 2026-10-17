\set ON_ERROR_STOP on
-- Real isolated PG17 CP04: unverified official reply claim, no fake E9.
begin;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_session','on',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g1_owner_create_case(
 'Routine road project public information office reply case',
 'Pichhore','R0') as reply_case \gset
select public.jb_b8_g1_owner_assign_reporter(
 :'reply_case'::uuid,'22222222-2222-2222-2222-222222222222',now()+interval '2 days');
reset role;
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
select set_config('b8.fixture_aal','aal1',false);
select set_config('b8.fixture_session_id','66666666-6666-4666-8666-666666666666',false);
set role authenticated;
select public.jb_b8_g1_reporter_create_draft(
 :'reply_case'::uuid,'Please provide the official milestone and procurement status.',
 'Public Works Office') as reply_q \gset
select public.jb_b8_g3_reporter_prepare_manual_handoff(
 :'reply_q'::uuid,'OFFICIAL_PORTAL') as reply_handoff \gset
select public.jb_b8_g2_reporter_prepare_private_upload(
 :'reply_case'::uuid,'Synthetic official reply as PDF','application/pdf',160) as reply_upload \gset
reset role;
set role service_role;
select public.jb_b8_g2_server_finalize_private_upload(
 :'reply_upload'::uuid,repeat('b',64),160,'application/pdf') as reply_receipt \gset
reset role;
select set_config('b8.fixture_reply_q',:'reply_q',false);
select set_config('b8.fixture_reply_handoff',:'reply_handoff',false);
select set_config('b8.fixture_reply_receipt',:'reply_receipt',false);
set role authenticated;
select public.jb_b8_g3_reporter_claim_official_reply(
 :'reply_handoff'::uuid,:'reply_receipt'::uuid,
 'Public Works Office',now()-interval '1 hour',
 'A synthetic office response is reported, not independently confirmed.') as reply_claim \gset
reset role;
do $ledger$
begin
 if (select count(*) from public.b8_g3_official_reply_claims
 where state='REPORTER_CLAIM_UNVERIFIED')<>1 then
  raise exception 'B8_G3_OFFICIAL_RESPONSE_FALSELY_VERIFIED';end if;
end $ledger$;
set role authenticated;
do $replay$
declare rejected boolean:=false;
begin
 begin
  perform public.jb_b8_g3_reporter_claim_official_reply(
   current_setting('b8.fixture_reply_handoff')::uuid,
   current_setting('b8.fixture_reply_receipt')::uuid,
   'Public Works Office',now()-interval '1 hour',
   'Second duplicate official response should be rejected.');
 exception when unique_violation then rejected:=true;end;
 if not rejected then raise exception 'B8_G3_DUPLICATE_REPLY_CLAIM_ACCEPTED';end if;
end $replay$;
reset role;
select set_config('b8.fixture_actor','33333333-3333-3333-3333-333333333333',false);
set role authenticated;
do $wrong$
declare blocked boolean:=false;
begin
 begin
  perform public.jb_b8_g3_reporter_claim_official_reply(
   current_setting('b8.fixture_reply_handoff')::uuid,
   current_setting('b8.fixture_reply_receipt')::uuid,
   'Public Works Office',now()-interval '1 hour',
   'Unassigned reporter should not forge any official reply.');
 exception when others then blocked:=sqlerrm='B8_G3_OWN_HANDOFF_REQUIRED';end;
 if not blocked then raise exception 'B8_G3_WRONG_REPORTER_FORGED_REPLY';end if;
end $wrong$;
reset role;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_aal','aal1',false);
set role authenticated;
do $aal$
declare blocked boolean:=false;
begin
 begin
  perform public.jb_b8_g3_owner_reply_claim_summary(
  current_setting('b8.fixture_reply_q')::uuid);
 exception when others then blocked:=sqlerrm='B8_OWNER_AAL2_REQUIRED';end;
 if not blocked then raise exception 'B8_G3_FOUNDER_AAL1_READ_PRIVATE_REPLY';end if;
end $aal$;
reset role;
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g3_owner_reply_claim_summary(:'reply_q'::uuid) as reply_summary \gset
reset role;
do $truth$
declare v jsonb;
begin
 select public.jb_b8_g3_owner_reply_claim_summary(
  current_setting('b8.fixture_reply_q')::uuid) into v;
 if (v->>'claimed_official_reply_count')::int<>1
 or v->>'official_reply_independently_verified'<>'false'
 or v->>'provider_external_delivery_verified'<>'false'
 or v->>'accuracy_class'<>'REPORTER_CLAIM_UNVERIFIED'
 then raise exception 'B8_G3_FOUNDER_FALSE_REPLY_PROOF';end if;
 raise notice 'B8 G3 CP04 immutable reply metadata linked private bytes; Founder AAL2 and no false official reply';
end $truth$;
rollback;
do $after$
begin
 if (select count(*) from public.b8_g3_official_reply_claims)<>0
 or (select count(*) from public.b8_cases)<>0
 or (select count(*) from public.articles)<>1
 then raise exception 'B8_G3_CP04_ROLLBACK_LEAK';end if;
 raise notice 'B8 G3 CP04 ROLLBACK PASS without real official response';
end $after$;
