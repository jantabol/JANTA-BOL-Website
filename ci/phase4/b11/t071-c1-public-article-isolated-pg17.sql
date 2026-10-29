\set ON_ERROR_STOP on
-- Ephemeral PG17 fixture ONLY: no real articles, credentials, or Supabase host.
BEGIN;
DO $guard$
BEGIN
 IF current_database() <> 'jb_t071_c1_ephemeral' THEN
   RAISE EXCEPTION 'C1_LIVE_DB_REFUSED';
 END IF;
END $guard$;
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE TABLE public.articles (
 id uuid primary key, slug text NOT NULL, title text NOT NULL,
 body text NOT NULL, excerpt text, cover_image_url text, video_url text,
 additional_media_urls jsonb NOT NULL default '[]', public_attribution text NOT NULL default '',
 category text, geography_level text, district text, location text,
 reporter_name text, source_name text, source_url text,
 status text NOT NULL, published_at timestamptz,
 created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 version bigint NOT NULL, news_date date, news_time time without time zone,
 breaking boolean NOT NULL default false, top_story boolean NOT NULL default false,
 deleted_at timestamptz, created_by uuid, updated_by uuid
);
REVOKE ALL ON public.articles FROM PUBLIC, anon, authenticated;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY public_can_read_published_articles ON public.articles FOR SELECT TO anon
 USING(status='published');
INSERT INTO public.articles (id,slug,title,body,excerpt,source_name,source_url,status,published_at,created_at,updated_at,version,deleted_at)
VALUES
 ('00000000-0000-4000-8000-000000000001','public-valid','Public Real Article','THE FULL PUBLIC ARTICLE BODY','Verified public excerpt','PRIVATE SOURCE NAME','PRIVATE SOURCE URL','published','2026-10-27T12:00:00Z','2026-10-27T12:00:00Z','2026-10-27T12:00:00Z',1,NULL),
 ('00000000-0000-4000-8000-000000000002','draft-private','Draft must stay hidden','TOP SECRET DRAFT BODY','SECRET EXCERPT','PRIVATE SOURCE NAME','PRIVATE SOURCE URL','draft',NULL,'2026-10-27T12:00:00Z','2026-10-27T12:00:00Z',1,NULL),
 ('00000000-0000-4000-8000-000000000003','deleted-published','Soft-deleted published','SOFT DELETED BODY','PRIVATE','PRIVATE','PRIVATE','published','2026-10-27T12:00:00Z','2026-10-27T12:00:00Z','2026-10-27T12:00:00Z',1,'2026-10-27T12:01:00Z'),
 ('00000000-0000-4000-8000-000000000004','missing-timestamp','Unverified published timestamp','UNVERIFIED BODY','PRIVATE','PRIVATE','PRIVATE','published',NULL,'2026-10-27T12:00:00Z','2026-10-27T12:00:00Z',1,NULL);
COMMIT;
\echo T071_C1_SYNTHETIC_RLS_FIXTURE=READY
