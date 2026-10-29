-- JANTA BOL Phase 3C M3.1 — Generic encoder connector delivery modes
-- Applied after phase3c-m3-central-live-engine.sql.

alter table public.live_encoder_connectors
  add column if not exists launch_delivery_mode text not null default 'DIRECT_REDIRECT';

do $$ begin
  alter table public.live_encoder_connectors
    add constraint live_encoder_connectors_delivery_mode_check
    check (launch_delivery_mode in ('DIRECT_REDIRECT','LOCAL_CLIPBOARD_BRIDGE'));
exception when duplicate_object then null; end $$;

update public.live_encoder_connectors
set launch_delivery_mode='DIRECT_REDIRECT', updated_at=now()
where connector_key='larix_android';

update public.live_encoder_connectors
set launch_delivery_mode='LOCAL_CLIPBOARD_BRIDGE', updated_at=now()
where connector_key='lols_irl_android';

create or replace function public.jb_live_select_encoder_connector_internal()
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
declare
  cfg public.live_encoder_engine_settings%rowtype;
  c public.live_encoder_connectors%rowtype;
  selected_slot text:='ACTIVE';
begin
  select * into cfg from public.live_encoder_engine_settings where singleton_id=true;
  if not found then raise exception 'ENCODER_ENGINE_NOT_CONFIGURED'; end if;

  select * into c from public.live_encoder_connectors
  where connector_key=cfg.active_connector_key
    and switch_enabled=true
    and operational_state in ('READY','LIMITED');

  if not found and cfg.auto_fallback_enabled and cfg.fallback_connector_key is not null then
    select * into c from public.live_encoder_connectors
    where connector_key=cfg.fallback_connector_key
      and switch_enabled=true
      and operational_state in ('READY','LIMITED');
    selected_slot:='FALLBACK';
  end if;

  if c.connector_key is null then raise exception 'ENCODER_CONNECTOR_UNAVAILABLE'; end if;

  return jsonb_build_object(
    'connector_key',c.connector_key,
    'display_name',c.display_name,
    'connector_kind',c.connector_kind,
    'operational_state',c.operational_state,
    'platform',c.platform,
    'launch_scheme',c.launch_scheme,
    'launch_delivery_mode',c.launch_delivery_mode,
    'android_package',c.android_package,
    'install_url',c.install_url,
    'handler_slug',c.handler_slug,
    'selected_slot',selected_slot,
    'config_version',cfg.config_version
  );
end
$function$;

create or replace function public.jb_live_create_handoff_internal(
  p_user_id uuid,
  p_session_id uuid,
  p_token_hash text,
  p_ttl_seconds integer default 90
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_session public.live_sessions%rowtype;
  v_member public.live_session_members%rowtype;
  v_gen public.live_provider_generations%rowtype;
  v_handoff uuid;
  v_exp timestamptz;
  v_ttl integer:=greatest(30,least(coalesce(p_ttl_seconds,90),180));
  v_connector jsonb;
  v_connector_key text;
begin
  if char_length(coalesce(p_token_hash,''))<32 then raise exception 'HANDOFF_HASH_INVALID'; end if;

  select * into v_session from public.live_sessions where id=p_session_id for update;
  if not found then raise exception 'LIVE_SESSION_NOT_FOUND'; end if;
  if v_session.assigned_reporter_id<>p_user_id then raise exception 'LIVE_SESSION_NOT_ASSIGNED'; end if;
  if v_session.session_status not in ('READY','WAITING_SIGNAL','RECONNECTING','LIVE') then raise exception 'LIVE_SESSION_NOT_CAMERA_ELIGIBLE'; end if;
  if v_session.current_provider_generation is null then raise exception 'PROVIDER_GENERATION_MISSING'; end if;

  select * into v_member
  from public.live_session_members
  where session_id=p_session_id and user_id=p_user_id and permission='BROADCAST'
  for update;
  if not found or v_member.status<>'ACTIVE' then raise exception 'LIVE_PERMISSION_NOT_ACTIVE'; end if;

  select * into v_gen
  from public.live_provider_generations
  where generation_id=v_session.current_provider_generation and session_id=p_session_id
  for update;
  if not found or v_gen.is_current<>true then raise exception 'STALE_PROVIDER_GENERATION'; end if;
  if v_gen.provider_state not in ('READY','ACTIVE') then raise exception 'PROVIDER_NOT_READY'; end if;
  if v_gen.credential_status in ('RETIRE_PENDING','RETIRED','COMPROMISED') then raise exception 'PROVIDER_CREDENTIAL_UNUSABLE'; end if;

  v_connector:=public.jb_live_select_encoder_connector_internal();
  v_connector_key:=v_connector->>'connector_key';
  if coalesce(v_connector_key,'')='' then raise exception 'ENCODER_CONNECTOR_UNAVAILABLE'; end if;

  update public.encoder_handoffs
  set revoked_at=now()
  where session_id=p_session_id and reporter_id=p_user_id and generation_id=v_gen.generation_id
    and used_at is null and revoked_at is null;

  v_exp:=now()+make_interval(secs=>v_ttl);
  insert into public.encoder_handoffs(
    token_hash,session_id,reporter_id,generation_id,grant_version,expires_at,connector_key
  ) values (
    p_token_hash,p_session_id,p_user_id,v_gen.generation_id,v_member.grant_version,v_exp,v_connector_key
  ) returning handoff_id into v_handoff;

  insert into public.audit_logs(actor_user_id,action,record_type,record_id,metadata)
  values(p_user_id,'encoder_handoff_created','encoder_handoff',v_handoff::text,
    jsonb_build_object('session_id',p_session_id,'generation_id',v_gen.generation_id,'grant_version',v_member.grant_version,'expires_at',v_exp,'connector_key',v_connector_key,'connector_slot',v_connector->>'selected_slot','launch_delivery_mode',v_connector->>'launch_delivery_mode'));

  return jsonb_build_object(
    'handoff_id',v_handoff,
    'session_id',p_session_id,
    'generation_id',v_gen.generation_id,
    'grant_version',v_member.grant_version,
    'expires_at',v_exp,
    'session_status',v_session.session_status,
    'connector_key',v_connector_key,
    'connector_display_name',v_connector->>'display_name',
    'connector_state',v_connector->>'operational_state',
    'connector_slot',v_connector->>'selected_slot',
    'connector_delivery_mode',v_connector->>'launch_delivery_mode'
  );
end;
$function$;

create or replace function public.jb_live_consume_handoff_internal(p_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_h public.encoder_handoffs%rowtype;
  v_session public.live_sessions%rowtype;
  v_member public.live_session_members%rowtype;
  v_gen public.live_provider_generations%rowtype;
  v_connector public.live_encoder_connectors%rowtype;
  v_used timestamptz:=now();
begin
  select * into v_h from public.encoder_handoffs where token_hash=p_token_hash for update;
  if not found then raise exception 'HANDOFF_NOT_FOUND'; end if;
  if v_h.used_at is not null then raise exception 'HANDOFF_ALREADY_USED'; end if;
  if v_h.revoked_at is not null then raise exception 'HANDOFF_REVOKED'; end if;
  if v_h.expires_at<=now() then raise exception 'HANDOFF_EXPIRED'; end if;

  select * into v_session from public.live_sessions where id=v_h.session_id for update;
  if not found then raise exception 'LIVE_SESSION_NOT_FOUND'; end if;
  if v_session.assigned_reporter_id<>v_h.reporter_id then raise exception 'LIVE_SESSION_NOT_ASSIGNED'; end if;
  if v_session.session_status not in ('READY','WAITING_SIGNAL','RECONNECTING','LIVE') then raise exception 'LIVE_SESSION_NOT_CAMERA_ELIGIBLE'; end if;
  if v_session.current_provider_generation<>v_h.generation_id then raise exception 'STALE_PROVIDER_GENERATION'; end if;

  select * into v_member
  from public.live_session_members
  where session_id=v_h.session_id and user_id=v_h.reporter_id and permission='BROADCAST'
  for update;
  if not found or v_member.status<>'ACTIVE' then raise exception 'LIVE_PERMISSION_NOT_ACTIVE'; end if;
  if v_member.grant_version<>v_h.grant_version then raise exception 'HANDOFF_GRANT_VERSION_STALE'; end if;

  select * into v_gen
  from public.live_provider_generations
  where generation_id=v_h.generation_id and session_id=v_h.session_id
  for update;
  if not found or v_gen.is_current<>true then raise exception 'STALE_PROVIDER_GENERATION'; end if;
  if v_gen.provider_state not in ('READY','ACTIVE') then raise exception 'PROVIDER_NOT_READY'; end if;
  if v_gen.credential_status in ('RETIRE_PENDING','RETIRED','COMPROMISED') then raise exception 'PROVIDER_CREDENTIAL_UNUSABLE'; end if;

  select * into v_connector from public.live_encoder_connectors where connector_key=v_h.connector_key;
  if not found then raise exception 'ENCODER_CONNECTOR_NOT_FOUND'; end if;
  if v_connector.operational_state in ('DISABLED','RETIRED') then raise exception 'ENCODER_CONNECTOR_UNAVAILABLE'; end if;

  update public.encoder_handoffs set used_at=v_used where handoff_id=v_h.handoff_id;

  update public.live_provider_generations
  set credential_status=case when credential_status='SERVER_ONLY' then 'ISSUED' else credential_status end,
      first_issued_at=coalesce(first_issued_at,v_used),
      provider_last_checked_at=v_used
  where generation_id=v_gen.generation_id;

  if v_session.session_status='READY' then
    update public.live_sessions set session_status='WAITING_SIGNAL',state_version=state_version+1 where id=v_session.id;
  end if;

  insert into public.live_operations(operation_type,session_id,generation_id,operation_state,next_attempt_at)
  values('TRANSITION_LIVE',v_h.session_id,v_h.generation_id,'QUEUED',now())
  on conflict do nothing;

  insert into public.audit_logs(actor_user_id,action,record_type,record_id,metadata)
  values(v_h.reporter_id,'encoder_handoff_consumed','encoder_handoff',v_h.handoff_id::text,
    jsonb_build_object('session_id',v_h.session_id,'generation_id',v_h.generation_id,'grant_version',v_h.grant_version,'connector_key',v_h.connector_key,'launch_delivery_mode',v_connector.launch_delivery_mode));

  return jsonb_build_object(
    'handoff_id',v_h.handoff_id,
    'session_id',v_h.session_id,
    'reporter_id',v_h.reporter_id,
    'generation_id',v_h.generation_id,
    'grant_version',v_h.grant_version,
    'connector_key',v_h.connector_key,
    'connector_display_name',v_connector.display_name,
    'connector_kind',v_connector.connector_kind,
    'launch_scheme',v_connector.launch_scheme,
    'launch_delivery_mode',v_connector.launch_delivery_mode,
    'android_package',v_connector.android_package,
    'install_url',v_connector.install_url,
    'handler_slug',v_connector.handler_slug,
    'used_at',v_used
  );
end;
$function$;

revoke all on function public.jb_live_select_encoder_connector_internal() from public,anon,authenticated;
grant execute on function public.jb_live_select_encoder_connector_internal() to service_role;
revoke all on function public.jb_live_create_handoff_internal(uuid,uuid,text,integer) from public,anon,authenticated;
grant execute on function public.jb_live_create_handoff_internal(uuid,uuid,text,integer) to service_role;
revoke all on function public.jb_live_consume_handoff_internal(text) from public,anon,authenticated;
grant execute on function public.jb_live_consume_handoff_internal(text) to service_role;
