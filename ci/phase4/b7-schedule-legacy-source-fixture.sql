\set ON_ERROR_STOP on
-- Exact original JANTA BOL Owner schedule RPC behavior from read-only 12 Oct
-- introspection. Disposable synthetic PG fixture only, not to Production.
create or replace function public.jb_ad_schedule_internal(
 p_campaign uuid,p_starts_at timestamptz,p_ends_at timestamptz
) returns boolean language plpgsql security definer
set search_path to 'pg_catalog','public','private'
as $function$
begin
 if not private.p4_owner_allowed() then raise exception 'OWNER_AAL2_REQUIRED'; end if;
 if p_starts_at is null or p_ends_at is null or p_ends_at<=p_starts_at
 then raise exception 'INVALID_SCHEDULE'; end if;
 update public.ad_campaigns set starts_at=p_starts_at,ends_at=p_ends_at,updated_at=now() where id=p_campaign;
 if not found then raise exception 'AD_CAMPAIGN_NOT_FOUND'; end if;
 insert into public.ad_history(campaign_id,event_type,note,actor_user_id)
 values(p_campaign,'scheduled',p_starts_at::text||' -> '||p_ends_at::text,auth.uid());
 return true;
end $function$;
