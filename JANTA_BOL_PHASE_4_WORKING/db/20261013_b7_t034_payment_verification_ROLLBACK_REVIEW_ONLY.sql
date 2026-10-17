-- B7 T034 exact candidate rollback — REVIEW ONLY, NOT auto-executable.
-- Does NOT revert payments or mutate historical data. On LIVE requires
-- verified separately restorable pre-deployment backup, Founder approval,
-- and immediate fail-closed containment plan (removing a guard reopens flaw).
BEGIN;
DO $preflight$
DECLARE t record;
BEGIN
  IF to_regprocedure('private.b7_t034_assert_advertiser_verified(uuid)') IS NULL
     OR to_regprocedure('private.b7_t034_confirmed_payment_guard()') IS NULL
     OR to_regprocedure('private.b7_t034_paid_state_guard()') IS NULL
  THEN RAISE EXCEPTION 'B7_T034_ROLLBACK_FUNCTIONS_MISSING_ABORT'; END IF;
  FOR t IN SELECT expected.trigger_name,expected.table_name,pg_get_triggerdef(tr.oid) AS def
  FROM (VALUES
    ('b7_t034_payment_verified_gate','ad_payments'),
    ('b7_t034_paid_state_verified_gate','ad_campaigns')
  ) expected(trigger_name,table_name)
  LEFT JOIN pg_trigger tr ON tr.tgname=expected.trigger_name
      AND tr.tgrelid=to_regclass('public.'||expected.table_name)
      AND NOT tr.tgisinternal
  LOOP
    IF t.def IS NULL OR t.def NOT LIKE
       (CASE t.trigger_name
         WHEN 'b7_t034_payment_verified_gate' THEN
           '%EXECUTE FUNCTION private.b7_t034_confirmed_payment_guard()%'
         ELSE '%EXECUTE FUNCTION private.b7_t034_paid_state_guard()%'
       END)
    THEN RAISE EXCEPTION 'B7_T034_ROLLBACK_TRIGGER_DRIFT_ABORT: %',t.trigger_name;
    END IF;
  END LOOP;
  IF EXISTS(
    SELECT 1 FROM pg_trigger tr JOIN pg_class c ON c.oid=tr.tgrelid
    WHERE tr.tgfoid IN (
     'private.b7_t034_confirmed_payment_guard()'::regprocedure,
     'private.b7_t034_paid_state_guard()'::regprocedure
    ) AND tr.tgname NOT IN('b7_t034_payment_verified_gate','b7_t034_paid_state_verified_gate')
  ) THEN RAISE EXCEPTION 'B7_T034_GUARD_NEW_DEPENDENCIES_ABORT'; END IF;
END $preflight$;

DROP TRIGGER b7_t034_payment_verified_gate ON public.ad_payments;
DROP TRIGGER b7_t034_paid_state_verified_gate ON public.ad_campaigns;
DROP FUNCTION private.b7_t034_confirmed_payment_guard();
DROP FUNCTION private.b7_t034_paid_state_guard();
DROP FUNCTION private.b7_t034_assert_advertiser_verified(uuid);
-- NOTE: Original two payment RPCs, original payment trigger, grants,
-- historical data, audit and other schemas are untouched. NO CASCADE.
COMMIT;
