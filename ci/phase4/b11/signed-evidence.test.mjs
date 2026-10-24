import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {mkdtempSync,readFileSync,writeFileSync,mkdirSync,rmSync,renameSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {syntheticFixture,MANIFEST,verify} from './recovery-engine.mjs';
import {attest,verifyTrusted} from './signed-evidence.mjs';
function setup(){
 const tmp=mkdtempSync(join(tmpdir(),'jb-b11-sign-'));
 const root=join(tmp,'data');syntheticFixture(root);
 const k=generateKeyPairSync('ed25519');
 const pem=k.privateKey.export({type:'pkcs8',format:'pem'});
 const p=k.publicKey.export({type:'spki',format:'pem'});
 writeFileSync(join(tmp,'founder-private.pem'),pem,{mode:0o600});
 writeFileSync(join(tmp,'founder-public.pem'),p);
 return {tmp,root,priv:join(tmp,'founder-private.pem'),pub:join(tmp,'founder-public.pem'),
 sig:join(tmp,'detached-evidence.json'),clean(){rmSync(tmp,{recursive:true,force:true})}};
}
test('T069/T074 trusted Ed25519 evidence attestation requires explicit Founder consent',()=>{
 const x=setup();try{
  assert.throws(()=>attest(x.root,x.priv,x.sig),/EXPLICIT_SIGN/);
  const a=attest(x.root,x.priv,x.sig,{confirmation:'JANTA_BOL_OFFLINE_SIGN_ONLY'});
  const v=verifyTrusted(x.root,x.sig,x.pub);
  assert.equal(v.manifest_sha256,a.manifest_sha256);
  assert.equal(v.storage_count,2);
  assert.equal(v.real_postgres_restore_proved,false);
  assert.equal(v.source_authenticated,true);
 }finally{x.clean()}
});
test('T073 tampering with raw bytes cannot reuse trusted detached signer',()=>{
 const x=setup();try{
  attest(x.root,x.priv,x.sig,{confirmation:'JANTA_BOL_OFFLINE_SIGN_ONLY'});
  writeFileSync(join(x.root,'storage/public-media/cover.jpg'),'TAMPERED');
  assert.throws(()=>verifyTrusted(x.root,x.sig,x.pub),/FILE_HASH_OR_IDENTITY/);
 }finally{x.clean()}
});
test('T073 attacker forging all local SHA checks cannot forge independently signed manifest',()=>{
 const x=setup();try{
  attest(x.root,x.priv,x.sig,{confirmation:'JANTA_BOL_OFFLINE_SIGN_ONLY'});
  const path=join(x.root,MANIFEST),m=JSON.parse(readFileSync(path,'utf8'));
  const note=m.files.find(f=>f.path==='storage/public-media/cover.jpg');
  const fake='FAKE_MEDIA_ATTACK';
  writeFileSync(join(x.root,note.path),fake);
  const {createHash}=requireHash();
  note.size=Buffer.byteLength(fake);
  note.sha256=createHash('sha256').update(fake).digest('hex');
  writeFileSync(path,JSON.stringify(m));
  assert.equal(verify(x.root).storage_count,2);
  assert.throws(()=>verifyTrusted(x.root,x.sig,x.pub),/SIGNATURE_FORMAT_OR_IDENTITY_MISMATCH/);
 }finally{x.clean()}
});
function requireHash(){return {createHash:(...args)=>newHash(...args)}}
import {createHash as newHash} from 'node:crypto';
test('T073 signer must match independent trusted key, not attacker-provided unsigned key',()=>{
 const a=setup(),b=setup();try{
  attest(a.root,a.priv,a.sig,{confirmation:'JANTA_BOL_OFFLINE_SIGN_ONLY'});
  assert.throws(()=>verifyTrusted(a.root,a.sig,b.pub),/UNTRUSTED_SIGNER/);
 }finally{a.clean();b.clean()}
});
test('T074 sensitive signing key must not be stored under archived bundle',()=>{
 const x=setup();try{
  const dest=join(x.root,'identity/owner-private.pem');
  writeFileSync(dest,'FAKE');
  assert.throws(()=>attest(x.root,dest,x.sig,{confirmation:'JANTA_BOL_OFFLINE_SIGN_ONLY'}));
 }finally{x.clean()}
});
test('T073 refuses to overwrite immutable signature file',()=>{
 const x=setup();try{
  attest(x.root,x.priv,x.sig,{confirmation:'JANTA_BOL_OFFLINE_SIGN_ONLY'});
  assert.throws(()=>attest(x.root,x.priv,x.sig,{confirmation:'JANTA_BOL_OFFLINE_SIGN_ONLY'}),/SIGNATURE_IMMUTABLE/);
 }finally{x.clean()}
});
test('T074 signer is cryptographic evidence, not a claim of live DB/media restoration',()=>{
 const x=setup();try{
  attest(x.root,x.priv,x.sig,{confirmation:'JANTA_BOL_OFFLINE_SIGN_ONLY'});
  const result=verifyTrusted(x.root,x.sig,x.pub);
  assert.equal(result.real_postgres_restore_proved,false);
 }finally{x.clean()}
});
