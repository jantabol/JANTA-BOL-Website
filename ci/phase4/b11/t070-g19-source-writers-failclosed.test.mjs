// G19 SOURCE read-only observation never authorizes production pause or T070 LOCK.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluateG16,WRITER_GATES} from './t070-g16-write-fence-gate.mjs';
import {evaluateG17,REQUIRED_PROOFS} from './t070-g17-maintenance-go-no-go.mjs';
import {assessT070FinalE8} from './t070-final-e8-gate.mjs';
const e=JSON.parse(readFileSync('ci/phase4/b11/t070-g19-20261027-live-writer-source-observation.json','utf8'));
test('T070 true JANTA BOL live source writer inventory is bounded and does not claim atomic capture',()=>{
 assert.equal(e.project_ref,'vrffsnkycvjithwtiylt');
 assert.equal(e.active_pg_cron_jobs,3);
 assert.equal(e.active_cron_five_second_jobs,1);
 assert.equal(e.enabled_public_user_triggers,48);
 assert.equal(e.public_security_definer_functions,215);
 assert.equal(e.anon_direct_write_granted_tables,5);
 assert.equal(e.authenticated_direct_write_granted_tables,16);
 assert.equal(e.public_table_count,100);
 assert.equal(e.public_rls_enabled,100);
 assert.equal(e.public_rls_disabled,0);
 assert.equal(e.anon_direct_write_granted_tables_with_rls,5);
 assert.equal(e.source_pg_active_writers_at_one_observation,0);
 assert.equal(e.production_write_fence_applied,false);
 assert.equal(e.global_cross_component_atomic_checkpoint_proven,false);
 assert.equal(e.no_production_write_executed,true);
 assert.equal(e.cricket_or_saarthi_touched,false);
});
test('G16 20/20 writer freeze gates remain missing despite successful real DB and media recovery',()=>{
 const r=evaluateG16({project_ref:e.project_ref,cricket_resources_touched:false,no_paid_resources_created:true});
 assert.equal(WRITER_GATES.length,20);
 assert.equal(r.state,'HOLD');
 assert.equal(r.absent.length,20);
 assert.equal(r.production_pause_authorized_by_this_code,false);
 assert.equal(r.cross_component_restore_proven,false);
 assert.equal(r.final_t070_lock,false);
});
test('G17 live writer-surface observation is not a maintenance approval, all 18 external controls missing',()=>{
 const obs={
  project_ref:e.project_ref,
  active_pg_cron_jobs:e.active_pg_cron_jobs,
  enabled_public_user_triggers:e.enabled_public_user_triggers,
  direct_anon_write_grants_tables:e.anon_direct_write_granted_tables,
  direct_authenticated_write_grants_tables:e.authenticated_direct_write_granted_tables,
  public_security_definer_functions:e.public_security_definer_functions,
  edge_functions_live:e.deployed_edge_functions,
  edge_functions_verify_jwt_false:e.edge_verify_jwt_false,
 };
 const r=evaluateG17(obs,{});
 assert.equal(r.status,'HOLD');
 assert.equal(REQUIRED_PROOFS.length,18);
 assert.equal(r.missing.length,18);
 assert.deepEqual(r.invalid_or_stale_source_observations,[]);
 assert.equal(r.permission_to_apply_maintenance_from_this_code,false);
 assert.equal(r.t070_final_pass,false);
 assert.equal(r.can_start_t071,false);
});
test('E8 Gate forbids any automatic lock from live source counts or green CI without restored runtime',()=>{
 const r=assessT070FinalE8({project:e.project_ref,cricket_resources_touched:false, database:{
  real_isolated_pg17_restore:true,private_b2_ciphertext_roundtrip:true,
  source_clone_26_metrics:'EXACT_MATCH',source_clone_16_security_metrics:'EXACT_MATCH',
  public_tables:100,public_rls_tables:100,app_storage_policies:81,workflow_run_id:'40452402698'},
  platform:{auth_service_restored_to_disposable:e.auth_runtime_reconstructed,edge_function_versions_verified:false},
  proof:{E8:false,independent_review:false,production_untouched:true}
 });
 assert.equal(r.status,'HOLD');
 for(const code of ['AUTH_AND_PERMISSIONS','PLATFORM_CONFIG_RESTORED','EVIDENCE_AND_REGRESSION'])
  assert.ok(r.missing.includes(code),code);
 assert.equal(r.final_pass,false);
 assert.equal(r.final_lock,false);
 assert.equal(r.can_start_t071,false);
});
