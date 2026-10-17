-- JANTA BOL B8 CP02 — REPEATABLE READ-ONLY LIVE CATALOG PREFLIGHT.
-- Tested 2026-10-17 on JANTA BOL PG17: 18/18. No data-row reads,
-- no DDL/DML, no backup export, no permissions change.
-- Not a deployment or restore permit. Review exact project before running.
with facts as (
  select
    to_regnamespace('private') is not null as private_schema,
    to_regprocedure('private.current_owner_aal2()') is not null as owner_aal2,
    to_regprocedure('private.current_session_active()') is not null as active_session,
    to_regclass('public.articles') is not null as articles,
    to_regclass('public.user_roles') is not null as roles,
    to_regclass('public.team_accounts') is not null as staff,
    to_regclass('public.live_notifications') is not null as notice,
    to_regclass('public.b8_cases') is null as b8_case_not_deployed,
    not exists(select 1 from pg_proc p where p.proname like 'jb_b8_%') as b8_rpc_not_deployed,
    (select string_agg(e.enumlabel,',' order by e.enumsortorder)
       from pg_enum e join pg_type t on t.oid=e.enumtypid
       join pg_namespace n on n.oid=t.typnamespace
       where n.nspname='public' and t.typname='app_role')
       ='owner,admin,editor,reporter' as roles_enum,
    (select string_agg(e.enumlabel,',' order by e.enumsortorder)
       from pg_enum e join pg_type t on t.oid=e.enumtypid
       join pg_namespace n on n.oid=t.typnamespace
       where n.nspname='public' and t.typname='article_status')
       ='draft,published,review,unpublished,deleted' as article_enum,
    (select count(*)=4 from pg_attribute a join pg_class c on c.oid=a.attrelid
       join pg_namespace n on n.oid=c.relnamespace
       where n.nspname='public' and c.relname='articles'
       and a.attnum>0 and not a.attisdropped
       and ((a.attname='id' and a.atttypid='uuid'::regtype)
        or (a.attname='title' and a.atttypid='text'::regtype)
        or (a.attname='version' and a.atttypid='bigint'::regtype)
        or (a.attname='status' and a.atttypid='public.article_status'::regtype)))
      as article_essential_cols,
    (select count(*)=8 from pg_attribute a join pg_class c on c.oid=a.attrelid
       join pg_namespace n on n.oid=c.relnamespace
       where n.nspname='public' and c.relname='live_notifications'
       and a.attnum>0 and not a.attisdropped
       and ((a.attname='recipient_user_id' and a.atttypid='uuid'::regtype)
        or (a.attname='notification_type' and a.atttypid='text'::regtype)
        or (a.attname='priority' and a.atttypid='text'::regtype)
        or (a.attname='title' and a.atttypid='text'::regtype)
        or (a.attname='domain' and a.atttypid='text'::regtype)
        or (a.attname='delivery_state' and a.atttypid='text'::regtype)
        or (a.attname='dedupe_key' and a.atttypid='text'::regtype)
        or (a.attname='metadata' and a.atttypid='jsonb'::regtype)))
      as notice_essential_cols,
    exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
       where n.nspname='public' and c.relname='articles' and c.relrowsecurity)
      as article_rls,
    exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
       where n.nspname='public' and c.relname='live_notifications' and c.relrowsecurity)
      as notice_rls,
    (select count(*)=3 from pg_trigger t
       where t.tgrelid=to_regclass('public.articles')
       and t.tgname in ('trg_capture_article_history',
         'trg_enforce_article_lifecycle','trg_jb_article_retired_identity_guard')
       and t.tgenabled in ('O','A')) as article_protected_triggers,
    exists (select 1 from pg_index x
       where x.indrelid=to_regclass('public.live_notifications')
       and x.indisunique
       and pg_get_indexdef(x.indexrelid) ilike '%recipient_user_id, dedupe_key%'
       and pg_get_indexdef(x.indexrelid) ilike '%dedupe_key IS NOT NULL%')
      as notice_dedupe_index,
    exists (select 1 from pg_constraint con
       where con.conrelid=to_regclass('public.live_notifications')
       and con.conname='live_notifications_domain_check'
       and pg_get_constraintdef(con.oid) like '%system%')
      as notice_system_domain
),
checks as (
 select k,v from facts, lateral (values
 ('private_schema',private_schema),('owner_aal2',owner_aal2),
 ('active_session',active_session),('articles',articles),('roles',roles),
 ('staff',staff),('live_notifications',notice),
 ('b8_not_yet_deployed',b8_case_not_deployed),
 ('b8_rpc_not_yet_deployed',b8_rpc_not_deployed),
 ('roles_enum_exact',roles_enum),('article_status_enum_exact',article_enum),
 ('article_required_cols',article_essential_cols),
 ('notification_required_cols',notice_essential_cols),
 ('article_rls',article_rls),('notification_rls',notice_rls),
 ('article_existing_triggers_enabled',article_protected_triggers),
 ('notifications_dedupe_index',notice_dedupe_index),
 ('notification_system_domain',notice_system_domain)
 ) z(k,v)
)
select 'B8_READONLY_LIVE_CATALOG_PARITY' as report,
 count(*) as checks, count(*) filter(where v is true) as passing,
 count(*) filter(where v is distinct from true) as failed,
 coalesce(jsonb_agg(k order by k) filter(where v is distinct from true),
   '[]'::jsonb) as failures from checks;
