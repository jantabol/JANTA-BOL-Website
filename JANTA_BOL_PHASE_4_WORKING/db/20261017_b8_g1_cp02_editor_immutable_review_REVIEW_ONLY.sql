-- JANTA BOL B8 G1 CP02: scoped Editor review and immutable, private decision history.
-- REVIEW ONLY: disposable PG17 first, NOT installed on production.
-- Requires G1 CP01 migration. Preserves Article, B1 p4_staff_allowed(), B2, B3, B5/6/7.
-- This is REVIEW, not permission to SEND, not verified documentary evidence, not publicity.

create table public.b8_case_editor_grants(
 case_id uuid not null references public.b8_cases(id) on delete restrict,
 editor_user_id uuid not null,
 granted_by uuid not null,
 granted_at timestamptz not null default now(),
 expires_at timestamptz not null,
 revoked_at timestamptz,
 primary key(case_id,editor_user_id),
 check(expires_at > granted_at),
 check(revoked_at is null or revoked_at>=granted_at)
);
create index b8_case_editor_grants_active_idx
 on public.b8_case_editor_grants(editor_user_id,expires_at)
 where revoked_at is null;

create table public.b8_question_review_requests (
 id uuid primary key default gen_random_uuid(),
 case_id uuid not null references public.b8_cases(id) on delete restrict,
 question_id uuid not null unique references public.b8_question_drafts(id) on delete restrict,
 requested_by uuid not null,
 risk_lane text not null check (risk_lane in('R1','R2')),
 created_at timestamptz not null default now()
);
create index b8_question_review_requests_case_idx
 on public.b8_question_review_requests(case_id,created_at desc);

create table public.b8_question_review_decisions (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null unique references public.b8_question_review_requests(id) on delete restrict,
 decision text not null check(decision in
 ('RETURN_FOR_EVIDENCE','EVIDENCE_REVIEW_PENDING','ESCALATE_TO_FOUNDER')),
 reason text not null check(char_length(btrim(reason)) between 12 and 500),
 reviewed_by uuid not null,
 created_at timestamptz not null default now()
);

create table public.b8_case_review_events (
 id bigint generated always as identity primary key,
 case_id uuid not null references public.b8_cases(id) on delete restrict,
 event_type text not null check(event_type in
 ('REVIEW_REQUESTED','EDITOR_DECISION')),
 request_id uuid not null references public.b8_question_review_requests(id) on delete restrict,
 actor_user_id uuid not null,
 created_at timestamptz not null default now()
);
create index b8_case_review_events_case_idx
 on public.b8_case_review_events(case_id,created_at,id);

create function private.b8_g1_cp02_immutable_history()
returns trigger language plpgsql security definer set search_path=''
as $b8$
begin
 raise exception 'B8_IMMUTABLE_REVIEW_RECORD';
end;
$b8$;
create trigger b8_review_requests_immutable before update or delete
 on public.b8_question_review_requests
 for each row execute function private.b8_g1_cp02_immutable_history();
create trigger b8_review_decisions_immutable before update or delete
 on public.b8_question_review_decisions
 for each row execute function private.b8_g1_cp02_immutable_history();
create trigger b8_review_events_immutable before update or delete
 on public.b8_case_review_events
 for each row execute function private.b8_g1_cp02_immutable_history();

alter table public.b8_case_editor_grants enable row level security;
alter table public.b8_question_review_requests enable row level security;
alter table public.b8_question_review_decisions enable row level security;
alter table public.b8_case_review_events enable row level security;
revoke all on public.b8_case_editor_grants,public.b8_question_review_requests,
 public.b8_question_review_decisions,public.b8_case_review_events
 from public,anon,authenticated;
grant select,insert,update,delete on public.b8_case_editor_grants,public.b8_question_review_requests,
 public.b8_question_review_decisions,public.b8_case_review_events to service_role;
revoke all on function private.b8_g1_cp02_immutable_history()
 from public,anon,authenticated;

create function private.b8_g1_editor_case_allowed(p_case_id uuid)
returns boolean language sql stable security definer
set search_path=''
as $b8$
 select coalesce(
  auth.uid() is not null
  and private.current_session_active()
  and exists (
   select 1 from public.user_roles ur
   join public.team_accounts ta on ta.user_id=ur.user_id
   join public.b8_case_editor_grants g on g.editor_user_id=ur.user_id
   join public.b8_cases c on c.id=g.case_id
   where ur.user_id=auth.uid()
    and ur.role='editor'::public.app_role
    and ta.assigned_role='editor'::public.app_role
    and ta.status='active'
    and g.case_id=p_case_id
    and g.revoked_at is null
    and g.expires_at>now()
    and c.case_state<>'closed'
  ),false);
$b8$;
revoke all on function private.b8_g1_editor_case_allowed(uuid)
 from public,anon,authenticated;

create function public.jb_b8_g1_owner_assign_editor(
 p_case_id uuid,p_editor_user_id uuid,p_expires_at timestamptz
) returns boolean language plpgsql security definer set search_path=''
as $b8$
begin
 if not coalesce(private.current_owner_aal2(),false) then
  raise exception 'B8_OWNER_AAL2_REQUIRED';end if;
 if not exists(select 1 from public.b8_cases where id=p_case_id and case_state<>'closed') then
  raise exception 'B8_ASSIGNABLE_CASE_REQUIRED';end if;
 if p_expires_at is null or p_expires_at <= now()+interval '5 minutes'
 or p_expires_at>now()+interval '90 days' then
  raise exception 'B8_ASSIGNMENT_EXPIRY_INVALID';end if;
 if not exists (
  select 1 from public.user_roles ur
  join public.team_accounts ta on ta.user_id=ur.user_id
  where ur.user_id=p_editor_user_id
   and ur.role='editor'::public.app_role
   and ta.assigned_role='editor'::public.app_role and ta.status='active'
 ) then raise exception 'B8_ACTIVE_EDITOR_REQUIRED';end if;
 insert into public.b8_case_editor_grants(case_id,editor_user_id,granted_by,expires_at)
 values(p_case_id,p_editor_user_id,auth.uid(),p_expires_at)
 on conflict(case_id,editor_user_id) do update
 set granted_by=excluded.granted_by,granted_at=now(),
     expires_at=excluded.expires_at,revoked_at=null;
 return true;
end;
$b8$;

create function public.jb_b8_g1_owner_revoke_editor(
 p_case_id uuid,p_editor_user_id uuid
) returns boolean language plpgsql security definer set search_path=''
as $b8$
declare v_count integer;
begin
 if not coalesce(private.current_owner_aal2(),false) then
  raise exception 'B8_OWNER_AAL2_REQUIRED';end if;
 update public.b8_case_editor_grants set revoked_at=now()
 where case_id=p_case_id and editor_user_id=p_editor_user_id and revoked_at is null;
 get diagnostics v_count=row_count;
 return v_count=1;
end;
$b8$;

-- The immutable question is frozen at review request; a new revision must be a NEW draft.
-- Lock grant row before final permission check, serializing with concurrent Owner revoke.
create function public.jb_b8_g1_reporter_request_review(p_question_id uuid)
returns uuid language plpgsql security definer set search_path=''
as $b8$
declare v_draft public.b8_question_drafts%rowtype;
 v_case public.b8_cases%rowtype;
 v_id uuid;
begin
 select * into v_draft from public.b8_question_drafts where id=p_question_id;
 if not found or v_draft.reporter_user_id is distinct from auth.uid() then
  raise exception 'B8_REVIEW_OWN_DRAFT_REQUIRED';end if;
 perform 1 from public.b8_case_reporter_grants
 where case_id=v_draft.case_id and reporter_user_id=auth.uid() for update;
 if not coalesce(private.b8_g1_reporter_case_allowed(v_draft.case_id),false) then
  raise exception 'B8_ASSIGNED_ACTIVE_REPORTER_REQUIRED';end if;
 select * into v_case from public.b8_cases where id=v_draft.case_id for share;
 if v_case.risk_lane not in('R1','R2') then
  raise exception 'B8_ONLY_SERIOUS_REVIEW_REQUIRED';end if;
 if exists(select 1 from public.b8_question_review_requests where question_id=p_question_id) then
  raise exception 'B8_REVIEW_ALREADY_REQUESTED';end if;
 insert into public.b8_question_review_requests(
  case_id,question_id,requested_by,risk_lane)
 values(v_draft.case_id,v_draft.id,auth.uid(),v_case.risk_lane) returning id into v_id;
 insert into public.b8_case_review_events(case_id,event_type,request_id,actor_user_id)
 values(v_draft.case_id,'REVIEW_REQUESTED',v_id,auth.uid());
 return v_id;
end;
$b8$;

-- Only an assigned, active Editor can review; cannot authorize dispatch before G2 proof gate.
create function public.jb_b8_g1_editor_review(
 p_request_id uuid,p_decision text,p_reason text
) returns uuid language plpgsql security definer set search_path=''
as $b8$
declare v_req public.b8_question_review_requests%rowtype;
 v_id uuid;
begin
 select * into v_req from public.b8_question_review_requests
 where id=p_request_id for update;
 if not found then raise exception 'B8_REVIEW_REQUEST_REQUIRED';end if;
 perform 1 from public.b8_case_editor_grants
 where case_id=v_req.case_id and editor_user_id=auth.uid() for update;
 if not coalesce(private.b8_g1_editor_case_allowed(v_req.case_id),false) then
  raise exception 'B8_ASSIGNED_ACTIVE_EDITOR_REQUIRED';end if;
 if p_reason is null or char_length(btrim(p_reason)) not between 12 and 500 then
  raise exception 'B8_EDITOR_REASON_REQUIRED';end if;
 if p_decision not in
 ('RETURN_FOR_EVIDENCE','EVIDENCE_REVIEW_PENDING','ESCALATE_TO_FOUNDER') then
  raise exception 'B8_EDITOR_DECISION_NOT_ALLOWED';end if;
 if v_req.risk_lane='R2' and p_decision='EVIDENCE_REVIEW_PENDING' then
  raise exception 'B8_RESTRICTED_REQUIRES_FOUNDER_ESCALATION';end if;
 if exists(select 1 from public.b8_question_review_decisions where request_id=p_request_id) then
  raise exception 'B8_REVIEW_ALREADY_DECIDED';end if;
 insert into public.b8_question_review_decisions
  (request_id,decision,reason,reviewed_by)
 values(p_request_id,p_decision,btrim(p_reason),auth.uid())
 returning id into v_id;
 insert into public.b8_case_review_events
  (case_id,event_type,request_id,actor_user_id)
 values(v_req.case_id,'EDITOR_DECISION',v_req.id,auth.uid());
 return v_id;
end;
$b8$;

create function public.jb_b8_g1_editor_review_card(p_request_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $b8$
declare v_req public.b8_question_review_requests%rowtype;v_card jsonb;
begin
 select * into v_req from public.b8_question_review_requests where id=p_request_id;
 if not found then raise exception 'B8_REVIEW_REQUEST_REQUIRED';end if;
 if not coalesce(private.b8_g1_editor_case_allowed(v_req.case_id),false) then
  raise exception 'B8_ASSIGNED_ACTIVE_EDITOR_REQUIRED';end if;
 select jsonb_build_object(
  'request_id',v_req.id,'case_id',v_req.case_id,'risk_lane',v_req.risk_lane,
  'question_id',q.id,'question_text',q.question_text,
  'recipient_label',q.recipient_label,'state','UNSENT_REVIEW_ONLY',
  'proof_status','EVIDENCE_NOT_VERIFIED',
  'decision',d.decision)
 into v_card from public.b8_question_drafts q
 left join public.b8_question_review_decisions d on d.request_id=v_req.id
 where q.id=v_req.question_id;
 return v_card;
end;
$b8$;

-- Founder may review a preliminary packet, but it is NOT a complete genuine evidence pack.
-- No notification/official send occurs; never claim the Founder received a delivered alert.
create function public.jb_b8_g1_owner_preliminary_review_packet(p_request_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $b8$
declare v_packet jsonb;
begin
 if not coalesce(private.current_owner_aal2(),false) then
  raise exception 'B8_OWNER_AAL2_REQUIRED';end if;
 select jsonb_build_object(
  'case_id',r.case_id,'request_id',r.id,'question_id',q.id,
  'risk_lane',r.risk_lane,'question_text',q.question_text,
  'recipient_label',q.recipient_label,'editor_decision',d.decision,
  'editor_reason',d.reason,'editor_reviewed_at',d.created_at,
  'evidence_status','EVIDENCE_GAP',
  'delivery_status','NOT_SENT',
  'complete_proof_pack',false)
 into v_packet from public.b8_question_review_requests r
 join public.b8_question_drafts q on q.id=r.question_id
 left join public.b8_question_review_decisions d on d.request_id=r.id
 where r.id=p_request_id;
 if v_packet is null then raise exception 'B8_REVIEW_REQUEST_REQUIRED';end if;
 return v_packet;
end;
$b8$;

-- No implicit schema/function PUBLIC privileges. Each RPC granted only authenticated.
revoke all on function public.jb_b8_g1_owner_assign_editor(uuid,uuid,timestamptz)
 from public,anon,authenticated;
revoke all on function public.jb_b8_g1_owner_revoke_editor(uuid,uuid)
 from public,anon,authenticated;
revoke all on function public.jb_b8_g1_reporter_request_review(uuid)
 from public,anon,authenticated;
revoke all on function public.jb_b8_g1_editor_review(uuid,text,text)
 from public,anon,authenticated;
revoke all on function public.jb_b8_g1_editor_review_card(uuid)
 from public,anon,authenticated;
revoke all on function public.jb_b8_g1_owner_preliminary_review_packet(uuid)
 from public,anon,authenticated;
grant execute on function public.jb_b8_g1_owner_assign_editor(uuid,uuid,timestamptz)
 to authenticated;
grant execute on function public.jb_b8_g1_owner_revoke_editor(uuid,uuid)
 to authenticated;
grant execute on function public.jb_b8_g1_reporter_request_review(uuid)
 to authenticated;
grant execute on function public.jb_b8_g1_editor_review(uuid,text,text)
 to authenticated;
grant execute on function public.jb_b8_g1_editor_review_card(uuid)
 to authenticated;
grant execute on function public.jb_b8_g1_owner_preliminary_review_packet(uuid)
 to authenticated;
-- G1 CP02 intentionally NO QUESTION SEND, NO EXTERNAL MESSAGE, NO NEWS PUBLISH.
