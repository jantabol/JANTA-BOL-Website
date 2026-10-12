-- Disposable PostgreSQL only; NEVER connect to user Supabase.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;
CREATE SCHEMA private;
CREATE TABLE public.ad_campaigns(id uuid PRIMARY KEY);
CREATE TABLE public.ad_creatives(
 id uuid PRIMARY KEY,campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id),
 creative_type text NOT NULL,version integer NOT NULL,approved boolean NOT NULL);
CREATE TABLE private.b7_ad_media_receipts(
 asset_id uuid PRIMARY KEY,creative_id uuid,campaign_id uuid,creative_version integer,
 owner_user_id uuid,source_path text,source_sha256 text,approval_state text);
CREATE TABLE private.b7_ad_video_receipts(
 asset_id uuid PRIMARY KEY,creative_id uuid,campaign_id uuid,creative_version integer,
 owner_user_id uuid,original_path text,original_sha256 text,approval_state text);
INSERT INTO public.ad_campaigns VALUES('33333333-3333-4333-8333-333333333333');
INSERT INTO public.ad_creatives VALUES(
 '22222222-2222-4222-8222-222222222222',
 '33333333-3333-4333-8333-333333333333','image',4,false);
