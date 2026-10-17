import {test} from 'node:test';
import assert from 'node:assert/strict';
import {processPrivateEvidence,detectMime,MAX_PRIVATE_UPLOAD_BYTES}
 from '../../CODEX_CURRENT_SUPABASE/functions/_shared/b8-private-evidence-gateway.mjs';

const CASE='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const INTENT='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const USER='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const RECEIPT='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const TOKEN='verified-jwt-only-in-disposable-unit-test';
const png=new Uint8Array([137,80,78,71,13,10,26,10,1,2,3,4,5,6,7,8]);
const pdf=new Uint8Array([37,80,68,70,45,49,46,55,10,37,100,101,109,111]);
const make=(opt={})=>{
 const calls=[];
 const storage=new Map();
 const f={
  authenticate:async token=>{calls.push('auth');return opt.user===undefined?USER:opt.user;},
  prepare:async arg=>{calls.push('prepare');return opt.intentId??INTENT;},
  getIntent:async id=>{calls.push('lookup');return {
   intent_id:INTENT,case_id:opt.boundCase??CASE,reporter_user_id:opt.boundUser??USER,
   object_key:`b8/cases/${CASE}/${INTENT}.bin`,mime:opt.boundMime??'image/png',
   byte_count:opt.boundSize??png.length};},
  upload:async({key,bytes,upsert})=>{
   calls.push('upload');assert.equal(upsert,false);
   if(opt.failUpload)throw Error('storage API down');
   assert(!storage.has(key));
   storage.set(key,new Uint8Array(bytes));},
  readback:async({key})=>{
   calls.push('readback');const bytes=storage.get(key);
   if(opt.mismatch)return new Uint8Array([0,1,2,3,4,5,6,7]);
   return bytes;},
  remove:async({key})=>{calls.push('remove');if(opt.failRemove)throw Error('failed');storage.delete(key);},
  finalize:async arg=>{calls.push('finalize');
   assert.match(arg.sha256,/^[0-9a-f]{64}$/);
   if(opt.failFinalize)throw Error('expired');
   return RECEIPT;},
  orphan:async o=>{calls.push('orphan:'+o.reason);return true;}
 };
 return {calls,storage,f};
};
const send=async f=>processPrivateEvidence({
 token:TOKEN,caseId:CASE,label:'Synthetic page with source date',
 mime:'image/png',bytes:png,...f
});
test('PNG, PDF header recognized and disguised HTML not permitted',()=>{
 assert.equal(detectMime(png),'image/png');
 assert.equal(detectMime(pdf),'application/pdf');
 assert.equal(detectMime(new TextEncoder().encode('<script>hello</script>')),null);
 assert.equal(MAX_PRIVATE_UPLOAD_BYTES,8388608);
});
test('Verified private upload: actor scoped, server path, fresh upload, readback and SHA-256; no URL',async()=>{
 const {calls,f,storage}=make();
 const res=await send(f);
 assert.equal(res.ok,true);
 assert.equal(res.proof,'PRIVATE_READBACK_SHA256_ONLY');
 assert.equal(res.documentaryAuthenticityVerified,false);
 assert.equal(res.receiptId,RECEIPT);
 assert.deepEqual(calls,['auth','prepare','lookup','upload','readback','finalize']);
 assert(!('url' in res));
 assert.equal(storage.size,1);
});
test('Actor/case/mime/size intent mismatch fails before private bucket write',async()=>{
 for(const o of [{user:'ffffffff-ffff-4fff-8fff-ffffffffffff'},
 {boundCase:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'},
 {boundUser:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'},
 {boundSize:20},{boundMime:'application/pdf'}]){
  const {f,calls}=make(o);
  await assert.rejects(send(f),/INTENT_BOUNDARY/);
  assert(!calls.includes('upload'));
 }
});
test('MIME spoof and unacceptable file sizes rejected before prepare or upload',async()=>{
 const {f,calls}=make();
 await assert.rejects(processPrivateEvidence({
 token:TOKEN,caseId:CASE,label:'Safe incoming file',
 mime:'image/png',bytes:pdf,...f
 }),/MAGIC_MISMATCH/);
 await assert.rejects(processPrivateEvidence({
 token:TOKEN,caseId:CASE,label:'Safe incoming file',
 mime:'image/png',bytes:new Uint8Array(8388609),...f
 }),/FILE_SIZE_DENIED/);
 assert.equal(calls.length,0);
});
test('Unknown/revoked token is fail-closed and does not create a storage object',async()=>{
 const {f,calls}=make({user:null});
 await assert.rejects(send(f),/AUTH_REQUIRED/);
 assert.deepEqual(calls,['auth']);
});
test('Tampered storage readback is NOT finalized, object cleaned, orphan audit written',async()=>{
 const {f,calls,storage}=make({mismatch:true});
 await assert.rejects(send(f),/SAFE_PRIVATE_INGRESS_FAILED/);
 assert.equal(storage.size,0);
 assert(!calls.includes('finalize'));
 assert(calls.includes('orphan:PRIVATE_READBACK_FAILED'));
});
test('RPC finalization error deletes private object, never returns false verification',async()=>{
 const {f,calls,storage}=make({failFinalize:true});
 await assert.rejects(send(f),/SAFE_PRIVATE_INGRESS_FAILED/);
 assert.equal(storage.size,0);assert(calls.includes('remove'));
 assert(calls.includes('orphan:FINALIZE_REJECTED'));
});
test('Failed cleanup is a loud reconciliation blocker, not a fake PASS',async()=>{
 const {f,calls}=make({mismatch:true,failRemove:true});
 await assert.rejects(send(f),/CLEANUP_FAILED_REQUIRE_OWNER_RECONCILIATION/);
 assert(calls.includes('orphan:CLEANUP_FAILED'));
 assert(!calls.includes('finalize'));
});
test('Storage write error never finalizes or claims upload succeeded',async()=>{
 const {f,calls}=make({failUpload:true});
 await assert.rejects(send(f),/SAFE_PRIVATE_INGRESS_FAILED/);
 assert(!calls.includes('finalize'));
});
