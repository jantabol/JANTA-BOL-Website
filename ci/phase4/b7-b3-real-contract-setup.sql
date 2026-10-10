\set ON_ERROR_STOP on
-- An ADDITIONAL disposable compatibility fixture for P4-T041.
-- This job loads the existing canonical B3 migrations verbatim from
-- CODEX_CURRENT_SUPABASE/migrations/. Do not reproduce/reimplement
-- jb_notification_emit_internal here. No LIVE Supabase writes.
alter table public.live_notifications
 add column if not exists read_at timestamptz,
 add column if not exists lifecycle_state text not null default 'UNREAD',
 add column if not exists resolved_at timestamptz,
 add column if not exists delivery_attempts integer not null default 0,
 add column if not exists next_retry_at timestamptz,
 add column if not exists last_delivery_error_code text;

alter table public.record_retention_policies
 add column if not exists notes text,
 add column if not exists updated_at timestamptz not null default now();

-- The B3 migration adds consequence. Historical schema has action-required
-- but this synthetic table was intentionally smaller. Complete ONLY the
-- columns used by production's real B3 function, keeping one table.
alter table public.live_notifications
 add constraint b7_b3_action_type check
   (lifecycle_state in ('UNREAD','READ','ACTION_REQUIRED','RESOLVED'));
create index b7_b3_recipient_dedupe_partial
 on public.live_notifications(recipient_user_id,dedupe_key)
 where dedupe_key is not null;

-- The existing Phase4 B3 DDL will create notification_delivery_history
-- and notification_history_v1 policy. Those two original homes are
-- dependencies of real jb_notification_emit_internal.
