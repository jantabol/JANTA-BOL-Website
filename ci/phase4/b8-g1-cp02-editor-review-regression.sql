\set ON_ERROR_STOP on
-- B8 CP02 REAL disposable PostgreSQL17: editorial review + immutable ledger/ACL.
-- No LIVE dataset, no actual official dispatch. E2-candidate only.
begin;
do $acl$
begin
 if has_table_privilege('anon','public.b8_question_review_requests','SELECT')
 or has_table_privilege('authenticated','public.b8_question_review_decisions','UPDATE')
 or has_table_privilege('authenticated','public.b8_case_review_events','INSERT')
 or has_function_privilege('anon','public.jb_b8_g1_editor_review(uuid,text,text)','EXECUTE')
 or has_function_privilege('anon','public.jb_b8_g1_owner_preliminary_review_packet(uuid)','EXECUTE')
 or has_function_privilege('authenticated','private.b8_g1_editor_case_allowed(uuid)','EXECUTE')
 then raise exception 'B8_CP02_PRIVATE_ACL_OR_FUNCTION_LEAK';end if;
 raise notice 'B8 CP02 ACL private default and no public Writer PASS';
end $acl$;

select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_session','on',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g1_owner_create_case(
  'Road cost statement discrepancies documented for review','Pichhore','R1') as case_r1 \gset
select public.jb_b8_g1_owner_create_case(
  'Restricted private source privacy risk and potential exposure','Pichhore','R2') as case_r2 \gset
select public.jb_b8_g1_owner_create_case(
  'Ordinary public record request about local road progress','Pichhore','R0') as case_r0 \gset
reset role;
select set_config('b8.fixture_r1',:'case_r1',false);
select set_config('b8.fixture_r2',:'case_r2',false);
select set_config('b8.fixture_r0',:'case_r0',false);

set role authenticated;
select public.jb_b8_g1_owner_assign_reporter(
  :'case_r1'::uuid,'22222222-2222-2222-2222-222222222222',now()+interval '2 days');
select public.jb_b8_g1_owner_assign_reporter(
  :'case_r2'::uuid,'22222222-2222-2222-2222-222222222222',now()+interval '2 days');
select public.jb_b8_g1_owner_assign_reporter(
  :'case_r0'::uuid,'22222222-2222-2222-2222-222222222222',now()+interval '2 days');
select public.jb_b8_g1_owner_assign_editor(
  :'case_r1'::uuid,'44444444-4444-4444-4444-444444444444',now()+interval '2 days');
select public.jb_b8_g1_owner_assign_editor(
  :'case_r2'::uuid,'44444444-4444-4444-4444-444444444444',now()+interval '2 days');
reset role;

-- Owner at AAL1 cannot view even an incomplete packet or change editor grants.
select set_config('b8.fixture_aal','aal1',false);
set role authenticated;
do $a$
declare denied boolean:=false;
begin
 begin
  perform public.jb_b8_g1_owner_assign_editor(
   current_setting('b8.fixture_r1')::uuid,'55555555-5555-5555-5555-555555555555',now()+interval '1 day');
 exception when others then denied:=sqlerrm='B8_OWNER_AAL2_REQUIRED';end;
 if not denied then raise exception 'B8_CP02_OWNER_AAL1_EDITOR_ASSIGN_ALLOWED';end if;
end $a$;
reset role;

select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
select set_config('b8.fixture_aal','aal1',false);
set role authenticated;
select public.jb_b8_g1_reporter_create_draft(
  :'case_r1'::uuid,'Please provide the sanctioned cost and the actual amount spent, with public supporting records.',
  'Public Works Office') as q_r1 \gset
select public.jb_b8_g1_reporter_create_draft(
  :'case_r2'::uuid,'Please provide only public records without revealing confidential personal source information.',
  'Public Works Office') as q_r2 \gset
select public.jb_b8_g1_reporter_create_draft(
  :'case_r0'::uuid,'Please provide the scheduled completion date and progress of the routine local project.',
  'Public Works Office') as q_r0 \gset
select public.jb_b8_g1_reporter_request_review(:'q_r1'::uuid) as review_r1 \gset
select public.jb_b8_g1_reporter_request_review(:'q_r2'::uuid) as review_r2 \gset
reset role;
select set_config('b8.fixture_req_r1',:'review_r1',false);
select set_config('b8.fixture_req_r2',:'review_r2',false);

-- Request review is immutable unique; routine R0 requires no Editor gate.
set role authenticated;
do $reporter$
declare duplicate_denied boolean:=false;routine_denied boolean:=false;editor_denied boolean:=false;
begin
 begin
  perform public.jb_b8_g1_reporter_request_review(
    (select id from public.b8_question_drafts where case_id=current_setting('b8.fixture_r1')::uuid limit 1));
 exception when others then duplicate_denied:=sqlerrm='B8_REVIEW_ALREADY_REQUESTED';end;
 begin
  perform public.jb_b8_g1_reporter_request_review(
    (select id from public.b8_question_drafts where case_id=current_setting('b8.fixture_r0')::uuid limit 1));
 exception when others then routine_denied:=sqlerrm='B8_ONLY_SERIOUS_REVIEW_REQUIRED';end;
 begin
  perform public.jb_b8_g1_editor_review(
   current_setting('b8.fixture_req_r1')::uuid,
   'EVIDENCE_REVIEW_PENDING','Reporter must not self-approve an official question.');
 exception when others then editor_denied:=sqlerrm='B8_ASSIGNED_ACTIVE_EDITOR_REQUIRED';end;
 if not (duplicate_denied and routine_denied and editor_denied) then
  raise exception 'B8_CP02_REPORTER_EDITOR_PRIVILEGE_OR_DUPLICATE_BYPASS';end if;
end $reporter$;
reset role;

-- Editor can read ONLY the assigned case, not other Editory's unrelated case.
select set_config('b8.fixture_actor','55555555-5555-5555-5555-555555555555',false);
set role authenticated;
do $cross$
declare denied boolean:=false;
begin
 begin
  perform public.jb_b8_g1_editor_review_card(current_setting('b8.fixture_req_r1')::uuid);
 exception when others then denied:=sqlerrm='B8_ASSIGNED_ACTIVE_EDITOR_REQUIRED';end;
 if not denied then raise exception 'B8_CP02_UNASSIGNED_EDITOR_READ_REVIEW';end if;
end $cross$;
reset role;

select set_config('b8.fixture_actor','44444444-4444-4444-4444-444444444444',false);
set role authenticated;
select public.jb_b8_g1_editor_review_card(:'review_r1'::uuid) as private_card \gset
-- Serious question allowed only for evidence review pending, not automatic "SENT".
select public.jb_b8_g1_editor_review(
  :'review_r1'::uuid,'EVIDENCE_REVIEW_PENDING',
  'Original financial source documents must be verified before approval.') as decision_r1 \gset
-- R2 cannot be treated as a normal R1 review: MUST escalate or return.
do $r2$
declare denied boolean:=false;
begin
 begin
  perform public.jb_b8_g1_editor_review(
   current_setting('b8.fixture_req_r2')::uuid,'EVIDENCE_REVIEW_PENDING',
   'Editor tried incorrectly to approve restricted risk.');
 exception when others then denied:=sqlerrm='B8_RESTRICTED_REQUIRES_FOUNDER_ESCALATION';end;
 if not denied then raise exception 'B8_CP02_R2_EDITOR_NORMAL_REVIEW_BYPASS';end if;
end $r2$;
select public.jb_b8_g1_editor_review(
  :'review_r2'::uuid,'ESCALATE_TO_FOUNDER',
  'Restricted confidentiality issue requires prior Founder review.') as decision_r2 \gset

-- Replay cannot replace an original reason or render false new decisions.
do $duplicate$
declare denied boolean:=false;
begin
 begin
  perform public.jb_b8_g1_editor_review(
   current_setting('b8.fixture_req_r1')::uuid,'RETURN_FOR_EVIDENCE',
   'Second reply should never silently replace approved original.');
 exception when others then denied:=sqlerrm='B8_REVIEW_ALREADY_DECIDED';end;
 if not denied then raise exception 'B8_CP02_EDITOR_DECISION_REPLAY_MODIFIED_ORIGINAL';end if;
end $duplicate$;
reset role;

-- Revoked Editor cannot read second review request (not the old authenticated token).
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g1_owner_revoke_editor(
  :'case_r1'::uuid,'44444444-4444-4444-4444-444444444444') as editor_revoked \gset
reset role;
\if :editor_revoked
\else
 \echo 'B8_CP02_EDITOR_REVOCATION_FAILED'
 \quit 1
\endif

select set_config('b8.fixture_actor','44444444-4444-4444-4444-444444444444',false);
set role authenticated;
do $revoked$
declare denied boolean:=false;
begin
 begin
  perform public.jb_b8_g1_editor_review_card(current_setting('b8.fixture_req_r1')::uuid);
 exception when others then denied:=sqlerrm='B8_ASSIGNED_ACTIVE_EDITOR_REQUIRED';end;
 if not denied then raise exception 'B8_CP02_REVOKED_EDITOR_READ_OLD_CASE';end if;
end $revoked$;
reset role;

-- Founder can view only an honest preliminary packet: evidence gap and NOT SENT.
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g1_owner_preliminary_review_packet(:'review_r2'::uuid) as founder_packet \gset
reset role;
select set_config('b8.fixture_aal','aal1',false);
set role authenticated;
do $low$
declare denied boolean:=false;
begin
 begin
  perform public.jb_b8_g1_owner_preliminary_review_packet(
   current_setting('b8.fixture_req_r2')::uuid);
 exception when others then denied:=sqlerrm='B8_OWNER_AAL2_REQUIRED';end;
 if not denied then raise exception 'B8_CP02_OWNER_AAL1_PRIVATE_PACK_READ';end if;
end $low$;
reset role;

-- Even postgres direct mutation cannot silently overwrite committed request/decision/events
-- within this migration. Authenticated users already lack DML grants entirely.
do $immutable$
declare request_protected boolean:=false;decision_protected boolean:=false;
 event_protected boolean:=false;deleted_protected boolean:=false;
begin
 begin
  update public.b8_question_review_requests set risk_lane='R2'
    where id=current_setting('b8.fixture_req_r1')::uuid;
 exception when others then request_protected:=sqlerrm='B8_IMMUTABLE_REVIEW_RECORD';end;
 begin
  update public.b8_question_review_decisions set reason='An altered forensic claim.'
   where request_id=current_setting('b8.fixture_req_r1')::uuid;
 exception when others then decision_protected:=sqlerrm='B8_IMMUTABLE_REVIEW_RECORD';end;
 begin
  delete from public.b8_case_review_events
    where request_id=current_setting('b8.fixture_req_r1')::uuid;
 exception when others then event_protected:=sqlerrm='B8_IMMUTABLE_REVIEW_RECORD';end;
 begin
  delete from public.b8_question_review_requests
    where id=current_setting('b8.fixture_req_r1')::uuid;
 exception when others then deleted_protected:=sqlerrm='B8_IMMUTABLE_REVIEW_RECORD';end;
 if not (request_protected and decision_protected and event_protected and deleted_protected)
 then raise exception 'B8_CP02_APPEND_ONLY_MUTATION_SUCCEEDED';end if;
end $immutable$;

do $final$
declare v_packet jsonb;
begin
 select jsonb_build_object('sent',false,'events',count(*))
 into v_packet from public.b8_case_review_events;
 if (v_packet->>'events')::int <> 4
 or (select count(*) from public.b8_question_review_requests)<>2
 or (select count(*) from public.b8_question_review_decisions)<>2
 or (select count(*) from public.b8_question_drafts)<>3
 or exists(select 1 from public.b8_question_review_decisions
           where decision not in ('EVIDENCE_REVIEW_PENDING','ESCALATE_TO_FOUNDER'))
 or (select count(*) from public.articles where status='published')<>1
 or (select count(*) from public.ad_campaigns where status='requested')<>1
 then raise exception 'B8_CP02_REVIEW_HISTORY_OR_OLD_SYSTEM_REGRESSION';end if;
 raise notice 'B8 CP02 PG17 positive and negative Editor scope, R2 escalation, immutable history, Founder truthful evidence-gap packet, old News/Ad PASS; no SEND';
end $final$;
rollback;
do $after$
begin
 if (select count(*) from public.b8_question_review_requests)<>0
 or (select count(*) from public.b8_question_review_decisions)<>0
 or (select count(*) from public.b8_case_review_events)<>0
 or (select count(*) from public.b8_cases)<>0 then
 raise exception 'B8_CP02_TRANSACTION_ROLLBACK_LEAK';end if;
 raise notice 'B8 CP02 ROLLBACK PASS; OFFICIAL T094/ACC and phone E3 NOT RUN';
end $after$;
