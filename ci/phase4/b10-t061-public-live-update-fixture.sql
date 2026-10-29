\set ON_ERROR_STOP on
-- Disposable PG17 only. B9 fixture and migration loaded first.
-- Mirror EXISTING JANTA BOL public/live policy, no prod data.
CREATE TABLE public.live_sessions(
 id uuid PRIMARY KEY,
 article_id uuid NOT NULL REFERENCES public.articles(id),
 public_status text NOT NULL,
 session_status text NOT NULL,
 live_updates_public_visible boolean NOT NULL DEFAULT false
);
CREATE TABLE public.public_live_updates(
 contribution_id uuid PRIMARY KEY,
 session_id uuid NOT NULL,
 article_id uuid NOT NULL,
 public_text text
);
CREATE TABLE public.live_contributions (
  contribution_id uuid PRIMARY KEY, session_id uuid,
  public_visibility text NOT NULL DEFAULT 'PRIVATE'
);
ALTER TABLE public.live_contributions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.live_contributions FROM PUBLIC,anon,authenticated;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_live_updates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.live_sessions,public.public_live_updates FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.public_live_updates TO anon,authenticated;
CREATE POLICY public_live_updates_read ON public.public_live_updates
 FOR SELECT TO anon,authenticated
 USING (
  EXISTS(
   SELECT 1 FROM public.live_sessions s
   JOIN public.articles a ON a.id=s.article_id
   WHERE s.id=public_live_updates.session_id
     AND a.status='published'::public.article_status
     AND s.live_updates_public_visible=true
     AND (s.public_status IN ('LIVE','INTERRUPTED') OR s.session_status='ENDED')
  )
 );
INSERT INTO public.live_sessions(id,article_id,public_status,session_status,live_updates_public_visible)
VALUES
('10000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','LIVE','ACTIVE',true),
('10000000-0000-4000-8000-000000000002','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','INTERRUPTED','ACTIVE',true),
('10000000-0000-4000-8000-000000000003','cccccccc-cccc-4ccc-8ccc-cccccccccccc','ENDED','ENDED',true),
('10000000-0000-4000-8000-000000000004','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','LIVE','ACTIVE',false),
('10000000-0000-4000-8000-000000000005','dddddddd-dddd-4ddd-8ddd-dddddddddddd','LIVE','ACTIVE',true),
('10000000-0000-4000-8000-000000000006','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','LIVE','ACTIVE',true),
('10000000-0000-4000-8000-000000000007','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','OFF','ACTIVE',true),
('10000000-0000-4000-8000-000000000008','cccccccc-cccc-4ccc-8ccc-cccccccccccc','LIVE','ACTIVE',true);
INSERT INTO public.public_live_updates(contribution_id,session_id,article_id,public_text)
VALUES
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','VISIBLE A'),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','VISIBLE B'),
('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000003','cccccccc-cccc-4ccc-8ccc-cccccccccccc','VISIBLE C'),
('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000004','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','HIDDEN FLAG'),
('20000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000005','dddddddd-dddd-4ddd-8ddd-dddddddddddd','SENSITIVE_DRAFT'),
('20000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000006','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','SENSITIVE_UNPUBLISHED'),
('20000000-0000-4000-8000-000000000007','10000000-0000-4000-8000-000000000007','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','NOT LIVE OR ENDED'),
-- This old policy accidentally accepted a cross-session article ID. New guard must reject.
('20000000-0000-4000-8000-000000000008','10000000-0000-4000-8000-000000000008','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','WRONG SESSION ARTICLE');
BEGIN;
SET LOCAL ROLE anon;
DO $expected_failure$
DECLARE denied boolean:=false;
BEGIN
 BEGIN
  PERFORM count(*) FROM public.public_live_updates;
 EXCEPTION WHEN insufficient_privilege THEN denied:=true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'T061_EXPECTED_OLD_42501_NOT_REPRODUCED'; END IF;
END
$expected_failure$;
ROLLBACK;
\echo 'T061 reproduced original 42501 only on disposable PG17.'
