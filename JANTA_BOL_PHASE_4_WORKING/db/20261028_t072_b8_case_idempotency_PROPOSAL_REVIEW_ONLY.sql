-- JANTA BOL P4-T072: REVIEW ONLY. DO NOT APPLY TO PRODUCTION.
-- Minimal additive idempotency contract for original B8 Owner create-case RPC.
-- Preserve existing jb_b8_g1_owner_create_case(text,text,text), its authority checks,
-- all old cases, role matrices, source evidence, PURLs, LIVE, advertising and audit.
-- Expected use by future protected client: generate request UUID ONCE before first
-- invocation, persist across timeout/unknown status, reuse key on retry.
-- If first transaction committed, same Owner/key/payload returns the exact same ID.
-- If first transaction failed/rolled back, request ledger and case both roll back.
-- Never infer idempotency from identical title: a fresh key creates a new case.

create table public.b8_owner_case_idempotency (
 owner_id uuid not null,
 request_key uuid not null,
 case_id uuid not null references public.b8_cases(id) on delete restrict,
 title text not null,
 area_label text not null,
 risk_lane text not null,
 created_at timestamptz not null default now(),
 primary key(owner_id,request_key)
);
alter table public.b8_owner_case_idempotency enable row level security;
revoke all on public.b8_owner_case_idempotency from public,anon,authenticated;
grant select,insert,update,delete on public.b8_owner_case_idempotency to service_role;

create function public.jb_b8_g1_owner_create_case_idempotent(
 p_request_key uuid,p_title text,p_area_label text,p_risk_lane text
) returns uuid language plpgsql security definer set search_path=''
as $safe$
declare
 v_owner uuid;
 v_id uuid;
 v_existing record;
 v_title text:=pg_catalog.btrim(p_title);
 v_area text:=pg_catalog.btrim(p_area_label);
begin
 -- No lookup/return of an old ID before fresh current Owner/AAL2 authorization.
 if not coalesce(private.current_owner_aal2(),false) then
  raise exception 'B8_OWNER_AAL2_REQUIRED';end if;
 v_owner:=auth.uid();
 if v_owner is null or p_request_key is null
 then raise exception 'B8_REQUEST_KEY_REQUIRED';end if;
 if p_title is null or pg_catalog.char_length(v_title) not between 12 and 200
 or p_area_label is null or pg_catalog.char_length(v_area) not between 2 and 120
 or coalesce(p_risk_lane,'') not in ('R0','R1','R2') then
  raise exception 'B8_INVALID_CASE_DETAILS';end if;

 -- PostgreSQL transaction-scoped guard serializes SAME actor+request key.
 -- 64-bit hash collisions only over-serialize independent requests, do not
 -- change ownership or payload binding; all decisions use exact primary key.
 perform pg_catalog.pg_advisory_xact_lock(
   pg_catalog.hashtextextended(v_owner::text||':'||p_request_key::text,0));
 select r.case_id,r.title,r.area_label,r.risk_lane
 into v_existing
 from public.b8_owner_case_idempotency r
 where r.owner_id=v_owner and r.request_key=p_request_key
 for update;
 if found then
  if v_existing.title<>v_title or v_existing.area_label<>v_area
     or v_existing.risk_lane<>p_risk_lane then
    raise exception 'B8_IDEMPOTENCY_KEY_PAYLOAD_MISMATCH';end if;
  return v_existing.case_id;
 end if;

 -- Existing SECURITY DEFINER Owner RPC runs its original validation/security.
 -- Case and ledger INSERT share one transaction: any error -> neither commits.
 v_id:=public.jb_b8_g1_owner_create_case(v_title,v_area,p_risk_lane);
 insert into public.b8_owner_case_idempotency
   (owner_id,request_key,case_id,title,area_label,risk_lane)
 values(v_owner,p_request_key,v_id,v_title,v_area,p_risk_lane);
 return v_id;
end;
$safe$;
revoke all on function public.jb_b8_g1_owner_create_case_idempotent(uuid,text,text,text)
 from public,anon,authenticated;
grant execute on function public.jb_b8_g1_owner_create_case_idempotent(uuid,text,text,text)
 to authenticated;
