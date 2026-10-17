-- JANTA BOL / B8 G1 — CASE + SCOPED REPORTER DRAFT FOUNDATION
-- REVIEW ONLY. DO NOT APPLY TO PRODUCTION WITHOUT AN INDEPENDENT E2/E5/E7 RELEASE GATE.
-- Founder lock: R0 active, assigned Reporter drafts independently; dispatch is NOT part of G1.
-- Reuse B1 authentic role/session and Founder AAL2; NEVER broaden private.p4_staff_allowed().
-- Article, Live, B5/6, B7, publication, source history and existing policies UNCHANGED.

create table public.b8_cases (
 id uuid primary key default gen_random_uuid(),
 title text not null check (char_length(btrim(title)) between 12 and 200),
 area_label text not null check (char_length(btrim(area_label)) between 2 and 120),
 risk_lane text not null check (risk_lane in ('R0','R1','R2')),
 case_state text not null default 'draft' check (case_state in ('draft','investigating','monitoring','closed')),
 created_by uuid not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.b8_case_reporter_grants (
 case_id uuid not null references public.b8_cases(id) on delete restrict,
 reporter_user_id uuid not null,
 granted_by uuid not null,
 granted_at timestamptz not null default now(),
 expires_at timestamptz not null,
 revoked_at timestamptz,
 primary key(case_id,reporter_user_id),
 check(expires_at>granted_at),
 check(revoked_at is null or revoked_at>=granted_at)
);
create index b8_grant_reporter_active_idx
 on public.b8_case_reporter_grants(reporter_user_id,expires_at)
 where revoked_at is null;

create table public.b8_question_drafts (
 id uuid primary key default gen_random_uuid(),
 case_id uuid not null references public.b8_cases(id) on delete restrict,
 reporter_user_id uuid not null,
 question_text text not null check(char_length(btrim(question_text)) between 20 and 2000),
 recipient_label text not null check(char_length(btrim(recipient_label)) between 3 and 160),
 state text not null default 'draft' check(state='draft'),
 version_no integer not null default 1 check(version_no=1),
 created_at timestamptz not null default now()
);
create index b8_question_case_draft_idx
 on public.b8_question_drafts(case_id,created_at desc);

-- Explicit deny direct table access. SECURITY DEFINER approved RPCs are the ONLY G1 path.
alter table public.b8_cases enable row level security;
alter table public.b8_case_reporter_grants enable row level security;
alter table public.b8_question_drafts enable row level security;
revoke all on public.b8_cases, public.b8_case_reporter_grants, public.b8_question_drafts
 from public,anon,authenticated;
grant select,insert,update,delete on public.b8_cases,public.b8_case_reporter_grants,
 public.b8_question_drafts to service_role;

-- Dedicated case-specific reporter guard. Not a replacement for existing global B1 guard.
create function private.b8_g1_reporter_case_allowed(p_case_id uuid)
returns boolean language sql stable security definer
set search_path=''
as $b8$
 select coalesce(
  auth.uid() is not null
  and private.current_session_active()
  and exists (
    select 1
    from public.user_roles ur
    join public.team_accounts ta on ta.user_id=ur.user_id
    join public.b8_case_reporter_grants g on g.reporter_user_id=ur.user_id
    join public.b8_cases c on c.id=g.case_id
    where ur.user_id=auth.uid()
      and ur.role='reporter'::public.app_role
      and ta.assigned_role='reporter'::public.app_role
      and ta.status='active'
      and g.case_id=p_case_id
      and g.revoked_at is null
      and g.expires_at>now()
      and c.case_state <> 'closed'
  ),false);
$b8$;
revoke all on function private.b8_g1_reporter_case_allowed(uuid)
 from public,anon,authenticated;

-- G1 deliberately Founder AAL2 case creation and grant management only.
-- Editor case routing will be added as a separate scoped authority gate with negative tests.
create function public.jb_b8_g1_owner_create_case(
 p_title text,p_area_label text,p_risk_lane text
) returns uuid language plpgsql security definer set search_path=''
as $b8$
declare v_id uuid;
begin
 if not coalesce(private.current_owner_aal2(),false) then
  raise exception 'B8_OWNER_AAL2_REQUIRED'; end if;
 if p_title is null or char_length(btrim(p_title)) not between 12 and 200
 or p_area_label is null or char_length(btrim(p_area_label)) not between 2 and 120
 or coalesce(p_risk_lane,'') not in ('R0','R1','R2') then
  raise exception 'B8_INVALID_CASE_DETAILS'; end if;
 insert into public.b8_cases(title,area_label,risk_lane,created_by)
 values (btrim(p_title),btrim(p_area_label),p_risk_lane,auth.uid())
 returning id into v_id;
 return v_id;
end;
$b8$;
create function public.jb_b8_g1_owner_assign_reporter(
 p_case_id uuid,p_reporter_user_id uuid,p_expires_at timestamptz
) returns boolean language plpgsql security definer set search_path=''
as $b8$
begin
 if not coalesce(private.current_owner_aal2(),false) then
  raise exception 'B8_OWNER_AAL2_REQUIRED'; end if;
 if p_case_id is null or not exists (
  select 1 from public.b8_cases where id=p_case_id and case_state<>'closed'
 ) then raise exception 'B8_ASSIGNABLE_CASE_REQUIRED'; end if;
 if p_expires_at is null or p_expires_at<=now()+interval '5 minutes'
 or p_expires_at>now()+interval '90 days' then
  raise exception 'B8_ASSIGNMENT_EXPIRY_INVALID'; end if;
 if p_reporter_user_id is null or not exists(
  select 1 from public.user_roles ur join public.team_accounts ta on ta.user_id=ur.user_id
  where ur.user_id=p_reporter_user_id
   and ur.role='reporter'::public.app_role
   and ta.assigned_role='reporter'::public.app_role and ta.status='active'
 ) then raise exception 'B8_ACTIVE_REPORTER_REQUIRED'; end if;
 insert into public.b8_case_reporter_grants
  (case_id,reporter_user_id,granted_by,expires_at)
 values(p_case_id,p_reporter_user_id,auth.uid(),p_expires_at)
 on conflict(case_id,reporter_user_id) do update
 set granted_by=excluded.granted_by,
     granted_at=now(),expires_at=excluded.expires_at,revoked_at=null;
 return true;
end;
$b8$;
create function public.jb_b8_g1_owner_revoke_reporter(
 p_case_id uuid,p_reporter_user_id uuid
) returns boolean language plpgsql security definer set search_path=''
as $b8$
declare v_count int;
begin
 if not coalesce(private.current_owner_aal2(),false) then
  raise exception 'B8_OWNER_AAL2_REQUIRED'; end if;
 update public.b8_case_reporter_grants set revoked_at=now()
 where case_id=p_case_id and reporter_user_id=p_reporter_user_id and revoked_at is null;
 get diagnostics v_count=row_count;
 return v_count=1;
end;
$b8$;
create function public.jb_b8_g1_reporter_create_draft(
 p_case_id uuid,p_question text,p_recipient_label text
) returns uuid language plpgsql security definer set search_path=''
as $b8$
declare v_id uuid;
begin
 if not coalesce(private.b8_g1_reporter_case_allowed(p_case_id),false) then
  raise exception 'B8_ASSIGNED_ACTIVE_REPORTER_REQUIRED'; end if;
 if p_question is null or char_length(btrim(p_question)) not between 20 and 2000
 or p_recipient_label is null or char_length(btrim(p_recipient_label)) not between 3 and 160 then
  raise exception 'B8_DRAFT_INPUT_INVALID'; end if;
 insert into public.b8_question_drafts(case_id,reporter_user_id,question_text,recipient_label)
 values(p_case_id,auth.uid(),btrim(p_question),btrim(p_recipient_label))
 returning id into v_id;
 return v_id;
end;
$b8$;

-- Case-scoped, minimum projection. Not an official-public feed and no sensitive evidence.
create function public.jb_b8_g1_reporter_case_card(p_case_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $b8$
declare v_card jsonb;
begin
 if not coalesce(private.b8_g1_reporter_case_allowed(p_case_id),false) then
  raise exception 'B8_ASSIGNED_ACTIVE_REPORTER_REQUIRED'; end if;
 select jsonb_build_object('id',c.id,'title',c.title,'area',c.area_label,
                           'risk_lane',c.risk_lane,'state',c.case_state)
 into v_card from public.b8_cases c where c.id=p_case_id;
 return v_card;
end;
$b8$;

revoke all on function public.jb_b8_g1_owner_create_case(text,text,text)
 from public,anon,authenticated;
revoke all on function public.jb_b8_g1_owner_assign_reporter(uuid,uuid,timestamptz)
 from public,anon,authenticated;
revoke all on function public.jb_b8_g1_owner_revoke_reporter(uuid,uuid)
 from public,anon,authenticated;
revoke all on function public.jb_b8_g1_reporter_create_draft(uuid,text,text)
 from public,anon,authenticated;
revoke all on function public.jb_b8_g1_reporter_case_card(uuid)
 from public,anon,authenticated;

grant execute on function public.jb_b8_g1_owner_create_case(text,text,text)
 to authenticated;
grant execute on function public.jb_b8_g1_owner_assign_reporter(uuid,uuid,timestamptz)
 to authenticated;
grant execute on function public.jb_b8_g1_owner_revoke_reporter(uuid,uuid)
 to authenticated;
grant execute on function public.jb_b8_g1_reporter_create_draft(uuid,text,text)
 to authenticated;
grant execute on function public.jb_b8_g1_reporter_case_card(uuid)
 to authenticated;
-- No question dispatch, public timeline, source upload, approval or published news mutation in G1.
