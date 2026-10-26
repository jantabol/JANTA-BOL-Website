// JANTA BOL P4-T070: documentary decision gate; not a restore or an approval action.
// No credentials, user data, private media paths or automatic production operations.
const EXPECTED_PROJECT = 'vrffsnkycvjithwtiylt';
const SHA = /^[a-f0-9]{64}$/;
const safeRun = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{6,100}$/.test(value);
const presentDigest = value => typeof value === 'string' && SHA.test(value);
const exact = (value, expected) => value === expected;

/** Fail-closed report. All claims must be independently corroborated; this code does not do so. */
export function assessT070FinalE8(e = {}) {
  const checks = [];
  const gate = (code, ok, scope) => checks.push({ code, result: ok ? 'EVIDENCE_ASSERTED' : 'HOLD', scope });
  const db = e.database ?? {}, storage = e.storage ?? {}, platform = e.platform ?? {};
  const consistency = e.consistency ?? {}, proof = e.proof ?? {};

  gate('PROJECT_ISOLATION', exact(e.project, EXPECTED_PROJECT) && exact(e.cricket_resources_touched, false), 'JANTA_BOL_ONLY');
  gate('DATABASE_REAL_RECOVERY',
    exact(db.real_isolated_pg17_restore, true) && exact(db.private_b2_ciphertext_roundtrip, true) &&
    exact(db.source_clone_26_metrics, 'EXACT_MATCH') && exact(db.source_clone_16_security_metrics, 'EXACT_MATCH') &&
    exact(db.public_tables, 100) && exact(db.public_rls_tables, 100) && exact(db.app_storage_policies, 81) &&
    safeRun(db.workflow_run_id), 'DATABASE_ONLY');
  gate('ORIGINAL_STORAGE_ALL_OBJECT_BYTES',
    exact(storage.source_objects, 5) && exact(storage.recovered_objects, 5) &&
    exact(storage.byte_hash_verified_objects, 5) && exact(storage.source_grievance_objects, 2) &&
    exact(storage.recovered_grievance_objects, 2) && exact(storage.independent_original_source_hash_proof, true) &&
    exact(storage.disposable_destination, true) && exact(storage.original_paths_preserved, true), 'STORAGE_BYTES');
  gate('CROSS_COMPONENT_RESTORE_POINT',
    presentDigest(consistency.source_manifest_sha256) &&
    exact(consistency.source_manifest_sha256, consistency.restored_manifest_sha256) &&
    exact(consistency.database_media_bound_to_same_trusted_point, true) &&
    exact(consistency.source_to_restore_identity_verified, true), 'ONE_TRUSTED_CHECKPOINT');
  gate('AUTH_AND_PERMISSIONS',
    exact(platform.auth_service_restored_to_disposable, true) &&
    exact(platform.founder_permission_negative_tests, true) &&
    exact(platform.public_anon_rls_negative_tests, true) &&
    exact(platform.runtime_auth_sessions_recovery_reviewed, true) &&
    exact(platform.storage_private_access_negative_tests, true), 'ACTUAL_AUTH_RUNTIME');
  gate('PLATFORM_CONFIG_RESTORED',
    presentDigest(platform.source_config_sha256) &&
    exact(platform.source_config_sha256, platform.restored_config_sha256) &&
    exact(platform.edge_function_versions_verified, true) &&
    exact(platform.vercel_runtime_config_verified, true) &&
    exact(platform.buckets_and_policies_restored, true), 'ACTUAL_PLATFORM_CONFIG');
  gate('IDENTITY_RELATIONSHIPS',
    exact(proof.article_ids_master_urls, true) &&
    exact(proof.grievance_ids_history, true) &&
    exact(proof.live_session_relationships, true) &&
    exact(proof.ads_campaign_payment_relationships, true) &&
    exact(proof.auth_user_ids, true), 'SAME_IDENTITIES');
  gate('EMPTY_LIVE_AND_PAYMENTS_COVERAGE',
    exact(proof.empty_live_updates_handled_without_forgery, true) &&
    exact(proof.empty_ad_payments_handled_without_forgery, true) &&
    exact(proof.synthetic_relationship_recovery_exercised, true), 'NO_FAKE_PRODUCTION_ROWS');
  gate('EVIDENCE_AND_REGRESSION',
    ['E1','E2','E4','E5','E8'].every(k => exact(proof[k], true)) &&
    exact(proof.android_real_evidence_reviewed, true) &&
    exact(proof.security_regression_pass, true) &&
    exact(proof.independent_review, true) && safeRun(proof.isolated_restore_run_id), 'FINAL_REVIEW_PREREQUISITE');
  gate('NONDESTRUCTIVE_AND_RELEASE_GATES',
    exact(proof.production_untouched, true) && exact(proof.existing_b2_backups_untouched, true) &&
    exact(proof.main_unmerged, true) && exact(proof.grievance_privacy_respected, true), 'NO_RELEASE');

  const missing = checks.filter(c => c.result === 'HOLD').map(c => c.code);
  return Object.freeze({
    project: EXPECTED_PROJECT,
    status: missing.length ? 'HOLD' : 'READY_FOR_INDEPENDENT_FOUNDER_REVIEW',
    // The algorithm cannot authenticate input evidence or grant FINAL PASS + LOCK.
    final_pass: false, final_lock: false, can_start_t071: false,
    missing, checks,
    note: 'Synthetic assertions and record matching cannot replace real restore, independent audit and Founder LOCK.'
  });
}
