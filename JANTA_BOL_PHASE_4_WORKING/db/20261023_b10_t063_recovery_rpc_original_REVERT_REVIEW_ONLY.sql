-- B10 P4-T063 EMERGENCY REVERT — REVIEW ONLY, NEVER AUTOMATIC.
-- Restores the exact prior Owner-role-only recovery RPC (session revocation weakness).
-- Run only on proven business-breaking regression after explicit security signoff.
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='25s';
CREATE OR REPLACE FUNCTION public.jb_verify_owner_recovery_key(p_recovery_key text)
RETURNS TABLE(success boolean, locked_until timestamptz, remaining_attempts integer)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path TO ''
AS $old$
DECLARE v_uid uuid := auth.uid();
 v_role public.app_role;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED';END IF;
 SELECT ur.role INTO v_role FROM public.user_roles ur WHERE ur.user_id=v_uid;
 IF v_role IS DISTINCT FROM 'owner'::public.app_role THEN
  RAISE EXCEPTION 'OWNER_REQUIRED';END IF;
 RETURN QUERY SELECT * FROM private.verify_owner_recovery_key(v_uid,p_recovery_key);
END $old$;
COMMIT;
