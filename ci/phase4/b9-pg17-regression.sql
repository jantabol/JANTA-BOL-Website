\set ON_ERROR_STOP on
-- P4-T100..109 automated coding tests on LOCAL synthetic PG17 only.
begin;
do $$
declare x jsonb;y jsonb;vid uuid:='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';did uuid:='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
begin
 x:=public.jb_b9_search();
 if jsonb_array_length(x->'items')<>3 then raise exception 'B9_PUBLIC_ONLY_3_EXPECTED: %',x;end if;
 if (x->'items')::text like '%SENSITIVE_DRAFT%' or (x->'items')::text like '%SECRET_UNPUBLISHED%'
    or (x->'items')::text like '%SECRET_DELETED%' then raise exception 'B9_PRIVATE_LEAK';end if;
 x:=public.jb_b9_search(p_query=>'PRIVATE_ID_NUMBER_12345');
 if jsonb_array_length(x->'items')<>0 then raise exception 'B9_PRIVATE_BODY_SEARCH_LEAK';end if;
 x:=public.jb_b9_search(p_id=>did::text);
 if jsonb_array_length(x->'items')<>0 then raise exception 'B9_DRAFT_UUID_ENUMERABLE';end if;
 x:=public.jb_b9_search(p_query=>'archive');
 if jsonb_array_length(x->'items')<>1 or x#>>'{items,0,id}'<>vid::text then raise exception 'B9_OLD_ARCHIVE_MISSING';end if;
 x:=public.jb_b9_search(p_year=>2024,p_month=>8);
 if jsonb_array_length(x->'items')<>1 then raise exception 'B9_HISTORICAL_YEAR_MONTH_FILTER';end if;
 x:=public.jb_b9_search(p_date_from=>'2024-08-01',p_date_to=>'2024-08-31',p_district=>'Shivpuri',p_location=>'Pichhore',p_category=>'Education');
 if jsonb_array_length(x->'items')<>1 then raise exception 'B9_COMBINED_FILTER';end if;
 x:=public.jb_b9_search(p_sort=>'oldest',p_limit=>2);
 if x#>>'{items,0,id}'<>vid::text or x->'next_cursor' is null or x->'next_cursor'='null'::jsonb then raise exception 'B9_KEYSET_FIRST_PAGE';end if;
 y:=public.jb_b9_search(p_sort=>'oldest',p_limit=>2,p_cursor=>x->'next_cursor');
 if jsonb_array_length(y->'items')<>1 then raise exception 'B9_KEYSET_SECOND_PAGE';end if;
 x:=public.jb_b9_related_news(vid,5);
 if jsonb_array_length(x)<>2 or x::text like '%SENSITIVE_DRAFT%' then raise exception 'B9_RELATED_PRIVACY';end if;
 if public.jb_b9_public_article_author(vid)<>'Opted-in Reporter' then raise exception 'B9_OPTIN_ARTICLE_AUTHOR_MISSING';end if;
 if public.jb_b9_public_article_author(did) is not null then raise exception 'B9_PRIVATE_DRAFT_AUTHOR_LEAK';end if;
 x:=public.jb_b9_reporter_discovery();
 if jsonb_array_length(x)<>1 or x::text like '%Private Reporter%' then raise exception 'B9_REPORTER_OPT_OUT_LEAK';end if;
 x:=public.jb_b9_public_metrics(vid);
 if x->>'views' is not null or x->>'shares' is not null or (x->>'views_enabled')::boolean then raise exception 'B9_DEFAULT_METRICS_MUST_BE_OFF';end if;
 if public.jb_b9_public_metrics(did) is not null then raise exception 'B9_PRIVATE_METRIC_LEAK';end if;
 if has_table_privilege('anon','public.b9_taxonomy_terms','SELECT')
    or has_table_privilege('anon','public.b9_article_terms','SELECT')
    or has_table_privilege('anon','public.b9_metric_global_settings','SELECT')
    or has_table_privilege('anon','public.analytics_events','SELECT')
 then raise exception 'B9_ANON_DIRECT_TABLE_LEAK';end if;
 if not (select relrowsecurity from pg_class where oid='public.b9_taxonomy_terms'::regclass) then raise exception 'B9_RLS_ABSENT';end if;
 if (select count(*) from public.analytics_events)<>4 then raise exception 'B9_CHANGED_OLD_METRICS';end if;
end;
$$;

-- Protected modifications strictly require existing Owner + fresh AAL2. Verify negative.
select set_config('b9.test_uid','22222222-2222-2222-2222-222222222222',false);
select set_config('b9.test_aal','aal1',false);
do $$
begin
 begin
  perform public.jb_b9_owner_analytics(now()-interval '7 days',now());
  raise exception 'B9_AAL_BYPASS_ANALYTICS';
 exception when raise_exception then
  if sqlerrm<>'B9_OWNER_AAL2_REQUIRED' then raise; end if;
 end;
 begin
  perform public.jb_b9_owner_assign_term('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','tag','news','News','add');
  raise exception 'B9_REPORTER_TAG_BYPASS';
 exception when raise_exception then
  if sqlerrm<>'B9_OWNER_AAL2_REQUIRED' then raise; end if;
 end;
end;$$;

select set_config('b9.test_uid','11111111-1111-1111-1111-111111111111',false);
select set_config('b9.test_aal','aal2',false);
select public.jb_b9_owner_assign_term('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','topic','school','School','add');
select public.jb_b9_owner_assign_term('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','tag','local-news','Local News','add');
select public.jb_b9_owner_assign_term('dddddddd-dddd-4ddd-8ddd-dddddddddddd','tag','private-tag','Secret Tag','add');
select public.jb_b9_owner_metric_settings(true,null,true,true,null);
select public.jb_b9_owner_metric_settings(false,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true,true,999);
do $$
declare x jsonb;raw_before int;raw_after int;
begin
 x:=public.jb_b9_search(p_term=>'school');
 if jsonb_array_length(x->'items')<>1 then raise exception 'B9_APPROVED_TERM_SEARCH_FAILED';end if;
 x:=public.jb_b9_taxonomy_discover();
 if x::text like '%private-tag%' or x::text not like '%school%' then raise exception 'B9_TAG_DISCOVERY_LEAK';end if;
 select count(*) into raw_before from public.analytics_events;
 x:=public.jb_b9_public_metrics('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
 if x->>'views'<>'999' or x->>'shares'<>'1' then raise exception 'B9_DISPLAY_SETTINGS_WRONG: %',x;end if;
 select count(*) into raw_after from public.analytics_events;
 if raw_before<>raw_after then raise exception 'B9_RAW_ANALYTICS_MUTATED';end if;
 x:=public.jb_b9_owner_analytics('2026-10-22 00:00:00+05:30','2026-10-23 00:00:00+05:30');
 if (x#>>'{summary,views}')::int<>2 or (x#>>'{summary,shares}')::int<>1 then raise exception 'B9_IST_BOUNDARY_BROKEN: %',x;end if;
 if (select count(*) from public.audit_logs where action='b9_metric_display_control')<2 then raise exception 'B9_DISPLAY_AUDIT_MISSING';end if;
end;$$;

-- Turn reporter OFF, existing published stories continue but directory name disappears.
update public.reporters set public_name_enabled=false where name='Opted-in Reporter';
do $$
begin
 if public.jb_b9_reporter_discovery()<>'[]'::jsonb then raise exception 'B9_REPORTER_OFF_STILL_VISIBLE';end if;
 if public.jb_b9_public_article_author('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') is not null then raise exception 'B9_REPORTER_OFF_BYLINE_LEAK';end if;
 if jsonb_array_length(public.jb_b9_search(p_query=>'archive')->'items')<>1 then raise exception 'B9_REPORTER_OFF_DELETED_NEWS';end if;
end;$$;

-- B9_T105_COMPLETE_KEYSET_PAGINATION: synthetic 3-page exhaustive traversal, no duplicates.
-- Explicitly check JSONB null cursor (distinct from SQL NULL): never call next page
-- once a terminal page has no cursor. This exercises all three public sort modes.
do $b9_full_cursor$
declare
  mode text;
  response jsonb;
  next_cursor jsonb;
  seen uuid[];
  article_id uuid;
  n integer;
begin
  foreach mode in array array['latest','oldest','relevance'] loop
    seen:=array[]::uuid[];
    next_cursor:=null;
    n:=0;
    loop
      response:=public.jb_b9_search(p_sort=>mode,p_limit=>1,p_cursor=>next_cursor);
      if jsonb_array_length(response->'items')<>1 then
        raise exception 'B9_T105_KEYSET_EARLY_EMPTY_%',mode;
      end if;
      article_id:=(response#>>'{items,0,id}')::uuid;
      if article_id=any(seen) then
        raise exception 'B9_T105_KEYSET_DUPLICATE_%',mode;
      end if;
      seen:=array_append(seen,article_id);
      n:=n+1;
      if n>4 then raise exception 'B9_T105_KEYSET_LOOP_%',mode; end if;
      next_cursor:=response->'next_cursor';
      exit when jsonb_typeof(next_cursor) is distinct from 'object';
    end loop;
    if n<>3 or array_length(seen,1) is distinct from 3 then
      raise exception 'B9_T105_KEYSET_MISSING_%: got %',mode,n;
    end if;
  end loop;
end;
$b9_full_cursor$;

-- New public search grant but no direct access to original private source/movement.
do $$
begin
 if not has_function_privilege('anon','public.jb_b9_search(text,text,date,date,integer,integer,text,text,text,text,text,jsonb,integer)','execute')
 or has_function_privilege('anon','public.jb_b9_owner_analytics(timestamptz,timestamptz,text,integer)','execute')
 then raise exception 'B9_RPC_GRANTS_WRONG';end if;
end;$$;

-- Synthetic lifecycle E4 regression: correction must replace public search snippet,
-- unpublished story absent, republish SAME UUID/slug; Index REBUILD never generates identity.
do $$
declare
 oid uuid:='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 original_slug text; before_id uuid; result jsonb;
begin
 select id,slug into before_id,original_slug from public.articles where id=oid;
 update public.articles set title='Updated corrected archive headline',body='Updated approved body' where id=oid;
 result:=public.jb_b9_search(p_query=>'Updated corrected');
 if jsonb_array_length(result->'items')<>1 or result#>>'{items,0,id}'<>oid::text then raise exception 'B9_CORRECTION_PURL_BROKEN';end if;
 result:=public.jb_b9_search(p_query=>'Old approved archive story');
 if jsonb_array_length(result->'items')<>0 then raise exception 'B9_STALE_CORRECTION_SNIPPET';end if;
 update public.articles set status='unpublished' where id=oid;
 if jsonb_array_length(public.jb_b9_search(p_query=>'Updated corrected')->'items')<>0 then raise exception 'B9_UNPUBLISHED_VISIBLE';end if;
 update public.articles set status='published' where id=oid;
 if (select slug from public.articles where id=oid)<>original_slug or
    (select count(*) from public.articles where id=before_id)<>1 then
  raise exception 'B9_REPUBLISH_NEW_IDENTITY';
 end if;
end;$$;
reindex index public.b9_articles_public_text_idx;
reindex index public.b9_articles_public_archive_idx;

-- T100 E2/E4 negative: retire an isolated synthetic Article ID using the
-- identical guard SQL observed read-only on live JANTA BOL 2026-10-23.
-- Never delete LIVE Articles or reinsert their UUIDs; all of this ROLLS BACK.
create table public.record_disposition_ledger(
 record_type text not null,record_id text not null,
 primary key(record_type,record_id)
);
create or replace function private.jb_article_retired_identity_guard()
returns trigger language plpgsql security definer set search_path=''
as $guard$
begin
 if exists(select 1 from public.record_disposition_ledger
           where record_type='article' and record_id=new.id::text)
 then raise exception 'ARTICLE_ID_RETIRED'; end if;
 return new;
end;
$guard$;
create trigger trg_jb_article_retired_identity_guard
 before insert on public.articles for each row
 execute function private.jb_article_retired_identity_guard();
do $t100_guard$
declare
 x uuid:='00000000-0000-4000-8000-00000000b910';
 blocked boolean:=false;
begin
 insert into public.record_disposition_ledger(record_type,record_id)
 values('article',x::text);
 begin
   insert into public.articles(id,status,slug,title,body)
   values(x,'draft','synthetic-retired-t100','MUST NEVER INSERT','never public');
 exception when others then
   if SQLERRM='ARTICLE_ID_RETIRED' then blocked:=true;
   else raise;end if;
 end;
 if not blocked then raise exception 'B9_RETIRED_ARTICLE_ID_REUSE_NOT_BLOCKED';end if;
 if exists(select 1 from public.articles where id=x)
 then raise exception 'B9_RETIRED_ARTICLE_NEW_ROW_EXISTS';end if;
end;
$t100_guard$;

-- Actual anon-ROLE invocation verifies public RLS-safe projection, no private disclosure.
set local role anon;
select public.jb_b9_search(p_query=>'Shivpuri');
select public.jb_b9_reporter_discovery();
reset role;
rollback;
\echo 'B9 PG17 regression PASS only on synthetic fixture; Android LIVE NOT RUN.'
