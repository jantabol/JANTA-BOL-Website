import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import * as age from 'age-encryption';
import {encryptedB2MediaRoundTrip,verifyBundle} from './t069-media-age-b2-roundtrip.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const original=[
 ['grievance-private','case1/evidence1.pdf','privacy-a'],
 ['grievance-private','case1/evidence2.pdf','privacy-b'],
 ['private-editorial','draft/original.png','private-editorial'],
 ['public-media','article/cover.jpg','public-cover'],
 ['public-media','article/second.jpg','public-more']
];
const uuid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
let n=0;const reference=original.map(([bucket,path,value])=>({
 bucket,path,id:uuid(++n),updated_at:'2026-10-24T13:00:00Z',
 size:new TextEncoder().encode(value).length
}));
const values=new Map(original.map(([bucket,path,value])=>[bucket+'/'+path,new TextEncoder().encode(value)]));
const SHA=b=>createHash('sha256').update(b).digest('hex');
function input({rows=reference,overrides={},mutateStore=false,drift=false}={}){
 const storage=new Map();let uploads=0,gets=0,calls=0,readCalls=0;
 return {
  async args(){
   const founder=await age.generateIdentity(),recipient=await age.identityToRecipient(founder);
   return {
    inventory:async()=>{calls++;return structuredClone(drift&&calls===2?[...rows].reverse().slice(1):rows)},
    readOriginal:async(d)=>{readCalls++;return values.get(d.bucket+'/'+d.path)??new Uint8Array(0)},
    age,founderRecipient:recipient,
    b2:{
      put:async(key,blob)=>{uploads++;if(overrides.failPut)throw Error('OFFSITE_PUT_FAILED');assert.match(key,/^production\/media\/.+\.jbt069\.age$/);if(storage.has(key))throw Error('OVERWRITE');storage.set(key,new Uint8Array(blob))},
      get:async(key)=>{gets++;if(overrides.failGet)throw Error('OFFSITE_GET_FAILED');const a=storage.get(key);if(!a)throw Error('NOT_FOUND');if(mutateStore){const b=new Uint8Array(a);b[b.length-1]^=1;return b}return new Uint8Array(a)}
    },
    now:()=>new Date('2026-10-24T13:00:00Z'),
    uuid:()=>uuid(95)
   };
  },
  get stats(){return {uploads,gets,calls,readCalls}},
  storage
 };
}
test('T069 real AGE multi-recipient B2 ciphertext upload, readback, decrypted full original 5 files',async()=>{
 const x=input(),args=await x.args();
 const proof=await encryptedB2MediaRoundTrip(args);
 assert.equal(proof.status,'OFFSITE_ENCRYPTED_ORIGINAL_BYTES_RESTORED');
 assert.equal(proof.objects,5);
 assert.equal(proof.origin,'JANTA_BOL_ONLY');
 assert.equal(proof.atomic_db_snapshot,false);
 assert.equal(proof.cipher_sha256,SHA(x.storage.get(proof.b2_object_key)));
 assert.deepEqual(x.stats,{uploads:1,gets:1,calls:2,readCalls:5});
 const recipientProof=await age.generateIdentity(); // unrelated private key cannot decrypt
 const fail=new age.Decrypter();fail.addIdentity(recipientProof);
 await assert.rejects(fail.decrypt(x.storage.get(proof.b2_object_key)));
});
test('T069 founder long-term AGE private identity independently decrypts uploaded ciphertext',async()=>{
 const founder=await age.generateIdentity(),recipient=await age.identityToRecipient(founder);
 const x=input(),args=await x.args();args.founderRecipient=recipient;
 const proof=await encryptedB2MediaRoundTrip(args);
 const d=new age.Decrypter();d.addIdentity(founder);
 const raw=await d.decrypt(x.storage.get(proof.b2_object_key));
 assert.equal(SHA(raw),proof.archive_sha256);
 assert.equal(new TextDecoder().decode(raw.slice(0,8)),'JBT06901');
});
test('T069 B2 readback corruption is a hard failure, never PASS',async()=>{
 const x=input({mutateStore:true});
 await assert.rejects(encryptedB2MediaRoundTrip(await x.args()),/T069_FAIL_CLOSED/);
});
test('T069 missing private grievance folder blocks backup and remote write',async()=>{
 const x=input({rows:reference.filter(x=>x.bucket!=='grievance-private')});
 await assert.rejects(encryptedB2MediaRoundTrip(await x.args()),/T069_FAIL_CLOSED/);
 assert.equal(x.stats.uploads,0);
});
test('T069 inventory changed during transfer blocks remote write',async()=>{
 const x=input({drift:true});
 await assert.rejects(encryptedB2MediaRoundTrip(await x.args()),/T069_FAIL_CLOSED/);
 assert.equal(x.stats.uploads,0);
});
test('T069 missing bytes refuse to upload incomplete archive',async()=>{
 const x=input();const a=await x.args();a.readOriginal=async()=>new Uint8Array(0);
 await assert.rejects(encryptedB2MediaRoundTrip(a),/T069_FAIL_CLOSED/);
 assert.equal(x.stats.uploads,0);
});
test('T069 unauthorised fourth bucket refused and never uploaded',async()=>{
 const x=input({rows:[...reference,{...reference[0],bucket:'cricket-private',path:'score'}]});
 await assert.rejects(encryptedB2MediaRoundTrip(await x.args()),/T069_FAIL_CLOSED/);
 assert.equal(x.stats.uploads,0);
});
test('T069 path traversal rejected without object read',async()=>{
 const x=input({rows:reference.map((d,i)=>i===0?{...d,path:'../secrets'}:d)});
 await assert.rejects(encryptedB2MediaRoundTrip(await x.args()),/T069_FAIL_CLOSED/);
 assert.equal(x.stats.readCalls,0);
});
test('T069 B2 upload failure is not success',async()=>{
 const x=input({overrides:{failPut:true}});
 await assert.rejects(encryptedB2MediaRoundTrip(await x.args()),/OFFSITE_PUT_FAILED/);
 assert.equal(x.stats.gets,0);
});
test('T069 B2 failed readback cannot report an intact backup',async()=>{
 const x=input({overrides:{failGet:true}});
 await assert.rejects(encryptedB2MediaRoundTrip(await x.args()),/OFFSITE_GET_FAILED/);
});
test('T069 malformed decrypted archive is never trusted',async()=>{
 await assert.rejects(verifyBundle(new Uint8Array([1,2,3,4]),[]),/T069_FAIL_CLOSED/);
});
test('T069 invalid Founder recipient refused before any Storage read',async()=>{
 const x=input(),a=await x.args();a.founderRecipient='not-an-age-recipient';
 await assert.rejects(encryptedB2MediaRoundTrip(a),/T069_FAIL_CLOSED/);
 assert.equal(x.stats.calls,0);assert.equal(x.stats.readCalls,0);
});
