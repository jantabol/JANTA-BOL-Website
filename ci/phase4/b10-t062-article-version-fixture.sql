\set ON_ERROR_STOP on
-- Synthetic regression AFTER B9 PG17 fixture/migration, not LIVE and no JWT.
CREATE OR REPLACE FUNCTION private.current_app_role() RETURNS public.app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$ SELECT ur.role FROM public.user_roles ur
 WHERE ur.user_id=auth.uid()
 AND (ur.role='owner' OR EXISTS (SELECT 1 FROM public.team_accounts t WHERE t.user_id=ur.user_id AND t.status='active'))
 LIMIT 1 $$;
CREATE OR REPLACE FUNCTION private.current_owner_aal2() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$ SELECT private.current_app_role()='owner'
 AND current_setting('b9.test_aal',true)='aal2'
 AND current_setting('b10.session_active',true)='on' $$;
CREATE TABLE public.article_versions(
 article_id uuid NOT NULL REFERENCES public.articles(id),
 article_version bigint NOT NULL,
 snapshot jsonb NOT NULL,
 PRIMARY KEY(article_id,article_version)
);
INSERT INTO public.article_versions
VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',1,'{"test":"private-history-v1"}'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',1,'{"test":"private-history-v2"}');
ALTER TABLE public.article_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.article_versions FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.article_versions TO authenticated;
CREATE POLICY owner_read_versions ON public.article_versions FOR SELECT TO authenticated
USING (private.current_app_role()='owner'::public.app_role);
CREATE POLICY owner_insert_versions ON public.article_versions FOR INSERT TO authenticated
WITH CHECK (private.current_app_role()='owner'::public.app_role);
CREATE OR REPLACE FUNCTION private.capture_article_history() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$ BEGIN RETURN NULL; END; $$;
CREATE TRIGGER trg_capture_article_history AFTER INSERT OR UPDATE ON public.articles
FOR EACH ROW EXECUTE FUNCTION private.capture_article_history();
-- Demonstrate original vulnerability: an Owner user ID and aal2 with NO active session
-- can see Article snapshots under old policy.
BEGIN;
SELECT set_config('b9.test_uid','11111111-1111-1111-1111-111111111111',true),
set_config('b9.test_aal','aal2',true),set_config('b10.session_active','off',true);
SET LOCAL ROLE authenticated;
DO $old_owner$
BEGIN
 IF private.current_owner_aal2() THEN RAISE EXCEPTION 'T062_FIXTURE_NO_SESSION_AAL2_WRONGLY_ACTIVE';END IF;
 IF (SELECT count(*) FROM public.article_versions)<>2 THEN
   RAISE EXCEPTION 'T062_ORIGINAL_HISTORY_GAP_NOT_REPRODUCED'; END IF;
END $old_owner$;
ROLLBACK;
\echo 'T062 original AAL2-without-active-session history access reproduced in disposable PostgreSQL17.'
