'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const base=JSON.parse(fs.readFileSync(path.join(root,
 'JANTA_BOL_PHASE_4_WORKING/review/B8_G5_OFFICIAL_EVIDENCE_MANIFEST_20261017.json'),'utf8'));
const gate=path.join(__dirname,'b8-official-evidence-release-gate.cjs');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'b8-g5-gate-'));
process.on('exit',()=>fs.rmSync(temp,{force:true,recursive:true}));
function run(value,mode){
 const file=path.join(temp,'case-'+Math.random().toString(36).slice(2)+'.json');
 fs.writeFileSync(file,JSON.stringify(value));
 return spawnSync(process.execPath,[gate,mode],{
  cwd:root,encoding:'utf8',env:{...process.env,B8_OFFICIAL_MANIFEST:file}
 });
}
function copy(){return JSON.parse(JSON.stringify(base))}
test('Original RUN-12 mapping accurately covers T092-099 and ACC001-051',()=>{
 const p=run(copy(),'--audit');
 assert.equal(p.status,0,p.stderr);
 assert.match(p.stdout,/T092/);
 assert.match(p.stdout,/RELEASE HOLD/);
});
test('Release denied with original due E2 E3 E5 E7 E9',()=>{
 const p=run(copy(),'--release');
 assert.notEqual(p.status,0);
 assert.match(p.stderr,/B8_LIVE_OR_FOUNDER_RELEASE_GATE_DUE/);
});
test('Missing ACC, changed class or swapped official tests cannot pass audit',()=>{
 for(const change of [
  x=>x.tests[1].id='P4-T092',
  x=>x.tests[2].checkpoints=[13,18],
  x=>x.tests[4].required_evidence=['E2','E9']
 ]){
  const doc=copy();change(doc);
  assert.notEqual(run(doc,'--audit').status,0);
 }
});
test('Fabricated PASS with no Founder signature and original classes cannot pass',()=>{
 const x=copy();x.tests[0].status='PASS+LOCK';
 const r=run(x,'--audit');
 assert.notEqual(r.status,0);
 assert.match(r.stderr,/B8_FOUNDER_SIGNATURE_REQUIRED/);
});
test('Even fabricated all-true live flags fail with unchanged original DUE',()=>{
 const x=copy();
 for(const key of ['production_live_deployment_approved','actual_hosted_e2_verified',
 'physical_android_e3_verified','founder_e5_verified','production_source_e7_verified',
 'official_e9_verified']) x[key]=true;
 const r=run(x,'--release');
 assert.notEqual(r.status,0);
 assert.match(r.stderr,/B8_ORIGINAL_T092_T099_DUE/);
});
