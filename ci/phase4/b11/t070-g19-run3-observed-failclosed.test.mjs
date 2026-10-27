// Documentary/fail-closed G19 observer. This test does NOT download private B2 data,
// restore a hosted service, attest to the external Run #3 or authorize a final lock.
import test from 'node:test';
import assert from 'node:assert/strict';
import {assessT070FinalE8} from './t070-final-e8-gate.mjs';

// Only verified real Run 40452402698 / job 122017925138, and explicitly
// limited-source read-only audit. Unknown means ABSENT, never invented true.
const observed=Object.freeze({
 project:'vrffsnkycvjithwtiylt',cricket_resources_touched:false,
 database:{real_isolated_pg17_restore:true,private_b2_ciphertext_roundtrip:true,
  source_clone_26_metrics:'EXACT_MATCH',source_clone_16_security_metrics:'EXACT_MATCH',
  public_tables:100,public_rls_tables:100,app_storage_policies:81,
  workflow_run_id:'40452402698'},
 storage:{source_objects:5,recovered_objects:5,byte_hash_verified_objects:5,
  source_grievance_objects:2,recovered_grievance_objects:2,
  independent_original_source_hash_proof:true,disposable_destination:true,
  original_paths_preserved:true},
 // One genuine single-run snapshot+readback verified; a *universal* source
 // quiescence barrier and single atomic hosted recovery checkpoint NOT proved.
 consistency:{database_media_bound_to_same_trusted_point:false,
  source_to_restore_identity_verified:true},
 platform:{auth_service_restored_to_disposable:false,
  founder_permission_negative_tests:false,public_anon_rls_negative_tests:false,
  runtime_auth_sessions_recovery_reviewed:false,storage_private_access_negative_tests:false,
  edge_function_versions_verified:false,vercel_runtime_config_verified:false,
  buckets_and_policies_restored:false},
 proof:{article_ids_master_urls:true,grievance_ids_history:true,
  live_session_relationships:true,ads_campaign_payment_relationships:true,
  auth_user_ids:true,empty_live_updates_handled_without_forgery:true,
  empty_ad_payments_handled_without_forgery:true,
  synthetic_relationship_recovery_exercised:false,
  E1:false,E2:false,E4:false,E5:false,E8:false,
  android_real_evidence_reviewed:false,security_regression_pass:false,
  independent_review:false,isolated_restore_run_id:'40452402698',
  production_untouched:true,existing_b2_backups_untouched:true,
  main_unmerged:false,grievance_privacy_respected:true}
});
test('Actual Run #3 verified offline data-plane proofs cannot be promoted to whole-T070 E8 or T071',()=>{
 const r=assessT070FinalE8(observed);
 for(const k of ['PROJECT_ISOLATION','DATABASE_REAL_RECOVERY','ORIGINAL_STORAGE_ALL_OBJECT_BYTES','IDENTITY_RELATIONSHIPS']){
  assert.ok(!r.missing.includes(k),k+' should have its genuine bounded proof');
 }
 const missing=['CROSS_COMPONENT_RESTORE_POINT','AUTH_AND_PERMISSIONS',
 'PLATFORM_CONFIG_RESTORED','EMPTY_LIVE_AND_PAYMENTS_COVERAGE',
 'EVIDENCE_AND_REGRESSION','NONDESTRUCTIVE_AND_RELEASE_GATES'];
 assert.deepEqual(r.missing,missing);
 assert.equal(r.status,'HOLD');
 assert.equal(r.final_pass,false);
 assert.equal(r.final_lock,false);
 assert.equal(r.can_start_t071,false);
});
test('Even fabricated E8 claims cannot bypass human independent security review and final lock',()=>{
 const forged=structuredClone(observed);
 forged.proof.E8=true;
 forged.proof.independent_review=true;
 forged.platform.auth_service_restored_to_disposable=true;
 const r=assessT070FinalE8(forged);
 assert.equal(r.status,'HOLD');
 assert.equal(r.final_pass,false);
 assert.equal(r.final_lock,false);
 assert.equal(r.can_start_t071,false);
});
