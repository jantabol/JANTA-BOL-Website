-- Phase 4 B3: extend the existing Phase-3 live_notifications table into the
-- single common notification delivery engine. Existing Live rows/flows remain valid.

alter table public.live_notifications
  add column if not exists domain text not null default 'live',
  add column if not exists lifecycle_state text not null default 'UNREAD',
  add column if not exists action_required boolean not null default false,
  add column if not exists resolved_at timestamptz,
  add column if not exists action_path text,
  add column if not exists dedupe_key text,
  add column if not exists delivery_state text not null default 'IN_APP_READY',
  add column if not exists delivery_attempts integer not null default 0,
  add column if not exists last_delivery_error_code text,
  add column if not exists next_retry_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.live_notifications
  drop constraint if exists live_notifications_lifecycle_state_check,
  add constraint live_notifications_lifecycle_state_check
    check (lifecycle_state in ('UNREAD','READ','ACTION_REQUIRED','RESOLVED')),
  drop constraint if exists live_notifications_delivery_state_check,
  add constraint live_notifications_delivery_state_check
    check (delivery_state in ('IN_APP_READY','EXTERNAL_PENDING','EXTERNAL_SENT','EXTERNAL_RETRY','EXTERNAL_FAILED')),
  drop constraint if exists live_notifications_delivery_attempts_check,
  add constraint live_notifications_delivery_attempts_check check (delivery_attempts >= 0),
  drop constraint if exists live_notifications_domain_check,
  add constraint live_notifications_domain_check
    check (domain in ('live','grievance','compliance','social','ads','security','team','system'));

create unique index if not exists live_notifications_recipient_dedupe_uq
  on public.live_notifications(recipient_user_id,dedupe_key)
  where dedupe_key is not null;

create index if not exists live_notifications_inbox_idx
  on public.live_notifications(recipient_user_id,lifecycle_state,created_at desc);

create index if not exists live_notifications_retry_idx
  on public.live_notifications(delivery_state,next_retry_at)
  where delivery_state in ('EXTERNAL_PENDING','EXTERNAL_RETRY');

update public.live_notifications
set lifecycle_state = case when read_at is null then 'UNREAD' else 'READ' end
where lifecycle_state = 'UNREAD' and read_at is not null;

comment on table public.live_notifications is
  'Canonical unified notification delivery engine. Historical Phase-3 Live notification home is preserved and extended for Phase-4 cross-domain delivery.';

create or replace function public.jb_notification_mark_read_internal(
  p_user_id uuid,
  p_notification_id bigint
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare v_changed boolean;
begin
  update public.live_notifications
     set read_at = coalesce(read_at, now()),
         lifecycle_state = case
           when lifecycle_state = 'RESOLVED' then 'RESOLVED'
           when action_required then 'ACTION_REQUIRED'
           else 'READ'
         end
   where id = p_notification_id
     and recipient_user_id = p_user_id;
  get diagnostics v_changed = row_count;
  return v_changed;
end;
$$;

revoke all on function public.jb_notification_mark_read_internal(uuid,bigint) from public, anon, authenticated;
grant execute on function public.jb_notification_mark_read_internal(uuid,bigint) to service_role;

create or replace function public.jb_notification_resolve_internal(
  p_user_id uuid,
  p_notification_id bigint
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare v_changed boolean;
begin
  update public.live_notifications
     set action_required = false,
         lifecycle_state = 'RESOLVED',
         resolved_at = coalesce(resolved_at, now()),
         read_at = coalesce(read_at, now())
   where id = p_notification_id
     and recipient_user_id = p_user_id;
  get diagnostics v_changed = row_count;
  return v_changed;
end;
$$;

revoke all on function public.jb_notification_resolve_internal(uuid,bigint) from public, anon, authenticated;
grant execute on function public.jb_notification_resolve_internal(uuid,bigint) to service_role;