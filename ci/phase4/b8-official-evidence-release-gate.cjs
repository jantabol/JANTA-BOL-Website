'use strict';
// B8 original 321-page Master RUN-12: audit != deployment authorization.
// --audit checks canonical mapping and honest due status. --release fails
// closed unless Founder-backed, class-specific REAL evidence is independently
// attested; this tool DOES NOT attest an external authority or SEND anything.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'../..');
const FILE=process.env.B8_OFFICIAL_MANIFEST||
 path.join(ROOT,'JANTA_BOL_PHASE_4_WORKING/review/B8_G5_OFFICIAL_EVIDENCE_MANIFEST_20261017.json');
const expected=[
 ['P4-T092',1,8,['E7','E9']],['P4-T093',9,12,['E2','E9']],
 ['P4-T094',13,19,['E2','E5','E9']],
 ['P4-T095',20,24,['E2','E5','E9']],
 ['P4-T096',25,28,['E2','E4','E5','E9']],
 ['P4-T097',29,35,['E2','E5','E7','E9']],
 ['P4-T098',36,44,['E1','E2','E3','E4','E5','E9']],
 ['P4-T099',45,51,['E1','E2','E5','E7','E9']]
];
const mode=process.argv[2]||'--audit';
assert(['--audit','--release'].includes(mode),'UNKNOWN_B8_GATE_MODE');
const m=JSON.parse(fs.readFileSync(FILE,'utf8'));
assert.equal(m.schema,'janta-bol-b8-original-topic13-evidence-v1','B8_MANIFEST_SCHEMA_DRIFT');
assert.equal(m.tests?.length,8,'B8_EIGHT_ORIGINAL_TESTS_REQUIRED');
const covered=new Set(),all=[];
for(let i=0;i<expected.length;i++){
 const [id,start,end,classes]=expected[i],t=m.tests[i];
 assert.equal(t.id,id,'B8_CANONICAL_TEST_ORDER_DRIFT');
 assert.deepEqual(t.checkpoints,[start,end],'B8_ACC_RANGE_DRIFT');
 assert.deepEqual(t.required_evidence,classes,'B8_ORIGINAL_E_CLASS_DRIFT');
 assert(['DUE','PASS+LOCK'].includes(t.status),'B8_STATUS_INVALID');
 assert(Array.isArray(t.verified_evidence),'B8_EVIDENCE_ARRAY_REQUIRED');
 for(let n=start;n<=end;n++){
  assert(!covered.has(n),'B8_ACC_OVERLAP_'+n);covered.add(n);
 }
 if(t.status==='PASS+LOCK'){
  assert(typeof t.founder_signature==='string'&&t.founder_signature.length>10,
    'B8_FOUNDER_SIGNATURE_REQUIRED');
  for(const kind of classes){
   const proof=t.verified_evidence.find(x=>
    x?.class===kind&&x.independently_reviewed===true&&
    typeof x.evidence_id==='string'&&x.evidence_id.length>=12&&
    typeof x.recorded_at==='string'&&x.recorded_at.length>=20&&
    typeof x.source_sha==='string'&&/^[a-f0-9]{40}$/.test(x.source_sha)&&
    typeof x.review_actor==='string'&&x.review_actor.length>8&&
    typeof x.privacy_class==='string'&&['PRIVATE','REDACTED'].includes(x.privacy_class));
   assert(proof,'B8_MISSING_REVIEWED_REAL_EVIDENCE_'+id+'_'+kind);
   // Assertions here validate structured assertions only; human/source
   // provenance (especially E9) must be independently reviewed offline.
  }
 }
 all.push(t.status);
}
assert.equal(covered.size,51,'B8_ACC_051_NOT_COVERED');
if(mode==='--release'){
 for(const gate of ['production_live_deployment_approved','actual_hosted_e2_verified',
  'physical_android_e3_verified','founder_e5_verified','production_source_e7_verified',
  'official_e9_verified']){
   assert(m[gate]===true,'B8_LIVE_OR_FOUNDER_RELEASE_GATE_DUE_'+gate);
 }
 assert(all.every(x=>x==='PASS+LOCK'),'B8_ORIGINAL_T092_T099_DUE');
 console.log('B8 structured gate satisfied: human authenticity remains independent.');
}else{
 console.log('PASS B8 CANONICAL SOURCE MAPPING: T092–T099, ACC001–051, original E classes');
 console.log('RELEASE '+(all.every(x=>x==='PASS+LOCK')?'PROVISIONAL HUMAN REVIEW REQUIRED':'HOLD: some official E classes DUE'));
}
