-- Phase 4 B3 completion: acknowledgement, reminder/escalation, safe routing and config guard.
alter table public.live_notifications add column if not exists acknowledged_at timestamptz;
alter table public.live_notifications add column if not exists reminder_count integer not null default 0 check (reminder_count >= 0);
alter table public.live_notifications add column if not exists last_reminded_at timestamptz;
alter table public.live_notifications add column if not exists due_at timestamptz;

create table if not exists public.notification_config (
  config_key text primary key,
  enabled boolean not null default true,
  protected_critical boolean not null default false,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
alter table public.notification_config enable row level security;
revoke all on table public.notification_config from public,anon,authenticated;
grant select,insert,update,delete on table public.notification_config to service_role;

insert into public.notification_config(config_key,enabled,protected_critical)
values ('critical_in_app',true,true),('routine_in_app',true,false)
on conflict(config_key) do nothing;

create or replace function public.jb_notification_acknowledge_internal(p_user_id uuid,p_notification_id bigint)
returns boolean language plpgsql security definer set search_path=pg_catalog,public,private as $$
begin
 update public.live_notifications set acknowledged_at=coalesce(acknowledged_at,now())
 where id=p_notification_id and recipient_user_id=p_user_id and action_required=true and resolved_at is null;
 return found;
end $$;
revoke all on function public.jb_notification_acknowledge_internal(uuid,bigint) from public,anon,authenticated;
grant execute on function public.jb_notification_acknowledge_internal(uuid,bigint) to service_role;

create or replace function public.jb_notification_remind_internal(p_notification_id bigint,p_escalate boolean default false)
returns boolean language plpgsql security definer set search_path=pg_catalog,public,private as $$
begin
 update public.live_notifications
 set reminder_count=reminder_count+1,last_reminded_at=now(),
     priority=case when p_escalate and priority='NORMAL' then 'HIGH' when p_escalate and priority='HIGH' then 'CRITICAL' else priority end
 where id=p_notification_id and action_required=true and resolved_at is null;
 if found then
   insert into public.notification_delivery_history(notification_id,channel,event,delivery_state,attempt_no)
   select id,'IN_APP',case when p_escalate then 'ESCALATED' else 'REMINDER' end,delivery_state,delivery_attempts
   from public.live_notifications where id=p_notification_id;
   return true;
 end if;
 return false;
end $$;
revoke all on function public.jb_notification_remind_internal(bigint,boolean) from public,anon,authenticated;
grant execute on function public.jb_notification_remind_internal(bigint,boolean) to service_role;

create or replace function public.jb_notification_config_set_internal(p_actor uuid,p_key text,p_enabled boolean)
returns boolean language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare v_role public.app_role; v_protected boolean;
begin
 select role into v_role from public.user_roles where user_id=p_actor;
 if v_role <> 'owner'::public.app_role then raise exception 'OWNER_REQUIRED'; end if;
 select protected_critical into v_protected from public.notification_config where config_key=p_key for update;
 if not found then raise exception 'UNKNOWN_NOTIFICATION_CONFIG'; end if;
 if v_protected and p_enabled=false then raise exception 'CRITICAL_NOTIFICATION_CANNOT_BE_DISABLED'; end if;
 update public.notification_config set enabled=p_enabled,updated_by=p_actor,updated_at=now() where config_key=p_key;
 insert into public.audit_logs(actor_user_id,action,record_type,record_id,metadata)
 values(p_actor,'notification_config_changed','notification_config',p_key,jsonb_build_object('enabled',p_enabled));
 return true;
end $$;
revoke all on function public.jb_notification_config_set_internal(uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.jb_notification_config_set_internal(uuid,text,boolean) to service_role;

create or replace function public.jb_notification_emit_internal(
 p_recipient_user_id uuid, p_domain text, p_notification_type text, p_priority text,
 p_title text, p_safe_message text default '', p_record_type text default null,
 p_record_id text default null, p_action_required boolean default false,
 p_action_path text default null, p_dedupe_key text default null, p_metadata jsonb default '{}'::jsonb
) returns bigint language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare v_id bigint; v_active boolean; v_role public.app_role;
begin
 if p_domain not in ('live','grievance','compliance','social','ads','security','team','system') then raise exception 'UNSUPPORTED_NOTIFICATION_DOMAIN'; end if;
 if p_priority not in ('NORMAL','HIGH','CRITICAL') then raise exception 'INVALID_NOTIFICATION_PRIORITY'; end if;
 if p_safe_message ~* '(token|password|secret|recovery[ _-]?key|source[ _-]?identity)' then raise exception 'UNSAFE_NOTIFICATION_MESSAGE'; end if;
 select exists(select 1 from public.user_roles ur where ur.user_id=p_recipient_user_id) into v_active;
 if not v_active then raise exception 'RECIPIENT_NOT_AUTHORIZED'; end if;
 if exists(select 1 from public.team_accounts ta where ta.user_id=p_recipient_user_id and ta.status in ('suspended','departed')) then raise exception 'RECIPIENT_REVOKED'; end if;
 insert into public.live_notifications(recipient_user_id,domain,notification_type,priority,title,safe_message,record_type,record_id,lifecycle_state,action_required,action_path,dedupe_key,metadata)
 values(p_recipient_user_id,p_domain,p_notification_type,p_priority,left(p_title,180),p_safe_message,coalesce(p_record_type,p_domain),p_record_id,case when p_action_required then 'ACTION_REQUIRED' else 'UNREAD' end,p_action_required,p_action_path,p_dedupe_key,coalesce(p_metadata,'{}'::jsonb))
 on conflict(recipient_user_id,dedupe_key) where dedupe_key is not null
 do update set priority=excluded.priority,title=excluded.title,safe_message=excluded.safe_message,
   action_required=excluded.action_required,action_path=excluded.action_path,metadata=excluded.metadata
 returning id into v_id;
 insert into public.notification_delivery_history(notification_id,channel,event,delivery_state,attempt_no)
 values(v_id,'IN_APP','EMITTED','IN_APP_READY',0);
 insert into public.record_retention_state(domain,record_type,record_id,policy_key,lifecycle_state,updated_at)
 values('notifications','notification_history',v_id::text,'notification_history_v1','active',now())
 on conflict(domain,record_type,record_id) do nothing;
 return v_id;
end $$;