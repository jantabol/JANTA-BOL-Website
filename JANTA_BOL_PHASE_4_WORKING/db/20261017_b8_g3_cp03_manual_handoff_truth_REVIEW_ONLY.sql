-- JANTA BOL B8 G3 CP03 / Official Right-to-Reply handoff TRUTH model.
-- REVIEW ONLY. NO external email/WhatsApp is sent by this backend.
-- R0 Reporter handoff freely; R1 current Editor screen and genuine private bytes receipt;
-- R2 prior Founder AAL2 approval; all only scoped active Reporter.
-- User's action/request is NOT official delivery; always fail honest UNKNOWN until
-- independently verified real provider receipt in future separate gateway.

create table public.b8_g3_handoff_intents(
 id uuid primary key default gen_random_uuid(),
 case_id uuid not null references public.b8_cases(id) on delete restrict,
 question_id uuid not null unique references public.b8_question_drafts(id) on delete restrict,
 reporter_user_id uuid not null,
 risk_lane text not null check(risk_lane in('R0','R1','R2')),
 channel text not null check(channel in('EMAIL','WHATSAPP','OFFICIAL_PORTAL','HAND_DELIVERY')),
 state text not null default 'PREPARED_NOT_SENT' check(state='PREPARED_NOT_SENT'),
 prepared_at timestamptz not null default now()
);
create table public.b8_g3_handoff_observations(
 id uuid primary key default gen_random_uuid(),
 intent_id uuid not null references public.b8_g3_handoff_intents(id) on delete restrict,
 actor_user_id uuid not null,
 observation text not null check(observation in
 ('COMPOSER_OPENED','USER_REPORTED_ATTEMPT','UNVERIFIED_RECEIPT_ATTACHED')),
 evidence_receipt_id uuid references public.b8_private_upload_receipts(id) on delete restrict,
 observed_at timestamptz not null default now(),
 check (
   (observation='UNVERIFIED_RECEIPT_ATTACHED' and evidence_receipt_id is not null)
    or (observation<>'UNVERIFIED_RECEIPT_ATTACHED' and evidence_receipt_id is null)
 )
);
create index b8_g3_handoff_case_idx on public.b8_g3_handoff_intents(case_id,prepared_at,id);
create function private.b8_g3_cp03_immutable_dispatch()
returns trigger language plpgsql security definer set search_path=''
as $b8$
begin
 raise exception 'B8_G3_HANDOFF_IMMUTABLE';
end;
$b8$;
create trigger b8_g3_handoff_intents_immutable before update or delete
 on public.b8_g3_handoff_intents for each row
 execute function private.b8_g3_cp03_immutable_dispatch();
create trigger b8_g3_handoff_observations_immutable before update or delete
 on public.b8_g3_handoff_observations for each row
 execute function private.b8_g3_cp03_immutable_dispatch();
revoke all on function private.b8_g3_cp03_immutable_dispatch() from public,anon,authenticated;
alter table public.b8_g3_handoff_intents enable row level security;
alter table public.b8_g3_handoff_observations enable row level security;
revoke all on public.b8_g3_handoff_intents,public.b8_g3_handoff_observations
 from public,anon,authenticated;
grant select,insert,update,delete on public.b8_g3_handoff_intents,
 public.b8_g3_handoff_observations to service_role;

create function public.jb_b8_g3_reporter_prepare_manual_handoff(
 p_question_id uuid,p_channel text
) returns uuid language plpgsql security definer set search_path=''
as $b8$
declare v_q public.b8_question_drafts%rowtype;v_c public.b8_cases%rowtype;
 v_req uuid;v_id uuid;
begin
 select * into v_q from public.b8_question_drafts where id=p_question_id for share;
 if not found or v_q.reporter_user_id is distinct from auth.uid() then
  raise exception 'B8_G3_OWN_QUESTION_REQUIRED';end if;
 perform 1 from public.b8_case_reporter_grants
 where case_id=v_q.case_id and reporter_user_id=auth.uid() for update;
 if not coalesce(private.b8_g1_reporter_case_allowed(v_q.case_id),false) then
  raise exception 'B8_ASSIGNED_ACTIVE_REPORTER_REQUIRED';end if;
 select * into v_c from public.b8_cases where id=v_q.case_id for share;
 if v_c.id is null or v_c.case_state='closed' then
  raise exception 'B8_G3_ACTIVE_CASE_REQUIRED';end if;
 if coalesce(p_channel,'') not in('EMAIL','WHATSAPP','OFFICIAL_PORTAL','HAND_DELIVERY') then
  raise exception 'B8_G3_UNAPPROVED_CHANNEL';end if;
 if v_c.risk_lane in('R1','R2') then
  select r.id into v_req from public.b8_question_review_requests r
  where r.question_id=p_question_id and r.case_id=v_q.case_id;
  if v_req is null then raise exception 'B8_G3_SERIOUS_EDITOR_REVIEW_REQUIRED';end if;
  if v_c.risk_lane='R1' and not exists(
    select 1 from public.b8_g3_editor_screenings s
    where s.request_id=v_req) then
    raise exception 'B8_G3_R1_SCREENING_REQUIRED';end if;
  if v_c.risk_lane='R2' and not exists(
    select 1 from public.b8_g3_founder_authorizations a
    where a.request_id=v_req) then
    raise exception 'B8_G3_R2_FOUNDER_APPROVAL_REQUIRED';end if;
 end if;
 -- Exactly one idempotent handoff for frozen question; replay returns existing UUID.
 select id into v_id from public.b8_g3_handoff_intents
 where question_id=p_question_id;
 if found then
  if (select channel from public.b8_g3_handoff_intents where id=v_id)
     is distinct from p_channel then
    raise exception 'B8_G3_REPLAY_CHANNEL_CONFLICT';end if;
  return v_id;
 end if;
 insert into public.b8_g3_handoff_intents(
 case_id,question_id,reporter_user_id,risk_lane,channel
 ) values(v_q.case_id,v_q.id,auth.uid(),v_c.risk_lane,p_channel)
 returning id into v_id;
 return v_id;
end;
$b8$;

-- Manual UI observation is NEVER a claim that the official received the message.
-- A "receipt" uploaded by Reporter remains UNVERIFIED official dispatch evidence.
create function public.jb_b8_g3_reporter_record_handoff_observation(
 p_intent_id uuid,p_observation text,p_receipt_id uuid default null
) returns uuid language plpgsql security definer set search_path=''
as $b8$
declare v_i public.b8_g3_handoff_intents%rowtype;v_id uuid;
begin
 select * into v_i from public.b8_g3_handoff_intents where id=p_intent_id for share;
 if not found or v_i.reporter_user_id is distinct from auth.uid() then
  raise exception 'B8_G3_OWN_HANDOFF_REQUIRED';end if;
 perform 1 from public.b8_case_reporter_grants
 where case_id=v_i.case_id and reporter_user_id=auth.uid() for update;
 if not coalesce(private.b8_g1_reporter_case_allowed(v_i.case_id),false) then
  raise exception 'B8_ASSIGNED_ACTIVE_REPORTER_REQUIRED';end if;
 if coalesce(p_observation,'') not in
 ('COMPOSER_OPENED','USER_REPORTED_ATTEMPT','UNVERIFIED_RECEIPT_ATTACHED')
 then raise exception 'B8_G3_INVALID_OBSERVATION';end if;
 if (p_observation='UNVERIFIED_RECEIPT_ATTACHED') is distinct from(p_receipt_id is not null)
 then raise exception 'B8_G3_RECEIPT_REQUIRED_ONLY_FOR_ATTACHED';end if;
 if p_receipt_id is not null and not exists(
  select 1 from public.b8_private_upload_receipts r
  join public.b8_private_upload_intents i on i.id=r.intent_id
  where r.id=p_receipt_id and r.case_id=v_i.case_id
  and i.reporter_user_id=auth.uid() and i.case_id=v_i.case_id
 ) then raise exception 'B8_G3_SAME_CASE_RECEIPT_REQUIRED';end if;
 insert into public.b8_g3_handoff_observations(
 intent_id,actor_user_id,observation,evidence_receipt_id)
 values(p_intent_id,auth.uid(),p_observation,p_receipt_id)
 returning id into v_id;
 return v_id;
end;
$b8$;

create function public.jb_b8_g3_owner_handoff_truth(p_question_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $b8$
declare v jsonb;
begin
 if not coalesce(private.current_owner_aal2(),false) then
  raise exception 'B8_OWNER_AAL2_REQUIRED';end if;
 select jsonb_build_object('case_id',i.case_id,'question_id',i.question_id,
 'risk_lane',i.risk_lane,'channel',i.channel,'prepared_at',i.prepared_at,
 'handoff_state',i.state,
 'user_reported_attempt',exists(
   select 1 from public.b8_g3_handoff_observations o
    where o.intent_id=i.id and o.observation='USER_REPORTED_ATTEMPT'),
 'unverified_receipt_uploaded',exists(
   select 1 from public.b8_g3_handoff_observations o
    where o.intent_id=i.id and o.observation='UNVERIFIED_RECEIPT_ATTACHED'),
 'official_delivery_verified',false,'provider_acceptance_verified',false,
 'reply_received_verified',false,'external_delivery_status','NOT_VERIFIED')
 into v from public.b8_g3_handoff_intents i where i.question_id=p_question_id;
 if v is null then raise exception 'B8_G3_EXISTING_HANDOFF_REQUIRED';end if;
 return v;
end;
$b8$;
revoke all on function public.jb_b8_g3_reporter_prepare_manual_handoff(uuid,text)
 from public,anon,authenticated;
revoke all on function public.jb_b8_g3_reporter_record_handoff_observation(uuid,text,uuid)
 from public,anon,authenticated;
revoke all on function public.jb_b8_g3_owner_handoff_truth(uuid)
 from public,anon,authenticated;
grant execute on function public.jb_b8_g3_reporter_prepare_manual_handoff(uuid,text) to authenticated;
grant execute on function public.jb_b8_g3_reporter_record_handoff_observation(uuid,text,uuid)
 to authenticated;
grant execute on function public.jb_b8_g3_owner_handoff_truth(uuid) to authenticated;
-- NO provider API/automatic email/WhatsApp. No external SENT/DELIVERED assumed.
