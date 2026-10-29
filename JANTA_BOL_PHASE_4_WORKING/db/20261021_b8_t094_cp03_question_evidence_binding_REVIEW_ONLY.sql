-- JANTA BOL B8 T094 CP03 (ACC-013) evidence↔question specificity.
-- ADDITIVE CANDIDATE, PG17 disposable first. DO NOT DEPLOY LIVE before Founder gate.
-- Safe update: G1/G2/G3 other functions unchanged. No external SEND.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $pre$
declare existing_function text;
begin
 select pg_get_functiondef('public.jb_b8_g3_reporter_prepare_manual_handoff(uuid,text)'::regprocedure) into existing_function;
 if to_regclass('public.b8_question_evidence_links') is not null
   or existing_function is null or strpos(existing_function,'B8_G3_UNAPPROVED_CHANNEL')=0
   or strpos(existing_function,'B8_G3_R1_SCREENING_REQUIRED')=0
   or strpos(existing_function,'B8_G3_R2_FOUNDER_APPROVAL_REQUIRED')=0
   or strpos(existing_function,'B8_G3_REPLAY_CHANNEL_CONFLICT')=0
   or strpos(existing_function,'B8_T094_QUESTION_SOURCE_LINK_REQUIRED')>0
 then raise exception 'B8_T094_CP03_SOURCE_DRIFT_STOP';end if;
end $pre$;

create table public.b8_question_evidence_links(
 question_id uuid primary key references public.b8_question_drafts(id) on delete restrict,
 claim_id uuid not null references public.b8_case_evidence_claims(id) on delete restrict,
 case_id uuid not null references public.b8_cases(id) on delete restrict,
 linked_by uuid not null,
 truth text not null default 'CLAIM_UNVERIFIED_NO_BYTES'
  check(truth='CLAIM_UNVERIFIED_NO_BYTES'),
 linked_at timestamptz not null default clock_timestamp()
);
create index b8_question_evidence_links_case_idx on public.b8_question_evidence_links(case_id,linked_at);
alter table public.b8_question_evidence_links enable row level security;
revoke all on public.b8_question_evidence_links from public,anon,authenticated;
grant select,insert on public.b8_question_evidence_links to service_role;

create function private.b8_t094_question_evidence_immutable()
returns trigger language plpgsql security definer set search_path=''
as $b8$ begin raise exception 'B8_T094_QUESTION_EVIDENCE_IMMUTABLE';end; $b8$;
create trigger b8_t094_question_evidence_immutable
before update or delete on public.b8_question_evidence_links
for each row execute function private.b8_t094_question_evidence_immutable();
revoke all on function private.b8_t094_question_evidence_immutable() from public,anon,authenticated;

-- One frozen question gets one reproducible supporting claimant-sourced reference.
-- To correct the question/supporting source, create a new draft (immutable history preserved).
create function public.jb_b8_g1_reporter_bind_question_evidence(
 p_question_id uuid,p_claim_id uuid
) returns boolean language plpgsql security definer set search_path=''
as $b8$
declare v_q public.b8_question_drafts%rowtype;
  v_existing public.b8_question_evidence_links%rowtype;
begin
 select * into v_q from public.b8_question_drafts where id=p_question_id for share;
 if not found or v_q.reporter_user_id is distinct from auth.uid() then
  raise exception 'B8_T094_OWN_DRAFT_REQUIRED';end if;
 perform 1 from public.b8_case_reporter_grants
 where case_id=v_q.case_id and reporter_user_id=auth.uid() for update;
 if not coalesce(private.b8_g1_reporter_case_allowed(v_q.case_id),false) then
  raise exception 'B8_ASSIGNED_ACTIVE_REPORTER_REQUIRED';end if;
 if not exists(select 1 from public.b8_case_evidence_claims e
  where e.id=p_claim_id and e.case_id=v_q.case_id
    and e.submitted_by=auth.uid() and e.evidence_state='CLAIM_UNVERIFIED_NO_BYTES') then
  raise exception 'B8_T094_SAME_CASE_OWN_EVIDENCE_CLAIM_REQUIRED';end if;
 insert into public.b8_question_evidence_links(question_id,claim_id,case_id,linked_by)
 values(v_q.id,p_claim_id,v_q.case_id,auth.uid())
 on conflict(question_id) do nothing;
 select * into v_existing from public.b8_question_evidence_links where question_id=v_q.id;
 if not found or v_existing.claim_id is distinct from p_claim_id then
  raise exception 'B8_T094_FROZEN_QUESTION_LINK_CONFLICT';end if;
 return true;
end;
$b8$;
revoke all on function public.jb_b8_g1_reporter_bind_question_evidence(uuid,uuid) from public,anon,authenticated;
grant execute on function public.jb_b8_g1_reporter_bind_question_evidence(uuid,uuid) to authenticated;

-- G3 preserve R0 scoped Reporter, R1 Editor screening and R2 Founder/AAL2 approval.
create or replace function public.jb_b8_g3_reporter_prepare_manual_handoff(
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
 -- T094 ACC-013: an unsourced ordinary R0 question must not be handed off.
 -- A referenced claim is UNVERIFIED metadata, never independently authenticated E9.
 if not exists(
   select 1 from public.b8_question_evidence_links e
   join public.b8_case_evidence_claims c on c.id=e.claim_id
   where e.question_id=p_question_id and e.case_id=v_q.case_id
     and e.linked_by=v_q.reporter_user_id and c.case_id=v_q.case_id
     and c.submitted_by=v_q.reporter_user_id
 ) then raise exception 'B8_T094_QUESTION_SOURCE_LINK_REQUIRED';end if;
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
commit;
-- E2: even if a claim is linked, this proves provenance of a claimed hash, not source bytes,
-- whether the question is neutral, whether the source says so, nor external delivery E9.
