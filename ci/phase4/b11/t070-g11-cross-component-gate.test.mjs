import test from 'node:test';
import assert from 'node:assert/strict';
import {assessT070G11} from './t070-g11-cross-component-gate.mjs';
const base=()=>({
 project:'vrffsnkycvjithwtiylt',cricket_touched:false,
 database:{run_id:'40223103797',pgp17_offline_clone:true,encrypted_offsite_readback:true,all_26_parity:true,all_16_security_parity:true},
 media:{run_id:'40274621191',file_count:5,grievance_file_count:2,b2_ciphertext_readback:true,isolated_original_byte_sha256_parity:true,non_destructive:true},
 coherence:{point_id:'JB-verified-snapshot-2026',database_point_id:'JB-verified-snapshot-2026',media_point_id:'JB-verified-snapshot-2026',
 protected_write_quiescence_observed:true,source_media_double_scan:true,source_db_manifest_pinned:true,
 no_app_writes_between_capture_and_restore:true,external_point_provenance_reviewed:true},
 owner:{founder_private_key_available_off_ci:true,new_isolated_restore_from_b2_after_original_runner_destroyed:true,
 founder_primary_recipient_decrypted_offline:true,all_5_sha256_verified:true},
 platform:{disposable_destination:true,real_db_media_restored_together:true,auth_service_reconstructed_and_probed:true,
 rls_negative_access_tests:true,storage_private_anon_denial:true,edge_functions_all_recovered_and_tested:true,
 vercel_runtime_config_restored_and_tested:true,session_rotation_revocation_reviewed:true},
 identity:{article_permanent_ids_urls:true,grievance_ids_history:true,live_session_relationships:true,
 advertiser_ads_relationships:true,auth_ownership_recovered:true,live_update_fixture_tested_in_disposable:true,
 ad_payment_fixture_tested_in_disposable:true,production_has_no_artificial_rows:true},
 audit:{E1:true,E2:true,E4:true,E5:true,E8:true,independent_security_review:true,
 real_android_checks:true,production_untouched:true,no_secrets_or_private_evidence_disclosed:true}
});
test('G11 empty claims fail closed and T071 never auto starts',()=>{
 for(const x of [{},null,{project:'hriakdazkcvplsdwgfle'}]) {
  const r=assessT070G11(x??{});assert.equal(r.status,'HOLD');assert.equal(r.final_pass,false);
  assert.equal(r.final_lock,false);assert.equal(r.can_start_t071,false);
 }
});
test('G11 *real historical* separate T034 and T069 PASS remain an E8 HOLD',()=>{
 const x=base();delete x.coherence;delete x.owner;delete x.platform;delete x.identity;delete x.audit;
 const r=assessT070G11(x);assert.equal(r.status,'HOLD');
 assert.ok(!r.missing.includes('REAL_DATABASE_OFFSITE_CLONE'));
 assert.ok(!r.missing.includes('REAL_ALL_FIVE_MEDIA_OFFSITE'));
 assert.ok(r.missing.includes('ONE_TRUSTED_RECOVERY_POINT'));
 assert.ok(r.missing.includes('DURABLE_INDEPENDENT_OWNER_AGE_KEY_RECOVERY'));
});
test('G11 two individually verified backups cannot be linked by a common text label alone',()=>{
 const x=base();x.coherence.protected_write_quiescence_observed=false;x.coherence.external_point_provenance_reviewed=false;
 assert.ok(assessT070G11(x).missing.includes('ONE_TRUSTED_RECOVERY_POINT'));
});
test('G11 ciphertext decrypt by disposable ephemeral recipient is NOT Founder future owner recovery',()=>{
 const x=base();x.owner.founder_primary_recipient_decrypted_offline=false;
 assert.ok(assessT070G11(x).missing.includes('DURABLE_INDEPENDENT_OWNER_AGE_KEY_RECOVERY'));
});
test('G11 two grievance originals mandatory without printing their paths',()=>{
 const x=base();x.media.grievance_file_count=0;
 assert.ok(assessT070G11(x).missing.includes('REAL_ALL_FIVE_MEDIA_OFFSITE'));
});
test('G11 no copy of postgresql public tables alone counts as Auth platform runtime restore',()=>{
 const x=base();x.platform.auth_service_reconstructed_and_probed=false;
 x.platform.vercel_runtime_config_restored_and_tested=false;
 assert.ok(assessT070G11(x).missing.includes('COMPLETE_ISOLATED_RUNTIME_RESTORE'));
});
test('G11 zero production live updates/payments are NOT artificially marked exercised',()=>{
 const x=base();x.identity.live_update_fixture_tested_in_disposable=false;
 x.identity.ad_payment_fixture_tested_in_disposable=false;
 assert.ok(assessT070G11(x).missing.includes('ZERO_ROW_EXERCISE_IN_CLONE_ONLY'));
});
test('G11 no Cricket or secret disclosure, no shortcuts on final E8 review',()=>{
 const x=base();x.cricket_touched=true;x.audit.no_secrets_or_private_evidence_disclosed=false;
 assert.ok(assessT070G11(x).missing.includes('EXACT_PROJECT_SCOPE'));
 assert.ok(assessT070G11(x).missing.includes('FINAL_E1_E2_E4_E5_E8_INDEPENDENT_SECURITY'));
});
test('G11 complete hypothetical fixture only READY FOR REVIEW, never full PASS or LOCK',()=>{
 const r=assessT070G11(base());
 assert.equal(r.status,'READY_FOR_E8_INDEPENDENT_FOUNDER_REVIEW');
 assert.equal(r.missing.length,0);
 assert.equal(r.final_pass,false);assert.equal(r.final_lock,false);assert.equal(r.can_start_t071,false);
});
