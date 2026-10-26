// JANTA BOL T070 G17 — real source maintenance go/no-go evaluator.
// No DB/network connections, no pause/disable/revoke actions.
// Caller inputs are untrusted until externally validated; this module cannot release production.
const project='vrffsnkycvjithwtiylt';
export const REQUIRED_PROOFS=Object.freeze([
'public_app_write_entrypoints_fenced',
'anon_direct_write_grants_fenced',
'authenticated_direct_write_grants_fenced',
'security_definer_rpc_mutations_fenced',
'service_role_and_background_writers_fenced',
'all_active_cron_jobs_quiesced_and_retry_safe',
'deployed_edge_functions_and_jwt_false_callbacks_fenced',
'private_and_public_storage_mutations_fenced',
'webhooks_and_external_apis_paused',
'unsynced_android_and_reporter_edits_preserved',
'live_grievance_ad_and_editorial_writes_fenced',
'db_inflight_transactions_drained',
'source_snapshot_and_media_byte_manifest_bound',
'original_auth_edge_vercel_config_inventory_sealed',
'non_destructive_rollback_drilled_before_pause',
'original_service_states_reopen_verified',
'post_restore_independent_rbac_aal2_rls_review',
'founder_maintenance_window_confirmation_recorded'
]);
export function evaluateG17(observed={},proof={}) {
 const missing=REQUIRED_PROOFS.filter(k=>proof[k]!==true);
 const identity=observed.project_ref===project;
 const counters=[
 ['ACTIVE_CRON',observed.active_pg_cron_jobs,3],
 ['PUBLIC_TRIGGERS',observed.enabled_public_user_triggers,48],
 ['DIRECT_ANON_TABLES',observed.direct_anon_write_grants_tables,5],
 ['DIRECT_AUTH_TABLES',observed.direct_authenticated_write_grants_tables,15],
 ['PUBLIC_SECURITY_DEFINER_FUNCTIONS',observed.public_security_definer_functions,215],
 ['EDGE_FUNCTIONS',observed.edge_functions_live,13],
 ['EDGE_JWT_FALSE',observed.edge_functions_verify_jwt_false,5]
 ];
 const badObserved=counters.filter(([k,v,min])=>!Number.isInteger(v)||v<min).map(x=>x[0]);
 const decision=!identity||badObserved.length||missing.length?'HOLD':'INDEPENDENT_REVIEW_REQUIRED';
 return Object.freeze({
  checkpoint:'P4-T070-G17',project_ref:project,
  status:decision,
  observed_live_writer_surfaces:counters.length,
  missing,
  invalid_or_stale_source_observations:badObserved,
  source_project_matches:identity,
  maintenance_active:false,
  permission_to_apply_maintenance_from_this_code:false,
  real_joint_restore_proven:false,
  t070_final_pass:false,t070_final_lock:false,can_start_t071:false,
  note:'Even all asserted booleans cannot independently prove real writer isolation or authorize production mutation.'
 });
}
