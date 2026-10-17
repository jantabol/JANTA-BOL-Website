import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {prepareB7PublicRelease,CLEAN_PUBLIC_BUCKET}
 from '../../CODEX_CURRENT_SUPABASE/functions/_shared/b7-public-release-worker.mjs';
const cid='22222222-2222-4222-8222-222222222222';
const campaign='33333333-3333-4333-8333-333333333333';
const owner='11111111-1111-4111-8111-111111111111';
const aid='44444444-4444-4444-8444-444444444444';
const hash=x=>createHash('sha256').update(x).digest('hex');
function f(kind='video',changes={}){
 const src=new Uint8Array(64).fill(20),poster=new Uint8Array(65).fill(18);
 const h=hash(src),p=hash(poster),obj=new Map(),out=new Map(),events=[];
 obj.set((kind==='video'?'jb-ad-videos-private':'jb-ad-previews-private')+
  '/staged/'+aid+'/'+h+(kind==='video'?'.mp4':'.png'),src);
 if(kind==='video')obj.set('jb-ad-video-posters-private/staged/'+aid+'/'+p+'.png',poster);
 const intent={action:'B7_EXPLICIT_MEDIA_RELEASE_V1',creativeId:cid,assetId:aid,version:2};
 const input={token:'SYNTHETIC_JWT',creativeId:cid,assetId:aid,approvalIntent:intent};
 const record={asset_id:aid,creative_id:cid,campaign_id:campaign,
  creative_version:2,owner_user_id:owner,approval_state:'private_quarantined',
  derivative_path:'staged/'+aid+'/'+h+'.png',derivative_sha256:h,
  video_path:'staged/'+aid+'/'+h+'.mp4',video_sha256:h,
  poster_path:'staged/'+aid+'/'+p+'.png',poster_sha256:p};
 let calls=0,readCount=0,recorded=null;
 const dep={
  verifyOwner:async()=>{calls++;return changes.revokeAt===calls?null:owner;},
  loadCreative:async()=>{readCount++;return {id:cid,campaign_id:campaign,
    creative_type:kind,approved:false,version:2,latest_version:
    changes.staleAt===readCount?3:2,campaign_status:'requested'};},
  loadReceipt:async()=>({...record}),
  readPrivate:async(b,p)=>changes.corrupt===true?new Uint8Array(40):obj.get(b+'/'+p),
  checkPublicBucket:async b=>b===CLEAN_PUBLIC_BUCKET&&!changes.publicBucketInvalid,
  putPublicCreateOnly:async(b,p,bytes,mime)=>{
   const key=b+'/'+p;if(out.has(key))return false;
   out.set(key,new Uint8Array(bytes));return true;},
  readPublic:async(b,p)=>changes.badReadback?new Uint8Array(40):out.get(b+'/'+p),
  recordRelease:async x=>{
   if(changes.noLedger)return false;
   recorded={...x};return true;},
  readRelease:async()=>changes.forgedLedger?{asset_id:'wrong'}:recorded,
  auditOrphan:async x=>{events.push(x);return !changes.failAudit;}
 };
 return {input,dep,out,events,get authCalls(){return calls;},get recorded(){return recorded}};
}
test('EXPLICIT Owner releases only hashed sanitized VIDEO & POSTER, never original or Approval',async()=>{
 const x=f();
 const r=await prepareB7PublicRelease(x.input,x.dep);
 assert.equal(r.approved,false);assert.equal(r.publishable,false);
 assert.equal(r.privateOriginalNeverCopied,true);
 assert.equal(x.out.size,2);assert.equal(x.events.length,0);
 assert.equal(x.authCalls,3);
 const pub=[...x.out.keys()];
 assert(pub.every(s=>s.startsWith(CLEAN_PUBLIC_BUCKET+'/creative/'+cid+'/')));
 assert(pub.some(s=>s.endsWith('.mp4'))&&pub.some(s=>s.endsWith('.png')));
 assert.equal(x.recorded.approval_state,'awaiting_atomic_owner_approval');
 assert.equal(x.recorded.poster_sha256.length,64);
});
test('IMAGE public release contains one cleaned PNG, no untrusted original',async()=>{
 const x=f('image');const r=await prepareB7PublicRelease(x.input,x.dep);
 assert.equal(r.approved,false);assert.equal(x.out.size,1);
 assert.equal(x.recorded.poster_path,null);
 assert([...x.out.keys()][0].endsWith('.png'));
});
test('Missing EXPLICIT Owner consent, wrong version or unsafe bucket forbids public writes',async()=>{
 for(const cfg of [
  {intent:{action:'PREVIEW_ONLY'}},
  {intent:{action:'B7_EXPLICIT_MEDIA_RELEASE_V1',creativeId:cid,assetId:aid,version:999}},
  {deps:{publicBucketInvalid:true}}
 ]){
  const x=f('video',cfg.deps||{});
  if(cfg.intent)x.input.approvalIntent=cfg.intent;
  await assert.rejects(prepareB7PublicRelease(x.input,x.dep),/B7_RELEASE_/);
  assert.equal(x.out.size,0);
 }
});
test('Private derivative tampering fails BEFORE first public write',async()=>{
 const x=f('video',{corrupt:true});
 await assert.rejects(prepareB7PublicRelease(x.input,x.dep),
 /PRIVATE_SANITIZED_DERIVATIVE_HASH_MISMATCH/);
 assert.equal(x.out.size,0);
});
test('Revoked Owner BEFORE release or changing draft stops all writes',async()=>{
 for(const change of [{revokeAt:2},{staleAt:2}]){
  const x=f('video',change);
  await assert.rejects(prepareB7PublicRelease(x.input,x.dep),/B7_RELEASE_/);
  assert.equal(x.out.size,0);
 }
});
test('Revocation AFTER copies, corrupt public bytes, forged/missing ledger => durable orphan',async()=>{
 for(const change of [{revokeAt:3},{badReadback:true},{noLedger:true},{forgedLedger:true},{staleAt:3}]){
  const x=f('video',change);
  await assert.rejects(prepareB7PublicRelease(x.input,x.dep),
   /PUBLIC_RELEASE_NOT_VERIFIED/);
  assert(x.out.size>=1);assert.equal(x.events.length,1);
  assert.equal(x.events[0].reason,'RELEASE_OR_OWNER_STATE_FAILED');
 }
});
test('Missing forensic sink is not a pass or a silent cleanup',async()=>{
 const x=f('video',{badReadback:true,failAudit:true});
 await assert.rejects(prepareB7PublicRelease(x.input,x.dep),
 /DURABLE_PUBLIC_ORPHAN_AUDIT_REQUIRED/);
 assert.equal(x.events.length,1);
});

test('CP02 BE05/06 release candidate: undefined, expired, cancelled or unknown campaign state never creates public assets',async()=>{
 for(const state of [undefined,null,'expired','cancelled','rejected','garbage','PUBLIC']){
  const x=f('video');
  const old=x.dep.loadCreative;
  x.dep.loadCreative=async()=>({...await old(),campaign_status:state});
  await assert.rejects(prepareB7PublicRelease(x.input,x.dep),/NOT_LATEST_PENDING_CREATIVE/);
  assert.equal(x.out.size,0,'Invalid campaign must not create public bytes: '+String(state));
  assert.equal(x.events.length,0);
 }
});
test('CP02 BE05/06 valid currently reviewable, paused and hidden states still have no automatic approval',async()=>{
 for(const state of ['requested','verified','approved','payment_pending','paid','scheduled','live','paused','hidden']){
  const x=f('image'),old=x.dep.loadCreative;
  x.dep.loadCreative=async()=>({...await old(),campaign_status:state});
  const result=await prepareB7PublicRelease(x.input,x.dep);
  assert.equal(result.publishable,false);assert.equal(result.approved,false);
  assert.equal(x.out.size,1,'Existing permitted Owner flow preserved for '+state);
 }
});

test('CP02 BE05/06 forged public release readback campaign, media type or bucket cannot be approved',async()=>{
 for(const wrong of [
  {campaign_id:'55555555-5555-4555-8555-555555555555'},
  {media_type:'image'},
  {clean_public_bucket:'public-editorial-assets'}
 ]){
  const x=f('video');
  const original=x.dep.readRelease;
  x.dep.readRelease=async()=>({...await original(),...wrong});
  await assert.rejects(prepareB7PublicRelease(x.input,x.dep),
   /PUBLIC_RELEASE_NOT_VERIFIED/);
  assert.equal(x.events.length,1,'Must append orphan forensic evidence');
  assert.equal(x.events[0].reason,'RELEASE_OR_OWNER_STATE_FAILED');
  assert.equal(x.out.size,2,'Public candidate bytes need explicit audit, not silent discard');
 }
});
