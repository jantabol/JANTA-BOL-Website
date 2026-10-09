-- Phase 4 B3 canonical domain adapter. Domains retain trigger/state ownership; Topic 7 owns delivery.
create or replace function public.jb_notification_emit_domain_internal(
 p_actor uuid,p_domain text,p_event text,p_record_type text,p_record_id text,
 p_consequence text,p_title text,p_safe_message text,p_recipient_user_id uuid default null,
 p_action_required boolean default false,p_action_path text default null,p_dedupe_key text default null,
 p_metadata jsonb default '{}'::jsonb
) returns integer language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare v_priority text; v_recipient uuid; v_count integer:=0; v_actor_role public.app_role;
begin
 select role into v_actor_role from public.user_roles where user_id=p_actor;
 if v_actor_role is null then raise exception 'ACTOR_NOT_AUTHORIZED'; end if;
 if p_domain not in ('live','grievance','compliance','social','ads','security','team','system') then raise exception 'UNSUPPORTED_NOTIFICATION_DOMAIN'; end if;
 if p_consequence not in ('ROUTINE','ATTENTION','CRITICAL') then raise exception 'INVALID_CONSEQUENCE'; end if;
 v_priority:=case p_consequence when 'CRITICAL' then 'CRITICAL' when 'ATTENTION' then 'HIGH' else 'NORMAL' end;
 if p_recipient_user_id is not null then
   perform public.jb_notification_emit_internal(p_recipient_user_id,p_domain,p_event,v_priority,p_title,p_safe_message,p_record_type,p_record_id,p_action_required,p_action_path,p_dedupe_key,p_metadata);
   return 1;
 end if;
 -- No arbitrary broadcast: default routing is Founder/owner only for attention/critical.
 if p_consequence='ROUTINE' then return 0; end if;
 for v_recipient in select user_id from public.user_roles where role='owner'::public.app_role loop
   perform public.jb_notification_emit_internal(v_recipient,p_domain,p_event,v_priority,p_title,p_safe_message,p_record_type,p_record_id,p_action_required,p_action_path,
     case when p_dedupe_key is null then null else p_dedupe_key||':'||v_recipient::text end,p_metadata);
   v_count:=v_count+1;
 end loop;
 return v_count;
end $$;
revoke all on function public.jb_notification_emit_domain_internal(uuid,text,text,text,text,text,text,text,uuid,boolean,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.jb_notification_emit_domain_internal(uuid,text,text,text,text,text,text,text,uuid,boolean,text,text,jsonb) to service_role;