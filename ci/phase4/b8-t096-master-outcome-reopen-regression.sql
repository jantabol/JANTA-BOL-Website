\set ON_ERROR_STOP on
-- T096 original Article UUID/PURL protection, explicit unresolved-question dispositions and reopened-public HIDE.
-- All changes ROLLBACK in disposable PG17, NO LIVE data and NO external sends.
begin;
do $acl$
begin
 if has_table_privilege('anon','public.b8_t096_question_disposition_events','SELECT')
 or has_table_privilege('authenticated','public.b8_t096_question_disposition_events','INSERT')
 or has_function_privilege('anon','public.jb_b8_t096_owner_record_question_disposition(uuid,uuid,text,text,uuid)','EXECUTE')
 then raise exception 'T096_DISPOSITION_RAW_ACCESS_LEAK';end if;
end $acl$;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_session','on',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g1_owner_create_case('T096 synthetic one master with protected linked news','Pichhore','R0') as t96_case \gset
select public.jb_b8_g1_owner_create_case('T096 unrelated duplicate accountability master','Shivpuri','R0') as t96_other \gset
select public.jb_b8_g1_owner_link_article(:'t96_case'::uuid,
 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid) as t96_link \gset
select public.jb_b8_g1_owner_assign_reporter(:'t96_case'::uuid,
 '22222222-2222-2222-2222-222222222222',now()+interval '2 days');
reset role;
select set_config('b8.t96_case',:'t96_case',false);
select set_config('b8.t96_other',:'t96_other',false);
select set_config('b8.t96_article_before',(
  select version::text from public.articles where id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
),false);
select set_config('b8.t96_article_title',(
  select title from public.articles where id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
),false);
set role authenticated;
do $duplicate$
declare denied boolean:=false;
begin
 begin
 perform public.jb_b8_g2_owner_link_article(current_setting('b8.t96_other')::uuid,
 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid);
 exception when unique_violation then denied:=true;end;
 if not denied then raise exception 'T096_SAME_ARTICLE_TWO_MASTER_CASES_ALLOWED';end if;
end $duplicate$;
reset role;
-- Synthetic private integrity-only receipts; no real official source authority.
insert into public.b8_private_upload_intents(
 id,case_id,reporter_user_id,reporter_session_id,object_key,
 original_label,expected_mime,expected_bytes)
values
 ('81111111-1111-4111-8111-111111111196',:'t96_case'::uuid,
  '22222222-2222-2222-2222-222222222222',
  '66666666-6666-4666-8666-666666666666','t096/close-fixture.bin',
  'Test-only closure source','application/pdf',100),
 ('82222222-2222-4222-8222-222222222296',:'t96_case'::uuid,
  '22222222-2222-2222-2222-222222222222',
  '66666666-6666-4666-8666-666666666666','t096/new-material-fixture.bin',
  'Test-only new material','application/pdf',100);
insert into public.b8_private_upload_receipts(
 id,intent_id,case_id,server_sha256,byte_count,mime_type)
values
 ('71111111-1111-4111-8111-111111111196','81111111-1111-4111-8111-111111111196',
 :'t96_case'::uuid,repeat('a',64),100,'application/pdf'),
 ('72222222-2222-4222-8222-222222222296','82222222-2222-4222-8222-222222222296',
 :'t96_case'::uuid,repeat('b',64),100,'application/pdf');
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
select set_config('b8.fixture_aal','aal1',false);
select set_config('b8.fixture_session_id','66666666-6666-4666-8666-666666666666',false);
set role authenticated;
select public.jb_b8_g1_reporter_create_draft(:'t96_case'::uuid,
 'What is the current status of the project? Please provide a documentary response.',
 'Public Office Records Desk') as t96_q \gset
reset role;
select set_config('b8.t96_q',:'t96_q',false);
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
do $unresolved$
declare denied boolean:=false;
begin
 begin
 perform public.jb_b8_g5_owner_record_outcome(current_setting('b8.t96_case')::uuid,
 'closed','Closing without per-question disposition must be blocked',
 '71111111-1111-4111-8111-111111111196'::uuid);
 exception when others then denied:=sqlerrm='B8_T096_UNRESOLVED_QUESTION_DISPOSITION_REQUIRED';end;
 if not denied then raise exception 'T096_FALSE_CLOSURE_ALLOWED';end if;
end $unresolved$;
select public.jb_b8_t096_owner_record_question_disposition(
 :'t96_case'::uuid,:'t96_q'::uuid,'UNANSWERED_MONITORING',
 'No official answer; remains visibly unresolved with documented editorial closure.',null) as disposition \gset
select public.jb_b8_g5_owner_record_outcome(:'t96_case'::uuid,'closed',
 'Editorially closed despite explicitly retained unanswered question; not project success',
 '71111111-1111-4111-8111-111111111196'::uuid) as close_id \gset
select public.jb_b8_g4_owner_release_public_projection(
 :'t96_case'::uuid,'PUBLISH','PUBLIC_WORKS','PICHHORE','CLOSED',true) as pub \gset
select public.jb_b8_g5_owner_reopen_case(
 :'t96_case'::uuid,'72222222-2222-4222-8222-222222222296'::uuid,
 'Newly considered test evidence requires reopening while protecting prior public state') as reopen_id \gset
reset role;
do $verify$
declare v_last_action text;
begin
 select action into v_last_action from public.b8_g4_public_revisions
  where case_id=current_setting('b8.t96_case')::uuid order by revision_no desc limit 1;
 if v_last_action<>'HIDE'
  or (select case_state from public.b8_cases where id=current_setting('b8.t96_case')::uuid)<>'investigating'
  or (select count(*) from public.b8_g5_fact_events
      where case_id=current_setting('b8.t96_case')::uuid and kind in('OUTCOME','REOPEN'))<>2
  or (select count(*) from public.b8_t096_question_disposition_events
      where case_id=current_setting('b8.t96_case')::uuid)<>1
 then raise exception 'T096_REOPEN_PUBLIC_STALE_OR_OLD_OUTCOME_LOST';end if;
 if (select version::text from public.articles where id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid)
       <>current_setting('b8.t96_article_before')
 or (select title from public.articles where id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid)
       <>current_setting('b8.t96_article_title')
 then raise exception 'T096_OLD_ARTICLE_ID_CONTENT_MUTATED';end if;
end $verify$;
rollback;
\echo 'T096 PG17: same Article master duplicate DENIED, unanswered disposition before close, reopen auto-HIDE, Article stable and rollback'
