-- B8 G3 CP04 — late/on-time official RESPONSE Claim intake, private immutable.
-- REVIEW ONLY / NOT LIVE. A Reporter-uploaded document never automatically
-- proves an official replied, and no provider delivery date is invented.
create table public.b8_g3_official_reply_claims(
 id uuid primary key default gen_random_uuid(),
 handoff_id uuid not null references public.b8_g3_handoff_intents(id) on delete restrict,
 case_id uuid not null references public.b8_cases(id) on delete restrict,
 evidence_receipt_id uuid not null references public.b8_private_upload_receipts(id) on delete restrict,
 submitted_by uuid not null,
 claimed_received_at timestamptz not null,
 claimed_office text not null check(char_length(btrim(claimed_office)) between 3 and 160),
 reply_summary text not null check(char_length(btrim(reply_summary)) between 12 and 1400),
 state text not null default 'REPORTER_CLAIM_UNVERIFIED'
  check(state='REPORTER_CLAIM_UNVERIFIED'),
 created_at timestamptz not null default now(),
 unique(handoff_id,evidence_receipt_id),
 check(claimed_received_at<=created_at)
);
create index b8_g3_official_reply_claims_case_idx on public.b8_g3_official_reply_claims(case_id,created_at);
create trigger b8_g3_reply_claims_immutable before update or delete
 on public.b8_g3_official_reply_claims
 for each row execute function private.b8_g3_cp03_immutable_dispatch();
alter table public.b8_g3_official_reply_claims enable row level security;
revoke all on public.b8_g3_official_reply_claims from public,anon,authenticated;
grant select,insert,update,delete on public.b8_g3_official_reply_claims to service_role;

create function public.jb_b8_g3_reporter_claim_official_reply(
 p_handoff_id uuid,p_receipt_id uuid,p_claimed_office text,
 p_claimed_received_at timestamptz,p_reply_summary text
) returns uuid language plpgsql security definer set search_path=''
as $b8$
declare v_h public.b8_g3_handoff_intents%rowtype;v_id uuid;
begin
 select * into v_h from public.b8_g3_handoff_intents where id=p_handoff_id for share;
 if not found or v_h.reporter_user_id is distinct from auth.uid() then
  raise exception 'B8_G3_OWN_HANDOFF_REQUIRED';end if;
 perform 1 from public.b8_case_reporter_grants
 where case_id=v_h.case_id and reporter_user_id=auth.uid() for update;
 if not coalesce(private.b8_g1_reporter_case_allowed(v_h.case_id),false) then
  raise exception 'B8_ASSIGNED_ACTIVE_REPORTER_REQUIRED';end if;
 if p_claimed_received_at is null or p_claimed_received_at>now()
 or p_claimed_received_at<now()-interval '10 years'
 or p_claimed_office is null or char_length(btrim(p_claimed_office)) not between 3 and 160
 or p_reply_summary is null or char_length(btrim(p_reply_summary)) not between 12 and 1400 then
  raise exception 'B8_G3_INVALID_REPLY_CLAIM';end if;
 if not exists(
  select 1 from public.b8_private_upload_receipts r
  join public.b8_private_upload_intents i on i.id=r.intent_id
  where r.id=p_receipt_id and r.case_id=v_h.case_id
    and i.reporter_user_id=auth.uid() and i.case_id=v_h.case_id
 ) then raise exception 'B8_G3_REPLY_SAME_CASE_PRIVATE_BYTES_REQUIRED';end if;
 insert into public.b8_g3_official_reply_claims
 (handoff_id,case_id,evidence_receipt_id,submitted_by,
  claimed_office,claimed_received_at,reply_summary)
 values(v_h.id,v_h.case_id,p_receipt_id,auth.uid(),
  btrim(p_claimed_office),p_claimed_received_at,btrim(p_reply_summary))
 returning id into v_id;
 return v_id;
end;
$b8$;

create function public.jb_b8_g3_owner_reply_claim_summary(p_question_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $b8$
declare v jsonb;
begin
 if not coalesce(private.current_owner_aal2(),false) then
  raise exception 'B8_OWNER_AAL2_REQUIRED';end if;
 select jsonb_build_object('case_id',i.case_id,'question_id',i.question_id,
 'claimed_official_reply_count',
  (select count(*) from public.b8_g3_official_reply_claims c
   where c.handoff_id=i.id),
 'official_reply_independently_verified',false,
 'provider_external_delivery_verified',false,
 'accuracy_class','REPORTER_CLAIM_UNVERIFIED',
 'next_step','INDEPENDENT_REVIEW_REQUIRED')
 into v from public.b8_g3_handoff_intents i where i.question_id=p_question_id;
 if v is null then raise exception 'B8_G3_EXISTING_HANDOFF_REQUIRED';end if;
 return v;
end;
$b8$;
revoke all on function public.jb_b8_g3_reporter_claim_official_reply(uuid,uuid,text,timestamptz,text)
 from public,anon,authenticated;
revoke all on function public.jb_b8_g3_owner_reply_claim_summary(uuid)
 from public,anon,authenticated;
grant execute on function public.jb_b8_g3_reporter_claim_official_reply(uuid,uuid,text,timestamptz,text)
 to authenticated;
grant execute on function public.jb_b8_g3_owner_reply_claim_summary(uuid)
 to authenticated;
-- No external send/response verification; immutable claim with linked PRIVATE bytes only.
