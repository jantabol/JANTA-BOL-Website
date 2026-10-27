\set ON_ERROR_STOP on
-- P4-T071 E8 B8 public-accountability fault isolation with REAL PostgreSQL17
-- source migration and transactional SQL functions, synthetic data only.
-- Never connect to production; fixture initialized in separate exact checkout.
-- The revocation deliberately affects ONLY ephemeral local DB; transaction ROLLBACK.
begin;
do $guard$
begin
 if current_database() <> 'jb_t071_e8'
 or not exists(select 1 from public.articles where id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and headline='Existing News Article')
 or (select count(*) from public.articles)<>3
 then raise exception 'T071_E8_PRODUCTION_OR_NON_SYNTHETIC_DB_FORBIDDEN';end if;
end $guard$;

select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_session','on',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g1_owner_create_case(
  'T071 synthetic independent source module outage isolation',
  'Pichhore','R1') as t071_case \gset
select public.jb_b8_g2_owner_link_article(
  :'t071_case'::uuid,'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
select public.jb_b8_g4_owner_release_public_projection(
  :'t071_case'::uuid,'PUBLISH','PUBLIC_WORKS','PICHHORE','UNDER_REVIEW',true);
reset role;

-- Verify before fault: published original Article remains unchanged, linked
-- approved safe public case is discoverable and private title is not leaked.
do $baseline$
declare v jsonb;
begin
 if (select count(*) from public.articles where id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and status='published' and headline='Existing News Article')<>1
 or (select count(*) from public.ad_campaigns where id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' and status='requested')<>1
 then raise exception 'T071_E8_BEFORE_OLD_NEWS_AD_BAD';end if;
end $baseline$;

-- Existing B8 public case independent RPC works before controlled failure.
set role anon;
select public.jb_b8_g4_public_feed(12) as t071_initial_feed \gset
do $pre$
declare v jsonb;
begin
 v:=public.jb_b8_g4_public_feed(12);
 if jsonb_array_length(v)<>1 then raise exception 'T071_E8_PUBLIC_FEED_BASELINE_WRONG';end if;
 if v::text like '%synthetic independent source module outage isolation%'
 then raise exception 'T071_E8_PRIVATE_SOURCE_LEAK';end if;
end $pre$;
reset role;

-- Actual backend privilege failure induced in this throwaway PG transaction:
-- revoke only the optional accountability-feed RPC from anon. Neither the
-- original News/Ad tables nor the separate case RPC are changed.
revoke execute on function public.jb_b8_g4_public_feed(integer) from anon;
set role anon;
do $fault$
declare denied boolean:=false;
begin
 begin
   perform public.jb_b8_g4_public_feed(12);
 exception when insufficient_privilege then denied:=true;
 end;
 if not denied then raise exception 'T071_E8_MODULE_FAULT_NOT_REAL';end if;
end $fault$;
-- The separate real public per-case RPC remains callable during feed failure.
select public.jb_b8_g4_public_case(:'t071_case'::uuid) as unaffected_case \gset

reset role;
do $after$
begin
 if (select count(*) from public.articles where id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and status='published' and headline='Existing News Article')<>1
 or (select count(*) from public.ad_campaigns where status='requested')<>1
 then raise exception 'T071_E8_FAILURE_CHANGED_CORE_BUSINESS_ROWS';end if;
 if not has_function_privilege('anon','public.jb_b8_g4_public_case(uuid)','EXECUTE')
 or has_function_privilege('anon','public.jb_b8_g4_public_feed(integer)','EXECUTE')
 then raise exception 'T071_E8_PRIVILEGE_ISOLATION_NOT_HELD';end if;
end $after$;

-- Role capability restored within disposable SQL transaction, no schema drift.
grant execute on function public.jb_b8_g4_public_feed(integer) to anon;
set role anon;
do $recovery$
declare v jsonb;
begin
 v:=public.jb_b8_g4_public_feed(12);
 if jsonb_array_length(v)<>1 then raise exception 'T071_E8_MODULE_RECOVERY_FAILED';end if;
end $recovery$;
reset role;
do $final$
begin
 if (select count(*) from public.articles where id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and headline='Existing News Article' and status='published')<>1
 or (select count(*) from public.ad_campaigns where status='requested')<>1
 then raise exception 'T071_E8_NEWS_AD_REGRESSION_AFTER_RECOVERY';end if;
end $final$;
rollback;
\echo T071_REAL_PG17_B8_ACCOUNTABILITY_FEED_MODULE_FAULT=PASS
\echo T071_REAL_PG17_CASE_RPC_SURVIVED_FEED_OUTAGE=PASS
\echo T071_REAL_PG17_ORIGINAL_ARTICLE_AD_ROWS_UNCHANGED=PASS
\echo T071_REAL_PG17_ACCOUNTABILITY_FEED_RPC_RESTORED=PASS
\echo T071_REAL_PG17_SOURCE_TRANSACTION_ROLLBACK=PASS
\echo T071_FULL_INTEGRATED_ALL_13_DOMAINS=NOT_PROVEN
\echo T071_FULL_E8_FINAL_LOCK=HOLD
