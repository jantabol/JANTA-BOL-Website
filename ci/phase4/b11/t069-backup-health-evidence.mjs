#!/usr/bin/env node
// JANTA BOL / P4-T069: read-only evidence evaluator. Never calls B2/Supabase,
// changes production or asserts real backups from synthetic evidence.
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const load=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const source=readFileSync(resolve(root,'JANTA_BOL_PHASE_4_WORKING/TEST-REGISTER.md'),'utf8');
const report=readFileSync(resolve(root,'JANTA_BOL_PHASE_4_WORKING/review/P4_T069_BACKEND_READONLY_BASELINE_PROOF_20261024.md'),'utf8');
const policy=load('ci/phase4/b11/founder-recovery-policy.json');
const evidence=load('ci/phase4/b11/t069-readonly-observation-20261024.json');
const must=(v,e)=>{if(!v)throw new Error('T069_EVIDENCE_FAIL_CLOSED_'+e)};
export function audit(e,asOf){
 must(e?.schema==='jb-b11-t069-asof-readonly-observation-v1','SCHEMA');
 must(e?.source_project_ref==='vrffsnkycvjithwtiylt','WRONG_PROJECT');
 must(e?.project_status==='ACTIVE_HEALTHY','PROJECT_UNHEALTHY');
 must(e?.observation_method==='SUPABASE_CONNECTOR_READ_ONLY_SQL','UNTRUSTED_METHOD');
 must(e?.query_count===4,'SCOPE_NOT_RECONCILED');
 must(e?.row_counts?.articles===32&&e?.row_counts?.article_versions===878&&
 e?.row_counts?.audit_logs===1560&&e?.row_counts?.grievances===6&&
 e?.row_counts?.auth_users===5,'BASELINE_COUNT_DRIFT');
 must(e?.storage?.object_count===5&&e?.storage?.bucket_count===3,'BUCKET_COUNT_DRIFT');
 must(e?.storage?.bucket_objects?.['grievance-private']===2 &&
 e?.storage?.bucket_objects?.['private-editorial']===1 &&
 e?.storage?.bucket_objects?.['public-media']===2,'BUCKET_BREAKDOWN_DRIFT');
 must(e?.rls?.public_total===100&&e?.rls?.public_enabled===100 &&
 e?.rls?.storage_total===8&&e?.rls?.storage_enabled===8,'RLS_BASELINE_DRIFT');
 must(e?.historic_b2_real_workflow_run===38778388127&&
 e?.historic_b2_run_conclusion==='success'&&
 e?.historic_b2_offsite_ciphertext_written===true &&
 e?.historic_db_full_pg17_clone_parity===true,'HISTORIC_RESTORE_IDENTITY');
 must(e?.historic_media_original_bytes_restored===false&&
 e?.historic_platform_settings_restored===false,'OVERCLAIMED_REAL_BACKUP_SCOPE');
 const now=Date.parse(asOf),backup=Date.parse(e.historic_backup_timestamp_utc),ob=Date.parse(e.observed_at_utc);
 must(Number.isFinite(now)&&Number.isFinite(backup)&&Number.isFinite(ob)&&ob<=now&&backup<ob,'CLOCK');
 const ageSeconds=Math.max(0,Math.round((now-backup)/1000));
 const required=[
 'live_db_security_readonly_snapshot',
 'historical_actual_encrypted_B2_DB_restore',
 'current_B2_ciphertxt_readback',
 'current_immutable_DB_backup_age_and_frequency',
 'all_three_storage_bucket_file_bytes_offsite',
 'recent_DB_backup_generation_signed_identity',
 'backup_security_health_alert_verified'
 ];
 const gates={
 live_db_security_readonly_snapshot:true,
 historical_actual_encrypted_B2_DB_restore:true,
 current_B2_ciphertxt_readback:false,
 current_immutable_DB_backup_age_and_frequency:false,
 all_three_storage_bucket_file_bytes_offsite:false,
 recent_DB_backup_generation_signed_identity:false,
 backup_security_health_alert_verified:false
 };
 const passed=required.filter(s=>gates[s]);const held=required.filter(s=>!gates[s]);
 return {
 schema:'jb-b11-t069-truthful-audit-v1',test_id:'P4-T069',
 source_project_ref:e.source_project_ref,as_of_utc:new Date(now).toISOString(),
 historic_database_encrypted_backup_age_seconds:ageSeconds,
 backup_recency_target_seconds:policy.backup_recency_target_seconds,
 approved_rpo_seconds:policy.approved_rpo_seconds,
 confidence:'E1_CONNECTOR_META+E2_HISTORICAL_GITHUB_LOGS',
 previously_locked_tests_preserved:true,
 evidence_basis:'USER_REVIEWABLE_PRIOR_CONNECTED_TOOL_RESULTS_NOT_LIVE_BACKUP_HEALTH',
 non_mutating:true,real_b2_object_read_now:false,production_backup_dispatched:false,
 gates,evidence_passed:passed,evidence_missing:held,
 development_backend_precheck:'PASS',
 final_t069:'HOLD',
 can_unlock_b11:false
 };
}
must(/^\| P4-T069 \| Backup\/Recovery \| Backup Layers \+ Security \+ Health \| B11 \| NOT RUN \|/m.test(source),'REGISTER_CHANGING_OR_FALSE_LOCK');
must(policy.project_ref==='vrffsnkycvjithwtiylt','POLICY_PROJECT');
must(policy.automatic_live_restore===false&&policy.manual_real_backup_approval==='REQUIRED_SEPARATE_FOUNDER_DECISION','UNSAFE_AUTORUN');
must(report.includes('38778388127')&&report.includes('STORAGE_FILE_BYTES_RESTORED=false'),'HISTORIC_SOURCE_REPORT');
const result=audit(evidence,process.argv.includes('--as-of')?process.argv[process.argv.indexOf('--as-of')+1]:evidence.observed_at_utc);
console.log(JSON.stringify(result,null,2));
if(process.argv.includes('--require-lock')){console.error('T069_FINAL_HOLD: no fresh B2 offsite verification, real 3-bucket bytes, current backup age and approved health target.');process.exitCode=3}
