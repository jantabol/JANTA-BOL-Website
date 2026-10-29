-- JANTA BOL / P4-T039 / ADS-041 — SAFE LOGOUT ADDITIVE REVIEW ONLY.
-- DO NOT APPLY TO PRODUCTION before paired verified Owner/account E2/E5.
-- The current deployed portal clears only sessionStorage on logout, leaving
-- the opaque 12-hour SERVER token valid. This is the FIRST DIVERGENCE.
begin;
do $preflight$
begin
 if to_regclass('public.ad_portal_sessions') is null
    or to_regclass('public.ad_history') is null
 then raise exception 'T039_EXISTING_PORTAL_AUTHORITY_MISSING'; end if;
 if to_regprocedure('public.jb_ad_portal_logout(text)') is not null
 then raise exception 'T039_LOGOUT_ALREADY_DEFINED_REVIEW_DIFF_REQUIRED'; end if;
end $preflight$;

-- A 192-bit bearer may revoke ONLY its own matched session. This cannot
-- issue sessions, change campaigns, modify media, or see advertiser data.
-- Never expose the token, hash, user PII, or other campaign in a response.
create function public.jb_ad_portal_logout(p_token text)
returns boolean language plpgsql security definer
set search_path to 'pg_catalog'
as $logout$
declare v_campaign uuid;
begin
 if p_token is null or p_token !~ '^[0-9a-f]{48}$'
 then return false; end if;
 update public.ad_portal_sessions s
 set revoked_at=clock_timestamp()
 where s.token_hash=encode(extensions.digest(p_token,'sha256'),'hex')
   and s.revoked_at is null and s.expires_at>now()
 returning s.campaign_id into v_campaign;
 if not found then return false; end if;
 insert into public.ad_history(campaign_id,event_type,note,actor_user_id)
 values(v_campaign,'portal_session_logout',
    'Advertiser explicitly revoked current opaque portal session',null);
 return true;
end $logout$;
revoke all on function public.jb_ad_portal_logout(text)
 from public,anon,authenticated;
grant execute on function public.jb_ad_portal_logout(text)
 to anon,authenticated;
commit;
