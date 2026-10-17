-- JANTA BOL B8 G7: minimum missing original RUN-12 T094/T095/T097/T098 timeline coding.
-- REVIEW ONLY, additive AFTER G1→G6. Original Article UUID/PURL and old News/B7 untouched.
-- NO external SEND, provider delivery or reply authenticity is inferred.
-- Founder private dated assertions are NOT independently verified public facts.
create table public.b8_g7_history_events(
 id bigint generated always as identity primary key,
 case_id uuid not null references public.b8_cases(id) on delete restrict,
 event_kind text not null check(event_kind in(
 'NO_REPLY_AS_OF_CLAIM','PARTIAL_REPLY_CLAIM','FULL_REPLY_CLAIM',
 'LATE_REPLY_CLAIM','URGENT_EXCEPTION_ESCALATED','DEADLINE_FOLLOWUP',
 'SUMMARY_DRAFT','SUMMARY_CORRECTION','EVIDENCE_VERSION')),
 question_id uuid references public.b8_question_drafts(id) on delete restrict,
 private_receipt_id uuid references public.b8_private_upload_receipts(id) on delete restrict,
 prior_event_id bigint references public.b8_g7_history_events(id) on delete restrict,
 as_of_date date,
 factual_note text not null check(char_length(btrim(factual_note)) between 12 and 1000),
 truth text not null default 'FOUNDER_ATTRIBUTED_UNVERIFIED'
  check(truth='FOUNDER_ATTRIBUTED_UNVERIFIED'),
 actor_user_id uuid not null,
 recorded_at timestamptz not null default clock_timestamp(),
 check(
 (event_kind='NO_REPLY_AS_OF_CLAIM' and question_id is not null
  and as_of_date is not null and private_receipt_id is null
  and prior_event_id is null)
 or (event_kind in('PARTIAL_REPLY_CLAIM','FULL_REPLY_CLAIM','LATE_REPLY_CLAIM')
  and question_id is not null and private_receipt_id is not null
  and as_of_date is null and prior_event_id is null)
 or (event_kind='URGENT_EXCEPTION_ESCALATED' and question_id is not null
  and as_of_date is null and prior_event_id is null)
 or (event_kind='DEADLINE_FOLLOWUP' and question_id is null
  and as_of_date is not null and prior_event_id is null)
 or (event_kind='SUMMARY_DRAFT' and prior_event_id is null and as_of_date is null)
 or (event_kind='SUMMARY_CORRECTION' and prior_event_id is not null
  and as_of_date is null)
 or (event_kind='EVIDENCE_VERSION' and private_receipt_id is not null
  and as_of_date is null)
 )
);
create index b8_g7_history_case_idx on public.b8_g7_history_events(case_id,id desc);
create function private.b8_g7_seal_history()
returns trigger language plpgsql security definer set search_path=''
as $b8$
begin raise exception 'B8_G7_HISTORY_APPEND_ONLY';end;
$b8$;
create trigger b8_g7_history_append_only before update or delete
 on public.b8_g7_history_events for each row
 execute function private.b8_g7_seal_history();
revoke all on function private.b8_g7_seal_history() from public,anon,authenticated;
alter table public.b8_g7_history_events enable row level security;
revoke all on public.b8_g7_history_events from public,anon,authenticated;
grant select,insert on public.b8_g7_history_events to service_role;

-- Function avoids automatic unanswered claim without any recorded handoff attempt.
-- Even with a handoff attempt, status stays UNVERIFIED; Founder must compare with
-- actual external provider proof during manual E9. No notification to real officials.
create function public.jb_b8_g7_owner_record_history(
 p_case_id uuid,p_kind text,p_note text,
 p_question_id uuid default null,p_receipt_id uuid default null,
 p_prior_event_id bigint default null,p_as_of_date date default null
) returns bigint language plpgsql security definer set search_path=''
as $b8$
declare v_case public.b8_cases%rowtype;v_prior public.b8_g7_history_events%rowtype;
 v_latest_deadline date;v_id bigint;v_exists boolean;
begin
 if not coalesce(private.current_owner_aal2(),false) then
  raise exception 'B8_OWNER_AAL2_REQUIRED';end if;
 select * into v_case from public.b8_cases where id=p_case_id for update;
 if not found then raise exception 'B8_G7_EXISTING_CASE_REQUIRED';end if;
 if p_note is null or char_length(btrim(p_note)) not between 12 and 1000
 then raise exception 'B8_G7_ATTRIBUTED_NOTE_REQUIRED';end if;
 if p_as_of_date is not null and p_as_of_date>current_date
 then raise exception 'B8_G7_FUTURE_AS_OF_PROHIBITED';end if;
 if p_question_id is not null and not exists(
  select 1 from public.b8_question_drafts q where q.id=p_question_id and q.case_id=p_case_id)
 then raise exception 'B8_G7_QUESTION_CROSS_CASE_DENIED';end if;
 if p_receipt_id is not null and not exists(
  select 1 from public.b8_private_upload_receipts r
  where r.id=p_receipt_id and r.case_id=p_case_id)
 then raise exception 'B8_G7_RECEIPT_CROSS_CASE_DENIED';end if;
 if p_prior_event_id is not null then
  select * into v_prior from public.b8_g7_history_events
  where id=p_prior_event_id and case_id=p_case_id;
  if not found then raise exception 'B8_G7_PRIOR_CROSS_CASE_DENIED';end if;
 end if;
 if p_kind='NO_REPLY_AS_OF_CLAIM' then
   if p_question_id is null or p_as_of_date is null or
     not exists(select 1 from public.b8_g3_handoff_intents h
     join public.b8_g3_handoff_observations o on o.intent_id=h.id
     where h.question_id=p_question_id and h.case_id=p_case_id
     and o.observation in('USER_REPORTED_ATTEMPT','UNVERIFIED_RECEIPT_ATTACHED')
     and o.observed_at::date <= p_as_of_date)
   then raise exception 'B8_G7_NO_REPLY_REQUIRES_RECORDED_ATTEMPT';end if;
 elsif p_kind='DEADLINE_FOLLOWUP' then
   select target_date into v_latest_deadline from public.b8_g5_fact_events
   where case_id=p_case_id and kind='DEADLINE'
   order by id desc limit 1;
   if v_latest_deadline is null or p_as_of_date is null or
      p_as_of_date<v_latest_deadline then
      raise exception 'B8_G7_FOLLOWUP_REQUIRES_MISSED_DEADLINE';end if;
 elsif p_kind='SUMMARY_CORRECTION' then
   if p_prior_event_id is null or v_prior.event_kind not in
    ('SUMMARY_DRAFT','SUMMARY_CORRECTION') then
     raise exception 'B8_G7_SUMMARY_ORIGINAL_REQUIRED';end if;
 elsif p_kind='EVIDENCE_VERSION' then
   if p_receipt_id is null then raise exception 'B8_G7_PRIVATE_RECEIPT_REQUIRED';end if;
   if p_prior_event_id is not null and
     (v_prior.event_kind<>'EVIDENCE_VERSION' or
      v_prior.private_receipt_id=p_receipt_id) then
     raise exception 'B8_G7_DIFFERENT_PREVIOUS_DOCUMENT_REQUIRED';end if;
 elsif p_kind in('PARTIAL_REPLY_CLAIM','FULL_REPLY_CLAIM','LATE_REPLY_CLAIM') then
   if p_question_id is null or p_receipt_id is null then
     raise exception 'B8_G7_REPLY_NEEDS_SCOPED_QUESTION_AND_BYTES';end if;
 elsif p_kind='URGENT_EXCEPTION_ESCALATED' then
   if p_question_id is null then raise exception 'B8_G7_URGENT_QUESTION_REQUIRED';end if;
 elsif p_kind not in('SUMMARY_DRAFT') then
   raise exception 'B8_G7_UNKNOWN_HISTORY_EVENT';end if;
 insert into public.b8_g7_history_events
 (case_id,event_kind,question_id,private_receipt_id,prior_event_id,as_of_date,
 factual_note,actor_user_id)
 values(p_case_id,p_kind,p_question_id,p_receipt_id,p_prior_event_id,p_as_of_date,
 btrim(p_note),auth.uid()) returning id into v_id;
 return v_id;
end;
$b8$;

-- Safe private read: bounded server-side page and truth label; no anon grants.
create function public.jb_b8_g7_owner_private_history(p_case_id uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $b8$
declare v_history jsonb;
begin
 if not coalesce(private.current_owner_aal2(),false) then
  raise exception 'B8_OWNER_AAL2_REQUIRED';end if;
 if not exists(select 1 from public.b8_cases where id=p_case_id)
 then raise exception 'B8_G7_EXISTING_CASE_REQUIRED';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',e.id,'kind',e.event_kind,
 'question_id',e.question_id,'receipt_id',e.private_receipt_id,
 'prior_event_id',e.prior_event_id,'as_of',e.as_of_date,
 'note',e.factual_note,'truth',e.truth,'recorded_at',e.recorded_at)
 order by e.id),'[]'::jsonb)
 into v_history from
 (select * from public.b8_g7_history_events where case_id=p_case_id
 order by id desc limit 100) e;
 return v_history;
end;
$b8$;
revoke all on function public.jb_b8_g7_owner_record_history(uuid,text,text,uuid,uuid,bigint,date)
 from public,anon,authenticated;
grant execute on function public.jb_b8_g7_owner_record_history(uuid,text,text,uuid,uuid,bigint,date)
 to authenticated;
revoke all on function public.jb_b8_g7_owner_private_history(uuid)
 from public,anon,authenticated;
grant execute on function public.jb_b8_g7_owner_private_history(uuid) to authenticated;
-- Official delivery/response authenticity, public Article correction and E9 remain REAL/manual.
