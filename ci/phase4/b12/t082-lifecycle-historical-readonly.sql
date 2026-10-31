-- P4-T082 original historical article audit chain: READ ONLY.
-- Date verified: 2026-10-31; no credential/token/user/email/article body selected.
-- Execute only via Founder-authorized read-only JANTA BOL Supabase SQL.
-- IMPORTANT: This is HISTORICAL evidence, NOT a live October UI action.
WITH events AS (
  SELECT record_id, created_at, metadata->>'from_status' AS from_status,
    metadata->>'to_status' AS to_status,
    (metadata->>'from_version')::int AS from_v,
    (metadata->>'to_version')::int AS to_v
  FROM public.audit_logs
  WHERE record_type='article' AND action='article_update'
    AND record_id='df97df06-a246-4e4e-ac5d-1f965fa6b381'
), ordered AS (
  SELECT *, lag(to_v) OVER (ORDER BY to_v) AS previous_v,
            lag(to_status) OVER (ORDER BY to_v) AS previous_status
  FROM events
), matched AS (
  SELECT e.*,v.article_version AS snapshot_version,
    v.snapshot->>'status' AS snapshot_status,
    v.snapshot->>'id' AS snapshot_article_id,
    v.reason AS snapshot_reason
  FROM ordered e LEFT JOIN public.article_versions v
    ON v.article_id='df97df06-a246-4e4e-ac5d-1f965fa6b381'::uuid
    AND v.article_version=e.from_v
)
SELECT count(*)::int AS historical_update_events,
  min(from_v) AS first_prior_version,
  max(to_v) AS last_new_version,
  count(*) FILTER (WHERE to_v <> from_v+1)::int AS version_gaps,
  count(*) FILTER (WHERE previous_v IS NOT NULL AND previous_v <> from_v)::int AS chain_version_gaps,
  count(*) FILTER (WHERE previous_status IS NOT NULL AND previous_status <> from_status)::int AS chain_status_breaks,
  count(*) FILTER (WHERE from_status <> 'published' AND to_status = 'published')::int AS enters_published,
  count(*) FILTER (WHERE from_status = 'published' AND to_status <> 'published')::int AS exits_published,
  count(*) FILTER (WHERE from_status = 'published' AND to_status = 'published')::int AS published_corrections,
  count(*) FILTER (WHERE snapshot_version IS NULL)::int AS snapshot_missing,
  count(*) FILTER (WHERE snapshot_status IS DISTINCT FROM from_status)::int AS snapshot_status_mismatch,
  count(*) FILTER (WHERE snapshot_article_id IS DISTINCT FROM record_id)::int AS snapshot_uuid_mismatch,
  count(*) FILTER (WHERE snapshot_reason IS DISTINCT FROM 'pre-update snapshot')::int AS snapshot_reason_mismatch,
  max(created_at) AS last_historical_event_at
FROM matched;
