import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync,symlinkSync,openSync,ftruncateSync,closeSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
const MAX=2*1024**3;
const NEW=512*1024**2;
const COMMAND='ci/phase4/b11/t075-scheduled-budget.py';
const fixture=()=>mkdtempSync(join(tmpdir(),'jb-t075-budget-'));
function setup(folder,meta={bytes:0,count:0},fileBytes=13){
  const metaPath=join(folder,'metadata.json');
  const archive=join(folder,'ciphertext.age');
  writeFileSync(metaPath,JSON.stringify(meta),{mode:0o600});
  const fd=openSync(archive,'w',0o600);ftruncateSync(fd,fileBytes);closeSync(fd);
  return {metaPath,archive};
}
function run(mode,...args){
 return execFileSync('python3',[COMMAND,mode,...args],{encoding:'utf8',timeout:8000,
  stdio:['ignore','pipe','pipe']});
}
function negative(mode,...args){
 assert.throws(()=>run(mode,...args),e=>e?.status!==0);
}
test('T075 existing remote metadata must be verified before live database export',()=>{
 const f=fixture();try{
  const {metaPath}=setup(f);
  assert.match(run('preflight',metaPath),/T075_SCHEDULED_B2_BUDGET_PREFLIGHT=PASS/);
 }finally{rmSync(f,{recursive:true,force:true})}
});
test('T075 exact 2 GiB existing ceiling and object cap boundary are enforced',()=>{
 const f=fixture();try{
  let p=setup(f,{bytes:MAX,count:1500});
  assert.match(run('preflight',p.metaPath),/PASS/);
  p=setup(f,{bytes:MAX+1,count:1});negative('preflight',p.metaPath);
  p=setup(f,{bytes:13,count:1501});negative('preflight',p.metaPath);
 }finally{rmSync(f,{recursive:true,force:true})}
});
test('T075 cumulative remote+new ciphertext does not silently breach total footprint',()=>{
 const f=fixture();try{
  let p=setup(f,{bytes:MAX-14,count:1},13);
  assert.match(run('upload',p.metaPath,p.archive),/T075_SCHEDULED_B2_BUDGET_UPLOAD=PASS/);
  p=setup(f,{bytes:MAX-12,count:1},13);
  negative('upload',p.metaPath,p.archive);
  p=setup(f,{bytes:MAX,count:0},13);
  negative('upload',p.metaPath,p.archive);
 }finally{rmSync(f,{recursive:true,force:true})}
});
test('T075 512 MiB ciphertext max enforced using sparse zero-copy archive file',()=>{
 const f=fixture();try{
  let p=setup(f,{bytes:0,count:1},NEW);
  assert.match(run('upload',p.metaPath,p.archive),/PASS/);
  p=setup(f,{bytes:0,count:1},NEW+1);
  negative('upload',p.metaPath,p.archive);
 }finally{rmSync(f,{recursive:true,force:true})}
});
test('T075 remote object cap reserved for immutable new archive',()=>{
 const f=fixture();try{
  const p=setup(f,{bytes:0,count:1500},13);
  assert.match(run('preflight',p.metaPath),/PASS/);
  negative('upload',p.metaPath,p.archive);
 }finally{rmSync(f,{recursive:true,force:true})}
});
test('T075 corrupted remote metadata, JSON scalars and boolean values fail closed',()=>{
 const f=fixture();try{
  const p=setup(f,{bytes:10,count:2});
  for(const metadata of ['{invalid','null','[]','{"bytes":true,"count":0}',
    '{"bytes":1,"count":true}','{"bytes":-1,"count":1}',
    '{"bytes":10.1,"count":0}','{"bytes":"123","count":0}',
    '{"bytes":1}','{"count":2}']){
    writeFileSync(p.metaPath,metadata);
    negative('preflight',p.metaPath);
  }
 }finally{rmSync(f,{recursive:true,force:true})}
});
test('T075 missing/archive empty/symlinked ciphertext cannot pass upload budget',()=>{
 const f=fixture();try{
  const p=setup(f);
  negative('upload',p.metaPath,join(f,'missing.age'));
  const z=setup(f,{bytes:0,count:0},0);
  negative('upload',z.metaPath,z.archive);
  const link=join(f,'archive-linked.age');
  symlinkSync(p.archive,link);
  negative('upload',z.metaPath,link);
 }finally{rmSync(f,{recursive:true,force:true})}
});
test('T075 sensitive existing B2 object file contents never printed to CI output',()=>{
 const f=fixture();try{
  const p=setup(f,{bytes:20,count:1},19);
  const out=run('upload',p.metaPath,p.archive);
  assert(!out.includes(f));
  assert(!out.includes(p.archive));
  assert(!out.includes('bytes'));
  assert.match(out,/PASS/);
 }finally{rmSync(f,{recursive:true,force:true})}
});
