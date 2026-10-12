-- JANTA BOL B7 ADS-015: PRIVATE DURABLE MEDIA COMMAND QUEUE.
-- REVIEW ONLY, NEVER DEPLOY TO LIVE BY RUNNING THIS FILE DIRECTLY.
-- Requires separately approved Owner/AAL2 gateway, private staging buckets,
-- isolated worker and the EXISTING canonical image/video receipt ledgers.
-- No public endpoint, no scheduled process, no service key in client bundle.
BEGIN;
DO $pre$
BEGIN
 IF to_regclass('public.ad_campaigns') IS NULL OR
    to_regclass('public.ad_creatives') IS NULL OR
    to_regclass('private.b7_ad_media_receipts') IS NULL OR
    to_regclass('private.b7_ad_video_receipts') IS NULL
 THEN RAISE EXCEPTION 'B7_QUEUE_CANONICAL_MEDIA_BASELINE_REQUIRED'; END IF;
 IF to_regclass('private.b7_ad_media_commands') IS NOT NULL
 THEN RAISE EXCEPTION 'B7_QUEUE_EXISTING_SCHEMA_REVIEW_REQUIRED'; END IF;
END $pre$;

CREATE TABLE private.b7_ad_media_commands(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 idempotency_key uuid NOT NULL,
 owner_user_id uuid NOT NULL,
 owner_session_id uuid NOT NULL,
 campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE RESTRICT,
 creative_id uuid NOT NULL REFERENCES public.ad_creatives(id) ON DELETE RESTRICT,
 creative_version integer NOT NULL CHECK(creative_version>=1),
 kind text NOT NULL CHECK(kind IN('image','video')),
 source_asset_id uuid NOT NULL,
 source_bucket text NOT NULL CHECK(source_bucket IN
  ('jb-ad-originals-private','jb-ad-video-originals-private')),
 source_path text NOT NULL,
 source_sha256 text NOT NULL CHECK(source_sha256 ~ '^[a-f0-9]{64}$'),
 source_bytes integer NOT NULL CHECK(source_bytes BETWEEN 16 AND 8388608),
 source_mime text NOT NULL CHECK(source_mime IN
  ('image/png','image/jpeg','image/webp','video/mp4')),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN
  ('pending','leased','retry','completed','failed')),
 lease_id uuid,
 lease_until timestamptz,
 attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count BETWEEN 0 AND 5),
 result_asset_id uuid,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT b7_media_command_idempotency UNIQUE(owner_user_id,idempotency_key),
 CONSTRAINT b7_media_command_lease_shape CHECK(
  (status='leased' AND lease_id IS NOT NULL AND lease_until IS NOT NULL)
  OR(status<>'leased' AND lease_id IS NULL AND lease_until IS NULL)
 ),
 CONSTRAINT b7_media_command_completed_shape CHECK(
  (status='completed' AND result_asset_id IS NOT NULL)
  OR(status<>'completed' AND result_asset_id IS NULL)
 )
);
CREATE INDEX b7_media_command_claim_idx
 ON private.b7_ad_media_commands(status,lease_until,created_at)
 WHERE status IN('pending','retry','leased');

CREATE TABLE private.b7_ad_media_command_failures(
 failure_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 command_id uuid NOT NULL REFERENCES private.b7_ad_media_commands(id)
  ON DELETE RESTRICT,
 lease_id uuid NOT NULL,
 error_code text NOT NULL CHECK(error_code ~ '^[A-Z0-9_]{1,85}$'),
 possible_asset_id uuid,
 recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE FUNCTION private.b7_ad_media_command_failure_immutable()
RETURNS trigger LANGUAGE plpgsql AS $locked$
BEGIN RAISE EXCEPTION 'B7_QUEUE_FAILURE_AUDIT_APPEND_ONLY'; END $locked$;
CREATE TRIGGER b7_media_command_failure_immutable
 BEFORE UPDATE OR DELETE ON private.b7_ad_media_command_failures
 FOR EACH ROW EXECUTE FUNCTION private.b7_ad_media_command_failure_immutable();

-- SQL owns canonical Creative record consistency and idempotency.
-- Owner identity/AAL2 MUST have been checked by the isolated gateway
-- before this service-only call. Never expose this to browser clients.
CREATE FUNCTION private.b7_media_queue_enqueue_server(p jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','private','public' AS $enqueue$
DECLARE v record; prior private.b7_ad_media_commands%ROWTYPE;
        cr record; newest integer; ext text; id uuid;
BEGIN
 IF p IS NULL OR jsonb_typeof(p)<>'object' OR length(p::text)>3600 OR
    p ? 'token' OR p ? 'bearer' OR p ? 'url' OR p ? 'file_bytes'
 THEN RAISE EXCEPTION 'B7_QUEUE_INVALID_COMMAND_ENVELOPE'; END IF;
 SELECT * INTO v FROM jsonb_to_record(p) AS x(
  idempotency_key uuid,owner_user_id uuid,owner_session_id uuid,
  campaign_id uuid,creative_id uuid,creative_version integer,kind text,
  source_asset_id uuid,source_bucket text,source_path text,source_sha256 text,
  source_bytes integer,source_mime text);
 IF v.idempotency_key IS NULL OR v.owner_user_id IS NULL OR
    v.owner_session_id IS NULL OR v.campaign_id IS NULL OR
    v.creative_id IS NULL OR v.creative_version IS NULL OR
    v.kind NOT IN('image','video') OR v.source_asset_id IS NULL OR
    v.source_sha256 !~ '^[a-f0-9]{64}$' OR
    v.source_bytes NOT BETWEEN 16 AND 8388608
 THEN RAISE EXCEPTION 'B7_QUEUE_INVALID_FIELDS'; END IF;
 IF v.kind='video' THEN
  IF v.source_bucket IS DISTINCT FROM 'jb-ad-video-originals-private' OR
     v.source_mime IS DISTINCT FROM 'video/mp4'
  THEN RAISE EXCEPTION 'B7_QUEUE_VIDEO_SOURCE_DENIED'; END IF;
  ext:='mp4';
 ELSE
  IF v.source_bucket IS DISTINCT FROM 'jb-ad-originals-private' OR
     v.source_mime NOT IN('image/png','image/jpeg','image/webp')
  THEN RAISE EXCEPTION 'B7_QUEUE_IMAGE_SOURCE_DENIED'; END IF;
  ext:=CASE v.source_mime WHEN 'image/png' THEN 'png'
   WHEN 'image/webp' THEN 'webp' ELSE
    CASE WHEN right(v.source_path,5)='.jpeg' THEN 'jpeg' ELSE 'jpg' END END;
 END IF;
 IF v.source_path IS DISTINCT FROM
    'staged/'||v.source_asset_id::text||'/'||v.source_sha256||'.'||ext
 THEN RAISE EXCEPTION 'B7_QUEUE_NOT_CANONICAL_PRIVATE_PATH'; END IF;
 PERFORM 1 FROM public.ad_campaigns WHERE id=v.campaign_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'B7_QUEUE_CAMPAIGN_MISSING'; END IF;
 SELECT id,campaign_id,creative_type,version,approved INTO cr
 FROM public.ad_creatives WHERE id=v.creative_id;
 SELECT max(version) INTO newest FROM public.ad_creatives
 WHERE campaign_id=v.campaign_id;
 IF NOT FOUND OR cr.id IS DISTINCT FROM v.creative_id OR
    cr.campaign_id IS DISTINCT FROM v.campaign_id OR
    cr.creative_type IS DISTINCT FROM v.kind OR
    cr.approved IS DISTINCT FROM false OR
    cr.version IS DISTINCT FROM v.creative_version OR
    newest IS DISTINCT FROM v.creative_version
 THEN RAISE EXCEPTION 'B7_QUEUE_DRAFT_STALE_OR_APPROVED'; END IF;
 SELECT * INTO prior FROM private.b7_ad_media_commands
 WHERE owner_user_id=v.owner_user_id AND idempotency_key=v.idempotency_key
 FOR UPDATE;
 IF FOUND THEN
  IF prior.owner_session_id IS DISTINCT FROM v.owner_session_id OR
     prior.campaign_id IS DISTINCT FROM v.campaign_id OR
     prior.creative_id IS DISTINCT FROM v.creative_id OR
     prior.creative_version IS DISTINCT FROM v.creative_version OR
     prior.kind IS DISTINCT FROM v.kind OR
     prior.source_asset_id IS DISTINCT FROM v.source_asset_id OR
     prior.source_bucket IS DISTINCT FROM v.source_bucket OR
     prior.source_path IS DISTINCT FROM v.source_path OR
     prior.source_sha256 IS DISTINCT FROM v.source_sha256 OR
     prior.source_bytes IS DISTINCT FROM v.source_bytes OR
     prior.source_mime IS DISTINCT FROM v.source_mime
  THEN RAISE EXCEPTION 'B7_QUEUE_IDEMPOTENCY_PAYLOAD_CONFLICT';END IF;
  RETURN prior.id;
 END IF;
 INSERT INTO private.b7_ad_media_commands(
 idempotency_key,owner_user_id,owner_session_id,campaign_id,
 creative_id,creative_version,kind,source_asset_id,source_bucket,
 source_path,source_sha256,source_bytes,source_mime)
 VALUES(v.idempotency_key,v.owner_user_id,v.owner_session_id,
  v.campaign_id,v.creative_id,v.creative_version,v.kind,
  v.source_asset_id,v.source_bucket,v.source_path,
  v.source_sha256,v.source_bytes,v.source_mime)
 RETURNING private.b7_ad_media_commands.id INTO id;
 RETURN id;
END $enqueue$;

CREATE FUNCTION private.b7_media_queue_read_server(p_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog','private' AS $read$
 SELECT to_jsonb(row) FROM private.b7_ad_media_commands row
 WHERE id=p_id
$read$;

-- SKIP LOCKED + a fresh lease every claim => no competing worker can
-- complete a reclaimed/retried job with an old lease id.
CREATE FUNCTION private.b7_media_queue_claim_server()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','private' AS $claim$
DECLARE target uuid; outrow private.b7_ad_media_commands%ROWTYPE;
BEGIN
 SELECT id INTO target FROM private.b7_ad_media_commands
 WHERE attempt_count<5 AND
  (status IN('pending','retry') OR
   (status='leased' AND lease_until<now()))
 ORDER BY created_at,id FOR UPDATE SKIP LOCKED LIMIT 1;
 IF target IS NULL THEN RETURN NULL; END IF;
 UPDATE private.b7_ad_media_commands SET
  status='leased',lease_id=gen_random_uuid(),
  lease_until=now()+interval '15 minutes',
  attempt_count=attempt_count+1,updated_at=now()
 WHERE id=target RETURNING * INTO outrow;
 RETURN to_jsonb(outrow);
END $claim$;

CREATE FUNCTION private.b7_media_queue_complete_server(
 p_id uuid,p_lease uuid,p_asset uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','private' AS $complete$
DECLARE job private.b7_ad_media_commands%ROWTYPE; proven boolean;
BEGIN
 IF p_id IS NULL OR p_lease IS NULL OR p_asset IS NULL THEN RETURN false;END IF;
 SELECT * INTO job FROM private.b7_ad_media_commands
 WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR job.status<>'leased' OR job.lease_id<>p_lease OR
    job.lease_until<=now() THEN RETURN false;END IF;
 IF job.kind='image' THEN
  SELECT EXISTS(SELECT 1 FROM private.b7_ad_media_receipts r
   WHERE r.asset_id=p_asset AND r.creative_id=job.creative_id AND
    r.campaign_id=job.campaign_id AND r.creative_version=job.creative_version
    AND r.owner_user_id=job.owner_user_id AND
    r.source_path=job.source_path AND
    r.source_sha256=job.source_sha256 AND
    r.approval_state='private_quarantined') INTO proven;
 ELSE
  SELECT EXISTS(SELECT 1 FROM private.b7_ad_video_receipts r
   WHERE r.asset_id=p_asset AND r.creative_id=job.creative_id AND
    r.campaign_id=job.campaign_id AND r.creative_version=job.creative_version
    AND r.owner_user_id=job.owner_user_id AND
    r.original_path=job.source_path AND
    r.original_sha256=job.source_sha256 AND
    r.approval_state='private_quarantined') INTO proven;
 END IF;
 IF NOT proven THEN RETURN false; END IF;
 UPDATE private.b7_ad_media_commands SET
 status='completed',result_asset_id=p_asset,
 lease_id=NULL,lease_until=NULL,updated_at=now() WHERE id=p_id;
 RETURN true;
END $complete$;

CREATE FUNCTION private.b7_media_queue_reconcile_server(
 p_id uuid,p_lease uuid,p_error text,p_asset uuid DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','private' AS $reconcile$
DECLARE job private.b7_ad_media_commands%ROWTYPE;
BEGIN
 IF p_id IS NULL OR p_lease IS NULL OR
    coalesce(p_error,'') !~ '^[A-Z0-9_]{1,85}$'
 THEN RETURN false; END IF;
 SELECT * INTO job FROM private.b7_ad_media_commands
 WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR job.status<>'leased' OR job.lease_id<>p_lease
 THEN RETURN false; END IF;
 INSERT INTO private.b7_ad_media_command_failures(
  command_id,lease_id,error_code,possible_asset_id)
 VALUES(p_id,p_lease,p_error,p_asset);
 UPDATE private.b7_ad_media_commands
 SET status=CASE WHEN attempt_count>=5 THEN 'failed' ELSE 'retry' END,
  lease_id=NULL,lease_until=NULL,updated_at=now() WHERE id=p_id;
 RETURN true;
END $reconcile$;

ALTER TABLE private.b7_ad_media_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.b7_ad_media_command_failures ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.b7_ad_media_commands
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON private.b7_ad_media_command_failures
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON SEQUENCE private.b7_ad_media_command_failures_failure_id_seq
 FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION private.b7_ad_media_command_failure_immutable()
 FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION private.b7_media_queue_enqueue_server(jsonb)
 FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION private.b7_media_queue_read_server(uuid)
 FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION private.b7_media_queue_claim_server()
 FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION private.b7_media_queue_complete_server(uuid,uuid,uuid)
 FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION private.b7_media_queue_reconcile_server(uuid,uuid,text,uuid)
 FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA private TO service_role;
GRANT EXECUTE ON FUNCTION private.b7_media_queue_enqueue_server(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION private.b7_media_queue_read_server(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION private.b7_media_queue_claim_server() TO service_role;
GRANT EXECUTE ON FUNCTION private.b7_media_queue_complete_server(uuid,uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION private.b7_media_queue_reconcile_server(uuid,uuid,text,uuid) TO service_role;
COMMIT;
