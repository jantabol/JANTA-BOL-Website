\set ON_ERROR_STOP on
-- T097 neutral case privacy, original/revised version chain, original digest immutability,
-- 120-case-evidence and 105-chronology entries via stable keyset pages, no E9 claims.
begin;
do $acl$
begin
 if has_table_privilege('anon','public.b8_t097_document_versions','SELECT')
 or has_table_privilege('authenticated','public.b8_t097_document_versions','INSERT')
 or has_function_privilege('anon','public.jb_b8_t097_owner_fact_page(uuid,bigint,integer)','EXECUTE')
 or has_function_privilege('anon','public.jb_b8_t097_owner_history_page(uuid,bigint,integer)','EXECUTE')
 or has_function_privilege('anon','public.jb_b8_t097_owner_record_document_version(uuid,text,text,uuid,bigint)','EXECUTE')
 then raise exception 'T097_PRIVATE_EVIDENCE_ACL_LEAK';end if;
end $acl$;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_aal','aal2',false);
select set_config('b8.fixture_session','on',false);
set role authenticated;
select public.jb_b8_g1_owner_create_case(
 'T097 synthetic neutral source process for government','Pichhore','R0') as t97_case \gset
select public.jb_b8_g1_owner_create_case(
 'T097 synthetic same proof standard for Founder','Shivpuri','R0') as t97_other \gset
select public.jb_b8_g6_owner_set_private_upload(
 true,'Synthetic T097 PG17 private byte fixture temporary permission; not a production upload.');
reset role;
select set_config('b8.t97_case',:'t97_case',false);
select set_config('b8.t97_other',:'t97_other',false);
insert into public.b8_private_upload_intents(
 id,case_id,reporter_user_id,reporter_session_id,object_key,original_label,
 expected_mime,expected_bytes)
values(
 '81111111-1111-4111-8111-111111111197',:'t97_case'::uuid,
 '22222222-2222-2222-2222-222222222222',
 '66666666-6666-4666-8666-666666666666','t097/original.bin',
 'Synthetic original document','application/pdf',100),
 (
 '82222222-2222-4222-8222-222222222297',:'t97_case'::uuid,
 '22222222-2222-2222-2222-222222222222',
 '66666666-6666-4666-8666-666666666666','t097/revised.bin',
 'Synthetic revised document','application/pdf',100),
 (
 '83333333-3333-4333-8333-333333333397',:'t97_other'::uuid,
 '22222222-2222-2222-2222-222222222222',
 '66666666-6666-4666-8666-666666666666','t097/cross-case.bin',
 'Synthetic another subject','application/pdf',100);
insert into public.b8_private_upload_receipts(
 id,intent_id,case_id,server_sha256,byte_count,mime_type)
values(
 '71111111-1111-4111-8111-111111111197','81111111-1111-4111-8111-111111111197',
 :'t97_case'::uuid,repeat('a',64),100,'application/pdf'),
 (
 '72222222-2222-4222-8222-222222222297','82222222-2222-4222-8222-222222222297',
 :'t97_case'::uuid,repeat('b',64),100,'application/pdf'),
 (
 '73333333-3333-4333-8333-333333333397','83333333-3333-4333-8333-333333333397',
 :'t97_other'::uuid,repeat('c',64),100,'application/pdf');
set role authenticated;
select public.jb_b8_g6_owner_set_private_upload(
 false,'T097 synthetic receipts created; private evidence upload back OFF.');
reset role;
set role authenticated;
do $cross$
declare denied boolean:=false;
begin
 begin
 perform public.jb_b8_t097_owner_record_document_version(current_setting('b8.t97_case')::uuid,
  'nh3_project', 'ORIGINAL','73333333-3333-4333-8333-333333333397'::uuid,null);
 exception when others then denied:=sqlerrm='B8_T097_SAME_CASE_RECEIPT_REQUIRED';end;
 if not denied then raise exception 'T097_CROSS_CASE_RECEIPT_ACCEPTED';end if;
end $cross$;
select public.jb_b8_t097_owner_record_document_version(
 :'t97_case'::uuid,'nh3_project','ORIGINAL',
 '71111111-1111-4111-8111-111111111197'::uuid,null) as t97_v1 \gset
select public.jb_b8_t097_owner_record_document_version(
 :'t97_case'::uuid,'nh3_project','REVISED',
 '72222222-2222-4222-8222-222222222297'::uuid,:'t97_v1'::bigint) as t97_v2 \gset
reset role;
select set_config('b8.t97_v1',:'t97_v1',false);
select set_config('b8.t97_v2',:'t97_v2',false);
set role authenticated;
do $badrevision$
declare denied boolean:=false;
begin
 begin
 perform public.jb_b8_t097_owner_record_document_version(
   current_setting('b8.t97_case')::uuid,'nh3_project','REVISED',
   '72222222-2222-4222-8222-222222222297'::uuid,
   current_setting('b8.t97_v1')::bigint);
 exception when others then denied:=sqlerrm='B8_T097_REVISION_MUST_FOLLOW_LATEST_VERSION';end;
 if not denied then raise exception 'T097_FORKED_OLD_OFFICIAL_VERSION';end if;
end $badrevision$;
reset role;
do $sealed$
declare denied boolean:=false;
begin
 begin
  update public.b8_t097_document_versions set private_receipt_id='72222222-2222-4222-8222-222222222297'::uuid
  where id=current_setting('b8.t97_v1')::bigint;
 exception when others then denied:=sqlerrm='B8_T097_DOCUMENT_VERSION_IMMUTABLE';end;
 if not denied then raise exception 'T097_OLD_VERSION_MUTATED';end if;
 if (select count(*) from public.b8_t097_document_versions
     where case_id=current_setting('b8.t97_case')::uuid and document_key='nh3_project')<>2
 then raise exception 'T097_EVIDENCE_VERSION_COUNT_WRONG';end if;
end $sealed$;
-- 120 synthetically attributed facts. This must remain possible (no hard total item cap).
insert into public.b8_g5_fact_events(case_id,kind,field_code,detail_text,recorded_by)
select :'t97_case'::uuid,'GROUND','FIELD_OBSERVATION_REPORTED',
 'Synthetic, independently UNVERIFIED test observation number '||g,
 '11111111-1111-1111-1111-111111111111'::uuid
from generate_series(1,120) g;
insert into public.b8_g7_history_events(case_id,event_kind,factual_note,actor_user_id)
select :'t97_case'::uuid,'SUMMARY_DRAFT',
 'Synthetic, independently UNVERIFIED chronology item number '||g,
 '11111111-1111-1111-1111-111111111111'::uuid
from generate_series(1,105) g;
set role authenticated;
do $pages$
declare a jsonb;b jsonb;c jsonb;h1 jsonb;h2 jsonb;h3 jsonb;
 all_events jsonb;all_history jsonb;id_count integer;id_h_count integer;denied boolean:=false;
begin
 a:=public.jb_b8_t097_owner_fact_page(current_setting('b8.t97_case')::uuid,null,50);
 b:=public.jb_b8_t097_owner_fact_page(current_setting('b8.t97_case')::uuid,
   (a->>'next_before_id')::bigint,50);
 c:=public.jb_b8_t097_owner_fact_page(current_setting('b8.t97_case')::uuid,
   (b->>'next_before_id')::bigint,50);
 all_events:=(a->'items')||(b->'items')||(c->'items');
 select count(distinct (r->>'id')::bigint) into id_count from jsonb_array_elements(all_events) r;
 if id_count<>120 or jsonb_array_length(all_events)<>120
   or (a->>'has_more')::boolean is distinct from true
   or (b->>'has_more')::boolean is distinct from true
   or (c->>'has_more')::boolean is distinct from false
 then raise exception 'T097_LOST_120_EVIDENCE_ROWS_OR_BAD_CURSOR';end if;
 h1:=public.jb_b8_t097_owner_history_page(current_setting('b8.t97_case')::uuid,null,50);
 h2:=public.jb_b8_t097_owner_history_page(current_setting('b8.t97_case')::uuid,
   (h1->>'next_before_id')::bigint,50);
 h3:=public.jb_b8_t097_owner_history_page(current_setting('b8.t97_case')::uuid,
   (h2->>'next_before_id')::bigint,50);
 all_history:=(h1->'items')||(h2->'items')||(h3->'items');
 select count(distinct (r->>'id')::bigint) into id_h_count from jsonb_array_elements(all_history) r;
 if id_h_count<>105 or jsonb_array_length(all_history)<>105
 then raise exception 'T097_LOST_105_TIMELINE_ROWS';end if;
 begin
 perform public.jb_b8_t097_owner_fact_page(current_setting('b8.t97_case')::uuid,null,101);
 exception when others then denied:=sqlerrm='B8_T097_PAGE_LIMIT_INVALID';end;
 if not denied then raise exception 'T097_UNBOUNDED_PAGE_ACCEPTED';end if;
end $pages$;
reset role;
-- No true public case publication or official E9 evidence is created by a private version ledger.
rollback;
\echo 'T097 PG17 120 evidence + 105 history keyset, immutable version chain, cross-case and anon negative, truth labels rollback PASS'
