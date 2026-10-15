-- JANTA BOL P4-T034 ADS-008 source parity gate. STRICTLY READ-ONLY.
-- No DDL/DML, no secrets, no payment rows, no private function bodies.
-- Run ONLY on JANTA BOL Supabase project vrffsnkycvjithwtiylt; return
-- blocker names, not personal data. GO means source compatible with
-- candidate SQL at review time. It NEVER approves a production migration,
-- G5 recovery, P4-T034 PASS, or bypasses a Founder deployment decision.
WITH checks(gate,ok) AS (
  VALUES
  ('janta_bol_database',current_database()='postgres'),
  ('postgres_17_6',current_setting('server_version') LIKE '17.6%'),
  ('live_owner_postgres',(
    SELECT pg_get_userbyid(datdba)='postgres'
    FROM pg_database WHERE datname=current_database()
  )),
  ('payment_table_rls',(
    SELECT relrowsecurity FROM pg_class
    WHERE oid=to_regclass('public.ad_payments')
  )),
  ('campaign_table_rls',(
    SELECT relrowsecurity FROM pg_class
    WHERE oid=to_regclass('public.ad_campaigns')
  )),
  ('adverts_table_rls',(
    SELECT relrowsecurity FROM pg_class
    WHERE oid=to_regclass('public.advertisers')
  )),
  ('owner_aal2_original_hash',COALESCE((
    SELECT md5(pg_get_functiondef(oid))='e6156587823824602ca1f432c3425e38'
    FROM pg_proc WHERE oid=to_regprocedure('private.p4_owner_allowed()')
  ),false)),
  ('preexisting_payment_validation_hash',COALESCE((
    SELECT md5(pg_get_functiondef(oid))='a8b4cebcb69718a76903bed717baf11b'
    FROM pg_proc WHERE oid=to_regprocedure('private.p4_ad_guard_confirmed_payment()')
  ),false)),
  ('old_confirm_payment_rpc_hash',COALESCE((
    SELECT md5(pg_get_functiondef(oid))='fed4e4f0c3c61091c9bfbeb59802f3a2'
    FROM pg_proc WHERE oid=to_regprocedure('public.jb_ad_confirm_payment_internal(uuid,text,bigint)')
  ),false)),
  ('old_record_payment_rpc_hash',COALESCE((
    SELECT md5(pg_get_functiondef(oid))='441749b81dbbc287b4ef752ac1a1e9f8'
    FROM pg_proc WHERE oid=to_regprocedure('public.jb_ad_record_payment_internal(uuid,text,text,bigint,text,boolean)')
  ),false)),
  ('original_payment_trigger_exists',EXISTS(
    SELECT 1 FROM pg_trigger t
    WHERE t.tgrelid=to_regclass('public.ad_payments')
      AND t.tgname='p4_ad_guard_confirmed_payment'
      AND NOT t.tgisinternal AND t.tgenabled='O'
  )),
  ('proposed_t034_triggers_not_deployed',NOT EXISTS(
    SELECT 1 FROM pg_trigger
    WHERE tgname IN ('b7_t034_payment_verified_gate',
                     'b7_t034_paid_state_verified_gate') AND NOT tgisinternal
  )),
  ('proposed_t034_functions_not_deployed',
    to_regprocedure('private.b7_t034_assert_advertiser_verified(uuid)') IS NULL
    AND to_regprocedure('private.b7_t034_confirmed_payment_guard()') IS NULL
    AND to_regprocedure('private.b7_t034_paid_state_guard()') IS NULL),
  ('all_required_guard_columns',(
    SELECT count(*)=10 FROM information_schema.columns
    WHERE (table_schema='public' AND table_name='ad_campaigns'
           AND column_name IN ('id','status','paid_at','advertiser_id','approved_at'))
       OR (table_schema='public' AND table_name='ad_payments'
           AND column_name IN ('id','status','campaign_id','amount_minor','currency'))
  )),
  ('seven_extension_versions_available',(
    SELECT count(*)=7 FROM pg_extension
    WHERE (extname,extversion) IN (
      ('pg_cron','1.6.4'),('pg_net','0.20.4'),
      ('supabase_vault','0.3.1'),('pg_stat_statements','1.11'),
      ('pgcrypto','1.3'),('plpgsql','1.0'),('uuid-ossp','1.1')
    )
  ))
)
SELECT CASE WHEN bool_and(coalesce(ok,false))
  THEN 'SOURCE_SCHEMA_PARITY_ONLY_GO_NO_DEPLOY_PERMISSION'
  ELSE 'SOURCE_SCHEMA_DRIFT_HOLD' END AS verdict,
  count(*) AS checks,
  count(*) FILTER (WHERE coalesce(ok,false)) AS passed,
  coalesce(string_agg(gate,',' ORDER BY gate) FILTER (
    WHERE NOT coalesce(ok,false)),'NONE') AS blocker_names
FROM checks;
