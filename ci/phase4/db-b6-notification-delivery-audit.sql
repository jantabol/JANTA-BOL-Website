\set ON_ERROR_STOP on
-- P4-T017 read-only evidence gate. No production data changes.
DO $$
DECLARE
 v_n integer;
 v_outbox integer;
 v_jobs integer;
 v_func oid;
BEGIN
 SELECT count(*) INTO v_n FROM pg_proc
 WHERE proname='jb_compliance_refresh_deadlines_internal'
 AND pg_get_functiondef(oid) LIKE '%p4_staff_allowed%';
 IF v_n<>1 THEN RAISE EXCEPTION 'B6_DEADLINE_AUTH_GATE_MISSING'; END IF;

 SELECT oid INTO v_func FROM pg_proc WHERE proname='jb_notification_delivery_attempt_internal';
 IF v_func IS NULL THEN RAISE EXCEPTION 'B6_DELIVERY_RECEIPT_FUNCTION_MISSING'; END IF;
 IF has_function_privilege('anon',v_func,'EXECUTE')
 OR has_function_privilege('authenticated',v_func,'EXECUTE') THEN
 RAISE EXCEPTION 'B6_DELIVERY_RECEIPT_EXPOSED';
 END IF;

 SELECT count(*) INTO v_jobs FROM cron.job
 WHERE jobname ILIKE '%compliance%' AND active;
 SELECT count(*) INTO v_outbox FROM public.notification_delivery_outbox;
 RAISE NOTICE 'OBSERVATION: active_compliance_cron_jobs=%, outbox_rows=%',v_jobs,v_outbox;
 IF v_jobs=0 THEN RAISE NOTICE 'P4-T017 SCHEDULER NOT VERIFIED: no active compliance job'; END IF;
 RAISE NOTICE 'PASS: read-only authorization and delivery-receipt exposure checks (NOT P4-T017 full PASS)';
END $$;
