\set ON_ERROR_STOP on
-- B8 G9 real synthetic PG17: missed original deadline -> safe private Owner inbox.
-- NO automated external outreach, no verified motive, all E9 remains DUE.
select set_config('b8.g9_old_cases',(select count(*)::text from public.b8_cases),false);
select set_config('b8.g9_old_alerts',(select count(*)::text from public.live_notifications
where notification_type='B8_ACCOUNTABILITY_FOLLOWUP'),false);
begin;
do $b8$
begin
 if has_function_privilege('anon','public.jb_b8_g9_owner_due_followups()','EXECUTE')
 then raise exception 'B8_G9_PUBLIC_DUE_CASE_LEAK';end if;
end $b8$;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_aal','aal2',false);
select set_config('b8.fixture_session','on',false);
set role authenticated;
select public.jb_b8_g1_owner_create_case(
 'Synthetic original work deadline missed privately without attributing fault',
 'Pichhore','R0') as case_id \gset
select public.jb_b8_g5_owner_record_fact(
 :'case_id'::uuid,'DEADLINE','ORIGINAL',
 'Original statutory deadline as per attributed source, not verified cause',
 null,current_date-7,null);
reset role;
select set_config('b8.g9_case',:'case_id',false);
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
select set_config('b8.fixture_aal','aal1',false);
set role authenticated;
do $b8$
declare denied boolean:=false;
begin
 begin perform public.jb_b8_g9_owner_due_followups();
 exception when others then denied:=sqlerrm='B8_OWNER_AAL2_REQUIRED';end;
 if not denied then raise exception 'B8_G9_REPORTER_READ_OWNER_DUE';end if;
end $b8$;
reset role;
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
do $b8$
declare v jsonb;
begin
 v:=public.jb_b8_g9_owner_due_followups();
 if not exists(select 1 from jsonb_array_elements(v) e
 where e->>'case_id'=current_setting('b8.g9_case')
 and (e->>'days_overdue')::integer=7
 and e->>'readiness'='DUE_FOR_HUMAN_REVIEW_NOT_OFFICIAL_GUILT')
 then raise exception 'B8_G9_MISSED_DEADLINE_NOT_LISTED';end if;
end $b8$;
select public.jb_b8_g7_owner_record_history(
 :'case_id'::uuid,'DEADLINE_FOLLOWUP',
 'Founder privately notes missed original project deadline without assigning guilt',
 null,null,null,current_date) as recorded \gset
reset role;
do $b8$
declare alerts integer;v jsonb;
begin
 select count(*) into alerts from public.live_notifications
 where notification_type='B8_ACCOUNTABILITY_FOLLOWUP'
 and metadata->>'case_id'=current_setting('b8.g9_case');
 if alerts<>1 or exists(
  select 1 from public.live_notifications n
  where n.notification_type='B8_ACCOUNTABILITY_FOLLOWUP'
  and (n.delivery_state<>'IN_APP_READY' or n.domain<>'system' or
  n.safe_message ilike '%source%' or n.safe_message ilike '%official replied%'))
 then raise exception 'B8_G9_BAD_B3_PRIVACY_OR_DUPLICATE_NOTIFY';end if;
 -- Raw sensitive case headline MUST NOT appear in generic payload.
 if exists(select 1 from public.live_notifications
 where notification_type='B8_ACCOUNTABILITY_FOLLOWUP'
 and (title like '%Synthetic original work%' or safe_message like '%Synthetic original work%'))
 then raise exception 'B8_G9_PRIVATE_CASE_TITLE_LEAK';end if;
 raise notice 'B8 G9 private B3 safe dedup notification inserted after genuine Founder due event';
end $b8$;
set role authenticated;
do $b8$
declare v jsonb;
begin
 v:=public.jb_b8_g9_owner_due_followups();
 if exists(select 1 from jsonb_array_elements(v) e
 where e->>'case_id'=current_setting('b8.g9_case'))
 then raise exception 'B8_G9_DUE_PERSISTS_AFTER_FOLLOWUP';end if;
end $b8$;
reset role;
rollback;
do $b8$
begin
 if (select count(*) from public.b8_cases)<>current_setting('b8.g9_old_cases')::integer
 or (select count(*) from public.live_notifications
 where notification_type='B8_ACCOUNTABILITY_FOLLOWUP')<>
 current_setting('b8.g9_old_alerts')::integer
 then raise exception 'B8_G9_ROLLBACK_LEAK';end if;
 raise notice 'B8 G9 PG17 Founder due dashboard and safe B3 inbox PASS, ROLLBACK, E9 NOT CLAIMED';
end $b8$;
