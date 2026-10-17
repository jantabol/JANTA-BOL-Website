-- Phase 4 B3: route protected Phase-3 Live notifications through the unified engine.
create or replace function private.jb_live_safe_notify(
 p_recipient uuid,p_type text,p_priority text,p_title text,p_message text,p_record_type text,p_record_id text
) returns void language plpgsql security definer set search_path='' as $$
declare v_action boolean; v_path text; v_key text;
begin
 if p_recipient is null then return; end if;
 v_action := p_priority in ('HIGH','CRITICAL') or p_type in ('LIVE_REQUEST','LIVE_OPERATION_ATTENTION');
 v_path := case
   when p_record_type in ('live_request','live_session','live_operation') then 'live.html'
   else null end;
 v_key := case
   when p_type in ('LIVE_REQUEST','LIVE_OPERATION_ATTENTION') then 'live:'||coalesce(p_type,'')||':'||coalesce(p_record_id,'')
   else null end;
 perform public.jb_notification_emit_internal(
   p_recipient,'live',
   left(coalesce(nullif(btrim(p_type),''),'LIVE_UPDATE'),80),
   case when p_priority in ('NORMAL','HIGH','CRITICAL') then p_priority else 'NORMAL' end,
   left(coalesce(nullif(btrim(p_title),''),'JANTA BOL Live'),180),
   left(coalesce(p_message,''),500),
   left(coalesce(nullif(btrim(p_record_type),''),'live'),80),
   left(coalesce(p_record_id,''),160),
   v_action,v_path,v_key,
   jsonb_build_object('source','phase3_live')
 );
exception when others then return;
end $$;