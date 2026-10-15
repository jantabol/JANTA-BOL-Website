-- P4-T034 CP02: restored APP sequence next-value safety.
-- Networkless disposable clone ONLY. Does NOT call nextval/setval or mutate rows.
-- These two named sequences cover ADS-008 ad_history and common audit_logs
-- affected by verification/payment/transition. Other project sequences are
-- out of this targeted gate and remain in later complete B11 recovery audit.
DO $proof$
DECLARE
    history_max bigint;
    audit_max bigint;
    history_last bigint;
    audit_last bigint;
    history_called boolean;
    audit_called boolean;
BEGIN
    IF pg_get_serial_sequence('public.ad_history', 'id')
         IS DISTINCT FROM 'public.ad_history_id_seq'
       OR pg_get_serial_sequence('public.audit_logs', 'id')
         IS DISTINCT FROM 'public.audit_logs_id_seq'
    THEN
        RAISE EXCEPTION 'T034_SEQUENCE_OWNER_MAPPING_DIVERGED';
    END IF;
    SELECT coalesce(max(id), 0) INTO history_max FROM public.ad_history;
    SELECT coalesce(max(id), 0) INTO audit_max FROM public.audit_logs;
    SELECT last_value, is_called INTO STRICT history_last, history_called
      FROM public.ad_history_id_seq;
    SELECT last_value, is_called INTO STRICT audit_last, audit_called
      FROM public.audit_logs_id_seq;
    IF (history_max > 0 AND (
        history_last < history_max
        OR (history_last = history_max AND NOT history_called)
       ))
       OR (audit_max > 0 AND (
        audit_last < audit_max
        OR (audit_last = audit_max AND NOT audit_called)
       ))
    THEN
        RAISE EXCEPTION 'T034_RESTORED_SEQUENCE_BEHIND_EXISTING_ID';
    END IF;
    RAISE NOTICE 'T034_AD_HISTORY_AUDIT_SEQUENCE_SAFETY=PASS';
END
$proof$;
