\set ON_ERROR_STOP on
-- Synthetic AUTH context only for disposable PG17. No real users or JWT secrets.
create table auth.sessions (
 id uuid primary key,user_id uuid not null
);
insert into auth.sessions(id,user_id) values
('66666666-6666-4666-8666-666666666666','22222222-2222-2222-2222-222222222222'),
('77777777-7777-4777-8777-777777777777','33333333-3333-3333-3333-333333333333');
create function auth.jwt() returns jsonb language sql stable
as $$select jsonb_build_object(
  'session_id',coalesce(current_setting('b8.fixture_session_id',true),''),
  'role',coalesce(current_setting('b8.fixture_jwt_role',true),'')
)$$;
grant usage on schema auth to authenticated;
grant execute on function auth.jwt() to authenticated;
