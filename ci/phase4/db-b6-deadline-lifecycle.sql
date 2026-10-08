\set ON_ERROR_STOP on
-- P4-T017: actual function transitions with a synthetic obligation.
-- All changes, history and notification rows rollback together.
begin;
do $$
declare
 v_owner uuid;
 v_session uuid:=gen_random_uuid();
 v_task uuid;
 v_now timestamptz:=date_trunc('day',now())+interval '12 hours';
 v_state text;
 v_changed integer;
 v_expected text;
 v_due timestamptz;
 v_history integer;
 v_unauth boolean:=false;
begin
 select user_id into v_owner from public.user_roles where role='owner'::public.app_role limit 1;
 if v_owner is null then raise exception 'T017_OWNER_MISSING'; end if;
 insert into auth.sessions(id,user_id,created_at,updated_at,aal,user_agent)
 values(v_session,v_owner,now(),now(),'aal2','P4-T017 rollback-only CI');
 perform set_config('request.jwt.claim.sub',v_owner::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object(
 'sub',v_owner::text,'role','authenticated','aal','aal2','session_id',v_session::text,
 'amr',jsonb_build_array(jsonb_build_object('method','totp','timestamp',floor(extract(epoch from now()))::bigint)))::text,true);
 insert into public.compliance_tasks(title,status,due_at,deadline_state,notes)
 values('CI P4-T017 rollback fixture','pending',v_now+interval '4 days','overdue','Transaction only; not government submission')
 returning id into v_task;
 for v_expected,v_due in
 select * from (values
 ('upcoming',v_now+interval '4 days'),
 ('due_soon',v_now+interval '2 days'),
 ('due_today',v_now+interval '1 hour'),
 ('overdue',v_now-interval '1 minute')) t(state,due)
 loop
 update public.compliance_tasks set due_at=v_due where id=v_task;
 v_changed:=public.jb_compliance_refresh_deadlines_internal(v_now);
 select deadline_state into v_state from public.compliance_tasks where id=v_task;
 select count(*) into v_history from public.compliance_history
 where task_id=v_task and event_type='deadline_'||v_expected;
 if v_changed<1 or v_state<>v_expected or v_history<>1 then
 raise exception 'T017_TRANSITION_FAIL expected % actual % changed % history %',v_expected,v_state,v_changed,v_history;
 end if;
 raise notice 'PASS [P4-T017-%] persisted state and history',v_expected;
 end loop;
 -- Completed obligations should not be touched.
 update public.compliance_tasks set status='complete',due_at=v_now+interval '4 days' where id=v_task;
 v_changed:=public.jb_compliance_refresh_deadlines_internal(v_now);
 select deadline_state into v_state from public.compliance_tasks where id=v_task;
 if v_changed<>0 or v_state<>'overdue' then raise exception 'T017_COMPLETED_TASK_CHANGED'; end if;
 raise notice 'PASS [P4-T017-complete] completed obligations excluded';
 -- No authenticated user: direct refresh must be rejected.
 perform set_config('request.jwt.claim.sub','',true);
 perform set_config('request.jwt.claims','{}',true);
 begin
 perform public.jb_compliance_refresh_deadlines_internal(v_now);
 exception when others then v_unauth:=position('COMPLIANCE_AUTH_REQUIRED' in sqlerrm)>0; end;
 if not v_unauth then raise exception 'T017_UNAUTH_REFRESH_NOT_BLOCKED'; end if;
 raise notice 'PASS [P4-T017-auth] anonymous refresh denied';
end $$;
rollback;
