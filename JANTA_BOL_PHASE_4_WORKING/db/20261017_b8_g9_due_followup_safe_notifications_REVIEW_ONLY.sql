-- JANTA BOL B8 G9: Original RUN-12 system-assisted due follow-up and safe B3 inbox.
-- REVIEW ONLY; strictly additive AFTER G1..G8, no external email/SMS/WhatsApp.
-- Does NOT set official 'no reply' or modify original Article/PURL/B7.
create function public.jb_b8_g9_owner_due_followups()
returns jsonb language plpgsql stable security definer set search_path=''
as $b8$
declare v_due jsonb;
begin
 if not coalesce(private.current_owner_aal2(),false) then
  raise exception 'B8_OWNER_AAL2_REQUIRED';end if;
 select coalesce(jsonb_agg(
  jsonb_build_object('case_id',q.case_id,
    'deadline',q.deadline,'days_overdue',q.days_overdue,
    'readiness','DUE_FOR_HUMAN_REVIEW_NOT_OFFICIAL_GUILT')
  order by q.days_overdue desc,q.case_id),'[]'::jsonb)
 into v_due from (
  select c.id as case_id,d.target_date as deadline,
   (current_date-d.target_date)::integer as days_overdue
  from public.b8_cases c
  join lateral (
    select e.target_date from public.b8_g5_fact_events e
    where e.case_id=c.id and e.kind='DEADLINE'
    order by e.id desc limit 1
  ) d on true
  where c.case_state<>'closed'
  and d.target_date < current_date
  and not exists (
    select 1 from public.b8_g7_history_events e
    where e.case_id=c.id and e.event_kind='DEADLINE_FOLLOWUP'
    and e.as_of_date >= d.target_date
  )
  order by days_overdue desc,c.id limit 50
 ) q;
 return v_due;
end;
$b8$;
revoke all on function public.jb_b8_g9_owner_due_followups()
 from public,anon,authenticated;
grant execute on function public.jb_b8_g9_owner_due_followups() to authenticated;

-- A sealed private event spawns a generic Founder in-app task, NOT a provider send.
create function private.b8_g9_notify_owner_followup()
returns trigger language plpgsql security definer set search_path=''
as $b8$
begin
 if new.event_kind not in
 ('DEADLINE_FOLLOWUP','LATE_REPLY_CLAIM','SUMMARY_CORRECTION')
 then return new;end if;
 insert into public.live_notifications (
  recipient_user_id,notification_type,priority,title,safe_message,
  record_type,record_id,domain,lifecycle_state,action_required,
  delivery_state,dedupe_key,metadata,consequence)
 select ur.user_id,'B8_ACCOUNTABILITY_FOLLOWUP','HIGH',
  'Accountability follow-up ready for review',
  'A private accountability record changed. Review after secure staff login.',
  'b8_accountability',new.id::text,'system','ACTION_REQUIRED',true,
  'IN_APP_READY','b8:followup:'||new.id::text,
  jsonb_build_object('case_id',new.case_id::text,'event_id',new.id::text,
   'privacy','SAFE_CASE_REFERENCE_ONLY'),'ATTENTION'
 from public.user_roles ur where ur.role='owner'::public.app_role
 on conflict(recipient_user_id,dedupe_key) where dedupe_key is not null do nothing;
 return new;
end;
$b8$;
create trigger b8_g9_founder_private_followup_alert
 after insert on public.b8_g7_history_events
 for each row execute function private.b8_g9_notify_owner_followup();
revoke all on function private.b8_g9_notify_owner_followup()
 from public,anon,authenticated;
-- No arbitrary evidence cap, no retention deletion, no public source leakage.
