import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {stageB7PrivateVideo,B7_ORIGINAL_VIDEO_BUCKET,B7_VIDEO_BUCKET,B7_POSTER_BUCKET,b7VideoPrivateStore}
 from '../../CODEX_CURRENT_SUPABASE/functions/_shared/b7-video-private-stage.mjs';
const run=promisify(execFile);
const owner='11111111-1111-4111-8111-111111111111';
const campaign='33333333-3333-4333-8333-333333333333';
const creative='22222222-2222-4222-8222-222222222222';
const quota={maxSourceBytes:8*1024*1024,maxDerivedBytes:8*1024*1024,
 maxPosterBytes:2*1024*1024,maxDurationSeconds:6,maxDecodedPixels:1920*1080};
async function video(){
 const d=await mkdtemp(join(tmpdir(),'jb-private-media-v-'));
 const filename=join(d,'test.mp4');
 try{
  await run('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','lavfi',
   '-i','testsrc2=size=480x270:rate=8','-t','0.8',
   '-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p','-threads','1',
   filename],{timeout:30000});
  return new Uint8Array(await readFile(filename));
 }finally{await rm(d,{recursive:true,force:true})}
}
function fixture(cfg={}){
 const objects=new Map(),events=[],receipts=new Map(),created=[];
 let authTimes=0,readTimes=0;
 const b7Buckets=new Set([B7_ORIGINAL_VIDEO_BUCKET,B7_VIDEO_BUCKET,B7_POSTER_BUCKET]);
 const storage={
  async getBucket(bucket){
   return {data:{id:bucket,public:cfg.publicBucket===true,file_size_limit:8*1024*1024},error:null};
  },
  from(bucket){return {
   async upload(path,blob,opts){
    assert.equal(opts.upsert,false);
    created.push(bucket+path);
    const key=bucket+path;
    if(objects.has(key))return {error:{message:'duplicate'}};
    objects.set(key,new Uint8Array(await blob.arrayBuffer()));return {error:null};
   },
   async download(path){
    const payload=objects.get(bucket+path);
    return {data:payload?new Blob([payload]):null,error:payload?null:'missing'};
   }
  }}
 };
 const dep={
  allocateId:()=> '44444444-4444-4444-8444-444444444444',
  authorize:async()=>{
   authTimes++;return cfg.revokeAfterUpload&&authTimes>1?null:owner;
  },
  getDraft:async()=>{
   readTimes++;
   return {id:creative,campaign_id:campaign,creative_type:'video',
    approved:false,version:2,latest_version:cfg.staleOnRead&&readTimes>1?3:2,
    campaign_status:'requested'};
  },
  store:b7VideoPrivateStore({storage}),
  async recordReceipt(row){
   if(cfg.failReceipt)return false;
   receipts.set(row.asset_id,{...row,approval_state:'private_quarantined'});
   return true;
  },
  async readReceipt(id){
   if(cfg.forgeReceipt)return {asset_id:'forged'};
   return receipts.get(id);
  },
  appendOrphan:async event=>{events.push(event);return !cfg.noAudit}
 };
 return {dep,objects,events,receipts,created,b7Buckets,storage};
}
const req=source=>({token:'owner-session-fake',creativeId:creative,
 source,name:'ad.mp4',mime:'video/mp4',policy:quota});
test('E2 actual ffmpeg output 3 PRIVATE original/video/poster, strong hash readback, immutable draft NOT approved',async()=>{
 const f=fixture();const result=await stageB7PrivateVideo(req(await video()),f.dep);
 assert.equal(result.status,'PRIVATE_VIDEO_POSTER_EVIDENCE_NOT_APPROVED');
 assert.equal(result.approved,false);assert.equal(result.publishable,false);
 assert.equal(f.objects.size,3);assert.equal(f.receipts.size,1);
 const evidence=[...f.receipts.values()][0];
 assert.equal(evidence.creative_id,creative);assert.equal(evidence.owner_user_id,owner);
 assert.equal(evidence.original_bucket,B7_ORIGINAL_VIDEO_BUCKET);
 assert.equal(evidence.video_bucket,B7_VIDEO_BUCKET);
 assert.equal(evidence.poster_bucket,B7_POSTER_BUCKET);
 assert.equal(evidence.video_sha256.length,64);
 assert.equal(evidence.poster_sha256.length,64);
 assert(evidence.duration_seconds>0);
 assert(!JSON.stringify(result).includes('publicUrl'));
 assert.equal(f.events.length,0);
});
test('Owner session revoked after transcoding/upload keeps 3 private objects but no verified receipt',async()=>{
 const f=fixture({revokeAfterUpload:true});
 await assert.rejects(stageB7PrivateVideo(req(await video()),f.dep),/PRIVATE_EVIDENCE_UNVERIFIED/);
 assert.equal(f.objects.size,3);assert.equal(f.receipts.size,0);
 assert.equal(f.events.length,1);assert.equal(f.events[0].reason,'RECEIPT_OR_OWNER_STATE_FAILED');
});
test('Latest Creative version changed / DB record missing => durable orphan and deny',async()=>{
 for(const cfg of [{staleOnRead:true},{failReceipt:true},{forgeReceipt:true}]){
  const f=fixture(cfg);
  await assert.rejects(stageB7PrivateVideo(req(await video()),f.dep),/PRIVATE_EVIDENCE_UNVERIFIED/);
  assert.equal(f.events.length,1);
 }
});
test('Missing audit, PUBLIC storage or unsigned Owner never passes',async()=>{
 const bad=fixture({failReceipt:true,noAudit:true});
 await assert.rejects(stageB7PrivateVideo(req(await video()),bad.dep),/DURABLE_ORPHAN_AUDIT_REQUIRED/);
 const pub=fixture({publicBucket:true});
 await assert.rejects(stageB7PrivateVideo(req(await video()),pub.dep),/PRIVATE_BUCKET_UNAVAILABLE/);
 assert.equal(pub.created.length,0);
 const anon=fixture();anon.dep.authorize=async()=>null;
 await assert.rejects(stageB7PrivateVideo(req(await video()),anon.dep),/OWNER_AAL2_REQUIRED/);
 assert.equal(anon.created.length,0);
});
test('Private video adapter refuses existing Public/editorial/Grievance storage paths and media cross-type',async()=>{
 const f=fixture();
 await assert.rejects(f.dep.store.createOnly('public-media','test.mp4',new Uint8Array(64),'video/mp4'),/BUCKET_NOT_ALLOWED/);
 await assert.rejects(f.dep.store.createOnly(B7_VIDEO_BUCKET,'../attack.mp4',new Uint8Array(64),'video/mp4'),/PATH_NOT_CANONICAL/);
 await assert.rejects(f.dep.store.createOnly(B7_POSTER_BUCKET,
 'staged/44444444-4444-4444-8444-444444444444/'+'f'.repeat(64)+'.mp4',
 new Uint8Array(64),'video/mp4'),/PATH_MEDIA_MISMATCH/);
});
