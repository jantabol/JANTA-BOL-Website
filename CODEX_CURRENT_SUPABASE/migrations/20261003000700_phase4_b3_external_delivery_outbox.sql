-- Phase 4 B3: external channel outbox. In-app state remains authoritative.
create table if not exists public.notification_delivery_outbox(
 id bigint generated always as identity primary key,
 notification_id bigint not null references public.live_notifications(id) on delete cascade,
 channel text not null,
 state text not null default 'PENDING' check(state in ('PENDING','LEASED','RETRY','SENT','FAILED')),
 attempt_count integer not null default 0 check(attempt_count>=0),
 next_attempt_at timestamptz not null default now(),
 lease_until timestamptz,
 safe_error_code text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(notification_id,channel)
);
alter table public.notification_delivery_outbox enable row level security;
revoke all on table public.notification_delivery_outbox from public,anon,authenticated;
grant select,insert,update,delete on table public.notification_delivery_outbox to service_role;
create index if not exists notification_delivery_outbox_due_idx on public.notification_delivery_outbox(state,next_attempt_at) where state in ('PENDING','RETRY');

create or replace function public.jb_notification_external_enqueue_internal(p_notification_id bigint,p_channel text)
returns bigint language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare v_id bigint;
begin
 if p_channel not in ('EMAIL','PUSH','SMS','WHATSAPP') then raise exception 'UNSUPPORTED_EXTERNAL_CHANNEL'; end if;
 if not exists(select 1 from public.live_notifications where id=p_notification_id) then raise exception 'NOTIFICATION_NOT_FOUND'; end if;
 insert into public.notification_delivery_outbox(notification_id,channel)
 values(p_notification_id,p_channel)
 on conflict(notification_id,channel) do update set updated_at=now()
 returning id into v_id;
 update public.live_notifications set delivery_state='EXTERNAL_PENDING' where id=p_notification_id and delivery_state='IN_APP_READY';
 return v_id;
end $$;
revoke all on function public.jb_notification_external_enqueue_internal(bigint,text) from public,anon,authenticated;
grant execute on function public.jb_notification_external_enqueue_internal(bigint,text) to service_role;

create or replace function public.jb_notification_external_result_internal(p_outbox_id bigint,p_success boolean,p_safe_error_code text default null,p_retry_minutes integer default 15)
returns boolean language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare v_row public.notification_delivery_outbox%rowtype; v_retry timestamptz;
begin
 select * into v_row from public.notification_delivery_outbox where id=p_outbox_id for update;
 if not found then return false; end if;
 if v_row.state='SENT' and p_success then return true; end if;
 v_retry:=case when p_success then null else now()+make_interval(mins=>greatest(coalesce(p_retry_minutes,15),15)) end;
 update public.notification_delivery_outbox set
   state=case when p_success then 'SENT' when attempt_count+1>=5 then 'FAILED' else 'RETRY' end,
   attempt_count=attempt_count+1,
   next_attempt_at=coalesce(v_retry,next_attempt_at),lease_until=null,
   safe_error_code=case when p_success then null else left(coalesce(p_safe_error_code,'DELIVERY_FAILED'),120) end,updated_at=now()
 where id=p_outbox_id;
 perform public.jb_notification_delivery_attempt_internal(v_row.notification_id,v_row.channel,p_success,
   case when p_success then null else left(coalesce(p_safe_error_code,'DELIVERY_FAILED'),120) end,
   case when p_success or v_row.attempt_count+1>=5 then null else v_retry end);
 return true;
end $$;
revoke all on function public.jb_notification_external_result_internal(bigint,boolean,text,integer) from public,anon,authenticated;
grant execute on function public.jb_notification_external_result_internal(bigint,boolean,text,integer) to service_role;