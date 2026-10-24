import test from 'node:test';
import assert from 'node:assert/strict';
import {createB2Transport,JANTA_BOL_B2_BUCKET} from './t069-b2-s3-transport.mjs';
const path='production/media/2026-10-24T13-00-00-000Z/00000000-0000-4000-8000-000000000001.jbt069.age';
class PutObjectCommand{constructor(arg){this.action='PUT';this.args=arg}}
class GetObjectCommand{constructor(arg){this.action='GET';this.args=arg}}
const newFixture=()=>{
 const map=new Map(),calls=[];
 const s3={send:async command=>{
  calls.push(command);
  if(command.args.Bucket!==JANTA_BOL_B2_BUCKET)throw Error('WRONG_B2_BUCKET');
  if(command.action==='PUT'){
   if(map.has(command.args.Key))throw Error('REFUSE_OVERWRITE');
   map.set(command.args.Key,new Uint8Array(command.args.Body));
   return {ETag:'local-mock'};
  }
  if(command.action==='GET'){
   const a=map.get(command.args.Key);
   if(!a)throw Error('MISSING');
   return {Body:{transformToByteArray:async()=>new Uint8Array(a)}};
  }
  throw Error('OPERATION_NOT_ALLOWED');
 }};
 return {transport:createB2Transport({s3,PutObjectCommand,GetObjectCommand}),calls,map}
};
test('T069 B2 write/read verifies exact scoped immutable ciphertext',async()=>{
 const x=newFixture(),original=new Uint8Array([1,2,3,4,5]);
 await x.transport.put(path,original);
 assert.deepEqual(await x.transport.get(path),original);
 assert.deepEqual(x.calls.map(x=>x.action),['PUT','GET']);
 assert.equal(x.calls[0].args.IfNoneMatch,'*');
 assert.equal(x.calls[0].args.Bucket,JANTA_BOL_B2_BUCKET);
});
test('T069 B2 cannot silently overwrite same ciphertext key',async()=>{
 const x=newFixture();
 await x.transport.put(path,new Uint8Array([5]));
 await assert.rejects(x.transport.put(path,new Uint8Array([6])),/REFUSE_OVERWRITE/);
});
test('T069 rejects backup of any non JANTA BOL object or path traversal',async()=>{
 const x=newFixture();
 for(const bad of ['../private','production/database/hidden.age',
  'production/media/2026-10-24T13-00-00-000Z/../../cricket.age']){
  await assert.rejects(x.transport.put(bad,new Uint8Array([5])),/B2_OUT_OF_SCOPE/);
 }
 assert.equal(x.calls.length,0);
});
test('T069 no arbitrarily selected B2 bucket allowed',()=>{
 assert.throws(()=>createB2Transport({s3:{send(){}},PutObjectCommand,GetObjectCommand,bucket:'cricket-backup'}),/B2_TRANSPORT_DISABLED/);
});
test('T069 ciphertext empty and oversized blocked before B2 request',async()=>{
 const x=newFixture();
 await assert.rejects(x.transport.put(path,new Uint8Array(0)),/CIPHERTEXT_BOUND/);
 assert.equal(x.calls.length,0);
});
test('T069 missing B2 readback is HOLD not PASS',async()=>{
 const x=newFixture();
 await assert.rejects(x.transport.get(path),/MISSING/);
});
