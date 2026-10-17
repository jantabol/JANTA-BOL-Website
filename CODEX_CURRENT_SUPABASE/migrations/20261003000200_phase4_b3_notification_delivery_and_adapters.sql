-- Phase 4 B3 common notification adapters, delivery history and retention link.
create table if not exists public.notification_delivery_history (
  id bigint generated always as identity primary key,
  notification_id bigint not null references public.live_notifications(id) on delete cascade,
  channel text not null default 'IN_APP',
  event text not null,
  delivery_state text not null,
  attempt_no integer not null default 0 check (attempt_no >= 0),
  error_code text,
  created_at timestamptz not null default now()
);
alter table public.notification_delivery_history enable row level security;
revoke all on table public.notification_delivery_history from public, anon, authenticated;
grant select,insert,update,delete on table public.notification_delivery_history to service_role;
create index if not exists notification_delivery_history_notification_idx on public.notification_delivery_history(notification_id,created_at desc);

create or replace function public.jb_notification_emit_internal(
 p_recipient_user_id uuid, p_domain text, p_notification_type text, p_priority text,
 p_title text, p_safe_message text default '', p_record_type text default null,
 p_record_id text default null, p_action_required boolean default false,
 p_action_path text default null, p_dedupe_key text default null, p_metadata jsonb default '{}'::jsonb
) returns bigint language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare v_id bigint;
begin
 if p_domain not in ('live','grievance','compliance','social','ads','security','team','system') then raise exception 'UNSUPPORTED_NOTIFICATION_DOMAIN'; end if;
 if p_priority not in ('NORMAL','HIGH','CRITICAL') then raise exception 'INVALID_NOTIFICATION_PRIORITY'; end if;
 if p_safe_message ~* '(token|password|secret|recovery[ _-]?key|source[ _-]?identity)' then raise exception 'UNSAFE_NOTIFICATION_MESSAGE'; end if;
 insert into public.live_notifications(recipient_user_id,domain,notification_type,priority,title,safe_message,record_type,record_id,lifecycle_state,action_required,action_path,dedupe_key,metadata)
 values(p_recipient_user_id,p_domain,p_notification_type,p_priority,left(p_title,180),p_safe_message,coalesce(p_record_type,p_domain),p_record_id,case when p_action_required then 'ACTION_REQUIRED' else 'UNREAD' end,p_action_required,p_action_path,p_dedupe_key,coalesce(p_metadata,'{}'::jsonb))
 on conflict(recipient_user_id,dedupe_key) where dedupe_key is not null
 do update set priority=excluded.priority,title=excluded.title,safe_message=excluded.safe_message,
   action_required=excluded.action_required,action_path=excluded.action_path,metadata=excluded.metadata
 returning id into v_id;
 insert into public.notification_delivery_history(notification_id,channel,event,delivery_state,attempt_no)
 values(v_id,'IN_APP','EMITTED','IN_APP_READY',0);
 return v_id;
end $$;
revoke all on function public.jb_notification_emit_internal(uuid,text,text,text,text,text,text,text,boolean,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.jb_notification_emit_internal(uuid,text,text,text,text,text,text,text,boolean,text,text,jsonb) to service_role;

create or replace function public.jb_notification_delivery_attempt_internal(
 p_notification_id bigint,p_channel text,p_success boolean,p_error_code text default null,p_retry_after timestamptz default null
) returns boolean language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare v_attempt integer;
begin
 select delivery_attempts+1 into v_attempt from public.live_notifications where id=p_notification_id for update;
 if v_attempt is null then return false; end if;
 update public.live_notifications set delivery_attempts=v_attempt,
  delivery_state=case when p_success then 'EXTERNAL_SENT' when p_retry_after is not null then 'EXTERNAL_RETRY' else 'EXTERNAL_FAILED' end,
  last_delivery_error_code=case when p_success then null else left(coalesce(p_error_code,'DELIVERY_FAILED'),120) end,
  next_retry_at=case when p_success then null else p_retry_after end
 where id=p_notification_id;
 insert into public.notification_delivery_history(notification_id,channel,event,delivery_state,attempt_no,error_code)
 values(p_notification_id,left(coalesce(p_channel,'EXTERNAL'),40),case when p_success then 'DELIVERED' else 'FAILED' end,
 case when p_success then 'EXTERNAL_SENT' when p_retry_after is not null then 'EXTERNAL_RETRY' else 'EXTERNAL_FAILED' end,v_attempt,
 case when p_success then null else left(coalesce(p_error_code,'DELIVERY_FAILED'),120) end);
 return true;
end $$;
revoke all on function public.jb_notification_delivery_attempt_internal(bigint,text,boolean,text,timestamptz) from public,anon,authenticated;
grant execute on function public.jb_notification_delivery_attempt_internal(bigint,text,boolean,text,timestamptz) to service_role;

insert into public.record_retention_policies(policy_key,domain,record_type,default_retention_days,automatic_disposition,notes,active)
values('notification_history_v1','notifications','notification_history',365,false,'Phase 4 B3 delivery/lifecycle history; distinct from audit log.',true)
on conflict(policy_key) do update set notes=excluded.notes,active=true,updated_at=now();