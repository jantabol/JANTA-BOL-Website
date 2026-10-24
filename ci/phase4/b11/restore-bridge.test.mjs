import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {generateKeyPairSync} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {syntheticFixture} from './recovery-engine.mjs';
const bridge='ci/phase4/b11/t034-networkless-restore-bridge.sh';
function setup(){
 const tmp=mkdtempSync(join(tmpdir(),'jb-b11-bridge-')),src=join(tmp,'src'),sig=join(tmp,'sig.json');
 syntheticFixture(src);const kp=generateKeyPairSync('ed25519');
 const priv=join(tmp,'private.pem'),pub=join(tmp,'public.pem');
 writeFileSync(priv,kp.privateKey.export({type:'pkcs8',format:'pem'}));
 writeFileSync(pub,kp.publicKey.export({type:'spki',format:'pem'}));
 const command=spawnSync(process.execPath,['ci/phase4/b11/cli.mjs','sign-offline',
 '--path',src,'--private-key',priv,'--signature',sig,'--confirm','JANTA_BOL_OFFLINE_SIGN_ONLY'],
 {encoding:'utf8'});
 assert.equal(command.status,0,command.stderr);
 return {tmp,src,sig,pub,clean(){rmSync(tmp,{force:true,recursive:true})}};
}
test('T070 protected physical restore refuses synthetic SQL bytes even if source signed',()=>{
 const a=setup();try{
  const p=spawnSync('bash',[bridge,'preflight',a.src,a.sig,a.pub],{encoding:'utf8'});
  assert.equal(p.status,3);assert.match(p.stderr,/fake\/non-custom PostgreSQL archive refused/);
 }finally{a.clean()}
});
test('T073 wrong trusted public key rejected before any physical restore',()=>{
 const a=setup(),b=setup();try{
  const p=spawnSync('bash',[bridge,'preflight',a.src,a.sig,b.pub],{encoding:'utf8'});
  assert.equal(p.status,3);assert.match(p.stderr,/detached authentication/);
 }finally{a.clean();b.clean()}
});
test('T074 no unapproved live/real restore from synthetic or unsigned files',()=>{
 const a=setup();try{
  const p=spawnSync('bash',[bridge,'run',a.src,a.sig,a.pub,'JANTA_BOL_OFFLINE_FULL_DB_RESTORE_ONLY'],
   {encoding:'utf8'});
  assert.equal(p.status,3);assert.doesNotMatch(p.stdout,/REUSED_ORIGINAL_T034_OFFLINE_PG17=PASS/);
 }finally{a.clean()}
});
test('T074 detached signed source works for fake media copy but no PostgreSQL restore claim',()=>{
 const a=setup();try{
  const d=join(a.tmp,'target');
  const p=spawnSync(process.execPath,['ci/phase4/b11/cli.mjs','stage-trusted',
   '--source',a.src,'--dest',d,'--signature',a.sig,'--trust-key',a.pub,
   '--confirm','JANTA_BOL_DISPOSABLE_ONLY'],{encoding:'utf8'});
  assert.equal(p.status,0,p.stderr);
  const x=JSON.parse(p.stdout);
  assert.equal(x.evidence.source_authenticated,true);
  assert.equal(x.copied.db_sql_restore_executed,false);
 }finally{a.clean()}
});
