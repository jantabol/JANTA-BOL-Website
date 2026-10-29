\set ON_ERROR_STOP on
-- Disposable PostgreSQL17, synthetic Article only. Transaction rolls back.
begin;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_session','on',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g1_owner_create_case(
 'Accountability old Article protection against history loss','Pichhore','R1') as held_case \gset
select public.jb_b8_g2_owner_link_article(
 :'held_case'::uuid,'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') as link_id \gset
select public.jb_b8_g2_owner_assert_hold(
 :'held_case'::uuid,'Preserve original document and right of reply evidence.') as hold_id \gset
reset role;
select set_config('b8.fixture_case',:'held_case',false);

do $checks$
declare rejected boolean:=false;
begin
 begin
  delete from public.articles where id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
 exception when others then
  rejected:=sqlerrm='B8_LINKED_ARTICLE_REQUIRES_CONTROLLED_DISPOSITION';end;
 if not rejected then raise exception 'B8_G2_LINKED_ARTICLE_DESTRUCTIVE_DELETE_ALLOWED';end if;
 if (select count(*) from public.article_sources)<>1
 or (select count(*) from public.article_versions)<>1
 or (select count(*) from public.verification_history)<>1
 or (select count(*) from public.b8_case_article_links)<>1
 then raise exception 'B8_G2_OLD_EVIDENCE_CASCADE_OCCURRED';end if;
 raise notice 'B8 G2 held Article hard delete denied before original source/version CASCADE';
end $checks$;

do $tamper$
declare blocked boolean:=false;
begin
 begin
  update public.b8_case_legal_hold_events set action='HOLD_SET'
   where case_id=current_setting('b8.fixture_case')::uuid;
 exception when others then blocked:=sqlerrm='B8_HOLD_EVENT_IMMUTABLE';end;
 if not blocked then raise exception 'B8_G2_HOLD_EVENT_EDIT_ALLOWED';end if;
end $tamper$;
rollback;
do $after$
begin
 if (select count(*) from public.b8_case_legal_hold_events)<>0
 or (select count(*) from public.articles where id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')<>1
 then raise exception 'B8_G2_HOLD_TEST_NOT_ROLLED_BACK';end if;
 raise notice 'B8 G2 legal hold test ROLLBACK, original synthetic News protected';
end $after$;
