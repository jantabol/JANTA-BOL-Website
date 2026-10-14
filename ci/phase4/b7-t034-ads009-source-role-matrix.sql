\set ON_ERROR_STOP on
-- ADS-009 disposable PG17 simulated role matrix using EXACT live function bodies.
-- TEST IS SYNTHETIC, not real Supabase user/token proof.
BEGIN;
CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth; CREATE SCHEMA private;
CREATE TYPE public.app_role AS ENUM ('owner','admin','editor','reporter');
CREATE TABLE public.user_roles(user_id uuid PRIMARY KEY,role public.app_role);
CREATE TABLE public.team_accounts(user_id uuid PRIMARY KEY,status text);
CREATE TABLE auth.sessions(id uuid PRIMARY KEY,user_id uuid);
CREATE TABLE public.advertisers(id uuid PRIMARY KEY,risk_level text,verification_state text,updated_at timestamptz);
CREATE TABLE public.ad_campaigns(id uuid PRIMARY KEY,advertiser_id uuid REFERENCES public.advertisers(id),status text,approved_by uuid,approved_at timestamptz,hidden_at timestamptz,updated_at timestamptz);
CREATE TABLE public.ad_payments(campaign_id uuid,status text);
CREATE TABLE public.ad_history(campaign_id uuid,event_type text,note text,actor_user_id uuid);
CREATE TABLE public.audit_logs(actor_user_id uuid,action text,record_type text,record_id text,metadata jsonb,created_at timestamptz);
INSERT INTO public.user_roles VALUES ('30000000-0000-4000-8000-000000000001','owner'),('30000000-0000-4000-8000-000000000002','reporter');
INSERT INTO public.team_accounts VALUES ('30000000-0000-4000-8000-000000000002','active');
INSERT INTO auth.sessions VALUES
('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001'),
('40000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002'),
('40000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000003');
INSERT INTO public.advertisers VALUES ('10000000-0000-4000-8000-000000000001','normal','pending',now());
INSERT INTO public.ad_campaigns VALUES ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','requested',null,null,null,now());

-- live-source auth.jwt prosrc_md5=2db09c3fc855ba90e71d3ae28cfadae3
CREATE OR REPLACE FUNCTION auth.jwt()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$function$;

-- live-source auth.uid prosrc_md5=cdef18c69c4f4cbbced2eaf81e628b49
CREATE OR REPLACE FUNCTION auth.uid()
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$function$;

-- live-source private.current_session_id prosrc_md5=7ed949c9b96018eb0b0c2d65b50ce656
CREATE OR REPLACE FUNCTION private.current_session_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'auth', 'pg_temp'
AS $function$
declare
  v_raw text:=coalesce(auth.jwt()->>'session_id','');
begin
  if v_raw !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return null;
  end if;
  return v_raw::uuid;
exception when others then
  return null;
end;
$function$;

-- live-source private.current_session_active prosrc_md5=c4d3f65445feedb232b407dd74e6e466
CREATE OR REPLACE FUNCTION private.current_session_active()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'auth', 'pg_temp'
AS $function$
  select exists(
    select 1
    from auth.sessions s
    where s.id=private.current_session_id()
      and s.user_id=auth.uid()
  )
$function$;

-- live-source private.current_app_role prosrc_md5=7ab9cc3044ab09138d86f11a8d268047
CREATE OR REPLACE FUNCTION private.current_app_role()
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'private', 'auth', 'pg_temp'
AS $function$
  select ur.role
  from public.user_roles ur
  where ur.user_id = auth.uid()
    and (
      ur.role = 'owner'::public.app_role
      or exists (
        select 1
        from public.team_accounts ta
        where ta.user_id=ur.user_id
          and ta.status='active'
      )
    )
  limit 1;
$function$;

-- live-source private.current_owner_aal2 prosrc_md5=5d7ed08cfc21128fdde4e170e54e2d21
CREATE OR REPLACE FUNCTION private.current_owner_aal2()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'private', 'auth', 'pg_temp'
AS $function$
  select private.current_app_role()='owner'::public.app_role
     and coalesce(auth.jwt()->>'aal','')='aal2'
     and private.current_session_active()
$function$;

-- live-source private.p4_owner_allowed prosrc_md5=dabade6d7ee3190bac349700a490b232
CREATE OR REPLACE FUNCTION private.p4_owner_allowed()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$ select exists(select 1 from public.user_roles ur where ur.user_id=auth.uid() and ur.role::text='owner') and private.current_owner_aal2(); $function$;

-- live-source public.jb_ad_transition_internal prosrc_md5=028c0bf7103e92e115156048cf81972c
CREATE OR REPLACE FUNCTION public.jb_ad_transition_internal(p_id uuid, p_status text, p_note text DEFAULT ''::text)
 RETURNS ad_campaigns
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare
  v public.ad_campaigns;
begin
  if not private.p4_owner_allowed() then
    raise exception 'OWNER_AAL2_REQUIRED';
  end if;

  if p_status not in ('review','approved','payment_pending','live','paused','hidden','expired','rejected','cancelled') then
    raise exception 'INVALID_AD_STATUS';
  end if;

  if p_status in ('approved','payment_pending','live')
     and exists (
       select 1
       from public.ad_campaigns c
       join public.advertisers a on a.id = c.advertiser_id
       where c.id = p_id
         and a.risk_level = 'high'
         and a.verification_state <> 'verified'
     )
  then
    raise exception 'ENHANCED_VERIFICATION_REQUIRED';
  end if;

  if p_status='live'
     and not exists (
       select 1 from public.ad_payments
       where campaign_id=p_id and status='confirmed'
     )
  then
    raise exception 'PAYMENT_NOT_CONFIRMED';
  end if;

  update public.ad_campaigns
  set status=p_status,
      approved_by=case when p_status='approved' then auth.uid() else approved_by end,
      approved_at=case when p_status='approved' then now() else approved_at end,
      hidden_at=case when p_status='hidden' then now() else hidden_at end,
      updated_at=now()
  where id=p_id
  returning * into v;

  if not found then
    raise exception 'AD_CAMPAIGN_NOT_FOUND';
  end if;

  insert into public.ad_history(campaign_id,event_type,note,actor_user_id)
  values(p_id,p_status,left(coalesce(p_note,''),2000),auth.uid());

  insert into public.audit_logs(actor_user_id,action,record_type,record_id,metadata,created_at)
  values(auth.uid(),'ad_status','ad_campaign',p_id::text,jsonb_build_object('status',p_status),now());

  return v;
end
$function$;

-- live-source public.jb_ad_verify_advertiser_internal prosrc_md5=95e2ec446879d106a9f7e79530ad71e1
CREATE OR REPLACE FUNCTION public.jb_ad_verify_advertiser_internal(p_advertiser uuid, p_state text, p_note text, p_evidence_ref text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private'
AS $function$
declare v public.advertisers;v_note text;v_ref text;
begin
 if not private.p4_owner_allowed() then
   raise exception 'OWNER_AAL2_REQUIRED';end if;
 v_note:=btrim(coalesce(p_note,''));
 v_ref:=btrim(coalesce(p_evidence_ref,''));
 if p_state is null or p_state not in ('verified','rejected','pending') or length(v_note)<8 or length(v_note)>1000
 then raise exception 'INVALID_VERIFICATION_DECISION';end if;
 if length(v_ref)>300 then raise exception 'INVALID_EVIDENCE_REFERENCE';end if;
 select * into v from public.advertisers where id=p_advertiser for update;
 if not found then raise exception 'ADVERTISER_NOT_FOUND';end if;
 if v.risk_level='high' and p_state='verified' and length(v_ref)<8 then
   raise exception 'ENHANCED_VERIFICATION_EVIDENCE_REQUIRED';end if;
 update public.advertisers set verification_state=p_state,updated_at=now()
 where id=p_advertiser;
 insert into public.ad_history(campaign_id,event_type,note,actor_user_id)
 select c.id,'verification_'||p_state,left(v_note||case when v_ref='' then '' else '; evidence reference='||v_ref end,1500),auth.uid()
 from public.ad_campaigns c where c.advertiser_id=p_advertiser;
 insert into public.audit_logs(actor_user_id,action,record_type,record_id,metadata,created_at)
 values(auth.uid(),'ad_verification','advertiser',p_advertiser::text,
        jsonb_build_object('state',p_state,'high_risk',v.risk_level='high',
                           'evidence_provided',v_ref<>''),now());
end $function$;

REVOKE EXECUTE ON FUNCTION public.jb_ad_verify_advertiser_internal(uuid,text,text,text) FROM PUBLIC,anon;
REVOKE EXECUTE ON FUNCTION public.jb_ad_transition_internal(uuid,text,text) FROM PUBLIC,anon;
GRANT USAGE ON SCHEMA public TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.jb_ad_verify_advertiser_internal(uuid,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.jb_ad_transition_internal(uuid,text,text) TO authenticated;
DO $$
DECLARE r record; digest text;
BEGIN
 FOR r IN SELECT * FROM (VALUES
('auth.jwt','2db09c3fc855ba90e71d3ae28cfadae3'),
('auth.uid','cdef18c69c4f4cbbced2eaf81e628b49'),
('private.current_session_id','7ed949c9b96018eb0b0c2d65b50ce656'),
('private.current_session_active','c4d3f65445feedb232b407dd74e6e466'),
('private.current_app_role','7ab9cc3044ab09138d86f11a8d268047'),
('private.current_owner_aal2','5d7ed08cfc21128fdde4e170e54e2d21'),
('private.p4_owner_allowed','dabade6d7ee3190bac349700a490b232'),
('public.jb_ad_transition_internal','028c0bf7103e92e115156048cf81972c'),
('public.jb_ad_verify_advertiser_internal','95e2ec446879d106a9f7e79530ad71e1')
 ) v(fname,expected) LOOP
   SELECT md5(p.prosrc) INTO digest FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname||'.'||p.proname=r.fname;
   IF digest IS DISTINCT FROM r.expected THEN RAISE EXCEPTION 'SOURCE_MISMATCH: %',r.fname; END IF;
 END LOOP;
 RAISE NOTICE 'PASS ADS009 live function bodies exact source parity 9/9';
END $$;
CREATE FUNCTION public.ads009_denied(p_actor text) RETURNS void LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE m text;
BEGIN
 BEGIN
  PERFORM public.jb_ad_transition_internal('20000000-0000-4000-8000-000000000001','approved','TEST ONLY');
  RAISE EXCEPTION 'APPROVAL_UNAUTHORIZED_SUCCESS';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS m=MESSAGE_TEXT;
  IF m <> 'OWNER_AAL2_REQUIRED' AND m NOT LIKE '%permission denied%' THEN RAISE EXCEPTION 'ADS009_BAD_APPROVAL_DENIAL [%] %',p_actor,m; END IF;
 END;
 BEGIN
  PERFORM public.jb_ad_verify_advertiser_internal('10000000-0000-4000-8000-000000000001','verified','SYNTHETIC AUDIT NOTE',null);
  RAISE EXCEPTION 'VERIFICATION_UNAUTHORIZED_SUCCESS';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS m=MESSAGE_TEXT;
  IF m <> 'OWNER_AAL2_REQUIRED' AND m NOT LIKE '%permission denied%' THEN RAISE EXCEPTION 'ADS009_BAD_VERIFICATION_DENIAL [%] %',p_actor,m; END IF;
 END;
 RAISE NOTICE 'PASS ADS009 synthetic % denied both privileged operations',p_actor;
END $$;
SET LOCAL ROLE anon;
SELECT public.ads009_denied('ANON');
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000002',true);
SELECT set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000002","aal":"aal2","session_id":"40000000-0000-4000-8000-000000000002"}',true);
SET LOCAL ROLE authenticated;
SELECT public.ads009_denied('REPORTER');
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000003',true);
SELECT set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000003","aal":"aal2","session_id":"40000000-0000-4000-8000-000000000003"}',true);
SET LOCAL ROLE authenticated;
SELECT public.ads009_denied('ADVERTISER');
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',true);
SELECT set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000001","aal":"aal1","session_id":"40000000-0000-4000-8000-000000000001"}',true);
SET LOCAL ROLE authenticated;
SELECT public.ads009_denied('OWNER_AAL1');
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',true);
SELECT set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000001","aal":"aal2","session_id":"40000000-0000-4000-8000-000000000009"}',true);
SET LOCAL ROLE authenticated;
SELECT public.ads009_denied('OWNER_REVOKED');
RESET ROLE;

DO $$ BEGIN
IF (SELECT status FROM public.ad_campaigns) <> 'requested'
 OR (SELECT approved_at FROM public.ad_campaigns) IS NOT NULL
 OR (SELECT verification_state FROM public.advertisers) <> 'pending'
 OR (SELECT count(*) FROM public.ad_history)<>0
 OR (SELECT count(*) FROM public.audit_logs)<>0
THEN RAISE EXCEPTION 'ADS009_NEGATIVE_STATE_OR_AUDIT_MUTATED'; END IF;
RAISE NOTICE 'PASS ADS009 ten denied operations, no mutations/audit success';
END $$;
-- Positive owner AAL2 control, synthetic only.
SELECT set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',true);
SELECT set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000001","aal":"aal2","session_id":"40000000-0000-4000-8000-000000000001"}',true);
SET LOCAL ROLE authenticated;
SELECT status FROM public.jb_ad_transition_internal('20000000-0000-4000-8000-000000000001','approved','SYNTHETIC OWNER');
SELECT public.jb_ad_verify_advertiser_internal('10000000-0000-4000-8000-000000000001','verified','SYNTHETIC OWNER VERIFIED',null);
RESET ROLE;
DO $$ BEGIN
IF (SELECT status FROM public.ad_campaigns)<>'approved'
 OR (SELECT verification_state FROM public.advertisers)<>'verified'
 OR (SELECT count(*) FROM public.ad_history)<>2
 OR (SELECT count(*) FROM public.audit_logs)<>2
THEN RAISE EXCEPTION 'ADS009_OWNER_POSITIVE_BROKEN'; END IF;
RAISE NOTICE 'PASS ADS009 owner AAL2 positive, history and audit 2/2';
END $$;
ROLLBACK;
