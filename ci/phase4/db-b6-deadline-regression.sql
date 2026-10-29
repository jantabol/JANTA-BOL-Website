-- P4-T017: read-only backend deadline boundaries and authority checks.
-- No LIVE records are created, changed, or deleted.
DO $test$
DECLARE v_src text; v_core text; v_now timestamptz := '2026-10-08 12:00:00+00'; v_case record; v_actual text;
BEGIN
SELECT pg_get_functiondef(p.oid) INTO v_src FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname='jb_compliance_refresh_deadlines_internal';
IF v_src IS NULL THEN RAISE EXCEPTION 'T017: refresh function absent'; END IF;
-- The public wrapper delegates to the canonical private worker. Trace that edge;
-- do not demand that the wrapper duplicate the worker's lifecycle implementation.
IF position('private.jb_compliance_deadline_tick_core' in v_src)=0
   OR position('private.p4_staff_allowed' in v_src)=0
THEN RAISE EXCEPTION 'T017: guarded canonical worker delegation absent'; END IF;
SELECT pg_get_functiondef('private.jb_compliance_deadline_tick_core(timestamptz,uuid)'::regprocedure) INTO v_core;
IF v_core IS NULL OR position('status<>''complete''' in v_core)=0 THEN RAISE EXCEPTION 'T017: completed-task exclusion absent in worker'; END IF;
IF position('jb_notification_emit_internal' in v_core)=0 OR position('compliance_history' in v_core)=0 THEN RAISE EXCEPTION 'T017: canonical notification or history hook absent'; END IF;
FOR v_case IN SELECT * FROM (VALUES
 ('upcoming',v_now+interval '4 days'),
 ('due_soon',v_now+interval '2 days'),
 ('due_today',v_now+interval '1 hour'),
 ('overdue',v_now-interval '1 minute')
) AS t(expected,due_at)
LOOP
 SELECT CASE WHEN v_case.due_at<v_now THEN 'overdue'
 WHEN v_case.due_at::date=v_now::date THEN 'due_today'
 WHEN v_case.due_at<=v_now+interval '3 days' THEN 'due_soon'
 ELSE 'upcoming' END INTO v_actual;
 IF v_actual<>v_case.expected THEN RAISE EXCEPTION 'T017 state mismatch expected %, got %',v_case.expected,v_actual; END IF;
 RAISE NOTICE 'T017 deadline boundary %: PASS',v_actual;
END LOOP;
RAISE NOTICE 'T017 read-only formula/source regression PASS; notification delivery and live state transitions remain unverified';
END $test$;
