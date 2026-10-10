\set ON_ERROR_STOP on
-- Disposable PostgreSQL 17 fixture ONLY. No Production Ad/Article data.
-- Reuses b7-payment-fixture.sql plus b7-weighted-fixture.sql.
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create table public.ad_events(
 id bigint generated always as identity primary key,
 campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
 event_type text not null check(event_type in('impression','click')),
 created_at timestamptz not null default now()
);
create or replace function public.jb_ad_event(p_campaign uuid,p_event text)
returns void language plpgsql security definer
set search_path to 'pg_catalog','public'
as $old$
begin
 if p_event not in('impression','click') then raise exception 'INVALID_AD_EVENT';end if;
 insert into public.ad_events(campaign_id,event_type) values(p_campaign,p_event);
end $old$;
create or replace function public.jb_ad_record_event(p_campaign uuid,p_event text)
returns boolean language plpgsql security definer
set search_path to 'pg_catalog','public'
as $old$
begin
 if p_event not in('impression','click') then raise exception 'INVALID_AD_EVENT';end if;
 insert into public.ad_events(campaign_id,event_type) values(p_campaign,p_event);
 return true;
end $old$;
grant execute on function public.jb_ad_event(uuid,text) to anon,authenticated;
grant execute on function public.jb_ad_record_event(uuid,text) to anon,authenticated;
