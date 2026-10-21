-- B8 T093: exact duplicate prevention in private immutable G5 ledger.
-- Minimal additive FUNCTION body fix; no table/index/public News/Ads modifications.
-- Previously recorded #2/#3 are immutable historic evidence and NOT erased.
begin;
set local lock_timeout='4s';
set local statement_timeout='30s';
do $b8$
declare v text;
begin
 select pg_catalog.pg_get_functiondef('public.jb_b8_g5_owner_record_fact(uuid,text,text,text,numeric,date,uuid)'::regprocedure) into v;
 if v is null
 or pg_catalog.strpos(v,'B8_G5_ORIGINAL_DEADLINE_ALREADY_SEALED')=0
 or pg_catalog.strpos(v,'B8_G5_HIDE_PUBLIC_BEFORE_CONFLICT_FLAG')=0
 or pg_catalog.strpos(v,'B8_G5_EXACT_DUPLICATE_NOT_APPENDED')>0
 then raise exception 'B8_G5_DUPLICATE_GUARD_SOURCE_DRIFT_STOP'; end if;
end $b8$;
create or replace function public.jb_b8_g5_owner_record_fact(
 p_case_id uuid,p_kind text,p_field_code text,p_detail text,
 p_cost_inr numeric default null,p_target_date date default null,
 p_receipt_id uuid default null
) returns bigint language plpgsql security definer set search_path=''
as $b8$
declare v_state text;v_id bigint;v_last_action text;
begin
 if not coalesce(private.current_owner_aal2(),false)
 then raise exception 'B8_OWNER_AAL2_REQUIRED';end if;
 select case_state into v_state from public.b8_cases
  where id=p_case_id for update;
 if not found then raise exception 'B8_G5_CASE_REQUIRED';end if;
 if v_state='closed' then raise exception 'B8_G5_CLOSED_CASE_IMMUTABLE_UNTIL_REOPEN';end if;
 if p_kind not in('COST','IMPACT','ALTERNATIVE','GROUND','DEADLINE','RESPONSIBILITY','CONFLICT')
 then raise exception 'B8_G5_USE_OUTCOME_OR_REOPEN_API';end if;
 if p_receipt_id is not null and not exists(
  select 1 from public.b8_private_upload_receipts r
  where r.id=p_receipt_id and r.case_id=p_case_id)
 then raise exception 'B8_G5_CROSS_CASE_RECEIPT_DENIED';end if;
 if p_kind='DEADLINE' and p_field_code='ORIGINAL' and exists(
  select 1 from public.b8_g5_fact_events
  where case_id=p_case_id and kind='DEADLINE' and field_code='ORIGINAL')
 then raise exception 'B8_G5_ORIGINAL_DEADLINE_ALREADY_SEALED';end if;
 if p_kind='DEADLINE' and p_field_code='REVISED' and not exists(
  select 1 from public.b8_g5_fact_events
  where case_id=p_case_id and kind='DEADLINE' and field_code='ORIGINAL')
 then raise exception 'B8_G5_ORIGINAL_DEADLINE_REQUIRED';end if;
 if p_kind='CONFLICT' then
   select action into v_last_action from public.b8_g4_public_revisions
   where case_id=p_case_id order by revision_no desc limit 1;
   if v_last_action is not null and v_last_action<>'HIDE'
   then raise exception 'B8_G5_HIDE_PUBLIC_BEFORE_CONFLICT_FLAG';end if;
 end if;
 -- Case row is FOR UPDATE locked above: a repeated *identical* submission cannot
 -- generate a second immutable event, even when the earlier response was lost.
 -- Different source/detail/cost/date/receipt stays appendable for later updates.
 if exists(
  select 1 from public.b8_g5_fact_events e
  where e.case_id=p_case_id and e.kind=p_kind and e.field_code=p_field_code
    and e.detail_text=p_detail
    and e.cost_inr is not distinct from p_cost_inr
    and e.target_date is not distinct from p_target_date
    and e.evidence_receipt_id is not distinct from p_receipt_id
 ) then
   raise exception 'B8_G5_EXACT_DUPLICATE_NOT_APPENDED';
 end if;
 insert into public.b8_g5_fact_events
  (case_id,kind,field_code,detail_text,cost_inr,target_date,evidence_receipt_id,recorded_by)
 values (p_case_id,p_kind,p_field_code,p_detail,p_cost_inr,p_target_date,p_receipt_id,auth.uid())
 returning id into v_id;
 return v_id;
end;
$b8$;


commit;
-- Existing EXECUTE grants, AAL2 case checks and immutable trigger are unchanged.
