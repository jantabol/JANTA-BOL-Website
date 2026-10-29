\set ON_ERROR_STOP on
-- Disposable Postgres17 ONLY: old production enum casting, no original LIVE mutation.
-- Exact five-label LIVE public.article_status observed by read-only pg_catalog (17 Oct 2026).
-- Previous synthetic 3-label enum missed 'review' and 'deleted' states.
create type public.article_status as enum ('draft','published','review','unpublished','deleted');
alter table public.articles
 alter column status type public.article_status
 using status::public.article_status;
-- Additional synthetic unpublished Article and independently published FOLLOWUP.
insert into public.articles(id,status,headline,title,version,deleted_at)
 values
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','draft',
 'SYNTHETIC PRIVATE DRAFT CONTACT +91-9812345678','SYNTHETIC PRIVATE DRAFT CONTACT +91-9812345678',1,null),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','published',
 'New follow-up article separate permanent UUID','New follow-up article separate permanent UUID',1,null);
