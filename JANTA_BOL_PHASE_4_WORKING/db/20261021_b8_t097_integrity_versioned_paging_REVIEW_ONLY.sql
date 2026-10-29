-- B8 T097 / ACC-029..035: durable sequence + keyset pages; review-only, PG17 first.
-- No old rows rewritten; private evidence never becomes public; no unsupported motive inference.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $verify$
begin
 if to_regclass('public.b8_t097_document_versions') is not null
 or strpos(pg_get_functiondef('public.jb_b8_g5_owner_private_ledger(uuid)'::regprocedure),'limit 100')=0
 or strpos(pg_get_functiondef('public.jb_b8_g7_owner_private_history(uuid)'::regprocedure),'limit 100')=0
 then raise exception 'B8_T097_BASELINE_OR_CONFLICT_STOP';end if;
end $verify$;
create table public.b8_t097_document_versions(
 id bigint generated always as identity primary key,
 case_id uuid not null references public.b8_cases(id) on delete restrict,
 document_key text not null check(document_key ~ '^[a-z0-9_-]{3,80}$'),
 version_no integer not null check(version_no>=1),
 stage text not null check(stage in('ORIGINAL','REVISED')),
 private_receipt_id uuid not null references public.b8_private_upload_receipts(id) on delete restrict,
 previous_version_id bigint references public.b8_t097_document_versions(id) on delete restrict,
 provenance text not null default 'PRIVATE_BYTES_ONLY_NOT_OFFICIAL_VERIFIED'
  check(provenance='PRIVATE_BYTES_ONLY_NOT_OFFICIAL_VERIFIED'),
 actor_user_id uuid not null,
 recorded_at timestamptz not null default clock_timestamp(),
 unique(case_id,document_key,version_no),
 unique(case_id,document_key,private_receipt_id),
 check((stage='ORIGINAL' and version_no=1 and previous_version_id is null)
   or (stage='REVISED' and version_no>1 and previous_version_id is not null))
);
create index b8_t097_document_versions_case_idx
 on public.b8_t097_document_versions(case_id,id desc);
alter table public.b8_t097_document_versions enable row level security;
revoke all on public.b8_t097_document_versions from public,anon,authenticated;
grant select,insert on public.b8_t097_document_versions to service_role;
create function private.b8_t097_document_immutable()
returns trigger language plpgsql security definer set search_path=''
as $b8$ begin raise exception 'B8_T097_DOCUMENT_VERSION_IMMUTABLE';end; $b8$;
create trigger b8_t097_document_versions_immutable before update or delete
 on public.b8_t097_document_versions for each row execute function private.b8_t097_document_immutable();
revoke all on function private.b8_t097_document_immutable() from public,anon,authenticated;

create function public.jb_b8_t097_owner_record_document_version(
 p_case_id uuid,p_document_key text,p_stage text,p_receipt_id uuid,p_previous_version_id bigint default null
) returns bigint language plpgsql security definer set search_path=''
as $b8$
declare v_previous public.b8_t097_document_versions%rowtype;v_num integer;v_id bigint;
begin
 if not coalesce(private.current_owner_aal2(),false)
 then raise exception 'B8_OWNER_AAL2_REQUIRED';end if;
 perform 1 from public.b8_cases where id=p_case_id for update;
 if not found then raise exception 'B8_T097_CASE_REQUIRED';end if;
 if p_document_key is null or p_document_key !~ '^[a-z0-9_-]{3,80}$'
 then raise exception 'B8_T097_DOCUMENT_KEY_INVALID';end if;
 if p_receipt_id is null or not exists(select 1 from public.b8_private_upload_receipts
   where id=p_receipt_id and case_id=p_case_id)
 then raise exception 'B8_T097_SAME_CASE_RECEIPT_REQUIRED';end if;
 select * into v_previous from public.b8_t097_document_versions
  where case_id=p_case_id and document_key=p_document_key
  order by version_no desc limit 1 for update;
 if not found then
   if p_stage is distinct from 'ORIGINAL' or p_previous_version_id is not null
   then raise exception 'B8_T097_ORIGINAL_FIRST_REQUIRED';end if;
   v_num:=1;
 else
   if p_stage is distinct from 'REVISED'
    or p_previous_version_id is distinct from v_previous.id
    or p_receipt_id=v_previous.private_receipt_id
   then raise exception 'B8_T097_REVISION_MUST_FOLLOW_LATEST_VERSION';end if;
   v_num:=v_previous.version_no+1;
 end if;
 insert into public.b8_t097_document_versions(
  case_id,document_key,version_no,stage,private_receipt_id,
  previous_version_id,actor_user_id)
 values(p_case_id,p_document_key,v_num,p_stage,p_receipt_id,p_previous_version_id,auth.uid())
 returning id into v_id;
 return v_id;
end;
$b8$;
revoke all on function public.jb_b8_t097_owner_record_document_version(uuid,text,text,uuid,bigint)
 from public,anon,authenticated;
grant execute on function public.jb_b8_t097_owner_record_document_version(uuid,text,text,uuid,bigint)
 to authenticated;

-- Keyset pagination returns ALL history over multiple bounded pages (no arbitrary overall cap).
-- Existing legacy 100-row readers unchanged to preserve PASS. No public grants.
create function public.jb_b8_t097_owner_fact_page(
 p_case_id uuid,p_before_id bigint default null,p_limit integer default 50
) returns jsonb language plpgsql stable security definer set search_path=''
as $b8$
declare v_items jsonb;v_oldest bigint;v_has_more boolean;
begin
 if not coalesce(private.current_owner_aal2(),false)
 then raise exception 'B8_OWNER_AAL2_REQUIRED';end if;
 if p_limit is null or p_limit<1 or p_limit>100
   or p_before_id is not null and p_before_id<1
 then raise exception 'B8_T097_PAGE_LIMIT_INVALID';end if;
 if not exists(select 1 from public.b8_cases where id=p_case_id)
 then raise exception 'B8_T097_CASE_REQUIRED';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',e.id,
   'kind',e.kind,'field',e.field_code,'detail',e.detail_text,
   'cost_inr',e.cost_inr,'authenticity',e.authenticity,'date',e.target_date,
   'recorded_at',e.recorded_at) order by e.id desc),'[]'::jsonb),
   min(e.id) into v_items,v_oldest from
   (select * from public.b8_g5_fact_events
    where case_id=p_case_id and (p_before_id is null or id<p_before_id)
    order by id desc limit p_limit) e;
 select exists(select 1 from public.b8_g5_fact_events where case_id=p_case_id
   and id<v_oldest) into v_has_more;
 return jsonb_build_object('items',v_items,'has_more',v_has_more,
   'next_before_id',case when v_has_more then v_oldest else null end,
   'truth','NOT_INDEPENDENTLY_VERIFIED');
end; $b8$;
create function public.jb_b8_t097_owner_history_page(
 p_case_id uuid,p_before_id bigint default null,p_limit integer default 50
) returns jsonb language plpgsql stable security definer set search_path=''
as $b8$
declare v_items jsonb;v_oldest bigint;v_has_more boolean;
begin
 if not coalesce(private.current_owner_aal2(),false)
 then raise exception 'B8_OWNER_AAL2_REQUIRED';end if;
 if p_limit is null or p_limit<1 or p_limit>100
   or p_before_id is not null and p_before_id<1
 then raise exception 'B8_T097_PAGE_LIMIT_INVALID';end if;
 if not exists(select 1 from public.b8_cases where id=p_case_id)
 then raise exception 'B8_T097_CASE_REQUIRED';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',e.id,'kind',e.event_kind,
   'question_id',e.question_id,'receipt_id',e.private_receipt_id,
   'prior_event_id',e.prior_event_id,'as_of',e.as_of_date,'note',e.factual_note,
   'truth',e.truth,'recorded_at',e.recorded_at) order by e.id desc),'[]'::jsonb),
   min(e.id) into v_items,v_oldest from
   (select * from public.b8_g7_history_events
    where case_id=p_case_id and (p_before_id is null or id<p_before_id)
    order by id desc limit p_limit) e;
 select exists(select 1 from public.b8_g7_history_events where case_id=p_case_id
   and id<v_oldest) into v_has_more;
 return jsonb_build_object('items',v_items,'has_more',v_has_more,
   'next_before_id',case when v_has_more then v_oldest else null end,
   'truth','FOUNDER_ATTRIBUTED_UNVERIFIED');
end; $b8$;
revoke all on function public.jb_b8_t097_owner_fact_page(uuid,bigint,integer)
 from public,anon,authenticated;
revoke all on function public.jb_b8_t097_owner_history_page(uuid,bigint,integer)
 from public,anon,authenticated;
grant execute on function public.jb_b8_t097_owner_fact_page(uuid,bigint,integer) to authenticated;
grant execute on function public.jb_b8_t097_owner_history_page(uuid,bigint,integer) to authenticated;
commit;
