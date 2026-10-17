-- B8 G2 CP02 (REVIEW ONLY): Non-invasive fail-closed Article hard-delete guard.
-- Applies ONLY to Article IDs linked in B8. Unlinked News lifecycle unchanged.
-- This is a new trigger on the existing Article table, not a rewrite of B0-B6.
-- Legal disposition will require a separately audited, genuine evidence preservation gate.
-- No private Article/source bytes are copied into new public tables.

create table public.b8_case_legal_hold_events (
  id bigint generated always as identity primary key,
  case_id uuid not null references public.b8_cases(id) on delete restrict,
  action text not null check (action in ('HOLD_SET','HOLD_REAFFIRMED')),
  reason text not null check (char_length(btrim(reason)) between 12 and 500),
  action_by uuid not null,
  created_at timestamptz not null default now()
);
create index b8_case_hold_history_case_idx on public.b8_case_legal_hold_events(case_id,created_at,id);

create function private.b8_g2_cp02_immutable_hold()
returns trigger language plpgsql security definer set search_path=''
as $b8$
begin
 raise exception 'B8_HOLD_EVENT_IMMUTABLE';
end;
$b8$;
create trigger b8_hold_events_immutable before update or delete
 on public.b8_case_legal_hold_events
 for each row execute function private.b8_g2_cp02_immutable_hold();

alter table public.b8_case_legal_hold_events enable row level security;
revoke all on public.b8_case_legal_hold_events from public,anon,authenticated;
grant select,insert,update,delete on public.b8_case_legal_hold_events to service_role;
revoke all on function private.b8_g2_cp02_immutable_hold() from public,anon,authenticated;

-- OWNER-AAL2 may reaffirm a case legal hold without ever silently releasing it.
-- No direct release or destructive bypass in this G2 slice (safe before full source preservation).
create function public.jb_b8_g2_owner_assert_hold(p_case_id uuid,p_reason text)
returns bigint language plpgsql security definer set search_path=''
as $b8$
declare v_id bigint;
begin
 if not coalesce(private.current_owner_aal2(),false) then
  raise exception 'B8_OWNER_AAL2_REQUIRED';end if;
 if not exists(select 1 from public.b8_cases where id=p_case_id) then
  raise exception 'B8_EXISTING_CASE_REQUIRED';end if;
 if p_reason is null or char_length(btrim(p_reason)) not between 12 and 500 then
  raise exception 'B8_HOLD_REASON_REQUIRED';end if;
 insert into public.b8_case_legal_hold_events(case_id,action,reason,action_by)
 values(p_case_id,'HOLD_REAFFIRMED',btrim(p_reason),auth.uid())
 returning id into v_id;
 return v_id;
end;
$b8$;
revoke all on function public.jb_b8_g2_owner_assert_hold(uuid,text)
 from public,anon,authenticated;
grant execute on function public.jb_b8_g2_owner_assert_hold(uuid,text)
 to authenticated;

-- Hard-delete of a linked canonical Article would cascade old article_sources,
-- article_versions and verification_history. Never permit that silently.
-- Existing Article INSERT/UPDATE lifecycle and unlinked hard-delete are unaffected.
create function private.b8_g2_cp02_guard_article_hard_delete()
returns trigger language plpgsql security definer set search_path=''
as $b8$
begin
 if exists(select 1 from public.b8_case_article_links l where l.article_id=old.id) then
  raise exception 'B8_LINKED_ARTICLE_REQUIRES_CONTROLLED_DISPOSITION'
    using errcode='P0001';
 end if;
 return old;
end;
$b8$;
create trigger b8_guard_linked_article_hard_delete
 before delete on public.articles
 for each row execute function private.b8_g2_cp02_guard_article_hard_delete();
revoke all on function private.b8_g2_cp02_guard_article_hard_delete()
 from public,anon,authenticated;

-- ATTENTION: This guard must be independently tested against the ACTUAL Article
-- permanent-delete flow before production deployment; it blocks all linked hard deletes,
-- including Founder requests, until a lawful preserved-bytes disposition protocol is built.
-- A linked Article can still be unpublished/corrected by original Founder-only flow.
-- G2 CP02 alone does not claim a lawful release/erasure capability is implemented.
