-- P4-T071 / C1: scoped public Article READ only (REVIEW / ISOLATED FIRST).
-- Founder safe-release rule: Do not apply to production until editorial
-- QA/test articles and user-visible claims are reviewed, isolated PG17
-- privacy/rollback checks PASS, and the corresponding frontend is deployable.
-- We do NOT loosen direct anon SELECT on public.articles and never leak
-- article_sources, payment, author IDs, source URL or internal notes.
-- If an owner deliberately unpublished/soft-deleted a story, deny it by default.
BEGIN;
CREATE OR REPLACE FUNCTION public.jb_c1_public_articles(
  p_article_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 20
) RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $T071$
  SELECT pg_catalog.jsonb_build_object(
    'items',
    COALESCE(pg_catalog.jsonb_agg(pg_catalog.to_jsonb(s)
      ORDER BY s.published_at DESC, s.id DESC), '[]'::jsonb)
  )
  FROM (
    SELECT
      a.id, a.slug, a.title, a.body, a.excerpt,
      a.cover_image_url, a.video_url, a.additional_media_urls,
      a.public_attribution, a.category, a.geography_level,
      a.district, a.location, a.reporter_name,
      a.status::text AS status,
      a.published_at, a.created_at, a.updated_at, a.version,
      a.news_date, a.news_time, a.breaking, a.top_story
    FROM public.articles AS a
    WHERE a.status::text = 'published'
      AND a.deleted_at IS NULL
      AND a.published_at IS NOT NULL
      AND (p_article_id IS NULL OR a.id = p_article_id)
    ORDER BY a.published_at DESC, a.id DESC
    LIMIT LEAST(GREATEST(COALESCE(p_limit,20),1),30)
  ) AS s;
$T071$;
REVOKE ALL ON FUNCTION public.jb_c1_public_articles(uuid,integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.jb_c1_public_articles(uuid,integer) FROM anon;
REVOKE ALL ON FUNCTION public.jb_c1_public_articles(uuid,integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.jb_c1_public_articles(uuid,integer) TO anon, authenticated;
COMMENT ON FUNCTION public.jb_c1_public_articles(uuid,integer) IS
  'T071 C1 read-only public published & nondeleted Article projection; internal and unpublished fields excluded';
COMMIT;
