-- Phase 4 B2 minimum regression repair:
-- preserve Phase-3 routine Live retention cleanup while immutable audit history stays protected.
create or replace function private.jb_audit_immutable_guard()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if coalesce(current_setting('jb.audit_maintenance',true),'')='on' then
    return case when tg_op='DELETE' then old else new end;
  end if;

  -- Phase-3 already classifies selected Live audit rows as ROUTINE_TEMPORARY and
  -- explicitly unprotected from routine cleanup. Preserve that locked lifecycle.
  if tg_op='DELETE' and exists(
    select 1
    from public.live_retention_registry r
    where r.record_type='audit_log'
      and r.record_id=old.id::text
      and r.record_class='ROUTINE_TEMPORARY'
      and r.protected_from_routine_cleanup=false
      and r.cleaned_at is null
  ) then
    return old;
  end if;

  raise exception 'AUDIT_HISTORY_IMMUTABLE';
end;
$$;

revoke all on function private.jb_audit_immutable_guard()
from public,anon,authenticated;