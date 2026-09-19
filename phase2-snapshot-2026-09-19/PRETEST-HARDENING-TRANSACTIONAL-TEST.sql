-- JANTA BOL Phase 2 — PRE-TEST HARDENING CANDIDATE
-- STATUS: NOT APPLIED TO PRODUCTION.
-- Reason: contains material public-access / RLS authority changes that require Founder approval.
-- Prepared during pre-test so fixes can be reviewed and applied atomically later.
-- LIVE RE-AUDIT 2026-09-06: section A public article column grants are already present in production; this rollback-only file is for validating the full current candidate before any approved commit.

begin;

-- ============================================================
-- A. PUBLIC PUBLISHED-ARTICLE ACCESS WITHOUT PRIVATE COLUMN LEAK
-- ============================================================
-- Existing RLS already limits anon rows to status='published'.
-- Grant anon only the columns used by the public website/article page.
revoke all on table public.articles from anon;
grant select (
  id, slug, title, body, excerpt,
  cover_image_url, video_url, additional_media_urls,
  public_attribution,
  category, geography_level, district, location, reporter_name,
  status, published_at, created_at, updated_at, version,
  news_date, news_time, breaking, top_story
) on table public.articles to anon;

-- Deliberately NOT granted to anon:
-- source_name, source_url, created_by, updated_by, saved_at,
-- deleted_at, previous_status and any future private columns.


-- ============================================================
-- A2. PUBLIC INTAKE LEAST-PRIVILEGE GRANTS
-- ============================================================
-- Supabase project defaults had broad anon CRUD table grants. RLS currently
-- blocks private rows, but table-level authority should still be minimal.
-- Public visitors only need event intake + grievance intake here.
revoke all on table public.analytics_events from anon;
grant insert on table public.analytics_events to anon;

revoke all on table public.grievances from anon;
grant insert on table public.grievances to anon;

revoke all on table public.compliance_tasks from anon;
revoke all on table public.grievance_evidence from anon;
revoke all on table public.live_sessions from anon;
revoke all on table public.live_updates from anon;
revoke all on table public.reporters from anon;
revoke all on table public.social_distribution from anon;

-- ============================================================
-- B. ANALYTICS VIEW HARDENING
-- ============================================================
-- Prevent SECURITY DEFINER view from bypassing caller RLS.
alter view public.article_stats set (security_invoker=true);
revoke all on public.article_stats from anon;
grant select on public.article_stats to authenticated;

-- ============================================================
-- C. OWNER HELPER HARDENING
-- ============================================================
-- This helper only needs caller permissions/RLS; SECURITY DEFINER is unnecessary.
create or replace function public.jb_is_owner()
returns boolean
language sql
stable
security invoker
set search_path=public
as $$
  select exists(
    select 1
    from public.user_roles
    where user_id=auth.uid()
      and role='owner'
  )
$$;

revoke all on function public.jb_is_owner() from public, anon;
grant execute on function public.jb_is_owner() to authenticated;

-- ============================================================
-- D. OWNER AAL2 BACKEND/RLS ENFORCEMENT
-- ============================================================
-- Frontend hiding is not sufficient. Owner private/admin authority must also
-- reject an AAL1 token at the database policy layer.
-- A revoked session's access-token JWT can remain cryptographically valid until
-- its exp time, so sensitive database authority also checks session_id against
-- auth.sessions. Supabase documents session_id as the auth.sessions primary key.
create or replace function private.current_session_id()
returns uuid
language plpgsql
stable
security definer
set search_path='auth','pg_temp'
as $$
declare
  v_raw text:=coalesce(auth.jwt()->>'session_id','');
begin
  if v_raw !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return null;
  end if;
  return v_raw::uuid;
exception when others then
  return null;
end;
$$;

revoke all on function private.current_session_id() from public, anon;
grant execute on function private.current_session_id() to authenticated;

create or replace function private.current_session_active()
returns boolean
language sql
stable
security definer
set search_path='auth','pg_temp'
as $$
  select exists(
    select 1
    from auth.sessions s
    where s.id=private.current_session_id()
      and s.user_id=auth.uid()
  )
$$;

revoke all on function private.current_session_active() from public, anon;
grant execute on function private.current_session_active() to authenticated;

create or replace function private.current_owner_aal2()
returns boolean
language sql
stable
security definer
set search_path='public','private','auth','pg_temp'
as $$
  select private.current_app_role()='owner'::public.app_role
     and coalesce(auth.jwt()->>'aal','')='aal2'
     and private.current_session_active()
$$;

revoke all on function private.current_owner_aal2() from public, anon;
grant execute on function private.current_owner_aal2() to authenticated;

-- Recent step-up protection for highly sensitive actions (#122).
-- Supabase JWT amr entries carry authentication method + timestamp.
create or replace function private.current_owner_recent_mfa(max_age_seconds integer default 600)
returns boolean
language plpgsql
stable
security definer
set search_path='public','private','auth','pg_temp'
as $$
declare
  v_ts bigint;
  v_now bigint:=floor(extract(epoch from now()))::bigint;
  v_max integer:=greatest(0,least(coalesce(max_age_seconds,600),3600));
begin
  if not private.current_owner_aal2() then return false; end if;

  select (x->>'timestamp')::bigint
  into v_ts
  from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]'::jsonb)) x
  where x->>'method' in ('totp','phone')
    and coalesce(x->>'timestamp','') ~ '^[0-9]+$'
  order by (x->>'timestamp')::bigint desc
  limit 1;

  if v_ts is null then return false; end if;
  -- Allow small forward clock skew, but never accept an old MFA event.
  return (v_now-v_ts) between -60 and v_max;
exception when others then
  return false;
end;
$$;

revoke all on function private.current_owner_recent_mfa(integer) from public, anon;
grant execute on function private.current_owner_recent_mfa(integer) to authenticated;

-- Recovery-key rotation/activation is a sensitive security change. Preserve the
-- existing locked RPC semantics but add server-side recent-MFA + active-session
-- enforcement. Emergency VERIFY remains separate and intentionally AAL1-capable.
create or replace function public.jb_set_owner_recovery_key(p_recovery_key text)
returns void
language plpgsql
security definer
set search_path='public','private','auth','pg_temp'
as $$
declare
  v_uid uuid:=auth.uid();
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not private.current_owner_recent_mfa(600) then raise exception 'RECENT_MFA_REQUIRED'; end if;

  perform private.set_owner_recovery_key(v_uid,p_recovery_key);

  insert into public.audit_logs(actor_user_id,action,record_type,record_id,metadata)
  values(v_uid,'owner_recovery_key_set','security',v_uid::text,
    jsonb_build_object('aal','aal2','recent_mfa',true));
end;
$$;

revoke all on function public.jb_set_owner_recovery_key(text) from public, anon;
grant execute on function public.jb_set_owner_recovery_key(text) to authenticated;

-- OWNER SESSION LABELS + READ-ONLY ACTIVE SESSION PANEL
create table if not exists public.owner_session_labels(
  session_id uuid primary key,
  user_id uuid not null,
  label text not null check(char_length(label) between 1 and 80),
  updated_at timestamptz not null default now()
);

alter table public.owner_session_labels enable row level security;
revoke all on table public.owner_session_labels from anon;
grant select,insert,update,delete on table public.owner_session_labels to authenticated;

drop policy if exists owner_session_labels_aal2 on public.owner_session_labels;
create policy owner_session_labels_aal2
on public.owner_session_labels for all to authenticated
using (user_id=auth.uid() and private.current_owner_aal2())
with check (user_id=auth.uid() and private.current_owner_aal2());

create or replace function public.jb_owner_list_sessions()
returns table(
  session_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  refreshed_at timestamp,
  user_agent text,
  ip text,
  aal text,
  factor_id uuid,
  not_after timestamptz,
  device_label text
)
language plpgsql
security definer
set search_path='public','private','auth','pg_temp'
as $$
declare
  v_uid uuid:=auth.uid();
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not private.current_owner_aal2() then raise exception 'OWNER_AAL2_REQUIRED'; end if;

  return query
  select
    s.id, s.created_at, s.updated_at, s.refreshed_at, s.user_agent,
    s.ip::text, s.aal::text, s.factor_id, s.not_after, l.label
  from auth.sessions s
  left join public.owner_session_labels l
    on l.session_id=s.id and l.user_id=s.user_id
  where s.user_id=v_uid
  order by coalesce(s.refreshed_at,s.updated_at::timestamp) desc;
end;
$$;

revoke all on function public.jb_owner_list_sessions() from public, anon;
grant execute on function public.jb_owner_list_sessions() to authenticated;

-- Revoke one selected OTHER session. Current-session logout must use the normal
-- Auth local-logout path so browser storage and server session stay in sync.
create or replace function public.jb_owner_revoke_session(p_session_id uuid)
returns boolean
language plpgsql
security definer
set search_path='public','private','auth','pg_temp'
as $$
declare
  v_uid uuid:=auth.uid();
  v_current uuid:=private.current_session_id();
  v_deleted uuid;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not private.current_owner_recent_mfa(600) then raise exception 'RECENT_MFA_REQUIRED'; end if;
  if p_session_id is null then raise exception 'SESSION_ID_REQUIRED'; end if;
  if p_session_id=v_current then raise exception 'USE_LOCAL_LOGOUT_FOR_CURRENT'; end if;

  delete from auth.sessions
  where id=p_session_id and user_id=v_uid
  returning id into v_deleted;

  if v_deleted is null then raise exception 'SESSION_NOT_FOUND'; end if;

  delete from public.owner_session_labels
  where session_id=p_session_id and user_id=v_uid;

  insert into public.audit_logs(actor_user_id,action,record_type,record_id,metadata)
  values(v_uid,'security_session_revoked','security',p_session_id::text,
    jsonb_build_object('target_session_id',p_session_id));

  return true;
end;
$$;

revoke all on function public.jb_owner_revoke_session(uuid) from public, anon;
grant execute on function public.jb_owner_revoke_session(uuid) to authenticated;

-- ARTICLES: preserve non-owner staff model, but Owner path requires AAL2.
drop policy if exists staff_can_create_articles on public.articles;
create policy staff_can_create_articles
on public.articles for insert to authenticated
with check (
  private.current_app_role() = any(array[
    'owner'::public.app_role,
    'admin'::public.app_role,
    'editor'::public.app_role,
    'reporter'::public.app_role
  ])
  and (created_by is null or created_by=auth.uid())
  and (
    private.current_app_role()<>'owner'::public.app_role
    or private.current_owner_aal2()
  )
);

drop policy if exists staff_can_read_all_articles on public.articles;
create policy staff_can_read_all_articles
on public.articles for select to authenticated
using (
  private.current_app_role() = any(array[
    'owner'::public.app_role,
    'admin'::public.app_role,
    'editor'::public.app_role,
    'reporter'::public.app_role
  ])
  and (
    private.current_app_role()<>'owner'::public.app_role
    or private.current_owner_aal2()
  )
);

drop policy if exists editorial_staff_can_update_articles on public.articles;
create policy editorial_staff_can_update_articles
on public.articles for update to authenticated
using (
  private.current_app_role() = any(array[
    'owner'::public.app_role,
    'admin'::public.app_role,
    'editor'::public.app_role
  ])
  and (
    private.current_app_role()<>'owner'::public.app_role
    or private.current_owner_aal2()
  )
)
with check (
  private.current_app_role() = any(array[
    'owner'::public.app_role,
    'admin'::public.app_role,
    'editor'::public.app_role
  ])
  and (
    private.current_app_role()<>'owner'::public.app_role
    or private.current_owner_aal2()
  )
);

drop policy if exists owner_only_delete_articles on public.articles;
create policy owner_only_delete_articles
on public.articles for delete to authenticated
using (private.current_owner_aal2());

-- Permanent Delete is Owner-only, Trash-only and requires recent MFA step-up.
create or replace function public.jb_owner_permanent_delete_article(p_article_id uuid)
returns boolean
language plpgsql
security definer
set search_path='public','private','auth','pg_temp'
as $$
declare
  v_uid uuid:=auth.uid();
  v_deleted uuid;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not private.current_owner_recent_mfa(600) then raise exception 'RECENT_MFA_REQUIRED'; end if;
  if p_article_id is null then raise exception 'ARTICLE_ID_REQUIRED'; end if;

  delete from public.articles
  where id=p_article_id and status='deleted'::public.article_status
  returning id into v_deleted;

  if v_deleted is null then raise exception 'TRASH_ARTICLE_REQUIRED'; end if;

  insert into public.audit_logs(actor_user_id,action,record_type,record_id,metadata)
  values(v_uid,'security_permanent_delete_article','security',p_article_id::text,
    jsonb_build_object('article_id',p_article_id,'irreversible',true));

  return true;
end;
$$;

revoke all on function public.jb_owner_permanent_delete_article(uuid) from public, anon;
grant execute on function public.jb_owner_permanent_delete_article(uuid) to authenticated;

-- PRIVATE EDITORIAL SOURCE / VERIFICATION HISTORY
drop policy if exists owner_manage_sources on public.article_sources;
create policy owner_manage_sources
on public.article_sources for all to authenticated
using (private.current_owner_aal2())
with check (private.current_owner_aal2());

drop policy if exists owner_insert_verification on public.verification_history;
create policy owner_insert_verification
on public.verification_history for insert to authenticated
with check (private.current_owner_aal2());

drop policy if exists owner_read_verification on public.verification_history;
create policy owner_read_verification
on public.verification_history for select to authenticated
using (private.current_owner_aal2());

-- OWNER ROLE AUTHORITY
drop policy if exists owner_admin_can_read_roles on public.user_roles;
create policy owner_admin_can_read_roles
on public.user_roles for select to authenticated
using (
  private.current_app_role()='admin'::public.app_role
  or private.current_owner_aal2()
);

drop policy if exists owner_can_manage_roles on public.user_roles;
create policy owner_can_manage_roles
on public.user_roles for all to authenticated
using (private.current_owner_recent_mfa(600))
with check (private.current_owner_recent_mfa(600));

-- OWNER-ONLY PHASE-2 TABLES
-- Public grievance/analytics intake policies remain separate and unchanged.
do $$
declare t text;
begin
  foreach t in array array[
    'audit_logs','social_distribution','reporters','live_sessions',
    'live_updates','grievances','grievance_evidence','compliance_tasks'
  ] loop
    execute format('drop policy if exists owner_all on public.%I',t);
    execute format(
      'create policy owner_all on public.%I for all to authenticated using (private.current_owner_aal2()) with check (private.current_owner_aal2())',
      t
    );
  end loop;
end $$;

-- Existing dedicated owner audit policies also need AAL2.
drop policy if exists owner_insert_audit on public.audit_logs;
create policy owner_insert_audit
on public.audit_logs for insert to authenticated
with check (private.current_owner_aal2());

drop policy if exists owner_read_audit on public.audit_logs;
create policy owner_read_audit
on public.audit_logs for select to authenticated
using (private.current_owner_aal2());

-- Owner analytics read requires AAL2; public event INSERT stays unchanged.
drop policy if exists owner_analytics_read on public.analytics_events;
create policy owner_analytics_read
on public.analytics_events for select to authenticated
using (private.current_owner_aal2());

-- STORAGE OWNER MANAGEMENT REQUIRES AAL2.
drop policy if exists owner_manage_private_editorial on storage.objects;
create policy owner_manage_private_editorial
on storage.objects for all to authenticated
using (bucket_id='private-editorial' and private.current_owner_aal2())
with check (bucket_id='private-editorial' and private.current_owner_aal2());

drop policy if exists owner_manage_public_media on storage.objects;
create policy owner_manage_public_media
on storage.objects for all to authenticated
using (bucket_id='public-media' and private.current_owner_aal2())
with check (bucket_id='public-media' and private.current_owner_aal2());

drop policy if exists owner_read_private_editorial on storage.objects;
create policy owner_read_private_editorial
on storage.objects for select to authenticated
using (bucket_id='private-editorial' and private.current_owner_aal2());

-- ============================================================
-- E. #129 RECOVERY KEY PHYSICAL INTEGRITY CHECK RECORD
-- ============================================================
-- This table never stores, receives or replays the Recovery Key itself.
-- A check is bound to the current recovery key_version so rotation immediately
-- starts a fresh physical-check cycle until the new copies are confirmed safe.
create table if not exists public.owner_recovery_physical_checks(
  id bigint generated by default as identity primary key,
  user_id uuid not null,
  key_version integer not null,
  outcome text not null check(outcome in ('safe','rotated_replaced')),
  checked_at timestamptz not null default now(),
  next_due_at timestamptz not null,
  note text not null default ''
);

create index if not exists owner_recovery_physical_checks_user_version_idx
on public.owner_recovery_physical_checks(user_id,key_version,checked_at desc);

alter table public.owner_recovery_physical_checks enable row level security;
-- No direct Data API access is required. Founder uses the checked RPCs below.
revoke all on table public.owner_recovery_physical_checks from anon, authenticated;

create or replace function public.jb_owner_recovery_physical_status()
returns table(
  key_version integer,
  last_checked_at timestamptz,
  next_due_at timestamptz,
  due boolean,
  outcome text
)
language plpgsql
security definer
set search_path='public','private','auth','pg_temp'
as $$
declare
  v_uid uuid:=auth.uid();
  v_version integer;
  v_checked timestamptz;
  v_due_at timestamptz;
  v_outcome text;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not private.current_owner_aal2() then raise exception 'OWNER_AAL2_REQUIRED'; end if;

  select c.key_version into v_version
  from private.owner_recovery_credentials c
  where c.user_id=v_uid and c.is_active=true;

  if v_version is null then raise exception 'ACTIVE_RECOVERY_KEY_REQUIRED'; end if;

  select p.checked_at,p.next_due_at,p.outcome
  into v_checked,v_due_at,v_outcome
  from public.owner_recovery_physical_checks p
  where p.user_id=v_uid and p.key_version=v_version
  order by p.checked_at desc
  limit 1;

  return query select
    v_version,
    v_checked,
    v_due_at,
    (v_checked is null or v_due_at<=now()),
    v_outcome;
end;
$$;

revoke all on function public.jb_owner_recovery_physical_status() from public, anon;
grant execute on function public.jb_owner_recovery_physical_status() to authenticated;

create or replace function public.jb_owner_confirm_recovery_physical_check(p_outcome text)
returns table(
  key_version integer,
  last_checked_at timestamptz,
  next_due_at timestamptz,
  due boolean,
  outcome text
)
language plpgsql
security definer
set search_path='public','private','auth','pg_temp'
as $$
declare
  v_uid uuid:=auth.uid();
  v_version integer;
  v_checked timestamptz:=now();
  v_due timestamptz;
  v_outcome text:=lower(coalesce(p_outcome,''));
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not private.current_owner_aal2() then raise exception 'OWNER_AAL2_REQUIRED'; end if;
  if v_outcome not in ('safe','rotated_replaced') then raise exception 'INVALID_OUTCOME'; end if;

  select c.key_version into v_version
  from private.owner_recovery_credentials c
  where c.user_id=v_uid and c.is_active=true;

  if v_version is null then raise exception 'ACTIVE_RECOVERY_KEY_REQUIRED'; end if;

  v_due:=v_checked+interval '6 months';

  insert into public.owner_recovery_physical_checks(
    user_id,key_version,outcome,checked_at,next_due_at
  ) values(v_uid,v_version,v_outcome,v_checked,v_due);

  insert into public.audit_logs(actor_user_id,action,record_type,record_id,metadata)
  values(v_uid,'security_recovery_physical_check','security',v_uid::text,
    jsonb_build_object('outcome',v_outcome,'key_version',v_version,'next_due_at',v_due));

  return query select v_version,v_checked,v_due,false,v_outcome;
end;
$$;

revoke all on function public.jb_owner_confirm_recovery_physical_check(text) from public, anon;
grant execute on function public.jb_owner_confirm_recovery_physical_check(text) to authenticated;

-- COMMIT ONLY AFTER FOUNDER APPROVAL + TRANSACTIONAL PRE-TEST.


-- ============================================================
-- TRANSACTIONAL PRE-TEST ASSERTIONS (ROLLBACK ONLY)
-- ============================================================
-- Synthetic rollback-only context: avoid hardcoded Founder/session identifiers.
create temporary table jb_pretest_ctx(
  owner_id uuid not null,
  current_session_id uuid not null,
  other_session_id uuid not null
) on commit drop;

insert into jb_pretest_ctx(owner_id,current_session_id,other_session_id)
select ur.user_id,gen_random_uuid(),gen_random_uuid()
from public.user_roles ur
where ur.role='owner'::public.app_role
order by ur.user_id
limit 1;

do $$
begin
  if not exists(select 1 from jb_pretest_ctx) then
    raise exception 'PRETEST_OWNER_REQUIRED';
  end if;
end $$;

grant select on jb_pretest_ctx to authenticated;

insert into auth.sessions(id,user_id,created_at,updated_at,refreshed_at,user_agent)
select current_session_id,owner_id,now(),now(),now()::timestamp,'JB PRETEST CURRENT'
from jb_pretest_ctx;

insert into auth.sessions(id,user_id,created_at,updated_at,refreshed_at,user_agent)
select other_session_id,owner_id,now(),now(),now()::timestamp,'JB PRETEST OTHER'
from jb_pretest_ctx;

-- 1) Public sees published rows but not private source columns/view.
set local role anon;
select 'anon_published_rows' as check_name, count(*)::text as value
from public.articles where status='published'::public.article_status;
reset role;
select 'anon_source_name_grant' as check_name,
       has_column_privilege('anon','public.articles','source_name','SELECT')::text as value;
select 'anon_article_stats_grant' as check_name,
       has_table_privilege('anon','public.article_stats','SELECT')::text as value;
select 'anon_jb_is_owner_execute' as check_name,
       has_function_privilege('anon','public.jb_is_owner()','EXECUTE')::text as value;


do $$
begin
  if not has_column_privilege('anon','public.articles','id','SELECT') then
    raise exception 'ASSERT_ANON_PUBLIC_ARTICLE_GRANT_MISSING';
  end if;
  if has_column_privilege('anon','public.articles','source_name','SELECT') then
    raise exception 'ASSERT_PRIVATE_ARTICLE_SOURCE_EXPOSED';
  end if;
  if has_table_privilege('anon','public.article_stats','SELECT') then
    raise exception 'ASSERT_ANON_ARTICLE_STATS_STILL_GRANTED';
  end if;
  if has_function_privilege('anon','public.jb_is_owner()','EXECUTE') then
    raise exception 'ASSERT_ANON_JB_IS_OWNER_EXECUTE_STILL_GRANTED';
  end if;
  if not has_table_privilege('anon','public.analytics_events','INSERT')
     or has_table_privilege('anon','public.analytics_events','SELECT')
     or has_table_privilege('anon','public.analytics_events','UPDATE')
     or has_table_privilege('anon','public.analytics_events','DELETE') then
    raise exception 'ASSERT_ANALYTICS_ANON_LEAST_PRIVILEGE_FAILED';
  end if;
  if not has_table_privilege('anon','public.grievances','INSERT')
     or has_table_privilege('anon','public.grievances','SELECT')
     or has_table_privilege('anon','public.grievances','UPDATE')
     or has_table_privilege('anon','public.grievances','DELETE') then
    raise exception 'ASSERT_GRIEVANCE_ANON_LEAST_PRIVILEGE_FAILED';
  end if;
  if exists(
    select 1 from information_schema.table_privileges
    where table_schema='public' and grantee='anon'
      and table_name in ('compliance_tasks','grievance_evidence','live_sessions','live_updates','reporters','social_distribution')
      and privilege_type in ('SELECT','INSERT','UPDATE','DELETE')
  ) then
    raise exception 'ASSERT_PRIVATE_PHASE2_ANON_GRANT_REMAINS';
  end if;
end $$;

-- 2) AAL2 + active session + recent MFA succeeds.
select set_config('request.jwt.claims',
  jsonb_build_object(
    'sub',(select owner_id::text from jb_pretest_ctx),'role','authenticated','aal','aal2','session_id',(select current_session_id::text from jb_pretest_ctx),
    'amr',jsonb_build_array(
      jsonb_build_object('method','totp','timestamp',floor(extract(epoch from now()))::bigint),
      jsonb_build_object('method','password','timestamp',floor(extract(epoch from now()))::bigint-20)
    )
  )::text,true);
set local role authenticated;
select 'owner_aal2_active' as check_name, private.current_owner_aal2()::text as value;
select 'owner_recent_mfa' as check_name, private.current_owner_recent_mfa(600)::text as value;
select 'owner_session_rows_before' as check_name, count(*)::text as value from public.jb_owner_list_sessions();
select 'owner_stats_rows' as check_name, count(*)::text as value from public.article_stats;
reset role;

-- 3) Old MFA timestamp is rejected.
select set_config('request.jwt.claims',
  jsonb_build_object(
    'sub',(select owner_id::text from jb_pretest_ctx),'role','authenticated','aal','aal2','session_id',(select current_session_id::text from jb_pretest_ctx),
    'amr',jsonb_build_array(jsonb_build_object('method','totp','timestamp',floor(extract(epoch from now()))::bigint-1200))
  )::text,true);
set local role authenticated;
select 'old_mfa_rejected' as check_name, (not private.current_owner_recent_mfa(600))::text as value;
reset role;

-- 4) AAL1 Owner is blocked from Owner article reads.
select set_config('request.jwt.claims',
  jsonb_build_object('sub',(select owner_id::text from jb_pretest_ctx),'role','authenticated','aal','aal1','session_id',(select current_session_id::text from jb_pretest_ctx),
    'amr',jsonb_build_array(jsonb_build_object('method','password','timestamp',floor(extract(epoch from now()))::bigint)))::text,true);
set local role authenticated;
select 'aal1_owner_article_rows' as check_name, count(*)::text as value from public.articles;
reset role;

-- Restore fresh AAL2 claims.
select set_config('request.jwt.claims',
  jsonb_build_object(
    'sub',(select owner_id::text from jb_pretest_ctx),'role','authenticated','aal','aal2','session_id',(select current_session_id::text from jb_pretest_ctx),
    'amr',jsonb_build_array(jsonb_build_object('method','totp','timestamp',floor(extract(epoch from now()))::bigint))
  )::text,true);

-- 5) Specific OTHER-session revoke works, current session remains (rollback later).
set local role authenticated;
select 'revoke_other_session' as check_name, public.jb_owner_revoke_session((select other_session_id from jb_pretest_ctx))::text as value;
select 'owner_session_rows_after_revoke' as check_name, count(*)::text as value from public.jb_owner_list_sessions();
reset role;
select 'target_session_removed_inside_tx' as check_name,
       (not exists(select 1 from auth.sessions where id=(select other_session_id from jb_pretest_ctx)))::text as value;
select 'current_session_still_inside_tx' as check_name,
       exists(select 1 from auth.sessions where id=(select current_session_id from jb_pretest_ctx))::text as value;

-- 6) Permanent Delete destructive execution is intentionally NOT automated here.
-- Static authority check only; Founder final manual Trash-only/recent-MFA verification remains required.
do $$
declare v_def text;
begin
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='jb_owner_permanent_delete_article'
  limit 1;

  if v_def is null then raise exception 'ASSERT_PERMA_DELETE_RPC_MISSING'; end if;
  if has_function_privilege('anon','public.jb_owner_permanent_delete_article(uuid)','EXECUTE') then
    raise exception 'ASSERT_ANON_PERMA_DELETE_EXECUTE_GRANTED';
  end if;
  if not has_function_privilege('authenticated','public.jb_owner_permanent_delete_article(uuid)','EXECUTE') then
    raise exception 'ASSERT_AUTH_PERMA_DELETE_EXECUTE_MISSING';
  end if;
  if position('current_owner_recent_mfa(600)' in v_def)=0 then
    raise exception 'ASSERT_PERMA_DELETE_RECENT_MFA_GUARD_MISSING';
  end if;
  if position($needle$status='deleted'::public.article_status$needle$ in replace(v_def,' ',''))=0 then
    raise exception 'ASSERT_PERMA_DELETE_TRASH_GUARD_MISSING';
  end if;
end $$;

-- 7) #129: current key starts due when no check for its version, then 6-month record clears due.
select set_config('request.jwt.claims',
  jsonb_build_object(
    'sub',(select owner_id::text from jb_pretest_ctx),'role','authenticated','aal','aal2','session_id',(select current_session_id::text from jb_pretest_ctx),
    'amr',jsonb_build_array(jsonb_build_object('method','totp','timestamp',floor(extract(epoch from now()))::bigint))
  )::text,true);
set local role authenticated;
select 'physical_due_before' as check_name, due::text as value from public.jb_owner_recovery_physical_status();
select 'physical_confirm_safe' as check_name, (not due)::text as value from public.jb_owner_confirm_recovery_physical_check('safe');
select 'physical_due_after' as check_name, (not due)::text as value from public.jb_owner_recovery_physical_status();
reset role;

rollback;