-- Phase 4 B3 hardening: privacy, explicit consequence priority, active-recipient routing, due/reminder scheduling.
alter table public.live_notifications
  add column if not exists consequence text not null default 'ROUTINE',
  add column if not exists reminder_interval_minutes integer check (reminder_interval_minutes is null or reminder_interval_minutes >= 15);

alter table public.live_notifications drop constraint if exists live_notifications_consequence_check;
alter table public.live_notifications add constraint live_notifications_consequence_check
 check(consequence in ('ROUTINE','ATTENTION','CRITICAL'));

create or replace function public.jb_notification_emit_internal(
 p_recipient_user_id uuid, p_domain text, p_notification_type text, p_priority text,
 p_title text, p_safe_message text default '', p_record_type text default null,
 p_record_id text default null, p_action_required boolean default false,
 p_action_path text default null, p_dedupe_key text default null, p_metadata jsonb default '{}'::jsonb
) returns bigint language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare v_id bigint; v_role public.app_role; v_status text; v_consequence text; v_effective_priority text;
begin
 if p_domain not in ('live','grievance','compliance','social','ads','security','team','system') then raise exception 'UNSUPPORTED_NOTIFICATION_DOMAIN'; end if;
 if p_priority not in ('NORMAL','HIGH','CRITICAL') then raise exception 'INVALID_NOTIFICATION_PRIORITY'; end if;
 if coalesce(p_title,'') ~* '(token|password|secret|recovery[ _-]?key|source[ _-]?identity)' or
    coalesce(p_safe_message,'') ~* '(token|password|secret|recovery[ _-]?key|source[ _-]?identity)' then raise exception 'UNSAFE_NOTIFICATION_CONTENT'; end if;
 select role into v_role from public.user_roles where user_id=p_recipient_user_id;
 if v_role is null then raise exception 'RECIPIENT_NOT_AUTHORIZED'; end if;
 select status into v_status from public.team_accounts where user_id=p_recipient_user_id;
 if v_status is not null and lower(v_status)<>'active' then raise exception 'RECIPIENT_REVOKED'; end if;
 v_consequence:=case when p_priority='CRITICAL' then 'CRITICAL' when p_priority='HIGH' or p_action_required then 'ATTENTION' else 'ROUTINE' end;
 v_effective_priority:=case v_consequence when 'CRITICAL' then 'CRITICAL' when 'ATTENTION' then 'HIGH' else 'NORMAL' end;
 insert into public.live_notifications(recipient_user_id,domain,notification_type,priority,consequence,title,safe_message,record_type,record_id,lifecycle_state,action_required,action_path,dedupe_key,metadata)
 values(p_recipient_user_id,p_domain,p_notification_type,v_effective_priority,v_consequence,left(p_title,180),left(p_safe_message,500),coalesce(p_record_type,p_domain),left(p_record_id,160),case when p_action_required then 'ACTION_REQUIRED' else 'UNREAD' end,p_action_required,p_action_path,p_dedupe_key,coalesce(p_metadata,'{}'::jsonb))
 on conflict(recipient_user_id,dedupe_key) where dedupe_key is not null
 do update set priority=excluded.priority,consequence=excluded.consequence,title=excluded.title,safe_message=excluded.safe_message,
   action_required=excluded.action_required,action_path=excluded.action_path,metadata=excluded.metadata
 returning id into v_id;
 if not exists(select 1 from public.notification_delivery_history where notification_id=v_id and event='EMITTED') then
   insert into public.notification_delivery_history(notification_id,channel,event,delivery_state,attempt_no)
   values(v_id,'IN_APP','EMITTED','IN_APP_READY',0);
 end if;
 insert into public.record_retention_state(domain,record_type,record_id,policy_key,lifecycle_state,updated_at)
 values('notifications','notification_history',v_id::text,'notification_history_v1','active',now())
 on conflict(domain,record_type,record_id) do nothing;
 return v_id;
end $$;

create or replace function public.jb_notification_due_reminders_internal(p_now timestamptz default now())
returns integer language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare r record; v_count integer:=0;
begin
 for r in
  select id,due_at,last_reminded_at,reminder_interval_minutes
  from public.live_notifications
  where action_required=true and resolved_at is null and due_at is not null
    and due_at<=p_now
    and (last_reminded_at is null or last_reminded_at <= p_now-make_interval(mins=>greatest(coalesce(reminder_interval_minutes,60),15)))
  order by due_at asc limit 100
 loop
  perform public.jb_notification_remind_internal(r.id,true); v_count:=v_count+1;
 end loop;
 return v_count;
end $$;
revoke all on function public.jb_notification_due_reminders_internal(timestamptz) from public,anon,authenticated;
grant execute on function public.jb_notification_due_reminders_internal(timestamptz) to service_role;