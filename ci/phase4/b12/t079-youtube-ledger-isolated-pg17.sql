\set ON_ERROR_STOP on
-- Isolated PG17 synthetic fixtures: no production credentials, no media, no Google calls.
DO $bootstrap$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
END
$bootstrap$;
\i JANTA_BOL_PHASE_4_WORKING/db/T079_YOUTUBE_VIDEO_LEDGER_PG17_REVIEW_ONLY.sql
DO $check_acl$
BEGIN
 IF has_function_privilege('anon','public.jb_t079_video_begin_internal(uuid,uuid)','EXECUTE')
 OR has_function_privilege('authenticated','public.jb_t079_video_begin_internal(uuid,uuid)','EXECUTE')
 OR has_function_privilege('anon','public.jb_t079_video_reserve_internal(uuid,bigint,text,text,text,integer,text,text)','EXECUTE')
 OR has_function_privilege('authenticated','public.jb_t079_video_transition_internal(uuid,uuid,text,text,text,text,text)','EXECUTE')
 THEN RAISE EXCEPTION 'T079_PUBLIC_RPC_EXPOSURE'; END IF;
 IF has_schema_privilege('anon','private','USAGE') OR has_schema_privilege('authenticated','private','USAGE')
 THEN RAISE EXCEPTION 'T079_PRIVATE_SCHEMA_EXPOSURE'; END IF;
 IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='private.jb_t079_youtube_video_jobs'::regclass)
 THEN RAISE EXCEPTION 'T079_RLS_MISSING'; END IF;
END
$check_acl$;
SET ROLE anon;
DO $anon$
BEGIN
 BEGIN
  PERFORM count(*) FROM private.jb_t079_youtube_video_jobs;
  RAISE EXCEPTION 'T079_ANON_DATA_LEAK';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM public.jb_t079_video_begin_internal('00000000-0000-4000-8000-000000000001',gen_random_uuid());
  RAISE EXCEPTION 'T079_ANON_RPC_LEAK';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END
$anon$;
RESET ROLE;
SET ROLE authenticated;
DO $auth$
BEGIN
 BEGIN
  PERFORM public.jb_t079_video_reserve_internal(
   '00000000-0000-4000-8000-000000000001',1,'UC'||repeat('A',22),
   repeat('a',64),'youtube-news/00000000-0000-4000-8000-000000000001/test.mp4',
   1048576,repeat('b',64),repeat('c',64));
  RAISE EXCEPTION 'T079_AUTH_RPC_LEAK';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END
$auth$;
RESET ROLE;
SET ROLE service_role;
DO $ledger$
DECLARE
 a uuid:='00000000-0000-4000-8000-000000000001';
 b uuid:='00000000-0000-4000-8000-000000000002';
 ch text:='UC'||repeat('A',22);
 media_hash text:=repeat('a',64);
 approve text:=repeat('b',64);
 rights text:=repeat('c',64);
 r record;
 id_one uuid;
 id_two uuid;
 lid uuid:=gen_random_uuid();
 lid_two uuid:=gen_random_uuid();
 ok boolean;
 BEGIN
 SELECT * INTO r FROM public.jb_t079_video_reserve_internal(
  a,4,ch,media_hash,'youtube-news/'||a||'/news.mp4',1048576,approve,rights);
 IF NOT r.out_created OR r.out_state<>'RESERVED' THEN RAISE EXCEPTION 'T079_FIRST_RESERVATION'; END IF;
 id_one:=r.out_job_id;
 SELECT * INTO r FROM public.jb_t079_video_reserve_internal(
  a,4,ch,media_hash,'youtube-news/'||a||'/news.mp4',1048576,approve,rights);
 IF r.out_created OR r.out_job_id<>id_one THEN RAISE EXCEPTION 'T079_DUPLICATE_CREATED'; END IF;
 SELECT public.jb_t079_video_begin_internal(id_one,lid) INTO ok;
 IF NOT ok THEN RAISE EXCEPTION 'T079_FIRST_INITIATION_DENIED'; END IF;
 SELECT public.jb_t079_video_begin_internal(id_one,gen_random_uuid()) INTO ok;
 IF ok THEN RAISE EXCEPTION 'T079_SECOND_INITIATION_ALLOWED'; END IF;
 BEGIN
  PERFORM public.jb_t079_video_transition_internal(id_one,lid,'INITIATING','RESERVED');
  RAISE EXCEPTION 'T079_FORBIDDEN_BACK_TO_RESERVED';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM='T079_FORBIDDEN_BACK_TO_RESERVED' THEN RAISE; END IF;
 END;
 SELECT public.jb_t079_video_transition_internal(id_one,lid,'INITIATING','UNKNOWN') INTO ok;
 IF NOT ok THEN RAISE EXCEPTION 'T079_UNKNOWN_QUARANTINE_MISSING'; END IF;
 SELECT public.jb_t079_video_begin_internal(id_one,lid) INTO ok;
 IF ok THEN RAISE EXCEPTION 'T079_UNKNOWN_REINITIATED'; END IF;
 SELECT * INTO r FROM public.jb_t079_video_reserve_internal(
  a,4,ch,media_hash,'youtube-news/'||a||'/news.mp4',1048576,approve,rights);
 IF r.out_created OR r.out_job_id<>id_one OR r.out_state<>'UNKNOWN' THEN
  RAISE EXCEPTION 'T079_UNKNOWN_RESERVATION_REPLAY'; END IF;
 -- Independent synthetic second asset to test a valid PRIVATE lifecycle;
 -- simulated provider receipt, not a real Google video.
 SELECT * INTO r FROM public.jb_t079_video_reserve_internal(
  b,1,ch,repeat('f',64),'youtube-news/'||b||'/clip.mp4',1048576,approve,rights);
 id_two:=r.out_job_id;
 SELECT public.jb_t079_video_begin_internal(id_two,lid_two) INTO ok;
 IF NOT ok THEN RAISE EXCEPTION 'T079_SECOND_ASSET_CLAIM_FAILED'; END IF;
 SELECT public.jb_t079_video_transition_internal(id_two,lid_two,'INITIATING','SESSION_OPEN',
  repeat('x',45),'0123456789abcdef') INTO ok;
 IF NOT ok THEN RAISE EXCEPTION 'T079_SEALED_SESSION_TRANSITION_FAILED'; END IF;
 SELECT public.jb_t079_video_transition_internal(id_two,lid_two,'SESSION_OPEN','UPLOADING') INTO ok;
 IF NOT ok THEN RAISE EXCEPTION 'T079_UPLOAD_CLAIM_FAILED'; END IF;
 SELECT public.jb_t079_video_transition_internal(id_two,lid_two,'UPLOADING','RECEIPT_PENDING',
  NULL,NULL,'abcDEF123_-') INTO ok;
 IF NOT ok THEN RAISE EXCEPTION 'T079_RECEIPT_SAVE_FAILED'; END IF;
 SELECT public.jb_t079_video_transition_internal(id_two,lid_two,'RECEIPT_PENDING','PRIVATE_VERIFIED') INTO ok;
 IF NOT ok THEN RAISE EXCEPTION 'T079_PRIVATE_VERIFICATION_FAILED'; END IF;
 SELECT public.jb_t079_video_transition_internal(id_two,lid_two,'RECEIPT_PENDING','PRIVATE_VERIFIED') INTO ok;
 IF ok THEN RAISE EXCEPTION 'T079_DUPLICATE_TERMINAL_ALLOWED'; END IF;
 IF (SELECT count(*) FROM private.jb_t079_youtube_video_jobs)<>2 THEN
  RAISE EXCEPTION 'T079_EXPECTED_EXACTLY_TWO_JOBS'; END IF;
 IF (SELECT count(*) FROM private.jb_t079_youtube_video_jobs WHERE state='PRIVATE_VERIFIED'
  AND provider_video_id='abcDEF123_-' AND private_verified_at IS NOT NULL)<>1
 THEN RAISE EXCEPTION 'T079_PRIVATE_RECEIPT_MISSING'; END IF;
 RAISE NOTICE 'T079 isolated PG17: duplicate quarantine, unknown, state lifecycle, role isolation PASS';
END
$ledger$;
RESET ROLE;
-- Never test a real video, real OAuth, real Supabase URL or live source here.
