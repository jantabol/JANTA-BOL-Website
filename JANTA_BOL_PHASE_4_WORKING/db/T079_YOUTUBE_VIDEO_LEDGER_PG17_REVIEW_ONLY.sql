-- P4-T079 / REVIEW_ONLY / NOT A PRODUCTION MIGRATION.
-- This SQL is run ONLY inside disposable isolated PG17 CI.
-- No Supabase production DDL authorization; T078 E8 remains HOLD.
-- The browser, authenticated and anon roles receive zero privileges here.
BEGIN;
CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE private.jb_t079_youtube_video_jobs (
 job_id uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
 article_id uuid NOT NULL,
 article_version bigint NOT NULL CHECK (article_version > 0),
 channel_id text NOT NULL CHECK (channel_id ~ '^UC[A-Za-z0-9_-]{22}$'),
 media_sha256 text NOT NULL CHECK (media_sha256 ~ '^[a-f0-9]{64}$'),
 source_bucket text NOT NULL DEFAULT 'private-editorial' CHECK (source_bucket = 'private-editorial'),
 source_path text NOT NULL CHECK (source_path ~ '^youtube-news/[0-9a-f-]{36}/[A-Za-z0-9_-]+[.]mp4$'),
 media_size_bytes integer NOT NULL CHECK (media_size_bytes BETWEEN 1 AND 52428800),
 founder_approval_hash text NOT NULL CHECK (founder_approval_hash ~ '^[a-f0-9]{64}$'),
 rights_proof_hash text NOT NULL CHECK (rights_proof_hash ~ '^[a-f0-9]{64}$'),
 state text NOT NULL DEFAULT 'RESERVED' CHECK (state IN
  ('RESERVED','INITIATING','SESSION_OPEN','UPLOADING','UNKNOWN',
   'RECEIPT_PENDING','PRIVATE_VERIFIED','FAILED_REVIEW','CANCELLED_REVIEW')),
 attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 1),
 lease_id uuid,
 provider_session_ciphertext text,
 provider_session_iv_b64 text,
 provider_video_id text UNIQUE CHECK (
  provider_video_id IS NULL OR provider_video_id ~ '^[A-Za-z0-9_-]{11}$'),
 private_verified_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT jb_t079_unique_video_intent UNIQUE (article_id,article_version,channel_id,media_sha256),
 CONSTRAINT jb_t079_sealed_session_pair CHECK
   ((provider_session_ciphertext IS NULL) = (provider_session_iv_b64 IS NULL)),
 CONSTRAINT jb_t079_private_receipt CHECK (
   (state = 'PRIVATE_VERIFIED' AND provider_video_id IS NOT NULL AND private_verified_at IS NOT NULL)
   OR (state <> 'PRIVATE_VERIFIED' AND private_verified_at IS NULL))
);
ALTER TABLE private.jb_t079_youtube_video_jobs ENABLE ROW LEVEL SECURITY;
-- Explicit local PG17 service_role-only policy, no need to pretend that this
-- disposable role has production BYPASSRLS. anon/authenticated have no policy.
CREATE POLICY jb_t079_service_role_only ON private.jb_t079_youtube_video_jobs
 FOR ALL TO service_role USING (true) WITH CHECK (true);
REVOKE ALL ON TABLE private.jb_t079_youtube_video_jobs FROM PUBLIC;
-- Preserve existing private-schema privileges in a future production review:
-- never revoke schema-wide legacy grants to install a new isolated journal.
GRANT USAGE ON SCHEMA private TO service_role;
GRANT SELECT, INSERT, UPDATE ON private.jb_t079_youtube_video_jobs TO service_role;
-- SECURITY INVOKER: caller must really be service_role; no RLS bypassing definer.
CREATE FUNCTION public.jb_t079_video_reserve_internal (
 p_article_id uuid, p_article_version bigint, p_channel_id text,
 p_media_sha256 text, p_source_path text, p_media_size_bytes integer,
 p_founder_approval_hash text, p_rights_proof_hash text
)
RETURNS TABLE (out_job_id uuid, out_state text, out_created boolean)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $fn$
DECLARE v_id uuid; v_state text;
BEGIN
 IF p_article_id IS NULL OR p_article_version < 1
  OR p_channel_id !~ '^UC[A-Za-z0-9_-]{22}$'
  OR p_media_sha256 !~ '^[a-f0-9]{64}$'
  OR p_source_path !~ ('^youtube-news/'||p_article_id::text||'/[A-Za-z0-9_-]+[.]mp4$')
  OR p_media_size_bytes NOT BETWEEN 1 AND 52428800
  OR p_founder_approval_hash !~ '^[a-f0-9]{64}$'
  OR p_rights_proof_hash !~ '^[a-f0-9]{64}$'
 THEN RAISE EXCEPTION 'T079_RESERVATION_INVALID'; END IF;
 INSERT INTO private.jb_t079_youtube_video_jobs (
  article_id, article_version, channel_id, media_sha256, source_path,
  media_size_bytes, founder_approval_hash, rights_proof_hash
 ) VALUES (p_article_id,p_article_version,p_channel_id,p_media_sha256,
   p_source_path,p_media_size_bytes,p_founder_approval_hash,p_rights_proof_hash)
 ON CONFLICT ON CONSTRAINT jb_t079_unique_video_intent DO NOTHING
 RETURNING job_id,state INTO v_id,v_state;
 IF v_id IS NOT NULL THEN
  RETURN QUERY SELECT v_id,v_state,true; RETURN;
 END IF;
 SELECT j.job_id,j.state INTO v_id,v_state
 FROM private.jb_t079_youtube_video_jobs j
 WHERE j.article_id=p_article_id AND j.article_version=p_article_version
  AND j.channel_id=p_channel_id AND j.media_sha256=p_media_sha256;
 IF v_id IS NULL THEN RAISE EXCEPTION 'T079_RESERVE_CONCURRENT_UNKNOWN'; END IF;
 RETURN QUERY SELECT v_id,v_state,false;
END
$fn$;
CREATE FUNCTION public.jb_t079_video_begin_internal(p_job_id uuid,p_lease_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $fn$
DECLARE v_id uuid;
BEGIN
 IF p_job_id IS NULL OR p_lease_id IS NULL THEN
  RAISE EXCEPTION 'T079_LEASE_REQUIRED';
 END IF;
 -- One and ONLY one initiation even if the network dies during videos.insert.
 -- A stale initiated/UNKNOWN job can never become fresh RESERVED automatically.
 UPDATE private.jb_t079_youtube_video_jobs
 SET state='INITIATING', attempt_count=1, lease_id=p_lease_id,updated_at=now()
 WHERE job_id=p_job_id AND state='RESERVED' AND attempt_count=0
  AND lease_id IS NULL AND provider_session_ciphertext IS NULL
 RETURNING job_id INTO v_id;
 RETURN v_id IS NOT NULL;
END
$fn$;
CREATE FUNCTION public.jb_t079_video_transition_internal(
 p_job_id uuid,p_lease_id uuid,p_from text,p_to text,
 p_session_ciphertext text DEFAULT NULL,p_session_iv_b64 text DEFAULT NULL,
 p_video_id text DEFAULT NULL
)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $fn$
DECLARE v_id uuid;
BEGIN
 IF p_job_id IS NULL OR p_lease_id IS NULL OR p_from IS NULL OR p_to IS NULL
 THEN RAISE EXCEPTION 'T079_TRANSITION_INVALID'; END IF;
 IF NOT (
  (p_from='INITIATING' AND p_to IN ('SESSION_OPEN','UNKNOWN')) OR
  (p_from='SESSION_OPEN' AND p_to IN ('UPLOADING','UNKNOWN','RECEIPT_PENDING')) OR
  (p_from='UPLOADING' AND p_to IN ('SESSION_OPEN','UNKNOWN','RECEIPT_PENDING')) OR
  (p_from='UNKNOWN' AND p_to='RECEIPT_PENDING') OR
  (p_from='RECEIPT_PENDING' AND p_to='PRIVATE_VERIFIED')
 ) THEN RAISE EXCEPTION 'T079_STATE_EDGE_DENIED'; END IF;
 IF p_to='SESSION_OPEN' AND (
  p_session_ciphertext IS NULL OR length(p_session_ciphertext)<20
  OR p_session_iv_b64 IS NULL OR length(p_session_iv_b64)<12)
 THEN RAISE EXCEPTION 'T079_SEALED_SESSION_REQUIRED'; END IF;
 IF p_to='RECEIPT_PENDING' AND
  (p_video_id IS NULL OR p_video_id !~ '^[A-Za-z0-9_-]{11}$')
 THEN RAISE EXCEPTION 'T079_GOOGLE_VIDEO_RECEIPT_REQUIRED'; END IF;
 UPDATE private.jb_t079_youtube_video_jobs
 SET state=p_to,
  provider_session_ciphertext=CASE WHEN p_to='SESSION_OPEN'
    THEN p_session_ciphertext ELSE provider_session_ciphertext END,
  provider_session_iv_b64=CASE WHEN p_to='SESSION_OPEN'
    THEN p_session_iv_b64 ELSE provider_session_iv_b64 END,
  provider_video_id=CASE WHEN p_to='RECEIPT_PENDING' THEN p_video_id ELSE provider_video_id END,
  private_verified_at=CASE WHEN p_to='PRIVATE_VERIFIED' THEN now() ELSE private_verified_at END,
  updated_at=now()
 WHERE job_id=p_job_id AND lease_id=p_lease_id AND state=p_from AND attempt_count=1
  AND (p_to<>'PRIVATE_VERIFIED' OR provider_video_id IS NOT NULL)
  AND (p_to<>'SESSION_OPEN' OR provider_session_ciphertext IS NULL OR
       (provider_session_ciphertext=p_session_ciphertext AND provider_session_iv_b64=p_session_iv_b64))
  AND (p_to<>'RECEIPT_PENDING' OR provider_video_id IS NULL OR provider_video_id=p_video_id)
 RETURNING job_id INTO v_id;
 RETURN v_id IS NOT NULL;
END
$fn$;
-- Under PostgreSQL all function definitions gain PUBLIC EXECUTE by default.
-- Explicit transaction-scoped removal makes only service_role callable.
REVOKE ALL ON FUNCTION public.jb_t079_video_reserve_internal(uuid,bigint,text,text,text,integer,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.jb_t079_video_begin_internal(uuid,uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.jb_t079_video_transition_internal(uuid,uuid,text,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.jb_t079_video_reserve_internal(uuid,bigint,text,text,text,integer,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.jb_t079_video_begin_internal(uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.jb_t079_video_transition_internal(uuid,uuid,text,text,text,text,text) TO service_role;
COMMIT;
