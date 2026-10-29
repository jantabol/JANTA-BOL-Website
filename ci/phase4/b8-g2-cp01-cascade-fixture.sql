\set ON_ERROR_STOP on
-- ONLY the isolated disposable Postgres17 fixture. Simulates exact known old Article FK actions.
-- Original LIVE article_sources/article_versions/verification_history all use ON DELETE CASCADE.
alter table public.articles
 add column title text,
 add column version bigint not null default 1,
 add column deleted_at timestamptz;
update public.articles set title=headline,version=7 where id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
create table public.article_sources (
 id uuid primary key,
 article_id uuid not null references public.articles(id) on delete cascade,
 confidential boolean not null default true,
 source_name text not null
);
create table public.article_versions (
 id bigint generated always as identity primary key,
 article_id uuid not null references public.articles(id) on delete cascade,
 snapshot jsonb not null
);
create table public.verification_history (
 id bigint generated always as identity primary key,
 article_id uuid not null references public.articles(id) on delete cascade,
 result text not null
);
insert into public.article_sources(id,article_id,source_name,confidential)
 values('cccccccc-cccc-cccc-cccc-cccccccccccc',
 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','SYNTHETIC PRIVATE SOURCE',true);
insert into public.article_versions(article_id,snapshot)
 values('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','{"fake_test":"strictly_disposable"}'::jsonb);
insert into public.verification_history(article_id,result)
 values('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','SYNTHETIC_FIXTURE_ONLY');
