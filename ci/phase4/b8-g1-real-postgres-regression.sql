\set ON_ERROR_STOP on
-- B8 G1 E2 candidate: REAL disposable PostgreSQL17 ACL/transaction tests; NO live project.
begin;
do $$
begin
 if has_table_privilege('anon','public.b8_cases','SELECT')
 or has_table_privilege('authenticated','public.b8_cases','INSERT')
 or has_table_privilege('authenticated','public.b8_question_drafts','SELECT')
 or has_function_privilege('anon','public.jb_b8_g1_reporter_create_draft(uuid,text,text)','EXECUTE')
 or has_function_privilege('anon','public.jb_b8_g1_owner_create_case(text,text,text)','EXECUTE')
 or has_function_privilege('authenticated','private.b8_g1_reporter_case_allowed(uuid)','EXECUTE')
 then raise exception 'B8_G1_DIRECT_ACCESS_OR_PRIVATE_GATE_EXPOSED';end if;
 if (select count(*) from public.articles where status='published')<>1
 or (select count(*) from public.ad_campaigns where status='requested')<>1
 then raise exception 'B8_G1_OLD_NEWS_B7_SENTINELS_CHANGED';end if;
 raise notice 'B8 G1 ACL PASS no direct public table access, private guard hidden, News/Ad baseline intact';
end$$;

-- Confirm B1 global staff guard still excludes Reporter and includes Editor (fixture context).
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
select set_config('b8.fixture_session','on',false);
select set_config('b8.fixture_aal','aal1',false);
do $$
begin
 if private.p4_staff_allowed() then
  raise exception 'B8_G1_REPORTER_ESCALATED_GLOBAL_STAFF';end if;
end$$;

set role anon;
do $$
declare denied boolean:=false;
begin
 begin
  perform public.jb_b8_g1_owner_create_case('Synthetic neutral audit','Pichhore','R0');
 exception when insufficient_privilege then denied:=true;
 end;
 if not denied then raise exception 'B8_G1_ANON_CREATED_CASE';end if;
end$$;
reset role;

-- Owner at AAL1 MUST NOT create.
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_aal','aal1',false);
set role authenticated;
do $$
declare denied boolean:=false;
begin
 begin
  perform public.jb_b8_g1_owner_create_case('Synthetic neutral audit','Pichhore','R0');
 exception when others then denied:=(sqlerrm='B8_OWNER_AAL2_REQUIRED');
 end;
 if not denied then raise exception 'B8_G1_OWNER_AAL1_GRANTED_CREATION';end if;
end$$;
reset role;

-- Real Owner AAL2 and active session permitted to make only a private case.
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g1_owner_create_case(
 'Synthetic disputed road works audit','Pichhore','R0') as case_id \gset
reset role;
select set_config('b8.fixture_case',:'case_id',false);
set role authenticated;
select public.jb_b8_g1_owner_assign_reporter(
 :'case_id'::uuid,'22222222-2222-2222-2222-222222222222',now()+interval '2 days') as assigned \gset
reset role;
\if :assigned
\else
 \echo 'B8_G1_CASE_ASSIGN_FAILED'
 \quit 1
\endif

-- Negative: Reporter cannot become Owner / assign anyone.
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
select set_config('b8.fixture_aal','aal1',false);
set role authenticated;
do $$
declare denied boolean:=false;
begin
 begin
 perform public.jb_b8_g1_owner_assign_reporter(
 current_setting('b8.fixture_case')::uuid,
 '33333333-3333-3333-3333-333333333333',now()+interval '2 days');
 exception when others then denied:=sqlerrm='B8_OWNER_AAL2_REQUIRED';
 end;
 if not denied then raise exception 'B8_G1_REPORTER_ASSIGNED_REPORTER';end if;
end$$;

-- Reporter genuinely active + case assigned -> draft and scoped card.
select public.jb_b8_g1_reporter_create_draft(
 :'case_id'::uuid,
 'Please provide the sanctioned cost, expenditure details and scheduled completion date.',
 'Public Works Office') as draft_id \gset
select public.jb_b8_g1_reporter_case_card(:'case_id'::uuid) as card \gset
reset role;

-- Unknown/unassigned Reporter cannot see or write this case.
select set_config('b8.fixture_actor','33333333-3333-3333-3333-333333333333',false);
set role authenticated;
do $$
declare denied_read boolean:=false;denied_draft boolean:=false;
begin
 begin
  perform public.jb_b8_g1_reporter_case_card(current_setting('b8.fixture_case')::uuid);
 exception when others then denied_read:=sqlerrm='B8_ASSIGNED_ACTIVE_REPORTER_REQUIRED';end;
 begin
  perform public.jb_b8_g1_reporter_create_draft(
   current_setting('b8.fixture_case')::uuid,'Please provide verified project contract numbers.',
   'Public Works Office');
 exception when others then denied_draft:=sqlerrm='B8_ASSIGNED_ACTIVE_REPORTER_REQUIRED';end;
 if not denied_read or not denied_draft then
  raise exception 'B8_G1_UNASSIGNED_REPORTER_READ_OR_DRAFT';end if;
end$$;
reset role;

-- Editor cannot impersonate Reporter or Founder via old staff privilege.
select set_config('b8.fixture_actor','44444444-4444-4444-4444-444444444444',false);
set role authenticated;
do $$
declare denied boolean:=false;
begin
 begin
  perform public.jb_b8_g1_reporter_case_card(current_setting('b8.fixture_case')::uuid);
 exception when others then denied:=sqlerrm='B8_ASSIGNED_ACTIVE_REPORTER_REQUIRED';end;
 if not denied then raise exception 'B8_G1_EDITOR_REPORTER_IDENTITY_BYPASS';end if;
end$$;
reset role;

-- Session lost -> local offline draft cannot be submitted to server.
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
select set_config('b8.fixture_session','off',false);
set role authenticated;
do $$
declare denied boolean:=false;
begin
 begin
  perform public.jb_b8_g1_reporter_create_draft(
  current_setting('b8.fixture_case')::uuid,
  'Please provide inspection records while offline and after login recovery.',
  'Public Works Office');
 exception when others then denied:=sqlerrm='B8_ASSIGNED_ACTIVE_REPORTER_REQUIRED';end;
 if not denied then raise exception 'B8_G1_LOST_SESSION_WROTE_DRAFT';end if;
end$$;
reset role;
select set_config('b8.fixture_session','on',false);

-- Suspended member -> even existing grant must fail immediately.
update public.team_accounts set status='suspended'
where user_id='22222222-2222-2222-2222-222222222222';
set role authenticated;
do $$
declare denied boolean:=false;
begin
 begin
  perform public.jb_b8_g1_reporter_case_card(current_setting('b8.fixture_case')::uuid);
 exception when others then denied:=sqlerrm='B8_ASSIGNED_ACTIVE_REPORTER_REQUIRED';end;
 if not denied then raise exception 'B8_G1_SUSPENDED_REPORTER_STILL_READS';end if;
end$$;
reset role;
update public.team_accounts set status='active'
where user_id='22222222-2222-2222-2222-222222222222';

-- Expired grant blocks. Restored only by a deliberate Owner grant.
update public.b8_case_reporter_grants
set granted_at=now()-interval '3 days',expires_at=now()-interval '2 minutes'
where case_id=current_setting('b8.fixture_case')::uuid;
set role authenticated;
do $$
declare denied boolean:=false;
begin
 begin
  perform public.jb_b8_g1_reporter_case_card(current_setting('b8.fixture_case')::uuid);
 exception when others then denied:=sqlerrm='B8_ASSIGNED_ACTIVE_REPORTER_REQUIRED';end;
 if not denied then raise exception 'B8_G1_EXPIRED_GRANT_STILL_READS';end if;
end$$;
reset role;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g1_owner_assign_reporter(
 :'case_id'::uuid,'22222222-2222-2222-2222-222222222222',now()+interval '1 day');
select public.jb_b8_g1_owner_revoke_reporter(
 :'case_id'::uuid,'22222222-2222-2222-2222-222222222222') as revoked \gset
reset role;
\if :revoked
\else
 \echo 'B8_G1_REVOKE_FAILED'
 \quit 1
\endif
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
select set_config('b8.fixture_aal','aal1',false);
set role authenticated;
do $$
declare denied boolean:=false;
begin
 begin
  perform public.jb_b8_g1_reporter_create_draft(
  current_setting('b8.fixture_case')::uuid,
  'Please provide follow-up official verification of the public project.',
  'Public Works Office');
 exception when others then denied:=sqlerrm='B8_ASSIGNED_ACTIVE_REPORTER_REQUIRED';end;
 if not denied then raise exception 'B8_G1_REVOKED_GRANT_STILL_WRITES';end if;
end$$;
reset role;

-- Original state and G1 no-fake-send boundary after ALL cases.
do $$
begin
 if (select count(*) from public.b8_cases)<>1
 or (select count(*) from public.b8_question_drafts)<>1
 or exists(select 1 from public.b8_question_drafts where state<>'draft')
 or (select count(*) from public.articles where id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
       and status='published' and headline='Existing News Article')<>1
 or (select count(*) from public.ad_campaigns where id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
       and status='requested')<>1
 then raise exception 'B8_G1_CORE_CONTRACT_OR_OLD_NEWS_B7_REGRESSION';end if;
 raise notice 'B8 G1 isolated PG17: real Owner AAL2, assigned Reporter draft, direct-ACL, anon, nonowner, cross-case, revoked, expired, suspended, session denial, original News/Ad all PASS (E2 candidate only)';
end$$;
rollback;
-- Rollback preserves migrated schema but no real fixture Case from this test.
do $$
begin
 if (select count(*) from public.b8_cases)<>0 or
 (select count(*) from public.b8_question_drafts)<>0 then
  raise exception 'B8_G1_TEST_FIXTURE_LEAK_AFTER_ROLLBACK';end if;
 raise notice 'B8 G1 rollback isolation PASS; NO official T092/ACC PASS claimed';
end$$;
