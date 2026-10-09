-- P4-T018 escalation authority compatibility migration; deployed to LIVE 2026-10-08.
-- Named RPC args preserved: p_id uuid, p_note text, p_ready boolean.
-- Preserves original escalation_ready_at, history and audit semantics.
create or replace function public.jb_compliance_set_escalation_ready_internal(p_id uuid,p_note text,p_ready boolean)
returns boolean language plpgsql security definer set search_path=pg_catalog,public,private as $$
begin
 if not private.p4_owner_allowed() then raise exception 'OWNER_AAL2_REQUIRED'; end if;
 update public.compliance_tasks set escalation_ready=p_ready,escalation_ready_at=case when p_ready then now() else null end,updated_at=now() where id=p_id;
 if not found then raise exception 'COMPLIANCE_TASK_NOT_FOUND'; end if;
 insert into public.compliance_history(task_id,event_type,note,actor_user_id) values(p_id,case when p_ready then 'escalation_ready' else 'escalation_cleared' end,left(coalesce(p_note,''),1000),auth.uid());
 insert into public.audit_logs(actor_user_id,action,record_type,record_id,metadata) values(auth.uid(),'COMPLIANCE_ESCALATION_READY','compliance_task',p_id::text,jsonb_build_object('ready',p_ready,'note',left(coalesce(p_note,''),1000)));
 return true;
end $$;
revoke all on function public.jb_compliance_set_escalation_ready_internal(uuid,text,boolean) from public,anon;
grant execute on function public.jb_compliance_set_escalation_ready_internal(uuid,text,boolean) to authenticated;
