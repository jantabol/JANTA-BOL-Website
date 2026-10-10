'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const source=JSON.parse(fs.readFileSync(path.join(root,
 'JANTA_BOL_PHASE_4_WORKING/review/B7_FINAL_ZIP_CLOSURE_MANIFEST.json'),'utf8'));
const executable=path.join(root,'ci/phase4/b7-closure-gate.cjs');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'b7-proof-gate-'));
process.on('exit',()=>fs.rmSync(tmp,{recursive:true,force:true}));
function run(doc,mode='--audit'){
 const file=path.join(tmp,'test-'+Math.random().toString(36).slice(2)+'.json');
 fs.writeFileSync(file,JSON.stringify(doc));
 return spawnSync(process.execPath,[executable,mode],{
  cwd:root,env:{...process.env,B7_MANIFEST_FILE:file},encoding:'utf8'});
}
function clone(){return JSON.parse(JSON.stringify(source))}
test('ADS-060 60 unique checkpoints mapped to 9 original tests and E1/E2/E3/E5/E6/E7 exactly',()=>{
 const result=run(clone());
 assert.equal(result.status,0,result.stderr);
 assert.match(result.stdout,/60 ADS checkpoints mapped exactly/);
 assert.match(result.stdout,/BLOCKED/);
});
test('ADS-060 final ZIP must refuse absent real Android, Owner and external provider evidence',()=>{
 const result=run(clone(),'--release');
 assert.notEqual(result.status,0,'RELEASE MUST BE BLOCKED');
 assert.match(result.stderr,/B7_ZIP_BLOCKED_DOCUMENT_STATUS/);
});
test('ADS-060 fabricated PASS+LOCK without screenshots/Owner signature cannot pass CI',()=>{
 const data=clone();
 data.canonical_tests[0].final_status='PASS+LOCK';
 const result=run(data);
 assert.notEqual(result.status,0);
 assert.match(result.stderr,/UNSIGNED_FINAL_PASS/);
});
test('ADS-060 skips or duplicates any ADS-001..060 must FAIL',()=>{
 const data=clone();
 data.ads.splice(14,1);
 assert.notEqual(run(data).status,0);
 const data2=clone();
 data2.ads[14].id='ADS-014';
 const result=run(data2);
 assert.notEqual(result.status,0);
 assert.match(result.stderr,/ADS_ORDER_OR_NUMBER_MISMATCH/);
});
test('ADS-060 wrong canonical ADS mapping or evidence type cannot silently PASS',()=>{
 const data=clone();
 data.ads[50].canonical_test='P4-T040';
 const result=run(data);
 assert.notEqual(result.status,0);
 assert.match(result.stderr,/ADS_WRONG_CANONICAL_HOME/);
 const data2=clone();
 data2.canonical_tests[8].required_evidence=['E1','E2','E7'];
 const result2=run(data2);
 assert.notEqual(result2.status,0);
 assert.match(result2.stderr,/EVIDENCE_AUTHORITY_DRIFT/);
});
test('ADS-060 no fake final completion on partial branch even when all 14 CI jobs pass',()=>{
 const result=run(clone());
 assert.equal(result.status,0);
 assert.doesNotMatch(result.stdout,/READY FOR SEPARATE AUTHORIZED REVIEW/);
});
