\set ON_ERROR_STOP on
-- Synthetic B3 notification contract from read-only LIVE catalog; PG17 isolated only.
create table auth.users(id uuid primary key);
insert into auth.users(id) values
('11111111-1111-1111-1111-111111111111'),
('22222222-2222-2222-2222-222222222222'),
('33333333-3333-3333-3333-333333333333'),
('44444444-4444-4444-4444-444444444444'),
('55555555-5555-5555-5555-555555555555');
create table public.live_notifications(
 id bigint generated always as identity primary key,
 recipient_user_id uuid not null references auth.users(id) on delete cascade,
 notification_type text not null check(char_length(notification_type) between 1 and 80),
 priority text not null default 'NORMAL' check(priority in('NORMAL','HIGH','CRITICAL')),
 title text not null check(char_length(title) between 1 and 180),
 safe_message text not null default '',
 record_type text not null default 'live',
 record_id text,
 created_at timestamptz not null default now(),
 domain text not null default 'live' check(domain in
 ('live','grievance','compliance','social','ads','security','team','system')),
 lifecycle_state text not null default 'UNREAD' check(lifecycle_state in
 ('UNREAD','READ','ACTION_REQUIRED','RESOLVED')),
 action_required boolean not null default false,
 delivery_state text not null default 'IN_APP_READY' check(delivery_state in
 ('IN_APP_READY','EXTERNAL_PENDING','EXTERNAL_SENT','EXTERNAL_RETRY','EXTERNAL_FAILED')),
 dedupe_key text,metadata jsonb not null default '{}'::jsonb,
 consequence text not null default 'ROUTINE' check(consequence in('ROUTINE','ATTENTION','CRITICAL'))
);
create unique index live_notifications_recipient_dedupe_uq
on public.live_notifications(recipient_user_id,dedupe_key)
where dedupe_key is not null;
alter table public.live_notifications enable row level security;
revoke all on public.live_notifications from public,anon,authenticated;
grant select,insert,update,delete on public.live_notifications to service_role;
