-- JANTA BOL / B8 / T093: Add a distinct HISTORICAL DOCUMENT-ATTRIBUTED
-- PROJECTED IMPACT class. It is NOT field observation or an authority-verified fact.
-- Minimum-scope live migration: one G5 same-table type CHECK, no triggers/RPC grants,
-- no News/Ads changes, existing fact-event rows preserved and immutable.
-- Intent: e.g. MPPCB-hosted consultant feasibility projected effects, not real damage.
begin;
set local lock_timeout = '4s';
set local statement_timeout = '30s';
do $b8$
declare v_definition text;
begin
 select pg_catalog.pg_get_constraintdef(c.oid) into v_definition
 from pg_catalog.pg_constraint c
 where c.conrelid='public.b8_g5_fact_events'::pg_catalog.regclass
   and c.conname='b8_g5_fact_events_check' and c.contype='c' and c.convalidated;
 if v_definition is null
    or pg_catalog.position('AUTHORITY_STATED' in v_definition)=0
    or pg_catalog.position('GROUND_REPORTED' in v_definition)=0
    or pg_catalog.position('DOCUMENTED_PROJECTED' in v_definition)>0
 then raise exception 'B8_T093_EXISTING_CONSTRAINT_DRIFT_STOP';end if;
 if not exists (
   select 1 from pg_catalog.pg_trigger
   where tgrelid='public.b8_g5_fact_events'::pg_catalog.regclass
     and tgname='b8_g5_fact_events_immutable' and tgenabled='O'
 ) then raise exception 'B8_T093_APPEND_ONLY_TRIGGER_MISSING_STOP';end if;
end $b8$;
alter table public.b8_g5_fact_events
 drop constraint b8_g5_fact_events_check;
alter table public.b8_g5_fact_events
 add constraint b8_g5_fact_events_check check(
  (kind='COST' and field_code in('ESTIMATED_PROPOSED','SANCTIONED','TENDER','REVISED','ACTUAL')
   and cost_inr is not null and target_date is null)
  or (kind='IMPACT' and field_code in('AUTHORITY_STATED','GROUND_REPORTED','DOCUMENTED_PROJECTED')
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
 );
commit;
-- A source document merely predicts an impact: independently verified=false.
-- The existing G5 RPC owner AAL2, source-note length, same-case, append-only,
-- and source/provenance gates are unchanged. No existing records are rewritten.
