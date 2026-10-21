-- T093 ACC-009: historical consultant's PROJECT PURPOSE with source attribution.
-- A purpose in an old document is NOT independently verified NHAI statement.
-- Add ONLY private G5 enum branch; preserve Founder/AAL2, private row lock, dedupe,
-- all existing source facts, and independent validation of ground/impact claims.
begin;
set local lock_timeout='4s';
set local statement_timeout='30s';
do $b8$
declare v_function text;v_kind text;v_field text;
begin
 select pg_catalog.pg_get_functiondef('public.jb_b8_g5_owner_record_fact(uuid,text,text,text,numeric,date,uuid)'::regprocedure)
 into v_function;
 select pg_catalog.pg_get_constraintdef(oid) into v_kind from pg_catalog.pg_constraint
 where conrelid='public.b8_g5_fact_events'::regclass and conname='b8_g5_fact_events_kind_check' and convalidated;
 select pg_catalog.pg_get_constraintdef(oid) into v_field from pg_catalog.pg_constraint
 where conrelid='public.b8_g5_fact_events'::regclass and conname='b8_g5_fact_events_check' and convalidated;
 if v_function is null or pg_catalog.strpos(v_function,'B8_G5_EXACT_DUPLICATE_NOT_APPENDED')=0
  or pg_catalog.strpos(v_function,'where id=p_case_id for update')=0
  or pg_catalog.strpos(v_function,'B8_G5_HIDE_PUBLIC_BEFORE_CONFLICT_FLAG')=0
  or v_kind is null or v_field is null
  or pg_catalog.strpos(v_kind,'PURPOSE')>0 or pg_catalog.strpos(v_field,'DOCUMENTED_STATED')>0
  or pg_catalog.strpos(v_field,'DOCUMENTED_PROJECTED')=0
 then raise exception 'B8_T093_PURPOSE_DRIFT_STOP';end if;
end $b8$;
alter table public.b8_g5_fact_events drop constraint b8_g5_fact_events_kind_check;
alter table public.b8_g5_fact_events add constraint b8_g5_fact_events_kind_check
check(kind in('COST','IMPACT','ALTERNATIVE','GROUND','DEADLINE','RESPONSIBILITY','CONFLICT','OUTCOME','REOPEN','PURPOSE'));
alter table public.b8_g5_fact_events drop constraint b8_g5_fact_events_check;
alter table public.b8_g5_fact_events add constraint b8_g5_fact_events_check check(
  (kind='COST' and field_code in('ESTIMATED_PROPOSED','SANCTIONED','TENDER','REVISED','ACTUAL') and cost_inr is not null and target_date is null)
  or (kind='IMPACT' and field_code in('AUTHORITY_STATED','GROUND_REPORTED','DOCUMENTED_PROJECTED') and cost_inr is null and target_date is null)
  or (kind='ALTERNATIVE' and field_code in('DOCUMENTED_PROPOSAL','UNVERIFIED_PROPOSAL') and cost_inr is null and target_date is null)
  or (kind='GROUND' and field_code in('AUTHORITY_COMPLETION_CLAIM','FIELD_OBSERVATION_REPORTED') and cost_inr is null and target_date is null)
  or (kind='DEADLINE' and field_code in('ORIGINAL','REVISED') and target_date is not null and cost_inr is null)
  or (kind='RESPONSIBILITY' and field_code='ROLE_MAP' and cost_inr is null and target_date is null)
  or (kind='CONFLICT' and field_code='FLAG_RAISED' and cost_inr is null and target_date is null)
  or (kind='OUTCOME' and field_code in('MONITORING','CLOSED_WITH_REASONS') and cost_inr is null and target_date is null)
  or (kind='REOPEN' and field_code='NEW_MATERIAL_EVIDENCE' and evidence_receipt_id is not null and cost_inr is null and target_date is null)
  or (kind='PURPOSE' and field_code='DOCUMENTED_STATED' and cost_inr is null and target_date is null)
);
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
 if p_kind not in('COST','IMPACT','ALTERNATIVE','GROUND','DEADLINE','RESPONSIBILITY','CONFLICT','PURPOSE')
 then raise exception 'B8_G5_USE_OUTCOME_OR_REOPEN_API';end if;
 if p_receipt_id is not null and not exists(
  select 1 from public.b8_private_upload_receipts r
  where r.id=p_receipt_id and r.case_id=p_case_id)
 then raise exception 'B8_G5_CROSS_CASE_RECEIPT_DENIED';end if;
 if p_kind='PURPOSE' and p_receipt_id is null and
    p_detail !~* 'https?://[^[:space:]]+'
 then raise exception 'B8_T093_PURPOSE_SOURCE_REQUIRED';end if;
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
-- No prior fact events rewritten. All PURPOSE facts remain authenticity NOT_INDEPENDENTLY_VERIFIED.
