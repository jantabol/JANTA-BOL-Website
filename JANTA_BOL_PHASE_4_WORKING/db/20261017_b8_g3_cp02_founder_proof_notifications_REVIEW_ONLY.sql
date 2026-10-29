-- JANTA BOL B8 G3 CP02 — reviewed private evidence links, R1 Editor screening,
-- R2 prior Founder authorization and IN-APP notification (not external delivery).
-- REVIEW ONLY; pair with G1/G2 migrations; DO NOT run on LIVE without deployment gate.
-- Founder decision A: ordinary R0 Reporter independent, R1 Editor screened,
-- R2 Owner AAL2 approval; actual question DISPATCH deliberately remains separate CP03.
create table public.b8_g3_request_evidence_links(
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references public.b8_question_review_requests(id) on delete restrict,
 receipt_id uuid not null references public.b8_private_upload_receipts(id) on delete restrict,
 linked_by uuid not null,
 linked_at timestamptz not null default now(),
 unique(request_id,receipt_id)
);
create table public.b8_g3_editor_screenings(
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null unique references public.b8_question_review_requests(id) on delete restrict,
 editor_user_id uuid not null,
 reason text not null check(char_length(btrim(reason)) between 12 and 500),
 evidence_count integer not null check(evidence_count > 0),
 screened_at timestamptz not null default now()
);
create table public.b8_g3_founder_authorizations(
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null unique references public.b8_question_review_requests(id) on delete restrict,
 founder_user_id uuid not null,
 reason text not null check(char_length(btrim(reason)) between 12 and 500),
 evidence_count integer not null check(evidence_count > 0),
 authorized_at timestamptz not null default now()
);
create function private.b8_g3_cp02_deny_history_change()
returns trigger language plpgsql security definer set search_path=''
as $b8$
begin
 raise exception 'B8_G3_PROOF_HISTORY_IMMUTABLE';
end;
$b8$;
create trigger b8_g3_links_immutable before update or delete on public.b8_g3_request_evidence_links
 for each row execute function private.b8_g3_cp02_deny_history_change();
create trigger b8_g3_screens_immutable before update or delete on public.b8_g3_editor_screenings
 for each row execute function private.b8_g3_cp02_deny_history_change();
create trigger b8_g3_founder_authorizations_immutable before update or delete on public.b8_g3_founder_authorizations
 for each row execute function private.b8_g3_cp02_deny_history_change();
revoke all on function private.b8_g3_cp02_deny_history_change() from public,anon,authenticated;
alter table public.b8_g3_request_evidence_links enable row level security;
alter table public.b8_g3_editor_screenings enable row level security;
alter table public.b8_g3_founder_authorizations enable row level security;
revoke all on public.b8_g3_request_evidence_links, public.b8_g3_editor_screenings,
 public.b8_g3_founder_authorizations from public,anon,authenticated;
grant select,insert,update,delete on public.b8_g3_request_evidence_links,
 public.b8_g3_editor_screenings,public.b8_g3_founder_authorizations to service_role;

-- Reporter must own the actual question and private upload receipt and still be ACTIVE.
create function public.jb_b8_g3_reporter_link_verified_bytes(p_request_id uuid,p_receipt_id uuid)
returns uuid language plpgsql security definer set search_path=''
as $b8$
declare v_req public.b8_question_review_requests%rowtype;v_id uuid;
begin
 select * into v_req from public.b8_question_review_requests where id=p_request_id for share;
 if not found or v_req.requested_by is distinct from auth.uid() then
  raise exception 'B8_G3_OWN_REVIEW_REQUIRED';end if;
 perform 1 from public.b8_case_reporter_grants
 where case_id=v_req.case_id and reporter_user_id=auth.uid() for update;
 if not coalesce(private.b8_g1_reporter_case_allowed(v_req.case_id),false) then
  raise exception 'B8_ASSIGNED_ACTIVE_REPORTER_REQUIRED';end if;
 if not exists(
  select 1 from public.b8_private_upload_receipts r
  join public.b8_private_upload_intents i on i.id=r.intent_id
  where r.id=p_receipt_id and r.case_id=v_req.case_id
   and i.reporter_user_id=auth.uid() and i.case_id=v_req.case_id
 ) then raise exception 'B8_G3_SAME_CASE_OWN_PRIVATE_RECEIPT_REQUIRED';end if;
 -- Screening has to be on the FROZEN set. Changes after clearance need a NEW request.
 if exists(select 1 from public.b8_g3_editor_screenings where request_id=p_request_id)
  or exists(select 1 from public.b8_g3_founder_authorizations where request_id=p_request_id) then
  raise exception 'B8_G3_SCREENING_ALREADY_FROZEN';end if;
 insert into public.b8_g3_request_evidence_links(request_id,receipt_id,linked_by)
 values(p_request_id,p_receipt_id,auth.uid()) returning id into v_id;
 return v_id;
end;
$b8$;

-- Additional explicit, evidence-backed R1 editorial screening.
-- Existing G1 "EVIDENCE_REVIEW_PENDING" has NO send power; this NEW screening
-- freezes the reviewed question/attachment set before CP03 dispatch checks it.
create function public.jb_b8_g3_editor_screen_r1(p_request_id uuid,p_reason text)
returns uuid language plpgsql security definer set search_path=''
as $b8$
declare v_req public.b8_question_review_requests%rowtype;v_count integer;v_id uuid;
begin
 select * into v_req from public.b8_question_review_requests where id=p_request_id for update;
 if not found or v_req.risk_lane<>'R1' then
  raise exception 'B8_G3_R1_REVIEW_REQUIRED';end if;
 perform 1 from public.b8_case_editor_grants
 where case_id=v_req.case_id and editor_user_id=auth.uid() for update;
 if not coalesce(private.b8_g1_editor_case_allowed(v_req.case_id),false) then
  raise exception 'B8_ASSIGNED_ACTIVE_EDITOR_REQUIRED';end if;
 if p_reason is null or char_length(btrim(p_reason)) not between 12 and 500 then
  raise exception 'B8_G3_EDITOR_REASON_REQUIRED';end if;
 if not exists(select 1 from public.b8_question_review_decisions d
  where d.request_id=p_request_id and d.decision='EVIDENCE_REVIEW_PENDING')
 then raise exception 'B8_G3_PRIOR_EDITOR_REVIEW_REQUIRED';end if;
 select count(*) into v_count from public.b8_g3_request_evidence_links
 where request_id=p_request_id;
 if v_count<1 then raise exception 'B8_G3_DOCUMENTARY_BYTES_REQUIRED';end if;
 insert into public.b8_g3_editor_screenings(request_id,editor_user_id,reason,evidence_count)
 values(p_request_id,auth.uid(),btrim(p_reason),v_count) returning id into v_id;
 return v_id;
end;
$b8$;

-- R2 only: must have Editor ESCALATE_TO_FOUNDER + actual PRIVATE readback receipt(s)
-- and Owner AAL2. Owner approval is NOT publication or a verified official dispatch.
create function public.jb_b8_g3_owner_authorize_r2(p_request_id uuid,p_reason text)
returns uuid language plpgsql security definer set search_path=''
as $b8$
declare v_req public.b8_question_review_requests%rowtype;v_count integer;v_id uuid;
begin
 if not coalesce(private.current_owner_aal2(),false) then
  raise exception 'B8_OWNER_AAL2_REQUIRED';end if;
 select * into v_req from public.b8_question_review_requests where id=p_request_id for update;
 if not found or v_req.risk_lane<>'R2' then
  raise exception 'B8_G3_R2_REQUIRED';end if;
 if p_reason is null or char_length(btrim(p_reason)) not between 12 and 500 then
  raise exception 'B8_G3_FOUNDER_REASON_REQUIRED';end if;
 if not exists(select 1 from public.b8_question_review_decisions d
  where d.request_id=p_request_id and d.decision='ESCALATE_TO_FOUNDER')
 then raise exception 'B8_G3_EDITOR_ESCALATION_REQUIRED';end if;
 select count(*) into v_count from public.b8_g3_request_evidence_links
 where request_id=p_request_id;
 if v_count<1 then raise exception 'B8_G3_DOCUMENTARY_BYTES_REQUIRED';end if;
 insert into public.b8_g3_founder_authorizations(request_id,founder_user_id,reason,evidence_count)
 values(p_request_id,auth.uid(),btrim(p_reason),v_count) returning id into v_id;
 return v_id;
end;
$b8$;

-- Safe B3 in-app inbox alert on R1/R2 review requests and decisions.
-- Domain 'system' is in EXISTING B3 CHECK contract. External delivery is not claimed.
-- Deliberately NO confidential source/title/full question/contact in notification.
create function private.b8_g3_notify_founder_on_editor_decision()
returns trigger language plpgsql security definer set search_path=''
as $b8$
declare v_case uuid;v_risk text;
begin
 select r.case_id,r.risk_lane into v_case,v_risk
 from public.b8_question_review_requests r where r.id=new.request_id;
 insert into public.live_notifications (
  recipient_user_id,notification_type,priority,title,safe_message,
  record_type,record_id,domain,lifecycle_state,action_required,
  delivery_state,dedupe_key,metadata,consequence)
 select ur.user_id,'B8_EDITOR_DECISION',
  case when v_risk='R2' then 'CRITICAL' else 'HIGH' end,
  'B8 Accountability review update',
  'Restricted evidence review action logged. Open private case after login.',
  'b8_accountability',new.request_id::text,'system','ACTION_REQUIRED',true,
  'IN_APP_READY','b8:editor-review:'||new.request_id::text,
  jsonb_build_object('case_id',v_case::text,'request_id',new.request_id::text,
    'privacy','IN_APP_SAFE_REFERENCE_ONLY'),'ATTENTION'
 from public.user_roles ur where ur.role='owner'::public.app_role
 on conflict (recipient_user_id,dedupe_key) where dedupe_key is not null do nothing;
 return new;
end;
$b8$;
-- Existing B3 notification tables and constraints left unchanged.
create trigger b8_g3_editor_decision_founder_in_app
 after insert on public.b8_question_review_decisions
 for each row execute function private.b8_g3_notify_founder_on_editor_decision();
revoke all on function private.b8_g3_notify_founder_on_editor_decision()
 from public,anon,authenticated;

create function public.jb_b8_g3_owner_evidence_packet(p_request_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $b8$
declare v jsonb;
begin
 if not coalesce(private.current_owner_aal2(),false) then
  raise exception 'B8_OWNER_AAL2_REQUIRED';end if;
 select jsonb_build_object(
  'request_id',r.id,'case_id',r.case_id,'risk_lane',r.risk_lane,
  'question_id',q.id,'question_text',q.question_text,
  'recipient_label',q.recipient_label,'requested_at',r.created_at,
  'editor_decision',d.decision,'editor_reason',d.reason,
  'editor_at',d.created_at,
  'private_integrity_receipts',coalesce((
   select jsonb_agg(jsonb_build_object(
    'receipt_id',e.receipt_id,'server_sha256',rec.server_sha256,
    'mime',rec.mime_type,'bytes',rec.byte_count,'received_at',rec.received_at
   ) order by e.linked_at,e.id)
   from public.b8_g3_request_evidence_links e
   join public.b8_private_upload_receipts rec on rec.id=e.receipt_id
   where e.request_id=r.id
  ),'[]'::jsonb),
  'r1_editor_screened',exists(
   select 1 from public.b8_g3_editor_screenings s where s.request_id=r.id),
  'r2_founder_authorized',exists(
   select 1 from public.b8_g3_founder_authorizations a where a.request_id=r.id),
  'original_official_source_authenticity_verified',false,
  'missing_documentary_verification',true,
  'external_delivery_status','NOT_SENT',
  'full_proof_pack_verified',false
 ) into v
 from public.b8_question_review_requests r
 join public.b8_question_drafts q on q.id=r.question_id
 left join public.b8_question_review_decisions d on d.request_id=r.id
 where r.id=p_request_id;
 if v is null then raise exception 'B8_REVIEW_REQUEST_REQUIRED';end if;
 return v;
end;
$b8$;
revoke all on function public.jb_b8_g3_reporter_link_verified_bytes(uuid,uuid)
 from public,anon,authenticated;
revoke all on function public.jb_b8_g3_editor_screen_r1(uuid,text)
 from public,anon,authenticated;
revoke all on function public.jb_b8_g3_owner_authorize_r2(uuid,text)
 from public,anon,authenticated;
revoke all on function public.jb_b8_g3_owner_evidence_packet(uuid)
 from public,anon,authenticated;
grant execute on function public.jb_b8_g3_reporter_link_verified_bytes(uuid,uuid) to authenticated;
grant execute on function public.jb_b8_g3_editor_screen_r1(uuid,text) to authenticated;
grant execute on function public.jb_b8_g3_owner_authorize_r2(uuid,text) to authenticated;
grant execute on function public.jb_b8_g3_owner_evidence_packet(uuid) to authenticated;
-- NO third-party message or fake B3 EXTERNAL_SENT. Owner packet includes claim gaps.
