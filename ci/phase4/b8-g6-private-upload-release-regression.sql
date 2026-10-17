\set ON_ERROR_STOP on
-- B8 G6 real PG17: Founder AAL2 release gate OFF->ON->OFF and receipt race;
-- disposable only. DOES NOT send, publish, upload bytes or mutate LIVE.
do $b8$
begin
 if (select enabled from public.b8_g6_release_controls
 where feature='PRIVATE_EVIDENCE_UPLOAD') is distinct from false
 or has_table_privilege('anon','public.b8_g6_release_controls','SELECT')
 or has_table_privilege('authenticated','public.b8_g6_release_controls','UPDATE')
 or has_function_privilege('anon',
 'public.jb_b8_g6_owner_set_private_upload(boolean,text)','EXECUTE')
 then raise exception 'B8_G6_UNSAFE_INITIAL_RELEASE_OR_ACL';end if;
end $b8$;
select set_config('b8.g6_baseline',(select count(*)::text from public.b8_cases),false);
begin;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_aal','aal2',false);
select set_config('b8.fixture_session','on',false);
set role authenticated;
select public.jb_b8_g1_owner_create_case(
 'Synthetic G6 reporter private upload guarded case','Pichhore','R0') as case_id \gset
select public.jb_b8_g1_owner_assign_reporter(
 :'case_id'::uuid,'22222222-2222-2222-2222-222222222222',
 now()+interval '2 days');
reset role;
select set_config('b8.g6_case',:'case_id',false);
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
select set_config('b8.fixture_aal','aal1',false);
select set_config('b8.fixture_session_id','66666666-6666-4666-8666-666666666666',false);
set role authenticated;
do $b8$
declare denied boolean:=false;v jsonb;
begin
 v:=public.jb_b8_g6_reporter_private_upload_readiness(current_setting('b8.g6_case')::uuid);
 if v->>'allowed'<>'false' or v->>'truth'<>'PRIVATE_BYTES_ONLY_NOT_OFFICIAL_AUTHENTICITY'
 then raise exception 'B8_G6_DISABLED_READINESS_LIED';end if;
 begin
 perform public.jb_b8_g2_reporter_prepare_private_upload(
  current_setting('b8.g6_case')::uuid,
  'Synthetic restricted file','application/pdf',500);
 exception when others then denied:=sqlerrm='B8_G6_PRIVATE_UPLOAD_FOUNDER_RELEASE_DISABLED';end;
 if not denied then raise exception 'B8_G6_REPORTER_UPLOAD_WHILE_OFF';end if;
 begin
 perform public.jb_b8_g6_owner_set_private_upload(true,
  'Reporter cannot unilaterally enable uploads');
 exception when others then denied:=sqlerrm='B8_OWNER_AAL2_REQUIRED';end;
 if not denied then raise exception 'B8_G6_REPORTER_ESCALATED_TO_FOUNDER';end if;
end $b8$;
reset role;
-- Owner AAL1 denied and revoked/suspended reporter remains denied after ON.
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
set role authenticated;
do $b8$
declare denied boolean:=false;
begin
 begin
 perform public.jb_b8_g6_owner_set_private_upload(true,
  'AAL1 session must never turn on file ingress');
 exception when others then denied:=sqlerrm='B8_OWNER_AAL2_REQUIRED';end;
 if not denied then raise exception 'B8_G6_AAL1_ENABLED';end if;
end $b8$;
reset role;
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g6_owner_set_private_upload(
 true,'Founder authorizes only bounded private evidence manual testing') as enabled \gset
reset role;
\if :enabled
\else
 \echo 'B8_G6_OWNER_GATE_ENABLE_FAILED'
 \quit 1
\endif
select set_config('b8.fixture_actor','33333333-3333-3333-3333-333333333333',false);
select set_config('b8.fixture_aal','aal1',false);
set role authenticated;
do $b8$
declare v jsonb;
begin
 v:=public.jb_b8_g6_reporter_private_upload_readiness(current_setting('b8.g6_case')::uuid);
 if v->>'allowed'<>'false' then raise exception 'B8_G6_OTHER_REPORTER_GOT_CASE';end if;
end $b8$;
reset role;
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
set role authenticated;
do $b8$
declare v jsonb;
begin
 v:=public.jb_b8_g6_reporter_private_upload_readiness(current_setting('b8.g6_case')::uuid);
 if v->>'allowed'<>'true' or (v->>'max_bytes')::bigint<>8388608
 then raise exception 'B8_G6_ALLOWED_REPORTER_GATED_INCORRECTLY';end if;
end $b8$;
select public.jb_b8_g2_reporter_prepare_private_upload(
 :'case_id'::uuid,'Synthetic uploaded bytes claim','application/pdf',500) as intent \gset
reset role;
-- OFF after PREPARE must block late Edge service-role FINALIZE.
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g6_owner_set_private_upload(
 false,'Founder emergency revokes upload gateway before finalization') as disabled \gset
reset role;
set role service_role;
do $b8$
declare denied boolean:=false;
begin
 begin
 perform public.jb_b8_g2_server_finalize_private_upload(
  :'intent'::uuid,repeat('a',64),500,'application/pdf');
 exception when others then denied:=sqlerrm='B8_G6_PRIVATE_UPLOAD_FOUNDER_RELEASE_DISABLED';end;
 if not denied then raise exception 'B8_G6_DISABLED_FINALIZE_BYPASS';end if;
end $b8$;
reset role;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
set role authenticated;
select public.jb_b8_g6_owner_set_private_upload(
 true,'Founder explicitly reopens private byte gateway for controlled finalization');
reset role;
set role service_role;
select public.jb_b8_g2_server_finalize_private_upload(
 :'intent'::uuid,repeat('a',64),500,'application/pdf') as receipt \gset
reset role;
do $b8$
declare denied boolean:=false;
begin
 begin
 delete from public.b8_g6_release_events where feature='PRIVATE_EVIDENCE_UPLOAD';
 exception when others then denied:=sqlerrm='B8_G6_RELEASE_AUDIT_IMMUTABLE';end;
 if not denied then raise exception 'B8_G6_RELEASE_HISTORY_WAS_DELETED';end if;
 if (select count(*) from public.b8_g6_release_events)<>3
 or (select count(*) from public.b8_private_upload_receipts r
      where r.intent_id=:'intent'::uuid)<>1
 or (select enabled from public.b8_g6_release_controls
      where feature='PRIVATE_EVIDENCE_UPLOAD') is distinct from true
 then raise exception 'B8_G6_RELEASE_TRANSITION_DRIFT';end if;
 raise notice 'B8 G6 PG17 default OFF, AAL1/reporter denied, scope denied, Founder 3 audited toggles, pending-finalize OFF refused, receipt after ON, immutable PASS';
end $b8$;
rollback;
do $b8$
begin
 if (select enabled from public.b8_g6_release_controls
 where feature='PRIVATE_EVIDENCE_UPLOAD') is distinct from false
 or exists(select 1 from public.b8_g6_release_events)
 or (select count(*) from public.b8_cases)<>current_setting('b8.g6_baseline')::integer
 then raise exception 'B8_G6_ISOLATED_ROLLBACK_DRIFT';end if;
 raise notice 'B8 G6 disposable rollback PASS; no real evidence and no LIVE writes';
end $b8$;
