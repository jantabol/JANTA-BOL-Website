'use strict';
/* JANTA BOL B7: ADS-001..060 canonical evidence preflight + FINAL ZIP lock.
 * No PDF mocks or green synthetic PostgreSQL jobs can mean final PASS.
 * --audit checks structure and explicit DUEs without approving a release.
 * --release FAILS until every canonical blueprint evidence item and actual
 * Founder/device/backend deployment gate has been independently supplied.
 * This script NEVER creates a ZIP, changes production, or sends messages.
 */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const file=process.env.B7_MANIFEST_FILE||
 path.join(root,'JANTA_BOL_PHASE_4_WORKING/review/B7_FINAL_ZIP_CLOSURE_MANIFEST.json');
const doc=JSON.parse(fs.readFileSync(file,'utf8'));
const mode=process.argv[2]||'--audit';
assert.ok(['--audit','--release'].includes(mode),'UNKNOWN_B7_AUDIT_MODE');
assert.equal(doc.schema,'janta-bol-b7-canonical-closure-v1');
const expected=[
 ['P4-T034',1,9,'E2,E3,E5'],
 ['P4-T035',10,15,'E2,E3'],
 ['P4-T036',16,23,'E2,E5'],
 ['P4-T037',24,34,'E2,E3,E5'],
 ['P4-T038',35,40,'E2,E5,E6'],
 ['P4-T039',41,47,'E2,E3,E5'],
 ['P4-T040',48,50,'E1,E2,E3'],
 ['P4-T041',51,56,'E1,E2,E5'],
 ['P4-T042',57,60,'E1,E3,E7']
];
assert.equal(doc.canonical_tests.length,9,'MISSING_CANONICAL_B7_TEST');
assert.equal(doc.ads.length,60,'MISSING_ADS_CHECKPOINT');
const seen=new Set();
const covered=new Set();
for(let i=0;i<expected.length;i++){
 const [id,first,last,evidence]=expected[i],got=doc.canonical_tests[i];
 assert.equal(got.id,id,'CANONICAL_TEST_ORDER_DRIFT');
 assert.deepEqual(got.range,[first,last],'ADS_RANGE_DRIFT '+id);
 assert.equal(got.required_evidence.join(','),evidence,'EVIDENCE_AUTHORITY_DRIFT '+id);
 assert.ok(['DUE','PASS+LOCK'].includes(got.final_status),'INVALID_B7_FINAL_STATUS '+id);
 assert.ok(Array.isArray(got.evidence),'MISSING_EVIDENCE_ARRAY '+id);
 if(got.final_status==='PASS+LOCK'){
  assert.ok(got.owner_signoff,'UNSIGNED_FINAL_PASS '+id);
  for(const e of got.required_evidence){
   assert.ok(got.evidence.some(x=>x?.kind===e&&
    typeof x.path==='string'&&x.path.length>5&&
    x.source_commit&&x.timestamp&&x.verdict==='PASS'),
    'CANONICAL_REQUIRED_EVIDENCE_MISSING '+id+' '+e);
  }
 }
 for(let n=first;n<=last;n++){
  assert.ok(!covered.has(n),'DUPLICATE_ADS_MAPPING '+n);
  covered.add(n);
 }
}
for(let i=0;i<60;i++){
 const n=i+1,checkpoint=doc.ads[i],id='ADS-'+String(n).padStart(3,'0');
 assert.equal(checkpoint.id,id,'ADS_ORDER_OR_NUMBER_MISMATCH');
 assert.ok(typeof checkpoint.title==='string'&&checkpoint.title.length>=8,
  'ADS_TITLE_NOT_TRACED '+id);
 assert.equal(checkpoint.canonical_test,expected.find(e=>n>=e[1]&&n<=e[2])[0],
  'ADS_WRONG_CANONICAL_HOME '+id);
 assert.ok(['DUE','PASS+LOCK'].includes(checkpoint.final_status),
  'INVALID_ADS_STATUS '+id);
 assert.ok(Array.isArray(checkpoint.evidence),'ADS_EVIDENCE_ARRAY_MISSING '+id);
 assert.ok(!seen.has(id),'DUPLICATE_ADS '+id);seen.add(id);
 if(checkpoint.final_status==='PASS+LOCK'){
  assert.ok(checkpoint.evidence.some(x=>x?.verdict==='PASS'&&
   x.path&&x.source_commit&&x.timestamp),
   'ADS_FINAL_PASS_WITHOUT_REAL_EVIDENCE '+id);
 }
}
assert.equal(covered.size,60,'MISSING_ADS_MAPPING');
const register=fs.readFileSync(
 path.join(root,'JANTA_BOL_PHASE_4_WORKING/TEST-REGISTER.md'),'utf8');
for(const c of doc.canonical_tests){
 const pattern=new RegExp('^\\|\\s*'+c.id.replace('-','\\-')+'\\s*\\|[^\\n]+','m');
 const row=register.match(pattern)?.[0];
 assert.ok(row,'CANONICAL_TEST_REGISTER_ROW_MISSING '+c.id);
 if(c.final_status==='PASS+LOCK'){
  assert.match(row,/\bPASS\b/i,'REGISTER_HAS_NOT_PASSED '+c.id);
  assert.match(row,/\bLOCK(?:ED)?\b/i,'REGISTER_HAS_NOT_LOCKED '+c.id);
 }else{
  // The register must not declare final PASS while the 60-item ledger says DUE.
  const fields=row.split('|').map(s=>s.trim());
  const state=fields[5]||'';
  assert.ok(!/\bPASS\s*(?:\+|&|AND)\s*LOCK/i.test(state),
    'FAKE_REGISTER_FINAL_PASS '+c.id);
 }
}
const allReady=doc.canonical_tests.every(c=>c.final_status==='PASS+LOCK')&&
 doc.ads.every(c=>c.final_status==='PASS+LOCK');
const gate=doc.release_gates||{};
const finalFields=[
 'approved_production_source_commit','b6_immutable_source_hash',
 'final_protected_ci_run','final_candidate_ci_run',
 'real_android_e3','real_owner_aal2_e5',
 'exact_deployed_site_url','production_migration_proof',
 'founder_final_signoff'];
if(mode==='--release'){
 assert.equal(doc.final_zip_status,'READY_FOR_FINAL_VERIFICATION',
  'B7_ZIP_BLOCKED_DOCUMENT_STATUS');
 assert.ok(allReady,'B7_ZIP_BLOCKED_UNFINISHED_ADS_OR_TESTS');
 for(const k of finalFields)assert.ok(gate[k],
  'B7_ZIP_BLOCKED_MISSING_REAL_PROOF '+k);
 assert.equal(gate.approved_to_release,true,'B7_ZIP_BLOCKED_FOUNDER_AUTHORITY');
 assert.ok(gate.outstanding_provider_e6===null||
  gate.outstanding_provider_e6===false,
  'B7_ZIP_BLOCKED_E6_EXTERNAL_PROVIDER_DUE');
 console.log('B7 FINAL ZIP GATE: DOCUMENTED READY — verify external sources independently before packaging.');
}else{
 assert.equal(doc.final_zip_status,allReady?
  'READY_FOR_FINAL_VERIFICATION':'BLOCKED',
  'B7_ZIP_STATUS_AND_TESTS_DISAGREE');
 console.log('B7 coverage audit: 9 canonical tests, 60 ADS checkpoints mapped exactly; release: '+
  (allReady?'READY FOR SEPARATE AUTHORIZED REVIEW':'BLOCKED — evidence genuinely DUE')+
  '; no PASS/LOCK inferred from synthetic CI.');
}
