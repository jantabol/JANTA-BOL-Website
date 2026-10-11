import {test} from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {linkB7VerifiedPrivateMedia} from '../../CODEX_CURRENT_SUPABASE/functions/_shared/b7-media-coordinator.mjs';
import {RAW,DERIV} from '../../CODEX_CURRENT_SUPABASE/functions/_shared/b7-private-media-stage.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const creative='22222222-2222-4222-8222-222222222222';
const campaign='33333333-3333-4333-8333-333333333333';
const owner='11111111-1111-4111-8111-111111111111';
const bits=new Uint8Array(50).fill(55),clean=new Uint8Array(60).fill(11);
const hash=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)))
.map(v=>v.toString(16).padStart(2,'0')).join('');
async function fixture(overrides={}){
 const objects=new Map(),records=new Map(),events=[];
 const input={token:'X'.repeat(100),creativeId:creative,ownerId:owner,
  bytes:bits,name:'ad.png',mime:'image/png'};
 const valid={id:creative,campaign_id:campaign,creative_type:'image',
  approved:false,version:2,latest_version:2,campaign_status:'requested'};
 const data={
 authorize:async()=>true,getDraft:async()=>({...valid}),
 convert:async()=>({status:'PRIVATE_SANITIZED_PREVIEW_NOT_UPLOADED_NOT_APPROVED',
  canApprove:false,canPublish:false,width:800,height:300,contentType:'image/png',
  privatePreviewPng:clean,sourceSha256:await hash(bits),derivativeSha256:await hash(clean)}),
 store:{
  checkPrivate:async b=>b===RAW||b===DERIV,
  createOnly:async(b,p,bytes)=>{if(objects.has(b+'/'+p))return false;
   objects.set(b+'/'+p,new Uint8Array(bytes));return true;},
  readPrivate:async(b,p)=>objects.get(b+'/'+p)
 },
 recordReceipt:async row=>{records.set(row.asset_id,{
  ...row,approval_state:'private_quarantined'});return true;},
 readReceipt:async id=>records.get(id),
 appendOrphan:async event=>{events.push(event);return true;},
 allocateId:()=> '44444444-4444-4444-8444-444444444444',...overrides
 };
 return {input,data,records,events,objects};
}
test('Readback proof binds private image and original canonical latest creative to immutable receipt, NOT approval',async()=>{
 const f=await fixture();
 const result=await linkB7VerifiedPrivateMedia(f.input,f.data);
 assert.equal(result.state,'VERIFIED_PRIVATE_EVIDENCE_ONLY');
 assert.equal(result.publishable,false);assert.equal(result.approved,false);
 assert.equal(f.events.length,0);assert.equal(f.records.size,1);
 const v=[...f.records.values()][0];
 assert.equal(v.owner_user_id,owner);assert.equal(v.creative_id,creative);
 assert.equal(v.campaign_id,campaign);assert.equal(v.creative_version,2);
 assert.equal(v.source_sha256,await hash(bits));assert.equal(v.derivative_sha256,await hash(clean));
 assert.equal(v.source_bucket,RAW);assert.equal(v.derivative_bucket,DERIV);
 assert.equal(v.approval_state,'private_quarantined');
});
test('Unauthenticated or stale approved, wrong source creative is denied BEFORE upload',async()=>{
 for(const changes of [
  {authorize:async()=>false},
  {getDraft:async()=>({...{id:creative,campaign_id:campaign,creative_type:'image',approved:true,version:2,latest_version:2,campaign_status:'requested'}})},
  {getDraft:async()=>({id:creative,campaign_id:campaign,creative_type:'image',approved:false,version:2,latest_version:3,campaign_status:'requested'})},
  {getDraft:async()=>({id:creative,campaign_id:campaign,creative_type:'video',approved:false,version:2,latest_version:2,campaign_status:'requested'})}
 ]){
  const f=await fixture(changes);
  await assert.rejects(linkB7VerifiedPrivateMedia(f.input,f.data),/B7_MEDIA_COORD_/);
  assert.equal(f.objects.size,0);
 }
});
test('Owner session revoked after upload triggers durable orphan event, NO receipt',async()=>{
 let count=0;
 const f=await fixture({authorize:async()=>++count<4});
 await assert.rejects(linkB7VerifiedPrivateMedia(f.input,f.data),/PRIVATE_EVIDENCE_NOT_COMPLETE/);
 assert.equal(f.records.size,0);assert.equal(f.events.length,1);assert.equal(f.objects.size,2);
});
test('Creative latest version changed during decode aborts and requires orphan audit',async()=>{
 let count=0;
 const f=await fixture({getDraft:async()=>{
  count++;return {id:creative,campaign_id:campaign,creative_type:'image',
   approved:false,version:2,latest_version:count===1?2:3,campaign_status:'requested'}
 }});
 await assert.rejects(linkB7VerifiedPrivateMedia(f.input,f.data),/PRIVATE_EVIDENCE_NOT_COMPLETE/);
 assert.equal(f.records.size,0);assert.equal(f.events[0].reason,'RECEIPT_OR_OWNER_STATE_FAILED');
});
test('DB insert false or forged receipt readback never masquerades as success',async()=>{
 for(const override of [
  {recordReceipt:async()=>false},
  {readReceipt:async()=>({asset_id:'forged',approval_state:'private_quarantined'})}
 ]){
  const f=await fixture(override);
  await assert.rejects(linkB7VerifiedPrivateMedia(f.input,f.data),/PRIVATE_EVIDENCE_NOT_COMPLETE/);
  assert.equal(f.events.length,1);
 }
});
test('Orphan sink failure after successful private Storage or DB conflict fails closed',async()=>{
 const f=await fixture({recordReceipt:async()=>{throw Error('connection lost')},
  appendOrphan:async()=>false});
 await assert.rejects(linkB7VerifiedPrivateMedia(f.input,f.data),/ORPHAN_NOT_DURABLY_RECORDED/);
 assert.equal(f.records.size,0);assert.equal(f.objects.size,2);
});
