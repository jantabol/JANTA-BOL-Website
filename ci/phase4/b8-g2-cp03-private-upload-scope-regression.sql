\set ON_ERROR_STOP on
-- Real disposable PG17 B8 G2 upload RPC / ACL, no LIVE Supabase or network.
begin;
do $acl$
begin
 if has_table_privilege('anon','public.b8_private_upload_receipts','SELECT')
 or has_table_privilege('authenticated','public.b8_private_upload_intents','INSERT')
 or has_function_privilege('authenticated',
  'public.jb_b8_g2_server_finalize_private_upload(uuid,text,bigint,text)','EXECUTE')
 or has_function_privilege('anon',
  'public.jb_b8_g2_reporter_prepare_private_upload(uuid,text,text,bigint)','EXECUTE')
 then raise exception 'B8_CP03_PRIVATE_STORAGE_ROLE_LEAK';end if;
 raise notice 'B8 G2 CP03 ACL explicit no browser Storage receipt or service role RPC PASS';
end $acl$;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_session','on',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g1_owner_create_case(
 'Evidence upload authentication and privacy regression','Pichhore','R1') as c \gset
select public.jb_b8_g1_owner_assign_reporter(
 :'c'::uuid,'22222222-2222-2222-2222-222222222222',
 now()+interval '2 days') as assigned \gset
reset role;
select set_config('b8.fixture_case',:'c',false);
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
select set_config('b8.fixture_session_id','66666666-6666-4666-8666-666666666666',false);
select set_config('b8.fixture_aal','aal1',false);
set role authenticated;
select public.jb_b8_g2_reporter_prepare_private_upload(
 :'c'::uuid,'Synthetic field photo','image/png',128) as i1 \gset
select public.jb_b8_g2_reporter_prepare_private_upload(
 :'c'::uuid,'Synthetic public PDF','application/pdf',96) as i2 \gset
select public.jb_b8_g2_reporter_prepare_private_upload(
 :'c'::uuid,'Synthetic response scan','image/jpeg',128) as i3 \gset
reset role;
select set_config('b8.fixture_i1',:'i1',false);
select set_config('b8.fixture_i2',:'i2',false);
set role authenticated;
do $bad$
declare too_large boolean:=false;wrong_mime boolean:=false;quota boolean:=false;
begin
 begin
  perform public.jb_b8_g2_reporter_prepare_private_upload(
   current_setting('b8.fixture_case')::uuid,
   'Bogus oversized media','application/pdf',8388609);
 exception when others then too_large:=sqlerrm='B8_UPLOAD_METADATA_INVALID';end;
 begin
  perform public.jb_b8_g2_reporter_prepare_private_upload(
   current_setting('b8.fixture_case')::uuid,
   'Bogus html media','text/html',80);
 exception when others then wrong_mime:=sqlerrm='B8_UPLOAD_METADATA_INVALID';end;
 begin
  perform public.jb_b8_g2_reporter_prepare_private_upload(
   current_setting('b8.fixture_case')::uuid,
   'Fourth outstanding media','application/pdf',99);
 exception when others then quota:=sqlerrm='B8_UPLOAD_OUTSTANDING_LIMIT';end;
 if not (too_large and wrong_mime and quota) then
  raise exception 'B8_CP03_UNSAFE_REPORTER_UPLOAD_QUOTA_OR_CONTENT_TYPE';end if;
end $bad$;
reset role;
set role service_role;
select public.jb_b8_g2_server_private_upload_intent(:'i1'::uuid) as server_intent \gset
do $invalid$
declare rejected boolean:=false;
begin
 begin
  perform public.jb_b8_g2_server_finalize_private_upload(
   current_setting('b8.fixture_i1')::uuid,repeat('a',64),127,'image/png');
 exception when others then rejected:=sqlerrm='B8_UPLOAD_READBACK_MISMATCH';end;
 if not rejected then raise exception 'B8_CP03_SERVER_SIZE_MISMATCH_ALLOWED';end if;
end $invalid$;
select public.jb_b8_g2_server_finalize_private_upload(
 :'i1'::uuid,repeat('a',64),128,'image/png') as receipt \gset
do $replay$
declare denied boolean:=false;
begin
 begin
  perform public.jb_b8_g2_server_finalize_private_upload(
    current_setting('b8.fixture_i1')::uuid,repeat('a',64),128,'image/png');
 exception when unique_violation then denied:=true;end;
 if not denied then raise exception 'B8_CP03_RECEIPT_REPLAY_ACCEPTED';end if;
end $replay$;
reset role;
-- A membership suspension between prepare and finalization invalidates prior intent.
update public.team_accounts set status='suspended'
 where user_id='22222222-2222-2222-2222-222222222222';
set role service_role;
do $suspend$
declare denied boolean:=false;
begin
 begin
  perform public.jb_b8_g2_server_finalize_private_upload(
    current_setting('b8.fixture_i2')::uuid,repeat('a',64),96,'application/pdf');
 exception when others then denied:=sqlerrm='B8_UPLOAD_REPORTER_NO_LONGER_AUTHORIZED';end;
 if not denied then raise exception 'B8_CP03_SUSPENDED_REPORTER_FINALIZED_UPLOAD';end if;
end $suspend$;
reset role;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g2_owner_verified_upload_summary(:'c'::uuid) as summary \gset
reset role;
do $truth$
declare v jsonb;
begin
 select public.jb_b8_g2_owner_verified_upload_summary(
  current_setting('b8.fixture_case')::uuid) into v;
 if (v->>'server_reported_private_readback_count')::int<>1
 or v->>'source_authenticity_verified'<>'false'
 or v->>'official_documentary_proof_verified'<>'false'
 or v->>'raw_private_file_url_exposed'<>'false'
 then raise exception 'B8_CP03_FILE_HASH_FALSE_OFFICIAL_PROOF';end if;
 if (select count(*) from public.b8_private_upload_receipts)<>1 then
  raise exception 'B8_CP03_RECEIPT_COUNT_INVALID';end if;
 raise notice 'B8 G2 PG17 service-only finalize, Reporter grant/session/quota, replay, suspension, truth labels PASS';
end $truth$;
rollback;
do $after$
begin
 if (select count(*) from public.b8_private_upload_intents)<>0 or
 (select count(*) from public.b8_private_upload_receipts)<>0 or
 (select count(*) from public.b8_cases)<>0 or
 (select count(*) from public.articles)<>1 or
 (select count(*) from public.ad_campaigns)<>1 then
 raise exception 'B8_CP03_ROLLBACK_OR_PROTECTED_NEWS_FAILURE';end if;
 raise notice 'B8 G2 CP03 PostgreSQL17 ROLLBACK PASS; no production Storage upload E3';
end $after$;
