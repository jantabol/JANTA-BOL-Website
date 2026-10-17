-- JANTA BOL B8 G4 CP01-CP03: Founder-approved SAFE PUBLIC projection / timeline.
-- REVIEW ONLY. Disposable PostgreSQL17 CI FIRST. NEVER auto-run on LIVE.
-- REUSE original immutable News Article UUID/PURL, no new Article publisher.
-- Private Case/evidence/source/reply records NEVER exposed through public RPC.
-- Product safety: no public freeform title, source, name, phone, link, media URL or notes.
-- Public descriptors and timeline messages are server-owned FIXED code dictionaries.
-- R2 restricted cases fail CLOSED from public, even if Owner attempts approval.
-- Founder AAL2 only; append-only approvals/history and immediate HIDE.
-- Existing B0-B7 Article/Source/Auth/B3/B7 database objects are not modified.

create table public.b8_g4_public_revisions (
 id bigint generated always as identity primary key,
 case_id uuid not null references public.b8_cases(id) on delete restrict,
 revision_no bigint not null check(revision_no > 0),
 action text not null check(action in ('PUBLISH','REVISE','HIDE')),
 public_topic text check(public_topic in
   ('PUBLIC_WORKS','PUBLIC_SERVICE','HEALTHCARE','EDUCATION','OTHER')),
 public_area_code text check(public_area_code in
   ('PICHHORE','SHIVPURI','GUNA','ASHOKNAGAR','MADHYA_PRADESH')),
 public_status text check(public_status in
   ('UNDER_REVIEW','RECORDS_REQUESTED','AWAITING_RESPONSE','UPDATED','CLOSED')),
 approval_basis text not null check (approval_basis in
   ('FOUNDER_REDACTION_AND_PUBLIC_INTEREST_REVIEW','SAFETY_WITHDRAWAL')),
 approved_by uuid not null,
 approved_at timestamptz not null default now(),
 unique(case_id,revision_no),
 check (
 (action in('PUBLISH','REVISE') and public_topic is not null
  and public_area_code is not null and public_status is not null
  and approval_basis='FOUNDER_REDACTION_AND_PUBLIC_INTEREST_REVIEW')
 or (action='HIDE' and public_topic is null and public_area_code is null
  and public_status is null and approval_basis='SAFETY_WITHDRAWAL')
 )
);
create index b8_g4_public_revisions_case_time_idx
 on public.b8_g4_public_revisions(case_id,revision_no desc);
create index b8_g4_public_revisions_feed_idx
 on public.b8_g4_public_revisions(approved_at desc,id desc);

-- Server-defined public-safe milestone CODES only, no journalist text, URLs or evidence.
create table public.b8_g4_public_milestones (
 id bigint generated always as identity primary key,
 case_id uuid not null references public.b8_cases(id) on delete restrict,
 event_code text not null check(event_code in(
  'CASE_REVIEW_STARTED','PUBLIC_RECORDS_UNDER_REVIEW','QUESTION_DRAFT_PREPARED',
  'EDITORIAL_REVIEW_UPDATED','RESPONSE_STATUS_NOT_VERIFIED',
  'CASE_STATUS_UPDATED','FOLLOWUP_ARTICLE_LINKED','CASE_CLOSED')),
 recorded_by uuid not null,
 recorded_at timestamptz not null default now()
);
create index b8_g4_milestones_order_idx
 on public.b8_g4_public_milestones(case_id,recorded_at,id);

create function private.b8_g4_immutable_public_history()
returns trigger language plpgsql security definer set search_path=''
as $b8$
begin
 raise exception 'B8_G4_PUBLIC_APPROVAL_HISTORY_IMMUTABLE';
end;
$b8$;
create trigger b8_g4_revisions_immutable before update or delete
 on public.b8_g4_public_revisions for each row
 execute function private.b8_g4_immutable_public_history();
create trigger b8_g4_milestones_immutable before update or delete
 on public.b8_g4_public_milestones for each row
 execute function private.b8_g4_immutable_public_history();
revoke all on function private.b8_g4_immutable_public_history()
 from public,anon,authenticated;
alter table public.b8_g4_public_revisions enable row level security;
alter table public.b8_g4_public_milestones enable row level security;
revoke all on public.b8_g4_public_revisions,public.b8_g4_public_milestones
 from public,anon,authenticated;
grant select,insert,update,delete on public.b8_g4_public_revisions,
 public.b8_g4_public_milestones to service_role;

-- Exact Owner AAL2 decision, uses Case row lock to freeze revision and HIDE race.
create function public.jb_b8_g4_owner_release_public_projection(
 p_case_id uuid, p_action text, p_topic text default null,
 p_area_code text default null, p_status text default null,
 p_confirm_privacy_review boolean default false
) returns bigint language plpgsql security definer set search_path=''
as $b8$
declare v_case public.b8_cases%rowtype;v_prev public.b8_g4_public_revisions%rowtype;
 v_next bigint;v_id bigint;
begin
 if not coalesce(private.current_owner_aal2(),false) then
  raise exception 'B8_OWNER_AAL2_REQUIRED';end if;
 select * into v_case from public.b8_cases where id=p_case_id for update;
 if not found then raise exception 'B8_G4_EXISTING_CASE_REQUIRED';end if;
 if v_case.risk_lane='R2' then
  raise exception 'B8_G4_RESTRICTED_CASE_PUBLICATION_DENIED';end if;
 select * into v_prev from public.b8_g4_public_revisions
 where case_id=p_case_id order by revision_no desc limit 1;
 v_next:=coalesce(v_prev.revision_no,0)+1;
 if p_action='HIDE' then
  if v_prev.id is null or v_prev.action='HIDE' then
   raise exception 'B8_G4_NOT_PUBLIC_TO_HIDE';end if;
  if p_topic is not null or p_area_code is not null or p_status is not null
   then raise exception 'B8_G4_HIDE_HAS_UNSAFE_EXTRA_DATA';end if;
  insert into public.b8_g4_public_revisions(
   case_id,revision_no,action,approval_basis,approved_by)
  values(p_case_id,v_next,'HIDE','SAFETY_WITHDRAWAL',auth.uid())
  returning id into v_id;
  return v_id;
 end if;
 if p_action not in('PUBLISH','REVISE') or p_confirm_privacy_review is distinct from true
 then raise exception 'B8_G4_FOUNDER_PRIVACY_ATTESTATION_REQUIRED';end if;
 if (p_action='PUBLISH' and v_prev.id is not null and v_prev.action<>'HIDE')
 or (p_action='REVISE' and (v_prev.id is null or v_prev.action='HIDE')) then
  raise exception 'B8_G4_INVALID_PUBLIC_LIFECYCLE';end if;
 if p_topic is null or p_topic not in
  ('PUBLIC_WORKS','PUBLIC_SERVICE','HEALTHCARE','EDUCATION','OTHER')
 or p_area_code is null or p_area_code not in
  ('PICHHORE','SHIVPURI','GUNA','ASHOKNAGAR','MADHYA_PRADESH')
 or p_status is null or p_status not in
  ('UNDER_REVIEW','RECORDS_REQUESTED','AWAITING_RESPONSE','UPDATED','CLOSED')
 then raise exception 'B8_G4_INVALID_PUBLIC_ENUM';end if;
 -- No response-request status without independent external delivery proof.
 if p_status in('RECORDS_REQUESTED','AWAITING_RESPONSE') then
  raise exception 'B8_G4_NO_REAL_OFFICIAL_DISPATCH_PROOF';end if;
 if p_status='CLOSED' and v_case.case_state<>'closed' then
  raise exception 'B8_G4_CLOSED_STATUS_REQUIRES_CLOSED_CASE';end if;
 insert into public.b8_g4_public_revisions(
  case_id,revision_no,action,public_topic,public_area_code,
  public_status,approval_basis,approved_by)
 values(p_case_id,v_next,p_action,p_topic,p_area_code,p_status,
  'FOUNDER_REDACTION_AND_PUBLIC_INTEREST_REVIEW',auth.uid())
 returning id into v_id;
 return v_id;
end;
$b8$;

-- Public event codes are SAFE fixed strings, but only Owner can append.
-- Avoid leaking official reply, G3 handoff or correction semantics not verified.
create function public.jb_b8_g4_owner_add_public_milestone(
 p_case_id uuid,p_event_code text
) returns bigint language plpgsql security definer set search_path=''
as $b8$
declare v_case public.b8_cases%rowtype;v_id bigint;
begin
 if not coalesce(private.current_owner_aal2(),false) then
  raise exception 'B8_OWNER_AAL2_REQUIRED';end if;
 select * into v_case from public.b8_cases where id=p_case_id for update;
 if not found or v_case.risk_lane='R2' then
  raise exception 'B8_G4_PUBLIC_EVENT_NOT_ALLOWED';end if;
 if not exists(
  select 1 from public.b8_g4_public_revisions r
  where r.case_id=p_case_id and r.action in('PUBLISH','REVISE')
   and r.revision_no=(select max(z.revision_no)
    from public.b8_g4_public_revisions z where z.case_id=p_case_id)
 ) then raise exception 'B8_G4_CASE_NOT_CURRENTLY_PUBLIC';end if;
 if coalesce(p_event_code,'') not in(
  'CASE_REVIEW_STARTED','PUBLIC_RECORDS_UNDER_REVIEW','QUESTION_DRAFT_PREPARED',
  'EDITORIAL_REVIEW_UPDATED','RESPONSE_STATUS_NOT_VERIFIED',
  'CASE_STATUS_UPDATED','FOLLOWUP_ARTICLE_LINKED','CASE_CLOSED')
 then raise exception 'B8_G4_EVENT_CODE_NOT_APPROVED';end if;
 if p_event_code='QUESTION_DRAFT_PREPARED' and not exists(
  select 1 from public.b8_question_drafts d where d.case_id=p_case_id) then
  raise exception 'B8_G4_QUESTION_DRAFT_NOT_RECORDED';end if;
 if p_event_code='EDITORIAL_REVIEW_UPDATED' and not exists(
  select 1 from public.b8_question_review_decisions d
  join public.b8_question_review_requests r on r.id=d.request_id
  where r.case_id=p_case_id) then
  raise exception 'B8_G4_EDITOR_REVIEW_NOT_RECORDED';end if;
 if p_event_code='RESPONSE_STATUS_NOT_VERIFIED' and not exists(
  select 1 from public.b8_g3_handoff_intents h where h.case_id=p_case_id) then
  raise exception 'B8_G4_HANDOFF_NOT_RECORDED';end if;
 if p_event_code='PUBLIC_RECORDS_UNDER_REVIEW' and not exists(
  select 1 from public.b8_case_evidence_claims e where e.case_id=p_case_id) and not exists(
  select 1 from public.b8_private_upload_receipts r where r.case_id=p_case_id) then
  raise exception 'B8_G4_NO_RECORDS_TO_REVIEW';end if;
 if p_event_code='CASE_STATUS_UPDATED' and not exists(
  select 1 from public.b8_g4_public_revisions r
  where r.case_id=p_case_id and r.revision_no>1) then
  raise exception 'B8_G4_NO_APPROVED_STATUS_REVISION';end if;
 if p_event_code='CASE_CLOSED' and v_case.case_state<>'closed' then
  raise exception 'B8_G4_CASE_NOT_CLOSED';end if;
 if p_event_code='FOLLOWUP_ARTICLE_LINKED' and (
  select count(*) from public.b8_case_article_links l join public.articles a
   on a.id=l.article_id where l.case_id=p_case_id
   and a.status='published'::public.article_status and a.deleted_at is null
 ) < 2 then raise exception 'B8_G4_SECOND_PUBLISHED_ARTICLE_REQUIRED';end if;
 -- No backdating, explicit recorded_at ensures immutable event chronology.
 insert into public.b8_g4_public_milestones(case_id,event_code,recorded_by)
 values(p_case_id,p_event_code,auth.uid()) returning id into v_id;
 return v_id;
end;
$b8$;

-- One strict public allowlist function. SECURITY DEFINER reads only approved
-- public-safe projection codes and original published Articles' UUIDs.
-- Private case title, risk, sources, phone, evidence objects, Editor decisions,
-- notes, staff identities NEVER project to the anonymous/API result.
create function public.jb_b8_g4_public_case(p_case_id uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $b8$
declare v_case public.b8_cases%rowtype;v_release public.b8_g4_public_revisions%rowtype;v_json jsonb;
begin
 select * into v_case from public.b8_cases where id=p_case_id;
 if not found or v_case.risk_lane='R2' then return null;end if;
 select * into v_release from public.b8_g4_public_revisions
  where case_id=p_case_id order by revision_no desc limit 1;
 if not found or v_release.action='HIDE' then return null;end if;
 select jsonb_build_object(
  'case_id',v_case.id,
  'public_topic',v_release.public_topic,
  'public_area',v_release.public_area_code,
  'public_status',v_release.public_status,
  'public_revision',v_release.revision_no,
  'approved_at',v_release.approved_at,
  'title',case v_release.public_topic
   when 'PUBLIC_WORKS' then 'Public works accountability'
   when 'PUBLIC_SERVICE' then 'Public service accountability'
   when 'HEALTHCARE' then 'Healthcare accountability'
   when 'EDUCATION' then 'Education accountability'
   else 'Public interest accountability' end,
  'official_reply_independently_verified',false,
  'source_evidence_public',false,
  'timeline',coalesce((
   select jsonb_agg(jsonb_build_object(
    'event_id',m.id,'event_code',m.event_code,
    'event_at',m.recorded_at,
    'description',case m.event_code
     when 'CASE_REVIEW_STARTED' then 'Accountability review opened'
     when 'PUBLIC_RECORDS_UNDER_REVIEW' then 'Public records are under editorial review'
     when 'QUESTION_DRAFT_PREPARED' then 'An enquiry draft was prepared (not proof of delivery)'
     when 'EDITORIAL_REVIEW_UPDATED' then 'Editorial review milestone recorded'
     when 'RESPONSE_STATUS_NOT_VERIFIED' then 'Official response has not been independently verified'
     when 'CASE_STATUS_UPDATED' then 'Accountability case status updated'
     when 'FOLLOWUP_ARTICLE_LINKED' then 'A related published article is linked'
     when 'CASE_CLOSED' then 'Case closure was recorded'
     else 'Public review milestone' end)
    order by m.recorded_at,m.id)
   from public.b8_g4_public_milestones m where m.case_id=v_case.id),
   '[]'::jsonb),
  'articles',coalesce((
   select jsonb_agg(jsonb_build_object('article_id',x.article_id)
     order by x.linked_at,x.id)
   from public.b8_case_article_links x
   join public.articles a on a.id=x.article_id
   where x.case_id=v_case.id and a.status='published'::public.article_status
    and a.deleted_at is null),'[]'::jsonb)
 ) into v_json;
 return v_json;
end;
$b8$;

-- Public discovery list is bounded and constructed exclusively from SAME audited
-- public_case projection. HIDE and unapproved never appear. No unrestricted table read.
create function public.jb_b8_g4_public_feed(p_limit integer default 12)
returns jsonb language plpgsql stable security definer set search_path=''
as $b8$
declare v jsonb;
begin
 if p_limit is null or p_limit<1 or p_limit>24 then
  raise exception 'B8_G4_PUBLIC_FEED_LIMIT_INVALID';end if;
 select coalesce(jsonb_agg(z.safe_case order by z.approved_at desc,z.case_id),
   '[]'::jsonb) into v
 from (
  select r.case_id,r.approved_at,
    public.jb_b8_g4_public_case(r.case_id) as safe_case
  from public.b8_g4_public_revisions r
  join public.b8_cases c on c.id=r.case_id
  where c.risk_lane <> 'R2'
    and r.revision_no=(select max(z.revision_no)
      from public.b8_g4_public_revisions z where z.case_id=r.case_id)
    and r.action in('PUBLISH','REVISE')
  order by r.approved_at desc,r.case_id
  limit p_limit
 ) z where z.safe_case is not null;
 return v;
end;
$b8$;

revoke all on function public.jb_b8_g4_owner_release_public_projection(uuid,text,text,text,text,boolean)
 from public,anon,authenticated;
revoke all on function public.jb_b8_g4_owner_add_public_milestone(uuid,text)
 from public,anon,authenticated;
revoke all on function public.jb_b8_g4_public_case(uuid) from public,anon,authenticated;
revoke all on function public.jb_b8_g4_public_feed(integer) from public,anon,authenticated;
grant execute on function public.jb_b8_g4_owner_release_public_projection(uuid,text,text,text,text,boolean)
 to authenticated;
grant execute on function public.jb_b8_g4_owner_add_public_milestone(uuid,text)
 to authenticated;
grant execute on function public.jb_b8_g4_public_case(uuid) to anon,authenticated;
grant execute on function public.jb_b8_g4_public_feed(integer) to anon,authenticated;
-- NO UPDATE to existing public.articles/article_sources or any B0–B7 table.
