// G16/T070: strict production write-quiescence evidence gate. Preflight ONLY.
// Never invokes a writer pause/revoke, never schedules a snapshot, never grants final LOCK.
// Guard all write routes, not just SQL transaction connections or table timestamps.
const yes=x=>x===true;
export const WRITER_GATES=Object.freeze([
  'founder_exact_pause_scope_approved',
  'production_public_news_edits_paused',
  'reporter_mobile_offline_shadow_flush_verified',
  'all_admin_and_reporter_write_paths_fenced',
  'public_grievance_and_ad_submission_paths_fenced',
  'storage_put_delete_and_signed_uploads_fenced',
  'all_three_active_pg_cron_jobs_safely_quiesced',
  'edge_async_workers_and_scheduled_jobs_fenced',
  'external_webhooks_and_event_retry_queues_fenced',
  'live_reporter_updates_and_notifications_fenced',
  'db_active_writers_drained_without_lost_updates',
  'write_barrier_readback_observed',
  'single_correlation_receipt_signed_and_timeboxed',
  'storage_double_scan_and_original_byte_hash_complete',
  'db_snapshot_and_storage_media_receipt_bound',
  'complete_platform_config_version_inventory',
  'b2_immutable_encrypted_readback_confirmed',
  'rollback_readiness_checked_before_barrier',
  'reopen_services_exact_original_state_verified',
  'post_reopen_no_lost_local_edits_confirmed'
]);
export function evaluateG16(f={}) {
  const fields=Object.fromEntries(WRITER_GATES.map(x=>[x,yes(f[x])]));
  const holes=Object.keys(fields).filter(x=>!fields[x]);
  const identity=typeof f.project_ref==='string'&&f.project_ref==='vrffsnkycvjithwtiylt';
  const isolated= f.cricket_resources_touched===false&&f.no_paid_resources_created===true;
  return Object.freeze({
    state:identity&&isolated&&holes.length===0?'READY_FOR_INDEPENDENT_RUNTIME_AUDIT':'HOLD',
    absent:holes,project_verified:identity,cricket_isolated:isolated,
    production_pause_authorized_by_this_code:false,
    cross_component_restore_proven:false,
    final_t070_pass:false,final_t070_lock:false,can_start_t071:false,
    note:'Input values are assertions, NOT independently authenticated evidence. Real restoration logs and Founder release are separate.'
  });
}
