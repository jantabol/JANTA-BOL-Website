// T070: read-only adjudication of TWO already restored component backups.
// This file NEVER opens ciphertext, executes backups, touches PROD or issues a Final LOCK.
const SHA_FAMILY = Object.freeze(['articles','article_versions','grievances','grievance_history','grievance_evidence','live_sessions','live_updates','ad_campaigns','ad_payments','auth_users','storage_metadata']);
export function assessExistingBackupReuse(input={}){
 const families=input.source_metadata_rowcounts_and_updated_since_db_start??[];
 const b=input.database_backup??{}, m=input.media_backup??{}, auth=input.auth_followup??{};
 const checks={
   correct_source:input.source_project==='vrffsnkycvjithwtiylt',
   two_real_run_ids:b.github_run_id==='40223103797'&&m.github_run_id==='40274621191'&&b.github_conclusion==='success'&&m.github_conclusion==='success',
   source_before_media:new Date(b.started_utc).getTime()<new Date(m.started_utc).getTime(),
   actual_db_component:b.source_to_clone_26_metrics==='EXACT_MATCH'&&b.source_to_clone_16_security_metrics==='EXACT_MATCH',
   actual_media_component:m.original_objects_verified===5&&m.grievance_original_objects_verified===2,
   all_family_rows_current:SHA_FAMILY.length===families.length&&SHA_FAMILY.every(name=>families.filter(f=>f.family===name&&Number.isInteger(f.count)&&f.count>=0&&Number.isInteger(f.changed)&&f.changed>=0).length===1),
   no_app_timestamp_drift:families.filter(f=>f.family!=='auth_users').every(f=>f.changed===0),
   auth_drift_outside_inter_run_gap:auth.users_updated_between_db_and_media_runs===0&&auth.user_signins_between_db_and_media_runs===0&&auth.auth_sessions_created_between_db_and_media_runs===0,
   auth_signin_churn_observed:families.some(f=>f.family==='auth_users'&&f.changed===1)&&auth.new_auth_sessions_since_db_start===1&&auth.users_with_both===1&&auth.users_updated_between_db_and_media_runs===0&&auth.auth_sessions_created_between_db_and_media_runs===0&&auth.users_updated_after_media_start===1&&auth.auth_sessions_created_after_media_start===1,
   no_silent_composition_claim:input.not_a_historical_snapshot_read===true&&input.all_writers_quiesced_from_db_to_media===false&&input.unchanged_timestamp_does_not_prove_unchanged_data===true,
   no_unperformed_joint_claim:input.archive_opened_on_same_clean_runner===false&&input.auth_edge_vercel_runtimes_restored===false&&input.original_5_file_bytes_verified_with_db_archive===false
 };
 const gaps=Object.keys(checks).filter(k=>checks[k]!==true);
 return Object.freeze({
  status:gaps.length===0?'SOURCE_TIMESTAMP_COMPATIBILITY_ONLY':'HOLD_UNVERIFIED_COMPONENTS',
  checks,gaps,
  reuse_candidate_for_privately_reviewed_drill:gaps.length===0,
  original_archives_combined_restore_proven:false,
  exact_single_trusted_recovery_point_proven:false,
  auth_session_equivalence_proven:false,
  real_e8_independent_audit_complete:false,
  t070_final_pass:false,t070_final_lock:false,can_start_t071:false,
  note:'A current source clock and metadata timestamps cannot attest exact past object versions, active writers, original binary parity in joint target, or restored Auth/Edge/Vercel behavior.'
 });
}
