-- JANTA BOL — Phase 4 B2 Common Audit + Retention Foundation
-- Source: Master Blueprint Topic 8 / P4-T051–P4-T059 / RUN-08
-- Strategy: PRESERVE existing audit/version/verification/Live retention homes; EXTEND with common records machinery.

begin;

create or replace function private.jb_audit_sanitize_jsonb(p_value jsonb)
returns jsonb
language plpgsql
immutable
set search_path=''
as $$
declare
  k text;
  v jsonb;
  out_value jsonb;
begin
  if p_value is null then return '{}'::jsonb; end if;
  if jsonb_typeof(p_value)='object' then
    out_value:='{}'::jsonb;
    for k,v in select key,value from jsonb_each(p_value)
    loop
      if lower(k) = any(array[
        'password','passwd','access_token','refresh_token','id_token',
        'client_secret','service_role_key','recovery_key','authorization',
        'private_key','stream_key','handoff_token','token_hash'
      ]) then
        out_value:=out_value || jsonb_build_object(k,'[REDACTED]');
      else
        out_value:=out_value || jsonb_build_object(k,private.jb_audit_sanitize_jsonb(v));
      end if;
    end loop;
    return out_value;
  elsif jsonb_typeof(p_value)='array' then
    select coalesce(jsonb_agg(private.jb_audit_sanitize_jsonb(value)),'[]'::jsonb)
      into out_value from jsonb_array_elements(p_value);
    return out_value;
  end if;
  return p_value;
end;
$$;
revoke all on function private.jb_audit_sanitize_jsonb(jsonb) from public,anon,authenticated;

create or replace function private.jb_audit_prepare()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  new.metadata:=private.jb_audit_sanitize_jsonb(coalesce(new.metadata,'{}'::jsonb));
  new.action:=left(btrim(new.action),160);
  new.record_type:=left(btrim(new.record_type),120);
  new.record_id:=nullif(left(btrim(coalesce(new.record_id,'')),240),'');
  if new.action='' or new.record_type='' then raise exception 'AUDIT_ACTION_AND_RECORD_TYPE_REQUIRED'; end if;
  return new;
end;
$$;
revoke all on function private.jb_audit_prepare() from public,anon,authenticated;

create or replace function private.jb_audit_immutable_guard()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if coalesce(current_setting('jb.audit_maintenance',true),'')<>'on' then
    raise exception 'AUDIT_HISTORY_IMMUTABLE';
  end if;
  return case when tg_op='DELETE' then old else new end;
end;
$$;
revoke all on function private.jb_audit_immutable_guard() from public,anon,authenticated;

drop trigger if exists trg_jb_audit_prepare on public.audit_logs;
create trigger trg_jb_audit_prepare before insert on public.audit_logs
for each row execute function private.jb_audit_prepare();

drop trigger if exists trg_jb_audit_immutable_guard on public.audit_logs;
create trigger trg_jb_audit_immutable_guard before update or delete on public.audit_logs
for each row execute function private.jb_audit_immutable_guard();

create index if not exists audit_logs_record_lookup_idx on public.audit_logs(record_type,record_id,created_at desc);
create index if not exists audit_logs_actor_created_idx on public.audit_logs(actor_user_id,created_at desc);

create table if not exists public.record_retention_policies(
  policy_key text primary key,
  domain text not null,
  record_type text not null,
  default_retention_days integer,
  automatic_disposition boolean not null default false,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(default_retention_days is null or default_retention_days>0)
);

create table if not exists public.record_retention_state(
  domain text not null,
  record_type text not null,
  record_id text not null,
  policy_key text references public.record_retention_policies(policy_key) on delete restrict,
  lifecycle_state text not null default 'active'
    check(lifecycle_state in('active','due','extended','hold','archived','disposed')),
  retention_due_at timestamptz,
  extension_until timestamptz,
  hold_active boolean not null default false,
  hold_reason text,
  hold_set_at timestamptz,
  hold_set_by uuid,
  archived_at timestamptz,
  disposed_at timestamptz,
  updated_by uuid,
  updated_at timestamptz not null default now(),
  primary key(domain,record_type,record_id),
  check((hold_active=false) or (hold_reason is not null and hold_set_at is not null))
);

create table if not exists public.record_retention_history(
  id bigint generated always as identity primary key,
  domain text not null,
  record_type text not null,
  record_id text not null,
  action text not null,
  old_state jsonb not null default '{}'::jsonb,
  new_state jsonb not null default '{}'::jsonb,
  reason text,
  actor_user_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists record_retention_history_lookup_idx
  on public.record_retention_history(domain,record_type,record_id,created_at desc);

create table if not exists public.record_disposition_ledger(
  disposition_id uuid primary key default gen_random_uuid(),
  domain text not null,
  record_type text not null,
  record_id text not null,
  disposition_type text not null,
  reason text not null,
  actor_user_id uuid,
  immutable_identity jsonb not null default '{}'::jsonb,
  disposition_metadata jsonb not null default '{}'::jsonb,
  disposed_at timestamptz not null default now(),
  unique(record_type,record_id)
);

create index if not exists record_disposition_domain_idx
  on public.record_disposition_ledger(domain,disposed_at desc);

alter table public.record_retention_policies enable row level security;
alter table public.record_retention_state enable row level security;
alter table public.record_retention_history enable row level security;
alter table public.record_disposition_ledger enable row level security;

revoke all on table public.record_retention_policies from public,anon,authenticated;
revoke all on table public.record_retention_state from public,anon,authenticated;
revoke all on table public.record_retention_history from public,anon,authenticated;
revoke all on table public.record_disposition_ledger from public,anon,authenticated;
grant all on table public.record_retention_policies to service_role;
grant all on table public.record_retention_state to service_role;
grant all on table public.record_retention_history to service_role;
grant all on table public.record_disposition_ledger to service_role;
grant usage,select on sequence public.record_retention_history_id_seq to service_role;

create policy record_retention_policies_deny_client
on public.record_retention_policies for all to anon,authenticated using(false) with check(false);
create policy record_retention_state_deny_client
on public.record_retention_state for all to anon,authenticated using(false) with check(false);
create policy record_retention_history_deny_client
on public.record_retention_history for all to anon,authenticated using(false) with check(false);
create policy record_disposition_ledger_deny_client
on public.record_disposition_ledger for all to anon,authenticated using(false) with check(false);

create or replace function private.jb_records_immutable_guard()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if coalesce(current_setting('jb.records_maintenance',true),'')<>'on' then
    raise exception 'RECORD_HISTORY_IMMUTABLE';
  end if;
  return case when tg_op='DELETE' then old else new end;
end;
$$;
revoke all on function private.jb_records_immutable_guard() from public,anon,authenticated;

drop trigger if exists trg_jb_retention_history_immutable on public.record_retention_history;
create trigger trg_jb_retention_history_immutable before update or delete on public.record_retention_history
for each row execute function private.jb_records_immutable_guard();

drop trigger if exists trg_jb_disposition_immutable on public.record_disposition_ledger;
create trigger trg_jb_disposition_immutable before update or delete on public.record_disposition_ledger
for each row execute function private.jb_records_immutable_guard();

create or replace function private.jb_article_retired_identity_guard()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if exists(
    select 1 from public.record_disposition_ledger
    where record_type='article' and record_id=new.id::text
  ) then raise exception 'ARTICLE_ID_RETIRED'; end if;
  return new;
end;
$$;
revoke all on function private.jb_article_retired_identity_guard() from public,anon,authenticated;

drop trigger if exists trg_jb_article_retired_identity_guard on public.articles;
create trigger trg_jb_article_retired_identity_guard before insert on public.articles
for each row execute function private.jb_article_retired_identity_guard();

create table if not exists public.article_public_view_settings(
  article_id uuid primary key,
  public_views_enabled boolean not null default false,
  display_override bigint,
  updated_by uuid,
  updated_at timestamptz not null default now(),
  check(display_override is null or display_override>=0)
);

alter table public.article_public_view_settings enable row level security;
revoke all on table public.article_public_view_settings from public,anon,authenticated;
grant all on table public.article_public_view_settings to service_role;

create policy article_public_view_settings_deny_client
on public.article_public_view_settings for all to anon,authenticated using(false) with check(false);

create or replace function private.jb_records_require_owner(p_actor uuid)
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if p_actor is null or not exists(
    select 1 from public.user_roles
    where user_id=p_actor and role='owner'::public.app_role
  ) then raise exception 'OWNER_REQUIRED'; end if;
end;
$$;
revoke all on function private.jb_records_require_owner(uuid) from public,anon,authenticated;

create or replace function public.jb_records_retention_register_internal(
  p_actor uuid,p_domain text,p_record_type text,p_record_id text,
  p_policy_key text default null,p_due_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_domain text:=left(lower(btrim(coalesce(p_domain,''))),80);
  v_type text:=left(lower(btrim(coalesce(p_record_type,''))),120);
  v_id text:=left(btrim(coalesce(p_record_id,'')),240);
  v_old public.record_retention_state%rowtype;
  v_new public.record_retention_state%rowtype;
begin
  perform private.jb_records_require_owner(p_actor);
  if v_domain='' or v_type='' or v_id='' then raise exception 'RECORD_IDENTITY_REQUIRED'; end if;
  if p_policy_key is not null and not exists(
    select 1 from public.record_retention_policies where policy_key=p_policy_key and active=true
  ) then raise exception 'RETENTION_POLICY_NOT_FOUND'; end if;

  select * into v_old from public.record_retention_state
  where domain=v_domain and record_type=v_type and record_id=v_id;

  insert into public.record_retention_state(
    domain,record_type,record_id,policy_key,lifecycle_state,retention_due_at,updated_by,updated_at
  ) values(v_domain,v_type,v_id,p_policy_key,'active',p_due_at,p_actor,now())
  on conflict(domain,record_type,record_id) do update
  set policy_key=coalesce(excluded.policy_key,public.record_retention_state.policy_key),
      retention_due_at=coalesce(excluded.retention_due_at,public.record_retention_state.retention_due_at),
      updated_by=p_actor,updated_at=now()
  returning * into v_new;

  insert into public.record_retention_history(
    domain,record_type,record_id,action,old_state,new_state,actor_user_id
  ) values(
    v_domain,v_type,v_id,
    case when v_old.record_id is null then 'retention_registered' else 'retention_registration_updated' end,
    case when v_old.record_id is null then '{}'::jsonb else to_jsonb(v_old) end,
    to_jsonb(v_new),p_actor
  );

  insert into public.audit_logs(actor_user_id,action,record_type,record_id,metadata)
  values(p_actor,'retention_registered',v_type,v_id,
    jsonb_build_object('domain',v_domain,'policy_key',p_policy_key,'retention_due_at',p_due_at));
  return to_jsonb(v_new);
end;
$$;

create or replace function public.jb_records_retention_action_internal(
  p_actor uuid,p_domain text,p_record_type text,p_record_id text,p_action text,
  p_reason text default null,p_new_due_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_domain text:=left(lower(btrim(coalesce(p_domain,''))),80);
  v_type text:=left(lower(btrim(coalesce(p_record_type,''))),120);
  v_id text:=left(btrim(coalesce(p_record_id,'')),240);
  v_action text:=upper(btrim(coalesce(p_action,'')));
  v_reason text:=nullif(left(btrim(coalesce(p_reason,'')),500),'');
  v_old public.record_retention_state%rowtype;
  v_new public.record_retention_state%rowtype;
begin
  perform private.jb_records_require_owner(p_actor);
  select * into v_old from public.record_retention_state
  where domain=v_domain and record_type=v_type and record_id=v_id for update;
  if not found then raise exception 'RETENTION_RECORD_NOT_FOUND'; end if;
  if v_old.lifecycle_state='disposed' then raise exception 'RECORD_ALREADY_DISPOSED'; end if;

  if v_action='MARK_DUE' then
    if v_old.hold_active then raise exception 'RETENTION_HOLD_ACTIVE'; end if;
    update public.record_retention_state
    set lifecycle_state='due',retention_due_at=coalesce(p_new_due_at,retention_due_at,now()),
        extension_until=null,updated_by=p_actor,updated_at=now()
    where domain=v_domain and record_type=v_type and record_id=v_id;
  elsif v_action='EXTEND' then
    if v_old.hold_active then raise exception 'RETENTION_HOLD_ACTIVE'; end if;
    if p_new_due_at is null or p_new_due_at<=now() then raise exception 'VALID_EXTENSION_DATE_REQUIRED'; end if;
    update public.record_retention_state
    set lifecycle_state='extended',retention_due_at=p_new_due_at,extension_until=p_new_due_at,
        updated_by=p_actor,updated_at=now()
    where domain=v_domain and record_type=v_type and record_id=v_id;
  elsif v_action='HOLD' then
    if v_reason is null then raise exception 'REASON_REQUIRED'; end if;
    update public.record_retention_state
    set lifecycle_state='hold',hold_active=true,hold_reason=v_reason,hold_set_at=now(),hold_set_by=p_actor,
        updated_by=p_actor,updated_at=now()
    where domain=v_domain and record_type=v_type and record_id=v_id;
  elsif v_action='RELEASE_HOLD' then
    if not v_old.hold_active then raise exception 'RETENTION_HOLD_NOT_ACTIVE'; end if;
    if v_reason is null then raise exception 'REASON_REQUIRED'; end if;
    update public.record_retention_state
    set lifecycle_state=case
          when retention_due_at is not null and retention_due_at<=now() then 'due'
          when extension_until is not null then 'extended'
          else 'active'
        end,
        hold_active=false,hold_reason=null,hold_set_at=null,hold_set_by=null,
        updated_by=p_actor,updated_at=now()
    where domain=v_domain and record_type=v_type and record_id=v_id;
  elsif v_action='ARCHIVE' then
    if v_reason is null then raise exception 'REASON_REQUIRED'; end if;
    update public.record_retention_state
    set lifecycle_state='archived',archived_at=coalesce(archived_at,now()),updated_by=p_actor,updated_at=now()
    where domain=v_domain and record_type=v_type and record_id=v_id;
  else
    raise exception 'INVALID_RETENTION_ACTION';
  end if;

  select * into v_new from public.record_retention_state
  where domain=v_domain and record_type=v_type and record_id=v_id;

  insert into public.record_retention_history(
    domain,record_type,record_id,action,old_state,new_state,reason,actor_user_id
  ) values(v_domain,v_type,v_id,'retention_'||lower(v_action),to_jsonb(v_old),to_jsonb(v_new),v_reason,p_actor);

  insert into public.audit_logs(actor_user_id,action,record_type,record_id,metadata)
  values(p_actor,'retention_'||lower(v_action),v_type,v_id,
    jsonb_build_object('domain',v_domain,'reason',v_reason,'old_state',v_old.lifecycle_state,
      'new_state',v_new.lifecycle_state,'retention_due_at',v_new.retention_due_at,'hold_active',v_new.hold_active));
  return to_jsonb(v_new);
end;
$$;

create or replace function public.jb_records_set_public_views_internal(
  p_actor uuid,p_article_id uuid,p_enabled boolean,p_display_override bigint default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_old public.article_public_view_settings%rowtype;
  v_new public.article_public_view_settings%rowtype;
  v_raw bigint:=0;
begin
  perform private.jb_records_require_owner(p_actor);
  if p_article_id is null or not exists(select 1 from public.articles where id=p_article_id) then
    raise exception 'ARTICLE_NOT_FOUND';
  end if;
  if p_display_override is not null and p_display_override<0 then raise exception 'INVALID_DISPLAY_OVERRIDE'; end if;

  select * into v_old from public.article_public_view_settings where article_id=p_article_id;
  select coalesce(views,0) into v_raw from public.article_stats where article_id=p_article_id limit 1;
  v_raw:=coalesce(v_raw,0);

  insert into public.article_public_view_settings(article_id,public_views_enabled,display_override,updated_by,updated_at)
  values(p_article_id,coalesce(p_enabled,false),p_display_override,p_actor,now())
  on conflict(article_id) do update
  set public_views_enabled=excluded.public_views_enabled,display_override=excluded.display_override,
      updated_by=p_actor,updated_at=now()
  returning * into v_new;

  insert into public.audit_logs(actor_user_id,action,record_type,record_id,metadata)
  values(p_actor,'article_public_view_changed','article',p_article_id::text,
    jsonb_build_object('old_enabled',coalesce(v_old.public_views_enabled,false),'new_enabled',v_new.public_views_enabled,
      'old_override',v_old.display_override,'new_override',v_new.display_override,'raw_views',v_raw));

  return jsonb_build_object('article_id',p_article_id,'public_views_enabled',v_new.public_views_enabled,
    'display_override',v_new.display_override,'raw_views',v_raw,
    'display_views',case when v_new.public_views_enabled then coalesce(v_new.display_override,v_raw) else null end);
end;
$$;

create or replace function public.jb_records_audit_lookup_internal(
  p_actor uuid,p_record_type text default null,p_record_id text default null,p_limit integer default 100
)
returns table(id bigint,actor_user_id uuid,action text,record_type text,record_id text,metadata jsonb,created_at timestamptz)
language plpgsql
security definer
set search_path=''
as $$
begin
  perform private.jb_records_require_owner(p_actor);
  return query
  select a.id,a.actor_user_id,a.action,a.record_type,a.record_id,
         private.jb_audit_sanitize_jsonb(a.metadata),a.created_at
  from public.audit_logs a
  where (nullif(btrim(coalesce(p_record_type,'')),'') is null or a.record_type=p_record_type)
    and (nullif(btrim(coalesce(p_record_id,'')),'') is null or a.record_id=p_record_id)
  order by a.created_at desc,a.id desc
  limit greatest(1,least(coalesce(p_limit,100),500));
end;
$$;

create or replace function public.jb_records_audit_export_internal(
  p_actor uuid,p_record_type text default null,p_record_id text default null,p_limit integer default 500
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_rows jsonb;
  v_count integer;
begin
  perform private.jb_records_require_owner(p_actor);
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc,x.id desc),'[]'::jsonb)
    into v_rows
  from (
    select a.id,a.actor_user_id,a.action,a.record_type,a.record_id,
           private.jb_audit_sanitize_jsonb(a.metadata) as metadata,a.created_at
    from public.audit_logs a
    where (nullif(btrim(coalesce(p_record_type,'')),'') is null or a.record_type=p_record_type)
      and (nullif(btrim(coalesce(p_record_id,'')),'') is null or a.record_id=p_record_id)
    order by a.created_at desc,a.id desc
    limit greatest(1,least(coalesce(p_limit,500),2000))
  ) x;
  v_count:=jsonb_array_length(v_rows);
  insert into public.audit_logs(actor_user_id,action,record_type,record_id,metadata)
  values(p_actor,'audit_exported','audit_export',coalesce(nullif(btrim(coalesce(p_record_id,'')),''),'ALL'),
    jsonb_build_object('filter_record_type',p_record_type,'row_count',v_count));
  return jsonb_build_object('rows',v_rows,'row_count',v_count,'exported_at',now());
end;
$$;

create or replace function public.jb_records_retention_get_internal(
  p_actor uuid,p_domain text,p_record_type text,p_record_id text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_state jsonb;
  v_history jsonb;
begin
  perform private.jb_records_require_owner(p_actor);
  select to_jsonb(s) into v_state from public.record_retention_state s
  where s.domain=lower(btrim(p_domain)) and s.record_type=lower(btrim(p_record_type)) and s.record_id=btrim(p_record_id);
  select coalesce(jsonb_agg(to_jsonb(h) order by h.created_at desc,h.id desc),'[]'::jsonb)
    into v_history from public.record_retention_history h
  where h.domain=lower(btrim(p_domain)) and h.record_type=lower(btrim(p_record_type)) and h.record_id=btrim(p_record_id);
  return jsonb_build_object('state',v_state,'history',v_history);
end;
$$;

revoke execute on function public.jb_records_retention_register_internal(uuid,text,text,text,text,timestamptz) from public,anon,authenticated;
revoke execute on function public.jb_records_retention_action_internal(uuid,text,text,text,text,text,timestamptz) from public,anon,authenticated;
revoke execute on function public.jb_records_set_public_views_internal(uuid,uuid,boolean,bigint) from public,anon,authenticated;
revoke execute on function public.jb_records_audit_lookup_internal(uuid,text,text,integer) from public,anon,authenticated;
revoke execute on function public.jb_records_audit_export_internal(uuid,text,text,integer) from public,anon,authenticated;
revoke execute on function public.jb_records_retention_get_internal(uuid,text,text,text) from public,anon,authenticated;

grant execute on function public.jb_records_retention_register_internal(uuid,text,text,text,text,timestamptz) to service_role;
grant execute on function public.jb_records_retention_action_internal(uuid,text,text,text,text,text,timestamptz) to service_role;
grant execute on function public.jb_records_set_public_views_internal(uuid,uuid,boolean,bigint) to service_role;
grant execute on function public.jb_records_audit_lookup_internal(uuid,text,text,integer) to service_role;
grant execute on function public.jb_records_audit_export_internal(uuid,text,text,integer) to service_role;
grant execute on function public.jb_records_retention_get_internal(uuid,text,text,text) to service_role;

create or replace function public.jb_owner_permanent_delete_article(p_article_id uuid)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_article public.articles%rowtype;
  v_state public.record_retention_state%rowtype;
  v_version_count bigint:=0;
  v_verification_count bigint:=0;
  v_deleted uuid;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not private.current_owner_recent_mfa(600) then raise exception 'RECENT_MFA_REQUIRED'; end if;
  if p_article_id is null then raise exception 'ARTICLE_ID_REQUIRED'; end if;

  select * into v_article from public.articles where id=p_article_id for update;
  if not found or v_article.status<>'deleted'::public.article_status then raise exception 'TRASH_ARTICLE_REQUIRED'; end if;

  select * into v_state from public.record_retention_state
  where domain='article' and record_type='article' and record_id=p_article_id::text for update;
  if not found then raise exception 'RETENTION_DUE_REQUIRED'; end if;
  if v_state.hold_active then raise exception 'RETENTION_HOLD_ACTIVE'; end if;
  if v_state.lifecycle_state not in('due','extended') then raise exception 'RETENTION_DUE_REQUIRED'; end if;
  if v_state.retention_due_at is null or v_state.retention_due_at>now() then raise exception 'RETENTION_NOT_DUE'; end if;

  select count(*) into v_version_count from public.article_versions where article_id=p_article_id;
  select count(*) into v_verification_count from public.verification_history where article_id=p_article_id;

  insert into public.record_disposition_ledger(
    domain,record_type,record_id,disposition_type,reason,actor_user_id,immutable_identity,disposition_metadata
  ) values(
    'article','article',p_article_id::text,'PERMANENT_DELETE','RETENTION_DUE',v_uid,
    jsonb_build_object('article_id',p_article_id,'slug',v_article.slug,'status',v_article.status::text,
      'previous_status',v_article.previous_status::text,'version',v_article.version,'published_at',v_article.published_at,
      'permanent_url','article.html?id='||p_article_id::text),
    jsonb_build_object('version_count',v_version_count,'verification_count',v_verification_count,'content_retained',false)
  )
  on conflict(record_type,record_id) do nothing;

  insert into public.record_retention_history(
    domain,record_type,record_id,action,old_state,new_state,reason,actor_user_id
  ) values(
    'article','article',p_article_id::text,'retention_disposed',to_jsonb(v_state),
    to_jsonb(v_state)||jsonb_build_object('lifecycle_state','disposed','disposed_at',now()),'RETENTION_DUE',v_uid
  );

  update public.record_retention_state
  set lifecycle_state='disposed',disposed_at=now(),updated_by=v_uid,updated_at=now()
  where domain='article' and record_type='article' and record_id=p_article_id::text;

  delete from public.articles where id=p_article_id and status='deleted'::public.article_status returning id into v_deleted;
  if v_deleted is null then raise exception 'TRASH_ARTICLE_REQUIRED'; end if;

  insert into public.audit_logs(actor_user_id,action,record_type,record_id,metadata)
  values(v_uid,'security_permanent_delete_article','security',p_article_id::text,
    jsonb_build_object('article_id',p_article_id,'irreversible',true,'retention_state','disposed','disposition_recorded',true));
  return true;
end;
$$;

revoke execute on function public.jb_owner_permanent_delete_article(uuid) from public,anon;
grant execute on function public.jb_owner_permanent_delete_article(uuid) to authenticated,service_role;

commit;
