import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,mkdir,writeFile,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {verifyRecoveredMediaBytes} from './t070-media-byte-verifier.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
async function fixture(fn){
 const root=await mkdtemp(join(tmpdir(),'t070-fake-media-'));
 const path='demo/evidence.bin',bucket='grievance-private',data=Buffer.from('SYNTHETIC_ONLY_T070');
 const directory=join(root,bucket,'demo');
 const file=join(directory,'evidence.bin');
 const expected=[{bucket,path,sha256:hash(data),bytes:data.length}];
 try{
  await mkdir(directory,{recursive:true});
  await writeFile(file,data);
  return await fn({root,expected,file,directory});
 }finally{await rm(root,{recursive:true,force:true})}
}
test('T070 G2 synthetic disconnected byte-read digest and exact length success only',()=>fixture(async p=>{
 const r=await verifyRecoveredMediaBytes(p);
 assert.equal(r.verified_objects,1);
 assert.equal(r.verified_bytes,Buffer.byteLength('SYNTHETIC_ONLY_T070'));
 assert.equal(r.final_t070_pass,false);
 assert.equal(r.scope,'DISCONNECTED_RECOVERED_FILES_ONLY');
 assert.match(r.inventory_sha256,/^[0-9a-f]{64}$/);
}));
test('T070 G2 rejects changed bytes even if file size identical',()=>fixture(async p=>{
 await writeFile(p.file,'SYNTHETIC_ONLY_T071');
 await assert.rejects(()=>verifyRecoveredMediaBytes(p),/T070_MEDIA_HOLD_BYTES_MISMATCH/);
}));
test('T070 G2 rejects missing recovered object',()=>fixture(async p=>{
 await rm(p.file);
 await assert.rejects(()=>verifyRecoveredMediaBytes(p),/T070_MEDIA_HOLD_OBJECT_MISSING/);
}));
test('T070 G2 rejects malformed or empty inventories and path traversal',()=>fixture(async p=>{
 for(const expected of [[],[{...p.expected[0],path:'../secret.txt'}],
  [{...p.expected[0],path:'nested/../../secret.txt'}],
  [{...p.expected[0],path:'/root.txt'}],
  [...p.expected,...p.expected]]){
  await assert.rejects(()=>verifyRecoveredMediaBytes({root:p.root,expected}),/T070_MEDIA_HOLD_/);
 }
}));
test('T070 G2 rejects wrong bucket, digest and size claims',()=>fixture(async p=>{
 for(const entry of [
  {...p.expected[0],bucket:'cricket-private'},
  {...p.expected[0],sha256:'b'.repeat(64)},
  {...p.expected[0],bytes:1}
 ]){
  await assert.rejects(()=>verifyRecoveredMediaBytes({root:p.root,expected:[entry]}),/T070_MEDIA_HOLD_/);
 }
}));
test('T070 G2 refuses symlinked recovered object',()=>fixture(async p=>{
 const target=join(p.root,'target.bin');await writeFile(target,'SYNTHETIC_ONLY_T070');
 await rm(p.file);await symlink(target,p.file);
 await assert.rejects(()=>verifyRecoveredMediaBytes(p),/T070_MEDIA_HOLD_SYMLINK/);
}));
test('T070 G2 refuses symlinked parent directory',()=>fixture(async p=>{
 const external=join(p.root,'other');await mkdir(external);
 await rm(p.directory,{recursive:true});await symlink(external,p.directory,'dir');
 await assert.rejects(()=>verifyRecoveredMediaBytes(p),/T070_MEDIA_HOLD_SYMLINK/);
}));
test('T070 G2 refuses relative root and never labels synthetic test real E8',()=>fixture(async p=>{
 await assert.rejects(()=>verifyRecoveredMediaBytes({...p,root:'./test'}),/T070_MEDIA_HOLD_ROOT/);
 const r=await verifyRecoveredMediaBytes(p);assert.equal(r.final_t070_pass,false);
}));
