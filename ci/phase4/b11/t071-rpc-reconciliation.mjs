// P4-T071 — reconcile exact B8 client ABI with LIVE pg_proc read-only inventory.
// Scope: source-to-catalog DOCUMENTARY only. Never production DDL/DML or billing.
// Existing snapshot was read independently under BEGIN TRANSACTION READ ONLY;
// CI verifies source definitions/guard semantics, not a fresh Supabase connection.
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';

export const MISSING = Object.freeze([
  'jb_ad_confirm_manual_payment_internal',
  'jb_ad_creative_workflow_capability_internal',
  'jb_ad_decide_change_request_internal',
  'jb_ad_lifecycle_capability_internal',
  'jb_ad_notification_failures_internal',
  'jb_ad_notification_retry_internal',
  'jb_ad_owner_change_requests_internal',
  'jb_ad_owner_renewals_internal',
  'jb_ad_qualified_analytics_internal',
  'jb_ad_safety_transition_idempotent_internal',
  'jb_ad_set_approved_quote_internal'
]);
const FIXTURE='t071-rpc-fixture';
export function auditReconciliation(manifest,root=process.env.T071_PINNED_B8_ROOT) {
 assert(root===FIXTURE,'EXACT_PINNED_B8_ROOT_REQUIRED');
 assert(manifest.schema==='P4_T071_B7_LIVE_VS_CANDIDATE_RPC_RECONCILIATION_V1');
 assert(manifest.date_ist==='2026-10-27' && manifest.project_id==='vrffsnkycvjithwtiylt');
 assert(manifest.source_repo==='jantabol/JANTA-BOL-Website');
 assert(manifest.source_ref==='658f474d6ee0f24efac60f069979e8adee1e9221');
 assert.equal(manifest.catalog_scope,'LIVE_public_pg_proc_names_readonly_no_executions');
 assert.equal(manifest.domain_name_jantaboli_in,'DUE_NOT_CONFIGURED');
 assert.equal(manifest.full_t071_e8,'HOLD');
 assert.equal(manifest.production_mutations,0);
 assert.equal(manifest.distinct_referenced_rpc_names,27);
 assert.equal(manifest.present_rpc_names,16);
 assert.equal(manifest.absent_rpc_names,11);
 assert.equal(manifest.outcome,'SOURCE_BACKEND_ABI_DOCUMENTARY_GAP_CONFIRMED_NOT_DEPLOYMENT_AUTHORIZATION');
 const file=(path)=>{
   assert(/^JANTA_BOL_PHASE_(3C|4)_WORKING\/[a-zA-Z0-9_./-]+$/.test(path),'INVALID_REFERENCE_PATH');
   assert(!path.includes('..'),'TRAVERSAL_REJECTED');
   return readFileSync(join(root,path),'utf8');
 };
 const src=file(manifest.client_path);
 const names=new Set([...src.matchAll(/\brpc\(\s*['"](jb_[a-z0-9_]+)['"]/g)].map(m=>m[1]));
 assert.equal(names.size,27,'PINNED_CLIENT_NAMES_CHANGED');
 const listed=new Set(manifest.missing.map(x=>x.name));
 assert.equal(listed.size,11,'DUPLICATE_MISSING_RPC');
 assert.deepEqual([...listed].sort(),[...MISSING].sort(),'INVENTORY_DRIFT');
 assert.equal(manifest.existing_legacy_present.length,16);
 const existing=new Set(manifest.existing_legacy_present);
 assert.equal(existing.size,16,'DUPLICATE_PRESENT_NAME');
 assert([...existing].every(n=>!listed.has(n)&&names.has(n)),'PRESENT_SET_INVALID');
 assert([...listed].every(n=>names.has(n)),'MISSING_NOT_CALLED_FROM_CLIENT');
 assert.equal([...names].filter(n=>!listed.has(n)&&!existing.has(n)).length,0,'UNMAPPED_RPC_NAME');
 let defCount=0,omissionCount=0;
 for(const e of manifest.missing) {
   assert(e.name.startsWith('jb_ad_'),'NOT_B7_RPC');
   assert(e.ref.startsWith('JANTA_BOL_PHASE_4_WORKING/db/'),'MUST_BE_SQL_IN_REVIEW_TREE');
   assert(e.ref.endsWith('_REVIEW_ONLY.sql'),'NO_REVIEW_LABEL');
   assert(e.gate && e.intent && e.gate.length>=10,'MISSING_FAIL_CLOSED_CONTRACT');
   const sql=file(e.ref);
   assert(/\b(?:REVIEW[- ]ONLY|STAGING REVIEW|SOURCE[- ]ONLY)\b/i.test(sql.slice(0,800)),'NON_REVIEW_SOURCE_'+e.name);
   assert(/\b(?:DO NOT|never)\b/i.test(sql.slice(0,1200)),'ABSENT_PRODUCTION_STOP_BANNER');
   const declaration=new RegExp('\\bcreate\\s+(?:or\\s+replace\\s+)?function\\s+public\\.'+e.name+'\\s*\\(','i');
   const defined=declaration.test(sql);
   if(e.class==='REVIEW_ONLY_SQL_EXISTS') {
      assert(defined,'EXPECTED_REVIEW_ONLY_DECLARATION_MISSING_'+e.name);
      defCount++;
   } else if(e.class==='DELIBERATELY_NO_SENTINEL_SQL'){
      assert(e.name==='jb_ad_lifecycle_capability_internal','WRONG_NO_SENTINEL_EXCEPTION');
      assert(!defined,'SENTINEL_SILENTLY_CREATED');
      assert(sql.includes('DO NOT CREATE lifecycle-capability sentinel'),'WRONG_SENTINEL_POLICY');
      omissionCount++;
   } else throw Error('UNKNOWN_CLASS_'+e.class);
 }
 assert.equal(defCount,10);
 assert.equal(omissionCount,1);
 assert(src.includes("B7_SAFE_LIFECYCLE_BACKEND_NOT_DEPLOYED"),'POSITIVE_AD_LIFECYCLE_NOT_FENCED');
 assert(src.includes("B7_TWO_STAGE_CREATIVE_BACKEND_NOT_DEPLOYED"),'LEGACY_AUTO_APPROVAL_NOT_FENCED');
 assert(src.includes("B7_LEGACY_PAYMENT_CONFIRMATION_DISABLED_USE_MANUAL_EVIDENCE"),'LEGACY_PAYMENT_NOT_FENCED');
 assert(src.includes("B7_SAFE_PORTAL_BACKEND_REQUIRED"),'UNSAFE_PORTAL_ISSUE_NOT_FENCED');
 assert(src.includes("return rpc('jb_ad_notification_retry_internal'"),'RETRY_GUARD_CHANGED');
 assert(src.includes("throw Error('QUALIFIED_ANALYTICS_NOT_AVAILABLE')"),'NO_UNTRUSTED_ANALYTICS_GUARD');
 return Object.freeze({
  expected_in_client:27,
  deployed_function_names_observed_2026_10_27:16,
  absent_function_names_observed_2026_10_27:11,
  exact_absent_functions_defined_in_review_only_sql:10,
  intentionally_omitted_positive_ad_lifecycle_sentinel:1,
  live_catalog_calls_or_faults_in_ci:0,
  actual_prod_migrations_or_grants:0,
  source_migration_parity:'PASS_RECONCILED',
  full_backend_release:'HOLD',
  payment_and_ad_activation:'DISABLED_UNTIL_FOUNDER_ATOMIC_RELEASE',
  t071_full_e8:'HOLD',
  jantaboli_in:'DUE'
 });
}
if(process.argv[1]?.endsWith('t071-rpc-reconciliation.mjs')){
 try{
  const m=JSON.parse(readFileSync('ci/phase4/b11/t071-rpc-reconciliation-manifest-20261027.json','utf8'));
  const verdict=auditReconciliation(m);
  console.log('T071_RPC_SOURCE_TO_REVIEW_MIGRATION_MAPPING=11_OF_11_VERIFIED');
  console.log('T071_RPC_DEFINED_REVIEW_ONLY=10');
  console.log('T071_RPC_LIFECYCLE_SENTINEL_DELIBERATELY_OMITTED=1');
  console.log('T071_RPC_LIVE_ABI_SNAPSHOT=16_PRESENT_11_MISSING_FROM_27');
  console.log('T071_PRODUCTION_RPC_EXECUTIONS=0');
  console.log('T071_FINAL_E8=HOLD');
  console.log(JSON.stringify(verdict));
 }catch(err){
  console.error('T071_RPC_RECONCILIATION_HOLD='+String(err.message).slice(0,180));
  process.exitCode=3;
 }
}
