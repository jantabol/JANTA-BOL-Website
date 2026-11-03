// T090 E8 independent SOURCE evidence for previous REAL joint offsite encrypted backup.
// Fetches only public GitHub metadata; does NOT access backup bytes, private tables,
// auth users, production settings, provider secrets, or perform a restore.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const p=JSON.parse(fs.readFileSync('JANTA_BOL_PHASE_4_WORKING/review/P4_T090_E8_REAL_JOINT_BACKUP_20261102_TO_LIVE_COUNTS_20261103.json','utf8'));
test('T090-E8-01 external original GitHub backup run metadata is a genuinely successful explicit manual operation',async()=>{
 const url='https://api.github.com/repos/jantabol/JANTA-BOL-Website/actions/runs/41444146576';
 const r=await fetch(url,{signal:AbortSignal.timeout(15000),headers:{'User-Agent':'JantaBol-T090-ReadOnly-Audit','Accept':'application/vnd.github+json'}});
 assert.equal(r.status,200,'OFFSITE_BACKUP_HISTORY_UNAVAILABLE_HTTP_'+r.status);
 const x=await r.json();
 assert.equal(x.id,p.source_run.run_id);
 assert.equal(x.status,'completed');
 assert.equal(x.conclusion,'success');
 assert.equal(x.event,'workflow_dispatch');
 assert.equal(x.path,p.source_run.workflow_path);
 assert.equal(x.head_sha,'f447231c0677644ca5a44cc19f12cf0314ff38ea');
});
test('T090-E8-02 actual offsite encrypted AGE restoration has exact immutable source receipt and successful PG17 component evidence',()=>{
 assert.equal(p.evidence_from_real_job_logs.offsite_encrypted_backup_uploaded,true);
 assert.equal(p.evidence_from_real_job_logs.remote_age_decrypt_pass,true);
 assert.equal(p.evidence_from_real_job_logs.owner_private_key_used,false);
 assert.match(p.evidence_from_real_job_logs.stored_object_sha256_ciphertext,/^[a-f0-9]{64}$/);
 assert.equal(p.evidence_from_real_job_logs.stored_object_encrypted_bytes,22345927);
 assert.equal(p.evidence_from_real_job_logs.disposable_pg17_restored,true);
 assert.equal(p.evidence_from_real_job_logs.source_clone_26_metrics_exact,true);
 assert.equal(p.evidence_from_real_job_logs.real_five_storage_object_capture_bound_to_same_db_snapshot,true);
 assert.equal(p.evidence_from_real_job_logs.restored_pg17_five_storage_metadata_uuid_exact,true);
});
test('T090-E8-03 live Nov03 aggregate count parity is NOT identity/RPO/RTO/actual runtime proof',()=>{
 const a=p.backup_clone_sql_row_counts, b=p.live_read_only_counts_20261103;
 assert.deepEqual(a,b);
 assert.deepEqual(a,{articles:34,auth_users:5,ad_campaigns:7,storage_objects_metadata:5});
 assert.equal(p.comparison,'COUNT_PARITY_ONLY_NOT_RECORD_IDENTITIES_NOT_RPO_RTO');
 assert.equal(p.historical_backup_timestamp_utc,'2026-11-02T12:30:15Z');
});
test('T090-E8-04 never falsely close complete GoTrue + Edge + Vercel + Storage bytes restore or protected ancestor',()=>{
 const e=p.evidence_from_real_job_logs;
 for(const name of [
  'storage_file_bytes_restored_into_actual_supabase_storage_runtime',
  'real_auth_gotrue_server_rebuilt',
  'real_edge_functions_runtime_rebuilt',
  'vercel_project_config_rebuilt',
  'universal_db_storage_atomic_freeze_proven',
  'source_and_remote_production_runtime_full_e8_approved',
  'actual_real_signed_user_relogin_after_disaster_restore_proven',
  'actual_full_E8_final_lock'
 ])assert.equal(e[name],false,'FALSE_FULL_RESTORE_CLAIM_'+name);
 for(const n of ['original_T087_full_E5','original_T088_full_E8','original_T089_full_E7','original_T090_full_e1_e5_e7_e8'])assert.equal(p[n],'HOLD');
 assert.equal(p.this_turn_prod_db_auth_backup_configuration_mutated,false);
});
console.log('T090_REAL_OFFSITE_HISTORIC_RESTORE_PG17_5_STORAGE_CAPTURE=PASS_SCOPED');
console.log('T090_NOV03_LIVE_SOURCE_ROW_COUNTS_PARITY=PASS_SCOPED_COUNT_ONLY');
console.log('T090_FULL_GOTRUE_EDGE_VERCEL_STORAGE_RUNTIME_RPO_RTO=HOLD');
