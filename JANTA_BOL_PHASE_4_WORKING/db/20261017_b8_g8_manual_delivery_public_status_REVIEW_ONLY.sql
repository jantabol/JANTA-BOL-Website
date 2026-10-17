-- JANTA BOL B8 G8: optional manual official-contact proof transition.
-- Apply AFTER G1..G7 in disposable PG17. NO actual office SEND or provider API.
-- E9 later requires Founder inspection of a real external provider/office artifact.
-- A merely claimed provider receipt remains unverified until Founder attestation;
-- Founder attestation cannot prove authenticity to an external regulator.
create table public.b8_g8_manual_delivery_attestations(
 id bigint generated always as identity primary key,
 case_id uuid not null references public.b8_cases(id) on delete restrict,
 handoff_id uuid not null references public.b8_g3_handoff_intents(id) on delete restrict,
 receipt_id uuid not null references public.b8_private_upload_receipts(id) on delete restrict,
 verification_basis text not null check(char_length(btrim(verification_basis)) between 12 and 500),
 verified_class text not null default 'FOUNDER_REVIEWED_EXTERNAL_RECEIPT_OFFLINE'
  check(verified_class='FOUNDER_REVIEWED_EXTERNAL_RECEIPT_OFFLINE'),
 claimed_independent_provider_authenticity boolean not null default false
  check(claimed_independent_provider_authenticity=false),
 attested_by uuid not null,
 attested_at timestamptz not null default clock_timestamp(),
 unique(handoff_id,receipt_id)
);
create index b8_g8_delivery_case_idx on public.b8_g8_manual_delivery_attestations(case_id,id desc);
create function private.b8_g8_delivery_sealed()
returns trigger language plpgsql security definer set search_path=''
as $b8$
begin raise exception 'B8_G8_DELIVERY_AUDIT_IMMUTABLE';end;
$b8$;
create trigger b8_g8_manual_delivery_immutable before update or delete
on public.b8_g8_manual_delivery_attestations for each row
execute function private.b8_g8_delivery_sealed();
revoke all on function private.b8_g8_delivery_sealed()
 from public,anon,authenticated;
alter table public.b8_g8_manual_delivery_attestations enable row level security;
revoke all on public.b8_g8_manual_delivery_attestations
 from public,anon,authenticated;
grant select,insert on public.b8_g8_manual_delivery_attestations to service_role;

-- Founder personally inspects attached evidence of external acceptance,
-- distinct from a Reporter simply attempting delivery.
create function public.jb_b8_g8_owner_attest_manual_delivery(
 p_handoff_id uuid,p_receipt_id uuid,p_verification_basis text
) returns bigint language plpgsql security definer set search_path=''
as $b8$
declare v_intent public.b8_g3_handoff_intents%rowtype;v_id bigint;
begin
 if not coalesce(private.current_owner_aal2(),false) then
  raise exception 'B8_OWNER_AAL2_REQUIRED';end if;
 select * into v_intent from public.b8_g3_handoff_intents
 where id=p_handoff_id;
 if not found then raise exception 'B8_G8_EXISTING_HANDOFF_REQUIRED';end if;
 -- Shared case lock serializes with any G4 public release/HIDE action.
 perform 1 from public.b8_cases where id=v_intent.case_id for update;
 if p_verification_basis is null or char_length(btrim(p_verification_basis))
 not between 12 and 500 then
  raise exception 'B8_G8_VERIFICATION_REASON_REQUIRED';end if;
 if not exists(select 1 from public.b8_private_upload_receipts r
 where r.id=p_receipt_id and r.case_id=v_intent.case_id)
 then raise exception 'B8_G8_CROSS_CASE_RECEIPT_DENIED';end if;
 if not exists(
  select 1 from public.b8_g3_handoff_observations o
  where o.intent_id=p_handoff_id
    and o.observation='UNVERIFIED_RECEIPT_ATTACHED'
    and o.evidence_receipt_id=p_receipt_id)
 then raise exception 'B8_G8_UNVERIFIED_PROVIDER_EVIDENCE_MUST_BE_ATTACHED';end if;
 insert into public.b8_g8_manual_delivery_attestations
 (case_id,handoff_id,receipt_id,verification_basis,attested_by)
 values(v_intent.case_id,p_handoff_id,p_receipt_id,btrim(p_verification_basis),auth.uid())
 returning id into v_id;
 return v_id;
end;
$b8$;
revoke all on function public.jb_b8_g8_owner_attest_manual_delivery(uuid,uuid,text)
 from public,anon,authenticated;
grant execute on function public.jb_b8_g8_owner_attest_manual_delivery(uuid,uuid,text)
 to authenticated;

-- The existing Owner-AAL2 publisher and NEWS Article authority are preserved.
-- Only the original unconditional freeze for these two status enums changes:
-- now it demands separate, same-Case Founder offline evidence attestation.
create or replace function public.jb_b8_g4_owner_release_public_projection(
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
 -- G8: Founder-audited offline external acceptance evidence ONLY.
 -- An attached private byte receipt or "composer opened" without the separate
 -- owner verification cannot unlock requested/awaiting public statuses.
 if p_status in('RECORDS_REQUESTED','AWAITING_RESPONSE') and
 not exists(select 1 from public.b8_g8_manual_delivery_attestations p
 where p.case_id=p_case_id and p.attested_at is not null)
 then raise exception 'B8_G4_NO_REAL_OFFICIAL_DISPATCH_PROOF';end if;
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


-- Original server public response remains an allowlisted dictionary, never
-- exposes handoff, reply claims, receipt identifiers or official's identity.
