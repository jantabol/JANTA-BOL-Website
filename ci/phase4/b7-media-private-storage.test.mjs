import {test} from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {stageB7Image,RAW,DERIV} from '../../CODEX_CURRENT_SUPABASE/functions/_shared/b7-private-media-stage.mjs';
import {b7SupabasePrivateStore} from '../../CODEX_CURRENT_SUPABASE/functions/_shared/b7-supabase-private-store.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const src=Uint8Array.from({length:40},(_,i)=>i);
const png=Uint8Array.from({length:50},(_,i)=>i+1);
const sha=async x=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',x))].map(n=>n.toString(16).padStart(2,'0')).join('');
async function fixture(overrides={}){
 const objects=new Map(),writes=[],orphans=[];
 const store={
  checkPrivate:async b=>[RAW,DERIV].includes(b),
  createOnly:async(b,p,bytes,mime)=>{
   writes.push({b,p,mime});if(objects.has(b+p))return false;
   objects.set(b+p,Uint8Array.from(bytes));return true;},
  readPrivate:async(b,p)=>objects.get(b+p)
 };
 const dep={authorize:async()=>true,convert:async()=>({
  status:'PRIVATE_SANITIZED_PREVIEW_NOT_UPLOADED_NOT_APPROVED',canApprove:false,canPublish:false,
  contentType:'image/png',width:500,height:200,privatePreviewPng:png,
  sourceSha256:await sha(src),derivativeSha256:await sha(png)
 }),store,onOrphan:async x=>{orphans.push(x);return true;},
 allocateId:()=> '44444444-4444-4444-8444-444444444444',...overrides};
 return {input:{token:'t'.repeat(80),bytes:src,name:'sample.png',mime:'image/png'},dep,objects,writes,orphans};
}
test('raw and clean quarantine remain private, unique and are verified by storage readback',async()=>{
 const o=await fixture(),r=await stageB7Image(o.input,o.dep);
 assert.equal(r.verifiedReadback,true);assert.equal(r.approved,false);assert.equal(r.publishable,false);
 assert.equal(r.state,'PRIVATE_QUARANTINE_NOT_REGISTERED');
 assert.equal(r.source.bucket,RAW);assert.equal(r.derivative.bucket,DERIV);
 assert.equal(r.source.sha256,await sha(src));assert.equal(r.derivative.sha256,await sha(png));
 assert.equal(o.writes.length,2);assert(!JSON.stringify(r).includes('publicUrl'));
});
test('nonowner and forged output never write to storage',async()=>{
 const a=await fixture({authorize:async()=>false});
 await assert.rejects(stageB7Image(a.input,a.dep),/OWNER_AAL2_REQUIRED/);assert.equal(a.writes.length,0);
 const b=await fixture({convert:async()=>({canApprove:true})});
 await assert.rejects(stageB7Image(b.input,b.dep),/SANITIZER_RECEIPT_REJECTED/);assert.equal(b.writes.length,0);
 const c=await fixture({convert:async()=>({status:'PRIVATE_SANITIZED_PREVIEW_NOT_UPLOADED_NOT_APPROVED',canApprove:false,canPublish:false,contentType:'image/png',width:10,height:10,privatePreviewPng:png,sourceSha256:'0'.repeat(64),derivativeSha256:await sha(png)})});
 await assert.rejects(stageB7Image(c.input,c.dep),/DIGEST_MISMATCH/);assert.equal(c.writes.length,0);
});
test('private bucket missing means no fallback to public-media/editorial/grievance',async()=>{
 const o=await fixture();o.dep.store.checkPrivate=async b=>b===RAW;
 await assert.rejects(stageB7Image(o.input,o.dep),/PRIVATE_BUCKET_REQUIRED/);
 assert.equal(o.writes.length,0);
});
test('corrupted original or derivative readback aborts, writes orphan audit, never approves',async()=>{
 for(const corruptIndex of [1,2]){
  const o=await fixture();let n=0;const originalGet=o.dep.store.readPrivate;
  o.dep.store.readPrivate=async(b,p)=>{n++;return n===corruptIndex?Uint8Array.of(7):originalGet(b,p)};
  await assert.rejects(stageB7Image(o.input,o.dep),/PRIVATE_STORAGE_UNVERIFIED/);
  assert.equal(o.orphans.length,1);assert(o.orphans[0].objects.length>=1);
 }
});
test('orphan audit failure cannot silently succeed',async()=>{
 const o=await fixture({onOrphan:async()=>false});
 o.dep.store.readPrivate=async()=>Uint8Array.of(2);
 await assert.rejects(stageB7Image(o.input,o.dep),/DURABLE_ORPHAN_AUDIT_REQUIRED/);
});
test('private Supabase adapter guards public bucket, path, immutable upsert:false',async()=>{
 const m=new Map(),uploads=[],storage={
  async getBucket(id){return {data:{id,public:false,file_size_limit:8388608},error:null};},
  from(bucket){return {
   async upload(path,blob,options){
    uploads.push({bucket,path,options});const k=bucket+path;
    if(m.has(k))return {error:{message:'duplicate'}};
    m.set(k,new Uint8Array(await blob.arrayBuffer()));return {error:null};},
   async download(path){const bytes=m.get(bucket+path);return bytes?{data:new Blob([bytes]),error:null}:{data:null,error:'missing'};}
  }}
 };
 const store=b7SupabasePrivateStore({storage});
 const o=await fixture({store});const r=await stageB7Image(o.input,o.dep);
 assert.equal(r.approved,false);assert.equal(uploads.length,2);
 assert(uploads.every(x=>x.options.upsert===false&&x.options.cacheControl==='0'));
 await assert.rejects(store.createOnly('public-media','anything',png,'image/png'),/BUCKET_NOT_ALLOWED/);
 await assert.rejects(store.createOnly(RAW,'../unsafe',png,'image/png'),/PATH_NOT_ALLOWED/);
 storage.getBucket=async id=>({data:{id,public:true,file_size_limit:8388608},error:null});
 assert.equal(await store.checkPrivate(RAW),false);
});
