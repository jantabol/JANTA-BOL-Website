-- JANTA BOL B8 G2 CP03: service-mediated PRIVATE bounded case evidence upload.
-- REVIEW ONLY; not deployed. Requires G1 CP01 + G2 CP01/02.
-- No reporter DIRECT Storage grants and NO second bucket, NO public URL.
-- Old Owner-only private-editorial access policy is NOT modified.
-- Supabase service-role Edge gateway independently checks bytes+readback before finalizing.
-- DB receipt proves only service-reported byte integrity, NOT official truth or human verified E9.

create table public.b8_private_upload_intents (
 id uuid primary key default gen_random_uuid(),
 case_id uuid not null references public.b8_cases(id) on delete restrict,
 reporter_user_id uuid not null,
 reporter_session_id uuid not null,
 object_key text not null unique,
 original_label text not null check(char_length(btrim(original_label)) between 5 and 120),
 expected_mime text not null check(expected_mime in
  ('image/jpeg','image/png','image/webp','application/pdf')),
 expected_bytes bigint not null check(expected_bytes between 1 and 8388608),
 issued_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '10 minutes'),
 check(expires_at>issued_at and expires_at<=issued_at+interval '11 minutes')
);
create index b8_upload_intents_reviewer_idx
 on public.b8_private_upload_intents(reporter_user_id,issued_at);

create table public.b8_private_upload_receipts (
 id uuid primary key default gen_random_uuid(),
 intent_id uuid not null unique references public.b8_private_upload_intents(id) on delete restrict,
 case_id uuid not null references public.b8_cases(id) on delete restrict,
 server_sha256 text not null check(server_sha256 ~ '^[0-9a-f]{64}$'),
 byte_count bigint not null check(byte_count between 1 and 8388608),
 mime_type text not null check(mime_type in
  ('image/jpeg','image/png','image/webp','application/pdf')),
 validation_class text not null default 'GATEWAY_REPORTED_PRIVATE_READBACK_HASH'
  check(validation_class='GATEWAY_REPORTED_PRIVATE_READBACK_HASH'),
 proof_of_official_authenticity boolean not null default false
  check(proof_of_official_authenticity=false),
 received_at timestamptz not null default now()
);
create index b8_upload_receipts_case_idx on public.b8_private_upload_receipts(case_id,received_at);

create table public.b8_private_upload_orphans (
 id bigint generated always as identity primary key,
 intent_id uuid not null references public.b8_private_upload_intents(id) on delete restrict,
 reason text not null check(reason in
  ('PRIVATE_READBACK_FAILED','FINALIZE_REJECTED','CLEANUP_FAILED')),
 recorded_at timestamptz not null default now()
);

-- Protect original sealed intent + receipt + cleanup ledger (no UPDATE or DELETE).
create function private.b8_g2_cp03_sealed_record()
returns trigger language plpgsql security definer set search_path=''
as $b8$
begin
 raise exception 'B8_G2_PRIVATE_UPLOAD_IMMUTABLE';
end;
$b8$;
create trigger b8_upload_intents_sealed before update or delete
 on public.b8_private_upload_intents
 for each row execute function private.b8_g2_cp03_sealed_record();
create trigger b8_upload_receipts_sealed before update or delete
 on public.b8_private_upload_receipts
 for each row execute function private.b8_g2_cp03_sealed_record();
create trigger b8_upload_orphans_sealed before update or delete
 on public.b8_private_upload_orphans
 for each row execute function private.b8_g2_cp03_sealed_record();

alter table public.b8_private_upload_intents enable row level security;
alter table public.b8_private_upload_receipts enable row level security;
alter table public.b8_private_upload_orphans enable row level security;
revoke all on public.b8_private_upload_intents,public.b8_private_upload_receipts,
 public.b8_private_upload_orphans from public,anon,authenticated;
grant select,insert,update,delete on public.b8_private_upload_intents,
 public.b8_private_upload_receipts,public.b8_private_upload_orphans to service_role;
revoke all on function private.b8_g2_cp03_sealed_record()
 from public,anon,authenticated;

-- Authenticated staff issues an upload intent only through EXACT case grant and session.
-- Lock grant to serialize against Owner revoke; this does not relax global B1 staff guard.
create function public.jb_b8_g2_reporter_prepare_private_upload(
 p_case_id uuid,p_original_label text,p_mime text,p_expected_bytes bigint
) returns uuid language plpgsql security definer set search_path=''
as $b8$
declare v_id uuid:=gen_random_uuid();v_session_txt text;v_session uuid;
begin
 perform 1 from public.b8_case_reporter_grants
 where case_id=p_case_id and reporter_user_id=auth.uid() for update;
 if not coalesce(private.b8_g1_reporter_case_allowed(p_case_id),false) then
  raise exception 'B8_ASSIGNED_ACTIVE_REPORTER_REQUIRED';end if;
 v_session_txt:=auth.jwt()->>'session_id';
 if v_session_txt is null or v_session_txt !~
  '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
 then raise exception 'B8_AUTH_SESSION_REQUIRED';end if;
 v_session:=v_session_txt::uuid;
 if not exists(select 1 from auth.sessions s
  where s.id=v_session and s.user_id=auth.uid())
 then raise exception 'B8_AUTH_SESSION_REQUIRED';end if;
 if p_original_label is null or char_length(btrim(p_original_label)) not between 5 and 120
 or coalesce(p_mime,'') not in
 ('image/jpeg','image/png','image/webp','application/pdf')
 or p_expected_bytes is null or p_expected_bytes not between 1 and 8388608
 then raise exception 'B8_UPLOAD_METADATA_INVALID';end if;
 if (select count(*) from public.b8_private_upload_intents i
     where i.reporter_user_id=auth.uid()
       and i.issued_at > now()-interval '1 day')>=20
 then raise exception 'B8_UPLOAD_DAILY_LIMIT';end if;
 if (select count(*) from public.b8_private_upload_intents i
     where i.reporter_user_id=auth.uid() and i.case_id=p_case_id
       and i.expires_at > now()
       and not exists(select 1 from public.b8_private_upload_receipts r
                      where r.intent_id=i.id))>=3
 then raise exception 'B8_UPLOAD_OUTSTANDING_LIMIT';end if;
 insert into public.b8_private_upload_intents(
 id,case_id,reporter_user_id,reporter_session_id,object_key,
 original_label,expected_mime,expected_bytes)
 values(v_id,p_case_id,auth.uid(),v_session,
  'b8/cases/'||p_case_id::text||'/'||v_id::text||'.bin',
  btrim(p_original_label),p_mime,p_expected_bytes);
 return v_id;
end;
$b8$;

-- Service-role-only read used by trusted Edge gateway AFTER authenticated prepare.
create function public.jb_b8_g2_server_private_upload_intent(p_intent_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $b8$
declare v_data jsonb;
begin
 select jsonb_build_object('intent_id',i.id,'case_id',i.case_id,
  'reporter_user_id',i.reporter_user_id,'object_key',i.object_key,
  'mime',i.expected_mime,'byte_count',i.expected_bytes)
 into v_data from public.b8_private_upload_intents i
 where i.id=p_intent_id
 and i.expires_at>now()
 and not exists(select 1 from public.b8_private_upload_receipts r
               where r.intent_id=i.id);
 if v_data is null then raise exception 'B8_UPLOAD_INTENT_UNAVAILABLE';end if;
 return v_data;
end;
$b8$;

-- Called exclusively by SERVICE role AFTER gateway has uploaded, downloaded,
-- byte-checked and SHA256-hashed the private object. Strict atomic receipt only.
create function public.jb_b8_g2_server_finalize_private_upload(
 p_intent_id uuid,p_sha256 text,p_byte_count bigint,p_mime text
) returns uuid language plpgsql security definer set search_path=''
as $b8$
declare v_i public.b8_private_upload_intents%rowtype;v_id uuid;
begin
 select * into v_i from public.b8_private_upload_intents
 where id=p_intent_id for update;
 if not found or v_i.expires_at<=now() then
  raise exception 'B8_UPLOAD_INTENT_EXPIRED';end if;
 if not exists(
  select 1 from public.user_roles ur
  join public.team_accounts ta on ta.user_id=ur.user_id
  join public.b8_case_reporter_grants g on g.reporter_user_id=ur.user_id
  join public.b8_cases c on c.id=g.case_id
  join auth.sessions ses on ses.user_id=ur.user_id and ses.id=v_i.reporter_session_id
  where ur.user_id=v_i.reporter_user_id and ur.role='reporter'::public.app_role
   and ta.assigned_role='reporter'::public.app_role and ta.status='active'
   and g.case_id=v_i.case_id and g.revoked_at is null and g.expires_at>now()
   and c.case_state<>'closed'
 ) then raise exception 'B8_UPLOAD_REPORTER_NO_LONGER_AUTHORIZED';end if;
 if p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$'
 or p_byte_count is distinct from v_i.expected_bytes
 or p_mime is distinct from v_i.expected_mime
 then raise exception 'B8_UPLOAD_READBACK_MISMATCH';end if;
 insert into public.b8_private_upload_receipts
 (intent_id,case_id,server_sha256,byte_count,mime_type)
 values(v_i.id,v_i.case_id,p_sha256,p_byte_count,p_mime)
 returning id into v_id;
 return v_id;
end;
$b8$;

-- Failed cleanup is deliberately logged; do not pretend a failed upload disappeared.
create function public.jb_b8_g2_server_private_orphan_event(
 p_intent_id uuid,p_reason text
) returns boolean language plpgsql security definer set search_path=''
as $b8$
begin
 if coalesce(p_reason,'') not in
 ('PRIVATE_READBACK_FAILED','FINALIZE_REJECTED','CLEANUP_FAILED') then
  raise exception 'B8_UPLOAD_ORPHAN_REASON_INVALID';end if;
 if not exists(select 1 from public.b8_private_upload_intents where id=p_intent_id)
 then raise exception 'B8_UPLOAD_INTENT_UNAVAILABLE';end if;
 insert into public.b8_private_upload_orphans(intent_id,reason)
 values(p_intent_id,p_reason);
 return true;
end;
$b8$;

-- Owner's internal summary; notice NO public object URLs or media links.
create function public.jb_b8_g2_owner_verified_upload_summary(p_case_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $b8$
declare v jsonb;
begin
 if not coalesce(private.current_owner_aal2(),false) then
  raise exception 'B8_OWNER_AAL2_REQUIRED';end if;
 if not exists(select 1 from public.b8_cases where id=p_case_id) then
  raise exception 'B8_EXISTING_CASE_REQUIRED';end if;
 select jsonb_build_object(
  'case_id',p_case_id,
  'server_reported_private_readback_count',
   (select count(*) from public.b8_private_upload_receipts r where r.case_id=p_case_id),
  'source_authenticity_verified',false,
  'official_documentary_proof_verified',false,
  'raw_private_file_url_exposed',false)
 into v;
 return v;
end;
$b8$;

revoke all on function public.jb_b8_g2_reporter_prepare_private_upload(uuid,text,text,bigint)
 from public,anon,authenticated;
grant execute on function public.jb_b8_g2_reporter_prepare_private_upload(uuid,text,text,bigint)
 to authenticated;

revoke all on function public.jb_b8_g2_server_private_upload_intent(uuid)
 from public,anon,authenticated;
revoke all on function public.jb_b8_g2_server_finalize_private_upload(uuid,text,bigint,text)
 from public,anon,authenticated;
revoke all on function public.jb_b8_g2_server_private_orphan_event(uuid,text)
 from public,anon,authenticated;
grant execute on function public.jb_b8_g2_server_private_upload_intent(uuid) to service_role;
grant execute on function public.jb_b8_g2_server_finalize_private_upload(uuid,text,bigint,text) to service_role;
grant execute on function public.jb_b8_g2_server_private_orphan_event(uuid,text) to service_role;

revoke all on function public.jb_b8_g2_owner_verified_upload_summary(uuid)
 from public,anon,authenticated;
grant execute on function public.jb_b8_g2_owner_verified_upload_summary(uuid)
 to authenticated;
-- No direct storage.objects grants, no bucket create and no delivery/publish RPC.
