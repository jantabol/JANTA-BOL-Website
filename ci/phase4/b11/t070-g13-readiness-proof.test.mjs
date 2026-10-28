// JANTA BOL T070 G13: independent checkpoint assertions ONLY.
// No production API, no decrypted media, no public secrets, no automatic E8 LOCK.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assessT070G11 } from './t070-g11-cross-component-gate.mjs';
const e=JSON.parse(readFileSync('ci/phase4/b11/t070-g11-observed-recovery-scope.json','utf8'));
const b=Object.freeze({
  sourceProject:'vrffsnkycvjithwtiylt',
  managedCloneCount:0,
  productionWriteBarrierProven:false,
  singleDatabaseMediaCapture:false,
  localSupabaseStackStarted:true,
  fullEdgeVersionedSourcesRecovered:false,
  verifiedVercelRuntimeRestore:false,
  signedIndependentE8:false,
  authorizedPaidEnvironment:false
});
test('G12 owner-recipient authenticated recovery is supported by actual 4,781,378-byte ciphertext digest',()=>{
  assert.equal(e.project,b.sourceProject);
  assert.equal(e.owner.founder_private_key_available_off_ci,true);
  assert.equal(e.owner.founder_primary_recipient_decrypted_offline,true);
  assert.equal(e.owner.age_engine_selftest_pass,true);
  assert.equal(e.owner.github_ciphertext_equals_android_sha256,true);
  assert.equal(e.owner.key_material_recorded,false);
  assert.match(e.owner.android_ciphertext_sha256,/^[a-f0-9]{64}$/);
  assert.equal(e.owner.android_ciphertext_sha256,e.media.b2_ciphertext_sha256);
  assert.equal(e.owner.android_ciphertext_bytes,4781378);
  assert.equal(e.owner.android_ciphertext_bytes,e.media.ciphertext_file_bytes);
});
test('G12 off-runner AGE authentication is not per-file restored plaintext matching',()=>{
  assert.equal(e.owner.new_isolated_restore_from_b2_after_original_runner_destroyed,false);
  assert.equal(e.owner.all_5_sha256_verified,false);
  assert.match(e.owner.caveat,/does NOT prove/);
});
test('G13 confirms a fresh Supabase hosted clone has not been created or billed',()=>{
  assert.equal(e.observations.dev_supabase_branches,0);
  assert.equal(b.managedCloneCount,0);
  assert.equal(b.authorizedPaidEnvironment,false);
});
test('G13 prior DB run and media run do not form a trusted single recovery point',()=>{
  assert.notEqual(e.database.run_id,e.media.run_id);
  assert.notEqual(e.coherence.database_point_id,e.coherence.media_point_id);
  assert.equal(b.productionWriteBarrierProven,false);
  assert.equal(b.singleDatabaseMediaCapture,false);
});
test('G13 current live observations never manufacture the two absent relationships',()=>{
  assert.equal(e.observations.source_rows.live_updates,0);
  assert.equal(e.observations.source_rows.ad_payments,0);
  assert.deepEqual(e.observations.unexercised_checks,
    ['live_update_session_fk','payment_campaign_fk']);
});
test('G13 actual Auth/Edge/Vercel isolated runtime is not asserted from metadata inventory',()=>{
  assert.equal(b.localSupabaseStackStarted,true);
  assert.equal(e.sandbox.ephemeral_local_supabase_stack_booted,true);
  assert.equal(e.sandbox.local_db_auth_storage_containers_up,true);
  assert.equal(e.sandbox.no_production_secrets,true);
  assert.equal(e.sandbox.local_pg_major_verified,false);
  assert.equal(e.sandbox.real_janta_bol_database_restored,false);
  assert.equal(e.sandbox.real_media_five_originals_restored_here,false);
  assert.equal(e.sandbox.actual_same_point_e8,false);
  assert.equal(b.fullEdgeVersionedSourcesRecovered,false);
  assert.equal(b.verifiedVercelRuntimeRestore,false);
});
test('G13 no secret-bearing test or production mutation allowed on unapproved PR',()=>{
  assert.equal(e.secrets_included,false);
  assert.equal(e.private_object_paths_or_ids_included,false);
  assert.equal(e.cricket_touched,false);
  assert.equal(b.signedIndependentE8,false);
});
test('G13 FINAL T070 and T071 fail closed despite actual component/subset PASS results',()=>{
  const r=assessT070G11(e);
  assert.equal(r.status,'HOLD');
  assert.equal(r.final_pass,false);
  assert.equal(r.final_lock,false);
  assert.equal(r.can_start_t071,false);
  for (const gate of ['ONE_TRUSTED_RECOVERY_POINT','COMPLETE_ISOLATED_RUNTIME_RESTORE',
    'ZERO_ROW_EXERCISE_IN_CLONE_ONLY','FINAL_E1_E2_E4_E5_E8_INDEPENDENT_SECURITY'])
    assert.ok(r.missing.includes(gate));
});

test('G14 independent real ephemeral runner exists but platform auth/edge/vercel remain unproven',()=>{
  assert.equal(e.sandbox.run_id,'40291268018');
  assert.equal(e.sandbox.job_id,'121466638578');
  assert.equal(e.sandbox.log_scope,'EMPTY_STACK_RUNTIME_SMOKE_ONLY');
  assert.equal(e.sandbox.real_edge_functions_restored,false);
  assert.equal(e.sandbox.real_auth_negative_tests,false);
  assert.equal(e.sandbox.real_vercel_runtime_restored,false);
  assert.equal(e.sandbox.cloud_paid_clone_created,false);
  const r=assessT070G11(e);
  assert.equal(r.status,'HOLD');assert.equal(r.final_pass,false);assert.equal(r.final_lock,false);
});
