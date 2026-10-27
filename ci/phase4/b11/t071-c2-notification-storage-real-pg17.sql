\set ON_ERROR_STOP on
-- C2/N03: source-backed notification-storage failure with genuine B8 core case
-- commit continuity, using 15 existing pinned B8 migrations and PG17.
-- Strictly local disposable DB; no Supabase, paid provider, LIVE encoder, or user data.
DO $$
BEGIN
 IF current_database() <> 'jb_t071_c2' OR
    (SELECT count(*) FROM public.articles) <> 3 OR
    NOT EXISTS(
      SELECT 1 FROM public.articles
      WHERE id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
      AND headline='Existing News Article'
      AND status='published'
    )
 THEN RAISE EXCEPTION 'C2_NON_DISPOSABLE_DB_OR_WRONG_SOURCE_REFUSED'; END IF;
END $$;
-- Verify source notification table works before the controlled outage.
INSERT INTO public.live_notifications(
  recipient_user_id,notification_type,title,domain,dedupe_key
) VALUES(
 '11111111-1111-1111-1111-111111111111'::uuid,
 'C2_BASELINE','C2 source-backed synthetic notification baseline',
 'system','C2_BASELINE'
);
DO $$
BEGIN
 IF (SELECT count(*) FROM public.live_notifications WHERE dedupe_key='C2_BASELINE') <> 1
 THEN RAISE EXCEPTION 'C2_NOTIFICATION_BASELINE_MISSING'; END IF;
END $$;
-- Real backend fault: after initial notification succeeds, make the existing
-- B3 notification store reject *new* rows with a PG17 CHECK constraint.
-- This does not touch old entries or the independent core Article/Case store.
ALTER TABLE public.live_notifications
 ADD CONSTRAINT t071_c2_disposable_fault CHECK (false) NOT VALID;
DO $$
DECLARE correctly_failed boolean:=false;
BEGIN
 BEGIN
  INSERT INTO public.live_notifications(
    recipient_user_id,notification_type,title,domain,dedupe_key
  ) VALUES(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'C2_OUTAGE','New message must fail during controlled notification outage',
    'system','C2_OUTAGE'
  );
 EXCEPTION WHEN check_violation THEN
  correctly_failed:=true;
 END;
 IF NOT correctly_failed THEN
  RAISE EXCEPTION 'C2_NOTIFICATION_FAILURE_NOT_INJECTED';
 END IF;
END $$;
\echo T071_C2_REAL_NOTIFICATION_STORAGE_WRITE_FAILURE=OBSERVED

-- While the notification storage is genuinely rejecting new writes, the
-- real source B8 owner-case RPC must commit through an authenticated Owner
-- AAL2 simulator (not a real Founder login, and not product end-to-end).
SELECT set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
SELECT set_config('b8.fixture_session','on',false);
SELECT set_config('b8.fixture_aal','aal2',false);
SET ROLE authenticated;
SELECT public.jb_b8_g1_owner_create_case(
 'C2 notification outage must not destroy core source case action',
 'Pichhore','R1'
) AS c2_case_uuid \gset
RESET ROLE;

-- Readback of the *committed* real source case, the old Article and Ad, and
-- the denied notification. The deliberate outage must not claim "delivered".
DO $$
BEGIN
 IF (SELECT count(*) FROM public.b8_cases
     WHERE id=:'c2_case_uuid'::uuid)<>1 THEN
   RAISE EXCEPTION 'C2_BUSINESS_CASE_NOT_COMMITTED';
 END IF;
 IF (SELECT count(*) FROM public.articles
     WHERE id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
     AND status='published'
     AND headline='Existing News Article')<>1 THEN
   RAISE EXCEPTION 'C2_NEWS_CHANGED_DURING_NOTIFICATION_FAILURE';
 END IF;
 IF (SELECT count(*) FROM public.ad_campaigns
     WHERE id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
     AND status='requested')<>1 THEN
   RAISE EXCEPTION 'C2_AD_CHANGED_DURING_NOTIFICATION_FAILURE';
 END IF;
 IF EXISTS(SELECT 1 FROM public.live_notifications
           WHERE dedupe_key='C2_OUTAGE') THEN
   RAISE EXCEPTION 'C2_FALSE_NOTIFICATION_DELIVERY';
 END IF;
 IF (SELECT count(*) FROM public.live_notifications
     WHERE dedupe_key='C2_BASELINE')<>1 THEN
   RAISE EXCEPTION 'C2_OLD_NOTIFICATION_MUTATED';
 END IF;
END $$;
\echo T071_C2_REAL_B8_CORE_CASE_COMMITTED_DURING_NOTIFICATION_OUTAGE=PASS
\echo T071_C2_ORIGINAL_NEWS_AD_AND_OLD_NOTIFICATION_STABLE=PASS

-- Re-enable only the disposable backend module, then verify new message
-- succeeds. No target domain, source/credentials or production state changed.
ALTER TABLE public.live_notifications
 DROP CONSTRAINT t071_c2_disposable_fault;
INSERT INTO public.live_notifications(
  recipient_user_id,notification_type,title,domain,dedupe_key
) VALUES(
 '11111111-1111-1111-1111-111111111111'::uuid,
 'C2_RECOVERED','C2 source-backed synthetic notification recovered',
 'system','C2_RECOVERED'
);
DO $$
BEGIN
 IF (SELECT count(*) FROM public.live_notifications WHERE dedupe_key='C2_RECOVERED')<>1
 OR (SELECT count(*) FROM public.b8_cases WHERE id=:'c2_case_uuid'::uuid)<>1
 THEN RAISE EXCEPTION 'C2_RECOVERY_OR_COMMITTED_CASE_MISSING';END IF;
END $$;
\echo T071_C2_REAL_NOTIFICATION_RECOVERED_AND_COMMITTED_CASE_PRESERVED=PASS
\echo T071_C2_ACCOUNTABILITY_PREVIOUS_ISOLATED_SCOPE=UNCHANGED
\echo T071_C2_NOTIFICATIONS_REAL_PG17_COMPONENT_SCOPE=PASS
\echo T071_C2_EXTERNAL_MESSAGING_PROVIDER_FAILURE=NOT_TESTED
\echo T071_C2_FULL_INTEGRATED_NOTIFICATIONS_E8=HOLD
\echo T071_C1_FINAL=HOLD
\echo T071_FINAL_PASS_LOCK=false
