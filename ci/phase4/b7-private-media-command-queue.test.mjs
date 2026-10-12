import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {enqueueB7MediaCommand,processB7MediaCommand} from '../../CODEX_CURRENT_SUPABASE/functions/_shared/b7-private-media-command-queue.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const owner='11111111-1111-4111-8111-111111111111',
 session='55555555-5555-4555-8555-555555555555',
 creative='22222222-2222-4222-8222-222222222222',
 campaign='33333333-3333-4333-8333-333333333333',
 asset='44444444-4444-4444-8444-444444444444',
 jobId='66666666-6666-4666-8666-666666666666',
 lease='77777777-7777-4777-8777-777777777777';
const source=new Uint8Array(96).fill(17);
const sha=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),
 n=>n.toString(16).padStart(2,'0')).join('');
const validCreative=()=>({id:creative,campaign_id:campaign,creative_type:'image',
 approved:false,version:4,latest_version:4,campaign_status:'requested'});
async function fixture(options={}){
 const hash=await sha(source),saved=[],orphan=[];
 const command={token:'OWNER_TOKEN_NOT_STORED_'.repeat(4),
  creativeId:creative,assetId:asset,idempotencyKey:lease,
  kind:'image',bucket:'jb-ad-originals-private',
  path:'staged/'+asset+'/'+hash+'.png',sha256:hash,bytes:source.length,mime:'image/png'};
 const store={
  checkPrivate:async()=>options.publicBucket!==true,
  readPrivate:async()=>options.corruptSource?new Uint8Array(source.length):new Uint8Array(source)
 };
 const deps={
  authenticate:async()=>options.revoked?null:{ownerId:owner,sessionId:session,active:true,aal:'aal2'},
  getDraft:async()=>options.stale?{...validCreative(),latest_version:5}:validCreative(),
  store,
  insertOnce:async r=>{saved.push({id:jobId,status:'pending',...r});return jobId},
  readJob:async()=>options.forgedReadback?
   {...saved[0],source_sha256:'f'.repeat(64)}:saved[0]
 };
 return {command,deps,saved,orphan};
}
test('Private verified queued command is durable, has no JWT, file bytes, URL or authority to publish',async()=>{
 const f=await fixture(),r=await enqueueB7MediaCommand(f.command,f.deps);
 assert.equal(r.status,'PRIVATE_MEDIA_COMMAND_QUEUED');
 assert.equal(r.approved,false);assert.equal(r.publishable,false);
 assert.equal(r.jobId,jobId);assert.equal(f.saved.length,1);
 assert.equal(f.saved[0].owner_session_id,session);
 assert.equal(f.saved[0].creative_version,4);
 assert.equal(JSON.stringify(f.saved).includes(f.command.token),false);
 assert.equal(JSON.stringify(f.saved).includes('public_url'),false);
 assert.equal(JSON.stringify(f.saved).includes('bytes":['),false);
});
test('Queue enqueue denies spoofed geo, wrong bucket/mime, invalid source, forged receipt',async()=>{
 for(const changes of [
  {bucket:'public-media'}, {kind:'video'},
  {path:'staged/'+asset+'/wrong.png'}, {bytes:97},
  {sha256:'f'.repeat(64)}, {idempotencyKey:'invalid'}
 ]){
  const f=await fixture();
  await assert.rejects(enqueueB7MediaCommand({...f.command,...changes},f.deps),/B7_QUEUE_/);
  assert.equal(f.saved.length,0);
 }
 for(const bad of [{publicBucket:true},{stale:true},{revoked:true},{corruptSource:true}]){
  const f=await fixture(bad);
  await assert.rejects(enqueueB7MediaCommand(f.command,f.deps),/B7_QUEUE_/);
  assert.equal(f.saved.length,0);
 }
 const f=await fixture({forgedReadback:true});
 await assert.rejects(enqueueB7MediaCommand(f.command,f.deps),/DURABLE_COMMAND_READBACK_FAILED/);
});
test('Queue session authority checked again AFTER readback, never store bearer',async()=>{
 const f=await fixture();
 let n=0;f.deps.authenticate=async()=>++n===1?
  {ownerId:owner,sessionId:session,active:true,aal:'aal2'}:null;
 await assert.rejects(enqueueB7MediaCommand(f.command,f.deps),/OWNER_SESSION_REVOKED/);
 assert.equal(f.saved.length,0);
});
test('Worker empty queue does not process or invent completion',async()=>{
 const worker=await workerFixture();
 worker.claimNext=async()=>null;
 assert.equal(await processB7MediaCommand(worker),null);
 assert.equal(worker.events.completed.length,0);
});
async function workerFixture(opts={}){
 const f=await fixture();
 const row={id:jobId,lease_id:lease,status:'leased',
  creative_id:creative,creative_version:4,campaign_id:campaign,
  owner_user_id:owner,owner_session_id:session,
  source_asset_id:asset,source_bucket:f.command.bucket,
  source_path:f.command.path,source_sha256:f.command.sha256,
  source_bytes:source.length,source_mime:'image/png',
  kind:'image',idempotency_key:lease};
 const events={completed:[],reconciled:[],processed:[]};let authCalls=0;
 return {
  events,
  claimNext:async()=>opts.forgedLease?{...row,lease_id:'missing'}:row,
  reauthorize:async()=>{authCalls++;return opts.revokeOn===authCalls?false:true},
  getDraft:async()=>opts.stale?{...validCreative(),version:5,latest_version:5}:validCreative(),
  store:f.deps.store,
  processMedia:async ({job,bytes,assertAuthority})=>{
   events.processed.push(job.id);assert.equal(bytes.byteLength,source.length);
   await assertAuthority();
   if(opts.failMedia)throw Error('DECODER_FAILED');
   return {...(opts.forgedReceipt?{assetId:'fake'}:{assetId:asset}),
    creativeId:creative,creativeVersion:4,receiptVerified:true,
    approved:false,publishable:false};
  },
  complete:async (...args)=>{events.completed.push(args);return !opts.failCompletion},
  recordFailure:async()=>true,
  reconcile:async (...args)=>{events.reconciled.push(args);return !opts.failReconcile}
 };
}
test('One durable leased command -> private verified receipt ONLY, no live permission',async()=>{
 const w=await workerFixture(),r=await processB7MediaCommand(w);
 assert.equal(r.state,'PRIVATE_EVIDENCE_READY');assert.equal(r.approved,false);
 assert.equal(r.publishable,false);assert.equal(w.events.processed.length,1);
 assert.deepEqual(w.events.completed,[[jobId,lease,asset]]);
 assert.equal(w.events.reconciled.length,0);
});
test('Revocation before or during transcode and stale Creative reject without completing',async()=>{
 for(const opts of [{revokeOn:1},{revokeOn:2},{revokeOn:3},{stale:true}]){
  const w=await workerFixture(opts);
  await assert.rejects(processB7MediaCommand(w),/B7_QUEUE_PROCESS_UNVERIFIED/);
  assert.equal(w.events.completed.length,0);
  assert.equal(w.events.reconciled.length,1);
 }
});
test('Invalid lease, forged receipt, processing failure and completion lost cannot claim success',async()=>{
 const forged=await workerFixture({forgedLease:true});
 await assert.rejects(processB7MediaCommand(forged),/UNVERIFIED_DURABLE_LEASE/);
 assert.equal(forged.events.processed.length,0);
 for(const x of [{forgedReceipt:true},{failMedia:true},{failCompletion:true}]){
  const w=await workerFixture(x);
  await assert.rejects(processB7MediaCommand(w),/B7_QUEUE_PROCESS_UNVERIFIED/);
  assert.equal(w.events.reconciled.length,1);
 }
 const w=await workerFixture({failMedia:true,failReconcile:true});
 await assert.rejects(processB7MediaCommand(w),/RECONCILIATION_NOT_DURABLE/);
});
