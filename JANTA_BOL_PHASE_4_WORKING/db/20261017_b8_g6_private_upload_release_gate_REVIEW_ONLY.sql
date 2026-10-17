-- JANTA BOL B8 G6 — Release-ready PRIVATE evidence upload enablement.
-- REVIEW ONLY; apply only AFTER G1..G5 on DISPOSABLE PG17.
-- Existing G2 gateway/upload limits/receipts preserved; this is additive.
-- Feature stays OFF by default even if source UI + Edge are deployed.
-- Never run directly on production without Founder release approval and backup proof.
create table public.b8_g6_release_controls (
 feature text primary key check(feature='PRIVATE_EVIDENCE_UPLOAD'),
 enabled boolean not null default false,
 changed_by uuid,
 changed_at timestamptz not null default now()
);
insert into public.b8_g6_release_controls(feature,enabled)
values ('PRIVATE_EVIDENCE_UPLOAD',false);
create table public.b8_g6_release_events (
 id bigint generated always as identity primary key,
 feature text not null check(feature='PRIVATE_EVIDENCE_UPLOAD'),
 from_enabled boolean not null,
 to_enabled boolean not null,
 reason text not null check(char_length(btrim(reason)) between 12 and 500),
 changed_by uuid not null,
 changed_at timestamptz not null default now(),
 check(from_enabled is distinct from to_enabled)
);
create function private.b8_g6_seal_release_event()
returns trigger language plpgsql security definer set search_path=''
as $b8$
begin raise exception 'B8_G6_RELEASE_AUDIT_IMMUTABLE';end;
$b8$;
create trigger b8_g6_release_events_immutable before update or delete
on public.b8_g6_release_events for each row
execute function private.b8_g6_seal_release_event();
revoke all on function private.b8_g6_seal_release_event()
from public,anon,authenticated;
alter table public.b8_g6_release_controls enable row level security;
alter table public.b8_g6_release_events enable row level security;
revoke all on public.b8_g6_release_controls,public.b8_g6_release_events
 from public,anon,authenticated;
grant select,update on public.b8_g6_release_controls to service_role;
grant select,insert on public.b8_g6_release_events to service_role;

-- Release is a Founder-only, AAL2 protected, atomic change and private audit.
create function public.jb_b8_g6_owner_set_private_upload(
 p_enable boolean,p_reason text
) returns boolean language plpgsql security definer set search_path=''
as $b8$
declare v_old boolean;
begin
 if not coalesce(private.current_owner_aal2(),false) then
   raise exception 'B8_OWNER_AAL2_REQUIRED';end if;
 if p_enable is null or p_reason is null or
  char_length(btrim(p_reason)) not between 12 and 500
 then raise exception 'B8_G6_RELEASE_REASON_REQUIRED';end if;
 select enabled into v_old from public.b8_g6_release_controls
 where feature='PRIVATE_EVIDENCE_UPLOAD' for update;
 if not found then raise exception 'B8_G6_RELEASE_CONTROL_MISSING';end if;
 if v_old is not distinct from p_enable then
   raise exception 'B8_G6_RELEASE_NO_CHANGE';end if;
 update public.b8_g6_release_controls
 set enabled=p_enable,changed_by=auth.uid(),changed_at=clock_timestamp()
 where feature='PRIVATE_EVIDENCE_UPLOAD';
 insert into public.b8_g6_release_events(
 feature,from_enabled,to_enabled,reason,changed_by)
 values('PRIVATE_EVIDENCE_UPLOAD',v_old,p_enable,btrim(p_reason),auth.uid());
 return p_enable;
end;
$b8$;

-- Reporter readiness can only reveal a scope-checked boolean. It does not
-- disclose another private case, evidence filenames or owner state.
create function public.jb_b8_g6_reporter_private_upload_readiness(p_case_id uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $b8$
declare v_can boolean;v_open boolean;
begin
 v_can=coalesce(private.b8_g1_reporter_case_allowed(p_case_id),false);
 select enabled into v_open from public.b8_g6_release_controls
 where feature='PRIVATE_EVIDENCE_UPLOAD';
 return jsonb_build_object('case_id',p_case_id,
  'allowed',coalesce(v_can,false) and coalesce(v_open,false),
  'max_bytes',8388608,'truth','PRIVATE_BYTES_ONLY_NOT_OFFICIAL_AUTHENTICITY');
end;
$b8$;

-- Race safety: shared lock during intent/receipt insert serializes with
-- Founder toggle. Disabled immediately blocks new uploads and finalization,
-- but orphan cleanup/audit remains possible even when disabled.
create function private.b8_g6_upload_admission_guard()
returns trigger language plpgsql security definer set search_path=''
as $b8$
declare v_open boolean;
begin
 select enabled into v_open from public.b8_g6_release_controls
 where feature='PRIVATE_EVIDENCE_UPLOAD' for share;
 if coalesce(v_open,false) is not true then
   raise exception 'B8_G6_PRIVATE_UPLOAD_FOUNDER_RELEASE_DISABLED';end if;
 return new;
end;
$b8$;
create trigger b8_g6_intent_admission before insert
 on public.b8_private_upload_intents for each row
 execute function private.b8_g6_upload_admission_guard();
create trigger b8_g6_receipt_finalization_admission before insert
 on public.b8_private_upload_receipts for each row
 execute function private.b8_g6_upload_admission_guard();
revoke all on function private.b8_g6_upload_admission_guard()
 from public,anon,authenticated;

revoke all on function public.jb_b8_g6_owner_set_private_upload(boolean,text)
from public,anon,authenticated;
grant execute on function public.jb_b8_g6_owner_set_private_upload(boolean,text)
to authenticated;
revoke all on function public.jb_b8_g6_reporter_private_upload_readiness(uuid)
from public,anon,authenticated;
grant execute on function public.jb_b8_g6_reporter_private_upload_readiness(uuid)
to authenticated;
-- No anon public access; no user-direct Storage policies.
