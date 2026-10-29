import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditReconciliation,MISSING} from './t071-rpc-reconciliation.mjs';
const source=JSON.parse(readFileSync('ci/phase4/b11/t071-rpc-reconciliation-manifest-20261027.json','utf8'));
const copy=()=>structuredClone(source);
const verify=m=>auditReconciliation(m,'t071-rpc-fixture');
test('11 missing RPC names mapped exactly to 10 review SQL declarations plus 1 deliberately absent lifecycle sentinel',()=>{
 const r=verify(copy());
 assert.equal(r.absent_function_names_observed_2026_10_27,11);
 assert.equal(r.exact_absent_functions_defined_in_review_only_sql,10);
 assert.equal(r.intentionally_omitted_positive_ad_lifecycle_sentinel,1);
 assert.equal(r.source_migration_parity,'PASS_RECONCILED');
 assert.equal(r.live_catalog_calls_or_faults_in_ci,0);
 assert.equal(r.actual_prod_migrations_or_grants,0);
 assert.equal(r.t071_full_e8,'HOLD');
 assert.equal(r.jantaboli_in,'DUE');
 assert.equal(MISSING.length,11);
});
const corrupted=[
 ['RPC name changed',m=>m.missing[0].name='jb_ad_confirm_payment_internal'],
 ['Fake catalog total',m=>m.present_rpc_names=27],
 ['Partial inventory',m=>m.missing.pop()],
 ['Fake production readiness',m=>m.full_t071_e8='PASS'],
 ['Domain falsely set complete',m=>m.domain_name_jantaboli_in='READY'],
 ['Fake deployed backend assertion',m=>m.production_mutations=11],
 ['Source revision drift',m=>m.source_ref='f447231c0677644ca5a44cc19f12cf0314ff38ea'],
 ['Unsafe SQL source substitution',m=>m.missing[0].ref='JANTA_BOL_PHASE_3C_WORKING/index.html'],
 ['Unsafe repo path traversal',m=>m.missing[0].ref='../credentials'],
 ['Misclassify deliberate sentinel',m=>m.missing[3].class='REVIEW_ONLY_SQL_EXISTS'],
 ['Pretend payment defined in different reviewed migration',m=>m.missing[0].ref=m.missing[1].ref],
 ['Duplicate missing RPC name',m=>m.missing[2].name=m.missing[1].name],
 ['Fake extra present name',m=>m.existing_legacy_present[0]='jb_ad_dummy_billing_function'],
 ['False release authorization',m=>m.outcome='FINAL_APPROVED_FOR_PRODUCTION'],
 ['Hide payment safety gate',m=>m.missing[0].gate=''],
 ['Unknown exception kind',m=>m.missing[0].class='READY_TO_DEPLOY'],
 ['Mutate underlying catalog observation',m=>m.distinct_referenced_rpc_names=28],
 ['Wrong production project',m=>m.project_id='cricket-prediction']
];
for(const [label,change] of corrupted){
 test('Fail closed: '+label,()=>{
  const m=copy();change(m);
  assert.throws(()=>verify(m));
 });
}
test('Review cannot mark production LIVE/Ad Payment ready using this fixture',()=>{
 const a=verify(copy());
 assert.equal(a.payment_and_ad_activation,'DISABLED_UNTIL_FOUNDER_ATOMIC_RELEASE');
 assert.equal(a.full_backend_release,'HOLD');
 assert.equal(a.t071_full_e8,'HOLD');
});
