\set ON_ERROR_STOP on
-- B8 G2 CP03 - REAL DISPOSABLE PostgreSQL17 role/RPC/receipt/rollback evidence.
-- Does NOT perform real Storage API network calls. JS gateway readback is separate E1.
begin;
do $acl$
begin
 if has_table_privilege('anon','public.b8_private_upload_intents','SELECT')
 or has_table_privilege('authenticated','public.b8_private_upload_receipts','INSERT')
 or has_function_privilege('anon',
 'public.jb_b8_g2_reporter_prepare_private_upload(uuid,text,text,bigint)','EXECUTE')
 or has_function_privilege('authenticated',
 'public.jb_b8_g2_server_finalize_private_upload(uuid,text,bigint,text)','EXECUTE')
 or has_function_privilege('authenticated',
 'public.jb_b8_g2_server_private_upload_intent(uuid)','EXECUTE')
 then raise exception 'B8_G2_CP03_DIRECT_PRIVATE_STORAGE_OR_SERVICE_RPC_EXPOSED';end if;
 raise notice 'B8 G2 CP03 deny-by-default tables and server-only receipt RPC PASS';
end $acl$;

select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_session','on',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g1_owner_create_case(
 'Reporter private photo and document archive verification',
 'Pichhore','R1') as upload_case \gset
select public.jb_b8_g1_owner_assign_reporter(
 :'upload_case'::uuid,'22222222-2222-2222-2222-222222222222',
 now()+interval '2 days') as reporter_granted \gset
reset role;
select set_config('b8.fixture_case',:'upload_case',false);
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
select set_config('b8.fixture_aal','aal1',false);
select set_config('b8.fixture_session_id','66666666-6666-4666-8666-666666666666',false);
set role authenticated;
select public.jb_b8_g2_reporter_prepare_private_upload(
 :'upload_case'::uuid,'Synthetic inspection photo PNG','image/png',128) as upload_intent \gset
reset role;
select set_config('b8.fixture_intent',:'upload_intent',false);
do $bind$
declare v public.b8_private_upload_intents%rowtype;
begin
 select * into v from public.b8_private_upload_intents
  where id=current_setting('b8.fixture_intent')::uuid;
 if v.reporter_user_id::text<>'22222222-2222-2222-2222-222222222222'
 or v.reporter_session_id::text<>'66666666-6666-4666-8666-666666666666'
 or v.object_key<>'b8/cases/'||v.case_id::text||'/'||v.id::text||'.bin'
 or v.expected_bytes<>128 or v.expected_mime<>'image/png'
 then raise exception 'B8_G2_CP03_INTENT_CASE_ACTOR_OR_STORAGE_PATH_NOT_SERVER_BOUND';end if;
end $bind$;

-- Browser/Reporter cannot pretend server has uploaded a byte or read the private path.
set role authenticated;
do $deny$
declare denied boolean:=false;
begin
 begin
  perform public.jb_b8_g2_server_private_upload_intent(
   current_setting('b8.fixture_intent')::uuid);
 exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'B8_CP03_REPORTER_READ_PRIVATE_SERVICE_INTENT';end if;
end $deny$;
reset role;

-- Test all type, quota, active-session, wrong role negatives before receipt.
set role authenticated;
do $bad$
declare bad_type boolean:=false; bad_size boolean:=false; missing boolean:=false;
begin
 begin
  perform public.jb_b8_g2_reporter_prepare_private_upload(
   current_setting('b8.fixture_case')::uuid,'Disguised script payload',
   'text/html',128);
 exception when others then bad_type:=sqlerrm='B8_UPLOAD_METADATA_INVALID';end;
 begin
  perform public.jb_b8_g2_reporter_prepare_private_upload(
   current_setting('b8.fixture_case')::uuid,'Oversized media item',
   'image/png',8388609);
 exception when others then bad_size:=sqlerrm='B8_UPLOAD_METADATA_INVALID';end;
 begin
  perform public.jb_b8_g2_reporter_prepare_private_upload(
   'ffffffff-ffff-ffff-ffff-ffffffffffff',
   'Cross-case evidence file','image/jpeg',256);
 exception when others then missing:=sqlerrm='B8_ASSIGNED_ACTIVE_REPORTER_REQUIRED';end;
 if not(bad_type and bad_size and missing) then
  raise exception 'B8_CP03_UNTRUSTED_SIZE_TYPE_OR_CASE_UPLOAD_INTENT_ALLOWED';end if;
end $bad$;
reset role;

-- Bounded pending intents: at most 3 for the same case when no receipt yet.
set role authenticated;
select public.jb_b8_g2_reporter_prepare_private_upload(
 :'upload_case'::uuid,'Second synthetic report','application/pdf',96) as p2 \gset
select public.jb_b8_g2_reporter_prepare_private_upload(
 :'upload_case'::uuid,'Third synthetic report','image/jpeg',112) as p3 \gset
do $quota$
declare denied boolean:=false;
begin
 begin
  perform public.jb_b8_g2_reporter_prepare_private_upload(
   current_setting('b8.fixture_case')::uuid,'Fourth pending upload',
   'application/pdf',200);
 exception when others then denied:=sqlerrm='B8_UPLOAD_OUTSTANDING_LIMIT';end;
 if not denied then raise exception 'B8_CP03_UNBOUNDED_PENDING_UPLOADS';end if;
end $quota$;
reset role;

-- Service-role-only finalizer verifies exact transaction state and no revoked sessions.
set role service_role;
select public.jb_b8_g2_server_private_upload_intent(:'upload_intent'::uuid) as upload_meta \gset
do $hash_wrong$
declare rejected boolean:=false;
begin
 begin
  perform public.jb_b8_g2_server_finalize_private_upload(
   current_setting('b8.fixture_intent')::uuid,repeat('a',64),127,'image/png');
 exception when others then rejected:=sqlerrm='B8_UPLOAD_READBACK_MISMATCH';end;
 if not rejected then raise exception 'B8_CP03_INVALID_HASH_SIZE_RECEIPT_ACCEPTED';end if;
end $hash_wrong$;
select public.jb_b8_g2_server_finalize_private_upload(
 :'upload_intent'::uuid,repeat('a',64),128,'image/png') as receipt_id \gset
do $replay$
declare denied boolean:=false;
begin
 begin
  perform public.jb_b8_g2_server_finalize_private_upload(
   current_setting('b8.fixture_intent')::uuid,repeat('a',64),128,'image/png');
 exception when unique_violation then denied:=true;end;
 if not denied then raise exception 'B8_CP03_DUPLICATE_RECEIPT_ACCEPTED';end if;
end $replay$;
reset role;

-- A revoked session blocks finalization of another pending upload.
delete from auth.sessions where id='66666666-6666-4666-8666-666666666666';
set role service_role;
do $revoked$
declare denied boolean:=false;
begin
 begin
  perform public.jb_b8_g2_server_finalize_private_upload(
   :'p2'::uuid,repeat('b',64),96,'application/pdf');
 exception when others then denied:=sqlerrm='B8_UPLOAD_REPORTER_NO_LONGER_AUTHORIZED';end;
 if not denied then raise exception 'B8_CP03_REVOKED_SESSION_FINALIZED_OTHER_UPLOAD';end if;
end $revoked$;
reset role;

select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g2_owner_verified_upload_summary(:'upload_case'::uuid) as safe_owner_summary \gset
reset role;
do $truth$
declare v jsonb;
begin
 -- SECURITY DEFINER enforces current Owner/AAL2 in fixture.
 select public.jb_b8_g2_owner_verified_upload_summary(
  current_setting('b8.fixture_case')::uuid) into v;
 if (v->>'server_reported_private_readback_count')::int<>1
 or v->>'source_authenticity_verified'<>'false'
 or v->>'official_documentary_proof_verified'<>'false'
 or v->>'raw_private_file_url_exposed'<>'false'
 then raise exception 'B8_CP03_UNVERIFIED_UPLOAD_FALSE_AUTHENTICITY';end if;
 if (select count(*) from public.b8_private_upload_intents)<>3
 or (select count(*) from public.b8_private_upload_receipts)<>1
 then raise exception 'B8_CP03_PRIVATE_LEDGER_WRONG_COUNTS';end if;
 raise notice 'B8 G2 CP03 PG17 actor-bound JWT session, 8MB MIME quota, service-only receipt, revoked finalize denial and truthful Owner summary PASS';
end $truth$;
rollback;
do $after$
begin
 if (select count(*) from public.b8_private_upload_receipts)<>0
 or (select count(*) from public.b8_private_upload_intents)<>0
 or (select count(*) from public.b8_cases)<>0
 or (select count(*) from public.articles)<>1
 or (select count(*) from public.ad_campaigns)<>1
 then raise exception 'B8_CP03_DISPOSABLE_POSTGRES_ROLLBACK_FAILURE';end if;
 raise notice 'B8 G2 CP03 ROLLBACK PASS original News/Ad untouched, NO REAL STORAGE NETWORK';
end $after$;
