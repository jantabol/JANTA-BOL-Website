// P4-T071 G4 independent *scope-bound* evidence audit.
// Validate actual G2/G3 Github logs' pinned observations and the read-only
// public backend/preview inspection. This does NOT grant whole-system E8.
// No external network, credentials, data writes, migrations or deployed faults.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {FAULT_MATRIX} from './t071-failure-isolation-contract.mjs';

const SHA=/^[0-9a-f]{64}$/;
const GIT=/^[0-9a-f]{40}$/;
const expectedNames=new Set([
 'social','analytics','notifications','grievance','compliance',
 'advertising','search','accountability','live','provider',
 'payments','messaging','database'
]);
const assert=(v,code)=>{if(!v)throw new Error('T071_G4_EVIDENCE_HOLD_'+code)};
const exactTime=value=>typeof value==='string'&&
 /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{6}Z$/.test(value)
 &&Number.isFinite(Date.parse(value));
const hash=obj=>createHash('sha256').update(JSON.stringify(obj),'utf8').digest('hex');
const read=(p='ci/phase4/b11/t071-e8-independent-observation-register-20261027.json')=>
 JSON.parse(readFileSync(p,'utf8'));

export function auditIndependentE8(record=read()){
 assert(record?.schema==='JB_T071_E8_SCOPED_INDEPENDENT_REVIEW_V1','WRONG_SCHEMA');
 assert(record.audit_date_ist==='2026-10-27','WRONG_DAY');
 const c=record.source, r=record.rpo_observation, o=record.review_observations;
 assert(c&&r&&o,'INCOMPLETE_PACK');
 assert(c.repo==='jantabol/JANTA-BOL-Website','WRONG_REPO');
 assert(c.g2_actual_source_run_id===40498177713&&
        c.g2_actual_source_job_id===122168854308&&
        c.g2_actual_source_sha==='e371706dd3ea0d53d9763d3fcab896b994bc989d',
        'G2_UNBOUND_RUN');
 assert(c.g2_13_family_vm_result==='13_REAL_SOURCE_ADAPTERS_WITH_SIMULATED_FAULTS_PASS'&&
        c.g2_executed_case_count===80&&c.g2_failed_case_count===0,
        'G2_UNSUPPORTED_TOTAL');
 assert(c.b8_checked_source_sha==='658f474d6ee0f24efac60f069979e8adee1e9221'&&
        c.b9_checked_source_sha==='b509c60fceb053a51686f67e587d4922a40fa6f4',
        'SOURCE_FIXTURE_DRIFT');
 assert(c.g2_live_integrated_faults==='NOT_RUN','G2_SIMULATION_PROMOTED');
 assert(FAULT_MATRIX.length===13&&
        FAULT_MATRIX.every(i=>expectedNames.has(i.name))&&
        expectedNames.size===13,'MATRIX_CONTRACT_DRIFT');
 assert(c.g3_local_pg17_run_id===40501228346&&
        c.g3_local_pg17_job_id===122179118305&&
        c.g3_local_pg17_tested_sha==='8b6fcab5327cb7aed5eaf328772c1a970d3bfca8'&&
        c.g3_run_outcome==='SUCCESS','G3_UNBOUND_RUN');
 assert(SHA.test(c.g3_json_digest)&&SHA.test(r.source_backup_sha256),'BAD_DIGEST');
 // Independently re-derive the literal digest emitted in run 40501228346.
 assert(hash(r)===c.g3_json_digest,'RECOVERY_JSON_DIGEST_MISMATCH');
 assert(r.schema==='JANTA_BOL_T071_RPO_RTO_ISOLATED_PG17_OBSERVED_V1'&&
        r.scope==='DISPOSABLE_OFFLINE_PG17_SYNTHETIC_FIXTURE_ONLY'&&
        r.actual_postgresql_major===17,'LOCAL_SCOPE_UNKNOWN');
 const a=r.last_verified_restorable_checkpoint_at_utc,
       b=r.incident_start_at_utc,d=r.independently_observed_service_restored_at_utc;
 assert([a,b,d].every(exactTime),'TIMESTAMPS_INVALID');
 const point=Date.parse(a),failure=Date.parse(b),up=Date.parse(d);
 assert(point<=failure&&failure<up,'RECOVERY_CHRONOLOGY');
 const rpo=Math.round((failure-point))/1000, rto=Math.round((up-failure))/1000;
 // Date.parse only retains milliseconds, so 0.422/1.261 are safely
 // verified to rounded milliseconds, not fictitious microsecond precision.
 assert(Math.abs(rpo-r.observed_local_rpo_seconds)<=0.001 &&
        Math.abs(rto-r.observed_local_rto_seconds)<=0.001,
        'RPO_RTO_RECOMPUTED_MISMATCH');
 assert(r.real_disposable_db_crash_kill===true&&
        r.real_disposable_db_endpoint_write_failure_observed===true&&
        r.real_disposable_pg_dump_verified_before_fault===true&&
        r.same_disposable_db_endpoint_restored===true&&
        r.independent_new_pg_connection_restored_and_fk_rls_verified===true&&
        r.media_five_synthetic_sha_verified===true,
        'LOCAL_RESTORE_NOT_PROVEN');
 assert(r.post_checkpoint_committed_fixture_rows_lost_on_restore===1,
        'ACKNOWLEDGED_WRITE_LOSS_NOT_DISCLOSED');
 assert(r.production_untouched===true&&r.t071_final_pass_lock===false&&
        r.t070_final_e8==='HOLD'&&r.e8_independent_full_stack==='HOLD',
        'FALSE_FINAL_PASS');
 assert(r.actual_production_rpo_rto==='NOT_MEASURED'&&
        r.founder_approved_production_rpo_target==='NOT_ESTABLISHED'&&
        r.founder_approved_production_rto_target==='NOT_ESTABLISHED'&&
        r.hosted_integrated_13_family_matrix==='NOT_PROVEN',
        'LOCAL_METRIC_PROMOTED');
 assert(o.baseline_main_sha==='f447231c0677644ca5a44cc19f12cf0314ff38ea'&&
        o.vercel_production_commit===o.baseline_main_sha&&
        o.vercel_production_deployment_id==='dpl_nFSo2MXg3ASBPgUfXRYDzv2ybP8C',
        'PRODUCTION_IDENTITY_UNBOUND');
 assert(o.vercel_prod_http_status===200&&
        o.vercel_production_static_unreviewed_live_headlines_visible===true,
        'EDITORIAL_OLD_PRODUCTION_NOT_PROVEN_CLEAR');
 assert(o.vercel_candidate_preview_deployment_id==='dpl_7HvpnryrKX6CSnKkrBefsZSTkuXk'&&
        o.vercel_candidate_preview_http_status===200&&
        o.vercel_candidate_contains_b9_entry===true&&
        o.vercel_candidate_stale_founder_brand_badge===true,
        'CANDIDATE_PREVIEW_OLD_SHA_MISLABELED');
 assert(o.public_rls_tables_enabled===100&&o.public_base_tables===100&&
        o.anon_articles_select_granted===false&&
        o.anon_private_grievance_evidence_select_granted===false&&
        o.anon_b9_search_rpc_known_title_count===1,
        'READ_ONLY_BACKEND_OBSERVATION_DRIFT');
 assert(o.all_external_probes_read_only===true&&o.no_production_failure_injection===true,
        'INDEPENDENT_PROD_FAULT_UNSAFE');
 assert(o.founder_signed_e8_attestation===false&&
        o.independent_live_integrated_fault_logs_present===false&&
        o.full_article_live_ad_payment_persistence_negative_assertions_present===false&&
        o.full_prod_service_restoration_observed===false&&
        o.real_backup_target_comparison_done===false,
        'E8_NOT_ACTUALLY_INDEPENDENTLY_COMPLETE');
 return Object.freeze({
  scope:'P4_T071_G4_INDEPENDENT_E1_E2_E5_SOURCE_LOG_AND_LOCAL_PG_AUDIT',
  g2_13_real_source_adapters_with_stubbed_failures:'VERIFIED_LOGS_SCOPED',
  g3_actual_disposable_pg17_crash_restore:'VERIFIED_LOGS_SCOPED',
  local_pg_rpo_seconds:r.observed_local_rpo_seconds,
  local_pg_rto_seconds:r.observed_local_rto_seconds,
  acknowledged_post_checkpoint_fixture_rows_lost:1,
  publicly_served_old_source_editorial_risk:'STILL_PRESENT',
  anon_table_select:'DENIED_DIRECT_TABLE',
  anon_b9_rpc_query:'READ_ONLY_SUCCESS',
  hosted_integrated_product_faults:'NOT_VERIFIED',
  real_janta_bol_rpo_rto:'NOT_ESTABLISHED',
  E8_full_system:'HOLD',
  t071_final_pass:false,t071_final_lock:false,
  t070_final_e8:'HOLD',
  soft_launch_release:'NOT_APPROVED',
  missing:[
   'E8_INDEPENDENT_LIVE_INTEGRATED_ADAPTER_FAULTS_AND_PERSISTENCE',
   'E8_AUTH_EDGE_LIVE_PAYMENT_MESSAGING_DB_SERVICE_RECOVERY',
   'E8_FOUNDER_APPROVED_RECOVERY_THRESHOLDS_AND_TARGET_COMPARISON',
   'E8_FOUNDER_ATTESTATION_FOR_FINAL_PRODUCT_RELEASE'
  ],
  production_mutated:false
 });
}
if(process.argv[1]?.endsWith('t071-e8-independent-review.mjs')){
 try{
  const result=auditIndependentE8();
  console.log('T071_G4_INDEPENDENT_SCOPED_G2_G3_EVIDENCE=CHECKED');
  console.log('T071_G4_INDEPENDENT_FULL_PRODUCT_E8=HOLD');
  console.log('T071_G4_PRODUCTION_RPO_RTO=NOT_ESTABLISHED');
  console.log('T071_G4_OLD_PRODUCTION_STATIC_EDITORIAL_RISK=PRESENT');
  console.log('T071_G4_FINAL_LOCK=false');
  console.log(JSON.stringify(result));
 }catch(e){console.error(String(e.message||'T071_G4_HOLD'));process.exitCode=3;}
}
