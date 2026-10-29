-- JANTA BOL B8 / P4-T096 / ACC-025..028: additive review-only safe fix.
-- Run only after G1-G9; disposable PG17 CI first; NO change to original Article UUID/PURL.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $verify$
begin
 if to_regclass('public.b8_t096_question_disposition_events') is not null
  or exists(select 1 from public.b8_case_article_links group by article_id having count(distinct case_id)>1)
  or strpos(pg_get_functiondef('public.jb_b8_g5_owner_record_outcome(uuid,text,text,uuid)'::regprocedure),'B8_G5_CLOSE_REQUIRES_PRIVATE_BYTES_RECEIPT')=0
  or strpos(pg_get_functiondef('public.jb_b8_g5_owner_reopen_case(uuid,uuid,text)'::regprocedure),'B8_G5_REOPEN_RECEIPT_ALREADY_USED')=0
 then raise exception 'B8_T096_SOURCE_DRIFT_OR_DUPLICATE_MASTER_STOP';end if;
end $verify$;
-- An Article in this v0 accountability domain belongs to ONE Master Case, without altering its UUID/PURL.
create unique index b8_t096_article_single_master_case on public.b8_case_article_links(article_id);
create table public.b8_t096_question_disposition_events(
 id bigint generated always as identity primary key,
 case_id uuid not null references public.b8_cases(id) on delete restrict,
 question_id uuid not null references public.b8_question_drafts(id) on delete restrict,
 disposition text not null check(disposition in(
   'ANSWERED_REPORTED','PARTIAL_REPORTED','UNANSWERED_MONITORING')),
 note text not null check(char_length(btrim(note)) between 12 and 500),
 evidence_receipt_id uuid references public.b8_private_upload_receipts(id) on delete restrict,
 verification text not null default 'FOUNDER_REPORTED_UNVERIFIED'
  check(verification='FOUNDER_REPORTED_UNVERIFIED'),
 actor_user_id uuid not null,
 recorded_at timestamptz not null default clock_timestamp(),
 check(disposition<>'ANSWERED_REPORTED' or evidence_receipt_id is not null)
);
create index b8_t096_question_disposition_case_idx
 on public.b8_t096_question_disposition_events(case_id,question_id,id desc);
alter table public.b8_t096_question_disposition_events enable row level security;
revoke all on public.b8_t096_question_disposition_events from public,anon,authenticated;
grant select,insert on public.b8_t096_question_disposition_events to service_role;
create function private.b8_t096_disposition_append_only()
returns trigger language plpgsql security definer set search_path=''
as $b8$ begin raise exception 'B8_T096_DISPOSITION_IMMUTABLE';end; $b8$;
create trigger b8_t096_disposition_immutable before update or delete
 on public.b8_t096_question_disposition_events for each row
 execute function private.b8_t096_disposition_append_only();
revoke all on function private.b8_t096_disposition_append_only() from public,anon,authenticated;

create function public.jb_b8_t096_owner_record_question_disposition(
 p_case_id uuid,p_question_id uuid,p_disposition text,p_note text,p_receipt_id uuid default null
) returns bigint language plpgsql security definer set search_path=''
as $b8$
declare v_id bigint;
begin
 if not coalesce(private.current_owner_aal2(),false)
 then raise exception 'B8_OWNER_AAL2_REQUIRED';end if;
 perform 1 from public.b8_cases where id=p_case_id and case_state<>'closed' for update;
 if not found then raise exception 'B8_T096_ACTIVE_CASE_REQUIRED';end if;
 if not exists(select 1 from public.b8_question_drafts q
   where q.id=p_question_id and q.case_id=p_case_id)
 then raise exception 'B8_T096_QUESTION_CROSS_CASE_DENIED';end if;
 if p_disposition not in ('ANSWERED_REPORTED','PARTIAL_REPORTED','UNANSWERED_MONITORING')
   or p_note is null or char_length(btrim(p_note)) not between 12 and 500
 then raise exception 'B8_T096_INVALID_DISPOSITION';end if;
 if (p_disposition='ANSWERED_REPORTED' and p_receipt_id is null)
 then raise exception 'B8_T096_ANSWERED_NEEDS_PRIVATE_BYTES';end if;
 if p_receipt_id is not null and not exists(
  select 1 from public.b8_private_upload_receipts r
  where r.id=p_receipt_id and r.case_id=p_case_id)
 then raise exception 'B8_T096_RECEIPT_CROSS_CASE_DENIED';end if;
 insert into public.b8_t096_question_disposition_events(
  case_id,question_id,disposition,note,evidence_receipt_id,actor_user_id)
 values (p_case_id,p_question_id,p_disposition,btrim(p_note),p_receipt_id,auth.uid())
 returning id into v_id;
 return v_id;
end;
$b8$;
revoke all on function public.jb_b8_t096_owner_record_question_disposition(uuid,uuid,text,text,uuid)
 from public,anon,authenticated;
grant execute on function public.jb_b8_t096_owner_record_question_disposition(uuid,uuid,text,text,uuid)
 to authenticated;
create or replace function public.jb_b8_g5_owner_record_outcome(
 p_case_id uuid,p_case_state text,p_reason text,p_receipt_id uuid default null
) returns bigint language plpgsql security definer set search_path=''
as $b8$
declare v_state text;v_id bigint;v_code text;
begin
 if not coalesce(private.current_owner_aal2(),false)
 then raise exception 'B8_OWNER_AAL2_REQUIRED';end if;
 select case_state into v_state from public.b8_cases where id=p_case_id for update;
 if not found then raise exception 'B8_G5_CASE_REQUIRED';end if;
 if v_state='closed' then raise exception 'B8_G5_USE_REOPEN_API';end if;
 if p_case_state not in ('monitoring','closed')
 then raise exception 'B8_G5_OUTCOME_STATE_INVALID';end if;
 if p_case_state='closed' and p_receipt_id is null
 then raise exception 'B8_G5_CLOSE_REQUIRES_PRIVATE_BYTES_RECEIPT';end if;
 if p_receipt_id is not null and not exists(
   select 1 from public.b8_private_upload_receipts
   where id=p_receipt_id and case_id=p_case_id)
 then raise exception 'B8_G5_CROSS_CASE_RECEIPT_DENIED';end if;
 -- Every drafted question needs an explicit editorial disposition before closing.
 -- A no-reply/partial answer stays attributed UNVERIFIED, never becomes a verified official answer.
 if p_case_state='closed' and exists(
   select 1 from public.b8_question_drafts q where q.case_id=p_case_id
     and not exists(select 1 from public.b8_t096_question_disposition_events d
       where d.case_id=p_case_id and d.question_id=q.id)
 ) then raise exception 'B8_T096_UNRESOLVED_QUESTION_DISPOSITION_REQUIRED';end if;
 v_code:=case when p_case_state='closed' then 'CLOSED_WITH_REASONS' else 'MONITORING' end;
 insert into public.b8_g5_fact_events
 (case_id,kind,field_code,detail_text,evidence_receipt_id,recorded_by)
 values(p_case_id,'OUTCOME',v_code,p_reason,p_receipt_id,auth.uid())
 returning id into v_id;
 update public.b8_cases set case_state=p_case_state,updated_at=now() where id=p_case_id;
 return v_id;
end;
$b8$;
create or replace function public.jb_b8_g5_owner_reopen_case(
 p_case_id uuid,p_new_material_receipt_id uuid,p_reason text
) returns bigint language plpgsql security definer set search_path=''
as $b8$
declare v_state text;v_id bigint;
begin
 if not coalesce(private.current_owner_aal2(),false)
 then raise exception 'B8_OWNER_AAL2_REQUIRED';end if;
 select case_state into v_state from public.b8_cases where id=p_case_id for update;
 if not found or v_state<>'closed' then raise exception 'B8_G5_CLOSED_CASE_REQUIRED';end if;
 if p_new_material_receipt_id is null or not exists(
  select 1 from public.b8_private_upload_receipts
  where id=p_new_material_receipt_id and case_id=p_case_id)
 then raise exception 'B8_G5_REOPEN_REQUIRES_SAME_CASE_BYTES';end if;
 -- Reopening with the very SAME receipt already consumed for closure or a
 -- previous reopening is not material new evidence. An older previously
 -- available but not previously used private receipt MAY be newly discovered;
 -- never claim independent authenticity merely from byte integrity.
 if exists(select 1 from public.b8_g5_fact_events e
   where e.case_id=p_case_id
     and e.evidence_receipt_id=p_new_material_receipt_id
     and e.kind in('OUTCOME','REOPEN')) then
  raise exception 'B8_G5_REOPEN_RECEIPT_ALREADY_USED';end if;
 insert into public.b8_g5_fact_events
 (case_id,kind,field_code,detail_text,evidence_receipt_id,recorded_by)
 values(p_case_id,'REOPEN','NEW_MATERIAL_EVIDENCE',p_reason,p_new_material_receipt_id,auth.uid())
 returning id into v_id;
 update public.b8_cases set case_state='investigating',updated_at=now() where id=p_case_id;
 -- An earlier public CLOSED or awaiting status cannot remain LIVE after reopening.
 -- Owner AAL2 reopens and atomically appends a safe HIDE revision; history is preserved.
 if (select action from public.b8_g4_public_revisions
       where case_id=p_case_id order by revision_no desc limit 1)
       in ('PUBLISH','REVISE') then
   perform public.jb_b8_g4_owner_release_public_projection(
      p_case_id,'HIDE',null,null,null,false);
 end if;
 return v_id;
end;
$b8$;
commit;
-- No synthetic fixtures in migration; never infer genuine source truth or dispatch from closure.
