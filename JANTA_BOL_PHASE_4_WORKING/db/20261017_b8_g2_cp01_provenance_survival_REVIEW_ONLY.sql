-- JANTA BOL B8 G2 CP01 — independent CASE↔ARTICLE identity & immutable evidence CLAIM receipts.
-- REVIEW ONLY / isolated PG17. NOT installed in LIVE. No existing Table/Auth/News migration changed.
-- SECURITY: no reporter public Storage access. A claimed SHA256 is NEVER proof of uploaded/verified bytes.
-- Source Article version/source/verification may cascade on real permanent delete; case-specific
-- independent Article identity snapshot & evidence claims survive, but SOURCE FILE BYTES DO NOT.
-- Legal HOLD must prevent source destruction at a separate controlled gate BEFORE release.

create table public.b8_case_article_links (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.b8_cases(id) on delete restrict,
  article_id uuid not null,
  article_title_at_link text not null,
  article_version_at_link bigint not null,
  article_status_at_link text not null,
  linked_by uuid not null,
  linked_at timestamptz not null default now(),
  unique(case_id,article_id),
  check(char_length(btrim(article_title_at_link)) between 1 and 300),
  check(article_version_at_link>=1)
);
create index b8_case_article_links_article_idx on public.b8_case_article_links(article_id);

create table public.b8_case_evidence_claims (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.b8_cases(id) on delete restrict,
  submitted_by uuid not null,
  evidence_kind text not null check(evidence_kind in
   ('PUBLIC_DOCUMENT','FIELD_OBSERVATION','OFFICIAL_RESPONSE','OTHER')),
  document_label text not null check(char_length(btrim(document_label)) between 5 and 180),
  claimed_sha256 text not null check (claimed_sha256 ~ '^[0-9a-f]{64}$'),
  observation_date date,
  -- Never silently upgrade this; no server-verified bytes or controlled upload yet.
  evidence_state text not null default 'CLAIM_UNVERIFIED_NO_BYTES'
    check(evidence_state='CLAIM_UNVERIFIED_NO_BYTES'),
  created_at timestamptz not null default now()
);
create index b8_case_evidence_claims_case_idx
 on public.b8_case_evidence_claims(case_id,created_at,id);

-- Even privileged service CRUD and future common migration scripts cannot accidentally
-- update or delete evidence / link rows while triggers remain enabled. DB superuser can
-- disable triggers: NOT a tamper-proof claim. Lawful disposition will be a separate audited path.
create function private.b8_g2_cp01_immutable_claim()
returns trigger language plpgsql security definer set search_path=''
as $b8$
begin
 raise exception 'B8_G2_IMMUTABLE_CASE_PROVENANCE';
end;
$b8$;
create trigger b8_case_article_links_immutable before update or delete
 on public.b8_case_article_links
 for each row execute function private.b8_g2_cp01_immutable_claim();
create trigger b8_case_evidence_claims_immutable before update or delete
 on public.b8_case_evidence_claims
 for each row execute function private.b8_g2_cp01_immutable_claim();

alter table public.b8_case_article_links enable row level security;
alter table public.b8_case_evidence_claims enable row level security;
revoke all on public.b8_case_article_links,public.b8_case_evidence_claims
 from public,anon,authenticated;
grant select,insert,update,delete on public.b8_case_article_links,public.b8_case_evidence_claims
 to service_role;
revoke all on function private.b8_g2_cp01_immutable_claim()
 from public,anon,authenticated;

-- Only Founder AAL2 can link the pre-existing Article from authoritative source values.
-- No FK article_id→articles.id by DESIGN: the Case reference survives permanent Article deletion.
create function public.jb_b8_g2_owner_link_article(p_case_id uuid,p_article_id uuid)
returns uuid language plpgsql security definer set search_path=''
as $b8$
declare v_id uuid;
 v_title text; v_version bigint; v_status text;
begin
 if not coalesce(private.current_owner_aal2(),false) then
  raise exception 'B8_OWNER_AAL2_REQUIRED';end if;
 if p_case_id is null or not exists(
  select 1 from public.b8_cases where id=p_case_id and case_state<>'closed'
 ) then raise exception 'B8_ASSIGNABLE_CASE_REQUIRED';end if;
 -- This SELECT is authoritative and performed server-side. Existing News tables UNCHANGED.
 select a.title,a.version,a.status::text
 into v_title,v_version,v_status from public.articles a
 where a.id=p_article_id and a.deleted_at is null;
 if not found or v_title is null or v_version is null or v_status is null then
  raise exception 'B8_EXISTING_NONDELETED_ARTICLE_REQUIRED';end if;
 insert into public.b8_case_article_links (
  case_id,article_id,article_title_at_link,article_version_at_link,
  article_status_at_link,linked_by
 ) values (
  p_case_id,p_article_id,left(v_title,300),v_version,v_status,auth.uid()
 ) returning id into v_id;
 return v_id;
end;
$b8$;

-- Submitted hash is an UNVERIFIED CLAIM, never a signed upload receipt or independent proof.
-- Lock the actor's narrow case grant before checking to serialize with a concurrent revoke.
create function public.jb_b8_g2_reporter_submit_evidence_claim(
 p_case_id uuid,p_kind text,p_document_label text,p_sha256 text,
 p_observation_date date default null
) returns uuid language plpgsql security definer set search_path=''
as $b8$
declare v_id uuid;
begin
 perform 1 from public.b8_case_reporter_grants
  where case_id=p_case_id and reporter_user_id=auth.uid() for update;
 if not coalesce(private.b8_g1_reporter_case_allowed(p_case_id),false) then
  raise exception 'B8_ASSIGNED_ACTIVE_REPORTER_REQUIRED';end if;
 if coalesce(p_kind,'') not in
  ('PUBLIC_DOCUMENT','FIELD_OBSERVATION','OFFICIAL_RESPONSE','OTHER')
 or p_document_label is null
 or char_length(btrim(p_document_label)) not between 5 and 180
 or p_sha256 is null
 or lower(btrim(p_sha256)) !~ '^[0-9a-f]{64}$'
 or (p_observation_date is not null and p_observation_date>current_date)
 then raise exception 'B8_INVALID_EVIDENCE_CLAIM';end if;
 insert into public.b8_case_evidence_claims
 (case_id,submitted_by,evidence_kind,document_label,claimed_sha256,observation_date)
 values(p_case_id,auth.uid(),p_kind,btrim(p_document_label),
  lower(btrim(p_sha256)),p_observation_date)
 returning id into v_id;
 return v_id;
end;
$b8$;

-- Owner-only, internal unverified provenance view. Never make this a public/anon RPC.
create function public.jb_b8_g2_owner_provenance_summary(p_case_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $b8$
declare v_return jsonb;
begin
 if not coalesce(private.current_owner_aal2(),false) then
  raise exception 'B8_OWNER_AAL2_REQUIRED';end if;
 if not exists(select 1 from public.b8_cases where id=p_case_id) then
  raise exception 'B8_EXISTING_CASE_REQUIRED';end if;
 select jsonb_build_object(
  'case_id',p_case_id,
  'linked_articles',coalesce(
   (select jsonb_agg(jsonb_build_object(
     'article_id',x.article_id,'title_at_link',x.article_title_at_link,
     'version_at_link',x.article_version_at_link,
     'article_status_at_link',x.article_status_at_link)
    order by x.linked_at,x.id)
    from public.b8_case_article_links x where x.case_id=p_case_id),'[]'::jsonb),
  'evidence_claim_count',
     (select count(*) from public.b8_case_evidence_claims c where c.case_id=p_case_id),
  'bytes_verified',false,'source_bytes_preserved',false,
  'proof_status','NOT_VERIFIED','legal_hold_enforced',false
 ) into v_return;
 return v_return;
end;
$b8$;

revoke all on function public.jb_b8_g2_owner_link_article(uuid,uuid)
 from public,anon,authenticated;
revoke all on function public.jb_b8_g2_reporter_submit_evidence_claim(uuid,text,text,text,date)
 from public,anon,authenticated;
revoke all on function public.jb_b8_g2_owner_provenance_summary(uuid)
 from public,anon,authenticated;
grant execute on function public.jb_b8_g2_owner_link_article(uuid,uuid)
 to authenticated;
grant execute on function public.jb_b8_g2_reporter_submit_evidence_claim(uuid,text,text,text,date)
 to authenticated;
grant execute on function public.jb_b8_g2_owner_provenance_summary(uuid)
 to authenticated;
-- This migration does not connect to Supabase Storage or deploy a worker, does not
-- implement legal hold or preserve Article source/media bytes, and does not send questions.
