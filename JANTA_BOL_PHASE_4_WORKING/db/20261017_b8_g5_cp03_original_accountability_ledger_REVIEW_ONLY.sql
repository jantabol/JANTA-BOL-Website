-- JANTA BOL B8 G5 CP03 — minimal original T093/T095/T096/T097 private factual ledger.
-- REVIEW ONLY; NO LIVE database changes. Apply AFTER G1,G2,G3,G4 review-only files.
-- OWNER AAL2 decision != external factual verification. All entries are ATTRIBUTED UNVERIFIED RECORDS.
-- Does not touch older Article publishing, old Article UUID/PURL, B3, B7, or original Auth.
create table public.b8_g5_fact_events (
 id bigint generated always as identity primary key,
 case_id uuid not null references public.b8_cases(id) on delete restrict,
 kind text not null check(kind in
  ('COST','IMPACT','ALTERNATIVE','GROUND','DEADLINE','RESPONSIBILITY','CONFLICT','OUTCOME','REOPEN')),
 field_code text not null,
 detail_text text not null check(char_length(btrim(detail_text)) between 12 and 500),
 cost_inr numeric(24,2) check(cost_inr>=0),
 target_date date,
 evidence_receipt_id uuid references public.b8_private_upload_receipts(id) on delete restrict,
 authenticity text not null default 'NOT_INDEPENDENTLY_VERIFIED'
  check(authenticity='NOT_INDEPENDENTLY_VERIFIED'),
 recorded_by uuid not null,
 recorded_at timestamptz not null default now(),
 check(
  (kind='COST' and field_code in('SANCTIONED','TENDER','REVISED','ACTUAL')
   and cost_inr is not null and target_date is null)
  or (kind='IMPACT' and field_code in('AUTHORITY_STATED','GROUND_REPORTED')
   and cost_inr is null and target_date is null)
  or (kind='ALTERNATIVE' and field_code in('DOCUMENTED_PROPOSAL','UNVERIFIED_PROPOSAL')
   and cost_inr is null and target_date is null)
  or (kind='GROUND' and field_code in('AUTHORITY_COMPLETION_CLAIM','FIELD_OBSERVATION_REPORTED')
   and cost_inr is null and target_date is null)
  or (kind='DEADLINE' and field_code in('ORIGINAL','REVISED')
   and target_date is not null and cost_inr is null)
  or (kind='RESPONSIBILITY' and field_code='ROLE_MAP'
   and cost_inr is null and target_date is null)
  or (kind='CONFLICT' and field_code='FLAG_RAISED'
   and cost_inr is null and target_date is null)
  or (kind='OUTCOME' and field_code in('MONITORING','CLOSED_WITH_REASONS')
   and cost_inr is null and target_date is null)
  or (kind='REOPEN' and field_code='NEW_MATERIAL_EVIDENCE'
   and evidence_receipt_id is not null and cost_inr is null and target_date is null)
 )
);
create index b8_g5_fact_events_case_order_idx
 on public.b8_g5_fact_events(case_id,id desc);
create function private.b8_g5_fact_history_sealed()
returns trigger language plpgsql security definer set search_path=''
as $b8$
begin
 raise exception 'B8_G5_IMMUTABLE_FACT_HISTORY';
end;
$b8$;
create trigger b8_g5_fact_events_immutable before update or delete
 on public.b8_g5_fact_events for each row
 execute function private.b8_g5_fact_history_sealed();
revoke all on function private.b8_g5_fact_history_sealed()
 from public,anon,authenticated;
alter table public.b8_g5_fact_events enable row level security;
revoke all on public.b8_g5_fact_events from public,anon,authenticated;
grant select,insert,update,delete on public.b8_g5_fact_events to service_role;

-- Serialize factual updates and G4 Owner public revision on the SAME Case row lock.
-- A conflict discovered after a public release must first be privately HIDDEN, not silently left public.
create function public.jb_b8_g5_owner_record_fact(
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
 insert into public.b8_g5_fact_events
  (case_id,kind,field_code,detail_text,cost_inr,target_date,evidence_receipt_id,recorded_by)
 values (p_case_id,p_kind,p_field_code,p_detail,p_cost_inr,p_target_date,p_receipt_id,auth.uid())
 returning id into v_id;
 return v_id;
end;
$b8$;

-- Case closure is only editorial monitoring/closed-with-reasons, NEVER a verified civic outcome.
create function public.jb_b8_g5_owner_record_outcome(
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
 v_code:=case when p_case_state='closed' then 'CLOSED_WITH_REASONS' else 'MONITORING' end;
 insert into public.b8_g5_fact_events
 (case_id,kind,field_code,detail_text,evidence_receipt_id,recorded_by)
 values(p_case_id,'OUTCOME',v_code,p_reason,p_receipt_id,auth.uid())
 returning id into v_id;
 update public.b8_cases set case_state=p_case_state,updated_at=now() where id=p_case_id;
 return v_id;
end;
$b8$;

create function public.jb_b8_g5_owner_reopen_case(
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
 return v_id;
end;
$b8$;

-- Source evidence may remain UNVERIFIED even when a private byte receipt exists.
create function public.jb_b8_g5_owner_private_ledger(p_case_id uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $b8$
declare v_events jsonb;
begin
 if not coalesce(private.current_owner_aal2(),false)
 then raise exception 'B8_OWNER_AAL2_REQUIRED';end if;
 if not exists(select 1 from public.b8_cases where id=p_case_id)
 then raise exception 'B8_G5_CASE_REQUIRED';end if;
 select coalesce(jsonb_agg(
  jsonb_build_object('id',e.id,'kind',e.kind,'field',e.field_code,
  'detail',e.detail_text,'cost_inr',e.cost_inr,'date',e.target_date,
  'authenticity',e.authenticity,'recorded_at',e.recorded_at)
  order by e.id),'[]'::jsonb)
 into v_events from (
  select * from public.b8_g5_fact_events where case_id=p_case_id
  order by id desc limit 100
 ) e;
 return v_events;
end;
$b8$;

-- No silent re-publication of an already flagged JANTA BOL/Founder-conflict case.
-- Security trigger does NOT affect HIDE, does NOT write existing Article data.
create function private.b8_g5_block_conflicted_public_revision()
returns trigger language plpgsql security definer set search_path=''
as $b8$
begin
 if new.action in('PUBLISH','REVISE') and exists(
  select 1 from public.b8_g5_fact_events
  where case_id=new.case_id and kind='CONFLICT' and field_code='FLAG_RAISED')
 then raise exception 'B8_G5_UNRESOLVED_CONFLICT_PUBLIC_DENIED';end if;
 return new;
end;
$b8$;
create trigger b8_g5_conflict_public_revision_gate before insert
 on public.b8_g4_public_revisions for each row
 execute function private.b8_g5_block_conflicted_public_revision();
revoke all on function private.b8_g5_block_conflicted_public_revision()
 from public,anon,authenticated;

revoke all on function public.jb_b8_g5_owner_record_fact(uuid,text,text,text,numeric,date,uuid)
 from public,anon,authenticated;
revoke all on function public.jb_b8_g5_owner_record_outcome(uuid,text,text,uuid)
 from public,anon,authenticated;
revoke all on function public.jb_b8_g5_owner_reopen_case(uuid,uuid,text)
 from public,anon,authenticated;
revoke all on function public.jb_b8_g5_owner_private_ledger(uuid)
 from public,anon,authenticated;
grant execute on function public.jb_b8_g5_owner_record_fact(uuid,text,text,text,numeric,date,uuid)
 to authenticated;
grant execute on function public.jb_b8_g5_owner_record_outcome(uuid,text,text,uuid)
 to authenticated;
grant execute on function public.jb_b8_g5_owner_reopen_case(uuid,uuid,text)
 to authenticated;
grant execute on function public.jb_b8_g5_owner_private_ledger(uuid)
 to authenticated;
-- NO public `anon` ledger grants, no official verification, no new Article publishing.
