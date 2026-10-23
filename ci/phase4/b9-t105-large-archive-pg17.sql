\set ON_ERROR_STOP on
-- P4-T105 ONLY: large-archive synthetic performance regression.
-- Disposable GitHub Actions PG17 with fake fixtures, NEVER LIVE Supabase.
-- This is NOT proof of an actual 2024/25 live article nor a real Android
-- browser handling 5,000 stories.  It checks backend scale and privacy.
begin;
set local statement_timeout='90s';
insert into public.articles
(id,status,slug,title,headline,excerpt,body,category,district,location,
 news_date,published_at,deleted_at)
select
 ('b1050000-0000-4000-8000-'||lpad(to_hex(g),12,'0'))::uuid,
 case when g<=4500 then 'published'::public.article_status
      when g<=4750 then 'draft'::public.article_status
      when g<=4875 then 'unpublished'::public.article_status
      else 'deleted'::public.article_status end,
 't105-large-synthetic-'||g,
 'Synthetic historical archival headline '||g,
 'Synthetic historical archival headline '||g,
 'Synthetic excerpt item '||g,
 case when g<=4500 then 'Safe historical approved story item '||g
      else 'T105_PRIVATE_HISTORY_SENTINEL NEVER PUBLIC item '||g end,
 case when g%3=0 then 'Education' when g%3=1 then 'Crime' else 'Health' end,
 case when g%2=0 then 'Shivpuri' else 'Guna' end,
 case when g%2=0 then 'Pichhore' else 'Guna' end,
 (date '2024-01-01' + ((g-1)%700)),
 case when g<=4500
  then (date '2024-01-01' + ((g-1)%700))::timestamp at time zone 'Asia/Kolkata'
  else null::timestamptz end,
 case when g>4875 then clock_timestamp() else null::timestamptz end
from generate_series(1,5000) as g;
analyze public.articles;

do $t105_scale$
declare
 res jsonb;
 cur jsonb;
 seen uuid[]:=array[]::uuid[];
 row jsonb;
 ident uuid;
 page_count int:=0;
 public_count int:=0;
 t0 timestamptz;
 query_ms double precision;
 max_query_ms double precision:=0;
begin
 if (select count(*) from public.articles where status='published' and deleted_at is null)<>4503
 then raise exception 'T105_FIXTURE_PUBLISHED_COUNT';end if;
 if (select count(*) from public.articles where status<>'published' or deleted_at is not null)<>503
 then raise exception 'T105_FIXTURE_HIDDEN_COUNT';end if;

 -- 2024/2025 synthetic history remains searchable by exact ID without tag.
 if public.jb_b9_search(p_id=>'b1050000-0000-4000-8000-000000000001')#>>'{items,0,permanent_url}'
     <> 'article.html?id=b1050000-0000-4000-8000-000000000001'
 then raise exception 'T105_2024_OLD_ARTICLE_ID_LOST';end if;
 if jsonb_array_length(public.jb_b9_search(p_year=>2024,p_limit=>50)->'items')<>50
 then raise exception 'T105_2024_YEAR_ARCHIVE_MISSING';end if;
 if jsonb_array_length(public.jb_b9_search(p_year=>2025,p_limit=>50)->'items')<>50
 then raise exception 'T105_2025_YEAR_ARCHIVE_MISSING';end if;
 if jsonb_array_length(public.jb_b9_search(p_query=>'T105_PRIVATE_HISTORY_SENTINEL')->'items')<>0
 then raise exception 'T105_HIDDEN_BODY_LEAK_ON_LARGE_ARCHIVE';end if;
 if jsonb_array_length(public.jb_b9_search(p_id=>'b1050000-0000-4000-8000-000000001196')->'items')<>0
 then raise exception 'T105_DRAFT_UUID_ENUMERATION';end if;

 -- Every public Article is enumerated exactly once via actual RPC cursor.
 -- Tracks observed query time as a diagnostic only, NOT a mobile speed claim.
 loop
   t0:=clock_timestamp();
   res:=public.jb_b9_search(p_sort=>'oldest',p_limit=>50,p_cursor=>cur);
   query_ms:=extract(epoch from clock_timestamp()-t0)*1000.0;
   max_query_ms:=greatest(max_query_ms,query_ms);
   page_count:=page_count+1;
   if page_count>95 then raise exception 'T105_ARCHIVE_PAGE_LOOP';end if;
   if jsonb_array_length(res->'items')=0 or jsonb_array_length(res->'items')>50
   then raise exception 'T105_ARCHIVE_EMPTY_OR_OVERSIZED_PAGE %',page_count;end if;
   for row in select value from jsonb_array_elements(res->'items') loop
     ident:=(row->>'id')::uuid;
     if ident=any(seen) then raise exception 'T105_ARCHIVE_DUPLICATE %',ident;end if;
     seen:=array_append(seen,ident);
     if row->>'permanent_url' is distinct from 'article.html?id='||ident::text
     then raise exception 'T105_ARCHIVE_PURL_CHANGED';end if;
   end loop;
   cur:=res->'next_cursor';
   exit when jsonb_typeof(cur) is distinct from 'object';
 end loop;
 public_count:=coalesce(array_length(seen,1),0);
 if public_count<>4503 then
   raise exception 'T105_ARCHIVE_INCOMPLETE got %, expected 4503',public_count;end if;
 if page_count<>91 then
   raise exception 'T105_ARCHIVE_BAD_PAGE_COUNT %',page_count;end if;
 raise notice 'T105_PG17_LARGE_ARCHIVE_SYNTHETIC_PASS public=4503 hidden=503 pages=91 unique=4503 max_query_ms=% (CI host only, NOT Android measurement)',round(max_query_ms::numeric,2);
end;
$t105_scale$;
rollback;
\echo 'T105 5000-row DISPOSABLE PG17 scale PASS, not production archive E3.'