\set ON_ERROR_STOP on
-- B8 G2 CP01: actual disposable PG17 evidence-claim and privacy regression.
-- No live credentials. Legacy Article FK metadata checked; no Article deletion executed.
begin;
do $check$
begin
 if has_table_privilege('anon','public.b8_case_evidence_claims','SELECT')
 or has_table_privilege('authenticated','public.b8_case_evidence_claims','INSERT')
 or has_table_privilege('authenticated','public.b8_case_article_links','SELECT')
 or has_function_privilege('anon','public.jb_b8_g2_owner_link_article(uuid,uuid)','EXECUTE')
 then raise exception 'B8_G2_DIRECT_PRIVATE_DATA_ACCESS';end if;
 if (select count(*) from pg_constraint k join pg_class c on c.oid=k.conrelid
   where c.relname in('article_sources','article_versions','verification_history')
   and k.contype='f' and k.confdeltype='c')<>3
 then raise exception 'B8_G2_OLD_ARTICLE_CASCADE_CONTRACT_NOT_REPRODUCED';end if;
 if exists(select 1 from pg_constraint k join pg_class c on c.oid=k.conrelid
  where c.relname='b8_case_article_links' and k.contype='f'
    and k.confrelid='public.articles'::regclass)
 then raise exception 'B8_G2_CASE_REFERENCE_STILL_DEPENDS_ON_ARTICLE_ROW';end if;
 raise notice 'B8 G2 protected private table ACL, old three CASCADE constraints, independent case reference PASS';
end $check$;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_session','on',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g1_owner_create_case(
 'Independent evidence metadata record for local road project',
 'Pichhore','R1') as evidence_case \gset
select public.jb_b8_g1_owner_assign_reporter(
 :'evidence_case'::uuid,'22222222-2222-2222-2222-222222222222',
 now()+interval '2 days') as grant_ok \gset
select public.jb_b8_g2_owner_link_article(
 :'evidence_case'::uuid,'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') as link_id \gset
reset role;
select set_config('b8.fixture_case',:'evidence_case',false);
select set_config('b8.fixture_link',:'link_id',false);
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
select set_config('b8.fixture_aal','aal1',false);
set role authenticated;
select public.jb_b8_g2_reporter_submit_evidence_claim(
 :'evidence_case'::uuid,'PUBLIC_DOCUMENT','Synthetic dated public expenditure',
 repeat('A',64),current_date) as evidence_id \gset
reset role;
select set_config('b8.fixture_evidence',:'evidence_id',false);
set role authenticated;
do $negative$
declare bad_hash boolean:=false;bad_date boolean:=false;
begin
 begin
  perform public.jb_b8_g2_reporter_submit_evidence_claim(
   current_setting('b8.fixture_case')::uuid,'PUBLIC_DOCUMENT',
   'Untrusted short hash','bad',current_date);
 exception when others then bad_hash:=sqlerrm='B8_INVALID_EVIDENCE_CLAIM';end;
 begin
  perform public.jb_b8_g2_reporter_submit_evidence_claim(
   current_setting('b8.fixture_case')::uuid,'FIELD_OBSERVATION',
   'Impossible future observation',repeat('a',64),current_date+1);
 exception when others then bad_date:=sqlerrm='B8_INVALID_EVIDENCE_CLAIM';end;
 if not (bad_hash and bad_date) then
  raise exception 'B8_G2_UNVALIDATED_CLAIM_ACCEPTED';end if;
end $negative$;
reset role;
select set_config('b8.fixture_actor','33333333-3333-3333-3333-333333333333',false);
set role authenticated;
do $wrong$
declare denied boolean:=false;
begin
 begin
  perform public.jb_b8_g2_reporter_submit_evidence_claim(
   current_setting('b8.fixture_case')::uuid,'PUBLIC_DOCUMENT',
   'Another Reporter forged this claim',repeat('a',64),current_date);
 exception when others then
  denied:=sqlerrm='B8_ASSIGNED_ACTIVE_REPORTER_REQUIRED';end;
 if not denied then raise exception 'B8_G2_OTHER_REPORTER_WROTE_CLAIM';end if;
end $wrong$;
reset role;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_aal','aal1',false);
set role authenticated;
do $owner_low$
declare denied boolean:=false;
begin
 begin
 perform public.jb_b8_g2_owner_provenance_summary(
  current_setting('b8.fixture_case')::uuid);
 exception when others then denied:=sqlerrm='B8_OWNER_AAL2_REQUIRED';end;
 if not denied then raise exception 'B8_G2_OWNER_AAL1_READ_PRIVATE_PROOF';end if;
end $owner_low$;
reset role;
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g2_owner_provenance_summary(:'evidence_case'::uuid) as proof_card \gset
reset role;
do $truth$
declare v jsonb;
begin
 select public.jb_b8_g2_owner_provenance_summary(current_setting('b8.fixture_case')::uuid) into v;
 if (v->>'bytes_verified')::boolean<>false
 or (v->>'source_bytes_preserved')::boolean<>false
 or (v->>'legal_hold_enforced')::boolean<>false
 or v->>'proof_status'<>'NOT_VERIFIED'
 or (v->>'evidence_claim_count')::int<>1
 or (v->'linked_articles'->0->>'version_at_link')::bigint<>7
 or (select claimed_sha256 from public.b8_case_evidence_claims
     where id=current_setting('b8.fixture_evidence')::uuid)<>repeat('a',64)
 then raise exception 'B8_G2_UNVERIFIED_EVIDENCE_FALSIFIED';end if;
 raise notice 'B8 G2 evidence hash claim, Article version, confidentiality and truthful NOT_VERIFIED/NO_BYTES state PASS';
end $truth$;
do $immutable$
declare link_lock boolean:=false;claim_lock boolean:=false;
begin
 begin
  update public.b8_case_article_links set article_version_at_link=12
   where id=current_setting('b8.fixture_link')::uuid;
 exception when others then link_lock:=sqlerrm='B8_G2_IMMUTABLE_CASE_PROVENANCE';end;
 begin
  update public.b8_case_evidence_claims set document_label='Rewritten label'
   where id=current_setting('b8.fixture_evidence')::uuid;
 exception when others then claim_lock:=sqlerrm='B8_G2_IMMUTABLE_CASE_PROVENANCE';end;
 if not (link_lock and claim_lock) then raise exception 'B8_G2_CASE_PROVENANCE_CHANGED';end if;
end $immutable$;
rollback;
do $after$
begin
 if (select count(*) from public.articles)<>1
 or (select count(*) from public.article_sources)<>1
 or (select count(*) from public.article_versions)<>1
 or (select count(*) from public.verification_history)<>1
 or (select count(*) from public.ad_campaigns)<>1
 or (select count(*) from public.b8_case_evidence_claims)<>0
 or (select count(*) from public.b8_case_article_links)<>0
 then raise exception 'B8_G2_ROLLBACK_OR_EXISTING_NEWS_ALTERED';end if;
 raise notice 'B8 G2 disposable PG17 ROLLBACK PASS; old News and B7 sentinel untouched';
end $after$;
