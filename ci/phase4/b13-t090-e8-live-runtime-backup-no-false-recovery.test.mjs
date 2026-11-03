// T090 E8 evidence reconciliation only. NEVER asserts actual restored GoTrue/Storage/Edge/Vercel
// or runs a production repair, restore, live login, billing or source export.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root='JANTA_BOL_PHASE_4_WORKING/review/';
const live=fs.readFileSync(root+'P4_T090_E8_20261103_LIVE_RUNTIME_INVENTORY_BACKUP_GAP_AND_LAUNCH_SCOPE.md','utf8');
const b=JSON.parse(fs.readFileSync(root+'P4_T090_E8_REAL_JOINT_BACKUP_20261102_TO_LIVE_COUNTS_20261103.json','utf8'));
const e=JSON.parse(fs.readFileSync(root+'P4_T090_15_LIVE_EDGE_FUNCTION_SOURCE_AUTHORITY_AND_NO_JWT_NEGATIVE_20261103.json','utf8'));
test('T090-E8-INVENTORY01 source is real same-run DB+media backup; clone is not recovered hosted runtime',()=>{
 assert.equal(b.source_run.run_id,41444146576);
 assert.equal(b.source_run.conclusion,'success');
 assert.equal(b.evidence_from_real_job_logs.offsite_encrypted_backup_uploaded,true);
 assert.equal(b.evidence_from_real_job_logs.real_five_storage_object_capture_bound_to_same_db_snapshot,true);
 assert.equal(b.evidence_from_real_job_logs.disposable_pg17_restored,true);
 for(const k of ['storage_file_bytes_restored_into_actual_supabase_storage_runtime',
  'real_auth_gotrue_server_rebuilt','real_edge_functions_runtime_rebuilt',
  'vercel_project_config_rebuilt','universal_db_storage_atomic_freeze_proven',
  'actual_real_signed_user_relogin_after_disaster_restore_proven','actual_full_E8_final_lock']){
  assert.equal(b.evidence_from_real_job_logs[k],false,'UNAUTHORIZED_FULL_RECOVERY_CLAIM_'+k);
 }
 assert.match(live,/full-platform RPO\/RTO/);
 assert.match(live,/E8 full PASS still forbidden/);
});
test('T090-E8-INVENTORY02 live 15 Edge JWT configuration and deployed Vercel SHA are explicitly scoped',()=>{
 assert.equal(e.project_id,'vrffsnkycvjithwtiylt');
 assert.equal(e.functions.length,15);
 assert.equal(e.functions.filter(x=>x.active&&x.verify_jwt).length,10);
 assert.equal(e.functions.filter(x=>x.active&&!x.verify_jwt).length,5);
 assert.ok(live.includes('15/15 active'));
 assert.ok(live.includes('dpl_7YhVGAh758YvZq6HmteERdyCKtMb'));
 assert.ok(live.includes('60970abdacf560815b9db3bd819eb467ef984616'));
 assert.ok(live.includes('64/64'));
});
test('T090-E8-INVENTORY03 only backed-up identity counts equal the four live parity counts; no false row/byte equivalence',()=>{
 for(const family of ['articles','auth_users','ad_campaigns','storage_objects_metadata'])
  assert.equal(b.backup_clone_sql_row_counts[family],b.live_read_only_counts_20261103[family],family);
 assert.equal(b.comparison,'COUNT_PARITY_ONLY_NOT_RECORD_IDENTITIES_NOT_RPO_RTO');
 assert.match(live,/not byte or identity parity/);
 assert.match(live,/920 `article_versions`/);
});
test('T090-E8-INVENTORY04 exact original status HOLD and risk flags preserved for final safe launch',()=>{
 for(const status of [b.original_T088_full_E8,b.original_T089_full_E7,b.original_T090_full_e1_e5_e7_e8])
  assert.equal(status,'HOLD');
 for(const term of ['T090_E8_ENTIRE_PLATFORM_RESTORE_AND_RPO_RTO=HOLD',
  'T090_P2_STALE_USER_ROLE_READ_FIX_LIVE=NOT_APPLIED',
  'T090_E7_FULL_SEMANTICS=HOLD','P4-T090_ORIGINAL_FINAL_PASS_LOCK=HOLD',
  'P4-T091=NOT_RUN','PUBLIC NEWS-ONLY 05 Nov 2026 soft launch']){
  assert.ok(live.includes(term),'MISSING_E8_ORIGINAL_HOLD_'+term);
 }
 assert.ok(!live.includes('T090_E8_ENTIRE_PLATFORM_RESTORE_AND_RPO_RTO=PASS'));
});
console.log('T090_E8_LIVE_INVENTORY_AND_REAL_DB_MEDIA_COMPONENT_PROOF=PASS_SCOPED_ONLY');
console.log('T090_E8_AUTH_STORAGE_EDGE_VERCEL_FULL_RESTORE_RPO_RTO=HOLD');
