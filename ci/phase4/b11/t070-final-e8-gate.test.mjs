import test from 'node:test';
import assert from 'node:assert/strict';
import {assessT070FinalE8} from './t070-final-e8-gate.mjs';
const d='a'.repeat(64), run='40223103797';
function complete() {return {
  project:'vrffsnkycvjithwtiylt', cricket_resources_touched:false,
  database:{real_isolated_pg17_restore:true,private_b2_ciphertext_roundtrip:true,
    source_clone_26_metrics:'EXACT_MATCH',source_clone_16_security_metrics:'EXACT_MATCH',
    public_tables:100,public_rls_tables:100,app_storage_policies:81,workflow_run_id:run},
  storage:{source_objects:5,recovered_objects:5,byte_hash_verified_objects:5,source_grievance_objects:2,
    recovered_grievance_objects:2,independent_original_source_hash_proof:true,disposable_destination:true,
    original_paths_preserved:true},
  consistency:{source_manifest_sha256:d,restored_manifest_sha256:d,database_media_bound_to_same_trusted_point:true,
    source_to_restore_identity_verified:true},
  platform:{auth_service_restored_to_disposable:true,founder_permission_negative_tests:true,
    public_anon_rls_negative_tests:true,runtime_auth_sessions_recovery_reviewed:true,
    storage_private_access_negative_tests:true,source_config_sha256:d,restored_config_sha256:d,
    edge_function_versions_verified:true,vercel_runtime_config_verified:true,buckets_and_policies_restored:true},
  proof:{article_ids_master_urls:true,grievance_ids_history:true,live_session_relationships:true,
    ads_campaign_payment_relationships:true,auth_user_ids:true,empty_live_updates_handled_without_forgery:true,
    empty_ad_payments_handled_without_forgery:true,synthetic_relationship_recovery_exercised:true,
    E1:true,E2:true,E4:true,E5:true,E8:true,android_real_evidence_reviewed:true,
    security_regression_pass:true,independent_review:true,isolated_restore_run_id:run,
    production_untouched:true,existing_b2_backups_untouched:true,main_unmerged:true,
    grievance_privacy_respected:true}
};}
test('empty or malformed input always HOLD and cannot allow T071',()=>{
 for(const x of [{},null,{project:'hriakdazkcvplsdwgfle'}]){
  const r=assessT070FinalE8(x??{});assert.equal(r.status,'HOLD');assert.equal(r.final_lock,false);
  assert.equal(r.can_start_t071,false);
 }
});
test('fixture complete is READY for independent review, never auto PASS',()=>{
 const r=assessT070FinalE8(complete());
 assert.equal(r.status,'READY_FOR_INDEPENDENT_FOUNDER_REVIEW');
 assert.equal(r.final_lock,false);assert.equal(r.final_pass,false);assert.equal(r.can_start_t071,false);
 assert.equal(r.missing.length,0);
});
test('actual observed T070 3 of 5 media must HOLD despite database PASS',()=>{
 const x=complete();x.storage.recovered_objects=3;x.storage.byte_hash_verified_objects=3;x.storage.recovered_grievance_objects=0;
 const r=assessT070FinalE8(x);assert.deepEqual(r.missing,['ORIGINAL_STORAGE_ALL_OBJECT_BYTES']);
});
test('no grievance hashes cannot be hidden by private bucket existence',()=>{
 const x=complete();x.storage.byte_hash_verified_objects=3;
 assert.ok(assessT070FinalE8(x).missing.includes('ORIGINAL_STORAGE_ALL_OBJECT_BYTES'));
});
test('different DB and media snapshot point forbids review',()=>{
 const x=complete();x.consistency.database_media_bound_to_same_trusted_point=false;
 assert.ok(assessT070FinalE8(x).missing.includes('CROSS_COMPONENT_RESTORE_POINT'));
});
test('metadata-only restore cannot count as Auth/Config restore',()=>{
 const x=complete();x.platform.auth_service_restored_to_disposable=false;x.platform.vercel_runtime_config_verified=false;
 const r=assessT070FinalE8(x);assert.ok(r.missing.includes('AUTH_AND_PERMISSIONS'));
 assert.ok(r.missing.includes('PLATFORM_CONFIG_RESTORED'));
});
test('source and clone security counts are exact, not optional',()=>{
 const x=complete();x.database.public_tables=93;
 assert.ok(assessT070FinalE8(x).missing.includes('DATABASE_REAL_RECOVERY'));
});
test('non-exercised payments and live updates need separate safe synthetic coverage',()=>{
 const x=complete();x.proof.synthetic_relationship_recovery_exercised=false;
 assert.ok(assessT070FinalE8(x).missing.includes('EMPTY_LIVE_AND_PAYMENTS_COVERAGE'));
});
test('user observed device proof does not imply independent E8 or founder final lock',()=>{
 const x=complete();x.proof.E8=false;x.proof.independent_review=false;
 assert.ok(assessT070FinalE8(x).missing.includes('EVIDENCE_AND_REGRESSION'));
});
test('no silent production edit, main merge or cross-project access',()=>{
 for(const [key,val] of [['production_untouched',false],['existing_b2_backups_untouched',false],['main_unmerged',false]]){
  const x=complete();x.proof[key]=val;
  assert.ok(assessT070FinalE8(x).missing.includes('NONDESTRUCTIVE_AND_RELEASE_GATES'));
 }
 const x=complete();x.cricket_resources_touched=true;
 assert.ok(assessT070FinalE8(x).missing.includes('PROJECT_ISOLATION'));
});
